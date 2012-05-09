/*global assert, buster, graphite, module, require*/
if (typeof module === "object" && typeof require === "function") {
    var buster = require("buster");
    var sinon = require("sinon");
}

define([
    "src/graphite/parser/jsonld"
], function (Parser) {
    buster.testCase("Graphite parser (JSON-LD)", {
        setUp: function () {
            this.uriTwitterManusporny = "http://twitter.com/manusporny";
        },
        "Parser requires a valid JSON-object": function () {
            assert.exception(function () {
                Parser();
            });
            assert.exception(function () {
                Parser("test");
            });
            assert.exception(function () {
                Parser(1);
            });
        },
        "Calling triggers a callback": function () {
            var spy = sinon.spy();
            Parser({}, {}, spy);
            assert(spy.calledOnce);
        },
        "Calling with {} returns an empty graph": function () {
            Parser({}, {}, function (graph) {
                buster.log(graph);
                assert.equals(graph.statements.length, 0);
            });
        },
        "Adding multiple triples, same subject": function () {
            Parser({
                "@id": "http://example.com/people/manu",
                "http://xmlns.com/foaf/spec/name": "Manu Sporny",
                "http://xmlns.com/foaf/spec/age": 42
            }, {}, function (graph) {
                assert.equals(graph.statements.length, 2);
            });
        },
        "Adding multiple triples, same blank node as subject": function () {
            Parser({
                "http://xmlns.com/foaf/spec/name": "Manu Sporny",
                "http://xmlns.com/foaf/spec/age": 42
            }, {}, function (graph) {
                assert.equals(graph.statements.length, 2);
            });
        },
        "//Multiple objects": {
            "Different subjects": function () {
                "use strict";
                Parser([{
                    "http://xmlns.com/foaf/spec/name": "Manu Sporny"
                }, {
                    "@id": "http://example.com/people/manu",
                    "http://xmlns.com/foaf/spec/name": "Manu Sporny"
                }], {}, function (triples) {
                    assert.equals(triples.length, 2);
                });
            },
            "Same subjects": function () {
                "use strict";
                Parser([
                    {
                        "@id": "http://example.com/people/manu",
                        "http://xmlns.com/foaf/spec/name": "Manu Sporny"
                    },
                    {
                        "@id": "http://example.com/people/manu",
                        "http://xmlns.com/foaf/spec/age": 12
                    }
                ], {}, function (triples) {
                    assert.equals(triples.length, 2);
                });
            }
        },
        "//String as @context": {
            "Single request": function (done) {
                "use strict";
                Parser({
                    "@context": "http://localhost:8088/json-ld/people/manu.jsonld",
                    "name": "Manu Sporny"
                }, {}, done(function (triples) {
                    assert.equals(triples.length, 1);
                }));
            },
            "Multiple requests": function (done) {
                "use strict";
                Parser([{
                    "@context": "http://localhost:8088/json-ld/people/manu.jsonld",
                    "name": "Manu Sporny"
                }, {
                    "@context": "http://localhost:8088/json-ld/people/arne.jsonld",
                    "name": "Arne Hassel"
                }], {}, done(function (triples) {
                    assert.equals(triples.length, 2);
                }));
            }
        },
        "//Object as @context": {
            "Single-level @context": function () {
                "use strict";
                Parser({
                    "@context": {
                        "name": "http://xmlns.com/foaf/0.1/name"
                    },
                    "name": "Manu Sporny"
                }, {}, function (triples) {
                    assert.equals(triples.length, 1);
                });
            },
            "Objects within objects": function () {
                "use strict";
                Parser({
                    "@context": {
                        "depiction": {
                            "@id": "http://xmlns.com/foaf/0.1/depiction"
                        },
                        "homepage": { "@id": "http://xmlns.com/foaf/0.1/homepage" }
                    },
                    "depiction": this.uriTwitterManusporny,
                    "homepage": "http://manu.sporny.org/"
                }, {}, function (triples) {
                    assert.equals(triples.length, 2);
                });
            },
            "Predicate defined in @context twice, last one valid": function () {
                "use strict";
                Parser({
                    "@context": {
                        "test": "http://xmlns.com/foaf/0.1/depiction"
                    },
                    "test": "test"
                }, {}, function (triples) {
                    assert.equals(triples.length, 1);
                });
            }
        },
        "//Array as @context": {
            "No conflict": function (done) {
                "use strict";
                Parser({
                    "@context": [
                        "http://localhost:8088/json-ld/people/manu.jsonld",
                        {
                            "pic": "http://xmlns.com/foaf/0.1/depiction"
                        }
                    ],
                    "pic": this.uriTwitterManusporny
                }, {}, done(function (triples) {
                    assert.equals(triples.length, 1);
                }));
            },
            "Conflict, should prefer the latest": function (done) {
                "use strict";
                Parser({
                    "@context": [
                        "http://localhost:8088/json-ld/people/manu.jsonld",
                        {
                            "@id": "http://example.com/people/arne",
                            "pic": "http://xmlns.com/foaf/0.1/depiction"
                        }
                    ],
                    "pic": this.uriTwitterManusporny
                }, {}, done(function (triples) {
                    assert.equals(triples.length, 1);
                }));
            }
        },
        "//Use of CURIEs": {
            "In graph": function () {
                "use strict";
                var statements;
                Parser({
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
                }, {}, function (triples) {
                    assert.equals(triples.length, 5);
                });
            },
            "CURIEs in @context are applied to graphs prefixes": function () {
                "use strict";
                var subject;
                Parser({
                    "@context": {
                        "testA": "http://example.com/",
                        "testB": {
                            "@id": "http://exampleB.com/"
                        }
                    },
                    "@id": "Arne",
                    "testA:test": "TestA",
                    "testB:test": "TestB"
                }, {}, function (triples) {
                    assert.equals(triples.length, 2);
                });
            }
        },
        "//Triple within a triple within a triple": function () {
            Parser({
                "http://xmlns.com/foaf/spec/knows": {
                    "http://xmlns.com/foaf/spec/knows": {
                        "http://xmlns.com/foaf/spec/name": "Manu Sporny"
                    }
                }
            }, {}, function (triples) {
                assert.equals(triples.length, 3);
            });
        },
        "//Array as objects": {
            "Literal values": function () {
                "use strict";
                Parser({
                    "http://xmlns.com/foaf/spec/nick": [ "test", "test2" ]
                }, {}, function (triples) {
                    assert.equals(triples.length, 2);
                });
            },
            "Complex values": function () {
                "use strict";
                Parser({
                    "http://xmlns.com/foaf/spec/nick": [{
                        "@value": "Das Kapital",
                        "@language": "de"
                    }, {
                        "@value": "Capital",
                        "@language": "en"
                    }]
                }, {}, function (triples) {
                    assert.equals(triples.length, 2);
                });
            }
        },
        "//Language": {
            "String internationalization": function () {
                "use strict";
                Parser({
                    "http://xmlns.com/foaf/spec/nick": {
                        "@value": "花澄",
                        "@language": "ja"
                    }
                }, {}, function (triples) {
                    assert.equals(triples.length, 1);
                });
            },
            "Default language": function () {
                "use strict";
                Parser({
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
                }, {}, function (triples) {
                    assert.equals(triples.length, 3);
                });
            }
        },
        "//Lists": function () {
            var statements;
            Parser({
                "http://xmlns.com/foaf/spec/nick": {
                    "@list": [ "joe", "bob", "jaybee" ]
                }
            }, {}, function (triples) {
                assert.equals(triples.length, 13);
            });
        }
    });
});
