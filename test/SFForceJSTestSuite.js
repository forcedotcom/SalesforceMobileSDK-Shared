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
 * TEST ownedFilesList
 */
ForceJSTestSuite.prototype.testOwnedFilesList = function()  {
    console.log("In SFForceJSTestSuite.testOwnedFilesList");
    this.setupTestForceForGet();
    QUnit.equals(force.ownedFilesList(), "/" + this.apiVersion + "/chatter/users/me/files");
    QUnit.equals(force.ownedFilesList("me"), "/" + this.apiVersion + "/chatter/users/me/files");
    QUnit.equals(force.ownedFilesList("someUserId"), "/" + this.apiVersion + "/chatter/users/someUserId/files");
    QUnit.equals(force.ownedFilesList(null, 1), "/" + this.apiVersion + "/chatter/users/me/files?page=1");
    QUnit.equals(force.ownedFilesList("me", 2), "/" + this.apiVersion + "/chatter/users/me/files?page=2");
    QUnit.equals(force.ownedFilesList("someUserId", 3), "/" + this.apiVersion + "/chatter/users/someUserId/files?page=3");

    this.finalizeTest();
}; 

/** 
 * TEST filesInUsersGroups
 */
ForceJSTestSuite.prototype.testFilesInUsersGroups = function()  {
    console.log("In SFForceJSTestSuite.testFilesInUsersGroups");
    this.setupTestForceForGet();
    QUnit.equals(force.filesInUsersGroups(), "/" + this.apiVersion + "/chatter/users/me/files/filter/groups");
    QUnit.equals(force.filesInUsersGroups("me"), "/" + this.apiVersion + "/chatter/users/me/files/filter/groups");
    QUnit.equals(force.filesInUsersGroups("someUserId"), "/" + this.apiVersion + "/chatter/users/someUserId/files/filter/groups");
    QUnit.equals(force.filesInUsersGroups(null, 1), "/" + this.apiVersion + "/chatter/users/me/files/filter/groups?page=1");
    QUnit.equals(force.filesInUsersGroups("me", 2), "/" + this.apiVersion + "/chatter/users/me/files/filter/groups?page=2");
    QUnit.equals(force.filesInUsersGroups("someUserId", 3), "/" + this.apiVersion + "/chatter/users/someUserId/files/filter/groups?page=3");
    this.finalizeTest();
}; 

/** 
 * TEST filesSharedWithUser
 */
ForceJSTestSuite.prototype.testFilesSharedWithUser = function()  {
    console.log("In SFForceJSTestSuite.testFilesInUsersGroups");
    this.setupTestForceForGet();
    QUnit.equals(force.filesSharedWithUser(), "/" + this.apiVersion + "/chatter/users/me/files/filter/sharedwithme");
    QUnit.equals(force.filesSharedWithUser("me"), "/" + this.apiVersion + "/chatter/users/me/files/filter/sharedwithme");
    QUnit.equals(force.filesSharedWithUser("someUserId"), "/" + this.apiVersion + "/chatter/users/someUserId/files/filter/sharedwithme");
    QUnit.equals(force.filesSharedWithUser(null, 1), "/" + this.apiVersion + "/chatter/users/me/files/filter/sharedwithme?page=1");
    QUnit.equals(force.filesSharedWithUser("me", 2), "/" + this.apiVersion + "/chatter/users/me/files/filter/sharedwithme?page=2");
    QUnit.equals(force.filesSharedWithUser("someUserId", 3), "/" + this.apiVersion + "/chatter/users/someUserId/files/filter/sharedwithme?page=3");
    this.finalizeTest();
}; 

/** 
 * TEST fileDetails
 */
ForceJSTestSuite.prototype.testFileDetails = function()  {
    console.log("In SFForceJSTestSuite.testFileDetails");
    this.setupTestForceForGet();
    QUnit.equals(force.fileDetails("someFileId"), "/" + this.apiVersion + "/chatter/files/someFileId");
    QUnit.equals(force.fileDetails("someFileId", "someVersionNumber"), "/" + this.apiVersion + "/chatter/files/someFileId?versionNumber=someVersionNumber");
    this.finalizeTest();
}; 

/** 
 * TEST batchFileDetails
 */
ForceJSTestSuite.prototype.testBatchFileDetails = function()  {
    console.log("In SFForceJSTestSuite.testBatchFileDetails");
    this.setupTestForceForGet();
    QUnit.equals(force.batchFileDetails(["someFileId"]), "/" + this.apiVersion + "/chatter/files/batch/someFileId");
    QUnit.equals(force.batchFileDetails(["someFileId", "otherFileId"]), "/" + this.apiVersion + "/chatter/files/batch/someFileId,otherFileId");
    QUnit.equals(force.batchFileDetails(["someFileId", "otherFileId", "thirdFileId"]), "/" + this.apiVersion + "/chatter/files/batch/someFileId,otherFileId,thirdFileId");
    this.finalizeTest();
}; 

/** 
 * TEST fileRenditionPath
 */
ForceJSTestSuite.prototype.testFileRenditionPath = function()  {
    console.log("In SFForceJSTestSuite.testFileRenditionPath");
    this.setupTestForceForBinary();
    // only rendition type provided
    QUnit.equals(force.fileRenditionPath("someFileId", null, "FLASH"), "/" + this.apiVersion + "/chatter/files/someFileId/rendition?type=FLASH");
    QUnit.equals(force.fileRenditionPath("someFileId", null, "PDF"), "/" + this.apiVersion + "/chatter/files/someFileId/rendition?type=PDF");
    QUnit.equals(force.fileRenditionPath("someFileId", null, "THUMB120BY90"), "/" + this.apiVersion + "/chatter/files/someFileId/rendition?type=THUMB120BY90");
    QUnit.equals(force.fileRenditionPath("someFileId", null, "THUMB240BY180"), "/" + this.apiVersion + "/chatter/files/someFileId/rendition?type=THUMB240BY180");
    QUnit.equals(force.fileRenditionPath("someFileId", null, "THUMB720BY480"), "/" + this.apiVersion + "/chatter/files/someFileId/rendition?type=THUMB720BY480");
    // rendition type and version provided
    QUnit.equals(force.fileRenditionPath("someFileId", "someVersionNumber", "FLASH"), "/" + this.apiVersion + "/chatter/files/someFileId/rendition?type=FLASH&versionNumber=someVersionNumber");
    QUnit.equals(force.fileRenditionPath("someFileId", "someVersionNumber", "PDF"), "/" + this.apiVersion + "/chatter/files/someFileId/rendition?type=PDF&versionNumber=someVersionNumber");
    QUnit.equals(force.fileRenditionPath("someFileId", "someVersionNumber", "THUMB120BY90"), "/" + this.apiVersion + "/chatter/files/someFileId/rendition?type=THUMB120BY90&versionNumber=someVersionNumber");
    QUnit.equals(force.fileRenditionPath("someFileId", "someVersionNumber", "THUMB240BY180"), "/" + this.apiVersion + "/chatter/files/someFileId/rendition?type=THUMB240BY180&versionNumber=someVersionNumber");
    QUnit.equals(force.fileRenditionPath("someFileId", "someVersionNumber", "THUMB720BY480"), "/" + this.apiVersion + "/chatter/files/someFileId/rendition?type=THUMB720BY480&versionNumber=someVersionNumber");
    // rendition type and page number provided
    QUnit.equals(force.fileRenditionPath("someFileId", null, "FLASH", 3), "/" + this.apiVersion + "/chatter/files/someFileId/rendition?type=FLASH&page=3");
    QUnit.equals(force.fileRenditionPath("someFileId", null, "PDF", 3), "/" + this.apiVersion + "/chatter/files/someFileId/rendition?type=PDF&page=3");
    QUnit.equals(force.fileRenditionPath("someFileId", null, "THUMB120BY90", 3), "/" + this.apiVersion + "/chatter/files/someFileId/rendition?type=THUMB120BY90&page=3");
    QUnit.equals(force.fileRenditionPath("someFileId", null, "THUMB240BY180", 3), "/" + this.apiVersion + "/chatter/files/someFileId/rendition?type=THUMB240BY180&page=3");
    QUnit.equals(force.fileRenditionPath("someFileId", null, "THUMB720BY480", 3), "/" + this.apiVersion + "/chatter/files/someFileId/rendition?type=THUMB720BY480&page=3");
    // rendition type, version and page number provided
    QUnit.equals(force.fileRenditionPath("someFileId", "someVersionNumber", "FLASH", 3), "/" + this.apiVersion + "/chatter/files/someFileId/rendition?type=FLASH&versionNumber=someVersionNumber&page=3");
    QUnit.equals(force.fileRenditionPath("someFileId", "someVersionNumber", "PDF", 3), "/" + this.apiVersion + "/chatter/files/someFileId/rendition?type=PDF&versionNumber=someVersionNumber&page=3");
    QUnit.equals(force.fileRenditionPath("someFileId", "someVersionNumber", "THUMB120BY90", 3), "/" + this.apiVersion + "/chatter/files/someFileId/rendition?type=THUMB120BY90&versionNumber=someVersionNumber&page=3");
    QUnit.equals(force.fileRenditionPath("someFileId", "someVersionNumber", "THUMB240BY180", 3), "/" + this.apiVersion + "/chatter/files/someFileId/rendition?type=THUMB240BY180&versionNumber=someVersionNumber&page=3");
    QUnit.equals(force.fileRenditionPath("someFileId", "someVersionNumber", "THUMB720BY480", 3), "/" + this.apiVersion + "/chatter/files/someFileId/rendition?type=THUMB720BY480&versionNumber=someVersionNumber&page=3");

    this.finalizeTest();
}; 

/** 
 * TEST fileRendition
 */
ForceJSTestSuite.prototype.testFileRendition = function()  {
    console.log("In SFForceJSTestSuite.testFileRendition");
    this.setupTestForceForBinary();
    // only rendition type provided
    QUnit.deepEqual(force.fileRendition("someFileId", null, "FLASH"), ["/" + this.apiVersion + "/chatter/files/someFileId/rendition?type=FLASH", "application/x-shockwave-flash"]);
    QUnit.deepEqual(force.fileRendition("someFileId", null, "PDF"), ["/" + this.apiVersion + "/chatter/files/someFileId/rendition?type=PDF", "application/pdf"]);
    QUnit.deepEqual(force.fileRendition("someFileId", null, "THUMB120BY90"), ["/" + this.apiVersion + "/chatter/files/someFileId/rendition?type=THUMB120BY90", "image/jpeg"]);
    QUnit.deepEqual(force.fileRendition("someFileId", null, "THUMB240BY180"), ["/" + this.apiVersion + "/chatter/files/someFileId/rendition?type=THUMB240BY180", "image/jpeg"]);
    QUnit.deepEqual(force.fileRendition("someFileId", null, "THUMB720BY480"), ["/" + this.apiVersion + "/chatter/files/someFileId/rendition?type=THUMB720BY480", "image/jpeg"]);
    // rendition type and version provided
    QUnit.deepEqual(force.fileRendition("someFileId", "someVersionNumber", "FLASH"), ["/" + this.apiVersion + "/chatter/files/someFileId/rendition?type=FLASH&versionNumber=someVersionNumber", "application/x-shockwave-flash"]);
    QUnit.deepEqual(force.fileRendition("someFileId", "someVersionNumber", "PDF"), ["/" + this.apiVersion + "/chatter/files/someFileId/rendition?type=PDF&versionNumber=someVersionNumber", "application/pdf"]);
    QUnit.deepEqual(force.fileRendition("someFileId", "someVersionNumber", "THUMB120BY90"), ["/" + this.apiVersion + "/chatter/files/someFileId/rendition?type=THUMB120BY90&versionNumber=someVersionNumber", "image/jpeg"]);
    QUnit.deepEqual(force.fileRendition("someFileId", "someVersionNumber", "THUMB240BY180"), ["/" + this.apiVersion + "/chatter/files/someFileId/rendition?type=THUMB240BY180&versionNumber=someVersionNumber", "image/jpeg"]);
    QUnit.deepEqual(force.fileRendition("someFileId", "someVersionNumber", "THUMB720BY480"), ["/" + this.apiVersion + "/chatter/files/someFileId/rendition?type=THUMB720BY480&versionNumber=someVersionNumber", "image/jpeg"]);
    // rendition type and page number provided
    QUnit.deepEqual(force.fileRendition("someFileId", null, "FLASH", 3), ["/" + this.apiVersion + "/chatter/files/someFileId/rendition?type=FLASH&page=3", "application/x-shockwave-flash"]);
    QUnit.deepEqual(force.fileRendition("someFileId", null, "PDF", 3), ["/" + this.apiVersion + "/chatter/files/someFileId/rendition?type=PDF&page=3", "application/pdf"]);
    QUnit.deepEqual(force.fileRendition("someFileId", null, "THUMB120BY90", 3), ["/" + this.apiVersion + "/chatter/files/someFileId/rendition?type=THUMB120BY90&page=3", "image/jpeg"]);
    QUnit.deepEqual(force.fileRendition("someFileId", null, "THUMB240BY180", 3), ["/" + this.apiVersion + "/chatter/files/someFileId/rendition?type=THUMB240BY180&page=3", "image/jpeg"]);
    QUnit.deepEqual(force.fileRendition("someFileId", null, "THUMB720BY480", 3), ["/" + this.apiVersion + "/chatter/files/someFileId/rendition?type=THUMB720BY480&page=3", "image/jpeg"]);
    // rendition type, version and page number provided
    QUnit.deepEqual(force.fileRendition("someFileId", "someVersionNumber", "FLASH", 3), ["/" + this.apiVersion + "/chatter/files/someFileId/rendition?type=FLASH&versionNumber=someVersionNumber&page=3", "application/x-shockwave-flash"]);
    QUnit.deepEqual(force.fileRendition("someFileId", "someVersionNumber", "PDF", 3), ["/" + this.apiVersion + "/chatter/files/someFileId/rendition?type=PDF&versionNumber=someVersionNumber&page=3", "application/pdf"]);
    QUnit.deepEqual(force.fileRendition("someFileId", "someVersionNumber", "THUMB120BY90", 3), ["/" + this.apiVersion + "/chatter/files/someFileId/rendition?type=THUMB120BY90&versionNumber=someVersionNumber&page=3", "image/jpeg"]);
    QUnit.deepEqual(force.fileRendition("someFileId", "someVersionNumber", "THUMB240BY180", 3), ["/" + this.apiVersion + "/chatter/files/someFileId/rendition?type=THUMB240BY180&versionNumber=someVersionNumber&page=3", "image/jpeg"]);
    QUnit.deepEqual(force.fileRendition("someFileId", "someVersionNumber", "THUMB720BY480", 3), ["/" + this.apiVersion + "/chatter/files/someFileId/rendition?type=THUMB720BY480&versionNumber=someVersionNumber&page=3", "image/jpeg"]);

    this.finalizeTest();
}; 

/** 
 * TEST fileContentsPath
 */
ForceJSTestSuite.prototype.testFileContentsPath = function()  {
    console.log("In SFForceJSTestSuite.testFileContentsPath");
    this.setupTestForceForBinary();
    QUnit.equals(force.fileContentsPath("someFileId"), "/" + this.apiVersion + "/chatter/files/someFileId/content");
    QUnit.deepEqual(force.fileContentsPath("someFileId", "someVersionNumber"), "/" + this.apiVersion + "/chatter/files/someFileId/content?versionNumber=someVersionNumber");
    this.finalizeTest();
}; 

/** 
 * TEST fileContents
 */
ForceJSTestSuite.prototype.testFileContents = function()  {
    console.log("In SFForceJSTestSuite.testFileContents");
    this.setupTestForceForBinary();
    QUnit.deepEqual(force.fileContents("someFileId"), ["/" + this.apiVersion + "/chatter/files/someFileId/content", null]);
    QUnit.deepEqual(force.fileContents("someFileId", "someVersionNumber"), ["/" + this.apiVersion + "/chatter/files/someFileId/content?versionNumber=someVersionNumber", null]);
    this.finalizeTest();
}; 

/** 
 * TEST fileShares
 */
ForceJSTestSuite.prototype.testFileShares = function()  {
    console.log("In SFForceJSTestSuite.testFileShares");
    this.setupTestForceForGet();
    QUnit.equals(force.fileShares("fileId"), "/" + this.apiVersion + "/chatter/files/fileId/file-shares");
    QUnit.equals(force.fileShares("fileId", 2), "/" + this.apiVersion + "/chatter/files/fileId/file-shares?page=2");
    this.finalizeTest();
}; 

/** 
 * TEST addFileShare
 */
ForceJSTestSuite.prototype.testAddFileShare = function()  {
    console.log("In SFForceJSTestSuite.testAddFileShare");
    this.setupTestForce();
    QUnit.deepEqual(force.addFileShare("fileId", "entityId", "shareType"), {path:"/" + this.apiVersion + "/sobjects/ContentDocumentLink/", method:"POST", payload:'{"ContentDocumentId":"fileId","LinkedEntityId":"entityId","ShareType":"shareType"}'});
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

/**
 * Helper function to setup window.force for testing binary fetching
 */
ForceJSTestSuite.prototype.setupTestForceForBinary = function() {
    force.init({apiVersion: this.apiVersion});
    force.getChatterFile = function(path, mimeType) { return [path, mimeType]; }
};

}

