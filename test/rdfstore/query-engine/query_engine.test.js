/*global assert, buster, graphite, module, require*/
if (typeof module === "object" && typeof require === "function") {
    var buster = require("buster");
}

define([
    "src/rdfstore/query-engine/query_engine",
    "src/rdfstore/rdf-persistence/quad_backend",
    "src/rdfstore/rdf-persistence/lexicon"
], function (QueryEngine, QuadBackend, Lexicon) {
    buster.testCase("RDFStore Query Engine", {
        "testInsertDataSimpleQuery": function () {
            new Lexicon.Lexicon(function(lexicon){
                new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
                    var engine = new QueryEngine({backend: backend, lexicon: lexicon});
                    engine.execute('INSERT DATA {  <http://example/book3> <http://example.com/vocab#title> <http://test.com/example> }', function(result){
                        assert.equals(result, true);

                        var s = null;
                        var p = null;
                        var o = null;
                        var captured = false;

                        for(var i=0; i<engine.backend.indices.length; i++) {
                            var index = engine.backend.indices[i];
                            var tree = engine.backend.indexMap[index];

                            var treeRoot = tree._diskRead(tree.root);
                            assert.equals(treeRoot.keys.length, 1);

                            if(captured === false) {
                                captured = true;

                                s = treeRoot.keys[0].subject;
                                p = treeRoot.keys[0].predicate;
                                o = treeRoot.keys[0].object;
                            } else {
                                assert.equals(s, treeRoot.keys[0].subject);
                                assert.equals(p, treeRoot.keys[0].predicate);
                                assert.equals(o, treeRoot.keys[0].object);
                            }
                        }
                    });
                })
            });
        },
        "testInsertDataSimpleQueryLiteral": function () {
            new Lexicon.Lexicon(function(lexicon){
                new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
                    var engine = new QueryEngine({backend: backend,
                        lexicon: lexicon});
                    engine.execute('INSERT DATA {  <http://example/book3> <http://example.com/vocab#title> 2 }', function(result){
                        assert(result);

                        var s = null;
                        var p = null;
                        var o = null;
                        var captured = false;

                        for(var i=0; i<engine.backend.indices.length; i++) {
                            var index = engine.backend.indices[i];
                            var tree = engine.backend.indexMap[index];

                            var treeRoot = tree._diskRead(tree.root);
                            assert.equals(treeRoot.keys.length, 1);

                            if(captured === false) {
                                captured = true;

                                s = treeRoot.keys[0].key.subject;
                                p = treeRoot.keys[0].key.predicate;
                                o = treeRoot.keys[0].key.object;

                                assert.defined(s);
                                assert.defined(p);
                                assert.defined(o);
                            } else {
                                assert.equals(s, treeRoot.keys[0].key.subject);
                                assert.equals(p, treeRoot.keys[0].key.predicate);
                                assert.equals(o, treeRoot.keys[0].key.object);
                            }
                        }

                        result = engine.lexicon.retrieve(o);
                        assert.equals(result.token, "literal");
                        assert.equals(result.value, "2");
                        assert.equals(result.type, "http://www.w3.org/2001/XMLSchema#integer");
                    });
                })
            });
        },
        "testInsertDataTrivialRecovery": function () {
            new Lexicon.Lexicon(function(lexicon){
                new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
                    var engine = new QueryEngine({backend: backend, lexicon: lexicon});
                    engine.execute('INSERT DATA {  <http://example/book3> <http://example.com/vocab#title> <http://test.com/example> }', function(result){
                        assert(result);
                        engine.execute('SELECT * { ?s ?p ?o }', function(success, result){
                            assert(success);
                            assert.equals(result.length, 1);
                            assert.equals(result[0]['s'].value, 'http://example/book3');
                            assert.equals(result[0]['p'].value, 'http://example.com/vocab#title');
                            assert.equals(result[0]['o'].value,'http://test.com/example');
                        });
                    });

                })
            });
        },
        "testInsertDataTrivialRecovery 2": function () {
            new Lexicon.Lexicon(function(lexicon){
                new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
                    var engine = new QueryEngine({backend: backend, lexicon: lexicon});
                    engine.execute('INSERT DATA {  <http://example/book3> <http://example.com/vocab#title> <http://test.com/example>; <http://example.com/vocab#pages> 95 }', function(success){
                        assert(success);
                        engine.execute('SELECT * { ?s ?p ?o }', function(success, result){
                            assert(success);
                            assert.equals(result.length, 2);
                            assert.equals(result[0]['s'].value, 'http://example/book3');
                            assert.equals(result[1]['s'].value, 'http://example/book3');

                            if(result[0]['p'].value === 'http://example.com/vocab#title') {
                                assert.equals(result[0]['o'].value, 'http://test.com/example');
                            } else if(result[0]['p'].value === 'http://example.com/vocab#pages') {
                                assert.equals(result[1]['o'].value, "95");
                                assert.equals(result[1]['o'].type, "http://www.w3.org/2001/XMLSchema#integer");
                            } else {
                                assert(false);
                            }

                            if(result[1]['p'].value === 'http://example.com/vocab#title') {
                                assert.equals(result[1]['o'].value, 'http://test.com/example');
                            } else if(result[1]['p'].value === 'http://example.com/vocab#pages') {
                                assert.equals(result[1]['o'].value, "95");
                                assert.equals(result[1]['o'].type, "http://www.w3.org/2001/XMLSchema#integer");
                            } else {
                                assert(false);
                            }
                        });
                    });
                })
            });
        },
        "testInsertDataTrivialRecovery 3": function () {
            new Lexicon.Lexicon(function(lexicon){
                new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
                    var engine = new QueryEngine({backend: backend, lexicon: lexicon});
                    engine.execute('INSERT DATA { <http://example/book3> <http://example.com/vocab#title> <http://test.com/example>; <http://example.com/vocab#pages> 95 }',function(){
                        engine.execute('INSERT DATA { <http://example/book4> <http://example.com/vocab#title> <http://test.com/example>; <http://example.com/vocab#pages> 96 }', function(success){
                            assert.equals( success, true );
                            engine.execute('SELECT * { <http://example/book3> ?p ?o }', function(success, result){
                                assert.equals(success, true );
                                assert.equals(result.length, 2);

                                if(result[0]['p'].value === 'http://example.com/vocab#title') {
                                    assert.equals(result[0]['o'].value,'http://test.com/example');
                                } else if(result[0]['p'].value === 'http://example.com/vocab#pages') {
                                    assert.equals(result[0]['o'].value, "95");
                                    assert.equals(result[0]['o'].type, "http://www.w3.org/2001/XMLSchema#integer");
                                } else {
                                    assert(false);
                                }

                                if(result[1]['p'].value === 'http://example.com/vocab#title') {
                                    assert.equals(result[1]['o'].value, 'http://test.com/example');
                                } else if(result[1]['p'].value === 'http://example.com/vocab#pages') {
                                    assert.equals(result[1]['o'].value, "95");
                                    assert.equals(result[1]['o'].type, "http://www.w3.org/2001/XMLSchema#integer");
                                } else {
                                    assert(false);
                                }
                            });
                        });
                    });
                });
            });
        },
        "testSimpleJoin 1": function () {
            new Lexicon.Lexicon(function(lexicon){
                new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
                    var engine = new QueryEngine({backend: backend, lexicon: lexicon});
                    engine.execute('INSERT DATA {  <http://example/book3> <http://example.com/vocab#title> <http://test.com/example>; <http://example.com/vocab#pages> 95 . <http://example/book4> <http://example.com/vocab#title> <http://test.com/example>; <http://example.com/vocab#pages> 96 . }', function(success){
                        assert(success);
                        engine.execute('SELECT * { ?s <http://example.com/vocab#title> ?o . ?s <http://example.com/vocab#pages> 95 }', function(success, result){
                            assert(success);
                            assert.equals(result.length, 1);
                            assert.equals(result[0]['s'].value, "http://example/book3");
                        });
                    });
                });
            });
        },
        "testPrefixInsertion": function () {
            new Lexicon.Lexicon(function(lexicon){
                new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
                    var engine = new QueryEngine({backend: backend, lexicon: lexicon});
                    engine.execute('PREFIX ns: <http://example.org/ns#>  PREFIX x:  <http://example.org/x/> PREFIX z:  <http://example.org/x/#> INSERT DATA { x:x ns:p  "d:x ns:p" . x:x x:p "x:x x:p" . z:x z:p "z:x z:p" . }', function(){

                        engine.execute('SELECT * { ?s ?p ?o }', function(success, results){
                            assert(success);
                            assert.equals(results.length, 3);

                            for(var i=0; i<results.length; i++) {
                                if(results[i].s.value === "http://example.org/x/x") {
                                    if(results[i].p.value === "http://example.org/ns#p") {
                                        assert.equals(results[i].o.value, "d:x ns:p");
                                    } else if(results[i].p.value === "http://example.org/x/p") {
                                        assert.equals(results[i].o.value, "x:x x:p");
                                    } else {
                                        assert(false);
                                    }
                                } else if(results[i].s.value === "http://example.org/x/#x") {
                                    assert.equals(results[i].p.value, "http://example.org/x/#p");
                                    assert.equals(results[i].o.value, "z:x z:p");
                                } else {
                                    assert(false);
                                }
                            }
                        });
                    });
                });
            });
        },
        "testUnionBasic 1": function () {
            new Lexicon.Lexicon(function(lexicon){
                new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
                    var engine = new QueryEngine({backend: backend, lexicon: lexicon});
                    engine.execute(" PREFIX dc10:  <http://purl.org/dc/elements/1.0/> PREFIX dc11:  <http://purl.org/dc/elements/1.1/> INSERT DATA { _:a  dc10:title 'SPARQL Query Language Tutorial' .\
                        _:a  dc10:creator 'Alice' .\
                        _:b  dc11:title 'SPARQL Protocol Tutorial' .\
                        _:b  dc11:creator 'Bob' .\
                        _:c  dc10:title 'SPARQL' .\
                        _:c  dc11:title 'SPARQL (updated)' .\
                        }", function() {
                        engine.execute("PREFIX dc10:  <http://purl.org/dc/elements/1.0/>\
                            PREFIX dc11:  <http://purl.org/dc/elements/1.1/>\
                            SELECT ?title WHERE  { { ?book dc10:title  ?title } UNION { ?book dc11:title  ?title } }",
                            function(success, results) {
                                assert.equals(results.length, 4);

                                var titles = [];
                                for(var i=0; i<results.length; i++) {
                                    titles.push(results[i].title.value);
                                }
                                titles.sort();
                                assert.equals(titles[0], 'SPARQL');
                                assert.equals(titles[1], 'SPARQL (updated)');
                                assert.equals(titles[2], 'SPARQL Protocol Tutorial');
                                assert.equals(titles[3], 'SPARQL Query Language Tutorial');
                            });
                    });
                });
            });
        },
        "testUnionBasic 2": function () {
            new Lexicon.Lexicon(function(lexicon){
                new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
                    var engine = new QueryEngine({backend: backend, lexicon: lexicon});
                    engine.execute(" PREFIX dc10:  <http://purl.org/dc/elements/1.0/> PREFIX dc11:  <http://purl.org/dc/elements/1.1/> INSERT DATA { _:a  dc10:title 'SPARQL Query Language Tutorial' .\
                        _:a  dc10:creator 'Alice' .\
                        _:b  dc11:title 'SPARQL Protocol Tutorial' .\
                        _:b  dc11:creator 'Bob' .\
                        _:c  dc10:title 'SPARQL' .\
                        _:c  dc11:title 'SPARQL (updated)' .\
                        }", function() {
                        engine.execute("PREFIX dc10:  <http://purl.org/dc/elements/1.0/>\
                            PREFIX dc11:  <http://purl.org/dc/elements/1.1/>\
                            SELECT ?x ?y\
                            WHERE  { { ?book dc10:title ?x } UNION { ?book dc11:title  ?y } }",
                            function(success, results) {
                                assert.equals(results.length, 4);
                                var xs = [];
                                var ys = [];
                                for(var i=0; i<results.length; i++) {
                                    if(results[i].x == null) {
                                        ys.push(results[i].y.value);
                                    } else {
                                        xs.push(results[i].x.value);
                                    }
                                }
                                xs.sort();
                                ys.sort();
                                assert.equals(xs[0], 'SPARQL');
                                assert.equals(xs[1], 'SPARQL Query Language Tutorial');
                                assert.equals(ys[0], 'SPARQL (updated)');
                                assert.equals(ys[1], 'SPARQL Protocol Tutorial');
                            });
                    });
                });
            });
        },
        "testUnionBasic 3": function () {
            new Lexicon.Lexicon(function(lexicon){
                new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
                    var engine = new QueryEngine({backend: backend, lexicon: lexicon});
                    engine.execute(" PREFIX dc10:  <http://purl.org/dc/elements/1.0/> PREFIX dc11:  <http://purl.org/dc/elements/1.1/> INSERT DATA { _:a  dc10:title 'SPARQL Query Language Tutorial' .\
                        _:a  dc10:creator 'Alice' .\
                        _:b  dc11:title 'SPARQL Protocol Tutorial' .\
                        _:b  dc11:creator 'Bob' .\
                        _:c  dc10:title 'SPARQL' .\
                        _:c  dc11:title 'SPARQL (updated)' .\
                        }", function() {
                        engine.execute("PREFIX dc10:  <http://purl.org/dc/elements/1.0/>\
                            PREFIX dc11:  <http://purl.org/dc/elements/1.1/>\
                            SELECT ?title ?author\
                            WHERE  { { ?book dc10:title ?title .  ?book dc10:creator ?author }\
                            UNION\
                            { ?book dc11:title ?title .  ?book dc11:creator ?author } }",
                            function(success, results) {
                                assert.equals(results.length, 2);
                                if(results[0].author.value === "Alice") {
                                    assert.equals(results[0].title.value, "SPARQL Query Language Tutorial");
                                    assert.equals(results[1].author.value, "Bob");
                                    assert.equals(results[1].title.value, "SPARQL Protocol Tutorial");
                                } else {
                                    assert.equals(results[1].author.value, "Alice");
                                    assert.equals(results[1].title.value, "SPARQL Query Language Tutorial");
                                    assert.equals(results[0].author.value, "Bob");
                                    assert.equals(results[0].title.value, "SPARQL Protocol Tutorial");
                                }
                            });
                    });
                });
            });
        },
        "testUnionBasic": function () {
            var book;
            new Lexicon.Lexicon(function(lexicon){
                new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
                    var engine = new QueryEngine({backend: backend, lexicon: lexicon});
                    engine.execute(" PREFIX dc10:  <http://purl.org/dc/elements/1.0/> PREFIX dc11:  <http://purl.org/dc/elements/1.1/> INSERT DATA { _:a  dc10:title 'SPARQL Query Language Tutorial' .\
                        _:a  dc10:creator 'Alice' .\
                        _:b  dc11:title 'SPARQL Protocol Tutorial' .\
                        _:b  dc11:creator 'Bob' .\
                        _:c  dc10:title 'SPARQL' .\
                        _:c  dc11:title 'SPARQL (updated)' .\
                        }", function() {
                        engine.execute("SELECT ?book WHERE { ?book ?p ?o }",
                            function(success, results) {
                                assert.equals(results.length, 6);
                                for(var i=0; i<6; i++) {
                                    book = results[i]["book"];
                                    assert.equals(book.token, 'blank');
                                    assert.defined(book.value);
                                }
                            });
                    });
                });
            });
        },
        "testOptionalBasic 1": function () {
            new Lexicon.Lexicon(function(lexicon){
                new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
                    var engine = new QueryEngine({backend: backend, lexicon: lexicon});
                    engine.execute("PREFIX  foaf:  <http://xmlns.com/foaf/0.1/>\
                        INSERT DATA {\
                        _:a  foaf:name 'Alice' .\
                        _:a  foaf:knows  _:b .\
                        _:a  foaf:knows  _:c .\
                        _:b  foaf:name 'Bob' .\
                        _:c  foaf:name 'Clare' .\
                        _:c  foaf:nick 'CT' .\
                        }", function() {
                        engine.execute("PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                            SELECT ?nameX ?nameY ?nickY\
                            WHERE\
                            { ?x foaf:knows ?y ;\
                            foaf:name ?nameX .\
                            ?y foaf:name ?nameY .\
                            OPTIONAL { ?y foaf:nick ?nickY }  }",
                            function(success, results) {
                                assert.equals(results.length, 2);
                                if(results[0]["nickY"] === null) {
                                    assert.equals(results[0]["nameX"].value, 'Alice');
                                    assert.equals(results[0]["nameY"].value, 'Bob');
                                    assert.equals(results[1]["nameX"].value, 'Alice');
                                    assert.equals(results[1]["nameY"].value, 'Clare');
                                    assert.equals(results[1]["nickY"].value, 'CT');
                                } else {
                                    assert.equals(results[1]["nameX"].value, 'Alice');
                                    assert.equals(results[1]["nameY"].value, 'Bob');
                                    assert.equals(results[0]["nameX"].value, 'Alice');
                                    assert.equals(results[0]["nameY"].value, 'Clare');
                                    assert.equals(results[0]["nickY"].value, 'CT');
                                }
                            });
                    });
                });
            });
        },
        "testOptionalDistinct 1": function () {
            new Lexicon.Lexicon(function(lexicon){
                new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
                    var engine = new QueryEngine({backend: backend, lexicon: lexicon});
                    engine.execute("PREFIX  foaf:  <http://xmlns.com/foaf/0.1/>\
                        INSERT DATA {\
                        _:x  foaf:name 'Alice' .\
                        _:x  foaf:mbox <mailto:alice@example.com> .\
                        _:y  foaf:name 'Alice' .\
                        _:y  foaf:mbox <mailto:asmith@example.com> .\
                        _:z  foaf:name 'Alice' .\
                        _:z  foaf:mbox <mailto:alice.smith@example.com> .\
                        }", function() {
                        engine.execute("PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                            SELECT DISTINCT ?name WHERE { ?x foaf:name ?name }",
                            function(success, results) {
                                assert.equals(results.length, 1);
                                assert.equals(results[0].name.value, 'Alice');
                            });
                    });
                });
            });
        },
        "testLimit 1": function () {
            new Lexicon.Lexicon(function(lexicon){
                new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
                    var engine = new QueryEngine({backend: backend, lexicon: lexicon});
                    engine.execute("PREFIX  foaf:  <http://xmlns.com/foaf/0.1/>\
                        INSERT DATA {\
                        _:x  foaf:name 'Alice' .\
                        _:x  foaf:mbox <mailto:alice@example.com> .\
                        _:y  foaf:name 'Alice' .\
                        _:y  foaf:mbox <mailto:asmith@example.com> .\
                        _:z  foaf:name 'Alice' .\
                        _:z  foaf:mbox <mailto:alice.smith@example.com> .\
                        }", function() {
                        engine.execute("PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                            SELECT ?name WHERE { ?x foaf:name ?name } LIMIT 2",
                            function(success, results) {
                                assert.equals(results.length, 2);
                                assert.equals(results[0].name.value, 'Alice');
                                assert.equals(results[1].name.value, 'Alice');
                            });
                    });
                });
            });
        },
        "testOrderBy 1": function () {
            new Lexicon.Lexicon(function(lexicon){
                new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
                    var engine = new QueryEngine({backend: backend, lexicon: lexicon});
                    engine.execute("PREFIX  foaf:  <http://xmlns.com/foaf/0.1/>\
                        INSERT DATA {\
                        _:x  foaf:name 'Bob' .\
                        _:x  foaf:mbox <mailto:alice@example.com> .\
                        _:y  foaf:name 'Alice' .\
                        _:y  foaf:mbox <mailto:asmith@example.com> .\
                        _:z  foaf:name 'Marie' .\
                        _:z  foaf:mbox <mailto:alice.smith@example.com> .\
                        }", function() {
                        engine.execute("PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                            SELECT ?name WHERE { ?x foaf:name ?name } ORDER BY ?name",
                            function(success, results) {
                                assert.equals(results.length, 3);
                                assert.equals(results[0].name.value, 'Alice');
                                assert.equals(results[1].name.value, 'Bob');
                                assert.equals(results[2].name.value, 'Marie');
                            });
                    });
                });
            });
        },
        "testOrderBy 2": function () {
            new Lexicon.Lexicon(function(lexicon){
                new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
                    var engine = new QueryEngine({backend: backend, lexicon: lexicon});
                    engine.execute("PREFIX  foaf:  <http://xmlns.com/foaf/0.1/>\
                        INSERT DATA {\
                        _:x  foaf:name 'Bob' .\
                        _:x  foaf:mbox <mailto:alice@example.com> .\
                        _:y  foaf:name 'Alice' .\
                        _:y  foaf:mbox <mailto:asmith@example.com> .\
                        _:z  foaf:name 'Marie' .\
                        _:z  foaf:mbox <mailto:alice.smith@example.com> .\
                        }", function() {
                        engine.execute("PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                            SELECT ?name WHERE { ?x foaf:name ?name } ORDER BY DESC(?name)",
                            function(success, results) {
                                assert.equals(results.length, 3);
                                assert.equals(results[0].name.value, 'Marie');
                                assert.equals(results[1].name.value, 'Bob');
                                assert.equals(results[2].name.value, 'Alice');
                            });
                    });
                });
            });
        },
        "testOrderBy 3": function () {
            new Lexicon.Lexicon(function(lexicon){
                new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
                    var engine = new QueryEngine({backend: backend, lexicon: lexicon});
                    engine.execute("PREFIX  foaf:  <http://xmlns.com/foaf/0.1/>\
                        INSERT DATA {\
                        _:x  foaf:name 'Bob' .\
                        _:x  foaf:mbox <mailto:bob@example.com> .\
                        _:y  foaf:name 'Alice' .\
                        _:y  foaf:mbox <mailto:alice@example.com> .\
                        _:z  foaf:name 'Marie' .\
                        _:z  foaf:mbox <mailto:marie@example.com> .\
                        }", function() {
                        engine.execute("PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                            SELECT ?mbox WHERE { ?x foaf:mbox ?mbox } ORDER BY ASC(?mbox)",
                            function(success, results) {
                                assert.equals(results.length, 3);
                                assert.equals(results[0]["mbox"].value, 'mailto:alice@example.com');
                                assert.equals(results[1]["mbox"].value, 'mailto:bob@example.com');
                                assert.equals(results[2]["mbox"].value, 'mailto:marie@example.com');
                            });
                    });
                });
            });
        },
        "testOrderBy 4": function () {
            new Lexicon.Lexicon(function(lexicon){
                new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
                    var engine = new QueryEngine({backend: backend, lexicon: lexicon});
                    engine.execute("PREFIX  foaf:  <http://xmlns.com/foaf/0.1/>\
                        INSERT DATA {\
                        _:x  foaf:name 'Bob' .\
                        _:x  foaf:test1 'b' .\
                        _:y  foaf:name 'Alice' .\
                        _:y  foaf:test1 'a' .\
                        _:z  foaf:name 'Marie' .\
                        _:z  foaf:test1 'a' .\
                        }", function() {
                        engine.execute("PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                            SELECT ?name WHERE { ?x foaf:test1 ?test . ?x foaf:name ?name } ORDER BY ASC(?test) ASC(?name)",
                            function(success, results) {
                                assert.equals(results.length, 3);
                                assert.equals(results[0].name.value, 'Alice');
                                assert.equals(results[1].name.value, 'Marie');
                                assert.equals(results[2].name.value, 'Bob');
                            });
                    });
                });
            });
        },
        "testInsertionDeletionTrivial 1": function () {
            new Lexicon.Lexicon(function(lexicon){
                new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
                    var engine = new QueryEngine({backend: backend, lexicon: lexicon});
                    engine.execute('INSERT DATA {  <http://example/book3> <http://example.com/vocab#title> <http://test.com/example> }', function(result){
                        assert(result);
                        engine.execute('SELECT * { ?s ?p ?o }', function(success, result){
                            assert(success);
                            assert.equals(result.length, 1);
                            assert.equals(result[0]['s'].value, 'http://example/book3');
                            assert.equals(result[0]['p'].value, 'http://example.com/vocab#title');
                            assert.equals(result[0]['o'].value, 'http://test.com/example');
                            engine.execute('DELETE DATA { <http://example/book3> <http://example.com/vocab#title> <http://test.com/example> }', function() {
                                engine.execute('SELECT * { ?s ?p ?o }', function(success, result){
                                    assert(success);
                                    assert.equals(result.length, 0);
                                    var acum = 0,
                                        p;
                                    for(p in engine.lexicon.uriToOID) {
                                        acum++;
                                    }
                                    for(p in engine.lexicon.OIDToUri) {
                                        acum++;
                                    }
                                    for(p in engine.lexicon.literalToOID) {
                                        acum++;
                                    }
                                    for(p in engine.lexicon.OIDToLiteral) {
                                        acum++;
                                    }
                                    assert.equals(acum, 0);
                                });
                            });
                        });
                    });

                })
            });
        },
        "testInsertionDeletion 2": function () {
            new Lexicon.Lexicon(function(lexicon){
                new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
                    var engine = new QueryEngine({backend: backend, lexicon: lexicon});
                    engine.execute('INSERT DATA {  GRAPH <a> { <http://example/book3> <http://example.com/vocab#title> <http://test.com/example> } }', function(result){
                        assert(result);
                        engine.execute('INSERT DATA {  GRAPH <c> { <http://example/book3> <http://example.com/vocab#title> <http://test.com/example> } }', function(result){
                            assert(result);
                            engine.execute('SELECT * FROM NAMED <a> { GRAPH <a> { ?s ?p ?o } }', function(success, result){
                                assert(success);
                                assert.equals(result.length, 1);
                                assert.equals(result[0]['s'].value, 'http://example/book3');
                                assert.equals(result[0]['p'].value, 'http://example.com/vocab#title');
                                assert.equals(result[0]['o'].value, 'http://test.com/example');
                                engine.execute('SELECT * FROM NAMED <c> { GRAPH <c> { ?s ?p ?o } }', function(success, result){
                                    assert(success);
                                    assert.equals(result.length, 1);
                                    assert.equals(result[0]['s'].value, 'http://example/book3');
                                    assert.equals(result[0]['p'].value, 'http://example.com/vocab#title');
                                    assert.equals(result[0]['o'].value, 'http://test.com/example');
                                    engine.execute('DELETE DATA { GRAPH <a> { <http://example/book3> <http://example.com/vocab#title> <http://test.com/example> }  }', function() {
                                        engine.execute('SELECT * FROM NAMED <a> { GRAPH <a> { ?s ?p ?o } }', function(success, result){
                                            assert(success);
                                            assert.equals(result.length, 0);
                                            engine.execute('SELECT * FROM NAMED <c> { GRAPH <c> { ?s ?p ?o } }', function(success, result){
                                                assert(success);
                                                assert.equals(result.length, 1);
                                                assert.equals(result[0]['s'].value, 'http://example/book3');
                                                assert.equals(result[0]['p'].value, 'http://example.com/vocab#title');
                                                assert.equals(result[0]['o'].value, 'http://test.com/example');
                                                var acum = 0,
                                                    p;
                                                for(p in engine.lexicon.uriToOID) {
                                                    acum++;
                                                }
                                                for(p in engine.lexicon.OIDToUri) {
                                                    acum++;
                                                }
                                                for(p in engine.lexicon.literalToOID) {
                                                    acum++;
                                                }
                                                for(p in engine.lexicon.OIDToLiteral) {
                                                    acum++;
                                                }
                                                assert.equals(acum, 8);
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        },
        "testModify 1": function (done) {
            new Lexicon.Lexicon(function(lexicon){
                new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
                    var engine = new QueryEngine({backend: backend, lexicon: lexicon});
                    engine.execute('PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                        INSERT DATA {  GRAPH <http://example/addresses> \
                        { \
                        <http://example/president25> foaf:givenName "Bill" .\
                        <http://example/president25> foaf:familyName "McKinley" .\
                        <http://example/president27> foaf:givenName "Bill" .\
                        <http://example/president27> foaf:familyName "Taft" .\
                        <http://example/president42> foaf:givenName "Bill" .\
                        <http://example/president42> foaf:familyName "Clinton" .\
                        } \
                        }', function(){
                        engine.execute("PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                            WITH <http://example/addresses>\
                            DELETE { ?person foaf:givenName 'Bill' }\
                            INSERT { ?person foaf:givenName 'William' }\
                            WHERE  { ?person foaf:givenName 'Bill' }",
                            function(){
                                engine.execute("PREFIX foaf:<http://xmlns.com/foaf/0.1/>\
                                    SELECT * FROM NAMED <http://example/addresses> { \
                                    GRAPH <http://example/addresses> { ?s ?p ?o } }\
                                    ORDER BY ?s ?p", done(function(success, results){
                                    assert(success);
                                    assert.equals(results[0].s.value, "http://example/president25");
                                    assert.equals(results[1].s.value, "http://example/president25");
                                    assert.equals(results[0].o.value, "McKinley");
                                    assert.equals(results[1].o.value, "William");
                                    assert.equals(results[2].s.value, "http://example/president27");
                                    assert.equals(results[3].s.value, "http://example/president27");
                                    assert.equals(results[2].o.value, "Taft");
                                    assert.equals(results[3].o.value, "William");
                                    assert.equals(results[4].s.value, "http://example/president42");
                                    assert.equals(results[5].s.value, "http://example/president42");
                                    assert.equals(results[4].o.value, "Clinton");
                                    assert.equals(results[5].o.value, "William");
                                }));
                            });
                    });
                });
            });
        },
        "testModifyDefaultGraph": function (done) {
            new Lexicon.Lexicon(function(lexicon){
                new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
                    var engine = new QueryEngine({backend: backend, lexicon: lexicon});
                    engine.execute('PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                        INSERT DATA {  \
                        <http://example/president25> foaf:givenName "Bill" .\
                        <http://example/president25> foaf:familyName "McKinley" .\
                        <http://example/president27> foaf:givenName "Bill" .\
                        <http://example/president27> foaf:familyName "Taft" .\
                        <http://example/president42> foaf:givenName "Bill" .\
                        <http://example/president42> foaf:familyName "Clinton" .\
                        }', function(){
                        engine.execute("PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                            DELETE { ?person foaf:givenName 'Bill' }\
                            INSERT { ?person foaf:givenName 'William' }\
                            WHERE  { ?person foaf:givenName 'Bill' }",
                            function(){
                                engine.execute("PREFIX foaf:<http://xmlns.com/foaf/0.1/>\
                                    SELECT * { ?s ?p ?o }\
                                    ORDER BY ?s ?p", done(function(success, results){
                                    assert(success);
                                    assert.equals(results[0].s.value, "http://example/president25");
                                    assert.equals(results[1].s.value, "http://example/president25");
                                    assert.equals(results[0].o.value, "McKinley");
                                    assert.equals(results[1].o.value, "William");
                                    assert.equals(results[2].s.value, "http://example/president27");
                                    assert.equals(results[3].s.value, "http://example/president27");
                                    assert.equals(results[2].o.value, "Taft");
                                    assert.equals(results[3].o.value, "William");
                                    assert.equals(results[4].s.value, "http://example/president42");
                                    assert.equals(results[5].s.value, "http://example/president42");
                                    assert.equals(results[4].o.value, "Clinton");
                                    assert.equals(results[5].o.value, "William");
                                }));
                            });
                    });
                });
            });
        },
        "testModifyOnlyInsert": function (done) {
            new Lexicon.Lexicon(function(lexicon){
                new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
                    var engine = new QueryEngine({backend: backend, lexicon: lexicon});
                    engine.execute('PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                        INSERT DATA {  GRAPH <http://example/addresses> \
                        { \
                        <http://example/president25> foaf:givenName "Bill" .\
                        <http://example/president25> foaf:familyName "McKinley" .\
                        <http://example/president27> foaf:givenName "Bill" .\
                        <http://example/president27> foaf:familyName "Taft" .\
                        <http://example/president42> foaf:givenName "Bill" .\
                        <http://example/president42> foaf:familyName "Clinton" .\
                        } \
                        }', function(){
                        engine.execute("PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                            WITH <http://example/addresses_bis>\
                            INSERT { ?person foaf:givenName 'William' }\
                            USING <http://example/addresses>\
                            WHERE  { ?person foaf:givenName 'Bill' }",
                            function(){
                                engine.execute("PREFIX foaf:<http://xmlns.com/foaf/0.1/>\
                                    SELECT * FROM <http://example/addresses_bis> \
                                    { ?s ?p ?o }\
                                    ORDER BY ?s ?p", done(function(success, results){

                                    assert(success);
                                    assert.equals(results[0].s.value, "http://example/president25");
                                    assert.equals(results[0].o.value, "William");
                                    assert.equals(results[1].s.value, "http://example/president27");
                                    assert.equals(results[1].o.value, "William");
                                    assert.equals(results[2].s.value, "http://example/president42");
                                    assert.equals(results[2].o.value, "William");
                                }));
                            });
                    });
                });
            });
        },
        "testModifyOnlyDelete": function (done) {
            new Lexicon.Lexicon(function(lexicon){
                new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
                    var engine = new QueryEngine({backend: backend, lexicon: lexicon});
                    engine.execute('PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                        INSERT DATA {  GRAPH <http://example/addresses> \
                        { \
                        <http://example/president25> foaf:givenName "Bill" .\
                        <http://example/president25> foaf:familyName "McKinley" .\
                        <http://example/president27> foaf:givenName "Bill" .\
                        <http://example/president27> foaf:familyName "Taft" .\
                        <http://example/president42> foaf:givenName "Bill" .\
                        <http://example/president42> foaf:familyName "Clinton" .\
                        } \
                        }', function(){
                        engine.execute("PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                            WITH <http://example/addresses>\
                            DELETE { ?person foaf:givenName 'Bill' }\
                            USING <http://example/addresses>\
                            WHERE  { ?person foaf:givenName 'Bill' }",
                            function(){
                                engine.execute("PREFIX foaf:<http://xmlns.com/foaf/0.1/>\
                                    SELECT * FROM <http://example/addresses> \
                                    { ?s ?p ?o }\
                                    ORDER BY ?s ?p", done(function(success, results){
                                    assert(success);
                                    assert.equals(results.length, 3);
                                }));
                            });
                    });
                });
            });
        },
        "testAliasedVar": function () {
            new Lexicon.Lexicon(function(lexicon){
                new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
                    var engine = new QueryEngine({backend: backend, lexicon: lexicon});
                    var query = "PREFIX : <http://example/>\
                        INSERT DATA {\
                        :s1 :p 1 .\
                        :s1 :q 9 .\
                        :s2 :p 2 . }";
                    engine.execute(query, function(){
                        engine.execute('PREFIX : <http://example/> SELECT (?s AS ?t) {  ?s :p ?v . } GROUP BY ?s', function(success, results){
                            assert(success);
                            assert.equals(results.length, 2);
                            assert.equals(results[0].t.value, "http://example/s1");
                            assert.equals(results[1].t.value, "http://example/s2");
                        });
                    });
                });
            });
        },
        "testClearGraph 1": function (done) {
            new Lexicon.Lexicon(function(lexicon){
                new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
                    var engine = new QueryEngine({backend: backend, lexicon: lexicon});
                    engine.execute('PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                        INSERT DATA {  GRAPH <http://example/president25> \
                        { \
                        <http://example/president25> foaf:givenName "Bill" .\
                        <http://example/president25> foaf:familyName "McKinley" .\
                        } \
                        }', function(){
                        engine.execute('PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                            INSERT DATA {  GRAPH <http://example/president27> \
                            { \
                            <http://example/president27> foaf:givenName "Bill" .\
                            <http://example/president27> foaf:familyName "Taft" .\
                            } \
                            }', function(){
                            engine.execute("CLEAR GRAPH <http://example/president27>", function(){
                                engine.execute("SELECT * { GRAPH <http://example/president27> { ?s ?p ?o } }", function(success, results) {
                                    assert(success);
                                    assert.equals(results.length, 0);
                                    engine.execute("SELECT * { GRAPH <http://example/president25> { ?s ?p ?o } }", done(function(success, results) {
                                        assert.equals(results.length, 2);
                                    }));
                                });
                            });
                        });
                    });
                });
            });
        },
        "testClearGraph 2": function (done) {
            new Lexicon.Lexicon(function(lexicon){
                new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
                    var engine = new QueryEngine({backend: backend, lexicon: lexicon});
                    engine.execute('PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                        INSERT DATA { \
                        <http://example/president22> foaf:givenName "Grover" .\
                        <http://example/president22> foaf:familyName "Cleveland" .\
                        }', function(){
                        engine.execute('PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                            INSERT DATA {  GRAPH <http://example/president25> \
                            { \
                            <http://example/president25> foaf:givenName "Bill" .\
                            <http://example/president25> foaf:familyName "McKinley" .\
                            } \
                            }', function(){
                            engine.execute('PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                                INSERT DATA {  GRAPH <http://example/president27> \
                                { \
                                <http://example/president27> foaf:givenName "Bill" .\
                                <http://example/president27> foaf:familyName "Taft" .\
                                } \
                                }', function(){
                                engine.execute("CLEAR DEFAULT", function(){
                                    engine.execute("SELECT *  { ?s ?p ?o } ", function(success, results) {
                                        assert(success);
                                        assert.equals(results.length, 0);
                                        engine.execute("SELECT * { GRAPH <http://example/president27> { ?s ?p ?o } }", function(success, results) {
                                            assert(success);
                                            assert.equals(results.length, 2);
                                            engine.execute("SELECT * { GRAPH <http://example/president25> { ?s ?p ?o } }", done(function(success, results) {
                                                assert(results.length, 2);
                                            }));
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        },
        "testClearGraph 3": function (done) {
            new Lexicon.Lexicon(function(lexicon){
                new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
                    var engine = new QueryEngine({backend: backend, lexicon: lexicon});
                    engine.execute('PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                        INSERT DATA { \
                        <http://example/president22> foaf:givenName "Grover" .\
                        <http://example/president22> foaf:familyName "Cleveland" .\
                        }', function(){
                        engine.execute('PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                            INSERT DATA {  GRAPH <http://example/president25> \
                            { \
                            <http://example/president25> foaf:givenName "Bill" .\
                            <http://example/president25> foaf:familyName "McKinley" .\
                            } \
                            }', function(){
                            engine.execute('PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                                INSERT DATA {  GRAPH <http://example/president27> \
                                { \
                                <http://example/president27> foaf:givenName "Bill" .\
                                <http://example/president27> foaf:familyName "Taft" .\
                                } \
                                }', function(){
                                engine.execute("CLEAR NAMED", function(success){
                                    assert(success);
                                    engine.execute("SELECT *  { ?s ?p ?o } ", function(success, results) {
                                        assert(results);
                                        assert.equals(results.length, 2);
                                        engine.execute("SELECT * { GRAPH <http://example/president27> { ?s ?p ?o } }", function(success, results) {
                                            assert(success);
                                            assert.equals(results.length, 0);
                                            engine.execute("SELECT * { GRAPH <http://example/president25> { ?s ?p ?o } }", done(function(success, results) {
                                                assert.equals(results.length, 0);
                                            }));
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        },
        "testClearGraph 4": function (done) {
            new Lexicon.Lexicon(function(lexicon){
                new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
                    var engine = new QueryEngine({backend: backend, lexicon: lexicon});
                    engine.execute('PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                        INSERT DATA { \
                        <http://example/president22> foaf:givenName "Grover" .\
                        <http://example/president22> foaf:familyName "Cleveland" .\
                        }', function(){
                        engine.execute('PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                            INSERT DATA {  GRAPH <http://example/president25> \
                            { \
                            <http://example/president25> foaf:givenName "Bill" .\
                            <http://example/president25> foaf:familyName "McKinley" .\
                            } \
                            }', function(){
                            engine.execute('PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                                INSERT DATA {  GRAPH <http://example/president27> \
                                { \
                                <http://example/president27> foaf:givenName "Bill" .\
                                <http://example/president27> foaf:familyName "Taft" .\
                                } \
                                }', function(){
                                engine.execute("CLEAR ALL", function(success){
                                    assert(success);
                                    engine.execute("SELECT *  { ?s ?p ?o } ", function(success, results) {
                                        assert(results);
                                        assert.equals(results.length, 0);
                                        engine.execute("SELECT * { GRAPH <http://example/president27> { ?s ?p ?o } }", function(success, results) {
                                            assert(success);
                                            assert.equals(results.length, 0);
                                            engine.execute("SELECT * { GRAPH <http://example/president25> { ?s ?p ?o } }", done(function(success, results) {
                                                assert.equals(results.length, 0);
                                                var graphs = engine.lexicon.registeredGraphs(true);
                                                assert(success);
                                                assert.equals(graphs.length, 0);
                                            }));
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        },
        "testCreate": function () {
            new Lexicon.Lexicon(function(lexicon){
                new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
                    var engine = new QueryEngine({backend: backend, lexicon: lexicon});
                    engine.execute('CREATE GRAPH <a>', function(result){
                        assert(result);
                    });
                })
            });
        },
        "testDrop 1": function (done) {
            new Lexicon.Lexicon(function(lexicon){
                new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
                    var engine = new QueryEngine({backend: backend, lexicon: lexicon});
                    engine.execute('PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                        INSERT DATA {  GRAPH <http://example/president25> \
                        { \
                        <http://example/president25> foaf:givenName "Bill" .\
                        <http://example/president25> foaf:familyName "McKinley" .\
                        } \
                        }', function(){
                        engine.execute('PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                            INSERT DATA {  GRAPH <http://example/president27> \
                            { \
                            <http://example/president27> foaf:givenName "Bill" .\
                            <http://example/president27> foaf:familyName "Taft" .\
                            } \
                            }', function(){
                            engine.execute("DROP GRAPH <http://example/president27>", function(){
                                engine.execute("SELECT * { GRAPH <http://example/president27> { ?s ?p ?o } }", function(success, results) {
                                    assert(success);
                                    assert.equals(results.length, 0);
                                    engine.execute("SELECT * { GRAPH <http://example/president25> { ?s ?p ?o } }", done(function(success, results) {
                                        assert.equals(results.length, 2);
                                    }));
                                });
                            });
                        });
                    });
                });
            });
        },
        "testDrop 2": function (done) {
            new Lexicon.Lexicon(function(lexicon){
                new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
                    var engine = new QueryEngine({backend: backend, lexicon: lexicon});
                    engine.execute('PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                        INSERT DATA { \
                        <http://example/president22> foaf:givenName "Grover" .\
                        <http://example/president22> foaf:familyName "Cleveland" .\
                        }', function(){
                        engine.execute('PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                            INSERT DATA {  GRAPH <http://example/president25> \
                            { \
                            <http://example/president25> foaf:givenName "Bill" .\
                            <http://example/president25> foaf:familyName "McKinley" .\
                            } \
                            }', function(){
                            engine.execute('PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                                INSERT DATA {  GRAPH <http://example/president27> \
                                { \
                                <http://example/president27> foaf:givenName "Bill" .\
                                <http://example/president27> foaf:familyName "Taft" .\
                                } \
                                }', function(){
                                engine.execute("DROP DEFAULT", function(){
                                    engine.execute("SELECT *  { ?s ?p ?o } ", function(success, results) {
                                        assert(success);
                                        assert.equals(results.length, 0);
                                        engine.execute("SELECT * { GRAPH <http://example/president27> { ?s ?p ?o } }", function(success, results) {
                                            assert(success);
                                            assert.equals(results.length, 2);
                                            engine.execute("SELECT * { GRAPH <http://example/president25> { ?s ?p ?o } }", done(function(success, results) {
                                                assert.equals(results.length, 2);
                                            }));
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        },
        "testDrop 3": function (done) {
            new Lexicon.Lexicon(function(lexicon){
                new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
                    var engine = new QueryEngine({backend: backend, lexicon: lexicon});
                    engine.execute('PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                        INSERT DATA { \
                        <http://example/president22> foaf:givenName "Grover" .\
                        <http://example/president22> foaf:familyName "Cleveland" .\
                        }', function(){
                        engine.execute('PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                            INSERT DATA {  GRAPH <http://example/president25> \
                            { \
                            <http://example/president25> foaf:givenName "Bill" .\
                            <http://example/president25> foaf:familyName "McKinley" .\
                            } \
                            }', function(){
                            engine.execute('PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                                INSERT DATA {  GRAPH <http://example/president27> \
                                { \
                                <http://example/president27> foaf:givenName "Bill" .\
                                <http://example/president27> foaf:familyName "Taft" .\
                                } \
                                }', function(){
                                engine.execute("DROP NAMED", function(success){
                                    assert(success);
                                    engine.execute("SELECT *  { ?s ?p ?o } ", function(success, results) {
                                        assert(results);
                                        assert.equals(results.length, 2);
                                        engine.execute("SELECT * { GRAPH <http://example/president27> { ?s ?p ?o } }", function(success, results) {
                                            assert(success);
                                            assert.equals(results.length, 0);
                                            engine.execute("SELECT * { GRAPH <http://example/president25> { ?s ?p ?o } }", done(function(success, results) {
                                                assert.equals(results.length, 0);
                                            }));
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        },
        "testDrop 4": function (done) {
            new Lexicon.Lexicon(function(lexicon){
                new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
                    var engine = new QueryEngine({backend: backend, lexicon: lexicon});
                    engine.execute('PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                        INSERT DATA { \
                        <http://example/president22> foaf:givenName "Grover" .\
                        <http://example/president22> foaf:familyName "Cleveland" .\
                        }', function(){
                        engine.execute('PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                            INSERT DATA {  GRAPH <http://example/president25> \
                            { \
                            <http://example/president25> foaf:givenName "Bill" .\
                            <http://example/president25> foaf:familyName "McKinley" .\
                            } \
                            }', function(){
                            engine.execute('PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                                INSERT DATA {  GRAPH <http://example/president27> \
                                { \
                                <http://example/president27> foaf:givenName "Bill" .\
                                <http://example/president27> foaf:familyName "Taft" .\
                                } \
                                }', function(){
                                engine.execute("DROP ALL", function(success){
                                    assert(success);
                                    engine.execute("SELECT *  { ?s ?p ?o } ", function(success, results) {
                                        assert(results);
                                        assert.equals(results.length, 0);
                                        engine.execute("SELECT * { GRAPH <http://example/president27> { ?s ?p ?o } }", function(success, results) {
                                            assert(success);
                                            assert.equals(results.length, 0);
                                            engine.execute("SELECT * { GRAPH <http://example/president25> { ?s ?p ?o } }", done(function(success, results) {
                                                assert.equals(results.length, 0);
                                                var graphs = engine.lexicon.registeredGraphs(true);
                                                assert(success);
                                                assert.equals(graphs.length, 0);
                                            }));
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        },
        "testDeleteWhere 1": function (done) {
            new Lexicon.Lexicon(function(lexicon){
                new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
                    var engine = new QueryEngine({backend: backend, lexicon: lexicon});
                    engine.execute('PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                        INSERT DATA \
                        { \
                        <http://example/president25> foaf:givenName "Bill" .\
                        <http://example/president25> foaf:familyName "McKinley" .\
                        <http://example/president27> foaf:givenName "Bill" .\
                        <http://example/president27> foaf:familyName "Taft" .\
                        <http://example/president42> foaf:givenName "Bill" .\
                        <http://example/president42> foaf:familyName "Clinton" .\
                        }', function(){
                        engine.execute("PREFIX foaf:  <http://xmlns.com/foaf/0.1/>\
                            DELETE WHERE  { ?person foaf:givenName 'Bill'}", function(){
                            engine.execute("PREFIX foaf:<http://xmlns.com/foaf/0.1/>\
                                SELECT *  \
                                { ?s ?p ?o }\
                                ORDER BY ?s ?p", done(function(success, results){
                                assert(success);
                                assert.equals(results.length, 3);
                            }));
                        });
                    });
                });
            });
        },
        "testGroupMax 1": function (done) {
            new Lexicon.Lexicon(function(lexicon){
                new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
                    var engine = new QueryEngine({backend: backend, lexicon: lexicon});
                    var query = "PREFIX : <http://example/>\
                        INSERT DATA {\
                        :s1 :p 1 .\
                        :s1 :q 9 .\
                        :s2 :p 2 .\
                        :s2 :p 0 }";
                    engine.execute(query, function(){
                        engine.execute('PREFIX : <http://example/> SELECT (MAX(?v) AS ?maxv) {  ?s ?p ?v . } GROUP BY ?s', done(function(success, results){
                            assert(success);
                            assert.equals(results.length, 2);
                            assert.equals(results[0]["maxv"].value, '9');
                            assert.equals(results[1]["maxv"].value, '2');
                        }));
                    });
                });
            });
        },
        "testGroupMin 1": function (done) {
            new Lexicon.Lexicon(function(lexicon){
                new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
                    var engine = new QueryEngine({backend: backend, lexicon: lexicon});
                    var query = "PREFIX : <http://example/>\
                        INSERT DATA {\
                        :s1 :p 1 .\
                        :s1 :q 9 .\
                        :s2 :p 2 .\
                        :s2 :p 0 }";
                    engine.execute(query, function(){
                        engine.execute('PREFIX : <http://example/> SELECT (MIN(?v) AS ?maxv) {  ?s ?p ?v . } GROUP BY ?s', done(function(success, results){
                            assert(success);
                            assert.equals(results.length, 2);
                            assert.equals(results[0]["maxv"].value, '1');
                            assert.equals(results[1]["maxv"].value, '0');
                        }));
                    });
                });
            });
        },
        "testGroupCount 1": function (done) {
            new Lexicon.Lexicon(function(lexicon){
                new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
                    var engine = new QueryEngine({backend: backend, lexicon: lexicon});
                    var query = "PREFIX : <http://example/>\
                        INSERT DATA {\
                        :s1 :p 1 .\
                        :s1 :q 9 .\
                        :s1 :v 9 .\
                        :s2 :p 2 .\
                        :s2 :p 0 }";
                    engine.execute(query, function(){
                        engine.execute('PREFIX : <http://example/> SELECT (COUNT(?v) AS ?count) {  ?s ?p ?v . } GROUP BY ?s', done(function(success, results){
                            assert(success);
                            assert.equals(results.length, 2);
                            assert.equals(results[0].count.value, '3');
                            assert.equals(results[1].count.value, '2');
                        }));
                    });
                });
            });
        },
        "testGroupCountDistinct 1": function (done) {
            new Lexicon.Lexicon(function(lexicon){
                new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
                    var engine = new QueryEngine({backend: backend, lexicon: lexicon});
                    var query = "PREFIX : <http://example/>\
                        INSERT DATA {\
                        :s1 :p 1 .\
                        :s1 :q 9 .\
                        :s1 :v 9 .\
                        :s2 :p 2 .\
                        :s2 :p 0 }";
                    engine.execute(query, function(){
                        engine.execute('PREFIX : <http://example/> SELECT (COUNT( distinct ?v) AS ?count) {  ?s ?p ?v . } GROUP BY ?s', done(function(success, results){
                            assert(success);
                            assert.equals(results.length, 2);
                            assert.equals(results[0].count.value, '2');
                            assert.equals(results[1].count.value, '2');
                        }));
                    });
                });
            });
        },
        "testGroupAvg 1": function (done) {
            new Lexicon.Lexicon(function(lexicon){
                new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
                    var engine = new QueryEngine({backend: backend, lexicon: lexicon});
                    var query = "PREFIX : <http://example/>\
                        INSERT DATA {\
                        :s1 :p 1 .\
                        :s1 :q 3 .\
                        :s1 :v 3 .\
                        :s2 :p 1 .\
                        :s2 :p 11 }";
                    engine.execute(query, function(){
                        engine.execute('PREFIX : <http://example/> SELECT (AVG( distinct ?v) AS ?avg) {  ?s ?p ?v . } GROUP BY ?s', done(function(success, results){
                            assert(success);
                            assert.equals(results.length, 2);
                            assert.equals(results[0]["avg"].value, '2');
                            assert.equals(results[1]["avg"].value, '6');
                        }));
                    });
                });
            });
        },
        "testGroupAvg 2": function (done) {
            new Lexicon.Lexicon(function(lexicon){
                new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
                    var engine = new QueryEngine({backend: backend, lexicon: lexicon});
                    var query = "PREFIX : <http://example/>\
                        INSERT DATA {\
                        :s1 :p 2 .\
                        :s1 :q 3 .\
                        :s2 :p 1 .\
                        :s2 :p 11 }";
                    engine.execute(query, function(){
                        engine.execute('PREFIX : <http://example/> SELECT (AVG(?v) AS ?avg) {  ?s ?p ?v . } GROUP BY ?s', done(function(success, results){
                            assert(success);
                            assert.equals(results.length, 2);
                            assert.equals(results[0]["avg"].value, '2.5');
                            assert.equals(results[1]["avg"].value, '6');
                        }));
                    });
                });
            });
        },
        "testGroupSum 1": function (done) {
            new Lexicon.Lexicon(function(lexicon){
                new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
                    var engine = new QueryEngine({backend: backend, lexicon: lexicon});
                    var query = "PREFIX : <http://example/>\
                        INSERT DATA {\
                        :s1 :p 1 .\
                        :s1 :q 3 .\
                        :s1 :v 3 .\
                        :s2 :p 1 .\
                        :s2 :p 11 }";
                    engine.execute(query, function(){
                        engine.execute('PREFIX : <http://example/> SELECT (SUM( distinct ?v) AS ?avg) {  ?s ?p ?v . } GROUP BY ?s', done(function(success, results){
                            assert(success);
                            assert.equals(results.length, 2);
                            assert.equals(results[0]["avg"].value, '4');
                            assert.equals(results[1]["avg"].value, '12');
                        }));
                    });
                });
            });
        },
        "testGroupSum 2": function (done) {
            new Lexicon.Lexicon(function(lexicon){
                new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
                    var engine = new QueryEngine({backend: backend, lexicon: lexicon});
                    var query = "PREFIX : <http://example/>\
                        INSERT DATA {\
                        :s1 :p 2 .\
                        :s1 :q 3.5 .\
                        :s2 :p 1 .\
                        :s2 :p 11 }";
                    engine.execute(query, function(){
                        engine.execute('PREFIX : <http://example/> SELECT (SUM(?v) AS ?avg) {  ?s ?p ?v . } GROUP BY ?s', done(function(success, results){
                            assert(success);
                            assert.equals(results.length, 2);
                            assert.equals(results[0]["avg"].value, '5.5');
                            assert.equals(results[1]["avg"].value, '12');
                        }));
                    });
                });
            });
        },
        "testPath 1": function (done) {
            new Lexicon.Lexicon(function(lexicon){
                new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
                    var engine = new QueryEngine({backend: backend, lexicon: lexicon});
                    var query = "PREFIX : <http://example/>\
                        INSERT DATA {\
                        :s1 :first 1 .\
                        :s1 :rest :s2 .\
                        :s2 :first 2 .\
                        :s2 :rest :s3 .\
                        :s3 :first 3 .\
                        :s3 :rest :s4 .\
                        :s4 :first 4 .\
                        :s4 :rest :nil }";
                    engine.execute(query, function(){
                        engine.execute('PREFIX : <http://example/> SELECT ?data {	:s1 :rest* ?data }', done(function(success){
                            assert(success);
                        }));
                    });
                });
            });
        },
        "testPath 2": function (done) {
            new Lexicon.Lexicon(function(lexicon){
                new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
                    var engine = new QueryEngine({backend: backend, lexicon: lexicon});
                    var query = "PREFIX : <http://example/>\
                        INSERT DATA {\
                        :s1 :first 1 .\
                        :s1 :rest :s2 .\
                        :s2 :first 2 .\
                        :s2 :rest :s3 .\
                        :s3 :first 3 .\
                        :s3 :rest :s4 .\
                        :s4 :first 4 .\
                        :s4 :rest :nil }";
                    engine.execute(query, function(){
                        engine.execute('PREFIX : <http://example/> SELECT ?data {  :s1 :rest/:rest*/:first ?data }', done(function(success, results){
                            assert.equals(results.length, 3);
                            var acum = [];
                            for(var i=0; i<results.length; i++) {
                                acum.push(results[i].data.value);
                                assert.equals(results[i].data.token, 'literal');
                                assert.equals(results[i].data.type, 'http://www.w3.org/2001/XMLSchema#integer');
                            }
                            acum.sort();
                            assert.equals(acum[0], '2');
                            assert.equals(acum[1], '3');
                            assert.equals(acum[2], '4');
                        }));
                    });
                });
            });
        },
        "testPath 3": function (done) {
            new Lexicon.Lexicon(function(lexicon){
                new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
                    var engine = new QueryEngine({backend: backend, lexicon: lexicon});
                    var query = "PREFIX : <http://example/>\
                        INSERT DATA {\
                        :s1 :first 1 .\
                        :s1 :rest :s2 .\
                        :s2 :first 2 .\
                        :s2 :rest :s3 .\
                        :s3 :first 3 .\
                        :s3 :rest :s4 .\
                        :s4 :first 4 .\
                        :s4 :rest :nil }";
                    engine.execute(query, function(){
                        engine.execute('PREFIX : <http://example/> SELECT ?data {  :s1 :rest/:restNonExistent*/:first ?data }', done(function(success, results){
                            assert.equals(results.length, 1);
                            assert.equals(results[0].data.value, '2');
                        }));
                    });
                });
            });
        },
        "testPath 4": function (done) {
            new Lexicon.Lexicon(function(lexicon){
                new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
                    var engine = new QueryEngine({backend: backend, lexicon: lexicon});
                    var query = "PREFIX : <http://example/>\
                        INSERT DATA {\
                        :list :elems :s1 .\
                        :s1 :first 1 .\
                        :s1 :rest :s2 .\
                        :s2 :first 2 .\
                        :s2 :rest :s3 .\
                        :s3 :first 3 .\
                        :s3 :rest :s4 .\
                        :s4 :first 4 .\
                        :s4 :rest :nil }";
                    engine.execute(query, function(){
                        engine.execute('PREFIX : <http://example/> SELECT ?data {  :s1 :rest*/:first ?data }', done(function(success, results){
                            assert.equals(results.length, 4);
                        }));
                    });
                });
            });
        },
        "testPath 5": function (done) {
            new Lexicon.Lexicon(function(lexicon){
                new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
                    var engine = new QueryEngine({backend: backend, lexicon: lexicon});
                    var query = "PREFIX : <http://example/>\
                        INSERT DATA {\
                        :list :elems :s1 .\
                        :s1 :first 1 .\
                        :s1 :rest :s2 .\
                        :s2 :first 2 .\
                        :s2 :rest :s3 .\
                        :s3 :first 3 .\
                        :s3 :rest :s4 .\
                        :s4 :first 4 .\
                        :s4 :rest :nil }";
                    engine.execute(query, function(){
                        engine.execute('PREFIX : <http://example/> SELECT ?data {  :list :elems/:rest* ?data }', done(function(success, results){
                            assert.equals(results.length, 4);
                        }));
                    });
                });
            });
        },
        "testPathFinal": function (done) {
            new Lexicon.Lexicon(function(lexicon){
                new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
                    var engine = new QueryEngine({backend: backend, lexicon: lexicon});
                    var query = "PREFIX : <http://example/>\
                        INSERT DATA {\
                        :s1 :data (\"1\" \"2\" \"3\" \"4\")	 }";
                    engine.execute(query, function(){
                        engine.execute('PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> SELECT ?elems {  <http://example/s1> <http://example/data>/rdf:rest*/rdf:first ?elems }', done(function(success, results){
                            assert.equals(results.length, 4);
                            var acum = [],
                                i;
                            for(i=0; i<results.length; i++) {
                                acum.push(results[i]["elems"].value);
                            }
                            acum.sort();
                            for(i=0; i<acum.length; i++) {
                                assert.equals(acum[i], ''+(i+1));
                            }
                        }));
                    });
                });
            });
        },
        "testPathOwl": function (done) {
            new Lexicon.Lexicon(function(lexicon){
                new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
                    var engine = new QueryEngine({backend: backend, lexicon: lexicon});
                    var query = "PREFIX : <http://triplr.org/> \
                        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
                        PREFIX owl: <http://www.w3.org/2002/07/owl#> \
                        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> \
                        PREFIX  xsd: <http://www.w3.org/2001/XMLSchema#> \
                             INSERT DATA {\
                             :actors\
                        a owl:ObjectProperty ;\
                        rdfs:comment \"A cast member of the movie, TV series, season, or episode, or video.\"@en ;\
                        rdfs:domain [\
                        a owl:Class ;\
                        owl:unionOf (:Movie\
                        :TVEpisode\
                        :TVSeries\
                        )\
                        ] ;\
                        rdfs:label \"actors\"@en ;\
                        rdfs:range [\
                        a owl:Class ;\
                        owl:unionOf (:Person\
                        )\
                        ] .\
                        }";
                    engine.execute(query, function(){
                        engine.execute('PREFIX : <http://triplr.org/>\
                            PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
                            PREFIX owl: <http://www.w3.org/2002/07/owl#> \
                            PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> \
                            PREFIX  xsd: <http://www.w3.org/2001/XMLSchema#> \
                            SELECT ?domain { :actors rdfs:domain/owl:unionOf/rdf:rest*/rdf:first ?domain } ORDER BY ?domain', done(function(success, results){
                            assert.equals(results.length, 3);
                            assert.equals(results[0].domain.value, 'http://triplr.org/Movie');
                            assert.equals(results[1].domain.value, 'http://triplr.org/TVEpisode');
                            assert.equals(results[2].domain.value, 'http://triplr.org/TVSeries');
                        }));
                    });
                });
            });
        },
        "testPathOneMore 1": function (done) {
            new Lexicon.Lexicon(function(lexicon){
                new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
                    var engine = new QueryEngine({backend: backend, lexicon: lexicon});
                    var query = "PREFIX : <http://example/>\
                        INSERT DATA {\
                        :s1 :first 1 .\
                        :s1 :rest :s2 .\
                        :s2 :first 2 .\
                        :s2 :rest :s3 .\
                        :s3 :first 3 .\
                        :s3 :rest :s4 .\
                        :s4 :first 4 .\
                        :s4 :rest :nil }";
                    engine.execute(query, function(){
                        engine.execute('PREFIX : <http://example/> SELECT ?data {  :s1 :rest/:restNonExistent+/:first ?data }', done(function(success, results){
                            assert.equals(results.length, 0);
                        }));
                    });
                });
            });
        },
        "testPathOneMore 2": function (done) {
            new Lexicon.Lexicon(function(lexicon){
                new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
                    var engine = new QueryEngine({backend: backend, lexicon: lexicon});
                    var query = "PREFIX : <http://example/>\
                        INSERT DATA {\
                        :s1 :first 1 .\
                        :s1 :rest :s2 .\
                        :s2 :first 2 .\
                        :s2 :rest :s3 .\
                        :s3 :first 3 .\
                        :s3 :rest :s4 .\
                        :s4 :first 4 .\
                        :s4 :rest :nil }";
                    engine.execute(query, function(){
                        engine.execute('PREFIX : <http://example/> SELECT ?data {  :s1 :rest/:rest+/:first ?data }', done(function(success, results){
                            assert.equals(results.length, 2);
                        }));
                    });
                });
            });
        },
        "testDisjointUnion": function (done) {
            new Lexicon.Lexicon(function(lexicon){
                new QuadBackend.QuadBackend({treeOrder: 15}, function(backend){
                    var engine = new QueryEngine({backend: backend, lexicon: lexicon});
                    var query = 'PREFIX ex:  <http://www.w3.org/2009/sparql/docs/tests/data-sparql11/negation#> \
                        PREFIX dc:  <http://purl.org/dc/elements/1.1/>\
                        PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
                        INSERT DATA { ex:a ex:p ex:o . ex:d ex:q ex:o2 . }';
                    engine.execute(query, function(){
                        var query = 'PREFIX ex:  <http://www.w3.org/2009/sparql/docs/tests/data-sparql11/negation#> \
                            PREFIX dc:  <http://purl.org/dc/elements/1.1/>\
                            SELECT ?a ?b { { ?a ex:p ?o1 } UNION { ?b ex:q ?o2 } }';
                        engine.execute(query, done(function(success, results){
                            assert(success);
                            assert.equals(results.length, 2);
                            if(results[0].a === null) {
                                assert.equals(results[0].b.value, 'http://www.w3.org/2009/sparql/docs/tests/data-sparql11/negation#d');
                                assert.equals(results[1].a.value, 'http://www.w3.org/2009/sparql/docs/tests/data-sparql11/negation#a');
                                assert.isNull(results[1].b);
                            } else if(results[0].b === null) {
                                assert.equals(results[0].a.value, 'http://www.w3.org/2009/sparql/docs/tests/data-sparql11/negation#a');
                                assert.equals(results[1].b.value, 'http://www.w3.org/2009/sparql/docs/tests/data-sparql11/negation#d');
                                assert.isNull(results[1].a);
                            } else {
                                assert(false);
                            }
                        }));
                    });
                });
            });
        }
    });
});