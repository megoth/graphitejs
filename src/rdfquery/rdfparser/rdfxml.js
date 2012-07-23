define([
    "../../graphite/rdf",
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
     *  jquery.Dictionary.js
     *  jquery.Dictionary.json.js
     *  jquery.Dictionary.xml.js
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
            var basename
            //console.log("TEST", elem.getAttributeNS);
            if (elem.getAttributeNS) {
                return elem.getAttributeNS(namespace, name);
            } else {
                try {
                    basename = /:/.test(name) ? /:(.+)$/.exec(name)[1] : name;
                    return elem.attributes.getQualifiedItem(basename, namespace).nodeValue;
                } catch (e) {
                    var tmp = getDefaultNamespacePrefix(namespace) + ':' + name;

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
                subject = RDF.Symbol(RDF.resource('<' + s + '>', { base: base }).value);
            } else if (hasAttributeNS(elem, rdfNs, 'ID')) {
                s = getAttributeNS(elem, rdfNs, 'ID');
                subject = RDF.Symbol(RDF.resource('<#' + s + '>', { base: base }).value);
            } else if (hasAttributeNS(elem, rdfNs, 'nodeID')) {
                s = getAttributeNS(elem, rdfNs, 'nodeID');
                subject = RDF.BlankNode(s);
            } else {
                subject = RDF.BlankNode();
            }
            return subject;
        },
        parseRdfXmlDescription = function (elem, isDescription, graph, base, lang) {
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
                triples = [],
                tmpObject1,
                tmpObject2;
            lang = getAttributeNS(elem, 'http://www.w3.org/XML/1998/namespace', 'lang') || lang;
            base = getAttributeNS(elem, 'http://www.w3.org/XML/1998/namespace', 'base') || base;
            if (lang !== null && lang !== undefined && lang !== '') {
                literalOpts = { lang: lang };
            }
            subject = parseRdfXmlSubject(elem, base);
            if (isDescription && (elem.namespaceURI !== rdfNs || getLocalName(elem) !== 'Description')) {
                property = RDF.Symbol(RDF.type.value);
                object = RDF.Symbol(elem.namespaceURI + getLocalName(elem));
                graph.add(subject, property, object);
            }
            for (i = 0; i < elem.attributes.length; i += 1) {
                p = elem.attributes.item(i);
                if (p.namespaceURI !== undefined &&
                    p.namespaceURI !== 'http://www.w3.org/2000/xmlns/' &&
                    p.namespaceURI !== 'http://www.w3.org/XML/1998/namespace' &&
                    p.prefix !== 'xmlns' &&
                    p.prefix !== 'xml') {
                    if (p.namespaceURI !== rdfNs) {
                        property = RDF.Symbol(p.namespaceURI + getLocalName(p));
                        object = RDF.Literal(literalOpts.lang ? p.nodeValue : '"' + p.nodeValue.replace(/"/g, '\\"'), literalOpts.lang);
                        graph.add(subject, property, object);
                    } else if (getLocalName(p) === 'type') {
                        property = RDF.Symbol(RDF.type.value);
                        object = RDF.Symbol(RDF.resource('<' + p.nodeValue + '>', { base: base }).value);
                        graph.add(subject, property, object);
                    }
                }
            }
            var parentLang = lang;
            for (i = 0; i < elem.childNodes.length; i += 1) {
                p = elem.childNodes[i];
                if (p.nodeType === 1) {
                    if (p.namespaceURI === rdfNs && getLocalName(p) === 'li') {
                        property = RDF.Symbol(rdfNs + '_' + li);
                        li += 1;
                    } else {
                        property = RDF.Symbol(p.namespaceURI + getLocalName(p));
                    }
                    lang = getAttributeNS(p, 'http://www.w3.org/XML/1998/namespace', 'lang') || parentLang;
                    if (lang !== null && lang !== undefined && lang !== '') {
                        literalOpts = { lang: lang };
                    } else {
                        literalOpts = {};
                    }
                    if (hasAttributeNS(p, rdfNs, 'resource')) {
                        o = getAttributeNS(p, rdfNs, 'resource');
                        object = RDF.Symbol(RDF.resource('<' + o + '>', { base: base }).value);
                    } else if (hasAttributeNS(p, rdfNs, 'nodeID')) {
                        o = getAttributeNS(p, rdfNs, 'nodeID');
                        object = RDF.BlankNode(o);
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
                            object = RDF.Literal(o, null, RDF.Symbol(rdfNs + 'XMLLiteral'));
                        } else if (parseType === 'Resource') {
                            tmpObject1 = Utils.last(graph.statements);
                            parseRdfXmlDescription(p, false, graph, base, lang);
                            tmpObject2 = Utils.last(graph.statements);
                            //console.log("TMP OBJECT 1", tmpObject1);
                            if (tmpObject1 && tmpObject1 !== tmpObject2) {
                                object = tmpObject2;
                            } else {
                                object = RDF.BlankNode();
                            }
                        } else if (parseType === 'Collection') {
                            if (p.getElementsByTagName('*').length > 0) {
                                for (j = 0; j < p.childNodes.length; j += 1) {
                                    o = p.childNodes[j];
                                    if (o.nodeType === 1) {
                                        collectionItems.push(o);
                                    }
                                }
                                collection1 = RDF.BlankNode();
                                object = collection1;
                                for (j = 0; j < collectionItems.length; j += 1) {
                                    o = collectionItems[j];
                                    tmpObject1 = Utils.last(graph.statements);
                                    parseRdfXmlDescription(o, true, graph, base, lang);
                                    tmpObject2 = Utils.last(graph.statements);
                                    //console.log("TMP OBJECT 2", tmpObject1);
                                    if (tmpObject1 && tmpObject1 !== tmpObject2) {
                                        collectionItem = tmpObject2;
                                    } else {
                                        collectionItem = parseRdfXmlSubject(o);
                                    }
                                    graph.add(collection1, RDF.Symbol(RDF.first.value), collectionItem);
                                    if (j === collectionItems.length - 1) {
                                        graph.add(collection1, RDF.Symbol(RDF.rest.value), RDF.Symbol(RDF.nil.value));
                                    } else {
                                        collection2 = RDF.BlankNode();
                                        graph.add(collection1, RDF.Symbol(RDF.rest.value), collection2);
                                        collection1 = collection2;
                                    }
                                }
                            } else {
                                object = RDF.nil;
                            }
                        }
                    } else if (hasAttributeNS(p, rdfNs, 'datatype')) {
                        o = p.childNodes[0] ? p.childNodes[0].nodeValue : "";
                        object = RDF.Literal(o, null, RDF.Symbol(getAttributeNS(p, rdfNs, 'datatype')));
                    } else if (p.getElementsByTagName('*').length > 0) {
                        for (j = 0; j < p.childNodes.length; j += 1) {
                            o = p.childNodes[j];
                            if (o.nodeType === 1) {
                                tmpObject1 = Utils.last(graph.statements);
                                parseRdfXmlDescription(o, true, graph, base, lang);
                                tmpObject2 = Utils.last(graph.statements);
                                //console.log("TMP OBJECT 3", tmpObject1);
                                if (tmpObject1 && tmpObject1 !== tmpObject2) {
                                    object = tmpObject2;
                                } else {
                                    object = parseRdfXmlSubject(o);
                                }
                            }
                        }
                    } else if (p.childNodes.length > 0) {
                        o = p.childNodes[0].nodeValue;
                        object = RDF.Literal(literalOpts.lang ? o : '"' + o.replace(/"/g, '\\"') + '"', literalOpts.lang);
                    } else {
                        tmpObject1 = Utils.last(graph.statements);
                        parseRdfXmlDescription(p, false, graph, base, lang);
                        tmpObject2 = Utils.last(graph.statements);
                        //console.log("TMP OBJECT 4", tmpObject1, graph.statements, tmpObject2);
                        if (tmpObject1 && tmpObject1 !== tmpObject2) {
                            object = tmpObject2;
                        } else {
                            object = RDF.BlankNode();
                        }
                    }
                    graph.add(subject, property, object);
                    if (hasAttributeNS(p, rdfNs, 'ID')) {
                        reified = RDF.Symbol(RDF.resource('<#' + getAttributeNS(p, rdfNs, 'ID') + '>', { base: base }).value);
                        graph.add(reified, RDF.Symbol(RDF.subject.value), subject);
                        graph.add(reified, RDF.Symbol(RDF.property.value), property);
                        graph.add(reified, RDF.Symbol(RDF.object.value), object);
                    }
                }
            }
            return graph;
        },
        parseRdfXml = function (doc, options) {
            options = options || {};
            var base,
                lang,
                graph = RDF.Formula(options.graph);
            if (doc.documentElement.namespaceURI === rdfNs && getLocalName(doc.documentElement) === 'RDF') {
                lang = getAttributeNS(doc.documentElement, 'http://www.w3.org/XML/1998/namespace', 'lang');
                base = getAttributeNS(doc.documentElement, 'http://www.w3.org/XML/1998/namespace', 'base') || URI.base();
                Utils.each(doc.documentElement.childNodes, function (d) {
                    if (d.nodeType === 1) {
                        parseRdfXmlDescription(d, true, graph, base, lang);
                    }
                });
            } else {
                parseRdfXmlDescription(doc.documentElement, true, graph);
            }
            return graph;
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
        callback(parseRdfXml(doc, options));
    };
});