/*global assert, module, require*/
if (typeof module === "object" && typeof require === "function") {
    var buster = require("buster");
}

define([
    "src/graphite/api"
], function(API) {
    buster.testCase("Graphite API", {
        setUp: function () {
            "use strict";
        },
        "Default return the API object": function () {
            "use strict";
            assert.defined(API);
            assert.isFunction(API);
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
        }
    });
});
