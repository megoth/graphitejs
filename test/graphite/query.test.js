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
        "Function .run": {
            "Loading SPARQL test suite (173 of 409 passes)": {
                setUp: function () {
                    buster.testRunner.timeout = 2000;
                },
                "//add": function (done) {
                    checkGroup("add", [
                        //"add-01", NOT PARSED
                        //"add-03", NOT PARSED
                        //"add-05", NOT PARSED
                        //"add-07", NOT PARSED
                        //"add-08" NOT PARSED
                    ], "ru").then(done(function () {
                        sparqlEquals.apply(this, arguments);
                    }));
                },
                "aggregates": function (done) {
                    checkGroup("aggregates", [
                        "agg-avg-01",
                        //"agg-avg-02", NOT PARSED
                        "agg-err-01",
                        //"agg-err-02", NOT PARSED
                        //"agg-groupconcat-1", NOT PARSED
                        //"agg-groupconcat-2", NOT PARSED
                        //"agg-groupconcat-3", NOT PARSED
                        "agg-max-01",
                        "agg-max-02",
                        "agg-min-01",
                        "agg-min-02",
                        //"agg-sample-01", NOT PARSED
                        "agg-sum-01",
                        "agg-sum-02",
                        "agg01",
                        "agg02",
                        //"agg03", NOT PARSED
                        "agg04",
                        "agg05",
                        //"agg06", NOT PARSED
                        //"agg07", NOT PARSED
                        "agg08",
                        "agg09",
                        "agg10",
                        "agg11",
                        "agg12"
                    ]).then(done(function () {
                        sparqlEquals.apply(this, arguments);
                    }));
                },
                "basic-update": function (done) {
                    checkGroup("basic-update", [
                        "insert-01",
                        "insert-02",
                        "insert-03",
                        "insert-04",
                        "insert-data-named1",
                        "insert-data-named2",
                        "insert-data-spo1",
                        "insert-using-01"
                    ], "ru").then(done(function () {
                        sparqlEquals.apply(this, arguments);
                    }));
                },
                "//bind": function (done) {
                    checkGroup("bind", [
                        //"bind01", NOT PARSED
                        //"bind02", NOT PARSED
                        //"bind03", NOT PARSED
                        //"bind04", NOT PARSED
                        //"bind05", NOT PARSED
                        //"bind06", NOT PARSED
                        //"bind07", NOT PARSED
                        //"bind08", NOT PARSED
                        //"bind10", NOT PARSED
                        //"bind11" NOT PARSED
                    ]).then(done(function () {
                        sparqlEquals.apply(this, arguments);
                    }));
                },
                "//bindings": function (done) {
                    checkGroup("bindings", [
                        //"bindings01", NOT PARSED
                        //"bindings02", NOT PARSED
                        //"bindings03", NOT PARSED
                        //"bindings04", NOT PARSED
                        //"bindings05", NOT PARSED
                        //"bindings06", NOT PARSED
                        //"bindings07", NOT PARSED
                        //"bindings08", NOT PARSED
                    ]).then(done(function () {
                        sparqlEquals.apply(this, arguments);
                    }));
                },
                "//clear": function (done) {
                    checkGroup("clear", [
                        //"clear-all-01", NOT PARSED
                        //"clear-default-01", NOT PARSED
                        //"clear-graph-01", NOT PARSED
                        //"clear-named-01" NOT PARSED
                    ], "ru").then(done(function () {
                        sparqlEquals.apply(this, arguments);
                    }));
                },
                "//construct": function (done) {
                    checkGroup("construct", [
                        //"constructwhere01", NOT PARSED
                        //"constructwhere02", NOT PARSED
                        //"constructwhere03", NOT PARSED
                        //"constructwhere04", NOT PARSED
                        //"constructwhere05", NOT PARSED
                        //"constructwhere06" NOT PARSED
                    ]).then(done(function () {
                        sparqlEquals.apply(this, arguments);
                    }));
                },
                "//copy": function (done) {
                    checkGroup("copy", [
                        //"copy-01", NOT PARSED
                        //"copy-03", NOT PARSED
                        //"copy-06", NOT PARSED
                        //"copy-07" NOT PARSED
                    ], "ru").then(done(function () {
                        sparqlEquals.apply(this, arguments);
                    }));
                },
                "csv-tsv-res": function (done) {
                    checkGroup("csv-tsv-res", [
                        "csvtsv01",
                        "csvtsv02"
                    ]).then(done(function () {
                        sparqlEquals.apply(this, arguments);
                    }));
                },
                "delete": function (done) {
                    checkGroup("delete", [
                        "delete-01",
                        "delete-02",
                        "delete-03",
                        "delete-04",
                        "delete-05",
                        "delete-06",
                        "delete-07",
                        "delete-using-01",
                        "delete-using-02",
                        "delete-using-03",
                        "delete-using-04",
                        "delete-using-05",
                        "delete-using-06",
                        "delete-with-01",
                        "delete-with-02",
                        "delete-with-03",
                        "delete-with-04",
                        "delete-with-05",
                        "delete-with-06"
                    ], "ru").then(done(function () {
                        sparqlEquals.apply(this, arguments);
                    }));
                },
                "delete-data": function (done) {
                    checkGroup("delete-data", [
                        "delete-data-01",
                        "delete-data-02",
                        "delete-data-03",
                        "delete-data-04",
                        "delete-data-05",
                        "delete-data-06"
                    ], "ru").then(done(function () {
                        sparqlEquals.apply(this, arguments);
                    }));
                },
                "///delete-insert": function (done) {
                    checkGroup("delete-insert", [
                        "delete-insert-01",
                        "delete-insert-01b",
                        "delete-insert-01c",
                        "delete-insert-02",
                        "delete-insert-03",
                        "delete-insert-03b",
                        //"delete-insert-04" NO SUPPORT FOR SUBQUERIES
                        //"delete-insert-04b" TREE TOO ARBITRARY
                        "delete-insert-05",
                        //"delete-insert-05b" TREE TOO ARBITRARY
                        "delete-insert-07",
                        "delete-insert-07b",
                        "delete-insert-08",
                        "delete-insert-09" //(TREE TO ARBITRARY, DOESN'T COEXIST WITH syntax-query/syntax-aggregate-02
                    ], "ru").then(done(function () {
                        sparqlEquals.apply(this, arguments);
                    }));
                },
                "In progress (delete-insert)": function (done) {
                    var current = "http://localhost:8088/sparql/delete-insert/delete-insert-09.ru",
                        previousQuery,
                        currentQuery,
                        previousTree,
                        currentTree;
                    TestUtils.openFile(current, done(function (err, data) {
                        previousQuery = data;
                        currentQuery = Query(data).run();
                        buster.log("QUERIES", previousQuery, "\n", currentQuery);
                        previousTree = SparqlParser.parser.parse(previousQuery);
                        buster.log("ORIG TREE", previousTree);
                        currentTree = SparqlParser.parser.parse(currentQuery);
                        assert.equals(previousTree, currentTree);
                    }));
                },
                "//delete-where": function (done) {
                    checkGroup("delete-where", [
                        //"delete-where-01" TREE TOO ARBITRARY
                        //"delete-where-02" TREE TOO ARBITRARY
                        //"delete-where-03" TREE TOO ARBITRARY
                        //"delete-where-04" TREE TOO ARBITRARY
                        //"delete-where-05" TREE TOO ARBITRARY
                        //"delete-where-06" TREE TOO ARBITRARY
                    ], "ru").then(done(function () {
                        sparqlEquals.apply(this, arguments);
                    }));
                },
                "//In progress (delete-where)": function (done) {
                    var current = "http://localhost:8088/sparql/delete-where/delete-where-01.ru",
                        previousQuery,
                        currentQuery,
                        previousTree,
                        currentTree;
                    TestUtils.openFile(current, done(function (err, data) {
                        previousQuery = data;
                        currentQuery = Query(data).run();
                        buster.log("QUERIES", previousQuery, "\n", currentQuery);
                        previousTree = SparqlParser.parser.parse(previousQuery);
                        delete previousTree.kind;
                        delete previousTree.prologue;
                        delete previousTree.token;
                        //delete previousTree.units;
                        buster.log("ORIG TREE", previousTree);
                        currentTree = SparqlParser.parser.parse(currentQuery);
                        //assert.equals(previousTree, currentTree);
                    }));
                },
                "//drop": function (done) {
                    // Parser not working properly
                    checkGroup("drop", [
                        //"drop-all-01" NOT PARSED
                        //"drop-default-01" NOT PARSED
                        //"drop-graph-01" NOT PARSED
                        //"drop-named-01" NOT PARSED
                    ], "ru").then(done(function () {
                        sparqlEquals.apply(this, arguments);
                    }));
                },
                "//In progress (drop)": function (done) {
                    var current = "http://localhost:8088/sparql/drop/drop-named-01.ru",
                        previousQuery,
                        currentQuery,
                        previousTree,
                        currentTree;
                    TestUtils.openFile(current, done(function (err, data) {
                        previousQuery = data;
                        currentQuery = Query(data).run();
                        buster.log("QUERIES", previousQuery, "\n", currentQuery);
                        previousTree = SparqlParser.parser.parse(previousQuery);
                        delete previousTree.kind;
                        delete previousTree.prologue;
                        delete previousTree.token;
                        //delete previousTree.units;
                        buster.log("ORIG TREE", previousTree);
                        currentTree = SparqlParser.parser.parse(currentQuery);
                        //assert.equals(previousTree, currentTree);
                    }));
                },
                "entailment": function (done) {
                    checkGroup("entailment", [
                        //"bind01" NOT PARSED,
                        //"bind02" NOT PARSED,
                        //"bind03" NOT PARSED,
                        //"bind04" NOT PARSED,
                        //"bind05" NOT PARSED,
                        //"bind06" NOT PARSED,
                        //"bind07" NOT PARSED,
                        //"bind08" NOT PARSED,
                        "d-ent-01",
                        "lang",
                        "owlds01",
                        "owlds02",
                        "rdf01",
                        "rdf02",
                        "rdf03",
                        "rdf04",
                        "rdfs01",
                        "rdfs02",
                        "rdfs03",
                        "rdfs04",
                        "rdfs05",
                        "rdfs06",
                        "rdfs07",
                        "rdfs08",
                        "rdfs09",
                        "rdfs10",
                        "rdfs11",
                        "rdfs12",
                        "rdfs13"
                    ]).then(done(function () {
                        sparqlEquals.apply(this, arguments);
                    }));
                },
                "In progress (entailment)": function (done) {
                    var current = "http://localhost:8088/sparql/entailment/rdfs13.rq",
                        previousQuery,
                        currentQuery,
                        previousTree,
                        currentTree;
                    TestUtils.openFile(current, done(function (err, data) {
                        previousQuery = data;
                        currentQuery = Query(data).run();
                        buster.log("QUERIES", previousQuery, "\n", currentQuery);
                        previousTree = SparqlParser.parser.parse(previousQuery);
                        //delete previousTree.kind;
                        //delete previousTree.prologue;
                        //delete previousTree.token;
                        //delete previousTree.units;
                        buster.log("ORIG TREE", previousTree);
                        currentTree = SparqlParser.parser.parse(currentQuery);
                        assert.equals(previousTree, currentTree);
                    }));
                },
                "functions": function (done) {
                    checkGroup("functions", [
                        //"abs01" NOT PARSED,
                        "bnode01",
                        "bnode02",
                        //"ceil01" NOT PARSED,
                        //"coalesce01" NOT PARSED,
                        //"concat01" NOT PARSED,
                        //"concat02" NOT PARSED,
                        //"contains01" NOT PARSED,
                        //"day-01" NOT PARSED,
                        //"encode01" NOT PARSED,
                        //"ends01" NOT PARSED,
                        //"floor01" NOT PARSED,
                        //"hours-01" NOT PARSED,
                        "if01",
                        "if02",
                        //"in01" NOT PARSED,
                        //"in02" NOT PARSED,
                        "iri01",
                        //"isnumeric01" NOT PARSED,
                        //"lcase01" NOT PARSED,
                        //"length01" NOT PARSED,
                        //"md5-01" NOT PARSED,
                        //"md5-02" NOT PARSED,
                        //"minutes-01" NOT PARSED,
                        //"month-01" NOT PARSED,
                        //"notin01" NOT PARSED,
                        //"notin02" NOT PARSED,
                        //"now01" NOT PARSED,
                        "plus-1",
                        "plus-2"
                        //"rand01" NOT PARSED,
                        //"replace01" NOT PARSED,
                        //"replace02" NOT PARSED,
                        //"replace03" NOT PARSED,
                        //"round01" NOT PARSED,
                        //"sha1-01" NOT PARSED,
                        //"sha1-02" NOT PARSED,
                        //"sha256-01" NOT PARSED,
                        //"sha256-02" NOT PARSED,
                        //"sha512-01" NOT PARSED,
                        //"sha512-02" NOT PARSED,
                        //"starts01" NOT PARSED,
                        //"strafter01" NOT PARSED,
                        //"strbefore01" NOT PARSED,
                        //"strdt01" NOT PARSED,
                        //"strdt02" NOT PARSED,
                        //"strdt03" NOT PARSED,
                        //"strlang01" NOT PARSED,
                        //"strlang02" NOT PARSED,
                        //"strlang03" NOT PARSED,
                        //"struuid01" NOT PARSED,
                        //"substring01" NOT PARSED,
                        //"substring02" NOT PARSED,
                        //"timezone-01" NOT PARSED,
                        //"tz-01" NOT PARSED,
                        //"ucase01" NOT PARSED,
                        //"uuid01" NOT PARSED,
                        //"year-01" NOT PARSED
                    ]).then(done(function () {
                        sparqlEquals.apply(this, arguments);
                    }));
                },
                "//In progress (functions)": function (done) {
                    var current = "http://localhost:8088/sparql/functions/bnode01.rq",
                        previousQuery,
                        currentQuery,
                        previousTree,
                        currentTree;
                    TestUtils.openFile(current, done(function (err, data) {
                        previousQuery = data;
                        //buster.log("QUERY TO RUN", data);
                        currentQuery = Query(data).run();
                        buster.log("QUERIES", previousQuery, "\n", currentQuery);
                        previousTree = SparqlParser.parser.parse(previousQuery);
                        //delete previousTree.kind;
                        //delete previousTree.prologue;
                        //delete previousTree.token;
                        //delete previousTree.units;
                        buster.log("ORIG TREE", previousTree);
                        currentTree = SparqlParser.parser.parse(currentQuery);
                        assert.equals(previousTree, currentTree);
                    }));
                },
                "grouping": function (done) {
                    checkGroup("grouping", [
                        "group01",
                        "group02",
                        //"group03" NOT PARSED,
                        //"group04" NOT PARSED,
                        "group05",
                        "group06",
                        "group07"
                    ]).then(done(function () {
                        sparqlEquals.apply(this, arguments);
                    }));
                },
                "//In progress (grouping)": function (done) {
                    var current = "http://localhost:8088/sparql/grouping/group07.rq",
                        previousQuery,
                        currentQuery,
                        previousTree,
                        currentTree;
                    TestUtils.openFile(current, done(function (err, data) {
                        previousQuery = data;
                        //buster.log("QUERY TO RUN", data);
                        currentQuery = Query(data).run();
                        buster.log("QUERIES", previousQuery, "\n", currentQuery);
                        previousTree = SparqlParser.parser.parse(previousQuery);
                        //delete previousTree.kind;
                        //delete previousTree.prologue;
                        //delete previousTree.token;
                        //delete previousTree.units;
                        buster.log("ORIG TREE", previousTree);
                        currentTree = SparqlParser.parser.parse(currentQuery);
                        assert.equals(previousTree, currentTree);
                    }));
                },
                "json-res": function (done) {
                    checkGroup("json-res", [
                        "jsonres01",
                        "jsonres02",
                        "jsonres03",
                        "jsonres04"
                    ]).then(done(function () {
                        sparqlEquals.apply(this, arguments);
                    }));
                },
                "//In progress (json-res)": function (done) {
                    var current = "http://localhost:8088/sparql/json-res/jsonres04.rq",
                        previousQuery,
                        currentQuery,
                        previousTree,
                        currentTree;
                    TestUtils.openFile(current, done(function (err, data) {
                        previousQuery = data;
                        //buster.log("QUERY TO RUN", data);
                        currentQuery = Query(data).run();
                        buster.log("QUERIES", previousQuery, "\n", currentQuery);
                        previousTree = SparqlParser.parser.parse(previousQuery);
                        //delete previousTree.kind;
                        //delete previousTree.prologue;
                        //delete previousTree.token;
                        //delete previousTree.units;
                        buster.log("ORIG TREE", previousTree);
                        currentTree = SparqlParser.parser.parse(currentQuery);
                        assert.equals(previousTree, currentTree);
                    }));
                },
                "//move": function (done) {
                    checkGroup("move", [
                        //"move-01" NOT PARSED,
                        //"move-03" NOT PARSED,
                        //"move-06" NOT PARSED,
                        //"move-07" NOT PARSED
                    ], "ru").then(done(function () {
                        sparqlEquals.apply(this, arguments);
                    }));
                },
                "//In progress (move)": function (done) {
                    var current = "http://localhost:8088/sparql/move/move-07.ru",
                        previousQuery,
                        currentQuery,
                        previousTree,
                        currentTree;
                    TestUtils.openFile(current, done(function (err, data) {
                        previousQuery = data;
                        //buster.log("QUERY TO RUN", data);
                        currentQuery = Query(data).run();
                        buster.log("QUERIES", previousQuery, "\n", currentQuery);
                        previousTree = SparqlParser.parser.parse(previousQuery);
                        //delete previousTree.kind;
                        //delete previousTree.prologue;
                        //delete previousTree.token;
                        //delete previousTree.units;
                        buster.log("ORIG TREE", previousTree);
                        currentTree = SparqlParser.parser.parse(currentQuery);
                        assert.equals(previousTree, currentTree);
                    }));
                },
                "negation": function (done) {
                    checkGroup("negation", [
                        "exists-01",
                        "exists-02",
                        //"set-equals-1" NOT PARSED,
                        //"subset-01" NOT PARSED,
                        //"subset-02" NOT PARSED,
                        //"subset-03" NOT PARSED,
                        "subsetByExcl01",
                        //"subsetByExcl02" NOT PARSED,
                        "temporalProximity01"
                    ]).then(done(function () {
                        sparqlEquals.apply(this, arguments);
                    }));
                },
                "//In progress (negation)": function (done) {
                    var current = "http://localhost:8088/sparql/negation/temporalProximity01.rq",
                        previousQuery,
                        currentQuery,
                        previousTree,
                        currentTree;
                    TestUtils.openFile(current, done(function (err, data) {
                        previousQuery = data;
                        //buster.log("QUERY TO RUN", data);
                        currentQuery = Query(data).run();
                        buster.log("QUERIES", previousQuery, "\n", currentQuery);
                        previousTree = SparqlParser.parser.parse(previousQuery);
                        //delete previousTree.kind;
                        //delete previousTree.prologue;
                        //delete previousTree.token;
                        //delete previousTree.units;
                        buster.log("ORIG TREE", previousTree);
                        currentTree = SparqlParser.parser.parse(currentQuery);
                        assert.equals(previousTree, currentTree);
                    }));
                },
                "project-expression": function (done) {
                    checkGroup("project-expression", [
                        "projexp01",
                        "projexp02",
                        "projexp03",
                        "projexp04",
                        "projexp05",
                        "projexp06",
                        "projexp07"
                    ]).then(done(function () {
                        sparqlEquals.apply(this, arguments);
                    }));
                },
                "//In progress (project-expression)": function (done) {
                    var current = "http://localhost:8088/sparql/project-expression/projexp07.rq",
                        previousQuery,
                        currentQuery,
                        previousTree,
                        currentTree;
                    TestUtils.openFile(current, done(function (err, data) {
                        previousQuery = data;
                        //buster.log("QUERY TO RUN", data);
                        currentQuery = Query(data).run();
                        buster.log("QUERIES", previousQuery, "\n", currentQuery);
                        previousTree = SparqlParser.parser.parse(previousQuery);
                        //delete previousTree.kind;
                        //delete previousTree.prologue;
                        //delete previousTree.token;
                        //delete previousTree.units;
                        buster.log("ORIG TREE", previousTree);
                        currentTree = SparqlParser.parser.parse(currentQuery);
                        assert.equals(previousTree, currentTree);
                    }));
                },
                "property-path": function (done) {
                    checkGroup("property-path", [
                        "path-2-1",
                        "path-2-2",
                        "path-2-3",
                        "path-3-1",
                        "path-3-2",
                        "path-3-3",
                        "path-3-4",
                        "path-ng-01",
                        //"path-ng-02" PROBABLY NOT PARSING CORRECTLY,
                        //"path-p1" PROBABLY NOT PARSING CORRECTLY,
                        //"path-p2" PROBABLY NOT PARSING CORRECTLY,
                        //"path-p3" PROBABLY NOT PARSING CORRECTLY,
                        //"path-p4" PROBABLY NOT PARSING CORRECTLY,
                        "pp01",
                        "pp02",
                        "pp03",
                        "pp04",
                        "pp05",
                        "pp06",
                        "pp08",
                        "pp09",
                        //"pp10" PROBABLY NOT PARSING CORRECTLY,
                        "pp11",
                        "pp12",
                        "pp13",
                        "pp14",
                        "pp15",
                        "pp36",
                        "pp37"
                    ]).then(done(function () {
                        sparqlEquals.apply(this, arguments);
                    }));
                },
                "//In progress (property-path)": function (done) {
                    var current = "http://localhost:8088/sparql/property-path/pp37.rq",
                        previousQuery,
                        currentQuery,
                        previousTree,
                        currentTree;
                    TestUtils.openFile(current, done(function (err, data) {
                        previousQuery = data;
                        //buster.log("QUERY TO RUN", data);
                        currentQuery = Query(data).run();
                        buster.log("QUERIES", previousQuery, "\n", currentQuery);
                        previousTree = SparqlParser.parser.parse(previousQuery);
                        //delete previousTree.kind;
                        //delete previousTree.prologue;
                        //delete previousTree.token;
                        //delete previousTree.units;
                        buster.log("ORIG TREE", previousTree);
                        currentTree = SparqlParser.parser.parse(currentQuery);
                        assert.equals(previousTree, currentTree);
                    }));
                },
                "//service": function (done) {
                    checkGroup("service", [
                        //"service01" NOT PARSING,
                        //"service02" NOT PARSING,
                        //"service03" NOT PARSING,
                        //"service04" NOT PARSING,
                        //"service05" NOT PARSING,
                        //"service06" NOT PARSING,
                        //"service07" NOT PARSING
                    ]).then(done(function () {
                        sparqlEquals.apply(this, arguments);
                    }));
                },
                "//In progress (service)": function (done) {
                    var current = "http://localhost:8088/sparql/service/service07.rq",
                        previousQuery,
                        currentQuery,
                        previousTree,
                        currentTree;
                    TestUtils.openFile(current, done(function (err, data) {
                        previousQuery = data;
                        //buster.log("QUERY TO RUN", data);
                        currentQuery = Query(data).run();
                        buster.log("QUERIES", previousQuery, "\n", currentQuery);
                        previousTree = SparqlParser.parser.parse(previousQuery);
                        //delete previousTree.kind;
                        //delete previousTree.prologue;
                        //delete previousTree.token;
                        //delete previousTree.units;
                        buster.log("ORIG TREE", previousTree);
                        currentTree = SparqlParser.parser.parse(currentQuery);
                        assert.equals(previousTree, currentTree);
                    }));
                },
                "//subquery": function (done) {
                    checkGroup("subquery", [
                        //"sq01" PROBABLY NOT PARSING CORRECTLY,
                        //"sq02" PROBABLY NOT PARSING CORRECTLY,
                        //"sq03" PROBABLY NOT PARSING CORRECTLY,
                        //"sq04" PROBABLY NOT PARSING CORRECTLY,
                        //"sq05" PROBABLY NOT PARSING CORRECTLY,
                        //"sq06" PROBABLY NOT PARSING CORRECTLY,
                        //"sq07" PROBABLY NOT PARSING CORRECTLY,
                        //"sq08" PROBABLY NOT PARSING CORRECTLY,
                        //"sq09" PROBABLY NOT PARSING CORRECTLY,
                        //"sq10" PROBABLY NOT PARSING CORRECTLY,
                        //"sq11" PROBABLY NOT PARSING CORRECTLY,
                        //"sq12" PROBABLY NOT PARSING CORRECTLY,
                        //"sq13" PROBABLY NOT PARSING CORRECTLY,
                        //"sq14" PROBABLY NOT PARSING CORRECTLY,
                    ]).then(done(function () {
                        sparqlEquals.apply(this, arguments);
                    }));
                },
                "//In progress (subquery)": function (done) {
                    var current = "http://localhost:8088/sparql/subquery/sq01.rq",
                        previousQuery,
                        currentQuery,
                        previousTree,
                        currentTree;
                    TestUtils.openFile(current, done(function (err, data) {
                        previousQuery = data;
                        //buster.log("QUERY TO RUN", data);
                        currentQuery = Query(data).run();
                        buster.log("QUERIES", previousQuery, "\n", currentQuery);
                        previousTree = SparqlParser.parser.parse(previousQuery);
                        //delete previousTree.kind;
                        //delete previousTree.prologue;
                        //delete previousTree.token;
                        //delete previousTree.units;
                        buster.log("ORIG TREE", previousTree);
                        currentTree = SparqlParser.parser.parse(currentQuery);
                        assert.equals(previousTree, currentTree);
                    }));
                },
                "//syntax-fed": function (done) {
                    checkGroup("syntax-fed", [
                        //"syntax-service-01" NOT PARSING,
                        //"syntax-service-02" NOT PARSING,
                        //"syntax-service-03" NOT PARSING
                    ]).then(done(function () {
                        sparqlEquals.apply(this, arguments);
                    }));
                },
                "//In progress (syntax-fed)": function (done) {
                    var current = "http://localhost:8088/sparql/syntax-fed/syntax-service-01.rq",
                        previousQuery,
                        currentQuery,
                        previousTree,
                        currentTree;
                    TestUtils.openFile(current, done(function (err, data) {
                        previousQuery = data;
                        //buster.log("QUERY TO RUN", data);
                        currentQuery = Query(data).run();
                        buster.log("QUERIES", previousQuery, "\n", currentQuery);
                        previousTree = SparqlParser.parser.parse(previousQuery);
                        //delete previousTree.kind;
                        //delete previousTree.prologue;
                        //delete previousTree.token;
                        //delete previousTree.units;
                        buster.log("ORIG TREE", previousTree);
                        currentTree = SparqlParser.parser.parse(currentQuery);
                        assert.equals(previousTree, currentTree);
                    }));
                },
                "syntax-query": function (done) {
                    checkGroup("syntax-query", [
                        //"qname-escape-01" NOT PARSING
                        //"qname-escape-02" NOT PARSING
                        //"qname-escape-03" NOT PARSING,
                        "syn-bad-01",
                        "syn-bad-02",
                        "syn-bad-03",
                        //"syn-bad-04" NOT PARSING,
                        //"syn-bad-05" NOT PARSING,
                        //"syn-bad-06" NOT PARSING,
                        //"syn-bad-07" NOT PARSING,
                        //"syn-bad-08" NOT PARSING,
                        "syntax-aggregate-01",
                        //"syntax-aggregate-02" TREE TO ARBITRARY,
                        "syntax-aggregate-03",
                        "syntax-aggregate-04",
                        "syntax-aggregate-05",
                        "syntax-aggregate-06",
                        "syntax-aggregate-07",
                        "syntax-aggregate-08",
                        "syntax-aggregate-09",
                        "syntax-aggregate-10",
                        "syntax-aggregate-11",
                        "syntax-aggregate-12",
                        //"syntax-aggregate-13", NOT PARSING
                        //"syntax-aggregate-14", NOT PARSING
                        //"syntax-aggregate-15", NOT PARSING
                        //"syntax-bind-02" NOT PARSING,
                        //"syntax-query/syntax-bindings-01" NOT PARSING,
                        //"syntax-query/syntax-bindings-02" NOT PARSING,
                        //"syntax-query/syntax-bindings-03" NOT PARSING,
                        //"syntax-query/syntax-bindings-04" NOT PARSING,
                        //"syntax-query/syntax-bindings-05" NOT PARSING,
                        //"syntax-query/syntax-bindings-09" NOT PARSING,
                        //"syntax-construct-where-01" NOT PARSING,
                        //"syntax-construct-where-02" NOT PARSING,
                        "syntax-exists-01",
                        "syntax-exists-02",
                        "syntax-exists-03",
                        //"syntax-minus-01" NOT PARSING,
                        "syntax-not-exists-01",
                        "syntax-not-exists-02",
                        "syntax-not-exists-03",
                        //"syntax-oneof-01" NOT PARSING,
                        //"syntax-oneof-02" NOT PARSING,
                        //"syntax-oneof-03" NOT PARSING,
                        "syntax-select-expr-01",
                        "syntax-select-expr-02",
                        "syntax-select-expr-03",
                        //"syntax-select-expr-04" TREE TO ARBITRARY,
                        "syntax-select-expr-05"
                        //"syntax-subquery-01" PROBABLY NOT PARSING CORRECTLY,
                        //"syntax-subquery-02" PROBABLY NOT PARSING CORRECTLY,
                        //"syntax-subquery-03" PROBABLY NOT PARSING CORRECTLY
                    ]).then(done(function () {
                        sparqlEquals.apply(this, arguments);
                    }));
                },
                "//In progress (syntax-query)": function (done) {
                    var current = "http://localhost:8088/sparql/syntax-query/syntax-subquery-03.rq",
                        previousQuery,
                        currentQuery,
                        previousTree,
                        currentTree;
                    TestUtils.openFile(current, done(function (err, data) {
                        previousQuery = data;
                        //buster.log("QUERY TO RUN", data);
                        currentQuery = Query(data).run();
                        buster.log("QUERIES", previousQuery, "\n", currentQuery);
                        previousTree = SparqlParser.parser.parse(previousQuery);
                        //delete previousTree.kind;
                        //delete previousTree.prologue;
                        //delete previousTree.token;
                        //delete previousTree.units;
                        buster.log("ORIG TREE", previousTree);
                        currentTree = SparqlParser.parser.parse(currentQuery);
                        assert.equals(previousTree, currentTree);
                    }));
                },
                "syntax-update-1": function (done) {
                    checkGroup("syntax-update-1", [
                        "syntax-update-01",
                        "syntax-update-02",
                        "syntax-update-03",
                        //"syntax-update-04", NOT PARSING
                        //"syntax-update-05", NOT PARSING
                        //"syntax-update-06", NOT PARSING
                        //"syntax-update-07", NOT PARSING
                        //"syntax-update-08", NOT PARSING
                        //"syntax-update-09", NOT PARSING,
                        //"syntax-update-10" NOT PARSING,
                        //"syntax-update-11" NOT PARSING,
                        //"syntax-update-12" NOT PARSING,
                        //"syntax-update-13" NOT PARSING,
                        //"syntax-update-14" NOT PARSING,
                        //"syntax-update-15" NOT PARSING,
                        //"syntax-update-16" NOT PARSING,
                        //"syntax-update-17" NOT PARSING,
                        //"syntax-update-18" NOT PARSING,
                        //"syntax-update-19" NOT PARSING,
                        //"syntax-update-20" NOT PARSING,
                        //"syntax-update-21" NOT PARSING,
                        //"syntax-update-22" NOT PARSING,
                        "syntax-update-23",
                        "syntax-update-24",
                        //"syntax-update-25" PROBABLY NOT PARSING CORRECTLY,
                        "syntax-update-26",
                        "syntax-update-27",
                        //"syntax-update-28" NOT PARSING,
                        "syntax-update-29",
                        "syntax-update-30",
                        //"syntax-update-31" PROBABLY NOT PARSING CORRECTLY,
                        "syntax-update-32",
                        "syntax-update-33",
                        "syntax-update-34",
                        //"syntax-update-35" NOT PARSING,
                        //"syntax-update-36" NOT PARSING,
                        "syntax-update-37",
                        //"syntax-update-38" NOT PARSING,
                        //"syntax-update-39" NOT PARSING,
                        //"syntax-update-40" NOT PARSING,
                        //"syntax-update-bad-01" NOT PARSING,
                        //"syntax-update-bad-02" NOT PARSING,
                        "syntax-update-bad-03",
                        "syntax-update-bad-04",
                        //"syntax-update-bad-05" NOT PARSING,
                        //"syntax-update-bad-06" NOT PARSING,
                        //"syntax-update-bad-07" NOT PARSING,
                        //"syntax-update-bad-08" NOT PARSING,
                        //"syntax-update-bad-09" NOT PARSING,
                        //"syntax-update-bad-10" NOT PARSING,
                        "syntax-update-bad-11",
                        "syntax-update-bad-12"
                    ], "ru").then(done(function () {
                        sparqlEquals.apply(this, arguments);
                    }));
                },
                "In progress (syntax-update-1)": function (done) {
                    var current = "http://localhost:8088/sparql/syntax-update-1/syntax-update-bad-12.ru",
                        previousQuery,
                        currentQuery,
                        previousTree,
                        currentTree;
                    TestUtils.openFile(current, done(function (err, data) {
                        previousQuery = data;
                        //buster.log("QUERY TO RUN", data);
                        currentQuery = Query(data).run();
                        buster.log("QUERIES", previousQuery, "\n", currentQuery);
                        previousTree = SparqlParser.parser.parse(previousQuery);
                        //delete previousTree.kind;
                        //delete previousTree.prologue;
                        //delete previousTree.token;
                        //delete previousTree.units;
                        buster.log("ORIG TREE", previousTree);
                        currentTree = SparqlParser.parser.parse(currentQuery);
                        assert.equals(previousTree, currentTree);
                    }));
                },
                "syntax-update-2": function (done) {
                    checkGroup("syntax-update-2", [
                        "large-request-01"
                    ], "ru").then(done(function () {
                        sparqlEquals.apply(this, arguments);
                    }));
                },
                "//In progress (syntax-update-2)": function (done) {
                    var current = "http://localhost:8088/sparql/syntax-update-2/large-request-01.ru",
                        previousQuery,
                        currentQuery,
                        previousTree,
                        currentTree;
                    TestUtils.openFile(current, done(function (err, data) {
                        previousQuery = data;
                        //buster.log("QUERY TO RUN", data);
                        currentQuery = Query(data).run();
                        buster.log("QUERIES", previousQuery, "\n", currentQuery);
                        previousTree = SparqlParser.parser.parse(previousQuery);
                        //delete previousTree.kind;
                        //delete previousTree.prologue;
                        //delete previousTree.token;
                        //delete previousTree.units;
                        buster.log("ORIG TREE", previousTree);
                        currentTree = SparqlParser.parser.parse(currentQuery);
                        assert.equals(previousTree, currentTree);
                    }));
                },
                "//update-silent": function (done) {
                    checkGroup("update-silent", [
                        //"add-silent" NOT PARSING,
                        //"add-to-default-silent" NOT PARSING,
                        //"clear-default-silent" NOT PARSING,
                        //"clear-silent" NOT PARSING,
                        //"copy-silent" NOT PARSING,
                        //"copy-to-default-silent" NOT PARSING,
                        //"create-silent" NOT PARSING,
                        //"drop-default-silent" NOT PARSING,
                        //"drop-silent" NOT PARSING,
                        //"load-silent-into" NOT PARSING,
                        //"load-silent" NOT PARSING,
                        //"move-silent" NOT PARSING,
                        //"move-to-default-silent" NOT PARSING
                    ], "ru").then(done(function () {
                        sparqlEquals.apply(this, arguments);
                    }));
                },
                "//In progress (update-silent)": function (done) {
                    var current = "http://localhost:8088/sparql/update-silent/move-to-default-silent.ru",
                        previousQuery,
                        currentQuery,
                        previousTree,
                        currentTree;
                    TestUtils.openFile(current, done(function (err, data) {
                        previousQuery = data;
                        //buster.log("QUERY TO RUN", data);
                        currentQuery = Query(data).run();
                        buster.log("QUERIES", previousQuery, "\n", currentQuery);
                        previousTree = SparqlParser.parser.parse(previousQuery);
                        //delete previousTree.kind;
                        //delete previousTree.prologue;
                        //delete previousTree.token;
                        //delete previousTree.units;
                        buster.log("ORIG TREE", previousTree);
                        currentTree = SparqlParser.parser.parse(currentQuery);
                        assert.equals(previousTree, currentTree);
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