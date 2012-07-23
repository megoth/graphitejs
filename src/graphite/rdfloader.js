define([
    "./loader",
    "./rdfparser",
    "./utils"
], function (Loader, Parser, Utils) {
    function getMime(responseHeader) {
        return responseHeader.split("application/")[1];
    }
    return function(uri, graph, callback) {
        Loader({
            uri: uri,
            accept: this.acceptHeaderValue,
            success: function (err, data, status, xhr) {
                if(!err) {
                    var mime = getMime(xhr.getResponseHeader("Content-Type") || xhr.getResponseHeader("content-type"));
                    if(!mime || mime === "octet-stream") {
                        mime = Utils.last(uri.split("."));
                    }
                    Parser(data, mime, {
                        graph: graph
                    }, function (graph) {
                        callback(true, graph);
                    });
                } else {
                    callback(false, "Network error");
                }
            }
        });
    };
});