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
        "Function .addStatement": {
            "Adding a triple, returns a statement": function () {
                var triple = this.g.addStatement(this.subJohn, this.preName, this.objJohnName);
                assert.equals(triple.subject, this.subJohn);
                assert.equals(triple.predicate, this.preName);
                assert.equals(triple.object, this.objJohnName);
            },
            "Adding a triple fires a callback": function () {
                var spy = sinon.spy();
                this.g.addStatement(this.subJohn, this.preName, this.objJohnName, spy);
                assert(spy.calledOnce);
            },
            "Adding a triple fires a callback which contains a statement": function (done) {
                var that = this;
                this.g.addStatement(this.subJohn, this.preName, this.objJohnName, done(function (s) {
                    assert.equals(s.subject, that.subJohn);
                    assert.equals(s.predicate, that.preName);
                    assert.equals(s.object, that.objJohnName);
                }));
            },
            "Adding a blank node": function () {
                var that = this;
                this.g.addStatement(this.blank1, this.preName, this.objJohnName);
                this.g.listStatements(function (predicate, object) {
                    assert.equals(predicate, that.preName.value);
                    assert.equals(object, that.objJohnName.value);
                });
            },
            "//Adding multiple triples with same subject": function () {
                this.g.addStatement(this.subTim, this.preName, this.objTimName);
                this.g.addStatement(this.subTim, this.preHomepage, this.objTimHomepage);
                //this.g.execute("SELECT ?s WHERE { ?s ?p ?o } GROUP BY ?s", spy);
                //assert.equals(list[0].subject, list[1].subject);
                //refute.equals(list[0].predicate, list[1].predicate);
                //refute.equals(list[0].object, list[1].object);
            },
            "//Adding multiple triples with same subject and predicate": function () {
                var list;
                this.g.addStatement(this.subJohn, this.preName, "Something");
                this.g.addStatement(this.subJohn, this.preName, "Something else");
                list = this.g.listStatements();
                assert.equals(list[0].subject, list[1].subject);
                assert.equals(list[0].predicate, list[1].predicate);
                refute.equals(list[0].object, list[1].object);
            },
            "//Typing": {
                "Default types": function () {
                    "use strict";
                    this.g.addStatement(null, this.preName, this.objJohnName);
                    this.g.addStatement(this.subJohn, this.preName, this.objJohnName);
                    var list = this.g.listStatements();
                    assert.equals(list[0].subject.token, "uri");
                    assert.equals(list[0].predicate.token, "uri");
                    assert.equals(list[0].object.token, "literal");
                    assert.equals(list[1].subject.token, "uri");
                    assert.equals(list[1].predicate.token, "uri");
                    assert.equals(list[1].object.token, "literal");
                },
                "Explicitly typed": function () {
                    "use strict";
                    var list;
                    this.g.addStatement({
                        value: this.subJohn,
                        token: "uri"
                    }, this.preName, {
                        value: 12,
                        token: "literal",
                        datatype: this.uriInteger
                    });
                    this.g.addStatement.call(this.g, {
                        value: "http://dbpedia.org/resource/Sean_Taro_Ono_Lennon",
                        token: "uri"
                    }, this.preName, {
                        value: "小野 太郎",
                        token: "literal",
                        lang: "jp"
                    });
                    list = this.g.listStatements();
                    assert.equals(list[0].subject.value, this.subJohn);
                    assert.equals(list[0].subject.token, "uri");
                    assert.equals(list[0].object.value, 12);
                    assert.equals(list[0].object.token, "literal");
                    assert.equals(list[1].object.value, "小野 太郎");
                    assert.equals(list[1].object.token, "literal");
                    assert.equals(list[1].object.lang, "jp");
                }
            }
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
                this.g.execute('LOAD <http://localhost:8088/rdfjson/test.rdfjson>', function (g1) {
                    g1.size().then(function (size) {
                        g1Size.resolve(size);
                    });
                }).then(function (g2) {
                        g2.size().then(function (size) {
                            g2Size.resolve(size);
                        });
                        g2.execute('LOAD <http://localhost:8088/rdfjson/test2.rdfjson>', function (g3) {
                            g3.size().then(function (size) {
                                g3Size.resolve(size);
                            });
                        }).then(function (g4) {
                                g4.size().then(function (size) {
                                    g4Size.resolve(size);
                                })
                            });
                    });
                When.all([ g1Size, g2Size, g3Size, g4Size ]).then(done(function (sizes) {
                    assert.equals(sizes[0], 2);
                    assert.equals(sizes[1], 2);
                    assert.equals(sizes[2], 2);
                    assert.equals(sizes[3], 4);
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
                        query1.resolve(arguments);
                    });
                    g.execute(query, function (p, o) {
                        query2.resolve(arguments);
                    });
                });
                When.all([ query1, query2 ]).then(done(function (results) {
                    assert.equals(results[0], [ that.subTim.value, that.preKnows.value, that.subJohn.value ]);
                    assert.equals(results[1], [ that.preKnows.value, that.subTim.value ]);
                }));
            }
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
                g2Size = graph.size();
            });
            Graph(this.graph1).then(function (graph) {
                g3 = graph;
                g3Size = g3.size();
                g3.clone().then(function (graph) {
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
        "Function .size": function (done) {
            var promises = [];
            promises.push(this.g.size());
            this.g.addStatement(this.subJohn, this.preName, this.objJohnName);
            promises.push(this.g.size());
            this.g.addStatement(this.subJohn, this.preKnows, this.subTim);
            promises.push(this.g.size());
            this.g.addStatement(this.subJohn, this.preKnows, this.subTim);
            promises.push(this.g.size());
            When.all(promises).then(done(function (results) {
                assert.equals(results[0], 0);
                assert.equals(results[1], 1);
                assert.equals(results[2], 2);
                assert.equals(results[3], 2);
            }));
        },
        "Function .triples": function (done) {
            Graph(this.graph1).then(function (graph) {
                graph.triples().then(done(function (g) {
                    assert.equals(g.statements.length, 4);
                }));
            });
        }
    });
});