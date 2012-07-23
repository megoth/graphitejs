/*global define */
define(["./rdf-persistence/in_memory_b_tree", "./utils"], function (BaseTree, Utils) {
    var QuadIndex = {};
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
    QuadIndex.NodeKey = function(components, order) {
        this.subject = components.subject;
        this.predicate = components.predicate;
        this.object = components.object;
        this.graph = components.graph;
        this.order = order;
    };
    QuadIndex.NodeKey.prototype.comparator = function(keyPattern) {
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
    QuadIndex.Pattern = function (components) {
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
        this.key = new QuadIndex.NodeKey(this.keyComponents, this.order);
    };
    QuadIndex.Tree = function(params,callback) {
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
    Utils.extends(BaseTree.Tree, QuadIndex.Tree);
    QuadIndex.Tree.prototype.insert = function(quad, callback) {
        BaseTree.Tree.prototype.insert.call(this, quad, null);
        if(callback)
            callback(true);

        return true
    };
    QuadIndex.Tree.prototype.search = function(quad, callback) {
        var result = BaseTree.Tree.prototype.search.call(this, quad, true); // true -> check exists : not present in all the b-tree implementations, check first.
        if(callback)
            callback(result);

        return result;
    };
    QuadIndex.Tree.prototype.range = function (pattern, callback) {
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
    QuadIndex.Tree.prototype._rangeTraverse = function(tree,node, pattern) {
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
    return QuadIndex;
});