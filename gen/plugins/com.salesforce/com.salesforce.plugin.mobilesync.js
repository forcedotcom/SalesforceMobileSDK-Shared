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
var SERVICE = "com.salesforce.mobilesync";

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
    // Else pre-pend store config and re-invoke caller
    else {
        var isGlobalStore =  false;
        // If first argument is just a boolean
        if (typeof(args[0]) === "boolean") {
            isGlobalStore = args.shift() || false;
        }
        // Pre-prending store config
        args.unshift({'isGlobalStore': isGlobalStore});
        argumentsOfCaller.callee.apply(null, args);
        return true;
    }
};

// Helper function to handle syncUp calls that don't specify a target as second argument
// If missing, the caller is re-invoked with target {} inserted as second argument and true is returned
// Otherwise, false is returned
var checkTargetArg = function(argumentsOfCaller) {
    // Turning arguments into array
    var args = Array.prototype.slice.call(argumentsOfCaller);

    // if (storeConfig, soupName, ...) change to (storeConfig, target, soupName, ...) with target = {}
    if (typeof(args[1]) === "string") {
        var arg0 = args.shift();
        args.unshift({});
        args.unshift(arg0);
        argumentsOfCaller.callee.apply(null, args);
        return true;
    }
    else {
        return false;
    }
}

// Helper function to handle syncUp/syncDown calls that don't specifiy a syncName argument
// If missing, the caller is re-invoked with syncName null inserted as last argument before callbacks and true is returned
// Otherwise, false is returned
var checkSyncNameArg = function(argumentsOfCaller) {
    // Turning arguments into array
    var args = Array.prototype.slice.call(argumentsOfCaller);

    // if (storeConfig, target, soupName, options, successCB, errorCB)
    // change to (storeConfig, target, soupName, options, syncName, successCB, errorCB) with syncName = null
    if (typeof(args[4]) === "function") {
        var storeConfig = args.shift();
        var target = args.shift();
        var soupName = args.shift();
        var options = args.shift();
        args.unshift(null);
        args.unshift(options);
        args.unshift(soupName);
        args.unshift(target);
        args.unshift(storeConfig);
        argumentsOfCaller.callee.apply(null, args);            
        return true;
    }
    else {
        return false;
    }
}

// Backwards compatibility: storeConfig is optional or could just be a boolean (isGlobalStore), syncName is optional
var syncDown = function(storeConfig, target, soupName, options, syncName, successCB, errorCB) {
    if (checkFirstArg(arguments)) return;    
    if (checkSyncNameArg(arguments)) return; 
    
    exec(SALESFORCE_MOBILE_SDK_VERSION, successCB, errorCB, SERVICE,
         "syncDown",
         [{"syncName": syncName, "target": target, "soupName": soupName, "options": options, "isGlobalStore": storeConfig.isGlobalStore, "storeName": storeConfig.storeName}]
        );
};

// Backwards compatibility: storeConfig is optional or could just be a boolean (isGlobalStore)
var reSync = function(storeConfig, syncIdOrName, successCB, errorCB) {
    if (checkFirstArg(arguments)) return;
    exec(SALESFORCE_MOBILE_SDK_VERSION, successCB, errorCB, SERVICE,
         "reSync",
         [{"syncId": typeof syncIdOrName === "string" ? null : syncIdOrName,
           "syncName": typeof syncIdOrName === "string" ? syncIdOrName : null,
           "isGlobalStore": storeConfig.isGlobalStore, "storeName": storeConfig.storeName}]
        );
};

// Backwards compatibility: storeConfig is optional or could just be a boolean (isGlobalStore)
var cleanResyncGhosts = function(storeConfig, syncId, successCB, errorCB) {
    if (checkFirstArg(arguments)) return;
    exec(SALESFORCE_MOBILE_SDK_VERSION, successCB, errorCB, SERVICE,
         "cleanResyncGhosts",
         [{"syncId": syncId,  "isGlobalStore": storeConfig.isGlobalStore, "storeName": storeConfig.storeName}]
        );
};

// Backwards compatibility: storeConfig is optional or could just be a boolean (isGlobalStore), target is optional, syncName is optional
var syncUp = function(storeConfig, target, soupName, options, syncName, successCB, errorCB) {
    if (checkFirstArg(arguments)) return;    
    if (checkTargetArg(arguments)) return;   
    if (checkSyncNameArg(arguments)) return; 
    
    target = target || {};

    exec(SALESFORCE_MOBILE_SDK_VERSION, successCB, errorCB, SERVICE,
         "syncUp",
         [{"syncName": syncName, "target": target, "soupName": soupName, "options": options,  "isGlobalStore": storeConfig.isGlobalStore, "storeName": storeConfig.storeName}]
        );
};

// Backwards compatibility: storeConfig is optional or could just be a boolean (isGlobalStore)
var getSyncStatus = function(storeConfig, syncIdOrName, successCB, errorCB) {
    if (checkFirstArg(arguments, "boolean", false)) return;
    // cordova can't return null, so {} is returned when sync is not found
    var wrappedSuccessCB = function(sync) {
        if(typeof successCB === "function") {
            successCB(sync._soupEntryId === undefined ? null : sync);
        }
    };
    exec(SALESFORCE_MOBILE_SDK_VERSION, wrappedSuccessCB, errorCB, SERVICE,
         "getSyncStatus",
         [{"syncId": typeof syncIdOrName === "string" ? null : syncIdOrName,
           "syncName": typeof syncIdOrName === "string" ? syncIdOrName : null,
           "isGlobalStore": storeConfig.isGlobalStore, "storeName": storeConfig.storeName}]
        );
};

// Backwards compatibility: storeConfig is optional or could just be a boolean (isGlobalStore)
var deleteSync = function(storeConfig, syncIdOrName, successCB, errorCB) {
    if (checkFirstArg(arguments, "boolean", false)) return;
    exec(SALESFORCE_MOBILE_SDK_VERSION, successCB, errorCB, SERVICE,
         "deleteSync",
         [{"syncId": typeof syncIdOrName === "string" ? null : syncIdOrName,
           "syncName": typeof syncIdOrName === "string" ? syncIdOrName : null,
           "isGlobalStore": storeConfig.isGlobalStore, "storeName": storeConfig.storeName}]
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
    cleanResyncGhosts: cleanResyncGhosts,
    deleteSync: deleteSync
};