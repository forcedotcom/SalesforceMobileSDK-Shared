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

var SOUP_ENTRY_ID = "_soupEntryId";
var inMemSmartStore = {};
var nextId = 0;

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
        // Expected args: [{":soupName, "indexes":indexSpecs}]
        var soupName = args[0]["soupName"];
        var indexSpecs = args[0]["indexes"];
        if (soupName == null) {
            errorCB("Bogus soup name: " + soupName);
        }
        else if (indexSpecs !== undefined && indexSpecs.length == 0) {
            errorCB("No indexSpecs specified for soup: " + soupName);
        }
        else {
            if (inMemSmartStore[soupName] === undefined) {
                inMemSmartStore[soupName] = {};
            }
            successCB(soupName);
        }
    }
    else if (action === "pgRemoveSoup") {
        // Expected args: [{"soupName":soupName}]
        var soupName = args[0]["soupName"];
        delete inMemSmartStore[soupName];
        successCB();
    }
    else if (action === "pgSoupExists") {
        // Expected args: [{"soupName":soupName}]
        var soupName = args[0]["soupName"];
        successCB(inMemSmartStore[soupName] !== undefined);
    }
    else if (action === "pgQuerySoup") {
        // Expected args: [{"soupName":soupName, "querySpec":querySpec}]
        var soupName = args[0]["soupName"];
        var querySpec = args[0]["querySpec"];
        // XXX implement!
        successCB([]); 
    }
    else if (action === "pgRetrieveSoupEntries") {
        // Expected args: [{"soupName":soupName, "entryIds":entryIds}]
        var soupName = args[0]["soupName"];
        var entryIds = args[0]["entryIds"];
        var soup = inMemSmartStore[soupName];
        var entries = [];
        for (var i=0; i<entryIds.length; i++) {
            var entryId = entryIds[i];
            entries.push(soup[entryId]);
        }
        successCB(entries);
    }
    else if (action === "pgUpsertSoupEntries") {
        // Expected args: [{"soupName":soupName, "entries":entries}]
        var soupName = args[0]["soupName"];
        var entries = args[0]["entries"];
        var soup = inMemSmartStore[soupName];
        if (soup === undefined) {
            errorCB("Soup: " + soupName + " does not exist");
            return;
        }
        // XXX we should clone instead of modifying in place
        for (var i=0; i<entries.length; i++) {
            var entry = entries[i];
            if (entry[SOUP_ENTRY_ID] === undefined) {
                entry[SOUP_ENTRY_ID] = nextId++;
            }
            soup[ entry[SOUP_ENTRY_ID] ] = entry;
        }
        successCB(entries);
    }
    else if (action === "pgRemoveFromSoup") {
        // Expected args: [{"soupName":soupName, "entryIds":entryIds}]
        var soupName = args[0]["soupName"];
        var entryIds = args[0]["entryIds"];
        var soup = inMemSmartStore[soupName];
        for (var i=0; i<entryIds.length; i++) {
            var entryId = entryIds[i];
            delete soup[entryId];
        }
        successCB();
    }
    else if (action === "pgMoveCursorToPageIndex") {
        // Expected args: [{"cursorId":cursor.cursorId, "index":newPageIndex}]
        // XXX implement!
        successCB();
    }
    else if (action === "pgCloseCursor") {
        // Expected args: [{"cursorId":cursor.cursorId}]
        successCB();
    }
    else {
        SFHybridApp.logToConsole("No mock for " + service + ":" + action);
        return;
    }
};