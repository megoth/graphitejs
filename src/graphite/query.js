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
            var unitindex = 0;
            this.options = {
                basicgraphpatternindex: 0,
                modifiedPattern: false,
                unitindex: unitindex
            };
            if(queryString) {
                console.log("IN QUERY, INIT, WITH", queryString);
                this.syntaxTree = SparqlParser.parser.parse(queryString);
                unitindex = findUnit(this.syntaxTree);
                this.options = Utils.extend({}, {
                    basicgraphpatternindex: findBGP(this.syntaxTree, unitindex),
                    modifiedPattern: true,
                    unitindex: unitindex,
                    variables: Utils.map(this.syntaxTree.units[unitindex].projection, function (p) {
                        console.log("TEST", p);
                        if (p.kind === "*") {
                            return p.kind;
                        } else if (p.kind === "aliased") {
                            return p.alias.value;
                        }
                        return p.value.value;
                    })
                });
            } else {
                console.log("IN QUERY, INIT, WITHOUT");
                this.syntaxTree = SparqlParser.parser.parse("SELECT * WHERE { ?subject ?predicate ?object }");
            }
            console.log("IN QUERY, INIT", this.syntaxTree.units[unitindex].pattern);
            this.prefixes = {};
            return this;
        },
        base: function (value) {
            var token = Tokenizer.base(value).base;
            this.syntaxTree.prologue.base = token;
            this.options.base = token.value;
            return this;
        },
        filter: function (filter) {
            var modifiedPattern = this.options.modifiedPattern;
            this.where("FILTER(" + filter + ")");
            this.options.modifiedPattern = modifiedPattern;
            return this;
            /*
            var token = Tokenizer.where("WHERE {FILTER({0})}".format(filter), options).filter,
                pattern = this.syntaxTree.units[0].pattern;
            pattern.filters = pattern.filters ? pattern.filters.concat(token) : [ token ];
            */
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
            var options = Utils.clone(this.options);
            options.pattern = this.syntaxTree.units[options.unitindex].pattern
            console.log("IN QUERY, WHERE", pattern, options);
            if (options.modifiedPattern && options.basicgraphpatternindex !== null) {
                if (options.pattern.patterns) {
                    options.triplesContext = options.pattern
                        .patterns[options.basicgraphpatternindex].triplesContext;
                }
            }
            pattern = "WHERE {" + pattern + "}";
            this.syntaxTree.units[options.unitindex].pattern = Tokenizer.where(pattern, options).where;
            this.options.modifiedPattern = true;
            return this;
        }
    };
    query.prototype.init.prototype = query.prototype;
    return query;
});