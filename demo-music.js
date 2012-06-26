/**
 * Code found at http://blog.rassemblr.com/2011/04/a-working-static-file-server-using-node-js/
 */
var nodePath = require('path'),
    nodeHttp = require("http"),
    nodeFs = require('fs'),
    nodeUrl = require("url"),
    mime = require('mime'),
    path = "./",
    port = 9090;
nodeHttp.createServer(function (request, response) {
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
            response.writeHead(200, header);
            response.write(file, "binary");
            response.end();
        });
    });
}).listen(port);
console.log('Demo application v1 running at http://localhost:9090/demo-music');

