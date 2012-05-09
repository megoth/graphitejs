/*global assert, console, module, refute, require*/
if (typeof module === "object" && typeof require === "function") {
    var buster = require("buster");
}

define([
    "src/graphite/parser",
    "src/graphite/utils",
    "src/graphite/when",
    "../utils"
], function (Parser, Utils, When, TestUtils) {
    function loadParser(data, format) {
        var deferred = When.defer();
        Parser(data, format, {}, function (graph) {
            deferred.resolve(graph.statements);
        });
        return deferred;
    }
    buster.testCase("Graphite parser", {
        "Has proper Setup": function () {
            assert.defined(Parser);
            assert.isFunction(Parser);
        },
        "Loads the JSON-LD parser": function (done) {
            TestUtils.openFile("http://localhost:8088/json-ld/simple.jsonld", function (err, data) {
                When.all([
                    loadParser(data, "jsonld"),
                    loadParser(data, "json-ld")
                ]).then(done(function (results) {
                        Utils.each(results, function (r) {
                            assert.isArray(r);
                        });
                    }));
            });
        },
        "Loads the RDF+JSON parser": function (done) {
            TestUtils.openFile("http://localhost:8088/rdfjson/test.rdfjson", function (err, data) {
                //buster.log("DATA", data);
                When.all([
                    loadParser(data, "rdfjson"),
                    loadParser(data, "rdf+json"),
                    loadParser(data, "rdf/json")
                ]).then(done(function (results) {
                        Utils.each(results, function (r) {
                            assert.isArray(r);
                        });
                    }));
            });
        },
        "Loads the RDF/XML parser": function (done) {
            TestUtils.openFile("http://localhost:8088/rdfxml/amp-in-url/test001.rdf", function (err, data) {
                When.all([
                    loadParser(data, "rdfxml"),
                    loadParser(data, "rdf/xml"),
                    loadParser(data, "rdf+xml")
                ]).then(done(function (results) {
                        Utils.each(results, function (r) {
                            assert.isArray(r);
                        });
                    }));
            });
        },
        "Loads the Turtle parser": function (done) {
            TestUtils.openFile("http://localhost:8088/turtle/test-00.ttl", function (err, data) {
                When.all([
                    loadParser(data, "turtle"),
                    loadParser(data, "ttl")
                ]).then(done(function (results) {
                        Utils.each(results, function (r) {
                            assert.isArray(r);
                        });
                    }));
            });
        }
    });
});