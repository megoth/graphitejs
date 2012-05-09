var http = require('http'),
    url = require('url'),
    port = 1337;

http.createServer(function (request, response) {
  console.log("Request from", request.headers.host);
  var options = url.parse(request.url, true).query;
  console.log("Request to", options.host);
  var req = http.request(options, function(res) {
		res.setEncoding('utf8');
		var result = "";
		res.on('data', function(chunk) {
			  result += chunk;
		});
	
		res.on('end', function() {
			console.log("Result", result);
			response.writeHead(res.statusCode, res.headers);
			response.write(result);
			response.end();
		});
  });
  
  req.on('error', function(e) {
		console.log('problem with request: ' + e.message);
  });
  
  req.end();
}).listen(port);
