/*global define*/
define([
    "./loader/http",
    "./loader/xhr",
    "./loader/proxy",
    "./utils"
], function (HTTP, XHR, Proxy, Utils) {
    "use strict";
    /**
     * @param {Object} options
     * <ul>
     *     <li>asynchronous: whether to load resource asynchronously or not; default set to true</li>
     *     <li>method: which HTTP verb to call resource with; default set to GET</li>
     *     <li>success: function to call if uri is successfully loaded; by default undefined. Function
     *     has parameters err, data, status, headers</li>
     *     <li>uri: adress to load resource from; by default set to document's URI</li>
     * </ul>
     */
    return function (options) {
        //console.log("IN LOADER", options);
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