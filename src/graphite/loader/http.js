if (typeof module === "object" && typeof require === "function") {
	var moduleHttp = require("http");
	var moduleUrl = require("url");
}

define(["../utils"], function (Utils) {
    var http = function (options) {
        return new http.prototype.init(options);
    };
    http.prototype = {
        init: function (options) {
            this.options = getOptions(options);
            if(this.options.success) {
                send.call(this, this.options.success);
            }
        },
        send: send
    }
    http.prototype.init.prototype = http.prototype;

    function send (callback) {
        var obj = this,
            status,
            headers,
            result = "",
            req = moduleHttp.request(obj.options, function (res) {
                status = res.statusCode;
                headers = res.headers;
                if(obj.options.followRedirect && headers.location) {
                    obj.options = getOptions({
                        "uri": headers.location
                    });
                    return obj.send(callback);
                }
                res.setEncoding('utf8');
                res.on('data', function (chunk) {
                    result += chunk;
                });
                res.on('end', function () {
                    callback(null, result, status, res);
                });
            });
        req.on('error', function (e) {
            callback(e.message);
        });
        req.end();
    };

    function getOptions(options) {
        var opts = {
                followRedirect: false
            },
            uri = Utils.extract(options, "uri");
        if(uri && Utils.isUri(uri)) {
            Utils.extend(opts, moduleUrl.parse(uri));
        } else if(uri) {
            throw "Not a valid uri given to loader";
        }
        return Utils.extend(opts, options);
    }
    return http;
});