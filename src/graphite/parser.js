define([
    "./utils",
    "./dictionary",
    "./graph",
    "./parser/jsonld",
    "./parser/rdfjson",
    "../rdfquery/parser/rdfxml",
    "../rdfquery/parser/turtle"
], function (Utils, Dictionary, Graph, JSONLD, RDFJSON, RDFXML, TTL) {
    var parsers = {
        "json": JSONLD,
        "jsonld": JSONLD,
        "json-ld": JSONLD,
        "rdfjson": RDFJSON,
        "rdf/json": RDFJSON,
        "rdf+json": RDFJSON,
        "rdfxml": RDFXML,
        "rdf/xml": RDFXML,
        "rdf+xml": RDFXML,
        "ttl": TTL,
        "turtle": TTL
    };
    /**
     * The parser object
     */
    return function (data, format, options, callback) {
        var graph,
            parts;
        //buster.log("IN PARSER", format, parsers[format]);
        if (!callback && Utils.isFunction(options)) {
            callback = options;
            options = {};
        }
        if (parsers[format]) {
            parsers[format](data, options, callback);
        } else {
            throw new Error("Format not recognized");
        }
    };
});