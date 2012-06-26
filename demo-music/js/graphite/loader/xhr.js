define([
    "../utils"
], function (Utils) {
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
        send: function (callback) {
            //console.log("IN XHR, SENDING", this.options);
            var that = this;
            this.req.open(this.options.method, this.options.uri, this.options.asynchronous);
            this.req.onerror = function () {
                //console.log("IN XHR, ERROR");
                callback("There was an error making the request");
            };
            this.req.onload = function () {
                //console.log("IN XHR, SUCCESS");
                callback(null, that.req.responseText, that.req.status, that.req);
            };
            this.req.ontimeout = function () {
                //console.log("IN XHR, TIMEOUT");
                callback("The request timed out");
            };
            this.req.send();
        }
    };
    xhr.prototype.init.prototype = xhr.prototype;
    return xhr;
});