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

/*
  MockSmartStorePlugin

  Implementation of smartstore plugin calls that rely on a MockSmartStore instead of calling container
  Requires cordovaInterceptor.js and MockSmartStore.js
*/

var SMARTSTORE_SERVICE = "com.salesforce.smartstore";

cordova.interceptExec(SMARTSTORE_SERVICE, "pgRegisterSoup", function (successCB, errorCB, args) {
    var soupName = args[0].soupName;
    var indexSpecs = args[0].indexes;
    if (soupName == null) {errorCB("Bogus soup name: " + soupName); return;}
    if (indexSpecs !== undefined && indexSpecs.length == 0) {errorCB("No indexSpecs specified for soup: " + soupName); return;}
    successCB(mockStore.registerSoup(soupName, indexSpecs));
});

cordova.interceptExec(SMARTSTORE_SERVICE, "pgRemoveSoup", function (successCB, errorCB, args) {
    var soupName = args[0].soupName;
    mockStore.removeSoup(soupName);
    successCB("OK");
});

cordova.interceptExec(SMARTSTORE_SERVICE, "pgSoupExists", function (successCB, errorCB, args) {
    var soupName = args[0].soupName;
    successCB(mockStore.soupExists(soupName));
});

cordova.interceptExec(SMARTSTORE_SERVICE, "pgQuerySoup", function (successCB, errorCB, args) {
    var soupName = args[0].soupName;
    var querySpec = args[0].querySpec;
    successCB(mockStore.querySoup(soupName, querySpec));
});

cordova.interceptExec(SMARTSTORE_SERVICE, "pgRetrieveSoupEntries", function (successCB, errorCB, args) {
    var soupName = args[0].soupName;
    var entryIds = args[0].entryIds;
    successCB(mockStore.retrieveSoupEntries(soupName, entryIds));
});

cordova.interceptExec(SMARTSTORE_SERVICE, "pgUpsertSoupEntries", function (successCB, errorCB, args) {
    var soupName = args[0].soupName;
    var entries = args[0].entries;
    var externalIdPath = args[0].externalIdPath;
    successCB(mockStore.upsertSoupEntries(soupName, entries, externalIdPath));
});

cordova.interceptExec(SMARTSTORE_SERVICE, "pgRemoveFromSoup", function (successCB, errorCB, args) {
    var soupName = args[0].soupName;
    var entryIds = args[0].entryIds;
    mockStore.removeFromSoup(soupName, entryIds);
    successCB("OK");
});

cordova.interceptExec(SMARTSTORE_SERVICE, "pgMoveCursorToPageIndex", function (successCB, errorCB, args) {
    var cursorId = args[0].cursorId;
    var index = args[0].index;
    successCB(mockStore.moveCursorToPage(cursorId, index));
});

cordova.interceptExec(SMARTSTORE_SERVICE, "pgCloseCursor", function (successCB, errorCB, args) {
    var cursorId = args[0].cursorId;
    mockStore.closeCursor(cursorId);
    successCB("OK");
});
