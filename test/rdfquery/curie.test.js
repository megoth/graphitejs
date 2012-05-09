/*global assert, buster, graphite, module, require*/
if (typeof module === "object" && typeof require === "function") {
    var buster = require("buster");
}

define([
    "src/rdfquery/curie"
], function (CURIE) {
    buster.testCase("Graphite CURIE", {
        setUp: function () {
            "use strict";
            this.ns = {
                xhv: "http://www.w3.org/1999/xhtml/vocab#",
                dc: "http://purl.org/dc/elements/1.1/",
                foaf: "http://xmlthis.ns.com/foaf/0.1/",
                cc: "http://creativecommothis.ns.org/ns#"
            };
        },
        "CURIE resolution": {
            "Two identical CURIEs": function () {
                "use strict";
                var curie1 = CURIE('dc:creator'),
                    curie2 = CURIE('dc:creator');
                assert.equals(curie1, curie2, "should equal each other");
            },
            "CURIE with declaration": function () {
                "use strict";
                assert.equals(CURIE('dc:creator'), this.ns.dc + 'creator');
            },
            "CURIE on element with other ancestor declaration": function () {
                "use strict";
                assert.equals(CURIE('foaf:img'), this.ns.foaf + 'img');
            },
            "CURIE on element without declaration for the prefix": function () {
                "use strict";
                assert.exception(function () {
                    CURIE('lic:license');
                });
            },
            "CURIE with no prefix and no colon when there is a default namespace": function () {
                "use strict";
                var namespace = 'http://www.example.org/',
                    opts = {reserved: [], reservedNamespace: null, defaultNamespace: namespace};
                assert.equals(CURIE('foobar', opts), namespace + 'foobar');
            },
            "CURIE with no prefix and no colon when there is no default namespace": function () {
                "use strict";
                var opts = {reserved: [], reservedNamespace: null, defaultNamespace: null};
                assert.exception(function () {
                    CURIE('foobar', opts);
                });
            },
            "CURIE with no prefix (but with a colon) when there is a reserved namespace": function () {
                "use strict";
                var namespace = 'http://www.example.org/',
                    opts = {reserved: [], reservedNamespace: namespace, defaultNamespace: null};
                assert.equals(CURIE(':foobar', opts), namespace + 'foobar');
            },
            "CURIE with no prefix (but with a colon) when there is no reserved namespace": function () {
                "use strict";
                var opts = {reserved: [], reservedNamespace: null, defaultNamespace: null};
                assert.exception(function () {
                    CURIE('foobar', opts);
                });
            }
        },
        "Safe CURIE resolution": {
            "CURIE in square brackets": function () {
                "use strict";
                assert.equals(CURIE.safeCurie('[dc:creator]'), this.ns.dc + 'creator');
            },
            "absolute URI": function () {
                "use strict";
                assert.equals(CURIE.safeCurie(this.ns.dc + 'creator'), this.ns.dc + 'creator');
            }
        },
        "Generating CURIEs": {
            "creating a CURIE from an appropriate namespace declaration": function () {
                "use strict";
                assert.equals(CURIE.createCurie(this.ns.foaf + 'img'), 'foaf:img');
            },
            "creating a CURIE in the reserved namespace": function () {
                "use strict";
                assert.equals(CURIE.createCurie(this.ns.xhv + 'foo'), ':foo');
            },
            "creating a CURIE in the reserved namespace with a reserved local name": function () {
                "use strict";
                assert.equals(CURIE.createCurie(this.ns.xhv + 'cite'), 'cite');
            }
        }
    });
});