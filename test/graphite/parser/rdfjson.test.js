define([
    "src/graphite/parser/rdfjson",
    "src/graphite/dictionary",
    "src/graphite/graph",
    "src/graphite/utils",
    "src/graphite/when",
    "../../utils"
], function(Parser, Dictionary, Graph, Utils, When, TestUtils) {
    "use strict";
    buster.testCase("Graphite parser (RDF JSON)", {
        "Parser has proper setup": function () {
            assert.defined(Parser);
            assert.isFunction(Parser);
        },
        "Parser requires valid JSON": function () {
            assert.exception(function () {
                Parser();
            });
        },
        "Testing with spy": {
            "Calling triggers a callback": function () {
                var spy = sinon.spy();
                Parser({}, {}, spy);
                assert(spy.calledOnce);
            },
            "Calling with empty JSON gives no triples": function (done) {
                Parser({}, {}, done(function (graph) {
                    buster.log(graph);
                    assert.equals(graph.statements.length, 0);
                }));
            }
        },
        "Parsing readied JSON": {
            setUp: function (done) {
                this.rdfjson = "http://localhost:8088/rdfjson/parser.rdfjson.test.0001.rdfjson";
                var tester = this,
                    sub,
                    pre,
                    obj;
                TestUtils.parseJsonFile(this.rdfjson, Parser, done(function (graph) {
                    tester.graph = graph;
                }));
            },
            "Graph has thirteen statements": function () {
                assert.equals(this.graph.statements.length, 13);
            },
            "Graph has two subjects": function () {
                var spy = sinon.spy();
                Graph(this.graph).then(function (g) {
                    g.execute("SELECT ?s WHERE { ?s ?p ?o } GROUP BY ?s", function () {
                        spy();
                    });
                    assert.equals(spy.callCount, 2);
                });
            },
            "First subject has three predicates": function () {
                var spy = sinon.spy();
                Graph(this.graph).then(function (g) {
                    g.execute("SELECT ?p WHERE { <http://example.org/about> ?p ?o } GROUP BY ?p", function () {
                        spy();
                    });
                    assert(spy.callCount, 3);
                });
            },
            "First predicate has one object": function () {
                var spy = sinon.spy();
                Graph(this.graph).then(function (g) {
                    g.execute("SELECT ?o WHERE { <http://example.org/about> <http://purl.org/dc/elements/1.1/creator> ?o }", function () {
                        spy();
                    });
                    assert(spy.callCount, 1);
                });
            }
        }
    });
});
