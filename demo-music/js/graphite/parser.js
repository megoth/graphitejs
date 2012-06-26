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
     * @param {String|Object} format The data to be parsed
     * @param {String} format The MIME format of the data to be parsed
     * @param {Object} options Various options available for the parser
     * @param {Function} callback The function to call when the data is parsed; parameter is
     * the graph assembled, given in form of Dictionary.Formula
     */
    return function (data, format, options, callback) {
        var graph,
            parts;
        //console.log("IN PARSER", format, parsers[format]);
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