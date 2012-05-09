define([
    "../rdf",
    "../uri",
    "../../graphite/utils"
], function (RDF, URI, Utils) {
    /*
     * jQuery RDF @VERSION
     *
     * Copyright (c) 2008,2009 Jeni Tennison
     * Licensed under the MIT (MIT-LICENSE.txt)
     *
     * Depends:
     *  jquery.uri.js
     *  jquery.xmlns.js
     *  jquery.datatype.js
     *  jquery.curie.js
     *  jquery.rdf.js
     *  jquery.rdf.json.js
     *  jquery.rdf.xml.js
     *
     * @fileOverview jQuery RDF/XML parser
     * @author <a href="mailto:jeni@jenitennison.com">Jeni Tennison</a>
     * @copyright (c) 2008,2009 Jeni Tennison
     * @license MIT license (MIT-LICENSE.txt)
     * @version 1.0
     */
    var rdfNs = "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
        getDefaultNamespacePrefix = function (namespaceUri) {
            switch (namespaceUri) {
                case 'http://www.w3.org/1999/02/22-rdf-syntax-ns':
                    return 'rdf';
                case 'http://www.w3.org/XML/1998/namespace':
                    return 'xml';
                case 'http://www.w3.org/2000/xmlns/':
                    return 'xmlns';
                default:
                    throw ('No default prefix mapped for namespace ' + namespaceUri);
            }
        },
        hasAttributeNS  = function(elem, namespace, name){
            var basename;
            if (elem.hasAttributeNS) {
                return elem.hasAttributeNS(namespace, name);
            } else {
                try {
                    basename = /:/.test(name) ? /:(.+)$/.exec(name)[1] : name;
                    return elem.attributes.getQualifiedItem(basename, namespace) !== null;
                } catch (e) {
                    return elem.getAttribute(getDefaultNamespacePrefix(namespace) + ':' + name) !== null;
                }
            }
        },
        getAttributeNS = function(elem, namespace, name){
            var basename;
            if (elem.getAttributeNS) {
                return elem.getAttributeNS(namespace, name);
            } else {
                try {
                    basename = /:/.test(name) ? /:(.+)$/.exec(name)[1] : name;
                    return elem.attributes.getQualifiedItem(basename, namespace).nodeValue;
                } catch (e) {
                    return elem.getAttribute(getDefaultNamespacePrefix(namespace) + ':' + name);
                }
            }
        },
        getLocalName = function(elem){
            return elem.localName || elem.baseName;
        },
        parseRdfXmlSubject = function (elem, base) {
            var s, subject;
            if (hasAttributeNS(elem, rdfNs, 'about')) {
                s = getAttributeNS(elem, rdfNs, 'about');
                subject = RDF.resource('<' + s + '>', { base: base });
            } else if (hasAttributeNS(elem, rdfNs, 'ID')) {
                s = getAttributeNS(elem, rdfNs, 'ID');
                subject = RDF.resource('<#' + s + '>', { base: base });
            } else if (hasAttributeNS(elem, rdfNs, 'nodeID')) {
                s = getAttributeNS(elem, rdfNs, 'nodeID');
                subject = RDF.blank('_:' + s);
            } else {
                subject = RDF.blank('[]');
            }
            return subject;
        },
        parseRdfXmlDescription = function (elem, isDescription, base, lang) {
            var subject,
                p,
                property,
                o,
                object,
                reified,
                i,
                j,
                li = 1,
                collection1,
                collection2,
                collectionItem,
                collectionItems = [],
                parseType,
                serializer,
                literalOpts = {},
                oTriples,
                triples = [];
            lang = getAttributeNS(elem, 'http://www.w3.org/XML/1998/namespace', 'lang') || lang;
            base = getAttributeNS(elem, 'http://www.w3.org/XML/1998/namespace', 'base') || base;
            if (lang !== null && lang !== undefined && lang !== '') {
                literalOpts = { lang: lang };
            }
            subject = parseRdfXmlSubject(elem, base);
            if (isDescription && (elem.namespaceURI !== rdfNs || getLocalName(elem) !== 'Description')) {
                property = RDF.type;
                object = RDF.resource('<' + elem.namespaceURI + getLocalName(elem) + '>');
                triples.push(RDF.triple(subject, property, object));
            }
            for (i = 0; i < elem.attributes.length; i += 1) {
                p = elem.attributes.item(i);
                if (p.namespaceURI !== undefined &&
                    p.namespaceURI !== 'http://www.w3.org/2000/xmlns/' &&
                    p.namespaceURI !== 'http://www.w3.org/XML/1998/namespace' &&
                    p.prefix !== 'xmlns' &&
                    p.prefix !== 'xml') {
                    if (p.namespaceURI !== rdfNs) {
                        property = RDF.resource('<' + p.namespaceURI + getLocalName(p) + '>');
                        object = RDF.literal(literalOpts.lang ? p.nodeValue : '"' + p.nodeValue.replace(/"/g, '\\"') + '"', literalOpts);
                        triples.push(RDF.triple(subject, property, object));
                    } else if (getLocalName(p) === 'type') {
                        property = RDF.type;
                        object = RDF.resource('<' + p.nodeValue + '>', { base: base });
                        triples.push(RDF.triple(subject, property, object));
                    }
                }
            }
            var parentLang = lang;
            for (i = 0; i < elem.childNodes.length; i += 1) {
                p = elem.childNodes[i];
                if (p.nodeType === 1) {
                    if (p.namespaceURI === rdfNs && getLocalName(p) === 'li') {
                        property = RDF.resource('<' + rdfNs + '_' + li + '>');
                        li += 1;
                    } else {
                        property = RDF.resource('<' + p.namespaceURI + getLocalName(p) + '>');
                    }
                    lang = getAttributeNS(p, 'http://www.w3.org/XML/1998/namespace', 'lang') || parentLang;
                    if (lang !== null && lang !== undefined && lang !== '') {
                        literalOpts = { lang: lang };
                    } else {
                        literalOpts = {};
                    }
                    if (hasAttributeNS(p, rdfNs, 'resource')) {
                        o = getAttributeNS(p, rdfNs, 'resource');
                        object = RDF.resource('<' + o + '>', { base: base });
                    } else if (hasAttributeNS(p, rdfNs, 'nodeID')) {
                        o = getAttributeNS(p, rdfNs, 'nodeID');
                        object = RDF.blank('_:' + o);
                    } else if (hasAttributeNS(p, rdfNs, 'parseType')) {
                        parseType = getAttributeNS(p, rdfNs, 'parseType');
                        if (parseType === 'Literal') {
                            try {
                                serializer = new XMLSerializer();
                                o = serializer.serializeToString(p.getElementsByTagName('*')[0]);
                            } catch (e) {
                                o = "";
                                for (j = 0; j < p.childNodes.length; j += 1) {
                                    o += p.childNodes[j].xml;
                                }
                            }
                            object = RDF.literal(o, { datatype: rdfNs + 'XMLLiteral' });
                        } else if (parseType === 'Resource') {
                            oTriples = parseRdfXmlDescription(p, false, base, lang);
                            if (oTriples.length > 0) {
                                object = oTriples[oTriples.length - 1].subject;
                                triples = triples.concat(oTriples);
                            } else {
                                object = RDF.blank('[]');
                            }
                        } else if (parseType === 'Collection') {
                            if (p.getElementsByTagName('*').length > 0) {
                                for (j = 0; j < p.childNodes.length; j += 1) {
                                    o = p.childNodes[j];
                                    if (o.nodeType === 1) {
                                        collectionItems.push(o);
                                    }
                                }
                                collection1 = RDF.blank('[]');
                                object = collection1;
                                for (j = 0; j < collectionItems.length; j += 1) {
                                    o = collectionItems[j];
                                    oTriples = parseRdfXmlDescription(o, true, base, lang);
                                    if (oTriples.length > 0) {
                                        collectionItem = oTriples[oTriples.length - 1].subject;
                                        triples = triples.concat(oTriples);
                                    } else {
                                        collectionItem = parseRdfXmlSubject(o);
                                    }
                                    triples.push(RDF.triple(collection1, RDF.first, collectionItem));
                                    if (j === collectionItems.length - 1) {
                                        triples.push(RDF.triple(collection1, RDF.rest, RDF.nil));
                                    } else {
                                        collection2 = RDF.blank('[]');
                                        triples.push(RDF.triple(collection1, RDF.rest, collection2));
                                        collection1 = collection2;
                                    }
                                }
                            } else {
                                object = RDF.nil;
                            }
                        }
                    } else if (hasAttributeNS(p, rdfNs, 'datatype')) {
                        o = p.childNodes[0] ? p.childNodes[0].nodeValue : "";
                        object = RDF.literal(o, { datatype: getAttributeNS(p, rdfNs, 'datatype') });
                    } else if (p.getElementsByTagName('*').length > 0) {
                        for (j = 0; j < p.childNodes.length; j += 1) {
                            o = p.childNodes[j];
                            if (o.nodeType === 1) {
                                oTriples = parseRdfXmlDescription(o, true, base, lang);
                                if (oTriples.length > 0) {
                                    object = oTriples[oTriples.length - 1].subject;
                                    triples = triples.concat(oTriples);
                                } else {
                                    object = parseRdfXmlSubject(o);
                                }
                            }
                        }
                    } else if (p.childNodes.length > 0) {
                        o = p.childNodes[0].nodeValue;
                        object = RDF.literal(literalOpts.lang ? o : '"' + o.replace(/"/g, '\\"') + '"', literalOpts);
                    } else {
                        oTriples = parseRdfXmlDescription(p, false, base, lang);
                        if (oTriples.length > 0) {
                            object = oTriples[oTriples.length - 1].subject;
                            triples = triples.concat(oTriples);
                        } else {
                            object = RDF.blank('[]');
                        }
                    }
                    triples.push(RDF.triple(subject, property, object));
                    if (hasAttributeNS(p, rdfNs, 'ID')) {
                        reified = RDF.resource('<#' + getAttributeNS(p, rdfNs, 'ID') + '>', { base: base });
                        triples.push(RDF.triple(reified, RDF.subject, subject));
                        triples.push(RDF.triple(reified, RDF.property, property));
                        triples.push(RDF.triple(reified, RDF.object, object));
                    }
                }
            }
            return triples;
        },
        parseRdfXml = function (doc) {
            var base, lang, triples = [];
            if (doc.documentElement.namespaceURI === rdfNs && getLocalName(doc.documentElement) === 'RDF') {
                lang = getAttributeNS(doc.documentElement, 'http://www.w3.org/XML/1998/namespace', 'lang');
                base = getAttributeNS(doc.documentElement, 'http://www.w3.org/XML/1998/namespace', 'base') || URI.base();
                triples = Utils.flatten(Utils.without(Utils.map(doc.documentElement.childNodes, function (d) {
                    if (d.nodeType === 1) {
                        return parseRdfXmlDescription(d, true, base, lang);
                    } else {
                        return null;
                    }
                }), null));
            } else {
                triples = parseRdfXmlDescription(doc.documentElement, true);
            }
            return triples;
        };
    return function (data, options, callback) {
        var doc;
        try {
            doc = new ActiveXObject("Microsoft.XMLDOM");
            doc.async = "false";
            doc.loadXML(data);
        } catch(e) {
            var parser = new DOMParser();
            doc = parser.parseFromString(data, 'text/xml');
        }
        var triples = parseRdfXml(doc);
        callback(triples);
    };
});