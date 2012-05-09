define([
    "../utils"
], function (Utils) {
    var jsonld = function(graph) {
        var json = [],
            list,
            node,
            object,
            predicate,
            tmp;
        Utils.each(graph.listSubjects(), function(subject) {
            node = {};
            node["@id"] = subject.value;
            list = graph.listStatements({
                subject: subject
            }.value);
            Utils.each(list, function(statement) {
                predicate = statement.getPredicate();
                object = statement.getObject();
                if(node[predicate.value]) {
                    if(!Utils.isArray(node[predicate.value])) {
                        node[predicate.value] = [ node[predicate.value] ];
                    }
                    node[predicate.value].push(getObject(object, predicate));
                } else {
                    node[predicate.value] = getObject(object, predicate);
                }
            });
            json.push(node);
        });
        return json;
    };
    function getObject(object, predicate) {
        var obj;
        if(object.datatype || object.lang) {
            obj = {};
            obj["@id"] = object.value;
            if(object.datatype && object.datatype !== predicate.value) {
                obj["@type"] = object.datatype;
            }
            if(object.lang) {
                obj["@lang"] = object.lang;
            }
        } else {
            obj = object.value;
        }
        return obj;
    };
    return jsonld;
});