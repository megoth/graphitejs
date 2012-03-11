if (typeof module == "object" && typeof require == "function") {
	graphite = require("./graphite.core").graphite;
}

(function(graphite) {
	/*
	 * The Graph object
	 */
	var graph = {
		subject: [],
		subjects: {}
	};
	
	/**
	 * Add a triple to the graph
	 *
	 * @param {Object} sub The subject to add
	 * @param {Object} pre The predicate to add
	 * @param {Object} obj The object to add
	 * @returns {Object} The subject of the triple
	 */
	graph.add = function(sub, pre, obj) {
		var object = new RDFObject(obj);
		var predicate = new RDFPredicate(pre);
		predicate.add(object);
		var subject = new RDFSubject(sub);
		var newSubject = true;		
		if(this.subjects[subject.value]) {
			subject = this.subjects[subject.value];
			newSubject = false;
		}
		subject.add(predicate);
		if(newSubject) {
			this.subject.push(subject);
		}
		this.subjects[subject.value] = subject;
		return subject;
	};
	
	graph.init = function() {
		this.subject = [];
		this.subjects = {};
	};
	
	function getType(object) {
		return graphite.isUri(object) ? "uri" : "literal";
	}
	
	var RDFObject = function (object) {
		if(object && graphite.isString(object)) {
			this.value = object;
			this.type = getType(object);
		} else if(object && graphite.isNumber(object)) {
			this.value = object;
			this.type = "literal";
		} else if(object) {
			this.value = object.value;
			this.type = object.type || getType(object.value);
			this.lang = object.lang;
			this.datatype = object.datatype;
		} else {
			this.value = undefined;
			this.uri = "bnode";
		}
	};
	
	var RDFPredicate = function (object) {
		if(graphite.isString(object) && graphite.isUri(object)) {
			this.value = object;
			this.type = "uri";
		} else if(graphite.isString(object) || graphite.isNumber(object)) {
			this.value = object;
			this.type = "literal";
		} else if(object) {
			this.value = object.value;
			this.type = object.type;
			this.lang = object.lang;
			this.datatype = object.datatype;
		} else {
			 throw new Error("Invalid input: object must be set");
		}
		this.object = [];
		
		this.add = function (object) {
			this.object.push(object);
		}
	};
	
	var RDFSubject = function (object) {
		if(graphite.isString(object) && graphite.isUri(object)) {
			this.value = object;
			this.type = "uri";
		} else if(graphite.isString(object)) {
			this.value = object;
			this.type = "bnode";
		} else if(object) {
			this.value = object.value;
			this.type = object.type;
			this.lang = object.lang;
			this.datatype = object.datatype;
		} else {
			this.value = "_:" + Math.random();
			this.type = "bnode";
		}
		this.predicate = [];
		this.predicates = {};
		
		this.add = function (predicate) {
			if(this.predicates[predicate.value]) {
				this.predicates[predicate.value].add(predicate.object[0]);
			} else {
				this.predicate.push(predicate);
				this.predicates[predicate.value] = predicate;
			}
		}
	};
	
	graphite.graph = graph;
	return graph;
}(graphite));
