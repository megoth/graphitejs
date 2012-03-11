if (typeof module == "object" && typeof require == "function") {
    var buster = require("buster");
    var sinon = require("sinon");
    var graphite = require("./../lib/graphite.core").graphite;
    require("./../lib/graphite.parser");
    require("./../lib/graphite.parser.rdfjson");
}

buster.testCase("Graphite parser (RDF JSON)", {
	setUp: function() {
		this.parser = graphite.parser.rdfjson;
	},
	
	"Parser has proper setup": function() {
		assert.defined(this.parser);
		assert.isFunction(this.parser);
	},
	
	"Parser requires valid JSON": function() {
		assert.exception(function() {
			this.parser();
		}, "TypeError");
	},
	
	"Testing with spy": {
		setUp: function() {
			this.spy = sinon.spy();
		},
	
		tearDown: function() {
			assert.calledOnce(this.spy);
		},
		
		"Calling triggers a callback": function() {
			this.parser({}, this.spy);
		},
	
		"Calling with empty JSON gives an empty graph": function() {
			var spy = this.spy;
			this.parser({}, function(graph) {
				assert.defined(graph);
				assert.defined(graph.subject);
				refute.defined(graph.subject[0]);
				spy();
			});
		},
	
		"Parsing readied JSON": {
			setUp: function() {
				this.json = {
					"http://example.org/about" : {
							"http://purl.org/dc/elements/1.1/creator" : [ { "value" : "Anna Wilder", "type" : "literal" } ],
							"http://purl.org/dc/elements/1.1/title"   : [ { "value" : "Anna's Homepage", "type" : "literal", "lang" : "en" } ] ,
							"http://xmlns.com/foaf/0.1/maker"         : [ { "value" : "_:person", "type" : "bnode" } ]
					} ,
					"_:person" : {
							"http://xmlns.com/foaf/0.1/homepage"      : [ { "value" : "http://example.org/about", "type" : "uri" } ] ,
							"http://xmlns.com/foaf/0.1/age"      			: [ 42 ] ,
							"http://xmlns.com/foaf/0.1/made"          : [ "http://example.org/about" ] ,
							"http://xmlns.com/foaf/0.1/name"          : [ "Anna Wilder" ] ,
							"http://xmlns.com/foaf/0.1/firstName"     : [ { "value" : "Anna", "type" : "literal" } ] ,
							"http://xmlns.com/foaf/0.1/surname"       : [ { "value" : "Wilder", "type" : "literal" } ] , 
							"http://xmlns.com/foaf/0.1/depiction"     : [ { "value" : "http://example.org/pic.jpg", "type" : "uri" } ] ,
							"http://xmlns.com/foaf/0.1/nick"          : [ 
							                                              { "type" : "literal", "value" : "wildling"} , 
							                                              { "type" : "literal", "value" : "wilda" } 
							                                            ] ,
							"http://xmlns.com/foaf/0.1/mbox_sha1sum"  : [ {  "value" : "69e31bbcf58d432950127593e292a55975bc66fd", "type" : "literal" } ] 
					}
				};
			},
	
			"Graph has two subjects": function() {
				var spy = this.spy;
				this.parser(this.json, function(graph) {
					assert.defined(graph.subject);
					assert.isArray(graph.subject);
					assert.equals(graph.subject.length, 2);
					assert.equals(graph.subject[0].value, "http://example.org/about");
					assert.equals(graph.subject[1].value, "_:person");
					spy();
				});
			},
		
			"First subject has three predicates": function() {
				var spy = this.spy;
				this.parser(this.json, function(graph) {
					assert.isArray(graph.subject[0].predicate);
					assert.equals(graph.subject[0].predicate.length, 3);
					assert.equals(graph.subject[0].predicate[0].value, "http://purl.org/dc/elements/1.1/creator");
					assert.equals(graph.subject[0].predicate[1].value, "http://purl.org/dc/elements/1.1/title");
					assert.equals(graph.subject[0].predicate[2].value, "http://xmlns.com/foaf/0.1/maker");
					spy();
				});
			},
		
			"First predicate has one object": function() {
				var spy = this.spy;
				this.parser(this.json, function(graph) {
					assert.isArray(graph.subject[0].predicate[0].object);
					assert.equals(graph.subject[0].predicate[0].object.length, 1);
					assert.equals(graph.subject[0].predicate[0].object[0].value, "Anna Wilder");
					spy();
				});
			},
		
			"Language": function() {
				var spy = this.spy;
				this.parser(this.json, function(graph) {
					assert.equals(graph.subject[0].predicate[1].object[0].lang, "en");
					spy();
				});
			},
		
			"Typing": function() {
				var spy = this.spy;
				this.parser(this.json, function(graph) {
					assert.equals(graph.subject[0].type, "uri");
					assert.equals(graph.subject[0].predicate[0].type, "uri");
					assert.equals(graph.subject[0].predicate[0].object[0].type, "literal");
					assert.equals(graph.subject[0].predicate[2].object[0].type, "bnode");
					assert.equals(graph.subject[1].type, "bnode");
					assert.equals(graph.subject[1].predicate[0].type, "uri");
					assert.equals(graph.subject[1].predicate[0].object[0].type, "uri");
					assert.equals(graph.subject[1].predicate[1].object[0].type, "literal");
					assert.equals(graph.subject[1].predicate[2].object[0].type, "uri");
					assert.equals(graph.subject[1].predicate[3].object[0].type, "literal");
					spy();
				});
			},
		
			"Passing multiple objects": function() {
				var spy = this.spy;
				this.parser(this.json, function(graph) {
					assert.isArray(graph.subject[1].predicate[7].object);
					assert.equals(graph.subject[1].predicate[7].object.length, 2);
					assert.equals(graph.subject[1].predicate[7].object[0].value, "wildling");
					assert.equals(graph.subject[1].predicate[7].object[1].value, "wilda");
					spy();
				});
			}
		}
	}
});
