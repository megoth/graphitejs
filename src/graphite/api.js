define([
    "./dictionary",
    "./graph",
    "./loader",
    "./query",
    "./utils",
    "./when"
], function (Dictionary, Graph, Loader, Query, Utils, When) {
    var sparqlRegex = /^(#|ADD|ASK|BASE|CONSTRUCT|COPY|CLEAR|CREATE|DESCRIBE|DELETE|DROP|INSERT|LOAD|MOVE|PREFIX|SELECT|WITH)/;
    function cleanArg(str) {
        return str.replace(/"/g, '\\"');
    }
    function format(queryString, args, numOfParam) {
        args = Utils.toArray(args).slice(numOfParam);
        if (args.length > 0) {
            args.push(cleanArg);
            queryString = String.prototype.format.apply(queryString, args);
        }
        //console.debug("IN API, FORMAT QUERY STRING", queryString, args);
        return queryString;
    }
    var api = function () {
        return new api.prototype.init();
    };
    api.prototype = {
        init: function () {
            var that = this,
                graphInit = When.defer();
            this.promises = [ graphInit ];
            Graph().then(function (graph) {
                that.graph = graph;
                graphInit.resolve(Query());
            });
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
                })),
                promise = When.defer();
            When.all(this.promises).then(function () {
                promise.resolve(Query(query));
            });
            this.promises.push(promise);
            return this.execute(options);
        },
        base: function (uri) {
            console.log("IN API, BASE BEGINNING");
            var promise = When.defer(),
                query;
            When.all(this.promises).then(function () {
                query = Utils.last(arguments[0]);
                query.base(uri);
                console.debug("IN API, BASE QUERY", query);
                promise.resolve(query);
            });
            console.log("IN API, BASE AFTER");
            this.promises.push(promise);
            return this;
        },
        each: function (callback) {
            console.log("IN API, EACH BEGINNING");
            return this.execute({
                callback: callback,
                onExecuted: function (promise, query) {
                    console.log("IN API, EACH CALLBACK");
                    promise.resolve(query);
                }
            });
        },
        /**
         *
         * @param [queryString]
         * @param [options]
         * @return {*}
         */
        execute: function (queryString, options) {
            if (Utils.isString(queryString)) {
                this.query(queryString);
            } else {
                options = queryString;
            }
            options = Utils.extend({}, {
                onExecuted: function (promise) {
                    promise.resolve(Query());
                }
            }, options);
            var promise = When.defer(),
                that = this,
                query,
                syntaxTree;
            When.all(this.promises).then(function (queries) {
                console.log("IN API, EXECUTE, #promises", that.promises.length);
                query = Utils.last(queries);
                syntaxTree = query.retrieveTree();
                console.log("IN API, EXECUTE SYNTAX TREE", syntaxTree);
                that.graph.execute(syntaxTree, options.callback).then(function (graph) {
                    that.graph = graph;
                    options.onExecuted.call(that, promise, query);
                    //buster.log("IN API, EXECUTE AFTER onExecuted");
                });
            });
            this.promises.push(promise);
            return this;
        },
        filter: function (filter) {
            var promise = When.defer(),
                query;
            filter = format(filter, arguments, 1);
            When.all(this.promises).then(function (queries) {
                query = Utils.last(queries);
                query.filter(filter);
                promise.resolve(query);
            });
            this.promises.push(promise);
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
                promise = When.defer(),
                query;
            When.all(this.promises).then(function () {
                query = Query("SELECT * WHERE { {0} {1} {2} }".format(subject, predicate, object));
                promise.resolve(query);
            });
            this.promises.push(promise);
            return this.each(callback);
        },
        /**
         * @param uri
         */
        load: function (uri, options) {
            var promise = When.defer();
            When.all(this.promises).then(function () {
                promise.resolve(Query("LOAD <{0}>".format(uri)));
            });
            this.promises.push(promise);
            return this.execute(options);
        },
        optional: function (optional) {
            var promise = When.defer(),
                query;
            optional = format(optional, arguments, 1);
            When.all(this.promises).then(function (queries) {
                query = Utils.last(queries);
                query.optional(optional);
                promise.resolve(query);
            });
            this.promises.push(promise);
            return this;
        },
        prefix: function (prefix, local) {
            var promise = When.defer(),
                query;
            When.all(this.promises).then(function (queries) {
                query = Utils.last(queries);
                query.prefix(prefix, local);
                promise.resolve(query);
            });
            this.promises.push(promise);
            return this;
        },
        query: function (queryString) {
            var promise = When.defer(),
                query,
                args = arguments;
            When.all(this.promises).then(function () {
                if (sparqlRegex.test(queryString)) {
                    console.log("IN API, QUERY LOAD SPARQL");
                    queryString = format(queryString, args, 1);
                    console.log("IN API, QUERY", queryString);
                    query = Query(queryString);
                    promise.resolve(query);
                } else {
                    console.log("IN API, QUERY LOAD URL");
                    Loader({
                        uri: queryString,
                        success: function (err, data) {
                            console.log("IN API, QUERY URL LOADED");
                            queryString = format(data, args, 1);
                            query = Query(queryString);
                            promise.resolve(query);
                        }
                    });
                }
                //console.log("IN API, QUERY", queryString);
            });
            this.promises.push(promise);
            return this;
        },
        removeStatement: function (subject, predicate, object) {
            var promise = When.defer(),
                query;
            When.all(this.promises).then(function () {
                query = Query("DELETE DATA { {0} }".format(Dictionary.createStatement({
                    subject: subject,
                    predicate: predicate,
                    object: object
                })));
                promise.resolve(query);
            });
            this.promises.push(promise);
            return this.execute();
        },
        select: function (projection) {
            var promise = When.defer(),
                query;
            When.all(this.promises).then(function (queries) {
                query = Utils.last(queries);
                query.select(projection);
                promise.resolve(query);
            });
            this.promises.push(promise);
            return this;
        },
        size: function (callback) {
            var that = this,
                promise = When.defer(),
                query;
            When.all(this.promises).then(function (queries) {
                query = Utils.last(queries);
                that.graph.size(function (size) {
                    callback(size);
                    promise.resolve(query);
                });
            });
            this.promises.push(promise);
            return this;
        },
        then: function (callback) {
            var that = this,
                promise = When.defer(),
                query;
            //buster.log("IN API, THEN");
            When.all(this.promises).then(function (queries) {
                query = Utils.last(queries);
                callback(that.graph);
                promise.resolve(query);
            });
            this.promises.push(promise);
            return this;
        },
        where: function (pattern) {
            console.log("IN API, WHERE BEGINNING");
            var promise = When.defer(),
                query;
            pattern = format(pattern, arguments, 1);
            When.all(this.promises).then(function (queries) {
                query = Utils.last(queries);
                query.where(pattern);
                promise.resolve(query)
            });
            this.promises.push(promise);
            return this;
        }
    };
    api.prototype.init.prototype = api.prototype;
    return api;
});