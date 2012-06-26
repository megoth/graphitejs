define([
    "src/graphite"
], function (Graphite) {
    "use strict";
    buster.testCase("Demo music app", {
        setUp: function (done) {
            buster.testRunner.timeout = 1000;
            this.g = Graphite()
                .load("http://localhost:8088/musicapp/data/users.jsonld")
                .load("http://localhost:8088/musicapp/data/artists.jsonld")
                .load("http://localhost:8088/musicapp/data/records.jsonld")
                .load("http://localhost:8088/musicapp/data/tracks.jsonld")
                .then(done);
        },
        "Load tracks": function (done) {
            var spy = sinon.spy();
            this.g
                .query("http://localhost:8088/musicapp/queries/tracks.rq")
                .each(spy)
                .then(done(function () {
                    assert.equals(spy.callCount, 2);
                }));
        },
        "Load tracks, with where": function (done) {
            var spy = sinon.spy();
            this.g
                .query("http://localhost:8088/musicapp/queries/tracks.rq")
                .where("?user ma:listensTo ?t")
                .each(spy)
                .then(done(function () {
                assert.equals(spy.callCount, 1);
            }));
        }
    });
});