/*global assert, buster, define */
define([
    "src/graphite"
], function (Core) {
    "use strict";
    buster.testCase("Graphite core", {
        "Basic setup": function () {
            assert.defined(Core);
            assert.isFunction(Core);
        }
    });
});