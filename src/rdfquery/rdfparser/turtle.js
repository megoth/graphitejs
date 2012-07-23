define([
    "../../graphite/rdf",
    "../uri"
], function(RDF, URI) {
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
    function blank (data, graph, opts) {
        var parsed,
            bnode,
            first = data.substring(0, 1);
        //log('blank: ' + data);
        if (first === '_') {
            data = validate(data, '_:');
            parsed = name(data);
            return {
                remainder: parsed.remainder,
                blank: RDF.BlankNode(parsed.name)
            }
        } else if (first === '(') {
            parsed = collection(data, graph, opts);
            return {
                remainder: parsed.remainder,
                blank: parsed.collection
            };
        } else if (data.substring(0, 2) === '[]') {
            return {
                remainder: data.substring(2),
                blank: RDF.BlankNode()
            };
        } else {
            bnode = RDF.BlankNode();
            opts.subject.unshift(bnode);
            data = validate(data, '[');
            data = ws(data);
            parsed = predicateObjectList(data, graph, opts);
            data = parsed.remainder;
            data = ws(data);
            data = validate(data, ']');
            opts.subject.shift();
            return {
                remainder: data,
                blank: bnode
            };
        }
    }
    function collection (data, graph, opts) {
        var parsed,
            i,
            items,
            list,
            rest = RDF.Symbol(RDF.nil.value);
        //log('collection: ' + data);
        data = validate(data, '(');
        data = ws(data);
        parsed = itemList(data, graph, opts);
        data = parsed.remainder;
        items = parsed.items;
        for (i = items.length - 1; i >= 0; i -= 1) {
            list = RDF.BlankNode();
            graph.add(list, RDF.Symbol(RDF.first.value), items[i]);
            graph.add(list, RDF.Symbol(RDF.rest.value), rest);
            rest = list;
        }
        data = ws(data);
        data = validate(data, ')');
        return {
            remainder: data,
            collection: rest
        };
    }
    function directive (data, opts) {
        var parsed, prefix;
        //log('directive: ' + data);
        if (data.substring(0, 7) === '@prefix') {
            data = data.substring(7);
            data = ws(data, { required: true });
            parsed = prefixName(data);
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
            opts: opts
        };
    }
    function itemList (data, graph, opts) {
        var parsed,
            items = [],
            first = data.substring(0, 1);
        //log('itemList: ' + data);
        while (first !== ')') {
            parsed = object(data, graph, opts);
            data = parsed.remainder;
            items.push(parsed.object);
            data = ws(data);
            first = data.substring(0, 1);
        }
        return {
            remainder: data,
            items: items
        };
    }
    function language (data) {
        var lang;
        //log('language: ' + data);
        lang = languageRegex.exec(data)[0];
        return {
            remainder: data.substring(lang.length),
            language: lang
        };
    }
    function literal (data, opts) {
        var first, str, parsed;
        //log('literal: ' + data);
        if (booleanRegex.test(data)) {
            str = booleanRegex.exec(data)[1];
            return {
                remainder: data.substring(str.length),
                literal: RDF.Literal(str, null, RDF.Symbol.XSDboolean)
            }
        } else if (doubleRegex.test(data)) {
            str = doubleRegex.exec(data)[0];
            return {
                remainder: data.substring(str.length),
                literal: RDF.Literal(str, null, RDF.Symbol.XSDfloat)
            };
        } else if (decimalRegex.test(data)) {
            str = decimalRegex.exec(data)[0];
            return {
                remainder: data.substring(str.length),
                literal: RDF.Literal(str, null, RDF.Symbol.XSDdecimal)
            };
        } else if (integerRegex.test(data)) {
            str = integerRegex.exec(data)[0];
            return {
                remainder: data.substring(str.length),
                literal: RDF.Literal(str, null, RDF.Symbol.XSDinteger)
            };
        } else {
            parsed = quotedString(data);
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
                    literal: RDF.Literal(str, null, parsed.resource)
                };
            } else if (first === '@') {
                data = validate(data, '@');
                data = ws(data);
                parsed = language(data);
                return {
                    remainder: parsed.remainder,
                    literal: RDF.Literal(str, parsed.language)
                };
            } else {
                return {
                    remainder: data,
                    literal: RDF.Literal(str)
                };
            }
        }
    }
    function name (data) {
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
    function object (data, graph, opts) {
        var parsed,
            first = data.substring(0, 1);
        //log('object: ' + data);
        if (first === '[' || first === '_' || first === '(') {
            parsed = blank(data, graph, opts);
            return {
                remainder: parsed.remainder,
                object: parsed.blank
            };
        } else {
            try {
                parsed = literal(data, opts);
                return {
                    remainder: parsed.remainder,
                    object: parsed.literal
                };
            } catch (e) {
                parsed = resource(data, opts);
                return {
                    remainder: parsed.remainder,
                    object: parsed.resource
                };
            }
        }
    }
    function objectList (data, graph, opts) {
        var parsed,
            first = data.substring(0, 1);
        //log('objectList: ' + data);
        do {
            parsed = object(data, graph, opts);
            data = parsed.remainder;
            graph.add(opts.subject[0], opts.verb[0], parsed.object);
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
            remainder: data
        };
    }
    function parse(data, opts) {
        var parsed = {},
            graph = RDF.Formula(opts.graph);
        opts = opts || {};
        opts.namespaces = {};
        opts.base = opts.base || URI.base();
        opts.subject = [];
        opts.verb = [];
        while(data !== '') {
            //log('parseTurtle: ' + data);
            parsed = statement(data, graph, opts);
            data = parsed.remainder;
            opts = parsed.opts;
            //triples = triples.concat(parsed.triples);
        }
        return graph;
    }
    function prefixName (data) {
        var n = name(data);
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
    function predicateObjectList (data, graph, opts) {
        var parsed,
            property,
            first = data.substring(0, 1);
        //log('predicateObjectList: ' + data);
        do {
            parsed = verb(data, opts);
            data = parsed.remainder;
            property = parsed.verb;
            data = ws(data);
            opts.verb.unshift(property);
            parsed = objectList(data, graph, opts);
            data = parsed.remainder;
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
            remainder: data
        };
    }
    function quotedString (data) {
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
        var parsed,
            prefix,
            local,
            first = data.substring(0, 1),
            resource;
        //log('resource: ' + data);
        if (first === '<') {
            parsed = uriref(data, opts);
            resource = RDF.resource(parsed.uri, opts.base);
            return {
                remainder: parsed.remainder,
                resource: RDF.Symbol(resource.value)
            };
        } else {
            try {
                parsed = prefixName(data);
                prefix = parsed.prefix;
                data = parsed.remainder;
            } catch (e) {
                prefix = '';
            }
            data = validate(data, ':');
            parsed = name(data);
            local = parsed.name;
            resource = RDF.resource(prefix + ':' + local, { namespaces: opts.namespaces, base: opts.base });
            return {
                remainder: parsed.remainder,
                resource: RDF.Symbol(resource.value)
            };
        }
    }
    function statement(data, graph, opts) {
        var first;
        //log('statement: ' + data);
        data = ws(data);
        if (data.length === 0) {
            return { remainder: '', opts: opts };
        } else {
            first = data.substring(0, 1);
            if (first === '@') {
                return directive(data, opts);
            } else {
                return triples(data, graph, opts);
            }
        }
    }
    function subject(data, graph, opts) {
        var parsed,
            first = data.substring(0, 1);
        //log('subject: ' + data);
        if (first === '[' || first === '_' || first === '(') {
            parsed = blank(data, graph, opts);
            return {
                remainder: parsed.remainder,
                subject: parsed.blank
            };
        } else {
            parsed = resource(data, opts);
            return {
                remainder: parsed.remainder,
                subject: parsed.resource
            };
        }
    }
    function triples(data, graph, opts) {
        var parsed;
        //log('triples: ' + data);
        parsed = subject(data, graph, opts);
        data = parsed.remainder;
        opts.subject.unshift(parsed.subject);
        data = ws(data);
        parsed = predicateObjectList(data, graph, opts);
        opts.subject.shift();
        data = ws(parsed.remainder);
        data = validate(data, '.');
        return {
            remainder: data,
            opts: opts
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
        var parsed,
            first = data.substring(0, 1);
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
                    verb: RDF.Symbol(RDF.type.value)
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