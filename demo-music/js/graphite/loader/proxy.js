define(["./xhr", "../utils"], function (XHR, Utils) {
    "use strict";
    var proxy = function (options) {
        return new proxy.prototype.init(options);
    };
    proxy.prototype = {
        init: function (options) {
            var proxyUri = Utils.extract(options, "proxy"),
                parts = Utils.parseUri(options.uri),
                success = Utils.extract(options, "success"),
                uri = proxyUri + "?host=" + parts.host;
            if (parts.userInfo !== "") {
                uri += "&auth=" + parts.userInfo;
            }
            if (parts.relative !== "") {
                uri += "&path=" + parts.relative;
            }
            if (parts.port !== "") {
                uri += "&port=" + parts.port;
            }
            options.uri = uri;
            this.xhr = XHR(options);
            if (success) {
                this.send(success);
            }
        },
        abort: function () {
            this.xhr.abort();
        },
        send: function (callback) {
            this.xhr.send(callback);
        }
    };
    proxy.prototype.init.prototype = proxy.prototype;
    return proxy;
});