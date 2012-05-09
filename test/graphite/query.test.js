define([
    "src/graphite/query",
    "src/graphite/utils"
], function (Query, Utils) {
    buster.testCase("Graphite query", {
        setUp: function () {
            this.query = Query();
            this.subJohn = "http://dbpedia.org/resource/John_Lennon";
            this.preName = "http://xmlns.com/foaf/0.1/name";
            this.preHomepage = "http://xmlns.com/foaf/0.1/homepage";
            this.objJohnName = "John Lennon";
            this.subTim = "http://dbpedia.org/resource/Tim_B_Lee";
            this.objTimName = "Tim Berners-Lee";
            this.objTimHomepage = "http://www.w3.org/People/Berners-Lee/";
            this.uriHomepage = "http://xmlns.com/foaf/0.1/homepage";
            this.uriInteger = "http://www.w3.org/2001/XMLSchema#integer";
            this.objManuName = "Manu Sporny";
            this.preKnows = "http://xmlns.com/foaf/0.1/knows";
            this.graph1 = [
                Utils.createTriple(this.subJohn, this.preName, this.objJohnName).statement,
                Utils.createTriple(null, this.preName, this.objTimName).statement,
                Utils.createTriple(null, this.preName, 42).statement,
                Utils.createTriple(this.subTim, this.preName, 42).statement
            ];
            this.triple2 = [
                Utils.createTriple(this.subJohn, this.preKnows, this.subTim).statement
            ];
        },
        "Proper setup": function () {
            assert.defined(Query);
            assert.isFunction(Query);
        },
        "getTriples": function () {
            var triples = this.query.getTriples("");
            assert.equals(triples, []);
            triples = this.query.getTriples("INSERT DATA { " + this.graph1.join("") + " }");
            assert.equals(triples, this.graph1);
            triples = this.query.getTriples("DELETE DATA { " + this.triple2.join("") + " }");
            assert.equals(triples, this.triple2);
        }
    });
});