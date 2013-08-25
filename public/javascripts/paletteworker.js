(function(){

	//Worker Messaging System
	var send = function(type,data) {self.postMessage({type:type,data:data});}
	self.onmessage = function(event) {
		send("result",getPalette(event.data.imagedata));
	};

	//The hash array for colors
	var hashsimilar = [];
	
	//Gets a representative palette from imagedata
	function getPalette(imagedata) {
		var hashpal = new Array();
		var pal = new Array();
		var img = imagedata.data;
		var size = imagedata.height*imagedata.width*4;
		var palette = [];
		var tolerance = 0.1 * ( 255 * 255 * 2 );
		var tolerance = 0.05 * ( 255 * 255 * 2 );
		
		send("message","Starting calculation for " +size/4+ " pixels");		
		for (var i=0, l=size; i<l; i+=4) {
			var r = img[i], g = img[i+1], b = img[i+2];
			if (r===5 && g===0 && b===5)  g = 1; //<---This adjustment is necessary for the reduceshapes algorithm that uses a hardcoded "505" for the visibility test
			var h = r.toHex() + g.toHex() + b.toHex();
			if (h) {
				if (hashpal[h]) {
					hashpal[h].percent=(++hashpal[h].count)/(size/4);
				} else { 
					pal.push(h);
					hashpal[h] = {color:h, count:1, percent:1/(size/4), r:r, g:g, b:b };
					if (!palette.length) palette.push(hashpal[h]);
				}
			}
		}
		
		for(var i=1, k=1, l=pal.length; i<l; i++) {
			var similar = null;
			for(var j=0; j<k; j++) {
				if (palette[j].color!=hashpal[pal[i]].color) {
					if (isSimilar(palette[j], hashpal[pal[i]], tolerance)) {
						similar = palette[j];
						j=k;
					}
				}
			}
			if (!similar) {
				palette.push(hashpal[pal[i]]);
				k++;
			}
		}
		palette.sort(function(p1,p2) { return (p1.percent<p2.percent)?-1:1; });
		return palette;
	}
	
	//Gauges tolerance similarity between two colors
	function isSimilar(p1,p2,tolerance) {
		if (hashsimilar[p1.color+p2.color]) return true;
		var difference = (
			Math.pow(p1.r - p2.r, 2) +
			Math.pow(p1.g - p2.g, 2) +
			Math.pow(p1.b - p2.b, 2)
		);
		var similar = difference<tolerance;
		if (similar) hashsimilar[p1.color+p2.color] = difference;
		return similar;
		
	}
	
	//Converts a base10 number (0 to 255) to a 2 digit hexadecimal string
	Number.prototype.toHex = function() {
		var s = this.toString(16);
		return ((s.length==1)?'0'+s:s);
	}
	
})();