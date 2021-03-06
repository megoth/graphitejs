/*global assert, console, module, refute, require*/
if (typeof module === "object" && typeof require === "function") {
    var buster = require("buster");
    var sinon = require("sinon");
}

define([
    "src/graphite/graph",
    "src/graphite/rdf",
    "src/graphite/query",
    "src/graphite/utils",
    "src/graphite/promise"
], function (Graph, RDF, Query, Utils, Promise) {
    var subJohn = RDF.Symbol("http://dbpedia.org/resource/John_Lennon"),
        preName = RDF.Symbol("http://xmlns.com/foaf/0.1/name"),
        objJohnName = RDF.Literal("John Lennon"),
        subTim = RDF.Symbol("http://dbpedia.org/resource/Tim_B_Lee"),
        preKnows = RDF.Symbol("http://xmlns.com/foaf/0.1/knows"),
        blank1 = RDF.BlankNode(),
        blank2 = RDF.BlankNode(),
        formula1 = RDF.Formula();
    formula1.add(subJohn, preName, objJohnName);
    formula1.add(blank1, preName, subJohn);
    formula1.add(blank2, preName, 42);
    formula1.add(subTim, preName, blank1);
    var formula2 = RDF.Formula();
    formula2.add(subJohn, preKnows, subTim);
    var formula3 = RDF.Formula();
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
                g1Size = Promise.defer(),
                g2Size = Promise.defer(),
                g3Size = Promise.defer(),
                g4Size = Promise.defer();
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
            Promise.all([ g1Size, g2Size, g3Size, g4Size ]).then(done(function (sizes) {
                //console.log(sizes);
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
                var ask1 = Promise.defer(),
                    ask2 = Promise.defer(),
                    g1Size = Promise.defer(),
                    g2Size = Promise.defer(),
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
                Promise.all([ ask1, ask2, g1Size, g2Size ]).then(done(function (results) {
                    assert.equals(results[0], true);
                    assert.equals(results[1], false);
                    assert.equals(results[2], 4);
                    assert.equals(results[3], 4);
                }));
            },
            "CONSTRUCT query": function (done) {
                var g1Size = Promise.defer(),
                    g2Size = Promise.defer(),
                    g3Size = Promise.defer(),
                    g4Size = Promise.defer(),
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
                var size1 = Promise.defer(),
                    size2 = Promise.defer(),
                    size3 = Promise.defer(),
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
                Promise.all([
                    size1,
                    size2,
                    size3
                ]).then(done(function (results) {
                        //console.log("RESULTS", results, spy1.callCount, spy2.callCount, spy3.callCount);
                        assert.equals(results[0], 4);
                        assert.equals(results[1], 4);
                        assert.equals(results[2], 1);
                    }));
            },
            "SELECT query with binded variables": function (done) {
                var query = Query("SELECT * WHERE { ?s ?p ?o }"),
                    query1 = Promise.defer(),
                    query2 = Promise.defer();
                Graph(formula2)
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
            var size1 = Promise.defer(),
                size2 = Promise.defer();
            this.graph.size(function (size) {
                size1.resolve(size);
            });
            Graph(formula1).size(function (size) {
                size2.resolve(size);
            });
            Promise.all([ size1, size2 ]).then(done(function (sizes) {
                //console.log("SIZES", sizes);
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