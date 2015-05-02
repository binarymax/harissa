$(function(){
	"use strict"
	var _folder, _estimated, _set;

	//------------------------------------------------------------------
	//Estimates length of the calculation:
	var estimate = function(milliseconds,slice,generations) {
		if(!_estimated) {
			_estimated = true;
			var total = (generations/slice) * milliseconds * $("#frames li").length;
			$("#estimate").text(time(total));
			var start = new Date(); 
			setInterval(function(){
				var elapsed = (new Date()) - start;
				$("#elapsed").text(time(elapsed));
			},1000);
		}
	};

	//------------------------------------------------------------------
	//Saves the image to the server
	var save = function(imgname,folder,imgdata,callback) {
		$.ajax({
			type:'post',
			data:{'name':imgname,'folder':folder,'imgdata':imgdata},
			url:'/blend/'+imgname + '?folder=' + folder
		}).done(callback);
	}

	//------------------------------------------------------------------
	//Pads a number with zeros
	var pad = function(i,l) {
		var str = i.toString();
		var len = l.toString().length;
		while (str.length<=len) {str = '0' + str};
		return str;
	};


	//------------------------------------------------------------------
	//Finishes the calculation:	
	var finish = function(views,folder,callback) {
		for(var i=0,l=views.length;i<l;i++) {
			var name = pad(i,l);
			var b64 = views[i].canvas[0].toDataURL();
			save(name,folder,b64);
		}
		/*
		$.ajax({
			type:'post',
			data:params,
			url:'/merge/' + folder
		}).done(callback);
		*/
	};

	//------------------------------------------------------------------
	//Check/Uncheck boxes:
	var checkall = function(on) {
		return function(e) {
			$("#frames > li input").attr("checked",on);
			return nobubble(e);
		}
	};

	//------------------------------------------------------------------
	//Animates from one frame to another
	var animate = function(views) {
		var i=0;
		setInterval(function(){
			views[i++].canvas.hide();
			if(i===views.length) i=0;
			views[i].canvas.show();
			console.log(i);
		},120);
	};

	//------------------------------------------------------------------
	//Creates the KD-Tree
	var insert = function(set) {
		var frames = combine(set);
		for(var i=1;i<frames.length;i++){
			var frame = frames[i], color, c;
			for(c in frame.colors) {
				if(frame.colors.hasOwnProperty(c)) {
					color = frame.colors[c];
					color.tree = new kdTree(color.points, distance, ['x','y']);
				}
			}
		}
		return frames;
	};

	//------------------------------------------------------------------
	//Next Frame:
	var frame = function(data,colors) {
		var total = 0;
		var dims  = "x,y,radius,z".split(",");
		for(var i=0;i<data.length;i++) {
			var d=data[i];
			var c=colors[d.color];
			if (c && c.tree) {
				var p = null;
				try{p = c.tree.nearest(d,1);}catch(ex){console.log(d);}
				if (p && p.length && p[0] && p[0][0]) {
					d.next = p[0][0];
					d.inter = interpolate(d,d.next,dims,_inters);
					c.tree.remove(d.next);
				}
			}
		}
		return data;
	};

	var blender = function(source,frames) {
		var blends = [];
		for(var s=0;s<source.length-1;s++) {
			var set = source[s];
			var blend = blends[s*_inters] = frame(set.data,frames[s+1].colors);
			//console.log('------',s*_inters);
			    var l = blend.length;
			for(var i = 0; i<l; i++) {
				var d = blend[i];
				//console.log(JSON.stringify(d));
				for(var j=0;d&&d.inter&&j<d.inter.length;j++) {
					var bl = s*_inters+j;
					//console.log('---------',bl);
					blends[bl] = blends[bl] || {name:bl,data:[]};
					blends[bl].data = blends[bl].data || [];
					blends[bl].data.push(d.inter[j]);
				}
			}
		}
		for(var i=0;i<blends.length;i++) {
			blends[i].data.sort(function(a,b){return a.z-b.z});
		}
		return blends;
	}

	//------------------------------------------------------------------
	//Sets up the viewable frames
	var viewer = function(blends) {
		var view = $("#view");
		var views = [];
		for(var b=0;b<blends.length;b++) {
			var blend = blends[b];
			if (blend.data) {
				var id = "frame" + b;
				var cn = $("<canvas id='"+id+"'></canvas>"); 
				view.append(cn);
				var co = initContext(initCanvas(id));
				views.push({id:id,canvas:cn,context:co});
				drawshapes(co,blend.data);
				cn.hide();
			}
		}
		return views
	}

	//------------------------------------------------------------------
	//Starts the process:
	var start = function(e) {
		$("#controls").hide();
		var resize = querystring("resize");
		_width=800;
		_height=600;
		if (resize && resize.length) {
			var wh = resize.split('x');
			_width = parseInt(wh[0]);
			_height = parseInt(wh[1]);
		}
		var source = [];
		$("#frames > li").each(function(li){
			var id = $(this).attr("id");
			var ch = $(this).find("input").attr("checked") ? true : false;
			if (ch) {
				for (var i=0;i<_set.length;i++) {
					if(_set[i].id===id) source.push(_set[i]);
				}
			}
		});
		var frames = insert(source);
		var blends = blender(source,frames);
		var views  = viewer(blends);
		finish(views,querystring('folder'),function(){});
		animate(views);
		return nobubble(e);
	};

	//------------------------------------------------------------------
	//Frame Preview Mouseover:	
	var previewOver = function(e) {
		var $frame = $(this);
		var $preview = $("#preview");
		var offset = $frame.offset();
		offset.left+=200;
		$preview.css(offset);
		$("#preview").show();
		for(var i=0;i<_set.length;i++) {
			if (_set[i].name===$frame.attr("data-src")) {
				$preview.text(JSON.stringify(_set[i]).substr(0,505)+'...');
				return;
			}
		}
		
		return nobubble(e);	 
	};

	//------------------------------------------------------------------
	//Frame Preview Mouseout:
	var previewOut = function(e) {
		$("#preview").hide();
		return nobubble(e);	 
	};

	//------------------------------------------------------------------
	//Gets all the JSON data from the server and calls a finish function when done
	var async = function(length,finish) {
		var done = 0;
		var set = [];
		return function(id,name){
			return function(data) {
				data = JSON.parse(data).map(function(p){
					return {
						x:parseInt(p.x),
						y:parseInt(p.y),
						radius:parseInt(p.radius),
						color:p.color
					}
				});
				set.push({id:id,name:name,data:data});
				if(++done===length) finish(set.sort(function(a,b){return a<b?-1:1}));
			}
		}
	}

	//------------------------------------------------------------------

	var enable = function(set){
		_set = set;
		$("#uncheck").on("click",checkall(false));
		$("#recheck").on("click",checkall(true));
		$("#start").on("click",start);
		$("#frames").show();//.on("mouseover",".frame",previewOver);
	}

	//------------------------------------------------------------------
	//Gets the frames and shows them in the list:
	var load = function() {
		var $frames = $("#frames").hide();
		_folder = querystring("folder");		
		$.get("/frames/" + _folder + "?type=json").done(function(data){
			if(data.isSuccess) {
				var length = data.result.length;
				var queue = async(length,enable);
				console.log(data.result);
				data.result.map(function(frame){
					var id = frame.substr(0,frame.indexOf('.'));
					var file = "/file/"+_folder+"/json/"+frame;
					$.get(file).done(queue(id,file));
					$frames.append("<li id='"+id+"' data-src='"+file+"' data-preview='"+file+"' class='frame'><label><input type='checkbox' id='chk"+id+"' checked='checked' />"+frame+"</label></li>");
				});
			}
		});
		
	};
	//------------------------------------------------------------------	
	//callable from iframe: 
	window.estimate  = estimate;
	load();	
});