var config = module.exports;

config["Graphite tests - browser"] = {
    environment: "browser",
    rootPath: "../",
    sources: [
        "src/*.js",
        "src/*/*.js",
        "src/*/*/*.js"
    ],
    tests: [
        "test/utils.js",
        "test/*.test.js",
        "test/*/*.test.js",
        "test/*/*/*.test.js"
    ],
    tests: [
        "test/utils.js",
        //"test/graphite/api.test.js",
        "test/graphite/graph.test.js",
        //"test/graphite/query.test.js"
    ],
    libs: [
        "lib/*.js"
    ],
    extensions: [
        require("buster-amd")
    ]
};
