if (typeof module == "object" && typeof require == "function") {
    var buster = require("buster");
    var graphite = require("./../lib/graphite.core").graphite;
}

buster.testCase("Graphite core tests:", {
	setUp: function() {
		this.g = graphite;
	},
	
	"Function .clone": {
		"Cloning an object": function() {
			var objA = { test: 1 };
			var objB = graphite.clone(objA);
			assert.equals(objA, objB);
			refute.same(objA, objB);
		},
		
		"Cloning an array": function() {
			var arrA = [1, 2, 3];
			var arrB = graphite.clone(arrA);
			assert.equals(arrA, arrB);
			refute.same(arrA, arrB);
		},
		
		"Cloning a string": function() {
			var strA = "test";
			var strB = graphite.clone(strA);
			assert.equals(strA, strB);
			assert.same(strA, strB);
		}
	},
	
	"Function .each": {
		"An array": function() {
			var count = 1;
			graphite.each([1, 2, 3], function(num) {
				assert.equals(num, count++);
			});
		},
		
		"An object": function() {
			var count = 1;
			var numbers = ["one", "two", "three"];
			graphite.each({ one: 1, two: 2, three: 3 }, function(num, key) {
				assert.equals(num, count);
				assert.equals(key, numbers[count - 1]);
				count++;
			});
		}
	},
	
	"Function .extend": {
		"No conflicting properties":  function() {
			var obj = {
				test1: 1
			}
			this.g.extend(obj, {
				test2: 2
			});
			assert.equals(obj, {
				test1: 1,
				test2: 2
			});
		},
		
		"Conflicting properties": function() {
			var obj = {
				test1: 1
			}
			this.g.extend(obj, {
				test1: 2
			});
			assert.equals(obj, {
				test1: 2
			});
		}
	},
	
	"Function .extract": function() {
		var map = {
			"test1": 1,
			"test2": 2
		}
		var x = graphite.extract(map, "test1");
		assert.equals(map, { "test2": 2 });
		assert.equals(x, 1);
	},
	
	"Function .indexOf": function() {
		var arr = [1, 2, 3];
		var index = graphite.indexOf(arr, 2)
		assert.equals(index, 1);
	},
	
	"Function .isBoolean": function() {
		assert(graphite.isBoolean(true));
		assert(graphite.isBoolean(false));
		refute(graphite.isBoolean("true"));
		refute(graphite.isBoolean("false"));
		refute(graphite.isBoolean(1));
		refute(graphite.isBoolean(0));
	},
	
	"Function .isDouble": function() {
		assert(graphite.isDouble(5));
		assert(graphite.isDouble(5.3));
		assert(graphite.isDouble(5.3e0));
		refute(graphite.isDouble("test"));
	},
	
	"Function .isInteger": function() {
		assert(graphite.isInteger(5));
		refute(graphite.isInteger(5.3));
		refute(graphite.isInteger(5.3e0));
		refute(graphite.isInteger("test"));
	},
	
	"Function .isNaN": function() {
		assert(graphite.isNaN(NaN));
		refute(graphite.isNaN(1));
	},
	
	"Function .size": function() {
		var size = graphite.size({ "one": 1, "two": 2, "three": 3 });
		assert.equals(size, 3);
	}
});
