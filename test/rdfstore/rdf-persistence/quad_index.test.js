/*global assert, buster, module, require*/
if (typeof module === "object" && typeof require === "function") {
    var buster = require("buster");
}

define([
    "src/rdfstore/rdf-persistence/quad_index",
    "src/rdfstore/query-engine/quad_index_common"
], function (QuadIndex, QuadIndexCommon) {
    buster.testCase("RDFStore QuadIndex", {
        setUp: function () {
            var that = this;
            this.quadBuilder = function(s,p,o) {
                return new QuadIndexCommon.NodeKey({subject: s, predicate:p, object:o});
            }
            this.patternBuilder = function(s,p,o) {
                return new QuadIndexCommon.Pattern({subject: s, predicate:p, object:o});
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
        }
    });
});
