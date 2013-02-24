$(function(){

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
			$("#harissa").attr("src",src);
			
		} else {
			//All finished!
			var params = {width:this.width,height:this.height};
			finish(_folder, params, function(){ console.log('done!'); });
		}

		
	};

	//------------------------------------------------------------------
	//Gets the frames and starts the process:
	_folder = querystring("folder");
	$.get("/frames/" + _folder).done(function(data){
		if(data.isSuccess) {
			var $frames = $("#frames");
			data.result.map(function(frame){
				$frames.append("<li id='"+frame.substr(0,frame.indexOf('.'))+"' data-src='/frame/"+frame+"'>"+frame+"</li>");
			});
			nextFrame();
		}
	});
	
	//------------------------------------------------------------------	
	//callable from iframe: 
	window.nextFrame = nextFrame;
	window.estimate  = estimate;

});