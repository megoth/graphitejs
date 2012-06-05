define([
    "./dictionary",
    "./graph",
    "./loader",
    "./query",
    "./utils",
    "./when"
], function (Dictionary, Graph, Loader, Query, Utils, When) {
    function cleanArg(str) {
        return str.replace(/"/g, '\\"');
    }
    function format(queryString, args, numOfParam) {
        args = Utils.toArray(args).slice(numOfParam);
        if (args.length > 0) {
            args.push(cleanArg);
            queryString = String.prototype.format.apply(queryString, args);
        }
        //buster.log("IN API, FORMAT QUERY STRING", queryString);
        return queryString;
    }
    var api = function () {
        return new api.prototype.init();
    };
    api.prototype = {
        init: function () {
            var that = this;
            var graphInit = When.defer();
            this.promises = {
                "graph": [ graphInit ],
                "query": []
            };
            Graph().then(function (graph) {
                that.graph = graph;
                graphInit.resolve(true);
            });
            this.queryController = Query();
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
            var query = "INSERT DATA {{0}}".format(Dictionary.createStatement({
                subject: subject,
                predicate: predicate,
                object: object
            }));
            this.queryController = Query(query);
            return this.execute(options);
        },
        base: function (uri) {
            var that = this;
            When.all(this.promises["query"]).then(function () {
                that.queryController.base(uri);
            });
            return this;
        },
        each: function (callback) {
            //console.log("IN API, EACH", this.queryController.retrieveTree());
            return this.execute({
                callback: callback
            });
        },
        /**
         *
         * @param [options]
         * @return {*}
         */
        execute: function (options) {
            options = options || {};
            var promise = When.defer(),
                that = this,
                syntaxTree = this.queryController.retrieveTree();
            this.queryController = Query();
            When.all(this.promises["graph"]).then(function () {
                that.graph.execute(syntaxTree, options.callback).then(function (graph) {
                    that.graph = graph;
                    promise.resolve(graph);
                });
            });
            this.promises["graph"].push(promise);
            return this;
        },
        filter: function (filter) {
            var that = this;
            When.all(this.promises["query"]).then(function () {
                that.queryController.filter(filter);
            });
            return this;
        },
        listStatements: function (options, callback) {
            if (!callback && Utils.isFunction (options)) {
                callback = options;
                options = {};
            }
            var subject = options.subject ? Dictionary.createSubject(options.subject).toNT() : "?subject",
                predicate = options.predicate ? Dictionary.createPredicate(options.predicate).toNT() : "?predicate",
                object = options.object ? Dictionary.createObject(options.object).toNT() : "?object";
            this.queryController = Query("SELECT * WHERE { {0} {1} {2} }".format(subject, predicate, object));
            return this.each(callback);
        },
        /**
         * @param uri
         */
        load: function (uri, options) {
            var that = this,
                query;
            options = options || {};
            if (options.type === "query") {
                query = When.defer();
                When.all(this.promises["query"]).then(function () {
                    Loader({
                        uri: uri,
                        success: function (err, data) {
                            that.queryController = Query(data);
                            query.resolve(true);
                        }
                    });
                });
                this.promises["query"].push(query);
            } else {
                this.queryController = Query("LOAD <{0}>".format(uri));
            }
            return this.execute(options);
        },
        optional: function (optional) {
            var that = this;
            optional = format(optional, arguments, 1);
            When.all(this.promises["query"]).then(function () {
                that.queryController.optional(optional);
                //buster.log("IN API, OPTIONAL", this.queryController.retrieveTree());
            });
            return this;
        },
        prefix: function (prefix, local) {
            var that = this;
            When.all(this.promises["query"]).then(function () {
                that.queryController.prefix(prefix, local);
            });
            return this;
        },
        query: function (queryString) {
            var that = this;
            queryString = format(queryString, arguments, 1);
            When.all(this.promises["query"]).then(function () {
                that.queryController = Query(queryString);
            });
            return this;
        },
        removeStatement: function (subject, predicate, object) {
            this.queryController = Query("DELETE DATA { {0} }".format(Dictionary.createStatement({
                subject: subject,
                predicate: predicate,
                object: object
            })));
            return this.execute();
        },
        select: function (projection) {
            var that = this;
            When.all(this.promises["query"]).then(function () {
                that.queryController.select(projection);
            });
            return this;
        },
        size: function (callback) {
            this.execute();
            var that = this,
                promise = When.defer();
            When.all(this.promises["graph"]).then(function () {
                that.graph.size(callback).then(function (size) {
                    //buster.log("IN API, SIZE", size);
                    promise.resolve(size);
                });
            });
            this.promises["graph"].push(promise);
            return this;
        },
        then: function (callback) {
            When.all(this.promises["graph"]).then(function (results) {
                callback(Utils.last(results));
            });
            return this;
        },
        where: function (pattern) {
            var that = this;
            pattern = format(pattern, arguments, 1);
            When.all(this.promises["query"]).then(function () {
                that.queryController.where(pattern);
            });
            return this;
        }
    };
    api.prototype.init.prototype = api.prototype;
    return api;
});