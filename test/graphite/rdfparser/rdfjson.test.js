/*global assert, buster, define, sinon */
define([
    "src/graphite/rdfparser/rdfjson",
    "src/graphite/dictionary",
    "src/graphite/graph",
    "src/graphite/utils",
    "src/graphite/promise",
    "../../utils"
], function (parser, Dictionary, graph, Utils, Promise, TestUtils) {
    "use strict";
    buster.testCase("Graphite parser (RDF JSON)", {
        "Parser has proper setup": function () {
            assert.defined(parser);
            assert.isFunction(parser);
        },
        "Parser requires valid JSON": function () {
            assert.exception(function () {
                parser();
            });
        },
        "Testing with spy": {
            "Calling triggers a callback": function () {
                var spy = sinon.spy();
                parser({}, {}, spy);
                assert(spy.calledOnce);
            },
            "Calling with empty JSON gives no triples": function (done) {
                parser({}, {}, done(function (graph) {
                    //console.log(graph);
                    assert.equals(graph.statements.length, 0);
                }));
            }
        },
        "Parsing readied JSON": {
            setUp: function (done) {
                this.rdfjson = "http://localhost:8088/rdfjson/parser.rdfjson.test.0001.rdfjson";
                TestUtils.parseJsonFile(this.rdfjson, parser, {}, done(function (graph) {
                    this.graph = graph;
                }.bind(this)));
            },
            "Graph has thirteen statements": function () {
                assert.equals(this.graph.statements.length, 13);
            },
            "Graph has two subjects": function () {
                var spy = sinon.spy();
                graph(this.graph).then(function (g) {
                    g.execute("SELECT ?s WHERE { ?s ?p ?o } GROUP BY ?s", function () {
                        spy();
                    });
                    assert.equals(spy.callCount, 2);
                });
            },
            "First subject has three predicates": function () {
                var spy = sinon.spy();
                graph(this.graph).then(function (g) {
                    g.execute("SELECT ?p WHERE { <http://example.org/about> ?p ?o } GROUP BY ?p", function () {
                        spy();
                    });
                    assert(spy.callCount, 3);
                });
            },
            "First predicate has one object": function () {
                var spy = sinon.spy();
                graph(this.graph).then(function (g) {
                    g.execute("SELECT ?o WHERE { <http://example.org/about> <http://purl.org/dc/elements/1.1/creator> ?o }", function () {
                        spy();
                    });
                    assert(spy.callCount, 1);
                });
            }
        }
    });
});
