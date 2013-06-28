/*
 * Copyright (c) 2013, salesforce.com, inc.
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
 * A test suite for forcetk.mobilesdk.js
 * This file assumes that qunit.js has been previously loaded, as well as jquery.js,  SFTestSuite.js.
 * To display results you'll need to load qunit.css.
 */
if (typeof ForcetkTestSuite === 'undefined') { 

/**
 * Constructor for ForcetkTestSuite
 */
var ForcetkTestSuite = function () {
    SFTestSuite.call(this, "forcetk");
};

// We are sub-classing SFTestSuite
ForcetkTestSuite.prototype = new SFTestSuite();
ForcetkTestSuite.prototype.constructor = ForcetkTestSuite;

/** 
 * TEST computeWebAppSdkAgent for unrecognized user agents
 */
ForcetkTestSuite.prototype.testComputeWebAppSdkAgentForUnrecognizedUserAgents = function()  {
    console.log("In SFForcetkTestSuite.testComputeWebAppSdkAgentForUnrecognizedUserAgents");

    this.tryUserAgent("Unknown", "Unknown", "Unknown", "Unrecognized agent");
    this.finalizeTest();
}; 


/** 
 * TEST computeWebAppSdkAgent for iOS user agents
 */
ForcetkTestSuite.prototype.testComputeWebAppSdkAgentForIOSUserAgents = function()  {
    console.log("In SFForcetkTestSuite.testComputeWebAppSdkAgentForIOSUserAgents");

    // User agents taken from http://www.zytrax.com/tech/web/mobile_ids.html
    this.tryUserAgent("iPhone OS", "6.1.3", "iPad", "Mozilla/5.0 (iPad; CPU OS 6_1_3 like Mac OS X) AppleWebKit/536.26 (KHTML, like Gecko) Version/6.0 Mobile/10B329 Safari/8536.25");
    this.tryUserAgent("iPhone OS", "5.1.1", "iPod", "Mozilla/5.0 (iPod; CPU iPhone OS 5_1_1 like Mac OS X; nl-nl) AppleWebKit/534.46.0 (KHTML, like Gecko) CriOS/21.0.1180.80 Mobile/9B206 Safari/7534.48.3");
    this.tryUserAgent("iPhone OS", "5.1", "iPhone", "Mozilla/5.0 (iPhone; CPU iPhone OS 5_1 like Mac OS X) AppleWebKit/534.46 (KHTML, like Gecko) Version/5.1 Mobile/9B176 Safari/7534.48.3");
    this.tryUserAgent("iPhone OS", "4.3.1", "iPad", "Mozilla/5.0 (iPad; U; CPU OS 4_3_1 like Mac OS X; en-us) AppleWebKit/533.17.9 (KHTML, like Gecko) Version/5.0.2 Mobile/8G4 Safari/6533.18.5");
    this.finalizeTest();
}; 

/** 
 * TEST computeWebAppSdkAgent for Android user agents
 */
ForcetkTestSuite.prototype.testComputeWebAppSdkAgentForAndroidUserAgents = function()  {
    console.log("In SFForcetkTestSuite.testComputeWebAppSdkAgentForAndroidUserAgents");

    // User agents taken from http://www.zytrax.com/tech/web/mobile_ids.html
    this.tryUserAgent("android mobile", "4.1.1", "Nexus_7_Build_JRO03D", "Mozilla/5.0 (Linux; U; Android 4.1.1; he-il; Nexus 7 Build/JRO03D) AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Safari/534.30");
    this.tryUserAgent("android mobile", "2.1", "Nexus_One_Build_ERD62", "Mozilla/5.0 (Linux; U; Android 2.1; en-us; Nexus One Build/ERD62) AppleWebKit/530.17 (KHTML, like Gecko) Version/4.0 Mobile Safari/530.17");
    this.finalizeTest();
}; 

/** 
 * TEST computeWebAppSdkAgent for WindowsPhone user agents
 */
ForcetkTestSuite.prototype.testComputeWebAppSdkAgentForWindowsPhoneUserAgents = function()  {
    console.log("In SFForcetkTestSuite.testComputeWebAppSdkAgentForWindowsPhoneUserAgents");

    // User agents taken from http://www.zytrax.com/tech/web/mobile_ids.html
    this.tryUserAgent("Windows Phone", "7.0", "7_Trophy", "Mozilla/4.0 (compatible: MSIE 7.0; Windows Phone OS 7.0; Trident/3.1; IEMobile/7.0; HTC; 7 Trophy)");
    this.tryUserAgent("Windows Phone", "7.5", "Lumia_710", "Mozilla/5.0 (compatible; MSIE 9.0; Windows Phone OS 7.5; Trident/5.0; IEMobile/9.0; NOKIA; Lumia 710)");
    this.finalizeTest();
}; 


/** 
 * TEST computeWebAppSdkAgent for desktop user agents
 */
ForcetkTestSuite.prototype.testComputeWebAppSdkAgentForDesktopUserAgents = function()  {
    console.log("In SFForcetkTestSuite.testComputeWebAppSdkAgentForDesktopUserAgents");

    // User agents taken from http://techblog.willshouse.com/2012/01/03/most-common-user-agents/
    this.tryUserAgent("Mac OS", "10.8.4", "Unknown", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/27.0.1453.116 Safari/537.36");
    this.tryUserAgent("Windows", "6.2", "Unknown", "Mozilla/5.0 (Windows NT 6.2; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/27.0.1453.110 Safari/537.36");
    this.tryUserAgent("Windows", "6.1", "Unknown", "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/27.0.1453.110 Safari/537.36");
    this.tryUserAgent("Windows", "5.1", "Unknown", "Mozilla/5.0 (Windows NT 5.1; rv:21.0) Gecko/20100101 Firefox/21.0");
    this.tryUserAgent("Unknown", "Unknown", "Unknown", "Mozilla/5.0 (X11; Linux i686) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/27.0.1453.93 Safari/537.36");
    this.finalizeTest();
}; 



ForcetkTestSuite.prototype.tryUserAgent = function(expectedPlatform, expectedPlatformVersion, expectedModel, userAgent) {
    var forcetkClient = new forcetk.Client();
    var webAppSdkAgent = forcetkClient.computeWebAppSdkAgent(userAgent);
    var match = /SalesforceMobileSDK\/2.0.0 ([^\/]*)\/([^\ ]*) \(([^\)]*)\) test.html\/1.0 Web (.*)/.exec(webAppSdkAgent);
    if (match != null && match.length == 5) {
        QUnit.equals(match[1], expectedPlatform, "Wrong platform for user agent [" + userAgent + "]");
        QUnit.equals(match[2], expectedPlatformVersion, "Wrong platformVersion for user agent [" + userAgent + "]");
        QUnit.equals(match[3], expectedModel, "Wrong model for user agent [" + userAgent + "]");
        QUnit.equals(match[4], userAgent, "Wrong user agent appended for user agent [" + userAgent + "]");
    }
    else {
        QUnit.ok(false, "Wrong user agent produced [" + webAppSdkAgent + "] for user agent [" + userAgent + "]");
    }
};


}

