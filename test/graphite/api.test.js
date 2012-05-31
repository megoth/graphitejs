/*global assert, buster, refute*/
if (typeof module === "object" && typeof require === "function") {
    var buster = require("buster");
}

define([
    "src/graphite/api",
    "src/graphite/utils"
], function(API, Utils) {
    "use strict";
    var subJohn = "http://dbpedia.org/resource/John_Lennon",
        preName = "http://xmlns.com/foaf/0.1/name",
        preAge = "http://xmlns.com/foaf/0.1/age",
        preHomepage = "http://xmlns.com/foaf/0.1/homepage",
        objJohnName = "John Lennon",
        subTim = "http://dbpedia.org/resource/Tim_B_Lee",
        objTimName = "Tim Berners-Lee",
        objTimHomepage = "http://www.w3.org/People/Berners-Lee/";
        //uriInteger = "http://www.w3.org/2001/XMLSchema#integer",
        //preKnows = "http://xmlns.com/foaf/0.1/knows";
    function addStatements (done) {
        this.addStatement(subJohn, preName, objJohnName)
            .addStatement(subJohn, preAge, 42)
            .addStatement(subTim, preName, objTimName)
            .addStatement(subTim, preHomepage, objTimHomepage)
            .addStatement(subTim, preName, objJohnName)
            .addStatement(subTim, preAge, 57)
            .then(done);
    }
    buster.testCase("Graphite API", {
        setUp: function () {
            this.api = API();
        },
        "Default return the API object": function () {
            assert.defined(API);
            assert.isFunction(API);
        },
        "Function .addStatement": {
            "Adding a triple, returns the modified object": function (done) {
                this.api
                    .addStatement(subJohn, preName, objJohnName)
                    .size()
                    .then(done(function (size) {
                        assert.equals(size, 1);
                    }));
            },
            "Adding a triple fires a callback": function (done) {
                var spy = sinon.spy();
                this.api
                    .addStatement(subJohn, preName, objJohnName, {
                        callback: spy
                    })
                    .then(done(function () {
                        assert(spy.calledOnce);
                    }));
            },
            "Adding a triple fires a callback which contains a graph": function (done) {
                this.api
                    .addStatement(subJohn, preName, objJohnName, {
                        callback: function (graph) {
                            graph.size().then(done(function (size) {
                                assert.equals(size, 1);
                            }))
                        }
                    });
            },
            "Adding a blank node": function (done) {
                this.api
                    .addStatement(null, preName, objJohnName)
                    .size(done(function (size) {
                        assert.equals(size, 1);
                    }));
            },
            "Adding multiple triples with same subject": function (done) {
                this.api
                    .addStatement(subTim, preName, objTimName)
                    .addStatement(subTim, preHomepage, objTimHomepage)
                    .size(done(function (size) {
                    assert.equals(size, 2);
                }));
            },
            "Adding redundant triples": function (done) {
                this.api
                    .addStatement(subJohn, preName, objTimName)
                    .addStatement(subJohn, preName, objTimName)
                    .size(done(function (size) {
                    assert.equals(size, 1);
                }));
            }
        },
        "Function .each": {
            setUp: function (done) {
                addStatements.call(this.api, done);
            },
            "By default returns all triples in a graph": function (done) {
                var spy = sinon.spy();
                this.api
                    .each(spy)
                    .then(done(function () {
                    assert.equals(spy.callCount, 6);
                }));
            }
        },
        "Function .listStatement": {
            setUp: function (done) {
                addStatements.call(this.api, done);
            },
            "List all triples": function (done) {
                var spy = sinon.spy();
                this.api
                    .listStatements(spy)
                    .then(done(function () {
                    assert.equals(spy.callCount, 6);
                }));
            },
            "Listing with a specific subject": function (done) {
                var spy = sinon.spy();
                this.api
                    .listStatements({
                        subject: subJohn
                    }, spy)
                    .then(done(function () {
                    assert.equals(spy.callCount, 2);
                }));
            },
            "Listing with a specific predicate": function (done) {
                var spy = sinon.spy();
                this.api
                    .listStatements({
                        predicate: preName
                    }, spy)
                    .then(done(function () {
                    assert.equals(spy.callCount, 3);
                }));
            },
            "Listing with a specific object": function (done) {
                var spy = sinon.spy();
                this.api
                    .listStatements({
                        object: 42
                    }, spy)
                    .then(done(function () {
                    assert.equals(spy.callCount, 1);
                }));
            }
        },
        "Function .load": function (done) {
            this.api
                .load("http://localhost:8088/json-ld/simple.jsonld")
                .size()
                .then(done(function(size) {
                    assert.equals(size, 2);
                }));
        },
        "Function .query": {
            "LOAD": {
                "JSON-LD": function (done) {
                    this.api
                        .query("LOAD <http://localhost:8088/json-ld/people/arne.jsonld>")
                        .size()
                        .then(done(function (size) {
                        assert.equals(size, 2);
                    }))
                }
            },
            "SELECT": {
                setUp: function (done) {
                    addStatements.call(this.api, done);
                },
                "called correctly": function (done) {
                    var spy = sinon.spy();
                    this.api
                        .query("SELECT * WHERE { ?s ?p ?o }")
                        .each(function (s, p, o) {
                            buster.log("OBJECT", o);
                            assert.defined(s);
                            assert.defined(p);
                            assert.defined(o);
                            spy();
                        })
                        .then(done(function () {
                        assert.equals(spy.callCount, 6);
                    }));
                },
                "with count": function (done) {
                    var spy = sinon.spy();
                    this.api
                        .query("SELECT (COUNT(?s) as ?count) WHERE { ?s ?p ?o } GROUP BY ?s")
                        .each(function (count) {
                            assert.defined(count);
                            spy();
                        })
                        .then(done(function () {
                        assert.equals(spy.callCount, 2);
                    }));
                },
                "with distinct": function (done) {
                    var spy = sinon.spy();
                    this.api
                        .query("SELECT DISTINCT ?s WHERE { ?s ?p ?o }")
                        .each(function (s) {
                            assert.defined(s);
                            spy();
                        })
                        .then(done(function () {
                        assert.equals(spy.callCount, 2);
                    }));
                },
                "with sum": function (done) {
                    var spy = sinon.spy();
                    this.api
                        .query("SELECT (SUM(?age) as ?totalAge) WHERE { ?s <http://xmlns.com/foaf/0.1/age> ?age }")
                        .each(function (totalAge) {
                            assert.equals(totalAge, 99);
                            spy();
                        })
                        .then(done(function () {
                        assert.equals(spy.callCount, 1);
                    }));
                },
                "with avg": function (done) {
                    var spy = sinon.spy();
                    this.api
                        .query("SELECT (AVG(?age) as ?avgAge) WHERE { ?s <http://xmlns.com/foaf/0.1/age> ?age }")
                        .each(function (avgAge) {
                            assert.equals(avgAge, 49.5);
                            spy();
                        })
                        .then(done(function () {
                        assert.equals(spy.callCount, 1);
                    }));
                },
                "with min": function (done) {
                    var spy = sinon.spy();
                    this.api
                        .query("SELECT (MIN(?age) as ?minAge) WHERE { ?s <http://xmlns.com/foaf/0.1/age> ?age }")
                        .each(function (minAge) {
                            assert.equals(minAge, 42);
                            spy();
                        })
                        .then(done(function () {
                        assert.equals(spy.callCount, 1);
                    }));
                },
                "with max": function (done) {
                    var spy = sinon.spy();
                    this.api
                        .query("SELECT (MAX(?age) as ?maxAge) WHERE { ?s <http://xmlns.com/foaf/0.1/age> ?age }")
                        .each(function (maxAge) {
                            assert.equals(maxAge, 57);
                            spy();
                        })
                        .then(done(function () {
                        assert.equals(spy.callCount, 1);
                    }));
                }
            }
        },
        "//Function .removeStatement": {
            setUp: function (done) {
                addStatements.call(this.api, done);
            },
            "//Remove all statement": function () {
                this.g.removeStatement();
            },
            "//Returns the triples removed": function () {
                assert.equals(this.g.removeStatement({
                    subject: "test",
                    predicate: "test",
                    object: "test"
                }).length, 0);
                assert.equals(this.g.removeStatement({
                    subject: subJohn,
                    predicate: preName,
                    object: objJohnName
                }).length, 1);
            },
            "//Remove with all specified": function () {
                var spy = sinon.spy(),
                    subJohn = subJohn,
                    preName = preName,
                    objJohnName = objJohnName;
                this.g.removeStatement({
                    subject: subJohn,
                    predicate: preName,
                    object: objJohnName
                }, function (sub, pre, obj) {
                    assert.equals(sub.value, subJohn);
                    assert.equals(pre.value, preName);
                    assert.equals(obj.value, objJohnName);
                    spy();
                });
                assert.equals(this.g.listStatements().length, 3);
                assert(spy.calledOnce);
            },
            "//Remove with subject specified": function () {
                var spy = sinon.spy(),
                    subJohn = subJohn;
                this.g.removeStatement({
                    subject: subJohn
                }, function (sub) {
                    assert.equals(sub.value, subJohn);
                    spy();
                });
                assert(spy.calledOnce);
                assert.equals(this.g.listStatements().length, 3);
            },
            "//Remove with predicate specified": function () {
                var spy = sinon.spy(),
                    preName = preName;
                this.g.removeStatement({
                    predicate: preName
                }, function (sub, pre) {
                    assert.equals(pre.value, preName);
                    spy();
                });
                assert.equals(this.g.listStatements().length, 1);
                assert(spy.calledThrice);
            },
            "//Remove with object specified": function () {
                var spy = sinon.spy(),
                    objJohnName = objJohnName;
                this.g.removeStatement({
                    object: objJohnName
                }, function (sub, pre, obj) {
                    assert.equals(obj.value, objJohnName);
                    spy();
                });
                assert.equals(this.g.listStatements().length, 2);
                assert(spy.calledTwice);
            }
        },
        "Function .select": {
            setUp: function (done) {
                addStatements.call(this.api, done);
            },
            "Star variable": function (done) {
                this.api
                    .select("*")
                    .each(function(subject, predicate, object) {
                        assert.defined(subject);
                        assert.defined(predicate);
                        assert.defined(object);
                    })
                    .then(done);
            },
            "Single variable": function (done) {
                this.api
                    .select("?subject")
                    .each(function (subject) {
                        assert.defined(subject);
                    })
                    .then(done);
            },
            "Aliased variables": function (done) {
                this.api
                    .select("(?subject as ?s)")
                    .each(function (s) {
                        assert.defined(s);
                    })
                    .then(done);
            },
            "Multiple variables": function (done) {
                this.api
                    .select("?subject (?predicate as ?s)")
                    .each(function (subject, s) {
                        assert.defined(subject);
                        assert.defined(s);
                    })
                    .then(done);
            }
        },
        "Function .size": {
            "With .then": function (done) {
                this.api
                    .size()
                    .then(done(function (size) {
                    buster.log("IN API TEST, SIZE", size);
                    assert.equals(size, 0);
                }));
            },
            "With callback": function (done) {
                this.api
                    .size(done(function (size) {
                        assert.equals(size, 0);
                    }));
            }
        },
        "Function .where": {
            setUp: function (done) {
                addStatements.call(this.api, done);
            },
            "Single call": function (done) {
                var spy = sinon.spy();
                this.api
                    .where('?subject <{0}> "{1}"'.format(preName, objJohnName))
                    .each(spy)
                    .then(done(function () {
                    assert.equals(spy.callCount, 2);
                }))
            },
            "Multiple calls": function (done) {
                var spy = sinon.spy();
                this.api
                    .where('?subject ?predicate "{0}"'.format(objJohnName))
                    .where('<{0}> ?predicate "{1}"'.format(subJohn, objJohnName))
                    .each(spy)
                    .then(done(function () {
                    assert.equals(spy.callCount, 2);
                }))
            }
        }
    });
});
