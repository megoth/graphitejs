/*global define */
define([
    "src/graphite/loader"
], function (loader) {
    "use strict";
    var Utils = {};
    Utils.openFile = function (pathToFile, callback) {
        loader({
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