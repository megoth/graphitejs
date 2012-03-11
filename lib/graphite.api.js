define('graphite.api', ['graphite.core'], function(graphite) {
	/*
	 * The API object, the chainable object returned if no URI or query is given
	 */
	var api = {};
	
	api.test = function() {
	
	};
	
	graphite.init(function API(arg) {
		if(!arg || typeof arg === "object") {
			return api;
		}
		if(arg.match(/^http/)) {
			return graphite.load;
		} else if (arg.match(/SELECT/)) {
			return graphite.query;
		}
		throw new Error("Not a valid argument");
	});
	
	return api;
});
