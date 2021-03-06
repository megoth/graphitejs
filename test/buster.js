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
