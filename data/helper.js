//https://developer.mozilla.org/en-US/Add-ons/SDK/Tutorials/Modifying_the_Page_Hosted_by_a_Tab

console.log("helper.js loaded");

document.addEventListener('dblclick', function(){
		var selObj = window.getSelection();
		oRange = selObj.getRangeAt(0); //get the text range
		oRect = oRange.getBoundingClientRect();
		
		var panelPos = setPanelPos(oRect);
		
		console.log("helper : " + panelPos);

		var selectedText = selObj.toString();
		var reqDef = selectedText;

		console.log(selectedText);
		
		self.port.emit("position", panelPos);
		
		self.port.emit("reqWord", reqDef);
}, false);

var whichHalf = function(panelPosHeight) {
	if(panelPosHeight < height()/2)
		return false;
	else
		return true;
}
var whichSide = function(panelPosWidth) {
	if(panelPosWidth < width()/2)
		return false;
	else
		return true;
}

function height(){
   return window.innerHeight||document.documentElement.clientHeight||document.body.clientHeight||0;
}
function width(){
   return window.innerWidth||document.documentElement.clientWidth||document.body.clientWidth||0;
}


var setPanelPos = function(oRect) {
	var right,left,top,bottom;
	
	if(!whichHalf(oRect.top)) {
		if(!whichSide(oRect.right)) {
			right = null;
			left = oRect.right;
			top = oRect.top;
			bottom = null;
			
		}
		else {
			right = width() - oRect.left;
			left = null;
			top = oRect.top;
			bottom = null;	
		}
	}
	else {
		if(!whichSide(oRect.right)) {
			right = null;
			left = oRect.right;
			top = null;
			bottom = height() - oRect.top;
			
		}
		else {
			right = width() - oRect.left;
			left = null;
			top = null;
			bottom = height() - oRect.top;
		}	
	}
	
	return '{"right":' + right + ', "left":'+ left +' , "top":' + top + ', "bottom":' + bottom + '}';
}
