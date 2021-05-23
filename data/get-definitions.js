var defNO = 0;

//dictionaries to get definitions from
//ahd (ahd_legacy), wiktionary, century, webster, wordnet
//get stored settings
function getPrefDicts(prefDicts) {
	var sourceDictionaries = "";
	for(var i in prefDicts){
		var dict = prefDicts[i];
		//~ var url_seperator = "%2C";
		var url_seperator = ",";
		
		//API accepts "ahd" for "The American Heritage(R) Dictionary"
		//not what is used in this source code, "ahd_legacy"
		if(dict == "ahd_legacy")
			dict = "ahd";
		
		//make sure "%2C" or "," starts AFTER the first dictionary
		if(i == 0)
			seperator = "";
		else
			seperator = url_seperator;

		sourceDictionaries += seperator + dict;
	}
	console.log("getPrefDicts", sourceDictionaries);
	return sourceDictionaries;
}

var selDicts = [];
var selBGColors = [];

self.port.emit("ready", null);

self.port.on("payload", function(payload) {
	var reqWord = payload["reqWord"];
	selDicts = payload["selDicts"];
	selBGColors = payload["selBGColors"];
	console.log("payload", payload, selDicts, selBGColors);
	getDef(reqWord, selDicts, selBGColors);
});

var getDef = function(reqWord, reqDictionaries, bgColors) {
	var CORSRequest = {
			
		// Create the XHR object.
			createCORSRequest : function (method, url) {
			  var xhr = new XMLHttpRequest();
			  if ("withCredentials" in xhr) {
				// XHR for Chrome/Firefox/Opera/Safari.
				xhr.open(method, url, true);
			  } else if (typeof XDomainRequest != "undefined") {
				// XDomainRequest for IE.
				xhr = new XDomainRequest();
				xhr.open(method, url);
			  } else {
				// CORS not supported.
				xhr = null;
			  }
			  return xhr;
		  },

		// Make the actual CORS request.
			makeCorsRequest : function (url) {
				var xhr = this.createCORSRequest('GET', url);
				return xhr;
			}
	}

	//WORDNIK IDs
	//~ var API_KEY = 'a2a73e7b926c924fad7001ca3111acd55af2ffabf50eb4ae5';
	var API_KEY = '5f541e3b546c746519219bef00c07064704ea4a77a36cc0c4';

	//dictionaries

	var dicts = {
		ahd_legacy	: "The American Heritage(R) Dictionary of the English Language, 4e",
		wiktionary	: "Wiktionary",
		gcide		: "GNU Collaborative International Dictionary of English",
		century		: "The Century Dictionary and Cyclopedia",
		wordnet		: "WordNet 3.0 (C) 2006 by Princeton University"
	};

	var selectedDicts = ["ahd_legacy", "wiktionary", "gcide", "century", "wordnet"];
	
	//request dictionaries
	//~ var sourceDictionaries = reqDictionaries; //problem with the API; cannot select specific dictionaries
	var sourceDictionaries = 'all';

	//create a request
	var url = 'http://api.wordnik.com:80/v4/word.json/' + reqWord + '/definitions?limit=1000&includeRelated=true&sourceDictionaries=' + sourceDictionaries + '&useCanonical=false&includeTags=false&api_key=' + API_KEY;
	var encodedURI = encodeURI(url);

	//send the request and get reponse object
	xhr = CORSRequest.makeCorsRequest(encodedURI);

	var RJ = new Object(); //the word definition in JSON format
	if (!xhr) {
		console.log('CORS not supported');
	}

	xhr.onprogress = function() {
		console.log('Getting definiton for : ' + reqWord);
	}

	// Response handlers.
	xhr.onload = function() {
		var resText = xhr.responseText;
		console.log("response len :", resText.length);
		var resJSON = JSON.parse(resText);
		
		//~ console.log(JSON.stringify(resJSON, null, 4));
		
		//check if null response 
		if(resText == "[]" || resText.length <= 2) {
			//wordnik API is case-sensitive for "word definitions". No option to turn it off.
			if(reqWord == reqWord.toLowerCase()) {
				console.log("no def found");
			}
			else {
				//since null response, resend in lower case
				getDef(reqWord.toLowerCase(), reqDictionaries, bgColors);
				return "Defnition already displayed. Exiting."
			}
		}
		else {
			
			var ahd_legacy={};
			var wiktionary={};
			var gcide={};
			var century={};
			var wordnet={};
			
			for(index in resJSON) {
				
				res = resJSON[index];
				
				var skipEntry = true;
				
				//get dictionary name
				var dictNAME = res["sourceDictionary"];				
				
				if(dictNAME == "ahd-legacy")
					dictNAME = "ahd_legacy";

				//skip entries from dictionaries
				//that are not selected / stored in preferences
				for(i in reqDictionaries){
					if(dictNAME == reqDictionaries[i])
						skipEntry = false;
				}
				if(skipEntry)
					continue;
				
				
				//get parts of speech
				var partOfSpeech ="";
				
				if(res["partOfSpeech"] === undefined)
					//some dictionaries do not include part of speech in the definition
					//leave it blank
					partOfSpeech = "";
				else
					partOfSpeech = res["partOfSpeech"];
				
				//get labels if any
				var labels = [];
				if(res["labels"].length >1){
					for(k in res["labels"]){
						labels.push(res["labels"][k]["text"]);
					}
				}
				
				//get the definition text
				if(res["text"] === undefined){
					//no point in adding this particular definition is somehow there is no definition text given.
					includeEntry = false;
					continue;
				}
				
				var text = res["text"];
				
				//remove tags in definition text
				
				//"century" dictionary includes "strong" tags.
				//remove them.
				text = text.replace("<strong>","");
				text = text.replace("</strong>","");
				
				//"gcide" dictionary includes "ant" tags.
				//remove them.
				text = text.replace("<ant>","");
				text = text.replace("</ant>","");
				
				//"ahd_legacy" dictionary includes "labels" in the text section.
				//move them to the labels array
				ahd_legacy_labels_limiter = "   " //3 spaces, who would have thought?

				if(text.search(ahd_legacy_labels_limiter) != -1) {
					var text_tmp = text.split(ahd_legacy_labels_limiter);
					
					text = text_tmp.slice(-1);
					text_tmp = text_tmp.slice(0, -1);
					
					//moving to the labels array
					for(i in text_tmp)
						labels.push(text_tmp[i]);
				}
				
				//create definiton object
				var def_J = new Object();
				
				def_J.PartOfSpeech = partOfSpeech;
				
				def_J.labels = labels;
				
				def_J.Text = text;
				
				switch(dictNAME) {
					case "ahd_legacy" 	:
											ahd_legacy[Object.keys(ahd_legacy).length] = def_J;
											break;
					case "wiktionary" 	:
											wiktionary[Object.keys(wiktionary).length] = def_J;
											break;
					case "gcide"		:
											gcide[Object.keys(gcide).length] = def_J;
											break;
					case "century" 		:
											century[Object.keys(century).length] = def_J;
											break;
					case "wordnet"		:
											wordnet[Object.keys(wordnet).length] = def_J;
											break;
					default				:
											continue;
				}
			}
		
			RJ.ahd_legacy=ahd_legacy;
			RJ.wiktionary=wiktionary;
			RJ.gcide=gcide;
			RJ.century=century;
			RJ.wordnet=wordnet;
		}
		//def Number
		
		defNO = defNO + 1;
		
		//navigation
		
		var nav = document.getElementById("navigation");
		
		var seperator = document.createElement("sep").appendChild(document.createTextNode(" > "));
		var word = document.createElement("word");
		word.appendChild(document.createTextNode(reqWord.toLowerCase()));
		word.setAttribute("defNO", defNO);
		word.setAttribute("onclick", "selectWordDef(this)");
		
		words = nav.getElementsByTagName("word");
		//~ console.log("words length", words.length);

		if(words.length == 0)
		{
			nav.appendChild(word);
		}
		else
		{
			nav.appendChild(seperator);
			nav.appendChild(word);
		}
		
		
		//print RJ unto the panel which is nothing but "pop-up.html"
		var body = document.getElementById("body");
		
		sections = body.getElementsByTagName("section");
		
		for(i = 0; i < sections.length ; i++) {
			console.log("sections", i, sections[i]);
			sections[i].setAttribute("class", "invisible");
		}
		
		var section = document.createElement("section");
		section.setAttribute("defNO", defNO);
		section.setAttribute("class", "visible");

		
		for(dict in RJ)	{			
			dict_len = Object.keys(RJ[dict]).length;
			if(dict_len > 0)	{	//only if dictionary contains any entries
				var article = document.createElement("article");
				var header = document.createElement("header");
				var dictName = document.createElement("dictName");
				var dictName_text = document.createTextNode(dicts[dict]);
				dictName.appendChild(dictName_text);
				header.appendChild(dictName);
				article.appendChild(header);
				
				article.setAttribute("id", dictName);
				
				for(entry in RJ[dict])	{
					var p = document.createElement("p");
					
					//"entry" is a number, an index
					//and there are 2 (0,1) items to select from bgColors
					//so [0,1] remainders from "entry%2"
					var color = bgColors[entry%2]; 
					
					var styleValue = "background-color:" + color + ";";
					p.setAttribute("style", styleValue);
					
					for(item in RJ[dict][entry])	{						
						content = RJ[dict][entry][item];
						
						var item_tag = document.createElement(item);
						
						switch(item)	{						
							case "labels":
									for(label in content)	{
										var label_tag = document.createElement("label");
										var label_text = document.createTextNode(content[label] + " ");
										label_tag.appendChild(label_text);
										item_tag.appendChild(label_tag);
									}
									break;
							case "PartOfSpeech":
									var item_text = document.createTextNode(content + " ");
									item_tag.appendChild(item_text);
									break;
							case "Text":
									var item_text = document.createTextNode(content);
									item_tag.appendChild(item_text);
									break;
							default:
									console.log("unknow content: " + item);
						}
						
						p.appendChild(item_tag);
						article.appendChild(p);
					}
				}
				section.appendChild(article);
			}
			body.appendChild(section);
				
		}

	};

	xhr.onerror = function() {
		console.log('Woops, there was an error making the CROS request.');
	};

	xhr.send();
};

//dbclick in the panel get the meaning of that word
document.getElementById('body').addEventListener('dblclick', function(){
	
	var selObj = window.getSelection();
	var selectedText = selObj.toString();
	var reqWord = selectedText;
	console.log("dbclick", selDicts, selBGColors);
	getDef(reqWord, selDicts, selBGColors);

}, false);
