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
        "test/graphite/api.test.js",
        "test/graphite/query.test.js",
        "test/graphite/tokenizer/sparql.test.js"
    ],
    libs: [
        "lib/*.js"
    ],
    extensions: [
        require("buster-amd")
    ]
};
