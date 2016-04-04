/*
 * Copyright (c) 2012-15, salesforce.com, inc.
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
var SALESFORCE_MOBILE_SDK_VERSION = "4.1.0";

/**
 * Utilify functions for logging
 */
cordova.define("com.salesforce.util.logger", function(require, exports, module) {
    var appStartTime = (new Date()).getTime();  // Used for debug timing measurements.

    /**
     * Logs text to a given section of the page.
     *   section - id of HTML section to log to.
     *   txt - The text (html) to log.
     */
    var log = function(section, txt) {
        console.log("jslog: " + txt);
        if ((typeof debugMode !== "undefined") && (debugMode === true)) {
            var sectionElt = document.getElementById(section);
            if (sectionElt) {
                sectionElt.style.display = "block";
                document.getElementById(section).innerHTML += ("<p><i><b>* At " + (new Date().getTime() - appStartTime) + "ms:</b></i> " + txt + "</p>");
            }
        }
    };

    /**
     * Logs debug messages to a "debug console" section of the page.  Only
     * shows when debugMode (above) is set to true.
     *   txt - The text (html) to log to the console.
     */
    var logToConsole = function(txt) {
        log("console", txt);
    };

    /**
     * Use to log error messages to an "error console" section of the page.
     *   txt - The text (html) to log to the console.
     */
    var logError = function(txt) {
        log("errors", txt);
    };

    /**
     * Sanitizes a URL for logging, based on an array of querystring parameters whose
     * values should be sanitized.  The value of each querystring parameter, if found
     * in the URL, will be changed to '[redacted]'.  Useful for getting rid of secure
     * data on the querystring, so it doesn't get persisted in an app log for instance.
     *
     * origUrl            - Required - The URL to sanitize.
     * sanitizeParamArray - Required - An array of querystring parameters whose values
     *                                 should be sanitized.
     * Returns: The sanitzed URL.
     */
    var sanitizeUrlParamsForLogging = function(origUrl, sanitizeParamArray) {
        var trimmedOrigUrl = origUrl.trim();
        if (trimmedOrigUrl === '')
            return trimmedOrigUrl;
        
        if ((typeof sanitizeParamArray !== "object") || (sanitizeParamArray.length === 0))
            return trimmedOrigUrl;
        
        var redactedUrl = trimmedOrigUrl;
        for (var i = 0; i < sanitizeParamArray.length; i++) {
            var paramRedactRegexString = "^(.*[\\?&]" + sanitizeParamArray[i] + "=)([^&]+)(.*)$";
            var paramRedactRegex = new RegExp(paramRedactRegexString, "i");
            if (paramRedactRegex.test(redactedUrl))
                redactedUrl = redactedUrl.replace(paramRedactRegex, "$1[redacted]$3");
        }
        
        return redactedUrl;
    };

    /**
     * Part of the module that is public
     */
    module.exports = {
        logToConsole: logToConsole,
        logError: logError,
        sanitizeUrlParamsForLogging: sanitizeUrlParamsForLogging
    };
});

cordova.define("com.salesforce.util.event", function(require, exports, module) {

    var logger = require("com.salesforce.util.logger");

    /**
     * Enumeration of event types.
     */
    var EventType = {
        AUTHENTICATING: {code: 0, description: "Authenticating...", isError: false},
        STARTING: {code: 1, description: "Loading application", isError: false},
        OFFLINE: {code: 2, description: "Your device is offline. Can't continue.", isError: true}
    };
           
    /**
     * Dispatches event with current status text and success indicator.
     */
    var sendStatusEvent = function(statusEvent) {
        if (statusEvent.isError) {
            logger.logError(statusEvent.description);
        } else {
            logger.logToConsole(statusEvent.description);
        }
        cordova.fireDocumentEvent('bootstrapStatusEvent', statusEvent);
    };

    /**
     * Part of the module that is public
     */
    module.exports = {
        EventType: EventType,
        sendStatusEvent: sendStatusEvent
    };
});

/**
 * Utility functions used at startup 
 */
cordova.define("com.salesforce.util.bootstrap", function(require, exports, module) {

    var logger = require("com.salesforce.util.logger");

    /**
     * Determine whether the device is online.
     */
    var deviceIsOnline = function() {
        var connType;
        if (navigator && navigator.connection) {
            connType = navigator.connection.type;
            logger.logToConsole("deviceIsOnline connType: " + connType);
        } else {
            logger.logToConsole("deviceIsOnline connType is undefined.");
        }
        
        // Android Chrome has navigator.connection but not window.Connection, which is cordova object.
        if (typeof connType !== 'undefined' && window.Connection) {
            // Cordova's connection object.  May be more accurate?
            return (connType && connType != Connection.NONE && connType != Connection.UNKNOWN);
        } else {
            // Default to browser facility.
            return navigator.onLine;
        }
    };

    /**
     * Part of the module that is public
     */
    module.exports = {
        deviceIsOnline: deviceIsOnline
    };
});

/**
 * Helper function used to call the native side
 */
cordova.define("com.salesforce.util.exec", function(require, exports, module) {
    var exec = function(pluginVersion, successCB, errorCB, service, action, args) {
        var tag = "TIMING " + service + ":" + action;
        console.time(tag);
        args.unshift("pluginSDKVersion:" + pluginVersion);
        var cordovaExec = require('cordova/exec');
        return cordovaExec(
            function() {
                console.timeEnd(tag);
                if (typeof successCB === "function")
                    successCB.apply(null, arguments);
            }, 
            function() {
                console.timeEnd(tag);
                console.error(tag + " failed");
                if (typeof errorCB === "function")
                    errorCB.apply(null, arguments);
            }, 
            service, action, args);                  
    };

    /**
     * Part of the module that is public
     */
    module.exports = {
        exec: exec
    };
});

cordova.define("com.salesforce.plugin.sdkinfo", function(require, exports, module) {
    var SERVICE = "com.salesforce.sdkinfo";

    var exec = require("com.salesforce.util.exec").exec;

    /**
      * SDKInfo data structure
      */
    var SDKInfo = function(sdkVersion, forcePluginsAvailable, appName, appVersion, bootconfig) {
        this.sdkVersion = sdkVersion;
        this.forcePluginsAvailable = forcePluginsAvailable;
        this.appName = appName;
        this.appVersion = appVersion;
        this.bootConfig = bootconfig;
    };

    /**
     * Returns a populated SDKInfo object (via a callback)
     */
    var getInfo = function(successCB, errorCB) {
        exec(SALESFORCE_MOBILE_SDK_VERSION, successCB, errorCB, SERVICE, "getInfo", []);
    };


    /**
     * Part of the module that is public
     */
    module.exports = {
        getInfo: getInfo,

        // Constructor
        SDKInfo: SDKInfo
    };
});

// For backward compatibility
var SFHybridApp = {
    logToConsole: cordova.require("com.salesforce.util.logger").logToConsole,
    logError: cordova.require("com.salesforce.util.logger").logError
};

cordova.define("com.salesforce.plugin.oauth", function (require, exports, module) {
    var SERVICE = "com.salesforce.oauth";

    var exec = require("com.salesforce.util.exec").exec;

    /**
     * Whether or not logout has already been initiated.  Can only be initiated once
     * per page load.
     */
    var logoutInitiated = false;
 
    /**
     * Obtain authentication credentials, calling 'authenticate' only if necessary.
     * Most index.html authors can simply use this method to obtain auth credentials
     * after onDeviceReady.
     *   success - The success callback function to use.
     *   fail    - The failure/error callback function to use.
     * cordova returns a dictionary with:
     *     accessToken
     *     refreshToken
     *  clientId
     *     userId
     *     orgId
     *  loginUrl
     *     instanceUrl
     *     userAgent
     */
    var getAuthCredentials = function (success, fail) {
        exec(SALESFORCE_MOBILE_SDK_VERSION, success, fail, SERVICE, "getAuthCredentials", []);
    };
 
    /**
     * Initiates the authentication process, with the given app configuration.
     *   success         - The success callback function to use.
     *   fail            - The failure/error callback function to use.
     * cordova returns a dictionary with:
     *   accessToken
     *   refreshToken
     *   clientId
     *   userId
     *   orgId
     *   loginUrl
     *   instanceUrl
     *   userAgent
     */
    var authenticate = function (success, fail) {
        exec(SALESFORCE_MOBILE_SDK_VERSION, success, fail, SERVICE, "authenticate", []);
    };

    /**
     * Logout the current authenticated user. This removes any current valid session token
     * as well as any OAuth refresh token.  The user is forced to login again.
     * This method does not call back with a success or failure callback, as 
     * (1) this method must not fail and (2) in the success case, the current user
     * will be logged out and asked to re-authenticate.  Note also that this method can only
     * be called once per page load.  Initiating logout will ultimately redirect away from
     * the given page (effectively resetting the logout flag), and calling this method again
     * while it's currently processing will result in app state issues.
     */
    var logout = function () {
        if (!logoutInitiated) {
            logoutInitiated = true;
            exec(SALESFORCE_MOBILE_SDK_VERSION, null, null, SERVICE, "logoutCurrentUser", []);
        }
    };
 
    /**
     * Gets the app's homepage as an absolute URL.  Used for attempting to load any cached
     * content that the developer may have built into the app (via HTML5 caching).
     *
     * This method will either return the URL as a string, or an empty string if the URL has not been
     * initialized.
     */
    var getAppHomeUrl = function (success) {
        exec(SALESFORCE_MOBILE_SDK_VERSION, success, null, SERVICE, "getAppHomeUrl", []);
    };

    /**
     * Goes through the refresh flow, and sets the new session token in the supplied forcetkClient.
     */
    var forcetkRefresh = function (forcetkClient, success, fail) {
        authenticate(function(oauthResponse) {
            var oauthResponseData = oauthResponse;
            if (oauthResponse.data)  {
                oauthResponseData = oauthResponse.data;
            }
            forcetkClient.setSessionToken(oauthResponseData.accessToken, null, oauthResponseData.instanceUrl);
            success();
        },
        fail);
    };

    /**
     * Part of the module that is public
     */
    module.exports = {
        getAuthCredentials: getAuthCredentials,
        authenticate: authenticate,
        logout: logout,
        getAppHomeUrl: getAppHomeUrl,
        forcetkRefresh: forcetkRefresh
    };
});

// For backward compatibility
var SalesforceOAuthPlugin = cordova.require("com.salesforce.plugin.oauth");

cordova.define("com.salesforce.plugin.sfaccountmanager", function (require, exports, module) {
    var SERVICE = "com.salesforce.sfaccountmanager";

    var exec = require("com.salesforce.util.exec").exec;

    /**
     * UserAccount data object, for account data operations.
     */
    var UserAccount = function(authToken, refreshToken, loginServer, idUrl, instanceServer, orgId, userId, username, clientId) {
        this.authToken = authToken;
        this.refreshToken = refreshToken;
        this.loginServer = loginServer;
        this.idUrl = idUrl;
        this.instanceServer = instanceServer;
        this.orgId = orgId;
        this.userId = userId;
        this.username = username;
        this.clientId = clientId;
    };

    /**
     * Whether or not logout has already been initiated.
     * Can only be initiated once per page load.
     */
    var logoutInitiated = false;
 
    /**
     * Obtains the list of user accounts already logged in.
     *   success - The success callback function to use.
     *   fail    - The failure/error callback function to use.
     * cordova returns an array, each entry contains a dictionary with:
     *     authToken
     *     refreshToken
     *     loginServer
     *     idUrl
     *     instanceServer
     *     orgId
     *     userId
     *     username
     *     clientId
     */
    var getUsers = function (success, fail) {
        exec(SALESFORCE_MOBILE_SDK_VERSION, success, fail, SERVICE, "getUsers", []);
    };

    /**
     * Obtains the current user account.
     *   success         - The success callback function to use.
     *   fail            - The failure/error callback function to use.
     * cordova returns a dictionary with:
     *     authToken
     *     refreshToken
     *     loginServer
     *     idUrl
     *     instanceServer
     *     orgId
     *     userId
     *     username
     *     clientId
     */
    var getCurrentUser = function (success, fail) {
        exec(SALESFORCE_MOBILE_SDK_VERSION, success, fail, SERVICE, "getCurrentUser", []);
    };

    /**
     * Logs out the specified user, or the current user if not specified.
     * This removes any current valid session token as well as any OAuth
     * refresh token.  The user is forced to login again.
     * This method does not call back with a success or failure callback, as 
     * (1) this method must not fail and (2) in the success case, the current user
     * will be logged out and asked to re-authenticate. Note also that this method can only
     * be called once per page load. Initiating logout will ultimately redirect away from
     * the given page (effectively resetting the logout flag), and calling this method again
     * while it's currently processing will result in app state issues.
     */
    var logout = function (user) {
        if (!logoutInitiated) {
            logoutInitiated = true;
            exec(SALESFORCE_MOBILE_SDK_VERSION, null, null, SERVICE, "logout", [user]);
        }
    };

    /**
     * Switches to the user specified, or new user, if not specified.
     * This method does not call back with a success or failure callback, as
     * (1) this method must not fail and (2) in the success case, the context
     * will be switched to another user, or a new user.
     */
    var switchToUser = function (user) {
        exec(SALESFORCE_MOBILE_SDK_VERSION, null, null, SERVICE, "switchToUser", (user ? [user] : []));
    };

    /**
     * Part of the module that is public.
     */
    module.exports = {
        UserAccount: UserAccount,
        getUsers: getUsers,
        getCurrentUser: getCurrentUser,
        logout: logout,
        switchToUser: switchToUser
    };
});

// For backward compatibility.
var SFAccountManagerPlugin = cordova.require("com.salesforce.plugin.sfaccountmanager");

cordova.define("com.salesforce.plugin.smartstore", function (require, exports, module) {
    var SERVICE = "com.salesforce.smartstore";

    var exec = require("com.salesforce.util.exec").exec;

    /**
     * SoupIndexSpec consturctor
     */
    var SoupIndexSpec = function (path, type) {
        this.path = path;
        this.type = type;
    };

    /**
     * QuerySpec constructor
     */
    var QuerySpec = function (path) {
        // the kind of query, one of: "exact","range", "like" or "smart":
        // "exact" uses matchKey, "range" uses beginKey and endKey, "like" uses likeKey, "smart" uses smartSql
        this.queryType = "exact";

        //path for the original IndexSpec you wish to use for search: may be a compound path eg Account.Owner.Name
        this.indexPath = path;

        //for queryType "exact" and "match"
        this.matchKey = null;

        //for queryType "like"
        this.likeKey = null;
        
        //for queryType "range"
        //the value at which query results may begin
        this.beginKey = null;
        //the value at which query results may end
        this.endKey = null;

        // for queryType "smart"
        this.smartSql = null;

        //path to sort by : optional
        this.orderPath = null

        //"ascending" or "descending" : optional
        this.order = "ascending";

        //the number of entries to copy from native to javascript per each cursor page
        this.pageSize = 10;
    };
    
    /**
     * StoreCursor constructor
     */
    var StoreCursor = function () {
        //a unique identifier for this cursor, used by plugin
        this.cursorId = null;
        //the maximum number of entries returned per page 
        this.pageSize = 0;
        // the total number of results
        this.totalEntries = 0;
        //the total number of pages of results available
        this.totalPages = 0;
        //the current page index among all the pages available
        this.currentPageIndex = 0;
        //the list of current page entries, ordered as requested in the querySpec
        this.currentPageOrderedEntries = null;
    };
    
    // ====== Logging support ======
    var logLevel;
    var storeConsole = {};

    var setLogLevel = function(level) {
        logLevel = level;
        var methods = ["error", "info", "warn", "debug"];
        var levelAsInt = methods.indexOf(level.toLowerCase());
        for (var i=0; i<methods.length; i++) {
            storeConsole[methods[i]] = (i <= levelAsInt ? console[methods[i]].bind(console) : function() {});
        }
    };

    // Showing info and above (i.e. error) by default.
    setLogLevel("info");

    var getLogLevel = function () {
        return logLevel;
    };

    // ====== querySpec factory methods
    // Returns a query spec that will page through all soup entries in order by the given path value
    // Internally it simply does a range query with null begin and end keys
    var buildAllQuerySpec = function (path, order, pageSize) {
        var inst = new QuerySpec(path);
        inst.queryType = "range";
        inst.orderPath = path;
        if (order) { inst.order = order; } // override default only if a value was specified
        if (pageSize) { inst.pageSize = pageSize; } // override default only if a value was specified
        return inst;
    };

    // Returns a query spec that will page all entries exactly matching the matchKey value for path
    var buildExactQuerySpec = function (path, matchKey, pageSize, order, orderPath) {
        var inst = new QuerySpec(path);
        inst.matchKey = matchKey;
        if (pageSize) { inst.pageSize = pageSize; } // override default only if a value was specified
        if (order) { inst.order = order; } // override default only if a value was specified
        inst.orderPath = orderPath ? orderPath : path;
        return inst;
    };

    // Returns a query spec that will page all entries in the range beginKey ...endKey for path
    var buildRangeQuerySpec = function (path, beginKey, endKey, order, pageSize, orderPath) {
        var inst = new QuerySpec(path);
        inst.queryType = "range";
        inst.beginKey = beginKey;
        inst.endKey = endKey;
        if (order) { inst.order = order; } // override default only if a value was specified
        if (pageSize) { inst.pageSize = pageSize; } // override default only if a value was specified
        inst.orderPath = orderPath ? orderPath : path;
        return inst;
    };

    // Returns a query spec that will page all entries matching the given likeKey value for path
    var buildLikeQuerySpec = function (path, likeKey, order, pageSize, orderPath) {
        var inst = new QuerySpec(path);
        inst.queryType = "like";
        inst.likeKey = likeKey;
        if (order) { inst.order = order; } // override default only if a value was specified
        if (pageSize) { inst.pageSize = pageSize; } // override default only if a value was specified
        inst.orderPath = orderPath ? orderPath : path;
        return inst;
    };

    // Returns a query spec that will page all entries matching the given full-text search matchKey value for path
    // Pass null for path to match matchKey across all full-text indexed fields
    var buildMatchQuerySpec = function (path, matchKey, order, pageSize, orderPath) {
        var inst = new QuerySpec(path);
        inst.queryType = "match";
        inst.matchKey = matchKey;
        inst.orderPath = orderPath;
        if (order) { inst.order = order; } // override default only if a value was specified
        if (pageSize) { inst.pageSize = pageSize; } // override default only if a value was specified
        inst.orderPath = orderPath ? orderPath : path;
        return inst;
    };

    // Returns a query spec that will page all results returned by smartSql
    var buildSmartQuerySpec = function (smartSql, pageSize) {
        var inst = new QuerySpec();
        inst.queryType = "smart";
        inst.smartSql = smartSql;
        if (pageSize) { inst.pageSize = pageSize; } // override default only if a value was specified
        return inst;
    };

    // Helper function to handle calls that don't specify isGlobalStore as first argument
    // If missing, the caller is re-invoked with false prepended to the arguments list and true is returned
    // Otherwise, false is returned
    var checkFirstArg = function(argumentsOfCaller) {
        // Turning arguments into array
        var args = Array.prototype.slice.call(argumentsOfCaller);
        // If first argument is not a boolean
        if (typeof(args[0]) !== "boolean") {
            // Pre-pending false
            args.unshift(false);
            // Re-invoking function
            argumentsOfCaller.callee.apply(null, args);
            return true;
        }
        // First argument is a boolean
        else {
            return false;
        }
    };

    
    // ====== Soup manipulation ======
    var getDatabaseSize = function (isGlobalStore, successCB, errorCB) {
        if (checkFirstArg(arguments)) return;
        storeConsole.debug("SmartStore.getDatabaseSize:isGlobalStore=" + isGlobalStore);
        exec(SALESFORCE_MOBILE_SDK_VERSION, successCB, errorCB, SERVICE, "pgGetDatabaseSize", [{"isGlobalStore": isGlobalStore}]);
    };
    
    var registerSoup = function (isGlobalStore, soupName, indexSpecs, successCB, errorCB) {
        if (checkFirstArg(arguments)) return;
        storeConsole.debug("SmartStore.registerSoup:isGlobalStore=" +isGlobalStore+ ",soupName=" + soupName + ",indexSpecs=" + JSON.stringify(indexSpecs));
        exec(SALESFORCE_MOBILE_SDK_VERSION, successCB, errorCB, SERVICE,
             "pgRegisterSoup",
             [{"soupName": soupName, "indexes": indexSpecs, "isGlobalStore": isGlobalStore}]
            );
    };

    var removeSoup = function (isGlobalStore, soupName, successCB, errorCB) {
        if (checkFirstArg(arguments)) return;
        storeConsole.debug("SmartStore.removeSoup:isGlobalStore=" +isGlobalStore+ ",soupName=" + soupName);
        exec(SALESFORCE_MOBILE_SDK_VERSION, successCB, errorCB, SERVICE,
             "pgRemoveSoup",
             [{"soupName": soupName, "isGlobalStore": isGlobalStore}]
            );
    };

    var getSoupIndexSpecs = function(isGlobalStore, soupName, successCB, errorCB) {
        if (checkFirstArg(arguments)) return;
        storeConsole.debug("SmartStore.getSoupIndexSpecs:isGlobalStore=" +isGlobalStore+ ",soupName=" + soupName);
        exec(SALESFORCE_MOBILE_SDK_VERSION, successCB, errorCB, SERVICE,
             "pgGetSoupIndexSpecs",
             [{"soupName": soupName, "isGlobalStore": isGlobalStore}]
            );
    };

    var alterSoup = function (isGlobalStore, soupName, indexSpecs, reIndexData, successCB, errorCB) {
        if (checkFirstArg(arguments)) return;
        storeConsole.debug("SmartStore.alterSoup:isGlobalStore=" +isGlobalStore+ ",soupName=" + soupName + ",indexSpecs=" + JSON.stringify(indexSpecs));
        exec(SALESFORCE_MOBILE_SDK_VERSION, successCB, errorCB, SERVICE,
             "pgAlterSoup",
             [{"soupName": soupName, "indexes": indexSpecs, "reIndexData": reIndexData, "isGlobalStore": isGlobalStore}]
            );
    };

    var reIndexSoup = function (isGlobalStore, soupName, paths, successCB, errorCB) {
        if (checkFirstArg(arguments)) return;
        storeConsole.debug("SmartStore.reIndexSoup:isGlobalStore=" +isGlobalStore+ ",soupName=" + soupName + ",paths=" + JSON.stringify(paths));
        exec(SALESFORCE_MOBILE_SDK_VERSION, successCB, errorCB, SERVICE,
             "pgReIndexSoup",
             [{"soupName": soupName, "paths": paths, "isGlobalStore": isGlobalStore}]
            );
    };

    var clearSoup = function (isGlobalStore, soupName, successCB, errorCB) {
        if (checkFirstArg(arguments)) return;
        storeConsole.debug("SmartStore.clearSoup:isGlobalStore=" +isGlobalStore+ ",soupName=" + soupName);
        exec(SALESFORCE_MOBILE_SDK_VERSION, successCB, errorCB, SERVICE,
             "pgClearSoup",
             [{"soupName": soupName, "isGlobalStore": isGlobalStore}]
            );
    };

    var showInspector = function(isGlobalStore) {
        storeConsole.debug("SmartStore.showInspector");
        isGlobalStore = isGlobalStore || false;
        exec(SALESFORCE_MOBILE_SDK_VERSION, null, null, SERVICE, "pgShowInspector", [{"isGlobalStore": isGlobalStore}]);
    };

    var soupExists = function (isGlobalStore, soupName, successCB, errorCB) {
        if (checkFirstArg(arguments)) return;
        storeConsole.debug("SmartStore.soupExists:isGlobalStore=" +isGlobalStore+ ",soupName=" + soupName);
        exec(SALESFORCE_MOBILE_SDK_VERSION, successCB, errorCB, SERVICE,
             "pgSoupExists",
             [{"soupName": soupName, "isGlobalStore": isGlobalStore}]
            );
    };

    var querySoup = function (isGlobalStore, soupName, querySpec, successCB, errorCB) {
        if (checkFirstArg(arguments)) return;
        if (querySpec.queryType == "smart") throw new Error("Smart queries can only be run using runSmartQuery");
        if (querySpec.order != null && querySpec.orderPath == null) querySpec.orderPath = querySpec.indexPath; // for backward compatibility with pre-3.3 code
        storeConsole.debug("SmartStore.querySoup:isGlobalStore=" +isGlobalStore+ ",soupName=" + soupName + ",indexPath=" + querySpec.indexPath);
        exec(SALESFORCE_MOBILE_SDK_VERSION, successCB, errorCB, SERVICE,
             "pgQuerySoup",
             [{"soupName": soupName, "querySpec": querySpec, "isGlobalStore": isGlobalStore}]
            );
    };

    var runSmartQuery = function (isGlobalStore, querySpec, successCB, errorCB) {
        if (checkFirstArg(arguments)) return;
        if (querySpec.queryType != "smart") throw new Error("runSmartQuery can only run smart queries");
        storeConsole.debug("SmartStore.runSmartQuery:isGlobalStore=" +isGlobalStore+ ",smartSql=" + querySpec.smartSql);
        exec(SALESFORCE_MOBILE_SDK_VERSION, successCB, errorCB, SERVICE,
             "pgRunSmartQuery",
             [{"querySpec": querySpec, "isGlobalStore": isGlobalStore}]
            );
    };

    var retrieveSoupEntries = function (isGlobalStore, soupName, entryIds, successCB, errorCB) {
        if (checkFirstArg(arguments)) return;
        storeConsole.debug("SmartStore.retrieveSoupEntries:isGlobalStore=" +isGlobalStore+ ",soupName=" + soupName + ",entryIds=" + entryIds);
        exec(SALESFORCE_MOBILE_SDK_VERSION, successCB, errorCB, SERVICE,
             "pgRetrieveSoupEntries",
             [{"soupName": soupName, "entryIds": entryIds, "isGlobalStore": isGlobalStore}]
            );
    };

    var upsertSoupEntries = function (isGlobalStore, soupName, entries, successCB, errorCB) {
        if (checkFirstArg(arguments)) return;
        upsertSoupEntriesWithExternalId(isGlobalStore, soupName, entries, "_soupEntryId", successCB, errorCB);
    };

    var upsertSoupEntriesWithExternalId = function (isGlobalStore, soupName, entries, externalIdPath, successCB, errorCB) {
        if (checkFirstArg(arguments)) return;
        storeConsole.debug("SmartStore.upsertSoupEntries:isGlobalStore=" +isGlobalStore+ ",soupName=" + soupName + ",entries=" + entries.length + ",externalIdPath=" + externalIdPath);
        exec(SALESFORCE_MOBILE_SDK_VERSION, successCB, errorCB, SERVICE,
             "pgUpsertSoupEntries", 
             [{"soupName": soupName, "entries": entries, "externalIdPath": externalIdPath, "isGlobalStore": isGlobalStore}]
            );
    };

    var removeFromSoup = function (isGlobalStore, soupName, entryIds, successCB, errorCB) {
        if (checkFirstArg(arguments)) return;
        storeConsole.debug("SmartStore.removeFromSoup:isGlobalStore=" +isGlobalStore+ ",soupName=" + soupName + ",entryIds=" + entryIds);
        isGlobalStore = isGlobalStore || false;
        exec(SALESFORCE_MOBILE_SDK_VERSION, successCB, errorCB, SERVICE,
             "pgRemoveFromSoup",
             [{"soupName": soupName, "entryIds": entryIds, "isGlobalStore": isGlobalStore}]
            );
    };

    //====== Cursor manipulation ======
    var moveCursorToPageIndex = function (isGlobalStore, cursor, newPageIndex, successCB, errorCB) {
        if (checkFirstArg(arguments)) return;
        storeConsole.debug("moveCursorToPageIndex:isGlobalStore=" + isGlobalStore +",cursorId=" + cursor.cursorId + ",newPageIndex=" + newPageIndex);
        exec(SALESFORCE_MOBILE_SDK_VERSION, successCB, errorCB, SERVICE,
             "pgMoveCursorToPageIndex",
             [{"cursorId": cursor.cursorId, "index": newPageIndex, "isGlobalStore": isGlobalStore}]
            );
    };

    var moveCursorToNextPage = function (isGlobalStore, cursor, successCB, errorCB) {
        if (checkFirstArg(arguments)) return;
        var newPageIndex = cursor.currentPageIndex + 1;
        if (newPageIndex >= cursor.totalPages) {
            errorCB(cursor, new Error("moveCursorToNextPage called while on last page"));
        } else {
            moveCursorToPageIndex(isGlobalStore, cursor, newPageIndex, successCB, errorCB);
        }
    };

    var moveCursorToPreviousPage = function (isGlobalStore, cursor, successCB, errorCB) {
        if (checkFirstArg(arguments)) return;
        var newPageIndex = cursor.currentPageIndex - 1;
        if (newPageIndex < 0) {
            errorCB(cursor, new Error("moveCursorToPreviousPage called while on first page"));
        } else {
            moveCursorToPageIndex(isGlobalStore, cursor, newPageIndex, successCB, errorCB);
        }
    };

    var closeCursor = function (isGlobalStore, cursor, successCB, errorCB) {
        if (checkFirstArg(arguments)) return;
        storeConsole.debug("closeCursor:isGlobalStore=" + isGlobalStore +",cursorId=" + cursor.cursorId);
        exec(SALESFORCE_MOBILE_SDK_VERSION, successCB, errorCB, SERVICE,
             "pgCloseCursor",
             [{"cursorId": cursor.cursorId, "isGlobalStore": isGlobalStore}]
            );
    };

    /**
     * Part of the module that is public
     */
    module.exports = {
        alterSoup: alterSoup,
        buildAllQuerySpec: buildAllQuerySpec,
        buildExactQuerySpec: buildExactQuerySpec,
        buildLikeQuerySpec: buildLikeQuerySpec,
        buildRangeQuerySpec: buildRangeQuerySpec,
        buildSmartQuerySpec: buildSmartQuerySpec,
        buildMatchQuerySpec: buildMatchQuerySpec,
        clearSoup: clearSoup,
        closeCursor: closeCursor,
        getDatabaseSize: getDatabaseSize,
        getLogLevel: getLogLevel,
        getSoupIndexSpecs: getSoupIndexSpecs,
        moveCursorToNextPage: moveCursorToNextPage,
        moveCursorToPageIndex: moveCursorToPageIndex,
        moveCursorToPreviousPage: moveCursorToPreviousPage,
        querySoup: querySoup,
        reIndexSoup: reIndexSoup,
        registerSoup: registerSoup,
        removeFromSoup: removeFromSoup,
        removeSoup: removeSoup,
        retrieveSoupEntries: retrieveSoupEntries,
        runSmartQuery: runSmartQuery,
        setLogLevel: setLogLevel,
        showInspector: showInspector,
        soupExists: soupExists,
        upsertSoupEntries: upsertSoupEntries,
        upsertSoupEntriesWithExternalId: upsertSoupEntriesWithExternalId,

        // Constructors
        QuerySpec: QuerySpec,
        SoupIndexSpec: SoupIndexSpec,
        StoreCursor: StoreCursor
    };
});

// For backward compatibility
navigator.smartstore = cordova.require("com.salesforce.plugin.smartstore");
var SoupIndexSpec = navigator.smartstore.SoupIndexSpec;
var QuerySpec = navigator.smartstore.QuerySpec;
var StoreCursor = navigator.smartstore.StoreCursor;

cordova.define("com.salesforce.plugin.smartsync", function (require, exports, module) {
    var SERVICE = "com.salesforce.smartsync";

    var exec = require("com.salesforce.util.exec").exec;

    // NB: also in smartstore plugin
    var checkFirstArg = function(argumentsOfCaller) {
        var args = Array.prototype.slice.call(argumentsOfCaller);
        if (typeof(args[0]) !== "boolean") {
            args.unshift(false);
            argumentsOfCaller.callee.apply(null, args);
            return true;
        }
        else {
            return false;
        }
    };
    

    var syncDown = function(isGlobalStore, target, soupName, options, successCB, errorCB) {
        if (checkFirstArg(arguments)) return;
        exec(SALESFORCE_MOBILE_SDK_VERSION, successCB, errorCB, SERVICE,
             "syncDown",
             [{"target": target, "soupName": soupName, "options": options, "isGlobalStore":isGlobalStore}]
            );        
    };

    var reSync = function(isGlobalStore, syncId, successCB, errorCB) {
        if (checkFirstArg(arguments)) return;
        exec(SALESFORCE_MOBILE_SDK_VERSION, successCB, errorCB, SERVICE,
             "reSync",
             [{"syncId": syncId, "isGlobalStore":isGlobalStore}]
            );        
    };


    var syncUp = function(isGlobalStore, target, soupName, options, successCB, errorCB) {
        var args = Array.prototype.slice.call(arguments);
        // We accept syncUp(soupName, options, successCB, errorCB)
        if (typeof(args[0]) === "string") {
            isGlobalStore = false;
            target = {};
            soupName = args[0];
            options = args[1];
            successCB = args[2];
            errorCB = args[3];
        }
        // We accept syncUp(target, soupName, options, successCB, errorCB)
        if (typeof(args[0]) === "object") {
            isGlobalStore = false;
            target = args[0];
            soupName = args[1];
            options = args[2];
            successCB = args[3];
            errorCB = args[4];
        }
        target = target || {};

        exec(SALESFORCE_MOBILE_SDK_VERSION, successCB, errorCB, SERVICE,
             "syncUp",
             [{"target": target, "soupName": soupName, "options": options, "isGlobalStore":isGlobalStore}]
            );        
    };

    var getSyncStatus = function(isGlobalStore, syncId, successCB, errorCB) {
        if (checkFirstArg(arguments, "boolean", false)) return;
        exec(SALESFORCE_MOBILE_SDK_VERSION, successCB, errorCB, SERVICE,
             "getSyncStatus",
             [{"syncId": syncId, "isGlobalStore":isGlobalStore}]
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
        reSync: reSync
    };
});

cordova.define("com.salesforce.util.push", function(require, exports, module) {

    /**
     * Register push notification handler
     */
    var registerPushNotificationHandler = function(notificationHandler, fail) {
        if (!window.PushNotification) {
            console.error("PushPlugin not found");
            fail("PushPlugin not found");
            return;
        }


        cordova.require("com.salesforce.plugin.sdkinfo").getInfo(function(info) {
            var bootconfig = info.bootConfig;

            var push = PushNotification.init({
                    "android": {
                        "senderID": bootconfig.androidPushNotificationClientId
                    },
                    "ios": {"alert": "true", "badge": "true", "sound": "true"},
                    "windows": {}
                });

            push.on('registration', function(data) {
                console.log("registration event " + JSON.stringify(data));
                console.log(JSON.stringify(data));
            });

            push.on('notification', function(data) {
              console.log("notification event");
              console.log(JSON.stringify(data));
              if (data.event == "message") {
                notificationHandler(message);
              }
              push.finish(function () {
                  console.log('finish successfully called');
              });
            });

            push.on('error', function(e) {
                console.log("push error");
                console.error("push error " + JSON.stringify(e));
                fail(err);
            });
        });
    };

    /**
     * Part of the module that is public
     */
    module.exports = {
        registerPushNotificationHandler: registerPushNotificationHandler
    };
});


