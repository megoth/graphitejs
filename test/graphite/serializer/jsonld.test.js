/*global assert, buster, graphite, module, require*/
if (typeof module === "object" && typeof require === "function") {
    var buster = require("buster");
}

define([
    "src/graphite/serializer/jsonld",
    "src/graphite/graph"
], function (Serializer, Graph) {
    buster.testCase("Graphite serializer (JSON-LD)", {
        "Serializer has proper setup": function () {
            "use strict";
            assert.defined(Serializer);
            assert.isFunction(Serializer);
        },
        "//Testing readied graph": {
            setUp: function () {
                "use strict";
                var graph = Graph();
                this.uriAbout = "http://example.org/about";
                this.uriCreator = "http://purl.org/dc/elements/1.1/creator";
                this.uriHomepage = "http://xmlns.com/foaf/0.1/homepage";
                this.uriMaker = "http://xmlns.com/foaf/0.1/maker";
                this.uriNick = "http://xmlns.com/foaf/0.1/nick";
                this.uriTitle = "http://purl.org/dc/elements/1.1/title";
                graph.addStatement(this.uriAbout, this.uriCreator, {
                    "value" : "Anna Wilder",
                    "type" : "literal"
                });
                graph.addStatement(this.uriAbout, this.uriTitle, {
                    "value" : "Anna's Homepage",
                    "type" : "literal",
                    "lang" : "en"
                });
                graph.addStatement(this.uriAbout, this.uriMaker, {
                    "value" : "_:person",
                    "type" : "bnode"
                });
                graph.addStatement("_:person", this.uriHomepage, {
                    "value" : this.uriAbout,
                    "type" : "uri",
                    "datatype": this.uriHomepage
                });
                graph.addStatement("_:person", this.uriNick, {
                    "type" : "literal",
                    "value" : "wildling"
                });
                graph.addStatement("_:person", this.uriNick, {
                    "type" : "literal",
                    "value" : "wilda"
                });
                graph.addStatement("_:person", "http://xmlns.com/foaf/0.1/test", {
                    "value" : this.uriAbout,
                    "type" : "uri",
                    "datatype": this.uriHomepage
                });
                this.jsonld = Serializer(graph);
            },
            "Subjects are defined and correct": function () {
                "use strict";
                assert.defined(this.jsonld[0]);
                assert.defined(this.jsonld[0]["@id"]);
                assert.equals(this.jsonld[0]["@id"], this.uriAbout);
                assert.equals(this.jsonld[1]["@id"], "_:person");
            },
            "Predicates are defined and correct": function () {
                "use strict";
                assert.defined(this.jsonld[0][this.uriCreator]);
                assert.defined(this.jsonld[0][this.uriTitle]);
                assert.defined(this.jsonld[0][this.uriMaker]);
                assert.defined(this.jsonld[1][this.uriHomepage]);
                assert.defined(this.jsonld[1][this.uriNick]);
                assert.defined(this.jsonld[1]["http://xmlns.com/foaf/0.1/test"]);
            },
            "Objects are defined and correct": function () {
                "use strict";
                assert.equals(this.jsonld[0][this.uriCreator], "Anna Wilder");
                assert.equals(this.jsonld[0][this.uriTitle], {
                    "@id": "Anna's Homepage",
                    "@lang": "en"
                });
                assert.equals(this.jsonld[0][this.uriMaker], "_:person");
                assert.equals(this.jsonld[1][this.uriHomepage], {
                    "@id": this.uriAbout
                });
                assert.equals(this.jsonld[1][this.uriNick], [
                    "wildling",
                    "wilda"
                ]);
                assert.equals(this.jsonld[1]["http://xmlns.com/foaf/0.1/test"], {
                    "@id": this.uriAbout,
                    "@type": this.uriHomepage
                });
            }
        }
    });
});