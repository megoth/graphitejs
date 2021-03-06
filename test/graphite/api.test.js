/*global assert, buster, refute*/
if (typeof module === "object" && typeof require === "function") {
    var buster = require("buster");
}
define([
    "src/graphite/api"
], function(API) {
    "use strict";
    var subJohn = "http://dbpedia.org/resource/John_Lennon",
        preName = "http://xmlns.com/foaf/0.1/name",
        preAge = "http://xmlns.com/foaf/0.1/age",
        preHomepage = "http://xmlns.com/foaf/0.1/homepage",
        objJohnName = "John Lennon",
        subTim = "http://dbpedia.org/resource/Tim_B_Lee",
        objTimName = "Tim Berners-Lee",
        objTimHomepage = "http://www.w3.org/People/Berners-Lee/";
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
        ".addStatement": {
            "Adding a triple, returns the modified object": function (done) {
                this.api
                    .addStatement(subJohn, preName, objJohnName)
                    .size(done(function (size) {
                        assert.equals(size, 1);
                    }));
            },
            "Adding a triple fires a callback": function (done) {
                var spy = sinon.spy();
                this.api
                    .addStatement(subJohn, preName, objJohnName, spy)
                    .then(done(function () {
                        assert(spy.calledOnce);
                    }));
            },
            "Adding a triple fires a callback which contains a graph": function (done) {
                this.api
                    .addStatement(subJohn, preName, objJohnName, function (graph) {
                        graph.size(done(function (size) {
                            assert.equals(size, 1);
                        }));
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
        "//.base": {
            setUp: function (done) {
                addStatements.call(this.api, done);
            },
            "Single call": function (done) {
                //is buggy atm
                var spy = sinon.spy();
                this.api
                    .base("http://xmlns.com/foaf/0.1/")
                    .where("?subject <age> ?object")
                    .execute(spy)
                    .then(done(function () {
                    assert.equals(spy.callCount, 2);
                }))
            }
        },
        "//.execute": {
            setUp: function (done) {
                addStatements.call(this.api, done);
            },
            "Single call": function (done) {
                var spy = sinon.spy();
                this.api
                    .where("?subject ?predicate ?object")
                    .execute(spy)
                    .then(done(function () {
                    assert.equals(spy.callCount, 6);
                }));
            },
            "Multiple call": function (done) {
                var spy = sinon.spy();
                this.api
                    .where("?subject ?predicate ?object")
                    .execute(spy)
                    .execute(spy)
                    .then(done(function () {
                    assert.equals(spy.callCount, 12);
                }));
            }
        },
        "//.filter": {
            setUp: function (done) {
                addStatements.call(this.api, done);
            },
            "Single call": function (done) {
                var spy = sinon.spy();
                this.api
                    .where("?subject ?predicate ?object")
                    .filter('?object = "{0}"', objJohnName)
                    .execute(spy)
                    .then(done(function () {
                    assert.equals(spy.callCount, 2);
                }));
            },
            "Multiple calls": function (done) {
                var spy = sinon.spy();
                this.api
                    .where("?subject ?predicate ?object")
                    .filter('?object = "{0}"', objJohnName)
                    .filter("?subject = <{0}>", subJohn)
                    .execute(spy)
                    .then(done(function () {
                    assert.equals(spy.callCount, 1);
                }));
            }
        },
        "//.getSubject": {
            setUp: function (done) {
                addStatements.call(this.api, done);
                this.subject = this.api.getSubject("test");
            },
            "Proper setup": function (done) {
                this.subject
                    .execute(done(function (test) {
                        assert.defined(test);
                    }));
            }
        },
        "//.group": {
            setUp: function (done) {
                addStatements.call(this.api, done);
            },
            "Single call": function (done) {
                var spy = sinon.spy();
                this.api
                    .select("?subject")
                    .where("?subject ?predicate ?object")
                    .group("?subject")
                    .execute(spy)
                    .then(done(function () {
                    assert.equals(spy.callCount, 2);
                }));
            },
            "Multiple calls": function (done) {
                var spy = sinon.spy();
                this.api
                    .select("?predicate")
                    .where("?subject ?predicate ?object")
                    .group("?subject")
                    .group("?predicate")
                    .execute(spy)
                    .then(done(function () {
                    assert.equals(spy.callCount, 3);
                }));
            }
        },
        "//.listStatement": {
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
        "//.load": {
            setUp: function () {
                buster.testRunner.timeout = 2000;
            },
            "Single call": function (done) {
                this.api
                    .load("http://localhost:8088/json-ld/simple.jsonld")
                    .size(done(function(size) {
                    assert.equals(size, 2);
                }));
            },
            "Multiple calls": function (done) {
                this.api
                    .load("http://localhost:8088/json-ld/people/arne.jsonld")
                    .load("http://localhost:8088/json-ld/people/manu.jsonld")
                    .size(done(function(size) {
                    assert.equals(size, 3);
                }));
            }
        },
        "//.optional": {
            setUp: function (done) {
                addStatements.call(this.api, done);
            },
            "Single call": function (done) {
                var spy = sinon.spy();
                this.api
                    .where('?subject <{0}> ?name'.format(preName))
                    .optional('?subject <{0}> ?homepage'.format(preHomepage))
                    .execute(spy)
                    .then(done(function () {
                    assert.equals(spy.callCount, 3);
                }))
            },
            "Single call, with multiple triples": function (done) {
                var spy = sinon.spy();
                this.api
                    .where('?subject <{0}> ?name'.format(preName))
                    .optional('?subject <{0}> ?homepage . ?subject <{0}> ?age', preHomepage, preAge)
                    .execute(spy)
                    .then(done(function () {
                    assert.equals(spy.callCount, 3);
                }))
            },
            "Single call, with variable injection": function (done) {
                var spy = sinon.spy();
                this.api
                    .where('?subject <{0}> ?name', preName)
                    .execute(spy)
                    .then(done(function () {
                    assert.equals(spy.callCount, 3);
                }))
            },
            "Multiple calls": function (done) {
                var spy = sinon.spy();
                this.api
                    .where('?subject <{0}> ?name'.format(preName))
                    .optional('?subject <{0}> ?homepage'.format(preHomepage))
                    .optional('?subject <{0}> ?age'.format(preAge))
                    .execute(spy)
                    .then(done(function () {
                    assert.equals(spy.callCount, 3);
                }))
            }
        },
        "//.prefix": {
            setUp: function (done) {
                addStatements.call(this.api, done);
            },
            "Single call": function (done) {
                var spy = sinon.spy();
                this.api
                    .prefix("foaf", "http://xmlns.com/foaf/0.1/")
                    .where("?subject foaf:age ?object")
                    .execute(spy)
                    .then(done(function () {
                    assert.equals(spy.callCount, 2);
                }));
            }
        },
        "//.query": {
            "Loading query": function (done) {
                var spy = sinon.spy();
                this.api
                    .load("http://localhost:8088/json-ld/people/arne.jsonld")
                    .query("http://localhost:8088/sparql/api.test.rq")
                    .execute(spy)
                    .then(done(function () {
                    assert.equals(spy.callCount, 1);
                }));
            },
            "//LOAD": {
                "JSON-LD": function (done) {
                    this.api
                        .query("LOAD <http://localhost:8088/json-ld/people/arne.jsonld>")
                        .execute()
                        .size(done(function (size) {
                        assert.equals(size, 2);
                    }))
                }
            },
            "//SELECT": {
                setUp: function (done) {
                    addStatements.call(this.api, done);
                },
                "called correctly": function (done) {
                    var spy = sinon.spy();
                    this.api
                        .query("SELECT ?s WHERE { ?s ?p ?o }")
                        .execute(spy)
                        .then(done(function () {
                        assert.equals(spy.callCount, 6);
                    }));
                },
                "//with group by": function (done) {
                    var spy = sinon.spy();
                    this.api
                        .query("SELECT (COUNT(?s) as ?count) WHERE { ?s ?p ?o } GROUP BY ?s")
                        .execute(function (count) {
                            assert.defined(count);
                            spy();
                        })
                        .then(done(function () {
                        assert.equals(spy.callCount, 2);
                    }));
                },
                "//with distinct": function (done) {
                    var spy = sinon.spy();
                    this.api
                        .query("SELECT DISTINCT ?s WHERE { ?s ?p ?o }")
                        .execute(function (s) {
                            assert.defined(s);
                            spy();
                        })
                        .then(done(function () {
                        assert.equals(spy.callCount, 2);
                    }));
                },
                "//with sum": function (done) {
                    var spy = sinon.spy();
                    this.api
                        .query("SELECT (SUM(?age) as ?totalAge) WHERE { ?s <http://xmlns.com/foaf/0.1/age> ?age }")
                        .execute(function (totalAge) {
                            assert.equals(totalAge, 99);
                            spy();
                        })
                        .then(done(function () {
                        assert.equals(spy.callCount, 1);
                    }));
                },
                "//with avg": function (done) {
                    var spy = sinon.spy();
                    this.api
                        .query("SELECT (AVG(?age) as ?avgAge) WHERE { ?s <http://xmlns.com/foaf/0.1/age> ?age }")
                        .execute(function (avgAge) {
                            assert.equals(avgAge, 49.5);
                            spy();
                        })
                        .then(done(function () {
                        assert.equals(spy.callCount, 1);
                    }));
                },
                "//with min": function (done) {
                    var spy = sinon.spy();
                    this.api
                        .query("SELECT (MIN(?age) as ?minAge) WHERE { ?s <http://xmlns.com/foaf/0.1/age> ?age }")
                        .execute(function (minAge) {
                            assert.equals(minAge, 42);
                            spy();
                        })
                        .then(done(function () {
                        assert.equals(spy.callCount, 1);
                    }));
                },
                "//with max": function (done) {
                    var spy = sinon.spy();
                    this.api
                        .query("SELECT (MAX(?age) as ?maxAge) WHERE { ?s <http://xmlns.com/foaf/0.1/age> ?age }")
                        .execute(function (maxAge) {
                            assert.equals(maxAge, 57);
                            spy();
                        })
                        .then(done(function () {
                        assert.equals(spy.callCount, 1);
                    }));
                },
                "//with variable inserted": function (done) {
                    var spy = sinon.spy();
                    this.api
                        .query("SELECT ?subject WHERE { ?subject <{0}> ?o }", "http://xmlns.com/foaf/0.1/age")
                        .execute(spy)
                        .then(done(function () {
                        assert.equals(spy.callCount, 2);
                    }));
                }
            }
        },
        "//.regex": {
            setUp: function (done) {
                addStatements.call(this.api, done);
            },
            "Without flags": function (done) {
                var spy = sinon.spy();
                this.api
                    .where("?subject ?predicate ?object")
                    .regex("?object", "john")
                    .execute(spy)
                    .then(done(function () {
                    assert.equals(spy.callCount, 0);
                }));
            },
            "With flags": function (done) {
                var spy = sinon.spy();
                this.api
                    .where("?subject ?predicate ?object")
                    .regex("?object", "john", "i")
                    .execute(spy)
                    .then(done(function () {
                    assert.equals(spy.callCount, 2);
                }));
            }
        },
        "//.removeStatement": {
            setUp: function (done) {
                addStatements.call(this.api, done);
            },
            "Single call": function (done) {
                this.api
                    .removeStatement(subJohn, preName, objJohnName)
                    .size(done(function (size) {
                        assert.equals(size, 5);
                    }));
            },
            "Multiple calls": function (done) {
                this.api
                    .removeStatement(subJohn, preName, objJohnName)
                    .removeStatement(subTim, preName, objTimName)
                    .size(done(function (size) {
                    assert.equals(size, 4);
                }));
            }
        },
        "//.select": {
            setUp: function (done) {
                addStatements.call(this.api, done);
            },
            "//Asterix variable": function (done) {
                this.api
                    .select("*")
                    .where("?subject ?predicate ?object")
                    .execute(function(subject, predicate, object) {
                        //console.log(arguments);
                        assert.defined(subject);
                        assert.defined(predicate);
                        assert.defined(object);
                    })
                    .then(done);
            },
            "//Single variable": function (done) {
                this.api
                    .select("?subject")
                    .where("?subject ?predicate ?object")
                    .execute(function (subject) {
                        assert.defined(subject);
                    })
                    .then(done);
            },
            "//Aliased variables": function (done) {
                this.api
                    .select("(?subject as ?s)")
                    .where("?subject ?predicate ?object")
                    .execute(function (s) {
                        assert.defined(s);
                    })
                    .then(done);
            },
            "//Multiple variables": function (done) {
                this.api
                    .select("?subject (?predicate as ?s)")
                    .where("?subject ?predicate ?object")
                    .execute(function (subject, s) {
                        assert.defined(subject);
                        assert.defined(s);
                    })
                    .then(done);
            }
        },
        ".size": function (done) {
            this.api
                .size(done(function (size) {
                    assert.equals(size, 0);
                }));
        },
        ".then": function (done) {
            this.api
                .then(done(function () {
                assert(true);
            }));
        },
        "//.where": {
            setUp: function (done) {
                addStatements.call(this.api, done);
            },
            "Single call": function (done) {
                var spy = sinon.spy();
                this.api
                    .where('?subject <{0}> "{1}"'.format(preName, objJohnName))
                    .execute(spy)
                    .then(done(function () {
                    assert.equals(spy.callCount, 2);
                }))
            },
            "Single call, with variable injected": function (done) {
                var spy = sinon.spy();
                this.api
                    .where('?subject <{0}> "{1}"', preName, objJohnName)
                    .execute(spy)
                    .then(done(function () {
                    assert.equals(spy.callCount, 2);
                }))
            },
            "Multiple calls": function (done) {
                var spy = sinon.spy();
                this.api
                    .where('?subject ?predicate "{0}"'.format(objJohnName))
                    .where('<{0}> ?predicate "{1}"'.format(subJohn, objJohnName))
                    .execute(spy)
                    .then(done(function () {
                    assert.equals(spy.callCount, 2);
                }))
            }
        },
        "//.where, no preloaded data": {
            "Simple BGP": function (done) {
                var spy = sinon.spy();
                this.api
                    .load("http://localhost:8088/json-ld/graphite-query/data.jsonld")
                    .query("http://localhost:8088/sparql/graphite-query/simple-bgp.rq")
                    .where("?user a foaf:Person")
                    .execute(spy)
                    .then(done(function () {
                    assert.equals(spy.callCount, 2);
                }));
            },
            "With optional": function (done) {
                var spy = sinon.spy();
                this.api
                    .load("http://localhost:8088/json-ld/graphite-query/data.jsonld")
                    .query("http://localhost:8088/sparql/graphite-query/optional.rq")
                    .where("?user foaf:knows <{0}>", "http://example.org/B")
                    .execute(spy)
                    .then(done(function () {
                    assert.equals(spy.callCount, 1);
                }))
            }
        },
        "//Attempts on SPARQL injection": {
            setUp: function (done) {
                addStatements.call(this.api, done);
            },
            "A simple example, injection succeeds": function (done) {
                var spy = sinon.spy();
                this.api
                    .query('SELECT ?s WHERE { ?s <{0}> "{1}" }'.format(preName, 'John Lennon" . ?s ?p ?o . }#'))
                    .execute(spy)
                    .then(done(function () {
                    assert.equals(spy.callCount, 6);
                }));
            },
            "A simple example, injection fails": function (done) {
                var spy = sinon.spy();
                this.api
                    .query('SELECT ?s WHERE { ?s <{0}> "{1}" }', preName, 'John Lennon" . ?s ?p "Tim Berners-Lee" . }#')
                    .execute(spy)
                    .then(done(function () {
                    assert.equals(spy.callCount, 0);
                }));
            }
        }
    });
});
