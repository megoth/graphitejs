/*global assert, buster, refute*/
if (typeof module === "object" && typeof require === "function") {
    var buster = require("buster");
}

define([
    "src/graphite/api"
], function(API) {
    "use strict";
    buster.testCase("Graphite API", {
        setUp: function () {
            this.subJohn = "http://dbpedia.org/resource/John_Lennon";
            this.preName = "http://xmlns.com/foaf/0.1/name";
            this.preHomepage = "http://xmlns.com/foaf/0.1/homepage";
            this.objJohnName = "John Lennon";
            this.subTim = "http://dbpedia.org/resource/Tim_B_Lee";
            this.objTimName = "Tim Berners-Lee";
            this.objTimHomepage = "http://www.w3.org/People/Berners-Lee/";
            this.uriInteger = "http://www.w3.org/2001/XMLSchema#integer";
            this.preKnows = "http://xmlns.com/foaf/0.1/knows";
            this.api = API();
        },
        "Default return the API object": function () {
            assert.defined(API);
            assert.isFunction(API);
        },
        "Function .addStatement": {
            "Adding a triple, returns the modified object": function (done) {
                this.api
                    .addStatement(this.subJohn, this.preName, this.objJohnName)
                    .size()
                    .then(done(function (size) {
                        assert.equals(size, 1);
                    }));
            },
            "//Adding a triple fires a callback": function () {
                var spy = sinon.spy();
                this.g.addStatement(this.subJohn, this.preName, this.objJohnName, spy);
                assert(spy.calledOnce);
            },
            "//Adding a triple fires a callback which contains a statement": function (done) {
                var that = this;
                this.g.addStatement(this.subJohn, this.preName, this.objJohnName, done(function (s) {
                    assert.equals(s.subject, that.subJohn);
                    assert.equals(s.predicate, that.preName);
                    assert.equals(s.object, that.objJohnName);
                }));
            },
            "//Adding a blank node": function () {
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
        "//Function .listStatement": {
            setUp: function () {
                "use strict";
                this.g.addStatement(this.subJohn, this.preName, this.objJohnName);
                this.g.addStatement(this.subTim, this.preName, this.objTimName);
                this.g.addStatement(this.subTim, this.preHomepage, this.objTimHomepage);
                this.g.addStatement(this.subTim, this.preName, this.objJohnName);
            },
            "List all triples": function () {
                var spy = sinon.spy(),
                    list = this.g.listStatements(spy);
                assert.isArray(list);
                assert(spy.called);
                assert.equals(spy.callCount, 4);
            },
            "Listing with a specific subject": function () {
                "use strict";
                var spy = sinon.spy(),
                    list = this.g.listStatements({
                        subject: this.subJohn
                    }, spy);
                assert.equals(list.length, 1);
                assert(spy.calledOnce);
                spy = sinon.spy();
                list = this.g.listStatements({
                    subject: this.subTim
                }, spy);
                assert.equals(list.length, 3);
                assert(spy.calledThrice);
            },
            "Listing with a specific predicate": function () {
                "use strict";
                var spy = sinon.spy(),
                    list = this.g.listStatements({
                        predicate: this.preHomepage
                    }, spy);
                assert.equals(list.length, 1);
                assert(spy.calledOnce);
                spy = sinon.spy();
                list = this.g.listStatements({
                    predicate: this.preName
                }, spy);
                assert.equals(list.length, 3);
                assert(spy.calledThrice);
            },
            "Listing with a specific object": function () {
                "use strict";
                var spy = sinon.spy(),
                    list = this.g.listStatements({
                        object: this.objJohnName
                    }, spy);
                assert.equals(list.length, 2);
                assert(spy.calledTwice);
                spy = sinon.spy();
                list = this.g.listStatements({
                    object: this.objTimHomepage
                }, spy);
                assert.equals(list.length, 1);
                assert(spy.calledOnce);
                spy = sinon.spy();
                list = this.g.listStatements({
                    object: this.objTimName
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
        "//Function .removeStatement": {
            setUp: function () {
                "use strict";
                this.g.addStatement(this.subJohn, this.preName, this.objJohnName);
                this.g.addStatement(this.subTim, this.preName, this.objTimName);
                this.g.addStatement(this.subTim, this.preHomepage, this.objTimHomepage);
                this.g.addStatement(this.subTim, this.preName, this.objJohnName);
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
                    subject: this.subJohn,
                    predicate: this.preName,
                    object: this.objJohnName
                }).length, 1);
            },
            "//Remove with all specified": function () {
                "use strict";
                var spy = sinon.spy(),
                    subJohn = this.subJohn,
                    preName = this.preName,
                    objJohnName = this.objJohnName;
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
                    subJohn = this.subJohn;
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
                    preName = this.preName;
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
                    objJohnName = this.objJohnName;
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
        "Function .size": function (done) {
            this.api.size().then(done(function (size) {
                buster.log("IN API TEST, SIZE", size);
                assert.equals(size, 0);
            }));
        }
    });
});
