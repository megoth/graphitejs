/*global assert, console, module, refute, require*/
if (typeof module === "object" && typeof require === "function") {
    var buster = require("buster"),
        http = require("http");
}

define(["src/graphite/loader"], function (Loader) {
    buster.testCase("Graphite loader", {
        "Environment supporting XHR": {
            requiresSupportFor: {
                "XHR": typeof (XMLHttpRequest) !== "undefined"
            },
            "Returns a XHR-compatible loader": function () {
                var loader = Loader();
                assert.defined(loader);
                loader.abort();
            }
        },
        "Environment supporting the http-module": {
            requiresSupportFor: {
                "http module": typeof http !== "undefined"
            },
            "Returns a http-loader": function () {
                var loader = Loader();
                assert.defined(loader);
            }
        }
    });

});