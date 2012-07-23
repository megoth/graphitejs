/*global assert, buster, define */
define(["src/rdfstore/utils"], function (utils) {
    "use strict";
    buster.testCase("RDFStore Utils", {
        "testSeq": function (done) {
            var acum = [];
            utils.seq(function (k) {
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
                if(counter == utils.stackCounterLimit) {
                    assert.equals(counter, 1000);
                    done();
                } else {
                    utils.recur(function () { testRec(); });
                }
            };
            testRec();
        }
    });
});