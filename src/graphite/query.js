define([
    "../rdfstore/sparql-parser/sparql_parser"
], function (SparqlParser) {
    var query = function (queryString) {
        return new query.prototype.init(queryString);
    };
    query.prototype = {
        init: function (queryString) {
            if(queryString) {
                this.syntaxTree = SparqlParser.parser.parse(queryString);
            }
            return this;
        },
        getTriples: function (query) {
            var tripleRegex = /<(_:[0-9]+|http:\/\/[a-zA-Z0-9#_\-.\/]+)>\s+<http:\/\/[a-zA-Z0-9#_\-.\/]+>\s+("[a-zA-Z0-9\s\-_\/]+"\^\^<http:\/\/[a-zA-Z0-9#_\-.\/]+>|"[a-zA-Z0-9\s\-_\/]+"|<(_:[0-9]+|http:\/\/[a-zA-Z0-9#_\-.\/]+|)>)\s*[.]?/g,
                triples = query.match(tripleRegex);
            return triples !== null ? triples : [];
        },
        retrieveTree: function () {
            return this.syntaxTree;
        },
        select: function (part) {
            buster.log(part);
        },
        where: function (part) {
            buster.log(part);
        }
    };
    query.prototype.init.prototype = query.prototype;
    return query;
});