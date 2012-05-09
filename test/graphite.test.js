if (typeof module == "object" && typeof require == "function") {
    var buster = require("buster");
    var graphite = require(".././graphite/core.js").graphite;
}

define([
    "src/graphite"
], function (Core) {
    buster.testCase("Graphite core", {
        "Basic setup": function () {
            assert.defined(Core);
            assert.isFunction(Core);
        }
    });

});