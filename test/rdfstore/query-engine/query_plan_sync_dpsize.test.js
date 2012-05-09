/*global assert, buster, module, require*/
if (typeof module === "object" && typeof require ===  "function") {
    var buster = require("buster");
}
define([
    "src/rdfstore/query-engine/query_plan_sync_dpsize"
], function (QueryPlan) {
    buster.testCase("RDFStore Query Plan", {
        setUp: function () {
            this.makeVar = function(n) {
                return { token: 'var', value: n }
            }
            this.pred = {
                token: 'uri',
                prefix: null,
                suffix: null,
                value: 'http://test.com/named'
            };
        },
        "testGroupingOfPatterns": function (done) {
            var dataIn = [ 
                { 
                    subject: this.makeVar('s'),
                    predicate: this.pred,
                    object: this.makeVar('o')
                },
                {
                    subject: this.makeVar('s'),
                    predicate: this.pred,
                    object: this.makeVar('o2')
                }
            ];
            var solution = QueryPlan.executeAndBGPsGroups(dataIn);
            assert.equals(solution.length, 1);
            assert.equals(solution[0].length, 2);
            var dataIn = [
                {
                    subject: this.makeVar('s'),
                    predicate: this.pred,
                    object: this.makeVar('o')
                },
                {
                    subject: this.makeVar('s'),
                    predicate: this.pred,
                    object: this.makeVar('o2')
                },
                {
                    subject: this.makeVar('p'),
                    predicate: this.pred,
                    object: this.makeVar('p2')
                }
            ];
            var solution = QueryPlan.executeAndBGPsGroups(dataIn);
            assert.equals(solution.length, 2);
            assert.equals(solution[0].length, 2);
            assert.equals(solution[1].length, 1);
            var dataIn = [
                {
                    subject: this.makeVar('s'),
                    predicate: this.pred,
                    object: this.makeVar('o')
                },
                {
                    subject: this.makeVar('s'),
                    predicate: this.pred,
                    object: this.makeVar('o2')
                },
                {
                    subject: this.makeVar('p'),
                    predicate: this.pred,
                    object: this.makeVar('p2')
                },
                {
                    subject: this.makeVar('m'),
                    predicate: this.pred,
                    object: this.makeVar('n2')
                }
            ];
            var solution = QueryPlan.executeAndBGPsGroups(dataIn);
            assert.equals(solution.length, 3);
            assert.equals(solution[0].length, 2);
            assert.equals(solution[1].length, 1);
            assert.equals(solution[2].length, 1);
            var dataIn = [
                {
                    subject: this.makeVar('s'),
                    predicate: this.pred,
                    object: this.makeVar('o')
                },
                {
                    subject: this.makeVar('s'),
                    predicate: this.pred,
                    object: this.makeVar('o2')
                },
                {
                    subject: this.makeVar('p'),
                    predicate: this.pred,
                    object: this.makeVar('p2')
                },
                {
                    subject: this.makeVar('m'),
                    predicate: this.pred,
                    object: this.makeVar('n2')
                },
                {
                    subject: this.makeVar('p'),
                    predicate: this.pred,
                    object: this.makeVar('n2')
                }
            ];
            var solution = QueryPlan.executeAndBGPsGroups(dataIn);
            assert.equals(solution.length, 2);
            assert.equals(solution[0].length, 2);
            assert.equals(solution[1].length, 3);
            done();
        }
    });
});