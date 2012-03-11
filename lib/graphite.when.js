if (typeof module == "object" && typeof require == "function") {
	graphite = require("./graphite.core").graphite;
	when = require("./when");
}

(function(global, graphite) {
	var when = global.when || require("./when");
	graphite.when = when;
	return when;
}(typeof window === 'undefined' ? this : window, graphite));
