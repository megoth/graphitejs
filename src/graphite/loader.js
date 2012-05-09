if (typeof module === "object" && typeof require === "function") {
	var ModuleHttp = require("http");
}
define(["./loader/http", "./loader/xhr", "./loader/proxy", "./utils"], function (HTTP, XHR, Proxy, Utils) {
    return function (options) {
        var support = {
            "http": typeof ModuleHttp !== "undefined",
            "xhr": typeof XMLHttpRequest !== "undefined"
        };
        options = Utils.extend({
            "followRedirect": false
        }, options);
        if(support["http"]) {
            return HTTP(options);
        } else if(support["xhr"] && options.proxy) {
            return Proxy(options);
        } else if(support["xhr"]) {
            return XHR(options);
        } else {
            throw "Your running environment doesn't support the loader";
        }
    };
});