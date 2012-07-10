/*global assert, buster, define */
define([
    "src/graphite/tokenizer/sparql"
], function (Tokenizer) {
    "use strict";
    var tokenBase = {
            "token": "base",
            "value": "http://example.org/"
        },
        tokenLiteralArne = {
            "lang": null,
            "token": "literal",
            "type": null,
            "value": "Arne"
        },
        tokenLiteral22 = {
            "lang": null,
            "token": "literal",
            "type": "http://www.w3.org/2001/XMLSchema#integer",
            "value": "22"
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
        tokenExpressionAtomic22 = {
            "expressionType": "atomic",
            "primaryexpression": "numericliteral",
            "token": "expression",
            "value": tokenLiteral22
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
        tokenExpressionAEquals22 = {
            "expressionType": "relationalexpression",
            "op1": tokenExpressionAtomicA,
            "op2": tokenExpressionAtomic22,
            "operator": "=",
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
        tokenExpressenRegexArne = {
            "expressionType": "regex",
            "flags": undefined,
            "pattern": tokenExpressionAtomicArne,
            "text": tokenExpressionAtomicA,
            "token": "expression"
        },
        tokenExpressionRegexArneWithFlagArne = {
            "expressionType": "regex",
            "flags": tokenExpressionAtomicArne,
            "pattern": tokenExpressionAtomicArne,
            "text": tokenExpressionAtomicA,
            "token": "expression"
        },
        tokenExpressionSumA = {
            "aggregateType": "sum",
            "distinct": "",
            "expression": tokenExpressionAtomicA,
            "expressionType": "aggregate",
            "token": "expression"
        },
        tokenFilterAEquals22 = {
            "token": "filter",
            "value": tokenExpressionAEquals22
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
        tokenFilterRegexArne = {
            "token": "filter",
            "value": tokenExpressenRegexArne
        },
        tokenFilterRegexArneWithFlagArne = {
            "token": "filter",
            "value": tokenExpressionRegexArneWithFlagArne
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
        tokenBGPABC = {
            "token": "basicgraphpattern",
            "triplesContext": [ tokenTripleABC ]
        },
        tokenPatternABC = {
            "filters": [],
            "patterns": [ tokenBGPABC ],
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
            });
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
                });
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
            assert.equals(Tokenizer.filter('FILTER(?a = 22)'), {
                "filter": tokenFilterAEquals22,
                "remainder": ""
            })
        },
        ".filter, with regex": function () {
            assert.equals(Tokenizer.filter('FILTER regex(?a, "Arne")'), {
                "filter": tokenFilterRegexArne,
                "remainder": ""
            });
            assert.equals(Tokenizer.filter('FILTER regex(?a, "Arne", "Arne")'), {
                "filter": tokenFilterRegexArneWithFlagArne,
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
            assert.equals(Tokenizer["var"]("a"), {
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
                        }),
                        {
                            bgpindex: 0,
                            remainder: "",
                            where: tokenPatternABC
                        }
                    );
                },
                "Pattern: Empty pattern": function () {
                    assert.equals(
                        Tokenizer.where("WHERE { ?a ?b ?c }", {
                            pattern: tokenWhereEmptyPattern,
                            variables: [ "a" ]
                        }),
                        {
                            remainder: "",
                            where: tokenWhereABCWithVariableA
                        }
                    );
                },
                "Pattern: BGP": function () {
                    assert.equals(
                        Tokenizer.where("WHERE { ?a ?b ?c }", {
                            pattern: tokenWhereABCWithVariableA,
                            variables: [ "a" ]
                        }),
                        {
                            remainder: "",
                            where: tokenWhereABCWithVariableAx2
                        }
                    );
                },
                "Pattern: Optional": function () {
                    assert.equals(
                        Tokenizer.where("WHERE { ?a ?b ?c }", {
                            pattern: tokenWhereABCAndOptionalABCWithVariableA,
                            variables: [ "a" ]
                        }),
                        {
                            remainder: "",
                            where: tokenWhereABCAndOptionalABCAndBGPABCWithVariableA
                        }
                    );
                },
                "Pattern: Filter": function () {
                    assert.equals(
                        Tokenizer.where("WHERE { ?a ?b ?c }", {
                            pattern: tokenWhereFilterAEqualsArneAndBGPABCWithVariableA,
                            variables: [ "a" ]
                        }),
                        {
                            remainder: "",
                            where: tokenWhereFilterAEqualsArneAndBGPABCx2WithVariableA
                        }
                    );
                }
            },
            "Inserting optional": {
                "Pattern: BGP": function () {
                    assert.equals(
                        Tokenizer.where("WHERE { OPTIONAL { ?a ?b ?c } }", {
                            pattern: tokenWhereABCWithVariableA,
                            variables: [ "a" ]
                        }),
                        {
                            remainder: "",
                            where: tokenWhereABCAndOptionalABCWithVariableA
                        }
                    );
                },
                "Pattern: Optional": function () {
                    assert.equals(
                        Tokenizer.where("WHERE { OPTIONAL { ?a ?b ?c } }", {
                            pattern: tokenWhereOptionalABCWithVariableA,
                            variables: [ "a" ]
                        }),
                        {
                            remainder: "",
                            where: tokenWhereOptionalABCAndOptionalABCWithVariableA
                        }
                    );
                },
                "Pattern: Filter": function () {
                    assert.equals(
                        Tokenizer.where("WHERE { OPTIONAL { ?a ?b ?c } }", {
                            pattern: tokenWhereFilterAEqualsArneAndBGPABCWithVariableA,
                            variables: [ "a" ]
                        }),
                        {
                            remainder: "",
                            where: tokenWhereFilterAEqualsArneAndBGPABCAndOptionalABCWithVariableA
                        }
                    );
                }
            },
            "Inserting filter": {
                "Pattern: BGP": function () {
                    assert.equals(
                        Tokenizer.where('WHERE { FILTER(?a = "Arne") }', {
                            pattern: tokenWhereABCWithVariableA,
                            variables: [ "a" ]
                        }),
                        {
                            remainder: "",
                            where: tokenWhereFilterAEqualsArneAndBGPABCWithVariableA
                        }
                    );
                },
                "Pattern: Optional": function () {
                    assert.equals(
                        Tokenizer.where('WHERE { FILTER(?a = "Arne") }', {
                            pattern: tokenWhereABCAndOptionalABCWithVariableA,
                            variables: [ "a" ]
                        }),
                        {
                            remainder: "",
                            where: tokenWhereFilterAEqualsArneAndBGPABCAndOptionalABCWithVariableA
                        }
                    );
                },
                "Pattern: Filter": function () {
                    assert.equals(
                        Tokenizer.where('WHERE { FILTER(?a < "Arne") }', {
                            pattern: tokenWhereFilterAEqualsArneAndBGPABCWithVariableA,
                            variables: [ "a" ]
                        }),
                        {
                            remainder: "",
                            where: tokenWhereFilterAEqualsArneAndFilterALesserArneAndBGPABCWithVariableA
                        }
                    );
                }
            }
        }
    });
});