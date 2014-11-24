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
 * A load test suite for SmartStore
 * This file assumes that qunit.js has been previously loaded, as well as jquery.js,  SFTestSuite.js and SFAbstractSmartStoreTestSuite.js
 * To display results you'll need to load qunit.css.
 */
if (typeof SmartStoreLoadTestSuite === 'undefined') { 

/**
 * Constructor for SmartStoreLoadTestSuite
 */
var SmartStoreLoadTestSuite = function () {
    AbstractSmartStoreTestSuite.call(this, 
                                     "smartstoreload",
                                     "PerfTestSoup",
                                     [
		                                 {path:"key", type:"string"}, 
		                                 {path:"Id", type:"string"}
		                             ]);

	this.MAX_NUMBER_ENTRIES = 2048;
	this.MAX_NUMBER_FIELDS = 2048;
	this.MAX_FIELD_LENGTH = 65536;
    this.NUMBER_FIELDS_PER_ENTRY = 128;
    this.NUMBER_ENTRIES_PER_BATCH = 8;
    this.NUMBER_BATCHES = 32;
    this.QUERY_PAGE_SIZE = 8;
	this.testIndexPath = "key";
};

// We are sub-classing AbstractSmartStoreTestSuite
SmartStoreLoadTestSuite.prototype = new AbstractSmartStoreTestSuite();
SmartStoreLoadTestSuite.prototype.constructor = SmartStoreLoadTestSuite;


/**
 * TEST: Upsert 1,2,...,MAX_NUMBER_ENTRIES entries (with just a couple of fields) into a soup
 */

SmartStoreLoadTestSuite.prototype.upsertNextEntries = function(k) {
	console.log("upsertNextEntries " + k);
	var self = this;
	var entries = [];

	for (var i=0; i< k; i++) {
		entries.push({key: "k_" + k + '_' + i, value:"x"+i});
	}	
	
	return self.addEntriesToTestSoup(entries)
        .pipe(function(updatedEntries) {
			if (updatedEntries.length < self.MAX_NUMBER_ENTRIES) {
				return self.upsertNextEntries(k*2);
			}
		});
};


SmartStoreLoadTestSuite.prototype.testUpsertManyEntries  = function() {
	console.log("In testUpsertManyEntries");
	var self = this;
    
    self.upsertNextEntries(1)
        .done(function() {
            self.finalizeTest();
        });
};


/**
 * TEST: Upsert entries with 1,2,...,MAX_NUMBER_FIELDS into a soup
 */
SmartStoreLoadTestSuite.prototype.upsertNextManyFieldsEntry = function(k) {
	console.log("upsertNextManyFieldsEntry " + k);
	var self = this;
	var entry = {key: "k"+k};

	for (var i=0; i< k; i++) {
		entry["v"+i] = "value_" + i;
	}
	
	return self.addEntriesToTestSoup([entry])
        .pipe(function(updatedEntries) {
			if (k < self.MAX_NUMBER_FIELDS) {
				return self.upsertNextManyFieldsEntry(k*2);
			}
        });
};

SmartStoreLoadTestSuite.prototype.testNumerousFields = function() {
	console.log("In testNumerousFields");
	var self = this;

	self.upsertNextManyFieldsEntry(1)
        .done(function() {
            self.finalizeTest();
        });
};


/**
 * TEST: Upsert entry with a value field that is 1,2, ... , MAX_FIELD_LENGTH long into a soup
 */
SmartStoreLoadTestSuite.prototype.upsertNextLargerFieldEntry = function(k) {
	console.log("upsertNextLargerFieldEntry " + k);
	var self = this;

	var val = "";
	for (var i=0; i< k; i++) {
		val = val + "x";
	}
	var entry = {key: "k"+k, value:val};
	
	return self.addEntriesToTestSoup([entry])
        .pipe(function(updatedEntries) {
			if (k < self.MAX_FIELD_LENGTH) {
				return self.upsertNextLargerFieldEntry(k*2);
            }
		});
};

SmartStoreLoadTestSuite.prototype.testIncreasingFieldLength  = function() {
	console.log("In testIncreasingFieldLength");
	var self = this;

	self.upsertNextLargerFieldEntry(1)
        .done(function() {
            self.finalizeTest();
        });
};

/**
 * TEST: Upsert MAX_NUMBER_ENTRIES entries into a soup and retrieve them back
 */
SmartStoreLoadTestSuite.prototype.testAddAndRetrieveManyEntries  = function() {
	console.log("In testAddAndRetrieveManyEntries");
	var self = this;
    var addedEntries;
    var retrievedIds = [];
	
	self.addGeneratedEntriesToTestSoup(self.MAX_NUMBER_ENTRIES)
        .pipe(function(entries) {
            addedEntries = entries;
			for (var i = 0; i < addedEntries.length; i++) {
				retrievedIds.push(addedEntries[i]._soupEntryId);
			}
					
			return self.retrieveSoupEntries(self.defaultSoupName, retrievedIds);
        })
    .done(function(retrievedEntries) {
		QUnit.equal(retrievedEntries.length, addedEntries.length,"verify retrieved matches added");
		QUnit.equal(retrievedEntries[0]._soupEntryId,retrievedIds[0],"verify retrieved ID");
        self.finalizeTest();
    });
};


/**
 * TEST: Upsert NUMBER_BATCHES batches of NUMBER_ENTRIES_PER_BATCH entries with NUMBER_FIELDS_PER_ENTRY fields into a soup and query all (fetching only a page of QUERY_PAGE_SIZE entries)
 */

SmartStoreLoadTestSuite.prototype.upsertQueryEntries = function(batch) {
    var startKey = batch * this.NUMBER_ENTRIES_PER_BATCH;
    var endKey = (batch+1) * this.NUMBER_ENTRIES_PER_BATCH;
    console.log("upsertQueryEntries " + startKey + " .. " + endKey);
    var self = this;
    var entries = [];
    
    for (var i=startKey; i<endKey; i++) {
        var entry = {key: "k_" + i, value:"x"+i};
        for (var j=0; j < self.NUMBER_FIELDS_PER_ENTRY; j++) {
            entry["v"+j] = "value_" + j;
        }
        entries.push(entry);
    }
    
    return self.addEntriesToTestSoup(entries)
        .pipe(function(updatedentries) {
            var querySpec = navigator.smartstore.buildAllQuerySpec("key",null, self.QUERY_PAGE_SIZE);
            return self.querySoup(self.defaultSoupName, querySpec);
        })
        .pipe(function(cursor) {
            QUnit.equal(cursor.totalPages, Math.ceil(endKey/self.QUERY_PAGE_SIZE))
            return self.closeCursor(cursor);
        })
        .pipe(function() {
            if (batch < self.NUMBER_BATCHES - 1) {
                return self.upsertQueryEntries(batch + 1);
            }
        });
};


SmartStoreLoadTestSuite.prototype.testUpsertAndQueryEntries  = function() {
    console.log("In testUpsertAndQueryEntries");
    var self = this;
    
    self.upsertQueryEntries(0)
        .done(function() {
            self.finalizeTest();
        });
};
    
SmartStoreLoadTestSuite.prototype.upsertEntriesSaveResults = function(saveResultsList, numEntriesInBatch) {
    var self = this;
    
    var entries = [];
    for (var i = 0; i < numEntriesInBatch; i++) {
        var entry = { key: 'k_' + i, value: 'x' + i };
        for (var j = 0; j < self.NUMBER_FIELDS_PER_ENTRY; j++) {
            var randomValue = Math.floor((Math.random() * 1000000000) + 1);
            entry['v' + j] = "value_" + randomValue;
        }
        entries.push(entry);
    }
    
    return self.addEntriesWithExternalIdToTestSoup(entries, 'key')
        .pipe(function(updatedEntries) {
              saveResultsList.push(updatedEntries);
        });
};
    
SmartStoreLoadTestSuite.prototype.getLastUpsertBatch = function(batchUpsertResultList) {
    var maxLastModDate = 0;
    var maxLastModDateBatchIndex = -1;
    
    // Get the smallest _lastModifiedDate of each batch, which should represent the time that
    // the particular batch started upserting.  The largest of these values should be the last
    // batch in.
    for (var i = 0; i < batchUpsertResultList.length; i++) {
        var objectList = batchUpsertResultList[i];
        var minBatchModifiedDate = Number.MAX_VALUE;
        for (var j = 0; j < objectList.length; j++) {
            var obj = objectList[j];
            var lastModDate = obj['_soupLastModifiedDate'];
            QUnit.strictEqual((typeof lastModDate), 'number', 'Upserted objects should have a numeric "_soupLastModifiedDate" field.');
            if (lastModDate < minBatchModifiedDate) {
                minBatchModifiedDate = lastModDate;
            }
        }

        if (minBatchModifiedDate > maxLastModDate) {
            maxLastModDate = minBatchModifiedDate;
            maxLastModDateBatchIndex = i;
        }
    }
    
    return batchUpsertResultList[maxLastModDateBatchIndex];
};
    
SmartStoreLoadTestSuite.prototype.compareRetrievedEntriesWithLastEntryBatch = function(retrievedEntries, lastEntryBatch) {
    for (var i = 0; i < retrievedEntries.length; i++) {
        var retrievedEntry = retrievedEntries[i];
        var retrievedEntryKey = retrievedEntry['key'];
        QUnit.strictEqual((typeof retrievedEntryKey), 'string', 'Retrieved entry should have a string key property.');
        var lastBatchEntry = null;
        for (var j = 0; j < lastEntryBatch.length; j++) {
            var entry = lastEntryBatch[j];
            if (entry['key'] === retrievedEntryKey) {
                lastBatchEntry = entry;
                break;
            }
        }
        QUnit.notStrictEqual(lastBatchEntry, null, 'Could not find last batch entry matching key "' + retrievedEntryKey + '".');
        for (retrievedEntryProp in retrievedEntry) {
            var retrievedEntryPropVal = retrievedEntry[retrievedEntryProp];
            var lastBatchEntryPropVal = lastBatchEntry[retrievedEntryProp];
            QUnit.equal(retrievedEntryPropVal, lastBatchEntryPropVal, 'Retrieved entry property should be the same as last batch entry property.');
        }
    }
};
    
SmartStoreLoadTestSuite.prototype.testUpsertConcurrentEntries = function() {
    var numInsertIterations = 100;
    var numEntriesInBatch = 20;
    var deferreds = [];
    var upsertResults = [];
    var self = this;
    
    for (var i = 0; i < numInsertIterations; i++) {
        deferreds.push(self.upsertEntriesSaveResults(upsertResults, numEntriesInBatch));
    }
    $.when.apply($, deferreds).done(function() {
        QUnit.equal(upsertResults.length, numInsertIterations, 'Invalid number of upsert results.');
        var lastEntryBatch = self.getLastUpsertBatch(upsertResults);
                                    
        var querySpec = navigator.smartstore.buildAllQuerySpec("key", null, upsertResults.length);
        self.querySoup(self.defaultSoupName, querySpec)
            .then(function(cursor) {
                self.compareRetrievedEntriesWithLastEntryBatch(cursor.currentPageOrderedEntries, lastEntryBatch);
                return self.closeCursor(cursor);
            })
            .done(function() {
                self.finalizeTest();
            });
    });
};

}

