define([
    "src/graphite/query",
    "src/rdfstore/trees/utils",
    "../utils",
    "src/graphite/utils",
    "src/graphite/when"
], function (Query, RDFStoreUtils, TestUtils, Utils, When) {
    function checkGroup (directory, files) {
        var promises = [];
        Utils.each(files, function (filePath) {
            promises.push(checkSparql(directory + filePath));
        });
        return When.all(promises);
    }
    function checkSparql(filePath) {
        var promise = When.defer();
        TestUtils.openFile(filePath, function (err, data) {
            buster.log("QUERY", data);
            promise.resolve({
                after: Query(data).run(),
                before: data.replace(/(\r\n|\n|\r)/gm, " ").replace(/\s\s/, " "),
                description: filePath
            });
        });
        return promise;
    }
    function sparqlEquals(objects) {
        Utils.each(objects, function (obj) {
            assert.equals(obj.before, obj.after, obj.description);
        });
    }
    buster.testCase("Graphite query", {
        setUp: function () {
            this.query = Query();
            this.subJohn = "http://dbpedia.org/resource/John_Lennon";
            this.preName = "http://xmlns.com/foaf/0.1/name";
            this.preHomepage = "http://xmlns.com/foaf/0.1/homepage";
            this.objJohnName = "John Lennon";
            this.subTim = "http://dbpedia.org/resource/Tim_B_Lee";
            this.objTimName = "Tim Berners-Lee";
            this.objTimHomepage = "http://www.w3.org/People/Berners-Lee/";
            this.uriHomepage = "http://xmlns.com/foaf/0.1/homepage";
            this.uriInteger = "http://www.w3.org/2001/XMLSchema#integer";
            this.objManuName = "Manu Sporny";
            this.preKnows = "http://xmlns.com/foaf/0.1/knows";
            this.graph1 = [
                Utils.createTriple(this.subJohn, this.preName, this.objJohnName).statement,
                Utils.createTriple(null, this.preName, this.objTimName).statement,
                Utils.createTriple(null, this.preName, 42).statement,
                Utils.createTriple(this.subTim, this.preName, 42).statement
            ];
            this.triple2 = [
                Utils.createTriple(this.subJohn, this.preKnows, this.subTim).statement
            ];
        },
        "Proper setup": function () {
            assert.defined(Query);
            assert.isFunction(Query);
        },
        "Function .getTriples": function () {
            var triples = this.query.getTriples("");
            assert.equals(triples, []);
            triples = this.query.getTriples("INSERT DATA { " + this.graph1.join("") + " }");
            assert.equals(triples, this.graph1);
            triples = this.query.getTriples("DELETE DATA { " + this.triple2.join("") + " }");
            assert.equals(triples, this.triple2);
        },
        "Function .run": {
            "Loading SPARQL test suite": {
                "aggregates": function (done) {
                    checkGroup("http://localhost:8088/sparql/aggregates/", [
                        "agg-avg-01.rq",
                        //"agg-avg-02.rq",
                        "agg-err-01.rq"
                    ]).then(done(function () {
                        sparqlEquals(arguments);
                    }));
                },
                "//In progress": function (done) {
                    var current = "http://localhost:8088/sparql/aggregates/agg-err-01.rq";
                    TestUtils.openFile(current, done(function (err, data) {
                        buster.log("QUERY", data);
                        buster.log("RUN", Query(data).run());
                    }));
                }
            },
            "//Returns a simple select query by default": function () {
                assert.equals(this.query.run(), "SELECT * WHERE { ?s ?p ?o }");
            }
        },
        "//Function .select": {
            "Modifies the default select-part": function () {
                var part = "?subject";
                this.query.select(part);
                assert.equals(this.query.run(), "SELECT {0} WHERE { ?s ?p ?o }".format(part));
            }
        },
        "//Function .where": {
            "Single call": function () {
                var part = '?s <http://example.org/x> <http://example.org/y>';
                this.query.where(part);
                assert.equals(this.query.run(), "SELECT * WHERE { {0} }".format(part));
            },
            "Multiple call": function () {
                var part1 = '?s <http://example.org/x> <http://example.org/y>',
                    part2 = '<http://example.org/z> ?p <http://example.org/y>';
                this.query.where(part1);
                this.query.where(part2);
                assert.equals(this.query.run(), "SELECT * WHERE { {0} . {1} }".format(part1, part2));
            }
        }
    });
});