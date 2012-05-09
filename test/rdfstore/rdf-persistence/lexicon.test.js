/*global assert, buster, module, require*/
if (typeof module === "object" && typeof require === "function") {
    var buster = require("buster");
}

define(["src/rdfstore/rdf-persistence/lexicon"], function (Lexicon) {
    buster.testCase("RDFStore Lexicon", {
        "testParsingLiterals": function () {
            new Lexicon.Lexicon(function (lexicon){
                var literal1 = '"this is a test"',
                    parsed = lexicon.parseLiteral(literal1),
                    literal2 = '"this is another test"@en',
                    literal3 = '"this is another test"^^<http://sometypehere.org>';
                assert.equals(parsed.value, "this is a test");
                var parsed = lexicon.parseLiteral(literal2);
                assert.equals(parsed.value, "this is another test");
                assert.equals(parsed.lang, "en");
                var parsed = lexicon.parseLiteral(literal3);
                assert.equals(parsed.value, "this is another test");
                assert.equals(parsed.type, "http://sometypehere.org");
            },"ignored_name");
        },
        "testLexiconInterface": function () {
            var lexicon = new Lexicon.Lexicon(),
                uri = "http://test.com/1",
                literal = '"this is a literal"',
                oid1 = lexicon.registerUri(uri),
                oid2 = lexicon.registerLiteral(literal);
            assert.equals(uri, lexicon.retrieve(oid1).value);
            assert.equals('"' + lexicon.retrieve(oid2).value + '"', literal);
            assert.exception(function () {
                lexicon.retrieve(34234234234);
            });
            assert.exception(function () {
                lexicon.retrieve(34234234234);
            });
        }
    });
});