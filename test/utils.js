define([
    "src/graphite/loader"
], function (Loader) {
    "use strict";
    var Utils = {};
    Utils.openFile = function (pathToFile, callback) {
        Loader({
            uri: pathToFile,
            success: callback
        });
    };
    Utils.parseJsonFile = function (pathToFile, parser, options, callback) {
        Utils.openFile(pathToFile, function (err, data) {
            parser(JSON.parse(data), options, callback);
        });
    };
    Utils.parseFile = function (pathToFile, parser, options, callback) {
        Utils.openFile(pathToFile, function (err, data) {
            parser(data, options, callback);
        });
    };
    return Utils;
});