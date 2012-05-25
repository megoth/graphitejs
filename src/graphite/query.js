define([
    "../rdfstore/sparql-parser/sparql_parser",
    "./utils"
], function (SparqlParser, Utils) {
    function assemble(node) {
        switch (node.token) {
            case "basicgraphpattern":
                return assembleBasicGraphPattern(node);
            case "executableunit":
                return assembleExecutableUnit(node);
            case "expression":
                return assembleExpression(node);
            case "groupgraphpattern":
                return assembleGroupGraphPattern(node);
            case "literal":
                return assembleLiteral(node);
            case "query":
                return assembleQuery(node);
            case "uri":
                return assembleUri(node);
            case "var":
            case "variable":
                return assembleVariable(node);
            default:
                throw new Error("Token not supported yet " + node.token);
        }
    }
    function assembleAdditiveExpression (node) {
        var query = "";
        query += assemble(node.summand);
        Utils.each(node.summands, function(summand) {
            query += " {0} {1}".format(summand.operator, assemble(summand.expression));
        });
        return query;
    }
    function assembleAggregate (node) {
        var agg;
        switch (node.aggregateType) {
            case "avg":
                agg = "AVG({0})";
                break;
            case "max":
                agg = "MAX({0})";
                break;
            case "min":
                agg = "MIN({0})";
                break;
            default:
                throw new Error("Aggregation type not supported " + node.aggregateType);
        }
        return agg.format(assemble(node.expression));
    }
    function assembleAlias (node) {
        return node.token === "var"
            ? assembleVariable(node)
            : node.value
    }
    function assembleBasicGraphPattern (node) {
        return Utils.map(node.triplesContext, function (triple) {
            return "{0} {1} {2}".format(assemble(triple.subject),
                assemble(triple.predicate),
                assemble(triple.object));
        }).join(" . ");
    }
    function assembleExecutableUnit (node) {
        switch(node.kind) {
            case "select":
                return assembleSelect (node);
            default:
                throw new Error("No support for executable kind " + node.kind);
        }
    }
    function assembleExpression (node) {
        switch(node.expressionType) {
            case "additiveexpression":
                return assembleAdditiveExpression(node);
            case "aggregate":
                return assembleAggregate(node);
            case "atomic":
                return assemble(node.value);
            case "multiplicativeexpression":
                return assembleMultiplicativeExpression(node);
            default:
                throw new Error("NO SUPPORT FOR expressionType " + node.expressionType);
        }
    }
    function assembleGroup (node) {
        return Utils.map(node, function (g) {
            return assemble(g);
        });
    }
    function assembleGroupGraphPattern (node) {
        return Utils.map(node.patterns, function (pattern) {
            return assemble(pattern);
        });
    }
    function assembleLiteral (node) {
        return node.value;
    }
    function assembleMultiplicativeExpression (node) {
        var query = "";
        query += assemble(node.factor);
        Utils.each(node.factors, function (factor) {
            query += " {0} {1}".format(factor.operator,assemble(factor.expression));
        });
        return query;
    }
    function assembleProjection (node) {
        return Utils.map(node, function (project) {
            return assemble(project);
        }).join(" ");
    }
    function assemblePrologue (node) {
        var result = "";
        if (!node || !Utils.isObject(node)) {
            return result;
        }
        if (node.base) {
            buster.log("NO BASE YET!");
        }
        if (node.prefixes) {
            Utils.each(node.prefixes, function (prefix) {
                result += "PREFIX {0}: <{1}> ".format(prefix.prefix, prefix.local);
            });
        }
        return result;
    }
    function assembleQuery (node) {
        var prologue = assemblePrologue(node.prologue),
            query = "";
        Utils.each(node.units, function (unit) {
            query += assemble(unit);
        });
        return prologue + query;
    }
    function assembleSelect (node) {
        var query = "SELECT ";
        query += assembleProjection(node.projection);
        query += " WHERE { {0} }".format(assemble(node.pattern));
        if (node.group.length > 0) {
            query += " GROUP BY " + assembleGroup(node.group);
        }
        return query;
    }
    function assembleUri (node) {
        if (node.value) {
            return node.value;
        }
        return node.prefix + ":" + node.suffix;
    }
    function assembleVariable (node) {
        switch (node.kind) {
            case "aliased":
                return "({0} AS {1})".format(assembleExpression(node.expression), assembleAlias(node.alias));
            case "var":
                return assemble(node.value);
            default:
                return "?" + node.value;
        }
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