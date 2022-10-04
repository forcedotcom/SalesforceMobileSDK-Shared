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

/**
 * Register push notification handler.
 */
var registerPushNotificationHandler = function(notificationHandler, fail) {
    if (!window.PushNotification) {
        console.error("PushPlugin not found. Please install the plugin from https://github.com/phonegap/phonegap-plugin-push.");
        fail("PushPlugin not found. Please install the plugin from https://github.com/phonegap/phonegap-plugin-push.");
        return;
    }
    cordova.require("com.salesforce.plugin.sdkinfo").getInfo(function(info) {
        var bootconfig = info.bootConfig;
        var push = PushNotification.init({
            "android": {
                "senderID": bootconfig.androidPushNotificationClientId
            },
            "ios": {
                "alert": "true",
                "badge": "true",
                "sound": "true"
            }
        });
        push.on('registration', function(data) {
            console.log("Registration event " + JSON.stringify(data));
            console.log(JSON.stringify(data));
        });
        push.on('notification', function(data) {
            console.log("Notification event");
            console.log(JSON.stringify(data));
            notificationHandler(data);
            push.finish(function () {
                console.log('Finish successfully called');
            });
        });
        push.on('error', function(e) {
            console.log("Push error");
            console.error("Push error " + JSON.stringify(e));
            fail(e);
        });
    });
};

/**
 * Part of the module that is public.
 */
module.exports = {
    registerPushNotificationHandler: registerPushNotificationHandler
};