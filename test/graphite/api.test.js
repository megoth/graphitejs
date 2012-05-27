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
        preHomepage = "http://xmlns.com/foaf/0.1/homepage",
        objJohnName = "John Lennon",
        subTim = "http://dbpedia.org/resource/Tim_B_Lee",
        objTimName = "Tim Berners-Lee",
        objTimHomepage = "http://www.w3.org/People/Berners-Lee/";
        //uriInteger = "http://www.w3.org/2001/XMLSchema#integer",
        //preKnows = "http://xmlns.com/foaf/0.1/knows";
    function addStatements (done) {
        this.addStatement(subJohn, preName, objJohnName)
            .addStatement(subTim, preName, objTimName)
            .addStatement(subTim, preHomepage, objTimHomepage)
            .addStatement(subTim, preName, objJohnName)
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
                }))
            }
        },
        "//Function .each": {
            setUp: function (done) {
                addStatements.call(this.api, done);
            },
            "By default returns all triples in a graph": function (done) {
                var spy = sinon.spy();
                this.api
                    .each(spy)
                    .then(done(function () {
                    assert(spy.callCount, 4);
                }));
            }
        },
        "//Function .listStatement": {
            setUp: function (done) {
                addStatements.call(this.api, done);
            },
            "List all triples": function () {
                var spy = sinon.spy(),
                    list = this.g.listStatements(spy);
                assert.isArray(list);
                assert(spy.called);
                assert.equals(spy.callCount, 4);
            },
            "//Listing with a specific subject": function () {
                "use strict";
                var spy = sinon.spy(),
                    list = this.g.listStatements({
                        subject: subJohn
                    }, spy);
                assert.equals(list.length, 1);
                assert(spy.calledOnce);
                spy = sinon.spy();
                list = this.g.listStatements({
                    subject: subTim
                }, spy);
                assert.equals(list.length, 3);
                assert(spy.calledThrice);
            },
            "//Listing with a specific predicate": function () {
                "use strict";
                var spy = sinon.spy(),
                    list = this.g.listStatements({
                        predicate: preHomepage
                    }, spy);
                assert.equals(list.length, 1);
                assert(spy.calledOnce);
                spy = sinon.spy();
                list = this.g.listStatements({
                    predicate: preName
                }, spy);
                assert.equals(list.length, 3);
                assert(spy.calledThrice);
            },
            "//Listing with a specific object": function () {
                "use strict";
                var spy = sinon.spy(),
                    list = this.g.listStatements({
                        object: objJohnName
                    }, spy);
                assert.equals(list.length, 2);
                assert(spy.calledTwice);
                spy = sinon.spy();
                list = this.g.listStatements({
                    object: objTimHomepage
                }, spy);
                assert.equals(list.length, 1);
                assert(spy.calledOnce);
                spy = sinon.spy();
                list = this.g.listStatements({
                    object: objTimName
                }, spy);
                assert.equals(list.length, 1);
                assert(spy.calledOnce);
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
        "//Function .query": {
            setUp: function (done) {
                addStatements.call(this.api, done);
            },
            "SELECT": function (done) {
                var spy = sinon.spy();
                this.api
                    .query("SELECT * WHERE { ?s ?p ?o }")
                    .each(spy)
                    .then(done(function () {
                    assert(spy.callCount, 4);
                }))
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
                "use strict";
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
                "use strict";
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
                "use strict";
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
                "use strict";
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
                "use strict";
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
        "//Function .select": {
            setUp: function (done) {
                addStatements.call(this.api, done);
            },
            "Single call": function (done) {
                var spy = sinon.spy();
                this.api
                    .select("?s")
                    .each(function (s) {
                        assert(s);
                        spy();
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
        "//Function .where": {
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
