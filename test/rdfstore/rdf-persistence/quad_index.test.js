/*global assert, buster, module, require*/
define([
    "src/rdfstore/quad_index"
], function (QuadIndex) {
    buster.testCase("RDFStore QuadIndex", {
        setUp: function () {
            var that = this;
            this.quadBuilder = function(s,p,o) {
                return new QuadIndex.NodeKey({subject: s, predicate:p, object:o});
            }
            this.patternBuilder = function(s,p,o) {
                return new QuadIndex.Pattern({subject: s, predicate:p, object:o});
            }
            this.repeat = function(c,max,floop,fend,env) {
                if(arguments.length===4) { env = {}; }
                if(c<max) {
                    env._i = c;
                    floop(function(floop,env){
                        that.repeat(c+1, max, floop, fend, env);
                    },env);
                } else {
                    fend(env);
                }
            }
        },
        "rangeQuery": function (done) {
            var that = this;
            new QuadIndex.Tree({order: 2, componentOrder:['subject', 'predicate', 'object']}, function(t){
                that.repeat(0, 10, function(k,env){
                    var floop = arguments.callee;
                    t.insert(that.quadBuilder(env._i,0,0), function(){
                        k(floop, env);
                    });
                }, function(env){
                    that.repeat(5, 10, function(k,env){
                        var floop = arguments.callee;
                        t.insert(that.quadBuilder(5,env._i,0), function(){
                            k(floop, env);
                        });
                    }, done(function(env){
                        t.range(that.patternBuilder(5,null,null), function(results){
                            for(var i=0; i<results.length; i++) {
                                assert.equals(results[i].subject, 5);
                            }
                            assert.equals(results.length, 6);
                        });
                    }))
                });

            });
        },
        "nodeKeyComparator": function () {
            var order = ['subject', 'predicate', 'object'],
                comps1 = {subject:1, predicate:2, object:3, graph:4},
                comps2 = {subject:1, predicate:2, object:5, graph:4},
                quad1 = new QuadIndex.NodeKey(comps1, order),
                quad2 = new QuadIndex.NodeKey(comps2, order);
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
                pattern = new QuadIndex.Pattern(comps1);
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
                pattern = new QuadIndex.Pattern(comps1);
            assert.equals(pattern.indexKey[0], "subject");
            assert.equals(pattern.indexKey[1], "object");
            assert.equals(pattern.indexKey[2], "graph");
            assert.equals(pattern.indexKey.length, 3);
            comps1 = {subject:1, predicate:'p', object:3, graph:'g'};
            pattern = new QuadIndex.Pattern(comps1);
            assert.equals(pattern.indexKey[0], "subject");
            assert.equals(pattern.indexKey[1], "object");
            assert.equals(pattern.indexKey.length, 2);
            comps1 = {subject:1, predicate:4, object:3, graph:5};
            pattern = new QuadIndex.Pattern(comps1);
            assert.equals(pattern.indexKey[0], "subject");
            assert.equals(pattern.indexKey[1], "predicate");
            assert.equals(pattern.indexKey[2], "object");
            assert.equals(pattern.indexKey[3], "graph");
            assert.equals(pattern.indexKey.length, 4);
        }
    });
});
