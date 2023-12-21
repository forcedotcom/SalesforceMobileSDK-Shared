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
    this.apiVersion = "v59.0";
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
    QUnit.deepEqual(force.parseUrl("https://cs1.salesforce.com/services/data/v59.0/query?q=select%20Id%2CName%20from%20Account%20where%20Id%20%3D%20'001S000000p8dcrIAA'"),
                    {"protocol":"https:","host":"cs1.salesforce.com","hostname":"cs1.salesforce.com","port":undefined,"path":"/services/data/v59.0/query","params":{"q":"select Id,Name from Account where Id = '001S000000p8dcrIAA'"},"hash":""});
    QUnit.deepEqual(force.parseUrl("https://cs1.salesforce.com/services/data/v59.0/sobjects/Account/001S000000p8dccIAA?fields=Id%2CName"),
                    {"protocol":"https:","host":"cs1.salesforce.com","hostname":"cs1.salesforce.com","port":undefined,"path":"/services/data/v59.0/sobjects/Account/001S000000p8dccIAA","params":{"fields":"Id,Name"},"hash":""});

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
 * TEST deleteFileShare
 */
ForceJSTestSuite.prototype.testRestEndpoint = function()  {
    console.log("In SFForceJSTestSuite.testRestEndpoint");
    var self = this;
    forceJsClient.anyrest('https://api.ipify.org?format=json',false,true,{ contentType:"application/json" })
    .then(function(response) {
        QUnit.ok(response.ip!= null,"Response should not be nil");
        self.finalizeTest();
    })
    .catch(function(error) {
         QUnit.ok(error == null, "Error occurred");
         self.finalizeTest();
     });
};

/**
 * TEST restEndpointError
 */
ForceJSTestSuite.prototype.testRestEndpointError = function()  {
    console.log("In SFForceJSTestSuite.testRestEndpointError");
    var self = this;
    // Should error because authenticated is set to not required for an authenticated endpoint
    forceJsClient.anyrest('https://mobilesdk.my.salesforce.com/services/data/' + this.apiVersion +  '/sobjects/Account', false, true, { contentType:"application/json" })
    .then(function(response) {
        QUnit.ok(response.ip == null, "Should error instead");
        self.finalizeTest();
    })
    .catch(function(error) {
        QUnit.ok(error != null, "Error should not be nil");
        var errorObj = JSON.parse(error);
        QUnit.ok(errorObj != null, "Unable to parse error");
        self.finalizeTest();
    })
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

