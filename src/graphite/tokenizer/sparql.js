define([
    "../utils"
], function (Utils) {
    var aliasRegex = /^\(/,
        ascRegex = /^(ASC|asc)/,
        asRegex = /^(AS|as)/,
        asteriskRegex = /^\*/,
        avgRegex = /^(AVG|avg)/,
        baseRegex = /^(BASE|base)/,
        bnodeRegex = /^(BNODE|bnode)/,
        colonRegex = /^:/,
        commaRegex = /^,/,
        countRegex = /^(COUNT|count)/,
        curieRegex = /^[a-zA-Z0-9]+:[a-zA-Z0-9]+/,
        curlyBracketLeftRegex = /^\{/,
        curlyBracketRightRegex = /^\}/,
        datatypeRegex = /^\^\^/,
        descRegex = /^(DESC|desc)/,
        dotRegex = /^\./,
        equalsRegex = /^=/,
        filterRegex = /^(FILTER|filter)/,
        greaterOrEqualsRegex = /^>=/,
        greaterRegex = /^>/,
        langRegex = /^@/,
        lesserOrEqualsRegex = /^<=/,
        lesserRegex = /^</,
        literalRegex = /^"/,
        literalStringRegex = /^[a-zA-Z0-9\s]*/,
        maxRegex = /^(MAX|max)/,
        minRegex = /^(MIN|min)/,
        notEqualsRegex = /^!=/,
        optionalRegex = /^(OPTIONAL|optional)/,
        parenthesisLeft = /^\(/,
        parenthesisRight = /^\)/,
        prefixRegex = /^(PREFIX|prefix)/,
        semicolonRegex = /^;/,
        stringRegex = /^[a-zA-Z0-9]*/,
        sumRegex = /^(SUM|sum)/,
        typeRegex = /^a/,
        uriRegex = /^http:\/\/[a-zA-Z0-9#_\-.\/]+/,
        variableRegex = /^\?/,
        whereRegex = /^(WHERE|where)/,
        wsRegex = /^(\u0009|\u000A|\u000D|\u0020|#([^\u000A\u000D])*)+/,
        token = {
            "base": function (value) {
                return {
                    "token": "base",
                    "value": value
                };
            },
            "expression": function (expressionType, primaryExpression, value) {
                return {
                    "expressionType": expressionType,
                    "primaryexpression": primaryExpression,
                    "token": "expression",
                    "value": value
                };
            },
            "literal": function (value, lang, type) {
                return {
                    "lang": lang,
                    "token": "literal",
                    "type": type,
                    "value": value
                };
            },
            "optional": function (value) {
                return {
                    "token": "optionalgraphpattern",
                    "value": value
                };
            },
            "prefix": function (prefix, local) {
                return {
                    "local": local,
                    "prefix": prefix,
                    "token": "prefix"
                };
            },
            "uri": function (options) {
                return {
                    "prefix": options.prefix || null,
                    "suffix": options.suffix || null,
                    "token": "uri",
                    "value": options.value || null
                };
            },
            "var": function (value) {
                return {
                    "token": "var",
                    "value": value
                };
            },
            /**
             *
             * @param kind
             * @param [value]
             * @return {Object}
             */
            "variable": function (kind, value) {
                var tmp = {
                    "kind": kind,
                    "token": "variable"
                };
                if (value) {
                    tmp.value = value;
                }
                return tmp;
            }
        };
    /**
     *
     * @param data
     * @param [options]
     * @return {Object}
     */
    function bpgPart(data, options) {
        //buster.log("BPGPART", data);
        var lToken, part;
        if (typeRegex.test(data)) {
            data = expect(data, typeRegex);
            lToken = token.uri({
                value: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"
            });
        } else if (variableRegex.test(data)) {
            part = this.var(data.substr(1));
            lToken = part.var;
            data = part.remainder;
        } else if (literalRegex.test(data)) {
            part = this.literal(data, options);
            lToken = part.literal;
            data = part.remainder;
        } else if (curieRegex.test(data) || lesserRegex.test(data)) {
            part = this.uri(data, options);
            lToken = part.uri;
            data = part.remainder;
        } else {
            part = this.literal(data, options);
            lToken = part.literal;
            data = part.remainder;
        }
        return {
            "remainder": data,
            "token": lToken
        };
    }
    function expect(data, regex) {
        if (!regex.test(data)) {
            throw new Error ("Didn't meet expected token: " + data);
        }
        return data.substr(regex.exec(data)[0].length);
    }
    function expressionAggregate(type, data) {
        var remainder = expect(data.substr(type.length), parenthesisLeft),
            expression = this.expression(remainder);
        remainder = expect(expression.remainder, parenthesisRight);
        return {
            "expression": {
                "aggregateType": type,
                "distinct": "",
                "expression": expression.expression,
                "expressionType": "aggregate",
                "token": "expression"
            },
            "remainder": remainder
        }
    }
    /**
     *
     * @param data
     * @param [options]
     * @return {Object}
     */
    function expressionLiteral(data, options) {
        var literal = this.literal(data, options);
        return {
            "expression": {
                "expressionType": "atomic",
                "primaryexpression": "rdfliteral",
                "token": "expression",
                "value": literal.literal
            },
            "remainder": literal.remainder
        };
    }
    function expressionRelationalOp2(data, regex) {
        var op2;
        data = expect(data, regex);
        data = ws(data, { required: true });
        op2 = this.expression(data);
        data = ws(op2.remainder);
        op2 = op2.expression;
        return {
            "op2": op2,
            "remainder": data
        }
    }
    function expressionRelational(data, op1) {
        var op2,
            expression = {
                "expressionType": "relationalexpression",
                "token": "expression"
            };
        if (!op1) {
            if (variableRegex.test(data)) {
                data = expect(data, variableRegex);
                op1 = this.expression(data);
                data = ws(op1.remainder, { required: true });
                op1 = op1.var;
            } else {
                throw new Error ("Expressional relation sign not recognized: " + data);
            }
        }
        if (equalsRegex.test(data)) {
            op2 = expressionRelationalOp2.call(this, data, equalsRegex);
            data = op2.remainder;
            op2 = op2.op2;
            expression.operator = "=";
        } else if (greaterOrEqualsRegex.test(data)) {
            op2 = expressionRelationalOp2.call(this, data, greaterOrEqualsRegex);
            data = op2.remainder;
            op2 = op2.op2;
            expression.operator = ">=";
        } else if (greaterRegex.test(data)) {
            op2 = expressionRelationalOp2.call(this, data, greaterRegex);
            data = op2.remainder;
            op2 = op2.op2;
            expression.operator = ">";
        } else if (lesserOrEqualsRegex.test(data)) {
            op2 = expressionRelationalOp2.call(this, data, lesserOrEqualsRegex);
            data = op2.remainder;
            op2 = op2.op2;
            expression.operator = "<=";
        } else if (lesserRegex.test(data)) {
            op2 = expressionRelationalOp2.call(this, data, lesserRegex);
            data = op2.remainder;
            op2 = op2.op2;
            expression.operator = "<";
        } else if (notEqualsRegex.test(data)) {
            op2 = expressionRelationalOp2.call(this, data, notEqualsRegex);
            data = op2.remainder;
            op2 = op2.op2;
            expression.operator = "!=";
        } else {
            throw new Error ("Expressional relation sign not recognized: " + data);
        }
        expression.op1 = op1;
        expression.op2 = op2;
        return {
            "expression": expression,
            "remainder": data
        };
    }
    function whereBGP(triplesContext, pattern, options) {
        switch (pattern.kind) {
            case "BGP":
                console.log("IN SPARQL, WHERE BGP BGP");
                return {
                    "kind": "BGP",
                    "value": pattern.value.concat(triplesContext)
                };
            case "EMPTY_PATTERN":
                console.log("IN SPARQL, WHERE BGP EMPTY_PATTERN");
                return {
                    "kind": "BGP",
                    "value": triplesContext
                };
            case "FILTER":
                console.log("IN SPARQL, WHERE BGP FILTER");
                pattern.value = whereBGP(triplesContext, pattern.value, options);
                return pattern;
            case "JOIN":
                console.log("IN SPARQL, WHERE BGP JOIN");
                pattern.rvalue.value = pattern.rvalue.value.concat(triplesContext);
                return pattern;
            case "LEFT_JOIN":
                console.log("IN SPARQL, WHERE BGP LEFT_JOIN");
                return {
                    "kind": "JOIN",
                    "lvalue": pattern,
                    "rvalue": {
                        "kind": "BGP",
                        "value": triplesContext
                    }
                };
            default:
                throw new Error("NOT SUPPORTED YET");
        }
    }
    function whereFilter(token, pattern) {
        token = {
            "filter": true,
            "kind": "LEFT_JOIN",
            "lvalue": pattern,
            "rvalue": {
                "kind": "BGP",
                "value": token.optional.value.patterns[0].triplesContext
            }
        };
        return token;
    }
    function ws(data, opts) {
        opts = opts || {};
        if ((opts.required || false) && !wsRegex.test(data)) {
            throw("Invalid sparql: Required whitespace is missing!");
        }
        //buster.log("IN SPARQL, WS", data);
        return data.replace(wsRegex, '');
    }
    return {
        "alias": function (data) {
            var alias;
            if (!asRegex.test(data)) {
                throw new Error("Couldn't parse alias: " + data);
            }
            data = ws(data.substr(2), { required: true });
            if (variableRegex.test(data)) {
                alias = this.var(data.substr(1));
                return {
                    "alias": alias.var,
                    "remainder": alias.remainder
                };
            } else {
                throw new Error("Alias don't know how to parse the following " + data);
            }
        },
        "base": function (data) {
            //buster.log("In tokenizer (SPARQL)", data);
            var value = uriRegex.exec(data)[0];
            return {
                "base": token.base(value),
                "remainder": data.substr(value.length)
            };
        },
        /**
         *
         * @param data
         * @param triplesContext
         * @param [options]
         * @return {Object}
         */
        "basicgraphpattern": function (data, triplesContext, options) {
            options = options || {};
            //buster.log("STARTING BGP", data, subject);
            //buster.log("IN SPARQL, BGP", data);
            //buster.log(options);
            var subject = !options.subject ? bpgPart.call(this, data, options) : {
                    "remainder": data,
                    "token": options.subject
                },
                predicate = !options.predicate ? bpgPart.call(this, ws(subject.remainder, { required: true }), options) : {
                    "remainder": data,
                    "token": options.predicate
                },
                object = bpgPart.call(this, ws(predicate.remainder, { required: true }), options),
                remainder = ws(object.remainder),
                value = {
                    "object": object.token,
                    "predicate": predicate.token,
                    "subject": subject.token
                };
            if (options.variables) {
                value.variables = options.variables;
            }
            triplesContext = triplesContext || [];
            triplesContext.push(value);
            //buster.log("IN SPARQL, BGP, parsed triple", triplesContext);
            if (dotRegex.test(remainder)) {
                remainder = ws(remainder.substr(1));
            } else if (semicolonRegex.test(remainder)) {
                remainder = expect(remainder, semicolonRegex);
                options.subject = subject.token;
                return this.basicgraphpattern(remainder, triplesContext, options);
            } else if (commaRegex.test(remainder)) {
                remainder = expect(remainder, commaRegex);
                options.subject = subject.token;
                options.predicate = predicate.token;
                return this.basicgraphpattern(remainder, triplesContext, options);
            }
            if (variableRegex.test(remainder)) {
                return this.basicgraphpattern(remainder, triplesContext, options);
            }
            if (options.basicgraphpattern && options.modifiedPattern) {
                triplesContext = options.basicgraphpattern.triplesContext.concat(triplesContext);
            }
            return {
                "basicgraphpattern": {
                    "token": "basicgraphpattern",
                    "triplesContext": triplesContext
                },
                "remainder": remainder
            }
        },
        /**
         *
         * @param data
         * @param [options]
         * @return {Object}
         */
        "expression": function (data, options) {
            var value,
                arg,
                expression,
                remainder,
                irireforfunction;
            if (variableRegex.test(data)) {
                value = this.var(data.substr(1));
                expression =  {
                    "expressionType": "atomic",
                    "primaryexpression": "var",
                    "token": "expression",
                    "value": value.var
                };
                data = ws(value.remainder);
                if (equalsRegex.test(data) ||
                    greaterOrEqualsRegex.test(data) ||
                    greaterRegex.test(data) ||
                    lesserOrEqualsRegex.test(data) ||
                    lesserRegex.test(data) ||
                    notEqualsRegex.test(data)) {
                    return expressionRelational.call(this, data, expression);
                }
                return {
                    "expression": expression,
                    "remainder": data
                };
            } else if (lesserRegex.test(data)) {
                irireforfunction = this.uri(data, options);
                return {
                    "expression": {
                        "args": undefined,
                        "expressionType": "irireforfunction",
                        "iriref": irireforfunction.uri,
                        "token": "expression"
                    },
                    "remainder": irireforfunction.remainder
                };
            } else if (literalRegex.test(data)) {
                return expressionLiteral.call(this, data, options);
            } else if (bnodeRegex.test(data)) {
                remainder = expect(data.substr(5), parenthesisLeft);
                arg = this.expression(remainder);
                remainder = expect(arg.remainder, parenthesisRight);
                return {
                    "expression": {
                        "args": [ arg.expression ],
                        "builtincall": "bnode",
                        "expressionType": "builtincall",
                        "token": "expression"
                    },
                    "remainder": remainder
                };
            } else if (avgRegex.test(data)) {
                return expressionAggregate.call(this, "avg", data);
            } else if (countRegex.test(data)) {
                return expressionAggregate.call(this, "count", data);
            } else if (maxRegex.test(data)) {
                return expressionAggregate.call(this, "max", data);
            } else if (minRegex.test(data)) {
                return expressionAggregate.call(this, "min", data);
            } else if (sumRegex.test(data)) {
                return expressionAggregate.call(this, "sum", data);
            } else if (stringRegex.test(data)) {
                return expressionLiteral.call(this, data, options);
            } else {
                throw new Error("Can't parse expression: " + data);
            }
        },
        /**
         *
         * @param data
         * @param [options]
         * @return {Object}
         */
        "filter": function (data, options) {
            var value;
            data = expect(data, filterRegex);
            data = expect(data, parenthesisLeft);
            value = this.expression(data, options);
            data = expect(value.remainder, parenthesisRight);
            data = ws(data);
            return {
                "filter": {
                    "token": "filter",
                    "value": value.expression
                },
                "remainder": data
            };
        },
        "group": function (data, group) {
            if (!group) {
                if (!variableRegex.test(data)) {
                    throw new Error("Not valid group-syntax: " + data);
                }
                group = [];
            }
            var variable;
            if (variableRegex.test(data)) {
                data = expect(data, variableRegex);
                variable = this.var(data);
                group.push(variable.var);
                data = ws(variable.remainder);
                return this.group(data, group);
            }
            return {
                "group": group,
                "remainder": data
            };
        },
        /**
         *
         * @param data
         * @param filters
         * @param patterns
         * @param [options]
         * @return {Object}
         */
        "groupgraphpattern": function (data, filters, patterns, options) {
            //console.log("IN SPARQL TOKENIZER, groupgraphpattern", patterns);
            options = options || {};
            var filter,
                pattern,
                triplesContext = [];
            if (variableRegex.test(data) || lesserRegex.test(data)) {
                if (options.triplesContext) {
                    triplesContext = options.triplesContext;
                }
                pattern = this.basicgraphpattern(data, triplesContext, options);
                patterns = [ pattern.basicgraphpattern ];
                data = ws(pattern.remainder);
                return this.groupgraphpattern(data, filters, patterns, options);
            } else if (filterRegex.test(data)) {
                filter = this.filter(data, options);
                data = ws(filter.remainder);
                filters.push(filter.filter);
                return this.groupgraphpattern(data, filters, patterns, options);
            }
            return {
                "groupgraphpattern": {
                    "filters": filters,
                    "patterns": patterns,
                    "token": "groupgraphpattern"
                },
                "remainder": data
            };
        },
        /**
         *
         * @param data
         * @param [options]
         * @return {Object}
         */
        "literal": function (data, options) {
            var lang = null,
                type = null,
                value;
            if (literalRegex.test(data)) {
                data = data.substr(1);
                value = literalStringRegex.exec(data)[0];
                data = data.substr(value.length);
                data = expect(data, literalRegex);
                if (langRegex.test(data)) {
                    data = data.substr(1);
                    lang = stringRegex.exec(data)[0];
                    data = data.substr(lang.length);
                } else if (datatypeRegex.test(data)) {
                    data = data.substr(2);
                    type = this.uri(data, options);
                    data = type.remainder;
                    type = type.uri;
                }
            } else {
                value = stringRegex.exec(data)[0];
                data = data.substr(value.length);
                if (Utils.isInteger(value)) {
                    type = "http://www.w3.org/2001/XMLSchema#integer";
                }
            }
            return {
                "literal": {
                    "lang": lang,
                    "token": "literal",
                    "type": type,
                    "value": value
                },
                "remainder": data
            };
        },
        /**
         *
         * @param data
         * @param [options]
         * @return {Object}
         */
        "optional": function (data, options) {
            var groupgraphpattern;
            data = expect(data, optionalRegex);
            data = ws(data);
            data = expect(data, curlyBracketLeftRegex);
            data = ws(data);
            groupgraphpattern = this.groupgraphpattern(data, [], [], options);
            data = expect(groupgraphpattern.remainder, curlyBracketRightRegex);
            data = ws(data);
            return {
                "optional": token.optional(groupgraphpattern.groupgraphpattern),
                "remainder": data
            }
        },
        "order": function (data, order) {
            if (!order) {
                if (!variableRegex.test(data) && !ascRegex.test(data) && !descRegex.test(data)) {
                    throw new Error("Not valid order-syntax: " + data);
                }
                order = [];
            }
            var expression;
            if (ascRegex.test(data)) {
                data = expect(data, ascRegex);
                data = expect(data, parenthesisLeft);
                expression = this.expression(data);
                data = expect(expression.remainder, parenthesisRight);
                data = ws(data);
                order.push({
                    "direction": "ASC",
                    "expression": expression.expression
                });
                return this.order(data, order);
            } else if (descRegex.test(data)) {
                data = expect(data, descRegex);
                data = expect(data, parenthesisLeft);
                expression = this.expression(data);
                data = expect(expression.remainder, parenthesisRight);
                data = ws(data);
                order.push({
                    "direction": "DESC",
                    "expression": expression.expression
                });
                return this.order(data, order);
            } else if (variableRegex.test(data)) {
                expression = this.expression(data);
                data = ws(expression.remainder);
                order.push({
                    "direction": "ASC",
                    "expression": expression.expression
                });
                return this.order(data, order);
            }
            return {
                "order": order,
                "remainder": data
            }
        },
        "pattern": function (data, options) {
            //console.log("IN SPARQL, PATTERN", options);
            options = options || {};
            var bgp = this.groupgraphpattern(data, [], [], options);
            //buster.log("IN SPARQL, PATTERN", bgp);
            return {
                "pattern": bgp.groupgraphpattern,
                "remainder": bgp.remainder
            }
        },
        "prefix": function (data) {
            var prefix = stringRegex.exec(data)[0],
                local;
            data = data.substr(prefix.length);
            data = expect(data, colonRegex);
            data = ws(data, { required: true });
            data = expect(data, lesserRegex);
            local = uriRegex.exec(data)[0];
            data = data.substr(local.length);
            data = expect(data, greaterRegex);
            return {
                "prefix": token.prefix(prefix, local),
                "remainder": data
            };
        },
        "projection": function (data, projections) {
            projections = projections || [];
            var parsed,
                remainder;
            if (variableRegex.test(data)) {
                parsed = this.variable(data);
                projections.push(parsed.variable);
            } else if (aliasRegex.test(data)) {
                parsed = this.variable(data);
                projections.push(parsed.variable);
            } else if (asteriskRegex.test(data)) {
                parsed = this.variable(data);
                projections.push(parsed.variable);
            } else {
                return {
                    "remainder": data,
                    "projection": projections
                }
            }
            remainder = ws(parsed.remainder);
            return this.projection(remainder, projections);
        },
        "prologue": function (data, base, prefixes) {
            var prefix;
            base = base || "";
            prefixes = prefixes || [];
            if (baseRegex.test(data)) {
                data = ws(data.substr(4), { required: true });
                data = expect(data, lesserRegex);
                base = this.base(data);
                data = expect(base.remainder, greaterRegex);
                data = ws(data);
                return this.prologue(data, base.base, prefixes);
            } else if (prefixRegex.test(data)) {
                prefix = this.prefix(ws(data.substr(6), { required: true }));
                data = ws(prefix.remainder);
                prefixes.push(prefix.prefix);
                return this.prologue(data, base, prefixes);
            }
            return {
                "prologue": {
                    "base": base,
                    "prefixes": prefixes,
                    "token": "prologue"
                },
                "remainder": data
            };
        },
        /**
         *
         * @param data
         * @param [options]
         * @return {Object}
         */
        "uri": function (data, options) {
            //buster.log(options);
            var uri = {
                "prefix": null,
                "suffix": null,
                "token": "uri",
                "value": null
            },
                remainder,
                value;
            if (lesserRegex.test(data)) {
                data = expect(data, lesserRegex);
                if (uriRegex.test(data)) {
                    uri.value = value = uriRegex.exec(data)[0];
                } else if (options && options.base) {
                    value = stringRegex.exec(data)[0];
                    uri.value = options.base + value;
                } else {
                    throw new Error("IN SPARQL TOKENIZER, URI couldn't parse data: " + data);
                }
                remainder = expect(data.substr(value.length), greaterRegex);
            } else {
                uri.prefix = stringRegex.exec(data)[0];
                remainder = data.substr(uri.prefix.length);
                remainder = expect(remainder, colonRegex);
                uri.suffix = stringRegex.exec(remainder)[0];
                remainder = remainder.substr(uri.suffix.length);
            }
            return {
                "remainder": remainder,
                "uri": uri
            };
        },
        "var": function (data) {
            var tmp = stringRegex.exec(data)[0];
            return {
                "remainder": data.substr(tmp.length),
                "var": token.var(tmp)
            }
        },
        "variable": function (data) {
            var pVar,
                pVariable;
            if (variableRegex.test(data)) {
                pVar = this.var(data.substr(1));
                pVariable = token.variable("var", pVar.var);
                return {
                    "remainder": pVar.remainder,
                    "variable": pVariable
                };
            } else if (aliasRegex.test(data)) {
                var expression = this.expression(data.substr(1)),
                    remainder = ws(expression.remainder),
                    alias = this.alias(remainder);
                data = expect(alias.remainder, parenthesisRight);
                return {
                    "remainder": data,
                    "variable": {
                        "alias": alias.alias,
                        "expression": expression.expression,
                        "kind": "aliased",
                        "token": "variable"
                    }
                };
            } else if (asteriskRegex.test(data)) {
                return {
                    "remainder": data.substr(1),
                    "variable": token.variable("*")
                };
            }
            throw new Error("Tried to parse something which is not a variable: " + data);
        },
        /**
         *
         * @param data
         * @param [options]
         * @return {Object}
         */
        "where": function (data, options) {
            var pattern, patterns, token, value;
            data = expect(data, whereRegex);
            data = ws(data);
            data = expect(data, curlyBracketLeftRegex);
            data = ws(data);
            options = Utils.clone(options);
            if (options.pattern && options.pattern.token || !options.pattern) {
                console.log("SIMPLE QUERY", options);
                patterns = options.pattern ? options.pattern.patterns : [];
                delete options.variables;
                token = this.groupgraphpattern(data, [], patterns, options);
                data = token.remainder;
                token = token.groupgraphpattern;
            } else {
                console.log("COMPLEX QUERY", options);
                pattern = options.pattern;
                if (variableRegex.test(data) || lesserRegex.test(data)) {
                    token = this.basicgraphpattern(data, [], options);
                    data = token.remainder;
                    value = token.basicgraphpattern.triplesContext;
                    token = whereBGP(value, pattern, options);
                } else if (optionalRegex.test(data)) {
                    token = this.optional(data, options);
                    data = token.remainder;
                    if (pattern.kind === "FILTER") {
                        pattern.value = whereFilter(token, pattern.value);
                        token = pattern;
                    } else {
                        token = whereFilter(token, pattern);
                    }
                } else if (filterRegex.test(data)) {
                    value = this.filter(data, options);
                    data = value.remainder;
                    if (pattern.kind === "FILTER") {
                        token = pattern;
                        token.filter.push(value.filter);
                    } else {
                        token = {
                            "filter": [ value.filter ],
                            "kind": "FILTER",
                            "value": pattern
                        };
                    }
                } else {
                    console.log("SOMETHING WENT WRONG...");
                    throw new Error("NOT SUPPORTED YET");
                }
                if (!curlyBracketRightRegex.test(data)) {
                    console.log("SOMETHING WENT WRONG...");
                    throw new Error("NOT SUPPORTED YET");
                }
            }
            data = expect(data, curlyBracketRightRegex);
            data = ws(data);
            return {
                "remainder": data,
                "where": token
            }
        }
    };
});