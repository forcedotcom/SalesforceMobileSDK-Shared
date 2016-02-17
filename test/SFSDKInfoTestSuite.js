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
 * A test suite for SDKInfo
 * This file assumes that qunit.js has been previously loaded, as well as jquery.js,  SFTestSuite.js.
 * To display results you'll need to load qunit.css.
 */
if (typeof SDKInfoTestSuite === 'undefined') { 

/**
 * Constructor for SDKInfoTestSuite
 */
var SDKInfoTestSuite = function () {
    SFTestSuite.call(this, "sdkinfo");
};

// We are sub-classing SFTestSuite
SDKInfoTestSuite.prototype = new SFTestSuite();
SDKInfoTestSuite.prototype.constructor = SDKInfoTestSuite;

/**
 * Helper method to do sdk info operations using promises
 */
SDKInfoTestSuite.prototype.getInfo = promiser(cordova.require("com.salesforce.plugin.sdkinfo"), "getInfo");

/** 
 * TEST getInfo
 */
SDKInfoTestSuite.prototype.testGetInfo = function()  {
    console.log("In SFSDKInfoTestSuite.testGetInfo");

    var self = this;

    self.getInfo()
        .done(function(sdkInfo) {
            // sdkVersion
        	QUnit.ok(sdkInfo.sdkVersion.indexOf("4.1") == 0, "expected different sdk version");
            // appName
            QUnit.ok(sdkInfo.appName == "SalesforceHybridSDKTestApp" || sdkInfo.appName == "SalesforceHybridTest", "expected different app name");
            // appVersion
            QUnit.equal(sdkInfo.appVersion, "1.0", "expected different app version");
            // forcePluginsAvailable
            QUnit.equal(sdkInfo.forcePluginsAvailable.length, 6, "wrong force plugins");
            sdkInfo.forcePluginsAvailable.sort();
            QUnit.equal(sdkInfo.forcePluginsAvailable[0], "com.salesforce.oauth", "wrong force plugins");
            QUnit.equal(sdkInfo.forcePluginsAvailable[1], "com.salesforce.sdkinfo", "wrong force plugins");
            QUnit.equal(sdkInfo.forcePluginsAvailable[2], "com.salesforce.sfaccountmanager", "wrong force plugins");
            QUnit.equal(sdkInfo.forcePluginsAvailable[3], "com.salesforce.smartstore", "wrong force plugins");
            QUnit.equal(sdkInfo.forcePluginsAvailable[4], "com.salesforce.smartsync", "wrong force plugins");
            QUnit.equal(sdkInfo.forcePluginsAvailable[5], "com.salesforce.testrunner", "wrong force plugins");
            // bootConfig
            QUnit.ok(sdkInfo.bootConfig.isLocal, "wrong bootConfig.isLocal");
            QUnit.ok(sdkInfo.bootConfig.shouldAuthenticate, "wrong bootConfig.shouldAuthenticate");
            QUnit.ok(!sdkInfo.bootConfig.attemptOfflineLoad, "wrong bootConfig.attemptOfflineLoad");
            QUnit.equal(sdkInfo.bootConfig.startPage, "index.html", "wrong bootConfig.startPage");
            QUnit.equal(sdkInfo.bootConfig.errorPage, "error.html", "wrong bootConfig.errorPage");
            QUnit.ok(typeof sdkInfo.bootConfig.oauthRedirectURI === "string" && sdkInfo.bootConfig.oauthRedirectURI.length > 0, "wrong bootConfig.oauthRedirectURI"); // on iOS boot config coming from test_credentials.json
            QUnit.ok(typeof sdkInfo.bootConfig.oauthScopes === "object" && sdkInfo.bootConfig.oauthScopes.length > 0, "wrong bootConfig.oauthScopes.length");    // on iOS boot config coming from test_credentials.json
            self.finalizeTest();
        });
}; 

}

