/*global assert, console, module, refute, require*/
define([
    "src/graphite/queryparser"
], function (Parser) {
    buster.testCase("Graphite parser", {
        "Has proper Setup": function () {
            assert.defined(Parser);
            assert.isFunction(Parser);
        },
        "Loads the SPARQL parser": function () {
            var sparqlParser = Parser("sparql");
            assert.defined(sparqlParser);
            assert.isObject(sparqlParser);
        }
    });
});