/*global assert, buster, graphite, module, refute, require*/
if (typeof module === "object" && typeof require === "function") {
    var buster = require("buster");
}

define([
    "src/rdfstore/query-engine/rdf_js_interface",
    "src/rdfstore/query-engine/query_engine",
    "src/rdfstore/rdf-persistence/quad_backend",
    "src/rdfstore/rdf-persistence/lexicon"
], function (RDFJSInterface, QueryEngine, QuadBackend, Lexicon) {
    buster.testCase("RDFStore RDFJSInterface", {
        "testFilters": function (done) {
            var engine,
                query,
                rdf,
                results,
                resultsCount,
                resultsSubject,
                resultsObject,
                filter,
                people;
            new Lexicon.Lexicon(function(lexicon){
                new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
                    engine = new QueryEngine({backend: backend, lexicon: lexicon});
                    query = 'PREFIX foaf: <http://xmlns.com/foaf/0.1/>' +
                            'PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>' +
                            'PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>' +
                            'PREFIX : <http://example.org/people/>' +
                            'INSERT DATA {' +
                            ':alice ' +
                            'rdf:type        foaf:Person ;' +
                            'foaf:name       "Alice" ;' +
                            'foaf:mbox       <mailto:alice@work> ;' +
                            'foaf:knows      :bob ;' +
                            '.' +
                            ':bob ' +
                            'rdf:type        foaf:Person ;' +
                            'foaf:name       "Bob" ; ' +
                            'foaf:knows      :alice ;' +
                            'foaf:mbox       <mailto:bob@work> ;' +
                            'foaf:mbox       <mailto:bob@home> ;' +
                            '.' +
                            '}';
                    engine.execute(query, function(){
                        engine.execute('PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>' +
                                'PREFIX  foaf:       <http://xmlns.com/foaf/0.1/>' +
                                'CONSTRUCT { ?s ?p ?o . }' +
                                'WHERE {' +
                                '?s ?p ?o .' +
                                '}', done(function(success, graph){
                            assert(success);
                            assert.equals(graph.length, 9);
                            rdf = RDFJSInterface.rdf;
                            results = graph.filter(rdf.filters.describes("http://example.org/people/alice"));
                            resultsCount = results.toArray().length;
                            resultsSubject = results.filter(rdf.filters.s("http://example.org/people/alice"));
                            resultsObject  = results.filter(rdf.filters.o("http://example.org/people/alice"));
                            assert.equals(resultsObject.toArray().length, 1);
                            assert.equals((resultsObject.toArray().length + resultsSubject.toArray().length), resultsCount);
                            // filter the graph to find all subjects with an "rdf:type" of "foaf:Person"
                            filter = rdf.filters.type(rdf.resolve("foaf:Person"));
                            results = graph.filter( filter );
                            people = [];
                            results.forEach( function(t) {
                                // iterate over the results, creating a filtered graph for each subject found
                                // and pass that graph to a display function
                                people.push(graph.filter( rdf.filters.s(t.subject) ) );
                            });
                            assert.equals(people.length, 2);
                        }));
                    });
                });
            });
        },
        "testActions": function (done) {
            var rdf = RDFJSInterface.rdf;
            var graph = rdf.createGraph();
            graph.addAction(rdf.createAction(rdf.filters.p(rdf.resolve("foaf:name")),
                function(triple){ var name = triple.object.valueOf();
                    var name = name.slice(0,1).toUpperCase() + name.slice(1, name.length);
                    triple.object = rdf.createNamedNode(name);
                    return triple;
                }));
            rdf.setPrefix("ex", "http://example.org/people/");
            graph.add(rdf.createTriple(rdf.createNamedNode(rdf.resolve("ex:Alice")), rdf.createNamedNode(rdf.resolve("foaf:name")), rdf.createLiteral("alice") ));
            graph.add(rdf.createTriple( rdf.createNamedNode(rdf.resolve("ex:Alice")), rdf.createNamedNode(rdf.resolve("foaf:knows")), rdf.createNamedNode(rdf.resolve("ex:Bob")) ));
            assert.equals(graph.length, 2);
            var triples = graph.match(null, rdf.createNamedNode(rdf.resolve("foaf:name")), null).toArray();
            assert.equals(triples.length, 1);
            assert.equals(triples[0].object.valueOf(), "Alice");
            var triples = graph.match(null, rdf.createNamedNode(rdf.resolve("foaf:knows")), null).toArray();
            assert.equals(triples.length, 1);
            assert.equals(triples[0].object.valueOf(), "http://example.org/people/Bob");
            done();
        },
        "testSerialization 1": function (done) {
            var rdf = RDFJSInterface.rdf;
            var graph = new rdf.createGraph();
            rdf.setPrefix("earl", "http://www.w3.org/ns/earl#");
            rdf.setDefaultPrefix("http://www.w3.org/ns/earl#")
            rdf.setPrefix("rdf", "http://www.w3.org/1999/02/22-rdf-syntax-ns#");
            graph.add(rdf.createTriple( rdf.createBlankNode(), rdf.createNamedNode("rdf:type"), rdf.createNamedNode("http://test.com/MyClass") ));
            graph.add(rdf.createTriple( rdf.createNamedNode("earl:test"), rdf.createNamedNode("rdf:type"), rdf.createNamedNode("http://test.com/MyClass") ));
            graph.add(rdf.createTriple( rdf.createNamedNode("earl:test"), rdf.createNamedNode(":test"), rdf.createLiteral("alice") ));
            var parts = graph.toNT().split("\r\n");
            assert.equals(parts[0], '_:0 <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://test.com/MyClass> . ')
            assert.equals(parts[1], '<http://www.w3.org/ns/earl#test> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://test.com/MyClass> . ');
            assert.equals(parts[2], '<http://www.w3.org/ns/earl#test> <http://www.w3.org/ns/earl#test> "alice" . ');
            assert.equals(parts[3], '');
            done();
        },
        "testLiteralSerialization": function () {
            var rdf = RDFJSInterface.rdf;
            var literal = rdf.createLiteral("alice", null, "http://www.w3.org/2001/XMLSchema#string");
            assert.equals(literal.toString(), "\"alice\"^^<http://www.w3.org/2001/XMLSchema#string>");
        },
        "testBlankDefaultNS": function () {
            var rdf = RDFJSInterface.rdf;
            rdf.prefixes.defaultNs = undefined;
            refute.defined(rdf.prefixes.defaultNs);
            assert.equals(rdf.prefixes.resolve(":test"), null);
            assert.equals(rdf.prefixes.shrink("http://something.com/vocab/test"), "http://something.com/vocab/test");
            rdf.prefixes.setDefault("http://something.com/vocab/");
            assert.equals(rdf.prefixes.shrink("http://something.com/vocab/test"), "http://something.com/vocab/test");
            assert.equals(rdf.prefixes.resolve(":test"), "http://something.com/vocab/test");
        }
    });
});