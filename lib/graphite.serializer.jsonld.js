if (typeof module == "object" && typeof require == "function") {
	graphite = require("./graphite.core").graphite;
	require("./graphite.serializer");
}

(function(graphite, serializer) {
	var jsonld = function(graph) {
		var json = [];
		var node;
		graphite.each(graph.subject, function(subject, key) {
			node = {};
			node["@id"] = subject.value;
			graphite.each(subject.predicate, function(predicate, key) {
				if(predicate.object.length > 1) {
					node[predicate.value] = [];
					graphite.each(predicate.object, function(object, key) {
						node[predicate.value].push(getObject(object, predicate));
					});
				} else {
					node[predicate.value] = getObject(predicate.object[0], predicate);
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
	
	serializer.jsonld = jsonld;
	return jsonld;
}(graphite, graphite.serializer));
