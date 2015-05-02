
/**
 * Module dependencies.
 */

var express = require('express')
  , http    = require('http')
  , path    = require('path')
  , fs      = require('fs')
  , im      = require('./lib/imagemagick');

var app = express();

app.configure(function(){
	app.set('port', process.env.PORT || 3000);
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
	app.use(express.favicon());
	app.use(express.logger('dev'));
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(app.router);
	app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
	app.use(express.errorHandler());
});

app.get('/', function(req,res){
	res.sendfile('./public/index.html');
});

app.get('/harissa.html', function(req,res){
	res.sendfile('./public/harissa.html');
});

app.get('/blend.html', function(req,res){
	res.sendfile('./public/blend.html');
});

app.get('/frames/:name', function(req,res){
	var folder = req.params.name;
	var type = req.query.type||'';
	if (type.length) type = '/' + type;

	im.frames(
		process.cwd() + '/public/video/frames/'+folder+type+'/',
		successCallback(req,res),
		failureCallback(req,res)
	);
});

app.get('/frame/:name', function(req,res){
	var imgname = req.params.name;
	var folder  = req.query.folder;
	var options = "resize,rotate".split(",");
	var params  = {resize:"300x200"};

	options.map(function(opt){if(req.query[opt])params[opt]=req.query[opt]});

	im.convert(
		process.cwd() + '/public/video/frames/'+folder+'/' + req.params.name,
		process.cwd() + '/public/video/frames/'+folder+'/_harissa_sm_' + req.params.name,
		params,
		function(target){res.sendfile(target)},
		failureCallback(req,res)
	);		
});

app.get('/file/:folder/:type/:name',function(req,res){
	var file = process.cwd() + '/public/video/frames/' + req.params.folder + '/' + req.params.type + '/' + req.params.name;
	res.send(fs.readFileSync(file));
});

app.get('/extract/:name', function(req,res){
	var video = req.params.name;
	im.extract(
		process.cwd() + '/public/video/',
		video,
		successCallback(req,res),
		failureCallback(req,res)
	);
});


app.post('/frame/:name',function(req,res){
	var imgdata = req.body.imgdata;
	var imgname = req.params.name;
	var shapes  = req.body.shapes;
	var folder  = req.query.folder;

	var jpath = process.cwd() + '/public/video/frames/' + folder + '/json/';
	var opath = process.cwd() + '/public/video/frames/' + folder + '/out/';
	
	try {fs.mkdirSync(jpath)}catch(ex){console.log(jpath + ' exists')}
	try {fs.mkdirSync(opath)}catch(ex){console.log(opath + ' exists')}

	var json = jpath + imgname.substr(0,imgname.lastIndexOf('.'));
	var out  = opath + imgname.substr(0,imgname.lastIndexOf('.'));

	fs.writeFileSync(json+'.json',JSON.stringify(shapes));

	im.b64ToGIF(
		out,
		imgdata,
		successCallback(req,res),
		failureCallback(req,res)
	);
});


app.post('/blend/:name',function(req,res){
	var imgdata = req.body.imgdata;
	var imgname = req.params.name;
	var folder  = req.query.folder;

	var opath = process.cwd() + '/public/video/frames/' + folder + '/blend/';
	
	try {fs.mkdirSync(opath)}catch(ex){console.log(opath + ' exists')}

	var out  = opath + imgname;

	im.b64ToGIF(
		out,
		imgdata,
		successCallback(req,res),
		failureCallback(req,res)
	);
});

app.post('/merge/:name',function(req,res){
	var folder = req.params.name;
	var width  = req.body.width;
	var height = req.body.height;
	im.merge(
		process.cwd() + '/public/video/frames/'+folder+'/out/',
		process.cwd() + '/public/video/out/'+folder,
		width,
		height,
		successCallback(req,res),
		failureCallback(req,res)
	);
});

app.get('/gif/:name',function(req,res){
	var folder = req.params.name;
	im.gif(
		process.cwd() + '/public/video/frames/'+folder+'/blend/',
		process.cwd() + '/public/video/out/'+folder,
		successCallback(req,res),
		failureCallback(req,res)
	);
});

http.createServer(app).listen(app.get('port'), function(){
	console.log("Harissa server listening on port " + app.get('port'));
});

var successCallback = function(req,res) {
	return function(result) {
		res.send({isSuccess:true,result:result});
	};
}

var failureCallback = function(req,res) {
	return function(err) {
		res.send({isSuccess:false,error:err});
	};
}