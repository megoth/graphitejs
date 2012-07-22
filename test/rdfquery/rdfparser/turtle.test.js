/*global assert, buster, graphite, module, require*/
define([
    "src/rdfquery/rdfparser/turtle",
    "src/graphite/utils",
    "src/graphite/promise",
    "../../utils"
], function (Parser, Utils, Promise, TestUtils) {
    function badTest(testSuitePath, parser, num, expectedMessage) {
        var deferred = Promise.defer(),
            result = {
                description: "test " + num,
                expected: expectedMessage
            };
        TestUtils.openFile(testSuitePath + "bad-" + num + ".ttl", function (err, data) {
            try {
                parser(data, {});
                result.message = "This test shouldn't pass...";
            } catch (e) {
                //console.log(e);
                result.message = e;
            }
            deferred.resolve(result);
        });
        return deferred;
    }
    function goodTest(testSuitePath, parser, num, numOfStatement) {
        var deferred = Promise.defer();
        TestUtils.parseFile(testSuitePath + "test-" + num + ".ttl", parser, {}, function (graph) {
            deferred.resolve({
                counted: graph.statements.length,
                description: "test " + num,
                expected: numOfStatement
            });
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
                    tests = {
                        "00": "Invalid Turtle: Expecting ':', found '<#> .\n...'",
                        "01": "Invalid Turtle: Expecting ':', found '[ :b :c ] :d .\n...'",
                        "02": "Invalid Turtle: Expecting ':', found '[] :b .\n...'",
                        "03": "Invalid Turtle: Expecting ':', found ' :a :b .\n...'",
                        "04": "Invalid Turtle: Expecting ':', found ', \"banana\" ) .\n...'",
                        "05": "Invalid Turtle: Expecting ':', found '{ :a :b :c . } :d :e...'",
                        "06": "Invalid Turtle: Expecting ':', found ' :b of :c .\n...'",
                        "07": "Invalid Turtle: Expecting ':', found '.:b.:c .\n:a^:b^:c .\n...'",
                        "08": "Invalid Turtle: Unrecognised directive: @keywords something.\n# @keywords is not in turtle\n",
                        "09": "Invalid Turtle: Expecting ':', found '=> :b .\n...'",
                        "10": "Invalid Turtle: Expecting ':', found '= :b .\n...'",
                        "11": "Invalid Turtle: Unrecognised directive: @forAll :x .\n",
                        "12": "Invalid Turtle: Unrecognised directive: @forSome :x .\n",
                        "13": "Invalid Turtle: Expecting '>', found '\n...'"
                    },
                    promises = Utils.map(tests, function (expectedMessage, test) {
                        return badTest(testSuitePath, parser, test, expectedMessage);
                    });
                Promise.all(promises).then(done(function (results) {
                    Utils.each(results, function (r) {
                        assert.equals(r.message, r.expected, r.description);
                    });
                }));
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
                Promise.all(promises).then(done(function (results) {
                    Utils.each(results, function (r) {
                        assert.equals(r.counted, r.expected, r.description);
                    });
                }));
            }
        }
    });
});
