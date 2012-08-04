define([
    "src/graphite/rdf"
], function (RDF) {
    "use strict";
    var integerValue1 = 123,
        literal1 = "a",
        literal2 = "John Lennon",
        stringValue1 = "abc",
        uri1 = "http://example.org/",
        uri2 = "http://dbpedia.org/resource/John_Lennon",
        uriHomepage = "http://xmlns.com/foaf/0.1/homepage";
    buster.testCase("Graphite RDF", {
        "//Function .createLiteral": function () {
            var literalBoolean = RDF.createLiteral(true),
                literalDouble = RDF.createLiteral(1.3),
                literalInteger = RDF.createLiteral(1),
                literalString = RDF.createLiteral("test"),
                literalLanguageString = RDF.createLiteral({
                    value: "test",
                    lang: "jp"
                });
            assert.equals(literalBoolean, '"true"^^<http://www.w3.org/2001/XMLSchema#boolean>');
            assert.equals(literalDouble, '"1.3"^^<http://www.w3.org/2001/XMLSchema#double>');
            assert.equals(literalInteger, '"1"^^<http://www.w3.org/2001/XMLSchema#integer>');
            assert.equals(literalString, '"test"');
            assert.equals(literalLanguageString, '"test"@jp');
        },
        "//Function .createObject": {
            "Blank nodes": function () {
                var object = RDF.createObject(),
                    blankNodeId = parseInt(object.id);
                assert.equals('_:' + (blankNodeId + 1), RDF.BlankNode());
            },
            "Literals": function () {
                assert.equals(RDF.createObject(integerValue1), RDF.Literal(integerValue1));
                assert.equals(RDF.createObject(literal1), RDF.Literal(literal1));
                assert.equals(RDF.createObject(literal2), RDF.Literal(literal2));
            },
            "URIs": function () {
                assert.equals(RDF.createObject(uri2), RDF.Symbol(uri2));
                assert.equals(RDF.createObject(stringValue1, { base: uri1 }), RDF.Symbol(uri1 + stringValue1));
                assert.equals(RDF.createObject(integerValue1, { base: uri1 }), RDF.Symbol(uri1 + integerValue1));
            }
        },
        "//Function .createPredicate": function () {
            var predicate = RDF.createPredicate(uriHomepage);
            assert.equals(predicate, RDF.Symbol(uriHomepage));
            predicate = RDF.createPredicate(stringValue1, uri1);
            assert.equals(predicate, RDF.Symbol(uri1 + stringValue1));
        },
        "//Function .createStatement": function () {
            var subject,
                subjectBN,
                object,
                objectBN;
            assert.equals(RDF.createStatement({
                subject: uri2,
                predicate: uriHomepage,
                object: uri1
            }), "<{0}> <{1}> <{2}> .".format(uri2, uriHomepage, uri1));
            assert.equals(RDF.createStatement({
                subject: uri2,
                predicate: uriHomepage,
                object: stringValue1
            }), '<{0}> <{1}> "{2}" .'.format(uri2, uriHomepage, stringValue1));
            assert.equals(RDF.createStatement({
                subject: uri2,
                predicate: uriHomepage,
                object: integerValue1
            }), '<{0}> <{1}> {2} .'.format(uri2, uriHomepage, integerValue1));
            subject = RDF.BlankNode();
            subjectBN = parseInt(subject.id);
            object = RDF.BlankNode();
            objectBN = parseInt(object.id);
            assert.equals(RDF.createStatement({
                predicate: uriHomepage
            }), "_:{0} <{1}> _:{2} .".format(subjectBN + 2, uriHomepage, objectBN + 2));

        },
        "//Function .createSubject": {
            "Blank nodes": function () {
                var subject = RDF.createSubject(),
                    blankNodeId;
                blankNodeId = parseInt(subject.id);
                assert.equals('_:' + (blankNodeId + 1), RDF.BlankNode());
                subject = RDF.createSubject(integerValue1);
                blankNodeId = parseInt(subject.id);
                assert.equals('_:' + (blankNodeId + 1), RDF.BlankNode());
            },
            "URIs": function () {
                var subject = RDF.createSubject(uri1);
                assert.equals(subject, RDF.Symbol(uri1));
                subject = RDF.createSubject(stringValue1, uri1);
                assert.equals(subject, RDF.Symbol(uri1 + stringValue1));
            }
        },
    });
});