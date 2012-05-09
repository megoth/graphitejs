/*global assert, console, module, refute, require*/
if (typeof module === "object" && typeof require === "function") {
    var buster = require("buster");
}

define([
    "src/rdfquery/uri"
], function (Uri) {
    buster.testCase("Graphite URI", {
        setUp: function () {
            "use strict";
            this.base = Uri('http://a/b/c/d;p?q');
        },
        "Is a function": function () {
            "use strict";
            assert.isFunction(Uri);
        },
        "URI parsing": {
            "identical URIs should give identical objects": function () {
                "use strict";
                var uri1 = Uri('http://www.example.org/foo'),
                    uri2 = Uri('http://www.example.org/foo');
                assert.equals(uri1, uri1, "a uri is equal to itself");
                assert.equals(uri1, uri2, "a uri is equal to the same uri");
            },
            "resolving a URI should give identical objects": function () {
                "use strict";
                var uri1 = Uri('http://www.example.org/foo'),
                    uri2 = Uri.resolve('../foo', 'http://www.example.org/bar');
                assert.equals(uri1, uri2, "a uri is equal to the same uri");
            },
            "foo URI with all parts": function () {
                "use strict";
                var result = Uri('foo://example.com:8042/over/there?name=ferret#nose');
                assert.equals(result.scheme, 'foo');
                assert.equals(result.authority, 'example.com:8042');
                assert.equals(result.path, '/over/there');
                assert.equals(result.query, 'name=ferret');
                assert.equals(result.fragment, 'nose');
            },
            "foo URI without a fragment": function () {
                "use strict";
                var result = Uri('foo://example.com:8042/over/there?name=ferret');
                assert.equals(result.scheme, 'foo');
                assert.equals(result.authority, 'example.com:8042');
                assert.equals(result.path, '/over/there');
                assert.equals(result.query, 'name=ferret');
                assert.equals(result.fragment, undefined);
            },
            "foo URI without a query": function () {
                "use strict";
                var result = Uri('foo://example.com:8042/over/there#nose');
                assert.equals(result.scheme, 'foo');
                assert.equals(result.authority, 'example.com:8042');
                assert.equals(result.path, '/over/there');
                assert.equals(result.query, undefined);
                assert.equals(result.fragment, 'nose');
            },
            "foo URI without a path": function () {
                "use strict";
                var result = Uri('foo://example.com:8042?name=ferret#nose');
                assert.equals(result.scheme, 'foo');
                assert.equals(result.authority, 'example.com:8042');
                assert.equals(result.path, '');
                assert.equals(result.query, 'name=ferret');
                assert.equals(result.fragment, 'nose');
            },
            "foo URI without an authority": function () {
                "use strict";
                var result = Uri('foo:/over/there?name=ferret#nose');
                assert.equals(result.scheme, 'foo');
                assert.equals(result.authority, undefined);
                assert.equals(result.path, '/over/there');
                assert.equals(result.query, 'name=ferret');
                assert.equals(result.fragment, 'nose');
            },
            "URI without a scheme": function () {
                "use strict";
                assert.exception(function () {
                    Uri.parse('/over/there?name=ferret#nose');
                });
            },
            "URI with a capitalised scheme": function () {
                "use strict";
                var result = Uri('FOO:/over/there?name=ferret#nose');
                assert.equals(result.scheme, 'foo');
            },
            "URI without an authority": function () {
                "use strict";
                var result = Uri('urn:example:animal:ferret:nose');
                assert.equals(result.scheme, 'urn');
                assert.equals(result.authority, undefined);
                assert.equals(result.path, 'example:animal:ferret:nose');
                assert.equals(result.query, undefined);
                assert.equals(result.fragment, undefined);
            }
        },
        "URI Building": {
            "A URI with all parts": function () {
                "use strict";
                var u = 'foo://example.com:8042/over/there?name=ferret#nose';
                assert.equals(Uri(u), u);
            }
        },
        "URI Reference Resolution Examples: Normal Examples": {
            "g:h": function () {
                "use strict";
                assert.equals(this.base.resolve('g:h'), 'g:h');
            },
            "g": function () {
                "use strict";
                assert.equals(this.base.resolve('g'), 'http://a/b/c/g');
            },
            "./g": function () {
                "use strict";
                assert.equals(this.base.resolve('./g'), 'http://a/b/c/g');
            },
            "g/": function () {
                "use strict";
                assert.equals(this.base.resolve('g/'), 'http://a/b/c/g/');
            },
            "/g": function () {
                "use strict";
                assert.equals(this.base.resolve('/g'), 'http://a/g');
            },
            "'//g": function () {
                "use strict";
                assert.equals(this.base.resolve('//g'), 'http://g');
            },
            "?y": function () {
                "use strict";
                assert.equals(this.base.resolve('?y'), 'http://a/b/c/d;p?y');
            },
            "g?y": function () {
                "use strict";
                assert.equals(this.base.resolve('g?y'), 'http://a/b/c/g?y');
            },
            "#s": function () {
                "use strict";
                assert.equals(this.base.resolve('#s'), 'http://a/b/c/d;p?q#s');
            },
            "g#s": function () {
                "use strict";
                assert.equals(this.base.resolve('g#s'), 'http://a/b/c/g#s');
            },
            "g?y#s": function () {
                "use strict";
                assert.equals(this.base.resolve('g?y#s'), 'http://a/b/c/g?y#s');
            },
            ";x": function () {
                "use strict";
                assert.equals(this.base.resolve(';x'), 'http://a/b/c/;x');
            },
            "g;x": function () {
                "use strict";
                assert.equals(this.base.resolve('g;x'), 'http://a/b/c/g;x');
            },
            "g;x?y#s": function () {
                "use strict";
                assert.equals(this.base.resolve('g;x?y#s'), 'http://a/b/c/g;x?y#s');
            },
            "empty relative URI": function () {
                "use strict";
                assert.equals(this.base.resolve(''), 'http://a/b/c/d;p?q');
            },
            ".": function () {
                "use strict";
                assert.equals(this.base.resolve('.'), 'http://a/b/c/');
            },
            "./": function () {
                "use strict";
                assert.equals(this.base.resolve('./'), 'http://a/b/c/');
            },
            "..": function () {
                "use strict";
                assert.equals(this.base.resolve('..'), 'http://a/b/');
            },
            "../": function () {
                "use strict";
                assert.equals(this.base.resolve('../'), 'http://a/b/');
            },
            "../g": function () {
                "use strict";
                assert.equals(this.base.resolve('../g'), 'http://a/b/g');
            },
            "../..": function () {
                "use strict";
                assert.equals(this.base.resolve('../..'), 'http://a/');
            },
            "../../": function () {
                "use strict";
                assert.equals(this.base.resolve('../../'), 'http://a/');
            },
            "../../g": function () {
                "use strict";
                assert.equals(this.base.resolve('../../g'), 'http://a/g');
            }
        },
        "URI Reference Resolution Examples: Abnormal Examples": {
            "../../../g": function () {
                "use strict";
                assert.equals(this.base.resolve('../../../g'), 'http://a/g');
            },
            "../../../../g": function () {
                "use strict";
                assert.equals(this.base.resolve('../../../../g'), 'http://a/g');
            },
            "/./g": function () {
                "use strict";
                assert.equals(this.base.resolve('/./g'), 'http://a/g');
            },
            "/../g": function () {
                "use strict";
                assert.equals(this.base.resolve('/../g'), 'http://a/g');
            },
            "g.": function () {
                "use strict";
                assert.equals(this.base.resolve('g.'), 'http://a/b/c/g.');
            },
            ".g": function () {
                "use strict";
                assert.equals(this.base.resolve('.g'), 'http://a/b/c/.g');
            },
            "g..": function () {
                "use strict";
                assert.equals(this.base.resolve('g..'), 'http://a/b/c/g..');
            },
            "..g": function () {
                "use strict";
                assert.equals(this.base.resolve('..g'), 'http://a/b/c/..g');
            },
            "./../g": function () {
                "use strict";
                assert.equals(this.base.resolve('./../g'), 'http://a/b/g');
            },
            "./g/.": function () {
                "use strict";
                assert.equals(this.base.resolve('./g/.'), 'http://a/b/c/g/');
            },
            "g/./h": function () {
                "use strict";
                assert.equals(this.base.resolve('g/./h'), 'http://a/b/c/g/h');
            },
            "g/../h": function () {
                "use strict";
                assert.equals(this.base.resolve('g/../h'), 'http://a/b/c/h');
            },
            "g;x=1/./y": function () {
                "use strict";
                assert.equals(this.base.resolve('g;x=1/./y'), 'http://a/b/c/g;x=1/y');
            },
            "g;x=1/../y": function () {
                "use strict";
                assert.equals(this.base.resolve('g;x=1/../y'), 'http://a/b/c/y');
            },
            "g?y/./x": function () {
                "use strict";
                assert.equals(this.base.resolve('g?y/./x'), 'http://a/b/c/g?y/./x');
            },
            "g?y/../x": function () {
                "use strict";
                assert.equals(this.base.resolve('g?y/../x'), 'http://a/b/c/g?y/../x');
            },
            "g#s/./x": function () {
                "use strict";
                assert.equals(this.base.resolve('g#s/./x'), 'http://a/b/c/g#s/./x');
            },
            "g#s/../x": function () {
                "use strict";
                assert.equals(this.base.resolve('g#s/../x'), 'http://a/b/c/g#s/../x');
            }
        },
        "Additional tests": {
            "resolving a URN against a URI": function () {
                "use strict";
                assert.equals(this.base.resolve('urn:isbn:0140449132'), 'urn:isbn:0140449132');
            },
            "resolving a URI whose base is not absolute": function () {
                "use strict";
                assert.exception(function () {
                    Uri.resolve('foo', 'bar');
                });
            },
            "resolving an absolute URI with no base provided": function () {
                "use strict";
                var uri = Uri.resolve('http://www.example.org/foo');
                assert.equals(uri, 'http://www.example.org/foo');
            }
        },
        "Base URI": {
            requiresSupportFor: {
                "document object": typeof document !== "undefined"
            },
            "with no base specified": function () {
                "use strict";
                assert.equals(Uri.base(), document.location.href);
            }
        },
        "Creating relative URIs": {
            setUp: function () {
                "use strict";
                this.base = Uri('http://a/b/c/d;p?q');
            },
            "g:h": function () {
                "use strict";
                assert.equals(this.base.relative('g:h'), 'g:h');
            },
            "http://a/b/c/g": function () {
                "use strict";
                assert.equals(this.base.relative('http://a/b/c/g'), 'g');
            },
            "http://a/b/c/g/": function () {
                "use strict";
                assert.equals(this.base.relative('http://a/b/c/g/'), 'g/');
            },
            "http://a/g": function () {
                "use strict";
                assert.equals(this.base.relative('http://a/g'), '/g');
            },
            "http://g": function () {
                "use strict";
                assert.equals(this.base.relative('http://g'), 'http://g');
            },
            "http://a/b/c/d;p?y": function () {
                "use strict";
                assert.equals(this.base.relative('http://a/b/c/d;p?y'), '?y');
            },
            "http://a/b/c/g?y": function () {
                "use strict";
                assert.equals(this.base.relative('http://a/b/c/g?y'), 'g?y');
            },
            "http://a/b/c/d;p?q#s": function () {
                "use strict";
                assert.equals(this.base.relative('http://a/b/c/d;p?q#s'), '#s');
            },
            "http://a/b/c/g#s": function () {
                "use strict";
                assert.equals(this.base.relative('http://a/b/c/g#s'), 'g#s');
            },
            "http://a/b/c/g?y#s": function () {
                "use strict";
                assert.equals(this.base.relative('http://a/b/c/g?y#s'), 'g?y#s');
            },
            "http://a/b/c/;x": function () {
                "use strict";
                assert.equals(this.base.relative('http://a/b/c/;x'), ';x');
            },
            "http://a/b/c/g;x": function () {
                "use strict";
                assert.equals(this.base.relative('http://a/b/c/g;x'), 'g;x');
            },
            "http://a/b/c/g;x?y#s": function () {
                "use strict";
                assert.equals(this.base.relative('http://a/b/c/g;x?y#s'), 'g;x?y#s');
            },
            "http://a/b/c/d;p?q": function () {
                "use strict";
                assert.equals(this.base.relative('http://a/b/c/d;p?q'), '');
            },
            "http://a/b/": function () {
                "use strict";
                assert.equals(this.base.relative('http://a/b/'), '../');
            },
            "http://a/b/g": function () {
                "use strict";
                assert.equals(this.base.relative('http://a/b/g'), '../g');
            },
            "http://a/": function () {
                "use strict";
                assert.equals(this.base.relative('http://a/'), '/');
            }
        }
    });
});