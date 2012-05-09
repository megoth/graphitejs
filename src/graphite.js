define([], function () {
    /*!
     * Graphite Core
     * Copyright (C) 2012 Arne Hassel
     * MIT Licensed
     *
     * The core Graphite module.
     * Based on the graphite-library, http://graphitejs.com/, designed by Alex Young
     *
     * The graphite object.
     *
     * @returns {Object} The graphite object, run through `init`
     */
    var graphite = function() {
        return new graphite.prototype.init();
    }
    graphite.prototype = {
        init: function () {
            //TODO THIS IS WHERE ALL STARTS
        }
    };
    graphite.prototype.init.prototype = graphite.prototype;
    return graphite;
});