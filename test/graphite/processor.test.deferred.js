/*global assert, module, require*/
if (typeof module === "object" && typeof require === "function") {
    var buster = require("buster");
}
define([
    "src/graphite/processor"
], function (Processor) {
    buster.testCase("Graphite processor", {
        "Proper setup": function () {
            "use strict";
            assert.defined(Processor)
            assert.isFunction(Processor);
        }
    });
});