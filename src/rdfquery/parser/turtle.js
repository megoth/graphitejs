define([
    "../rdf",
    "../uri",
    "../../graphite/utils"
], function(RDF, URI, Utils) {
    var wsRegex = /^(\u0009|\u000A|\u000D|\u0020|#([^\u000A\u000D])*)+/,
        nameStartChars = 'A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD', // can't include \u10000-\uEFFFF
        nameChars = '-' + nameStartChars + '0-9\u00B7\u0300-\u036F\u203F-\u2040',
        nameRegex = new RegExp('^[' + nameStartChars + '][' + nameChars + ']*'),
        uriRegex = /^(\\u[0-9A-F]{4}|\\U[0-9A-F]{8}|\\\\|\\>|[\u0020-\u003D\u003F-\u005B\u005D-\u10FFFF])*/,
        booleanRegex = /^(true|false)[\s\.;,)\]]/,
        doubleRegex = /^(-|\+)?([0-9]+\.[0-9]*[eE](-|\+)?[0-9]+|\.[0-9]+[eE](-|\+)?[0-9]+|[0-9]+[eE](-|\+)?[0-9]+)/,
        decimalRegex = /^(-|\+)?(([0-9]+\.[0-9]*)|(\.[0-9]))+/,
        integerRegex = /^(-|\+)?[0-9]+/,
        stringRegex = /^(\\u[0-9A-F]{4}|\\U[0-9A-F]{8}|\\\\|[\u0020-\u0021\u0023-\u005B]|[\u005D-\u10FFFF]|\\t|\\n|\\r|\\")*/,
        longStringRegex = /^(\\u[0-9A-F]{4}|\\U[0-9A-F]{8}|\\\\|[\u0020-\u0021\u0023-\u005B]|[\u005D-\u10FFFF]|\\t|\\n|\\r|\\"|\u0009|\u000A|\u000D|"[^"]|""[^"])*/,
        languageRegex = /^[a-z]+(-[a-z0-9]+)*/;
    function blank (data, opts) {
        var parsed, bnode, first = data.substring(0, 1);
        //log('blank: ' + data);
        if (first === '_') {
            data = validate(data, '_:');
            parsed = name(data, opts);
            return {
                remainder: parsed.remainder,
                blank: RDF.blank('_:' + parsed.name),
                triples: []
            }
        } else if (first === '(') {
            parsed = collection(data, opts);
            return {
                remainder: parsed.remainder,
                blank: parsed.collection,
                triples: parsed.triples
            };
        } else if (data.substring(0, 2) === '[]') {
            return {
                remainder: data.substring(2),
                blank: RDF.blank('[]'),
                triples: []
            };
        } else {
            bnode = RDF.blank('[]');
            opts.subject.unshift(bnode);
            data = validate(data, '[');
            data = ws(data);
            parsed = predicateObjectList(data, opts);
            data = parsed.remainder;
            data = ws(data);
            data = validate(data, ']');
            opts.subject.shift();
            return {
                remainder: data,
                blank: bnode,
                triples: parsed.triples
            };
        }
    }
    function collection (data, opts) {
        var parsed, i, items, triples, list, rest = RDF.nil;
        //log('collection: ' + data);
        data = validate(data, '(');
        data = ws(data);
        parsed = itemList(data, opts);
        data = parsed.remainder;
        items = parsed.items;
        triples = parsed.triples;
        for (i = items.length - 1; i >= 0; i -= 1) {
            list = RDF.blank('[]');
            triples.push(RDF.triple(list, RDF.first, items[i]));
            triples.push(RDF.triple(list, RDF.rest, rest));
            rest = list;
        }
        data = ws(data);
        data = validate(data, ')');
        return {
            remainder: data,
            collection: rest,
            triples: triples
        };
    }
    function directive (data, opts) {
        var parsed, prefix, uri;
        //log('directive: ' + data);
        if (data.substring(0, 7) === '@prefix') {
            data = data.substring(7);
            data = ws(data, { required: true });
            parsed = prefixName(data, opts);
            prefix = parsed.prefix;
            data = parsed.remainder;
            data = ws(data);
            data = validate(data, ':');
            data = ws(data);
            parsed = uriref(data, opts);
            opts.namespaces[prefix] = parsed.uri;
            data = parsed.remainder;
        } else if (data.substring(0, 5) === '@base') {
            data = validate(data, '@base');
            data = ws(data, { required: true });
            parsed = uriref(data, opts);
            opts.base = parsed.uri;
            data = parsed.remainder;
        } else {
            throw ("Invalid Turtle: Unrecognised directive: " + data);
        }
        data = ws(data);
        data = validate(data, '.');
        return {
            remainder: data,
            opts: opts,
            triples: []
        };
    }
    function itemList (data, opts) {
        var parsed, items = [], triples = [], first = data.substring(0, 1);
        //log('itemList: ' + data);
        while (first !== ')') {
            parsed = object(data, opts);
            data = parsed.remainder;
            items.push(parsed.object);
            triples = triples.concat(parsed.triples);
            data = ws(data);
            first = data.substring(0, 1);
        }
        return {
            remainder: data,
            items: items,
            triples: triples
        };
    }
    function literal (data, opts) {
        var first, str;
        //log('literal: ' + data);
        if (booleanRegex.test(data)) {
            str = booleanRegex.exec(data)[1];
            return {
                remainder: data.substring(str.length),
                literal: RDF.literal(str, { datatype: 'http://www.w3.org/2001/XMLSchema#boolean' })
            }
        } else if (doubleRegex.test(data)) {
            str = doubleRegex.exec(data)[0];
            return {
                remainder: data.substring(str.length),
                literal: RDF.literal(str, { datatype: 'http://www.w3.org/2001/XMLSchema#double' })
            };
        } else if (decimalRegex.test(data)) {
            str = decimalRegex.exec(data)[0];
            return {
                remainder: data.substring(str.length),
                literal: RDF.literal(str, { datatype: 'http://www.w3.org/2001/XMLSchema#decimal' })
            };
        } else if (integerRegex.test(data)) {
            str = integerRegex.exec(data)[0];
            return {
                remainder: data.substring(str.length),
                literal: RDF.literal(str, { datatype: 'http://www.w3.org/2001/XMLSchema#integer' })
            };
        } else {
            parsed = quotedString(data, opts);
            data = parsed.remainder;
            str = parsed.string;
            data = ws(data);
            first = data.substring(0, 1);
            if (first === '^') {
                data = validate(data, '^^');
                data = ws(data);
                parsed = resource(data, opts);
                return {
                    remainder: parsed.remainder,
                    literal: RDF.literal(str, { datatype: parsed.resource.value })
                };
            } else if (first === '@') {
                data = validate(data, '@');
                data = ws(data);
                parsed = language(data, opts);
                return {
                    remainder: parsed.remainder,
                    literal: RDF.literal(str, { lang: parsed.language })
                };
            } else {
                return {
                    remainder: data,
                    literal: RDF.literal('"' + str.replace(/"/g, '\\"') + '"')
                };
            }
        }
    }
    function log(message) {
        buster.log(message);
    }
    function name (data, opts) {
        var result;
        //log('name: ' + data);
        if (nameRegex.test(data)) {
            result = nameRegex.exec(data);
            return {
                name: result[0],
                remainder: data.substring(result[0].length)
            };
        } else {
            return {
                name: '',
                remainder: data
            }
        }
    }
    function object (data, opts) {
        var parsed, o, first = data.substring(0, 1);
        //log('object: ' + data);
        if (first === '[' || first === '_' || first === '(') {
            parsed = blank(data, opts);
            return {
                remainder: parsed.remainder,
                object: parsed.blank,
                triples: parsed.triples
            };
        } else {
            try {
                parsed = literal(data, opts);
                return {
                    remainder: parsed.remainder,
                    object: parsed.literal,
                    triples: []
                };
            } catch (e) {
                parsed = resource(data, opts);
                return {
                    remainder: parsed.remainder,
                    object: parsed.resource,
                    triples: []
                };
            }
        }
    }
    function objectList (data, opts) {
        var parsed,
            obj,
            triple,
            triples = [],
            first = data.substring(0, 1);
        //log('objectList: ' + data);
        do {
            parsed = object(data, opts);
            data = parsed.remainder;
            triples = triples.concat(parsed.triples);
            triple = RDF.triple(opts.subject[0], opts.verb[0], parsed.object);
            triples.push(triple);
            data = ws(data);
            first = data.substring(0, 1);
            if (first === ',') {
                data = validate(data, ',');
                data = ws(data);
                first = data.substring(0, 1);
            } else {
                break;
            }
        } while (first !== ']' && first !== ';' && first !== '.');
        return {
            remainder: data,
            triples: triples
        };
    }
    function parse(data, opts) {
        var parsed = {},
            triples = [];
        opts = opts || {};
        opts.namespaces = {};
        opts.base = opts.base;
        opts.subject = [];
        opts.verb = [];
        while(data !== '') {
            //log('parseTurtle: ' + data);
            parsed = statement(data, opts);
            data = parsed.remainder;
            opts = parsed.opts;
            triples = triples.concat(parsed.triples);
        }
        return triples;
    }
    function prefixName (data, opts) {
        var n = name(data, opts);
        //log('prefixName: ' + data);
        if (n.name.substring(0, 1) === '_') {
            throw "Invalid Turtle: Prefix must not start with an underscore: " + name;
        } else {
            return {
                prefix: n.name,
                remainder: n.remainder
            };
        }
    }
    function predicateObjectList (data, opts) {
        var parsed, property, objects, triples = [], first = data.substring(0, 1);
        //log('predicateObjectList: ' + data);
        do {
            parsed = verb(data, opts);
            data = parsed.remainder;
            property = parsed.verb;
            data = ws(data);
            opts.verb.unshift(property);
            parsed = objectList(data, opts);
            data = parsed.remainder;
            triples = triples.concat(parsed.triples);
            opts.verb.shift();
            data = ws(data);
            first = data.substring(0, 1);
            if (first === ';') {
                data = validate(data, ';');
                data = ws(data);
                first = data.substring(0, 1);
            } else {
                break;
            }
        } while (first !== ']' && first !== '.');
        return {
            remainder: data,
            triples: triples
        };
    }
    function quotedString (data, opts) {
        var str;
        //log('quotedString: ' + data);
        if (data.substring(0, 3) === '"""') {
            data = validate(data, '"""');
            str = longStringRegex.exec(data)[0];
            data = data.substring(str.length);
            str = str
                .replace(/\n/g, '\\n')
                .replace(/\t/g, '\\t')
                .replace(/\r/g, '\\r')
                .replace(/\\"/g, '"');
            str = unescape(str);
            data = validate(data, '"""');
            return {
                remainder: data,
                string: str
            };
        } else {
            data = validate(data, '"');
            str = stringRegex.exec(data)[0];
            data = data.substring(str.length);
            str = str.replace(/\\"/g, '"');
            str = unescape(str);
            data = validate(data, '"');
            return {
                remainder: data,
                string: str
            };
        }
    }
    function validate (data, str) {
        if (data.substring(0, str.length) === str) {
            return data.substring(str.length);
        } else {
            throw "Invalid Turtle: Expecting '" + str + "', found '" + data.substring(0, 20) + "...'";
        }
    }
    function resource (data, opts) {
        var parsed, prefix, local, first = data.substring(0, 1);
        //log('resource: ' + data);
        if (first === '<') {
            parsed = uriref(data, opts);
            return {
                remainder: parsed.remainder,
                resource: RDF.resource(parsed.uri, opts.base)
            };
        } else {
            try {
                parsed = prefixName(data, opts);
                prefix = parsed.prefix;
                data = parsed.remainder;
            } catch (e) {
                prefix = '';
            }
            data = validate(data, ':');
            parsed = name(data, opts);
            local = parsed.name;
            return {
                remainder: parsed.remainder,
                resource: RDF.resource(prefix + ':' + local, { namespaces: opts.namespaces, base: opts.base })
            };
        }
    }
    function statement(data, opts) {
        var first, parsed;
        //log('statement: ' + data);
        data = ws(data);
        if (data.length === 0) {
            return { remainder: '', opts: opts, triples: [] };
        } else {
            first = data.substring(0, 1);
            if (first === '@') {
                return directive(data, opts);
            } else {
                return triples(data, opts);
            }
        }
    }
    function subject(data, opts) {
        var parsed, first = data.substring(0, 1);
        //log('subject: ' + data);
        if (first === '[' || first === '_' || first === '(') {
            parsed = blank(data, opts);
            return {
                remainder: parsed.remainder,
                subject: parsed.blank,
                triples: parsed.triples
            };
        } else {
            parsed = resource(data, opts);
            return {
                remainder: parsed.remainder,
                subject: parsed.resource,
                triples: []
            };
        }
    }
    function triples(data, opts) {
        var parsed, triples = [];
        //log('triples: ' + data);
        parsed = subject(data, opts);
        data = parsed.remainder;
        opts.subject.unshift(parsed.subject);
        triples = parsed.triples;
        data = ws(data);
        parsed = predicateObjectList(data, opts);
        opts.subject.shift();
        data = ws(parsed.remainder);
        data = validate(data, '.');
        return {
            remainder: data,
            opts: opts,
            triples: triples.concat(parsed.triples)
        };
    }
    function unescape (string) {
        return string.replace(/(\\u([0-9A-F]{4}))|(\\U([0-9A-F]{4})([0-9A-F]{4}))/g, function (m, u4, u4h, u8, u8h1, u8h2) {
            if (u4 !== undefined) {
                return String.fromCharCode(parseInt(u4h, 16));
            } else {
                return String.fromCharCode(parseInt(u8h1, 16)) + String.fromCharCode(parseInt(u8h2, 16));
            }
        });
    }
    function uriref (data, opts) {
        var uri;
        //log('uriref: ' + data);
        data = validate(data, '<');
        uri = uriRegex.exec(data)[0];
        data = data.substring(uri.length);
        data = validate(data, '>');
        return {
            remainder: data,
            uri: URI.resolve(uri, opts.base)
        };
    }
    function verb (data, opts) {
        var parsed, first = data.substring(0, 1);
        //log('verb: ' + data);
        try {
            parsed = resource(data, opts);
            return {
                remainder: parsed.remainder,
                verb: parsed.resource
            };
        } catch (e) {
            if (first === 'a') {
                data = ws(data.substring(1), { required: true });
                return {
                    remainder: data,
                    verb: RDF.type
                };
            } else {
                throw e;
            }
        }
    }
    function ws(data, opts) {
        var required;
        opts = opts || {};
        required = opts.required || false;
        if (required && !wsRegex.test(data)) {
            throw("Invalid Turtle: Required whitespace is missing!");
        }
        return data.replace(wsRegex, '');
    }
    return function(data, options, callback) {
        if (!data) {
            throw "No valid data was given";
        }
        callback(parse(data, options));
    };
});