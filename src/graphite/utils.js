define([], function () {
    var breaker          = {},
        ArrayProto       = Array.prototype,
        ObjProto         = Object.prototype,
        FuncProto        = Function.prototype,
        nativeForEach    = ArrayProto.forEach,
        nativeBind       = FuncProto.bind,
        nativeFilter     = ArrayProto.filter,
        nativeIndexOf    = ArrayProto.indexOf,
        nativeMap        = ArrayProto.map,
        nativeReduce     = ArrayProto.reduce,
        nativeSome       = ArrayProto.some,
        slice            = ArrayProto.slice,
        toString         = ObjProto.toString,
        hasOwnProperty   = ObjProto.hasOwnProperty,
        nativeTrim       = String.prototype.trim,
        Utils = {};
    if (!Object.create) {
        var F;
        Object.prototype.create = function (obj) {
            F = function () {};
            F.prototype = obj;
            return new F;
        }
    }
    if (!String.format) {
        /**
         *
         * @param {String} str The string to be formatted
         * @return {String} The formatted string
         */
        String.prototype.format = function() {
            var args = Utils.toArray(arguments),
                last = Utils.last(args),
                fn = function (str) { return str; }
            if (Utils.isFunction(last)) {
                fn = last;
                args.pop();
            }
            return this.replace(/{(\d+)}/g, function(match, number) {
                return typeof args[number] != 'undefined'
                    ? fn(args[number])
                    : fn(match);
            });
        };
    }
    var defaultToWhiteSpace = function (characters){
        if (characters != null) {
            return '[' + _s.escapeRegExp(''+characters) + ']';
        }
        return '\\s';
    };
    /**
     * Determine if at least one element in the object matches a truth test.
     * Delegates to ECMAScript 5's native some if available. Aliased as any.
     * @param obj
     * @param iterator
     * @param context
     */
    Utils.any = function (obj, iterator, context) {
        iterator || (iterator = Utils.identity);
        var result = false;
        if (obj == null) return result;
        if (nativeSome && obj.some === nativeSome) return obj.some(iterator, context);
        Utils.each(obj, function (value, index, list) {
            if (result || (result = iterator.call(context, value, index, list))) return breaker;
        });
        return !!result;
    };
    /**
     * Taken from underscore.js
     *
     * Create a function bound to a given object (assigning this, and
     * arguments, optionally). Binding with arguments is also known as
     * curry. Delegates to ECMAScript 5's native Function.bind if
     * available. We check for func.bind first, to fail fast when func is
     * undefined.
     * @param func
     * @param context
     */
    Utils.bind = function bind(func, context) {
        var bound, args;
        if (func.bind === nativeBind && nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
        if (!Utils.isFunction(func)) throw new TypeError;
        args = slice.call(arguments, 2);
        return bound = function () {
            var ctor = {};
            if (!(this instanceof bound)) {
                return func.apply(context, args.concat(slice.call(arguments)));
            }
            ctor.prototype = func.prototype;
            var self = new ctor;
            var result = func.apply(self, args.concat(slice.call(arguments)));
            if (Object(result) === result) {
                return result;
            }
            return self;
        };
    };
    /**
     * Create a (shallow-cloned) duplicate of an object.
     * Taken from underscore.js
     */
    Utils.clone = function (obj) {
        if (!Utils.isObject(obj)) {
            return obj;
        }
        if (Utils.isArray(obj)) {
            return obj.slice();
        }
        var objB = {};
        Utils.each(obj, function (value, key) {
            objB[key] = Utils.clone(value);
        });
        return objB;
    };
    /**
     * Create an instance of a given object
     *
     * @param {Object} obj The object to be instanciated
     * @returns {Object} The instanciated object
     */
    Utils.create = function (obj) {
        function getArgs(arr) {
            var args = Utils.toArray(arr);
            args.shift();
            return args;
        }
        function reset(prop) {
            if (Utils.isArray(prop)) return [];
            if (Utils.isFunction(prop)) return prop;
            if (Utils.isNumber(prop)) return 0;
            return undefined;
        }

        if (Utils.isFunction(obj)) {
            obj = obj.apply({}, getArgs(arguments));
        } else {
            obj = Object.create(obj);
            if (obj.init && typeof obj.init === "function") {
                return obj.init.apply(obj, getArgs(arguments)) || obj;
            }
            for(var prop in obj) {
                obj[prop] = reset(obj[prop]);
            }
        }
        return obj;
    };
    /**
     * Taken from underscore
     *
     * Take the difference between one array and a number of other arrays.
     * Only the elements present in just the first array will remain.
     * @param array
     */
    Utils.difference = function (array) {
        var rest = Utils.flatten(slice.call(arguments, 1), true);
        return Utils.filter(array, function (value){ return !Utils.include(rest, value); });
    };
    /**
     * Handles objects with the built-in forEach, arrays, and raw objects. Delegates to ECMAScript 5's native forEach if available.
     * Taken from underscore.js
     */
    Utils.each = function (obj, iterator, context) {
        if (obj == null) return;
        if (nativeForEach && obj.forEach === nativeForEach) {
            obj.forEach(iterator, context);
        } else if (obj.length === +obj.length) {
            for (var i = 0, l = obj.length; i < l; i++) {
                if (i in obj && iterator.call(context, obj[i], i, obj) === breaker) return;
            }
        } else {
            for (var key in obj) {
                if (Utils.has(obj, key)) {
                    if (iterator.call(context, obj[key], key, obj) === breaker) return;
                }
            }
        }
    };
    /**
     * Extend a given object with all the properties in passed-in object(s).
     * Taken from underscore.js
     */
    Utils.extend = function (obj) {
        Utils.each(slice.call(arguments, 1), function (source) {
            for (var prop in source) {
                obj[prop] = source[prop];
            }
        });
        return obj;
    };
    /**
     * Extract the value from a key from a map and delete its presence in the map
     *
     * @param {Object} map The map to extract from
     * @param {string} key The key to extract
     * @returns {Varies} The value the key pointed to
     */
    Utils.extract = function (map, key) {
        if (map.hasOwnProperty(key)) {
            var tmp = map[key];
            delete map[key];
            return tmp;
        }
    };
    /**
     * Fetched from http://bit.ly/dnsqTn
     *
     * I take the given function [as a string] and extract
     * the arguments as a named-argument map. This will
     * return the map as an array of ordered names.
     */
    Utils.extractArgumentMap = function (functionCode){
        var argumentStringMatch = functionCode.toString().match(new RegExp("\\([^)]*\\)", "")),
            argumentMap = argumentStringMatch[0].match(new RegExp("[^\\s,()]+", "g"));
        return argumentMap || [];
    };
    /**
     * Taken from underscore.js
     *
     * Return all the elements that pass a truth test. Delegates to ECMAScript
     * 5's native filter if available. Aliased as select.
     */
    Utils.filter = function (obj, iterator, context) {
        var results = [];
        if (obj == null) return results;
        if (nativeFilter && obj.filter === nativeFilter) return obj.filter(iterator, context);
        Utils.each(obj, function (value, index, list) {
            if (iterator.call(context, value, index, list)) results[results.length] = value;
        });
        return results;
    };
    /**
     * Taken from underscore.js
     *
     * Return a completely flattened version of an array.
     * @param array
     * @param [shallow]
     */
    Utils.flatten = function (array, shallow) {
        return Utils.reduce(array, function (memo, value) {
            if (Utils.isArray(value)) return memo.concat(shallow ? value : Utils.flatten(value));
            memo[memo.length] = value;
            return memo;
        }, []);
    };
    /**
     * Has own property?
     * Taken from underscore.js
     */
    Utils.has = function (obj, key) {
        return hasOwnProperty.call(obj, key);
    };
    /**
     * Keep the identity function around for default iterators.
     * Taken from underscore.js
     */
    Utils.identity = function (value) {
        return value;
    };
    /**
     * Taken from underscore
     *
     * Determine if a given value is included in the array or object using ===.
     * Aliased as contains.
     */
    Utils.include = function (obj, target) {
        var found = false;
        if (obj == null) return found;
        if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
        found = Utils.any(obj, function (value) {
            return value === target;
        });
        return found;
    };
    /**
     * Return the position of the first occurrence of an item in an array, or -1 if the item is not included in the array.
     * Delegates to ECMAScript 5's native indexOf if available.
     * If the array is large and already in sort order, pass true for isSorted to use binary search.
     * Taken from underscore.js
     */
    Utils.indexOf = function (array, item, isSorted) {
        if (array == null) return -1;
        var i, l;
        if (isSorted) {
            i = Utils.sortedIndex(array, item);
            return array[i] === item ? i : -1;
        }
        if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item);
        for (i = 0, l = array.length; i < l; i++) {
            if (array[i] && array[i] === item) {
                return i;
            }
        }
        return -1;
    };
    /**
     * Is a given variable an arguments object?
     * Taken from underscore.js
     *
     * @param {Object} obj The object to check for arguments
     * @returns {Boolean} True if the object is an arguments object
     */
    Utils.isArguments = function (obj) {
        return toString.call(obj) == '[object Arguments]';
    };
    if (!Utils.isArguments(arguments)) {
        Utils.isArguments = function (obj) {
            return !!(obj && Utils.has(obj, 'callee'));
        };
    }
    /**
     * Determine if an object is an `Array`.
     *
     * @param {Object} object An object that may or may not be an array
     * @returns {Boolean} True if the parameter is an array
     */
    Utils.isArray = Array.isArray || function (object) {
        return !!(object && object.concat
            && object.unshift && !object.callee);
    };
    /**
     * Is a given value a boolean?
     * Taken from underscore.js
     *
     * @param {Varies} obj The object to test
     * @returns {Boolean} True if the object is a boolean
     */
    Utils.isBoolean = function (obj) {
        return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
    };
    /**
     * Determines if the object is a double/float
     *
     * @param {Varies} obj A value to test
     * @returns {Boolean} True if the value is a double/float
     */
    Utils.isDouble = function (obj) {
        return !Utils.isNaN(parseFloat(obj));
    };
    /**
     * Determines if an object is a `Function`.
     *
     * @param {Object} object A value to test
     * @returns {Boolean} True if the object is a Function
     */
    Utils.isFunction = function (object) {
        return typeof object === "function";
    };
    /**
     * Determines if an object is an integer.
     *
     * @param {Object} obj A value to test
     * @returns {Boolean} True if the object is an integer
     */
    Utils.isInteger = function (obj) {
        return (parseFloat(obj) == parseInt(obj)) && !Utils.isNaN(obj);
    };
    /**
     * Is the given value NaN?
     * NaN is the only value for which === is not reflexive.
     * Taken from underscore.js
     *
     * @param {Varies} obj The object to test
     * @returns {Boolean} True if the object is a decimal
     */
    Utils.isNaN = function (obj) {
        return obj !== obj;
    };
    /**
     * Determines if an object is a `Number`.
     *
     * @param {Object} object A value to test
     * @returns {Boolean} True if the object is a Number
     */
    Utils.isNumber = function (object) {
        return (object === +object) || (toString.call(object) === '[object Number]');
    };
    /**
     * Is a given variable an object?
     * Taken from underscore.js
     */
    Utils.isObject = function (obj) {
        return obj === Object(obj);
    };
    /**
     * Determines if an object is a `String`.
     *
     * @param {Object} object A value to test
     * @return {Boolean} True if the object is a String
     */
    Utils.isString = function (object) {
        return typeof object === "string";
    };
    /**
     * Determines if an object is a `Uri`.
     *
     * @param {Object} object A value to test
     * @return {Boolean} True is the object is a Uri
     */
    Utils.isUri = function (object) {
        return Utils.isString(object) && Utils.isArray(object.match(/^http:/));
    };
    /**
     * Return the results of applying the iterator to each element. Delegates to ECMAScript 5's native map if available.
     * Taken from underscore.js
     */
    Utils.map = function (obj, iterator, context) {
        var results = [];
        if (obj == null) {
            return results;
        }
        if (nativeMap && obj.map === nativeMap) {
            return obj.map(iterator, context);
        }
        Utils.each(obj, function (value, index, list) {
            results[results.length] = iterator.call(context, value, index, list);
        });
        if (obj.length === +obj.length) results.length = obj.length;
        return results;
    };
    Utils.mapArgs = function (resultMap, argumentsMap) {
        //console.log("IN UTILS, MAP ARGS", resultMap, argumentsMap);
        return Utils.map(resultMap, function (arg) {
            if (argumentsMap.hasOwnProperty(arg)) {
                return argumentsMap[arg];
            }
            throw new Error ("Argument not in projection " + arg);
        });
    };
    Utils.mapFunctionArgs = function (functionCode, argumentsMap) {
        var functionMap = Utils.extractArgumentMap(functionCode);
        return Utils.mapArgs(functionMap, argumentsMap);
    };
    /**
     * Parse a URI according to http://tools.ietf.org/html/rfc3986
     * parseUri 1.2.2
     * (c) Steven Levithan <stevenlevithan.com>
     *
     * @param {String} str The string to parse
     * @returns {Object} The parsed string, as an object (null if an invalid uri is passed)
     */
    Utils.parseUri = function (str) {
        var	o = {
            strictMode: false,
            key: ["source","protocol","authority","userInfo","user","password","host","port","relative","path","directory","file","query","anchor"],
            q:   {
                name:   "queryKey",
                parser: /(?:^|&)([^&=]*)=?([^&]*)/g
            },
            parser: {
                strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
                loose:  /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
            }
            },
            m = o.parser[o.strictMode ? "strict" : "loose"].exec(str),
            uri = {},
            i   = 14;
        while (i--) uri[o.key[i]] = m[i] || "";
        uri[o.q.name] = {};
        uri[o.key[12]].replace(o.q.parser, function ($0, $1, $2) {
            if ($1) uri[o.q.name][$1] = $2;
        });
        return uri;
    };
    /**
     * Taken from underscore.js
     *
     * Get the last element of an array. Passing n will return the last N
     * values in the array. The guard check allows it to work with Utils.map.
     *
     * @param array
     * @param [n]
     * @param [guard]
     * @return {*}
     */
    Utils.last = function(array, n, guard) {
        if ((n != null) && !guard) {
            return slice.call(array, Math.max(array.length - n, 0));
        } else {
            return array[array.length - 1];
        }
    };
    /**
     * Taken from underscore.js
     *
     * Reduce builds up a single result from a list of values, aka inject, or
     * foldl. Delegates to ECMAScript 5's native reduce if available.
     * @param obj
     * @param iterator
     * @param memo
     * @param context
     */
    Utils.reduce = function (obj, iterator, memo, context) {
        var initial = arguments.length > 2;
        if (obj == null) obj = [];
        if (nativeReduce && obj.reduce === nativeReduce) {
            if (context) iterator = Utils.bind(iterator, context);
            return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
        }
        Utils.each(obj, function (value, index, list) {
            if (!initial) {
                memo = value;
                initial = true;
            } else {
                memo = iterator.call(context, memo, value, index, list);
            }
        });
        if (!initial) throw new TypeError('Reduce of empty array with no initial value');
        return memo;
    };
    /**
     * Return the number of elements in an object.
     * Taken from underscore.js
     *
     * @param {Object} obj The object to determine the size of
     * @returns {Number} The size of the object
     */
    Utils.size = function (obj) {
        return Utils.toArray(obj).length;
    };

    /**
     * Use a comparator function to figure out at what index an object should be inserted so as to maintain order. Uses binary search.
     * Taken from underscore.js
     */
    Utils.sortedIndex = function (array, obj, iterator) {
        iterator || (iterator = Utils.identity);
        var low = 0, high = array.length;
        while (low < high) {
            var mid = (low + high) >> 1;
            iterator(array[mid]) < iterator(obj) ? low = mid + 1 : high = mid;
        }
        return low;
    };

    /**
     * Safely convert anything iterable into a real, live array.
     * Taken from underscore.js
     *
     * @param {Varies} iterable The object to convert to an array
     * @returns {Array} The converted object
     */
    Utils.toArray = function (iterable) {
        if (!iterable)                       return [];
        if (iterable.toArray)                return iterable.toArray();
        if (Utils.isArray(iterable))      return slice.call(iterable);
        if (Utils.isArguments(iterable))  return slice.call(iterable);
        return Utils.values(iterable);
    };

    Utils.trim = function (str, characters){
        str = ''+str;
        if (!characters && nativeTrim) {
            return nativeTrim.call(str);
        }
        characters = defaultToWhiteSpace(characters);
        return str.replace(new RegExp('\^' + characters + '+|' + characters + '+$', 'g'), '');
    };
    /**
     * Taken from underscore.js
     *
     * Produce a duplicate-free version of the array. If the array has already been sorted, you
     * have the option of using a faster algorithm. Aliased as unique.
     *
     * The isSorted flag is irrelevant if the array only contains two elements.
     *
     * @param array
     * @param isSorted
     * @param iterator
     * @return {Array}
     */
    Utils.unique = function(array, isSorted, iterator) {
        var initial = iterator ? Utils.map(array, iterator) : array;
        var results = [];
        if (array.length < 3) isSorted = true;
        Utils.reduce(initial, function (memo, value, index) {
            if (isSorted ? Utils.last(memo) !== value || !memo.length : !Utils.include(memo, value)) {
                memo.push(value);
                results.push(array[index]);
            }
            return memo;
        }, []);
        return results;
    };
    /**
     * Retrieve the values of an object's properties.
     * Taken from underscore.js
     *
     * @param {Object} obj The object to retrieve values from
     * @returns {Object} The retrieved values
     */
    Utils.values = function (obj) {
        return Utils.map(obj, Utils.identity);
    };
    /**
     * Taken from underscore
     *
     * Return a version of the array that does not contain the specified
     * value(s).
     * @param array
     */
    Utils.without = function (array) {
        return Utils.difference(array, slice.call(arguments, 1));
    }
    return Utils;
});