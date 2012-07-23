/*global define */
define([
    "../rdf",
    "../utils"
], function (RDF, Utils) {
    "use strict";
    return function (json, options, callback) {
        var graph = RDF.Formula(options.graph);
        if (!json) {
            throw new Error("No valid JSON-object given");
        } else if (Utils.isString(json)) {
            try {
                json = JSON.parse(json);
            } catch (e) {
                throw new Error("Couldn't parse given rdfjson: " + e);
            }
        }
        Utils.each(json, function (predicates, subject) {
            subject = subject[0] === "_" ?
                    RDF.BlankNode(subject) :
                    RDF.Symbol(subject);
            Utils.each(predicates, function (objects, predicate) {
                predicate = RDF.Symbol(predicate);
                Utils.each(objects, function (object) {
                    if (Utils.isObject(object)) {
                        if (object.type === "literal") {
                            object = RDF.Literal(object.value, object.lang, object.datatype);
                        } else {
                            object = RDF.Symbol(object.value);
                        }
                    } else {
                        object = RDF.Literal(object);
                    }
                    graph.add(subject, predicate, object);
                });
            });
        });
        callback(graph);
    };
});