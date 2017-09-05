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
var SALESFORCE_MOBILE_SDK_VERSION = "5.3.0";
var SERVICE = "com.salesforce.smartsync";

var exec = require("com.salesforce.util.exec").exec;
var defaultStoreConfig = {'isGlobalStore':false};

// Helper function to handle calls that don't specify storeConfig as first argument
// If missing, the caller is re-invoked with false prepended to the arguments list and true is returned
// Otherwise, false is returned
var checkFirstArg = function(argumentsOfCaller) {
    // Turning arguments into array
    var args = Array.prototype.slice.call(argumentsOfCaller);

    // If first argument is a store config
    if (typeof(args[0]) === "object" && args[0].hasOwnProperty("isGlobalStore")) {
         return false;
    }

    var isGlobalStore =  false;
    if (typeof(args[0]) === "boolean") {
       isGlobalStore = args.shift() || false;
    }
    args.unshift({'isGlobalStore': isGlobalStore});
    argumentsOfCaller.callee.apply(null, args);
    return true;
};



var syncDown = function(storeConfig, target, soupName, options, successCB, errorCB) {
    if (checkFirstArg(arguments)) return;
    exec(SALESFORCE_MOBILE_SDK_VERSION, successCB, errorCB, SERVICE,
         "syncDown",
         [{"target": target, "soupName": soupName, "options": options, "isGlobalStore": storeConfig.isGlobalStore, "storeName": storeConfig.storeName}]
        );
};

var reSync = function(storeConfig, syncId, successCB, errorCB) {
    if (checkFirstArg(arguments)) return;
    exec(SALESFORCE_MOBILE_SDK_VERSION, successCB, errorCB, SERVICE,
         "reSync",
         [{"syncId": syncId, "isGlobalStore": storeConfig.isGlobalStore, "storeName": storeConfig.storeName}]
        );
};

var cleanResyncGhosts = function(storeConfig, syncId, successCB, errorCB) {
    if (checkFirstArg(arguments)) return;
    exec(SALESFORCE_MOBILE_SDK_VERSION, successCB, errorCB, SERVICE,
         "cleanResyncGhosts",
         [{"syncId": syncId,  "isGlobalStore": storeConfig.isGlobalStore, "storeName": storeConfig.storeName}]
        );
};

var syncUp = function(storeConfig, target, soupName, options, successCB, errorCB) {
    if (checkFirstArg(arguments)) return;
    var args = Array.prototype.slice.call(arguments);
    // We accept syncUp(soupName, options, successCB, errorCB)
    if (typeof(args[1]) === "string") {
        target = {};
        soupName = args[1];
        options = args[2];
        successCB = args[3];
        errorCB = args[4];
    }
    // We accept syncUp(target, soupName, options, successCB, errorCB)
    if (typeof(args[1]) === "object") {
        target = args[1];
        soupName = args[2];
        options = args[3];
        successCB = args[4];
        errorCB = args[5];
    }
    target = target || {};

    exec(SALESFORCE_MOBILE_SDK_VERSION, successCB, errorCB, SERVICE,
         "syncUp",
         [{"target": target, "soupName": soupName, "options": options,  "isGlobalStore": storeConfig.isGlobalStore, "storeName": storeConfig.storeName}]
        );
};

var getSyncStatus = function(storeConfig, syncId, successCB, errorCB) {
    if (checkFirstArg(arguments, "boolean", false)) return;
    exec(SALESFORCE_MOBILE_SDK_VERSION, successCB, errorCB, SERVICE,
         "getSyncStatus",
         [{"syncId": syncId, "isGlobalStore": storeConfig.isGlobalStore, "storeName": storeConfig.storeName}]
        );
};

var MERGE_MODE = {
    OVERWRITE: "OVERWRITE",
    LEAVE_IF_CHANGED: "LEAVE_IF_CHANGED"
};


/**
 * Part of the module that is public
 */
module.exports = {
    MERGE_MODE: MERGE_MODE,
    syncDown: syncDown,
    syncUp: syncUp,
    getSyncStatus: getSyncStatus,
    reSync: reSync,
    cleanResyncGhosts: cleanResyncGhosts
};