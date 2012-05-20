define([
    "src/graphite/dictionary"
], function (Dictionary) {
    "use strict";
    var integerValue1 = 123,
        literal1 = "a",
        literal2 = "John Lennon",
        stringValue1 = "abc",
        uri1 = "http://example.org/",
        uri2 = "http://dbpedia.org/resource/John_Lennon",
        uriHomepage = "http://xmlns.com/foaf/0.1/homepage";
    buster.testCase("Graphite dictionary", {
        "Function .createObject": {
            "Blank nodes": function () {
                var object = Dictionary.createObject(),
                    blankNodeId = parseInt(object.id);
                assert.equals('_:' + (blankNodeId + 1), Dictionary.BlankNode());
            },
            "Literals": function () {
                assert.equals(Dictionary.createObject(integerValue1), Dictionary.Literal(integerValue1));
                assert.equals(Dictionary.createObject(literal1), Dictionary.Literal(literal1));
                assert.equals(Dictionary.createObject(literal2), Dictionary.Literal(literal2));
            },
            "URIs": function () {
                assert.equals(Dictionary.createObject(uri2), Dictionary.Symbol(uri2));
                assert.equals(Dictionary.createObject(stringValue1, { base: uri1 }), Dictionary.Symbol(uri1 + stringValue1));
                assert.equals(Dictionary.createObject(integerValue1, { base: uri1 }), Dictionary.Symbol(uri1 + integerValue1));
            }
        },
        "Function .createPredicate": function () {
            var predicate = Dictionary.createPredicate(uriHomepage);
            assert.equals(predicate, Dictionary.Symbol(uriHomepage));
            predicate = Dictionary.createPredicate(stringValue1, uri1);
            assert.equals(predicate, Dictionary.Symbol(uri1 + stringValue1));
        },
        "Function .createStatement": function () {
            var subject = Dictionary.Symbol(uri2),
                subjectBN,
                predicate = Dictionary.Symbol(uriHomepage),
                object = Dictionary.Symbol(uri1),
                objectBN;
            assert.equals(Dictionary.createStatement({
                subject: uri2,
                predicate: uriHomepage,
                object: uri1
            }), "<{0}> <{1}> <{2}> .".format(uri2, uriHomepage, uri1));
            object = Dictionary.Literal(stringValue1);
            assert.equals(Dictionary.createStatement({
                subject: uri2,
                predicate: uriHomepage,
                object: stringValue1
            }), '<{0}> <{1}> "{2}" .'.format(uri2, uriHomepage, stringValue1));
            object = Dictionary.Literal(integerValue1);
            assert.equals(Dictionary.createStatement({
                subject: uri2,
                predicate: uriHomepage,
                object: integerValue1
            }), '<{0}> <{1}> {2} .'.format(uri2, uriHomepage, integerValue1));
            subject = Dictionary.BlankNode();
            subjectBN = parseInt(subject.id);
            object = Dictionary.BlankNode();
            objectBN = parseInt(object.id);
            assert.equals(Dictionary.createStatement({
                predicate: uriHomepage
            }), "_:{0} <{1}> _:{2} .".format(subjectBN + 2, uriHomepage, objectBN + 2));

        },
        "Function .createSubject": {
            "Blank nodes": function () {
                var subject = Dictionary.createSubject(),
                    blankNodeId;
                blankNodeId = parseInt(subject.id);
                assert.equals('_:' + (blankNodeId + 1), Dictionary.BlankNode());
                subject = Dictionary.createSubject(integerValue1);
                blankNodeId = parseInt(subject.id);
                assert.equals('_:' + (blankNodeId + 1), Dictionary.BlankNode());
            },
            "URIs": function () {
                var subject = Dictionary.createSubject(uri1);
                assert.equals(subject, Dictionary.Symbol(uri1));
                subject = Dictionary.createSubject(stringValue1, uri1);
                assert.equals(subject, Dictionary.Symbol(uri1 + stringValue1));
            }
        }
    });
});