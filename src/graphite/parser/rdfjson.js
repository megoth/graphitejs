define([
    "../dictionary",
    "../utils"
], function (Dictionary, Utils) {
    return function(json, options, callback) {
        var graph = Dictionary.Formula(options.graph);
        if (!json) {
            throw Error("No valid JSON-object given");
        } else if (Utils.isString(json)) {
            try {
                json = JSON.parse(json);
            } catch (e) {
                throw new Error("Couldn't parse given rdfjson: " + e);
            }
        }
        Utils.each(json, function(predicates, subject) {
            subject = subject[0] === "_" ?
                Dictionary.BlankNode(subject) :
                Dictionary.Symbol(subject);
            Utils.each(predicates, function(objects, predicate) {
                predicate = Dictionary.Symbol(predicate);
                Utils.each(objects, function(object) {
                    if (Utils.isObject(object)) {
                        if (object.type === "literal") {
                            object = Dictionary.Literal(object.value, object.lang, object.datatype);
                        } else {
                            object = Dictionary.Symbol(object.value);
                        }
                    } else {
                        object = Dictionary.Literal(object);
                    }
                    graph.add(subject, predicate, object);
                });
            });
        });
        callback(graph);
    };
});