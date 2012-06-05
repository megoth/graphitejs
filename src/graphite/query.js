define([
    "../rdfstore/sparql-parser/sparql_parser",
    "./tokenizer/sparql",
    "./utils"
], function (SparqlParser, Tokenizer, Utils) {
    function findBGP(syntaxTree, unitindex) {
        var basicgraphpatternindex = null;
        if (syntaxTree.units[unitindex].pattern) {
            Utils.each(syntaxTree.units[unitindex].pattern.patterns, function (pattern, i) {
                if (pattern.token === "basicgraphpattern") {
                    basicgraphpatternindex = i;
                }
            });
        }
        return basicgraphpatternindex;
    }
    function findUnit(syntaxTree) {
        return syntaxTree.units.length - 1;
    }
    var query = function (queryString) {
        return new query.prototype.init(queryString);
    };
    query.prototype = {
        init: function (queryString) {
            this.options = {
                basicgraphpatternindex: 0,
                modifiedPattern: false,
                unitindex: 0
            };
            if(queryString) {
                this.syntaxTree = SparqlParser.parser.parse(queryString);
                this.options.unitindex = findUnit(this.syntaxTree);
                this.options.basicgraphpatternindex = findBGP(this.syntaxTree, this.options.unitindex);
                this.options.modifiedPattern = true;
            } else {
                this.syntaxTree = SparqlParser.parser.parse("SELECT * WHERE { ?subject ?predicate ?object }");
            }
            this.prefixes = {};
            this.patterns = {};
            return this;
        },
        base: function (value) {
            var token = Tokenizer.base(value).base;
            this.syntaxTree.prologue.base = token;
            this.options.base = token.value;
            return this;
        },
        filter: function (filter) {
            var token = Tokenizer.filter("FILTER({0})".format(filter)).filter,
                pattern = this.syntaxTree.units[0].pattern;
            pattern.filters = pattern.filters ? pattern.filters.concat(token) : [ token ];
            return this;
        },
        group: function (group) {
            group = Tokenizer.group(group).group;
            this.syntaxTree.units[this.options.unitindex].group = group;
        },
        optional: function (optional) {
            var token = Tokenizer.optional("OPTIONAL { " + optional + " }").optional;
            this.syntaxTree.units[this.options.unitindex].pattern.patterns.push(token);
            return this;
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
            this.syntaxTree.units[this.options.unitindex].projection = Tokenizer.projection(projection).projection;
            return this;
        },
        where: function (pattern) {
            if (this.options.modifiedPattern && this.options.basicgraphpatternindex !== null) {
                this.options.triplesContext = this.syntaxTree.units[this.options.unitindex]
                    .pattern.patterns[this.options.basicgraphpatternindex]
                    .triplesContext;
                //buster.log("IN QUERY, WHERE OPTIONS", this.options);
            }
            this.syntaxTree.units[this.options.unitindex].pattern = Tokenizer.pattern(pattern, this.options).pattern;
            this.options.modifiedPattern = true;
            //buster.log("IN QUERY, WHERE", this.syntaxTree);
            return this;
        }
    };
    query.prototype.init.prototype = query.prototype;
    return query;
});