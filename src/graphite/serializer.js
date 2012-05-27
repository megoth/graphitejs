
define([
    "./serializer/sparql",
    "./utils"
], function (Sparql) {
    var formats = {
        "sparql": Sparql
    };
    return function (input, format, options) {
        if(formats[format]) {
            return formats[format](input, options);
        }
        throw "The requested format " + format + " isn't supported!";
    };
});