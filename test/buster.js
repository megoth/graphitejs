var config = module.exports;

config["Graphite tests - node"] = {
	rootPath: "../",
	tests: [
		"test/*.test.js"
	],
	environment: "node"
};

config["Graphite tests - browser"] = {
	rootPath: "../",
	tests: [
		"test/*.test.js"
	],
	environment: "browser",
	sources: [
		"lib/when.js",
		"lib/graphite.core.js",
		"lib/graphite.loader.js",
		"lib/graphite.graph.js",
		"lib/graphite.parser.js",
		"lib/graphite.parser.jsonld.js",
		"lib/graphite.parser.rdfjson.js",
		"lib/graphite.serializer.js",
		"lib/graphite.serializer.jsonld.js",
		"lib/graphite.serializer.rdfjson.js",
		"lib/graphite.when.js",
		"lib/graphite.api.js"
	]
};
