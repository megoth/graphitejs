importScripts('../../lib/require.js');

require({
        baseUrl: "./"
    },
    ["graph"],
    function (Graph) {
        self.addEventListener('message', function(e) {
            var data = e.data;
            switch (data["cmd"]) {
                case 'query':
                    self.postMessage({
                        query: data.query
                    });
                    break;
                case 'size':
                    self.postMessage("SIZE");
                    break;
                default:
                    self.postMessage("UNKNOWN COMMAND");
            }
        }, false);
    });