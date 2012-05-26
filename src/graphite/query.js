define([
    "../rdfstore/sparql-parser/sparql_parser",
    "./utils"
], function (SparqlParser, Utils) {
    function assemble(node) {
        switch (node.token) {
            case "basicgraphpattern": return assembleBasicGraphPattern(node);
            case "blank": return assembleBlank(node);
            case "executableunit": return assembleExecutableUnit(node);
            case "expression": return assembleExpression(node);
            case "filter": return assembleFilter(node);
            case "groupgraphpattern": return assembleGroupGraphPattern(node);
            case "literal": return assembleLiteral(node);
            case "optionalgraphpattern": return assembleOptionalGraphPattern(node);
            case "path": return assemblePath(node);
            case "query": return assembleQuery(node);
            case "uri": return assembleUri(node);
            case "var":
            case "variable": return assembleVariable(node);
            default:
                buster.log("DEFAULT", node);
                return node;
        }
    }
    function assembleAdditiveExpression (node) {
        return [
            "(",
            assemble(node.summand),
            Utils.map(node.summands, function(summand) {
                return " {0} {1}".format(summand.operator, assemble(summand.expression));
            }).join(""),
            ")"
        ].join("");
    }
    function assembleAggregate (node) {
        buster.log("assembleAggregate", node);
        return "{0}({1}{2})".format(
            node.aggregateType.toUpperCase(),
            node.distinct ? "DISTINCT " : "",
            assemble(node.expression)
        );
    }
    function assembleAlias (node) {
        return node.token === "var"
            ? assembleVariable(node)
            : node.value
    }
    function assembleAsk (node) {
        return "ASK WHERE { {0} }".format(
            assemble(node.pattern)
        );
    }
    function assembleAtomic (node) {
        return "(" + assemble(node.value) + ")";
    }
    function assembleBase (node) {
        if (!node.base) {
            return null;
        }
        return "BASE <{0}>\n".format(node.base.value);
    }
    function assembleBasicGraphPattern (node) {
        return assembleTripleContext(node.triplesContext);
    }
    function assembleBlank (node) {
        if (node.value[0] === "_") {
            return "[]";
        }
        return "_:" + node.value;
    }
    function assembleBuiltinCall (node) {
        switch (node.builtincall) {
            case "bnode": return assembleBuiltinCallBNode(node);
            case "datatype": return assembleBuiltinCallDatatype(node);
            case "exists": return assembleBuiltinCallExists(node);
            case "if": return assembleBuiltinCallIf(node);
            case "iri": return assembleBuiltinCallIri(node);
            case "lang": return assembleBuiltinCallLang(node);
            case "notexists": return assembleBuiltinCallNotExists(node);
            case "str": return assembleBuiltinCallStr(node);
            case "uri": return assembleBuiltinCallUri(node);
            default:
                throw new Error ("assembleBuiltinCall not supported " + node.builtincall);
        }
    }
    function assembleBuiltinCallBNode (node) {
        return "BNODE({0})".format(
            Utils.map(node.args, function (arg) {
                return assemble(arg);
            }).join("")
        );
    }
    function assembleBuiltinCallDatatype (node) {
        return "datatype" + assemble(node.args[0]);
    }
    function assembleBuiltinCallExists (node) {
        return "EXISTS {\n{0}\n}\n".format(
            assemble(node.args[0])
        );
    }
    function assembleBuiltinCallIf (node) {
        return "IF({0}, {1}, {2})".format(
            assemble(node.args[0]),
            assemble(node.args[1]),
            assemble(node.args[2])
        );
    }
    function assembleBuiltinCallIri (node) {
        return "IRI{0}".format(
            assemble(node.args[0])
        );
    }
    function assembleBuiltinCallLang (node) {
        return "lang({0})".format(
            assemble(node.args[0])
        );
    }
    function assembleBuiltinCallNotExists (node) {
        return "NOT EXISTS {\n{0}\n}\n".format(
            assemble(node.args[0])
        );
    }
    function assembleBuiltinCallStr (node) {
        return "str" + assemble(node.args[0]);
    }
    function assembleBuiltinCallUri (node) {
        return "URI{0}".format(
            assemble(node.args[0])
        );
    }
    function assembleConditionalAnd (node) {
        return "({0} && {1})".format(
            assemble(node.operands[0]),
            assemble(node.operands[1])
        );
    }
    function assembleConditionalOr (node) {
        return "({0} || {1})".format(
            assemble(node.operands[0]),
            assemble(node.operands[1])
        );
    }
    function assembleCreate (node) {
        return "CREATE GRAPH " + assemble(node.destinyGraph);
    }
    function assembleDelete (node) {
        if (!node.delete) {
            return null;
        }
        return "DELETE\n{\n" + assembleTripleContext(node.delete) + "\n}\n";
    }
    function assembleDeleteData (node) {
        return "DELETE DATA\n{\n{0}\n}\n".format(assembleTripleContext(node.quads));
    }
    function assembleExecutableUnit (node) {
        switch(node.kind) {
            case "ask": return assembleAsk(node);
            case "create": return assembleCreate(node);
            case "deletedata": return assembleDeleteData(node);
            case "load": return assembleLoad(node);
            case "select": return assembleSelect(node);
            case "insertdata": return assembleInsertData(node);
            default:
                throw new Error("No support for executable kind " + node.kind);
        }
    }
    function assembleExpression (node) {
        switch(node.expressionType) {
            case "additiveexpression": return assembleAdditiveExpression(node);
            case "aggregate": return assembleAggregate(node);
            case "atomic": return assembleAtomic(node);
            case "builtincall": return assembleBuiltinCall(node);
            case "conditionaland": return assembleConditionalAnd(node);
            case "conditionalor": return assembleConditionalOr(node);
            case "irireforfunction": return assembleIriRefOrFunction(node);
            case "multiplicativeexpression": return assembleMultiplicativeExpression(node);
            case "relationalexpression": return assembleRelationalExpression(node);
            case "unaryexpression": return assembleUnaryExpression(node);
            default:
                throw new Error("NO SUPPORT FOR expressionType " + node.expressionType);
        }
    }
    function assembleFilter (node) {
        //buster.log("FILTER", node);
        return "FILTER {0}".format(
            assemble(node.value)
        );
    }
    function assembleGroup (node) {
        if (!node.group || node.group.length == 0) {
            return null;
        }
        return "GROUP BY " + Utils.map(node.group, function (g) {
            return assemble(g);
        }).join("");
    }
    function assembleGroupGraphPattern (node) {
        return [
            Utils.map(node.patterns, function (pattern) {
                return assemble(pattern);
            }).join("\n"),
            "\n",
            Utils.map(node.filters, function (filter) {
                return assemble(filter);
            }).join("\n")
        ].join("");
    }
    function assembleInsert (node) {
        if (!node.insert) {
            return null;
        }
        return "INSERT\n{\n" + assembleTripleContext(node.insert) + "\n}\n";
    }
    function assembleInsertData (node) {
        return "INSERT DATA\n{\n{0}\n}\n".format(assembleTripleContext(node.quads));
    }
    function assembleIriRefOrFunction (node) {
        return assembleUri(node.iriref);
    }
    function assembleLiteral (node) {
        if (node.type) {
            return node.value;
        }
        return '"{0}"{1}'.format(
            node.value,
            node.lang ? "@" + node.lang : ""
        );
    }
    function assembleLoad (node) {
        buster.log("assembleLoad", node);
        return "LOAD {0}{1}".format(
            assemble(node.sourceGraph),
            node.destinyGraph ? "INTO GRAPH " + assemble(node.destinyGraph) : ""
        );
    }
    function assembleMultiplicativeExpression (node) {
        return [
            assemble(node.factor),
            Utils.map(node.factors, function (factor) {
                return " {0} {1}".format(factor.operator,assemble(factor.expression));
            }).join("")
        ].join("");
    }
    function assembleOptionalGraphPattern (node) {
        return " OPTIONAL { " + assemble(node.value) + " }";
    }
    function assembleOrder (node) {
        if (!node.order || node.order.length === 0) {
            return null;
        }
        return "ORDER BY " + Utils.map(node.order, function (order) {
            return "{0}({1}) ".format(
                order.direction,
                assemble(order.expression)
            );
        }).join(" ");
    }
    function assemblePath (node) {
        switch (node.kind) {
            case "alternative": return assemblePathAlternative(node);
            case "element": return assemblePathElement(node);
            case "inversePath": return assemblePathInversePath(node);
            case "sequence": return assemblePathSequence(node);
            default:
                throw new Error("assemblePath not supported " + node.kind);
        }
    }
    function assemblePathAlternative (node) {
        buster.log("assemblePathAlternative", node);
    }
    function assemblePathElement (node) {
        buster.log("assemblePathElement", node);
        return "({0}){1}".format(
            assemble(node.value),
            Utils.isArray(node.modifier)
                ? Utils.map(Utils.flatten(node.modifier), function (mod) {
                    return assemble(mod)
                }).join("")
                : assemble(node.modifier)
        );
    }
    function assemblePathInversePath (node) {
        buster.log("assemblePathInversePath", node);
        return "^({0})".format(assemble(node.value));
    }
    function assemblePathSequence (node) {
        buster.log("assemblePathSequence", node);
        return Utils.map(node.value, function (v) {
            return assemble(v);
        }).join("/");
    }
    function assembleProjection (node) {
        //buster.log("PROJECTION", node.projection);
        return "SELECT {0}\n".format(
            Utils.map(node.projection, function (project) {
                return assemble(project);
            }).join(" ")
        );
    }
    function assemblePrologue (node) {
        if (!node || !Utils.isObject(node)) {
            return null;
        }
        return [
            assembleBase(node),
            Utils.map(node.prefixes, function (prefix) {
                return "PREFIX {0}: <{1}>\n".format(prefix.prefix, prefix.local);
            }).join("")
        ].join("");
    }
    function assembleQuery (node) {
        return [
            assemblePrologue(node.prologue),
            "\n",
            Utils.map(node.units, function (unit) {
                if (unit.token) {
                    return assemble(unit);
                }
                return [
                    assembleWith(unit),
                    assembleDelete(unit),
                    assembleInsert(unit),
                    assembleUsing(unit),
                    assembleWhere(unit)
                ].join("");
            }).join("\n;\n")
        ].join("");
    }
    function assembleRelationalExpression (node) {
        return "{0} {1} {2}".format(
            assemble(node.op1),
            node.operator,
            assemble(node.op2)
        );
    }
    function assembleSelect (node) {
        return [
            assembleProjection(node),
            assembleWhere(node),
            assembleGroup(node),
            assembleOrder(node)
        ].join("");
    }
    function assembleTripleContext(tripleContext) {
        var graphName,
            graphs = {};
        Utils.each(tripleContext, function (triple) {
            graphName = triple.graph ? assemble(triple.graph) : "default";
            buster.log("GRAPH NAME", graphName);
            if (!graphs[graphName]) {
                graphs[graphName] = [];
            }
            graphs[graphName].push("{0} {1} {2} .".format(
                assemble(triple.subject),
                assemble(triple.predicate),
                assemble(triple.object)
            ));
        });
        return Utils.map(graphs, function (triples, graph) {
            if (graph !== "default") {
                return "GRAPH {0} {{1}}".format(graph, triples.join(""));
            }
            return triples.join("");
        }).join(" . ");
    }
    function assembleUnaryExpression (node) {
        return "(! {0})".format(
            assemble(node.expression)
        );
    }
    function assembleUri (node) {
        if (node.value) {
            return "<{0}>".format(node.value);
        }
        return node.prefix + ":" + node.suffix;
    }
    function assembleUsing (node) {
        if (!node.using) {
            return null;
        }
        return Utils.map(node.using, function (n) {
            switch (n.kind) {
                case "named": return assembleUsingNamed(n);
                case "default": return assembleUsingDefault(n);
                default:
                    buster.log(n);
                    throw new Error("NOT SUPPORTING USING " + n.kind);
            }
        }).join("");
    }
    function assembleUsingDefault (node) {
        return "USING " + assemble(node.uri) + "\n";
    }
    function assembleUsingNamed (node) {
        return "USING NAMED " + assemble(node.uri) + "\n";
    }
    function assembleVariable (node) {
        switch (node.kind) {
            case "aliased":
                return "({0} AS {1})".format(assembleExpression(node.expression), assembleAlias(node.alias));
            case "var":
                return assemble(node.value);
            case "*":
                return node.kind;
            default:
                //buster.log("VARIABLE", node);
                return "?" + node.value;
        }
    }
    function assembleWhere (node) {
        if(!node.pattern) {
            return null;
        }return [
            "WHERE\n{\n",
            assemble(node.pattern),
            "\n}"
        ].join("");
    }
    function assembleWith (node) {
        if (!node.with) {
            return null;
        }
        return "WITH " + assemble(node.with) + " ";
    }
    var query = function (queryString) {
        return new query.prototype.init(queryString);
    };
    query.prototype = {
        init: function (queryString) {
            if(queryString) {
                Utils.extend(this, SparqlParser.parser.parse(queryString));
                return this;
            }
        },
        getTriples: function (query) {
            var tripleRegex = /<(_:[0-9]+|http:\/\/[a-zA-Z0-9#_\-.\/]+)>\s+<http:\/\/[a-zA-Z0-9#_\-.\/]+>\s+("[a-zA-Z0-9\s\-_\/]+"\^\^<http:\/\/[a-zA-Z0-9#_\-.\/]+>|"[a-zA-Z0-9\s\-_\/]+"|<(_:[0-9]+|http:\/\/[a-zA-Z0-9#_\-.\/]+|)>)\s*[.]?/g,
                triples = query.match(tripleRegex);
            return triples !== null ? triples : [];
        },
        run: function () {
            return assemble(this);
        },
        select: function (part) {
            buster.log(part);
        },
        where: function (part) {
            buster.log(part);
        }
    };
    query.prototype.init.prototype = query.prototype;
    return query;
});