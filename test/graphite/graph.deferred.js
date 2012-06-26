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
    "src/graphite/when"
], function (Graph, Dictionary, Query, Utils, When) {
    var subJohn = Dictionary.Symbol("http://dbpedia.org/resource/John_Lennon"),
        preName = Dictionary.Symbol("http://xmlns.com/foaf/0.1/name"),
        objJohnName = Dictionary.Literal("John Lennon"),
        subTim = Dictionary.Symbol("http://dbpedia.org/resource/Tim_B_Lee"),
        preKnows = Dictionary.Symbol("http://xmlns.com/foaf/0.1/knows"),
        blank1 = Dictionary.BlankNode(),
        blank2 = Dictionary.BlankNode(),
        formula1 = Dictionary.Formula();
    formula1.add(subJohn, preName, objJohnName);
    formula1.add(blank1, preName, subJohn);
    formula1.add(blank2, preName, 42);
    formula1.add(subTim, preName, blank1);
    var formula2 = Dictionary.Formula();
    formula2.add(subJohn, preKnows, subTim);
    var formula3 = Dictionary.Formula();
    formula3.add(subTim, preKnows, subJohn);
    buster.testCase("Graphite graph", {
        setUp: function () {
            this.graph = Graph();
        },
        "Graph has no triples to begin with": function (done) {
            this.graph.size(done(function (size) {
                assert.equals(size, 0);
            }));
        },
        "//Function .clone": function (done) {
            var g1 = this.graph,
                g2,
                g3,
                g4,
                g1Size = When.defer(),
                g2Size = When.defer(),
                g3Size = When.defer(),
                g4Size = When.defer();
            g1.size(function (size) {
                g1Size.resolve(size);
            });
            g2 = g1.clone().size(function (size) {
                g2Size.resolve(size);
            });
            g3 = Graph(formula1).size(function (size) {
                g3Size.resolve(size);
            });
            g4 = g3.clone().size(function (size) {
                g4Size.resolve(size);
            });
            When.all([ g1Size, g2Size, g3Size, g4Size ]).then(done(function (sizes) {
                //buster.log(sizes);
                refute.same(g1, g2);
                refute.same(g3, g4);
                assert.equals(sizes[0], 0);
                assert.equals(sizes[1], 0);
                assert.equals(sizes[2], 4);
                assert.equals(sizes[3], 4);
            }));
        },
        "Function .execute": {
            "ASK query": function (done) {
                var ask1 = When.defer(),
                    ask2 = When.defer(),
                    g1Size = When.defer(),
                    g2Size = When.defer(),
                    query1 = Query("ASK { " + formula1.statements[0].toNT() + " }"),
                    query2 = Query("ASK " + formula2.toNT());
                Graph(formula1)
                    .execute(query1, function (answer) {
                        ask1.resolve(answer);
                    })
                    .size(function (size) {
                        g1Size.resolve(size);
                    })
                    .execute(query2, function (answer) {
                        ask2.resolve(answer);
                    })
                    .size(function (size) {
                        g2Size.resolve(size);
                    });
                When.all([ ask1, ask2, g1Size, g2Size ]).then(done(function (results) {
                    assert.equals(results[0], true);
                    assert.equals(results[1], false);
                    assert.equals(results[2], 4);
                    assert.equals(results[3], 4);
                }));
            },
            "CONSTRUCT query": function (done) {
                var g1Size = When.defer(),
                    g2Size = When.defer(),
                    g3Size = When.defer(),
                    g4Size = When.defer(),
                    query1 = Query("CONSTRUCT { ?s ?p ?o } WHERE { ?s ?p ?o }"),
                    query2 = Query("CONSTRUCT { ?s ?p 43 } WHERE { ?s ?p 42 }");
                Graph(formula1)
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
                When.all([ g1Size, g2Size, g3Size, g4Size ]).then(done(function (results) {
                    //buster.log("SIZES", results);
                    assert.equals(results[0], 4);
                    assert.equals(results[1], 4);
                    assert.equals(results[2], 1);
                    assert.equals(results[3], 4);
                }));
            },
            "INSERT query": function (done) {
                var g1Size = When.defer(),
                    g2Size = When.defer(),
                    g3Size = When.defer(),
                    g4Size = When.defer(),
                    query1 = Query('INSERT DATA ' + formula1.toNT()),
                    query2 = Query('INSERT DATA ' + formula2.toNT());
                this.graph
                    .execute(query1, function (g1) {
                        g1.size(function (size) {
                            g1Size.resolve(size);
                        })
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
                When.all([ g1Size, g2Size, g3Size, g4Size ]).then(done(function (sizes) {
                    //buster.log("TEST", sizes);
                    assert.equals(sizes[0], 4);
                    assert.equals(sizes[1], 4);
                    assert.equals(sizes[2], 1);
                    assert.equals(sizes[3], 5);
                }));
            },
            "LOAD query": function (done) {
                var g1Size = When.defer(),
                    g2Size = When.defer(),
                    g3Size = When.defer(),
                    g4Size = When.defer(),
                    query1 = Query('LOAD <http://localhost:8088/rdfjson/manu.rdfjson>'),
                    query2 = Query('LOAD <http://localhost:8088/rdfjson/arne.rdfjson>');
                this.graph
                    .execute(query1, function (g1) {
                        g1.size(function (size) {
                            //buster.log("G1 SIZE", size);
                            g1Size.resolve(size);
                        });
                    })
                    .size(function (size) {
                        //buster.log("G2 SIZE", size);
                        g2Size.resolve(size);
                    })
                    .execute(query2, function (g3) {
                        g3.size(function (size) {
                            //buster.log("G3 SIZE", size);
                            g3Size.resolve(size);
                        });
                    })
                    .size(function (size) {
                        //buster.log("G4 SIZE", size);
                        g4Size.resolve(size);
                    });
                When.all([ g1Size, g2Size, g3Size, g4Size ]).then(done(function (sizes) {
                    //buster.log("SIZES", sizes);
                    assert.equals(sizes[0], 2);
                    assert.equals(sizes[1], 2);
                    assert.equals(sizes[2], 1);
                    assert.equals(sizes[3], 3);
                }));
            },
            "SELECT query": function (done) {
                var size1 = When.defer(),
                    size2 = When.defer(),
                    size3 = When.defer(),
                    query1 = Query("SELECT * WHERE { ?s ?p ?o }"),
                    query2 = Query("SELECT ?s WHERE { ?s ?p ?o }"),
                    query3 = Query('SELECT ?s WHERE { ?s ?p 42 }'),
                    spy1 = sinon.spy(),
                    spy2 = sinon.spy(),
                    spy3 = sinon.spy();
                Graph(formula1)
                    .execute(query1, spy1, function () {
                        size1.resolve(spy1.callCount);
                    })
                    .execute(query2, spy2, function () {
                        size2.resolve(spy2.callCount);
                    })
                    .execute(query3, spy3, function () {
                        size3.resolve(spy3.callCount);
                    });
                When.all([
                    size1,
                    size2,
                    size3
                ]).then(done(function (results) {
                        //buster.log("RESULTS", results, spy1.callCount, spy2.callCount, spy3.callCount);
                        assert.equals(results[0], 4);
                        assert.equals(results[1], 4);
                        assert.equals(results[2], 1);
                    }));
            },
            "SELECT query with binded variables": function (done) {
                var query = Query("SELECT * WHERE { ?s ?p ?o }"),
                    query1 = When.defer(),
                    query2 = When.defer();
                Graph(formula2)
                    .execute(query, function (o, p, s) {
                        query1.resolve([ o, p, s ]);
                    })
                    .execute(query, function (p, o) {
                        query2.resolve([ p, o ]);
                    });
                When.all([ query1, query2 ]).then(done(function (results) {
                    assert.equals(results[0], [ subTim.value, preKnows.value, subJohn.value ]);
                    assert.equals(results[1], [ preKnows.value, subTim.value ]);
                }));
            }
        },
        "//Function .load": {
            "With Formula-object": function (done) {
                this.graph
                    .load(formula1)
                    .size(done(function (size) {
                    assert.equals(size, 4);
                }));
            },
            "With URI, single call": function (done) {
                this.graph
                    .load("http://localhost:8088/json-ld/simple.jsonld")
                    .size(done(function (size) {
                    assert.equals(size, 2);
                }));
            },
            "With URI, multiple calls": function (done) {
                this.graph
                    .load("http://localhost:8088/json-ld/people/arne.jsonld")
                    .load("http://localhost:8088/json-ld/people/manu.jsonld")
                    .size(done(function (size) {
                    assert.equals(size, 3);
                }));
            },
            "Array of URIs": function (done) {
                this.graph.load([
                    "http://localhost:8088/json-ld/people/arne.jsonld",
                    "http://localhost:8088/json-ld/people/manu.jsonld"
                ]).size(done(function (size) {
                    assert.equals(size, 3);
                }));
            }
        },
        "Function .merge": {
            "Single call": function (done) {
                Graph(formula1)
                    .merge(Graph(formula2))
                    .size(done(function (size) {
                    assert.equals(size, 5);
                }));
            },
            "Multiple call": function (done) {
                Graph(formula1)
                    .merge(Graph(formula2))
                    .merge(Graph(formula3))
                    .size(done(function (size) {
                    assert.equals(size, 6);
                }));
            }
        },
        "Function .size": function (done) {
            var size1 = When.defer(),
                size2 = When.defer();
            this.graph.size(function (size) {
                size1.resolve(size);
            });
            Graph(formula1).size(function (size) {
                size2.resolve(size);
            });
            When.all([ size1, size2 ]).then(done(function (sizes) {
                //buster.log("SIZES", sizes);
                assert.equals(sizes[0], 0);
                assert.equals(sizes[1], 4);
            }));
        },
        "Function .then": function (done) {
            this.graph.then(function (g1) {
                g1.size(done(function (size) {
                    assert.equals(size, 0);
                }));
            });
        }
    });
});