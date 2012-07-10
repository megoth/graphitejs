/*global define */
define([
    "./queryparser/sparql"
], function (SPARQL) {
    "use strict";
    var parsers = {
        "sparql": SPARQL
    };
    /**
     * The parser object
     * @param {String} format The type of query that is loaded
     */
    return function (format) {
        if (parsers[format]) {
            return parsers[format];
        }
        throw new Error("Format not recognized");
    };
});