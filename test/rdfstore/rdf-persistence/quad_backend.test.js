/*global assert, buster, graphite, module, require*/
if (typeof module === "object" && typeof require === "function") {
    var buster = require("buster");
}

define([
    "src/rdfstore/rdf-persistence/quad_backend",
    "src/rdfstore/query-engine/quad_index_common"
], function (QuadBackend, QuadIndexCommon) {
    buster.testCase("RDFStore QuadBackend", {
        "indexForPatternTest": function () {
            var comps,
                pattern;
            new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
                comps = {subject:1, predicate:'p', object:3, graph:4},
                pattern = new QuadIndexCommon.Pattern(comps);
                assert.equals(backend._indexForPattern(pattern), "OGS");
                comps = {subject:1, predicate:'p', object:3, graph:'g'};
                pattern = new QuadIndexCommon.Pattern(comps);
                assert.equals(backend._indexForPattern(pattern), "OS");
                comps = {subject:'s', predicate:'p', object:3, graph:3};
                pattern = new QuadIndexCommon.Pattern(comps);
                assert.equals(backend._indexForPattern(pattern), "OGS");
                comps = {subject:1, predicate:3, object:3, graph:3};
                pattern = new QuadIndexCommon.Pattern(comps);
                assert.equals(backend._indexForPattern(pattern), "SPOG");
                comps = {subject:'s', predicate:3, object:3, graph:3};
                pattern = new QuadIndexCommon.Pattern(comps);
                assert.equals(backend._indexForPattern(pattern), "POG");
                comps = {subject:'s', predicate:3, object:'o', graph:4};
                pattern = new QuadIndexCommon.Pattern(comps);
                assert.equals(backend._indexForPattern(pattern), "GP");
                comps = {subject:'s', predicate:'p', object:5, graph:6};
                pattern = new QuadIndexCommon.Pattern(comps);
                assert.equals(backend._indexForPattern(pattern), "OGS");
                comps = {subject:0, predicate:'p', object:'o', graph:6};
                pattern = new QuadIndexCommon.Pattern(comps);
                assert.equals(backend._indexForPattern(pattern), "GSP");
            });
        },
        "indexAndRetrievalTest": function () {
            var key,
                indexKey,
                index,
                pattern;
            new QuadBackend.QuadBackend({treeOrder: 2}, function(backend){
                key = new QuadIndexCommon.NodeKey({subject:1, predicate:2, object:3, graph:4})
                backend.index(key, function(result){
                    for(var i=0; i<backend.indices.length; i++) {
                        indexKey = backend.indices[i];
                        index = backend.indexMap[indexKey];
                        assert.equals(index.root.numberActives ,  1);
                        assert.equals(index.root.keys.length ,  1);
                        assert.equals(index.root.keys[0].key.subject ,  1);
                        assert.equals(index.root.keys[0].key.predicate ,  2);
                        assert.equals(index.root.keys[0].key.object ,  3);
                        assert.equals(index.root.keys[0].key.graph ,  4);
                    }
                    pattern = new QuadIndexCommon.Pattern({subject:null, object:2, predicate:3, graph:4});
                    backend.range(pattern, function(results){
                        assert.equals(results.length, 1);
                        backend.delete(results[0]);
                        for(var i=0; i<backend.indices.length; i++) {
                            var indexKey = backend.indices[i];
                            var index = backend.indexMap[indexKey];
                            assert.equals(index.root.numberActives ,  0);
                            assert.equals(index.root.keys.length ,  0);
                        }
                    });
                });
            });
        }
    });
});