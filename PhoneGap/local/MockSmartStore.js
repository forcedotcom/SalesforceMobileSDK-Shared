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
  MockSmartStore: a JavaScript SmartStore

  Meant for development and testing only, the data is stored in SessionStorage, queries do full scans.
*/

var MockSmartStore = function(useSessionStorage) {
    this.soups = {};
    this.soupIndexSpecs = {};
    this.cursors = {};
    this.nextSoupEltId = 1;
    this.nextCursorId = 1;
    this.useSessionStorage = useSessionStorage;
};

MockSmartStore.prototype.toJSON = function() {
    var self = this;
    return JSON.stringify({
        soups: self.soups,
        soupIndexSpecs: self.soupIndexSpecs,
        nextSoupEltId: self.nextSoupEltId,
        nextCursorId: self.nextCursorId
    });
}

MockSmartStore.prototype.fromJSON = function(json) {
    var obj = JSON.parse(json);
    this.soups = obj.soups;
    this.soupIndexSpecs = obj.soupIndexSpecs;
    this.cursors = obj.cursors;
    this.nextSoupEltId = obj.nextSoupEltId;
    this.nextCursorId = obj.nextCursorId;
};

MockSmartStore.prototype.checkSoup = function(soupName) {
    if (!this.soupExists(soupName))  throw "Soup: " + soupName + " does not exist";
}

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

MockSmartStore.prototype.upsertSoupEntries = function(soupName, entries, externalIdPath) {
    this.checkSoup(soupName); 
    if (externalIdPath != "_soupEntryId" && !this.indexExists(soupName, externalIdPath)) 
        throw soupName + " does not have an index on " + externalIdPath; 

    var soup = this.soups[soupName];
    var upsertedEntries = [];
    
    for (var i=0; i<entries.length; i++) {
        var entry = JSON.parse(JSON.stringify(entries[i])); // clone
        var isNew = true;

        // upsert by external id
        if (externalIdPath != "_soupEntryId") {
            var externalId = this.project(entry, externalIdPath);
            for (var soupEltId in soup) {
                var soupElt = soup[soupEltId];
                var projection = this.project(soupElt, externalIdPath);
                if (projection == externalId) {
                    if (!isNew) throw "There are more than one soup elements where " + externalIdPath + " is " + externalId;
                    entry._soupEntryId = soupEltId;
                    isNew = false;
                }
            }
        }

        // create
        if (!("_soupEntryId" in entry)) 
            entry._soupEntryId = this.nextSoupEltId++;
        
        // update/insert into soup
        soup[ entry._soupEntryId ] = entry;
        upsertedEntries.push(entry);
    }
    return upsertedEntries;
};

MockSmartStore.prototype.retrieveSoupEntries = function(soupName, entryIds) {
    this.checkSoup(soupName); 
    var soup = this.soups[soupName];
    var entries = [];
    for (var i=0; i<entryIds.length; i++) {
        var entryId = entryIds[i];
        entries.push(soup[entryId]);
    }
    return entries;
}

MockSmartStore.prototype.removeFromSoup = function(soupName, entryIds) {
    this.checkSoup(soupName); 
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
    this.checkSoup(soupName); 
    if (!this.indexExists(soupName, querySpec.indexPath)) throw soupName + " does not have an index on " + querySpec.indexPath; 

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

// Initialize MockSmartStore singleton
MockSmartStore.init = function(useSessionStorage) {
    mockStore = new MockSmartStore(useSessionStorage);

    if (useSessionStorage && window.sessionStorage) {
        // Restore smartstore from storage
        var STORAGE_KEY_MOCKSTORE = "mockStore";
        var json = window.sessionStorage.getItem(STORAGE_KEY_MOCKSTORE);
        if (json) {
            console.log("Getting store from session storage");
            mockStore.fromJSON(json);
        }
        // Save smartstore to storage when onBeforeUnload fires
        $(window).bind('beforeunload', function() {
            if (window.sessionStorage) {
            console.log("Saving store to session storage");
                var json = mockStore.toJSON();
                window.sessionStorage.setItem(STORAGE_KEY_MOCKSTORE, json);
            }
        });
    }
}
