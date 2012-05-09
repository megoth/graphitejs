/*global assert, module, require*/
if (typeof module === "object" && typeof require === "function") {
    var buster = require("buster");
}
define([
    "src/graphite/serializer"
], function (Serializer) {
    buster.testCase("Graphite Serializer", {
        "Proper setup": function () {
            assert.defined(Serializer);
            assert.isFunction(Serializer);
        }
    })
});