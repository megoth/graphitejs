if (typeof module == "object" && typeof require == "function") {
    var buster = require("buster");
    var sinon = require("sinon");
    var graphite = require("./../lib/graphite.core").graphite;
    require("./../lib/graphite.graph");
}

function runLoops(subject, subSpy, preSpy, objSpy) {
	var spies = {
		subSpy: sinon.spy(),
		preSpy: sinon.spy(),
		objSpy: sinon.spy()
	}
	for(var s in subject) {
		spies.subSpy();
		for(var p in subject[s].predicate) {
			spies.preSpy();
			for(var o in subject[s].predicate[p].object) {
				spies.objSpy();
			}
		}
	}
	return spies;
};

buster.testCase("Graphite graph tests:", {
	setUp: function() {
		this.g = Object.create(graphite.graph);
		this.g.init();
		this.sub = "http://dbpedia.org/resource/John_Lennon";
		this.pre = "http://xmlns.com/foaf/spec/name";
		this.obj = "John Lennon";
	},
	
	"Graph has no triples to begin with": function() {
		refute.defined(this.g.subject[0]);
	},
	
	"Adding a triple": {
		setUp: function() {
			this.g.add(this.sub, this.pre, this.obj);
		},
		
		"Is properly set up": function() {
			assert.equals(this.g.subject[0].value, this.sub);
			assert.equals(this.g.subject[0].predicate[0].value, this.pre);
			assert.equals(this.g.subject[0].predicate[0].object[0].value, this.obj);
		},
		
		"Should run through each level once": function() {
			var spies = runLoops(this.g.subject);
			assert.calledOnce(spies.subSpy);
			assert.calledOnce(spies.preSpy);
			assert.calledOnce(spies.objSpy);
		}
	},

	"Adding a blank node": {
		setUp: function() {
			this.g.add(undefined, this.pre, this.obj);
		},
		
		"Is properly set up": function() {
			assert.equals(this.g.subject[0].predicate[0].value, this.pre);
			assert.equals(this.g.subject[0].predicate[0].object[0].value, this.obj);
		},
		
		"Should run through each level once": function() {
			var spies = runLoops(this.g.subject);
			assert.calledOnce(spies.subSpy);
			assert.calledOnce(spies.preSpy);
			assert.calledOnce(spies.objSpy);
		}
	},
	
	"Adding multiple triples with same subject": {
		setUp: function() {
			this.g.add.call(this.g, this.sub, this.pre, this.obj);
			this.g.add.call(this.g, this.sub, "http://xmlns.com/foaf/0.1/homepage", "something");
		},
		
		"Is properly set up": function() {
			refute.defined(this.g.subject[1]);
			var subject = this.g.subject[0];
			var predicate = subject.predicate[0];
			assert.equals(predicate.value, this.pre);
			predicate = subject.predicate[1];
			assert.equals(predicate.value, "http://xmlns.com/foaf/0.1/homepage");
		},
		
		"Should call predicate twice": function() {
			var spies = runLoops(this.g.subject);
			assert.calledOnce(spies.subSpy);
			assert.calledTwice(spies.preSpy);
			assert.calledTwice(spies.objSpy);
		}
	},
	
	"Adding multiple triples with same subject and predicate": {
		setUp: function() {
			this.g.add(this.sub, this.pre, "Something");
			this.g.add(this.sub, this.pre, "Something else");
		},
		
		"Is properly set up": function() {
			refute.defined(this.g.subject[1]);
			var subject = this.g.subject[0];
			refute.defined(subject.predicate[1]);
			var predicate = subject.predicate[0];
			var object = predicate.object[0];
			assert.equals(object.value, "Something");
			object = predicate.object[1];
			assert.equals(object.value, "Something else");
		},
		
		"Should call object twice": function() {
			var spies = runLoops(this.g.subject);
			assert.calledOnce(spies.subSpy);
			assert.calledOnce(spies.preSpy);
			assert.calledTwice(spies.objSpy);
		}
	},
	
	"Typing": {
		"Default types": function() {
			this.g.add.call(this.g, this.sub, this.pre, this.obj);
			var subject = this.g.subject[0];
			assert.equals(subject.type, "uri");
			var predicate = subject.predicate[0];
			assert.equals(predicate.type, "uri");
			var object = predicate.object[0];
			assert.equals(object.type, "literal");
			this.g.add.call(this.g, undefined, this.pre, this.obj);
			var subject = this.g.subject[1];
			assert.equals(subject.type, "bnode");
		},
		
		"Explicitly typed": function() {
			this.g.add.call(this.g, {
				value: "http://dbpedia.org/resource/John_Lennon",
				type: "uri"
			}, this.pre, {
				value: 12,
				type: "literal",
				datatype: "http://www.w3.org/2001/XMLSchema#integer"
			});
			var subject = this.g.subject[0];
			assert.equals(subject.value, "http://dbpedia.org/resource/John_Lennon");
			assert.equals(subject.type, "uri");
			var object = subject.predicate[0].object[0];
			assert.equals(object.value, 12);
			assert.equals(object.type, "literal");
			assert.equals(object.datatype, "http://www.w3.org/2001/XMLSchema#integer");
			this.g.add.call(this.g, {
				value: "http://dbpedia.org/resource/Sean_Taro_Ono_Lennon",
				type: "uri"
			}, this.pre, {
				value: "小野 太郎",
				type: "literal",
				lang: "jp"
			});
			object = this.g.subject[1].predicate[0].object[0];
			assert.equals(object.value, "小野 太郎");
			assert.equals(object.type, "literal");
			assert.equals(object.lang, "jp");
		}
	},
	
	"Triples object refers to a triple": function() {
		var subjectOne = this.g.add(undefined, "http://xmlns.com/foaf/spec/name", "Manu Sporny");
		var subjectTwo = this.g.add(undefined, "http://xmlns.com/foaf/spec/knows", subjectOne);
		assert.equals(subjectTwo.predicate[0].object[0].value, subjectOne.value);
	}
});
