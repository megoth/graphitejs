/**
 * Code found at http://blog.rassemblr.com/2011/04/a-working-static-file-server-using-node-js/
 */
var nodePath = require('path'),
    nodeHttp = require("http"),
    nodeFs = require('fs'),
    nodeUrl = require("url"),
    mime = require('mime'),
    path = "./static",
    port = 8088;
nodeHttp.createServer(function (request, response) {
    console.log("request from", request.headers.host);
    var uri = nodeUrl.parse(request.url).pathname;
    var filename = nodePath.join(path, uri);
    nodeFs.exists(filename, function (exists) {
        if (!exists) {
            response.writeHead(404, {
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "text/plain"
            });
            response.write("404 Not Found\n");
            response.end();
            return;
        }
        if (nodeFs.statSync(filename).isDirectory()) {
            filename += '/index.html';
        }
        nodeFs.readFile(filename, "binary", function (err, file) {
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
            };
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
