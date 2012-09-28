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
	this.testIndexPath = "key";
};

// We are sub-classing AbstractSmartStoreTestSuite
SmartStoreLoadTestSuite.prototype = new AbstractSmartStoreTestSuite();
SmartStoreLoadTestSuite.prototype.constructor = SmartStoreLoadTestSuite;


/**
 * TEST: Upsert more and more entries to a single soup
 */

SmartStoreLoadTestSuite.prototype.upsertNextManyEntry = function(k) {
	console.log("upsertNextManyEntry " + k);
	var self = this;
	var entries = [];

	for (var i=0; i< k; i++) {
		entries.push({key: "k_" + k + '_' + i, value:"x"+i});
	}	
	
	return self.addEntriesToTestSoup(entries)
        .pipe(function(updatedEntries) {
			if (updatedEntries.length < self.MAX_NUMBER_ENTRIES) {
				return self.upsertNextManyEntry(k*2);
			}
		});
};


SmartStoreLoadTestSuite.prototype.testUpsertManyEntries  = function() {
	console.log("In testUpsertManyEntries");
	var self = this;

    self.upsertNextManyEntry(1)
        .done(function() {
		    self.finalizeTest();
        });
};


/**
 * TEST: Upsert entries with more and more fields to a single soup
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
 * TEST: Upsert entries where the value gets longer and longer
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
 * TEST: Retrieve a bunch of similar entries
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


}

