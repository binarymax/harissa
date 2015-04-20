
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
	if (type.length) type = '_' + type;

	im.frames(
		process.cwd() + '/public/video/frames/'+folder+type+'/',
		successCallback(req,res),
		failureCallback(req,res)
	);
});

app.get('/frame/:name', function(req,res){
	var imgname = req.params.name;
	var folder  = req.query.folder;
	im.downscale(
		process.cwd() + '/public/video/frames/'+folder+'/' + req.params.name,
		process.cwd() + '/public/video/frames/'+folder+'/_harissa_sm_' + req.params.name,
		function(target){res.sendfile(target)},
		failureCallback(req,res)
	);		
});

app.get('/file/:folder/:name',function(req,res){
	var file = process.cwd() + '/public/video/frames/' + req.params.folder + '/' + req.params.name;
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
	
	var json = process.cwd() + '/public/video/frames/' + folder + '_json/' + imgname.substr(0,imgname.lastIndexOf('.'));
	var out = process.cwd() + '/public/video/frames/' + folder + '_out/' + imgname.substr(0,imgname.lastIndexOf('.'));

	fs.writeFileSync(json+'.json',JSON.stringify(shapes));

	im.b64ToJPG(
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
		process.cwd() + '/public/video/frames/'+folder+'_out/',
		process.cwd() + '/public/video/out/'+folder,
		width,
		height,
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