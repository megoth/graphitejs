/*global assert, buster, define */
define(["src/rdfstore/utils"], function (TreeUtils) {
    "use strict";
    var quadBuilder = function(s,p,o) {
            return new TreeUtils.NodeKey({subject: s, predicate:p, object:o});
        },
        patternBuilder = function(s,p,o) {
            return new TreeUtils.Pattern({subject: s, predicate:p, object:o});
        },
        repeat = function(c,max,floop,fend,env) {
            if(arguments.length===4) { env = {}; }
            if(c<max) {
                env._i = c;
                floop(function(floop,env){
                    repeat.call(this, c+1, max, floop, fend, env);
                },env);
            } else {
                fend(env);
            }
        };
    buster.testCase("RDFStore Utils", {
        "testSeq": function (done) {
            var acum = [];
            TreeUtils.seq(function (k) {
                acum.push(1);
                k();
            }, function (k) {
                acum.push(2);
                k();
            })(function () {
                assert.equals(acum.length, 2);
                assert.equals(acum[0], 1);
                assert.equals(acum[1], 2);
                done();
            });
        },
        "testRecur": function (done) {
            var counter = 0;
            var testRec = function () {
                counter++;
                if(counter == TreeUtils.stackCounterLimit) {
                    assert.equals(counter, 1000);
                    done();
                } else {
                    TreeUtils.recur(function () { testRec(); });
                }
            };
            testRec();
        },
        "RDFStore TreeUtils": {
            "//rangeQuery (not valid in strict mode)": function (done) {
                new TreeUtils.Tree({order: 2, componentOrder:['subject', 'predicate', 'object']}, function(t){
                    repeat.call(this, 0, 10, function(k,env){
                        var floop = arguments.callee;
                        t.insert(quadBuilder.call(this, env._i,0,0), function(){
                            k(this, env);
                        }.bind(this));
                    }.bind(this), function(){
                        repeat.call(this, 5, 10, function(k,env){
                            var floop = arguments.callee;
                            t.insert(quadBuilder.call(this, 5,env._i,0), function(){
                                k(floop, env);
                            });
                        }.bind(this), done(function(){
                            t.range(patternBuilder.call(this, 5,null,null), function(results){
                                for(var i=0; i<results.length; i++) {
                                    assert.equals(results[i].subject, 5);
                                }
                                assert.equals(results.length, 6);
                            });
                        }.bind(this)))
                    }.bind(this));
                }.bind(this));
            },
            "nodeKeyComparator": function () {
                var order = ['subject', 'predicate', 'object'],
                    comps1 = {subject:1, predicate:2, object:3, graph:4},
                    comps2 = {subject:1, predicate:2, object:5, graph:4},
                    quad1 = new TreeUtils.NodeKey(comps1, order),
                    quad2 = new TreeUtils.NodeKey(comps2, order);
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
                    pattern = new TreeUtils.Pattern(comps1);
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
                    pattern = new TreeUtils.Pattern(comps1);
                assert.equals(pattern.indexKey[0], "subject");
                assert.equals(pattern.indexKey[1], "object");
                assert.equals(pattern.indexKey[2], "graph");
                assert.equals(pattern.indexKey.length, 3);
                comps1 = {subject:1, predicate:'p', object:3, graph:'g'};
                pattern = new TreeUtils.Pattern(comps1);
                assert.equals(pattern.indexKey[0], "subject");
                assert.equals(pattern.indexKey[1], "object");
                assert.equals(pattern.indexKey.length, 2);
                comps1 = {subject:1, predicate:4, object:3, graph:5};
                pattern = new TreeUtils.Pattern(comps1);
                assert.equals(pattern.indexKey[0], "subject");
                assert.equals(pattern.indexKey[1], "predicate");
                assert.equals(pattern.indexKey[2], "object");
                assert.equals(pattern.indexKey[3], "graph");
                assert.equals(pattern.indexKey.length, 4);
            }
        }
    });
});