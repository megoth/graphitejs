/*global assert, module, require*/
if (typeof module === "object" && typeof require === "function") {
    var buster = require("buster");
}

define([
    "src/graphite/serializer/rdfjson",
    "src/graphite/graph"
], function (Serializer, Graph) {
    buster.testCase("Graphite serializer (RDF JSON)", {
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
                this.uriPerson = "_:person";
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
                    "value" : this.uriPerson, 
                    "type" : "bnode" 
                });
                graph.addStatement(this.uriPerson, this.uriHomepage, { 
                    "value" : this.uriAbout, 
                    "type" : "uri" 
                });
                graph.addStatement(this.uriPerson, this.uriNick, { 
                    "type" : "literal", 
                    "value" : "wildling"
                });
                graph.addStatement(this.uriPerson, this.uriNick, { 
                    "type" : "literal", 
                    "value" : "wilda"
                });
                this.rdfjson = Serializer(graph);
                this.subjectAbout = this.rdfjson[this.uriAbout];
                this.subjectPerson = this.rdfjson[this.uriPerson];
                this.predicateCreator = this.subjectAbout[this.uriCreator][0];
                this.predicateTitle = this.subjectAbout[this.uriTitle][0];
                this.predicateMaker = this.subjectAbout[this.uriMaker][0];
                this.predicateHomepage = this.subjectPerson[this.uriHomepage][0];
                this.predicateNick = this.subjectPerson[this.uriNick];
            },
            "Subjects are defined": function () {
                "use strict";
                assert.defined(this.subjectAbout);
                assert.defined(this.subjectPerson);
            },
            "Predicates are defined": function () {
                "use strict";
                assert.defined(this.subjectAbout[this.uriCreator]);
                assert.defined(this.subjectAbout[this.uriTitle]);
                assert.defined(this.subjectAbout[this.uriMaker]);
                assert.defined(this.subjectPerson[this.uriHomepage]);
                assert.defined(this.predicateNick);
            },
            "Objects are defined": function () {
                "use strict";
                assert.defined(this.predicateCreator);
                assert.defined(this.predicateTitle);
                assert.defined(this.predicateMaker);
                assert.defined(this.predicateHomepage);
                assert.defined(this.predicateNick[0]);
                assert.defined(this.predicateNick[1]);
            },
            "Objects have correct value": function () {
                "use strict";
                assert.equals(this.predicateCreator.value, "Anna Wilder");
                assert.equals(this.predicateTitle.value, "Anna's Homepage");
                assert.equals(this.predicateMaker.value, this.uriPerson);
                assert.equals(this.predicateHomepage.value, this.uriAbout);
                assert.equals(this.predicateNick[0].value, "wildling");
                assert.equals(this.predicateNick[1].value, "wilda");
            },
            "Objects have correct types": function () {
                "use strict";
                assert.equals(this.predicateCreator.type, "literal");
                assert.equals(this.predicateTitle.type, "literal");
                assert.equals(this.predicateMaker.type, "bnode");
                assert.equals(this.predicateHomepage.type, "uri");
                assert.equals(this.predicateNick[0].type, "literal");
                assert.equals(this.predicateNick[1].type, "literal");
            },
            "Objects have correct languages": function () {
                "use strict";
                assert.defined(this.predicateTitle.lang, "en");
            }
        }
    });
});
