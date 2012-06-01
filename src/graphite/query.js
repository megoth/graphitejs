define([
    "../rdfstore/sparql-parser/sparql_parser",
    "./tokenizer/sparql",
    "./utils"
], function (SparqlParser, Tokenizer, Utils) {
    var query = function (queryString) {
        return new query.prototype.init(queryString);
    };
    function mergePatterns(objA, objB) {
        if (objB.patterns[0]) {
            buster.log(objA, objB);
            if (objA.patterns[0]) {
                Utils.each(objB.patterns[0].triplesContext, function (triplesContext) {
                    objA.patterns[0].triplesContext.push(triplesContext);
                });
            } else {
                objA.patterns = objB.patterns;
            }
        }
        objA.filters = objA.filters.concat(objB.filters);
        return objA;
    }
    query.prototype = {
        init: function (queryString) {
            if(queryString) {
                this.syntaxTree = SparqlParser.parser.parse(queryString);
            } else {
                this.syntaxTree = SparqlParser.parser.parse("SELECT * WHERE { ?subject ?predicate ?object }");
            }
            this.currentUnit = 0;
            this.modifiedPattern = false;
            this.prefixes = {};
            this.patterns = {};
            return this;
        },
        base: function (value) {
            this.syntaxTree.prologue.base = Tokenizer.base(value).base;
            return this;
        },
        filter: function (filter) {
            var token = Tokenizer.filter("FILTER({0})".format(filter)).filter;
            this.syntaxTree.units[0].pattern = mergePatterns(this.syntaxTree.units[0].pattern, {
                "filters": [ token ],
                "patterns": [],
                "token": "groupgraphpattern"
            });
            return this;
        },
        group: function (group) {
            var group = Tokenizer.group(group).group;
            this.syntaxTree.units[0].group = group;
        },
        prefix: function (prefix, local) {
            if (!this.prefixes[prefix]) {
                var token = Tokenizer.prefix("{0}: <{1}>".format(prefix, local));
                this.prefixes[prefix] = token;
                this.syntaxTree.prologue.prefixes.push(token.prefix);
            }
            return this;
        },
        retrieveTree: function () {
            return this.syntaxTree;
        },
        select: function (projection) {
            this.syntaxTree.units[0].projection = Tokenizer.projection(projection).projection;
            return this;
        },
        where: function (pattern) {
            var token = Tokenizer.pattern(pattern).pattern;
            if (!this.modifiedPattern) {
                this.syntaxTree.units[0].pattern = token;
                this.modifiedPattern = true;
                this.patterns[pattern] = token;
                return this;
            }
            this.syntaxTree.units[0].pattern = mergePatterns(this.syntaxTree.units[0].pattern, token);
            return this;
        }
    };
    query.prototype.init.prototype = query.prototype;
    return query;
});