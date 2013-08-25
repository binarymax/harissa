$(function(){
	"use strict"
	var _folder, _estimated;

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
	//Estimates length of the calculation:
	var estimate = function(milliseconds,slice,generations) {
		if(!_estimated) {
			_estimated = true;
			var total = (generations/slice) * milliseconds * $("#frames li").length;
			var seconds = total/1000;
			var minutes = seconds/60;
			var hours = minutes/60;
			$("#estimate").text(parseInt(hours) + ':' + parseInt(minutes) + ':' + parseInt(seconds));
			var start = new Date() - milliseconds; 
			setInterval(function(){
				var elapsed = new Date() - start;
				var seconds = elapsed/1000;
				var minutes = seconds/60;
				var hours = minutes/60;
				$("#elapsed").text(parseInt(hours) + ':' + parseInt(minutes) + ':' + parseInt(seconds));
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
			frame = $("#frames li:first");
		} else {
			frame.append('<span class="time">'+this.milliseconds+'</span>');
			frame.removeClass("current");
			frame = frame.next();
		}

		if (frame.length) {			
			frame.addClass("current");
			img = encodeURIComponent(frame.attr("data-src"));
			src = "/harissa.html?image=" + img + '&folder=' + _folder;
			src+= (frame.find("input[type=checkbox]:first").attr("checked")==="checked") ? '&palette=1' : ''
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
	//Frame Preview Mouseover:	
	var previewOver = function(e) {
		var $frame = $(this);
		var $preview = $("#preview");
		var $image = $("#previewimage");
		var offset = $frame.offset();
		offset.left+=200;
		$preview.css(offset);
		$("#preview").show();
		$image.attr("src",$frame.attr("data-preview"));
		return nobubble(e);	 
	};

	//------------------------------------------------------------------
	//Frame Preview Mouseout:
	var previewOut = function(e) {
		$("#preview").hide();
		return nobubble(e);	 
	};

	//------------------------------------------------------------------
	//Gets the frames and shows them in the list:
	var load = function() {
		var $frames = $("#frames");
		_folder = querystring("folder");		
		$.get("/frames/" + _folder).done(function(data){
			if(data.isSuccess) {
				
				data.result.map(function(frame){
					var id = frame.substr(0,frame.indexOf('.'));
					$frames.append("<li id='"+id+"' data-src='/frame/"+frame+"' data-preview='/frame/"+frame+"?folder="+_folder+"' class='frame'><label><input type='checkbox' id='chk"+id+"' />"+frame+"</label></li>");
				});
				$frames.find("input[type=checkbox]:first").attr("checked","checked").attr("disabled","disabled");
			}
		});
		
		$("#start").on("click",start);
		$frames
			.on("mouseover",".frame",previewOver)
			.on("mouseout",".frame",previewOut);
		
	};
	//------------------------------------------------------------------	
	//callable from iframe: 
	window.nextFrame = nextFrame;
	window.estimate  = estimate;
	window.setColors = setColors;
	window.getColors = getColors;
	load();	
});