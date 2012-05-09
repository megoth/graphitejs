/*global assert, buster, graphite, module, require*/
if (typeof module === "object" && typeof require === "function") {
    var buster = require("buster");
}

define(["src/rdfstore/rdf-persistence/quad_index_common"], function (QuadIndexCommon) {
    buster.testCase("RDFStore QuadIndexCommon", {
        "nodeKeyComparator": function () {
            var order = ['subject', 'predicate', 'object'],
                comps1 = {subject:1, predicate:2, object:3, graph:4},
                comps2 = {subject:1, predicate:2, object:5, graph:4},
                quad1 = new QuadIndexCommon.NodeKey(comps1, order),
                quad2 = new QuadIndexCommon.NodeKey(comps2, order);
            assert.equals(quad1.comparator(quad2), -1);
            quad1['object'] = 6;
            assert.equals(quad1.comparator(quad2), 1);
            quad1['object'] = quad2['object'];
            assert.equals(quad1.comparator(quad2), 0);
            quad2['object'] = null;
            assert.equals(quad1.comparator(quad2), 0);
            quad1['predicate'] = 0;
            assert.equals(quad1.comparator(quad2), -1);
            quad1['predicate'] = 10;
            assert.equals(quad1.comparator(quad2), 1);
        },
        "quadPatternBuild": function () {
            var comps1 = {subject:1, predicate:'p', object:3, graph:4},
                pattern = new QuadIndexCommon.Pattern(comps1);
            assert.equals(pattern.subject, 1);
            assert.equals(pattern.predicate, 'p');
            assert.equals(pattern.object, 3);
            assert.equals(pattern.graph, 4);
            assert.equals(pattern.keyComponents.subject, 1);
            assert.equals(pattern.keyComponents.predicate, null);
            assert.equals(pattern.keyComponents.object, 3);
            assert.equals(pattern.keyComponents.graph, 4);
            assert.equals(pattern.order[0], 'subject');
            assert.equals(pattern.order[1], 'object');
            assert.equals(pattern.order[2], 'graph');
            assert.equals(pattern.order[3], 'predicate');
            assert.equals(pattern.order.length, 4);
        },
        "quadPatternIndexKey": function () {
            var comps1 = {subject:1, predicate:'p', object:3, graph:4},
                pattern = new QuadIndexCommon.Pattern(comps1);
            assert.equals(pattern.indexKey[0], "subject");
            assert.equals(pattern.indexKey[1], "object");
            assert.equals(pattern.indexKey[2], "graph");
            assert.equals(pattern.indexKey.length, 3);
            comps1 = {subject:1, predicate:'p', object:3, graph:'g'};
            pattern = new QuadIndexCommon.Pattern(comps1);
            assert.equals(pattern.indexKey[0], "subject");
            assert.equals(pattern.indexKey[1], "object");
            assert.equals(pattern.indexKey.length, 2);
            comps1 = {subject:1, predicate:4, object:3, graph:5};
            pattern = new QuadIndexCommon.Pattern(comps1);
            assert.equals(pattern.indexKey[0], "subject");
            assert.equals(pattern.indexKey[1], "predicate");
            assert.equals(pattern.indexKey[2], "object");
            assert.equals(pattern.indexKey[3], "graph");
            assert.equals(pattern.indexKey.length, 4);
        }
    });
});