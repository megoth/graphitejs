/*global assert, buster, graphite, module, require*/
if (typeof module === "object" && typeof require === "function") {
    var buster = require("buster");
    var sinon = require("sinon");
}

define([
    "src/rdfquery/parser/turtle",
    "src/graphite/utils",
    "src/graphite/when",
    "../../utils"
], function (Parser, Utils, When, TestUtils) {
    function badTest(testSuitePath, parser, num) {
        var deferred = When.defer();
        TestUtils.openFile(testSuitePath + "bad-" + num + ".ttl", function (err, data) {
            try {
                parser(data);
                assert(false);
            } catch (e) {
                assert(true);
                deferred.resolve(e);
            }
        });
        return deferred;
    }

    function goodTest(testSuitePath, parser, num, numOfStatement) {
        var deferred = When.defer();
        TestUtils.parseFile(testSuitePath + "test-" + num + ".ttl", parser, function (triple) {
            buster.log("TRIPLE", triple);
            assert.equals(triple.length, numOfStatement, "test " + num);
            deferred.resolve(true);
        });
        return deferred;
    }

    buster.testCase("Graphite parser (TURTLE)", {
        setUp: function () {
            this.testSuitePath = "http://localhost:8088/turtle/";
        },
        "Parser has proper setup": function () {
            assert.defined(Parser);
            assert.isFunction(Parser);
        },
        "Parser fires callback": function (done) {
            var spy = sinon.spy();
            TestUtils.openFile(this.testSuitePath + "test-00.ttl", done(function (err, triple) {
                Parser(triple, {}, spy);
                assert(spy.calledOnce);
            }));
        },
        "Test-suite from http://www.w3.org/TeamSubmission/turtle/tests/": {
            "bad tests": function (done) {
                var testSuitePath = this.testSuitePath,
                    parser = Parser,
                    tests = [
                        "00",
                        "01",
                        "02",
                        "03",
                        "04",
                        "05",
                        "06",
                        "07",
                        "08",
                        "09",
                        "10",
                        "11",
                        "12",
                        "13"
                    ],
                    promises = [];
                Utils.each(tests, function (test) {
                    promises.push(badTest(testSuitePath, parser, test));
                });
                When.all(promises).then(done);
            },
            "good tests": function (done) {
                var testSuitePath = this.testSuitePath,
                    parser = Parser,
                    tests = {
                        "00": 1,
                        "01": 3,
                        "02": 3,
                        "03": 3,
                        "04": 2,
                        "05": 4,
                        "06": 1,
                        "07": 5,
                        "08": 1,
                        "09": 4,
                        "10": 5,
                        "11": 4,
                        "12": 4,
                        "13": 2
                    },
                    promises = [];
                Utils.each(tests, function (numStatements, test) {
                    promises.push(goodTest(testSuitePath, parser, test, numStatements));
                });
                When.all(promises).then(done);
            }
        }
    });
});

(function () {
    "use strict";
}());
