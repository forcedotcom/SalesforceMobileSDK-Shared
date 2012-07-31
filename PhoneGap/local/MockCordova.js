/*
 * Copyright (c) 2012, salesforce.com, inc.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification, are permitted provided
 * that the following conditions are met:
 *
 * Redistributions of source code must retain the above copyright notice, this list of conditions and the
 * following disclaimer.
 *
 * Redistributions in binary form must reproduce the above copyright notice, this list of conditions and
 * the following disclaimer in the documentation and/or other materials provided with the distribution.
 *
 * Neither the name of salesforce.com, inc. nor the names of its contributors may be used to endorse or
 * promote products derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED
 * WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A
 * PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED
 * TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
 * HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 * NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */

/**
 * Mock Cordova: mocks just enough cordova functions to allow testing of plugins outside a container
 *
 */

(function(window) {
    var require,
    define;

    (function () {
        var modules = {};

        function build(module) {
            var factory = module.factory;
            module.exports = {};
            delete module.factory;
            factory(require, module.exports, module);
            return module.exports;
        }

        require = function (id) {
            if (!modules[id]) {
                throw "module " + id + " not found";
            }
            return modules[id].factory ? build(modules[id]) : modules[id].exports;
        };

        define = function (id, factory) {
            if (modules[id]) {
                throw "module " + id + " already defined";
            }

            modules[id] = {
                id: id,
                factory: factory
            };
        };

        define.remove = function (id) {
            delete modules[id];
        };

    })();

    define("cordova", function(require, exports, module) {
        var interceptors = {};

        // Method to provide an mock implementation for an container service/action
        // func should take three arguments: successCB, errorCB, args
        var interceptExec = function(service, action, func) {
            interceptors[service + ":" + action] = func;
        };

        // Mocking cordova's exec method by calling the functions registered with interceptExec
        var exec = function(successCB, errorCB, service, action, args) {
            console.log("cordova.exec " + service + ":" + action);
            var found = false;
            var req = service + ":" + action;
            for (var key in interceptors) {
                if (key === req) {
                    try { interceptors[key](successCB, errorCB, args); } catch (err) { errorCB(err); }
                    found = true;
                    break;
                }
            }

            if (!found) {
                console.log("No mock for " + service + ":" + action);
                return;
            }
        };

        module.exports = {
            exec: exec,
            define: define,
            require: require,

            // Only in mock
            interceptExec: interceptExec,
        };
    });

    window.cordova = require("cordova");

    define("cordova/exec", function(require, exports, module) {
        module.exports = cordova.exec;
    });

    define("cordova/builder", function(require, exports, module) {
        var utils = require('cordova/utils');

        function each(objects, func, context) {
            for (var prop in objects) {
                if (objects.hasOwnProperty(prop)) {
                    func.apply(context, [objects[prop], prop]);
                }
            }
        }

        function include(parent, objects, clobber, merge) {
            each(objects, function (obj, key) {
                try {
                    var result = obj.path ? require(obj.path) : {};

                    if (clobber) {
                        // Clobber if it doesn't exist.
                        if (typeof parent[key] === 'undefined') {
                            parent[key] = result;
                        } else if (typeof obj.path !== 'undefined') {
                            // If merging, merge properties onto parent, otherwise, clobber.
                            if (merge) {
                                recursiveMerge(parent[key], result);
                            } else {
                                parent[key] = result;
                            }
                        }
                        result = parent[key];
                    } else {
                        // Overwrite if not currently defined.
                        if (typeof parent[key] == 'undefined') {
                            parent[key] = result;
                        } else if (merge && typeof obj.path !== 'undefined') {
                            // If merging, merge parent onto result
                            recursiveMerge(result, parent[key]);
                            parent[key] = result;
                        } else {
                            // Set result to what already exists, so we can build children into it if they exist.
                            result = parent[key];
                        }
                    }

                    if (obj.children) {
                        include(result, obj.children, clobber, merge);
                    }
                } catch(e) {
                    utils.alert('Exception building cordova JS globals: ' + e + ' for key "' + key + '"');
                }
            });
        }

        /**
         * Merge properties from one object onto another recursively.  Properties from
         * the src object will overwrite existing target property.
         *
         * @param target Object to merge properties into.
         * @param src Object to merge properties from.
         */
        function recursiveMerge(target, src) {
            for (var prop in src) {
                if (src.hasOwnProperty(prop)) {
                    if (typeof target.prototype !== 'undefined' && target.prototype.constructor === target) {
                        // If the target object is a constructor override off prototype.
                        target.prototype[prop] = src[prop];
                    } else {
                        target[prop] = typeof src[prop] === 'object' ? recursiveMerge(
                            target[prop], src[prop]) : src[prop];
                    }
                }
            }
            return target;
        }

        module.exports = {
            build: function (objects) {
                return {
                    intoButDontClobber: function (target) {
                        include(target, objects, false, false);
                    },
                    intoAndClobber: function(target) {
                        include(target, objects, true, false);
                    },
                    intoAndMerge: function(target) {
                        include(target, objects, true, true);
                    }
                };
            }
        };

    });

})(window);

