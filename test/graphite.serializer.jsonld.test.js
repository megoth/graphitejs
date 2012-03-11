if (typeof module == "object" && typeof require == "function") {
    var buster = require("buster");
    var sinon = require("sinon");
    var graphite = require("./../lib/graphite.core").graphite;
    require("./../lib/graphite.serializer");
    require("./../lib/graphite.serializer.jsonld");
}

buster.testCase("Graphite serializer (JSON-LD):", {
	setUp: function() {
		this.serializer = graphite.serializer.jsonld;
	},
	
	"Serializer has proper setup": function() {
		assert.defined(this.serializer);
		assert.isFunction(this.serializer);
	},
	
	"Testing readied graph": {
		setUp: function() {
			var graph = Object.create(graphite.graph);
			graph.init();
			graph.add("http://example.org/about", "http://purl.org/dc/elements/1.1/creator", 
				{ "value" : "Anna Wilder", "type" : "literal" });
			graph.add("http://example.org/about", "http://purl.org/dc/elements/1.1/title", 
				{ "value" : "Anna's Homepage", "type" : "literal", "lang" : "en" });
			graph.add("http://example.org/about", "http://xmlns.com/foaf/0.1/maker", 
				{ "value" : "_:person", "type" : "bnode" });
			graph.add("_:person", "http://xmlns.com/foaf/0.1/homepage", 
				{ "value" : "http://example.org/about", "type" : "uri", "datatype": "http://xmlns.com/foaf/0.1/homepage" });
			graph.add("_:person", "http://xmlns.com/foaf/0.1/nick", 
				{ "type" : "literal", "value" : "wildling" });
			graph.add("_:person", "http://xmlns.com/foaf/0.1/nick", 
				{ "type" : "literal", "value" : "wilda" });
			graph.add("_:person", "http://xmlns.com/foaf/0.1/test", 
				{ "value" : "http://example.org/about", "type" : "uri", "datatype": "http://xmlns.com/foaf/0.1/homepage" });
			this.jsonld = this.serializer(graph);
		},
		
		"Result are produced": function() {
			assert.defined(this.jsonld);
		},
		
		"Subjects are defined and correct": function() {
			assert.defined(this.jsonld[0]);
			assert.defined(this.jsonld[0]["@id"]);
			assert.equals(this.jsonld[0]["@id"], "http://example.org/about");
			assert.equals(this.jsonld[1]["@id"], "_:person");
		},
		
		"Predicates are defined and correct": function() {
			assert.defined(this.jsonld[0]["http://purl.org/dc/elements/1.1/creator"]);
			assert.defined(this.jsonld[0]["http://purl.org/dc/elements/1.1/title"]);
			assert.defined(this.jsonld[0]["http://xmlns.com/foaf/0.1/maker"]);
			assert.defined(this.jsonld[1]["http://xmlns.com/foaf/0.1/homepage"]);
			assert.defined(this.jsonld[1]["http://xmlns.com/foaf/0.1/nick"]);
			assert.defined(this.jsonld[1]["http://xmlns.com/foaf/0.1/test"]);
		},
		
		"Objects are defined and correct": function() {
			assert.equals(this.jsonld[0]["http://purl.org/dc/elements/1.1/creator"], "Anna Wilder");
			assert.equals(this.jsonld[0]["http://purl.org/dc/elements/1.1/title"], 
				{ "@id": "Anna's Homepage", "@lang": "en" });
			assert.equals(this.jsonld[0]["http://xmlns.com/foaf/0.1/maker"], "_:person");
			assert.equals(this.jsonld[1]["http://xmlns.com/foaf/0.1/homepage"],
				{ "@id": "http://example.org/about" });
			assert.equals(this.jsonld[1]["http://xmlns.com/foaf/0.1/nick"], [ "wildling", "wilda" ]);
			assert.equals(this.jsonld[1]["http://xmlns.com/foaf/0.1/test"], 
				{ "@id": "http://example.org/about", "@type": "http://xmlns.com/foaf/0.1/homepage" });
		}
	}
});
