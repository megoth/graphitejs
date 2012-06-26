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
    function executeAsk (promise, options) {
        return function (success, result) {
            promise.resolve(options.graph);
            if (options.callback) {
                options.callback(result);
            }
        };
    }
    function executeConstruct (promise, options) {
        return function (success, results) {
            promise.resolve(options.graph);
            if(options.callback) {
                options.callback(Graph(results.triples));
            }
        }
    }
    function executeDeleteData (promise, options) {
        //console.log("IN GRAPH, DELETE DATA", options.query);
        if (options.callback) {
            Graph().execute(options.query).then(function (g) {
                options.callback(g);
            });
        }
        return function () {
            //console.log("IN GRAPH, EXECUTE DELETE DATA");
            options.graph.clone().then(function(g) {
                //console.log("IN GRAPH, DELETE CLONED");
                promise.resolve(g);
            });
        };
    }
    function executeInsertData (promise, options) {
        //console.log("IN GRAPH, INSERT DATA", options.query);
        if (options.callback) {
            Graph().execute(options.query).then(function (g) {
                options.callback(g);
            });
        }
        return function () {
            promise.resolve(options.graph);
        };
    }
    function executeLoad (promise, options) {
        var query;
        //console.log("BEFORE LOAD");
        return function (success, results) {
            //console.log("GRAPH LOAD, RESULTS", success, results);
            query = "INSERT DATA " + results.toNT();
            Graph(options.graph).execute(query).then(function (g) {
                if(options.callback) {
                    Graph().then(function (g) {
                        //console.log("ONCALLBACK QUERY", query);
                        g.execute(query, function (g) {
                            options.callback(g);
                        });
                    });
                }
                promise.resolve(g);
            });
        };
    }
    function executeSelect(promise, options) {
        return function (success, results) {
            //console.log("IN GRAPH, SELECT QUERY", results.length, results);
            if (results.length === 0) {
                //console.debug("The query didn't return any results");
            } else {
                //console.debug("IN QUERY, executeSelect", results);
            }
            var vars, lvars;
            if (options.callback && options.callback.length > 0) {
                vars = Utils.extractArgumentMap(options.callback);
                Utils.each(results, function (args) {
                    //console.debug("IN GRAPH, SELECT", args);
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
            promise.resolve(options.graph);
        };
    }
    function getExecuteFunction(query) {
        var queryKind = getQueryKind(query);
        //console.log("IN GRAPH, GET EXECUTE FUNCTION", queryKind);
        switch (queryKind) {
            case "ask": return executeAsk;
            case "construct": return executeConstruct;
            case "deletedata": return executeDeleteData;
            case "insertdata": return executeInsertData;
            case "load": return executeLoad;
            case "select": return executeSelect;
            default: throw new Error("Query not supported!");
        }
    }
    function getTriples (graph) {
        var deferred = When.defer(),
            formula = Dictionary.Formula(),
            subject,
            predicate,
            object;
        graph.engine.execute("SELECT * WHERE { ?s ?p ?o }", function (success, results) {
            Utils.each(results, function (t) {
                subject = Dictionary.createSubject(t.s.value);
                predicate = Dictionary.createPredicate(t.p.value);
                object = Dictionary.createObject(t.o.value);
                formula.add(subject, predicate, object);
            });
            deferred.resolve(formula);
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
    function loadFormula(graph, resource, deferred) {
        graph.engine.execute('INSERT DATA ' + resource.toNT(), function () {
            deferred.resolve(graph);
        });
    }
    function loadGraph(graph, resource, deferred) {
        getTriples(resource).then(function (formula) {
            graph.engine.execute('INSERT DATA ' + formula.toNT(), function () {
                deferred.resolve(graph);
            });
        });
    }
    function loadStatements(graph, resource, deferred) {
        graph.engine.execute('INSERT DATA {' + resource.join("\n") + '}', function () {
            deferred.resolve(graph);
        });
    }
    function loadUri(graph, uri, deferred) {
        graph.engine.execute('LOAD <' + uri + '>', function (success, results) {
            loadFormula(graph, results, deferred);
        });
    }
    function loadUris(graph, uris, deferred) {
        if (uris.length > 0) {
            var uri = uris.pop(),
                promise = When.defer();
            loadUri(graph, uri, promise);
            promise.then(function (graph) {
                loadUris(graph, uris, deferred);
            });
        } else {
            deferred.resolve(graph);
        }
    }
    /*
     * The graph object
     */
    var Graph = function (data) {
        return new Graph.prototype.init(data);
    };
    Graph.prototype = {
        init: function (data) {
            var graph = this;
            this.deferred = When.defer();
            new Lexicon.Lexicon(function(lexicon){
                graph.lexicon = lexicon;
                new QuadBackend.QuadBackend({
                    treeOrder: 2
                }, function(backend){
                    graph.engine = new QueryEngine.QueryEngine({
                        backend: backend,
                        lexicon: lexicon
                    });
                    graph.deferred.resolve(graph);
                    if (data) {
                        graph.extend(data);
                    }
                });
            });
        },
        clone: function () {
            return Graph(this);
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
         * @param [callback]
         * @param [onsuccess]
         * @return {*}
         */
        execute: function (query, callback, onsuccess) {
            query = query.retrieveTree ? query.retrieveTree() : query;
            var deferred = When.defer(),
                executeFunc = getExecuteFunction(query);
            //console.log("IN GRAPH, EXECUTING FUNCTION", query);
            if(executeFunc) {
                this.deferred.then(function (graph) {
                    //console.log("IN GRAPH, BEFORE QUERY EXECUTION", query);
                    graph.engine.execute(query, executeFunc(deferred, {
                        callback: callback,
                        graph: graph,
                        onsuccess: onsuccess,
                        query: query
                    }));
                });
                this.deferred = deferred;
            } else {
                //console.log("IN GRAPH, QUERY NOT SUPPORTED", query);
                throw new Error("Query not supported" + query);
            }
            return this;
        },
        extend: function (resource) {
            var deferred = When.defer();
            this.deferred.then(function (graph) {
                if (resource instanceof Graph) {
                    loadGraph(graph, resource, deferred);
                } else if (Utils.isArray(resource)) {
                    if (resource[0] && Utils.isUri(resource[0])) {
                        loadUris(graph, resource, deferred);
                    } else {
                        loadStatements(graph, resource, deferred);
                    }
                } else if (Utils.isString(resource)) {
                    loadUri(graph, resource, deferred);
                } else if (resource.toNT) {
                    loadFormula(graph, resource, deferred);
                }
            });
            this.deferred = deferred;
            return this;
        },
        size: function (callback) {
            var deferred = When.defer();
            this.deferred.then(function (graph) {
                graph.engine.execute("SELECT * WHERE { ?s ?p ?o }", function (success, results) {
                    callback(results.length);
                    deferred.resolve(graph);
                });
            });
            this.deferred = deferred;
            return this;
        },
        then: function (callback) {
            this.deferred.then(callback);
        }
    };
    Graph.prototype.init.prototype = Graph.prototype;
    return Graph;
});