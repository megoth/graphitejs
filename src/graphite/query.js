/*global define */
define([
    "./loader",
    "./queryparser",
    "./utils",
    "./promise"
], function (Loader, QueryParser, Utils, Promise) {
    var Query = function (queryString) {
            return new Query.prototype.init(queryString);
        },
        QueryObject = function (query, objectName) {
            return new QueryObject.prototype.init(query, objectName);
        },
        QuerySubject = function (query, subjectName) {
            return new QuerySubject.prototype.init(query, subjectName);
        },
        QueryTerm,
        sparqlRegex = /^(#|ADD|ASK|BASE|CONSTRUCT|COPY|CLEAR|CREATE|DESCRIBE|DELETE|DROP|INSERT|LOAD|MOVE|PREFIX|SELECT|WITH)/;
    function assembleNode (node, subject, predicate, object) {
        node.query
            .where("{0} {1} {2}".format(
            subject,
            predicate,
            object
        ));
        if (node.filters.length > 0) {
            Utils.each(node.filters, function (filter) {
                node.query.filter(filter);
            }.bind(node));
        }
        if (node.regexes.length > 0) {
            Utils.each(node.regexes, function (r) {
                node.query.regex(node.termName, r.pattern, r.flags);
            }.bind(node));
        }
    }
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
    function formatTerm(term) {
        if (term.length > 7 && term.substr(0, 7) === "http://") {
            return "<" + term + ">";
        }
        return term;
    }
    function initiateQuery(queryString, deferred) {
        //console.log("IN QUERY, initiateQuery", queryString);
        this.syntaxTree = this.parser.parse(queryString).syntaxTree;
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
        var where = this.parser.where("WHERE {" + pattern + "}", {
            bgpindex: this.bgpindex,
            pattern: this.pattern
        });
        this.bgpindex = Utils.isNumber(where.bgpindex) ? where.bgpindex : this.bgpindex;
        this.pattern = where.where;
    }
    Query.prototype = {
        init: function (queryStringOrUri) {
            var self = this,
                deferred = Promise.defer();
            this.prologueBase = null;
            this.bgpindex = null;
            this.pattern = null;
            this.prefixes = {};
            this.projection = null;
            this.variables = [];
            this.unitGroup = null;
            this.unitindex = 0;
            this.parser = QueryParser("sparql");
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
                this.syntaxTree = this.parser.parse("SELECT * WHERE { ?subject ?predicate ?object }").syntaxTree;
                deferred.resolve(true);
            }
            this.deferred = deferred;
            return this;
        },
        base: function (value) {
            value = format(value, arguments, 1);
            this.prologueBase = this.parser.base(value).base;
            return this;
        },
        filter: function (filter) {
            filter = format(filter, arguments, 1);
            //console.log("IN QUERY, filter", filter);
            tokenWhere.call(this, "FILTER(" + filter + ")");
            return this;
        },
        getObject: function (variableName) {
            return new QueryObject(this, variableName);
        },
        getSubject: function (variableName) {
            return new QuerySubject(this, variableName);
        },
        group: function (group) {
            group = format(group, arguments, 1);
            this.unitGroup = this.parser.group(group).group;
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
                var token = this.parser.prefix("{0}: <{1}>".format(prefix, local));
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
            this.projection = this.parser.projection(projection).projection;
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
    QueryObject.prototype = {
        init: function (query, objectName) {
            this.query = query;
            this.termName = objectName;
            this.predicateName = "?predicate";
            this.subjectName = "?subject";
            this.filters = [];
            this.regexes = [];
        },
        asSubject: function (subjectName) {
            assembleNode(this, subjectName, this.predicateName, this.termName);
            return new QuerySubject(this.query, subjectName);
        },
        getSubjectAsObject: function (objectName) {
            assembleNode(this, objectName, this.predicateName, this.termName);
            return new QueryObject(this.query, objectName);
        },
        retrieveTree: function () {
            assembleNode(this, this.subjectName, this.predicateName, this.termName);
            return this.query.retrieveTree();
        },
        withSubject: function (subjectName) {
            this.subjectName = formatTerm(subjectName);
        }
    };
    QuerySubject.prototype = {
        init: function (query, subjectName) {
            this.query = query;
            this.objectName = "?object";
            this.predicateName = "?predicate";
            this.termName = subjectName;
            this.filters = [];
            this.regexes = [];
        },
        asObject: function (objectName) {
            assembleNode(this, this.termName, this.predicateName, objectName);
            return new QueryObject(this.query, objectName);
        },
        getObjectAsSubject: function (subjectName) {
            assembleNode(this, this.termName, this.predicateName, subjectName);
            return new QuerySubject(this.query, subjectName);
        },
        retrieveTree: function () {
            assembleNode(this, this.termName, this.predicateName, this.objectName);
            return this.query.retrieveTree();
        },
        withObject: function (objectName) {
            this.objectName = formatTerm(objectName);
        }
    };
    QueryTerm = {
        equals: function (value) {
            value = format(value, arguments, 1);
            this.filters.push("{0} = {1}".format(this.termName, value));
        },
        greaterThan: function (value) {
            value = format(value, arguments, 1);
            this.filters.push("{0} > {1}".format(this.termName, value));
        },
        greaterOrEqualThan: function (value) {
            value = format(value, arguments, 1);
            this.filters.push("{0} >= {1}".format(this.termName, value));
        },
        lesserThan: function (value) {
            value = format(value, arguments, 1);
            this.filters.push("{0} < {1}".format(this.termName, value));
        },
        lesserOrEqualThan: function (value) {
            value = format(value, arguments, 1);
            this.filters.push("{0} <= {1}".format(this.termName, value));
        },
        regex: function (pattern, flags) {
            pattern = format(pattern, arguments, 2);
            flags = flags ? format(flags, arguments, 2) : null;
            this.regexes.push({
                flags: flags,
                pattern: pattern
            });
        },
        withProperty: function (predicateName) {
            this.predicateName = formatTerm(predicateName);
        }
    };
    Utils.extend(QueryObject.prototype.init.prototype, QueryTerm, QueryObject.prototype);
    Utils.extend(QuerySubject.prototype.init.prototype, QueryTerm, QuerySubject.prototype);
    return Query;
});