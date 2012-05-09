/**
 * Code found at http://blog.rassemblr.com/2011/04/a-working-static-file-server-using-node-js/
 */

var libpath = require('path'),
    http = require("http"),
    fs = require('fs'),
    url = require("url"),
    mime = require('mime');

var path = "./static";
var port = 8088;

http.createServer(function (request, response) {
    console.log("request from", request.headers.host);
    var uri = url.parse(request.url).pathname;
    var filename = libpath.join(path, uri);

    libpath.exists(filename, function (exists) {
        if (!exists) {
            response.writeHead(404, {
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "text/plain"
            });
            response.write("404 Not Found\n");
            response.end();
            return;
        }

        if (fs.statSync(filename).isDirectory()) {
            filename += '/index.html';
        }

        fs.readFile(filename, "binary", function (err, file) {
            if (err) {
                response.writeHead(500, {
                    "Access-Control-Allow-Origin": "*",
                    "Content-Type": "text/plain"
                });
                response.write(err + "\n");
                response.end();
                return;
            }
            
            var type = mime.lookup(filename);
            var header = {
                "Content-Type": type
            }
            if (filename !== "static/nocors.txt") {
            	header["Access-Control-Allow-Origin"] = "*";
            }

            response.writeHead(200, header);
            console.log("serving", filename, file);
            response.write(file, "binary");
            response.end();
        });
    });
}).listen(port);
