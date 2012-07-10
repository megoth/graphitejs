/*global assert, buster, graphite, module, refute, require*/
define([
    "src/rdfstore/query-engine/query_engine",
    "src/rdfstore/rdf-persistence/quad_backend",
    "src/rdfstore/rdf-persistence/lexicon",
    "src/rdfstore/query-engine/callbacks"
], function (QueryEngine, QuadBackend, Lexicon, Callbacks) {
    buster.testCase("RDFStore Callbacks", {
        "simpleCallback 1": function (done) {
            new Lexicon.Lexicon(function(lexicon){
                new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
                    var engine = new QueryEngine.QueryEngine({backend: backend, lexicon: lexicon});
                    var callbacksBackend = new Callbacks.CallbacksBackend(engine);
                    var callbackasCounter = 0;
                    callbacksBackend.subscribe(null,null,null,"http://test.com/g", function(event, triples) {
                            callbackasCounter++;
                            callbacksBackend.unsubscribe(arguments.callee);
                            var quad = {subject:   {token:'uri', value:'http://test.com/a'},
                                predicate: {token:'uri', value:'http://test.com/b'},
                                object:    {token:'uri', value:'http://test.com/c'},
                                graph:     {token:'uri', value:'http://test.com/g'}};
                            var queryEnv = {blanks:{}, outCache:{}};
                            var normalized = engine.normalizeQuad(quad, queryEnv, true);
                            callbacksBackend.sendNotification('added', [[quad, normalized]], done(function(){
                                var counter = 0;
                                for(var p in callbacksBackend.callbacksMap) {
                                    counter++;
                                }
                                for(var p in callbacksBackend.callbacksInverseMap) {
                                    counter++
                                }
                                assert.equals(counter, 0);
                                assert.equals(callbackasCounter, 1);
                            }));
                        },
                        function() {
                            var quad = {subject:   {token:'uri', value:'http://test.com/a'},
                                predicate: {token:'uri', value:'http://test.com/b'},
                                object:    {token:'uri', value:'http://test.com/c'},
                                graph:     {token:'uri', value:'http://test.com/g'}};
                            var quad2 = {subject:   {token:'uri', value:'http://test.com/a'},
                                predicate: {token:'uri', value:'http://test.com/b'},
                                object:    {token:'uri', value:'http://test.com/c'},
                                graph:     {token:'uri', value:'http://test.com/g2'}};
                            var queryEnv = {blanks:{}, outCache:{}};
                            var normalized2 = engine.normalizeQuad(quad2, queryEnv, true);
                            var normalized = engine.normalizeQuad(quad, queryEnv, true);
                            callbacksBackend.sendNotification('added', [[quad2, normalized2]]);
                            callbacksBackend.sendNotification('added', [[quad, normalized]]);
                        });
                });
            });
        },
        "simpleCallback 2": function (done) {
            new Lexicon.Lexicon(function(lexicon){
                new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
                    var engine = new QueryEngine.QueryEngine({backend: backend, lexicon: lexicon});
                    var callbacksBackend = new Callbacks.CallbacksBackend(engine);
                    var callbackasCounter = 0;
                    callbacksBackend.subscribe("http://test.com/a","http://test.com/b","http://test.com/c","http://test.com/g",
                        function(event, triples) {
                            callbackasCounter++;
                            callbacksBackend.unsubscribe(arguments.callee);
                            var quad = {subject:   {token:'uri', value:'http://test.com/a'},
                                predicate: {token:'uri', value:'http://test.com/b'},
                                object:    {token:'uri', value:'http://test.com/c'},
                                graph:     {token:'uri', value:'http://test.com/g'}};
                            var queryEnv = {blanks:{}, outCache:{}};
                            var normalized = engine.normalizeQuad(quad, queryEnv, true);
                            callbacksBackend.sendNotification('added', [[quad, normalized]], done(function(){
                                var counter = 0;
                                for(var p in callbacksBackend.callbacksMap) {
                                    counter++;
                                }
                                for(var p in callbacksBackend.callbacksInverseMap) {
                                    counter++
                                }
                                assert.equals(counter, 0);
                                assert.equals(callbackasCounter, 1);
                            }));
                            done();
                        },
                        function() {
                            var quad = {subject:   {token:'uri', value:'http://test.com/a'},
                                predicate: {token:'uri', value:'http://test.com/b'},
                                object:    {token:'uri', value:'http://test.com/c'},
                                graph:     {token:'uri', value:'http://test.com/g'}};

                            var quad2 = {subject:   {token:'uri', value:'http://test.com/a'},
                                predicate: {token:'uri', value:'http://test.com/b'},
                                object:    {token:'uri', value:'http://test.com/c'},
                                graph:     {token:'uri', value:'http://test.com/g2'}};
                            var queryEnv = {blanks:{}, outCache:{}};
                            var normalized2 = engine.normalizeQuad(quad2, queryEnv, true);
                            var normalized = engine.normalizeQuad(quad, queryEnv, true);
                            callbacksBackend.sendNotification('added', [[quad, normalized]]);
                        });
                });
            });
        },
        "simpleObserve 1": function (done) {
            new Lexicon.Lexicon(function(lexicon){
                new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
                    var engine = new QueryEngine.QueryEngine({backend: backend, lexicon: lexicon});
                    var count = 0;
                    var numTriples = 0;
                    var observerCallback = function(graph) {
                        count++;
                        numTriples = graph.toArray().length;
                        if(count ===4) {
                            engine.callbacksBackend.stopObservingNode(observerCallback);
                        }
                    };
                    engine.callbacksBackend.observeNode("http://example/book", null, observerCallback, function() {
                        engine.execute('INSERT DATA {  <http://example/book> <http://example.com/vocab#title> <http://test.com/example> }', function(){
                            engine.execute('INSERT DATA {  <http://example/book> <http://example.com/vocab#other> <http://test.com/example2> }', function(){
                                // this should not trigger the callback
                                engine.execute('INSERT DATA {  <http://example/book2> <http://example.com/vocab#other> <http://test.com/example3> }', function(){
                                    engine.execute('DELETE DATA {  <http://example/book> <http://example.com/vocab#other> <http://test.com/example2> }', done(function(){
                                        assert.equals(count, 4);
                                        assert.equals(numTriples, 1);
                                        assert.equals(engine.callbacksBackend.emptyNotificationsMap[Callbacks['eventsFlushed']].length, 0);
                                    }));
                                });
                            });
                        });
                    });
                });
            });
        },
        "simpleObserve 2": function (done) {
            new Lexicon.Lexicon(function(lexicon){
                new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
                    var engine = new QueryEngine.QueryEngine({backend: backend, lexicon: lexicon});
                    var count = 0;
                    var numTriples = 0;
                    var triples = [];
                    var observerCallback = function(graph) {
                        count++;
                        numTriples = graph.toArray().length;
                        triples = graph.toArray();
                        if(count ===2) {
                            engine.callbacksBackend.stopObservingNode(observerCallback);
                        }
                    };
                    engine.execute('INSERT DATA {  <http://example/book> <http://example.com/vocab#title> <http://test.com/example> }', function(){
                        engine.callbacksBackend.observeNode("http://example/book", null, observerCallback, function() {
                            engine.execute('DELETE {  <http://example/book> <http://example.com/vocab#title> <http://test.com/example> } INSERT { <http://example/book> <http://example.com/vocab#title> <http://test.com/example2> } WHERE { <http://example/book> <http://example.com/vocab#title> <http://test.com/example> }', done(function(){
                                assert.equals(count, 2);
                                assert.equals(numTriples, 1);
                                assert.equals(triples.length, 1);
                                assert.equals(triples[0]['object'].valueOf(), "http://test.com/example2");
                                assert.equals(engine.callbacksBackend.emptyNotificationsMap[Callbacks['eventsFlushed']].length, 0);
                            }));
                        });
                    });
                });
            });
        },
        "simpleCallbackQuery 1": function (done) {
            new Lexicon.Lexicon(function(lexicon){
                new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
                    var engine = new QueryEngine.QueryEngine({backend: backend, lexicon: lexicon});
                    var callbacksBackend = engine.callbacksBackend;
                    var callbacksCounter = 0;
                    callbacksBackend.observeQuery("select * where { ?s ?p ?o }",
                        function(bindings) {
                            if(callbacksCounter === 0) {
                                callbacksCounter++;
                                assert.equals(bindings.length, 0);
                            } else if(callbacksCounter === 1) {
                                callbacksCounter++;
                                assert.equals(bindings.length, 1);
                                assert.equals(bindings[0].o.value, "http://test.com/example1");
                                callbacksBackend.stopObservingQuery("select * where { ?s ?p ?o }");
                            } else {
                                assert(false);
                            }
                        });
                    engine.execute('INSERT DATA {  <http://example/book> <http://example.com/vocab#title> <http://test.com/example1> }', function(){
                        engine.execute('INSERT DATA {  <http://example/book> <http://example.com/vocab#title> <http://test.com/example2> }', done);
                    });
                });
            });
        },
        "simpleCallbackQuery 2": function (done) {
            new Lexicon.Lexicon(function(lexicon){
                new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
                    var engine = new QueryEngine.QueryEngine({backend: backend, lexicon: lexicon});
                    var callbacksBackend = engine.callbacksBackend;
                    var callbacksCounter = 0;
                    callbacksBackend.observeQuery("select * where { <http://test.com/vocab#a> ?p ?o }",
                        function(bindings) {
                            if(callbacksCounter === 0) {
                                callbacksCounter++;
                                assert.equals(bindings.length, 0);
                            } else if(callbacksCounter === 1) {
                                callbacksCounter++;
                                assert.equals(bindings.length, 1);
                                assert.equals(bindings[0].o.value, "http://test.com/example1");
                            } else if(callbacksCounter === 2) {
                                callbacksCounter++;
                                assert.equals(bindings.length, 2);
                                assert.equals(bindings[0].o.value, "http://test.com/example1");
                                assert.equals(bindings[1].o.value, "http://test.com/example3");
                            } else if(callbacksCounter === 3) {
                                callbacksCounter++;
                                assert.equals(bindings.length, 1);
                                assert.equals(bindings[0].o.value, "http://test.com/example1");
                            } else {
                                assert(false);
                            }
                        });
                    engine.execute('INSERT DATA {  <http://test.com/vocab#a> <http://example.com/vocab#title> <http://test.com/example1> }', function(){
                        engine.execute('INSERT DATA {  <http://example/book> <http://example.com/vocab#title> <http://test.com/example2> }', function(){
                            engine.execute('INSERT DATA {  <http://test.com/vocab#a> <http://example.com/vocab#title> <http://test.com/example3> }', function(){
                                engine.execute('DELETE DATA {  <http://test.com/vocab#a> <http://example.com/vocab#title> <http://test.com/example3> }', done);
                            });
                        });
                    });
                });
            });
        },
        "simpleCallbackQuery 3": function (done) {
            new Lexicon.Lexicon(function(lexicon){
                new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
                    var engine = new QueryEngine.QueryEngine({backend: backend, lexicon: lexicon});
                    var callbacksBackend = engine.callbacksBackend;
                    var callbacksCounter = 0;
                    callbacksBackend.observeQuery("select ?subject where { ?subject <http://test.com/named> ?o }",
                        function(bindings) {
                            if(callbacksCounter === 0) {
                                callbacksCounter++;
                                assert.equals(bindings.length, 0);
                            } else if(callbacksCounter === 1) {
                                callbacksCounter++;
                                assert.equals(bindings.length, 1);
                            } else {
                                assert(false);
                            }
                        });
                    engine.execute('INSERT DATA {  <http://test.com/subject> <http://test.com/named> "value" }', done);
                });
            });
        }
    });
});