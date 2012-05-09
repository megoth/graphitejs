/*global assert, buster, graphite, module, require*/
if (typeof module === "object" && typeof require === "function") {
    var buster = require("buster");
}

define([
    "src/rdfquery/datatype"
], function (typedValue) {
    buster.testCase("Graphite datatype", {
        setUp: function () {
            "use strict";
            this.xsdNs = "http://www.w3.org/2001/XMLSchema#";
        },
        "Errors": {
            "an unrecognised datatype": function () {
                "use strict";
                var v = typedValue(' true ', 'http://www.w3.org/2001/XMLSchemaboolean'); // note missing #
                assert.equals(v.representation, ' true ');
                assert.equals(v.datatype, 'http://www.w3.org/2001/XMLSchemaboolean');
                assert.equals(v.value, 'true');
            }
        },
        "XML Schema datatypes": {
            "a boolean value": function () {
                "use strict";
                var v = typedValue('true', this.xsdNs + 'boolean');
                assert.equals(v.value, true);
                assert.equals(v.representation, 'true');
                assert.equals(v.datatype, this.xsdNs + 'boolean');
            },
            "a double value": function () {
                "use strict";
                var v = typedValue('1.0e0', this.xsdNs + 'double');
                assert.equals(v.value, 1.0);
                assert.equals(v.representation, '1.0e0');
                assert.equals(v.datatype, this.xsdNs + 'double');
            },
            "an invalid duration": function () {
                "use strict";
                var xsdNs = this.xsdNs;
                assert.exception(function () {
                    typedValue('P', xsdNs + 'duration');
                });
            },
            "a standard dateTime": function () {
                "use strict";
                var v = typedValue('2008-10-05T21:02:00Z', this.xsdNs + 'dateTime');
                assert.equals(v.value, '2008-10-05T21:02:00Z');
                assert.equals(v.representation, '2008-10-05T21:02:00Z');
                assert.equals(v.datatype, this.xsdNs + 'dateTime');
            },
            "a dateTime with a timezone": function () {
                "use strict";
                var v = typedValue('2008-10-05T21:02:00-05:00', this.xsdNs + 'dateTime');
                assert.equals(v.value, '2008-10-05T21:02:00-05:00');
                assert.equals(v.representation, '2008-10-05T21:02:00-05:00');
                assert.equals(v.datatype, this.xsdNs + 'dateTime');
            },
            "a dateTime with an invalid timezone": function () {
                "use strict";
                var xsdNs = this.xsdNs;
                assert.exception(function () {
                    typedValue('2008-10-05T21:02:00-15:00', xsdNs + 'dateTime');
                });
            },
            "a dateTime with a bad number of days in a month": function () {
                "use strict";
                var xsdNs = this.xsdNs;
                assert.exception(function () {
                    typedValue('2009-02-29T21:02:00', xsdNs + 'dateTime');
                });
            },
            "a valid dateTime on a leap year": function () {
                "use strict";
                assert.defined(typedValue('2008-02-29T21:02:00', this.xsdNs + 'dateTime'));
            },
            "an invalid dateTime on a year divisible by 100": function () {
                "use strict";
                var xsdNs = this.xsdNs;
                assert.exception(function () {
                    var x = typedValue('1990-02-29T21:02:00', xsdNs + 'dateTime');
                });
            },
            "a valid dateTime on a leap year divisible by 400": function () {
                "use strict";
                assert.defined(typedValue('2008-02-29T21:02:00', this.xsdNs + 'dateTime'));
            },
            "a valid date with whitespace around it": function () {
                "use strict";
                assert.defined(typedValue(' 2009-07-13 ', this.xsdNs + 'date'));
            }
        }
    });
});