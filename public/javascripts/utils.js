"use strict";

var utils;
if(typeof window === 'undefined'){
	utils = module.exports = {};
} else {
	utils = window;
}

	
//Full Arc in radians
var _360 = 2 * Math.PI;

//Image sizes variables
var _width;
var _height;
var _size;

var _scale = 2.5;

var _inters = 15;

//The palette of the image
var _colors = [];
var _colorshex = [];
var _colornum = 0;


//------------------------------------------------------------------
//Event builder:
utils.workerEvent = function(source,result,ready) {
	return function(event) {
		var data = event.data;
		switch (data.type) {case "result":result(data.data);break;case "ready":ready(data.data);break;}
	};	
};

//------------------------------------------------------------------
//Gets a querystring value:
utils.querystring = function(key,url){
	url = url || window.location.search;
	key = key.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]"); 
	var regex = new RegExp("[\\?&]"+key+"=([^&#]*)"); 
	var results = regex.exec( url );
	return (!results)?"":decodeURIComponent(results[1].replace(/\+/g, " "));
};

//------------------------------------------------------------------
//Gets a querystring object:
utils.querys = function(url){
	var obj  = {};
	url = url || window.location.search;
	if(url.indexOf('?')===0) url = url.substr(1);
	url.split("&").map(function(itm){var o=itm.split('=');obj[o[0]]=o[1];});
	return obj;
};

//------------------------------------------------------------------
//Converts milliseconds to H:M:S
utils.time = function(millis) {
	var s = (parseInt(millis / 1000) % 60).toString();
	var m = (parseInt(millis / (1000 * 60)) % 60).toString();
	var h = (parseInt(millis / (1000 * 60 * 60)) % 24).toString();
	var ss = s.length===1?'0'+s:s;
	var mm = m.length===1?'0'+m:m;
	var hh = h.length===1?'0'+h:h;
	return hh + ':' + mm + ':' + ss;
}

//------------------------------------------------------------------
//Interpolate two integers into f steps
utils.interpolate1d = function(a,b,f) {
	f = f|| _inters;
	var d = (b-a);
	var k = d/f;
	var n = [];
	for(var i = 0; i<=f; i++) {
		var x = a+(k*i);
		n.push(Math.round(x));
	}
	return n;
}

//------------------------------------------------------------------
//Interpolate n dimensions into f steps
utils.interpolate = function(a,b,d,e) {

	//Steps
	e = e|| _inters;

	//Interpolated data
	var r = [];

	//Each step
	for(var s = 0; s<=e; s++) {

		//Each dimension property
			var o  = JSON.parse(JSON.stringify(a));      //Poor man's clone
		for(var i  =  0; i<d.length; i++) {              //'x' , 'y' => a.x , a.y
			var n  =  d[i];
			var k  = (b[n]-a[n])/e;                      //interpolation step
			  o[n] =  Math.round((a[n]+k*s)*1000)/1000;  //rounded to thousandths
		}

		r.push(o);

	}

	return r;
};


//------------------------------------------------------------------
//Interpolate two points
utils.combine = function(set) {
	var frames = set.slice();
	for(var i = 0; i<frames.length; i++) {
		var s = frames[i];
		var d = s.data;
		var c = s.colors = {};
		for(var z = 0; z<d.length; z++) {
			var p = d[z];
			if(!c[p.color]) {
				c[p.color] = {points:[]};
			}
			p.z = z;
			p.i = i;
			c[p.color].points.push(p);
		}
	}
	return frames;
}

//------------------------------------------------------------------
//distance calculation for kd-tree
utils.distance = function(a,b) {
	var dx = (a.x-b.x);
	var dy = (a.y-b.y);
	//var dz = (a.z-b.z);
	//var di = (b.i-1-a.i);
	return dx*dx+dy*dy//+di*di;
}
//------------------------------------------------------------------
//Prevent event bubbling:
utils.nobubble = function(e) {e&&e.preventDefault&&e.preventDefault();e&&e.stopPropagation&&e.stopPropagation();return false;}
	
//------------------------------------------------------------------
//Initializes a canvas width and height
utils.initCanvas = function(canvas,width,height) {
	if (typeof canvas === "string") canvas = document.getElementById(canvas);
	canvas.width  = parseInt(width||_width);
	canvas.height = parseInt(height||_height);
	canvas.style.width  = canvas.width + 'px';
	canvas.style.height = canvas.height + 'px';
	return canvas;
};

//------------------------------------------------------------------
//Initializes the context of a canvas
utils.initContext = function(canvas) {
	var context = canvas.getContext("2d");
	context.fillStyle="#ffffff";
	context.fillRect(0, 0, canvas.width, canvas.height);
	return context;
};
	
//------------------------------------------------------------------	
//Random number helpers
utils.rand1 = function(max){ return Math.floor(Math.random()*max); }
utils.rand2 = function(min,max){ return Math.floor(Math.random() * (max - min + 1)) + min; }

//------------------------------------------------------------------
//Converts polar coordinates to cartesian
utils.cartesian = function(d,l,x,y){
	//Get base cartesian around 0,0 axis
	var x1 = Math.floor(l * Math.cos(d * 2 * Math.PI / 360)) + (x||0);
	var y1 = Math.floor(l * Math.sin(d * 2 * Math.PI / 360)) + (y||0);
	return {x:x1,y:y1};
};

utils.getPolarCoords = function() {
	var l = rand1(_height/2); //length of vector
	var d = rand1(360);		  //angle of vector
	var o = cartesian(d,l,_width/2,_height/2);
	return o;
}

utils.getGridCoords = function() {
	var x = rand1(_width); 
	var y = rand1(_height);
	var o = {x:x,y:y};
	return o;		
}

//------------------------------------------------------------------
utils.mapPalette = function(colors,canvas) {
	var p = utils.initContext(canvas);
	_colors   = colors;
	_colornum = colors.length;
	for(var i=0,n=_width/_colornum;i<_colornum;i++) {
		_colorshex.push('#' + _colors[i].color);
		p.fillStyle=_colorshex[i];
		p.fillRect(i*n,0,i*n+n,i*n+_height);
	};
	console.log(_colorshex.join(','));
}

//------------------------------------------------------------------
utils.mapPaletteTable = function(colors,div) {
	var pal = _.template($("#pal").html());

	colors.map(function(color){
		div.append($(pal(color)));
	});
}

//------------------------------------------------------------------
utils.initDimensions = function(width,height) {
	_width = _width||width;
	_height = _height||height;
	_size = _size||_width*_height*4;
}


//------------------------------------------------------------------
//Saves the svg images
utils.drawshapes = function(context,shapes,left,top,right,bottom){
	left=left||0; top=top||0; right=right||(_width*_scale);bottom=bottom||(_height*_scale);
	for(var i=0,l=shapes.length;i<l;i++) {
		var shape = shapes[i];
		if(!shape.hidden) {
			var x = shape.x*_scale;
			var y = shape.y*_scale;
			if (x>=left && y>=top && x<=right && y<=bottom) {
				var r = shape.radius*_scale;
				//console.log(x,y,r,0,_360,false,shape.color);
				context.beginPath();
				context.fillStyle = shape.color;
				context.arc(x, y, r, 0, _360, false);
				context.closePath();
				context.fill();
			}
		}     	
	};
};

/*
(function(){
	var dim = "x,y,radius,z".split(",");
	var f = 17;

	console.log(utils.interpolate({x:0,y:6,z:9,radius:1},{x:9,y:3,z:0,radius:10},dim,f));
	//Tests:
	console.log(utils.interpolate1d(1,27,17));
	console.log(utils.interpolate1d(27,1,17));

	console.log(utils.interpolate2d({x:0,y:0},{x:9,y:9},3));
	console.log(utils.interpolate2d({x:0,y:0},{x:-9,y:9},3));
	console.log(utils.interpolate2d({x:0,y:0},{x:9,y:-9},3));
	console.log(utils.interpolate2d({x:9,y:9},{x:0,y:0},3));
	console.log(utils.interpolate2d({x:-9,y:9},{x:0,y:0},3));
	console.log(utils.interpolate2d({x:9,y:-9},{x:0,y:0},3));

	console.log(utils.interpolate2dR({x:0,y:0,radius:1},{x:9,y:9,radius:10},3));
	console.log(utils.interpolate2dR({x:0,y:0,radius:1},{x:-9,y:9,radius:10},3));
	console.log(utils.interpolate2dR({x:0,y:0,radius:1},{x:9,y:-9,radius:10},3));
	console.log(utils.interpolate2dR({x:9,y:9,radius:10},{x:0,y:0,radius:1},3));
	console.log(utils.interpolate2dR({x:-9,y:9,radius:10},{x:0,y:0,radius:1},3));
	console.log(utils.interpolate2dR({x:9,y:-9,radius:10},{x:0,y:0,radius:1},3));
})();
*/
