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
    Utils.parseJsonFile = function (pathToFile, parser, callback) {
        Utils.openFile(pathToFile, function (err, data) {
            parser(JSON.parse(data), {}, callback);
        });
    };
    Utils.parseFile = function (pathToFile, parser, callback) {
        Utils.openFile(pathToFile, function (err, data) {
            parser(data, {}, callback);
        });
    };
    return Utils;
});