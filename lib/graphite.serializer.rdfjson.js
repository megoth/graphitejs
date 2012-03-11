if (typeof module == "object" && typeof require == "function") {
	graphite = require("./graphite.core").graphite;
	require("./graphite.serializer");
}

(function(graphite, serializer) {
	var rdfjson = function(graph) {
		var json = {};
		graphite.each(graph.subject, function(subject, key) {
			json[subject.value] = {};
			graphite.each(subject.predicate, function(predicate, key) {
				json[subject.value][predicate.value] = [];
				graphite.each(predicate.object, function(object, key) {
					json[subject.value][predicate.value].push(object);
				});
			});
		});
		return json;
	};
	
	serializer.rdfjson = rdfjson;
	return rdfjson;
}(graphite, graphite.serializer));
