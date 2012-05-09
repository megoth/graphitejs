var spawn = require('child_process').spawn,
busterServer = spawn('buster', ['server']),
staticServer = spawn('node', ['static']),
proxyServer = spawn('node', ['proxy']);

var stdout = function (callee, data) {
	console.log(callee + ':\n' + data);
};

var stderr = function (callee, data) {
	console.warn(callee + ':\n' + data);
};

busterServer.stdout.on('data', function(data) { stdout('buster', data); });
staticServer.stdout.on('data', function(data) { stdout('static', data); });
proxyServer.stdout.on('data', function(data) { stdout('proxy', data); });
busterServer.stderr.on('data', function(data) { stderr('buster', data); });
staticServer.stderr.on('data', function(data) { stderr('static', data); });
proxyServer.stderr.on('data', function(data) { stderr('proxy', data); });
