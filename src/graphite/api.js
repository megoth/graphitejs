define([], function () {
    var api = function (options) {
        return new api.prototype.init(options);
    };

    api.prototype = {
        init: function (options) {
            //TODO: HERE IS API
        },
        load: function (uri, type) {

        }
    };
    api.prototype.init.prototype = api.prototype;
    return api;
});