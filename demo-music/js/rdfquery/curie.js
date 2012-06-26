define([
    "./uri",
    "./../graphite/utils"
], function (URI, Utils) {
    /*
     * jQuery CURIE @VERSION
     *
     * Copyright (c) 2008,2009 Jeni Tennison
     * Licensed under the MIT (MIT-LICENSE.txt)
     *
     * Depends:
     *  jquery.uri.js
     *  jquery.xmlns.js
     *  
     * @fileOverview jQuery CURIE handling
     * @author <a href="mailto:jeni@jenitennison.com">Jeni Tennison</a>
     * @copyright (c) 2008,2009 Jeni Tennison
     * @license MIT license (MIT-LICENSE.txt)
     * @version 1.0
     * @requires jquery.uri.js
     * @requires jquery.xmlns.js
     * 
     * Creates a {@link jQuery.uri} object by parsing a CURIE.
     * @methodOf jQuery
     * @param {String} curie The CURIE to be parsed
     * @param {String} uri The URI string to be converted to a CURIE.
     * @param {Object} [options] CURIE parsing options
     * @param {string} [options.reservedNamespace='http://www.w3.org/1999/xhtml/vocab#'] The namespace to apply to a CURIE that has no prefix and either starts with a colon or is in the list of reserved local names
     * @param {string} [options.defaultNamespace]  The namespace to apply to a CURIE with no prefix which is not mapped to the reserved namespace by the rules given above.
     * @param {Object} [options.namespaces] A map of namespace bindings used to map CURIE prefixes to URIs.
     * @param {string[]} [options.reserved=['alternate', 'appendix', 'bookmark', 'cite', 'chapter', 'contents', 'copyright', 'first', 'glossary', 'help', 'icon', 'index', 'last', 'license', 'meta', 'next', 'p3pv1', 'prev', 'role', 'section', 'stylesheet', 'subsection', 'start', 'top', 'up']] A list of local names that will always be mapped to the URI specified by reservedNamespace.
     * @param {string} [options.charcase='lower'] Specifies whether the curie's case is altered before it's interpreted. Acceptable values are:
     * <dl>
     * <dt>lower</dt><dd>Force the CURIE string to lower case.</dd>
     * <dt>upper</dt><dd>Force the CURIE string to upper case.</dd>
     * <dt>preserve</dt><dd>Preserve the original case of the CURIE. Note that this might not be possible if the CURIE has been taken from an HTML attribute value because of the case conversions performed automatically by browsers. For this reason, it's a good idea to avoid mixed-case CURIEs within RDFa.</dd>
     * </dl>
     * @returns {jQuery.uri} A new {@link jQuery.uri} object representing the full absolute URI specified by the CURIE.
     */
    var Curie = function (curie, options) {
        var opts = Utils.extend({}, Curie.defaults, options || {}),
            m = /^(([^:]*):)?(.+)$/.exec(curie),
            prefix = m[2],
            local = m[3],
            ns = opts.namespaces[prefix];
        if (/^:.+/.test(curie)) { // This is the case of a CURIE like ":test"
            if (opts.reservedNamespace === undefined || opts.reservedNamespace === null) {
                throw "Malformed CURIE: No prefix and no default namespace for unprefixed CURIE " + curie;
            } else {
                ns = opts.reservedNamespace;
            }
        } else if (prefix) {
            if (ns === undefined) {
                throw "Malformed CURIE: No namespace binding for " + prefix + " in CURIE " + curie;
            }
        } else {
            if (opts.charcase === 'lower') {
                curie = curie.toLowerCase();
            } else if (opts.charcase === 'upper') {
                curie = curie.toUpperCase();
            }
            if (opts.reserved.length && Utils.indexOf(curie, opts.reserved) >= 0) {
                ns = opts.reservedNamespace;
                local = curie;
            } else if (opts.defaultNamespace === undefined || opts.defaultNamespace === null) {
                // the default namespace is provided by the application; it's not clear whether
                // the default XML namespace should be used if there's a colon but no prefix
                throw "Malformed CURIE: No prefix and no default namespace for unprefixed CURIE " + curie;
            } else {
                ns = opts.defaultNamespace;
            }
        }
        return URI(ns + local);
    };

    Curie.defaults = {
        namespaces: {
            xhv: "http://www.w3.org/1999/xhtml/vocab#",
            dc: "http://purl.org/dc/elements/1.1/",
            foaf: "http://xmlthis.ns.com/foaf/0.1/",
            cc: "http://creativecommothis.ns.org/ns#",
            "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
            "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
            "xsd": "http://www.w3.org/TR/xmlschema-2/#"
        },
        reserved: ['alternate', 'appendix', 'bookmark', 'cite', 'chapter', 'contents', 'copyright',
            'first', 'glossary', 'help', 'icon', 'index', 'last', 'license', 'meta', 'next',
            'p3pv1', 'prev', 'role', 'section', 'stylesheet', 'subsection', 'start', 'top', 'up'],
        reservedNamespace: "http://www.w3.org/1999/xhtml/vocab#",
        defaultNamespace: undefined,
        charcase: 'preserve'
    };

    /**
     * Creates a {@link jQuery.uri} object by parsing a safe CURIE string (a CURIE
     * contained within square brackets). If the input safeCurie string does not
     * start with '[' and end with ']', the entire string content will be interpreted
     * as a URI string.
     * @methodOf jQuery
     * @param {String} safeCurie The safe CURIE string to be parsed.
     * @param {Object} [options] CURIE parsing options
     * @param {string} [options.reservedNamespace='http://www.w3.org/1999/xhtml/vocab#'] The namespace to apply to a CURIE that has no prefix and either starts with a colon or is in the list of reserved local names
     * @param {string} [options.defaultNamespace]  The namespace to apply to a CURIE with no prefix which is not mapped to the reserved namespace by the rules given above.
     * @param {Object} [options.namespaces] A map of namespace bindings used to map CURIE prefixes to URIs.
     * @param {string[]} [options.reserved=['alternate', 'appendix', 'bookmark', 'cite', 'chapter', 'contents', 'copyright',
     'first', 'glossary', 'help', 'icon', 'index', 'last', 'license', 'meta', 'next',
     'p3pv1', 'prev', 'role', 'section', 'stylesheet', 'subsection', 'start', 'top', 'up']]
     A list of local names that will always be mapped to the URI specified by reservedNamespace.
     * @param {string} [options.charcase='lower'] Specifies whether the curie's case is altered before it's interpreted. Acceptable values are:
     * <dl>
     * <dt>lower</dt><dd>Force the CURIE string to lower case.</dd>
     * <dt>upper</dt><dd>Force the CURIE string to upper case.</dd>
     * <dt>preserve</dt><dd>Preserve the original case of the CURIE. Note that this might not be possible if the CURIE has been taken from an HTML attribute value because of the case conversions performed automatically by browsers. For this reason, it's a good idea to avoid mixed-case CURIEs within RDFa.</dd>
     * </dl>
     * @returns {jQuery.uri} A new {@link jQuery.uri} object representing the full absolute URI specified by the CURIE.
     */
    Curie.safeCurie = function (safeCurie, options) {
        var m = /^\[([^\]]+)\]$/.exec(safeCurie);
        return m ? Curie(m[1], options) : URI(safeCurie);
    };

    /**
     * Creates a CURIE string from a URI string.
     * @methodOf jQuery
     * @param {String} uri The URI string to be converted to a CURIE.
     * @param {Object} [options] CURIE parsing options
     * @param {string} [options.reservedNamespace='http://www.w3.org/1999/xhtml/vocab#']
     *        If the input URI starts with this value, the generated CURIE will
     *        have no namespace prefix and will start with a colon character (:),
     *        unless the local part of the CURIE is one of the reserved names specified
     *        by the reservedNames option (see below), in which case the generated
     *        CURIE will have no namespace prefix and will not start with a colon
     *        character.
     * @param {string} [options.defaultNamespace]  If the input URI starts with this value, the generated CURIE will have no namespace prefix and will not start with a colon.
     * @param {Object} [options.namespaces] A map of namespace bindings used to map CURIE prefixes to URIs.
     * @param {string[]} [options.reserved=['alternate', 'appendix', 'bookmark', 'cite', 'chapter', 'contents', 'copyright',
     'first', 'glossary', 'help', 'icon', 'index', 'last', 'license', 'meta', 'next',
     'p3pv1', 'prev', 'role', 'section', 'stylesheet', 'subsection', 'start', 'top', 'up']]
     A list of local names that will always be mapped to the URI specified by reservedNamespace.
     * @param {string} [options.charcase='lower'] Specifies the case normalisation done to the CURIE. Acceptable values are:
     * <dl>
     * <dt>lower</dt><dd>Normalise the CURIE to lower case.</dd>
     * <dt>upper</dt><dd>Normalise the CURIE to upper case.</dd>
     * <dt>preserve</dt><dd>Preserve the original case of the CURIE. Note that this might not be possible if the CURIE has been taken from an HTML attribute value because of the case conversions performed automatically by browsers. For this reason, it's a good idea to avoid mixed-case CURIEs within RDFa.</dd>
     * </dl>
     * @returns {jQuery.uri} A new {@link jQuery.uri} object representing the full absolute URI specified by the CURIE.
     */
    Curie.createCurie = function (uri, options) {
        var opts = Utils.extend({}, Curie.defaults, options || {}),
            ns = opts.namespaces,
            curie   ;
        uri = URI(uri).toString();
        if (opts.reservedNamespace !== undefined && uri.substring(0, opts.reservedNamespace.toString().length) === opts.reservedNamespace.toString()) {
            curie = uri.substring(opts.reservedNamespace.toString().length);
            if (Utils.indexOf(opts.reserved, curie) === -1) {
                curie = ':' + curie;
            }
        } else {
            Utils.each(ns, function (namespace, prefix) {
                if (uri.substring(0, namespace.toString().length) === namespace.toString()) {
                    curie = prefix + ':' + uri.substring(namespace.toString().length);
                    return null;
                }
            });
        }
        if (curie === undefined) {
            throw "No Namespace Binding: There's no appropriate namespace binding for generating a CURIE from " + uri;
        } else {
            return curie;
        }
    };
    return Curie;
});