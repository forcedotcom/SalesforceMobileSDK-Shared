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