define([
    "./../rdfquery/curie",
    "./../rdfquery/uri",
    "./utils"
], function (CURIE, URI, Utils) {
    function getDataType(value) {
        if(Utils.isBoolean(value)) {
            return Symbol.XSDboolean;
        } else if (Utils.isInteger(value)) {
            //console.log("IN DICTIONARY, DATATYPE IS INTEGER", value);
            return Symbol.XSDinteger;
        } else if (Utils.isDouble(value)) {
            //console.log("IN DICTIONARY, DATATYPE IS DOUBLE", value);
            return Symbol.XSDfloat;
        }
        return null;
    }
    /**
     *
     * @param [object]
     * @param [options]
     * @return {*}
     */
    var uriRegex = /^<(([^>]|\\>)*)>$/,
        xsdNs = "http://www.w3.org/2001/XMLSchema#",
        rdfNs = "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
        rdfsNs = "http://www.w3.org/2000/01/rdf-schema#",
        /**
         * Takes a value and converts it to a literal accordingly to the Turtle-format
         *
         * @param literal {String|Integer} The value to check
         * @param options {Object} Looks for one of two properties, ie. lang or datatype
         * @return {String} The converted literal
         */
        createLiteral = function (literal) {
            var tmp,
                lang,
                type;
            if (Utils.isObject(literal)) {
                lang = literal.lang;
                type = literal.datatype;
                literal = '"' + literal.value + '"';
            }
            if (Utils.isString(literal)) {
                tmp = literal[0] === '"' ? literal : '"' + literal + '"';
            } else {
                tmp = '"' + literal + '"';
            }
            if (lang) {
                tmp += "@" + lang;
            } else if (type && Utils.isUri(type)) {
                tmp += "^^<" + type + ">";
            } else if (type) {
                tmp += "^^" + type;
            } else {
                type = getDatatype(literal);
                if (type) {
                    tmp += "^^<" + type + ">";
                }
            }
            return tmp;
        },
        createObject = function (object, options) {
            options = options || {};
            if (object && !Utils.isString(object)) {
                if (options.base) {
                    return Symbol(URI('' + object, options.base));
                }
                if (options["isBlankNode"]) {
                    return BlankNode(object);
                }
                //console.log("IN DICTIONARY, OBJECT FALLS TO LITERAL");
                return Literal(object);
            }
            if (object && options.base) {
                return Symbol(URI(object, options.base));
            }
            if (object && Utils.isUri(object)) {
                return Symbol(object);
            }
            if (object) {
                //console.log("IN DICTIONARY, OBJECT IS LITERAL", object);
                return Literal(object);
            }
            return BlankNode();
        },
        /**
         *
         * @param predicate
         * @param [base]
         * @return {*}
         */
        createPredicate = function (predicate, base) {
            return Symbol(URI(predicate, base));
        },
        createResource = function (resource) {
            resource = Utils.isObject(resource) ? resource : {
                value: resource,
                token: getToken(resource)
            };
            return resource.token === "uri" ? '<' + resource.value + '>' : createLiteral(resource);
        },
        /**
         *
         * @param parts
         * @return {*}
         */
        createStatement = function (parts) {
            var subject = createSubject(parts.subject),
                predicate = createPredicate(parts.predicate),
                object = createObject(parts.object);
            return Statement(subject, predicate, object);
        },
        /**
         *
         * @param [subject]
         * @param [base]
         * @return {*}
         */
        createSubject = function (subject, base) {
            if (subject) {
                if (!Utils.isString(subject)) {
                    return BlankNode(subject);
                }
                return Symbol(URI(subject, base).toString());
            }
            return BlankNode();
        },
        //      Convert Javascript representation to RDF term object
        //
        createTerm = function (val, graph) {
            if (typeof val == 'object') {
                if (val instanceof Date) {
                    var d2=function (x) {
                        return(''+(100+x)).slice(1,3);
                    };  // format as just two digits
                    return Literal(
                        ''+ val.getUTCFullYear() + '-'+
                            d2(val.getUTCMonth()+1) +'-'+d2(val.getUTCDate())+
                            'T'+d2(val.getUTCHours())+':'+d2(val.getUTCMinutes())+
                            ':'+d2(val.getUTCSeconds())+'Z',
                        undefined, Symbol.XSDdateTime);
                } else if (val instanceof Array) {
                    var x = Collection(graph);
                    for (var i=0; i<val.length; i++) {
                        x.append(createTerm(val[i], graph));
                    }
                    return x;
                } else {
                    return val;
                }
            }
            if (typeof val == 'string') {
                return Literal(val);
            }
            if (typeof val == 'number') {
                //console.log("IN DICTIONARY, NUMBER");
                var dt;
                if ((''+val).indexOf('e')>=0) {
                    dt = Symbol.XSDfloat;
                } else if ((''+val).indexOf('.')>=0) {
                    dt = Symbol.XSDdecimal;
                } else {
                    dt = Symbol.XSDinteger;
                }
                return Literal(val, undefined, dt);
            }
            if (typeof val == 'boolean') {
                return Literal(val ? "1": "0", undefined, Symbol.XSDboolean);
            }
            if (typeof val == 'undefined') {
                return undefined;
            }
            throw ("Can't make term from " + val + " of type " + typeof val);
        },
        /**
         *
         * @param literal
         * @return {*}
         */
        getDatatype = function (literal) {
            var datatypeAt;
            if (Utils.isString(literal)) {
                datatypeAt = literal.indexOf('"^^');
                if (datatypeAt > 0) {
                    return literal.substring(datatypeAt + 4, literal.length - 1);
                }
                return undefined;
            } else if (Utils.isBoolean(literal)) {
                return "http://www.w3.org/2001/XMLSchema#boolean";
            } else if (Utils.isInteger(literal)) {
                return "http://www.w3.org/2001/XMLSchema#integer";
            } else if (Utils.isDouble(literal)) {
                return "http://www.w3.org/2001/XMLSchema#double";
            }
            return undefined;
        },
        getLang = function (literal) {
            var langAt;
            if (Utils.isString(literal)) {
                langAt = literal.indexOf('"@');
                if (langAt > 0) {
                    return literal.substring(langAt + 2);
                }
            }
            return undefined;
        },
        /**
         * Figures whether or not the given object is a uri or a literal
         * @param object {Varies} The object to check whether is a uri or a literal
         * @returns {String} Either uri or literal
         */
        getToken = function (object) {
            return Utils.isUri(object) ? "uri" : "literal";
        },
        getTriples = function (query) {
            var tripleRegex = /<(_:[0-9]+|http:\/\/[a-zA-Z0-9#_\-.\/]+)>\s+<http:\/\/[a-zA-Z0-9#_\-.\/]+>\s+("[a-zA-Z0-9\s\-_\/]+"\^\^<http:\/\/[a-zA-Z0-9#_\-.\/]+>|"[a-zA-Z0-9\s\-_\/]+"|<(_:[0-9]+|http:\/\/[a-zA-Z0-9#_\-.\/]+|)>)\s*[.]?/g,
                triples = query.match(tripleRegex);
            return triples !== null ? triples : [];
        },
        /**
         * Get a URI from a CURIE and given prefixes
         *
         * @param curie The CURIE that will be processed to a URI
         * @param prefixes A given map of prefixes
         * @returns {String} A processed string
         */
        getUri = function (curie, prefixes) {
            if (!curie) {
                return undefined;
            }
            curie = Utils.isString(prefixes[curie]) ? prefixes[curie] : curie;
            var isCurie = curie.match(/^[a-zA-Z]+:/),
                prefix,
                suffix;
            if (!isCurie || Utils.isUri(curie)) {
                return curie;
            }
            prefix = isCurie[0].replace(":", "");
            prefix = prefixes[prefix] || prefix + ":";
            suffix = curie.match(/^[a-zA-Z]+:([a-zA-Z]+)/);
            suffix = suffix ? suffix[1] : "";
            return prefix + suffix;
        },
        getValue = function (literal, datatype, lang) {
            if (!Utils.isString(literal)) {
                return literal;
            }
            if (datatype) {
                return literal.substring(1, literal.length - datatype.length - 5);
            } else if (lang) {
                return literal.substring(1, literal.length - lang.length - 2);
            }
            return literal;
        },
        NextId = 0, // Global genid
        NTAnonymousNodePrefix = "_:",
        idCounter = 0,
        toString = function () {
            return this.toNT();
        },
        // These are the classes corresponding to the RDF and N3 data models
        //
        // Designed to look like rdflib and cwm designs.
        //
        // Issues: Should the names start with RDF to make them
        //      unique as program-wide symbols?
        //
        // W3C open source licence 2005.
        //
        //	Symbol
        BlankNode = function (id) {
            return Object.create({
                toNT: function () {
                    return NTAnonymousNodePrefix + this.id
                },
                toString: toString,
                toQuads: function () {
                    return {'blank': NTAnonymousNodePrefix + this.id };
                }
            }, {
                id: { value: NextId++ },
                value: { value: id || NextId.toString() }
            });
        },
        Collection = function (graph) {
            return Object.create({
                toNT: function () {
                    return NTAnonymousNodePrefix + this.id
                },
                toString: toString,
                toQuads: function () {
                    var acum = [];
                    var subjectId = "_:list"+idCounter;
                    idCounter++;
                    var first = {'uri': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#first'};
                    var rest = {'uri': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#rest'};
                    var nil = {'uri': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#nil'};
                    var subject;
                    var nextSubject = function (i) {
                        return {
                            'blank': subjectId+"p"+i
                        }
                    };
                    for (var i=0; i<this.elements.length; i++) {
                        subject = nextSubject(i);
                        if(i<(this.elements.length-1)) {
                            nextSubject = nextSubject(i + 1);
                        } else {
                            nextSubject = nil;
                        }
                        acum.push({
                            'subject': subject,
                            'predicate': first,
                            'object': this.elements[i].toQuads(),
                            'graph': this.graph
                        });
                        acum.push({
                            'subject': subject,
                            'predicate': rest,
                            'object': nextSubject,
                            'graph': this.graph
                        });
                    }
                    return acum;
                },
                append: function (el) {
                    this.elements.push(el)
                },
                unshift: function (el){
                    this.elements.unshift(el);
                },
                shift: function (){
                    return this.elements.shift();
                },
                close: function () {
                    this.closed = true
                }
            }, {
                id: { value: NextId++ },
                elements: {
                    value: [],
                    writable: true
                },
                closed: {
                    value: false,
                    writable: true
                },
                graph: graph
            });
        },
        Empty = function () {
            return Object.create({
                toNT: function () {
                    return "()";
                },
                toString: toString,
                toQuads: function () {
                    return {
                        'uri': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#nil'
                    };
                }
            });
        },
        //	Formula
        //
        //	Set of statements.
        Formula = function (graph) {
            return Object.create({
                toNT: function () {
                    var statements = Utils.map(this.statements, function (s) {
                        return s.toNT();
                    });
                    return "{\n" + statements.join('\n') + "\n}";
                },
                toString: toString,
                toQuads: function () {
                    var accumulated = [];
                    for(var i=0; i<this.statements.length; i++) {
                        var nextValue = this.statements[i].toQuads();
                        if(nextValue.constructor === Array) {
                            accumulated = accumulated.concat(nextValue);
                        } else {
                            accumulated.push(nextValue);
                        }
                    }
                    return accumulated;
                },
                add: function (subj, pred, obj, why) {
                    this.statements.push(Statement(subj, pred, obj, why, this.graph));
                },
                // Convenience methods on a formula allow the creation of new RDF terms:
                sym: function (uri) {
                    return Symbol(uri)
                },
                literal: function (val, lang, dt) {
                    if(dt != null && dt.value != null && dt.value.indexOf("http://") === -1) {
                        for(var ns in this.namespaces) {
                            if(dt.value.indexOf(ns) === 0 && this.namespaces.hasOwnProperty(ns)) {
                                dt.value = this.namespaces[ns]+(dt.value.split(ns+":")[1]);
                                break;
                            }
                        }
                    }
                    //console.log("IN DICTIONARY, FORMULA LITERAL DATATYPE", dt);
                    return Literal(''+val, lang, dt)
                },
                bnode: function (id) {
                    return BlankNode(id)
                },
                formula: function () {
                    return Formula(this.graph);
                },
                collection: function () { // obsolete
                    return Collection(this.graph)
                },
                list: function (values) {
                    var li = Collection(this.graph);
                    if (values) {
                        for(var i = 0; i<values.length; i++) {
                            li.append(values[i]);
                        }
                    }
                    return li;
                }
            }, {
                statements: {
                    value: [],
                    writable: true
                },
                graph: { value: graph }
            });
        },
        Literal = function (value, lang, datatype) {
            return Object.create({
                toNT: function () {
                    var str = this.value;
                    if (typeof str != 'string') {
                        if (typeof str == 'number') return ''+str;
                        throw Error("Value of RDF literal is not string: "+str);
                    }
                    str = str.replace(/\\/g, '\\\\');  // escape backslashes
                    str = str.replace(/"/g, '\\"');    // escape quotes
                    str = str.replace(/\n/g, '\\n');    // escape newlines
                    str = '"' + str + '"';  //';
                    if (this.datatype){
                        //console.log("DATATYPE", this.datatype, this.datatype.toNT);
                        str = str + '^^{0}'.format(this.datatype.toNT());
                    } else if (this.lang) {
                        str = str + "@{0}".format(this.lang);
                    }
                    return str;
                },
                toString: toString,
                toQuads: function () {
                    var str = this.value;
                    if (typeof str != 'string') {
                        if (typeof str == 'number') {
                            return ''+str;
                        }
                        throw Error("Value of RDF literal is not string: "+str);
                    }
                    str = str.replace(/\\/g, '\\\\');  // escape backslashes
                    str = str.replace(/"/g, '\\"');    // escape quotes
                    str = str.replace(/\n/g, '\\n');    // escape newlines
                    str = '"' + str + '"';  //';
                    if (this.datatype){
                        str = str + '^^<{0}>'.format(this.datatype.value);
                    } else if (this.lang) {
                        str = str + '@{0}'.format(this.lang);
                    }
                    return {
                        'literal': str
                    };
                }
            }, {
                value: { value: value },
                lang: { value: lang },
                datatype: { value: datatype || getDataType(value) }
            });
        },
        //	Statement
        //
        //  This is a triple with an optional reason.
        //
        //   The reason can point to provenece or inference
        //
        Statement = function (subject, predicate, object, why, graph) {
            return Object.create({
                toNT: function () {
                    //console.log("SUBJECT", this.subject, this.subject.toNT);
                    //console.log("PREDICATE", this.predicate, this.predicate.toNT);
                    //console.log("OBJECT", this.object, this.object.toNT);
                    return (this.subject.toNT() + " "
                        + this.predicate.toNT() + " "
                        +  this.object.toNT() +" .");
                },
                toString: toString,
                toQuads: function () {
                    var object = this.object.toQuads();
                    if(object.constructor === Array) {
                        var nextObject = object[0].subject;
                        object.push({
                            'subject': this.subject.toQuads(),
                            'predicate': this.predicate.toQuads(),
                            'object': nextObject,
                            'graph': this.graph
                        });
                        return object;
                    } else {
                        return {
                            'subject': this.subject.toQuads(),
                            'predicate': this.predicate.toQuads(),
                            'object': this.object.toQuads(),
                            'graph': this.graph
                        };
                    }
                }
            }, {
                subject: { value: createTerm(subject, graph) },
                predicate: { value: createTerm(predicate, graph) },
                object: { value: createTerm(object, graph) },
                why: { value: why },
                graph: { value: graph }
            });
        },
        // Symbol
        Symbol = function (uri) {
            return Object.create({
                toNT: function () {
                    return ("<" + this.uri + ">");
                },
                toString: toString,
                toQuads: function () {
                    return {
                        token: 'uri',
                        prefix: null,
                        suffix: null,
                        value: this.uri
                    };
                }
            }, {
                uri: { value: uri },
                value: { value: uri }
            });
        },
        resource = function (value, options) {
            var resource, m, prefix, uri, opts;
            if (typeof value === 'string') {
                m = uriRegex.exec(value);
                opts = Utils.extend({}, {
                    base: URI.base(),
                    namespaces: {}
                }, options);
                if (m !== null) {
                    this.value = URI.resolve(m[1].replace(/\\>/g, '>'), opts.base);
                } else if (value.substring(0, 1) === ':') {
                    uri = opts.namespaces[''];
                    if (uri === undefined) {
                        throw "Malformed Resource: No namespace binding for default namespace in " + value;
                    } else {
                        this.value = URI.resolve(uri + value.substring(1));
                    }
                } else if (value.substring(value.length - 1) === ':') {
                    prefix = value.substring(0, value.length - 1);
                    uri = opts.namespaces[prefix];
                    if (uri === undefined) {
                        throw "Malformed Resource: No namespace binding for prefix " + prefix + " in " + value;
                    } else {
                        this.value = URI.resolve(uri);
                    }
                } else {
                    try {
                        this.value = CURIE(value, { namespaces: opts.namespaces });
                    } catch (e) {
                        throw "Malformed Resource: Bad format for resource " + e;
                    }
                }
            }
            return Object.create({
                /**
                 * Returns a <a href="http://n2.talis.com/wiki/RDF_JSON_Specification">RDF/JSON</a> representation of this triple.
                 * @returns {Object}
                 */
                dump: function () {
                    return {
                        type: 'uri',
                        value: this.value.toString()
                    };
                },
                /**
                 * Returns a string representing this resource in Turtle format.
                 * @returns {String}
                 */
                toString: function () {
                    return '<' + this.value + '>';
                }
            }, {
                /**
                 * Always fixed to 'uri' for resources.
                 * @type String
                 */
                type: { value: 'uri' },
                /**
                 * The URI for the resource.
                 * @type jQuery.rdf.uri
                 */
                value: { value: value }
            });
        };
    Symbol.XSDboolean = Symbol('http://www.w3.org/2001/XMLSchema#boolean');
    Symbol.XSDdecimal = Symbol('http://www.w3.org/2001/XMLSchema#decimal');
    Symbol.XSDfloat = Symbol('http://www.w3.org/2001/XMLSchema#float');
    Symbol.XSDinteger = Symbol('http://www.w3.org/2001/XMLSchema#integer');
    Symbol.XSDdateTime = Symbol('http://www.w3.org/2001/XMLSchema#dateTime');
    Symbol.integer = Symbol('http://www.w3.org/2001/XMLSchema#integer');
    return {
        createLiteral: createLiteral,
        createObject: createObject,
        createPredicate: createPredicate,
        createStatement: createStatement,
        createSubject: createSubject,
        getUri: getUri,
        BlankNode: BlankNode,
        Collection: Collection,
        Empty: Empty,
        Formula: Formula,
        Literal: Literal,
        Statement: Statement,
        Symbol: Symbol,
        /**
         * <p>Creates a new jQuery.rdf.resource object. This should be invoked as a method rather than constructed using new; indeed you will not usually want to generate these objects directly, since they are automatically created from strings where necessary, such as by {@link jQuery.rdf#add}.</p>
         * @class Represents an RDF resource.
         * @param {String|jQuery.uri} value The value of the resource. If it's a string it must be in the format <code>&lt;<var>uri</var>&gt;</code> or <code><var>curie</var></code>.
         * @param {Object} [options] Initialisation of the resource.
         * @param {Object} [options.namespaces] An object representing a set of namespace bindings used when interpreting the CURIE specifying the resource.
         * @param {String|jQuery.uri} [options.base] The base URI used to interpret any relative URIs used within the URI specifying the resource.
         * @returns {jQuery.rdf.resource} The newly-created resource.
         * @throws {String} Errors if the string is not in a recognised format.
         * @example thisPage = rdf.resource('<>');
         * @example foaf.Person = rdf.resource('foaf:Person', { namespaces: ns });
         * @see jQuery.rdf.pattern
         * @see jQuery.rdf.triple
         * @see jQuery.rdf.blank
         * @see jQuery.rdf.literal
         */
        resource: resource,
        /**
         * A {@link jQuery.rdf.resource} for rdf:type
         * @constant
         * @type jQuery.rdf.resource
         */
        type: resource('<' + rdfNs + 'type>'),
        /**
         * A {@link jQuery.rdf.resource} for rdfs:label
         * @constant
         * @type jQuery.rdf.resource
         */
        label: resource('<' + rdfsNs + 'label>'),
        /**
         * A {@link jQuery.rdf.resource} for rdf:first
         * @constant
         * @type jQuery.rdf.resource
         */
        first: resource('<' + rdfNs + 'first>'),
        /**
         * A {@link jQuery.rdf.resource} for rdf:rest
         * @constant
         * @type jQuery.rdf.resource
         */
        rest: resource('<' + rdfNs + 'rest>'),
        /**
         * A {@link jQuery.rdf.resource} for rdf:nil
         * @constant
         * @type jQuery.rdf.resource
         */
        nil: resource('<' + rdfNs + 'nil>'),
        /**
         * A {@link jQuery.rdf.resource} for rdf:subject
         * @constant
         * @type jQuery.rdf.resource
         */
        subject: resource('<' + rdfNs + 'subject>'),
        /**
         * A {@link jQuery.rdf.resource} for rdf:property
         * @constant
         * @type jQuery.rdf.resource
         */
        property: resource('<' + rdfNs + 'property>'),
        /**
         * A {@link jQuery.rdf.resource} for rdf:object
         * @constant
         * @type jQuery.rdf.resource
         */
        object: resource('<' + rdfNs + 'object>')
    };
});