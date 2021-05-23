console.log("prefs.js started");

//get stored settings
self.port.on("savedDicts", function(savedDicts){
		console.log(savedDicts);
		for(var i in savedDicts){
			var elmnt = document.getElementById(savedDicts[i]);
			elmnt.checked = true;
		}
	}
);
self.port.on("savedBGColors", function(savedBGColors){
			console.log(savedBGColors);
			for(var i in savedBGColors) {
				var elmnt = document.getElementById("bgSample_" + i);
				var color = savedBGColors[i];
				 
				styleValue = "background-color:" + color + ";";
				elmnt.setAttribute("style", styleValue);
			}
	}
);

var dictChkBoxesArray = Array.prototype.slice.call(document.getElementsByClassName("dictChkBoxes"));

for(var i in dictChkBoxesArray) {
	var dictChkBox = dictChkBoxesArray[i];
	
	//on click
	dictChkBox.addEventListener("click", dictChkBoxClicked ,false);
}

/*
direct click on check box and click on "p" tag
both yield a "click" event on the check box
so better get "target" of the click event
rather than where it started
*/
function dictChkBoxClicked(event) {
	var id = event.target.id;
	var value = event.target.checked;

	var dictChkBox = {
		0:{
			"id": id,
			"value": value
		}
	}
	
	//anounce when dictionaries are selected or diselected
	self.port.emit("dictSelection", dictChkBox);
}

var bgsArray = Array.prototype.slice.call(document.getElementsByClassName("bgSamples"));

for(var i in bgsArray) {
	var bg = bgsArray[i];
	
	//on click
	bg.addEventListener("click", function() {
		bgClicked(this);
		});
}

/* better listen for the click event on the article
 * because we need the bgcolor of both the "p" tags
 * it trivial where the click event originated*/

function bgClicked(elmnt) {	
	var color1 = elmnt.getElementsByTagName("p")[0].getAttribute("bgColor");
	var color2 = elmnt.getElementsByTagName("p")[1].getAttribute("bgColor");
	
	var selectedBGColors = {
		0:{
			"id" : "color1",
			"value" : color1
		},
		1:{
			"id" : "color2",
			"value" : color2
		}
	};
	
	self.port.emit("colorSelection", selectedBGColors);
	
}
