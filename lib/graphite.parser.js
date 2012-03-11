if (typeof module == "object" && typeof require == "function") {
	graphite = require("./graphite.core").graphite;
}

(function(graphite) {
	/*
	 * The parser object
	 */
	var parser = {};
	
	graphite.parser = parser;
	return parser;
}(graphite));
