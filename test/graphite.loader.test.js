if (typeof module == "object" && typeof require == "function") {
    var buster = require("buster");
    var sinon = require("sinon");
    var graphite = require("./../lib/graphite.core").graphite;
    require("./../lib/graphite.loader");
    var utils = require("./utils.test");
    mockLoader = utils.mockLoader;
}

if (typeof module == "object" && typeof require == "function") {
    var buster = require("buster");
    var sinon = require("sinon");
    var graphite = require("./../lib/graphite.core").graphite;
}

buster.testCase("Graphite loader tests:", {
	"Single request": {
		"Callback is called upon a successful result": function() {
			var spy = sinon.spy();
			var loader = mockLoader({ success: spy });
			loader.send();
			assert.called(spy);
		},
	
		"Callback returns mocked result": function() {
			var response = "test";
			var spy = sinon.spy();
			var loader = mockLoader({
				success: function(result) {
					assert.equals(result, response);
					spy();
				},
				uri: {
					"http://localhost/": {
						"GET": response
					}
				}
			});
			loader.open("GET", "http://localhost/");
			loader.send();
			assert.called(spy);
		}
	},
	
	"Multiple requests to different uri": {
		"Callback is called upon a successful result": function() {
			var spy = sinon.spy();
			var loader = mockLoader({ success: spy });
			loader.send();
			assert.called(spy);
		},
	
		"Callback returns mocked result": function() {
			var response1 = "test1",
				response2 = "test2",
				spy = sinon.spy(),
				loader = mockLoader({
					uri: {
						"http://localhost/": {
							"GET": response1
						},
						"http://localhost/2": {
							"GET": response2
						}
					}
				});
			loader.open("GET", "http://localhost/");
			loader.onload(function(result) {
				assert.equals(result, response1);
				spy();
			});
			loader.send();
			loader.open("GET", "http://localhost/2");
			loader.onload(function(result) {
				assert.equals(result, response2);
				spy();
			});
			loader.send();
			assert.calledTwice(spy);
		}
	}
});
