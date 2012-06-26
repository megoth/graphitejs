define([
    "src/graphite/query",
    "src/rdfstore/sparql-parser/sparql_parser"
], function (Query, SparqlParser) {
    var preName = "http://xmlns.com/foaf/0.1/name",
        objJohnName = "John Lennon";
    var parser = SparqlParser.parser["parse"];
    buster.testCase("Graphite query", {
        setUp: function () {
            this.query = Query();
        },
        ".init": {
            "Proper setup": function () {
                assert.defined(Query);
                assert.isFunction(Query);
            },
            "Can initiate with a URI": function () {
                this.query = Query("http://localhost:8088/sparql/api.test.rq");
                assert.equals(
                    this.query.retrieveTree(),
                    parser("PREFIX foaf: <http://xmlns.com/foaf/0.1/>\n" +
                        "SELECT * WHERE { ?s foaf:name ?o }")
                );
            }
        },
        ".base": {
            "Single instance": function () {
                this.query.base("http://example.org/");
                assert.equals(
                    this.query.retrieveTree(),
                    parser("BASE <http://example.org/>\n" +
                        "SELECT * WHERE { ?subject ?predicate ?object }")
                );
            },
            "Multiple instances": function () {
                this.query
                    .base("http://example.org/")
                    .base("http://example2.org/");
                assert.equals(
                    this.query.retrieveTree(),
                    parser("BASE <http://example2.org/>\n" +
                        "SELECT * WHERE { ?subject ?predicate ?object }")
                );
            }
        },
        ".filter": {
            "Single call": function () {
                this.query
                    .where("?subject ?predicate ?object")
                    .filter('?object = "Arne"');
                assert.equals(
                    this.query.retrieveTree(),
                    parser('SELECT *\n' +
                        'WHERE {\n' +
                        '?subject ?predicate ?object .\n' +
                        'FILTER (?object = "Arne")\n' +
                        '}')
                );
            },
            "Multiple calls": function () {
                this.query
                    .where("?subject ?predicate ?object")
                    .filter('?object = "Arne"')
                    .filter('?subject = <http://example.org/Arne>');
                assert.equals(
                    this.query.retrieveTree(),
                    parser('SELECT *\n' +
                        'WHERE {\n' +
                        '?subject ?predicate ?object .\n' +
                        'FILTER (?object = "Arne")\n' +
                        'FILTER (?subject = <http://example.org/Arne>)\n' +
                        '}')
                );
            }
        },
        ".group": {
            "Single variable": function () {
                this.query
                    .group("?subject");
                assert.equals(
                    this.query.retrieveTree(),
                    parser("SELECT * WHERE { ?subject ?predicate ?object } GROUP BY ?subject")
                );
            },
            "Multiple variables": function () {
                this.query
                    .group("?subject ?predicate");
                assert.equals(
                    this.query.retrieveTree(),
                    parser("SELECT * WHERE { ?subject ?predicate ?object } GROUP BY ?subject ?predicate")
                );
            }
        },
        ".optional": {
            "Single instance": function () {
                this.query
                    .where("?subject ?predicate ?object")
                    .optional('?subject ?predicate "42"');
                assert.equals(
                    this.query.retrieveTree(),
                    parser('SELECT * WHERE {\n' +
                        '?subject ?predicate ?object .\n' +
                        'OPTIONAL {\n' +
                        '?subject ?predicate "42"\n' +
                        '}\n' +
                        '}')
                );
            },
            "Single instance, multiple triples": function () {
                this.query
                    .where("?subject ?predicate ?object")
                    .optional('?subject foaf:age "42" . ?subject foaf:name "Arne"');
                assert.equals(
                    this.query.retrieveTree(),
                    parser('SELECT * WHERE {\n' +
                        '?subject ?predicate ?object .\n' +
                        'OPTIONAL {\n' +
                        '?subject foaf:age "42" .\n' +
                        '?subject foaf:name "Arne" .\n' +
                        '}\n' +
                        '}')
                );
            },
            "Multiple instances": function () {
                this.query
                    .where("?subject ?predicate ?object")
                    .optional('?subject foaf:age "42"')
                    .optional('?subject foaf:name "Arne"');
                assert.equals(
                    this.query.retrieveTree(),
                    parser('SELECT * WHERE {\n' +
                        '?subject ?predicate ?object .\n' +
                        'OPTIONAL {\n' +
                        '?subject foaf:age "42" .\n' +
                        '}\n' +
                        'OPTIONAL {\n' +
                        '?subject foaf:name "Arne" .\n' +
                        '}\n' +
                        '}')
                );
            }
        },
        ".prefix": {
            "Single instance": function () {
                this.query
                    .prefix("rdf", "http://www.w3.org/1999/02/22-rdf-syntax-ns#");
                assert.equals(
                    this.query.retrieveTree(),
                    parser("PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n" +
                        "SELECT * WHERE { ?subject ?predicate ?object }")
                );
            },
            "Multiple instances": function () {
                this.query
                    .prefix("rdf", "http://www.w3.org/1999/02/22-rdf-syntax-ns#")
                    .prefix("foaf", "http://xmlns.com/foaf/0.1/");
                assert.equals(
                    this.query.retrieveTree(),
                    parser("PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n" +
                        "PREFIX foaf: <http://xmlns.com/foaf/0.1/>\n" +
                        "SELECT * WHERE { ?subject ?predicate ?object }")
                );
            },
            "Multiple instances, same prefix": function () {
                this.query
                    .prefix("rdf", "http://www.w3.org/1999/02/22-rdf-syntax-ns#")
                    .prefix("rdf", "http://www.w3.org/1999/02/22-rdf-syntax-ns#");
                assert.equals(
                    this.query.retrieveTree(),
                    parser("PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n" +
                        "SELECT * WHERE { ?subject ?predicate ?object }")
                );
            }
        },
        ".regex": {
            "Without flags": function () {
                this.query
                    .where("?subject ?predicate ?object")
                    .regex("?subject", "John");
                assert.equals(
                    this.query.retrieveTree(),
                    parser("SELECT *\n" +
                        "WHERE {\n" +
                        "?subject ?predicate ?object\n" +
                        'FILTER regex(?subject, "John")\n' +
                        '}')
                );
            },
            "With flags": function () {
                this.query
                    .where("?subject ?predicate ?object")
                    .regex("?subject", "John", "i");
                assert.equals(
                    this.query.retrieveTree(),
                    parser("SELECT *\n" +
                        "WHERE {\n" +
                        "?subject ?predicate ?object\n" +
                        'FILTER regex(?subject, "John", "i")\n' +
                        '}')
                );
            }
        },
        ".select": {
            "Single variable": function () {
                this.query
                    .select("?subject");
                assert.equals(
                    this.query.retrieveTree(),
                    parser("SELECT ?subject\n" +
                        "WHERE { ?subject ?predicate ?object }")
                );
            },
            "Asterix": function () {
                this.query
                    .select("*");
                assert.equals(
                    this.query.retrieveTree(),
                    parser("SELECT *\n" +
                        "WHERE { ?subject ?predicate ?object }")
                );
            },
            "Aliased": function () {
                this.query
                    .select("(?subject as ?s)");
                assert.equals(
                    this.query.retrieveTree(),
                    parser("SELECT (?subject as ?s)\n" +
                        "WHERE { ?subject ?predicate ?object }")
                );
            },
            "Bnode": function () {
                this.query
                    .select("(BNODE(?subject) as ?b)");
                assert.equals(
                    this.query.retrieveTree(),
                    parser("SELECT (BNODE(?subject) as ?b)\n" +
                        "WHERE { ?subject ?predicate ?object }")
                );
            },
            "Mixed": function () {
                this.query
                    .select("?subject (?predicate as ?s)");
                assert.equals(
                    this.query.retrieveTree(),
                    parser("SELECT ?subject (?predicate as ?s)\n" +
                        "WHERE { ?subject ?predicate ?object }")
                );
            }
        },
        ".where": {
            "Single call, with no pattern": {
                "Variables": function () {
                    this.query
                        .where("?subject ?predicate ?object");
                    assert.equals(
                        this.query.retrieveTree(),
                        parser("SELECT *\n" +
                            "WHERE { ?subject ?predicate ?object }")
                    );
                },
                "With URI": function () {
                    this.query
                        .where("?subject <{0}> ?object".format(preName));
                    assert.equals(
                        this.query.retrieveTree(),
                        parser("SELECT *\n" +
                            "WHERE { ?subject <{0}> ?object }".format(preName))
                    );
                },
                "With CURIE": function () {
                    this.query
                        .where("?subject foaf:name ?object");
                    assert.equals(
                        this.query.retrieveTree(),
                        parser("SELECT *\n" +
                            "WHERE { ?subject foaf:name ?object }")
                    );
                },
                "With literal (type specified)": function () {
                    this.query
                        .where('?subject foaf:name "22"^^<http://www.w3.org/2001/XMLSchema#integer>');
                    assert.equals(
                        this.query.retrieveTree(),
                        parser("SELECT *\n" +
                            'WHERE { ?subject foaf:name "22"^^<http://www.w3.org/2001/XMLSchema#integer> }')
                    );
                },
                "With literal (type unspecified)": function () {
                    this.query
                        .where('?subject foaf:name 22');
                    assert.equals(
                        this.query.retrieveTree(),
                        parser("SELECT *\n" +
                            "WHERE { ?subject foaf:name 22 }")
                    );
                }
            },
            "Multiple call, with no pattern": {
                "Different patterns": function () {
                    this.query
                        .where("?subject foaf:name ?object")
                        .where('?subject ?predicate "{0}"'.format(objJohnName));
                    assert.equals(
                        this.query.retrieveTree(),
                        parser("SELECT *\n" +
                            "WHERE {\n" +
                            "?subject foaf:name ?object .\n" +
                            '?subject ?predicate "{0}"\n'.format(objJohnName) +
                            "}")
                    );
                }
            }
        }
    });
});