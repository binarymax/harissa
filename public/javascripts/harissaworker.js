(function(){

	var _size;
	var _width;
	var _height;
	var _pixels;
	var _original;

	//Worker Messaging System
	var send = function(type,data) {self.postMessage({type:type,data:data});}
	self.onmessage = function(event) {
		var data = event.data;
		switch (data.type) {
			case "init":
				init(data);
				break;
			case "diff":
				var diff = getImageDifference3d(_original.data,data.imagedata.data);
				send("result",diff);
				break;
			case "diff4d":
				var diff = getImageDifference4d(_original.data,data.imagedata.data);
				send("result",diff);
				break;
			case "test":
				var diff = getImageDifference4d(_original.data,data.imagedata.data);
				send("test",diff);
				break;
		}	
	};

	//Gets the difference between two images
	var getImageDifference3d = function(left,right) {
		var difference = 0;
		for(var r=0,g=1,b=2;r<_size;r+=4,g+=4,b+=4) difference += getPixelDifference3d(left[r],left[g],left[b],right[r],right[g],right[b]);
		return difference;	
	};

	//Gets the difference between two images
	var getImageDifference4d = function(left,right) {
		var difference = 0;
		for(var r=0,g=1,b=2,a=3;r<_size;r+=4,g+=4,b+=4,a+=4) difference += getPixelDifference4d(left[r],left[g],left[b],left[a],right[r],right[g],right[b],right[a]);
		return difference/_pixels;	
	};

	//Gets the difference between two colors
	var sq = function(x){return x*x;};
	var rt = function(x){return Math.pow(x,0.5);};
	//var getPixelDifference3d = function(r1,g1,b1,r2,g2,b2) { return (sq(r1-r2) + sq(g1-g2) + sq(b1-b2)); };
	var getPixelDifference3d = function(r1,g1,b1,r2,g2,b2) { return (sq(r1-r2) + sq(g1-g2) + sq(b1-b2)); };
	var getPixelDifference4d = function(r1,g1,b1,a1,r2,g2,b2,a2) { return (sq(r1-r2) + sq(g1-g2) + sq(b1-b2) + sq(a1-a2)); };

	var init = function(data) {
		_width = data.imagedata.width;
		_height = data.imagedata.height;
		_pixels = _width*_height;
		_size = _pixels*4;
		_original = data.imagedata;
		send("ready",{data:_size});
	};

	
})();