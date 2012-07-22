/*global assert, buster, define, refute, sinon*/
define([
    "src/graphite/rdfparser/jsonld",
    "src/graphite/utils"
], function (parser, Utils) {
    "use strict";
    buster.testCase("Graphite parser (JSON-LD)", {
        setUp: function () {
            this.uriTwitterManusporny = "http://twitter.com/manusporny";
        },
        "Parser requires a valid JSON-object": function () {
            assert.exception(function () {
                parser();
            });
            assert.exception(function () {
                parser("test");
            });
            assert.exception(function () {
                parser(1);
            });
        },
        "Calling triggers a callback": function () {
            var spy = sinon.spy();
            parser({}, {}, spy);
            assert(spy.calledOnce);
        },
        "Calling with {} returns an empty graph": function () {
            parser({}, {}, function (graph) {
                //console.log(graph);
                assert.equals(graph.statements.length, 0);
            });
        },
        "Adding multiple triples, same subject": function () {
            parser({
                "@id": "http://example.com/people/manu",
                "http://xmlns.com/foaf/spec/name": "Manu Sporny",
                "http://xmlns.com/foaf/spec/age": 42
            }, {}, function (graph) {
                assert.equals(graph.statements.length, 2);
            });
        },
        "Adding multiple triples, same blank node as subject": function () {
            parser({
                "http://xmlns.com/foaf/spec/name": "Manu Sporny",
                "http://xmlns.com/foaf/spec/age": 42
            }, {}, function (graph) {
                assert.equals(graph.statements.length, 2);
                assert.equals(graph.statements[0].subject, graph.statements[1].subject);
            });
        },
        "Multiple objects": {
            "Different subjects": function () {
                parser([
                    {
                        "http://xmlns.com/foaf/spec/name": "Manu Sporny"
                    }, {
                        "@id": "http://example.com/people/manu",
                        "http://xmlns.com/foaf/spec/name": "Manu Sporny"
                    }
                ], {}, function (graph) {
                    assert.equals(graph.statements.length, 2);
                    refute.same(graph.statements[0].subject, graph.statements[1].subject);
                });
            },
            "Same subjects": function () {
                parser([
                    {
                        "@id": "http://example.com/people/manu",
                        "http://xmlns.com/foaf/spec/name": "Manu Sporny"
                    },
                    {
                        "@id": "http://example.com/people/manu",
                        "http://xmlns.com/foaf/spec/age": 12
                    }
                ], {}, function (graph) {
                    assert.equals(graph.statements.length, 2);
                    assert.equals(graph.statements[0].subject, graph.statements[1].subject);
                });
            }
        },
        "String as @context": {
            "Single request": function (done) {
                parser({
                    "@context": "http://localhost:8088/json-ld/people/manu.jsonld",
                    "name": "Manu Sporny"
                }, {}, done(function (graph) {
                    assert.equals(graph.statements.length, 1);
                }));
            },
            "Multiple requests": function (done) {
                parser([{
                    "@context": "http://localhost:8088/json-ld/people/manu.jsonld",
                    "name": "Manu Sporny"
                }, {
                    "@context": "http://localhost:8088/json-ld/people/arne.jsonld",
                    "name": "Arne Hassel"
                }], {}, done(function (graph) {
                    assert.equals(graph.statements.length, 2);
                }));
            }
        },
        "Object as @context": {
            "Single-level @context": function () {
                parser({
                    "@context": {
                        "name": "http://xmlns.com/foaf/0.1/name"
                    },
                    "name": "Manu Sporny"
                }, {}, function (graph) {
                    assert.equals(graph.statements.length, 1);
                });
            },
            "Objects within objects": function () {
                parser({
                    "@context": {
                        "depiction": {
                            "@id": "http://xmlns.com/foaf/0.1/depiction"
                        },
                        "homepage": { "@id": "http://xmlns.com/foaf/0.1/homepage" }
                    },
                    "depiction": this.uriTwitterManusporny,
                    "homepage": "http://manu.sporny.org/"
                }, {}, function (graph) {
                    assert.equals(graph.statements.length, 2);
                });
            },
            "Predicate defined in @context twice, last one valid": function () {
                parser({
                    "@context": {
                        "test": "http://xmlns.com/foaf/0.1/depiction"
                    },
                    "test": "test"
                }, {}, function (graph) {
                    assert.equals(graph.statements.length, 1);
                });
            }
        },
        "Array as @context": {
            "No conflict": function (done) {
                parser({
                    "@context": [
                        "http://localhost:8088/json-ld/people/manu.jsonld",
                        {
                            "pic": "http://xmlns.com/foaf/0.1/depiction"
                        }
                    ],
                    "pic": this.uriTwitterManusporny
                }, {}, done(function (graph) {
                    assert.equals(graph.statements.length, 1);
                }));
            },
            "Conflict, should prefer the latest": function (done) {
                parser({
                    "@context": [
                        "http://localhost:8088/json-ld/people/manu.jsonld",
                        {
                            "@id": "http://example.com/people/arne",
                            "pic": "http://xmlns.com/foaf/0.1/depiction"
                        }
                    ],
                    "pic": this.uriTwitterManusporny
                }, {}, done(function (graph) {
                    assert.equals(graph.statements.length, 1);
                    assert.equals(graph.statements[0].subject.value, "http://example.com/people/arne");
                }));
            }
        },
        "Use of CURIEs": {
            "In graph": function () {
                parser({
                    "@context": {
                        "foaf": "http://xmlns.com/foaf/0.1/",
                        "age": "foaf:age",
                        "homepage": { "@id": "foaf:homepage" },
                        "testUrl": { "@id": "http://example.com/" },
                        "test": { "@id": "testUrl:test" }
                    },
                    "rdf:type": "foaf:test",
                    "foaf:name": "Manu Sporny",
                    "age": 42,
                    "homepage": "http://example.com/",
                    "test": "test"
                }, {}, function (graph) {
                    //console.log(graph);
                    assert.equals(graph.statements.length, 5);
                    assert.equals(graph.statements[0].predicate.value, "http://www.w3.org/1999/02/22-rdf-syntax-ns#type");
                    assert.equals(graph.statements[0].object.value, "http://xmlns.com/foaf/0.1/test");
                    assert.equals(graph.statements[2].predicate.value, "http://xmlns.com/foaf/0.1/age");
                    assert.equals(graph.statements[4].predicate.value, "http://example.com/test");
                });
            },
            "CURIEs in @context are applied to graphs prefixes": function () {
                parser({
                    "@context": {
                        "testA": "http://example.com/",
                        "testB": {
                            "@id": "http://exampleB.com/"
                        }
                    },
                    "@id": "Arne",
                    "testA:test": "TestA",
                    "testB:test": "TestB"
                }, {}, function (graph) {
                    //console.log(graph);
                    assert.equals(graph.statements.length, 2);
                    assert.equals(graph.statements[0].predicate.value, "http://example.com/test");
                    assert.equals(graph.statements[1].predicate.value, "http://exampleB.com/test");
                });
            }
        },
        "Triple within a triple within a triple": function () {
            parser({
                "http://xmlns.com/foaf/spec/knows": {
                    "http://xmlns.com/foaf/spec/knows": {
                        "http://xmlns.com/foaf/spec/name": "Manu Sporny"
                    }
                }
            }, {}, function (graph) {
                //console.log(graph);
                assert.equals(graph.statements.length, 3);
                assert.equals(graph.statements[1].object, graph.statements[0].subject);
                assert.equals(graph.statements[2].object, graph.statements[1].subject);
            });
        },
        "Array as objects": {
            "Literal values": function () {
                parser({
                    "http://xmlns.com/foaf/spec/nick": [ "test", "0:47" ]
                }, {}, function (graph) {
                    assert.equals(graph.statements.length, 2);
                    assert.equals(graph.statements[0].object.value, "test");
                    assert.equals(graph.statements[1].object.value, "0:47");
                });
            },
            "Complex values": function () {
                parser({
                    "http://xmlns.com/foaf/spec/nick": [{
                        "@value": "Das Kapital",
                        "@language": "de"
                    }, {
                        "@value": "Capital",
                        "@language": "en"
                    }]
                }, {}, function (graph) {
                    assert.equals(graph.statements.length, 2);
                    assert.equals(graph.statements[0].object.value, "Das Kapital");
                    assert.equals(graph.statements[1].object.value, "Capital");
                });
            }
        },
        "Language": {
            "String internationalization": function () {
                parser({
                    "http://xmlns.com/foaf/spec/nick": {
                        "@value": "花澄",
                        "@language": "ja"
                    }
                }, {}, function (graph) {
                    assert.equals(graph.statements.length, 1);
                    assert.equals(graph.statements[0].object.lang, "ja");
                });
            },
            "Default language": function () {
                parser({
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
                }, {}, function (graph) {
                    assert.equals(graph.statements.length, 3);
                    assert.equals(graph.statements[0].object.lang, "ja");
                    assert.equals(graph.statements[1].object.lang, "en");
                    assert.equals(graph.statements[2].object.lang, "ja");
                });
            }
        },
        "Lists": function () {
            parser({
                "http://xmlns.com/foaf/spec/nick": {
                    "@list": [ "joe", "bob", "jaybee" ]
                }
            }, {}, function (graph) {
                //console.log(graph);
                Utils.each(graph.statements, function (s, i) {
                    //console.log(i, s);
                });
                assert.equals(graph.statements.length, 10);
                assert.equals(graph.statements[0].predicate.value, "http://www.w3.org/1999/02/22-rdf-syntax-ns#first");
                assert.equals(graph.statements[0].object.value, "jaybee");
                assert.equals(graph.statements[1].predicate.value, "http://www.w3.org/1999/02/22-rdf-syntax-ns#rest");
                assert.equals(graph.statements[1].object.value, "http://www.w3.org/1999/02/22-rdf-syntax-ns#nil");
                assert.equals(graph.statements[2].predicate.value, "http://www.w3.org/1999/02/22-rdf-syntax-ns#type");
                assert.equals(graph.statements[2].object.value, "http://www.w3.org/1999/02/22-rdf-syntax-ns#List");
                assert.equals(graph.statements[3].predicate.value, "http://www.w3.org/1999/02/22-rdf-syntax-ns#first");
                assert.equals(graph.statements[3].object.value, "bob");
                assert.equals(graph.statements[4].predicate.value, "http://www.w3.org/1999/02/22-rdf-syntax-ns#rest");
                assert.equals(graph.statements[4].object, graph.statements[0].subject);
                assert.equals(graph.statements[5].predicate.value, "http://www.w3.org/1999/02/22-rdf-syntax-ns#type");
                assert.equals(graph.statements[5].object.value, "http://www.w3.org/1999/02/22-rdf-syntax-ns#List");
                assert.equals(graph.statements[6].predicate.value, "http://www.w3.org/1999/02/22-rdf-syntax-ns#first");
                assert.equals(graph.statements[6].object.value, "joe");
                assert.equals(graph.statements[7].predicate.value, "http://www.w3.org/1999/02/22-rdf-syntax-ns#rest");
                assert.equals(graph.statements[7].object, graph.statements[4].subject);
                assert.equals(graph.statements[8].predicate.value, "http://www.w3.org/1999/02/22-rdf-syntax-ns#type");
                assert.equals(graph.statements[8].object.value, "http://www.w3.org/1999/02/22-rdf-syntax-ns#List");
                assert.equals(graph.statements[9].object, graph.statements[8].subject);
            });
        }
    });
});
