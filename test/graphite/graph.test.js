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
    buster.testCase("Graphite graph", {
        setUp: function (done) {
            var that = this;
            this.subJohn = Dictionary.Symbol("http://dbpedia.org/resource/John_Lennon");
            this.preName = Dictionary.Symbol("http://xmlns.com/foaf/0.1/name");
            this.preHomepage = Dictionary.Symbol("http://xmlns.com/foaf/0.1/homepage");
            this.objJohnName = Dictionary.Literal("John Lennon");
            this.subTim = Dictionary.Symbol("http://dbpedia.org/resource/Tim_B_Lee");
            this.objTimName = Dictionary.Literal("Tim Berners-Lee");
            this.objTimHomepage = Dictionary.Symbol("http://www.w3.org/People/Berners-Lee/");
            this.uriHomepage = Dictionary.Symbol("http://xmlns.com/foaf/0.1/homepage");
            this.uriInteger = Dictionary.Symbol("http://www.w3.org/2001/XMLSchema#integer");
            this.preKnows = Dictionary.Symbol("http://xmlns.com/foaf/0.1/knows");
            this.blank1 = Dictionary.BlankNode();
            this.blank2 = Dictionary.BlankNode();
            this.query = Query();
            this.graph1 = Dictionary.Formula();
            this.graph1.add(this.subJohn, this.preName, this.objJohnName);
            this.graph1.add(this.blank1, this.preName, this.subJohn);
            this.graph1.add(this.blank2, this.preName, 42);
            this.graph1.add(this.subTim, this.preName, this.blank1);
            this.graph2 = Dictionary.Formula();
            this.graph2.add(this.subJohn, this.preKnows, this.subTim);
            this.graph3 = Dictionary.Formula();
            this.graph3.add(this.subJohn, this.preName, this.objJohnName);
            this.graph3.add(this.blank1, this.preName, this.subJohn);
            this.graph3.add(this.blank2, this.preName, 42);
            this.graph3.add(this.subTim, this.preName, this.blank1);
            this.graph3.add(this.subJohn, this.preKnows, this.subTim);
            this.graph3.add(this.blank1, this.preKnows, this.subTim);
            this.graph3.add(this.blank1, this.preKnows, 42);
            Graph().then(done(function (graph) {
                that.g = graph;
            }));
        },
        "Graph has no triples to begin with": function () {
            this.g.size().then(function (size) {
                assert.equals(size, 0);
            });
        },
        "Can add triples upon initialization": function () {
            Graph(this.graph1).then(function (g) {
                g.size().then(function (size) {
                    assert.equals(size, 4);
                });
            });
        },
        "Function .clone": function (done) {
            var g1 = this.g,
                g2,
                g3,
                g4,
                g1Size = this.g.size(),
                g2Size = When.defer(),
                g3Size = When.defer(),
                g4Size = When.defer();
            g1.clone().then(function (graph) {
                g2 = graph;
                g2Size = g2.size();
            });
            Graph(this.graph1).then(function (graph) {
                g3 = graph;
                g3Size = g3.size();
                g3.clone().then(function (g4) {
                    g4 = graph;
                    g4Size = g4.size();
                });
            });
            When.all([ g1Size, g2Size, g3Size, g4Size ]).then(done(function (sizes) {
                buster.log(sizes);
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
                var that = this,
                    ask1 = When.defer(),
                    ask2 = When.defer(),
                    g2Size = When.defer(),
                    g3Size = When.defer();
                Graph(this.graph1).then(function (g1) {
                    g1.execute("ASK { " + that.graph1.statements[0].toNT() + " }", function (answer) {
                        ask1.resolve(answer);
                    }).then(function (g2) {
                            g2Size = g2.size();
                        });
                    g1.execute("ASK " + that.graph2.toNT(), function (answer) {
                        ask2.resolve(answer);
                    }).then(function (g3) {
                            g3Size = g3.size();
                        });
                });
                When.all([ ask1, ask2, g2Size, g3Size ]).then(done(function (results) {
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
                    g4Size = When.defer();
                Graph(this.graph1).then(function (g) {
                    g.execute("CONSTRUCT { ?s ?p ?o } WHERE { ?s ?p ?o }", function (g) {
                        g1Size = g.size();
                    }).then(function (g) {
                            g2Size = g.size();
                        });
                    g.execute("CONSTRUCT { ?s ?p 43 } WHERE { ?s ?p 42 }", function (g) {
                        g3Size = g.size();
                    }).then(function (g) {
                            g4Size = g.size();
                        });
                });
                When.all([ g1Size, g2Size, g3Size, g4Size ]).then(done(function (results) {
                    buster.log("SIZES", results);
                    assert.equals(results[0], 4);
                    assert.equals(results[1], 4);
                    assert.equals(results[2], 1);
                    assert.equals(results[3], 1);
                }));
            },
            "INSERT query": function (done) {
                var graph1 = this.graph1,
                    graph2 = this.graph2,
                    g1Size = When.defer(),
                    g2Size = When.defer(),
                    g3Size = When.defer(),
                    g4Size = When.defer();
                this.g.execute('INSERT DATA ' + graph1.toNT(), function (g1) {
                    g1Size = g1.size();
                }).then(function (g2) {
                        g2Size = g2.size();
                        g2.execute('INSERT DATA ' + graph2.toNT(), function (g3) {
                            g3Size = g3.size();
                        }).then(function (g4) {
                                g4Size = g4.size();
                            });
                });
                When.all([ g1Size, g2Size, g3Size, g4Size ]).then(done(function (sizes) {
                    buster.log("TEST", sizes);
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
                    g4Size = When.defer();
                this.g.execute('LOAD <http://localhost:8088/rdfjson/manu.rdfjson>', function (g1) {
                    g1.size().then(function (size) {
                        buster.log("G1 SIZE", size);
                        g1Size.resolve(size);
                    });
                }).then(function (g2) {
                        g2.size().then(function (size) {
                            buster.log("G2 SIZE", size);
                            g2Size.resolve(size);
                        });
                        g2.execute('LOAD <http://localhost:8088/rdfjson/arne.rdfjson>', function (g3) {
                            g3.size().then(function (size) {
                                buster.log("G3 SIZE", size);
                                g3Size.resolve(size);
                            });
                        }).then(function (g4) {
                                g4.size().then(function (size) {
                                    buster.log("G4 SIZE", size);
                                    g4Size.resolve(size);
                                })
                            });
                    });
                When.all([ g1Size, g2Size, g3Size, g4Size ]).then(done(function (sizes) {
                    buster.log("SIZES", sizes);
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
                    query1 = When.defer(),
                    query2 = When.defer(),
                    query3 = When.defer(),
                    spy1 = sinon.spy(),
                    spy2 = sinon.spy(),
                    spy3 = sinon.spy();
                Graph(this.graph1).then(function (g) {
                    g.execute("SELECT * WHERE { ?s ?p ?o }", spy1, function () {
                        query1.resolve();
                    }).then(function (g1) {
                            size1 = g1.size();
                        });
                    g.execute("SELECT ?s WHERE { ?s ?p ?o }", spy2, function () {
                        query2.resolve();
                    }).then(function (g2) {
                            size2 = g2.size();
                        });
                    g.execute('SELECT ?s WHERE { ?s ?p 42 }', spy3, function () {
                        query3.resolve();
                    }).then(function (g3) {
                            size3 = g3.size();
                        });
                });
                When.all([
                    size1,
                    query1,
                    size2,
                    query2,
                    size3,
                    query3
                ]).then(done(function (results) {
                        buster.log("RESULTS", results, spy1.callCount, spy2.callCount, spy3.callCount);
                        assert.equals(results[0], 4);
                        assert.equals(results[2], 4);
                        assert.equals(results[2], 4);
                        assert.equals(spy1.callCount, 4);
                        assert.equals(spy2.callCount, 4);
                        assert.equals(spy3.callCount, 1);
                    }));
            },
            "SELECT query with binded variables": function (done) {
                var that = this,
                    query = "SELECT * WHERE { ?s ?p ?o }",
                    query1 = When.defer(),
                    query2 = When.defer();
                Graph(this.graph2).then(function (g) {
                    g.execute(query, function (o, p, s) {
                        query1.resolve([ o, p, s ]);
                    });
                    g.execute(query, function (p, o) {
                        query2.resolve([ p, o ]);
                    });
                });
                When.all([ query1, query2 ]).then(done(function (results) {
                    assert.equals(results[0], [ that.subTim.value, that.preKnows.value, that.subJohn.value ]);
                    assert.equals(results[1], [ that.preKnows.value, that.subTim.value ]);
                }));
            }
        },
        "Function .size": {
            "With .then": function (done) {
                var that = this,
                    size1 = this.g.size(),
                    size2 = When.defer(),
                    size3 = When.defer();
                Graph(this.graph1).then(function (g) {
                    size2 = g.size();
                    g.execute("INSERT DATA" + that.graph2.toNT()).then(function (g) {
                        size3 = g.size();
                    });
                });
                When.all([ size1, size2, size3 ]).then(done(function (sizes) {
                    buster.log("SIZES", sizes);
                    assert.equals(sizes[0], 0);
                    assert.equals(sizes[1], 4);
                    assert.equals(sizes[2], 5);
                }));
            },
            "With callback": function (done) {
                var size1 = When.defer(),
                    size2 = When.defer(),
                    size3 = When.defer(),
                    that = this;
                this.g.size(function (size) {
                    size1.resolve(size);
                });
                Graph(this.graph1).then(function (g) {
                    g.size(function (size) {
                        size2.resolve(size);
                    });
                    g.execute("INSERT DATA" + that.graph2.toNT()).then(function (g) {
                        g.size(function (size) {
                            size3.resolve(size);
                        });
                    });
                });
                When.all([ size1, size2, size3 ]).then(done(function (sizes) {
                    buster.log("SIZES", sizes);
                    assert.equals(sizes[0], 0);
                    assert.equals(sizes[1], 4);
                    assert.equals(sizes[2], 5);
                }));
            }
        }
    });
});