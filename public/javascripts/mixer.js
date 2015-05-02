$(function(){
	"use strict"
	var _folder, _estimated, _querys=window.location.search;
	console.log(_querys);

	_.templateSettings.interpolate = /{{([\s\S]+?)}}/g;

	//------------------------------------------------------------------
	//Converts milliseconds to HH:MM:SS
	var time = function(millis) {
		var s = (parseInt(millis / 1000) % 60).toString();
		var m = (parseInt(millis / (1000 * 60)) % 60).toString();
		var h = (parseInt(millis / (1000 * 60 * 60)) % 24).toString();
		var ss = s.length===1?'0'+s:s;
		var mm = m.length===1?'0'+m:m;
		var hh = h.length===1?'0'+h:h;
		return hh + ':' + mm + ':' + ss;
	}

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
	//Finishes the calculation:	
	var finish = function(folder,params,callback) {
		$.ajax({
			type:'post',
			data:params,
			url:'/merge/' + folder
		}).done(callback);
	};
	
	//------------------------------------------------------------------
	//Finishes the calculation:
	var nextFrame = function() {
		var frame = $(".current"),src,img;
		
		if (!frame.length) {
			frame = $("#frames > tbody tr:first");

		} else {
			//frame.append('<span class="time">'+this.milliseconds+'</span>');
			frame.find(".elapsed").text(time(this.milliseconds));
			frame.removeClass("current");
			frame = frame.next();
		}

		if (frame.length) {			
			frame.addClass("current");
			img = encodeURIComponent(frame.find(".image").text());
			src = "/harissa.html?image=" + img + '&' + _querys.substr(1);
			//src+= (frame.find(".keyframe > input").attr("checked")==="checked") ? '&palette=1' : ''
			src+= !$("#colors").val().length ? '&palette=1' : ''
			$("#harissa").attr("src",src);
			
		} else {
			//All finished!
			var params = {width:this.width,height:this.height};
			finish(_folder, params, function(){ console.log('done!'); });
		}

		
	};

	//------------------------------------------------------------------
	//Sets the color list:
	var setColors = function(c) { $("#colors").val(JSON.stringify({data:c})); }

	//------------------------------------------------------------------
	//Gets the color list:
	var getColors = function() { return JSON.parse($("#colors").val()).data; }

	//------------------------------------------------------------------
	//Prevent event bubbling:
	var nobubble = function(e) {e&&e.preventDefault&&e.preventDefault();e&&e.stopPropagation&&e.stopPropagation();return false;}

	//------------------------------------------------------------------
	//Starts the process:
	var start = function(e) {
		$("#controls").hide();
		nextFrame();
		return nobubble(e);
	};


	//------------------------------------------------------------------

	var colorify = function(){

		var $frames = $("#frames > tbody");

		var flex = $("#flex").val();

		colors.flex(parseFloat(flex));

		$frames.find(".colors div").remove();

		//var prev = $frames.find(".preview:first > img").attr("src");
		var prev = $frames.find(".image:first").text()+"?folder="+_folder;
		console.log(prev);
		colors.getImageColors(prev,function(cdata){
			mapPaletteTable(cdata,$frames.find(".colors"));
		});

	};

	//------------------------------------------------------------------
	//Gets the frames and shows them in the list:
	var load = function() {
		var $frames = $("#frames > tbody");
		var row = _.template($("#row").html());
		_folder = querystring("folder");
		$.get("/frames/" + _folder).done(function(data){
			if(data.isSuccess) {
				
				data.result.map(function(frame){
					var id = frame.substr(0,frame.indexOf('.'));
					var img = "/frame/"+frame;
					var prev = img+_querys;
					var data = {id:id,frame:frame,img:img,prev:prev};
					var line = $(row(data));
					$frames.append(line);
				});

				$frames.find(".keyframecheck:first").attr("checked","checked").attr("disabled","disabled");

			}
		});
		
		$("#start").on("click",start);

		$("#colorify").on("click",colorify);
		
	};
	//------------------------------------------------------------------	
	//callable from iframe: 
	window.nextFrame = nextFrame;
	window.estimate  = estimate;
	window.setColors = setColors;
	window.getColors = getColors;
	load();	
});