define([
    "./rdf",
    "./../rdfstore/rdf-persistence/lexicon",
    "./../rdfstore/rdf-persistence/quad_backend",
    "./../rdfstore/query-engine/query_engine",
    "./serializer/sparql",
    "./utils",
    "./promise"
], function (RDF, Lexicon, QuadBackend, QueryEngine, Serializer, Utils, Promise) {
    "use strict";
    function bindVar (vars) {
        return Utils.map(vars, function (v) {
            if (v && v.hasOwnProperty("value")) {
                return v.value;
            }
            return null;
        });
    }
    function getExecuteFunction(deferred, graph, query, callback, onsuccess) {
        var graph1,
            graph2,
            queryKind = getQueryKind(query);
        switch(queryKind) {
            case "ask":
                return function (success, result) {
                    graph1 = graph.clone();
                    callback(result);
                    deferred.resolve(graph1);
                };
            case "construct":
                return function (success, results) {
                    graph1 = graph.clone();
                    graph2 = Graph(results.triples);
                    callback(graph2);
                    deferred.resolve(graph1);
                };
            case "deletedata":
                return function () {
                    Graph().execute(query, function (g) {
                        callback(g);
                    });
                    graph1 = graph.clone();
                    deferred.resolve(graph1);
                };
            case "insertdata":
                return function () {
                    if(callback) {
                        graph2 = Graph().execute(query);
                        callback(graph2);
                    }
                    graph1 = graph.clone();
                    deferred.resolve(graph1);
                };
            case "load":
                return function (success, results) {
                    //console.log("IN GRAPH, getExecuteFunction", results);
                    graph1 = graph.clone();
                    deferred.resolve(graph1);
                    /*
                    graph1 = graph.clone().load(results);
                    deferred.resolve(graph1);
                    if (callback) {
                        graph2 = Graph(results);
                        callback(graph2);
                    }
                    */
                };
            case "select":
                return function (success, results) {
                    var vars, lvars;
                    if (callback && callback.length > 0) {
                        vars = Utils.extractArgumentMap(callback);
                        Utils.each(results, function (args) {
                            try {
                                lvars = Utils.mapArgs(vars, args);
                            } catch (e) {
                                lvars = args;
                            }
                            lvars = bindVar(lvars);
                            callback.apply(graph, lvars);
                        });
                    } else if (callback) {
                        Utils.each(results, callback);
                    }
                    if (onsuccess) {
                        onsuccess(graph);
                    }
                    deferred.resolve(graph);
                };
            default:
                //console.log("Query not supported", queryKind);
                throw new Error("Query not supported: " + queryKind);
                deferred.resolve(graph);
        }
    }
    function getTriples (callback) {
        var formula = RDF.Formula(),
            subject,
            predicate,
            object;
        this.execute("SELECT * WHERE { ?s ?p ?o }", function (s, p, o) {
            subject = RDF.createSubject(s);
            predicate = RDF.createPredicate(p);
            object = RDF.createObject(o);
            formula.add(subject, predicate, object);
        }, function () {
            callback(formula);
        });
        return this;
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
    function loadFormula(graph, formula, deferred) {
        //console.log("IN GRAPH, loadFormula", formula.toNT());
        graph.engine.execute('INSERT DATA ' + formula.toNT(), function () {
            deferred.resolve(graph);
        });
    }
    function loadTriples(graph, triples, deferred) {
        //console.log("IN GRAPH, loadTriples", triples);
        graph.engine.execute('INSERT DATA {' + triples.join("\n") + '}', function () {
            deferred.resolve(graph);
        });
    }
    function loadUri(graph, uri, deferred) {
        //console.log("IN GRAPH, loadUri", uri);
        graph.engine.execute("LOAD <" + uri + ">", function (success, results) {
            loadTriples(graph, results.statements, deferred);
        });
    }
    function loadUris(graph, uris, deferred) {
        var promises = Utils.map(uris, function () {
            return Promise.defer();
        });
        Utils.each(uris, function (uri, i) {
            loadUri(graph, uri, promises[i]);
        });
        Promise.all(promises).then(function () {
            deferred.resolve(graph);
        });
    }
    /*
     * The graph object
     */
    var Graph = function (input) {
        return new Graph.prototype.init(input);
    };
    Graph.prototype = {
        init: function (input) {
            var self = this;
            this.deferred = Promise.defer();
            new Lexicon.Lexicon(function(lexicon){
                self.lexicon = lexicon;
                new QuadBackend.QuadBackend({
                    treeOrder: 2
                }, function(backend){
                    self.engine = new QueryEngine.QueryEngine({
                        backend: backend,
                        lexicon: lexicon
                    });
                    self.deferred.resolve(self);
                    if (input && input instanceof Graph) {
                        getTriples.call(input, function (formula) {
                            self.load(formula);
                        });
                    } else if (input) {
                        self.load(input);
                    }
                });
            });
            return this;
        },
        /**
         * Clones an instance of a graph, returning a new instance
         * @return {*}
         */
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
            var deferred = Promise.defer();
            query = query.retrieveTree ? query.retrieveTree() : query;
            this.deferred.then(function (graph) {
                graph.engine.execute(query, getExecuteFunction(deferred, graph, query, callback, onsuccess));
            });
            this.deferred = deferred;
            return this;
        },
        /**
         *
         * @param {String} input
         */
        load: function (input) {
            var deferred = Promise.defer();
            this.deferred.then(function (graph) {
                if (input instanceof Graph) {
                    getTriples.call(input, function (formula) {
                        loadFormula(graph, formula, deferred);
                    });
                } else if (Utils.isString(input) && Utils.isUri(input)) {
                    loadUri(graph, input, deferred);
                } else if (Utils.isFunction(input.toNT)) {
                    loadFormula(graph, input, deferred);
                } else if (Utils.isArray(input) && input.length > 0) {
                    if (Utils.isString(input[0])) {
                        loadUris(graph, input, deferred);
                    } else {
                        loadTriples(graph, input, deferred);
                    }
                } else {
                    throw new Error ("Input not supported: " + input);
                }
            });
            this.deferred = deferred;
            return this;
        },
        merge: function (graphToMerge) {

            this.deferred.then(function (graph) {
                getTriples.call(graphToMerge, function (formula) {
                    graph.load(formula);
                });
            });
            return this;
        },
        /**
         *
         * @param {Function} callback
         * @return {*}
         */
        size: function (callback) {
            this.deferred.then(function (graph) {
                graph.engine.execute("SELECT * WHERE { ?s ?p ?o }", function (success, results) {
                    callback(results.length);
                });
            });
            return this;
        },
        /**
         *
         * @param {Function} callback
         * @return {*}
         */
        then: function (callback) {
            this.deferred.then(function (graph) {
                callback(graph);
            });
            return this;
        }
    };
    Graph.prototype.init.prototype = Graph.prototype;
    return Graph;
});