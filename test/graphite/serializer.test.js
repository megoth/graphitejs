define([
    "src/graphite/serializer"
], function (Serializer) {
    buster.testCase("Graphite serializer", {
        "Has proper Setup": function () {
            assert.defined(Serializer);
            assert.isFunction(Serializer);
        },
        "Throws an error if unsupported format is called": function () {
            assert.exception(function () {
                Serializer({}, "test");
            });
        },
        "Loads the SPARQL-serializer": function () {
            var sparql = Serializer({}, "sparql");
            assert(sparql);
        }
    });
});