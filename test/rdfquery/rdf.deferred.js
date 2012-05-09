/*
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