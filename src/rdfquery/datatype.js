define([
    "./uri"
], function (URI) {
    var defaults = {
            namespaces: {}
        },
        /*
         * jQuery CURIE @VERSION
         *
         * Copyright (c) 2008,2009 Jeni Tennison
         * Licensed under the MIT (MIT-LICENSE.txt)
         *
         * Depends:
         *  jquery.uri.js
         */
        /**
         * @fileOverview XML Schema datatype handling
         * @author <a href="mailto:jeni@jenitennison.com">Jeni Tennison</a>
         * @copyright (c) 2008,2009 Jeni Tennison
         * @license MIT license (MIT-LICENSE.txt)
         * @version 1.0
         * @requires jquery.uri.js
         */
        strip = function (value) {
            return value.replace(/[ \t\n\r]+/, ' ').replace(/^ +/, '').replace(/ +$/, '');
        },
        /**
         * An object that holds the datatypes supported by the script. The properties of this object are the URIs of the datatypes, and each datatype has four properties:
         * <dl>
         *   <dt>strip</dt>
         *   <dd>A boolean value that indicates whether whitespace should be stripped from the value prior to testing against the regular expression or passing to the value function.</dd>
         *   <dt>regex</dt>
         *   <dd>A regular expression that valid values of the type must match.</dd>
         *   <dt>validate</dt>
         *   <dd>Optional. A function that performs further testing on the value.</dd>
         *   <dt>value</dt>
         *   <dd>A function that returns a Javascript object equivalent for the value.</dd>
         * </dl>
         * You can add to this object as necessary for your own datatypes, and {@link jQuery.typedValue} and {@link jQuery.typedValue.valid} will work with them.
         * @see jQuery.typedValue
         * @see jQuery.typedValue.valid
         */
        datatypeAnyUri = {
            regex: /^.*$/,
            strip: true,
            /** @ignore */
            value: function (v, options) {
                var opts = graphite.extend({}, defaults, options);
                return URI.resolve(v, opts.base);
            }
        },
        datatypeBoolean = {
            regex: /^(?:true|false|1|0)$/,
            strip: true,
            /** @ignore */
            value: function (v) {
                return v === 'true' || v === '1';
            }
        },
        datatypeDate = {
            regex: /^(-?[0-9]{4,})-([0-9]{2})-([0-9]{2})((?:[\-\+]([0-9]{2}):([0-9]{2}))|Z)?$/,
            /** @ignore */
            validate: function (v) {
                var
                    m = this.regex.exec(v),
                    year = parseInt(m[1], 10),
                    month = parseInt(m[2], 10),
                    day = parseInt(m[3], 10),
                    tz = m[10] === undefined || m[10] === 'Z' ? '+0000' : m[10].replace(/:/, '');
                if (year === 0 ||
                    month > 12 ||
                    day > 31 ||
                    parseInt(tz, 10) < -1400 || parseInt(tz, 10) > 1400) {
                    return false;
                } else {
                    return true;
                }
            },
            strip: true,
            /** @ignore */
            value: function (v) {
                return v;
            }
        },
        datatypeDatetime = {
            regex: /^(-?[0-9]{4,})-([0-9]{2})-([0-9]{2})T([0-9]{2}):([0-9]{2}):(([0-9]{2})(\.([0-9]+))?)((?:[\-\+]([0-9]{2}):([0-9]{2}))|Z)?$/,
            /** @ignore */
            validate: function (v) {
                var
                    m = this.regex.exec(v),
                    year = parseInt(m[1], 10),
                    tz = m[10] === undefined || m[10] === 'Z' ? '+0000' : m[10].replace(/:/, ''),
                    date;
                if (year === 0 ||
                    parseInt(tz, 10) < -1400 || parseInt(tz, 10) > 1400) {
                    return false;
                }
                try {
                    year = year < 100 ? Math.abs(year) + 1000 : year;
                    month = parseInt(m[2], 10);
                    day = parseInt(m[3], 10);
                    if (day > 31) {
                        return false;
                    } else if (day > 30 && !(month === 1 || month === 3 || month === 5 || month === 7 || month === 8 || month === 10 || month === 12)) {
                        return false;
                    } else if (month === 2) {
                        if (day > 29) {
                            return false;
                        } else if (day === 29 && (year % 4 !== 0 || (year % 100 === 0 && year % 400 !== 0))) {
                            return false;
                        }
                    }
                    date = '' + year + '/' + m[2] + '/' + m[3] + ' ' + m[4] + ':' + m[5] + ':' + m[7] + ' ' + tz;
                    date = new Date(date);
                    return true;
                } catch (e) {
                    return false;
                }
            },
            strip: true,
            /** @ignore */
            value: function (v) {
                return v;
            }
        },
        datatypeDecimal = {
            regex: /^[\-\+]?(?:[0-9]+\.[0-9]*|\.[0-9]+|[0-9]+)$/,
            strip: true,
            /** @ignore */
            value: function (v) {
                v = v.replace(/^0+/, '')
                    .replace(/0+$/, '');
                if (v === '') {
                    v = '0.0';
                }
                if (v.substring(0, 1) === '.') {
                    v = '0' + v;
                }
                if (/\.$/.test(v)) {
                    v = v + '0';
                } else if (!/\./.test(v)) {
                    v = v + '.0';
                }
                return v;
            }
        },
        datatypeDuration = {
            regex: /^([\-\+])?P(?:([0-9]+)Y)?(?:([0-9]+)M)?(?:([0-9]+)D)?(?:T(?:([0-9]+)H)?(?:([0-9]+)M)?(?:([0-9]+(?:\.[0-9]+)?)?S)?)$/,
            /** @ignore */
            validate: function (v) {
                var m = this.regex.exec(v);
                return m[2] || m[3] || m[4] || m[5] || m[6] || m[7];
            },
            strip: true,
            /** @ignore */
            value: function (v) {
                return v;
            }
        },
        datatypeFloat = {
                regex: /^(?:[\-\+]?(?:[0-9]+\.[0-9]*|\.[0-9]+|[0-9]+)(?:[eE][\-\+]?[0-9]+)?|[\-\+]?INF|NaN)$/,
                strip: true,
                /** @ignore */
                value: function (v) {
                    if (v === '-INF') {
                        return -1 / 0;
                    } else if (v === 'INF' || v === '+INF') {
                        return 1 / 0;
                    } else {
                        return parseFloat(v);
                    }
                }
        },
        datatypeGregorianMonthDay = {
            regex: /^--([0-9]{2})-([0-9]{2})((?:[\-\+]([0-9]{2}):([0-9]{2}))|Z)?$/,
            /** @ignore */
            validate: function (v) {
                var
                    m = this.regex.exec(v),
                    month = parseInt(m[1], 10),
                    day = parseInt(m[2], 10),
                    tz = m[3] === undefined || m[3] === 'Z' ? '+0000' : m[3].replace(/:/, '');
                if (month > 12 ||
                    day > 31 ||
                    parseInt(tz, 10) < -1400 || parseInt(tz, 10) > 1400) {
                    return false;
                } else if (month === 2 && day > 29) {
                    return false;
                } else if ((month === 4 || month === 6 || month === 9 || month === 11) && day > 30) {
                    return false;
                } else {
                    return true;
                }
            },
            strip: true,
            /** @ignore */
            value: function (v) {
                return v;
            }
        },
        datatypeGregorianYear = {
            regex: /^-?([0-9]{4,})$/,
            /** @ignore */
            validate: function (v) {
                var i = parseInt(v, 10);
                return i !== 0;
            },
            strip: true,
            /** @ignore */
            value: function (v) {
                return parseInt(v, 10);
            }
        },
        datatypeInteger = {
            regex: /^[\-\+]?[0-9]+$/,
            strip: true,
            /** @ignore */
            value: function (v) {
                return parseInt(v, 10);
            }
        },
        datatypeNCName = {
            regex: /^[a-z_][-\.a-z0-9]+$/i,
            strip: true,
            /** @ignore */
            value: function (v) {
                return strip(v);
            }
        },
        datatypeString = {
            regex: /^.*$/,
            strip: false,
            /** @ignore */
            value: function (v) {
                return v;
            }
        },
        datatypeToken = {
            regex: /^.*$/,
            strip: true,
            /** @ignore */
            value: function (v) {
                return strip(v);
            }
        },
        datatypeXmlLiteral = {
            regex: /^.*$/m,
            strip: false,
            value: function (v) {
                return v;
            }
        },
        datatypeYearMonthDuration = {
            regex: /^([\-\+])?P(?:([0-9]+)Y)?(?:([0-9]+)M)?$/,
            /** @ignore */
            validate: function (v) {
                var m = this.regex.exec(v);
                return m[2] || m[3];
            },
            strip: true,
            /** @ignore */
            value: function (v) {
                var m = this.regex.exec(v),
                    years = m[2] || 0,
                    months = m[3] || 0;
                months += years * 12;
                return m[1] === '-' ? -1 * months : months;
            }
        },
        types = {
            'http://www.w3.org/2001/XMLSchema#anyURI': datatypeAnyUri,
            'http://www.w3.org/2001/XMLSchema#boolean': datatypeBoolean,
            'http://www.w3.org/2001/XMLSchema#date': datatypeDate,
            'http://www.w3.org/2001/XMLSchema#dateTime': datatypeDatetime,
            'http://www.w3.org/2001/XMLSchema#decimal': datatypeDecimal,
            'http://www.w3.org/2001/XMLSchema#duration': datatypeDuration,
            'http://www.w3.org/2001/XMLSchema#double': datatypeFloat,
            'http://www.w3.org/2001/XMLSchema#float': datatypeFloat,
            'http://www.w3.org/2001/XMLSchema#gMonthDay': datatypeGregorianMonthDay,
            'http://www.w3.org/2001/XMLSchema#gYear': datatypeGregorianYear,
            'http://www.w3.org/2001/XMLSchema#int': datatypeInteger,
            'http://www.w3.org/2001/XMLSchema#integer': datatypeInteger,
            'http://www.w3.org/2001/XMLSchema#NCName': datatypeNCName,
            'http://www.w3.org/2001/XMLSchema#string': datatypeString,
            'http://www.w3.org/2001/XMLSchema#token': datatypeToken,
            'http://www.w3.org/1999/02/22-rdf-syntax-ns#XMLLiteral': datatypeXmlLiteral,
            'http://www.w3.org/2001/XMLSchema#yearMonthDuration': datatypeYearMonthDuration
        },
        /**
         * Checks whether a value is valid according to a given datatype. The datatype must be held in the {@link jQuery.types} object.
         * @param {String} value The value to validate.
         * @param {String} datatype The URI for the datatype against which the value will be validated.
         * @returns {boolean} True if the value is valid or the datatype is not recognised.
         * @example validDate = $.typedValue.valid(date, 'http://www.w3.org/2001/XMLSchema#date');
         */
        valid = function (value, datatype) {
            var d = types[datatype];
            if (d === undefined) {
                return true;
            }
            value = d.strip ? strip(value) : value;
            if (d.regex.test(value)) {
                return d.validate === undefined ? true : d.validate(value);
            } else {
                return false;
            }
        },
        /**
         * Creates a new jQuery.typedValue object. This should be invoked as a method
         * rather than constructed using new.
         * @class Represents a value with an XML Schema datatype
         * @param {String} value The string representation of the value
         * @param {String} datatype The XML Schema datatype URI
         * @returns {jQuery.typedValue}
         * @example intValue = jQuery.typedValue('42', 'http://www.w3.org/2001/XMLSchema#integer');
         */
        typedValue = function (value, datatype) {
            var d = types[datatype];
            if (valid(value, datatype)) {
                return {
                    /**
                     * The XML Schema datatype URI for the value's datatype
                     * @memberOf jQuery.typedValue#
                     */
                    datatype: datatype,
                    /**
                     * The string representation of the value
                     * @memberOf jQuery.typedValue#
                     */
                    representation: value,
                    /**
                     * The value as an object. The type of the object will
                     * depend on the XML Schema datatype URI specified
                     * in the constructor. The following table lists the mappings
                     * currently supported:
                     * <table>
                     *   <tr>
                     *   <th>XML Schema Datatype</th>
                     *   <th>Value type</th>
                     *   </tr>
                     *   <tr>
                     *     <td>http://www.w3.org/2001/XMLSchema#string</td>
                     *     <td>string</td>
                     *   </tr>
                     *   <tr>
                     *     <td>http://www.w3.org/2001/XMLSchema#token</td>
                     *     <td>string</td>
                     *   </tr>
                     *   <tr>
                     *     <td>http://www.w3.org/2001/XMLSchema#NCName</td>
                     *     <td>string</td>
                     *   </tr>
                     *   <tr>
                     *     <td>http://www.w3.org/2001/XMLSchema#boolean</td>
                     *     <td>bool</td>
                     *   </tr>
                     *   <tr>
                     *     <td>http://www.w3.org/2001/XMLSchema#decimal</td>
                     *     <td>string</td>
                     *   </tr>
                     *   <tr>
                     *     <td>http://www.w3.org/2001/XMLSchema#integer</td>
                     *     <td>int</td>
                     *   </tr>
                     *   <tr>
                     *     <td>http://www.w3.org/2001/XMLSchema#int</td>
                     *     <td>int</td>
                     *   </tr>
                     *   <tr>
                     *     <td>http://www.w3.org/2001/XMLSchema#float</td>
                     *     <td>float</td>
                     *   </tr>
                     *   <tr>
                     *     <td>http://www.w3.org/2001/XMLSchema#double</td>
                     *     <td>float</td>
                     *   </tr>
                     *   <tr>
                     *     <td>http://www.w3.org/2001/XMLSchema#dateTime</td>
                     *     <td>string</td>
                     *   </tr>
                     *   <tr>
                     *     <td>http://www.w3.org/2001/XMLSchema#date</td>
                     *     <td>string</td>
                     *   </tr>
                     *   <tr>
                     *     <td>http://www.w3.org/2001/XMLSchema#gYear</td>
                     *     <td>int</td>
                     *   </tr>
                     *   <tr>
                     *     <td>http://www.w3.org/2001/XMLSchema#gMonthDay</td>
                     *     <td>string</td>
                     *   </tr>
                     *   <tr>
                     *     <td>http://www.w3.org/2001/XMLSchema#anyURI</td>
                     *     <td>{@link jQuery.uri}</td>
                     *   </tr>
                     * </table>
                     * @memberOf jQuery.typedValue#
                     */
                    value: d === undefined ? strip(value) : d.value(d.strip ? strip(value) : value)
                };
            }
            throw {
                name: 'InvalidValue',
                message: value + ' is not a valid ' + datatype + ' value'
            };
        };
    typedValue.valid = valid;
    return typedValue;
});