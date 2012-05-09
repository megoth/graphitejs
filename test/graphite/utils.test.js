/*global assert, module, refute, require*/
if (typeof module === "object" && typeof require === "function") {
    var buster = require("buster");
}

define([
    "src/graphite/utils"
], function (Utils) {
    buster.testCase("Graphite utils", {
        "Function .any": function () {
            "use strict";
            var nativeSome = Array.prototype.some;
            Array.prototype.some = null;
            refute(Utils.any([]), 'the empty set');
            refute(Utils.any([false, false, false]), 'all false values');
            assert(Utils.any([false, false, true]), 'one true value');
            assert(Utils.any([null, 0, 'yes', false]), 'a string');
            refute(Utils.any([null, 0, '', false]), 'falsy values');
            refute(Utils.any([1, 11, 29], function (num) { return num % 2 === 0; }), 'all odd numbers');
            assert(Utils.any([1, 10, 29], function (num) { return num % 2 === 0; }), 'an even number');
            assert(Utils.any([1], Utils.identity), 'cast to boolean - true');
            refute(Utils.any([0], Utils.identity), 'cast to boolean - false');
            Array.prototype.some = nativeSome;
        },
        "Function .bind": function () {
            "use strict";
            var context = {name : 'moe'},
                name,
                func = function (arg) {
                    if (this) {
                        return "name: " + (this.name || arg);
                    }
                    return "name: " + arg;
                },
                bound = Utils.bind(func, context);
            assert.equals(bound(), 'name: moe', 'can bind a function to a context');
            bound = Utils.bind(func, null, 'curly');
            assert.equals(bound(), 'name: curly', 'can bind without specifying a context');
            func = function (salutation, name) { return salutation + ': ' + name; };
            func = Utils.bind(func, this, 'hello');
            assert.equals(func('moe'), 'hello: moe', 'the function was partially applied in advance');
            func = Utils.bind(func, this, 'curly');
            assert.equals(func(), 'hello: curly', 'the function was completely applied in advance');
            func = function (salutation, firstname, lastname) { return salutation + ': ' + firstname + ' ' + lastname; };
            func = Utils.bind(func, this, 'hello', 'moe', 'curly');
            assert.equals(func(), 'hello: moe curly', 'the function was partially applied in advance and can accept multiple arguments');
            func = function (context, message) {
                assert.equals(this, context, message);
            };
            Utils.bind(func, 0, 0, 'can bind a function to `0`')();
            Utils.bind(func, '', '', 'can bind a function to an empty string')();
            Utils.bind(func, false, false, 'can bind a function to `false`')();
        },
        "Function .clone": {
            "Cloning an object": function () {
                "use strict";
                var objA = { test: 1 },
                    objB = Utils.clone(objA);
                assert.equals(objA, objB);
                refute.same(objA, objB);
            },
            "Cloning an array": function () {
                "use strict";
                var arrA = [1, 2, 3],
                    arrB = Utils.clone(arrA);
                assert.equals(arrA, arrB);
                refute.same(arrA, arrB);
            },
            "Cloning a string": function () {
                "use strict";
                var strA = "test",
                    strB = Utils.clone(strA);
                assert.equals(strA, strB);
                assert.same(strA, strB);
            }
        },
        "Function .create": {
            "On object with init": function () {
                "use strict";
                var obj = {
                        anArray: [],
                        init: function (str) {
                            this.anArray = [];
                            this.doSomething(str);
                        },
                        doSomething: function (str) {
                            this.anArray.push(str);
                        }
                    },
                    a = Utils.create(obj, "test"),
                    b = Utils.create(obj, "test2");
                refute.equals(a, b);
            },
            "On object without init": function () {
                "use strict";
                var obj = {
                        anArray: [],
                        doSomething: function (str) {
                            this.anArray.push(str);
                        }
                    },
                    a = Utils.create(obj),
                    b = Utils.create(obj);
                a.doSomething("test");
                refute.equals(a, b);
            },
            "On functions": function () {
                "use strict";
                var func = function (str) {
                        this.str = str;
                        return this;
                    },
                    a = Utils.create(func, "test"),
                    b = Utils.create(func, "test"),
                    c = Utils.create(func, "test2");
                assert.equals(a, b);
                refute.same(a, b);
                refute.equals(a, c);
            }
        },
        "Function .createLiteral": function () {
            var literalBoolean = Utils.createLiteral(true),
                literalDouble = Utils.createLiteral(1.3),
                literalInteger = Utils.createLiteral(1),
                literalString = Utils.createLiteral("test"),
                literalLanguageString = Utils.createLiteral({
                    value: "test",
                    lang: "jp"
                });
            assert.equals(literalBoolean, '"true"^^<http://www.w3.org/2001/XMLSchema#boolean>');
            assert.equals(literalDouble, '"1.3"^^<http://www.w3.org/2001/XMLSchema#double>');
            assert.equals(literalInteger, '"1"^^<http://www.w3.org/2001/XMLSchema#integer>');
            assert.equals(literalString, '"test"');
            assert.equals(literalLanguageString, '"test"@jp');
        },
        "Function .createTriple": function () {
            var triple1 = Utils.createTriple("http://e.org/a", "http://e.org/b", "http://e.org/c"),
                triple2 = Utils.createTriple("http://e.org/a", "http://e.org/b", "Test"),
                triple3 = Utils.createTriple("http://e.org/a", "http://e.org/b", 42),
                triple4 = Utils.createTriple(null, "http://e.org/b", "http://e.org/c"),
                triple5 = Utils.createTriple(null, "http://e.org/b", '"Test"@jp'),
                triple6 = Utils.createTriple("http://e.org/a", "http://e.org/b", '"42"^^<http://www.w3.org/2001/XMLSchema#integer>');
            assert.equals(triple1.statement, '<http://e.org/a> <http://e.org/b> <http://e.org/c> .');
            assert.equals(triple1.subject, {
                value: 'http://e.org/a',
                token: 'uri'
            });
            assert.equals(triple1.predicate, {
                value: 'http://e.org/b',
                token: 'uri'
            });
            assert.equals(triple1.object, {
                value: "http://e.org/c",
                token: 'uri'
            });
            assert.equals(triple2.statement, '<http://e.org/a> <http://e.org/b> "Test" .');
            assert.equals(triple2.object, {
                value: "Test",
                token: "literal"
            });
            assert.equals(triple3.statement, '<http://e.org/a> <http://e.org/b> "42"^^<http://www.w3.org/2001/XMLSchema#integer> .');
            assert.equals(triple3.object, {
                value: 42,
                token: "literal",
                datatype: "http://www.w3.org/2001/XMLSchema#integer"
            });
            assert.equals(triple4.statement, '<' + triple4.subject.value + '> <http://e.org/b> <http://e.org/c> .');
            assert.equals(triple4.subject.token, "uri");
            assert.equals(triple5.statement, '<' + triple5.subject.value + '> <http://e.org/b> "Test"@jp .');
            assert.equals(triple5.object, {
                value: "Test",
                token: "literal",
                lang: "jp"
            });
            assert.equals(triple6.statement, '<http://e.org/a> <http://e.org/b> "42"^^<http://www.w3.org/2001/XMLSchema#integer> .');
            assert.equals(triple6.object, {
                value: 42,
                token: "literal",
                datatype: "http://www.w3.org/2001/XMLSchema#integer"
            });
        },
        "Function .createResource": function () {
            var uri = Utils.createResource("http://e.org/a");
            assert.equals(uri, "<http://e.org/a>");
        },
        "Function .difference": function () {
            "use strict";
            var result = Utils.difference([1, 2, 3], [2, 30, 40]);
            assert.equals(result.join(' '), '1 3', 'takes the difference of two arrays');
            result = Utils.difference([1, 2, 3, 4], [2, 30, 40], [1, 11, 111]);
            assert.equals(result.join(' '), '3 4', 'takes the difference of three arrays');
        },
        "Function .each": {
            "An array": function () {
                "use strict";
                var count = 1;
                Utils.each([1, 2, 3], function (num) {
                    assert.equals(num, count);
                    count += 1;
                });
            },
            "An object": function () {
                "use strict";
                var count = 1,
                    numbers = ["one", "two", "three"];
                Utils.each({ one: 1, two: 2, three: 3 }, function (num, key) {
                    assert.equals(num, count);
                    assert.equals(key, numbers[count - 1]);
                    count += 1;
                });
            }
        },
        "Function .extend": {
            "No conflicting properties":  function () {
                "use strict";
                var obj = {
                    test1: 1
                };
                Utils.extend(obj, {
                    test2: 2
                });
                assert.equals(obj, {
                    test1: 1,
                    test2: 2
                });
            },
            "Conflicting properties": function () {
                "use strict";
                var obj = {
                    test1: 1
                };
                Utils.extend(obj, {
                    test1: 2
                });
                assert.equals(obj, {
                    test1: 2
                });
            }
        },
        "Function .extract": function () {
            "use strict";
            var map = {
                    "test1": 1,
                    "test2": 2
                },
                x = Utils.extract(map, "test1");
            assert.equals(map, { "test2": 2 });
            assert.equals(x, 1);
        },
        "Function .extractArgumentMap": function () {
            var function1 = function (a, b, c) {},
                function1Map = Utils.extractArgumentMap(function1),
                function2 = function () {},
                function2Map = Utils.extractArgumentMap(function2),
                function3 = function (b, d, c) {},
                function3Map = Utils.extractArgumentMap(function3);
            assert.equals(function1Map, ["a", "b", "c"]);
            assert.equals(function2Map, []);
            assert.equals(function3Map, ["b", "d", "c"]);
        },
        "Function .filter": function () {
            "use strict";
            var evens = Utils.filter([1, 2, 3, 4, 5, 6], function (num) { return num % 2 === 0; });
            assert.equals(evens.join(', '), '2, 4, 6', 'aliased as "filter"');
        },
        "Function .flatten": function () {
            "use strict";
            var list = [1, [2], [3, [[[4]]]]],
                result = (function () { return Utils.flatten(arguments); }(1, [2], [3, [[[4]]]]));
            assert.equals(JSON.stringify(Utils.flatten(list)), '[1,2,3,4]', 'can flatten nested arrays');
            assert.equals(JSON.stringify(Utils.flatten(list, true)), '[1,2,3,[[[4]]]]', 'can shallowly flatten nested arrays');
            assert.equals(JSON.stringify(result), '[1,2,3,4]', 'works on an arguments object');
        },
        "Function .format": function () {
            var str = "{0} is dead, but {1} is alive! {0} {2}".format("ASP", "ASP.NET");
            assert.equals(str, "ASP is dead, but ASP.NET is alive! ASP {2}");
        },
        "Function .indexOf": function () {
            "use strict";
            var arr = [1, 2, 3],
                index = Utils.indexOf(arr, 2);
            assert.equals(index, 1);
        },
        "Function .isBoolean": function () {
            "use strict";
            assert(Utils.isBoolean(true));
            assert(Utils.isBoolean(false));
            refute(Utils.isBoolean("true"));
            refute(Utils.isBoolean("false"));
            refute(Utils.isBoolean(1));
            refute(Utils.isBoolean(0));
        },
        "Function .isDouble": function () {
            "use strict";
            assert(Utils.isDouble(5));
            assert(Utils.isDouble(5.3));
            assert(Utils.isDouble(5.3e0));
            refute(Utils.isDouble("test"));
        },
        "Function .isInteger": function () {
            "use strict";
            assert(Utils.isInteger(5));
            refute(Utils.isInteger(5.3));
            refute(Utils.isInteger(5.3e0));
            refute(Utils.isInteger("test"));
        },
        "Function .isNaN": function () {
            "use strict";
            assert(Utils.isNaN(NaN));
            refute(Utils.isNaN(1));
        },
        "Function .last": function () {
            assert.equals(Utils.last([1,2,3]), 3, 'can pull out the last element of an array');
            assert.equals(Utils.last([1,2,3], 0).join(', '), "", 'can pass an index to last');
            assert.equals(Utils.last([1,2,3], 2).join(', '), '2, 3', 'can pass an index to last');
            assert.equals(Utils.last([1,2,3], 5).join(', '), '1, 2, 3', 'can pass an index to last');
            var result = Utils.map([[1,2,3],[1,2,3]], Utils.last);
            assert.equals(result.join(','), '3,3', 'works well with Utils.map');
        },
        "Function .mapArgs": function () {
            var resultMap1 = [],
                resultMap2 = ["b", "a"],
                response = {
                    a: 1,
                    b: 2
                };
            assert.equals(Utils.mapArgs(resultMap1, response), []);
            assert.equals(Utils.mapArgs(resultMap2, response), [2, 1]);
        },
        "Function .mapArguments": function () {
            var function1 = function () {},
                function2 = function (b, a) {},
                response = {
                    a: 1,
                    b: 2
                };
            assert.equals(Utils.mapFunctionArgs(function1, response), []);
            assert.equals(Utils.mapFunctionArgs(function2, response), [2, 1]);
        },
        "Function .parseUri": function () {
            "use strict";
            var uri = Utils.parseUri("http://usr:pwd@www.test.com:81/" +
                "dir/dir.2/index.htm?q1=0&&test1&test2=value#top");
            assert.equals(uri.anchor, "top");
            assert.equals(uri.authority, "usr:pwd@www.test.com:81");
            assert.equals(uri.directory, "/dir/dir.2/");
            assert.equals(uri.file, "index.htm");
            assert.equals(uri.host, "www.test.com");
            assert.equals(uri.password, "pwd");
            assert.equals(uri.path, "/dir/dir.2/index.htm");
            assert.equals(uri.port, "81");
            assert.equals(uri.protocol, "http");
            assert.equals(uri.query, "q1=0&&test1&test2=value");
            assert.equals(uri.queryKey, { q1: "0", test1: "", test2: "value" });
            assert.equals(uri.relative, "/dir/dir.2/index.htm?q1=0&&test1" +
                "&test2=value#top");
            assert.equals(uri.source, "http://usr:pwd@www.test.com:81/" +
                "dir/dir.2/index.htm?q1=0&&test1&test2=value#top");
            assert.equals(uri.user, "usr");
            assert.equals(uri.userInfo, "usr:pwd");
        },
        "Function .reduce": function () {
            "use strict";
            var sum = Utils.reduce([1, 2, 3], function (sum, num) { return sum + num; }, 0),
                context = {multiplier : 3},
                ifnull,
                sparseArray = [];
            assert.equals(sum, 6, 'can sum up an array');
            sum = Utils.reduce([1, 2, 3], function (sum, num) { return sum + num * this.multiplier; }, 0, context);
            assert.equals(sum, 18, 'can reduce with a context object');
            sum = Utils.reduce([1, 2, 3], function (sum, num) { return sum + num; });
            assert.equals(sum, 6, 'default initial value');
            assert.exception(function () {
                Utils.reduce(null, function () {});
            });
            assert.defined(Utils.reduce(null, function () {}, 138) === 138, 'handles a null (with initial value) properly');
            assert.equals(Utils.reduce([], function () {}, undefined), undefined, 'undefined can be passed as a special case');
            assert.exception(function () {
                Utils.reduce([], function () {});
            });
            sparseArray[0] = 20;
            sparseArray[2] = -5;
            assert.equals(Utils.reduce(sparseArray, function (a, b) { return a - b; }), 25, 'initially-sparse arrays with no memo');
        },
        "Function .size": function () {
            "use strict";
            var size = Utils.size({ "one": 1, "two": 2, "three": 3 });
            assert.equals(size, 3);
        },
        "Function .trim": function () {
            "use strict";
            assert.equals(Utils.trim(123), "123", "Non string");
            assert.equals(" foo".trim(), "foo");
            assert.equals("foo ".trim(), "foo");
            assert.equals(" foo ".trim(), "foo");
            assert.equals("    foo     ".trim(), "foo");
        },
        "Function .unique": function () {
            var list = [1, 2, 1, 3, 1, 4];
            assert.equals(Utils.unique(list).join(', '), '1, 2, 3, 4', 'can find the unique values of an unsorted array');
            var list = [1, 1, 1, 2, 2, 3];
            assert.equals(Utils.unique(list, true).join(', '), '1, 2, 3', 'can find the unique values of a sorted array faster');
            var list = [{name:'moe'}, {name:'curly'}, {name:'larry'}, {name:'curly'}];
            var iterator = function(value) { return value.name; };
            assert.equals(Utils.map(Utils.unique(list, false, iterator), iterator).join(', '), 'moe, curly, larry', 'can find the unique values of an array using a custom iterator');
            var iterator = function(value) { return value +1; };
            var list = [1, 2, 2, 3, 4, 4];
            assert.equals(Utils.unique(list, true, iterator).join(', '), '1, 2, 3, 4', 'iterator works with sorted array');
            var result = (function(){ return Utils.unique(arguments); })(1, 2, 1, 3, 1, 4);
            assert.equals(result.join(', '), '1, 2, 3, 4', 'works on an arguments object');
        },
        "Function .without": function () {
            "use strict";
            var list = [1, 2, 1, 0, 3, 1, 4],
                result = (function () { return Utils.without(arguments, 0, 1); }(1, 2, 1, 0, 3, 1, 4));
            assert.equals(Utils.without(list, 0, 1).join(', '), '2, 3, 4', 'can remove all instances of an object');
            assert.equals(result.join(', '), '2, 3, 4', 'works on an arguments object');
            list = [{one : 1}, {two : 2}];
            assert.equals(Utils.without(list, {one : 1}).length, 2, 'uses real object identity for comparisons.');
            assert.equals(Utils.without(list, list[0]).length, 1, 'ditto.');
        }
    });
});