define([
    "src/graphite/dictionary"
], function (Dictionary) {
    const blank1 = "_:a",
        literal1 = "a",
        uri1 = "http://example.org/";
    buster.testCase("Graphite dictionary", {
        "//Function .createStatement": function () {
            var stat1 = Dictionary.createStatement(uri1, uri1, literal1),
                stat2 = Dictionary.createStatement(blank1, uri1, literal1);
            assert.equals(stat1, '<{0}> <{0}> "{1}" .'.format(uri1, literal1));
            assert.equals(stat2, '{0} <{1}> "{2}" .'.format("_:0", uri1, literal1));
        }
    });
});