define([
    "src/rdfstore/query-engine/query_filters",
    "src/rdfstore/query-engine/query_engine",
    "src/rdfstore/rdf-persistence/quad_backend",
    "src/rdfstore/rdf-persistence/lexicon"
], function (QueryFilters, QueryEngine, QuadBackend, Lexicon) {
    var filter1 = {
        "token": "filter",
        "value": {
            "token": "expression",
            "expressionType": "additiveexpression",
            "summand": {
                "token": "expression",
                "expressionType": "atomic",
                "primaryexpression": "var",
                "value": {
                    "token": "var",
                    "value": "x"
                }
            },
            "summands": [
                {
                    "operator": "+",
                    "expression": {
                        "token": "expression",
                        "expressionType": "multiplicativeexpression",
                        "factor": {
                            "token": "expression",
                            "expressionType": "atomic",
                            "primaryexpression": "numericliteral",
                            "value": {
                                "token": "literal",
                                "lang": null,
                                "type": "http://www.w3.org/2001/XMLSchema#integer",
                                "value": "3"
                            }
                        },
                        "factors": [
                            {
                                "operator": "*",
                                "expression": {
                                    "token": "expression",
                                    "expressionType": "atomic",
                                    "primaryexpression": "var",
                                    "value": {
                                        "token": "var",
                                        "value": "y"
                                    }
                                }
                            },
                            {
                                "operator": "/",
                                "expression": {
                                    "token": "expression",
                                    "expressionType": "atomic",
                                    "primaryexpression": "numericliteral",
                                    "value": {
                                        "token": "literal",
                                        "lang": null,
                                        "type": "http://www.w3.org/2001/XMLSchema#integer",
                                        "value": "3"
                                    }
                                }
                            }
                        ]
                    }
                }
            ]
        }
    };
    buster.testCase("RDFStore Query Filters", {
        "checkBoundVariables": function (done) {
            var vars = QueryFilters.boundVars(filter1.value);

            assert.equals(vars.length, 2);
            var acum = [];
            for(var i=0; i<vars.length; i++) {
                acum.push(vars[i].value);
            }
            acum.sort();

            assert.equals(acum[0], 'x');
            assert.equals(acum[1], 'y');
            done();
        },
        "filterTest1": function (done) {
            new Lexicon.Lexicon(function(lexicon){
                new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
                    var engine = new QueryEngine({
                        backend: backend,
                        lexicon: lexicon
                    });
                    engine.execute('INSERT DATA {  <http://example/book1> <http://example.com/vocab#pages> 256 .\
                                           <http://example/book2> <http://example.com/vocab#pages> 100 }', function(result){
                        engine.execute('SELECT ?title { ?title <http://example.com/vocab#pages> ?pages . FILTER(?pages>150) }', done(function(success, result){
                            assert.equals(result[0].title.value, "http://example/book1")
                        }));
                    });
                });
            });
        },
        "filterTest2": function (done) {
            new Lexicon.Lexicon(function(lexicon){
                new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
                    var engine = new QueryEngine({
                        backend: backend,
                        lexicon: lexicon
                    });
                    engine.execute('INSERT DATA {  <http://example/book1> <http://example.com/vocab#pages> 256 .\
                                           <http://example/book2> <http://example.com/vocab#pages> 100 }', function(result){
                        engine.execute('SELECT ?title { ?title <http://example.com/vocab#pages> ?pages . FILTER(?pages<150) }', done(function(success, result){
                            assert.equals(result[0].title.value, "http://example/book2")
                        }));
                    });
                });
            });
        },
        "filterTest3": function (done) {
            new Lexicon.Lexicon(function(lexicon){
                new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
                    var engine = new QueryEngine({
                        backend: backend,
                        lexicon: lexicon
                    });
                    engine.execute('INSERT DATA {  <http://example/book1> <http://example.com/vocab#pages> 150 .\
                                           <http://example/book2> <http://example.com/vocab#pages> 100 }', function(result){
                        engine.execute('SELECT ?title { ?title <http://example.com/vocab#pages> ?pages . FILTER(?pages>=150) }', done(function(success, result){
                            assert.equals(result[0].title.value, "http://example/book1")
                        }));
                    });
                });
            });
        },
        "filterTest4": function (done) {
            new Lexicon.Lexicon(function(lexicon){
                new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
                    var engine = new QueryEngine({
                        backend: backend,
                        lexicon: lexicon
                    });
                    engine.execute('INSERT DATA {  <http://example/book1> <http://example.com/vocab#pages> 256 .\
                                           <http://example/book2> <http://example.com/vocab#pages> 150 }', function(result){
                        engine.execute('SELECT ?title { ?title <http://example.com/vocab#pages> ?pages . FILTER(?pages<=150) }', done(function(success, result){
                            assert.equals(result[0].title.value, "http://example/book2")
                        }));
                    });
                });
            });
        },
        "filterTest5": function (done) {
            new Lexicon.Lexicon(function(lexicon){
                new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
                    var engine = new QueryEngine({
                        backend: backend,
                        lexicon: lexicon
                    });
                    engine.execute('INSERT DATA {  <http://example/book1> <http://example.com/vocab#pages> 256 .\
                                           <http://example/book2> <http://example.com/vocab#pages> 150 }', function(result){
                        engine.execute('SELECT ?title { ?title <http://example.com/vocab#pages> ?pages . FILTER(?pages=150) }', done(function(success, result){
                            assert.equals(result[0].title.value, "http://example/book2")
                        }));
                    });
                });
            });
        },
        "filterTest6": function (done) {
            new Lexicon.Lexicon(function(lexicon){
                new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
                    var engine = new QueryEngine({
                        backend: backend,
                        lexicon: lexicon
                    });
                    engine.execute('INSERT DATA {  <http://example/book1> <http://example.com/vocab#pages> 10 .\
                                           <http://example/book2> <http://example.com/vocab#pages> 20 .\
                                           <http://example/book3> <http://example.com/vocab#pages> 30 }', function(result){
                        engine.execute('SELECT ?title { ?title <http://example.com/vocab#pages> ?pages . FILTER(?pages<15 || ?pages>25) }', done(function(success, results){
                            assert.equals(results.length, 2);
                            var acum = [];
                            for(var i=0; i<results.length; i++) {
                                acum.push(results[i].title.value)
                            }
                            acum.sort();

                            assert.equals(acum[0], "http://example/book1");
                            assert.equals(acum[1], "http://example/book3");
                        }));
                    });
                });
            });
        },
        "filterTest7": function (done) {
            new Lexicon.Lexicon(function(lexicon){
                new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
                    var engine = new QueryEngine({
                        backend: backend,
                        lexicon: lexicon
                    });
                    engine.execute('INSERT DATA {  <http://example/book1> <http://example.com/vocab#pages> 10 .\
                                           <http://example/book2> <http://example.com/vocab#pages> 20 .\
                                           <http://example/book3> <http://example.com/vocab#pages> 30 }', function(result){
                        engine.execute('SELECT ?title { ?title <http://example.com/vocab#pages> ?pages . FILTER(?pages>15 && ?pages<25) }', done(function(success, results){
                            assert.equals(results.length, 1);
                            assert.equals(results[0].title.value, "http://example/book2");
                        }));
                    });
                });
            });
        },
        "filterTest8": function (done) {
            new Lexicon.Lexicon(function(lexicon){
                new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
                    var engine = new QueryEngine({
                        backend: backend,
                        lexicon: lexicon
                    });
                    engine.execute('INSERT DATA {  <http://example/book1> <http://example.com/vocab#pages> 10 .\
                                           <http://example/book2> <http://example.com/vocab#pages> 20 .\
                                           <http://example/book3> <http://example.com/vocab#pages> 30 }', function(result){
                        engine.execute('SELECT ?title { ?title <http://example.com/vocab#pages> ?pages . FILTER(?pages=10 || ?pages=20 || ?pages=30) }', done(function(success, results){
                            assert.equals(results.length, 3);
                            var acum = [];
                            for(var i=0; i<results.length; i++) {
                                acum.push(results[i].title.value)
                            }
                            acum.sort();
                            assert.equals(acum[0], "http://example/book1");
                            assert.equals(acum[1], "http://example/book2");
                            assert.equals(acum[2], "http://example/book3");
                        }));
                    });
                });
            });
        },
        "filterTest9": function (done) {
            new Lexicon.Lexicon(function(lexicon){
                new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
                    var engine = new QueryEngine({
                        backend: backend,
                        lexicon: lexicon
                    });
                    engine.execute('INSERT DATA {  <http://example/book1> <http://example.com/vocab#pages> 10 .\
                                           <http://example/book2> <http://example.com/vocab#pages> 20 .\
                                           <http://example/book3> <http://example.com/vocab#pages> 30 }', function(result){
                        engine.execute('SELECT ?title { ?title <http://example.com/vocab#pages> ?pages . FILTER(?pages=(6+4)) }', done(function(success, results){
                            assert.equals(results.length, 1);
                            assert.equals(results[0].title.value, "http://example/book1");
                        }));
                    });
                });
            });
        },
        "filterTest10": function (done) {
            new Lexicon.Lexicon(function(lexicon){
                new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
                    var engine = new QueryEngine({
                        backend: backend,
                        lexicon: lexicon
                    });
                    engine.execute('INSERT DATA {  <http://example/book1> <http://example.com/vocab#pages> 10 .\
                                           <http://example/book2> <http://example.com/vocab#pages> 20 .\
                                           <http://example/book3> <http://example.com/vocab#pages> 30 }', function(result){
                        engine.execute('SELECT ?title { ?title <http://example.com/vocab#pages> ?pages . FILTER(14=(?pages+4)) }', done(function(success, results){
                            assert.equals(results.length, 1);
                            assert.equals(results[0].title.value, "http://example/book1");
                        }));
                    });
                });
            });
        },
        "filterTest11": function (done) {
            new Lexicon.Lexicon(function(lexicon){
                new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
                    var engine = new QueryEngine({
                        backend: backend,
                        lexicon: lexicon
                    });
                    engine.execute('INSERT DATA {  <http://example/book1> <http://example.com/vocab#pages> 10 .\
                                           <http://example/book2> <http://example.com/vocab#pages> 20 .\
                                           <http://example/book3> <http://example.com/vocab#pages> 30 }', function(result){
                        engine.execute('SELECT ?title { ?title <http://example.com/vocab#pages> ?pages . FILTER(?pages=14-6+2) }', done(function(success, results){
                            assert.equals(results.length, 1);
                            assert.equals(results[0].title.value, "http://example/book1");
                        }));
                    });
                });
            });
        },
        "filterTest12": function (done) {
            new Lexicon.Lexicon(function(lexicon){
                new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
                    var engine = new QueryEngine({
                        backend: backend,
                        lexicon: lexicon
                    });
                    engine.execute('INSERT DATA {  <http://example/book1> <http://example.com/vocab#pages> 10 .\
                                           <http://example/book2> <http://example.com/vocab#pages> 20 .\
                                           <http://example/book3> <http://example.com/vocab#pages> 30 }', function(result){
                        engine.execute('SELECT ?title { ?title <http://example.com/vocab#pages> ?pages . FILTER(?pages=5*2) }', done(function(success, results){
                            assert.equals(results.length, 1);
                            assert.equals(results[0].title.value, "http://example/book1");
                        }));

                    });
                });
            });
        },
        "filterTest13": function (done) {
            new Lexicon.Lexicon(function(lexicon){
                new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
                    var engine = new QueryEngine({
                        backend: backend,
                        lexicon: lexicon
                    });
                    engine.execute('INSERT DATA {  <http://example/book1> <http://example.com/vocab#pages> 10 .\
                                           <http://example/book2> <http://example.com/vocab#pages> 20 .\
                                           <http://example/book3> <http://example.com/vocab#pages> 30 }', function(result){
                        engine.execute('SELECT ?title { ?title <http://example.com/vocab#pages> ?pages . FILTER(?pages=20/2) }', done(function(success, results){
                            assert.equals(results.length, 1);
                            assert.equals(results[0].title.value, "http://example/book1");
                        }));
                    });
                });
            });
        },
        "filterTest14": function (done) {
            new Lexicon.Lexicon(function(lexicon){
                new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
                    var engine = new QueryEngine({
                        backend: backend,
                        lexicon: lexicon
                    });
                    engine.execute('INSERT DATA {  <http://example/book1> <http://example.com/vocab#title> "titulo"@es .\
                                           <http://example/book2> <http://example.com/vocab#title> "title"@en .\
                                           <http://example/book3> <http://example.com/vocab#title> "titre"@fr }', function(result){
                        engine.execute('SELECT ?book { ?book <http://example.com/vocab#title> ?title . FILTER(LANG(?title)="en") }', done(function(success, results){
                            assert.equals(results.length, 1);
                            assert.equals(results[0].book.value, "http://example/book2");
                        }));
                    });
                });
            });
        }
    });
});