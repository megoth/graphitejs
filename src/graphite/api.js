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
        init: function () {
            var that = this;
            that.promises = [ When.defer() ];
            Graph().then(function (graph) {
                that.graph = graph;
                that.promises[0].resolve(true);
            });
            this.queryController = Query("SELECT * WHERE { ?s ?p ?o }");
        },
        /**
         *
         * @param subject
         * @param predicate
         * @param object
         * @param [options]
         * @return {*}
         */
        addStatement: function (subject, predicate, object, options) {
            options = options || {};
            var that = this,
                statement = Dictionary.createStatement({
                    subject: subject,
                    predicate: predicate,
                    object: object
                }),
                promise = When.defer();
            When.all(this.promises).then(function () {
                that.graph.execute("INSERT DATA {{0}}".format(statement), options.callback).then(function (graph) {
                    that.graph = graph;
                    promise.resolve(graph);
                });
            });
            this.promises.push(promise);
            return this;
        },
        each: function (callback) {
            var promise = When.defer();
            buster.log("IN EACH, QUERY", this.queryController.run());
            this.graph.execute(this.queryController.run(), callback).then(function () {
                buster.log("IN EACH, EXECUTING");
                promise.resolve(arguments);
            });
            this.promises.push(promise);
            return this;
        },
        /**
         * @param uri
         * @param [options]
         */
        load: function (uri, options) {
            options = options || {};
            var that = this,
                promise = When.defer();
            When.all(this.promises).then(function () {
                that.graph.execute("LOAD <{0}>".format(uri), options.callback).then(function (graph) {
                    that.graph = graph;
                    promise.resolve(graph);
                });
            });
            this.promises.push(promise);
            return this;
        },
        query: function (queryString) {
            this.queryController = Query(queryString);
            return this;
        },
        select: function (part) {
            this.queryController.select(part);
            return this;
        },
        size: function (callback) {
            var that = this,
                promise = When.defer();
            When.all(that.promises).then(function () {
                that.graph.size(callback).then(function (size) {
                    buster.log("IN API, SIZE", size);
                    promise.resolve(size);
                });
            });
            this.promises.push(promise);
            return this;
        },
        then: function (callback) {
            When.all(this.promises).then(function (results) {
                //buster.log("IN API, THEN", results);
                callback(Utils.last(results));
            });
            return this;
        },
        where: function (part) {
            this.queryController.where(part);
            return this;
        }
    };
    api.prototype.init.prototype = api.prototype;
    return api;
});