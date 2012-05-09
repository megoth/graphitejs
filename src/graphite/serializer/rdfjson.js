define([
    "../utils"
], function (Utils) {
    return function(graph) {
        var json = {},
            object,
            predicate,
            subject;
        Utils.each(graph.listStatements(), function(statement) {
            subject = statement.getSubject().value;
            predicate = statement.getPredicate().value;
            object = statement.getObject();
            if(!json[subject]) {
                json[subject] = {};
            }
            if(!json[subject][predicate]) {
                json[subject][predicate] = []
            }
            json[subject][predicate].push(object);
        });
        return json;
    };
});