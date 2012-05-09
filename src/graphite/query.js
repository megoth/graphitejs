define([], function () {
    var query = function (q) {
        return new query.prototype.init(q);
    };
    query.prototype = {
        init: function (q) {
            this.query = q;
        },
        getTriples: function (query) {
            var tripleRegex = /<(_:[0-9]+|http:\/\/[a-zA-Z0-9#_\-.\/]+)>\s+<http:\/\/[a-zA-Z0-9#_\-.\/]+>\s+("[a-zA-Z0-9\s\-_\/]+"\^\^<http:\/\/[a-zA-Z0-9#_\-.\/]+>|"[a-zA-Z0-9\s\-_\/]+"|<(_:[0-9]+|http:\/\/[a-zA-Z0-9#_\-.\/]+|)>)\s*[.]?/g,
                triples = query.match(tripleRegex);
            return triples !== null ? triples : [];
        }
    };
    query.prototype.init.prototype = query.prototype;
    return query;
});