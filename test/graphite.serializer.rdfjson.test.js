if (typeof module == "object" && typeof require == "function") {
    var buster = require("buster");
    var sinon = require("sinon");
    var graphite = require("./../lib/graphite.core").graphite;
    require("./../lib/graphite.serializer");
    require("./../lib/graphite.serializer.rdfjson");
}

buster.testCase("Graphite serializer (RDF JSON):", {
	setUp: function() {
		this.serializer = graphite.serializer.rdfjson;
	},
	
	"Serializer has proper setup": function() {
		assert.defined(this.serializer);
		assert.isFunction(this.serializer);
	},
	
	"Testing readied graph": {
		setUp: function() {
			var graph = Object.create(graphite.graph);
			graph.init();
			graph.add("http://example.org/about", "http://purl.org/dc/elements/1.1/creator", { "value" : "Anna Wilder", "type" : "literal" });
			graph.add("http://example.org/about", "http://purl.org/dc/elements/1.1/title", { "value" : "Anna's Homepage", "type" : "literal", "lang" : "en" });
			graph.add("http://example.org/about", "http://xmlns.com/foaf/0.1/maker", { "value" : "_:person", "type" : "bnode" });
			graph.add("_:person", "http://xmlns.com/foaf/0.1/homepage", { "value" : "http://example.org/about", "type" : "uri" });
			graph.add("_:person", "http://xmlns.com/foaf/0.1/nick", { "type" : "literal", "value" : "wildling"});
			graph.add("_:person", "http://xmlns.com/foaf/0.1/nick", { "type" : "literal", "value" : "wilda"});
			this.rdfjson = this.serializer(graph);
		},
		
		"Subjects are defined": function() {
			assert.defined(this.rdfjson["http://example.org/about"]);
			assert.defined(this.rdfjson["_:person"]);
		},
		
		"Predicates are defined": function() {
			assert.defined(this.rdfjson["http://example.org/about"]["http://purl.org/dc/elements/1.1/creator"]);
			assert.defined(this.rdfjson["http://example.org/about"]["http://purl.org/dc/elements/1.1/title"]);
			assert.defined(this.rdfjson["http://example.org/about"]["http://xmlns.com/foaf/0.1/maker"]);
			assert.defined(this.rdfjson["_:person"]["http://xmlns.com/foaf/0.1/homepage"]);
			assert.defined(this.rdfjson["_:person"]["http://xmlns.com/foaf/0.1/nick"]);
		},
		
		"Objects are defined": function() {
			assert.defined(this.rdfjson["http://example.org/about"]["http://purl.org/dc/elements/1.1/creator"][0]);
			assert.defined(this.rdfjson["http://example.org/about"]["http://purl.org/dc/elements/1.1/title"][0]);
			assert.defined(this.rdfjson["http://example.org/about"]["http://xmlns.com/foaf/0.1/maker"][0]);
			assert.defined(this.rdfjson["_:person"]["http://xmlns.com/foaf/0.1/homepage"][0]);
			assert.defined(this.rdfjson["_:person"]["http://xmlns.com/foaf/0.1/nick"][0]);
			assert.defined(this.rdfjson["_:person"]["http://xmlns.com/foaf/0.1/nick"][1]);
		},
		
		"Objects have correct value": function() {
			assert.equals(this.rdfjson["http://example.org/about"]["http://purl.org/dc/elements/1.1/creator"][0]["value"], "Anna Wilder");
			assert.equals(this.rdfjson["http://example.org/about"]["http://purl.org/dc/elements/1.1/title"][0]["value"], "Anna's Homepage");
			assert.equals(this.rdfjson["http://example.org/about"]["http://xmlns.com/foaf/0.1/maker"][0]["value"], "_:person");
			assert.equals(this.rdfjson["_:person"]["http://xmlns.com/foaf/0.1/homepage"][0]["value"], "http://example.org/about");
			assert.equals(this.rdfjson["_:person"]["http://xmlns.com/foaf/0.1/nick"][0]["value"], "wildling");
			assert.equals(this.rdfjson["_:person"]["http://xmlns.com/foaf/0.1/nick"][1]["value"], "wilda");
		},
		
		"Objects have correct types": function() {
			assert.equals(this.rdfjson["http://example.org/about"]["http://purl.org/dc/elements/1.1/creator"][0]["type"], "literal");
			assert.equals(this.rdfjson["http://example.org/about"]["http://purl.org/dc/elements/1.1/title"][0]["type"], "literal");
			assert.equals(this.rdfjson["http://example.org/about"]["http://xmlns.com/foaf/0.1/maker"][0]["type"], "bnode");
			assert.equals(this.rdfjson["_:person"]["http://xmlns.com/foaf/0.1/homepage"][0]["type"], "uri");
			assert.equals(this.rdfjson["_:person"]["http://xmlns.com/foaf/0.1/nick"][0]["type"], "literal");
			assert.equals(this.rdfjson["_:person"]["http://xmlns.com/foaf/0.1/nick"][1]["type"], "literal");
		},
		
		"Objects have correct languages": function() {
			assert.defined(this.rdfjson["http://example.org/about"]["http://purl.org/dc/elements/1.1/title"][0]["lang"], "en");
		}
	}
});
