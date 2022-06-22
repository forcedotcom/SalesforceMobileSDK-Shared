/*
 * Copyright (c) 2012-present, salesforce.com, inc.
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

// Version this js was shipped with
var SALESFORCE_MOBILE_SDK_VERSION = "10.2.0";

var promiser = function(object, methodName, objectName) {
    var retfn = function () {
        var args = Array.prototype.slice.call(arguments);

        return new Promise(function(resolve, reject) {
            args.push(function() {
                console.debug("------> Calling successCB for " + objectName + ":" + methodName);
                try {
                    resolve.apply(null, arguments);
                }
                catch (err) {
                    console.error("------> Error when calling successCB for " + objectName + ":" + methodName);
                    console.error(err.stack);
                }
            });
            args.push(function() {
                console.debug("------> Calling errorCB for " + objectName + ":" + methodName);
                try {
                    reject.apply(null, arguments);
                }
                catch (err) {
                    console.error("------> Error when calling errorCB for " + objectName + ":" + methodName);
                    console.error(err.stack);
                }
            });
            console.debug("-----> Calling " + objectName + ":" + methodName);
            object[methodName].apply(object, args);
        });
    };
    return retfn;
};

/**
 * Part of the module that is public
 */
module.exports = {
    promiser: promiser,
};