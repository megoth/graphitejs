define([
    "../../graphite/queryparser",
    "../utils",
    "../../graphite/utils"
], function (QueryParser, TreeUtils, Utils) {
    function _buildGroupGraphPattern(node, env) {
        var f = (node.filters || []),
            g = {
                kind: "EMPTY_PATTERN"
            },
            parsedPattern,
            that = this;
        Utils.each(node.patterns, function (pattern) {
            if(pattern.token === 'optionalgraphpattern') {
                parsedPattern = that.build(pattern.value, env);
                if(parsedPattern.kind === 'FILTER') {
                    g =  { kind:'LEFT_JOIN',
                        lvalue: g,
                        rvalue: parsedPattern.value,
                        filter: parsedPattern.filter };
                } else {
                    g = { kind:'LEFT_JOIN',
                        lvalue: g,
                        rvalue: parsedPattern,
                        filter: true };
                }
            } else {
                parsedPattern = that.build(pattern,env);
                if(g.kind == "EMPTY_PATTERN") {
                    g = parsedPattern;
                } else {
                    g = { kind: 'JOIN',
                        lvalue: g,
                        rvalue: parsedPattern };
                }
            }
        });
        if(f.length != 0) {
            if(g.kind === 'EMPTY_PATTERN') {
                return { kind: 'FILTER',
                    filter: f,
                    value: g};
            } else if(g.kind === 'LEFT_JOIN' && g.filter === true) {
                return {
                    kind: 'FILTER',
                    filter: f,
                    value: g
                };
            } else if(g.kind === 'LEFT_JOIN') {
                return { kind: 'FILTER',
                    filter: f,
                    value: g};
            } else if(g.kind === 'JOIN') {
                return { kind: 'FILTER',
                    filter: f,
                    value: g};
            } else if(g.kind === 'UNION') {
                return { kind: 'FILTER',
                    filter: f,
                    value: g};
            } else if(g.kind === 'GRAPH') {
                return { kind: 'FILTER',
                    filter: f,
                    value: g};
            } else if(g.kind === 'BGP') {
                return { kind: 'FILTER',
                    filter: f,
                    value: g};
            } else {
                throw new Error("Unknow kind of algebra expression: "+ g.kind);
            }
        } else {
            return g;
        }
    }
    function _bindTripleContext(triples, bindings) {
        Utils.each(triples, function (triple, i) {
            delete triple['graph'];
            delete triple['variables'];
            Utils.each(triple, function (comp, p) {
                if(comp.token === 'var' && bindings[comp.value] != null) {
                    triples[i][p] = bindings[comp.value];
                }
            });
        });
        return triples;
    }
    function _bindFilter(filterExpr, bindings) {
        var that = this;
        if(filterExpr.expressionType != null) {
            var expressionType = filterExpr.expressionType;
            if(expressionType == 'relationalexpression') {
                filterExpr.op1 = _bindFilter.call(that, filterExpr.op1, bindings);
                filterExpr.op2 = _bindFilter.call(that, filterExpr.op2, bindings);
            } else if(expressionType == 'conditionalor' || expressionType == 'conditionaland') {
                Utils.map(filterExpr.operands, function (operand) {
                    return _bindFilter.call(that, operand, bindings);
                });
            } else if(expressionType == 'additiveexpression') {
                filterExpr.summand = _bindFilter.call(that, filterExpr.summand, bindings);
                Utils.each(filterExpr.summands, function (summand) {
                    summand.expression = _bindFilter.call(that, summand.expression, bindings);
                });
            } else if(expressionType == 'builtincall') {
                Utils.map(filterExpr.args, function (arg) {
                    return _bindFilter.call(that, arg, bindings);
                });
            } else if(expressionType == 'multiplicativeexpression') {
                filterExpr.factor = _bindFilter.call(that, filterExpr.factor, bindings);
                Utils.each(filterExpr.factors, function (factor) {
                    factor.expression = _bindFilter.call(that, factor.expression, bindings);
                });
            } else if(expressionType == 'unaryexpression') {
                filterExpr.expression = _bindFilter.call(that, filterExpr.expression, bindings);
            } else if(expressionType == 'irireforfunction') {
                Utils.map(filterExpr.args, function (arg) {
                    return _bindFilter.call(that, arg, bindings);
                });
            } else if(expressionType == 'atomic') {
                if(filterExpr.primaryexpression == 'var') {
                    // lookup the var in the bindings
                    if(bindings[filterExpr.value.value] != null) {
                        var val = bindings[filterExpr.value.value];
                        if(val.token === 'uri') {
                            filterExpr.primaryexpression = 'iri';
                        } else {
                            filterExpr.primaryexpression = 'literal';
                        }
                        filterExpr.value = val;
                    }
                }
            }
        }
        return filterExpr;
    }
    function _replaceTripleContext(triples, from, to, ns) {
        Utils.each(triples, function (triple, i) {
            Utils.each(triple, function (comp, p) {
                if(comp.token === 'var' && from.token === 'var' && comp.value === from.value) {
                    triples[i][p] = to;
                } else if(comp.token === 'blank' && from.token === 'blank' && comp.value === from.value) {
                    triples[i][p] = to;
                } else {
                    if((comp.token === 'literal' || comp.token ==='uri') &&
                        (from.token === 'literal' || from.token ==='uri') &&
                        comp.token === from.token && TreeUtils.lexicalFormTerm(comp,ns)[comp.token] === TreeUtils.lexicalFormTerm(from,ns)[comp.token]) {
                        triples[i][p] = to;
                    }
                }
            });
        });
        return triples;
    }
    function _replaceFilter(filterExpr, from, to, ns) {
        if(filterExpr.expressionType != null) {
            var expressionType = filterExpr.expressionType;
            if(expressionType == 'relationalexpression') {
                filterExpr.op1 = _replaceFilter(filterExpr.op1, from, to, ns);
                filterExpr.op2 = _replaceFilter(filterExpr.op2, from, to, ns);
            } else if(expressionType == 'conditionalor' || expressionType == 'conditionaland') {
                Utils.map(filterExpr.operands, function (operand) {
                    return _replaceFilter(operand, from, to, ns);
                });
            } else if(expressionType == 'additiveexpression') {
                filterExpr.summand = _replaceFilter(filterExpr.summand, from, to, ns);
                Utils.each(filterExpr.summands, function (summand) {
                    summand.expression = _replaceFilter(summand.expression, from, to, ns);
                });
            } else if(expressionType == 'builtincall') {
                Utils.map(filterExpr.args, function (arg) {
                    return _replaceFilter(arg, from, to, ns);
                });
            } else if(expressionType == 'multiplicativeexpression') {
                filterExpr.factor = _replaceFilter(filterExpr.factor, from, to, ns);
                Utils.each(filterExpr.factors, function (factor) {
                    factor.expression = _replaceFilter(factor.expression, from, to, ns);
                });
            } else if(expressionType == 'unaryexpression') {
                filterExpr.expression = _replaceFilter(filterExpr.expression, from, to, ns);
            } else if(expressionType == 'irireforfunction') {
                Utils.map(filterExpr.factors.args, function (arg) {
                    return _replaceFilter(arg, from, to, ns);
                });
            } else if(expressionType == 'atomic') {
                var val = null;
                if(filterExpr.primaryexpression == from.token && filterExpr.value == from.value) {
                    val = to.value;
                } else if(filterExpr.primaryexpression == 'iri' && from.token == 'uri' && filterExpr.value == from.value) {
                    val = to.value;
                }

                if(val != null) {
                    if(to.token === 'uri') {
                        filterExpr.primaryexpression = 'iri';
                    } else {
                        filterExpr.primaryexpression = to.token;
                    }
                    filterExpr.value = val;
                }
            }
        }
        return filterExpr;
    }
    /**
     * @doc
     *
     * Based on <http://www.w3.org/2001/sw/DataAccess/rq23/rq24-algebra.html>
     * W3C's note
     */
    var AbstractQueryTree = function() {
        return Object.create({
            parseQueryString: function(query_string) {
                //noinspection UnnecessaryLocalVariableJS,UnnecessaryLocalVariableJS
                return QueryParser("sparql").parse(query_string).syntaxTree;
            },
            parseExecutableUnit: function(executableUnit) {
                if(executableUnit.kind === 'select') {
                    return this.parseSelect(executableUnit);
                } else if(executableUnit.kind === 'ask') {
                    return this.parseSelect(executableUnit);
                } else if(executableUnit.kind === 'modify') {
                    return this.parseSelect(executableUnit);
                } else if(executableUnit.kind === 'construct') {
                    return this.parseSelect(executableUnit);
                } else if(executableUnit.kind === 'insertdata') {
                    return this.parseInsertData(executableUnit);
                } else if(executableUnit.kind === 'deletedata') {
                    return this.parseInsertData(executableUnit);
                } else if(executableUnit.kind === 'load') {
                    return executableUnit;
                } else if(executableUnit.kind === 'clear') {
                    return executableUnit;
                } else if(executableUnit.kind === 'drop') {
                    return executableUnit;
                } else if(executableUnit.kind === 'create') {
                    return executableUnit;
                } else {
                    throw new Error('unknown executable unit: ' + executableUnit.kind);
                }
            },
            parseSelect: function(syntaxTree){
                if(syntaxTree == null) {
                    //console.log("error parsing query");
                    return null;
                } else {
                    var env = { freshCounter: 0 };
                    syntaxTree.pattern = this.build(syntaxTree.pattern, env);
                    return syntaxTree;
                }
            },
            parseInsertData: function(syntaxTree){
                if(syntaxTree == null) {
                    //console.log("error parsing query");
                    return null;
                } else {
                    return syntaxTree;
                }
            },
            build: function(node, env) {
                if(node.token === 'groupgraphpattern') {
                    return _buildGroupGraphPattern.call(this, node, env);
                } else if (node.token === 'basicgraphpattern') {
                    var bgp = { kind: 'BGP',
                        value: node.triplesContext };
                    //console.log("pre1");
                    bgp = AbstractQueryTree.translatePathExpressionsInBGP(bgp, env);
                    //console.log("translation");
                    //console.log(sys.inspect(bgp,true,20));
                    return bgp;
                } else if (node.token === 'graphunionpattern') {
                    var a = this.build(node.value[0],env);
                    var b = this.build(node.value[1],env);
                    return { kind: 'UNION',
                        value: [a,b] };
                } else if(node.token === 'graphgraphpattern') {
                    var c = this.build(node.value, env);
                    return { kind: 'GRAPH',
                        value: c,
                        graph: node.graph };
                } else {
                    throw new Error("not supported token in query:"+node.token);
                }
            },
            /**
             * Collects basic triple pattern in a complex SPARQL AQT
             */
            collectBasicTriples: function(aqt, acum) {
                if(acum == null) {
                    acum = [];
                }
                if(aqt.kind === 'select') {
                    acum = this.collectBasicTriples(aqt.pattern,acum);
                } else if(aqt.kind === 'BGP') {
                    acum = acum.concat(aqt.value);
                } else if(aqt.kind === 'ZERO_OR_MORE_PATH') {
                    acum = this.collectBasicTriples(aqt.path);
                } else if(aqt.kind === 'UNION') {
                    acum = this.collectBasicTriples(aqt.value[0],acum);
                    acum = this.collectBasicTriples(aqt.value[1],acum);
                } else if(aqt.kind === 'GRAPH') {
                    acum = this.collectBasicTriples(aqt.value,acum);
                } else if(aqt.kind === 'LEFT_JOIN' || aqt.kind === 'JOIN') {
                    acum = this.collectBasicTriples(aqt.lvalue, acum);
                    acum = this.collectBasicTriples(aqt.rvalue, acum);
                } else if(aqt.kind === 'FILTER') {
                    acum = this.collectBasicTriples(aqt.value, acum);
                } else if(aqt.kind === 'construct') {
                    acum = this.collectBasicTriples(aqt.pattern,acum);
                } else if(aqt.kind === 'EMPTY_PATTERN') {
                    // nothing
                } else {
                    throw "Unknown pattern: "+aqt.kind;
                }
                return acum;
            },
            /**
             * Replaces bindings in an AQT
             */
            bind: function(aqt, bindings) {
                if(aqt.graph != null && aqt.graph.token && aqt.graph.token === 'var' &&
                    bindings[aqt.graph.value] != null) {
                    aqt.graph = bindings[aqt.graph.value];
                }
                if(aqt.filter != null) {
                    var acum = [];
                    for(var i=0; i< aqt.filter.length; i++) {
                        aqt.filter[i].value = _bindFilter.call(this, aqt.filter[i].value, bindings);
                        acum.push(aqt.filter[i]);
                    }
                    aqt.filter = acum;
                }
                if(aqt.kind === 'select') {
                    aqt.pattern = this.bind(aqt.pattern, bindings);
                    //acum = this.collectBasicTriples(aqt.pattern,acum);
                } else if(aqt.kind === 'BGP') {
                    aqt.value = _bindTripleContext(aqt.value, bindings);
                    //acum = acum.concat(aqt.value);
                } else if(aqt.kind === 'ZERO_OR_MORE_PATH') {
                    aqt.path = _bindTripleContext(aqt.path, bindings);
                    if(aqt.x && aqt.x.token === 'var' && bindings[aqt.x.value] != null) {
                        aqt.x = bindings[aqt.x.value];
                    }
                    if(aqt.y && aqt.y.token === 'var' && bindings[aqt.y.value] != null) {
                        aqt.y = bindings[aqt.y.value];
                    }
                } else if(aqt.kind === 'UNION') {
                    aqt.value[0] = this.bind(aqt.value[0],bindings);
                    aqt.value[1] = this.bind(aqt.value[1],bindings);
                } else if(aqt.kind === 'GRAPH') {
                    aqt.value = this.bind(aqt.value,bindings);
                } else if(aqt.kind === 'LEFT_JOIN' || aqt.kind === 'JOIN') {
                    aqt.lvalue = this.bind(aqt.lvalue, bindings);
                    aqt.rvalue = this.bind(aqt.rvalue, bindings);
                } else if(aqt.kind === 'FILTER') {
                    aqt.filter = _bindFilter.call(this, aqt.filter[i].value, bindings);
                } else if(aqt.kind === 'EMPTY_PATTERN') {
                    // nothing
                } else {
                    throw "Unknown pattern: "+aqt.kind;
                }
                return aqt;
            },
            /**
             * Replaces terms in an AQT
             */
            replace: function(aqt, from, to, ns) {
                if(aqt.graph != null && aqt.graph.token && aqt.graph.token === from.token &&
                    aqt.graph.value == from.value) {
                    aqt.graph = TreeUtils.clone(to);
                }
                if(aqt.filter != null) {
                    var acum = [];
                    for(var i=0; i< aqt.filter.length; i++) {
                        aqt.filter[i].value = _replaceFilter(aqt.filter[i].value, from, to, ns);
                        acum.push(aqt.filter[i]);
                    }
                    aqt.filter = acum;
                }
                if(aqt.kind === 'select') {
                    aqt.pattern = this.replace(aqt.pattern, from, to, ns);
                } else if(aqt.kind === 'BGP') {
                    aqt.value = _replaceTripleContext(aqt.value, from, to, ns);
                } else if(aqt.kind === 'ZERO_OR_MORE_PATH') {
                    aqt.path = _replaceTripleContext(aqt.path, from,to, ns);
                    if(aqt.x && aqt.x.token === from.token && aqt.value === from.value) {
                        aqt.x = TreeUtils.clone(to);
                    }
                    if(aqt.y && aqt.y.token === from.token && aqt.value === from.value) {
                        aqt.y = TreeUtils.clone(to);
                    }
                } else if(aqt.kind === 'UNION') {
                    aqt.value[0] = this.replace(aqt.value[0],from,to, ns);
                    aqt.value[1] = this.replace(aqt.value[1],from,to, ns);
                } else if(aqt.kind === 'GRAPH') {
                    aqt.value = this.replace(aqt.value,from,to);
                } else if(aqt.kind === 'LEFT_JOIN' || aqt.kind === 'JOIN') {
                    aqt.lvalue = this.replace(aqt.lvalue, from, to, ns);
                    aqt.rvalue = this.replace(aqt.rvalue, from, to, ns);
                } else if(aqt.kind === 'FILTER') {
                    aqt.value = _replaceFilter(aqt.value, from,to, ns);
                } else if(aqt.kind === 'EMPTY_PATTERN') {
                    // nothing
                } else {
                    throw "Unknown pattern: "+aqt.kind;
                }
                return aqt;
            },
            treeWithUnion: function(aqt) {
                if(aqt == null)
                    return false;
                if(aqt.kind == null)
                    return false;
                if(aqt.kind === 'select') {
                    return this.treeWithUnion(aqt.pattern);
                } else if(aqt.kind === 'BGP') {
                    return this.treeWithUnion(aqt.value);
                } else if(aqt.kind === 'ZERO_OR_MORE_PATH') {
                    return false;
                } else if(aqt.kind === 'UNION') {
                    if(aqt.value[0].value != null && aqt.value[0].value.variables != null &&
                        aqt.value[1].value != null && aqt.value[1].value.variables != null) {
                        //console.log("COMPARING:"+aqt.value[0].variables.join("/"));
                        //console.log("VS "+aqt.values[1].variables.join("/"));
                        if(aqt.value[0].variables.join("/") === aqt.values[1].variables.join("/")) {
                            if(this.treeWithUnion(aqt.value[0]))
                                return true;
                            else
                                return this.treeWithUnion(aqt.value[1]);
                        }
                    } else {
                        return true;
                    }
                } else if(aqt.kind === 'GRAPH') {
                    return false;
                } else if(aqt.kind === 'LEFT_JOIN' || aqt.kind === 'JOIN') {
                    var leftUnion  = this.treeWithUnion(aqt.lvalue);
                    if(leftUnion)
                        return true;
                    else
                        this.treeWithUnion(aqt.rvalue);
                } else if(aqt.kind === 'FILTER') {
                    return false;
                } else if(aqt.kind === 'EMPTY_PATTERN') {
                    return false;
                } else {
                    return false;
                }
            }
        });
    };
    AbstractQueryTree.translatePathExpressionsInBGP = function(bgp, env) {
        var pathExpression;
        var before = [], rest, bottomJoin;
        for(var i=0; i<bgp.value.length; i++) {
            if(bgp.value[i].predicate && bgp.value[i].predicate.token === 'path') {
                //console.log("FOUND A PATH");
                pathExpression = bgp.value[i];
                rest = bgp.value.slice(i+1);
                var bgpTransformed = AbstractQueryTree.translatePathExpression(pathExpression, env);
                var optionalPattern = null;
                //console.log("BACK FROM TRANSFORMED");
                if(bgpTransformed.kind === 'BGP') {
                    before = before.concat(bgpTransformed.value);
                } else if(bgpTransformed.kind === 'ZERO_OR_MORE_PATH' || bgpTransformed.kind === 'ONE_OR_MORE_PATH'){
                    //console.log("BEFORE");
                    //console.log(bgpTransformed);
                    if(before.length > 0) {
                        bottomJoin =  {kind: 'JOIN',
                            lvalue: {kind: 'BGP', value:before},
                            rvalue: bgpTransformed};
                    } else {
                        bottomJoin = bgpTransformed;
                    }
                    if(bgpTransformed.kind === 'ZERO_OR_MORE_PATH') {
                        if(bgpTransformed.y.token === 'var' && bgpTransformed.y.value.indexOf("fresh:")===0 &&
                            bgpTransformed.x.token === 'var' && bgpTransformed.x.value.indexOf("fresh:")===0) {
                            //console.log("ADDING EXTRA PATTERN 1)");
                            Utils.each(bgp.value, function (value) {
                                //console.log(bgp.value[j]);
                                if(value.object && value.object.token === 'var' && value.object.value === bgpTransformed.x.value) {
                                    //console.log(" YES 1)");
                                    optionalPattern = TreeUtils.clone(value);
                                    optionalPattern.object = bgpTransformed.y;
                                }
                            });
                        } else if(bgpTransformed.y.token === 'var' && bgpTransformed.y.value.indexOf("fresh:")===0) {
                            //console.log("ADDING EXTRA PATTERN 2)");
                            for(var j=0; j<bgp.value.length; j++) {
                                //console.log(bgp.value[j]);
                                if(bgp.value[j].subject && bgp.value[j].subject.token === 'var' && bgp.value[j].subject.value === bgpTransformed.y.value) {
                                    //console.log(" YES 2)");
                                    optionalPattern = TreeUtils.clone(bgp.value[j]);
                                    optionalPattern.subject = bgpTransformed.x;
                                }
                            }
                        }
                    }
                    if(rest.length >0) {
                        //console.log("(2a)")
                        var rvalueJoin = AbstractQueryTree.translatePathExpressionsInBGP({kind: 'BGP', value: rest}, env);
                        //console.log("got rvalue");
                        if(optionalPattern != null) {
                            var optionals = before.concat([optionalPattern]).concat(rest);
                            return { kind: 'UNION',
                                value: [{ kind: 'JOIN',
                                    lvalue: bottomJoin,
                                    rvalue: rvalueJoin },
                                    {kind: 'BGP',
                                        value: optionals}] };
                        } else {
                            return { kind: 'JOIN',
                                lvalue: bottomJoin,
                                rvalue: rvalueJoin };
                        }
                    } else {
                        //console.log("(2b)")
                        return bottomJoin;
                    }
                } else {
                    // @todo ????
                    return bgpTransformed;
                }
            } else {
                before.push(bgp.value[i]);
            }
        }
        //console.log("returning");
        bgp.value = before;
        return bgp;
    };
    AbstractQueryTree.translatePathExpression  = function(pathExpression, env) {
        var expandedPath;
        // add support for different path patterns
        if(pathExpression.predicate.kind === 'element') {
            // simple paths, maybe modified
            if(pathExpression.predicate.modifier === '+') {
                pathExpression.predicate.modifier = null;
                expandedPath = AbstractQueryTree.translatePathExpression(pathExpression, env);
                return {kind: 'ONE_OR_MORE_PATH',
                    path: expandedPath,
                    x: pathExpression.subject,
                    y: pathExpression.object};
            } else if(pathExpression.predicate.modifier === '*') {
                pathExpression.predicate.modifier = null;
                expandedPath = AbstractQueryTree.translatePathExpression(pathExpression, env);
                return {kind: 'ZERO_OR_MORE_PATH',
                    path: expandedPath,
                    x: pathExpression.subject,
                    y: pathExpression.object};
            } else {
                pathExpression.predicate = pathExpression.predicate.value;
                return {kind: 'BGP', value: [pathExpression]};
            }
        } else if(pathExpression.predicate.kind === 'sequence') {
            var currentSubject = pathExpression.subject;
            var lastObject = pathExpression.object;
            var currentGraph = pathExpression.graph;
            var nextObject, chain;
            var restTriples = [];
            for(var i=0; i< pathExpression.predicate.value.length; i++) {
                if(i!=pathExpression.predicate.value.length-1) {
                    nextObject = {
                        token: "var",
                        value: "fresh:"+env.freshCounter
                    };
                    env.freshCounter++;
                } else {
                    nextObject = lastObject;
                }
                // @todo
                // what if the predicate is a path with
                // '*'? same fresh va in subject and object??
                chain = {
                    subject: currentSubject,
                    predicate: pathExpression.predicate.value[i],
                    object: nextObject
                };
                if(currentGraph != null) {
                    chain.graph = TreeUtils.clone(currentGraph);
                }
                restTriples.push(chain);
                if(i!=pathExpression.predicate.value.length-1) {
                    currentSubject = TreeUtils.clone(nextObject);
                }
            }
            var bgp = {kind: 'BGP', value: restTriples};
            //console.log("BEFORE (1):");
            //console.log(bgp);
            //console.log("--------------");
            return AbstractQueryTree.translatePathExpressionsInBGP(bgp, env);
        }
    };
    return AbstractQueryTree;
});