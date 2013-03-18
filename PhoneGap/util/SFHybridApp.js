/**
 * Utility functionality for hybrid apps.
 * Note: This JS module assumes the inclusion of the Cordova JS library
 */

/**
 * Utilify functions for logging
 */
cordova.define("salesforce/util/logger", function(require, exports, module) {
    var appStartTime = (new Date()).getTime();  // Used for debug timing measurements.

    /**
     * Logs text to a given section of the page.
     *   section - id of HTML section to log to.
     *   txt - The text (html) to log.
     */
    var log = function(section, txt) {
        console.log("jslog: " + txt);
        if ((typeof debugMode !== "undefined") && (debugMode === true)) {
            var now = new Date();
            var fullTxt = "<p><i><b>* At " + (now.getTime() - appStartTime) + "ms:</b></i> " + txt + "</p>";
            var sectionElt = document.getElementById(section);
            if (sectionElt) {
                sectionElt.style.display = "block";
                document.getElementById(section).innerHTML += fullTxt;
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

cordova.define("salesforce/util/event", function(require, exports, module) {

    var logger = require("salesforce/util/logger");

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
cordova.define("salesforce/util/bootstrap", function(require, exports, module) {

    var logger = require("salesforce/util/logger");

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
        
        if (typeof connType !== 'undefined') {
            // Cordova's connection object.  May be more accurate?
            return (connType != null && connType != Connection.NONE && connType != Connection.UNKNOWN);
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
cordova.define("salesforce/util/exec", function(require, exports, module) {
    var exec = function(pluginVersion, successCB, errorCB, service, action, args) {
        var defaultSuccessCB = function() {
            console.log(service + ":" + action + " succeeded");
        };
        var defaultErrorCB = function() {
            console.log(service + ":" + action + " failed");
        };
        successCB = typeof successCB !== "function" ? defaultSuccessCB : successCB;
        error = typeof errorCB !== "function" ? defaultErrorCB : errorCB;
        args.unshift("pluginSDKVersion:" + pluginVersion);
        var cordovaExec = require('cordova/exec');
        return cordovaExec(successCB, errorCB, service, action, args);                  
    };

    /**
     * Part of the module that is public
     */
    module.exports = {
        exec: exec
    };
});

cordova.define("salesforce/plugin/sdkinfo", function(require, exports, module) {
    // Version this js was shipped with
    var SDK_VERSION = "2.0unstable";

    var SERVICE = "com.salesforce.sdkinfo";

    var exec = require("salesforce/util/exec").exec;

    /**
      * SDKInfo data structure
      */
    var SDKInfo = function(sdkVersion, forcePluginsAvailable, appName, appVersion) {
        this.sdkVersion = sdkVersion;
        this.forcePluginsAvailable = forcePluginsAvailable;
        this.appName = appName;
        this.appVersion = appVersion;
    };

    /**
     * Returns a populated SDKInfo object (via a callback)
     */
    var getInfo = function(successCB, errorCB) {
        exec(SDK_VERSION, successCB, errorCB, SERVICE, "getInfo", []);
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
    logToConsole: cordova.require("salesforce/util/logger").logToConsole,
    logError: cordova.require("salesforce/util/logger").logError
};
