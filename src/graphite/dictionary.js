define([
    "./../rdfquery/uri",
    "./utils"
], function (Uri, Utils) {
    function getDataType(value) {
        if(Utils.isBoolean(value)) {
            return Dictionary.Symbol.prototype.XSDboolean;
        } else if (Utils.isInteger(value)) {
            //console.log("IN DICTIONARY, DATATYPE IS INTEGER", value);
            return Dictionary.Symbol.prototype.XSDinteger;
        } else if (Utils.isDouble(value)) {
            //console.log("IN DICTIONARY, DATATYPE IS DOUBLE", value);
            return Dictionary.Symbol.prototype.XSDfloat;
        }
        return null;
    }
    var Dictionary = {
        /**
         *
         * @param [object]
         * @param [options]
         * @return {*}
         */
        createObject: function (object, options) {
            options = options || {};
            if (object && !Utils.isString(object)) {
                if (options.base) {
                    return this.Symbol(Uri('' + object, options.base));
                }
                if (options["isBlankNode"]) {
                    return this.BlankNode(object);
                }
                //console.log("IN DICTIONARY, OBJECT FALLS TO LITERAL");
                return this.Literal(object);
            }
            if (object && options.base) {
                return this.Symbol(Uri(object, options.base));
            }
            if (object && Utils.isUri(object)) {
                return this.Symbol(object);
            }
            if (object) {
                //console.log("IN DICTIONARY, OBJECT IS LITERAL", object);
                return this.Literal(object);
            }
            return this.BlankNode();
        },
        /**
         *
         * @param predicate
         * @param [base]
         * @return {*}
         */
        createPredicate: function (predicate, base) {
            return this.Symbol(Uri(predicate, base));
        },
        /**
         *
         * @param parts
         * @return {*}
         */
        createStatement: function (parts) {
            var subject = this.createSubject(parts.subject),
                predicate = this.createPredicate(parts.predicate),
                object = this.createObject(parts.object);
            return Dictionary.Statement(subject, predicate, object);
        },
        /**
         *
         * @param [subject]
         * @param [base]
         * @return {*}
         */
        createSubject: function (subject, base) {
            if (subject) {
                if (!Utils.isString(subject)) {
                    return this.BlankNode(subject);
                }
                return this.Symbol(Uri(subject, base).toString());
            }
            return this.BlankNode();
        },
        //      Convert Javascript representation to RDF term object
        //
        createTerm: function (val, graph) {
            if (typeof val == 'object') {
                if (val instanceof Date) {
                    var d2=function (x) {
                        return(''+(100+x)).slice(1,3);
                    };  // format as just two digits
                    return Dictionary.Literal(
                        ''+ val.getUTCFullYear() + '-'+
                            d2(val.getUTCMonth()+1) +'-'+d2(val.getUTCDate())+
                            'T'+d2(val.getUTCHours())+':'+d2(val.getUTCMinutes())+
                            ':'+d2(val.getUTCSeconds())+'Z',
                        undefined, Dictionary.Symbol.prototype.XSDdateTime);
                } else if (val instanceof Array) {
                    var x = Dictionary.Collection(graph);
                    for (var i=0; i<val.length; i++) {
                        x.append(Dictionary.createTerm(val[i], graph));
                    }
                    return x;
                } else {
                    return val;
                }
            }
            if (typeof val == 'string') {
                return Dictionary.Literal(val);
            }
            if (typeof val == 'number') {
                //console.log("IN DICTIONARY, NUMBER");
                var dt;
                if ((''+val).indexOf('e')>=0) {
                    dt = Dictionary.Symbol.prototype.XSDfloat;
                } else if ((''+val).indexOf('.')>=0) {
                    dt = Dictionary.Symbol.prototype.XSDdecimal;
                } else {
                    dt = Dictionary.Symbol.prototype.XSDinteger;
                }
                return Dictionary.Literal(val, undefined, dt);
            }
            if (typeof val == 'boolean') {
                return Dictionary.Literal(val ? "1": "0", undefined, Dictionary.Symbol.prototype.XSDboolean);
            }
            if (typeof val == 'undefined') {
                return undefined;
            }
            throw ("Can't make term from " + val + " of type " + typeof val);
        }
    };
    //	Blank Node
    if (typeof Dictionary.NextId != 'undefined') {
        Dictionary.log.error('Attempt to re-zero existing blank node id counter at '+Dictionary.NextId);
    } else {
        Dictionary.NextId = 0;  // Global genid
    }
    Dictionary.NTAnonymousNodePrefix = "_:";
    Dictionary.BlankNode = function (id) {
        return new Dictionary.BlankNode.prototype.init(id);
    };
    Dictionary.BlankNode.prototype.init = function ( id ) {
        this.id = Dictionary.NextId++;
        this.value = id ? id : this.id.toString();
        return this
    };
    //Dictionary.BlankNode.prototype.termType = 'bnode';
    Dictionary.BlankNode.prototype.toNT = function () {
        return Dictionary.NTAnonymousNodePrefix + this.id
    };
    Dictionary.BlankNode.prototype.toString = Dictionary.BlankNode.prototype.toNT;
    Dictionary.BlankNode.prototype.toQuads = function () {
        return {'blank': Dictionary.NTAnonymousNodePrefix + this.id};
    };
    Dictionary.BlankNode.prototype.init.prototype = Dictionary.BlankNode.prototype;
    // Collection
    Dictionary.Collection = function (graph) {
        return new Dictionary.Collection.prototype.init(graph);
    };
    Dictionary.Collection.prototype.init = function (graph) {
        this.id = Dictionary.NextId++;  // Why need an id? For hashstring.
        this.elements = [];
        this.closed = false;
        this.graph = graph;
    };
    Dictionary.Collection.idCounter = 0;
    //Dictionary.Collection.prototype.termType = 'collection';
    Dictionary.Collection.prototype.toNT = function () {
        return Dictionary.NTAnonymousNodePrefix + this.id
    };
    Dictionary.Collection.prototype.toQuads = function () {
        var acum = [];
        var subjectId = "_:list"+Dictionary.Collection.idCounter;
        Dictionary.Collection.idCounter++;
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
    };
    Dictionary.Collection.prototype.append = function (el) {
        this.elements.push(el)
    };
    Dictionary.Collection.prototype.unshift=function (el){
        this.elements.unshift(el);
    };
    Dictionary.Collection.prototype.shift=function (){
        return this.elements.shift();
    };
    Dictionary.Collection.prototype.close = function () {
        this.closed = true
    };
    Dictionary.Collection.prototype.init.prototype = Dictionary.Collection.prototype;
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
    Dictionary.Empty = function () {
        return new Dictionary.Empty.prototype.init();
    };
    Dictionary.Empty.prototype.init = function () {
        return this;
    };
    //Dictionary.Empty.prototype.termType = 'empty';
    Dictionary.Empty.prototype.toNT = function () { return "()" };
    Dictionary.Empty.prototype.toQuads = function () {
        return {
            'uri': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#nil'
        };
    };
    Dictionary.Empty.prototype.init.prototype = Dictionary.Empty.prototype;
    //	Formula
    //
    //	Set of statements.
    Dictionary.Formula = function (graph) {
        return new Dictionary.Formula.prototype.init(graph);
    };
    Dictionary.Formula.prototype.init = function (graph) {
        this.statements = [];
        this.graph = graph;
        return this;
    };
    //Dictionary.Formula.prototype.termType = 'formula';
    Dictionary.Formula.prototype.toNT = function () {
        var statements = Utils.map(this.statements, function (s) {
            return s.toNT();
        });
        return "{\n" + statements.join('\n') + "\n}";
    };
    Dictionary.Formula.prototype.toQuads = function () {
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
    };
    Dictionary.Formula.prototype.add = function (subj, pred, obj, why) {
        this.statements.push(Dictionary.Statement(subj, pred, obj, why, this.graph));
    };
    // Convenience methods on a formula allow the creation of new RDF terms:
    Dictionary.Formula.prototype.sym = function (uri) {
        return Dictionary.Symbol(uri)
    };
    Dictionary.Formula.prototype.literal = function (val, lang, dt) {
        if(dt != null && dt.value != null && dt.value.indexOf("http://") === -1) {
            for(var ns in this.namespaces) {
                if(dt.value.indexOf(ns) === 0 && this.namespaces.hasOwnProperty(ns)) {
                    dt.value = this.namespaces[ns]+(dt.value.split(ns+":")[1]);
                    break;
                }
            }
        }
        //console.log("IN DICTIONARY, FORMULA LITERAL DATATYPE", dt);
        return Dictionary.Literal(''+val, lang, dt)
    };
    Dictionary.Formula.prototype.bnode = function (id) {
        return Dictionary.BlankNode(id)
    };
    Dictionary.Formula.prototype.formula = function () {
        return Dictionary.Formula(this.graph);
    };
    Dictionary.Formula.prototype.collection = function () { // obsolete
        return Dictionary.Collection(this.graph)
    };
    Dictionary.Formula.prototype.list = function (values) {
        var li = Dictionary.Collection(this.graph);
        if (values) {
            for(var i = 0; i<values.length; i++) {
                li.append(values[i]);
            }
        }
        return li;
    };
    Dictionary.Formula.prototype.init.prototype = Dictionary.Formula.prototype;
    //	Literal
    Dictionary.Literal = function (value, lang, datatype) {
        //console.log("IN DICTIONARY, LITERAL INIT", value, lang, datatype);
        return new Dictionary.Literal.prototype.init(value, lang, datatype);
    };
    Dictionary.Literal.prototype.init = function (value, lang, datatype) {
        this.value = value;
        this.lang = lang;
        //console.log("IN DICTIONARY, LITERAL DATATYPE BEFORE", datatype);
        this.datatype = datatype || getDataType(value);
        //console.log("IN DICTIONARY, LITERAL DATATYPE AFTER", this.datatype);
        return this;
    };
    //Dictionary.Literal.prototype.termType = 'literal';
    Dictionary.Literal.prototype.toNT = function () {
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
    };
    Dictionary.Literal.prototype.toQuads = function () {
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
    };
    Dictionary.Literal.prototype.init.prototype = Dictionary.Literal.prototype;
    //	Statement
    //
    //  This is a triple with an optional reason.
    //
    //   The reason can point to provenece or inference
    //
    Dictionary.Statement = function (subject, predicate, object, why, graph) {
        return new Dictionary.Statement.prototype.init(subject, predicate, object, why, graph);
    };
    Dictionary.Statement.prototype.init = function (subject, predicate, object, why, graph) {
        this.subject = Dictionary.createTerm(subject, graph);
        this.predicate = Dictionary.createTerm(predicate, graph);
        this.object = Dictionary.createTerm(object, graph);
        if (typeof why !='undefined') {
            this.why = why;
        }
        this.graph = graph;
        return this;
    };
    Dictionary.Statement.prototype.toString = Dictionary.Statement.prototype.toNT = function () {
        //console.log("SUBJECT", this.subject, this.subject.toNT);
        //console.log("PREDICATE", this.predicate, this.predicate.toNT);
        //console.log("OBJECT", this.object, this.object.toNT);
        return (this.subject.toNT() + " "
            + this.predicate.toNT() + " "
            +  this.object.toNT() +" .");
    };
    Dictionary.Statement.prototype.toQuads = function () {
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
    };
    Dictionary.Statement.prototype.init.prototype = Dictionary.Statement.prototype;
    // Symbol
    Dictionary.Symbol = function (uri) {
        return new Dictionary.Symbol.prototype.init(uri);
    };
    Dictionary.Symbol.prototype.init = function ( uri ) {
        this.uri = uri;
        this.value = uri;   // -- why? -tim
        return this;
    };
    Dictionary.Symbol.prototype.init.prototype = Dictionary.Symbol.prototype;
    //Dictionary.Symbol.prototype.termType = 'symbol';
    Dictionary.Symbol.prototype.toNT = function () {
        return ("<" + this.uri + ">");
    };
    Dictionary.Symbol.prototype.toQuads = function () {
        return {
            token:'uri',
            prefix:null,
            suffix:null,
            value:this.uri
        };
    };
    //  Some precalculated symbols
    Dictionary.Symbol.prototype.XSDboolean = Dictionary.Symbol('http://www.w3.org/2001/XMLSchema#boolean');
    Dictionary.Symbol.prototype.XSDdecimal = Dictionary.Symbol('http://www.w3.org/2001/XMLSchema#decimal');
    Dictionary.Symbol.prototype.XSDfloat = Dictionary.Symbol('http://www.w3.org/2001/XMLSchema#float');
    Dictionary.Symbol.prototype.XSDinteger = Dictionary.Symbol('http://www.w3.org/2001/XMLSchema#integer');
    Dictionary.Symbol.prototype.XSDdateTime = Dictionary.Symbol('http://www.w3.org/2001/XMLSchema#dateTime');
    Dictionary.Symbol.prototype.integer = Dictionary.Symbol('http://www.w3.org/2001/XMLSchema#integer'); // Used?
    Dictionary.Symbol.prototype.init.prototype = Dictionary.Symbol.prototype;
    return Dictionary;
});