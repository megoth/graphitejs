/*!
 * Graphite Core
 * Copyright (C) 2012 Arne Hassel
 * MIT Licensed
 */

/**
 * The core Graphite module.
 * Based on the graphite-library, http://graphitejs.com/, designed by Alex Young
 */
(function(global) {
	var middleware = [], graphite, modules = {};

	/**
	 * The graphite object.
	 *
	 * @returns {Object} The graphite object, run through `init`
	 */
	graphite = function() {
	  var result, i;
	  for (i = 0; i < middleware.length; i++) {
	    result = middleware[i].apply(graphite, arguments);
	    if (result) {
	      return result;
	    }
	  }
	}

	graphite.VERSION = '0.0.0';

	// This can be overriden by libraries that extend graphite(...)
	graphite.init = function(fn) {
	  middleware.unshift(fn);
	};

	/**
	 * This alias will be used as an alternative to `graphite()`.
	 * If `__graphite_alias` is present in the global scope this will be used instead. 
	 * 
	 */
	if (typeof window !== 'undefined') {
	  graphite.alias = window.__graphite_alias || '$g';
	  window[graphite.alias] = graphite;
	}
	
	var breaker = {};
	var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;
	var 
		nativeForEach = ArrayProto.forEach,
		nativeIndexOf = ArrayProto.indexOf,
		nativeMap     = ArrayProto.map;
	var slice            = ArrayProto.slice,
      unshift          = ArrayProto.unshift,
      toString         = ObjProto.toString,
      hasOwnProperty   = ObjProto.hasOwnProperty;
	

	var testCache = {},
	    detectionTests = {};
	
	if(!Object.create) {
		function F() {}
		Object.create = function(obj) {
			F.prototype = obj;
			return new F();
		}
	}

	/**
	 * Used to add feature-detection methods.
	 *
	 * @param {String} name The name of the test
	 * @param {Function} fn The function that performs the test
	 */
	graphite.addDetectionTest = function(name, fn) {
	  if (!detectionTests[name]) {
	    detectionTests[name] = fn;
	  }
	};

	/**
	 * Binds a function to an object.
	 *
	 * @param {Function} fn A function
	 * @param {Object} object An object to bind to
	 * @returns {Function} A rebound method
	 */
	graphite.bind = function(fn, object) {
	  var slice = Array.prototype.slice,
	      args  = slice.apply(arguments, [2]);
	  return function() {
	    return fn.apply(object || {}, args.concat(slice.apply(arguments)));
	  };
	};
	
	/**
	 * Create a (shallow-cloned) duplicate of an object.
	 * Taken from underscore.js
	 */
	graphite.clone = function(obj) {
		if (!graphite.isObject(obj)) return obj;
		return graphite.isArray(obj) ? obj.slice() : graphite.extend({}, obj);
	};

	/**
	 * Run a feature detection name.
	 *
	 * @param {String} name The name of the test
	 * @returns {Boolean} The outcome of the test
	 */
	graphite.detect = function(testName) {
	  if (typeof testCache[testCache] === 'undefined') {
	    testCache[testName] = detectionTests[testName]();
	  }
	  return testCache[testName];
	};
	
	/**
	 * Handles objects with the built-in forEach, arrays, and raw objects. Delegates to ECMAScript 5's native forEach if available.
	 * Taken from underscore.js
	 */
	graphite.each = function(obj, iterator, context) {
		if (obj == null) return;
		if (nativeForEach && obj.forEach === nativeForEach) {
			obj.forEach(iterator, context);
		} else if (obj.length === +obj.length) {
			for (var i = 0, l = obj.length; i < l; i++) {
				if (i in obj && iterator.call(context, obj[i], i, obj) === breaker) return;
			}
		} else {
			for (var key in obj) {
				if (graphite.has(obj, key)) {
					if (iterator.call(context, obj[key], key, obj) === breaker) return;
				}
			}
		}
	};
	
	/**
	 * Extend a given object with all the properties in passed-in object(s).
	 * Taken from underscore.js
	 */
	graphite.extend = function(obj) {
		graphite.each(slice.call(arguments, 1), function(source) {
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
	graphite.extract = function(map, key) {
		if(map[key]) {
			var tmp = map[key];
			delete map[key];
			return tmp;
		}
	};
	
	/**
	 * Has own property?
	 * Taken from underscore.js
	 */
	graphite.has = function(obj, key) {
	  return hasOwnProperty.call(obj, key);
	};
	
	/**
	 * Keep the identity function around for default iterators.
	 * Taken from underscore.js
	 */
	graphite.identity = function(value) {
	  return value;
	};
	
	/**
	 * Return the position of the first occurrence of an item in an array, or -1 if the item is not included in the array. 
	 * Delegates to ECMAScript 5's native indexOf if available. 
	 * If the array is large and already in sort order, pass true for isSorted to use binary search.
	 * Taken from underscore.js
	 */
	graphite.indexOf = function(array, item, isSorted) {
		if (array == null) return -1;
		var i, l;
		if (isSorted) {
			i = graphite.sortedIndex(array, item);
			return array[i] === item ? i : -1;
		}
		if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item);
		for (i = 0, l = array.length; i < l; i++) if (i in array && array[i] === item) return i;
		return -1;
	};

	/**
	 * Determine if an object is an `Array`.
	 *
	 * @param {Object} object An object that may or may not be an array
	 * @returns {Boolean} True if the parameter is an array
	 */
	graphite.isArray = Array.isArray || function(object) {
    return !!(object && object.concat
              && object.unshift && !object.callee);
  };
	
	/**
	 * Is a given variable an arguments object?
	 * Taken from underscore.js
	 *
	 * @param {Object} obj The object to check for arguments
	 * @returns {Boolean} True if the object is an arguments object
	 */
	graphite.isArguments = function(obj) {
	  return toString.call(obj) == '[object Arguments]';
	};
	if (!graphite.isArguments(arguments)) {
	  graphite.isArguments = function(obj) {
	    return !!(obj && graphite.has(obj, 'callee'));
	  };
	}
	
	/**
	 * Is a given value a boolean?
	 * Taken from underscore.js
	 *
	 * @param {Varies} obj The object to test
	 * @returns {Boolean} True if the object is a boolean
	 */
	graphite.isBoolean = function(obj) {
	  return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
	};
	
	/**
	 * Determines if the object is a double/float
	 *
	 * @param {Varies} obj A value to test
	 * @returns {Boolean} True if the value is a double/float
	 */
	graphite.isDouble = function(obj) {
		return !graphite.isNaN(parseFloat(obj));
	};
	
	/**
	 * Determines if an object is a `Function`.
	 *
	 * @param {Object} object A value to test
	 * @returns {Boolean} True if the object is a Function
	 */
	graphite.isFunction = function(object) {
		return typeof object === "function";
	};
	
	
	/**
	 * Determines if an object is an integer.
	 *
	 * @param {Object} obj A value to test
	 * @returns {Boolean} True if the object is an integer
	 */
	graphite.isInteger = function(obj) {
		return (parseFloat(obj) == parseInt(obj)) && !graphite.isNaN(obj);
	};
	
	/**
	 * Is the given value NaN?
	 * NaN is the only value for which === is not reflexive.
	 * Taken from underscore.js
	 *
	 * @param {Varies} obj The object to test
	 * @returns {Boolean} True if the object is a decimal
	 */
	graphite.isNaN = function(obj) {
		return obj !== obj;
	};

	/**
	 * Determines if an object is a `Number`.
	 *
	 * @param {Object} object A value to test
	 * @returns {Boolean} True if the object is a Number
	 */
	graphite.isNumber = function(object) {
	  return (object === +object) || (toString.call(object) === '[object Number]');
	};
	
	/** 
	 * Is a given variable an object?
	 * Taken from underscore.js
	 */
	graphite.isObject = function(obj) {
		return obj === Object(obj);
	};
	
	/**
	 * Determines if an object is a `String`.
	 *
	 * @param {Object} object A value to test
	 * @return {Boolean} True if the object is a String
	 */
	graphite.isString = function(object) {
		return typeof object === "string";
	};
	
	/**
	 * Determines if an object is a `Uri`.
	 *
	 * @param {Object} object A value to test
	 * @return {Boolean} True is the object is a Uri
	 */
	graphite.isUri = function(object) {
		return graphite.isString(object) && graphite.isArray(object.match(/^http:/));
	};
	
	/**
	 * Return the results of applying the iterator to each element. Delegates to ECMAScript 5's native map if available.
	 * Taken from underscore.js
	 */
	graphite.map = function(obj, iterator, context) {
	  var results = [];
	  if (obj == null) return results;
	  if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
	  graphite.each(obj, function(value, index, list) {
	    results[results.length] = iterator.call(context, value, index, list);
	  });
	  if (obj.length === +obj.length) results.length = obj.length;
	  return results;
	};
	
	/**
	 * Return the number of elements in an object.
	 * Taken from underscore.js
	 *
	 * @param {Object} obj The object to determine the size of
	 * @returns {Number} The size of the object
	 */
	graphite.size = function(obj) {
	  return graphite.toArray(obj).length;
	};
	
	/**
	 * Use a comparator function to figure out at what index an object should be inserted so as to maintain order. Uses binary search.
	 * Taken from underscore.js
	 */
	graphite.sortedIndex = function(array, obj, iterator) {
		iterator || (iterator = graphite.identity);
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
	graphite.toArray = function(iterable) {
		if (!iterable)                       return [];
		if (iterable.toArray)                return iterable.toArray();
		if (graphite.isArray(iterable))      return slice.call(iterable);
		if (graphite.isArguments(iterable))  return slice.call(iterable);
		return graphite.values(iterable);
	};

	/**
	 * Retrieve the values of an object's properties.
	 * Taken from underscore.js
	 *
	 * @param {Object} obj The object to retrieve values from
	 * @returns {Object} The retrieved values
	 */
	graphite.values = function(obj) {
	  return graphite.map(obj, graphite.identity);
	};

  /**
   * Export `graphite` based on environment.
   */
  global.graphite = graphite;

  if (typeof exports !== 'undefined') {
    exports.graphite = graphite;
  }
}(typeof window === 'undefined' ? this : window));
