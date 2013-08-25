(function(){
			
		//Generations (number of shapes)
		const _generations = 32000;
			
		//Full Arc in radians
		const _360 = 2 * Math.PI;
	
		//Maximum dimensions for random shapes
		const _guessradius = 10;
	
		//Image sizes variables
		var _width;
		var _height;
		var _size;

		var _scale = 2.5;
		
		//The palette of the image
		var _colors = [];
		var _colorshex = [];
		var _colornum = 0;
		
		var _estimated = false;
			
		//------------------------------------------------------------------
		//Gets a querystring value:
		var querystring = function(key,url){
		  url = url || window.location.search;
		  key = key.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]"); 
		  var regex = new RegExp("[\\?&]"+key+"=([^&#]*)"); 
		  var results = regex.exec( url );
		  return (!results)?"":decodeURIComponent(results[1].replace(/\+/g, " "));
		};
		
		//------------------------------------------------------------------
		//Event builder:
		var workerEvent = function(source,result,ready) {
			return function(event) {
				var data = event.data;
				switch (data.type) {case "result":result(data.data);break;case "ready":ready(data.data);break;}
			};	
		};
	
		//------------------------------------------------------------------
		//Palette Extractor Worker
		var getColors = function(data,callback){
			var paletteworker = new Worker('/javascripts/paletteworker.js?random='+parseInt(Math.random()*100000).toString());
			paletteworker.onmessage = workerEvent("palette",callback);
			paletteworker.postMessage({'imagedata':data});
		};	
		
		//------------------------------------------------------------------
		//Initializes a canvas width and height
		var initCanvas = function(canvas,width,height) {
			if (typeof canvas === "string") canvas = document.getElementById(canvas);
			canvas.width  = parseInt(width||_width);
			canvas.height = parseInt(height||_height);
			canvas.style.width  = canvas.width + 'px';
			canvas.style.height = canvas.height + 'px';
			return canvas;
		};
		
		//------------------------------------------------------------------
		//Initializes the context of a canvas
		var initContext = function(canvas) {
			var context = canvas.getContext("2d");
			context.fillStyle="#ffffff";
			context.fillRect(0, 0, canvas.width, canvas.height);
			return context;
		};
			
		//------------------------------------------------------------------	
		//Random number helpers
		var rand1 = function(max){ return Math.floor(Math.random()*max); }
		var rand2 = function(min,max){ return Math.floor(Math.random() * (max - min + 1)) + min; }
	
		//------------------------------------------------------------------	
		//Puts a random circle on the image
		var putArc = function(context) {
	
			//var o = cartesian(rand1(360),rand1(_height/2),_width/2,_height/2);
			var o = getGridCoords();
			var r = rand2(1,_guessradius);
			var c = _colorshex[rand1(_colornum)];
	
			context.beginPath();
			context.fillStyle = c;
			context.arc(o.x, o.y, r, 0, _360, false);
			context.closePath();
			context.fill();
			var shape = {x:o.x,y:o.y,radius:r,color:c};
			return shape;
			
		};
	
		//------------------------------------------------------------------
		//Converts polar coordinates to cartesian
		var cartesian = function(d,l,x,y){
			//Get base cartesian around 0,0 axis
		 	var x1 = Math.floor(l * Math.cos(d * 2 * Math.PI / 360)) + (x||0);
		 	var y1 = Math.floor(l * Math.sin(d * 2 * Math.PI / 360)) + (y||0);
			return {x:x1,y:y1};
		};
	
		var getPolarCoords = function() {
			var l = rand1(_height/2); //length of vector
			var d = rand1(360);		  //angle of vector
			var o = cartesian(d,l,_width/2,_height/2);
			return o;
		}
	
		var getGridCoords = function() {
			var x = rand1(_width); 
			var y = rand1(_height);
			var o = {x:x,y:y};
			return o;		
		}

		//------------------------------------------------------------------
		//Saves the svg images
		var drawshapes = function(context,shapes,left,top,right,bottom){
			left=left||0; top=top||0; right=right||(_width*_scale);bottom=bottom||(_height*_scale);
	        for(var i=0,l=shapes.length;i<l;i++) {
	        	var shape = shapes[i];
	        	if(!shape.hidden) {
		        	var x = shape.x*_scale;
		        	var y = shape.y*_scale;
		        	if (x>=left && y>=top && x<=right && y<=bottom) {
			        	var r = shape.radius*_scale;
						context.beginPath();
						context.fillStyle = shape.color;
						context.arc(x, y, r, 0, _360, false);
						context.closePath();
						context.fill();
					}
				}     	
	       	};
		};

		
		//------------------------------------------------------------------
		//Saves the svg images
		var makebest = function(shapes){
	        var canvas = initCanvas("copy",_width*_scale,_height*_scale);
	        var context = initContext(canvas);
	        drawshapes(context,shapes);
		};
		
		//------------------------------------------------------------------
		//Genetic Algorithm
		var generate = function(imagedata,callback) {
	
			var generation = 0;

			var shape;
			var worker;
			var testcanvas  = initCanvas("t");
			var testcontext = initContext(testcanvas);
						
			var bestcanvas  = initCanvas("b");
			var bestcontext = initContext(bestcanvas);
			var bestshapes = [];
			var bestdifference = 0;
					
			//- - - - - - - - - - - - - - - - - - - -
			//Loads the difference from the thread, and checks if all threads from this generation are finished 
			var checkDiff = function(difference) {
				if (generation<10 || difference<bestdifference) {
					bestdifference = difference;
					bestcontext.drawImage(testcanvas, 0, 0, _width, _height);
					bestshapes.push(shape);
				}
				testcontext.drawImage(bestcanvas, 0, 0, _width, _height);			
				nextGen();
			};
						
			//- - - - - - - - - - - - - - - - - - - -		
			//Goes to the next generation
			var start = (new Date()) - 0;
			var nextGen = function() {
				var messagedata,end;
				if(++generation%500===0) {
					console.log("Generation " + generation + " of " + _generations + " complete!");
					if(!_estimated) {
						parent.estimate(new Date() - start, 500, _generations);
						_estimated = true;
					}
				}
				if(generation<_generations) {
					shape = putArc(testcontext);
					messagedata = {'type':'diff','imagedata':testcontext.getImageData(0, 0, _width,_height)};
					worker.postMessage(messagedata);
				} else {
					//Process is finished.
					callback(bestshapes,(new Date()) - start);
				}
			};

			//Make the worker and start the process:
			worker = new Worker('/javascripts/harissaworker.js?random='+parseInt(Math.random()*100000).toString());
			worker.onmessage = workerEvent("worker",checkDiff,nextGen);
			worker.postMessage({'type':'init','imagedata':imagedata});
	
		}
		

		//------------------------------------------------------------------
		//Tests if shape has 
		var testvisible = function(context,shapes,index){
			var shape = shapes[index];
        	var x = shape.x*_scale;
        	var y = shape.y*_scale;
        	var r = shape.radius*_scale;
        	var l1 = Math.floor(x-r-1); l1=l1<0?0:l1;
        	var t1 = Math.floor(y-r-1); t1=t1<0?0:t1;
        	var d1 = Math.ceil (r*2+2);

        	var l2 = Math.floor(x-_guessradius-1);
        	var t2 = Math.floor(y-_guessradius-1);
        	var d2 = Math.ceil (_guessradius*2+2);

        	drawshapes(context,shapes,l2,t2,l2+d2,t2+d2);
			var data = context.getImageData(l1, t1, d1, d1).data;
			//console.log(index,'------>',l1,t1,d1,data[0],data[1],data[2],data[3]);
			//console.log(index,'       ',l2,t2,d2,data[0],data[1],data[2],data[3]);
			for(var i=0,l=data.length;i<l;i+=4) {
				if(data[i]===5 && data[i+1]===0 && data[i+2]===5 && data[i+3]===255) {
					return true;
				}
			}
			return false;
		};		
		
		//------------------------------------------------------------------
		//Removes hidden shapes
		var reduceShapes = function(shapes) {
			var copies = shapes.slice();
 	        var canvas = initCanvas("test",_width*_scale,_height*_scale);
	        var context = initContext(canvas);
	        var reduced = [];
	        for(var i=0,l=copies.length;i<l;i++) {
	        	var color = copies[i].color;
	        	copies[i].color = "rgba(5,0,5,1.0)";
				context.fillStyle="rgba(255,255,255,255)";
				context.fillRect(0, 0, _width*_scale, _width*_scale);
	        	if(testvisible(context,copies,i)) {
	        		copies[i].color = color;
	        		reduced.push(copies[i]);
	        	} else {
	        		copies[i].hidden = true;
	        	}
	        }
			drawshapes(context,reduced);
			console.log('Shape count optimized from',shapes.length,'to',reduced.length);
	        return reduced;
		};
		
		//------------------------------------------------------------------
		//Saves the image to the server
		var save = function(imgname,folder,shapes,callback) {
			var imgdata = document.getElementById("copy").toDataURL();
			var reduced = reduceShapes(shapes);
			$.ajax({
				type:'post',
				data:{'name':imgname,'folder':folder,'imgdata':imgdata},
				url:imgname + '?folder=' + folder
			}).done(callback);
		}
		
		var mapPalette = function(colors) {
			var p = initContext(initCanvas("p"));
			_colors   = colors;
			_colornum = colors.length;
			for(var i=0,n=_width/_colornum;i<_colornum;i++) {
				_colorshex.push('#' + _colors[i].color);
				p.fillStyle=_colorshex[i];
				p.fillRect(i*n,0,i*n+n,i*n+_height);
			};
			console.log(_colorshex.join(','));
		}
		
		
		//- - - - - - - - - - - - - - - - - - - -
		var initDimensions = function(width,height) {
			_width = _width||width;
			_height = _height||height;
			_size = _size||_width*_height*4;
		}
				
		//- - - - - - - - - - - - - - - - - - - -
		var harissa = function(src) {
			var image = new Image(), c;
			image.onload = function() {
				initDimensions(image.width,image.height);
				c = initContext(initCanvas("c"));
				c.drawImage(image, 0, 0);
				var data = c.getImageData(0, 0, _width,_height);
				var start = function(colors) {
					mapPalette(colors);
					generate(data, function(bestshapes,milliseconds){
						console.log('Image is done:',src);
						makebest(bestshapes);
						save(querystring("image"),querystring("folder"),bestshapes,function(){
							//parent.nextFrame.call({width:parseInt(_width*_scale),height:parseInt(_height*_scale),milliseconds:milliseconds});
						});
					});
				};
				if(querystring("palette")) {
					getColors(data,function(colors){
						parent.setColors(colors);
						start(colors);
					});
				} else {
					start(parent.getColors());
				}
			}
			image.src = src;
		}		
		

		harissa(querystring("image") + '?folder=' + querystring("folder"));
	

	})();	
	