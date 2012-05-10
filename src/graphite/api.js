define([], function () {
    var api = function (options) {
        return new api.prototype.init(options);
    };

    api.prototype = {
        init: function (options) {
            //TODO: HERE IS API
        },
        addStatement: function (subject, predicate, object, callback) {
            var triple = Dictionary.Statement(subject, predicate, object);
            this.engine.execute('INSERT DATA { ' + triple.toNT() + ' }', function () {
                if (callback) {
                    callback(triple);
                }
            });
            return triple;
        },
        load: function (uri, type) {

        }
    };
    api.prototype.init.prototype = api.prototype;
    return api;
});