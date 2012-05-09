/*global assert, console, module, require*/

if (typeof module === "object" && typeof require === "function") {
	var buster = require("buster");
	var sinon = require("sinon");
	var graphite = require("../.././graphite/core.js").graphite;
	require("../.././graphite/utils.js");
	require("../.././graphite/loader.js");
	require("../.././graphite/loader/http.js");
	var http = require("http");
}

buster.testCase("Graphite loader (http)", {
	requiresSupportFor: {
		"http module": typeof http !== "undefined"
	},
	setUp: function () {
		"use strict";
		this.loader = graphite.loader.http;
	},
	"Module is available": function () {
		"use strict";
		assert.defined(this.loader);
	},
	"Options are parsed correctly": function () {
		"use strict";
		var loader = new this.loader({
			uri: "http://localhost:8088/helloworld.txt"
		});
		assert.equals(loader.options.protocol, "http:");
		assert.equals(loader.options.slashes, true);
		assert.equals(loader.options.host, "localhost:8088");
		assert.equals(loader.options.href,
			"http://localhost:8088/helloworld.txt");
		assert.equals(loader.options.pathname, "/helloworld.txt");
		assert.equals(loader.options.path, "/helloworld.txt");
	},
	"Requiring localhost/static/helloworld.txt": function (done) {
		"use strict";
		graphite.create(this.loader, {
			uri: "http://localhost:8088/helloworld.txt",
			success: done(function (err, result, status, response) {
				assert.equals(result, "Hello World\n");
				assert.equals(status, 200);
				assert.equals(response.headers["content-type"], "text/plain");
			})
		});
	}
});
