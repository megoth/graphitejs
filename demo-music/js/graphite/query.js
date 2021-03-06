define([
    "./loader",
    "../rdfstore/sparql-parser/sparql_parser",
    "./tokenizer/sparql",
    "./utils",
    "./when"
], function (Loader, SparqlParser, Tokenizer, Utils, When) {
    var sparqlRegex = /^(#|ADD|ASK|BASE|CONSTRUCT|COPY|CLEAR|CREATE|DESCRIBE|DELETE|DROP|INSERT|LOAD|MOVE|PREFIX|SELECT|WITH)/;
    function cleanArg(str) {
        if (Utils.isString(str)) {
            return str.replace(/"/g, '\\"');
        }
        return str;
    }
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
    function format(queryString, args, numOfParam) {
        args = Utils.toArray(args).slice(numOfParam);
        if (args.length > 0) {
            args.push(cleanArg);
            queryString = String.prototype.format.apply(queryString, args);
        }
        //console.debug("IN QUERY, FORMAT QUERY STRING", queryString);
        return queryString;
    }
    function initiateQuery(queryString, deferred) {
        //console.log("IN QUERY, initiateQuery", queryString);
        this.syntaxTree = SparqlParser.parser.parse(queryString);
        if (this.syntaxTree.kind === "query") {
            this.unitindex = findUnit(this.syntaxTree);
            this.pattern = this.syntaxTree.units[this.unitindex].pattern;
            this.projection = this.syntaxTree.units[this.unitindex].projection;
            this.bgpindex = findBGP(this.pattern);
            this.variables = Utils.map(this.projection, function (p) {
                if (p.kind === "*") {
                    return p.kind;
                } else if (p.kind === "aliased") {
                    return p.alias.value;
                }
                return p.value.value;
            });
        }
        deferred.resolve(true);
    }
    function tokenWhere(pattern) {
        //console.log("IN QUERY, tokenWhere", this);
        var where = Tokenizer.where("WHERE {" + pattern + "}", {
            bgpindex: this.bgpindex,
            pattern: this.pattern
        });
        this.bgpindex = Utils.isNumber(where.bgpindex) ? where.bgpindex : this.bgpindex;
        this.pattern = where.where;
    }
    var Query = function (queryString) {
        return new Query.prototype.init(queryString);
    };
    Query.prototype = {
        init: function (queryStringOrUri) {
            var self = this,
                deferred = When.defer();
            this.prologueBase = null;
            this.bgpindex = null;
            this.pattern = null;
            this.prefixes = {};
            this.projection = null;
            this.variables = [];
            this.unitGroup = null;
            this.unitindex = 0;
            if(queryStringOrUri && Utils.isString(queryStringOrUri) && sparqlRegex.test(queryStringOrUri)) {
                queryStringOrUri = format(queryStringOrUri, arguments, 1);
                //console.log("IN QUERY, INIT, WITH", queryStringOrUri);
                initiateQuery.call(this, queryStringOrUri, deferred);
            } else if (queryStringOrUri && Utils.isString(queryStringOrUri)) {
                //console.log("IN QUERY, INIT, URI", queryStringOrUri);
                Loader({
                    asynchronous: false,
                    success: function (err, data) {
                        initiateQuery.call(self, data, deferred);
                    },
                    uri: queryStringOrUri
                })
            } else if (queryStringOrUri) {
                deferred.resolve(false);
                throw new Error("Query given invalid");
            } else {
                //console.log("IN QUERY, INIT, WITHOUT");
                this.syntaxTree = SparqlParser.parser.parse("SELECT * WHERE { ?subject ?predicate ?object }");
                deferred.resolve(true);
            }
            this.deferred = deferred;
            return this;
        },
        base: function (value) {
            value = format(value, arguments, 1);
            this.prologueBase = Tokenizer.base(value).base;
            return this;
        },
        filter: function (filter) {
            filter = format(filter, arguments, 1);
            //console.log("IN QUERY, filter", filter);
            tokenWhere.call(this, "FILTER(" + filter + ")");
            return this;
        },
        group: function (group) {
            group = format(group, arguments, 1);
            this.unitGroup = Tokenizer.group(group).group;
            return this;
        },
        optional: function (optional) {
            optional = format(optional, arguments, 1);
            tokenWhere.call(this, "OPTIONAL { " + optional + " }");
            return this;
        },
        prefix: function (prefix, local) {
            prefix = format(prefix, arguments, 2);
            local = format(local, arguments, 2);
            if (!this.prefixes[prefix]) {
                var token = Tokenizer.prefix("{0}: <{1}>".format(prefix, local));
                this.prefixes[prefix] = token.prefix;
            }
            return this;
        },
        /**
         *
         * @param variable
         * @param pattern
         * @param [flags]
         * @return {*}
         */
        regex: function (variable, pattern, flags) {
            variable = format(variable, arguments, 3);
            pattern = format(pattern, arguments, 3);
            flags = format(flags, arguments, 3);
            tokenWhere.call(this, flags ?
                'FILTER regex({0}, "{1}", "{2}")'.format(variable, pattern, flags) :
                'FILTER regex({0}, "{1}")'.format(variable, pattern));
            return this;
        },
        retrieveTree: function () {
            if (this.prologueBase) {
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
            //console.log("IN QUERY, retrieveTree assembled", this.syntaxTree);
            return this.syntaxTree;
        },
        select: function (projection) {
            projection = format(projection, arguments, 1);
            this.projection = Tokenizer.projection(projection).projection;
            return this;
        },
        then: function (callback) {
            this.deferred.then(callback);
            return this;
        },
        where: function (pattern) {
            pattern = format(pattern, arguments, 1);
            //console.log("IN QUERY, WHERE", this.pattern);
            tokenWhere.call(this, pattern);
            return this;
        }
    };
    Query.prototype.init.prototype = Query.prototype;
    return Query;
});