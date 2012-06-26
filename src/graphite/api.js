define([
    "./dictionary",
    "./graph",
    "./query",
    "./utils"
], function (Dictionary, Graph, Query, Utils) {
    var api = function () {
        return new api.prototype.init();
    };
    api.prototype = {
        init: function () {
            this.g = Graph();
            this.q = Query();
        },
        /**
         *
         * @param subject
         * @param predicate
         * @param object
         * @param [callback]
         * @return {*}
         */
        addStatement: function (subject, predicate, object, callback) {
            this.q = Query("INSERT DATA {{0}}".format(Dictionary.createStatement({
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
        group: function (group) {
            this.q.group.apply(this.q, arguments);
            return this;
        },
        listStatements: function (options, callback) {
            if (!callback && Utils.isFunction (options)) {
                callback = options;
                options = {};
            }
            var subject = options.subject ? Dictionary.createSubject(options.subject).toNT() : "?subject",
                predicate = options.predicate ? Dictionary.createPredicate(options.predicate).toNT() : "?predicate",
                object = options.object ? Dictionary.createObject(options.object).toNT() : "?object";
            this.q = Query("SELECT * WHERE { {0} {1} {2} }".format(subject, predicate, object));
            return this.each(callback);
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
            this.q = Query("DELETE DATA { {0} }".format(Dictionary.createStatement({
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
            this.q.then(function () {
                this.g.then(function (graph) {
                    callback(graph);
                });
            }.bind(this));
            return this;
        },
        where: function (pattern) {
            this.q.where(pattern);
            return this;
        }
    };
    api.prototype.init.prototype = api.prototype;
    return api;
});