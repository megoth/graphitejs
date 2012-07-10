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
        "test/graphite/*.test.js",
        "test/graphite/*/*.test.js"
    ],
    tests: [
        "test/utils.js",
        "test/rdfquery/*.test.js",
        "test/rdfquery/*/*.test.js"
    ],
    tests: [
        "test/utils.js",
        "test/rdfstore/*/*.test.js"
    ],
    tests: [
        "test/utils.js",
        "test/rdfstore/query-engine/query_filters.test.js"
    ],
    libs: [
        "lib/*.js"
    ],
    extensions: [
        require("buster-amd")
        //require("buster-lint")
    ]
    /*,
    "buster-lint": {
        excludes: [
            "rdfquery",
            "rdfstore"
        ],
        linterOptions: {
            maxlen: 200
        }
    }
    */
};
