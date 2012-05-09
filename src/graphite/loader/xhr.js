define(["../utils"], function (Utils) {
    "use strict";
    var xhr = function XHR(options) {
        return new xhr.prototype.init(options);
    };
    xhr.prototype = {
        init: function (options) {
            this.options = Utils.extend({
                "asynchronous": true,
                "method": "GET",
                "uri": window.location
            }, options);
            this.req = new XMLHttpRequest();
            if (this.options.success) {
                this.send(this.options.success);
            }
        },
        abort: function () {
            this.req.abort();
        },
        send: function (callback) {;
            var obj = this;
            this.req.open(this.options.method, this.options.uri, this.options.asynchronous);
            this.req.onerror = function () {
                callback("There was an error making the request");
            };
            this.req.onload = function () {
                callback(null, obj.req.responseText, obj.req.status, obj.req);
            };
            this.req.send();
        }
    };
    xhr.prototype.init.prototype = xhr.prototype;
    return xhr;
});