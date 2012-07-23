/*global assert, buster, module, require*/
if (typeof module === "object" && typeof require ===  "function") {
    var buster = require("buster");
}
define([
    "src/rdfstore/rdf-persistence/in_memory_b_tree",
    "src/rdfstore/utils"
], function (btree, Utils) {
    buster.testCase("RDFStore btree (VERY BIG; TAKES LONG TIME TO RUN)", {
        "testInsertionSearchWalk": function (done) {
            var t = new btree.Tree(2),
                data = [],
                mustFind = [ 1, 2, 3, 4, 5, 6, 7, 8, 11, 14, 15 ];
            t.insert(11,11);
            t.insert(2,2);
            t.insert(14,14);
            t.insert(15,15);
            t.insert(1,1);
            t.insert(7,7);
            t.insert(5,5);
            t.insert(8,8);
            t.insert(4,4);
            t.insert(6,6);
            t.insert(3,3);
            assert.equals(t.search(6), 6);
            t.walk(function(n) {
                data.push(n.data);
            });
            for(var i=0; i<mustFind.length; i++) {
                assert.equals(mustFind[i], data[i]);
            }
            done();
        },
        "testDeletions": function (done) {
            var t = new btree.Tree(2),
                mustFind = [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 14, 15 ],
                data = [];
            t.insert(9,9);
            t.insert(2,2);
            t.insert(10,10);
            t.insert(11,11);
            t.insert(1,1);
            t.insert(7,7);
            t.insert(5,5);
            t.insert(8,8);
            t.insert(14,14);
            t.insert(15,15);
            t.insert(4,4);
            t.insert(6,6);
            t.insert(3,3);
            assert.equals(t.search(9), 9);
            t.walk(function(n) {
                data.push(n);
            });
            for(var i=0; i<mustFind.length; i++) {
                assert.equals(mustFind[i], data[i].data);
            }
            t.delete(9);
            mustFind = [ 1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 14, 15 ];
            data = [];
            t.walk(function(n) {
                data.push(n);
            });
            for(var i=0; i<mustFind.length; i++) {
                assert.equals(mustFind[i] ,  data[i].data);
            }
            t.delete(3);
            mustFind = [ 1, 2, 4, 5, 6, 7, 8, 10, 11, 14, 15 ];
            var data = [];
            t.walk(function(n) {
                data.push(n);
            });
            for(var i=0; i<mustFind.length; i++) {
                assert.equals(mustFind[i] ,  data[i].data);
            }
            for(var i=0; i<mustFind.length; i++) {
                t.delete(mustFind[i]);
            }
            data = [];
            t.walk(function(n) {
                data.push(n);
            });
            assert.equals(data.length, 0);
            done();
        },
        "randomArrays": function (done) {
            var max = 50,
                max_data = 100;
            for(var i=0; i<max; i++) {
                var next = i * 100 /max,
                    t = new btree.Tree(2),
                    data = [],
                    acum = [];
                //console.log(next+"%.");
                for(var j=0; j<max_data; j++) {
                    data.push(j);
                }
                Utils.shuffle(data);
                //console.log("-- Trial:");
                for(var z=0; z<data.length; z++) {
                    t.insert(data[z]);
                    //console.log(data[z]);
                }
                data = Utils.shuffle(data);
                //console.log("-- Removal order:")
                for(var z=0; z<data.length; z++) {
                    //console.log(data[z]);
                    t.delete(data[z]);
                }
                t.walk(function(n) { acum.push(n); });
                assert.equals(t.audit(false).length, 0);
                assert.equals(acum.length, 0);
            }
            done();
        },
        "testDeletionBig": function (done) {
            function shuffle (o) {
                for(var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
                return o;
            }
            var t = new btree.Tree(15),
                acum = [],
                limit = 150,
                d;
            for(var i=0; i<limit; i++) {
                acum.push(i);
            }
            acum = shuffle(acum);
            for(var i=0; i<limit; i++) {
                t.insert(acum[i],acum[i]);
            }
            d = t.search(9);
            assert.equals(d, 9)
            acum = shuffle(acum);
            //console.log("*** DELETING");
            for(var i=0; i<limit; i++) {
                t.delete(acum[i]);
            }
            assert.equals(t.root.numberActives, 0);
            done();
        }
    });
});