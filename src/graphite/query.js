define([
    "../rdfstore/sparql-parser/sparql_parser",
    "./tokenizer/sparql",
    "./utils"
], function (SparqlParser, Tokenizer, Utils) {
    var query = function (queryString) {
        return new query.prototype.init(queryString);
    };
    query.prototype = {
        init: function (queryString) {
            if(queryString) {
                this.syntaxTree = SparqlParser.parser.parse(queryString);
            } else {
                this.syntaxTree = SparqlParser.parser.parse("SELECT * WHERE { ?subject ?predicate ?object }");
            }
            this.modifiedPattern = false;
            this.prefixes = {};
            this.patterns = {};
            return this;
        },
        base: function (value) {
            this.syntaxTree.prologue.base = Tokenizer.base(value).base;
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
            if (this.patterns[pattern]) {
                return this;
            }
            this.patterns[pattern] = token;
            var patterns = Utils.toArray(this.patterns);
            pattern = patterns.shift();
            Utils.each(patterns, function (p1) {
                Utils.each(p1.patterns, function (p2) {
                    pattern.patterns[0].triplesContext = pattern.patterns[0].triplesContext.concat(p2.triplesContext);
                });
            });
            return this;
        }
    };
    query.prototype.init.prototype = query.prototype;
    return query;
});