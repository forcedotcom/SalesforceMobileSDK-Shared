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
 * A test suite for SmartStore
 * This file assumes that qunit.js has been previously loaded, as well as SFHybridApp.js and SFTestSuite.js
 * To display results you'll need to load qunit.css and SFHybridApp.css as well.
 */
if (typeof SmartStoreLoadTestSuite === 'undefined') { 

/**
 * Constructor for SmartStoreLoadTestSuite
 */
var SmartStoreLoadTestSuite = function () {
	SFTestSuite.call(this, "smartstoreload");
	this.MAX_NUMBER_ENTRIES = 128;
	this.testIndexPath = "key";
	this.defaultSoupName = "PerfTestSoup";
	this.defaultSoupIndexes = [
		{path:"key", type:"string"}, 
		{path:"Id", type:"string"}
		];


};

// We are sub-classing SFTestSuite
SmartStoreLoadTestSuite.prototype = new SFTestSuite();
SmartStoreLoadTestSuite.prototype.constructor = SmartStoreLoadTestSuite;


/**
 * Helper method that creates soup
 */
SmartStoreLoadTestSuite.prototype.registerSoup = function(soupName, soupIndexes, callback) {
	SFHybridApp.logToConsole("In SFSmartStoreLoadTestSuite.registerSoup: soupName=" + soupName);
	
	var self = this;
    navigator.smartstore.registerSoup(soupName, soupIndexes, 
		function(soup) { 
			if (callback !== null) callback(soup);
		}, 
		function(param) { 
			self.setAssertionFailed("registerSoup failed: " + param); 
		}
      );
};

/**
 * Helper method that check if soup exists
 */
SmartStoreLoadTestSuite.prototype.soupExists = function(soupName, callback) {
	SFHybridApp.logToConsole("In SFSmartStoreLoadTestSuite.soupExists: soupName=" + soupName);
	
	var self = this;
    navigator.smartstore.soupExists(soupName,  
		function(exists) { 
			if (callback !== null) callback(exists);
		}, 
		function(param) { 
			self.setAssertionFailed("soupExists failed: " + param); 
		}
      );
};

/**
 * Helper method that removes and recreates a soup, ensuring a known good state
 */
SmartStoreLoadTestSuite.prototype.removeAndRecreateSoup = function(soupName, soupIndexes, callback) {
	var self = this;
		
	// Start clean
	self.removeSoup(soupName,
		function() {
			// Check soup does not exist
			self.soupExists(soupName,
				function(exists) {
					QUnit.equals(exists, false, "soup should not already exist");
					// Create soup
					self.registerSoup(soupName, soupIndexes, 
					function(soupName2) {
						QUnit.equals(soupName2,soupName,"registered soup OK");
                        // Check soup now exists
						self.soupExists(soupName,	
							function(exists2) {
								QUnit.equals(exists2, true, "soup should now exist");
								if (callback !== null) callback(soupName);
							});
					});
				});
		});
}

/**
 * Helper method that drops default soup
 */
SmartStoreLoadTestSuite.prototype.removeDefaultSoup = function(callback) {
	SFHybridApp.logToConsole("In SFSmartStoreLoadTestSuite.removeDefaultSoup");
	this.removeSoup(this.defaultSoupName, callback);
};

/**
 * Helper method that drops soup
 */
SmartStoreLoadTestSuite.prototype.removeSoup = function(soupName, callback) {
	SFHybridApp.logToConsole("In SFSmartStoreLoadTestSuite.removeSoup: soupName=" + soupName);
	
	var self = this;
    navigator.smartstore.removeSoup(soupName, 
		function() { 
			if (callback !== null) callback();
		}, 
		function(param) {
			self.setAssertionFailed("removeSoup failed: " + param); }
      );
};




/**
* Helper method that adds entry to the named soup
*/
SmartStoreLoadTestSuite.prototype.addGeneratedEntriesToSoup = function(soupName, nEntries, callback) {
	SFHybridApp.logToConsole("In SFSmartStoreLoadTestSuite.addGeneratedEntriesToSoup: " + soupName + " nEntries=" + nEntries);
 
	var entries = [];
	for (var i = 0; i < nEntries; i++) {
		var entityId = "00300" + i;
		var myEntry = { Name: "Todd Stellanova" + i, Id: entityId,  attributes:{type:"Contact", url:"/foo/Contact/"+i} };
		entries.push(myEntry);
	}
	
	this.addEntriesToSoup(soupName, entries, callback);
};

/**
 * Helper method that adds soup entries to the named soup
 */
SmartStoreLoadTestSuite.prototype.addEntriesToSoup = function(soupName, entries, callback) {
	var self = this;
    navigator.smartstore.upsertSoupEntries(soupName, entries, 
		function(upsertedEntries) {
			callback(upsertedEntries);
		}, 
		function(param) { 
			self.setAssertionFailed("upsertSoupEntries failed: " + param); 
		}
	);
};


/**
 * Helper method that adds n soup entries to default soup
 */
SmartStoreLoadTestSuite.prototype.addGeneratedEntriesToTestSoup = function(nEntries, callback) {
	SFHybridApp.logToConsole("In SFSmartStoreLoadTestSuite.addGeneratedEntriesToTestSoup: nEntries=" + nEntries);
	this.addGeneratedEntriesToSoup(this.defaultSoupName,nEntries,callback);	
};

/**
 * Helper method that adds soup entries to default soup
 */
SmartStoreLoadTestSuite.prototype.addEntriesToTestSoup = function(entries, callback) {
	SFHybridApp.logToConsole("In SFSmartStoreLoadTestSuite.addEntriesToTestSoup: entries.length=" + entries.length);
	this.addEntriesToSoup(this.defaultSoupName,entries,callback);	
};




SmartStoreLoadTestSuite.prototype.upsertNextEntry = function(entries) {
	var self = this;
	
	//each round creates one new entry and updates all the existing entries
	var start = (new Date()).getTime();
	var entry = {key: "k"+start, value:"x"};
	entries.push(entry);
	
	self.addEntriesToSoup(self.defaultSoupName,entries, 
		function(updatedEntries) {
			if (entries.length < self.MAX_NUMBER_ENTRIES) {
				self.upsertNextEntry(updatedEntries);
			} else {
				self.finalizeTest();
			}
		});
};

SmartStoreLoadTestSuite.prototype.testUpsertManyEntries  = function() {
	SFHybridApp.logToConsole("In SFSmartStoreLoadTestSuite.testUpsertManyEntries");
	var self = this;

	self.removeAndRecreateSoup(self.defaultSoupName, 
		self.defaultSoupIndexes, 
		function(soupName) {
			self.upsertNextEntry([]);
		});
};



}

