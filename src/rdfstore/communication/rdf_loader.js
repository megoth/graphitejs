define([
    "../../graphite/loader",
    "../../graphite/rdfparser",
    "../trees/utils",
    "../../graphite/utils"
], function (Loader, Parser, TreeUtils, Utils) {
    function getMime(responseHeader) {
        return responseHeader.split("application/")[1];
    }

    var RDFLoader = {};
    RDFLoader.RDFLoader = function () {
    //RDFLoader.RDFLoader = function (params) {
        /*
        var that = this;
        this.precedences = ["text/turtle", "text/n3", "application/json"];
        this.parsers = {
            "text/turtle": N3Parser.parser,
            "text/n3": N3Parser.parser,
            "application/json": JSONLDParser.parser
        };
        if (params != null) {
            TreeUtils.each(params["parsers"], function (mime) {
                that.parsers[mime] = params["parsers"][mime];
            });
        }
        if (params && params["precedences"] != null) {
            this.precedences = params["precedences"];
            TreeUtils.each(params["parsers"], function (mime) {
                if (!Utils.include(that.precedences, mime)) {
                    that.precedences.push(mime);
                }
            });
        }
        this.acceptHeaderValue = "";
        for (var i = 0; i < this.precedences.length; i++) {
            if (i != 0) {
                this.acceptHeaderValue = this.acceptHeaderValue + "," + this.precedences[i];
            } else {
                this.acceptHeaderValue = this.acceptHeaderValue + this.precedences[i];
            }
        }
        */
    };
    /*
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
     */
    RDFLoader.RDFLoader.prototype.load = function(uri, graph, callback) {
        //console.debug(graph);
        Loader({
            uri: uri,
            accept: this.acceptHeaderValue,
            success: function (err, data, status, xhr) {
                //console.log("RDFLOADER LOAD", data);
                if(!err) {
                    //console.log("DATA RETRIEVED");
                    var mime = getMime(xhr.getResponseHeader("Content-Type") || xhr.getResponseHeader("content-type"));
                    if(!mime || mime === "octet-stream") {
                        mime = Utils.last(uri.split("."));
                    }
                    //console.log("MIME", mime);
                    Parser(data, mime, {
                        graph: graph
                    }, function (graph) {
                        //console.log("GRAPH", graph, graph.toQuads);
                        callback(true, graph);
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
                input = TreeUtils.normalizeUnicodeLiterals(input);
            }
            var parsed = parser.parse(input, graph);

            if(parsed != null) {
                callback(true, parsed);
            } else {
                callback(false, "parsing error");
            }
        } catch(e) {
            //console.log(e.message);
            //console.log(e.stack);
            callback(false, "parsing error with mime type : " + e);
        }
    };
    return RDFLoader;
});