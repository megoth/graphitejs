/*global assert, console, module, refute, require*/
if (typeof module === "object" && typeof require === "function") {
    var buster = require("buster");
    var sinon = require("sinon");
}

define([
    "src/graphite/graph",
    "src/graphite/dictionary",
    "src/graphite/query",
    "src/graphite/utils",
    "src/graphite/promise"
], function (Graph, Dictionary, Query, Utils, Promise) {
    "use strict";
    var subJohn = Dictionary.Symbol("http://dbpedia.org/resource/John_Lennon"),
        preName = Dictionary.Symbol("http://xmlns.com/foaf/0.1/name"),
        objJohnName = Dictionary.Literal("John Lennon"),
        subTim = Dictionary.Symbol("http://dbpedia.org/resource/Tim_B_Lee"),
        preKnows = Dictionary.Symbol("http://xmlns.com/foaf/0.1/knows"),
        blank1 = Dictionary.BlankNode(),
        blank2 = Dictionary.BlankNode(),
        graph1 = Dictionary.Formula(),
        graph2 = Dictionary.Formula(),
        graph3 = Dictionary.Formula();
    graph1.add(subJohn, preName, objJohnName);
    graph1.add(blank1, preName, subJohn);
    graph1.add(blank2, preName, 42);
    graph1.add(subTim, preName, blank1);
    graph2.add(subJohn, preKnows, subTim);
    graph3.add(subJohn, preName, objJohnName);
    graph3.add(blank1, preName, subJohn);
    graph3.add(blank2, preName, 42);
    graph3.add(subTim, preName, blank1);
    graph3.add(subJohn, preKnows, subTim);
    graph3.add(blank1, preKnows, subTim);
    graph3.add(blank1, preKnows, 42);
    buster.testCase("Graphite graph", {
        setUp: function () {
            this.graph = Graph();
        },
        ".init": {
            "Graph has no triples to begin with": function () {
                this.graph.size(function (size) {
                    assert.equals(size, 0);
                });
            }
        },
        ".clone": function (done) {
            var g1Size = Promise.defer(),
                g2Size = Promise.defer(),
                g3Size = Promise.defer(),
                g4Size = Promise.defer(),
                g1 = this.graph.size(function (size) {
                    g1Size.resolve(size);
                }),
                g2 = g1.clone().size(function (size) {
                    g2Size.resolve(size);
                }),
                g3 = Graph(graph1).size(function (size) {
                    g3Size.resolve(size);
                }),
                g4 = g3.clone().size(function (size) {
                    g4Size.resolve(size);
                });
            Promise.all([ g1Size, g2Size, g3Size, g4Size ]).then(done(function (sizes) {
                assert.equals(sizes[0], sizes[1]);
                refute.same(g1, g2);
                assert.equals(sizes[2], sizes[3]);
                refute.same(g3, g4);
            }));
        },
        "//.execute": {
            setUp: function () {
                buster.testRunner.timeout = 2000;
            },
            "ASK query": function (done) {
                var ask1 = Promise.defer(),
                    ask2 = Promise.defer(),
                    gSize = Promise.defer();
                Graph(graph1)
                    .execute("ASK { " + graph1.statements[0].toNT() + " }", function (answer) {
                        ask1.resolve(answer);
                    })
                    .execute("ASK " + graph2.toNT(), function (answer) {
                        ask2.resolve(answer);
                    })
                    .size(function (size) {
                        gSize.resolve(size);
                    });
                Promise.all([ ask1, ask2, gSize ]).then(done(function (results) {
                    assert.equals(results[0], true);
                    assert.equals(results[1], false);
                    assert.equals(results[2], 4);
                }));
            },
            "CONSTRUCT query": function (done) {
                var g1Size = Promise.defer(),
                    g2Size = Promise.defer(),
                    g3Size = Promise.defer(),
                    g4Size = Promise.defer(),
                    query1 = Query("CONSTRUCT { ?s ?p ?o } WHERE { ?s ?p ?o }"),
                    query2 = Query("CONSTRUCT { ?s ?p 43 } WHERE { ?s ?p 42 }");
                Graph(graph1)
                    .execute(query1, function (g) {
                        g.size(function (size) {
                            g1Size.resolve(size);
                        });
                    })
                    .size(function (size) {
                        g2Size.resolve(size);
                    })
                    .execute(query2, function (g) {
                        g.size(function (size) {
                            g3Size.resolve(size);
                        });
                    })
                    .size(function (size) {
                        g4Size.resolve(size);
                    });
                Promise.all([ g1Size, g2Size, g3Size, g4Size ]).then(done(function (results) {
                    //console.log("SIZES", results);
                    assert.equals(results[0], 4);
                    assert.equals(results[1], 4);
                    assert.equals(results[2], 1);
                    assert.equals(results[3], 4);
                }));
            },
            "INSERT query": function (done) {
                var g1Size = Promise.defer(),
                    g2Size = Promise.defer(),
                    g3Size = Promise.defer(),
                    g4Size = Promise.defer(),
                    query1 = Query('INSERT DATA ' + graph1.toNT()),
                    query2 = Query('INSERT DATA ' + graph2.toNT());
                this.graph
                    .execute(query1, function (g1) {
                        g1.size(function (size) {
                            g1Size.resolve(size);
                        });
                    })
                    .size(function (size) {
                        g2Size.resolve(size);
                    })
                    .execute(query2, function (g3) {
                        g3.size(function (size) {
                            g3Size.resolve(size);
                        });
                    })
                    .size(function (size) {
                        g4Size.resolve(size);
                    });
                Promise.all([ g1Size, g2Size, g3Size, g4Size ]).then(done(function (sizes) {
                    //console.log("TEST", sizes);
                    assert.equals(sizes[0], 4);
                    assert.equals(sizes[1], 4);
                    assert.equals(sizes[2], 1);
                    assert.equals(sizes[3], 5);
                }));
            },
            "LOAD query": function (done) {
                var g1Size = Promise.defer(),
                    g2Size = Promise.defer(),
                    g3Size = Promise.defer(),
                    g4Size = Promise.defer(),
                    query1 = Query('LOAD <http://localhost:8088/rdfjson/manu.rdfjson>'),
                    query2 = Query('LOAD <http://localhost:8088/rdfjson/arne.rdfjson>');
                this.graph
                    .execute(query1, function (g1) {
                        g1.size(function (size) {
                            //console.log("G1 SIZE", size);
                            g1Size.resolve(size);
                        });
                    })
                    .size(function (size) {
                        //console.log("G2 SIZE", size);
                        g2Size.resolve(size);
                    })
                    .execute(query2, function (g3) {
                        g3.size(function (size) {
                            //console.log("G3 SIZE", size);
                            g3Size.resolve(size);
                        });
                    })
                    .size(function (size) {
                        //console.log("G4 SIZE", size);
                        g4Size.resolve(size);
                    });
                Promise.all([ g1Size, g2Size, g3Size, g4Size ]).then(done(function (sizes) {
                    //console.log("SIZES", sizes);
                    assert.equals(sizes[0], 2);
                    assert.equals(sizes[1], 2);
                    assert.equals(sizes[2], 1);
                    assert.equals(sizes[3], 3);
                }));
            },
            "SELECT query": function (done) {
                var spy1 = sinon.spy(),
                    spy2 = sinon.spy(),
                    spy3 = sinon.spy();
                Graph(graph1)
                    .execute(Query("SELECT * WHERE { ?s ?p ?o }"), spy1)
                    .execute(Query("SELECT ?s WHERE { ?s ?p ?o }"), spy2)
                    .execute(Query('SELECT ?s WHERE { ?s ?p 42 }'), spy3)
                    .then(done(function () {
                    assert.equals(spy1.callCount, 4);
                    assert.equals(spy2.callCount, 4);
                    assert.equals(spy3.callCount, 1);
                }));
            },
            "SELECT query with binded variables": function (done) {
                var query = Query("SELECT * WHERE { ?s ?p ?o }"),
                    query1 = Promise.defer(),
                    query2 = Promise.defer();
                Graph(graph2)
                    .execute(query, function (o, p, s) {
                        query1.resolve([ o, p, s ]);
                    })
                    .execute(query, function (p, o) {
                        query2.resolve([ p, o ]);
                    });
                Promise.all([ query1, query2 ]).then(done(function (results) {
                    assert.equals(results[0], [ subTim.value, preKnows.value, subJohn.value ]);
                    assert.equals(results[1], [ preKnows.value, subTim.value ]);
                }));
            }
        },
        "//.extend": {
            "With Dictionary.Formula": function (done) {
                this.graph
                    .extend(graph1)
                    .size(done(function (size) {
                    assert.equals(size, 4);
                }));
            },
            "With Dictionary.Statement[]": function (done) {
                this.graph
                    .extend(graph1.statements)
                    .size(done(function (size) {
                    assert.equals(size, 4);
                }));
            },
            "With URI": function (done) {
                this.graph
                    .extend("http://localhost:8088/json-ld/simple.jsonld")
                    .size(done(function (size) {
                    assert.equals(size, 2);
                }));
            },
            "With URI[]": function (done) {
                this.graph
                    .extend([
                    "http://localhost:8088/json-ld/people/arne.jsonld",
                    "http://localhost:8088/json-ld/people/manu.jsonld"
                ])
                    .size(done(function (size) {
                    assert.equals(size, 3);
                }));
            }
        },
        ".size": function (done) {
            var size1 = Promise.defer(),
                size2 = Promise.defer();
            this.graph.size(function (size) {
                size1.resolve(size);
            });
            Graph(graph1).size(function (size) {
                size2.resolve(size);
            });
            Promise.all([ size1, size2 ]).then(done(function (sizes) {
                //console.log("SIZES", sizes);
                assert.equals(sizes[0], 0);
                assert.equals(sizes[1], 4);
            }));
        },
        ".then": function (done) {
            this.graph.then(done(function () {
                assert(true);
            }));
        }
    });
});