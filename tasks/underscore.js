/*
 * grunt-underscore-compiler
 * 
 *
 * Copyright (c) 2014 bubkoo
 * Licensed under the MIT license.
 */

'use strict';

var _ = require('underscore');

module.exports = function (grunt) {
    // Please see the Grunt documentation for more information regarding task
    // creation: http://gruntjs.com/creating-tasks

    grunt.registerMultiTask('underscore', 'Compile underscore templates into JavaScript files.', function () {
        // Merge task-specific and/or target-specific options with these defaults.
        var options = this.options({
            separator: grunt.util.linefeed + grunt.util.linefeed,
            indent: '    ',
            quoteChar: '\'',
            raw: true,
            namespace: 'app.tpl',
            global: 'this',
            amd: false,
            compile: false,

            templateSettings: {}
        });

        var filesCount = 0;
        var quoteChar = options.quoteChar;
        var processName = options.processName || defaultProcessName;
        var hasNamespace = options.namespace !== false;
        var isNamespaceFn = _.isFunction(options.namespace);
        var nsObject;

        if (hasNamespace && !isNamespaceFn) {
            nsObject = nsDeclare(options.namespace, options.global, options.quoteChar);
        }

        // Iterate over all specified file groups.
        this.files.forEach(function (f) {
            var nsDefined = [];
            var nsConflict = [];
            var isFirstDefine = true;

            var result = f.src.filter(function (filepath) {
                // Warn on and remove invalid source files (if nonull was set).
                if (!grunt.file.exists(filepath)) {
                    grunt.log.warn('Source file "' + filepath + '" not found.');
                    return false;
                } else {
                    return true;
                }
            }).map(function (filepath) {
                // Read file source.
                var source = grunt.file.read(filepath);
                var result;
                if (options.compile === true) {
                    result = _.template(source, options.templateSettings).source;
                    result = result.replace(/\r?\n/g, '');
                    result += ';';
                } else {
                    result = html2string(source, quoteChar, options.raw,
                            options.amd || hasNamespace ? options.indent + options.indent : '');
                    result = quoteChar + result + quoteChar + ';';
                }


                // Handle namespace
                var namespace;
                var nsDefine = '';
                if (hasNamespace) {
                    if (isNamespaceFn) {
                        nsObject = nsDeclare(
                            options.namespace(filepath),
                            options.global,
                            quoteChar);
                    }

                    if (isNamespaceFn || isFirstDefine) {
                        nsObject.defines.forEach(function (df) {
                            if (nsDefined.indexOf(df) === -1) {
                                nsDefined.push(df);

                                // Set indent
                                if (options.amd) {
                                    nsDefine += options.indent;
                                }

                                nsDefine += df + grunt.util.linefeed;
                            }
                        });
                        nsDefine += grunt.util.linefeed;
                        isFirstDefine = false
                    }

                    if (nsConflict.indexOf(nsObject.namespace) === -1) {
                        nsConflict.push(nsObject.namespace);
                    }

                    namespace = nsObject.namespace +
                        '[' + quoteChar + processName(filepath) + quoteChar + '] = ';

                    // Set indent
                    if (options.amd) {
                        namespace = options.indent + namespace;
                    }

                    result = nsDefine + namespace + result;
                }

                if (options.amd && !hasNamespace) {
                    result = options.indent + 'return ' + result;
                }

                return result;

            }).join(grunt.util.normalizelf(options.separator));


            var modules;
            var amdString;

            if (options.amd) {
                amdString = 'define(';
                if (typeof options.amd === 'boolean') {
                    modules = [];
                } else if (typeof options.amd === 'string') {
                    modules = [options.amd];
                } else if (Array.isArray(options.amd)) {
                    modules = options.amd;
                }

                var length = modules.length;
                if (length) {
                    amdString += '[';
                    amdString += quoteChar + modules.join(quoteChar + ', ' + quoteChar) + quoteChar;
                    amdString += '], ';
                }
                amdString += 'function (';
                amdString += modules.join(', ');
                amdString += ') {' + grunt.util.linefeed;

                result = amdString + result;

                if (hasNamespace) {
                    result += grunt.util.linefeed;
                    result += grunt.util.linefeed;
                    result += options.indent + 'return ' + getTopNamespace(nsConflict) + ';';
                }

                result += grunt.util.linefeed;
                result += '});';
            }

            filesCount++;
            // Write the destination file.
            grunt.file.write(f.dest, result);
            grunt.verbose.writeln('File ' + f.dest + ' created.');
        });
        // Print a success message.
        grunt.log.ok(filesCount + ' ' + grunt.util.pluralize(filesCount, 'file/files') + ' created.');
    });

    // Helpers
    // -------
    function html2string(html, quoteChar, raw, indent) {
        var line;
        var rBase = new RegExp('\\\\', 'g');
        var rQuote = new RegExp('\\' + quoteChar, 'g');

        if (raw) {
            // Keep line break
            line = '\\n' + quoteChar + ' +' + grunt.util.linefeed + indent + quoteChar;
        } else {
            line = '\\n';
        }

        return html
            .replace(rBase, '\\\\')
            .replace(rQuote, '\\' + quoteChar)
            .replace(/\r?\n/g, line);
    }

    function nsDeclare(ns, root, quoteChar) {
        var result = {
            namespace: root,
            defines: []
        };
        if (ns) {
            var parts = ns.split('.');
            var namespace = root;
            if (parts[0] === root) {
                parts.shift();
            }

            var defines = parts.map(function (part) {
                namespace = namespace + '[' + quoteChar + part + quoteChar + ']';
                return namespace + ' = ' + namespace + ' || {};'
            });

            result.namespace = namespace;
            result.defines = defines;
        }
        return result;
    }

    function getTopNamespace(namespaces) {

        // this[app][tpl] => this[app][tpl]
        // this[app][tpl1], this[app][tpl2] => this[app]
        // this[app1][tpl], this[app2][tpl] => this
        var length = namespaces.length;
        if (length === 1) {
            return namespaces[0];
        }
        var parts = [];
        var sections = namespaces.map(function (ns) {
            return ns.split('[');
        });

        var part;
        var matched;
        for (var i = 0, l = sections[0].length; i < l; i++) {

            part = sections[0][i];

            for (var j = 1, k = length; j < k; j++) {
                if (i > sections[j].length - 1) {
                    matched = false;
                    break;
                }
                matched = part === sections[j][i];
                if (!matched) {
                    break;
                }
            }
            if (matched) {
                parts.push(part);
            } else {
                break;
            }
        }

        return parts.join('[');
    }

    // filename conversion for templates
    function defaultProcessName(name) {
        return name;
    }
};
