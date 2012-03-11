if (typeof module == "object" && typeof require == "function") {
	graphite = require("./graphite.core").graphite;
	require("./graphite.graph");
	require("./graphite.parser");
}

(function(graphite, graph, parser) {
	var rdfjson = function(json, callback) {
		if (!json) {
			throw Error("No valid JSON-object given");
		}
		
		var graph = Object.create(graphite.graph);
		graph.init();
		graphite.each(json, function(predicates, subject) {
			graphite.each(predicates, function(objects, predicate) {
				graphite.each(objects, function(object, key) {
					graph.add(subject, predicate, object);
				});
			});
		});
		callback(graph);
	};
	
	parser.rdfjson = rdfjson;
	return rdfjson;
}(graphite, graphite.graph, graphite.parser));
