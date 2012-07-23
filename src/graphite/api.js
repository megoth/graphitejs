define([
    "./rdf",
    "./graph",
    "./query",
    "./utils"
], function (RDF, Graph, Query, Utils) {
    var ApiSubject = function (api, subjectName) {
            return Object.create({
                execute: function (callback) {
                    this.api.execute(this.query, callback);
                },
                then: function (callback) {
                    this.api.then(callback);
                }
            }, {
                api: { value: api },
                query: { value: api.q.getSubject(subjectName) }
            });
        };
    return function () {
        return Object.create({
            /**
             *
             * @param subject
             * @param predicate
             * @param object
             * @param [callback]
             * @return {*}
             */
            addStatement: function (subject, predicate, object, callback) {
                this.q = Query("INSERT DATA {{0}}".format(RDF.createStatement({
                    subject: subject,
                    predicate: predicate,
                    object: object
                })));
                return this.execute(callback, function () {
                    this.q = Query();
                }.bind(this));
            },
            base: function (uri) {
                //console.log("IN API, BASE BEGINNING");
                this.q.base.apply(this.q, arguments);
                return this;
            },
            execute: function (callback, onsuccess) {
                this.g.execute(this.q, callback, onsuccess);
                return this;
            },
            filter: function (filter) {
                this.q.filter.apply(this.q, arguments);
                return this;
            },
            getSubject: function (subjectName) {
                return new ApiSubject(this, subjectName);
            },
            group: function (group) {
                this.q.group.apply(this.q, arguments);
                return this;
            },
            listStatements: function (options, callback) {
                if (!callback && Utils.isFunction (options)) {
                    callback = options;
                    options = {};
                }
                var subject = options.subject ? RDF.createSubject(options.subject).toNT() : "?subject",
                    predicate = options.predicate ? RDF.createPredicate(options.predicate).toNT() : "?predicate",
                    object = options.object ? RDF.createObject(options.object).toNT() : "?object";
                this.q = Query("SELECT * WHERE { {0} {1} {2} }".format(subject, predicate, object));
                return this.execute(callback);
            },
            load: function (uri, callback) {
                this.q = Query("LOAD <" + uri + ">");
                return this.execute(callback);
            },
            optional: function (optional) {
                this.q.optional.apply(this.q, arguments);
                return this;
            },
            prefix: function (prefix, local) {
                this.q.prefix.apply(this.q, arguments);
                return this;
            },
            query: function (queryString) {
                this.q = Query.apply(this.q, arguments);
                return this;
            },
            /**
             *
             * @param variable
             * @param pattern
             * @param [flags]
             */
            regex: function (variable, pattern, flags) {
                this.q.regex(variable, pattern, flags);
                return this;
            },
            removeStatement: function (subject, predicate, object) {
                this.q = Query("DELETE DATA { {0} }".format(RDF.createStatement({
                    subject: subject,
                    predicate: predicate,
                    object: object
                })));
                return this.execute();
            },
            select: function (projection) {
                this.q.select(projection);
                return this;
            },
            size: function (callback) {
                this.g.size(callback);
                return this;
            },
            then: function (callback) {
                this.g.then(function () {
                    callback(this);
                }.bind(this));
                return this;
            },
            where: function (pattern) {
                this.q.where(pattern);
                return this;
            }
        }, {
            g: {
                value: Graph()
            },
            q: { 
                value: Query(),
                writable: true
            }
        });
    };
});