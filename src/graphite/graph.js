define([
    "./dictionary",
    "../rdfstore/rdf-persistence/lexicon",
    "../rdfstore/rdf-persistence/quad_backend",
    "../rdfstore/query-engine/query_engine",
    "./query",
    "./utils",
    "./when"
], function (Dictionary, Lexicon, QuadBackend, QueryEngine, Query, Utils, When) {
    "use strict";
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
            this.query = Query();
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
        addStatement: function (subject, predicate, object, callback) {
            var triple = Dictionary.Statement(subject, predicate, object);
            this.engine.execute('INSERT DATA { ' + triple.toNT() + ' }', function () {
                if (callback) {
                    callback(triple);
                }
            });
            return triple;
        },
        clone: function () {
            var deferred = When.defer();
            this.triples().then(function (triples) {
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
                executeFunc = getExecuteFunction(getQueryKind(query));
            if(executeFunc) {
                this.engine.execute(query, executeFunc(deferred, {
                    callback: callback,
                    graph: this,
                    onsuccess: onsuccess,
                    query: query
                }));
            } else {
                throw new Error("Query not supported" + query);
            }
            return deferred;
        },
        /**
         *
         * @param {Function} [callback]
         */
        listStatements: function (callback) {
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
        size: function () {
            var deferred = When.defer();
            //buster.log("IN SIZE");
            this.engine.execute("SELECT * WHERE { ?s ?p ?o }", function (success, results) {
                deferred.resolve(results.length);
                //buster.log("IN SIZE QUERY", results.length, results);
            });
            return deferred;
        },
        triples: function () {
            var deferred = When.defer(),
                graph = Dictionary.Formula(),
                subject,
                predicate,
                object;
            this.engine.execute("SELECT * WHERE { ?s ?p ?o }", function (success, results) {
                Utils.each(results, function (t) {
                    subject = t.s.token === "blank" ?
                        Dictionary.BlankNode(t.s.value) :
                        Dictionary.Symbol(t.s.value);
                    predicate = Dictionary.Symbol(t.p.value);
                    if (t.o.token === "literal") {
                        var dt,
                            val = t.o.value;
                        if ((''+val).indexOf('e')>=0) {
                            dt = Dictionary.Symbol.prototype.XSDfloat;
                        } else if ((''+val).indexOf('.')>=0) {
                            dt = Dictionary.Symbol.prototype.XSDdecimal;
                        } else {
                            dt = Dictionary.Symbol.prototype.XSDinteger;
                        }
                        object = Dictionary.Literal(t.o.value, t.o.lang, dt);
                    } else if (t.o.token === "blank") {
                        object = Dictionary.BlankNode(t.o.value);
                    } else {
                        object = Dictionary.Symbol(t.o.value);
                    }
                    graph.add(subject, predicate, object);
                });
                deferred.resolve(graph);
            });
            return deferred;
        }
    };
    graph.prototype.init.prototype = graph.prototype;
    return graph;
    function getExecuteFunction(queryKind) {
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
            /*
             "clear": function (promise, options) {
             if (options.callback) {
             options.graph.clone().then(function (g) {
             options.callback(g);
             });
             }
             return function () {
             options.graph.clone().then(function (g) {
             promise.resolve(g);
             });
             };
             },
             */
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
            /*
             "deleteData": function (promise, options) {
             var triples = [];
             if (options.callback) {
             triples = this.graph.query.getTriples(options.query);
             graph(triples).then(function (g) {
             options.callback(g);
             });
             }
             return function () {
             options.graph.clone().then(function (g) {
             promise.resolve(g);
             });
             };
             },
             */
            "insertData": function (promise, options) {
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
                return function (success, results) {
                    buster.log("RESULTS", results);
                    query = "INSERT DATA " + results.toNT();
                    options.graph.clone().then(function (g) {
                        //buster.log("ONCOMPLETE QUERY", query);
                        g.execute(query).then(function (g) {
                            promise.resolve(g);
                        });
                    });
                    if(options.callback) {
                        graph().then(function (g) {
                            //buster.log("ONCALLBACK QUERY", query);
                            g.execute(query).then(function (g) {
                                options.callback(g);
                            });
                        });
                    }
                    //buster.log("GRAPH LOAD AFTER");
                };
            },
            "select": function (promise, options) {
                return function (success, results) {
                    var vars;
                    options.graph.clone().then(function (g) {
                        promise.resolve(g);
                    });
                    if (options.callback && options.callback.length > 0) {
                        vars = Utils.extractArgumentMap(options.callback);
                        Utils.each(results, function (args) {
                            options.callback.apply(options.graph, Utils.map(Utils.mapArgs(vars, args), function (v) {
                                return v.value;
                            }));
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
    function getQueryKind(query) {
        var kind = null,
            currentPos = query.length,
            position = {
                ask: query.indexOf("ASK"),
                construct: query.indexOf("CONSTRUCT"),
                insertData: query.indexOf("INSERT DATA"),
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
});