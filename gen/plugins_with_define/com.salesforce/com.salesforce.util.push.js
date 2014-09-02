cordova.define("com.salesforce.util.push", function(require, exports, module) {
/*
 * Copyright (c) 2012-14, salesforce.com, inc.
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
var SALESFORCE_MOBILE_SDK_VERSION = "3.0.0";

/**
 * Register push notification handler
 */
var registerPushNotificationHandler = function(notificationHandler, fail) {
    if (window.plugins && window.plugins.pushNotification) {
        console.err("PushPlugin not found");
        fail("PushPlugin not found");
        return;
    }

    var isAndroid  = device.platform == 'android' || device.platform == 'Android' || device.platform == "amazon-fireos";

    var notificationHandlerName = "onNotification" + (Math.round(Math.random()*100000));
    window[notificationHandlerName] = function(message) {
        console.log("Received notification " + JSON.stringify(message));
        if (message.event == "message" || !isAndroid) {
            notificationHandler(message);
        }
    };
    
    var registrationSuccess = function(result) {
        console.log("Registration successful " + JSON.stringify(result));
    };

    var registrationFail = function(err) {
        console.err("Registration failed " + JSON.stringify(err));
        fail(err);
    };

    // Android
    if (isAndroid)
    {
        console.log("Registering for Android");
        cordova.require("com.salesforce.plugin.sdkinfo").getInfo(function(info) {
            var bootconfig = info.bootConfig;
            window.plugins.pushNotification.register(
                registrationSuccess,
                registrationFail,
                {
                    "senderID": bootconfig.androidPushNotificationClientId,
                    "ecb":notificationHandlerName
                });
        });
    } 

    // iOS
    else 
    {
        console.debug("Registering for ios");
        window.plugins.pushNotification.register(
            registrationSuccess,
            registrationFail,
            {
                "badge":"true",
                "sound":"true",
                "alert":"true",
                "ecb":notificationHandlerName
            });
    }
};

/**
 * Part of the module that is public
 */
module.exports = {
    registerPushNotificationHandler: registerPushNotificationHandler
};
});