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
        descRegex = /^(DESC|desc)/,
        dotRegex = /^\./,
        greaterRegex = /^>/,
        langRegex = /^@/,
        lesserRegex = /^</,
        literalRegex = /^"/,
        literalStringRegex = /^[a-zA-Z0-9\s]*/,
        maxRegex = /^(MAX|max)/,
        minRegex = /^(MIN|min)/,
        parenthesisLeft = /^\(/,
        parenthesisRight = /^\)/,
        prefixRegex = /^(PREFIX|prefix)/,
        semicolonRegex = /^;/,
        stringRegex = /^[a-zA-Z0-9]*/,
        sumRegex = /^(SUM|sum)/,
        typeRegex = /^\^\^/,
        uriRegex = /^http:\/\/[a-zA-Z0-9#_\-.\/]+/,
        variableRegex = /^\?/,
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
            "prefix": function (prefix, local) {
                return {
                    "local": local,
                    "prefix": prefix,
                    "token": "prefix"
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
            buster.log("In tokenizer (SPARQL)", data);
            var value = uriRegex.exec(data)[0];
            return {
                "base": token.base(value),
                "remainder": data.substr(value.length)
            };
        },
        /**
         *
         * @param data
         * @param [oldSubject]
         * @param [oldPredicate]
         * @return {Object}
         */
        "basicgraphpattern": function (data, triplesContext, oldSubject, oldPredicate) {
            //buster.log("STARTING BGP", data, subject);
            buster.log("IN SPARQL, BGP", data);
            var subject = !oldSubject ? this.bpgPart(data) : {
                    "remainder": data,
                    "value": oldSubject.value
                },
                predicate = !oldPredicate ? this.bpgPart(ws(subject.remainder, { required: true })) : {
                    "remainder": data,
                    "value": oldPredicate.value
                },
                newObject = this.bpgPart(ws(predicate.remainder, { required: true })),
                remainder = ws(newObject.remainder);
            triplesContext = triplesContext || [];
            triplesContext.push({
                "object": newObject.value,
                "predicate": predicate.value,
                "subject": subject.value
            });
            buster.log("IN SPARQL, BGP, parsed triple", data);
            if (dotRegex.test(remainder)) {
                remainder = ws(remainder.substr(1));
            } else if (semicolonRegex.test(remainder)) {
                return this.basicgraphpattern(remainder.substr(1), triplesContext, subject);
            } else if (commaRegex.test(remainder)) {
                return this.basicgraphpattern(remainder.substr(1), triplesContext, subject, predicate);
            }
            if (variableRegex.test(remainder)) {
                return this.basicgraphpattern(remainder, triplesContext);
            }
            return {
                "basicgraphpattern": {
                    "token": "basicgraphpattern",
                    "triplesContext": triplesContext
                },
                "remainder": remainder
            }
        },
        "bpgPart": function (data) {
            //buster.log("BPGPART", data);
            var value, part;
            if (variableRegex.test(data)) {
                part = this.var(data.substr(1));
                value = part.var;
            } else if (literalRegex.test(data)) {
                part = this.literal(data);
                value = part.literal;
            } else if (curieRegex.test(data) || lesserRegex.test(data)) {
                part = this.uri(data);
                value = part.uri;
            } else {
                part = this.literal(data);
                value = part.literal;
            }
            return {
                "remainder": part.remainder,
                "value": value
            };
        },
        "expression": function (data) {
            var value,
                arg,
                expression,
                remainder;
            if (variableRegex.test(data)) {
                value = this.var(data.substr(1));
                return {
                    "expression": {
                        "expressionType": "atomic",
                        "primaryexpression": "var",
                        "token": "expression",
                        "value": value.var
                    },
                    "remainder": value.remainder
                };
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
            } else {
                throw new Error("Can't parse expression: " + data);
            }
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
         * @param [filters]
         * @param [patterns]
         * @return {Object}
         */
        "groupgraphpattern": function (data, filters, patterns) {
            filters = filters || [];
            patterns = patterns || [];
            var pattern;
            if (variableRegex.test(data)) {
                pattern = this.basicgraphpattern(data);
                patterns.push(pattern.basicgraphpattern);
                return this.groupgraphpattern(pattern.remainder, filters, patterns);
            }
            return {
                "groupgraphpattern": {
                    "filters": filters,
                    "patterns": patterns,
                    "token": "groupgraphpattern"
                },
                "remainder": ""
            };
        },
        "literal": function (data) {
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
                } else if (typeRegex.test(data)) {
                    data = data.substr(2);
                    type = this.uri(data);
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
        "pattern": function (data) {
            var bgp = this.groupgraphpattern(data);
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
        "uri": function (data) {
            var uri = {
                "prefix": null,
                "suffix": null,
                "token": "uri",
                "value": null
            },
                remainder;
            if (lesserRegex.test(data)) {
                uri.value = uriRegex.exec(data.substr(1))[0];
                remainder = data.substr(uri.value.length + 1);
                remainder = expect(remainder, greaterRegex);
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
        }
    };
});