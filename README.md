#graphitejs

A lightweight framework in JavaScript (JS) whose ultimate goal is to sport an intuitive and easy-to-use API for JS-developers, so that it can function as an introductory tool to Semantic Web (SW). The framework should work both clientside and serverside (w/[node.js](http://nodejs.org/)).

This work is part of the master thesis of [Arne Hassel](http://icanhasweb.wordpress.com/) ([wiki](https://wiki.uio.no/matnat/ifi/arnehass-master/index.php/Hovedside)), which is a work in progress.

For now the framework supports:

- Parsing and serializing [JSON-LD](http://json-ld.org/)
- Parsing and serializing [RDF/JSON](http://docs.api.talis.com/platform-api/output-types/rdf-json)
- Loading resources in frontend with [XMLHttpRequest Level 2](http://www.w3.org/TR/XMLHttpRequest/)

In the future, the hope is to support:

- Full-fledged engine for reasoning with graphs in RDF (perhaps by including [rdfstore-js](https://github.com/antoniogarrote/rdfstore-js))
- SPARQL (enabling querying toward the internal model, as well as external endpoints)
- Loading resources in backend
- Backup failure of loading external resource clientside by using a proxy-object toward the serverside-loader
- Be able to parse other serializations, such as [RDF/XML](http://www.w3.org/TR/REC-rdf-syntax/), [RDFa](http://www.w3.org/TR/rdfa-syntax/), and [Turtle](http://www.w3.org/TR/turtle/)

## Testing

The framework is built using the [TDD](http://en.wikipedia.org/wiki/Test-driven_development)-approach, which is enabled by [buster.js](http://busterjs.org/). The tests runs in both browsers and with node.js.
