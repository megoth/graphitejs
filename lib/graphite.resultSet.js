if (typeof module == "object" && typeof require == "function") {
	graphite = require("./graphite.core").graphite;
}

(function(graphite) {
	/*
	 * The ResultSet object
	 */
	var resultSet = {};
	
	graphite.resultSet = resultSet;
	return resultSet;
}(graphite));
