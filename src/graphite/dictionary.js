define([
    "./../rdfquery/uri",
    "./utils"
], function (Uri, Utils) {
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
    var createObject = function (object, options) {
            options = options || {};
            if (object && !Utils.isString(object)) {
                if (options.base) {
                    return Symbol(Uri('' + object, options.base));
                }
                if (options["isBlankNode"]) {
                    return BlankNode(object);
                }
                //console.log("IN DICTIONARY, OBJECT FALLS TO LITERAL");
                return Literal(object);
            }
            if (object && options.base) {
                return Symbol(Uri(object, options.base));
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
            return Symbol(Uri(predicate, base));
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
                return Symbol(Uri(subject, base).toString());
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
        NextId = 0, // Global genid
        NTAnonymousNodePrefix = "_:",
        idCounter = 0,
        TS = {
            blanknode: function () {
                return NTAnonymousNodePrefix + this.id
            },
            collection: function () {
                return NTAnonymousNodePrefix + this.id
            },
            empty: function () {
                return "()";
            },
            formula: function () {
                var statements = Utils.map(this.statements, function (s) {
                    return s.toNT();
                });
                return "{\n" + statements.join('\n') + "\n}";
            },
            literal: function () {
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
            statement: function () {
                //console.log("SUBJECT", this.subject, this.subject.toNT);
                //console.log("PREDICATE", this.predicate, this.predicate.toNT);
                //console.log("OBJECT", this.object, this.object.toNT);
                return (this.subject.toNT() + " "
                    + this.predicate.toNT() + " "
                    +  this.object.toNT() +" .");
            },
            symbol: function () {
                return ("<" + this.uri + ">");
            }
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
                toNT: TS.blanknode,
                toString: TS.blanknode,
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
                toNT: TS.collection,
                toString: TS.collection,
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
                toNT: TS.empty,
                toString: TS.empty,
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
                toNT: TS.formula,
                toString: TS.formula,
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
                toNT: TS.literal,
                toString: TS.literal,
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
                toNT: TS.statement,
                toString: TS.statement,
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
                toNT: TS.symbol,
                toString: TS.symbol,
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
        };
    Symbol.XSDboolean = Symbol('http://www.w3.org/2001/XMLSchema#boolean');
    Symbol.XSDdecimal = Symbol('http://www.w3.org/2001/XMLSchema#decimal');
    Symbol.XSDfloat = Symbol('http://www.w3.org/2001/XMLSchema#float');
    Symbol.XSDinteger = Symbol('http://www.w3.org/2001/XMLSchema#integer');
    Symbol.XSDdateTime = Symbol('http://www.w3.org/2001/XMLSchema#dateTime');
    Symbol.integer = Symbol('http://www.w3.org/2001/XMLSchema#integer');
    return {
        createObject: createObject,
        createPredicate: createPredicate,
        createStatement: createStatement,
        createSubject: createSubject,
        createTerm: createTerm,
        BlankNode: BlankNode,
        Collection: Collection,
        Empty: Empty,
        Formula: Formula,
        Literal: Literal,
        Statement: Statement,
        Symbol: Symbol
    };
});