if (typeof module == "object" && typeof require == "function") {
    var buster = require("buster");
    var sinon = require("sinon");
    var graphite = require("./../lib/graphite.core").graphite;
    require("./../lib/graphite.parser");
    require("./../lib/graphite.parser.jsonld");
    var utils = require("./utils.test");
    mockLoader = utils.mockLoader;
}

buster.testCase("Graphite parser (JSON-LD) tests:", {
	setUp: function() {
		this.prsr = graphite.parser.jsonld;
		this.spy = sinon.spy();
		this.options = {
			loader: mockLoader({
				uri: {
					"http://example.com/people/manu": {
						"GET": '{' +
							'"@id": "http://example.com/people/manu",' +
							'"name": "http://xmlns.com/foaf/spec/name"' +
						"}"
					},
					"http://example.com/people/arne": {
						"GET": '{' +
							'"@id": "http://example.com/people/arne",' +
							'"name": "http://xmlns.com/foaf/spec/name"' +
						"}"
					}
				}
			})
		};
	},
	
	tearDown: function() {
		assert.calledOnce(this.spy);
	},
	
	"Parser requires a valid JSON-object": function() {
		assert.exception(function() {
			this.prsr();
		}, "TypeError");
		assert.exception(function() {
			this.prsr("test");
		}, "TypeError");
		assert.exception(function() {
			this.prsr(1);
		}, "TypeError");
		this.spy();
	},
	
	"Calling triggers a callback": function() {
		this.prsr({}, this.spy);
	},
	
	"Calling with {} returns an empty graph": function() {
		var spy = this.spy;
		this.prsr({}, function(graph) {
			assert.defined(graph);
			assert.defined(graph.subject);
			refute.defined(graph.subject[0]);
			spy();
		});
	},
	
	"Adding multiple triples, same subject": function() {
		var spy = this.spy;
		this.prsr({
			"@id": "http://example.com/people/manu",
			"http://xmlns.com/foaf/spec/name": "Manu Sporny",
			"http://xmlns.com/foaf/spec/age": 42
		}, function(graph) {
			assert.equals(graph.subject[0].value, "http://example.com/people/manu");
			assert.equals(graph.subject[0].predicate[0].value, "http://xmlns.com/foaf/spec/name");
			assert.equals(graph.subject[0].predicate[0].object[0].value, "Manu Sporny");
			assert.equals(graph.subject[0].predicate[1].value, "http://xmlns.com/foaf/spec/age");
			assert.equals(graph.subject[0].predicate[1].object[0].value, 42);
			refute.defined(graph.subject[1]);
			spy();
		});
	},
	
	"Adding multiple triples, same blank node as subject": function() {
		var spy = this.spy;
		this.prsr({
			"http://xmlns.com/foaf/spec/name": "Manu Sporny",
			"http://xmlns.com/foaf/spec/age": 42
		}, function(graph) {
			assert.equals(graph.subject[0].type, "bnode");
			assert.equals(graph.subject[0].predicate[0].value, "http://xmlns.com/foaf/spec/name");
			assert.equals(graph.subject[0].predicate[0].object[0].value, "Manu Sporny");
			assert.equals(graph.subject[0].predicate[1].value, "http://xmlns.com/foaf/spec/age");
			assert.equals(graph.subject[0].predicate[1].object[0].value, 42);
			refute.defined(graph.subject[1]);
			spy();
		});
	},
	
	"Multiple objects": {
		"Different subjects": function() {
			var spy = this.spy;
			this.prsr([
				{
					"http://xmlns.com/foaf/spec/name": "Manu Sporny"
				},
				{
					"@id": "http://example.com/people/manu",
					"http://xmlns.com/foaf/spec/name": "Manu Sporny"
				}
			], function(graph) {
				assert.equals(graph.subject[0].type, "bnode");
				assert.equals(graph.subject[1].type, "uri");
				assert.equals(graph.subject[1].value, "http://example.com/people/manu");
				spy();
			});
		},
		
		"Same subjects": function() {
			var spy = this.spy;
			this.prsr([
				{
					"@id": "http://example.com/people/manu",
					"http://xmlns.com/foaf/spec/name": "Manu Sporny"
				},
				{
					"@id": "http://example.com/people/manu",
					"http://xmlns.com/foaf/spec/age": 12
				}
			], function(graph) {
				assert.equals(graph.subject[0].type, "uri");
				refute.defined(graph.subject[1]);
				spy();
			});
		}
	},
	
	"String as @context": {
		"Single request": function() {
			var spy = this.spy;
			this.prsr({
				"@context": "http://example.com/people/manu",
				"name": "Manu Sporny"
			}, this.options, function(graph) {
				assert.equals(graph.subject[0].value, "http://example.com/people/manu");
				assert.equals(graph.subject[0].predicate[0].value, "http://xmlns.com/foaf/spec/name");
				spy();
			});
		},
	
		"Multiple requests": function() {
			var spy = this.spy;
			this.prsr([{
					"@context": "http://example.com/people/manu",
					"name": "Manu Sporny"
				}, {
					"@context": "http://example.com/people/arne",
					"name": "Arne Hassel"
				}
			], this.options, function(graph) {
				assert.equals(graph.subject[0].value, "http://example.com/people/manu");
				assert.equals(graph.subject[1].value, "http://example.com/people/arne");
				spy();
			});
		}
	},
	
	"Object as @context": {
		"Single-level @context": function() {
			var spy = this.spy;
			this.prsr({
				"@context": 
				{
					"name": "http://xmlns.com/foaf/0.1/name"
				},
				"name": "Manu Sporny"
			}, function(graph) {
				assert.equals(graph.subject[0].predicate[0].value, "http://xmlns.com/foaf/0.1/name");
				spy();
			});
		},
		
		"Objects within objects": function() {
			var spy = this.spy;
			this.prsr(
			{
				"@context":
				{
					"depiction": { "@id": "http://xmlns.com/foaf/0.1/depiction" },
					"homepage": { "@id": "http://xmlns.com/foaf/0.1/homepage" }
				},
				"depiction": "http://twitter.com/account/profile_image/manusporny",
				"homepage": "http://manu.sporny.org/"
			}, function(graph) {
				assert.equals(graph.subject[0].predicate[0].value, "http://xmlns.com/foaf/0.1/depiction");
				assert.equals(graph.subject[0].predicate[1].value, "http://xmlns.com/foaf/0.1/homepage");
				spy();
			});	
		},
		
		"Predicate defined in @context twice, last one valid": function() {
			var spy = this.spy;
			this.prsr(
			{
				"@context":
				{
					"test": "http://xmlns.com/foaf/0.1/depiction",
					"test": { "@id": "http://xmlns.com/foaf/0.1/homepage" }
				},
				"test": "test"
			}, function(graph) {
				assert.equals(graph.subject[0].predicate[0].value, "http://xmlns.com/foaf/0.1/homepage");
				spy();
			});	
		}
	},
	
	"Array as @context": {
		"No conflict": function() {
			var spy = this.spy;
			this.prsr({
				"@context": [
					"http://example.com/people/manu",
					{ "pic": "http://xmlns.com/foaf/0.1/depiction" }
				],
				"pic": "http://twitter.com/account/profile_image/manusporny"
			}, this.options, function(graph) {
				assert.equals(graph.subject[0].value, "http://example.com/people/manu");
				assert.equals(graph.subject[0].predicate[0].value, "http://xmlns.com/foaf/0.1/depiction");
				assert.equals(graph.subject[0].predicate[0].object[0].value, "http://twitter.com/account/profile_image/manusporny");
				spy();
			});
		},
		
		"Conflict, should prefer the latest": function() {
			var spy = this.spy;
			this.prsr({
				"@context": [
					"http://example.com/people/manu",
					{
						"@id": "http://example.com/people/arne",
						"pic": "http://xmlns.com/foaf/0.1/depiction"
					}
				],
				"pic": "http://twitter.com/account/profile_image/manusporny"
			}, this.options, function(graph) {
				assert.equals(graph.subject[0].value, "http://example.com/people/arne");
				assert.equals(graph.subject[0].predicate[0].value, "http://xmlns.com/foaf/0.1/depiction");
				assert.equals(graph.subject[0].predicate[0].object[0].value, "http://twitter.com/account/profile_image/manusporny");
				spy();
			});
		}
	},
	
	"Use of CURIEs": function() {
		var spy = this.spy;
		this.prsr({
			"@context": {
				"foaf": "http://xmlns.com/foaf/0.1/",
				"age": "foaf:age",
				"homepage": { "@id": "foaf:homepage" },
				"testUrl": { "@id": "http://example.com/" },
				"test": { "@id": "testUrl:test" }
			},
			"foaf:name": "Manu Sporny",
			"age": 42,
			"homepage": "http://example.com/",
			"test": "test"
		}, function(graph) {
			assert.equals(graph.subject[0].predicate[0].value, "http://xmlns.com/foaf/0.1/name");
			assert.equals(graph.subject[0].predicate[1].value, "http://xmlns.com/foaf/0.1/age");
			assert.equals(graph.subject[0].predicate[2].value, "http://xmlns.com/foaf/0.1/homepage");
			assert.equals(graph.subject[0].predicate[3].value, "http://example.com/test");
			spy();
		});
	},
	
	"Type tests": {
		"@type on level with subject define its type": function() {
			var spy = this.spy;
			this.prsr({
				"@type": "http://xmlns.com/foaf/0.1/Person"
			}, function(graph) {
				assert.equals(graph.subject[0].predicate[0].value, "http://www.w3.org/1999/02/22-rdf-syntax-ns#type");
				assert.equals(graph.subject[0].predicate[0].object[0].value, "http://xmlns.com/foaf/0.1/Person");
				spy();
			});
		},
		
		"Predicates with type defines the type of the object": function() {
			var spy = this.spy;
			this.prsr({
				"@context": {
					"foaf": "http://xmlns.com/foaf/0.1/",
					"depiction": {
						"@id": "http://xmlns.com/foaf/0.1/depiction",
						"@type": "@id"
					},
					"age": {
						"@id": "foaf:age",
						"@type": "http://www.w3.org/TR/xmlschema-2/#integer"
					},
					"foaf:homepage": {
						"@type": "@id"
					}
				},
				"depiction": "http://twitter.com/account/profile_image/manusporny",
				"age": 12,
				"foaf:homepage": "http://example.com/"
			}, function(graph) {
				assert.equals(graph.subject[0].predicate[0].value, "http://xmlns.com/foaf/0.1/depiction");
				assert.equals(graph.subject[0].predicate[0].object[0].value, "http://twitter.com/account/profile_image/manusporny");
				assert.equals(graph.subject[0].predicate[0].object[0].type, "uri");
				assert.equals(graph.subject[0].predicate[0].object[0].datatype, "http://xmlns.com/foaf/0.1/depiction");
				assert.equals(graph.subject[0].predicate[1].value, "http://xmlns.com/foaf/0.1/age");
				assert.equals(graph.subject[0].predicate[1].object[0].value, 12);
				assert.equals(graph.subject[0].predicate[1].object[0].type, "literal");
				assert.equals(graph.subject[0].predicate[1].object[0].datatype, "http://www.w3.org/TR/xmlschema-2/#integer");
				assert.equals(graph.subject[0].predicate[2].value, "http://xmlns.com/foaf/0.1/homepage");
				assert.equals(graph.subject[0].predicate[2].object[0].value, "http://example.com/");
				assert.equals(graph.subject[0].predicate[2].object[0].type, "uri");
				assert.equals(graph.subject[0].predicate[2].object[0].datatype, "http://xmlns.com/foaf/0.1/homepage");
				spy();
			});	
		},
	
		"Numbers automatically converts to type xsd:integer": function() {
			var spy = this.spy;
			this.prsr({
				"http://xmlns.com/foaf/0.1/age": 12
			}, function(graph) {
				assert.equals(graph.subject[0].predicate[0].object[0].value, 12);
				assert.equals(graph.subject[0].predicate[0].object[0].type, "literal");
				assert.equals(graph.subject[0].predicate[0].object[0].datatype, "http://www.w3.org/TR/xmlschema-2/#integer");
				spy();
			});	
		},
		
		"Decimals automatically converts to type xsd:decimal": function() {
			var spy = this.spy;
			this.prsr({
				"http://xmlns.com/foaf/0.1/age": [ 5.3e0, 5.3 ]
			}, function(graph) {
				assert.equals(graph.subject[0].predicate[0].object[0].value, 5.3e0);
				assert.equals(graph.subject[0].predicate[0].object[0].type, "literal");
				assert.equals(graph.subject[0].predicate[0].object[0].datatype, "http://www.w3.org/TR/xmlschema-2/#double");
				assert.equals(graph.subject[0].predicate[0].object[1].value, 5.3);
				assert.equals(graph.subject[0].predicate[0].object[1].type, "literal");
				assert.equals(graph.subject[0].predicate[0].object[1].datatype, "http://www.w3.org/TR/xmlschema-2/#double");
				assert.equals(graph.subject[0].predicate[0].object[0].value, graph.subject[0].predicate[0].object[1].value);
				spy();
			});	
		},
		
		"Booleans automatically converts to type xsd:boolean": function() {
			var spy = this.spy;
			this.prsr({
				"http://xmlns.com/foaf/0.1/age": [ true, false ]
			}, function(graph) {
				assert.equals(graph.subject[0].predicate[0].object[0].value, true);
				assert.equals(graph.subject[0].predicate[0].object[0].type, "literal");
				assert.equals(graph.subject[0].predicate[0].object[0].datatype, "http://www.w3.org/TR/xmlschema-2/#boolean");
				assert.equals(graph.subject[0].predicate[0].object[1].value, false);
				assert.equals(graph.subject[0].predicate[0].object[1].type, "literal");
				assert.equals(graph.subject[0].predicate[0].object[1].datatype, "http://www.w3.org/TR/xmlschema-2/#boolean");
				spy();
			});	
		}
	},
	
	"Triple within a triple within a triple": function() {
		var spy = this.spy;
		this.prsr({
			"http://xmlns.com/foaf/spec/knows": {
				"http://xmlns.com/foaf/spec/knows": {
					"http://xmlns.com/foaf/spec/name": "Manu Sporny"
				}
			}
		}, function(graph) {
			assert.equals(graph.subject[0].predicate[0].value, "http://xmlns.com/foaf/spec/name");
			assert.equals(graph.subject[1].predicate[0].value, "http://xmlns.com/foaf/spec/knows");
			assert.equals(graph.subject[1].predicate[0].object[0].value, graph.subject[0].value);
			assert.equals(graph.subject[2].predicate[0].value, "http://xmlns.com/foaf/spec/knows");
			assert.equals(graph.subject[2].predicate[0].object[0].value, graph.subject[1].value);
			spy();
		});
	},
	
	"Array as objects": {
		"Literal values": function() {
			var spy = this.spy;
			this.prsr({
				"http://xmlns.com/foaf/spec/nick": [ "test", "test2" ]
			}, function(graph) {
				assert.equals(graph.subject[0].predicate[0].object[0].value, "test");
				assert.equals(graph.subject[0].predicate[0].object[1].value, "test2");
				spy();
			});
		},
		
		"Complex values": function() {
			var spy = this.spy;
			this.prsr({
				"http://xmlns.com/foaf/spec/nick": [{
				  "@value": "Das Kapital",
				  "@language": "de"
				}, {
				  "@value": "Capital",
				  "@language": "en"
				}]
			}, function(graph) {
				assert.equals(graph.subject[0].predicate[0].object[0].value, "Das Kapital");
				assert.equals(graph.subject[0].predicate[0].object[0].lang, "de");
				assert.equals(graph.subject[0].predicate[0].object[1].value, "Capital");
				assert.equals(graph.subject[0].predicate[0].object[1].lang, "en");
				spy();
			});
		}
	},
	
	"Language": {
		"String internationalization": function() {
			var spy = this.spy;
			this.prsr({
				"http://xmlns.com/foaf/spec/nick": {
					"@value": "花澄",
					"@language": "ja"
				}
			}, function(graph) {
				assert.equals(graph.subject[0].predicate[0].value, "http://xmlns.com/foaf/spec/nick");
				assert.equals(graph.subject[0].predicate[0].object[0].value, "花澄");
				assert.equals(graph.subject[0].predicate[0].object[0].lang, "ja");
				spy();
			});
		},
		
		"Default language": function() {
			var spy = this.spy;
			this.prsr({
				"@context": {
					"@language": "ja"
				},
				"http://xmlns.com/foaf/spec/name": "花澄",
				"http://example.com/occupation": [
					{
						"@value": "Scientist",
						"@language": "en"
					},
					{
						"@value": "科学者"
					}
				]
			}, function(graph) {
				assert.equals(graph.subject[0].predicate[0].value, "http://xmlns.com/foaf/spec/name");
				assert.equals(graph.subject[0].predicate[0].object[0].value, "花澄");
				assert.equals(graph.subject[0].predicate[0].object[0].lang, "ja");
				assert.equals(graph.subject[0].predicate[1].value, "http://example.com/occupation");
				assert.equals(graph.subject[0].predicate[1].object[0].value, "Scientist");
				assert.equals(graph.subject[0].predicate[1].object[0].lang, "en");
				assert.equals(graph.subject[0].predicate[1].object[1].value, "科学者");
				assert.equals(graph.subject[0].predicate[1].object[1].lang, "ja");
				spy();
			});
		}
	},
	
	"Lists": function() {
		var spy = this.spy;
		this.prsr({
			"http://xmlns.com/foaf/spec/nick":
			{
				"@list": [ "joe", "bob", "jaybee" ]
			},
		}, function(graph) {
			assert.equals(graph.subject[0].type, "bnode");
			assert.equals(graph.subject[0].predicate[0].object[0].value, "jaybee");
			assert.equals(graph.subject[0].predicate[1].object[0].value, "http://www.w3.org/1999/02/22-rdf-syntax-ns#nil");
			assert.equals(graph.subject[1].type, "bnode");
			assert.equals(graph.subject[1].predicate[0].object[0].value, "bob");
			assert.equals(graph.subject[1].predicate[1].object[0].value, graph.subject[0].value);
			assert.equals(graph.subject[2].type, "bnode");
			assert.equals(graph.subject[2].predicate[0].object[0].value, "joe");
			assert.equals(graph.subject[2].predicate[1].object[0].value, graph.subject[1].value);
			assert.equals(graph.subject[3].type, "bnode");
			assert.equals(graph.subject[3].predicate[0].value, "http://xmlns.com/foaf/spec/nick");
			assert.equals(graph.subject[3].predicate[0].object[0].value, graph.subject[2].value);
			spy();
		});
	}
});
