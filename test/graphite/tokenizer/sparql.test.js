define([
    "src/graphite/tokenizer/sparql",
    "src/graphite/utils"
], function (Tokenizer, Utils) {
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
        tokenEmptyPattern = null,
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
        tokenOptionalABC = {
            "token": "optionalgraphpattern",
            "value": tokenPatternABC
        },
        tokenProjectionA = [ tokenVariableA ],
        tokenProjectionAAsB = [ tokenVariableAliasedAAsB ],
        tokenProjectionsAAndAAsB = [ tokenVariableA, tokenVariableAliasedAAsB ],
        tokenProjectionStar = [ tokenVariableStar ],
        tokenWhereBGPABCWithVariableA = {
            "object": tokenVarC,
            "predicate": tokenVarB,
            "subject": tokenVarA,
            "variables": [ "a" ]
        },
        tokenWhereABCWithVariableA = {
            "kind": "BGP",
            "value": [ tokenWhereBGPABCWithVariableA ]
        },
        tokenWhereABCWithVariableAx2 = {
            "kind": "BGP",
            "value": [ tokenWhereBGPABCWithVariableA, tokenWhereBGPABCWithVariableA ]
        },
        tokenWhereEmptyPattern = {
            "kind": "EMPTY_PATTERN"
        },
        tokenWhereOptionalABCWithVariableA = {
            "filter": true,
            "kind": "LEFT_JOIN",
            "lvalue": tokenWhereEmptyPattern,
            "rvalue": tokenWhereABCWithVariableA
        },
        tokenWhereOptionalABCAndOptionalABCWithVariableA = {
            "filter": true,
            "kind": "LEFT_JOIN",
            "lvalue": tokenWhereOptionalABCWithVariableA,
            "rvalue": tokenWhereABCWithVariableA
        },
        tokenWhereABCAndOptionalABCWithVariableA = {
            "filter": true,
            "kind": "LEFT_JOIN",
            "lvalue": tokenWhereABCWithVariableA,
            "rvalue": tokenWhereABCWithVariableA
        },
        tokenWhereABCAndOptionalABCAndBGPABCWithVariableA = {
            "kind": "JOIN",
            "lvalue": tokenWhereABCAndOptionalABCWithVariableA,
            "rvalue": tokenWhereABCWithVariableA
        },
        tokenWhereFilterAEqualsArneAndBGPABCWithVariableA = {
            "filter": [ tokenFilterAEqualsArne ],
            "kind": "FILTER",
            "value": tokenWhereABCWithVariableA
        },
        tokenWhereFilterAEqualsArneAndBGPABCx2WithVariableA = {
            "filter": [ tokenFilterAEqualsArne ],
            "kind": "FILTER",
            "value": tokenWhereABCWithVariableAx2
        },
        tokenWhereFilterAEqualsArneAndFilterALesserArneAndBGPABCWithVariableA = {
            "filter": [ tokenFilterAEqualsArne, tokenFilterALesserArne ],
            "kind": "FILTER",
            "value": tokenWhereABCWithVariableA
        },
        tokenWhereFilterAEqualsArneAndBGPABCAndOptionalABCWithVariableA = {
            "filter": [ tokenFilterAEqualsArne ],
            "kind": "FILTER",
            "value": tokenWhereABCAndOptionalABCWithVariableA
        };
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
        ".optional": function () {
            assert.equals(Tokenizer.optional("OPTIONAL { ?a ?b ?c }"), {
                "optional": tokenOptionalABC,
                "remainder": ""
            });
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
            assert.equals(Tokenizer.var("a"), {
                "remainder": "",
                "var": tokenVarA
            });
        },
        ".variable": function () {
            assert.equals(Tokenizer.variable("?a"), {
                "remainder": "",
                "variable": tokenVariableA
            });
            assert.equals(Tokenizer.variable("*"), {
                "remainder": "",
                "variable": tokenVariableStar
            });
            assert.equals(Tokenizer.variable("(?a AS ?b)"), {
                "remainder": "",
                "variable": tokenVariableAliasedAAsB
            });
            assert.equals(Tokenizer.variable("(BNODE(?a) AS ?b)"), {
                "remainder": "",
                "variable": tokenVariableAliasedBnodeAsB
            });
        },
        ".where": {
            "Inserting BGP": {
                "Simple case": function () {
                    assert.equals(
                        Tokenizer.where("WHERE { ?a ?b ?c }", {
                            pattern: tokenEmptyPattern
                        }), {
                            bgpindex: 0,
                            remainder: "",
                            where: tokenPatternABC
                        });
                },
                "Pattern: Empty pattern": function () {
                    assert.equals(
                        Tokenizer.where("WHERE { ?a ?b ?c }", {
                            pattern: tokenWhereEmptyPattern,
                            variables: [ "a" ]
                        }), {
                            remainder: "",
                            where: tokenWhereABCWithVariableA
                        });
                },
                "Pattern: BGP": function () {
                    assert.equals(
                        Tokenizer.where("WHERE { ?a ?b ?c }", {
                            pattern: tokenWhereABCWithVariableA,
                            variables: [ "a" ]
                        }), {
                            remainder: "",
                            where: tokenWhereABCWithVariableAx2
                        });
                },
                "Pattern: Optional": function () {
                    assert.equals(
                        Tokenizer.where("WHERE { ?a ?b ?c }", {
                            pattern: tokenWhereABCAndOptionalABCWithVariableA,
                            variables: [ "a" ]
                        }), {
                            remainder: "",
                            where: tokenWhereABCAndOptionalABCAndBGPABCWithVariableA
                        });
                },
                "Pattern: Filter": function () {
                    assert.equals(
                        Tokenizer.where("WHERE { ?a ?b ?c }", {
                            pattern: tokenWhereFilterAEqualsArneAndBGPABCWithVariableA,
                            variables: [ "a" ]
                        }), {
                            remainder: "",
                            where: tokenWhereFilterAEqualsArneAndBGPABCx2WithVariableA
                        });
                }
            },
            "Inserting optional": {
                "Pattern: BGP": function () {
                    assert.equals(
                        Tokenizer.where("WHERE { OPTIONAL { ?a ?b ?c } }", {
                            pattern: tokenWhereABCWithVariableA,
                            variables: [ "a" ]
                        }), {
                            remainder: "",
                            where: tokenWhereABCAndOptionalABCWithVariableA
                        });
                },
                "Pattern: Optional": function () {
                    assert.equals(
                        Tokenizer.where("WHERE { OPTIONAL { ?a ?b ?c } }", {
                            pattern: tokenWhereOptionalABCWithVariableA,
                            variables: [ "a" ]
                        }), {
                            remainder: "",
                            where: tokenWhereOptionalABCAndOptionalABCWithVariableA
                        });
                },
                "Pattern: Filter": function () {
                    assert.equals(
                        Tokenizer.where("WHERE { OPTIONAL { ?a ?b ?c } }", {
                            pattern: tokenWhereFilterAEqualsArneAndBGPABCWithVariableA,
                            variables: [ "a" ]
                        }), {
                            remainder: "",
                            where: tokenWhereFilterAEqualsArneAndBGPABCAndOptionalABCWithVariableA
                        });
                }
            },
            "Inserting filter": {
                "Pattern: BGP": function () {
                    assert.equals(
                        Tokenizer.where('WHERE { FILTER(?a = "Arne") }', {
                            pattern: tokenWhereABCWithVariableA,
                            variables: [ "a" ]
                        }), {
                            remainder: "",
                            where: tokenWhereFilterAEqualsArneAndBGPABCWithVariableA
                        })
                },
                "Pattern: Optional": function () {
                    assert.equals(
                        Tokenizer.where('WHERE { FILTER(?a = "Arne") }', {
                            pattern: tokenWhereABCAndOptionalABCWithVariableA,
                            variables: [ "a" ]
                        }), {
                            remainder: "",
                            where: tokenWhereFilterAEqualsArneAndBGPABCAndOptionalABCWithVariableA
                        });
                },
                "Pattern: Filter": function () {
                    assert.equals(
                        Tokenizer.where('WHERE { FILTER(?a < "Arne") }', {
                            pattern: tokenWhereFilterAEqualsArneAndBGPABCWithVariableA,
                            variables: [ "a" ]
                        }), {
                            remainder: "",
                            where: tokenWhereFilterAEqualsArneAndFilterALesserArneAndBGPABCWithVariableA
                        });
                }
            }
        }
    });
});