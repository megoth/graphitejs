define([
    "./dictionary",
    "./graph",
    "./query",
    "./utils",
    "./when"
], function (Dictionary, Graph, Query, Utils, When) {
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
            this.promises = [ When.defer() ];
            Graph().then(function (graph) {
                that.graph = graph;
                that.promises[0].resolve(true);
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
            //buster.log("IN API, ADD STATEMENT QUERY", query);
            this.queryController = Query(query);
            return this.execute(options);
        },
        base: function (uri) {
            this.queryController.base(uri);
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
            //buster.log("IN API, EXECUTE", this.promises.length);
            options = options || {};
            var promise = When.defer(),
                that = this,
                syntaxTree = this.queryController.retrieveTree();
            this.queryController = Query();
            When.all(this.promises).then(function () {
                that.graph.execute(syntaxTree, options.callback).then(function (graph) {
                    that.graph = graph;
                    promise.resolve(graph);
                });
            });
            this.promises.push(promise);
            return this;
        },
        filter: function (filter) {
            this.queryController.filter(filter);
            return this;
        },
        listStatements: function (options, callback) {
            if (!callback && Utils.isFunction (options)) {
                callback = options;
                options = {};
            }
            var subject = options.subject ? Dictionary.createSubject(options.subject).toNT() : "?subject",
                predicate = options.predicate ? Dictionary.createPredicate(options.predicate).toNT() : "?predicate",
                object = options.object ? Dictionary.createObject(options.object).toNT() : "?object",
                queryString = "SELECT * WHERE { {0} {1} {2} }".format(subject, predicate, object);
            //buster.log(queryString);
            this.queryController = Query(queryString);
            return this.each(callback);
        },
        /**
         * @param uri
         */
        load: function (uri) {
            this.queryController = Query("LOAD <{0}>".format(uri));
            return this.execute();
        },
        optional: function (optional) {
            optional = format(optional, arguments, 1);
            this.queryController.optional(optional);
            //buster.log("IN API, OPTIONAL", this.queryController.retrieveTree());
            return this;
        },
        prefix: function (prefix, local) {
            this.queryController.prefix(prefix, local);
            return this;
        },
        query: function (queryString) {
            queryString = format(queryString, arguments, 1);
            this.queryController = Query(queryString);
            return this;
        },
        removeStatement: function (subject, predicate, object) {
            var query = "DELETE DATA { {0} }".format(Dictionary.createStatement({
                subject: subject,
                predicate: predicate,
                object: object
            }));
            //buster.log("IN API, REMOVE STATEMENT QUERY", query);
            this.queryController = Query(query);
            return this.execute();
        },
        select: function (projection) {
            this.queryController.select(projection);
            return this;
        },
        size: function (callback) {
            this.execute();
            var that = this,
                promise = When.defer();
            When.all(this.promises).then(function () {
                that.graph.size(callback).then(function (size) {
                    //buster.log("IN API, SIZE", size);
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
        where: function (pattern) {
            pattern = format(pattern, arguments, 1);
            //buster.log("IN API, WHERE", pattern);
            this.queryController.where(pattern);
            return this;
        }
    };
    api.prototype.init.prototype = api.prototype;
    return api;
});