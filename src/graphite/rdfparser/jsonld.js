/*global define*/
define([
    "../loader",
    "../rdf",
    "../utils",
    "../promise"
], function (Loader, RDF, Utils, Promise) {
    "use strict";
    function assignType(predicates, objects, obj) {
        if (Utils.isArray(obj)) {
            Utils.each(obj, function (type) {
                assignType(predicates, objects, type);
            });
        } else {
            predicates.push("rdf:type");
            objects.push(obj);
        }
    }
    var curieRegex = /^[a-zA-Z0-9]+:[a-zA-Z0-9]+/,
        literalStringRegex = /^[a-zA-Z0-9\s:_#\*\$&\-]*/,
        uriRegex = /^http:\/\/[a-zA-Z0-9#_\-.\/]+/,
        ContextLoader = function () {
            return new ContextLoader.prototype.init();
        },
        /**
         *
         * @param pseudoGraph
         * @param properties
         * @param contexts
         * @param options
         * @constructor
         */
        Node = function (pseudoGraph, properties, contexts, bnodes, options) {
            return new Node.prototype.init(pseudoGraph, properties, contexts, bnodes, options);
        },
        /**
         *
         * @param options
         * @constructor
         */
        PseudoGraph = function (options) {
            return new PseudoGraph.prototype.init(options);
        },
        /*
         * The JSON-LD parser object
         *
         * @param {Object} json The JSON-LD to parse
         * @param {Object} options A given set of options
         * @param {Function} callback A callback-function to run when the graph is assembled
         */
        JSONLD = function (json, options, callback) {
            if (!json || Utils.isNumber(json)) {
                throw new Error("No valid JSON-object given");
            } else if (Utils.isString(json)) {
                try {
                    json = JSON.parse(json);
                } catch (e) {
                    throw new Error("No valid JSON-string given: " + json);
                }
            }
            //console.log("JSON", json);
            var pg = new PseudoGraph(options);
            pg.createNode(json);
            pg.loadContexts(function () {
                callback(pg.assembleTriples());
            });
        };
    ContextLoader.prototype = {
        /**
         * Initialize the ContextLoader
         */
        init: function () {
            this.promises = [];
            this.contexts = [];
        },
        /**
         * Insert a promise to resolve later on
         */
        add: function (promise) {
            return this.promises.push(promise) - 1;
        },
        /**
         * Load all given contexts
         *
         * @param {Function} callback The function to run when all contexts have been loaded
         */
        load: function (callback) {
            var cl = this;

            Promise.all(this.promises).then(function (contexts) {
                if (contexts) {
                    Utils.each(contexts, function (context) {
                        cl.contexts.push(context);
                    });
                }
                callback();
            }, function (err) {
                throw new Error("There was an error:" + err);
            });
        }
    };
    ContextLoader.prototype.init.prototype = ContextLoader.prototype;
    Node.prototype = {
        /**
         *
         * @param pseudoGraph
         * @param properties
         * @param contexts
         * @param options
         * @return {*}
         */
        init: function (pseudoGraph, properties, contexts, bnodes, options) {
            var promise,
                index,
                rest,
                obj,
                node = {},
                objects = [],
                predicates = [];
            this.contexts = Utils.clone(contexts);
            this.context = {
                "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
                "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
                "xsd": "http://www.w3.org/TR/xmlschema-2/#"
            };
            this.options = options;
            this.bnodes = bnodes;
            obj = Utils.extract(properties, "@context");
            if (obj) {
                promise = this.getPromise(obj);
                index = pseudoGraph.contextLoader.add(promise);
                this.contexts.push(index);
            }
            obj = Utils.extract(properties, "@type");
            if (obj) {
                assignType(predicates, objects, obj);
            }
            obj = Utils.extract(properties, "@language");
            if (obj) {
                this.lang = obj;
            }
            obj = Utils.extract(properties, "@value");
            if (obj) {
                this.value = obj;
            }
            obj = Utils.extract(properties, "@list");
            if (obj) {
                rest = "http://www.w3.org/1999/02/22-rdf-syntax-ns#nil";
                Utils.each(obj.reverse(), function (obj) {
                    node = pseudoGraph.createNode({
                        "rdf:first": obj,
                        "rdf:rest": rest,
                        "rdf:type": "rdf:List"
                    });
                    rest = node.subject;
                });
                Utils.extend(this, node);
                return undefined;
            }
            this.subject = Utils.extract(properties, "@id");
            if (Utils.size(properties) > 0) {
                this.subject = this.subject || "_:" + Math.random();
                node = this;
                Utils.each(properties, function (obj, property) {
                    node.addProperty(pseudoGraph, predicates, objects, property, obj);
                });
            }
            this.triples = [];
            Utils.each(predicates, function (predicate, i) {
                this.triples.push([this.subject, predicate, objects[i]]);
            }.bind(this));
            return this;
        },
        /**
         * Add properties to given arrays
         *
         * @param {Array} predicates An array of predicates
         * @param {Array} objects An array of objects
         * @param {string} property The property to add
         * @param {Object|Array|String} obj The object to add
         */
        addProperty: function (pseudoGraph, predicates, objects, property, obj) {
            var node,
                object;
            if (!Utils.isObject(obj)) {
                predicates.push(property);
                objects.push(obj);
            } else if (Utils.isArray(obj)) {
                node = this;
                Utils.each(obj, function (o) {
                    node.addProperty(pseudoGraph, predicates, objects, property, o);
                });
            } else {
                predicates.push(property);
                if (obj["@value"]) {
                    objects.push(pseudoGraph.createNode(obj));
                } else {
                    object = pseudoGraph.createNode(obj, this.contexts);
                    objects.push(object.subject);
                }
            }
        },
        /**
         * Add the contained triples to the given graph
         *
         * @param {Array} graph The graph to add to
         */
        addTriples: function (graph) {
            var node = this,
                subject,
                predicate,
                object;
            //console.log("TRIPLES ASSEMBLING", this.triples);
            Utils.each(this.triples, function (triple) {
                //console.log("TRIPLE ASSEMBLING", triple);
                subject = node.getSubject(triple[0]);
                if (subject.type === "bnode") {
                    subject = node.getBlankNode(subject.value);
                } else if (subject.type === "uri") {
                    subject = RDF.Symbol(subject.value);
                } else {
                    throw new Error("Unrecognized type of subject" + subject.type);
                }
                predicate = node.getPredicate(triple[1]);
                predicate = RDF.Symbol(predicate);
                object = node.getObject(triple[2], predicate);
                if (object.type === "bnode") {
                    object = node.getBlankNode(object.value);
                } else if (object.type === "uri") {
                    object = RDF.Symbol(object.value);
                } else {
                    //console.log("IN JSONLD, OBJECT", object);
                    object = RDF.Literal(object.value, object.lang, object.datatype);
                }
                //console.log("TRIPLE", subject, predicate, object);
                graph.add(subject, predicate, object);
            });
        },
        /**
         * Derive contexts
         *
         * @param {Array} contexts
         */
        deriveContexts: function (contexts) {
            var node = this;
            Utils.each(this.contexts, function (num) {
                Utils.extend(node.context, contexts[num]);
            });
        },
        getBlankNode: function (value) {
            var subject;
            //console.log("BNODES", this.bnodes);
            if (this.bnodes[value]) {
                subject = this.bnodes[value];
            } else {
                subject = RDF.BlankNode(value);
                this.bnodes[value] = subject;
            }
            //console.log("BNODE", value, subject);
            return subject;
        },
        /**
         * In case of dereferencing the loader is handy
         *
         * @returns {Object} The loader
         */
        getLoader: function (options) {
            var loader;
            if (this.options && this.options.loader) {
                loader = this.options.loader;
            }
            if (!loader) {
                loader = new Loader(options);
            }
            return loader;
        },
        /**
         * Get the expanded version of the object
         *
         * @param {Object|String} object The object to be expanded
         * @param {String} predicate Sometimes the predicate affects the object
         * @returns {string} The expanded object
         */
        getObject: function (object, predicate) {
            var value, tmp, pre;
            if (Utils.isInteger(object)) {
                object = {
                    value: object,
                    type: "literal",
                    datatype: "http://www.w3.org/TR/xmlschema-2/#integer"
                };
            } else if (Utils.isDouble(object)) {
                object = {
                    value: object,
                    type: "literal",
                    datatype: "http://www.w3.org/TR/xmlschema-2/#double"
                };
            } else if (Utils.isBoolean(object)) {
                object = {
                    value: object,
                    type: "literal",
                    datatype: "http://www.w3.org/TR/xmlschema-2/#boolean"
                };
            } else if (Utils.isString(object) && object[0] === "_") {
                object = {
                    value: object,
                    type: "bnode"
                };
            } else if (Utils.isString(object)) {
                value = literalStringRegex.exec(object)[0];
                if (uriRegex.test(value)) {
                    value = this.getUri(value);
                } else if (curieRegex.test(value)) {
                    tmp = this.getUri(value);
                    if (uriRegex.test(tmp)) {
                        value = tmp;
                    }
                } else {
                    value = object;
                }
                object = {
                    value: value,
                    type: Utils.isUri(value) ? "uri" : "literal"
                };
            }
            if (this.context) {
                object.lang = object.lang || this.context["@language"];
                if (this.context[predicate]) {
                    pre = this.context[predicate];
                    if (pre["@type"]) {
                        pre["@id"] = pre["@id"] || self.getUri(predicate);
                        object.datatype = (pre["@type"] !== "@id") ? pre["@type"] : pre["@id"];
                    }
                }
            }
            return object;
        },
        /**
         * Get the expanded version of the predicate
         *
         * @param {String} predicate The predicate to be expanded
         * @returns {string} The expanded predicate
         */
        getPredicate: function (predicate) {
            if (this.context) {
                predicate = Utils.isUri(predicate)
                    ? predicate
                    : this.getUri(predicate);
            }
            return predicate;
        },
        /**
         * Construct a promise based on the type of object passed
         *
         * @param {String|Array|Object} obj Can be an array, an object or a string
         * @returns {Object} A promise that can be resolved with the Promise Pattern
         */
        getPromise: function (obj) {
            var deferred = Promise.defer();
            if (Utils.isString(obj)) {
                this.getLoader({
                    uri: obj,
                    success: function (err, result) {
                        deferred.resolve(err ? err : JSON.parse(result)["@context"]);
                    }
                });
            } else if (Utils.isArray(obj)) {
                var promises = [],
                    node = this;
                Utils.each(obj, function (nObj) {
                    promises.push(node.getPromise(nObj));
                });
                Promise.all(promises).then(function () {
                    if (arguments[0]) {
                        var result = {};
                        Utils.each(arguments[0], function (context) {
                            Utils.extend(result, context);
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
        getSubject: function (subject) {
            subject = this.context && this.context["@id"]
                ? this.context["@id"]
                : subject;
            if (Utils.isString(subject) && subject[0] === "_") {
                subject = {
                    value: subject,
                    type: "bnode"
                };
            } else if (Utils.isString(subject)) {
                subject = {
                    value: this.getUri(subject),
                    type: "uri"
                }
            }
            return subject;
        },
        /**
         * Expand the uri with the help of the context
         * @param {Object} curie The object to be expanded
         * @return {*} The expanded object
         */
        getUri: function (curie) {
            var context = Utils.clone(this.context);
            Utils.each(context, function (obj, key) {
                if (obj.hasOwnProperty("@id")) {
                    context[key] = obj["@id"];
                }
            });
            return RDF.getUri(curie, context);
        }
    };
    Node.prototype.init.prototype = Node.prototype;
    PseudoGraph.prototype = {
        /**
         * Initialize the pseudograph
         *
         * @param {Object} options Given options
         */
        init: function (options) {
            this.contextLoader = ContextLoader();
            this.nodes = [];
            this.options = options;
        },

        /**
         * Assemble a complete graph
         *
         * @returns {Object} The graph
         */
        assembleTriples: function () {
            var graph = RDF.Formula(this.options.graph),
                cl = this.contextLoader;
            Utils.each(this.nodes, function (node) {
                //console.log("NODE ASSEMBLING", node);
                node.deriveContexts(cl.contexts);
                node.addTriples(graph);
            });
            return graph;
        },
        /**
         * Load contexts that is stored in ContextLoader
         *
         * @param {Object} callback The function to run when all contexts has been loaded
         */
        loadContexts: function (callback) {
            this.contextLoader.load(callback);
        },
        /**
         * Traverse nodes in a JSON-LD graph
         *
         * @param {Object} nodes The JSON-object that is to be parsed
         * @param {Array} [contexts] An array with the contexts inherited from the parent (optional)
         * @returns {Object} The node
         */
        createNode: function (nodes, contexts) {
            contexts = contexts || [];
            var pg = this;
            if (Utils.isArray(nodes)) {
                Utils.each(nodes, function (node) {
                    pg.createNode(node, contexts);
                });
                return undefined;
            }
            var n = Node(this, nodes, contexts, this.options);
            if (!n.hasOwnProperty("deriveContexts")) {
                this.nodes.push(n);
            }
            return n;
        }
    };
    PseudoGraph.prototype.init.prototype = PseudoGraph.prototype;
    return JSONLD;
});
