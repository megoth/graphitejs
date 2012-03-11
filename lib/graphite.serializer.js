if (typeof module == "object" && typeof require == "function") {
	graphite = require("./graphite.core").graphite;
}

(function(graphite) {
	/*
	 * The serializer object
	 */
	var serializer = {};
	
	graphite.serializer = serializer;
	return serializer;
}(graphite));
