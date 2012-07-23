/*global define */
define(["./rdf-persistence/in_memory_b_tree"], function (BaseTree) {
    var Utils = {};
    Utils.extends = function(supertype, descendant) {
        descendant.prototype = new supertype();
    };

    Utils.stackCounterLimit = 1000;
    Utils.stackCounter = 0;

    Utils.recur = function(c){
        if (Utils.stackCounter === Utils.stackCounterLimit) {
            Utils.stackCounter = 0;
            setTimeout(c, 0);
        } else {
            Utils.stackCounter++;
            c();
        }
    };

    Utils.clone = function(o) {
        return JSON.parse(JSON.stringify(o));
    };

    Utils.shuffle = function(o){ //v1.0
        for(var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x){}
        return o;
    };

    Utils.include = function(a,v) {
        var cmp = arguments[2];

        for(var i=(a.length-1); i>=0; i--) {
            var res = false;
            if (cmp == null) {
                res = (a[i] === v);
            } else {
                res = (cmp(a[i],v) === 0);
            }

            if (res === true) {
                return true;
            }
        }

        return false;
    };

    Utils.remove = function(a,v) {
        var acum = [];
        for(var i=0; i<a.length; i++) {
            if (a[i] !== v) {
                acum.push(a[i]);
            }
        }

        return acum;
    };

    Utils.repeat = function(c,max,floop,fend,env) {
        if (arguments.length===4) { env = {}; }
        if (c<max) {
            env._i = c;
            floop(function(floop,env){
                // avoid stack overflow
                // deadly hack
                Utils.recur(function(){ Utils.repeat(c+1, max, floop, fend, env); });
            },env);
        } else {
            fend(env);
        }
    };


    Utils.meanwhile = function(c,floop,fend,env) {
        if (arguments.length===3) { env = {}; }

        if (env['_stack_counter'] == null) {
            env['_stack_counter'] = 0;
        }

        if (c===true) {
            floop(function(c,floop,env){
                if (env['_stack_counter'] % 40 == 39) {
                    env['_stack_counter'] = env['_stack_counter'] + 1;
                    setTimeout(function(){ Utils.neanwhile(c, floop, fend, env); }, 0);
                } else {
                    env['_stack_counter'] = env['_stack_counter'] + 1;
                    Utils.meanwhile(c, floop, fend, env);
                }
            },env);
        } else {
            fend(env);
        }
    };

    Utils.seq = function() {
        var fs = arguments;
        return function(callback) {
            Utils.repeat(0, fs.length, function(k,env){
                var floop = arguments.callee;
                fs[env._i](function(){
                    k(floop, env);
                });
            }, function(){
                callback();
            });
        };
    };
    Utils.partition = function(c, n) {
        var rem = c.length % n;
        var currentGroup = [];
        var i;
        for(i=0; i<rem; i++) {
            currentGroup.push(null);
        }
        var groups = [];
        for(i=0; i<c.length; i++) {
            currentGroup.push(c[i]);
            if (currentGroup.length % n == 0) {
                groups.push(currentGroup);
                currentGroup = [];
            }
        }
        return groups;
    };
    Utils.keys = function(obj) {
        var variables = [];
        var variable;
        for(variable in obj) {
            if (obj.hasOwnProperty(variable)) {
                variables.push(variable);
            }
        }
        return variables;
    };
    Utils.iso8601 = function(date) {
        function pad(n){
            return n<10 ? '0'+n : n;
        }
        return date.getUTCFullYear()+'-'
            + pad(date.getUTCMonth()+1)+'-'
            + pad(date.getUTCDate())+'T'
            + pad(date.getUTCHours())+':'
            + pad(date.getUTCMinutes())+':'
            + pad(date.getUTCSeconds())+'Z';
    };
    /**
     * NodeKey
     *
     * Implements the interface of BinarySearchTree.Node
     *
     * A Tree node augmented with BPlusTree
     * node structures
     *
     * @param components
     * @param [order]
     * @constructor
     */
    Utils.NodeKey = function(components, order) {
        this.subject = components.subject;
        this.predicate = components.predicate;
        this.object = components.object;
        this.graph = components.graph;
        this.order = order;
    };
    Utils.NodeKey.prototype.comparator = function(keyPattern) {
        for(var i=0; i<this.order.length; i++) {
            var component = this.order[i];
            if(keyPattern[component] == null) {
                return 0;
            } else {
                if(this[component] < keyPattern[component] ) {
                    return -1
                } else if(this[component] > keyPattern[component]) {
                    return 1
                }
            }
        }

        return 0;
    };
    /**
     * Pattern
     *
     * A pattern with some variable components
     */
    Utils.Pattern = function (components) {
        this.subject = components.subject;
        this.predicate = components.predicate;
        this.object = components.object;
        this.graph = components.graph;
        this.indexKey = [];

        this.keyComponents = {};

        var order = [];
        var indif = [];
        components = ['subject', 'predicate', 'object', 'graph'];

        // components must have been already normalized and
        // inserted in the lexicon.
        // OIDs retrieved from the lexicon *are* numbers so
        // they can be told apart from variables (strings)
        for (var i = 0; i < components.length; i++) {
            if (typeof(this[components[i]]) === 'string') {
                indif.push(components[i]);
                this.keyComponents[components[i]] = null;
            } else {
                order.push(components[i]);
                this.keyComponents[components[i]] = this[components[i]];
                this.indexKey.push(components[i]);
            }
        }

        this.order = order.concat(indif);
        this.key = new Utils.NodeKey(this.keyComponents, this.order);
    };
    Utils.Tree = function(params,callback) {
        if(arguments != 0) {
            this.componentOrder = params.componentOrder;


            // @todo change this if using the file backed implementation
            BaseTree.Tree.call(this, params.order, params['name'], params['persistent'], params['cacheMaxSize']);

            this.comparator = function (a, b) {
                for (var i = 0; i < this.componentOrder.length; i++) {
                    var component = this.componentOrder[i];
                    var vala = a[component];
                    var valb = b[component];
                    if (vala < valb) {
                        return -1;
                    } else if (vala > valb) {
                        return 1;
                    }
                }
                return 0;
            };

            this.rangeComparator = function (a, b) {
                for (var i = 0; i < this.componentOrder.length; i++) {
                    var component = this.componentOrder[i];
                    if (b[component] == null || a[component] == null) {
                        return 0;
                    } else {
                        if (a[component] < b[component]) {
                            return -1
                        } else if (a[component] > b[component]) {
                            return 1
                        }
                    }
                }

                return 0;
            };

            if(callback!=null) {
                callback(this);
            }
        }
    };
    Utils.extends(BaseTree.Tree, Utils.Tree);
    Utils.Tree.prototype.insert = function(quad, callback) {
        BaseTree.Tree.prototype.insert.call(this, quad, null);
        if(callback)
            callback(true);

        return true
    };
    Utils.Tree.prototype.search = function(quad, callback) {
        var result = BaseTree.Tree.prototype.search.call(this, quad, true); // true -> check exists : not present in all the b-tree implementations, check first.
        if(callback)
            callback(result);

        return result;
    };
    Utils.Tree.prototype.range = function (pattern, callback) {
        var result = null;
        if (typeof(this.root) === 'string') {
            result = this._rangeTraverse(this, this._diskRead(this.root), pattern);
        } else {
            result = this._rangeTraverse(this, this.root, pattern);
        }

        if (callback)
            callback(result);

        return result;
    };
    Utils.Tree.prototype._rangeTraverse = function(tree,node, pattern) {
        var patternKey  = pattern.key;
        var acum = [];
        var pendingNodes = [node];
        var node, idxMin, idxMax;
        while(pendingNodes.length > 0) {
            node = pendingNodes.shift();
            idxMin = 0;

            while(idxMin < node.numberActives && tree.rangeComparator(node.keys[idxMin].key,patternKey) === -1) {
                idxMin++;
            }
            if(node.isLeaf === true) {
                idxMax = idxMin;

                while(idxMax < node.numberActives && tree.rangeComparator(node.keys[idxMax].key,patternKey) === 0) {
                    acum.push(node.keys[idxMax].key);
                    idxMax++;
                }

            } else {
                var pointer = node.children[idxMin];
                var childNode = tree._diskRead(pointer);
                pendingNodes.push(childNode);

                var idxMax = idxMin;
                while(true) {
                    if(idxMax < node.numberActives && tree.rangeComparator(node.keys[idxMax].key,patternKey) === 0) {
                        acum.push(node.keys[idxMax].key);
                        idxMax++;
                        childNode = tree._diskRead(node.children[idxMax]);
                        pendingNodes.push(childNode);
                    } else {
                        break;
                    }
                }
            }
        }
        return acum;
    };
    Utils.parseStrictISO8601 = function (str) {
        var regexp = "([0-9]{4})(-([0-9]{2})(-([0-9]{2})" +
            "(T([0-9]{2}):([0-9]{2})(:([0-9]{2})(\.([0-9]+))?)?" +
            "(Z|(([-+])([0-9]{2}):([0-9]{2})))?)?)?)?";
        var d = str.match(new RegExp(regexp));

        var offset = 0;
        var date = new Date(d[1], 0, 1);

        if (d[3]) {
            date.setMonth(d[3] - 1);
        } else {
            throw "missing ISO8061 component"
        }
        if (d[5]) {
            date.setDate(d[5]);
        } else {
            throw "missing ISO8061 component"
        }
        if (d[7]) {
            date.setHours(d[7]);
        } else {
            throw "missing ISO8061 component"
        }
        if (d[8]) {
            date.setMinutes(d[8]);
        } else {
            throw "missing ISO8061 component"
        }
        if (d[10]) {
            date.setSeconds(d[10]);
        } else {
            throw "missing ISO8061 component"
        }
        if (d[12]) {
            date.setMilliseconds(Number("0." + d[12]) * 1000);
        }
        if (d[14]) {
            offset = (Number(d[16]) * 60) + Number(d[17]);
            offset *= ((d[15] == '-') ? 1 : -1);
        }

        offset -= date.getTimezoneOffset();
        var time = (Number(date) + (offset * 60 * 1000));
        var toReturn = new Date();
        toReturn.setTime(Number(time));
        return toReturn;
    };


    Utils.parseISO8601 = function (str) {
        var regexp = "([0-9]{4})(-([0-9]{2})(-([0-9]{2})" +
            "(T([0-9]{2}):([0-9]{2})(:([0-9]{2})(\.([0-9]+))?)?" +
            "(Z|(([-+])([0-9]{2}):([0-9]{2})))?)?)?)?";
        var d = str.match(new RegExp(regexp));

        var offset = 0;
        var date = new Date(d[1], 0, 1);

        if (d[3]) { date.setMonth(d[3] - 1); }
        if (d[5]) { date.setDate(d[5]);  }
        if (d[7]) { date.setHours(d[7]);  }
        if (d[8]) { date.setMinutes(d[8]);  }
        if (d[10]) { date.setSeconds(d[10]);  }
        if (d[12]) { date.setMilliseconds(Number("0." + d[12]) * 1000); }
        if (d[14]) {
            offset = (Number(d[16]) * 60) + Number(d[17]);
            offset *= ((d[15] == '-') ? 1 : -1);
        }

        offset -= date.getTimezoneOffset();
        var time = (Number(date) + (offset * 60 * 1000));
        var toReturn = new Date();
        toReturn.setTime(Number(time));
        return toReturn;
    };

    Utils.parseISO8601Components = function (str) {
        var regexp = "([0-9]{4})(-([0-9]{2}))(-([0-9]{2}))(T([0-9]{2}):([0-9]{2})(:([0-9]{2}))?(\.([0-9]+))?)?(Z|([-+])([0-9]{2})(:([0-9]{2}))?)?";
        var d = str.match(new RegExp(regexp));
        var year, month, date, hours, minutes, seconds, millisecs, timezone;
        year = Number(d[1]);
        month = d[3] - 1;
        date  = Number(d[5]);
        hours = Number(d[7]);
        minutes = Number(d[8]);
        seconds = Number(d[10]);

        if (d[12]) { millisecs = Number("0." + d[12]) * 1000; }

        if (d[13]==="Z") {
            timezone = 0;
        } else if (d[14]) {
            timezone = 0;
            if (d[17]) {
                timezone = Number(d[17]);
            }
            timezone = timezone+(Number(d[15]) * 60);
            timezone *= ((d[14] == '-') ? -1 : +1);
        } else if (d[14]==null && d[11]) {
            timezone = Number(d[12])*60;
        }

        return {'year': isNaN(year) ? null : year,
            'month': isNaN(month) ? null : month,
            'date': isNaN(date) ? null : date,
            'hours': isNaN(hours) ? null : hours,
            'minutes': isNaN(minutes) ? null : minutes,
            'seconds': isNaN(seconds) ? null : seconds,
            'millisecs':isNaN(millisecs) ? null : millisecs,
            'timezone': isNaN(timezone) ? null : timezone};
    };

    Utils.compareDateComponents = function(stra,strb) {
        var a = Utils.parseISO8601Components(stra);
        var b = Utils.parseISO8601Components(strb);
        var offset;
        if ((a.timezone == null && b.timezone == null) ||
            (a.timezone != null && b.timezone != null)) {
            var da = Utils.parseISO8601(stra);
            var db = Utils.parseISO8601(strb);

            if (da.getTime() == db.getTime()) {
                return 0;
            } else if (da.getTime() < db.getTime()){
                return -1;
            } else {
                return 1;
            }
        } else if (a.timezone != null && b.timezone == null){
            da = Utils.parseISO8601(stra);
            db = Utils.parseISO8601(strb);
            var ta = da.getTime();
            var tb = db.getTime();
            offset = 14*60*60;
            if (ta < tb && ta < (tb + offset)) {
                return -1;
            } else if (ta > tb && ta > (tb - offset)) {
                return 1;
            } else {
                return null;
            }
        } else {
            da = Utils.parseISO8601(stra);
            db = Utils.parseISO8601(strb);
            ta = da.getTime();
            tb = db.getTime();
            offset = 14*60*60;
            if (ta < tb && (ta + offset)  < tb) {
                return -1;
            } else if (ta > tb && (ta + offset) > tb) {
                return 1;
            } else {
                return null;
            }
        }
    };
    // RDF utils
    Utils.lexicalFormLiteral = function(term, env) {
        var value = term.value;
        var lang = term.lang;
        var type = term.type;

        var indexedValue = null;
        if (value != null && type != null && typeof(type) != 'string') {
            var typeValue = type.value;

            if (typeValue == null) {
                var typePrefix = type.prefix;
                var typeSuffix = type.suffix;

                var resolvedPrefix = env.namespaces[typePrefix];
                term.type = resolvedPrefix+typeSuffix;
                typeValue = resolvedPrefix+typeSuffix;
            }
            // normalization
            if (typeValue.indexOf('hexBinary') != -1) {
                indexedValue = '"' + term.value.toLowerCase() + '"^^<' + typeValue + '>';
            } else {
                indexedValue = '"' + term.value + '"^^<' + typeValue + '>';
            }
        } else {
            if (lang == null && type == null) {
                indexedValue = '"' + value + '"';
            } else if (type == null) {
                indexedValue = '"' + value + '"' + "@" + lang;
            } else {
                // normalization
                if (type.indexOf('hexBinary') != -1) {
                    indexedValue = '"' + term.value.toLowerCase() + '"^^<'+type+'>';
                } else {
                    indexedValue = '"' + term.value + '"^^<'+type+'>';
                }
            }
        }
        return indexedValue;
    };

    Utils.lexicalFormBaseUri = function(term, env) {
        var uri = null;
        //console.log("*** normalizing URI token:");
        //console.log(term);
        if (term.value == null) {
            //console.log(" - URI has prefix and suffix");
            //console.log(" - prefix:"+term.prefix);
            //console.log(" - suffixx:"+term.suffix);
            var prefix = term.prefix;
            var suffix = term.suffix;
            var resolvedPrefix = env.namespaces[prefix];
            if (resolvedPrefix != null) {
                uri = resolvedPrefix+suffix;
            } else {
                uri = prefix+":"+suffix;
            }
        } else {
            //console.log(" - URI is not prefixed");
            uri = term.value;
        }

        if (uri===null) {
            return null;
        } else {
            //console.log(" - resolved URI is "+uri);
            if (uri.indexOf(":") == -1) {
                //console.log(" - URI is partial");
                uri = (env.base||"") + uri; // applyBaseUri
            } else {
                //console.log(" - URI is complete");
            }
            //console.log(" -> FINAL URI: "+uri);
        }

        return uri;
    };


    Utils.lexicalFormTerm = function(term, ns) {
        if (term.token === 'uri') {
            return {'uri': Utils.lexicalFormBaseUri(term, ns)};
        } else if (term.token === 'literal') {
            return {'literal': Utils.lexicalFormLiteral(term, ns)};
        } else if (term.token === 'blank') {
            var label = '_:'+term.value;
            return {'blank': label};
        } else {
            throw "Error, cannot get lexical form of unknown token: "+term.token;
        }
    };
    Utils.normalizeUnicodeLiterals = function (string) {
        var escapedUnicode = string.match(/\\u[0-9abcdefABCDEF]{4,4}/g) || [];
        var dups = {};
        for (var i = 0; i < escapedUnicode.length; i++) {
            if (dups[escapedUnicode[i]] == null) {
                dups[escapedUnicode[i]] = true;
                string = string.replace(new RegExp("\\" + escapedUnicode[i], "g"), eval("'" + escapedUnicode[i] + "'"));
            }
        }

        return string;
    };
    Utils.hashTerm = function(term) {
        try {
            if (term == null) {
                return "";
            }
            if (term.token==='uri') {
                return "u"+term.value;
            } else if (term.token === 'blank') {
                return "b"+term.value;
            } else if (term.token === 'literal') {
                var l = "l"+term.value;
                l = l + (term.type || "");
                l = l + (term.lang || "");

                return l;
            }
        } catch(e) {
            if (typeof(term) === 'object') {
                var key = "";
                Utils.each(term, function (t, p) {
                    key = key + p + t;
                });
                return key;
            }
            return term;
        }
    };
    return Utils;
});
