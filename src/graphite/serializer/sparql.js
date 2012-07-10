/*global define */
define([
    "../utils"
], function (Utils) {
    "use strict";
    var sparql = function (syntaxTree) {
        return sparql.assemble(syntaxTree);
    };
    sparql.assemble = function (node) {
        switch (node.token) {
        case "basicgraphpattern":
            return sparql.assembleBasicGraphPattern(node);
        case "blank":
            return sparql.assembleBlank(node);
        case "executableunit":
            return sparql.assembleExecutableUnit(node);
        case "expression":
            return sparql.assembleExpression(node);
        case "filter":
            return sparql.assembleFilter(node);
        case "groupgraphpattern":
            return sparql.assembleGroupGraphPattern(node);
        case "literal":
            return sparql.assembleLiteral(node);
        case "optionalgraphpattern":
            return sparql.assembleOptionalGraphPattern(node);
        case "path":
            return sparql.assemblePath(node);
        case "query":
            return sparql.assembleQuery(node);
        case "uri":
            return sparql.assembleUri(node);
        case "var":
        case "variable":
            return sparql.assembleVariable(node);
        default:
            return node;
        }
    };
    sparql.assembleAdditiveExpression = function (node) {
        return [
            "(",
            sparql.assemble(node.summand),
            Utils.map(node.summands, function (summand) {
                return " {0} {1}".format(summand.operator, sparql.assemble(summand.expression));
            }).join(""),
            ")"
        ].join("");
    };
    sparql.assembleAggregate = function (node) {
        //console.log("assembleAggregate", node);
        return "{0}({1}{2})".format(
            node.aggregateType.toUpperCase(),
            node.distinct ? "DISTINCT " : "",
            sparql.assemble(node.expression)
        );
    };
    sparql.assembleAlias = function (node) {
        return node.token === "var"
            ? sparql.assembleVariable(node)
            : node.value;
    };
    sparql.assembleAsk = function (node) {
        return "ASK WHERE { {0} }".format(
            sparql.assemble(node.pattern)
        );
    };
    sparql.assembleAtomic = function (node) {
        return "(" + sparql.assemble(node.value) + ")";
    };
    sparql.assembleBase = function (node) {
        if (!node.base) {
            return null;
        }
        return "BASE <{0}>\n".format(node.base.value);
    };
    sparql.assembleBasicGraphPattern = function (node) {
        return sparql.assembleTripleContext(node.triplesContext);
    };
    sparql.assembleBlank = function (node) {
        if (node.value[0] === "_") {
            return "[]";
        }
        return "_:" + node.value;
    };
    sparql.assembleBuiltinCall = function (node) {
        switch (node.builtincall) {
        case "bnode":
            return sparql.assembleBuiltinCallBNode(node);
        case "datatype":
            return sparql.assembleBuiltinCallDatatype(node);
        case "exists":
            return sparql.assembleBuiltinCallExists(node);
        case "if":
            return sparql.assembleBuiltinCallIf(node);
        case "iri":
            return sparql.assembleBuiltinCallIri(node);
        case "lang":
            return sparql.assembleBuiltinCallLang(node);
        case "notexists":
            return sparql.assembleBuiltinCallNotExists(node);
        case "str":
            return sparql.assembleBuiltinCallStr(node);
        case "uri":
            return sparql.assembleBuiltinCallUri(node);
        default:
            throw new Error("assembleBuiltinCall not supported " + node.builtincall);
        }
    };
    sparql.assembleBuiltinCallBNode = function (node) {
        return "BNODE({0})".format(
            Utils.map(node.args, function (arg) {
                return sparql.assemble(arg);
            }).join("")
        );
    };
    sparql.assembleBuiltinCallDatatype = function (node) {
        return "datatype" + sparql.assemble(node.args[0]);
    };
    sparql.assembleBuiltinCallExists = function (node) {
        return "EXISTS {\n{0}\n}\n".format(
            sparql.assemble(node.args[0])
        );
    };
    sparql.assembleBuiltinCallIf = function (node) {
        return "IF({0}, {1}, {2})".format(
            sparql.assemble(node.args[0]),
            sparql.assemble(node.args[1]),
            sparql.assemble(node.args[2])
        );
    };
    sparql.assembleBuiltinCallIri = function (node) {
        return "IRI{0}".format(
            sparql.assemble(node.args[0])
        );
    };
    sparql.assembleBuiltinCallLang = function (node) {
        return "lang({0})".format(
            sparql.assemble(node.args[0])
        );
    };
    sparql.assembleBuiltinCallNotExists = function (node) {
        return "NOT EXISTS {\n{0}\n}\n".format(
            sparql.assemble(node.args[0])
        );
    };
    sparql.assembleBuiltinCallStr = function (node) {
        return "str" + sparql.assemble(node.args[0]);
    };
    sparql.assembleBuiltinCallUri = function (node) {
        return "URI{0}".format(
            sparql.assemble(node.args[0])
        );
    };
    sparql.assembleConditionalAnd = function (node) {
        return "({0} && {1})".format(
            sparql.assemble(node.operands[0]),
            sparql.assemble(node.operands[1])
        );
    };
    sparql.assembleConditionalOr = function (node) {
        return "({0} || {1})".format(
            sparql.assemble(node.operands[0]),
            sparql.assemble(node.operands[1])
        );
    };
    sparql.assembleCreate = function (node) {
        return "CREATE GRAPH " + sparql.assemble(node.destinyGraph);
    };
    sparql.assembleDelete = function (node) {
        if (!node["delete"]) {
            return null;
        }
        return "DELETE\n{\n" + sparql.assembleTripleContext(node["delete"]) + "\n}\n";
    };
    sparql.assembleDeleteData = function (node) {
        return "DELETE DATA\n{\n{0}\n}\n".format(sparql.assembleTripleContext(node.quads));
    };
    sparql.assembleExecutableUnit = function (node) {
        switch (node.kind) {
        case "ask":
            return sparql.assembleAsk(node);
        case "create":
            return sparql.assembleCreate(node);
        case "deletedata":
            return sparql.assembleDeleteData(node);
        case "load":
            return sparql.assembleLoad(node);
        case "select":
            return sparql.assembleSelect(node);
        case "insertdata":
            return sparql.assembleInsertData(node);
        default:
            throw new Error("No support for executable kind " + node.kind);
        }
    };
    sparql.assembleExpression = function (node) {
        switch (node.expressionType) {
        case "additiveexpression":
            return sparql.assembleAdditiveExpression(node);
        case "aggregate":
            return sparql.assembleAggregate(node);
        case "atomic":
            return sparql.assembleAtomic(node);
        case "builtincall":
            return sparql.assembleBuiltinCall(node);
        case "conditionaland":
            return sparql.assembleConditionalAnd(node);
        case "conditionalor":
            return sparql.assembleConditionalOr(node);
        case "irireforfunction":
            return sparql.assembleIriRefOrFunction(node);
        case "multiplicativeexpression":
            return sparql.assembleMultiplicativeExpression(node);
        case "relationalexpression":
            return sparql.assembleRelationalExpression(node);
        case "unaryexpression":
            return sparql.assembleUnaryExpression(node);
        default:
            throw new Error("NO SUPPORT FOR expressionType " + node.expressionType);
        }
    };
    sparql.assembleFilter = function (node) {
        //console.log("FILTER", node);
        return "FILTER {0}".format(
            sparql.assemble(node.value)
        );
    };
    sparql.assembleGroup = function (node) {
        if (!node.group || node.group.length === 0) {
            return null;
        }
        return "GROUP BY " + Utils.map(node.group, function (g) {
            return sparql.assemble(g);
        }).join("");
    };
    sparql.assembleGroupGraphPattern = function (node) {
        return [
            Utils.map(node.patterns, function (pattern) {
                return sparql.assemble(pattern);
            }).join("\n"),
            "\n",
            Utils.map(node.filters, function (filter) {
                return sparql.assemble(filter);
            }).join("\n")
        ].join("");
    };
    sparql.assembleInsert = function (node) {
        if (!node.insert) {
            return null;
        }
        return "INSERT\n{\n" + sparql.assembleTripleContext(node.insert) + "\n}\n";
    };
    sparql.assembleInsertData = function (node) {
        return "INSERT DATA\n{\n{0}\n}\n".format(sparql.assembleTripleContext(node.quads));
    };
    sparql.assembleIriRefOrFunction = function (node) {
        return sparql.assembleUri(node.iriref);
    };
    sparql.assembleLiteral = function (node) {
        if (node.type) {
            return node.value;
        }
        return '"{0}"{1}'.format(
            node.value,
            node.lang ? "@" + node.lang : ""
        );
    };
    sparql.assembleLoad = function (node) {
        //console.log("assembleLoad", node);
        return "LOAD {0}{1}".format(
            sparql.assemble(node.sourceGraph),
            node.destinyGraph ? "INTO GRAPH " + sparql.assemble(node.destinyGraph) : ""
        );
    };
    sparql.assembleMultiplicativeExpression = function (node) {
        return [
            sparql.assemble(node.factor),
            Utils.map(node.factors, function (factor) {
                return " {0} {1}".format(factor.operator, sparql.assemble(factor.expression));
            }).join("")
        ].join("");
    };
    sparql.assembleOptionalGraphPattern = function (node) {
        return " OPTIONAL { " + sparql.assemble(node.value) + " }";
    };
    sparql.assembleOrder = function (node) {
        if (!node.order || node.order.length === 0) {
            return null;
        }
        return "ORDER BY " + Utils.map(node.order, function (order) {
            return "{0}({1}) ".format(
                order.direction,
                sparql.assemble(order.expression)
            );
        }).join(" ");
    };
    sparql.assemblePath = function (node) {
        switch (node.kind) {
        case "alternative":
            return sparql.assemblePathAlternative(node);
        case "element":
            return sparql.assemblePathElement(node);
        case "inversePath":
            return sparql.assemblePathInversePath(node);
        case "sequence":
            return sparql.assemblePathSequence(node);
        default:
            throw new Error("assemblePath not supported " + node.kind);
        }
    };
    sparql.assemblePathAlternative = function () {
        //console.log("assemblePathAlternative", node);
    };
    sparql.assemblePathElement = function (node) {
        //console.log("assemblePathElement", node);
        return "({0}){1}".format(
            sparql.assemble(node.value),
            Utils.isArray(node.modifier)
                ? Utils.map(Utils.flatten(node.modifier), function (mod) {
                    return sparql.assemble(mod);
                }).join("")
                : sparql.assemble(node.modifier)
        );
    };
    sparql.assemblePathInversePath = function (node) {
        //console.log("assemblePathInversePath", node);
        return "^({0})".format(sparql.assemble(node.value));
    };
    sparql.assemblePathSequence = function (node) {
        //console.log("assemblePathSequence", node);
        return Utils.map(node.value, function (v) {
            return sparql.assemble(v);
        }).join("/");
    };
    sparql.assembleProjection = function (node) {
        //console.log("PROJECTION", node.projection);
        return "SELECT {0}\n".format(
            Utils.map(node.projection, function (project) {
                return sparql.assemble(project);
            }).join(" ")
        );
    };
    sparql.assemblePrologue = function (node) {
        if (!node || !Utils.isObject(node)) {
            return null;
        }
        return [
            sparql.assembleBase(node),
            Utils.map(node.prefixes, function (prefix) {
                return "PREFIX {0}: <{1}>\n".format(prefix.prefix, prefix.local);
            }).join("")
        ].join("");
    };
    sparql.assembleQuery = function (node) {
        return [
            sparql.assemblePrologue(node.prologue),
            "\n",
            Utils.map(node.units, function (unit) {
                if (unit.token) {
                    return sparql.assemble(unit);
                }
                return [
                    sparql.assembleWith(unit),
                    sparql.assembleDelete(unit),
                    sparql.assembleInsert(unit),
                    sparql.assembleUsing(unit),
                    sparql.assembleWhere(unit)
                ].join("");
            }).join("\n;\n")
        ].join("");
    };
    sparql.assembleRelationalExpression = function (node) {
        return "{0} {1} {2}".format(
            sparql.assemble(node.op1),
            node.operator,
            sparql.assemble(node.op2)
        );
    };
    sparql.assembleSelect = function (node) {
        return [
            sparql.assembleProjection(node),
            sparql.assembleWhere(node),
            sparql.assembleGroup(node),
            sparql.assembleOrder(node)
        ].join("");
    };
    sparql.assembleTripleContext = function (tripleContext) {
        var graphName,
            graphs = {};
        Utils.each(tripleContext, function (triple) {
            graphName = triple.graph ? sparql.assemble(triple.graph) : "default";
            //console.log("GRAPH NAME", graphName);
            if (!graphs[graphName]) {
                graphs[graphName] = [];
            }
            graphs[graphName].push("{0} {1} {2} .".format(
                sparql.assemble(triple.subject),
                sparql.assemble(triple.predicate),
                sparql.assemble(triple.object)
            ));
        });
        return Utils.map(graphs, function (triples, graph) {
            if (graph !== "default") {
                return "GRAPH {0} {{1}}".format(graph, triples.join(""));
            }
            return triples.join("");
        }).join(" . ");
    };
    sparql.assembleUnaryExpression = function (node) {
        return "(! {0})".format(
            sparql.assemble(node.expression)
        );
    };
    sparql.assembleUri = function (node) {
        if (node.value) {
            return "<{0}>".format(node.value);
        }
        return node.prefix + ":" + node.suffix;
    };
    sparql.assembleUsing = function (node) {
        if (!node.using) {
            return null;
        }
        return Utils.map(node.using, function (n) {
            switch (n.kind) {
            case "named":
                return sparql.assembleUsingNamed(n);
            case "default":
                return sparql.assembleUsingDefault(n);
            default:
                //console.log(n);
                throw new Error("NOT SUPPORTING USING " + n.kind);
            }
        }).join("");
    };
    sparql.assembleUsingDefault = function (node) {
        return "USING " + sparql.assemble(node.uri) + "\n";
    };
    sparql.assembleUsingNamed = function (node) {
        return "USING NAMED " + sparql.assemble(node.uri) + "\n";
    };
    sparql.assembleVariable = function (node) {
        switch (node.kind) {
        case "aliased":
            return "({0} AS {1})".format(sparql.assembleExpression(node.expression), sparql.assembleAlias(node.alias));
        case "var":
            return sparql.assemble(node.value);
        case "*":
            return node.kind;
        default:
            //console.log("VARIABLE", node);
            return "?" + node.value;
        }
    };
    sparql.assembleWhere = function (node) {
        if (!node.pattern) {
            return null;
        }
        return [
            "WHERE\n{\n",
            sparql.assemble(node.pattern),
            "\n}"
        ].join("");
    };
    sparql.assembleWith = function (node) {
        if (!node["with"]) {
            return null;
        }
        return "WITH " + sparql.assemble(node["with"]) + " ";
    };
    return sparql;
});