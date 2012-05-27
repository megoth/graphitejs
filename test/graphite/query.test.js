define([
    "src/graphite/query",
    "src/rdfstore/trees/utils",
    "src/rdfstore/sparql-parser/sparql_parser",
    "../utils",
    "src/graphite/utils",
    "src/graphite/when"
], function (Query, RDFStoreUtils, SparqlParser, TestUtils, Utils, When) {
    function checkGroup (directory, files, fileExtension) {
        var promises = [];
        Utils.each(files, function (filePath) {
            promises.push(checkSparql("http://localhost:8088/sparql/{0}/{1}.{2}".format(
                directory,
                filePath,
                fileExtension || "rq"
            )));
        });
        return When.all(promises);
    }
    function checkSparql(filePath) {
        var promise = When.defer();
        TestUtils.openFile(filePath, function (err, data) {
            var query = Query(data).run();
            buster.log("QUERIES", data, "\n", query);
            promise.resolve({
                after: SparqlParser.parser.parse(query),
                afterQuery: query,
                before: SparqlParser.parser.parse(data),
                beforeQuery: data,
                description: filePath
            });
        });
        return promise;
    }
    function sparqlEquals(objects) {
        Utils.each(objects, function (obj) {
            buster.log("DID NOT EQUAL", obj.description, obj.beforeQuery, obj.afterQuery);
            assert.equals(obj.before, obj.after, obj.description);
        });
    }
    buster.testCase("Graphite query", {
        setUp: function () {
            this.query = Query();
            this.subJohn = "http://dbpedia.org/resource/John_Lennon";
            this.preName = "http://xmlns.com/foaf/0.1/name";
            //this.preHomepage = "http://xmlns.com/foaf/0.1/homepage";
            this.objJohnName = "John Lennon";
            this.subTim = "http://dbpedia.org/resource/Tim_B_Lee";
            this.objTimName = "Tim Berners-Lee";
            //this.objTimHomepage = "http://www.w3.org/People/Berners-Lee/";
            //this.uriHomepage = "http://xmlns.com/foaf/0.1/homepage";
            //this.uriInteger = "http://www.w3.org/2001/XMLSchema#integer";
            //this.objManuName = "Manu Sporny";
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