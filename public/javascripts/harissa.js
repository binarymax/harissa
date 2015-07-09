(function(){
			
		//Generations (number of shapes)
		var _generations = querystring("generations")||5000;
				
		//Maximum dimensions for random shapes
		var _guessradius = 10;
					
		var _estimated = false;

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
			//Logs generation information 
			var log = function() {
				if (generation%500===0) {
					console.log("Generation " + generation + " of " + _generations + " complete!");
					if(!_estimated) {
						parent.estimate(new Date() - start, 500, _generations);
						_estimated = true;
					}
				}
			};

			//- - - - - - - - - - - - - - - - - - - -
			//Loads the difference from the thread, and checks if all threads from this generation are finished 
			var checkDiff = function(difference) {
				if (generation<10 || difference<bestdifference) {
					bestdifference = difference;
					bestcontext.drawImage(testcanvas, 0, 0, _width, _height);
					bestshapes.push(shape);
					generation++;
					log();
				}
				testcontext.drawImage(bestcanvas, 0, 0, _width, _height);			
				nextGen();
			};
						
			//- - - - - - - - - - - - - - - - - - - -		
			//Goes to the next generation
			var start = (new Date()) - 0;
			var nextGen = function() {
				var messagedata,end;

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
		//Tests if shape is visible after other shapes cover it
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
	        	copies[i].color = "rgba(5,0,5,1.0)"; //<---This is a hardcoded 505 keycolor test to test visibility.  This is compensated for in palette extraction. 
				context.fillStyle="rgba(255,255,255,255)";
				context.fillRect(0, 0, _width*_scale, _height*_scale);
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
				data:{'name':imgname,'folder':folder,'imgdata':imgdata,'shapes':reduced},
				url:imgname + '?folder=' + folder
			}).done(callback);
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
					mapPalette(colors,initCanvas("p"));
					generate(data, function(bestshapes,milliseconds){
						console.log('Image is done:',src);
						makebest(bestshapes);
						save(querystring("image"),querystring("folder"),bestshapes,function(){
							parent.nextFrame.call({width:parseInt(_width*_scale),height:parseInt(_height*_scale),milliseconds:milliseconds});
						});
					});
				};
				if(querystring("palette")) {
					colors.getColors(data,function(colors){
						parent.setColors(colors);
						start(colors);
					});
				} else {
					start(parent.getColors());
				}
			}
			image.src = src;
		}		
		
		var rotate = querystring("rotate")||'';
		if (rotate) rotate = '&rotate='+rotate;
		harissa(querystring("image") + '?folder=' + querystring("folder") + rotate);
	

	})();	
	