/*global assert, buster, graphite, module, require*/
if (typeof module === "object" && typeof require === "function") {
    var buster = require("buster");
}

define(["src/rdfstore/query-engine/abstract_query_tree"], function (AbstractQueryTree) {
    buster.testCase("RDFStore AbstractQueryTree", {
        setUp: function () {
            this.aqt = new AbstractQueryTree.AbstractQueryTree();
        },
        "Example 1": function () {
            var query = "SELECT * { ?s ?p ?o }",
                result;
            query = this.aqt.parseQueryString(query);
            result = this.aqt.parseExecutableUnit(query.units[0]);
            assert.equals(result.pattern.kind, 'BGP');
            assert.equals(result.pattern.value.length, 1);
        },
        "Example 2": function () {
            var query = "SELECT * { ?s :p1 ?v1 ; :p2 ?v2 }",
                result;
            query = this.aqt.parseQueryString(query);
            result = this.aqt.parseSelect(query.units[0]);
            assert.equals(result.pattern.kind, 'BGP');
            assert.equals(result.pattern.value.length, 2);
        },
        "Example 3": function () {
            var query = "SELECT * { { ?s :p1 ?v1 } UNION {?s :p2 ?v2 } }",
                result;
            query = this.aqt.parseQueryString(query);
            result = this.aqt.parseSelect(query.units[0]);
            assert.equals(result.pattern.kind, 'UNION');
            assert.equals(result.pattern.value.length, 2);
            assert.equals(result.pattern.value[0].kind, 'BGP');
            assert.equals(result.pattern.value[0].value.length, 1);
            assert.equals(result.pattern.value[1].kind, 'BGP');
            assert.equals(result.pattern.value[1].value.length, 1);
        },
        "Example 4": function () {
            var query = "SELECT * { { ?s :p1 ?v1 } UNION {?s :p2 ?v2 } UNION {?s :p3 ?v3 } }",
                result;
            query = this.aqt.parseQueryString(query);
            result = this.aqt.parseSelect(query.units[0]);
            assert.equals(result.pattern.kind, 'UNION');
            assert.equals(result.pattern.value.length, 2);
            assert.equals(result.pattern.value[0].kind, 'UNION');
            assert.equals(result.pattern.value[0].value.length, 2);
            assert.equals(result.pattern.value[1].kind, 'BGP');
            assert.equals(result.pattern.value[1].value.length, 1);
            assert.equals(result.pattern.value[1].value[0].object.value, 'v3');
            assert.equals(result.pattern.value[1].value[0].object.token, 'var');
            assert.equals(result.pattern.value[0].value[0].kind, 'BGP');
            assert.equals(result.pattern.value[0].value[0].value.length, 1);
            assert.equals(result.pattern.value[0].value[0].value[0].object.value, 'v1');
            assert.equals(result.pattern.value[0].value[1].kind, 'BGP');
            assert.equals(result.pattern.value[0].value[1].value.length, 1);
            assert.equals(result.pattern.value[0].value[1].value[0].object.value, 'v2');
        },
        "Example 5": function () {
            var query = "SELECT * { ?s :p1 ?v1 OPTIONAL {?s :p2 ?v2 } }",
                result;
            query = this.aqt.parseQueryString(query);
            result = this.aqt.parseSelect(query.units[0]);
            assert.equals(result.pattern.kind, "LEFT_JOIN");
            assert.equals(result.pattern.filter, true);
            assert.equals(result.pattern.lvalue.kind, "BGP");
            assert.equals(result.pattern.lvalue.value.length, 1);
            assert.equals(result.pattern.rvalue.kind, "BGP");
            assert.equals(result.pattern.rvalue.value.length, 1);
        },
        "Example 6": function () {
            var query = "SELECT * { ?s :p1 ?v1 OPTIONAL {?s :p2 ?v2 } OPTIONAL { ?s :p3 ?v3 } }",
                result;
            query = this.aqt.parseQueryString(query);
            result = this.aqt.parseSelect(query.units[0]);
            assert.equals(result.pattern.kind, "LEFT_JOIN");
            assert.equals(result.pattern.lvalue.kind, "LEFT_JOIN");
            assert.equals(result.pattern.lvalue.lvalue.kind, "BGP");
            assert.equals(result.pattern.lvalue.rvalue.kind, "BGP");
            assert.equals(result.pattern.rvalue.kind, "BGP");
        },
        "Example 7": function () {
            var query = "SELECT * { ?s :p1 ?v1 OPTIONAL {?s :p2 ?v2 FILTER(?v1<3) } }",
                result;
            query = this.aqt.parseQueryString(query);
            result = this.aqt.parseSelect(query.units[0]);
            assert.equals(result.pattern.kind, "LEFT_JOIN");
            assert.equals(result.pattern.filter.length, 1);
            assert.equals(result.pattern.filter[0].token, 'filter');
            assert.equals(result.pattern.lvalue.kind, "BGP");
            assert.equals(result.pattern.rvalue.kind, "BGP");
        },
        "Example 8": function () {
            var query = "SELECT * { {?s :p1 ?v1} UNION {?s :p2 ?v2} OPTIONAL {?s :p3 ?v3} }",
                result;
            query = this.aqt.parseQueryString(query);
            result = this.aqt.parseSelect(query.units[0]);
            assert.equals(result.pattern.kind, "LEFT_JOIN");
            assert.equals(result.pattern.lvalue.kind, "UNION");
            assert.equals(result.pattern.rvalue.kind, "BGP");
        },
        "Example 9": function () {
            var query = "PREFIX foaf:    <http://xmlns.com/foaf/0.1/>" +
                    "SELECT ?nameX ?nameY ?nickY" +
                    "WHERE" +
                    "{ ?x foaf:knows ?y ;" +
                    "  foaf:name ?nameX ." +
                    "  ?y foaf:name ?nameY ." +
                    "  OPTIONAL { ?y foaf:nick ?nickY }  }",
                result;
            query = this.aqt.parseQueryString(query);
            result = this.aqt.parseSelect(query.units[0]);
            assert.equals(result.pattern.kind, "LEFT_JOIN");
            assert.equals(result.pattern.lvalue.kind, "BGP");
            assert.equals(result.pattern.rvalue.kind, "BGP");
        },
        "Example 10": function () {
            var query = this.aqt.parseQueryString("SELECT * { ?s ?p ?o }"),
                parsed = this.aqt.parseExecutableUnit(query.units[0]),
                patterns = this.aqt.collectBasicTriples(parsed);
            assert.equals(patterns.length, 1);
        },
        "Example Collect 2": function () {
            var query = this.aqt.parseQueryString("SELECT * { ?s :p1 ?v1 ; :p2 ?v2 }"),
                parsed = this.aqt.parseSelect(query.units[0]),
                patterns = this.aqt.collectBasicTriples(parsed);
            assert.equals(patterns.length, 2);
        },
        "Example Collect 9": function () {
            var query = this.aqt.parseQueryString("PREFIX foaf:    <http://xmlns.com/foaf/0.1/>" +
                    "SELECT ?nameX ?nameY ?nickY" +
                    "WHERE" +
                    "{ ?x foaf:knows ?y ;" +
                    "foaf:name ?nameX ." +
                    "?y foaf:name ?nameY ." +
                    "OPTIONAL { ?y foaf:nick ?nickY }  }"),
                parsed = this.aqt.parseSelect(query.units[0]),
                patterns = this.aqt.collectBasicTriples(parsed);
            assert.equals(patterns.length, 4);
        },
        "Example Collect G1": function () {
            var query = this.aqt.parseQueryString("PREFIX : <http://example/>" +
                    "SELECT * { GRAPH ?g { ?s ?p ?o } }"),
                parsed = this.aqt.parseSelect(query.units[0]),
                patterns = this.aqt.collectBasicTriples(parsed);
            assert.equals(patterns.length, 1);
            assert.defined(patterns[0].graph);
        },
        "Example Collect G2": function () {
            var query = this.aqt.parseQueryString("PREFIX : <http://example/>" +
                    "SELECT * { GRAPH <http://test.com/graph1> { ?s ?p ?o } }"),
                parsed = this.aqt.parseSelect(query.units[0]),
                patterns = this.aqt.collectBasicTriples(parsed);
            assert.equals(patterns.length, 1);
            assert.equals(patterns[0].graph.value, "http://test.com/graph1");
        },
        "Bind 1": function () {
            var query = this.aqt.parseQueryString("SELECT * { ?s :p1 ?v1 OPTIONAL {?s :p2 ?v2 FILTER(?v1<3) } }"),
                result = this.aqt.parseSelect(query.units[0]);
            assert.equals(result.pattern.kind, "LEFT_JOIN");
            assert.equals(result.pattern.filter.length, 1);
            assert.equals(result.pattern.filter[0].token, 'filter');
            assert.equals(result.pattern.lvalue.kind, "BGP");
            assert.equals(result.pattern.rvalue.kind, "BGP");
            result = this.aqt.bind(result, { v1: { token: 'uri', value: 'http://test.com/somevalue' }});
            assert.equals(result.pattern.filter[0].value.op1.value.value, 'http://test.com/somevalue');
            assert.equals(result.pattern.lvalue.value[0].object.value, 'http://test.com/somevalue');
        },
        "Bind 2": function () {
            var query = this.aqt.parseQueryString("SELECT * { ?s :p1 ?v1 OPTIONAL {?s :p2 ?v2 FILTER(?v1<3 && (?v1+?v1) < (5*?v1) && STR(?v1)) } }"),
                result = this.aqt.parseSelect(query.units[0]);
            assert.equals(result.pattern.kind, "LEFT_JOIN");
            assert.equals(result.pattern.filter.length, 1);
            assert.equals(result.pattern.filter[0].token, 'filter');
            assert.equals(result.pattern.lvalue.kind, "BGP");
            assert.equals(result.pattern.rvalue.kind, "BGP");
            result = this.aqt.bind(result, { v1: { token: 'uri', value: 'http://test.com/somevalue' }});
            assert.equals(result.pattern.filter[0].value.operands[0].op1.value.value, 'http://test.com/somevalue');
            assert.equals(result.pattern.filter[0].value.operands[1].op1.summand.value.value, 'http://test.com/somevalue');
            assert.equals(result.pattern.filter[0].value.operands[1].op1.summands[0].expression.value.value, 'http://test.com/somevalue');
            assert.equals(result.pattern.filter[0].value.operands[1].op2.factors[0].expression.value.value, 'http://test.com/somevalue');
            assert.equals(result.pattern.filter[0].value.operands[2].args[0].value.value, 'http://test.com/somevalue');
        },
        "Parsing blank space in URI": function () {
            var query = this.aqt.parseQueryString("SELECT * { ?s :p1 ?v1 OPTIONAL {?s :p2 <http://prauw.cs.vu.nl/foaf/Jan Top.rdf> FILTER(?v1<3 && (?v1+?v1) < (5*?v1) && STR(?v1)) } }"),
                result = this.aqt.parseSelect(query.units[0]);
            assert.equals(result.pattern.kind, "LEFT_JOIN");
            assert.equals(result.pattern.filter.length, 1);
            assert.equals(result.pattern.filter[0].token, 'filter');
            assert.equals(result.pattern.lvalue.kind, "BGP");
            assert.equals(result.pattern.rvalue.kind, "BGP");
            result = this.aqt.bind(result, { v1: { token: 'uri', value: 'http://test.com/somevalue' }});
            assert.equals(result.pattern.filter[0].value.operands[0].op1.value.value, 'http://test.com/somevalue');
            assert.equals(result.pattern.filter[0].value.operands[1].op1.summand.value.value, 'http://test.com/somevalue');
            assert.equals(result.pattern.filter[0].value.operands[1].op1.summands[0].expression.value.value, 'http://test.com/somevalue');
            assert.equals(result.pattern.filter[0].value.operands[1].op2.factors[0].expression.value.value, 'http://test.com/somevalue');
            assert.equals(result.pattern.filter[0].value.operands[2].args[0].value.value, 'http://test.com/somevalue');
        },
        "Simple path 1": function () {
            var query = this.aqt.parseQueryString("SELECT * { ?s :p1/:p2/:p3 ?v1 }");
            var result = this.aqt.parseSelect(query.units[0]);
            assert.equals(result.pattern.kind, 'BGP');
            assert.equals(result.pattern.value.length, 3);
            assert.equals(result.pattern.value[0].subject.value, 's');
            assert.equals(result.pattern.value[0].object.value.indexOf("fresh:"), 0);
            assert.equals(result.pattern.value[0].predicate.suffix, 'p1');
            assert.equals(result.pattern.value[0].object.value, result.pattern.value[1].subject.value);
            assert.equals(result.pattern.value[1].object.value, result.pattern.value[2].subject.value);
            assert.equals(result.pattern.value[1].predicate.suffix, 'p2');
            assert.equals(result.pattern.value[2].object.value, 'v1');
            assert.equals(result.pattern.value[2].predicate.suffix, 'p3');
        }
    });
});