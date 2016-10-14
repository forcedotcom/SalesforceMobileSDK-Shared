/*
 * Copyright (c) 2016-present, salesforce.com, inc.
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
 *
 */

/**
 * 
 * forceJsClient offers the same methods as force from force.js
 * Asynchronous methods return promises instead of expecting successHandler and errorHandler. 
 * 
 * NB you need to include force.js (and optionally force+files.js) before
 *
 */
var forceJsClient = (function(force) {

    if (force === undefined) {
        throw new Error("You need to include force.js before force+promise.js");
    }
    
    var promiser = function(methodName) {
        var retfn = function () {
            var args = Array.prototype.slice.call(arguments);

            return new Promise(function(resolve, reject) {
                args.push(function() {
                    console.debug("------> Calling success handler for force." + methodName);
                    try {
                        resolve.apply(null, arguments);
                    }
                    catch (err) {
                        console.error("------> Error when calling success handler for force." + methodName);
                        console.error(err.stack);
                    }
                });
                args.push(function() {
                    console.debug("------> Calling error handler for force." + methodName);
                    try {
                        reject.apply(null, arguments);
                    }
                    catch (err) {
                        console.error("------> Error when calling error handler for force." + methodName);
                        console.error(err.stack);
                    }
                });
                console.debug("-----> Calling force." + methodName);
                force[methodName].apply(force, args);
            });
        };
        return retfn;
    };

    var client = new Object();

    client.login = promiser("login");
    client.request = promiser("request");
    client.versions = promiser("versions");
    client.resources = promiser("resources");
    client.describeGlobal = promiser("describeGlobal");
    client.metadata = promiser("metadata");
    client.describe = promiser("describe");
    client.describeLayout = promiser("describeLayout");
    client.query = promiser("query");
    client.queryMore = promiser("queryMore");
    client.search = promiser("search");
    client.create = promiser("create");
    client.update = promiser("update");
    client.del = promiser("del");
    client.upsert = promiser("upsert");
    client.retrieve = promiser("retrieve");
    client.apexrest = promiser("apexrest");
    client.chatter = promiser("chatter");
    client.getPickListValues = promiser("getPickListValues");
    client.getAttachment = promiser("getAttachment");

    //Files
    client.ownedFilesList = promiser("ownedFilesList");
    client.filesInUsersGroups = promiser("filesInUsersGroups");
    client.filesSharedWithUser = promiser(" filesSharedWithUser");
    client.fileDetails = promiser("fileDetails");
    client.batchFileDetails = promiser("batchFileDetails");
    client.fileShares = promiser("fileShares");
    client.addFileShare = promiser("addFileShare");
    client.deleteFileShare = promiser("deleteFileShare");

    // API that dont' return a promise
    client.init = force.init;
    client.isAuthenticated = force.isAuthenticated;
    client.getUserId = force.getUserId;
    client.discardToken = force.discardToken;
    client.getRequestBaseURL = force.getRequestBaseURL;

    // The public API
    return client;

})(window.force);
