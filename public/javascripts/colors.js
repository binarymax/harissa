var colors = (function(){

	var _flexibility = 0.1;
	var _src = "";

	//------------------------------------------------------------------
	//Palette Extractor Worker
	var getColors = function(data,callback){
		var paletteworker = new Worker('/javascripts/paletteworker.js?random='+parseInt(Math.random()*100000).toString());
		paletteworker.onmessage = workerEvent("palette",callback);
		paletteworker.postMessage({'imagedata':data,flexibility:_flexibility});
	};

	//------------------------------------------------------------------
	//Image to Colors
	var getImageColors = function(src,callback){

			var image = new Image();
			var canvas = $("<canvas></canvas")[0];
			image.onload = function() {
				initDimensions(image.width,image.height);
				var c = initContext(initCanvas(canvas));
				c.drawImage(image, 0, 0);
				var data = c.getImageData(0, 0, image.width,image.height);
				getColors(data,function(colors){
					setColors(colors);
					callback(colors);
				});
			}
			image.src = _src = src;

	};

	//------------------------------------------------------------------
	//Image to Colors
	var flex = function(val){
		_flexibility = val;
	};

	return {
		getColors:getColors,
		getImageColors:getImageColors,
		flex:flex
	}

})();