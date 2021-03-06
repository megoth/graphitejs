/*global assert, module, require*/
if (typeof module === "object" && typeof require === "function") {
    var buster = require("buster");
}
define([
    "src/rdfquery/rdf",
    "src/rdfquery/uri"
], function (RDF, URI) {
    function parseFromString(xml) {
        var doc,
            parser;
        try {
            doc = new ActiveXObject("Microsoft.XMLDOM");
            doc.async = "false";
            doc.loadXML(xml);
        } catch (e) {
            parser = new DOMParser();
            doc = parser.parseFromString(xml, 'text/xml');
        }
        return doc;
    }

    buster.testCase("Graphite RDF", {
        setUp: function () {
            this.ns = {
                rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
                xsd: "http://www.w3.org/2001/XMLSchema#",
                dc: "http://purl.org/dc/elements/1.1/",
                foaf: "http://xmlns.com/foaf/0.1/",
                cc: "http://creativecommons.org/ns#",
                vcard: "http://www.w3.org/2001/vcard-rdf/3.0#",
                xmlns: "http://www.w3.org/2000/xmlns/",
                xml: "http://www.w3.org/XML/1998/namespace"
            };
            this.boasserts = RDF.databank()
                .prefix('rdf', this.ns.rdf)
                .prefix('rdfs', 'http://www.w3.org/2000/01/rdf-schema#')
                .prefix('foaf', this.ns.foaf)
                .prefix('dc', this.ns.dc)
                .prefix('dct', 'http://purl.org/dc/terms/')
                .prefix('xsd', this.ns.xsd)
                .prefix('ex', 'http://example.com/')
                .add('<http://example.com/aReallyGreatBoassert> dc:title "A Really Great Boassert" .')
                .add('<http://example.com/aReallyGreatBoassert> dc:publisher "Examples-R-Us" .')
                .add('<http://example.com/aReallyGreatBoassert> dc:creator _:creator .')
                .add('_:creator a <http://xmlns.com/foaf/0.1/Person> .')
                .add('_:creator foaf:name "John Doe" .')
                .add('_:creator foaf:mbox "john@example.com" .')
                .add('_:creator foaf:img <http://example.com/john.jpg> .')
                .add('<http://example.com/john.jpg> a <http://xmlns.com/foaf/0.1/Image> .')
                .add('<http://example.com/john.jpg> dc:format "image/jpeg" .')
                .add('<http://example.com/john.jpg> dc:extent "1234" .')
                .add('_:creator foaf:phone <tel:+1-999-555-1234> .')
                .add('<http://example.com/aReallyGreatBoassert> dc:contributor _:contributor .')
                .add('_:contributor a <http://xmlns.com/foaf/0.1/Person> .')
                .add('_:contributor foaf:name "Jane Doe" .')
                .add('<http://example.com/aReallyGreatBoassert> dc:language "en" .')
                .add('<http://example.com/aReallyGreatBoassert> dc:format "applicaiton/pdf" .')
                .add('<http://example.com/aReallyGreatBoassert> dc:rights "Copyright (C) 2004 Examples-R-Us. All rights reserved." .')
                .add('<http://example.com/aReallyGreatBoassert> dct:issued "2004-01-19"^^xsd:date .')
                .add('<http://example.com/aReallyGreatBoassert> rdfs:seeAlso <http://example.com/anotherGreatBoassert> .')
                .add('<http://example.com/anotherGreatBoassert> dc:title "Another Great Boassert" .')
                .add('<http://example.com/anotherGreatBoassert> dc:publisher "Examples-R-Us" .')
                .add('<http://example.com/anotherGreatBoassert> dc:creator "June Doe (june@example.com)" .')
                .add('<http://example.com/anotherGreatBoassert> dc:format "application/pdf" .')
                .add('<http://example.com/anotherGreatBoassert> dc:language "en" .')
                .add('<http://example.com/anotherGreatBoassert> dc:rights "Copyright (C) 2004 Examples-R-Us. All rights reserved." .')
                .add('<http://example.com/anotherGreatBoassert> dct:issued "2004-05-03"^^xsd:date .')
                .add('<http://example.com/anotherGreatBoassert> rdfs:seeAlso <http://example.com/aReallyGreatBoassert> .')
                .add('<http://example.com/aBoassertCritic> ex:likes <http://example.com/aReallyGreatBoassert> .')
                .add('<http://example.com/aBoassertCritic> ex:dislikes <http://example.com/anotherGreatBoassert> .');
        },
        /* Example adapted from http://www.w3.org/Submission/CBD/ */
        "Navigation Tests": {
            "navigating to a resource": function () {
                var rdf = RDF({ databank: this.boasserts }),
                    nodes = rdf.node('<http://example.com/aReallyGreatBoassert>');
                assert.equals(nodes.length, 1, "it should have found one resource");
                assert.equals(nodes[0].node.value, 'http://example.com/aReallyGreatBoassert', "it should have found the resource that was requested");
            },
            "navigating to a literal": function () {
                var rdf = RDF({ databank: this.boasserts }),
                    nodes = rdf.node('"John Doe"');
                assert.equals(nodes.length, 1, "it should have found one literal");
            },
            "navigating to several nodes via a where": function () {
                var rdf = RDF({ databank: this.boasserts }).where('?boassert dc:title ?title'),
                    nodes = rdf.node('?boassert');
                assert.equals(nodes.length, 2, "it should have found two this.boasserts");
                assert.equals(nodes[0].node.value, 'http://example.com/aReallyGreatBoassert');
                assert.equals(nodes[1].node.value, 'http://example.com/anotherGreatBoassert');
            },
            "navigating from a node to a property": function () {
                var rdf = RDF({ databank: this.boasserts }),
                    nodes = rdf.node('<http://example.com/aReallyGreatBoassert>'),
                    creator = nodes.find('dc:creator'),
                    name = creator.find('foaf:name');
                assert.equals(nodes.length, 1, "it should find a single resource");
                assert.equals(creator.length, 1, "it should have found one creator");
                assert.equals(creator[0].node.value, '_:creator');
                assert.equals(name.length, 1, "it should have found one name");
                assert.equals(name[0].node.value, 'John Doe');
            },
            "navigating to several nodes and then to their property": function () {
                var rdf = RDF({ databank: this.boasserts }),
                    creators = rdf
                        .where('?boassert dc:title ?title')
                        .node('?boassert')
                        .find('dc:creator');
                assert.equals(creators.length, 2, "it should have found two creators");
            },
            "navigating backwards": function () {
                var rdf = RDF({ databank: this.boasserts }),
                    people = rdf
                        .node('foaf:Person')
                        .back('rdf:type');
                assert.equals(people.length, 2, "it should have found two people");
            }
        },
        "Triplestore Tests": {
            "creating an empty triple store": function () {
                var rdf = RDF();
                assert.equals(rdf.databank.size(), 0, "the length of the triple store should be zero");
                assert.equals(rdf.length, 0, "the length of the matches should be zero");
                assert.equals(rdf.size(), 0, "the size of the matches should be zero");
            },
            "creating a triple store from an array of RDF.triple objects": function () {
                var namespaces = { dc: this.ns.dc, foaf: this.ns.foaf },
                    triples = [
                        RDF.triple('<photo1.jpg> dc:creator <http://www.blogger.com/profile/1109404> .', { namespaces: namespaces }),
                        RDF.triple('<http://www.blogger.com/profile/1109404> foaf:img <photo1.jpg> .', { namespaces: namespaces })
                    ],
                    rdf = RDF({ triples: triples }),
                    d = rdf.describe(['<photo1.jpg>']);
                assert.equals(rdf.databank.size(), 2, "the length of the databank should be two");
                assert.equals(rdf.length, 0, "the length of the matches should be zero");
                assert.equals(rdf.databank.triples()[0], triples[0]);
                assert.equals(rdf.databank.triples()[1], triples[1]);
                assert.equals(d[0], triples[0]);
                assert.equals(d[1], triples[1]);
            },
            "creating a triple store from an array of strings": function () {
                var namespaces = { dc: this.ns.dc, foaf: this.ns.foaf },
                    triples = [
                        '<photo1.jpg> dc:creator <http://www.blogger.com/profile/1109404> .',
                        '<http://www.blogger.com/profile/1109404> foaf:img <photo1.jpg> .'
                    ],
                    rdf = RDF({ triples: triples, namespaces: namespaces });
                assert.equals(rdf.databank.size(), 2, "the length of the triple store should be two");
                assert.equals(rdf.length, 0, "the length of the query should be zero");
                assert.equals(rdf.size(), 0, "the size of the query should be zero");
                triples = rdf.databank.triples();
                assert.equals(triples[0].subject.type, 'uri', "the subject of the first triple should be a resource");
                assert.equals(triples[0].property.type, 'uri', "the property of the first triple should be a resource");
                assert.equals(triples[0].object.type, 'uri', "the object of the first triple should be a resource");
                assert.equals(triples[1].subject.type, 'uri', "the subject of the first triple should be a resource");
                assert.equals(triples[1].property.type, 'uri', "the property of the first triple should be a resource");
                assert.equals(triples[1].object.type, 'uri', "the object of the first triple should be a resource");
            },
            "adding duplicate triples to a triple store": function () {
                var rdf = RDF()
                    .prefix('dc', this.ns.dc)
                    .add('_:a dc:creator "Jeni" .')
                    .add('_:a dc:creator "Jeni" .');
                assert.equals(rdf.databank.size(), 1, "should only result in one triple being added");
            },
            "selecting triples using a search pattern": function () {
                var namespaces = { dc: this.ns.dc, foaf: this.ns.foaf },
                    triples = [
                        '<photo1.jpg> dc:creator <http://www.blogger.com/profile/1109404> .',
                        '<http://www.blogger.com/profile/1109404> foaf:img <photo1.jpg> .',
                        '<photo2.jpg> dc:creator <http://www.blogger.com/profile/1109404> .'
                    ],
                    rdf = RDF({ triples: triples, namespaces: namespaces }),
                    filtered = rdf.where('?photo dc:creator <http://www.blogger.com/profile/1109404>'),
                    selected = filtered.select(),
                    d = filtered.describe(['?photo']);
                assert.equals(rdf.databank.size(), 3, "there should be three triples in the databank");
                assert.equals(rdf.length, 0);
                assert.equals(filtered.length, 2, "number of items after filtering");
                assert.equals(filtered[0].photo.value, URI('photo1.jpg'));
                assert.equals(filtered[1].photo.value, URI('photo2.jpg'));
                assert.equals(selected[0].photo.type, 'uri');
                assert.equals(selected[0].photo.value, URI('photo1.jpg'));
                assert.equals(selected[1].photo.type, 'uri');
                assert.equals(selected[1].photo.value, URI('photo2.jpg'));
                assert.equals(d.length, 3);
            },
            "creating triples and specifying options should helpfully bind prefixes": function () {
                var namespaces = { dc: this.ns.dc, foaf: this.ns.foaf },
                    triples = [
                        '<photo1.jpg> dc:creator <http://www.blogger.com/profile/1109404> .',
                        '<http://www.blogger.com/profile/1109404> foaf:img <photo1.jpg> .',
                        '<photo2.jpg> dc:creator <http://www.blogger.com/profile/1109404> .'
                    ],
                    rdf = RDF({ triples: triples, namespaces: namespaces });
                rdf.where('?photo dc:creator <http://www.blogger.com/profile/1109404>');
                assert.equals(rdf.prefix('dc'), this.ns.dc);
                assert.equals(rdf.prefix('foaf'), this.ns.foaf);
            },
            "adding another triple that matches the original search pattern": function () {
                var rdf = RDF()
                        .prefix('dc', this.ns.dc)
                        .prefix('foaf', this.ns.foaf)
                        .add('<photo1.jpg> dc:creator <http://www.blogger.com/profile/1109404> .')
                        .add('<http://www.blogger.com/profile/1109404> foaf:img <photo1.jpg> .'),
                    filtered = rdf.where('?photo dc:creator <http://www.blogger.com/profile/1109404>');
                assert.equals(filtered.length, 1, "number of items after filtering");
                assert.equals(filtered[0].photo.value, URI('photo1.jpg'));
                filtered.add('<photo2.jpg> dc:creator <http://www.blogger.com/profile/1109404> .');
                assert.equals(filtered.length, 2, "number of items after filtering");
                assert.equals(filtered[1].photo.value, URI('photo2.jpg'));
            },
            "selecting triples using two search patterns": function () {
                var namespaces = { dc: this.ns.dc, foaf: this.ns.foaf },
                    triples = [
                        '<photo1.jpg> dc:creator <http://www.blogger.com/profile/1109404> .',
                        '<http://www.blogger.com/profile/1109404> foaf:img <photo1.jpg> .',
                        '<photo2.jpg> dc:creator <http://www.blogger.com/profile/1109404> .'
                    ],
                    rdf = RDF({triples: triples, namespaces: namespaces}),
                    filtered = rdf
                        .where('?photo dc:creator ?creator')
                        .where('?creator foaf:img ?photo'),
                    selected = filtered.select(),
                    selected2 = filtered.select(['creator']);
                assert.equals(filtered.length, 1, "number of items after filtering");
                assert.equals(filtered[0].photo.value, URI('photo1.jpg'));
                assert.equals(filtered[0].creator.value, URI('http://www.blogger.com/profile/1109404'));
                assert.equals(filtered.sources()[0][0], RDF.triple(triples[0], {namespaces: namespaces}));
                assert.equals(filtered.sources()[0][1], RDF.triple(triples[1], {namespaces: namespaces}));
                assert.equals(selected[0].photo.type, 'uri');
                assert.equals(selected[0].photo.value, URI('photo1.jpg'));
                assert.equals(selected[0].creator.type, 'uri');
                assert.equals(selected[0].creator.value, 'http://www.blogger.com/profile/1109404');
                assert.equals(selected2[0].creator.type, 'uri');
                assert.equals(selected2[0].creator.value, 'http://www.blogger.com/profile/1109404');
                refute.defined(selected2[0].photo, 'there should not be a photo property');
            },
            "selecting triples using two search patterns, then adding a triple": function () {
                var namespaces = { dc: this.ns.dc, foaf: this.ns.foaf },
                    triples = [
                        '<photo1.jpg> dc:creator <http://www.blogger.com/profile/1109404> .',
                        '<http://www.blogger.com/profile/1109404> foaf:img <photo1.jpg> .',
                        '<photo2.jpg> dc:creator <http://www.blogger.com/profile/1109404> .'
                    ],
                    rdf = RDF({ triples: triples, namespaces: namespaces }),
                    filtered = rdf
                        .where('?photo dc:creator ?creator')
                        .where('?creator foaf:img ?photo'),
                    added;
                assert.equals(filtered.length, 1, "number of items after filtering");
                assert.equals(filtered[0].photo.value, URI('photo1.jpg'));
                added = rdf.add('<http://www.blogger.com/profile/1109404> foaf:img <photo2.jpg> .');
                assert.equals(filtered.length, 2, "number of items after adding a new triple");
                assert.equals(filtered[1].photo.value, URI('photo2.jpg'));
            },
            "using a callback function on each match": function () {
                var count = 0,
                    photos = [],
                    namespaces = { dc: this.ns.dc, foaf: this.ns.foaf },
                    triples = [
                        '<photo1.jpg> dc:creator <http://www.blogger.com/profile/1109404> .',
                        '<http://www.blogger.com/profile/1109404> foaf:img <photo1.jpg> .',
                        '<photo2.jpg> dc:creator <http://www.blogger.com/profile/1109404> .',
                        '<http://www.blogger.com/profile/1109404> foaf:img <photo2.jpg> .'
                    ],
                    rdf = RDF({ triples: triples, namespaces: namespaces })
                        .where('?photo dc:creator ?creator')
                        .where('?creator foaf:img ?photo');
                rdf.each(function (match) {
                    count += 1;
                    photos.push(match.photo);
                });
                assert.equals(count, 2, "it should iterate twice");
                assert.equals(photos[0].value, URI('photo1.jpg'));
                assert.equals(photos[1].value, URI('photo2.jpg'));
            },

            "using three arguments with each() to get the source triples": function () {
                var sources = [],
                    namespaces = { dc: this.ns.dc, foaf: this.ns.foaf },
                    triples = [
                        '<photo1.jpg> dc:creator <http://www.blogger.com/profile/1109404> .',
                        '<http://www.blogger.com/profile/1109404> foaf:img <photo1.jpg> .',
                        '<photo2.jpg> dc:creator <http://www.blogger.com/profile/1109404> .',
                        '<http://www.blogger.com/profile/1109404> foaf:img <photo2.jpg> .'
                    ],
                    rdf = RDF({ triples: triples, namespaces: namespaces })
                        .where('?photo dc:creator ?creator')
                        .where('?creator foaf:img ?photo');
                rdf.each(function (match, index, source) {
                    sources.push(source);
                });
                assert.equals(sources[0][0], RDF.triple(triples[0], { namespaces: namespaces }));
                assert.equals(sources[0][1], RDF.triple(triples[1], { namespaces: namespaces }));
                assert.equals(sources[1][0], RDF.triple(triples[2], { namespaces: namespaces }));
                assert.equals(sources[1][1], RDF.triple(triples[3], { namespaces: namespaces }));
            },
            "mapping each match to an array": function () {
                var rdf = RDF()
                        .prefix('dc', this.ns.dc)
                        .prefix('foaf', this.ns.foaf)
                        .add('<photo1.jpg> dc:creator <http://www.blogger.com/profile/1109404> .')
                        .add('<http://www.blogger.com/profile/1109404> foaf:img <photo1.jpg> .')
                        .add('<photo2.jpg> dc:creator <http://www.blogger.com/profile/1109404> .')
                        .add('<http://www.blogger.com/profile/1109404> foaf:img <photo2.jpg> .')
                        .where('?photo dc:creator ?creator')
                        .where('?creator foaf:img ?photo'),
                    photos = rdf.map(function () {
                        return this.photo.value;
                    });
                assert.equals(photos[0], URI('photo1.jpg'));
                assert.equals(photos[1], URI('photo2.jpg'));
            },
            "using the result of bindings() as a jQuery objectct": function () {
                var rdf = RDF()
                        .prefix('dc', this.ns.dc)
                        .prefix('foaf', this.ns.foaf)
                        .add('<photo1.jpg> dc:creator <http://www.blogger.com/profile/1109404> .')
                        .add('<http://www.blogger.com/profile/1109404> foaf:img <photo1.jpg> .')
                        .add('<photo2.jpg> dc:creator <http://www.blogger.com/profile/1109404> .')
                        .add('<http://www.blogger.com/profile/1109404> foaf:img <photo2.jpg> .')
                        .where('?photo dc:creator ?creator')
                        .where('?creator foaf:img ?photo'),
                    photos = rdf.map(function () { return this.photo.value; });
                assert.equals(photos[0], URI('photo1.jpg'));
                assert.equals(photos[1], URI('photo2.jpg'));
            },
            "filtering some results based on a regular expression": function () {
                var namespaces = { dc: 'http://purl.org/dc/elements/1.1/', '': 'http://example.org/boassert/', ns: 'http://example.org/ns#'},
                    triples = [
                        ':boassert1  dc:title  "SPARQL Tutorial" .',
                        ':boassert1  ns:price  42 .',
                        ':boassert2  dc:title  "The Semantic Web" .',
                        ':boassert2  ns:price  23 .'
                    ],
                    rdf = RDF({ triples: triples, namespaces: namespaces })
                        .where('?x dc:title ?title'),
                    filtered = rdf.filter('title', /^SPARQL/);
                assert.equals(rdf.length, 2, "should have two items before filtering");
                assert.equals(filtered.length, 1, "should have one item after filtering");
                assert.equals(filtered[0].title.value, "SPARQL Tutorial");
            },
            "filtering some results, then adding a new matching triple": function () {
                var rdf = RDF()
                    .prefix('dc', this.ns.dc)
                    .prefix('', 'http://example.org/boassert')
                    .add(':boassert1 dc:title "SPARQL Tutorial"')
                    .where('?x dc:title ?title')
                    .filter('title', /SPARQL/);
                assert.equals(rdf.length, 1, "should have one match before adding another triple");
                rdf.add(':boassert2 dc:title "Another SPARQL Tutorial"');
                assert.equals(rdf.length, 2, "should have two matches after adding another matching triple");
            },
            "filtering some results, then adding a new triple that matches the where clause but not the filter": function () {
                var rdf = RDF()
                    .prefix('dc', this.ns.dc)
                    .prefix('', 'http://example.org/boassert')
                    .add(':boassert1 dc:title "SPARQL Tutorial"')
                    .where('?x dc:title ?title')
                    .filter('title', /SPARQL/);
                assert.equals(rdf.length, 1, "should have one match before adding another triple");
                rdf.add(':boassert2 dc:title "XQuery Tutorial"');
                assert.equals(rdf.length, 1, "should have one match after adding a non-matching triple");
            },

            "creating a namespace binding explicitly, not while creating the triples": function () {
                var rdf = RDF()
                    .prefix('dc', 'http://purl.org/dc/elements/1.1/')
                    .prefix('', 'http://example.org/boassert/');
                rdf.add(':boassert1 dc:title "SPARQL Tutorial"');
                assert.equals(rdf.databank.triples()[0].subject, '<http://example.org/boassert/boassert1>');
                assert.equals(rdf.databank.triples()[0].property, '<http://purl.org/dc/elements/1.1/title>');
            },
            "creating a base URI explicitly, not while creating the triples": function () {
                var rdf = RDF()
                    .prefix('dc', 'http://purl.org/dc/elements/1.1/')
                    .base('http://www.example.org/images/')
                    .add('<photo1.jpg> dc:creator "Jeni"');
                assert.equals(rdf.databank.triples()[0].subject, '<http://www.example.org/images/photo1.jpg>');
            },
            "creating an optional clause": function () {
                var rdf = RDF()
                    .prefix('foaf', 'http://xmlns.com/foaf/0.1/')
                    .prefix('rdf', 'http://www.w3.org/1999/02/22-rdf-syntax-ns#')
                    .add('_:a  rdf:type        foaf:Person .')
                    .add('_:a  foaf:name       "Alice" .')
                    .add('_:a  foaf:mbox       <mailto:alice@example.com> .')
                    .add('_:a  foaf:mbox       <mailto:alice@work.example> .')
                    .add('_:b  rdf:type        foaf:Person .')
                    .add('_:b  foaf:name       "Bob" .')
                    .where('?x foaf:name ?name')
                    .optional('?x foaf:mbox ?mbox');
                assert.equals(rdf.length, 3, "there should be three matches");
                assert.equals(rdf[0].name.value, "Alice");
                assert.equals(rdf[0].mbox.value, 'mailto:alice@example.com');
                assert.equals(rdf[1].name.value, "Alice");
                assert.equals(rdf[1].mbox.value, 'mailto:alice@work.example');
                assert.equals(rdf[2].name.value, "Bob");
                assert.equals(rdf[2].mbox, undefined);
            },
            "adding a triple after creating an optional clause": function () {
                var rdf = RDF()
                    .prefix('foaf', 'http://xmlns.com/foaf/0.1/')
                    .add('_:a  foaf:name       "Alice" .')
                    .add('_:a  foaf:mbox       <mailto:alice@example.com> .')
                    .add('_:a  foaf:mbox       <mailto:alice@work.example> .')
                    .where('?x foaf:name ?name')
                    .optional('?x foaf:mbox ?mbox');
                assert.equals(rdf.length, 2, "there should be two matches");
                rdf.add('_:b foaf:name "Bob"');
                assert.equals(rdf.length, 3, "there should be three matches");
                assert.equals(rdf[2].name.value, "Bob");
                assert.equals(rdf[2].mbox, undefined);
            },
            "adding a triple that should cause the creation of two matches": function () {
                var rdf = RDF()
                    .prefix('foaf', 'http://xmlns.com/foaf/0.1/')
                    .add('_:a  foaf:mbox       <mailto:alice@example.com> .')
                    .add('_:a  foaf:mbox       <mailto:alice@work.example> .')
                    .where('?x foaf:name ?name')
                    .where('?x foaf:mbox ?mbox');
                assert.equals(rdf.length, 0, "there should be no matches");
                rdf.add('_:a  foaf:name       "Alice" .');
                assert.equals(rdf.length, 2, "there should be two matches");
                assert.equals(rdf[0].name.value, "Alice");
                assert.equals(rdf[0].mbox.value, 'mailto:alice@example.com');
                assert.equals(rdf[1].name.value, "Alice");
                assert.equals(rdf[1].mbox.value, 'mailto:alice@work.example');
            },
            "adding a triple that satisfies an optional clause": function () {
                var rdf = RDF()
                    .prefix('foaf', 'http://xmlns.com/foaf/0.1/')
                    .add('_:a foaf:name "Alice" .')
                    .where('?x foaf:name ?name');
                assert.equals(rdf.length, 1, "there should be one match");
                rdf = rdf.optional('?x foaf:mbox ?mbox');
                assert.equals(rdf.length, 1, "there should be one match");
                rdf = rdf.add('_:a foaf:mbox <mailto:alice@example.com> .');
                assert.equals(rdf.length, 1, "there should be one match");
                assert.equals(rdf[0].name.value, "Alice");
                assert.equals(rdf[0].mbox.value, 'mailto:alice@example.com');
            },
            "multiple optional clauses": function () {
                var rdf = RDF()
                    .prefix('foaf', 'http://xmlns.com/foaf/0.1/')
                    .add('_:a  foaf:name       "Alice" .')
                    .add('_:a  foaf:homepage   <http://work.example.org/alice/> .')
                    .add('_:b  foaf:name       "Bob" .')
                    .add('_:b  foaf:mbox       <mailto:bob@work.example> .')
                    .where('?x foaf:name ?name')
                    .optional('?x foaf:mbox ?mbox')
                    .optional('?x foaf:homepage ?hpage');
                assert.equals(rdf.length, 2, "there should be two matches");
                assert.equals(rdf[0].name.value, "Alice");
                assert.equals(rdf[0].mbox, undefined);
                assert.equals(rdf[0].hpage.value, 'http://work.example.org/alice/');
                assert.equals(rdf[1].name.value, "Bob");
                assert.equals(rdf[1].mbox.value, 'mailto:bob@work.example');
                assert.equals(rdf[1].hpage, undefined);
            },
            "creating a union from two sets of triples": function () {
                var rdfA = RDF()
                        .prefix('dc', this.ns.dc)
                        .add('<photo1.jpg> dc:creator "Jane"'),
                    rdfB = RDF()
                        .prefix('foaf', this.ns.foaf)
                        .add('<photo1.jpg> foaf:depicts "Jane"'),
                    rdf = rdfA.add(rdfB);
                assert.equals(rdf.union, undefined, "it shouldn't create a query union");
                assert.equals(rdf.databank.union.length, 2, "the databank should be a union");
                assert.equals(rdf.prefix('dc'), this.ns.dc);
                assert.equals(rdf.prefix('foaf'), this.ns.foaf);
                rdf = rdf
                    .where('?photo dc:creator ?person');
                assert.equals(rdf.length, 1, "it should contain one match");
                assert.equals(rdf.get(0).photo.value, URI('photo1.jpg'));
                assert.equals(rdf.get(0).person.value, "Jane");
                rdf = rdf
                    .where('?photo foaf:depicts ?person');
                assert.equals(rdf.length, 1, "it should contain one match");
                assert.equals(rdf.get(0).photo.value, URI('photo1.jpg'));
                assert.equals(rdf.get(0).person.value, "Jane");
            },
            "creating a union from two differently filtered sets of triples": function () {
                var rdf = RDF()
                        .prefix('dc10', 'http://purl.org/dc/elements/1.0/')
                        .prefix('dc11', 'http://purl.org/dc/elements/1.1/>')
                        .add('_:a  dc10:title     "SPARQL Query Language Tutorial" .')
                        .add('_:a  dc10:creator   "Alice" .')
                        .add('_:b  dc11:title     "SPARQL Protocol Tutorial" .')
                        .add('_:b  dc11:creator   "Bob" .')
                        .add('_:c  dc10:title     "SPARQL" .')
                        .add('_:c  dc11:title     "SPARQL (updated)" .'),
                    rdfA = rdf.where('?boassert dc10:title ?title'),
                    rdfB = rdf.where('?boassert dc11:title ?title'),
                    union = rdfA.add(rdfB);
                assert.equals(rdfA.length, 2, "there should be two matches in the first group");
                assert.equals(rdfB.length, 2, "there should be two matches in the second group");
                assert.equals(union.length, 4, "there should be four matches in the union");
                assert.equals(union.get(0).title.value, "SPARQL Query Language Tutorial");
                assert.equals(union.get(1).title.value, "SPARQL");
                assert.equals(union.get(2).title.value, "SPARQL Protocol Tutorial");
                assert.equals(union.get(3).title.value, "SPARQL (updated)");
            },
            "creating a union with different bindings": function () {
                var rdf = RDF()
                        .prefix('dc10', 'http://purl.org/dc/elements/1.0/')
                        .prefix('dc11', 'http://purl.org/dc/elements/1.1/>')
                        .add('_:a  dc10:title     "SPARQL Query Language Tutorial" .')
                        .add('_:a  dc10:creator   "Alice" .')
                        .add('_:b  dc11:title     "SPARQL Protocol Tutorial" .')
                        .add('_:b  dc11:creator   "Bob" .')
                        .add('_:c  dc10:title     "SPARQL" .')
                        .add('_:c  dc11:title     "SPARQL (updated)" .'),
                    rdfA = rdf.where('?boassert dc10:title ?x'),
                    rdfB = rdf.where('?boassert dc11:title ?y'),
                    union = rdfA.add(rdfB);
                assert.equals(union.length, 4, "there should be four matches in the union");
                assert.equals(union.get(0).x.value, "SPARQL Query Language Tutorial");
                assert.equals(union.get(1).x.value, "SPARQL");
                assert.equals(union.get(2).y.value, "SPARQL Protocol Tutorial");
                assert.equals(union.get(3).y.value, "SPARQL (updated)");
            },
            "creating a union where several filters have been applied": function () {
                var rdf = RDF()
                        .prefix('dc10', 'http://purl.org/dc/elements/1.0/')
                        .prefix('dc11', 'http://purl.org/dc/elements/1.1/>')
                        .add('_:a  dc10:title     "SPARQL Query Language Tutorial" .')
                        .add('_:a  dc10:creator   "Alice" .')
                        .add('_:b  dc11:title     "SPARQL Protocol Tutorial" .')
                        .add('_:b  dc11:creator   "Bob" .')
                        .add('_:c  dc10:title     "SPARQL" .')
                        .add('_:c  dc11:title     "SPARQL (updated)" .'),
                    rdfA = rdf.where('?boassert dc10:title ?title').where('?boassert dc10:creator ?author'),
                    rdfB = rdf.where('?boassert dc11:title ?title').where('?boassert dc11:creator ?author'),
                    union = rdfA.add(rdfB);
                assert.equals(union.length, 2, "there should be two matches in the union");
                assert.equals(union.get(0).title.value, "SPARQL Query Language Tutorial");
                assert.equals(union.get(0).author.value, "Alice");
                assert.equals(union.get(1).title.value, "SPARQL Protocol Tutorial");
                assert.equals(union.get(1).author.value, "Bob");
            },
            "adding a triple to a union": function () {
                var rdf = RDF()
                        .prefix('dc10', 'http://purl.org/dc/elements/1.0/')
                        .prefix('dc11', 'http://purl.org/dc/elements/1.1/>')
                        .add('_:a  dc10:title     "SPARQL Query Language Tutorial" .')
                        .add('_:a  dc10:creator   "Alice" .')
                        .add('_:b  dc11:title     "SPARQL Protocol Tutorial" .')
                        .add('_:b  dc11:creator   "Bob" .')
                        .add('_:c  dc10:title     "SPARQL" .')
                        .add('_:c  dc11:title     "SPARQL (updated)" .'),
                    rdfA = rdf.where('?boassert dc10:title ?title').where('?boassert dc10:creator ?author'),
                    rdfB = rdf.where('?boassert dc11:title ?title').where('?boassert dc11:creator ?author'),
                    union = rdfA.add(rdfB);
                assert.equals(union.length, 2, "there should be two matches in the union");
                union = union.add('_:c dc10:creator "Claire"');
                assert.equals(union.length, 3, "there should be three matches in the union");
                assert.equals(union.get(0).title.value, "SPARQL Query Language Tutorial");
                assert.equals(union.get(0).author.value, "Alice");
                assert.equals(union.get(1).title.value, "SPARQL Protocol Tutorial");
                assert.equals(union.get(1).author.value, "Bob");
                assert.equals(union.get(2).title.value, "SPARQL");
                assert.equals(union.get(2).author.value, "Claire");
            },
            "filtering a union with a where clause": function () {
                var rdf = RDF()
                        .prefix('dc10', 'http://purl.org/dc/elements/1.0/')
                        .prefix('dc11', 'http://purl.org/dc/elements/1.1/')
                        .add('_:a  dc10:title     "SPARQL Query Language Tutorial" .')
                        .add('_:a  dc10:creator   "Alice" .')
                        .add('_:b  dc11:title     "SPARQL Protocol Tutorial" .')
                        .add('_:b  dc11:creator   "Bob" .')
                        .add('_:c  dc10:title     "SPARQL" .')
                        .add('_:d  dc11:title     "SPARQL (updated)" .'),
                    rdfA = rdf.where('?boassert dc10:title ?title'),
                    rdfB = rdf.where('?boassert dc11:title ?title'),
                    union = rdfA.add(rdfB);
                assert.equals(union.length, 4, "there should be four matches in the union");
                union = union.where('?boassert dc10:creator ?author');
                assert.equals(union.length, 1, "there should be one match in the union");
                assert.equals(union.get(0).author.value, "Alice");
                assert.equals(union.get(0).title.value, "SPARQL Query Language Tutorial");
                union = union.add('_:c dc10:creator "Alex"');
                assert.equals(union.length, 2, "there should be two matches in the union");
                assert.equals(union.get(1).title.value, "SPARQL");
                assert.equals(union.get(1).author.value, "Alex");
            },
            "adding a binding after filtering with two where clauses": function () {
                var rdf = RDF()
                    .prefix('dc10', 'http://purl.org/dc/elements/1.0/')
                    .prefix('dc11', 'http://purl.org/dc/elements/1.1/>')
                    .add('_:a  dc10:title     "SPARQL Query Language Tutorial" .')
                    .add('_:a  dc10:creator   "Alice" .')
                    .add('_:b  dc11:title     "SPARQL Protocol Tutorial" .')
                    .add('_:b  dc11:creator   "Bob" .')
                    .add('_:c  dc10:title     "SPARQL" .')
                    .add('_:d  dc11:title     "SPARQL (updated)" .')
                    .where('?boassert dc11:title ?title')
                    .where('?boassert dc10:creator ?author');
                assert.equals(rdf.length, 0, "there should be no matches");
                rdf = rdf.add('_:c dc10:creator "Claire"');
                assert.equals(rdf.length, 0, "there should still be no matches");
            },
            "filtering a union with a filter clause": function () {
                var rdf = RDF()
                        .prefix('dc10', 'http://purl.org/dc/elements/1.0/')
                        .prefix('dc11', 'http://purl.org/dc/elements/1.1/>')
                        .add('_:a  dc10:title     "SPARQL Query Language Tutorial" .')
                        .add('_:a  dc10:creator   "Alice" .')
                        .add('_:b  dc11:title     "SPARQL Protocol Tutorial" .')
                        .add('_:b  dc11:creator   "Bob" .')
                        .add('_:c  dc10:title     "SPARQL" .')
                        .add('_:c  dc11:title     "SPARQL (updated)" .'),
                    rdfA = rdf.where('?boassert dc10:title ?title').where('?boassert dc10:creator ?author'),
                    rdfB = rdf.where('?boassert dc11:title ?title').where('?boassert dc11:creator ?author'),
                    union = rdfA.add(rdfB);
                assert.equals(rdfA.length, 1, "there should be one match in the first query");
                assert.equals(rdfA.get(0).title.value, "SPARQL Query Language Tutorial");
                assert.equals(rdfA.get(0).author.value, "Alice");
                assert.equals(rdfB.length, 1, "there should be one match in the second query");
                assert.equals(rdfB.get(0).title.value, "SPARQL Protocol Tutorial");
                assert.equals(rdfB.get(0).author.value, "Bob");
                assert.equals(union.length, 2, "there should be two matches in the union");
                union = union.filter('author', /^A/);
                assert.equals(union.length, 1, "there should be one match in the union");
                assert.equals(union.get(0).title.value, "SPARQL Query Language Tutorial");
                assert.equals(union.get(0).author.value, "Alice");
                union = union.add('_:c dc10:creator "Alex"');
                assert.equals(union.length, 2, "there should be two matches in the union");
                assert.equals(union.get(0).title.value, "SPARQL Query Language Tutorial");
                assert.equals(union.get(0).author.value, "Alice");
                assert.equals(union.get(1).title.value, "SPARQL");
                assert.equals(union.get(1).author.value, "Alex");
            },
            "selecting a subset of bindings to retain": function () {
                var rdf = RDF()
                        .prefix('foaf', this.ns.foaf)
                        .add('_:alice foaf:knows _:bob')
                        .add('_:bob foaf:knows _:clare')
                        .add('_:alice foaf:knows _:dave')
                        .add('_:dave foaf:knows _:clare')
                        .where('?a foaf:knows ?b'),
                    rdfA = rdf.where('?b foaf:knows ?c'),
                    rdfB = rdf.where('?b foaf:knows ?c', { distinct: ['a', 'c'] });
                assert.equals(rdf.length, 4, "there should be four matches after the first clause");
                assert.equals(rdfA.length, 2, "there should normally be two matches with the second clause");
                assert.equals(rdfB.length, 1, "there should be one distinct match");
            },
            "grouping based on a binding": function () {
                var rdf = RDF()
                    .prefix('foaf', 'http://xmlns.com/foaf/0.1/')
                    .add('_:a  foaf:name   "Alice" .')
                    .add('_:a  foaf:mbox   <mailto:alice@work.example> .')
                    .add('_:a  foaf:mbox   <mailto:alice@home.example> .')
                    .add('_:b  foaf:name   "Bob" .')
                    .add('_:b  foaf:mbox   <mailto:bob@work.example> .')
                    .where('?person foaf:name ?name')
                    .where('?person foaf:mbox ?email');
                assert.equals(rdf.length, 3, "there should be three matches");
                rdf = rdf.group('person');
                assert.equals(rdf.length, 2, "there should be two matches");
                assert.equals(rdf[0].person.value, "_:a");
                assert.equals(rdf[0].name[0].value, "Alice");
                assert.equals(rdf[0].email[0].value, "mailto:alice@work.example");
                assert.equals(rdf[0].email[1].value, "mailto:alice@home.example");
                assert.equals(rdf[1].person.value, "_:b");
                assert.equals(rdf[1].name[0].value, "Bob");
                assert.equals(rdf[1].email[0].value, "mailto:bob@work.example");
            },
            "grouping based on two bindings": function () {
                var rdf = RDF()
                        .prefix('foaf', 'http://xmlns.com/foaf/0.1/')
                        .add('_:a  foaf:givenname   "Alice" .')
                        .add('_:a foaf:family_name "Hacker" .')
                        .add('_:c  foaf:givenname   "Alice" .')
                        .add('_:c foaf:family_name "Hacker" .')
                        .add('_:b  foaf:givenname   "Bob" .')
                        .add('_:b foaf:family_name "Hacker" .')
                        .where('?person foaf:givenname ?forename')
                        .where('?person foaf:family_name ?surname'),
                    group1 = rdf.group('surname'),
                    group2 = rdf.group(['surname', 'forename']);
                assert.equals(rdf.length, 3, "there should be three matches");
                assert.equals(group1.length, 1, "there should be one group");
                assert.equals(group2.length, 2, "there should be two groups");
                assert.equals(group2[0].forename.value, "Alice");
                assert.equals(group2[0].surname.value, "Hacker");
                assert.equals(group2[0].person[0].value, "_:a");
                assert.equals(group2[0].person[1].value, "_:c");
                assert.equals(group2[1].forename.value, "Bob");
                assert.equals(group2[1].surname.value, "Hacker");
                assert.equals(group2[1].person[0].value, "_:b");
            },
            "getting just the first match": function () {
                var rdf = RDF()
                    .prefix('foaf', 'http://xmlns.com/foaf/0.1/')
                    .add('_:a  foaf:name       "Alice" .')
                    .add('_:a  foaf:homepage   <http://work.example.org/alice/> .')
                    .add('_:b  foaf:name       "Bob" .')
                    .add('_:b  foaf:mbox       <mailto:bob@work.example> .')
                    .where('?x foaf:name ?name');
                assert.equals(rdf.length, 2, "there should be two matches");
                rdf = rdf.eq(1);
                assert.equals(rdf.length, 1, "there should be one match");
                assert.equals(rdf[0].name.value, "Bob");
            },
            "creating new triples based on a template": function () {
                var rdf = RDF()
                    .prefix('foaf', this.ns.foaf)
                    .add('_:a    foaf:givenname   "Alice" .')
                    .add('_:a    foaf:family_name "Hacker" .')
                    .add('_:b    foaf:givenname   "Bob" .')
                    .add('_:b    foaf:family_name "Hacker" .')
                    .where('?person foaf:givenname ?gname')
                    .where('?person foaf:family_name ?fname');
                assert.equals(rdf.databank.size(), 4, "should contain four triples");
                assert.equals(rdf.length, 2, "should have two matches");
                rdf = rdf.prefix('vcard', this.ns.vcard)
                    .add('?person vcard:N []');
                assert.equals(rdf.databank.size(), 6, "should contain six triples");
                assert.equals(rdf.length, 2, "should have two matches");
            },
            "deleting triples based on a template": function () {
                var rdf = RDF()
                    .prefix('foaf', this.ns.foaf)
                    .add('_:a    foaf:givenname   "Alice" .')
                    .add('_:a    foaf:family_name "Hacker" .')
                    .add('_:b    foaf:givenname   "Bob" .')
                    .add('_:b    foaf:family_name "Hacker" .')
                    .where('?person foaf:givenname ?gname')
                    .where('?person foaf:family_name ?fname');
                assert.equals(rdf.databank.size(), 4, "should contain four triples");
                assert.equals(rdf.length, 2, "should have two matches");
                rdf = rdf.remove('?person foaf:family_name ?fname');
                assert.equals(rdf.databank.size(), 2, "should contain two triples");
                assert.equals(rdf.length, 0, "should have no matches");
                rdf = rdf.end();
                assert.equals(rdf.length, 2, "should have two matches");
            },
            "using end() to reset a filter": function () {
                var rdf = RDF()
                    .prefix('foaf', this.ns.foaf)
                    .add('_:a    foaf:givenname   "Alice" .')
                    .add('_:a    foaf:family_name "Hacker" .')
                    .add('_:b    foaf:givenname   "Bob" .')
                    .add('_:b    foaf:family_name "Hacker" .')
                    .where('?person foaf:family_name "Hacker"');
                assert.equals(rdf.length, 2, "should have two matches");
                rdf = rdf.where('?person foaf:givenname "Alice"');
                assert.equals(rdf.length, 1, "should have one match");
                rdf = rdf.end();
                assert.equals(rdf.length, 2, "should have two matches again");
                rdf = rdf.end();
                assert.equals(rdf.length, 0, "should have no matches");
            },
            "using end() to reset a filter after adding something that matches the previous set of filters": function () {
                var rdf = RDF()
                    .prefix('foaf', this.ns.foaf)
                    .add('_:a    foaf:givenname   "Alice" .')
                    .add('_:a    foaf:family_name "Hacker" .')
                    .add('_:b    foaf:givenname   "Bob" .')
                    .add('_:b    foaf:family_name "Hacker" .')
                    .where('?person foaf:family_name "Hacker"');
                assert.equals(rdf.length, 2, "should have two matches");
                rdf = rdf.where('?person foaf:givenname "Alice"');
                assert.equals(rdf.length, 1, "should have one match");
                rdf = rdf.add('_:c foaf:family_name "Hacker"');
                assert.equals(rdf.length, 1, "should have one match");
                rdf = rdf.end();
                assert.equals(rdf.length, 3, "should have three matches now");
                rdf = rdf.end();
                assert.equals(rdf.length, 0, "should have no matches");
            },
            "using reset() to reset all filters completely": function () {
                var rdf = RDF()
                    .prefix('foaf', this.ns.foaf)
                    .add('_:a    foaf:givenname   "Alice" .')
                    .add('_:a    foaf:family_name "Hacker" .')
                    .add('_:b    foaf:givenname   "Bob" .')
                    .add('_:b    foaf:family_name "Hacker" .')
                    .where('?person foaf:family_name "Hacker"')
                    .where('?person foaf:givenname "Alice"');
                assert.equals(rdf.length, 1, "should have one match");
                rdf = rdf.reset();
                assert.equals(rdf.length, 0, "should have no matches");
            },
            "using end with subsequent filters": function () {
                var scottish = [],
                    irish = [],
                    rdf = RDF()
                        .prefix('foaf', 'http://xmlns.com/foaf/0.1/')
                        .add('_:a foaf:surname "Jones" .')
                        .add('_:b foaf:surname "Macnamara" .')
                        .add('_:c foaf:surname "O\'Malley"')
                        .add('_:d foaf:surname "MacFee"')
                        .where('?person foaf:surname ?surname')
                        .filter('surname', /^Ma?c/)
                        .each(function () { scottish.push(this.surname.value); })
                        .end()
                        .filter('surname', /^O'/)
                        .each(function () { irish.push(this.surname.value); })
                        .end();
                assert.equals(scottish.length, 2, "there should be two scottish surnames");
                assert.equals(irish.length, 1, "there should be one irish surname");
            },
            "getting all the data about a particular resource": function () {
                var rdf = RDF()
                    .prefix('dc', this.ns.dc)
                    .prefix('foaf', this.ns.foaf)
                    .add('<photo1.jpg> dc:creator <http://www.blogger.com/profile/1109404> .')
                    .add('<http://www.blogger.com/profile/1109404> foaf:img <photo1.jpg> .')
                    .add('<photo2.jpg> dc:creator <http://www.blogger.com/profile/1109404> .')
                    .add('<http://www.blogger.com/profile/1109404> foaf:img <photo2.jpg> .')
                    .about('<http://www.blogger.com/profile/1109404>');
                assert.equals(rdf.length, 2, "there are two triples about <http://www.blogger.com/profile/1109404>");
                assert.equals(rdf[0].property.value, this.ns.foaf + 'img');
                assert.equals(rdf[0].value.value, URI('photo1.jpg'));
                assert.equals(rdf[1].property.value, this.ns.foaf + 'img');
                assert.equals(rdf[1].value.value, URI('photo2.jpg'));
            },
            "getting the difference between two top-level queries": function () {
                var r1 = RDF()
                        .prefix('foaf', this.ns.foaf)
                        .add('_:a foaf:knows _:b')
                        .add('_:a foaf:surname "Smith"'),
                    r2 = RDF()
                        .prefix('foaf', this.ns.foaf)
                        .add('_:a foaf:knows _:b')
                        .add('_:b foaf:surname "Jones"'),
                    diff1 = r1.except(r2),
                    diff2 = r2.except(r1);
                assert.equals(diff1.databank.size(), 1);
                assert.equals(diff1.databank.triples()[0], RDF.triple('_:a foaf:surname "Smith"', { namespaces: { foaf: this.ns.foaf }}));
                assert.equals(diff2.databank.size(), 1);
                assert.equals(diff2.databank.triples()[0], RDF.triple('_:b foaf:surname "Jones"', { namespaces: { foaf: this.ns.foaf }}));
            }
        },
        "Creating Databanks": {
            "getting the triples from a databank": function () {
                var namespaces = { dc: this.ns.dc, foaf: this.ns.foaf };
                var triples = [
                    RDF.triple('<photo1.jpg> dc:creator <http://www.blogger.com/profile/1109404> .', { namespaces: namespaces }),
                    RDF.triple('<http://www.blogger.com/profile/1109404> foaf:img <photo1.jpg> .', { namespaces: namespaces })
                ];
                var data = RDF.databank(triples);
                assert.equals(data.triples()[0], triples[0]);
                assert.equals(data.triples()[1], triples[1]);
            },
            "getting the difference between two databanks": function () {
                var d1 = RDF.databank()
                    .prefix('foaf', this.ns.foaf)
                    .add('_:a foaf:knows _:b')
                    .add('_:a foaf:surname "Smith"');
                var d2 = RDF.databank()
                    .prefix('foaf', this.ns.foaf)
                    .add('_:a foaf:knows _:b')
                    .add('_:b foaf:surname "Jones"');
                var diff1 = d1.except(d2);
                assert.equals(diff1.size(), 1);
                assert.equals(diff1.triples()[0], RDF.triple('_:a foaf:surname "Smith"', { namespaces: { foaf: this.ns.foaf }}));
                var diff2 = d2.except(d1);
                assert.equals(diff2.size(), 1);
                assert.equals(diff2.triples()[0], RDF.triple('_:b foaf:surname "Jones"', { namespaces: { foaf: this.ns.foaf }}));
            },
            "describing a resource that is not the object of any triples, and the subject of two": function () {
                assert.equals(this.boasserts.size(), 29);
                var d1 = this.boasserts.describe(['<http://example.com/aBoassertCritic>']);
                assert.equals(d1.length, 2);
                assert.equals(d1[0], RDF.triple('<http://example.com/aBoassertCritic> <http://example.com/likes> <http://example.com/aReallyGreatBoassert> .'));
                assert.equals(d1[1], RDF.triple('<http://example.com/aBoassertCritic> <http://example.com/dislikes> <http://example.com/anotherGreatBoassert> .'));
            },
            "describing a resource that is also the object of two triples": function () {
                assert.equals(this.boasserts.size(), 29);
                var d1 = this.boasserts.describe(['<http://example.com/anotherGreatBoassert>']);
                assert.equals(d1.length, 10);
            },
            "describing a resource with a property that holds a blank node": function () {
                assert.equals(this.boasserts.size(), 29);
                var d1 = this.boasserts.describe(['<http://example.com/aReallyGreatBoassert>']);
                assert.equals(d1.length, 18);
            },
            "describing a resource where there's a statement with this as an object, and a blank node as the subject": function () {
                assert.equals(this.boasserts.size(), 29);
                var d1 = this.boasserts.describe(['<http://example.com/john.jpg>']);
                assert.equals(d1.length, 9);
            },
            "describing two resources with overlapping triples": function () {
                assert.equals(this.boasserts.size(), 29);
                var d1 = this.boasserts.describe(['_:creator', '<http://example.com/john.jpg>']);
                assert.equals(d1.length, 9);
            },
            "removing a triple from a databank": function () {
                var d = RDF.databank()
                    .prefix('foaf', this.ns.foaf)
                    .add('_:a foaf:knows _:b')
                    .add('_:a foaf:surname "Smith"');
                var r = RDF({ databank: d })
                    .where('?a foaf:knows ?b');
                assert.equals(d.size(), 2);
                assert.equals(r.size(), 1);
                d.remove('_:a foaf:knows _:b');
                assert.equals(d.size(), 1);
                assert.equals(r.size(), 0);
            },
            "updating queries when triples are removed from a databank": function () {
                var d = RDF.databank()
                    .prefix('foaf', this.ns.foaf)
                    .add('_:a foaf:knows _:b')
                    .add('_:a foaf:surname "Smith"');
                var root = RDF({ databank: d });
                var r1 = root.where('?a foaf:knows ?b');
                var r2 = r1.where('?a foaf:surname ?s');
                assert.equals(root.size(), 0);
                assert.equals(r1.size(), 1);
                assert.equals(r2.size(), 1);
                d.remove('_:a foaf:knows _:b');
                assert.equals(root.size(), 0);
                assert.equals(r1.size(), 0);
                assert.equals(r2.size(), 0);
            }
        },
        "Creating Patterns": {
            "two identical patterns": function () {
                var p1 = RDF.pattern('<a> <b> ?c');
                var p2 = RDF.pattern('<a> <b> ?c');
                assert.equals(p1, p2, "should be identical");
            }
        },
        "Creating Triples": {
            "two identical triples": function () {
                var t1 = RDF.triple('<a> <b> <c>');
                var t2 = RDF.triple('<a> <b> <c>');
                assert.equals(t1, t2, "should be equal");
            },
            "creating a triple with explicit subject, predicate and object": function () {
                var subject = 'http://www.example.com/foo/';
                var object = 'mailto:someone@example.com';
                var triple = RDF.triple('<' + subject + '>', 'dc:creator', '<' + object + '>', { namespaces: { dc: this.ns.dc }});
                assert.equals(triple.subject.type, 'uri', "the subject should be a resource");
                assert.equals(triple.subject.value, subject);
                assert.equals(triple.property.type, 'uri', "the property should be a resource");
                assert.equals(triple.property.value, this.ns.dc + 'creator');
                assert.equals(triple.object.type, 'uri', "the object should be a resource");
                assert.equals(triple.object.value, object);
                assert.equals(triple, '<' + subject + '> <' + this.ns.dc + 'creator> <' + object + '> .');
            },
            "creating an rdf:type triple": function () {
                var subject = 'http://example.org/path';
                var object = 'doc:Document';
                var doc = 'http://example.org/#ns';
                var triple = RDF.triple('<' + subject + '>', 'a', object, { namespaces: { doc: doc }});
                assert.equals(triple.subject.value, subject);
                assert.equals(triple.property.value, this.ns.rdf + 'type');
                assert.equals(triple.object.value, doc + 'Document');
                assert.equals(triple, '<' + subject + '> <' + this.ns.rdf + 'type> <' + doc + 'Document> .');
            },
            "creating a triple using a string": function () {
                var subject = 'http://www.example.com/foo/';
                var object = 'mailto:someone@example.com';
                var tstr = '<' + subject + '> dc:creator <' + object + '> .';
                var triple = RDF.triple(tstr, { namespaces: { dc: this.ns.dc }});
                assert.equals(triple.subject.value, subject);
                assert.equals(triple.property.value, this.ns.dc + 'creator');
                assert.equals(triple.object.value, object);
                var e = triple.dump();
                assert.defined(e[subject], 'the dumped triple should have a property equal to the subject');
                assert.defined(e[subject][triple.property.value], 'the dumped triple\'s subject property should have a property whose name is the property name');
                assert.equals(e[subject][triple.property.value].type, 'uri');
                assert.equals(e[subject][triple.property.value].value, object);
            },
            "creating a triple using a string with a literal value": function () {
                var subject = 'http://www.example.com/foo/';
                var value = '"foo"';
                var triple = RDF.triple('<' + subject + '> dc:subject ' + value, { namespaces: { dc: this.ns.dc }});
                assert.equals(triple.subject.value, subject);
                assert.equals(triple.property.value, this.ns.dc + 'subject');
                refute(triple.object.resource, "the object isn't a resource");
                assert.equals(triple.object.value, 'foo');
            },
            "creating a triple using a string with a literal value with a space in it": function () {
                var subject = 'http://www.example.com/foo/';
                var value = '"foo bar"';
                var triple = RDF.triple('<' + subject + '> dc:subject ' + value, { namespaces: { dc: this.ns.dc }});
                assert.equals(triple.subject.value, subject);
                assert.equals(triple.property.value, this.ns.dc + 'subject');
                refute(triple.object.resource, "the object isn't a resource");
                assert.equals(triple.object.value, 'foo bar');
            },
            "creating a triple with an unprefixed name and a value with a space in it": function () {
                var triple = RDF.triple(':boassert1  dc:title  "SPARQL Tutorial" .', { namespaces: { '': 'http://example.org/boassert/', dc: this.ns.dc }});
                assert.equals(triple.subject.value, 'http://example.org/boassert/boassert1');
                assert.equals(triple.property.value, this.ns.dc + 'title');
                assert.equals(triple.object.value, 'SPARQL Tutorial');
            },
            "creating a triple with a literal value with quotes in it": function () {
                var triple = RDF.triple('<> dc:title "E = mc<sup xmlns=\\"http://www.w3.org/1999/xhtml\\">2</sup>: The Most Urgent Problem of Our Time"^^rdf:XMLLiteral .', { namespaces: { dc: this.ns.dc, rdf: this.ns.rdf }});
                assert.equals(triple.subject.value, URI.base());
                assert.equals(triple.property.value, this.ns.dc + 'title');
                assert.equals(triple.object.value, 'E = mc<sup xmlns="http://www.w3.org/1999/xhtml">2</sup>: The Most Urgent Problem of Our Time');
                assert.equals(triple.object.datatype, this.ns.rdf + 'XMLLiteral');
            },
            "creating a triple that belongs to a graph": function () {
                var triple = RDF.triple('<d> <e> <f>', { graph: '<>' });
                assert.equals(triple.subject.value, URI('d'));
                assert.equals(triple.property.value, URI('e'));
                assert.equals(triple.object.value, URI('f'));
                assert.equals(triple.graph.value, URI.base());
            },
            "two triples that belong to different graphs": function () {
                var t1 = RDF.triple('<a> <b> <c>');
                var t2 = RDF.triple('<a> <b> <c>', { graph: '<>' });
                refute.equals(t1, t2, "should not be equal");
            }
        },
        "Creating Resources": {
            "two identical resources": function () {
                var u = 'http://www.example.org/subject';
                var r1 = RDF.resource('<' + u + '>');
                var r2 = RDF.resource('<' + u + '>');
                assert.equals(r1, r2, "should equal each other");
            },
            "a resource": function () {

                var r = RDF.resource('<http://www.example.org/subject>');
                assert.equals(r.value, 'http://www.example.org/subject', 'should have a value property containing the uri');
                assert.equals(r.type, 'uri', 'should have a type of "uri"');
                var e = r.dump();
                assert.equals(e.type, 'uri');
                assert.equals(e.value, 'http://www.example.org/subject');
            },
            "creating a resource with strings in angle brackets (URIs)": function () {
                var u = 'http://www.example.org/subject';
                var r = RDF.resource('<' + u + '>');
                assert.equals(r.value, u);
            },
            "creating a resource with a relative uri": function () {
                var u = 'subject';
                var r = RDF.resource('<' + u + '>');
                assert.equals('' + r.value, '' + URI(u));
            },
            "creating a resource with a relative uri and supplying a base uri": function () {
                var u = 'subject';
                var base = 'http://www.example.org/';
                var r = RDF.resource('<' + u + '>', { base: base });
                assert.equals('' + r.value, '' + URI.resolve(u, base));
            },
            "creating a resource with a uri that contains a greater-than sign": function () {
                var u = 'http://www.example.org/a>b';
                var r = RDF.resource('<' + u.replace(/>/g, '\\>') + '>');
                assert.equals(r.value, u);
            },
            "creating a resource using a string that loasserts like an absolute uri": function () {
                var u = 'http://www.example.org/subject';
                assert.exception(function () {
                    RDF.resource(u);
                });
            },
            "creating a resource from a curie": function () {
                var dc = "http://purl.org/dc/elements/1.1/";
                var c = 'dc:creator';
                var r = RDF.resource(c, { namespaces: { dc: dc } });
                assert.equals(r.value, dc + 'creator');
            },
            "creating a resource from a qname starting with ':'": function () {
                var d = 'http://www.example.com/foo/';
                var r = RDF.resource(':bar', { namespaces: { '': d }});
                assert.equals(r.value, d + 'bar');
            },
            "creating a resource from a qname starting with ':' with no default namespace binding": function () {
                assert.exception(function () {
                    RDF.resource(':bar');
                });
            },
            "creating a resource from a qname ending with ':'": function () {
                var foo = 'http://www.example.com/foo/'
                var r = RDF.resource('foo:', { namespaces: { foo: foo }});
                assert.equals(r.value, foo);
            },
            "creating a resource from a qname ending with ':' with no binding for the prefix": function () {
                assert.exception(function () {
                    RDF.resource('foo:');
                });
            }
        },
        "Creating literals": {
            "two identical literals": function () {
                var l1 = RDF.literal('"foo"');
                var l2 = RDF.literal('"foo"');
                assert.equals(l1, l2, "should be equal");
            },
            "a literal": function () {
                var l = RDF.literal('"foo"');
                assert.equals(l.value, 'foo', 'should have a value property');
                assert.equals(l.type, 'literal', 'should have a type of "literal"');
            },
            "creating a literal with a datatype": function () {
                var r = RDF.literal('2008-10-04', { datatype: this.ns.xsd + 'date' });
                assert.equals(r.value, '2008-10-04');
                assert.equals(r.datatype, this.ns.xsd + 'date');
            },
            "creating a literal with a datatype represented by a safe CURIE": function () {
                var r = RDF.literal('2008-10-04', { datatype: '[xsd:date]', namespaces: { xsd: this.ns.xsd } });
                assert.equals(r.value, '2008-10-04');
                assert.equals(r.datatype, this.ns.xsd + 'date');
            },
            "creating a literal with a language": function () {
                var r = RDF.literal('chat', { lang: 'fr' });
                assert.equals(r.value, 'chat');
                assert.equals(r.lang, 'fr');
            },
            "creating a literal using quotes around the value": function () {
                var r = RDF.literal('"cat"');
                assert.equals(r.value, 'cat');
            },
            "creating a literal using quotes, with quotes in the literal": function () {
                var r = RDF.literal('"She said, \\"hello!\\""');
                assert.equals(r.value, 'She said, "hello!"');
            },
            "creating literal true": function () {
                var r = RDF.literal('true');
                assert.equals(r.value, true);
                assert.equals(r.datatype, this.ns.xsd + 'boolean');
            },
            "creating literal false": function () {
                var r = RDF.literal('false');
                assert.equals(r.value, false);
                assert.equals(r.datatype, this.ns.xsd + 'boolean');
            },
            "creating the literal true from the value true": function () {
                var r = RDF.literal(true);
                assert.equals(r.value, true);
                assert.equals(r.datatype, this.ns.xsd + 'boolean');
            },
            "creating a boolean by passing the appropriate datatype": function () {
                var r = RDF.literal('true', { datatype: this.ns.xsd + 'boolean' });
                assert.equals(r.value, true);
                assert.equals(r.datatype, this.ns.xsd + 'boolean');
            },
            "trying to create a boolean with an invalid literal": function () {
                assert.exception(function () {
                    RDF.literal('foo', { datatype: this.ns.xsd + 'boolean' });
                });
            },
            "creating literal integers": function () {
                var r = RDF.literal('17');
                assert.equals(r.value, 17);
                assert.equals(r.datatype, this.ns.xsd + 'integer');
            },
            "creating a negative literal integer": function () {
                var r = RDF.literal('-5');
                assert.equals(r.value, -5);
                assert.equals(r.datatype, this.ns.xsd + 'integer');
            },
            "creating the integer zero": function () {
                var r = RDF.literal('0');
                assert.equals(r.value, 0);
                assert.equals(r.datatype, this.ns.xsd + 'integer');
            },
            "creating the decimal zero": function () {
                var r = RDF.literal('0.0');
                assert.equals(r.value, '0.0');
                assert.equals(r.datatype, this.ns.xsd + 'decimal');
            },
            "creating a decimal with decimal points": function () {
                var r = RDF.literal('1.234567890123456789');
                assert.equals(r.value, '1.234567890123456789');
                assert.equals('' + r.value, '1.234567890123456789', "string representation should be preserved");
                assert.equals(r.datatype, this.ns.xsd + 'decimal');
            },
            "creating floating point zero": function () {
                var r = RDF.literal('0.0e0');
                assert.equals(r.value, 0.0);
                assert.equals(r.datatype, this.ns.xsd + 'double');
            },
            "creating floating point -12.5e10": function () {
                var r = RDF.literal('-12.5e10');
                assert.equals(r.value, -12.5e10);
                assert.equals(r.datatype, this.ns.xsd + 'double');
            },
            "creating an double from an Javascript number": function () {
                var r = RDF.literal(5.0);
                assert.equals(r.value, 5.0);
                assert.equals(r.datatype, this.ns.xsd + 'double');
            },
            "creating a number by passing an appropriate datatype": function () {
                var r = RDF.literal('5', { datatype: this.ns.xsd + 'integer' });
                assert.equals(r.value, 5);
                assert.isNumber(r.value, "value should be a number");
                assert.equals(r.datatype, this.ns.xsd + 'integer');
            },
            "creating a date by specifying the datatype in the value": function () {
                var r = RDF.literal('"2008-10-05"^^<http://www.w3.org/2001/XMLSchema#date>');
                assert.equals(r.value, '2008-10-05');
                assert.equals(r.datatype, 'http://www.w3.org/2001/XMLSchema#date');
                assert.equals(r, '"2008-10-05"^^<http://www.w3.org/2001/XMLSchema#date>');
                var e = r.dump();
                assert.equals(r.type, 'literal');
                assert.equals(r.value, '2008-10-05');
                assert.equals(r.datatype, 'http://www.w3.org/2001/XMLSchema#date');
            },
            "creating a literal with a language by specifying the language in the value": function () {
                var r = RDF.literal('"chat"@fr');
                assert.equals(r.value, 'chat');
                assert.equals(r.lang, 'fr');
                assert.equals(r, '"chat"@fr');
                var e = r.dump();
                assert.equals(r.type, 'literal');
                assert.equals(r.value, 'chat');
                assert.equals(r.lang, 'fr');
            },
            "creating an XMLLiteral with a language": function () {
                var r = RDF.literal('<foo />', { datatype: this.ns.rdf + 'XMLLiteral', lang: 'fr' });
                assert.equals(r.value, '<foo />');
                assert.equals(r.datatype, this.ns.rdf + 'XMLLiteral');
                assert.equals(r.lang, 'fr');
            }
        },
        "Creating blank nodes": {
            "two blank nodes with the same id": function () {
                var r1 = RDF.blank('_:foo');
                var r2 = RDF.blank('_:foo');
                assert.equals(r1, r2, "should be identical");
            },
            "creating a blank node": function () {
                var r = RDF.blank('_:foo');
                assert.equals(r.type, 'bnode');
                assert.equals(r.value, '_:foo');
                assert.equals(r.id, 'foo');
                var e = r.dump();
                assert.equals(e.type, 'bnode');
                assert.equals(e.value, '_:foo');
                refute.defined(e.id, 'the dumped version of a blank node should not have an id');
            },
            "creating two blank nodes": function () {
                var r1 = RDF.blank('[]');
                var r2 = RDF.blank('[]');
                refute.equals(r1.id, r2.id, "they should have distinct ids " + r1.id + ' != ' + r2.id);
            }
        }
    });
});
/*
 "//dumping the result of a query": function () {
 var rdf = RDF()
 .prefix('dc', this.ns.dc)
 .prefix('foaf', this.ns.foaf)
 .add('<photo1.jpg> dc:creator <http://www.blogger.com/profile/1109404> .')
 .add('<http://www.blogger.com/profile/1109404> foaf:img <photo1.jpg> .')
 .add('<photo2.jpg> dc:creator <http://www.blogger.com/profile/1109404> .')
 .add('<http://www.blogger.com/profile/1109404> foaf:img <photo2.jpg> .')
 .about('<http://www.blogger.com/profile/1109404>'),
 dump;
 assert.equals(rdf.length, 2, "there are two triples about <http://www.blogger.com/profile/1109404>");
 dump = rdf.dump();
 assert.defined(dump['http://www.blogger.com/profile/1109404'], 'there should be a property for the subject');
 assert.equals(dump['http://www.blogger.com/profile/1109404'][this.ns.foaf + 'img'].length, 2);
 }
"//Dumping Databanks": {
    "dumping in RDF/XML a triple whose subject is a blank node": function () {
        var namespaces = { foaf: this.ns.foaf },
            triple = graphite.rdf.triple('_:someone foaf:name "Jeni"', { namespaces: namespaces }),
            dump = graphite.rdf.dump([triple], { format: 'application/rdf+xml', namespaces: namespaces }),
            r,
            d,
            a;
        equals(dump.documentElement.nodeName, 'rdf:RDF');
        r = dump.documentElement;
        equals(r.childNodes.length, 1);
        d = r.childNodes[0];
        a = d.attributes.getNamedItemNS(this.ns.rdf, 'nodeID') || d.attributes.getNamedItem('rdf:nodeID');
        assert(a !== undefined && a !== null, 'it should have an rdf:nodeID attribute');
        equals(a.nodeValue, 'someone');
    },
    "dumping a serialised version of RDF/XML": function () {
        var namespaces = { foaf: this.ns.foaf },
            triple = graphite.rdf.triple('_:someone foaf:name "Jeni"', { namespaces: namespaces }),
            dump = graphite.rdf.dump([triple], { format: 'application/rdf+xml', serialize: true, namespaces: namespaces });
        if (dump.substring(0, 5) === '<?xml') {
            dump = dump.substring(dump.indexOf('?>') + 2);
        }
        equals(dump,
            '<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" ' +
                'xmlns:foaf="http://xmlns.com/foaf/0.1/">' +
                '<rdf:Description rdf:nodeID="someone">' +
                '<foaf:name>Jeni</foaf:name>' +
                '</rdf:Description>' +
                '</rdf:RDF>');
    },
    "dumping in RDF/XML a triple whose property is rdf:type": function () {
        var namespaces = { foaf: this.ns.foaf },
            triple = graphite.rdf.triple('_:someone a foaf:Person', { namespaces: namespaces }),
            dump = graphite.rdf.dump([triple], { format: 'application/rdf+xml', namespaces: namespaces }),
            r,
            d,
            a;
        equals(dump.documentElement.nodeName, 'rdf:RDF');
        r = dump.documentElement;
        equals(r.childNodes.length, 1);
        d = r.childNodes[0];
        equals(d.namespaceURI, this.ns.foaf);
        equals(d.nodeName, 'foaf:Person');
        a = d.attributes.getNamedItemNS(this.ns.rdf, 'nodeID') || d.attributes.getNamedItem('rdf:nodeID');
        assert(a !== undefined && a !== null, 'it should have an rdf:nodeID attribute');
        equals(a.nodeValue, 'someone');
        equals(d.childNodes.length, 0, 'the rdf:type element shouldn\'t appear');
    },
    "dumping in RDF/XML a triple whose object is a blank node": function () {
        var namespaces = { dc: this.ns.dc },
            triple = graphite.rdf.triple('<photo1.jpg> dc:creator _:someone', { namespaces: namespaces }),
            dump = graphite.rdf.dump([triple], { format: 'application/rdf+xml', namespaces: namespaces }),
            r,
            d,
            a,
            p;
        equals(dump.documentElement.nodeName, 'rdf:RDF');
        r = dump.documentElement;
        equals(r.childNodes.length, 1);
        d = r.childNodes[0];
        a = d.attributes.getNamedItemNS(this.ns.rdf, 'about') || d.attributes.getNamedItem('rdf:about');
        assert(a !== undefined && a !== null, 'it should have an rdf:about attribute');
        equals(a.nodeValue, triple.subject.value);
        equals(d.childNodes.length, 1);
        p = d.childNodes[0];
        equals(p.namespaceURI, this.ns.dc);
        equals(p.nodeName, 'dc:creator');
        a = p.attributes.getNamedItemNS(this.ns.rdf, 'nodeID') || p.attributes.getNamedItem('rdf:nodeID');
        assert(a !== undefined && a !== null, 'it should have an rdf:nodeID attribute');
        equals(a.nodeValue, 'someone');
    },
    "dumping in RDF/XML a triple whose object is a untyped literal": function () {
        var namespaces = { dc: this.ns.dc },
            triple = graphite.rdf.triple('<photo1.jpg> dc:creator "Jeni"', { namespaces: namespaces }),
            dump = graphite.rdf.dump([triple], { format: 'application/rdf+xml', namespaces: namespaces }),
            r,
            d,
            a,
            p;
        equals(dump.documentElement.nodeName, 'rdf:RDF');
        r = dump.documentElement;
        equals(r.childNodes.length, 1);
        d = r.childNodes[0];
        a = d.attributes.getNamedItemNS(this.ns.rdf, 'about') || d.attributes.getNamedItem('rdf:about');
        assert(a !== undefined && a !== null, 'it should have an rdf:about attribute');
        equals(a.nodeValue, triple.subject.value);
        equals(d.childNodes.length, 1);
        p = d.childNodes[0];
        equals(p.namespaceURI, this.ns.dc);
        equals(p.nodeName, 'dc:creator');
        equals(p.childNodes.length, 1);
        equals(p.childNodes[0].nodeValue, 'Jeni');
    },
    "dumping in RDF/XML a triple whose object is a typed literal": function () {
        var namespaces = { dc: this.ns.dc, xsd: this.ns.xsd },
            triple = graphite.rdf.triple('<photo1.jpg> dc:created "2009-01-01"^^xsd:date', { namespaces: namespaces }),
            dump = graphite.rdf.dump([triple], { format: 'application/rdf+xml', namespaces: namespaces }),
            r,
            d,
            a,
            p;
        equals(dump.documentElement.nodeName, 'rdf:RDF');
        r = dump.documentElement;
        equals(r.childNodes.length, 1);
        d = r.childNodes[0];
        a = d.attributes.getNamedItemNS(this.ns.rdf, 'about') || d.attributes.getNamedItem('rdf:about');
        assert(a !== undefined && a !== null, 'it should have an rdf:about attribute');
        equals(a.nodeValue, triple.subject.value);
        equals(d.childNodes.length, 1);
        p = d.childNodes[0];
        equals(p.namespaceURI, this.ns.dc);
        equals(p.nodeName, 'dc:created');
        equals(p.childNodes.length, 1);
        equals(p.childNodes[0].nodeValue, '2009-01-01');
        a = p.attributes.getNamedItemNS(this.ns.rdf, 'datatype') || p.attributes.getNamedItem('rdf:datatype');
        assert(a !== undefined && a !== null, 'it should have an rdf:datatype attribute');
        equals(a.nodeValue, this.ns.xsd + 'date');
    },
    "dumping in RDF/XML a triple whose object is a literal with a language": function () {
        var namespaces = { dc: this.ns.dc, xsd: this.ns.xsd },
            triple = graphite.rdf.triple('<photo1.jpg> dc:creator "Jeni"@en', { namespaces: namespaces }),
            dump = graphite.rdf.dump([triple], { format: 'application/rdf+xml', namespaces: namespaces }),
            r,
            d,
            a,
            p;
        equals(dump.documentElement.nodeName, 'rdf:RDF');
        r = dump.documentElement;
        equals(r.childNodes.length, 1);
        d = r.childNodes[0];
        a = d.attributes.getNamedItemNS(this.ns.rdf, 'about') || d.attributes.getNamedItem('rdf:about');
        assert(a !== undefined && a !== null, 'it should have an rdf:about attribute');
        equals(a.nodeValue, triple.subject.value);
        equals(d.childNodes.length, 1);
        p = d.childNodes[0];
        equals(p.namespaceURI, this.ns.dc);
        equals(p.nodeName, 'dc:creator');
        equals(p.childNodes.length, 1);
        equals(p.childNodes[0].nodeValue, 'Jeni');
        a = p.attributes.getNamedItemNS(this.ns.xml, 'lang') || p.attributes.getNamedItem('xml:lang');
        assert(a !== undefined && a !== null, 'it should have an xml:lang attribute');
        equals(a.nodeValue, 'en');
    },
    "dumping in RDF/XML a triple whose object is an XML Literal": function () {
        var namespaces = { dc: this.ns.dc, rdf: this.ns.rdf };
        var triple = graphite.rdf.triple('<> dc:title "E = mc<sup xmlns=\\"http://www.w3.org/1999/xhtml\\">2</sup>: The Most Urgent Problem of Our Time"^^rdf:XMLLiteral .', { namespaces: namespaces });
        var dump = graphite.rdf.dump([triple], { format: 'application/rdf+xml', namespaces: namespaces });
        equals(dump.documentElement.nodeName, 'rdf:RDF');
        var r = dump.documentElement;
        equals(r.childNodes.length, 1, 'the rdf:RDF element should have one child node');
        var d = r.childNodes[0];
        var a = d.attributes.getNamedItemNS(this.ns.rdf, 'about') || d.attributes.getNamedItem('rdf:about');
        assert(a !== undefined && a !== null, 'it should have an rdf:about attribute');
        equals(a.nodeValue, triple.subject.value, 'the about attribute should hold the subject');
        equals(d.childNodes.length, 1, 'the description element should have one child node');
        var p = d.childNodes[0];
        equals(p.namespaceURI, this.ns.dc, 'the property element should be in the dublin core namespace');
        equals(p.nodeName, 'dc:title', 'the property element should be called title');
        var a = p.attributes.getNamedItemNS(this.ns.rdf, 'parseType') || p.attributes.getNamedItem('rdf:parseType');
        assert(a !== undefined && a !== null, 'it should have an rdf:parseType attribute');
        equals(a.nodeValue, 'Literal');
        equals(p.childNodes.length, 3, 'the property element should have three child nodes');
        equals(p.childNodes[0].nodeValue, 'E = mc', 'the first child node should be a text node with the value E = mc');
        var s = p.childNodes[1];
        equals(s.namespaceURI, 'http://www.w3.org/1999/xhtml', 'the second child should be in the XHTML namespace');
        equals(s.nodeName, 'sup', 'the second child should be a sup element');
        var a = s.attributes.getNamedItem('xmlns');
        assert(a !== undefined && a !== null, 'it should have an xmlns attribute');
        equals(a.nodeValue, 'http://www.w3.org/1999/xhtml', 'the xmlns attribute should have an XHTML namespace declaration on it');
        equals(s.childNodes.length, 1, 'the sup element should have a child node');
        equals(s.childNodes[0].nodeValue, '2', 'the text of the sup element should be 2');
        equals(p.childNodes[2].nodeValue, ': The Most Urgent Problem of Our Time', 'the third child node should be a text node with the value : The Most Urgent Problem of Our Time');
    }
},
"//Creating Databanks (deferred)": {
    "creating a new databank": function () {
        var namespaces = { dc: this.ns.dc, foaf: this.ns.foaf };
        var triples = [
            graphite.rdf.triple('<photo1.jpg> dc:creator <http://www.blogger.com/profile/1109404> .', { namespaces: namespaces }),
            graphite.rdf.triple('<http://www.blogger.com/profile/1109404> foaf:img <photo1.jpg> .', { namespaces: namespaces })
        ];
        var data = graphite.rdf.databank(triples);
        equals(data.subjectIndex[triples[0].subject].length, 1);
        equals(data.subjectIndex[triples[0].subject][0], triples[0]);
        equals(data.subjectIndex[triples[1].subject].length, 1);
        equals(data.subjectIndex[triples[1].subject][0], triples[1]);
        equals(data.size(), 2);
        var e = data.dump();
        assert.defined(e[triples[0].subject.value], 'the dump should have a property equal to the subject of the first triple');
        assert.defined(e[triples[1].subject.value], 'the dump should have a property equals to the subject of the second triple');
        assert(e[triples[0].subject.value][triples[0].property.value], 'expecting { subject: { property: { value }}}');
        assert(e[triples[1].subject.value][triples[1].property.value], 'expecting { subject: { property: { value }}}');
        equals(e[triples[0].subject.value][triples[0].property.value][0].type, 'uri');
        equals(e[triples[0].subject.value][triples[0].property.value][0].value, 'http://www.blogger.com/profile/1109404');
        var j = data.dump({ serialize: true });
        equals(j, '{"' + triples[0].subject.value + '": {"http://purl.org/dc/elements/1.1/creator": [{"type": "uri", "value": "http://www.blogger.com/profile/1109404"}]}, "http://www.blogger.com/profile/1109404": {"http://xmlns.com/foaf/0.1/img": [{"type": "uri", "value": "' + triples[0].subject.value + '"}]}}');
        var x = data.dump({ format: 'application/rdf+xml', namespaces: namespaces });
        equals(x.documentElement.nodeName, 'rdf:RDF');
        var r = x.documentElement;
        var xmlnsRdf = r.attributes.getNamedItemNS(this.ns.xmlns, 'rdf') || r.attributes.getNamedItem('xmlns:rdf');
        assert(xmlnsRdf !== undefined && xmlnsRdf !== null, 'it should have an xmlns:rdf declaration');
        equals(xmlnsRdf.nodeValue, this.ns.rdf);
        var xmlnsDc = r.attributes.getNamedItemNS(this.ns.xmlns, 'dc') || r.attributes.getNamedItem('xmlns:dc');
        assert(xmlnsDc !== undefined && xmlnsDc !== null, 'it should have an xmlns:dc declaration');
        equals(xmlnsDc.nodeValue, this.ns.dc);
        var xmlnsFoaf = r.attributes.getNamedItemNS(this.ns.xmlns, 'foaf') || r.attributes.getNamedItem('xmlns:foaf');
        assert(xmlnsFoaf !== undefined && xmlnsFoaf !== null, 'it should have an xmlns:foaf declaration');
        equals(xmlnsFoaf.nodeValue, this.ns.foaf);
        equals(r.childNodes.length, 2);
        var d = r.childNodes[0];
        equals(d.namespaceURI, this.ns.rdf);
        equals(d.nodeName, 'rdf:Description');
        var a = d.attributes.getNamedItemNS(this.ns.rdf, 'about') || d.attributes.getNamedItem('rdf:about');
        assert(a !== undefined && a !== null, 'it should have an rdf:about attribute');
        equals(a.nodeValue, triples[0].subject.value);
        var p = d.childNodes[0];
        equals(p.namespaceURI, this.ns.dc);
        equals(p.nodeName, 'dc:creator');
        var a = p.attributes.getNamedItemNS(this.ns.rdf, 'resource') || p.attributes.getNamedItem('rdf:resource');
        assert(a !== undefined && a !== null, 'it should have an rdf:resource attribute');
        equals(a.nodeValue, triples[0].object.value);
        var d = r.childNodes[1];
        equals(d.namespaceURI, this.ns.rdf);
        equals(d.nodeName, 'rdf:Description');
        var a = d.attributes.getNamedItemNS(this.ns.rdf, 'about') || d.attributes.getNamedItem('rdf:about');
        assert(a !== undefined && a !== null, 'it should have an rdf:about attribute');
        equals(a.nodeValue, triples[1].subject.value);
        var p = d.childNodes[0];
        equals(p.namespaceURI, this.ns.foaf);
        equals(p.nodeName, 'foaf:img');
        var a = p.attributes.getNamedItemNS(this.ns.rdf, 'resource') || p.attributes.getNamedItem('rdf:resource');
        assert(a !== undefined && a !== null, 'it should have an rdf:resource attribute');
        equals(a.nodeValue, triples[1].object.value);
    },
    "loading JSON/RDF into a databank": function () {
        var json = {
            'http://example.com/aReallyGreatBoassert': {
                'http://purl.org/dc/elements/1.1/title': [ { type: 'literal', value: 'A Really Great Boassert' } ],
                'http://purl.org/dc/elements/1.1/creator': [ { type: 'bnode', value: '_:creator' } ],
                'http://purl.org/dc/terms/issued': [ { type: 'literal', value: '2004-01-19',
                    datatype: 'http://www.w3.org/2001/XMLSchema#date' } ]
            },
            '_:creator': {
                'http://www.w3.org/1999/02/22-rdf-syntax-ns#type': [ { type: 'uri', value: 'http://xmlns.com/foaf/0.1/Person' } ],
                'http://xmlns.com/foaf/0.1/name': [ { type: 'literal', value: 'John Doe' } ]
            }
        };
        var databank = graphite.rdf.databank();
        databank.load(json);
        equals(databank.size(), 5);
    },
    "loading RDF/XML into a databank": function () {
        var xml =
            '<rdf:Description xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"' +
                '    xmlns:dc="http://purl.org/dc/elements/1.1/"                         ' +
                '    rdf:about="http://www.w3.org/TR/rdf-syntax-grammar">                ' +
                '  <dc:title>RDF/XML Syntax Specification (Revised)</dc:title>           ' +
                '</rdf:Description>                                                      ';
        var doc = parseFromString(xml);
        var databank = graphite.rdf.databank();
        databank.load(doc);
        equals(databank.size(), 1);
        var triple = databank.triples()[0];
        equals(triple.subject.value.toString(), 'http://www.w3.org/TR/rdf-syntax-grammar');
        equals(triple.property.value.toString(), this.ns.dc + 'title');
        equals(triple.object.value.toString(), 'RDF/XML Syntax Specification (Revised)');
    },
    "loading RDF/XML with (anonymous) blank nodes into a databank": function () {
        var xml =
            '<rdf:Description rdf:about="http://www.w3.org/TR/rdf-syntax-grammar"' +
                '  xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"' +
                '  xmlns:ex="http://www.example.org/">' +
                '  <ex:editor>' +
                '    <rdf:Description>' +
                '      <ex:homePage>' +
                '        <rdf:Description rdf:about="http://purl.org/net/dajobe/">' +
                '        </rdf:Description>' +
                '      </ex:homePage>' +
                '    </rdf:Description>' +
                '  </ex:editor>' +
                '</rdf:Description>';
        var doc = parseFromString(xml);
        var databank = graphite.rdf.databank();
        databank.load(doc);
        equals(databank.size(), 2);
        var triple1 = databank.triples()[0];
        var triple2 = databank.triples()[1];
        equals(triple2.subject.value, 'http://www.w3.org/TR/rdf-syntax-grammar');
        equals(triple2.property.value, 'http://www.example.org/editor');
        equals(triple2.object, triple1.subject);
        equals(triple1.property.value, 'http://www.example.org/homePage');
        equals(triple1.object.value, 'http://purl.org/net/dajobe/');
    },
    "loading RDF/XML with multiple property elements": function () {
        var xml =
            '<rdf:Description rdf:about="http://www.w3.org/TR/rdf-syntax-grammar"' +
                '  xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"' +
                '  xmlns:dc="http://purl.org/dc/elements/1.1/"' +
                '  xmlns:ex="http://www.example.org/">' +
                '  <ex:editor>' +
                '    <rdf:Description>' +
                '      <ex:homePage>' +
                '        <rdf:Description rdf:about="http://purl.org/net/dajobe/">' +
                '        </rdf:Description>' +
                '      </ex:homePage>' +
                '      <ex:fullName>Dave Beckett</ex:fullName>' +
                '    </rdf:Description>' +
                '  </ex:editor>' +
                '  <dc:title>RDF/XML Syntax Specification (Revised)</dc:title>' +
                '</rdf:Description>';
        var doc = parseFromString(xml);
        var databank = graphite.rdf.databank();
        databank.load(doc);
        equals(databank.size(), 4);
    },
    "loading RDF/XML with an rdf:resource attribute": function () {
        var xml =
            '<rdf:Description rdf:about="http://www.w3.org/TR/rdf-syntax-grammar"' +
                '  xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"' +
                '  xmlns:dc="http://purl.org/dc/elements/1.1/"' +
                '  xmlns:ex="http://www.example.org/">' +
                '  <ex:editor>' +
                '    <rdf:Description>' +
                '      <ex:homePage rdf:resource="http://purl.org/net/dajobe/" />' +
                '      <ex:fullName>Dave Beckett</ex:fullName>' +
                '    </rdf:Description>' +
                '  </ex:editor>' +
                '  <dc:title>RDF/XML Syntax Specification (Revised)</dc:title>' +
                '</rdf:Description>';
        var doc = parseFromString(xml);
        var databank = graphite.rdf.databank();
        databank.load(doc);
        equals(databank.size(), 4);
    },
    "loading RDF/XML with property attributes": function () {
        var xml =
            '<rdf:Description rdf:about="http://www.w3.org/TR/rdf-syntax-grammar"' +
                '  dc:title="RDF/XML Syntax Specification (Revised)"' +
                '  xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"' +
                '  xmlns:dc="http://purl.org/dc/elements/1.1/"' +
                '  xmlns:ex="http://www.example.org/">' +
                '  <ex:editor>' +
                '    <rdf:Description ex:fullName="Dave Beckett">' +
                '      <ex:homePage rdf:resource="http://purl.org/net/dajobe/"/>' +
                '    </rdf:Description>' +
                '  </ex:editor>' +
                '</rdf:Description>';
        var doc = parseFromString(xml);
        var databank = graphite.rdf.databank();
        databank.load(doc);
        equals(databank.size(), 4);
    },
    "loading RDF/XML whose document element is an rdf:RDF element": function () {
        var xml =
            '<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"' +
                '         xmlns:dc="http://purl.org/dc/elements/1.1/"' +
                '         xmlns:ex="http://example.org/stuff/1.0/">' +
                '  <rdf:Description rdf:about="http://www.w3.org/TR/rdf-syntax-grammar"' +
                '		   dc:title="RDF/XML Syntax Specification (Revised)">' +
                '    <ex:editor>' +
                '      <rdf:Description ex:fullName="Dave Beckett">' +
                '	<ex:homePage rdf:resource="http://purl.org/net/dajobe/" />' +
                '      </rdf:Description>' +
                '    </ex:editor>' +
                '  </rdf:Description>' +
                '</rdf:RDF>';
        var doc = parseFromString(xml);
        var databank = graphite.rdf.databank();
        databank.load(doc);
        equals(databank.size(), 4);
    },
    "loading RDF/XML with xml:lang attributes in it": function () {
        var xml =
            '<rdf:Description xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"' +
                '  xmlns:dc="http://purl.org/dc/elements/1.1/"' +
                '  rdf:about="http://example.org/buecher/baum" xml:lang="de">' +
                '  <dc:title>Der Baum</dc:title>' +
                '  <dc:description>Das Buch ist außergewöhnlich</dc:description>' +
                '  <dc:title xml:lang="en">The Tree</dc:title>' +
                '</rdf:Description>';
        var doc = parseFromString(xml);
        var databank = graphite.rdf.databank();
        databank.load(doc);
        equals(databank.size(), 3);
        var triples = databank.triples();
        equals(triples[0].object.value, 'Der Baum');
        equals(triples[0].object.lang, 'de');
        equals(triples[1].object.lang, 'de');
        equals(triples[2].object.lang, 'en');
    },
    "loading RDF/XML with xml:lang attributes on property elements": function () {
        var xml =
            '<rdf:Description xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"' +
                '  xmlns:dc="http://purl.org/dc/elements/1.1/"' +
                '  rdf:about="http://example.org/buecher/baum">' +
                '  <dc:title xml:lang="de">Der Baum</dc:title>' +
                '  <dc:description xml:lang="de">Das Buch ist außergewöhnlich</dc:description>' +
                '  <dc:title xml:lang="en">The Tree</dc:title>' +
                '</rdf:Description>';
        var doc = parseFromString(xml);
        var databank = graphite.rdf.databank();
        databank.load(doc);
        equals(databank.size(), 3);
        var triples = databank.triples();
        equals(triples[0].object.value, 'Der Baum');
        equals(triples[0].object.lang, 'de');
        equals(triples[1].object.value, 'Das Buch ist außergewöhnlich');
        equals(triples[1].object.lang, 'de');
        equals(triples[2].object.value, 'The Tree');
        equals(triples[2].object.lang, 'en');
    },
    "loading RDF/XML containing XML literals": function () {
        var xml =
            '<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"' +
                '         xmlns:ex="http://example.org/stuff/1.0/">' +
                '  <rdf:Description rdf:about="http://example.org/item01">' +
                '    <ex:prop rdf:parseType="Literal"' +
                '             xmlns:a="http://example.org/a#">' +
                '      <a:Box required="true"><a:widget size="10" /><a:grommit id="23" /></a:Box>' +
                '    </ex:prop>' +
                '  </rdf:Description>' +
                '</rdf:RDF>';
        var doc = parseFromString(xml);
        var databank = graphite.rdf.databank();
        databank.load(doc);
        equals(databank.size(), 1);
        equals(databank.triples()[0].object.value, '<a:Box xmlns:a="http://example.org/a#" required="true"><a:widget size="10"/><a:grommit id="23"/></a:Box>');
        equals(databank.triples()[0].object.datatype, this.ns.rdf + 'XMLLiteral');
    },
    "loading RDF/XML with a property whose value has a datatype": function () {
        var xml =
            '<rdf:Description rdf:about="http://example.org/item01"' +
                '  xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"' +
                '  xmlns:ex="http://www.example.org/">' +
                '  <ex:size rdf:datatype="http://www.w3.org/2001/XMLSchema#int">123</ex:size>' +
                '</rdf:Description>';
        var doc = parseFromString(xml);
        var databank = graphite.rdf.databank();
        databank.load(doc);
        equals(databank.size(), 1);
        equals(databank.triples()[0].object.value, '123');
        equals(databank.triples()[0].object.datatype, this.ns.xsd + 'int');
    },
    "loading RDF/XML with identified blank nodes": function () {
        var xml =
            '<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"' +
                '         xmlns:dc="http://purl.org/dc/elements/1.1/"' +
                '         xmlns:ex="http://example.org/stuff/1.0/">' +
                '  <rdf:Description rdf:about="http://www.w3.org/TR/rdf-syntax-grammar"' +
                '		   dc:title="RDF/XML Syntax Specification (Revised)">' +
                '    <ex:editor rdf:nodeID="abc"/>' +
                '  </rdf:Description>' +
                '  <rdf:Description rdf:nodeID="abc"' +
                '                   ex:fullName="Dave Beckett">' +
                '    <ex:homePage rdf:resource="http://purl.org/net/dajobe/"/>' +
                '  </rdf:Description>' +
                '</rdf:RDF>';
        var doc = parseFromString(xml);
        var databank = graphite.rdf.databank();
        databank.load(doc);
        equals(databank.size(), 4);
        equals(databank.triples()[1].object.type, 'bnode');
        equals(databank.triples()[1].object.value, '_:abc');
        equals(databank.triples()[2].subject.type, 'bnode');
        equals(databank.triples()[2].subject.value, '_:abc');
    },
    "loading RDF/XML with rdf:parseType='Resource'": function () {
        var xml =
            '<rdf:Description rdf:about="http://www.w3.org/TR/rdf-syntax-grammar"' +
                '  xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"' +
                '  xmlns:dc="http://purl.org/dc/elements/1.1/"' +
                '  xmlns:ex="http://example.org/stuff/1.0/"' +
                '	 dc:title="RDF/XML Syntax Specification (Revised)">' +
                '  <ex:editor rdf:parseType="Resource">' +
                '    <ex:fullName>Dave Beckett</ex:fullName>' +
                '    <ex:homePage rdf:resource="http://purl.org/net/dajobe/"/>' +
                '  </ex:editor>' +
                '</rdf:Description>';
        var doc = parseFromString(xml);
        var databank = graphite.rdf.databank();
        databank.load(doc);
        equals(databank.size(), 4);
        var triples = databank.triples();
        equals(triples[3].object, triples[1].subject);
    },
    "loading RDF/XML with a property element having property attributes": function () {
        var xml =
            '<rdf:Description rdf:about="http://www.w3.org/TR/rdf-syntax-grammar"' +
                '  xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"' +
                '  xmlns:dc="http://purl.org/dc/elements/1.1/"' +
                '  xmlns:ex="http://example.org/stuff/1.0/"' +
                '	   dc:title="RDF/XML Syntax Specification (Revised)">' +
                '  <ex:editor ex:fullName="Dave Beckett" />' +
                '</rdf:Description>';
        var doc = parseFromString(xml);
        var databank = graphite.rdf.databank();
        databank.load(doc);
        equals(databank.size(), 3);
    },
    "loading RDF/XML with typed node elements": function () {
        var xml =
            '<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"' +
                '         xmlns:dc="http://purl.org/dc/elements/1.1/"' +
                '         xmlns:ex="http://example.org/stuff/1.0/">' +
                '  <ex:Document rdf:about="http://example.org/thing">' +
                '    <dc:title>A marvelous thing</dc:title>' +
                '  </ex:Document>' +
                '</rdf:RDF>';
        var doc = parseFromString(xml);
        var databank = graphite.rdf.databank();
        databank.load(doc);
        equals(databank.size(), 2);
        equals(databank.triples()[0].property.value, this.ns.rdf + 'type');
        equals(databank.triples()[0].object.value, 'http://example.org/stuff/1.0/Document');
    },
    "loading RDF/XML with xml:base and rdf:ID attributes": function () {
        var xml =
            '<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"' +
                '         xmlns:ex="http://example.org/stuff/1.0/"' +
                '         xml:base="http://example.org/here/">' +
                '  <rdf:Description rdf:ID="snack">' +
                '    <ex:prop rdf:resource="fruit/apple"/>' +
                '  </rdf:Description>' +
                '</rdf:RDF>';
        var doc = parseFromString(xml);
        var databank = graphite.rdf.databank();
        databank.load(doc);
        var triples = databank.triples();
        equals(triples[0].subject.value, 'http://example.org/here/#snack');
        equals(triples[0].object.value, 'http://example.org/here/fruit/apple');
    },
    "loading RDF/XML with rdf:li elements": function () {
        var xml =
            '<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">' +
                '  <rdf:Seq rdf:about="http://example.org/favourite-fruit">' +
                '    <rdf:li rdf:resource="http://example.org/banana"/>' +
                '    <rdf:li rdf:resource="http://example.org/apple"/>' +
                '    <rdf:li rdf:resource="http://example.org/pear"/>' +
                '  </rdf:Seq>' +
                '</rdf:RDF>';
        var doc = parseFromString(xml);
        var databank = graphite.rdf.databank();
        databank.load(doc);
        var triples = databank.triples();
        equals(triples.length, 4);
        equals(triples[1].property.value, this.ns.rdf + '_1');
        equals(triples[2].property.value, this.ns.rdf + '_2');
        equals(triples[3].property.value, this.ns.rdf + '_3');
    },
    "loading RDF/XML with parseType='Collection'": function () {
        var xml =
            '<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"' +
                '         xmlns:ex="http://example.org/stuff/1.0/">' +
                '  <rdf:Description rdf:about="http://example.org/basket">' +
                '    <ex:hasFruit rdf:parseType="Collection">' +
                '      <rdf:Description rdf:about="http://example.org/banana"/>' +
                '      <rdf:Description rdf:about="http://example.org/apple"/>' +
                '      <rdf:Description rdf:about="http://example.org/pear"/>' +
                '    </ex:hasFruit>' +
                '  </rdf:Description>' +
                '</rdf:RDF>';
        var doc = parseFromString(xml);
        var databank = graphite.rdf.databank();
        databank.load(doc);
        var triples = databank.triples();
        // 0: _:b1 rdf:first <http://example.org/banana>
        // 1: _:b1 rdf:rest _:b2
        // 2: _:b2 rdf:first <http://example.org/apple>
        // 3: _:b2 rdf:rest _:b3
        // 4: _:b3 rdf:first <http://example.org/pear>
        // 5: _:b3 rdf:rest rdf:nil
        // 6: <http://example.org/basket> ex:hasFruit _:b1
        equals(triples[0].property.value, this.ns.rdf + 'first');
        equals(triples[0].object.value, 'http://example.org/banana');
        equals(triples[6].object, triples[1].subject);
        equals(triples[1].property.value, this.ns.rdf + 'rest');
        equals(triples[1].object, triples[2].subject);
        equals(triples[2].property.value, this.ns.rdf + 'first');
        equals(triples[2].object.value, 'http://example.org/apple');
        equals(triples[1].object, triples[3].subject);
        equals(triples[3].property.value, this.ns.rdf + 'rest');
        equals(triples[3].object, triples[4].subject);
        equals(triples[4].property.value, this.ns.rdf + 'first');
        equals(triples[4].object.value, 'http://example.org/pear');
        equals(triples[3].object, triples[5].subject);
        equals(triples[5].property.value, this.ns.rdf + 'rest');
        equals(triples[5].object.value, this.ns.rdf + 'nil');
        equals(triples[6].subject.value, 'http://example.org/basket');
        equals(triples[6].property.value, 'http://example.org/stuff/1.0/hasFruit');
        equals(triples[6].object.type, 'bnode');
        equals(triples[6].object, triples[0].subject);
    },
    "loading RDF/XML with rdf:IDs to reify triples": function () {
        var xml =
            '<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"' +
                '         xmlns:ex="http://example.org/stuff/1.0/"' +
                '         xml:base="http://example.org/triples/">' +
                '  <rdf:Description rdf:about="http://example.org/">' +
                '    <ex:prop rdf:ID="triple1">blah</ex:prop>' +
                '  </rdf:Description>' +
                '</rdf:RDF>';
        var doc = parseFromString(xml);
        var databank = graphite.rdf.databank();
        databank.load(doc);
        var triples = databank.triples();
        equals(triples.length, 4);
        equals(triples[0].subject.value, 'http://example.org/');
        equals(triples[0].property.value, 'http://example.org/stuff/1.0/prop');
        equals(triples[0].object.value, 'blah');
        equals(triples[1].subject.value, 'http://example.org/triples/#triple1');
        equals(triples[1].property.value, this.ns.rdf + 'subject');
        equals(triples[1].object.value, 'http://example.org/');
        equals(triples[2].subject.value, 'http://example.org/triples/#triple1');
        equals(triples[2].property.value, this.ns.rdf + 'property');
        equals(triples[2].object.value, 'http://example.org/stuff/1.0/prop');
        equals(triples[3].subject.value, 'http://example.org/triples/#triple1');
        equals(triples[3].property.value, this.ns.rdf + 'object');
        equals(triples[3].object.value, 'blah');
    }
},
*/