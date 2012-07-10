/*global assert, buster, module, require*/
if (typeof module === "object" && typeof require ===  "function") {
    var buster = require("buster");
}
define(["src/rdfstore/communication/jsonld_parser"], function (JSONLDParser) {
    buster.testCase("RDFStore JSON-LD Parser", {
        "testParsing 1": function () {
            var input = {  "@type": "foaf:Person",
                "foaf:name": "Manu Sporny",
                "foaf:homepage": "http://manu.sporny.org/",
                "sioc:avatar": "http://twitter.com/account/profile_image/manusporny",
                '@context': {'sioc:avatar': {'@type': '@id'},
                    'foaf:homepage': {'@type': '@id'}}
            };
            var result = JSONLDParser.parser.parse(input);
            assert.equals(result.length, 4);
            for(var i=0; i<result.length; i++) {
                var triple = result[i];
                assert.defined(triple.subject['blank'], null);
                assert.equals(triple.subject['blank'].indexOf("_:"), 0);
                if(triple.predicate['uri'] === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type') {
                    assert.equals(triple.object.uri, "http://xmlns.com/foaf/0.1/Person");
                } else if(triple.predicate.uri === 'http://xmlns.com/foaf/0.1/name') {
                    assert.equals(triple.object.literal, '"Manu Sporny"');
                } else if(triple.predicate.uri === 'http://xmlns.com/foaf/0.1/homepage') {
                    // uri because of default context coercion
                    assert.equals(triple.object.uri, "http://manu.sporny.org/");
                } else if(triple.predicate.uri === 'http://rdfs.org/sioc/ns#avatar') {
                    assert.equals(triple.object.uri, "http://twitter.com/account/profile_image/manusporny");
                } else {
                    assert(false);
                }
            }
        },
        "testParsing 2": function () {
            var input = { "@context": { "myvocab": "http://example.org/myvocab#",
                'sioc:avatar': {
                    '@type': '@id'
                },
                'foaf:homepage': {
                    '@type': '@id'
                } },
                "@type": "foaf:Person",
                "foaf:name": "Manu Sporny",
                "foaf:homepage": "http://manu.sporny.org/",
                "sioc:avatar": "http://twitter.com/account/profile_image/manusporny",
                "myvocab:personality": "friendly"};
            var result = JSONLDParser.parser.parse(input);
            assert.equals(result.length, 5);
            for(var i=0; i<result.length; i++) {
                var triple = result[i];
                assert.equals(triple.subject.blank.indexOf("_:"), 0);
                if(triple.predicate.uri === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type') {
                    assert.equals(triple.object.uri, "http://xmlns.com/foaf/0.1/Person");
                } else if(triple.predicate.uri === 'http://xmlns.com/foaf/0.1/name') {
                    assert.equals(triple.object.literal, '"Manu Sporny"');
                } else if(triple.predicate.uri === 'http://xmlns.com/foaf/0.1/homepage') {
                    // uri because of default context coercion
                    assert.equals(triple.object.uri, "http://manu.sporny.org/");
                } else if(triple.predicate.uri === 'http://rdfs.org/sioc/ns#avatar') {
                    assert.equals(triple.object.uri, "http://twitter.com/account/profile_image/manusporny");
                } else if(triple.predicate.uri === 'http://example.org/myvocab#personality') {
                    assert.equals(triple.object.literal, '"friendly"');
                } else {
                    assert(false);
                }
            }
        },
        "testParsing 3": function (done) {
            var input = [
                {
                    "@id": "_:bnode1",
                    "@type": "foaf:Person",
                    "foaf:homepage": "http://example.com/bob/",
                    "foaf:name": "Bob"
                },
                {
                    "@id": "_:bnode2",
                    "@type": "foaf:Person",
                    "foaf:homepage": "http://example.com/eve/",
                    "foaf:name": "Eve"
                },
                {
                    "@id": "_:bnode3",
                    "@type": "foaf:Person",
                    "foaf:homepage": "http://example.com/manu/",
                    "foaf:name": "Manu"
                }
            ];
            var result = JSONLDParser.parser.parse(input);
            assert.equals(result.length, 9);
            for(var i=0; i<result.length; i++) {
                var triple = result[i];
                if(triple.predicate.uri, 'http://xmlns.com/foaf/0.1/name') {
                    if(triple.subject.blank === '_:bnode1') {
                        assert.equals(triple.object.literal, '"Bob"');
                    } else if(triple.subject.blank === '_:bnode2') {
                        assert.equals(triple.object.literal, '"Eve"');
                    } else if(triple.subject.blank === '_:bnode3') {
                        assert.equals(triple.object.literal, '"Manu"');
                    }
                } else {
                    assert.defined(triple.predicate.literal);
                }
            }
            done();
        },
        "testParsing 4": function () {
            var input = {
                "@context":
                {
                    "vcard": "http://microformats.org/profile/hcard#vcard",
                    "url": {'@id': "http://microformats.org/profile/hcard#url", '@type': '@id'},
                    "fn": "http://microformats.org/profile/hcard#fn"
                },
                "@id": "_:bnode1",
                "@type": "vcard",
                "url": "http://tantek.com/",
                "fn": "Tantek Çelik"
            };
            var result = JSONLDParser.parser.parse(input);
            assert.equals(result.length, 3);
            for(var i=0; i<result.length; i++) {
                assert.equals(result[i].subject.blank[0], "_");
                if(result[i].predicate.uri === 'http://microformats.org/profile/hcard#url') {
                    assert.equals(result[i].object.uri, 'http://tantek.com/');
                } else if(result[i].predicate.uri === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type') {
                    assert.equals(result[i].object.uri, 'http://microformats.org/profile/hcard#vcard');
                }
            }
        },
        "testParsing 5": function () {
            var input = [
                {
                    "@id": "http://purl.oreilly.com/works/45U8QJGZSQKDH8N",
                    "@type": "http://purl.org/vocab/frbr/core#Work",
                    "http://purl.org/dc/terms/title": "Just a Geek",
                    "http://purl.org/dc/terms/creator": "Whil Wheaton",
                    "http://purl.org/vocab/frbr/core#realization":
                        ["http://purl.oreilly.com/products/9780596007683.BOOK", "http://purl.oreilly.com/products/9780596802189.EBOOK"],
                    '@context':{"http://purl.org/vocab/frbr/core#realization": {'@type':'@id'}}
                },
                {
                    "@id": "http://purl.oreilly.com/products/9780596007683.BOOK",
                    "@type": "http://purl.org/vocab/frbr/core#Expression",
                    "http://purl.org/dc/terms/type": "http://purl.oreilly.com/product-types/BOOK",
                    '@context':{"http://purl.org/dc/terms/type":{'@type':'@id'}}
                },
                {
                    "@id": "http://purl.oreilly.com/products/9780596802189.EBOOK",
                    "@type": "http://purl.org/vocab/frbr/core#Expression",
                    "http://purl.org/dc/terms/type": "http://purl.oreilly.com/product-types/EBOOK",
                    '@context':{"http://purl.org/dc/terms/type":{'@type':'@id'}}
                }
            ];
            var result = JSONLDParser.parser.parse(input);
            var counter = 0;
            var previous = null;
            for(var i=0; i<result.length; i++) {
                var triple = result[i];
                if(triple.predicate.uri === 'http://purl.org/vocab/frbr/core#realization') {
                    counter++;
                    refute.equals(previous, triple.object.uri);
                    previous = triple.object.uri;
                }
            }
            assert.equals(counter, 2);
        },
        "testParsing ": function () {
            var input = {"foaf:name": "Manu Sporny"};
            var result = JSONLDParser.parser.parse(input);
            assert.equals(result.length, 1);
            assert.equals(result[0].predicate.uri, 'http://xmlns.com/foaf/0.1/name');
            input = { "foaf:homepage": { "@id": "http://manu.sporny.org" } };
            result = JSONLDParser.parser.parse(input);
            assert.equals(result.length, 1);
            assert.equals(result[0].object.uri, 'http://manu.sporny.org');
            input = {
                "@context": {
                    "foaf:homepage": {
                        "@type": "@id"
                    }
                },
                "foaf:homepage": "http://manu.sporny.org"
            };
            result = JSONLDParser.parser.parse(input);
            assert.equals(result.length, 1);
            assert.equals(result[0].object.uri, "http://manu.sporny.org");
            input = {"foaf:name": { "@literal": "花澄", "@language": "ja"  } };
            result = JSONLDParser.parser.parse(input);
            assert.equals(result.length, 1);
            assert.equals(result[0].object.literal, '"花澄"@ja');
            input = {  "@context": {   "dc:modified": {'@type': "xsd:dateTime"}	 }, "dc:modified": "2010-05-29T14:17:39+02:00"};
            result = JSONLDParser.parser.parse(input);
            assert.equals(result.length, 1);
            assert.equals(result[0].object.literal, '"2010-05-29T14:17:39+02:00"^^<http://www.w3.org/2001/XMLSchema#dateTime>');
            input = {
                "@context":
                {
                    "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
                    "xsd": "http://www.w3.org/2001/XMLSchema#",
                    "name": "http://xmlns.com/foaf/0.1/name",
                    "age": {'@id': "http://xmlns.com/foaf/0.1/age", '@type':"xsd:integer"},
                    "homepage": {'@id':"http://xmlns.com/foaf/0.1/homepage", '@type':"xsd:anyURI"}
                },
                "name": "John Smith",
                "age": "41",
                "homepage": "http://example.org/home/"
            };
            result = JSONLDParser.parser.parse(input, {uri: 'http://test.com/graph'});
            var found = false;
            for(var i=0; i<result.length; i++) {
                if(result[i].predicate.uri === 'http://xmlns.com/foaf/0.1/age') {
                    found = true;
                    assert.equals(result[i].object.literal, '"41"^^<http://www.w3.org/2001/XMLSchema#integer>');
                    assert.equals(result[i].graph.uri, 'http://test.com/graph');
                }
            }
            assert(found);
        }
    })
})