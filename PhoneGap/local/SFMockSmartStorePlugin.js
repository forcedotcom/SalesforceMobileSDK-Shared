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
   Mock smartstore phonegap plugin implementation 

   It overrides the smartstore phonegap plugin implementation and creates an in-memory smartstore instead of calling out to the container
   This file is meant to be used during development to test code that needs to interact with the smartstore without running inside the container

   NB: This file should be included after phonegap.js and SFSmartStorePlugin.js
*/

// Block calls to container (they use javascript prompt)
window.prompt = function(msg, arg) { 
    SFHybridApp.logToConsole("Called prompt with " + msg + ":" + arg); 
}

// Supply mock implementation for selected plugin calls
PhoneGap.exec = function(successCB, errorCB, service, action, args) {
    SFHybridApp.logToConsole("PhoneGap.exec " + service + ":" + action);

    if (service !== "com.salesforce.smartstore") {
        SFHybridApp.logToConsole("No mock for " + service + ":" + action);
        return;
    }

    if (action === "pgRegisterSoup") {
        var soupName = args[0].soupName;
        var indexSpecs = args[0].indexes;

        if (soupName == null) {errorCB("Bogus soup name: " + soupName); return;}
        if (indexSpecs !== undefined && indexSpecs.length == 0) {errorCB("No indexSpecs specified for soup: " + soupName); return;}

        successCB(mockStore.registerSoup(soupName, indexSpecs));
    }
    else if (action === "pgRemoveSoup") {
        var soupName = args[0].soupName;

        mockStore.removeSoup(soupName);
        successCB("OK");
    }
    else if (action === "pgSoupExists") {
        var soupName = args[0].soupName;

        successCB(mockStore.soupExists(soupName));
    }
    else if (action === "pgQuerySoup") {
        var soupName = args[0].soupName;
        var querySpec = args[0].querySpec;

        if (!mockStore.soupExists(soupName)) { errorCB("Soup: " + soupName + " does not exist"); return; }
        if (!mockStore.indexExists(soupName, querySpec.indexPath)) { 
            errorCB(soupName + " does not have an index on " + querySpec.indexPath); return; 
        }
        successCB(mockStore.querySoup(soupName, querySpec));
    }
    else if (action === "pgRetrieveSoupEntries") {
        var soupName = args[0].soupName;
        var entryIds = args[0].entryIds;

        if (!mockStore.soupExists(soupName)) { errorCB("Soup: " + soupName + " does not exist"); return; }
        successCB(mockStore.retrieveSoupEntries(soupName, entryIds));
    }
    else if (action === "pgUpsertSoupEntries") {
        var soupName = args[0].soupName;
        var entries = args[0].entries;

        if (!mockStore.soupExists(soupName)) { errorCB("Soup: " + soupName + " does not exist"); return; }
        successCB(mockStore.upsertSoupEntries(soupName, entries));
    }
    else if (action === "pgRemoveFromSoup") {
        var soupName = args[0].soupName;
        var entryIds = args[0].entryIds;

        if (!mockStore.soupExists(soupName)) { errorCB("Soup: " + soupName + " does not exist"); return; }
        mockStore.removeFromSoup(soupName, entryIds);
        successCB("OK");
    }
    else if (action === "pgMoveCursorToPageIndex") {
        var cursorId = args[0].cursorId;
        var index = args[0].index;

        successCB(mockStore.moveCursorToPage(cursorId, index));
    }
    else if (action === "pgCloseCursor") {
        var cursorId = args[0].cursorId;

        mockStore.closeCursor(cursorId);
        successCB("OK");
    }
    else {
        SFHybridApp.logToConsole("No mock for " + service + ":" + action);
        return;
    }
};


// Mock smart store class 
var MockSmartStore = function() {
    this.soups = {};
    this.soupIndexSpecs = {};
    this.cursors = {};
    this.nextSoupId = 0;
    this.nextCursorId = 0;
};


MockSmartStore.prototype.soupExists = function(soupName) {
    return this.soups[soupName] !== undefined;
};

MockSmartStore.prototype.indexExists = function(soupName, indexPath) {
    var indexSpecs = this.soupIndexSpecs[soupName];
    if (indexSpecs != null) {
        for (var i=0; i<indexSpecs.length; i++) {
            var indexSpec = indexSpecs[i];
            if (indexSpec.path == indexPath) {
                return true;
            }
        }
    }
    return false;
}

MockSmartStore.prototype.registerSoup = function(soupName, indexSpecs) {
    if (!this.soupExists(soupName)) {
        this.soups[soupName] = {};
        this.soupIndexSpecs[soupName] = indexSpecs;
    }
    return soupName;
};


MockSmartStore.prototype.removeSoup = function(soupName) {
    delete this.soups[soupName];
    delete this.soupIndexSpecs[soupName];
};


MockSmartStore.prototype.upsertSoupEntries = function(soupName, entries) {
    var soup = this.soups[soupName];
    
    for (var i=0; i<entries.length; i++) {
        var entry = entries[i];
        if (entry._soupEntryId === undefined) {
            entry._soupEntryId = this.nextSoupId++;
        }
        soup[ entry._soupEntryId ] = entry;
    }

    // XXX we should clone instead of modifying in place
    return entries;
};


MockSmartStore.prototype.retrieveSoupEntries = function(soupName, entryIds) {
    var soup = this.soups[soupName];
    var entries = [];
    for (var i=0; i<entryIds.length; i++) {
        var entryId = entryIds[i];
        entries.push(soup[entryId]);
    }
    return entries;
}


MockSmartStore.prototype.removeFromSoup = function(soupName, entryIds) {
    var soup = this.soups[soupName];
    for (var i=0; i<entryIds.length; i++) {
        var entryId = entryIds[i];
        delete soup[entryId];
    }
};


MockSmartStore.prototype.project = function(soupElt, path) {
    var pathElements = path.split(".");
    var o = soupElt;
    for (var i = 0; i<pathElements.length; i++) {
        var pathElement = pathElements[i];
        o = o[pathElement];
    }
    return o;
};

MockSmartStore.prototype.querySoupFull = function(soupName, querySpec) {
    var soup = this.soups[soupName];
    var results = [];
    var likeRegexp = (querySpec.likeKey ? new RegExp(querySpec.likeKey.replace(/%/g, ".*")) : null);
    for (var soupEntryId in soup) {
        var soupElt = soup[soupEntryId];
        var projection = this.project(soupElt, querySpec.indexPath);
        if (querySpec.queryType === "exact") {
            if (projection == querySpec.matchKey) {
                results.push(soupElt);
            }
        }
        else if (querySpec.queryType === "range") {
            if ((querySpec.beginKey == null || projection >= querySpec.beginKey)
                && (querySpec.endKey == null || projection <= querySpec.endKey)) {
                    results.push(soupElt);
                }
        }
        else if (querySpec.queryType === "like") {
            if (projection.match(likeRegexp)) {
                results.push(soupElt);
            }
        }
    }

    results.sort(function(soupElt1,soupElt2) {
        var p1 = soupElt1[querySpec.indexPath];
        var p2 = soupElt2[querySpec.indexPath];
        var compare = ( p1 > p2 ? 1 : (p1 == p2 ? 0 : -1));
        return (querySpec.order == "ascending" ? compare : -compare);
    });

    return results;
};


MockSmartStore.prototype.querySoup = function(soupName, querySpec) {
    var results = this.querySoupFull(soupName, querySpec);
    var cursorId = this.nextCursorId++;
    var cursor = {
        cursorId: cursorId, 
        soupName: soupName, 
        querySpec: querySpec, 
        pageSize: querySpec.pageSize,
        currentPageIndex: 0,
        currentPageOrderedEntries: results.slice(0, querySpec.pageSize),
        totalPages: Math.ceil(results.length / querySpec.pageSize)
    };

    this.cursors[cursorId] = cursor;
    return cursor;
};

MockSmartStore.prototype.moveCursorToPage = function(cursorId, pageIndex) {
    var cursor = this.cursors[cursorId];
    var querySpec = cursor.querySpec;
    var results = this.querySoupFull(cursor.soupName, querySpec);

    cursor.currentPageIndex = pageIndex;
    cursor.currentPageOrderedEntries = results.slice(pageIndex*querySpec.pageSize, (pageIndex+1)*querySpec.pageSize);

    return cursor;
};

MockSmartStore.prototype.closeCursor = function(cursorId) {
    delete this.cursors[cursorId];
};

// Mock smart store instance
if (typeof mockStore === "undefined") {
    mockStore = new MockSmartStore();
}