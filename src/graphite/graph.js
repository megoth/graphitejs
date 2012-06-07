define([
    "./dictionary",
    "./../rdfstore/rdf-persistence/lexicon",
    "./../rdfstore/rdf-persistence/quad_backend",
    "./../rdfstore/query-engine/query_engine",
    "./serializer/sparql",
    "./utils",
    "./when"
], function (Dictionary, Lexicon, QuadBackend, QueryEngine, Serializer, Utils, When) {
    "use strict";
    function bindVar (vars) {
        return Utils.map(vars, function (v) {
            if (v && v.hasOwnProperty("value")) {
                return v.value;
            }
            return null;
        });
    }
    function getExecuteFunction(queryKind) {
        //buster.log("IN GRAPH, GET EXECUTE FUNCTION", queryKind);
        var execute = {
            "ask": function (promise, options) {
                return function (success, result) {
                    options.graph.clone().then(function (g) {
                        promise.resolve(g);
                    });
                    if (options.callback) {
                        options.callback(result);
                    }
                };
            },
            "construct": function (promise, options) {
                return function (success, results) {
                    graph(results.triples).then(function (g) {
                        promise.resolve(g);
                        if(options.callback) {
                            options.callback(g);
                        }
                    });
                }
            },
            "deletedata": function (promise, options) {
                //buster.log("IN GRAPH, DELETE DATA", options.query);
                if (options.callback) {
                    graph().then(function (g) {
                        g.execute(options.query).then(function (g) {
                            options.callback(g);
                        });
                    });
                }
                return function () {
                    //buster.log("IN GRAPH, EXECUTE DELETE DATA");
                    options.graph.clone().then(function(g) {
                        //buster.log("IN GRAPH, DELETE CLONED");
                        promise.resolve(g);
                    });
                };
            },
            "insertdata": function (promise, options) {
                //console.log("IN GRAPH, INSERT DATA", options.query);
                if (options.callback) {
                    graph().then(function (g) {
                        g.execute(options.query).then(function (g) {
                            options.callback(g);
                        });
                    });
                }
                return function () {
                    options.graph.clone().then(function (g) {
                        promise.resolve(g);
                    });
                };
            },
            "load": function (promise, options) {
                var query;
                //buster.log("BEFORE LOAD");
                return function (success, results) {
                    //console.log("GRAPH LOAD, RESULTS", success, results);
                    query = "INSERT DATA " + results.toNT();
                    options.graph.clone().then(function (g) {
                        g.execute(query).then(function (g) {
                            promise.resolve(g);
                        });
                    });
                    if(options.callback) {
                        graph().then(function (g) {
                            //buster.log("ONCALLBACK QUERY", query);
                            g.execute(query, function (g) {
                                options.callback(g);
                            });
                        });
                    }
                };
            },
            "select": function (promise, options) {
                return function (success, results) {
                    //console.log("IN GRAPH, SELECT QUERY", results.length, results);
                    if (results.length === 0) {
                        console.debug("The query didn't return any results");
                    }
                    var vars, lvars;
                    promise.resolve(options.graph);
                    if (options.callback && options.callback.length > 0) {
                        vars = Utils.extractArgumentMap(options.callback);
                        Utils.each(results, function (args) {
                            try {
                                lvars = Utils.mapArgs(vars, args);
                            } catch (e) {
                                lvars = args;
                            }
                            //console.debug("IN GRAPH, SELECT", lvars);
                            options.callback.apply(options.graph, bindVar(lvars));
                        });
                    } else if (options.callback) {
                        Utils.each(results, options.callback);
                    }
                    if(options.onsuccess) {
                        options.onsuccess();
                    }
                };
            }
        };
        return execute[queryKind];
    }
    function getTriples (that) {
        var deferred = When.defer(),
            graph = Dictionary.Formula(),
            subject,
            predicate,
            object;
        that.engine.execute("SELECT * WHERE { ?s ?p ?o }", function (success, results) {
            Utils.each(results, function (t) {
                subject = Dictionary.createSubject(t.s.value);
                predicate = Dictionary.createPredicate(t.p.value);
                object = Dictionary.createObject(t.o.value);
                graph.add(subject, predicate, object);
            });
            deferred.resolve(graph);
        });
        return deferred;
    }
    function getQueryKind(query) {
        if(!Utils.isString(query)) {
            return query.units[0].kind;
        }
        var kind = null,
            currentPos = query.length,
            position = {
                ask: query.indexOf("ASK"),
                construct: query.indexOf("CONSTRUCT"),
                insertdata: query.indexOf("INSERT DATA"),
                load: query.indexOf("LOAD"),
                select: query.indexOf("SELECT")
            };
        Utils.each(position, function (pos, type) {
            kind = pos !== -1 && pos < currentPos ?
                type :
                kind;
        });
        return kind;
    }
    /*
     * The graph object
     */
    var graph = function (triples) {
        return new graph.prototype.init(triples);
    };
    graph.prototype = {
        init: function (input) {
            var deferred = When.defer(),
                graph = this;
            this.queries = 0;
            new Lexicon.Lexicon(function(lexicon){
                graph.lexicon = lexicon;
                new QuadBackend.QuadBackend({
                    treeOrder: 2
                }, function(backend){
                    graph.engine = new QueryEngine.QueryEngine({
                        backend: backend,
                        lexicon: lexicon
                    });
                    if (input && Utils.isFunction(input.toNT)) {
                        graph.engine.execute('INSERT DATA ' + input.toNT(), function () {
                            deferred.resolve(graph);
                        });
                    } else if (input && Utils.isArray(input)) {
                        graph.engine.execute('INSERT DATA {' + input.join("\n") + '}', function () {
                            deferred.resolve(graph);
                        });
                    } else {
                        deferred.resolve(graph);
                    }
                });
            });
            return deferred;
        },
        clone: function () {
            var deferred = When.defer();
            getTriples(this).then(function (triples) {
                //buster.log("PRECLONE", triples.toNT);
                //buster.log("CLONE", triples.toNT());
                graph(triples).then(function (g) {
                    deferred.resolve(g);
                });
            });
            return deferred;
        },
        /**
         * The execute method takes a query and a callback. It returns a promise
         * that resolves to a graph. The constructed graph will reflect an
         * altered graph or a scoped graph, depending on the type of query, as
         * described below:
         *
         * <ul>
         *     <li>ASK: returns the graph queried on, the callback will return a
         *     boolean</li>
         *     <li>CLEAR: returns the altered graph (an empty graph). Callback
         *     is the graph itself.</li>
         *     <li>CONSTRUCT: returns and callbacks the constructed graph.</li>
         *     <li>DELETE DATA: returns the altered graph. Callback is a graph
         *     with the deleted triples.</li>
         *     <li>DESCRIBE: returns and callbacks the constructed graph.</li>
         *     <li>INSERT DATA: returns the altered graph. Callback is a graph
         *     with the inserted triples.</li>
         *     <li>LOAD: returns the altered graph. Callback is the loaded graph.</li>
         *     <li>SELECT: returns graph queried on. The callback is the selected
         *     variables.</li>
         * </ul>
         *
         * @param query
         * @param callback
         * @param [onsuccess]
         * @return {*}
         */
        execute: function (query, callback, onsuccess) {
            var deferred = When.defer(),
                queryKind = getQueryKind(query),
                executeFunc = getExecuteFunction(queryKind);
            //buster.log("IN GRAPH, EXECUTING FUNCTION", queryKind, executeFunc);
            if(executeFunc) {
                //console.log("IN GRAPH, BEFORE QUERY EXECUTION", query);
                this.engine.execute(query, executeFunc(deferred, {
                    callback: callback,
                    graph: this,
                    onsuccess: onsuccess,
                    query: query
                }));
            } else {
                //buster.log("IN GRAPH, QUERY NOT SUPPORTED", query);
                throw new Error("Query not supported" + query);
            }
            return deferred;
        },
        /**
         *
         * @param {Function} [callback]
         */
        listStatements: function (parts, callback) {
            if (!callback && Utils.isFunction(parts)) {
                callback = parts;
            }
            return this.execute('SELECT * { ?subject ?predicate ?object }', callback);
        },
        /*
        removeStatement: function (options, callback) {
            var that = this;
            if (!callback && Utils.isFunction(options)) {
                callback = options;
                options = null;
            }
            if (!options) {
                this.engine.execute('CLEAR DEFAULT', function (success, results) {
                    //buster.log(success, results);
                    var list = that.listStatements();
                    //buster.log(list);
                });
            }
        },
        */
        size: function (callback) {
            var promise = When.defer();
            //buster.log("IN SIZE");
            this.engine.execute("SELECT * WHERE { ?s ?p ?o }", function (success, results) {
                if(callback) {
                    callback(results.length);
                }
                promise.resolve(results.length);
            });
            return promise;
        }
    };
    graph.prototype.init.prototype = graph.prototype;
    return graph;
});