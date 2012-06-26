var config = module.exports;

config["Demo music app tests"] = {
    environment: "browser",
    rootPath: "../../",
    sources: [
        "src/*.js",
        "src/*/*.js",
        "src/*/*/*.js"
    ],
    tests: [
        "demo-music/test/app.test.js"
    ],
    libs: [
        "lib/*.js"
    ],
    extensions: [
        require("buster-amd")
    ]
};
