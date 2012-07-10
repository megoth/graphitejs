buster.testCase("Graphite graph worker", {
    setUp: function () {
        buster.testRunner.timeout = 3000;
    },
    "Send query message": function (done) {
        var worker = new Worker('src/graphite/graph-worker.js'),
            query = 'LOAD <http://localhost:8088/rdfjson/test.rdfjson>';
        worker.onmessage = done(function(e) {
            assert.equals(e.data.query, query);
        });
        worker.onerror = done(function (e) {
            //console.log("EVENT FAILED", e);
            assert(false);
        });
        worker.postMessage({
            cmd: "query",
            query: query
        });
    },
    "Releases idle state after receiving response": function (done) {
        var worker = new Worker('src/graphite/graph-worker.js'),
            query = 'LOAD <http://localhost:8088/rdfjson/test.rdfjson>',
            idle = true,
            pauseFunc = function (millis, callback) {
                setTimeout(function () {
                    //console.log("WAITING", idle);
                    if (idle === true) {
                        pauseFunc(millis);
                    } else {
                        callback();
                    }
                }, millis);
            };
        worker.onmessage = function(e) {
            //console.log("SUCCESS!", e);
            idle = false;
        };
        worker.onerror = done(function (e) {
            //console.log("EVENT FAILED", e);
            idle = false;
        });
        worker.postMessage({
            cmd: "query",
            query: query
        });
        pauseFunc(10, done(function () {
            //console.log("IDLE?", idle);
        }));
    }
});