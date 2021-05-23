var data = require("sdk/self").data;
var self = require("sdk/self");
var tabs = require("sdk/tabs");

var StorePrefs = new function() {
	var ss = require("sdk/simple-storage");
	
	//default dictionaries
	var defDicts = {
		"ahd_legacy" : true,
		"wiktionary" : true,
		"gcide" : false,
		"century" : false,
		"wordnet" : false
	};
	
	//default colors
	var defBGColors = {
		"color1" : "#ffe9bf",
		"color2" : "#bfd5ff"
	};

	//check if user preffered value is present
	//else "return" defaults
	var getPref = function (id) {
		switch(id) {
			case "color1":
				if("color1" in ss.storage)
					return ss.storage.color1;
				else
					return defBGColors.color1;
				break;
			case "color2":
				if("color2" in ss.storage)
					return ss.storage.color2;
				else
					return defBGColors.color2;
				break;
			case "ahd_legacy":
				if("ahd_legacy" in ss.storage)
					return ss.storage.ahd_legacy;
				else
					return defDicts.ahd_legacy;
				break;
			case "wiktionary":
				if("wiktionary" in ss.storage)
					return ss.storage.wiktionary;
				else
					return defDicts.wiktionary;
				break;
			case "gcide":
				if("gcide" in ss.storage)
					return ss.storage.gcide;
				else
					return defDicts.gcide;
				break;
			case "century":
				if("century" in ss.storage)
					return ss.storage.century;
				else
					return defDicts.century;
				break;
			case "wordnet":
				if("wordnet" in ss.storage)
					return ss.storage.wordnet;
				else
					return defDicts.wordnet;
				break;
			default:
				console.log("getting preferences: ", "given bad pref ID");
				return null;
		}
	};

	var storePref = function (id, value) {
		switch(id) {
			case "color1":
				var isHexValue  = /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(value);
				if(isHexValue)
					ss.storage.color1 = value;
				break;
			case "color2":
				var isHexValue  = /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(value);
				if(isHexValue)
					ss.storage.color2 = value;
				break;
			case "ahd_legacy":
				if(value === true || value === false)
					ss.storage.ahd_legacy = value;
				break;
			case "wiktionary":
				if(value === true || value === false)
					ss.storage.wiktionary = value;
				break;
			case "gcide":
				if(value === true || value === false)
					ss.storage.gcide = value;
				break;
			case "century":
				if(value === true || value === false)
					ss.storage.century = value;
				break;
			case "wordnet":
				if(value === true || value === false)
					ss.storage.wordnet = value;
				break;
			default:
				console.log("storing preferences: ", "given bad values");
		}	
	};
	
	this.getDictPrefs = function() {
		var dicts = ["ahd_legacy", "wiktionary", "gcide", "century", "wordnet"];
		var selectedDicts = [];
		
		for(var i in dicts) {
			if(getPref(dicts[i]))
				selectedDicts.push(dicts[i]);
		}
		console.log("getDictPrefs", selectedDicts);
		return selectedDicts;
	}

	this.getBGColorPrefs = function() {
		var bgcolors = ["color1", "color2"];
		var selectedBGColors = [];
		
		for(var i in bgcolors) {
			selectedBGColors.push(getPref(bgcolors[i]));
		}
		console.log("getBGColorPrefs", selectedBGColors);
		return selectedBGColors;
	}
	
	this.setPref = function (pref) {
		for(var i in pref) {
			var id = pref[i]['id'];
			var value = pref[i]['value'];
			
			storePref(id, value);
		}
	};
}


var sp = require("sdk/simple-prefs");
sp.on("options", function() {
	console.log("hello");
	tabs.open("prefs.html");
	
	var pageMod = require("sdk/page-mod");

	pageMod.PageMod({
	  include: "resource://*", //https://developer.mozilla.org/en-US/Add-ons/SDK/Low-Level_APIs/util_match-pattern#Wildcards
	  contentScriptFile: data.url("prefs.js"),
	  onAttach: function(worker) {
		//send stored settings to prefs page
		worker.port.emit("savedDicts", StorePrefs.getDictPrefs());
		worker.port.emit("savedBGColors", StorePrefs.getBGColorPrefs());
		
		//get dictionaires and if they are enabled or disabled
		worker.port.on("dictSelection", function(dictChkBox) {
			StorePrefs.setPref(dictChkBox);
		});
		
		//get BG color selection
		worker.port.on("colorSelection", function(selectedBGColors) {
			StorePrefs.setPref(selectedBGColors);
		});
		}
	});
});
var initPanel= function(panelPosJSON){

	var get_definitions = require("sdk/panel").Panel({
	  position:{
		  right: panelPosJSON.right,
		  left: panelPosJSON.left,
		  top: panelPosJSON.top,
		  bottom: panelPosJSON.bottom,
	  },
	  contentURL: data.url("pop-up.html"),
	  contentScriptFile: data.url("get-definitions.js")
	});

	return get_definitions;
}

//attacht the helper script
function attachHelper(tab){
	return tab.attach({
		  contentScriptFile: self.data.url("helper.js")
		});
}

tabs.on('ready', function(tab) {
  console.log('tab is activated', tab.title, tab.url);
  
  var helper = attachHelper(tab);

  helper.port.on("position", function(panelPos) {
	  console.log("position : ");
	  
	var panelPosJSON = JSON.parse(panelPos);
	
	get_definitions = initPanel(panelPosJSON);

	  helper.port.on("reqWord", function(reqWord) {
			console.log("index.js : " + reqWord);		
			get_definitions.port.on("ready", function(){
				console.log("index.js", "ready");
				
				var payload = {
					"reqWord" : reqWord,
					"selDicts": StorePrefs.getDictPrefs(),
					"selBGColors": StorePrefs.getBGColorPrefs()
				};

				get_definitions.port.emit("payload", payload);
			});
			console.log("after show");
			get_definitions.show();

		});
	console.log(panelPosJSON);  
	});
});
