/*global assert, buster, module, require*/
if (typeof module === "object" && typeof require ===  "function") {
    var buster = require("buster");
}
define([
    "src/rdfstore/communication/n3_parser",
    "src/graphite/loader"
], function (N3Parser, Loader) {
    buster.testCase("RDFStore N3Parser", {
        "testParsing 1": function (done) {
            Loader({
                uri: "http://localhost:8088/n3/sp2b_10k.n3",
                success: done(function (err, data) {
                    var result = N3Parser.parser.parse(data);
                    assert.equals(result.length, 31);
                })
            })
        }
    });
});