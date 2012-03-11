if (typeof module == "object" && typeof require == "function") {
	graphite = require("./graphite.core").graphite;
	require("./graphite.loader");
	require("./graphite.graph");
	require("./graphite.parser");
	require("./graphite.when");
}

(function(graphite, loader, graph, parser, when) {
	/*
	 * The JSON-LD parser object
	 * 
	 * @param {Object} json The JSON-LD to parse
	 * @param {Object} options A given set of options
	 * @param {Function} callback A callback-function to run when the graph is assembled
	 */
	var jsonld = function (json, options, callback) {
		if (!json) {
			throw Error("No valid JSON-object given");
		}
		if (graphite.isFunction(options)) {
			callback = options;
		}
		var pg = Object.create(PseudoGraph);
		pg.init(options);
		pg.createNode(json);
		pg.loadContexts(function() {
			callback(pg.assembleGraph());
		});
	};
	
	var ContextLoader = {
		/**
		 * Initialize the ContextLoader
		 */
		init: function(options) {
			this.promises = [];
			this.contexts = [];
		},
		
		/**
		 * Insert a promise to resolve later on
		 */
		add: function(promise) {
			return this.promises.push(promise) - 1;
		},
		
		/**
		 * Load all given contexts
		 *
		 * @param {Function} callback The function to run when all contexts have been loaded
		 */
		load: function(callback) {
			var cl = this;
			
			graphite.when.all(this.promises).then(function() {
				if(arguments[0]) {
					graphite.each(arguments[0], function(context, key) {
						cl.contexts.push(context);
					});
				}
				callback();
			}, function(err) {
				throw new Error("There was an error");
			});
		}
	};
		
	var Node = {
		/**
		 * Construct a node
		 *
		 * @returns {Object} The created node
		 */
		init: function(pseudoGraph, properties, contexts, options) {
			this.contexts = graphite.clone(contexts);
			this.context = {
				"rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
				"rdfs": "http://www.w3.org/2000/01/rdf-schema#",
				"xsd": "http://www.w3.org/TR/xmlschema-2/#"
			};
			this.options = options;
			
			var obj;
			if(obj = graphite.extract(properties, "@context")) {
					var promise = this.getPromise(obj);
					var index = pseudoGraph.contextLoader.add(promise);
					this.contexts.push(index);
			}
			var objects = [];
			var predicates = [];
			if(obj = graphite.extract(properties, "@type")) {
					predicates.push("rdf:type");
					objects.push(obj);
			}
			if(obj = graphite.extract(properties, "@language")) {
				this.lang = obj;
			}
			if(obj = graphite.extract(properties, "@value")) {
				this.value = obj;
			}
			if(obj = graphite.extract(properties, "@list")) {
				var rest = "http://www.w3.org/1999/02/22-rdf-syntax-ns#nil";
				var node;
				graphite.each(obj.reverse(), function(obj, key) {
					node = pseudoGraph.createNode({
						"http://www.w3.org/1999/02/22-rdf-syntax-ns#first": obj,
						"http://www.w3.org/1999/02/22-rdf-syntax-ns#rest": rest,
						"http://www.w3.org/1999/02/22-rdf-syntax-ns#type": "http://www.w3.org/1999/02/22-rdf-syntax-ns#List"
					});
					rest = node.subject;
				});
				graphite.extend(this, node);
				return;
			}
			this.subject = graphite.extract(properties, "@id");
			if(graphite.size(properties) > 0) {
				this.subject = this.subject || "_:" + Math.random();
				var node = this;
				graphite.each(properties, function(obj, property) {
					node.addProperty(pseudoGraph, predicates, objects, property, obj);
				});
			}
			this.triples = [];
			for(var i = 0, len = predicates.length; i < len; i++) {
				this.triples.push([this.subject, predicates[i], objects[i]]);
			}
		},
		
		/**
		 * Add properties to given arrays
		 *
		 * @param {Array} predicates An array of predicates
		 * @param {Array} objects An array of objects
		 * @param {string} property The property to add
		 * @param {Varies} object The object to add
		 */
		addProperty: function(pseudoGraph, predicates, objects, property, obj) {
			if (!graphite.isObject(obj)) {
				predicates.push(property);
				objects.push(obj);
			} else if (graphite.isArray(obj)) {
				var node = this;
				graphite.each(obj, function(o, key) {
					node.addProperty(pseudoGraph, predicates, objects, property, o);
				});
			} else {
				predicates.push(property);
				if(obj["@value"]) {
					objects.push(pseudoGraph.createNode(obj));
				} else {
					var object = pseudoGraph.createNode(obj, this.contexts);
					objects.push(object.subject);
				}
			}
		},
		
		/**
		 * Add the contained triples to the given graph
		 *
		 * @param {Object} graph The graph to add to
		 */
		addTriplesToGraph: function(graph) {
			var node = this;
			graphite.each(this.triples, function(triple, key) {
				var subject = node.getSubject(triple[0]);
				var predicate = node.getPredicate(triple[1]);
				var object = node.getObject(triple[2], triple[1]);
				graph.add(subject, predicate, object);
			});
		},
		
		/**
		 * Derive contexts
		 *
		 * @param {Array} contexts
		 */
		deriveContexts: function(contexts) {
			var node = this;
			graphite.each(this.contexts, function(num, key) {
				graphite.extend(node.context, contexts[num]);
			});
		},
		
		/**
		 * In case of dereferencing the loader is handy
		 *
		 * @returns {Object} The loader
		 */
		getLoader: function() {
			var loader = this.options.loader;
			if(!loader) {
				loader = Object.create(loader);
				loader.init();
			}
			return loader;
		},
		
		/**
		 * Get the expanded version of the object
		 *
		 * @param {Varies} object The object to be expanded
		 * @param {Varies} predicate Sometimes the predicate affects the object
		 * @returns {string} The expanded object
		 */
		getObject: function(object, predicate) {
			if(graphite.isInteger(object)) {
				object = {
					value: object,
					type: "literal",
					datatype: "http://www.w3.org/TR/xmlschema-2/#integer"
				};
			} else if(graphite.isDouble(object)) {
				object = {
					value: object,
					type: "literal",
					datatype: "http://www.w3.org/TR/xmlschema-2/#double"
				};
			} else if(graphite.isBoolean(object)) {
				object = {
					value: object,
					type: "literal",
					datatype: "http://www.w3.org/TR/xmlschema-2/#boolean"
				};
			} else if(graphite.isString(object)) {
				object = {
					value: object,
					type: graphite.isUri(object) ? "uri" : "literal"
				};
			}
			if(this.context) {
				object.lang = object.lang || this.context["@language"];
				if(this.context[predicate]) {
					var pre = this.context[predicate];
					if(pre["@type"]) {
						pre["@id"] = pre["@id"] || this.getUri(predicate);
						object.datatype = (pre["@type"] !== "@id") ? pre["@type"] : pre["@id"];
					}
				}
			}
			return object;
		},
		
		/**
		 * Get the expanded version of the predicate
		 *
		 * @param {Varies} predicate The predicate to be expanded
		 * @returns {string} The expanded predicate
		 */
		getPredicate: function(predicate) {
			if(this.context) {
				predicate = graphite.isUri(predicate)
					? predicate
					: this.getUri(predicate);
			}
			return predicate;
		},
		
		/**
		 * Construct a promise based on the type of object passed
		 *
		 * @param {Varies} obj Can be an array, an object or a string
		 * @returns {Object} A promise that can be resolved with the Promise Pattern
		 */
		getPromise: function(obj) {
			var deferred = graphite.when.defer();
			if(graphite.isString(obj)) {
				var loader = this.getLoader();
				loader.open("GET", obj);
				loader.onload(function(result) {
					deferred.resolve(JSON.parse(result));
				});
				loader.send();
			} else if(graphite.isArray(obj)) {
				var promises = [],
					node = this;
				graphite.each(obj, function(nObj, key) {
					promises.push(node.getPromise(nObj));
				});
				graphite.when.all(promises).then(function() {
					if(arguments[0]) {
						var result = {};
						graphite.each(arguments[0], function(context, key) {
							graphite.extend(result, context);
						});
						deferred.resolve(result);
					}
				});
			} else {
				deferred.resolve(obj);
			}
			return deferred;
		},
		
		/**
		 * Get the expanded subject
		 *
		 * @param {Object} subject The subject to be expanded
		 * @returns {string} The expanded subject
		 */
		getSubject: function(subject) {
			return this.context && this.context["@id"] || subject;
		},
		
		/**
		 * Expand the uri with the help of the context
		 * 
		 * @param {Object} object The object to be expanded
		 * @param {string} The expanded object
		 */
		getUri: function (object) {
			var tmp;
			if(tmp = this.context[object]) {
				tmp = tmp["@id"] || tmp;
				if(graphite.isUri(tmp)) {
					return tmp;
				}
				object = graphite.isObject(tmp) && tmp["@type"] == "@id" ? object : tmp;
			}
			var curie = object.match(/^[a-zA-Z]+:/);
			if(!curie) {
				throw new Error(object + "not found in context");
			}
			var prefix = this.context[curie[0].replace(":", "")];
			prefix = graphite.isObject(prefix) ? prefix["@id"] : prefix;
			var suffix = object.match(/^[a-zA-Z]+:([a-zA-Z]+)/)[1];
			return prefix + suffix;
		}
	};
	
	var PseudoGraph = {
		/**
		 * Initialize the pseudograph
		 * 
		 * @param {Object} options Given options
		 * @param {Function} callback The callback to call when the pseudograph is complete
		 */
		init: function(options) {
			this.contextLoader = Object.create(ContextLoader);
			this.contextLoader.init(options);
			this.nodes = [];
			this.options = options;
		},
		
		/**
		 * Assemble a complete graph
		 *
		 * @returns {Object} The graph
		 */
		assembleGraph: function() {
			var graph = Object.create(graphite.graph);
			graph.init();
			var cl = this.contextLoader;
			graphite.each(this.nodes, function(node, key) {
				node.deriveContexts(cl.contexts);
				node.addTriplesToGraph(graph);
			});
			return graph;
		},
		
		/**
		 * Load contexts that is stored in ContextLoader
		 *
		 * @param {Object} callback The function to run when all contexts has been loaded
		 */
		loadContexts: function(callback) {
			this.contextLoader.load(callback);
		},
		
		/**
		 * Traverse nodes in a JSON-LD graph
		 *
		 * @param {Object} nodes The JSON-object that is to be parsed
		 * @param {Array} contexts (Optional) An array with the contexts inherited from the parent
		 * @returns {Object} The node 
		 */
		createNode: function(nodes, contexts) {
			contexts = contexts || [];
			var pg = this;
			if(graphite.isArray(nodes)) {
				graphite.each(nodes, function(node, key) {
					pg.createNode(node, contexts);
				});
				return;
			}
			
			var node = Object.create(Node);
			node.init(this, nodes, contexts, this.options);
			this.nodes.push(node);
			return node;
		}
	};
	
	parser.jsonld = jsonld;
	return jsonld;
}(graphite, graphite.loader, graphite.graph, graphite.parser, graphite.when));
