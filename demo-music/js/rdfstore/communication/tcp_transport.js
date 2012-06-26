/*global module, require*/
if (typeof module === "object" && typeof require === "function") {
    var http = require("http");
    var https = require("https");
    var url = require("url");
}

define([], function () {
    var NetworkTransport = {};
    NetworkTransport.load = function(uri, accept, callback, redirect) {
        var redirection = redirect==null ? 3 : redirect;
        var parts = url.parse(uri, true, true);

        var params = {
            'host': parts.host,
            'hostname': parts.hostname,
            'method': 'GET',
            'path': parts.path,
            'headers': {
                'host': parts.hostname,
                'Accept':accept
            }
        };

        var client = null;

        if(parts.protocol === 'http:') {
            params.port = (parts.port || 80),
                client = http;
        } else if(parts.protocol === 'https:') {
            params.port = (parts.port || 443),
                client = https;
        }

        var request = client.request(params, function(response){
            var headers = response.headers;
            var data = "";

            if((""+response.statusCode)[0] == '2') {
                response.on('end', function() {
                    callback(true, {headers: headers, data: data});
                });
                response.on('data', function(chunk) {
                    data = data + chunk;
                });
            } else if((""+response.statusCode)[0] == '3'){
                if(redirection == 0) {
                    callback(false, 500);
                } else {
                    var location = (headers["Location"] || headers["location"]);
                    if(location != null) {
                        NetworkTransport.load(location, accept, callback, (redirection -1));
                    } else {
                        callback(false, 500);
                    }
                }
            } else {
                callback(false, response.statusCode);
            }
        });

        request.on('error', function(e) {
            //console.log('problem with request: ' + e.message);
        });

        request.end();
    };
    return NetworkTransport;
});