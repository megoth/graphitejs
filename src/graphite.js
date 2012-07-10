define([
    "./graphite/api"
], function (API) {
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
     * @returns {Object} The API module
     */
    return function Constructor(input) {
        return new API(input);
    };
});