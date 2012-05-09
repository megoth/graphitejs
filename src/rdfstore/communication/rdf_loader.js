define([
    "./tcp_transport",
    "./n3_parser",
    "./jsonld_parser",
    "../trees/utils",
    "../../graphite/loader",
    "../../graphite/parser",
    "../../graphite/utils"
], function (NetworkTransport, N3Parser, JSONLDParser, Utils, Loader, Parser, GUtils) {
    function getMime(responseHeader) {
        return responseHeader.split("application/")[1];
    }

    var RDFLoader = {};
    RDFLoader.RDFLoader = function (params) {
        this.precedences = ["text/turtle", "text/n3", "application/json"];
        this.parsers = {
            "text/turtle": N3Parser.parser,
            "text/n3": N3Parser.parser,
            "application/json": JSONLDParser.parser
        };
        if (params != null) {
            for (var mime in params["parsers"]) {
                this.parsers[mime] = params["parsers"][mime];
            }
        }
        if (params && params["precedences"] != null) {
            this.precedences = params["precedences"];
            for (var mime in params["parsers"]) {
                if (!Utils.include(this.precedences, mime)) {
                    this.precedences.push(mime);
                }
            }
        }
        this.acceptHeaderValue = "";
        for (var i = 0; i < this.precedences.length; i++) {
            if (i != 0) {
                this.acceptHeaderValue = this.acceptHeaderValue + "," + this.precedences[i];
            } else {
                this.acceptHeaderValue = this.acceptHeaderValue + this.precedences[i];
            }
        }
    };
    RDFLoader.RDFLoader.prototype.registerParser = function(mediaType, parser) {
        this.parsers[mediaType] = parser;
        this.precedences.push(mediaType);
    };
    RDFLoader.RDFLoader.prototype.unregisterParser = function(mediaType) {
        delete this.parsers[mediaType];
        var mediaTypes = [];
        for(var i=0; i<this.precedences.length; i++) {
            if(this.precedences[i] != mediaType) {
                mediaTypes.push(this.precedences[i]);
            }
        }

        this.precedences = mediaTypes;
    };
    RDFLoader.RDFLoader.prototype.setAcceptHeaderPrecedence = function(mediaTypes) {
        this.precedences = mediaTypes;
    };
    RDFLoader.RDFLoader.prototype.load = function(uri, graph, callback) {
        var that = this;
        Loader({
            uri: uri,
            accept: this.acceptHeaderValue,
            success: function (err, data, status, xhr) {
                if(!err) {
                    //buster.log("DATA RETRIEVED");
                    var mime = getMime(xhr.getResponseHeader("Content-Type") || xhr.getResponseHeader("content-type"));
                    if(!mime || mime === "octet-stream") {
                        mime = GUtils.last(uri.split("."));
                    }
                    //buster.log("MIME", mime);
                    Parser(data, mime, {
                        graph: graph
                    }, function (graph) {
                        //buster.log("GRAPH", graph, graph.toQuads);
                        callback(true, graph.toQuads());
                    });
                } else {
                    callback(false, "Network error");
                }
            }
        });
    };
    RDFLoader.RDFLoader.prototype.tryToParse = function(parser, graph, input, callback) {
        try {
            if(typeof(input) === 'string') {
                input = Utils.normalizeUnicodeLiterals(input);
            }
            var parsed = parser.parse(input, graph);

            if(parsed != null) {
                callback(true, parsed);
            } else {
                callback(false, "parsing error");
            }
        } catch(e) {
            console.log(e.message);
            console.log(e.stack);
            callback(false, "parsing error with mime type : " + e);
        }
    };
    return RDFLoader;
});