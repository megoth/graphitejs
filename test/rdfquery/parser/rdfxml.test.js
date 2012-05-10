define([
    "src/rdfquery/parser/rdfxml",
    "src/graphite/utils",
    "src/graphite/when",
    "../../utils"
], function (Parser, Utils, When, TestUtils) {
    function badAssertion (results) {
        buster.log("RESULTS", results);
        Utils.each(results, function (r) {
            assert(r);
        });
    }
    function badGroup(group, tests, callback) {
        var promises = [];
        Utils.each(tests, function (filePath) {
            promises.push(badTest(group + '/' + filePath));
        });
        When.all(promises).then(callback);
    }
    function badTest(filePath) {
        var deferred = When.defer();
        TestUtils.openFile("http://localhost:8088/rdfxml/" + filePath + ".rdf", function (err, data) {
            try {
                Parser(data, {}, function () {});
                deferred.resolve(false);
            } catch (e) {
                deferred.resolve(true);
            }
        });
        return deferred;
    }
    function goodAssertion (results) {
        Utils.each(results, function (r) {
            assert.equals(r.counted, r.expected);
        });
    }
    function goodGroup(group, tests, callback) {
        var promises = [];
        Utils.each(tests, function (numTriples, filePath) {
            promises.push(goodTest(group + '/' + filePath, numTriples));
        });
        When.all(promises).then(function (results) {
            callback(results);
        });
    }
    function goodTest(filePath, numTriples) {
        var deferred = When.defer();
        TestUtils.openFile("http://localhost:8088/rdfxml/" + filePath + ".rdf", function (err, data) {
            Parser(data, {}, function (graph) {
                deferred.resolve({
                    counted: graph.statements.length,
                    expected: numTriples
                });
            });
        });
        return deferred;

    }
    buster.testCase("Graphite Parser (RDF/XML)", {
        "Proper setup": function () {
            assert.defined(Parser);
            assert.isFunction(Parser);
        },
        "Bad tests (56 of 56 are faulty)": {
            "//rdf-charmod-literals": function (done) {
                badGroup("rdf-charmod-literals",
                    [
                        //"rdf-charmod-literals/error001",
                        //"rdf-charmod-literals/error002",
                    ],
                    done(badAssertion));
            },
            "//rdf-containers-syntax-vs-schema": function (done) {
                badGroup("rdf-containers-syntax-vs-schema",
                    [
                        //"error001",
                        //"error002",
                    ],
                    done(badAssertion));
            },
            "//rdf-ns-prefix-confusion": function (done) {
                badGroup("rdf-ns-prefix-confusion",
                    [
                        //"error0001",
                        //"error0002",
                        //"error0003",
                        //"error0004",
                        //"error0005",
                        //"error0006",
                        //"error0007",
                        //"error0008",
                        //"error0009",
                    ],
                    done(badAssertion));
            },
            "//rdfms-abouteach": function (done) {
                badGroup("rdfms-abouteach",
                    [
                        //"rdfms-abouteach/error001",
                        //"rdfms-abouteach/error002",
                    ],
                    done(badAssertion));
            },
            "//rdfms-difference-between-ID-and-about": function (done) {
                badGroup("rdfms-abouteach",
                    [
                        //"error1",
                    ],
                    done(badAssertion));
            },
            "//rdfms-empty-property-elements": function (done) {
                badGroup("rdfms-abouteach",
                    [
                        //"error001",
                        //"error002",
                        //"error003,
                    ],
                    done(badAssertion));
            },
            "//rdfms-parseType": function (done) {
                badGroup("rdfms-parseType",
                    [
                        //"rdfms-parseType/error001",
                        //"rdfms-parseType/error002",
                        //"rdfms-parseType/error003",
                    ],
                    done(badAssertion));
            },
            "//rdfms-rdf-id": function (done) {
                badGroup("rdfms-rdf-id",
                    [
                        //"rdfms-rdf-id/error001",
                        //"rdfms-rdf-id/error002",
                        //"rdfms-rdf-id/error003",
                        //"rdfms-rdf-id/error004",
                        //"rdfms-rdf-id/error005",
                        //"rdfms-rdf-id/error006",
                        //"rdfms-rdf-id/error007",
                    ],
                    done(badAssertion));
            },
            "//rdfms-rdf-names-use": function (done) {
                badGroup("rdfms-rdf-names-use",
                    [
                        //"error-001",
                        //"error-002",
                        //"error-003",
                        //"error-004",
                        //"error-005",
                        //"error-006",
                        //"error-007",
                        //"error-008",
                        //"error-009",
                        //"error-010",
                        //"error-011",
                        //"error-012",
                        //"error-013",
                        //"error-014",
                        //"error-015",
                        //"error-016",
                        //"error-017",
                        //"error-018",
                        //"error-019",
                        //"error-020",
                    ],
                    done(badAssertion));
            },
            "//rdfms-syntax-incomplete": function (done) {
                badGroup("rdfms-syntax-incomplete",
                    [
                        //"error001",
                        //"error002",
                        //"error003",
                        //"error004",
                        //"error005",
                        //"error006",
                    ],
                    done(badAssertion));
            },
            "//xmlbase": function (done) {
                badGroup("xmlbase",
                    [
                        //"error001",
                        //"te1st012"
                    ],
                    done(badAssertion));
            }
        },
        "Good tests (36 of 169 are faulty)": {
            "amp-in-url": function (done) {
                goodGroup("amp-in-url",
                    {
                        "test001": 1
                    },
                    done(goodAssertion));
            },
            "datatypes": function (done) {
                goodGroup("datatypes",
                    {
                        "test001": 2,
                        "test002": 1
                    },
                    done(goodAssertion));
            },
            "horst-01": function (done) {
                goodGroup("horst-01",
                    {
                        "test001": 2,
                        "test002": 1,
                        "test003": 4,
                        "test004": 2
                    },
                    done(goodAssertion));
            },
            "rdf-charmod-literals": function (done) {
                goodGroup("rdf-charmod-literals",
                    {
                        "test001": 2
                    },
                    done(goodAssertion));
            },
            "rdf-charmod-uris": function (done) {
                goodGroup("rdf-charmod-uris",
                    {
                        "test001": 1,
                        "test002": 1
                    },
                    done(goodAssertion));
            },
            "rdf-containers-syntax-vs-schema": function (done) {
                goodGroup("rdf-containers-syntax-vs-schema",
                    {
                        "test001": 3,
                        "test002": 5,
                        "test003": 3,
                        //"test004": 15,
                        //"test006": 8,
                        "test007": 4,
                        "test008": 2
                    },
                    done(goodAssertion));
            },
            "//test001": function (done) {
                goodGroup("test001",
                    {
                        //"test001": 2 //NOT AGGREABLE WITH http://www.w3.org/RDF/Validator/
                    },
                    done(goodAssertion));
            },
            "rdf-ns-prefix-confusion": function (done) {
                goodGroup("rdf-ns-prefix-confusion",
                    {
                        "test0001": 1,
                        "test0002": 1,
                        "test0003": 1,
                        "test0004": 1,
                        "test0005": 2,
                        "test0006": 1,
                        "test0007": 3, //NOT AGGREABLE WITH http://www.w3.org/RDF/Validator/
                        "test0008": 2, //NOT AGGREABLE WITH http://www.w3.org/RDF/Validator/
                        "test0009": 1,
                        "test0010": 1,
                        "test0011": 2,
                        "test0012": 2,
                        "test0013": 2,
                        "test0014": 2
                    },
                    done(goodAssertion));
            },
            "rdfms-difference-between-ID-and-about": function (done) {
                goodGroup("rdfms-difference-between-ID-and-about",
                    {
                        "test1": 1,
                        "test2": 1,
                        "test3": 1
                    },
                    done(goodAssertion));
            },
            "rdfms-duplicate-member-props": function (done) {
                goodGroup("rdfms-duplicate-member-props",
                    {
                        "test001": 3
                    },
                    done(goodAssertion));
            },
            "rdfms-empty-property-elements": function (done) {
                goodGroup("rdfms-empty-property-elements",
                    {
                        "test001": 1,
                        "test002": 1,
                        "test003": 1,
                        "test004": 1,
                        //"test005": 5,
                        //"test006": 5,
                        "test007": 1,
                        "test008": 1,
                        "test009": 1,
                        "test010": 1,
                        //"test011": 5,
                        //"test012": 5,
                        //"test013": 2,
                        "test014": 2,
                        "test015": 2,
                        "test016": 1,
                        "test017": 1
                    },
                    done(goodAssertion));
            },
            "rdfms-identity-anon-resources": function (done) {
                goodGroup("rdfms-identity-anon-resources",
                    {
                        "test001": 1,
                        "test002": 2,
                        "test003": 1,
                        "test004": 2,
                        "test005": 1
                    },
                    done(goodAssertion));
            },
            "rdfms-literal-is-xml-structure": function (done) {
                goodGroup("rdfms-literal-is-xml-structure",
                    {
                        "test001": 1,
                        "test002": 1,
                        "test003": 1,
                        "test004": 1
                        //"test005": 1,
                    },
                    done(goodAssertion));
            },
            "//rdfms-nested-bagIDs": function (done) {
                goodGroup("rdfms-nested-bagIDs",
                    {
                        //"test001": 15, //NOT AGGREABLE WITH http://www.w3.org/RDF/Validator/
                        //"test002": 14, //NOT AGGREABLE WITH http://www.w3.org/RDF/Validator/
                        //"test003": 14, //NOT AGGREABLE WITH http://www.w3.org/RDF/Validator/
                        //"test004": 8, //NOT AGGREABLE WITH http://www.w3.org/RDF/Validator/
                        //"test005": 19, //NOT AGGREABLE WITH http://www.w3.org/RDF/Validator/
                        //"test006": 25, //NOT AGGREABLE WITH http://www.w3.org/RDF/Validator/
                        //"test008": 12, //NOT AGGREABLE WITH http://www.w3.org/RDF/Validator/
                        //"test009": 8, //NOT AGGREABLE WITH http://www.w3.org/RDF/Validator/
                        //"test010": 19, //NOT AGGREABLE WITH http://www.w3.org/RDF/Validator/
                        //"test011": 25, //NOT AGGREABLE WITH http://www.w3.org/RDF/Validator/
                        //"test012": 14 //NOT AGGREABLE WITH http://www.w3.org/RDF/Validator/
                    },
                    done(goodAssertion));
            },
            "//rdfms-not-id-and-resource-attr": function (done) {
                goodGroup("rdfms-not-id-and-resource-attr",
                    {
                        //"test001": 6,
                        //"test002": 2,
                        //"test003": 6, //NOT AGGREABLE WITH http://www.w3.org/RDF/Validator/
                        //"test004": 5,
                        //"test005": 6,
                    },
                    done(goodAssertion));
            },
            "//rdfms-para196": function (done) {
                goodGroup("rdfms-para196",
                    {
                        //"test001": 1,
                    },
                    done(goodAssertion));
            },
            "rdfms-rdf-names-use": function (done) {
                goodGroup("rdfms-rdf-names-use",
                    {
                        "test-001": 0,
                        "test-002": 1,
                        "test-003": 1,
                        "test-004": 1,
                        "test-005": 1,
                        "test-006": 1,
                        "test-007": 1,
                        "test-008": 1,
                        "test-009": 1,
                        "test-010": 1,
                        "test-011": 1,
                        "test-012": 1,
                        "test-013": 1,
                        "test-014": 1,
                        "test-015": 1,
                        "test-016": 1,
                        "test-017": 1,
                        "test-018": 1,
                        "test-019": 1,
                        "test-020": 1,
                        "test-021": 1,
                        "test-022": 1,
                        "test-023": 1,
                        "test-024": 1,
                        "test-025": 1,
                        "test-026": 1,
                        "test-027": 1,
                        "test-028": 1,
                        "test-029": 1,
                        "test-030": 1,
                        "test-031": 1,
                        //"test-032": 1,
                        //"test-033": 1,
                        //"test-034": 1,
                        //"test-035": 1,
                        //"test-036": 1,
                        //"test-037": 1,
                        "warn-001": 1,
                        "warn-002": 1
                        //"warn-003": 1,
                    },
                    done(goodAssertion));
            },
            "rdfms-reification-required": function (done) {
                goodGroup("rdfms-reification-required",
                    {
                        "test001": 1
                    },
                    done(goodAssertion));
            },
            "rdfms-seq-representation": function (done) {
                goodGroup("rdfms-seq-representation",
                    {
                        "test001": 6
                    },
                    done(goodAssertion));
            },
            "rdfms-syntax-incomplete": function (done) {
                goodGroup("rdfms-syntax-incomplete",
                    {
                        "test001": 1,
                        "test002": 3,
                        "test003": 1
                        //"test004": 6,
                    },
                    done(goodAssertion));
            },
            "rdfms-uri-substructure": function (done) {
                goodGroup("rdfms-uri-substructure",
                    {
                        "test001": 1
                    },
                    done(goodAssertion));
            },
            "rdfms-xml-literal-namespaces": function (done) {
                goodGroup("rdfms-xml-literal-namespaces",
                    {
                        "test001": 1,
                        "test002": 2
                    },
                    done(goodAssertion));
            },
            "rdfms-xmllang": function (done) {
                goodGroup("rdfms-xmllang",
                    {
                        "test001": 1,
                        "test002": 1,
                        "test003": 1,
                        "test004": 1,
                        "test005": 1,
                        "test006": 1
                    },
                    done(goodAssertion));
            },
            "rdfs-container-membership-superProperty": function (done) {
                goodGroup("rdfs-container-membership-superProperty",
                    {
                        "not1C": 1,
                        "not1P": 1
                    },
                    done(goodAssertion));
            },
            "rdfs-domain-and-range": function (done) {
                goodGroup("rdfs-domain-and-range",
                    {
                        "nonconclusions005": 3,
                        "nonconclusions006": 3,
                        "test001": 3,
                        "test002": 3,
                        "test003": 1,
                        "test004": 8,
                        "premises005": 5,
                        "premises006": 5
                    },
                    done(goodAssertion));
            },
            "rdfs-no-cycles-in-subClassOf": function (done) {
                goodGroup("rdfs-no-cycles-in-subClassOf",
                    {
                        "test001": 3
                    },
                    done(goodAssertion));
            },
            "rdfs-no-cycles-in-subPropertyOf": function (done) {
                goodGroup("rdfs-no-cycles-in-subPropertyOf",
                    {
                        "test001": 3
                    },
                    done(goodAssertion));
            },
            "tex-01": function (done) {
                goodGroup("tex-01",
                    {
                        "test001": 1,
                        "test002": 1
                    },
                    done(goodAssertion));
            },
            "unrecognised-xml-attributes": function (done) {
                goodGroup("unrecognised-xml-attributes",
                    {
                        "test001": 2,
                        "test002": 1
                    },
                    done(goodAssertion));
            },
            "xml-canon": function (done) {
                goodGroup("xml-canon",
                    {
                        "test001": 1
                    },
                    done(goodAssertion));
            },
            "xmlbase": function (done) {
                goodGroup("xmlbase",
                    {
                        "test001": 1,
                        "test002": 1,
                        "test003": 1,
                        //"test004": 5,
                        //"test005": 1,
                        "test006": 2,
                        "test007": 1,
                        "test008": 1,
                        "test009": 1,
                        "test010": 1,
                        "test011": 1,
                        "test013": 2,
                        "test014": 2,
                        "test015": 1,
                        "test016": 1
                    },
                    done(goodAssertion));
            },
            "xmlsch-02": function (done) {
                goodGroup("xmlsch-02",
                    {
                        "test001": 1,
                        "test002": 1,
                        "test003": 2
                    },
                    done(goodAssertion));
            }
        }
    });
});