/*global assert, module, refute, require, XMLHttpRequest*/
if (typeof module === "object" && typeof require === "function") {
    var buster = require("buster");
}

define(["src/graphite/loader/proxy"], function (Proxy) {
    buster.testCase("Graphite loader (proxy)", {
        requiresSupportFor: {
            "XHR": function () {
                return typeof (XMLHttpRequest) !== "undefined";
            },
            "CORS": function () {
                "use strict";
                var xhr = new XMLHttpRequest();
                return xhr.hasOwnProperty("withCredentials");
            }
        },
        setUp: function () {
            "use strict";
        },
        "The proxy-url is assembled correctly": function () {
            "use strict";
            var loader = Proxy({
                uri: "http://usr:pwd@www.google.com:81/dir/dir.2/index.htm?q1=0&&test1&test2=value#top",
                proxy: "http://localhost:1337"
            });
            loader.abort();
            assert.equals(loader.xhr.options.uri, "http://localhost:1337?host=www.google.com&auth=usr:pwd&path=/dir/dir.2/index.htm?q1=0&&test1&test2=value#top&port=81");
        },
        "Calling the proxy": function (done) {
            "use strict";
            Proxy({
                uri: "http://localhost:8088/helloworld.txt",
                proxy: "http://localhost:1337",
                success: done(function (err, result, status, client) {
                    assert.equals(result, "Hello World\n");
                    assert.equals(status, 200);
                    assert.equals(client.getResponseHeader("Content-Type"), "text/plain");
                })
            });
        }
        /*
        "//Calling a non-CORS-friend url": function (done) {
            "use strict";
            Proxy({
                uri: "http://localhost:8088/nocors.txt",
                proxy: "http://localhost:1337",
                success: done(function (err, result, status, client) {
                    assert.isNull(err);
                    assert.equals(result, "Hello non-CORS-friendly world\n");
                    assert.equals(status, 200);
                    assert.equals(client.getResponseHeader("Content-Type"), "text/plain");
                })
            });
        }
        */
    });
});