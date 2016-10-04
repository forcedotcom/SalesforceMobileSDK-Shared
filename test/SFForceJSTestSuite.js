/*
 * Copyright (c) 2013-present, salesforce.com, inc.
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
 * A test suite for force.js
 * This file assumes that qunit.js has been previously loaded, as well as jquery.js,  SFTestSuite.js.
 * To display results you'll need to load qunit.css.
 */
if (typeof ForceJSTestSuite === 'undefined') { 

/**
 * Constructor for ForceJSTestSuite
 */
var ForceJSTestSuite = function () {
    SFTestSuite.call(this, "forcejs");
    this.apiVersion = "v36.0";
};

// We are sub-classing SFTestSuite
ForceJSTestSuite.prototype = new SFTestSuite();
ForceJSTestSuite.prototype.constructor = ForceJSTestSuite;

ForceJSTestSuite.prototype.finalizeTest = function() {
    // Unset requestHandler
    force.init({});

    // Call super.finalizeTest()
    SFTestSuite.prototype.finalizeTest.call(this);
};

/** 
 * TEST parseUrl
 */
ForceJSTestSuite.prototype.testParseUrl = function() {
    console.log("In SFForceJSTestSuite.testParseQueryString");

    // No port, no path, no params, no hash
    QUnit.deepEqual(force.parseUrl("https://server.com"),
                    {"protocol":"https:","host":"server.com","hostname":"server.com","port":undefined,"path":"","params":{},"hash":""})

    // Port
    QUnit.deepEqual(force.parseUrl("https://server.com:1234"),
                    {"protocol":"https:","host":"server.com:1234","hostname":"server.com","port":"1234","path":"","params":{},"hash":""})

    // Path
    QUnit.deepEqual(force.parseUrl("https://server.com/path1/path2"),
                    {"protocol":"https:","host":"server.com","hostname":"server.com","port":undefined,"path":"/path1/path2","params":{},"hash":""})

    // Hash
    QUnit.deepEqual(force.parseUrl("https://server.com#hashhash"),
                    {"protocol":"https:","host":"server.com","hostname":"server.com","port":undefined,"path":"","params":{},"hash":"#hashhash"})

    // Params
    QUnit.deepEqual(force.parseUrl("https://server.com?a=b&c=%20d"),
                    {"protocol":"https:","host":"server.com","hostname":"server.com","port":undefined,"path":"","params":{a:"b",c:" d"},"hash":""})

    // Port, path, params, hash
    QUnit.deepEqual(force.parseUrl("https://server.com:1234/path1/path2?a=b&c=%20d#hashhash"),
                    {"protocol":"https:","host":"server.com:1234","hostname":"server.com","port":"1234","path":"/path1/path2","params":{a:"b",c:" d"},"hash":"#hashhash"})

    // Real life examples
    QUnit.deepEqual(force.parseUrl("https://cs1.salesforce.com/services/data/v36.0/query?q=select%20Id%2CName%20from%20Account%20where%20Id%20%3D%20'001S000000p8dcrIAA'"),
                    {"protocol":"https:","host":"cs1.salesforce.com","hostname":"cs1.salesforce.com","port":undefined,"path":"/services/data/v36.0/query","params":{"q":"select Id,Name from Account where Id = '001S000000p8dcrIAA'"},"hash":""});
    QUnit.deepEqual(force.parseUrl("https://cs1.salesforce.com/services/data/v36.0/sobjects/Account/001S000000p8dccIAA?fields=Id%2CName"),
                    {"protocol":"https:","host":"cs1.salesforce.com","hostname":"cs1.salesforce.com","port":undefined,"path":"/services/data/v36.0/sobjects/Account/001S000000p8dccIAA","params":{"fields":"Id,Name"},"hash":""});

    this.finalizeTest();
};

/** 
 * TEST computeWebAppSdkAgent for unrecognized user agents
 */
ForceJSTestSuite.prototype.testComputeWebAppSdkAgentForUnrecognizedUserAgents = function()  {
    console.log("In SFForceJSTestSuite.testComputeWebAppSdkAgentForUnrecognizedUserAgents");

    this.tryUserAgent("Unknown", "Unknown", "Unknown", "Unrecognized agent");
    this.finalizeTest();
}; 


/** 
 * TEST computeWebAppSdkAgent for iOS user agents
 */
ForceJSTestSuite.prototype.testComputeWebAppSdkAgentForIOSUserAgents = function()  {
    console.log("In SFForceJSTestSuite.testComputeWebAppSdkAgentForIOSUserAgents");

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
ForceJSTestSuite.prototype.testComputeWebAppSdkAgentForAndroidUserAgents = function()  {
    console.log("In SFForceJSTestSuite.testComputeWebAppSdkAgentForAndroidUserAgents");

    // User agents taken from http://www.zytrax.com/tech/web/mobile_ids.html
    this.tryUserAgent("android mobile", "4.1.1", "Nexus_7_Build_JRO03D", "Mozilla/5.0 (Linux; U; Android 4.1.1; he-il; Nexus 7 Build/JRO03D) AppleWebKit/534.30 (KHTML, like Gecko) Version/4.1 Safari/534.30");
    this.tryUserAgent("android mobile", "2.1", "Nexus_One_Build_ERD62", "Mozilla/5.0 (Linux; U; Android 2.1; en-us; Nexus One Build/ERD62) AppleWebKit/530.17 (KHTML, like Gecko) Version/4.1 Mobile Safari/530.17");
    this.finalizeTest();
}; 

/** 
 * TEST computeWebAppSdkAgent for WindowsPhone user agents
 */
ForceJSTestSuite.prototype.testComputeWebAppSdkAgentForWindowsPhoneUserAgents = function()  {
    console.log("In SFForceJSTestSuite.testComputeWebAppSdkAgentForWindowsPhoneUserAgents");

    // User agents taken from http://www.zytrax.com/tech/web/mobile_ids.html
    this.tryUserAgent("Windows Phone", "7.0", "7_Trophy", "Mozilla/4.0 (compatible: MSIE 7.0; Windows Phone OS 7.0; Trident/3.1; IEMobile/7.0; HTC; 7 Trophy)");
    this.tryUserAgent("Windows Phone", "7.5", "Lumia_710", "Mozilla/5.0 (compatible; MSIE 9.0; Windows Phone OS 7.5; Trident/5.0; IEMobile/9.0; NOKIA; Lumia 710)");
    this.finalizeTest();
}; 


/** 
 * TEST computeWebAppSdkAgent for desktop user agents
 */
ForceJSTestSuite.prototype.testComputeWebAppSdkAgentForDesktopUserAgents = function()  {
    console.log("In SFForceJSTestSuite.testComputeWebAppSdkAgentForDesktopUserAgents");

    // User agents taken from http://techblog.willshouse.com/2012/01/03/most-common-user-agents/
    this.tryUserAgent("Mac OS", "10.8.4", "Unknown", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/27.0.1453.116 Safari/537.36");
    this.tryUserAgent("Windows", "6.2", "Unknown", "Mozilla/5.0 (Windows NT 6.2; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/27.0.1453.110 Safari/537.36");
    this.tryUserAgent("Windows", "6.1", "Unknown", "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/27.0.1453.110 Safari/537.36");
    this.tryUserAgent("Windows", "5.1", "Unknown", "Mozilla/5.0 (Windows NT 5.1; rv:21.0) Gecko/20100101 Firefox/21.0");
    this.tryUserAgent("Unknown", "Unknown", "Unknown", "Mozilla/5.0 (X11; Linux i686) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/27.0.1453.93 Safari/537.36");
    this.finalizeTest();
}; 

/** 
 * TEST computeEndPointIfMissing
 */
ForceJSTestSuite.prototype.testComputeEndPointIfMissing = function() {
    console.log("In SFForceJSTestSuite.testComputeEndPointIfMissing");

    QUnit.deepEqual(force.computeEndPointIfMissing(undefined, "/services/data"),
                    {endPoint: "/services/data", path:"/"});

    QUnit.deepEqual(force.computeEndPointIfMissing(undefined, "/services/apex/abc"),
                    {endPoint: "/services/apex", path:"/abc"});

    QUnit.deepEqual(force.computeEndPointIfMissing("/services/data", "/versions"),
                    {endPoint: "/services/data", path:"/versions"});

    this.finalizeTest();
}


/** 
 * TEST ownedFilesList
 */
ForceJSTestSuite.prototype.testOwnedFilesList = function()  {
    console.log("In SFForceJSTestSuite.testOwnedFilesList");
    this.setupTestForceForGet();
    QUnit.equals(force.ownedFilesList(), "/" + this.apiVersion + "/connect/files/users/me");
    QUnit.equals(force.ownedFilesList("me"), "/" + this.apiVersion + "/connect/files/users/me");
    QUnit.equals(force.ownedFilesList("someUserId"), "/" + this.apiVersion + "/connect/files/users/someUserId");
    QUnit.equals(force.ownedFilesList(null, 1), "/" + this.apiVersion + "/connect/files/users/me?page=1");
    QUnit.equals(force.ownedFilesList("me", 2), "/" + this.apiVersion + "/connect/files/users/me?page=2");
    QUnit.equals(force.ownedFilesList("someUserId", 3), "/" + this.apiVersion + "/connect/files/users/someUserId?page=3");

    this.finalizeTest();
}; 

/** 
 * TEST filesInUsersGroups
 */
ForceJSTestSuite.prototype.testFilesInUsersGroups = function()  {
    console.log("In SFForceJSTestSuite.testFilesInUsersGroups");
    this.setupTestForceForGet();
    QUnit.equals(force.filesInUsersGroups(), "/" + this.apiVersion + "/connect/files/users/me/filter/groups");
    QUnit.equals(force.filesInUsersGroups("me"), "/" + this.apiVersion + "/connect/files/users/me/filter/groups");
    QUnit.equals(force.filesInUsersGroups("someUserId"), "/" + this.apiVersion + "/connect/files/users/someUserId/filter/groups");
    QUnit.equals(force.filesInUsersGroups(null, 1), "/" + this.apiVersion + "/connect/files/users/me/filter/groups?page=1");
    QUnit.equals(force.filesInUsersGroups("me", 2), "/" + this.apiVersion + "/connect/files/users/me/filter/groups?page=2");
    QUnit.equals(force.filesInUsersGroups("someUserId", 3), "/" + this.apiVersion + "/connect/files/users/someUserId/filter/groups?page=3");
    this.finalizeTest();
}; 

/** 
 * TEST filesSharedWithUser
 */
ForceJSTestSuite.prototype.testFilesSharedWithUser = function()  {
    console.log("In SFForceJSTestSuite.testFilesInUsersGroups");
    this.setupTestForceForGet();
    QUnit.equals(force.filesSharedWithUser(), "/" + this.apiVersion + "/connect/files/users/me/filter/sharedwithme");
    QUnit.equals(force.filesSharedWithUser("me"), "/" + this.apiVersion + "/connect/files/users/me/filter/sharedwithme");
    QUnit.equals(force.filesSharedWithUser("someUserId"), "/" + this.apiVersion + "/connect/files/users/someUserId/filter/sharedwithme");
    QUnit.equals(force.filesSharedWithUser(null, 1), "/" + this.apiVersion + "/connect/files/users/me/filter/sharedwithme?page=1");
    QUnit.equals(force.filesSharedWithUser("me", 2), "/" + this.apiVersion + "/connect/files/users/me/filter/sharedwithme?page=2");
    QUnit.equals(force.filesSharedWithUser("someUserId", 3), "/" + this.apiVersion + "/connect/files/users/someUserId/filter/sharedwithme?page=3");
    this.finalizeTest();
}; 

/** 
 * TEST fileDetails
 */
ForceJSTestSuite.prototype.testFileDetails = function()  {
    console.log("In SFForceJSTestSuite.testFileDetails");
    this.setupTestForceForGet();
    QUnit.equals(force.fileDetails("someFileId"), "/" + this.apiVersion + "/connect/files/someFileId");
    QUnit.equals(force.fileDetails("someFileId", "someVersionNumber"), "/" + this.apiVersion + "/connect/files/someFileId?versionNumber=someVersionNumber");
    this.finalizeTest();
}; 

/** 
 * TEST batchFileDetails
 */
ForceJSTestSuite.prototype.testBatchFileDetails = function()  {
    console.log("In SFForceJSTestSuite.testBatchFileDetails");
    this.setupTestForceForGet();
    QUnit.equals(force.batchFileDetails(["someFileId"]), "/" + this.apiVersion + "/connect/files/batch/someFileId");
    QUnit.equals(force.batchFileDetails(["someFileId", "otherFileId"]), "/" + this.apiVersion + "/connect/files/batch/someFileId,otherFileId");
    QUnit.equals(force.batchFileDetails(["someFileId", "otherFileId", "thirdFileId"]), "/" + this.apiVersion + "/connect/files/batch/someFileId,otherFileId,thirdFileId");
    this.finalizeTest();
}; 

/** 
 * TEST fileShares
 */
ForceJSTestSuite.prototype.testFileShares = function()  {
    console.log("In SFForceJSTestSuite.testFileShares");
    this.setupTestForceForGet();
    QUnit.equals(force.fileShares("fileId"), "/" + this.apiVersion + "/connect/files/fileId/file-shares");
    QUnit.equals(force.fileShares("fileId", 2), "/" + this.apiVersion + "/connect/files/fileId/file-shares?page=2");
    this.finalizeTest();
}; 

/** 
 * TEST addFileShare
 */
ForceJSTestSuite.prototype.testAddFileShare = function()  {
    console.log("In SFForceJSTestSuite.testAddFileShare");
    this.setupTestForce();
    QUnit.deepEqual(force.addFileShare("fileId", "entityId", "shareType"), {path:"/" + this.apiVersion + "/sobjects/ContentDocumentLink", method:"POST", payload:{ContentDocumentId:"fileId", LinkedEntityId:"entityId", ShareType:"shareType"}});
    this.finalizeTest();
}; 

/** 
 * TEST deleteFileShare
 */
ForceJSTestSuite.prototype.testDeleteFileShare = function()  {
    console.log("In SFForceJSTestSuite.testDeleteFileShare");
    this.setupTestForce();
    QUnit.deepEqual(force.deleteFileShare("shareId"), {path:"/" + this.apiVersion + "/sobjects/ContentDocumentLink/shareId", method:"DELETE", payload: undefined});
    this.finalizeTest();
}; 

/**
 * Helper function for user agent testing
 */
ForceJSTestSuite.prototype.tryUserAgent = function(expectedPlatform, expectedPlatformVersion, expectedModel, userAgent) {
    var webAppSdkAgent = force.computeWebAppSdkAgent(userAgent);
    var match = /SalesforceMobileSDK\/5.0.0 ([^\/]*)\/([^\ ]*) \(([^\)]*)\) ([^\/]*)\/1.0 Web (.*)/.exec(webAppSdkAgent);
    if (match != null && match.length == 6) {
        QUnit.equals(match[1], expectedPlatform, "Wrong platform for user agent [" + userAgent + "]");
        QUnit.equals(match[2], expectedPlatformVersion, "Wrong platformVersion for user agent [" + userAgent + "]");
        QUnit.equals(match[3], expectedModel, "Wrong model for user agent [" + userAgent + "]");
        QUnit.equals(match[4], window.location.pathname.split("/").pop(), "Wrong appName for user agent [" + userAgent + "]");
        QUnit.equals(match[5], userAgent, "Wrong user agent appended for user agent [" + userAgent + "]");
    }
    else {
        QUnit.ok(false, "Wrong user agent produced [" + webAppSdkAgent + "] for user agent [" + userAgent + "]");
    }
};

/**
 * Helper function to setup window.force for testing
 */
ForceJSTestSuite.prototype.setupTestForce = function() {
    force.init({
        apiVersion: this.apiVersion,
        requestHandler: function(obj) {
            var obj2 = force.computeEndPointIfMissing(obj.endPoint, obj.path);
            return {path:obj2.path, method:obj.method, payload:obj.data};
        }
    });
};

/**
 * Helper function to setup window.force for testing get requests
 */
ForceJSTestSuite.prototype.setupTestForceForGet = function() {
    force.init({
        apiVersion: this.apiVersion,
        requestHandler: function(obj) {
            var obj2 = force.computeEndPointIfMissing(obj.endPoint, obj.path);
            var encodedData = Object.keys(obj.params || {}).map(function(key) {
                return [key, obj.params[key]].map(encodeURIComponent).join("=");
            }).join("&")
            return obj2.path + (encodedData === "" ? "" : "?" + encodedData);
        }
    });
};

}

