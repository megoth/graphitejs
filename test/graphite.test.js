if (typeof module == "object" && typeof require == "function") {
    var buster = require("buster");
    var sinon = require("sinon");
    var graphite = require("./../lib/graphite.core").graphite;
}

buster.testCase("Graphite API tests:", {
	setUp: function() {
		this.graphite = graphite;
	},
	
	"Calling graphite with no url or query returns the API object": function() {
		assert.defined(this.graphite);
		assert.isFunction(this.graphite); 
	}
});
