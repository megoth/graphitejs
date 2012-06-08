define([
    "../rdfstore/sparql-parser/sparql_parser",
    "./tokenizer/sparql",
    "./utils"
], function (SparqlParser, Tokenizer, Utils) {
    function findBGP(pattern) {
        var bgpindex = null;
        Utils.each(pattern.patterns, function (p, i) {
            if (p.token === "basicgraphpattern") {
                bgpindex = i;
            }
        });
        return bgpindex;
    }
    function findUnit(syntaxTree) {
        return syntaxTree.units.length - 1;
    }
    var query = function (queryString) {
        return new query.prototype.init(queryString);
    };
    query.prototype = {
        init: function (queryString) {
            this.prologueBase = null;
            this.bgpindex = null;
            this.pattern = null;
            this.prefixes = {};
            this.projection = null;
            this.variables = [];
            this.unitGroup = null;
            this.unitindex = 0;
            if(queryString) {
                console.log("IN QUERY, INIT, WITH", queryString);
                this.syntaxTree = SparqlParser.parser.parse(queryString);
                if (this.syntaxTree.kind === "query") {
                    this.unitindex = findUnit(this.syntaxTree);
                    this.pattern = this.syntaxTree.units[this.unitindex].pattern;
                    this.projection = this.syntaxTree.units[this.unitindex].projection;
                    this.bgpindex = findBGP(this.pattern);
                    this.variables = Utils.map(this.projection, function (p) {
                        console.log("TEST", p);
                        if (p.kind === "*") {
                            return p.kind;
                        } else if (p.kind === "aliased") {
                            return p.alias.value;
                        }
                        return p.value.value;
                    });
                }
            } else {
                console.log("IN QUERY, INIT, WITHOUT");
                this.syntaxTree = SparqlParser.parser.parse("SELECT * WHERE { ?subject ?predicate ?object }");
            }
            return this;
        },
        base: function (value) {
            this.prologueBase = Tokenizer.base(value).base;
            return this;
        },
        filter: function (filter) {
            return this.where("FILTER(" + filter + ")");
        },
        group: function (group) {
            this.unitGroup = Tokenizer.group(group).group;
            return this;
        },
        optional: function (optional) {
            return this.where("OPTIONAL { " + optional + " }");
        },
        prefix: function (prefix, local) {
            if (!this.prefixes[prefix]) {
                var token = Tokenizer.prefix("{0}: <{1}>".format(prefix, local));
                this.prefixes[prefix] = token.prefix;
            }
            return this;
        },
        retrieveTree: function () {
            console.log("IN QUERY, RETRIEVE TREE", this.prologueBase);
            if (this.prologueBase) {
                console.log("IN QUERY, RETRIEVE TREE BASE");
                this.syntaxTree.prologue.base = this.prologueBase;
            }
            if (this.pattern) {
                this.syntaxTree.units[this.unitindex].pattern = this.pattern;
            }
            if (Utils.size(this.prefixes) > 0) {
                this.syntaxTree.prologue.prefixes = Utils.toArray(this.prefixes);
            }
            if (this.projection) {
                this.syntaxTree.units[this.unitindex].projection = this.projection;
            }
            if (this.unitGroup) {
                this.syntaxTree.units[this.unitindex].group = this.unitGroup;
            }
            return this.syntaxTree;
        },
        select: function (projection) {
            this.projection = Tokenizer.projection(projection).projection;
            return this;
        },
        where: function (pattern) {
            var where = Tokenizer.where("WHERE {" + pattern + "}", {
                bgpindex: this.bgpindex,
                pattern: this.pattern
            });
            this.bgpindex = Utils.isNumber(where.bgpindex) ? where.bgpindex : this.bgpindex;
            this.pattern = where.where;
            return this;
        }
    };
    query.prototype.init.prototype = query.prototype;
    return query;
});