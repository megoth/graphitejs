define([
    "src/rdfstore/query-engine/query_engine",
    "src/rdfstore/rdf-persistence/quad_backend",
    "src/rdfstore/rdf-persistence/lexicon",
    "src/rdfstore/query-engine/callbacks",
    "src/rdfstore/query-engine/rdf_js_interface"
], function (QueryEngine, QuadBackend, Lexicon, Callbacks, RDFJSInterface) {
    buster.testCase("RDFStore Callbacks", {
        "callbacksBatchLoad 1": function (done) {
            new Lexicon.Lexicon(function(lexicon){
                new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
                    var engine = new QueryEngine({backend: backend, lexicon: lexicon});
                    var callbackCounter = 0;
                    engine.callbacksBackend.observeQuery("select ?subject where { ?subject <http://test.com/named> ?o; <http://test.com/named2> ?o2 }",function(){
                        callbackCounter++;
                    });
                    var jsonld = {
                        '@id':"http://test.com/1",
                        'http://test.com/named': 'hello'
                    };
                    var graph = RDFJSInterface.rdf.createNamedNode(engine.lexicon.defaultGraphUri);
                    var parser = engine.rdfLoader.parsers['application/json'];
                    engine.rdfLoader.tryToParse(parser, {'token':'uri', 'value':graph.valueOf()}, jsonld, done(function(success, quads) {
                        if(success) {
                            engine.batchLoad(quads,function(){
                                engine.eventsOnBatchLoad = true;
                                jsonld = {
                                    '@id':"http://test.com/2",
                                    'http://test.com/named2': 'hello'
                                };
                                engine.rdfLoader.tryToParse(parser, {'token':'uri', 'value':graph.valueOf()}, jsonld, function(success, quads) {
                                    if(success) {
                                        engine.batchLoad(quads,function(){
                                            assert.equals(callbackCounter, 2);
                                        });
                                    } else {
                                        assert(false);
                                    }
                                });
                            });
                        } else {
                            assert(false);
                        }
                    }));

                });
            });
        }
    });
});