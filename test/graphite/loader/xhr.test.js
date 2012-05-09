/*global assert, module, refute, require, XMLHttpRequest*/
if (typeof module === "object" && typeof require === "function") {
	var buster = require("buster");
}

define(["src/graphite/loader/xhr"], function (XHR) {
    buster.testCase("Graphite loader (XHR)", {
        requiresSupportFor: {
            "XHR": typeof (XMLHttpRequest) !== "undefined"
        },
        setUp: function () {
            "use strict";
        },
        "Module is available": function () {
            "use strict";
            assert.defined(XHR);
        },
        "Options are parsed correctly": function () {
            "use strict";
            var loader = XHR({
                "uri": "http://localhost:8088/"
            });
            loader.abort();
            assert(loader.options.asynchronous);
            assert.equals(loader.options.method, "GET");
            assert.equals(loader.options.uri, "http://localhost:8088/");
        },
        "Retrieving data with AJAX": function (done) {
            "use strict";
            XHR({
                "uri": "http://localhost:8088/helloworld.txt",
                "success": done(function (err, result, status, client) {
                    assert.equals(status, 200);
                    assert.equals(client.readyState, 4);
                })
            });
        },
        "Testing CORS": {
            requiresSupportFor: {
                "CORS": function () {
                    "use strict";
                    var xhr = new XMLHttpRequest();
                    return xhr.hasOwnProperty("withCredentials");
                }
            },
            "Requiring localhost:8088/helloworld.txt": function (done) {
                "use strict";
                XHR({
                    "uri": "http://localhost:8088/helloworld.txt",
                    "success": done(function (err, result, status, client) {
                        refute(err);
                        assert.equals(result, "Hello World\n");
                        assert.equals(status, 200);
                        assert.equals(client.getResponseHeader("Content-Type"),
                            "text/plain");
                    })
                });
            }
        }
    });
});