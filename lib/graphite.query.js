if (typeof module == "object" && typeof require == "function") {
	graphite = require("./graphite.core").graphite;
}

(function(graphite) {
	var query = {};
	
	graphite.query = query;
	return query;
}(graphite));
