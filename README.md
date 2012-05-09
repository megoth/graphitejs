#graphitejs

A framework in JavaScript (JS) whose ultimate goal is to sport an intuitive and easy-to-use API for JS-developers, so that it can function as an introductory tool to Semantic Web (SW). The framework should work both clientside and serverside (w/[node.js](http://nodejs.org/)).

This work is part of the master thesis of [Arne Hassel](http://icanhasweb.wordpress.com/) ([wiki](https://wiki.uio.no/matnat/ifi/arnehass-master/index.php/Hovedside)), which is a work in progress.

The framework is still in its early development, and there's much left. But for now it runs ~1750 assertions done by ~450 tests in ~40 test cases. Hopefully there will come a demonstrating application in the next 4 or 5 weeks (written May 9th).

For now the framework supports:

- Parsing and serializing [JSON-LD](http://json-ld.org/)
- Parsing and serializing [RDF/JSON](http://docs.api.talis.com/platform-api/output-types/rdf-json)
- Parsing [RDF/XML](http://www.w3.org/TR/REC-rdf-syntax/) (1)
- Parsing [Turtle](http://www.w3.org/TeamSubmission/turtle/) (1)
- Loading resources in frontend with [XMLHttpRequest Level 2](http://www.w3.org/TR/XMLHttpRequest/)
- Some support of [SPARQL](http://sparql.org/) (2)
- Some kinda Proxy-solution
- A static file server (needed for the tests)

Notes:

1) Supported by [rdfquery](http://code.google.com/p/rdfquery/)
2) Supported by [JS RDF Store](https://github.com/antoniogarrote/rdfstore-js)

The framework is built using the [TDD](http://en.wikipedia.org/wiki/Test-driven_development)-approach, which is enabled by [buster.js](http://busterjs.org/). The tests runs in both browsers and with node.js.

## Running the tests

In order to run the tests, you need to have Buster.JS installed (I'm running it on node@0.7.3-pre). The framework is constructed for client-use (browser), so you need to run "buster server". In addition, since many tests depend on a static file server being run, you need to run the static file server ("node static.js"). There's also a test requiring the proxy server, so run that as well ("node proxy.js"). Now, since it's a hassle to start all this services in order to run your tests, I've added server.js, which starts all services. So, to conclude, simply run "node server.js", capture the browser and start testing.