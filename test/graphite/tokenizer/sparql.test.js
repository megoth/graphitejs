define([
    "src/graphite/tokenizer/sparql"
], function (Tokenizer) {
    var tokenBase = {
            "token": "base",
            "value": "http://example.org/"
        },
        tokenCurieName = {
            "prefix": "foaf",
            "suffix": "name",
            "token": "uri",
            "value": null
        },
        tokenCurieType = {
            "prefix": "rdf",
            "suffix": "type",
            "token": "uri",
            "value": null
        },
        tokenUriInteger = {
            "prefix": null,
            "suffix": null,
            "token": "uri",
            "value": "http://www.w3.org/2001/XMLSchema#integer"
        },
        tokenUriType = {
            "prefix": null,
            "suffix": null,
            "token": "uri",
            "value": "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"
        },
        tokenLiteral22 = {
            "lang": null,
            "token": "literal",
            "type": "http://www.w3.org/2001/XMLSchema#integer",
            "value": "22"
        },
        tokenLiteral22Specified = {
            "lang": null,
            "token": "literal",
            "type": tokenUriInteger,
            "value": "22"
        },
        tokenLiteralArne = {
            "lang": null,
            "token": "literal",
            "type": null,
            "value": "Arne"
        },
        tokenLiteralEnglish = {
            "lang": "en",
            "token": "literal",
            "type": null,
            "value": "Andy"
        },
        tokenVarA = {
            "token": "var",
            "value": "a"
        },
        tokenVarB = {
            "token": "var",
            "value": "b"
        },
        tokenVarC = {
            "token": "var",
            "value": "c"
        },
        tokenExpressionAtomicA = {
            "expressionType": "atomic",
            "primaryexpression": "var",
            "token": "expression",
            "value": tokenVarA
        },
        tokenExpressionAtomicArne = {
            "expressionType": "atomic",
            "primaryexpression": "rdfliteral",
            "token": "expression",
            "value": tokenLiteralArne
        },
        tokenExpressionAtomicB = {
            "expressionType": "atomic",
            "primaryexpression": "var",
            "token": "expression",
            "value": tokenVarB
        },
        tokenExpressionBnodeA = {
            "args": [ tokenExpressionAtomicA ],
            "builtincall": "bnode",
            "expressionType": "builtincall",
            "token": "expression"
        },
        tokenExpressionAEqualsArne = {
            "expressionType": "relationalexpression",
            "op1": tokenExpressionAtomicA,
            "op2": tokenExpressionAtomicArne,
            "operator": "=",
            "token": "expression"
        },
        tokenExpressionAGreaterArne = {
            "expressionType": "relationalexpression",
            "op1": tokenExpressionAtomicA,
            "op2": tokenExpressionAtomicArne,
            "operator": ">",
            "token": "expression"
        },
        tokenExpressionAGreaterOrEqualsArne = {
            "expressionType": "relationalexpression",
            "op1": tokenExpressionAtomicA,
            "op2": tokenExpressionAtomicArne,
            "operator": ">=",
            "token": "expression"
        },
        tokenExpressionALesserArne = {
            "expressionType": "relationalexpression",
            "op1": tokenExpressionAtomicA,
            "op2": tokenExpressionAtomicArne,
            "operator": "<",
            "token": "expression"
        },
        tokenExpressionALesserOrEqualsArne = {
            "expressionType": "relationalexpression",
            "op1": tokenExpressionAtomicA,
            "op2": tokenExpressionAtomicArne,
            "operator": "<=",
            "token": "expression"
        },
        tokenExpressionANotEqualsArne = {
            "expressionType": "relationalexpression",
            "op1": tokenExpressionAtomicA,
            "op2": tokenExpressionAtomicArne,
            "operator": "!=",
            "token": "expression"
        },
        tokenExpressionAvgA = {
            "aggregateType": "avg",
            "distinct": "",
            "expression": tokenExpressionAtomicA,
            "expressionType": "aggregate",
            "token": "expression"
        },
        tokenExpressionCountA = {
            "aggregateType": "count",
            "distinct": "",
            "expression": tokenExpressionAtomicA,
            "expressionType": "aggregate",
            "token": "expression"
        },
        tokenExpressionMaxA = {
            "aggregateType": "max",
            "distinct": "",
            "expression": tokenExpressionAtomicA,
            "expressionType": "aggregate",
            "token": "expression"
        },
        tokenExpressionMinA = {
            "aggregateType": "min",
            "distinct": "",
            "expression": tokenExpressionAtomicA,
            "expressionType": "aggregate",
            "token": "expression"
        },
        tokenExpressionSumA = {
            "aggregateType": "sum",
            "distinct": "",
            "expression": tokenExpressionAtomicA,
            "expressionType": "aggregate",
            "token": "expression"
        },
        tokenFilterAEqualsArne = {
            "token": "filter",
            "value": tokenExpressionAEqualsArne
        },
        tokenFilterAGreaterOrEqualsArne = {
            "token": "filter",
            "value": tokenExpressionAGreaterOrEqualsArne
        },
        tokenFilterAGreaterArne = {
            "token": "filter",
            "value": tokenExpressionAGreaterArne
        },
        tokenFilterALesserOrEqualsArne = {
            "token": "filter",
            "value": tokenExpressionALesserOrEqualsArne
        },
        tokenFilterALesserArne = {
            "token": "filter",
            "value": tokenExpressionALesserArne
        },
        tokenFilterANotEqualsArne = {
            "token": "filter",
            "value": tokenExpressionANotEqualsArne
        },
        tokenDirectionAASC = {
            "direction": "ASC",
            "expression": tokenExpressionAtomicA
        },
        tokenDirectionADesc = {
            "direction": "DESC",
            "expression": tokenExpressionAtomicA
        },
        tokenDirectionBAsc = {
            "direction": "ASC",
            "expression": tokenExpressionAtomicB
        },
        tokenGroupA = [ tokenVarA ],
        tokenGroupAB = [ tokenVarA, tokenVarB ],
        tokenOrderAAsc = [ tokenDirectionAASC ],
        tokenOrderADesc = [ tokenDirectionADesc ],
        tokenOrderADescBAsc = [ tokenDirectionADesc, tokenDirectionBAsc ],
        tokenPrefixRDF = {
            "local": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
            "prefix": "rdf",
            "token": "prefix"
        },
        tokenPrefixFOAF = {
            "local": "http://xmlns.com/foaf/0.1/",
            "prefix": "foaf",
            "token": "prefix"
        },
        tokenPrologueBase = {
            "base": tokenBase,
            "prefixes": [],
            "token": "prologue"
        },
        tokenPrologueBaseAndPrefixRDF = {
            "base": tokenBase,
            "prefixes": [ tokenPrefixRDF ],
            "token": "prologue"
        },
        tokenPrologueBaseAndPrefixRDFAndPrefixFOAF = {
            "base": tokenBase,
            "prefixes": [ tokenPrefixRDF, tokenPrefixFOAF ],
            "token": "prologue"
        },
        tokenProloguePrefixRDF = {
            "base": "",
            "prefixes": [ tokenPrefixRDF ],
            "token": "prologue"
        },
        tokenVariableA = {
            "kind": "var",
            "token": "variable",
            "value": tokenVarA
        },
        tokenVariableAliasedAAsB = {
            "alias": tokenVarB,
            "expression": tokenExpressionAtomicA,
            "kind": "aliased",
            "token": "variable"
        },
        tokenVariableAliasedBnodeAsB = {
            "alias": tokenVarB,
            "expression": tokenExpressionBnodeA,
            "kind": "aliased",
            "token": "variable"
        },
        tokenVariableStar = {
            "kind": "*",
            "token": "variable"
        },
        tokenTripleABC = {
            "object": tokenVarC,
            "predicate": tokenVarB,
            "subject": tokenVarA
        },
        tokenTripleACurieName22 = {
            "object": tokenLiteral22,
            "predicate": tokenCurieName,
            "subject": tokenVarA
        },
        tokenTripleACurieName22Specified = {
            "object": tokenLiteral22Specified,
            "predicate": tokenCurieName,
            "subject": tokenVarA
        },
        tokenTripleACurieNameArne = {
            "object": tokenLiteralArne,
            "predicate": tokenCurieName,
            "subject": tokenVarA
        },
        tokenTripleACurieNameEnglish = {
            "object": tokenLiteralEnglish,
            "predicate": tokenCurieName,
            "subject": tokenVarA
        },
        tokenTripleACurieTypeC = {
            "object": tokenVarC,
            "predicate": tokenCurieType,
            "subject": tokenVarA
        },
        tokenTripleAUriTypeC = {
            "object": tokenVarC,
            "predicate": tokenUriType,
            "subject": tokenVarA
        },
        tokenBGPABC = {
            "token": "basicgraphpattern",
            "triplesContext": [ tokenTripleABC ]
        },
        tokenBGPABCx2 = {
            "token": "basicgraphpattern",
            "triplesContext": [ tokenTripleABC, tokenTripleABC ]
        },
        tokenBGPABCx3 = {
            "token": "basicgraphpattern",
            "triplesContext": [ tokenTripleABC, tokenTripleABC, tokenTripleABC ]
        },
        tokenBGPACurieName22 = {
            "token": "basicgraphpattern",
            "triplesContext": [ tokenTripleACurieName22 ]
        },
        tokenBGPACurieName22Specified = {
            "token": "basicgraphpattern",
            "triplesContext": [ tokenTripleACurieName22Specified ]
        },
        tokenBGPACurieNameArne = {
            "token": "basicgraphpattern",
            "triplesContext": [ tokenTripleACurieNameArne ]
        },
        tokenBGPACurieNameEnglish = {
            "token": "basicgraphpattern",
            "triplesContext": [ tokenTripleACurieNameEnglish ]
        },
        tokenBGPACurieTypeC = {
            "token": "basicgraphpattern",
            "triplesContext": [ tokenTripleACurieTypeC ]
        },
        tokenBGPAUriTypeC = {
            "token": "basicgraphpattern",
            "triplesContext": [ tokenTripleAUriTypeC ]
        },
        tokenPatternABC = {
            "filters": [],
            "patterns": [ tokenBGPABC ],
            "token": "groupgraphpattern"
        },
        tokenPatternABCx2 = {
            "filters": [],
            "patterns": [ tokenBGPABCx2 ],
            "token": "groupgraphpattern"
        },
        tokenPatternABCx3 = {
            "filters": [],
            "patterns": [ tokenBGPABCx3 ],
            "token": "groupgraphpattern"
        },
        tokenPatternACurieName22 = {
            "filters": [],
            "patterns": [ tokenBGPACurieName22 ],
            "token": "groupgraphpattern"
        },
        tokenPatternACurieName22Specified = {
            "filters": [],
            "patterns": [ tokenBGPACurieName22Specified ],
            "token": "groupgraphpattern"
        },
        tokenPatternACurieNameArne = {
            "filters": [],
            "patterns": [ tokenBGPACurieNameArne ],
            "token": "groupgraphpattern"
        },
        tokenPatternACurieNameEnglish = {
            "filters": [],
            "patterns": [ tokenBGPACurieNameEnglish ],
            "token": "groupgraphpattern"
        },
        tokenPatternACurieTypeC = {
            "filters": [],
            "patterns": [ tokenBGPACurieTypeC ],
            "token": "groupgraphpattern"
        },
        tokenPatternAUriTypeC = {
            "filters": [],
            "patterns": [ tokenBGPAUriTypeC ],
            "token": "groupgraphpattern"
        },
        tokenProjectionA = [ tokenVariableA ],
        tokenProjectionAAsB = [ tokenVariableAliasedAAsB ],
        tokenProjectionsAAndAAsB = [ tokenVariableA, tokenVariableAliasedAAsB ],
        tokenProjectionStar = [ tokenVariableStar ],
        varA = Tokenizer.var("a"),
        variableA = Tokenizer.variable("?a"),
        variableAliased1 = Tokenizer.variable("(?a AS ?b)"),
        variableBnode1 = Tokenizer.variable("(BNODE(?a) AS ?b)"),
        variableStar = Tokenizer.variable("*");
    buster.testCase("Graphite tokenizer (SPARQL)", {
        "Proper setup": function () {
            assert.defined(Tokenizer);
            assert.isObject(Tokenizer);
        },
        ".alias": function () {
            assert.equals(Tokenizer.alias("AS ?b"), {
                "alias": tokenVarB,
                "remainder": ""
            });
        },
        ".base": function () {
            assert.equals(Tokenizer.base("http://example.org/"), {
                "base": tokenBase,
                "remainder": ""
            })
        },
        ".expression": {
            "avg": function () {
                assert.equals(Tokenizer.expression("AVG(?a)"), {
                    "expression": tokenExpressionAvgA,
                    "remainder": ""
                });
            },
            "count": function () {
                assert.equals(Tokenizer.expression("COUNT(?a)"), {
                    "expression": tokenExpressionCountA,
                    "remainder": ""
                });
            },
            "max": function () {
                assert.equals(Tokenizer.expression("MAX(?a)"), {
                    "expression": tokenExpressionMaxA,
                    "remainder": ""
                });
            },
            "min": function () {
                assert.equals(Tokenizer.expression("MIN(?a)"), {
                    "expression": tokenExpressionMinA,
                    "remainder": ""
                });
            },
            "relationalexpression": {
                "equals": function () {
                    assert.equals(Tokenizer.expression('?a = "Arne"'), {
                        "expression": tokenExpressionAEqualsArne,
                        "remainder": ""
                    });
                },
                "greater": function () {
                    assert.equals(Tokenizer.expression('?a > "Arne"'), {
                        "expression": tokenExpressionAGreaterArne,
                        "remainder": ""
                    });
                },
                "greater-or-equals": function () {
                    assert.equals(Tokenizer.expression('?a >= "Arne"'), {
                        "expression": tokenExpressionAGreaterOrEqualsArne,
                        "remainder": ""
                    });
                },
                "lesser": function () {
                    assert.equals(Tokenizer.expression('?a < "Arne"'), {
                        "expression": tokenExpressionALesserArne,
                        "remainder": ""
                    });
                },
                "lesser-or-equals": function () {
                    assert.equals(Tokenizer.expression('?a <= "Arne"'), {
                        "expression": tokenExpressionALesserOrEqualsArne,
                        "remainder": ""
                    });
                },
                "not-equals": function () {
                    assert.equals(Tokenizer.expression('?a != "Arne"'), {
                        "expression": tokenExpressionANotEqualsArne,
                        "remainder": ""
                    });
                }
            },
            "sum": function () {
                assert.equals(Tokenizer.expression("SUM(?a)"), {
                    "expression": tokenExpressionSumA,
                    "remainder": ""
                })
            }
        },
        ".filter": function () {
            assert.equals(Tokenizer.filter('FILTER(?a = "Arne")'), {
                "filter": tokenFilterAEqualsArne,
                "remainder": ""
            });
            assert.equals(Tokenizer.filter('FILTER(?a > "Arne")'), {
                "filter": tokenFilterAGreaterArne,
                "remainder": ""
            });
            assert.equals(Tokenizer.filter('FILTER(?a >= "Arne")'), {
                "filter": tokenFilterAGreaterOrEqualsArne,
                "remainder": ""
            });
            assert.equals(Tokenizer.filter('FILTER(?a < "Arne")'), {
                "filter": tokenFilterALesserArne,
                "remainder": ""
            });
            assert.equals(Tokenizer.filter('FILTER(?a <= "Arne")'), {
                "filter": tokenFilterALesserOrEqualsArne,
                "remainder": ""
            });
            assert.equals(Tokenizer.filter('FILTER(?a != "Arne")'), {
                "filter": tokenFilterANotEqualsArne,
                "remainder": ""
            });
        },
        ".group": {
            "Single variable": function () {
                assert.equals(Tokenizer.group("?a"), {
                    "group": tokenGroupA,
                    "remainder": ""
                });
            },
            "Multiple variables": function () {
                assert.equals(Tokenizer.group("?a ?b"), {
                    "group": tokenGroupAB,
                    "remainder": ""
                });
            }
        },
        ".order": function () {
            assert.equals(Tokenizer.order("?a"), {
                "order": tokenOrderAAsc,
                "remainder": ""
            });
            assert.equals(Tokenizer.order("ASC(?a)"), {
                "order": tokenOrderAAsc,
                "remainder": ""
            });
            assert.equals(Tokenizer.order("DESC(?a)"), {
                "order": tokenOrderADesc,
                "remainder": ""
            });
            assert.equals(Tokenizer.order("DESC(?a) ?b"), {
                "order": tokenOrderADescBAsc,
                "remainder": ""
            });
        },
        ".pattern": {
            "With variables": function () {
                assert.equals(Tokenizer.pattern("?a ?b ?c"), {
                    "pattern": tokenPatternABC,
                    "remainder": ""
                });
                assert.equals(Tokenizer.pattern("?a ?b ?c ."), {
                    "pattern": tokenPatternABC,
                    "remainder": ""
                });
                assert.equals(Tokenizer.pattern("?a ?b ?c.?a ?b ?c"), {
                    "pattern": tokenPatternABCx2,
                    "remainder": ""
                });
                assert.equals(Tokenizer.pattern("?a ?b ?c; ?b ?c"), {
                    "pattern": tokenPatternABCx2,
                    "remainder": ""
                });
                assert.equals(Tokenizer.pattern("?a ?b ?c, ?c"), {
                    "pattern": tokenPatternABCx2,
                    "remainder": ""
                });
                assert.equals(Tokenizer.pattern("?a ?b ?c; ?b ?c, ?c ."), {
                    "pattern": tokenPatternABCx3,
                    "remainder": ""
                });
            },
            "With uris": function () {
                assert.equals(Tokenizer.pattern("?a rdf:type ?c"), {
                    "pattern": tokenPatternACurieTypeC,
                    "remainder": ""
                });
                assert.equals(Tokenizer.pattern("?a <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> ?c"), {
                    "pattern": tokenPatternAUriTypeC,
                    "remainder": ""
                });
            },
            "With literals": function () {
                assert.equals(Tokenizer.pattern('?a foaf:name "Arne"'), {
                    "pattern": tokenPatternACurieNameArne,
                    "remainder": ""
                });
                assert.equals(Tokenizer.pattern('?a foaf:name "22"^^<http://www.w3.org/2001/XMLSchema#integer>'), {
                    "pattern": tokenPatternACurieName22Specified,
                    "remainder": ""
                });
                assert.equals(Tokenizer.pattern("?a foaf:name 22"), {
                    "pattern": tokenPatternACurieName22,
                    "remainder": ""
                });
                assert.equals(Tokenizer.pattern('?a foaf:name "Andy"@en'), {
                    "pattern": tokenPatternACurieNameEnglish,
                    "remainder": ""
                });
            }
        },
        ".prefix": function () {
            assert.equals(Tokenizer.prefix("rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>"), {
                "prefix": tokenPrefixRDF,
                "remainder": ""
            });
        },
        ".prologue": function () {
            assert.equals(Tokenizer.prologue("BASE <http://example.org/>"), {
                "prologue": tokenPrologueBase,
                "remainder": ""
            });
            assert.equals(Tokenizer.prologue("PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>"), {
                "prologue": tokenProloguePrefixRDF,
                "remainder": ""
            });
            assert.equals(Tokenizer.prologue("BASE <http://example.org/>\n" +
                "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>"), {
                "prologue": tokenPrologueBaseAndPrefixRDF,
                "remainder": ""
            });
            assert.equals(Tokenizer.prologue("BASE <http://example.org/>\n" +
                "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n" +
                "PREFIX foaf: <http://xmlns.com/foaf/0.1/>"), {
                "prologue": tokenPrologueBaseAndPrefixRDFAndPrefixFOAF,
                "remainder": ""
            });
        },
        ".projection": function () {
            assert.equals(Tokenizer.projection("?a"), {
                "projection": tokenProjectionA,
                "remainder": ""
            });
            assert.equals(Tokenizer.projection("*"), {
                "projection": tokenProjectionStar,
                "remainder": ""
            });
            assert.equals(Tokenizer.projection("(?a AS ?b)"), {
                "projection": tokenProjectionAAsB,
                "remainder": ""
            });
            assert.equals(Tokenizer.projection("?a (?a AS ?b)"), {
                "projection": tokenProjectionsAAndAAsB,
                "remainder": ""
            });
        },
        ".var": function () {
            assert.equals(varA, {
                "remainder": "",
                "var": tokenVarA
            });
        },
        ".variable": function () {
            assert.equals(variableA, {
                "remainder": "",
                "variable": tokenVariableA
            });
            assert.equals(variableStar, {
                "remainder": "",
                "variable": tokenVariableStar
            });
            assert.equals(variableAliased1, {
                "remainder": "",
                "variable": tokenVariableAliasedAAsB
            });
            assert.equals(variableBnode1, {
                "remainder": "",
                "variable": tokenVariableAliasedBnodeAsB
            })
        }
    });
});