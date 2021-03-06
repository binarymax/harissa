var fs = require('fs'),
	exec = require('child_process').exec;

var _fps = 12;
var _len = 240;

var ImageMagick = module.exports = {};

ImageMagick.mkdir = function(path,success,failure) {
	if(typeof path!=="string" || !path.length) return fail("mkdir path is required",failure);
	fs.mkdir(path, function(err){
		if (err) return fail(err,failure);
		success();
	});
};

ImageMagick.mkdirsync = function(path) {
	if(typeof path!=="string" || !path.length) return fail("mkdir path is required",failure);
	try{fs.mkdirSync(path)}catch(ex){console.log('Directory could not be created or already exists:',path);}
};

ImageMagick.frames = function(path,success,failure) {
	if(typeof path!=="string" || !path.length) return fail("Frames path is required",failure);
	fs.readdir(path,function(err,files){
		if (err) return fail(err,failure);
		var result = [];
		var filter = "jpg,png,gif,json".split(',');
		files.map(function(file){
			var dot = file.lastIndexOf('.');
			var ext = file.substr(dot+1).toLowerCase();
			if((dot>-1) && (filter.indexOf(ext)>-1) && (file.indexOf('_harissa_')===-1)) {
				result.push(file);
			}
		});
		result.sort(function(a,b){
			return (a<b)?-1:1;
		});
		success(result);
	});
};

ImageMagick.extract = function(path,source,success,failure) {
	if(typeof path!=="string" || !path.length) return fail("Extract source is required",failure);
	if(typeof source!=="string" || !source.length) return fail("Extract source is required",failure);
	var target = source.substr(0,source.lastIndexOf("."));
	var outdir = path + 'frames/' + target + '/';
	ImageMagick.mkdirsync(outdir);
	var command = 'mplayer -nosound -vo png:outdir="' + outdir + '" -fps ' + _fps + /*' -frames ' + _len +*/ ' -ss 2 ' + path + source;
	console.log(command);
	child = exec(command,function (execErr, stdout, stderr) {
		if (execErr !== null) return fail(execErr,failure);
		ImageMagick.frames(outdir,success,failure);
	});
};

ImageMagick.downscale = function(source,target,success,failure) {
	if(typeof source!=="string" || !source.length) return fail("Downscale source is required",failure);
	if(typeof target!=="string" || !target.length) return fail("Downscale target is required",failure);
	var command = "convert -resize 300x200\\> " + source + " " + target;
	console.log(command);
	child = exec(command,function (execErr, stdout, stderr) {
		if (execErr !== null) return fail(execErr,failure);
		success(target);
	});
};

ImageMagick.convert = function(source,target,options,success,failure) {
	if(typeof source!=="string" || !source.length) return fail("Alter source is required",failure);
	if(typeof target!=="string" || !target.length) return fail("Alter target is required",failure);
	if(typeof options!=="object" || !options) return fail("Alter options are required",failure);
	var params = (function(){var str="";for (var i in options) if (options.hasOwnProperty(i)) str+=" -"+i+" "+options[i]; return str})();
	var command = "convert"+params+"\\> " + source + " " + target;
	console.log('-------------------');
	console.log(command);
	console.log("convert -resize 300x200\\> " + source + " " + target);
	child = exec(command,function (execErr, stdout, stderr) {
		if (execErr !== null) return fail(execErr,failure);
		success(target);
	});
};

ImageMagick.b64ToJPG = function(target,imgdata,success,failure) {
	var filenameB64 = target + '.b64';
	var filenameJPG = target + '.jpg';
	fs.writeFile(filenameB64,imgdata,function(writeErr) {
		if (writeErr) return fail(writeErr,failure);
		var command = "convert inline:" + filenameB64 + " " + filenameJPG; 
		child = exec(command,function (execErr, stdout, stderr) {
			if (execErr !== null) return fail(execErr,failure);
			fs.unlinkSync(filenameB64);
			success(filenameJPG);
		});
	});
};

ImageMagick.b64ToGIF = function(target,imgdata,success,failure) {
	var filenameB64 = target + '.b64';
	var filenameGIF = target + '.gif';
	fs.writeFile(filenameB64,imgdata,function(writeErr) {
		if (writeErr) return fail(writeErr,failure);
		var command = "convert inline:" + filenameB64 + " " + filenameGIF; 
		child = exec(command,function (execErr, stdout, stderr) {
			if (execErr !== null) return fail(execErr,failure);
			fs.unlinkSync(filenameB64);
			success(filenameGIF);
		});
	});
};

ImageMagick.merge = function(source,target,width,height,success,failure) {
	if(typeof source!=="string" || !source.length) return fail("Merge source is required",failure);
	if(typeof target!=="string" || !target.length) return fail("Merge target is required",failure);
	var command = "mencoder mf://"+source+"*.jpg -mf w="+width+":h="+height+":fps="+_fps+":type=jpg -ovc lavc -lavcopts vcodec=mpeg4:mbd=2:trell -oac copy -o "+target+".avi";
	console.log(command);
	child = exec(command,function (execErr, stdout, stderr) {
		if (execErr !== null) return fail(execErr,failure);
		success(target + 'avi');
	});
};

ImageMagick.gif = function(source,target,success,failure) {
	if(typeof source!=="string" || !source.length) return fail("Merge source is required",failure);
	if(typeof target!=="string" || !target.length) return fail("Merge target is required",failure);
	var command = "gifsicle --delay=1 --loop "+source+"*.gif > "+target+".gif"
	console.log(command);
	child = exec(command,function (execErr, stdout, stderr) {
		if (execErr !== null) return fail(execErr,failure);
		success(target + '.gif');
	});
};

function fail(err,callback) {
	console.error('ERROR in ImageMagick Module::',err);
	callback(err);
	return false;
}

function guid() {
    var S4 = function () { return Math.floor(Math.random() * 0x10000).toString(16)};
    return (S4() + S4() + S4() + S4() + S4() + S4() + S4() + S4());
}