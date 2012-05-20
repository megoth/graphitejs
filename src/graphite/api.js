define([
    "./dictionary",
    "./graph",
    "./query",
    "./utils",
    "./when"
], function (Dictionary, Graph, Query, Utils, When) {
    var api = function (options) {
        return new api.prototype.init(options);
    };

    api.prototype = {
        init: function (options) {
            var that = this;
            that.promises = [ When.defer() ];
            Graph().then(function (graph) {
                that.graph = graph;
                that.promises[0].resolve(true);
            });
            this.query = Query();
        },
        addStatement: function (subject, predicate, object, callback) {
            var that = this,
                statement = Dictionary.createStatement({
                    subject: subject,
                    predicate: predicate,
                    object: object
                }),
                promise = When.defer();
            When.all(this.promises).then(function () {
                that.graph.execute("INSERT DATA {{0}}".format(statement)).then(function (graph) {
                    that.graph = graph;
                    promise.resolve(graph);
                });
            });
            this.promises.push(promise);
            return this;
        },
        /**
         * @param uri
         * @param [options]
         */
        load: function (uri, options) {
            var that = this,
                promise = When.defer();
            When.all(this.promises).then(function () {
                that.graph.execute("LOAD <{0}>".format(uri)).then(function (graph) {
                    that.graph = graph;
                    promise.resolve(graph);
                });
            });
            this.promises.push(promise);
            return this;
        },
        size: function () {
            var that = this,
                promise = When.defer();
            When.all(that.promises).then(function () {
                that.graph.size().then(function (size) {
                    buster.log("IN API, SIZE", size);
                    promise.resolve(size);
                });
            });
            this.promises.push(promise);
            return this;
        },
        then: function (callback) {
            When.all(this.promises).then(function (results) {
                buster.log("IN API, THEN", results);
                callback(Utils.last(results));
            });
            return this;
        }
    };
    api.prototype.init.prototype = api.prototype;
    return api;
});