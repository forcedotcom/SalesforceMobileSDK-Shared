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
if (typeof SmartStoreTestSuite === 'undefined') { 

/**
 * Constructor for SmartStoreTestSuite
 */
var SmartStoreTestSuite = function () {
	SFTestSuite.call(this, "smartstore");

	this.defaultSoupName = "myPeopleSoup";
	this.defaultSoupIndexes = [{path:"Name", type:"string"}, {path:"Id", type:"string"}];
	this.NUM_CURSOR_MANIPULATION_ENTRIES = 103;
};

// We are sub-classing SFTestSuite
SmartStoreTestSuite.prototype = new SFTestSuite();
SmartStoreTestSuite.prototype.constructor = SmartStoreTestSuite;

/*
 * For each test, we first remove and re-add the default soup
 */
SmartStoreTestSuite.prototype.runTest= function (methName) {
	SFHybridApp.logToConsole("In SFSmartStoreTestSuite.runTest: methName=" + methName);
	var self = this;
	
	self.removeDefaultSoup(function() {
		self.registerDefaultSoup(function() {
			self[methName]();
		});
	});
};

/**
 * Helper method that creates default soup
 */
SmartStoreTestSuite.prototype.registerDefaultSoup = function(callback) {
	SFHybridApp.logToConsole("In SFSmartStoreTestSuite.registerDefaultSoup");
	this.registerSoup(this.defaultSoupName, this.defaultSoupIndexes, callback);
};

/**
 * Helper method that creates soup
 */
SmartStoreTestSuite.prototype.registerSoup = function(soupName, soupIndexes, callback) {
	SFHybridApp.logToConsole("In SFSmartStoreTestSuite.registerSoup: soupName=" + soupName);
	
	var self = this;
    navigator.smartstore.registerSoup(soupName, soupIndexes, 
		function(soup) { 
			SFHybridApp.logToConsole("registerSoup succeeded");
			if (callback !== null) callback(soup);
		}, 
		function(param) { self.setAssertionFailed("registerSoup failed: " + param); }
      );
};

/**
 * Helper method that check if soup exists
 */
SmartStoreTestSuite.prototype.soupExists = function(soupName, callback) {
	SFHybridApp.logToConsole("In SFSmartStoreTestSuite.soupExists: soupName=" + soupName);
	
	var self = this;
    navigator.smartstore.soupExists(soupName,  
		function(exists) { 
			SFHybridApp.logToConsole("soupExists succeeded");
			if (callback !== null) callback(exists);
		}, 
		function(param) { self.setAssertionFailed("soupExists failed: " + param); }
      );
};


/**
 * Helper method that drops default soup
 */
SmartStoreTestSuite.prototype.removeDefaultSoup = function(callback) {
	SFHybridApp.logToConsole("In SFSmartStoreTestSuite.removeDefaultSoup");
	this.removeSoup(this.defaultSoupName, callback);
};

/**
 * Helper method that drops soup
 */
SmartStoreTestSuite.prototype.removeSoup = function(soupName, callback) {
	SFHybridApp.logToConsole("In SFSmartStoreTestSuite.removeSoup: soupName=" + soupName);
	
	var self = this;
    navigator.smartstore.removeSoup(soupName, 
		function() { 
			SFHybridApp.logToConsole("removeSoup succeeded");
			if (callback !== null) callback();
		}, 
		function(param) {
			SFHybridApp.logToConsole("removeSoup failed");
			self.setAssertionFailed("removeSoup failed: " + param); }
      );
};

/**
 * Helper method that adds three soup entries to default soup
 */
SmartStoreTestSuite.prototype.stuffTestSoup = function(callback) {
	SFHybridApp.logToConsole("In SFSmartStoreTestSuite.stuffTestSoup");
	
	var myEntry1 = { Name: "Todd Stellanova", Id: "00300A",  attributes:{type:"Contact"} };
    var myEntry2 = { Name: "Pro Bono Bonobo",  Id: "00300B", attributes:{type:"Contact"}  };
    var myEntry3 = { Name: "Robot", Id: "00300C", attributes:{type:"Contact"}  };
    var entries = [myEntry1, myEntry2, myEntry3];

	this.addEntriesToTestSoup(entries, callback);
};

/**
 * Helper method that adds n soup entries to default soup
 */
SmartStoreTestSuite.prototype.addGeneratedEntriesToTestSoup = function(nEntries, callback) {
	SFHybridApp.logToConsole("In SFSmartStoreTestSuite.addGeneratedEntriesToTestSoup: nEntries=" + nEntries);
 
	var entries = [];
	for (var i = 0; i < nEntries; i++) {
		var myEntry = { Name: "Todd Stellanova" + i, Id: "00300" + i,  attributes:{type:"Contact"} };
		entries.push(myEntry);
	}
	
	this.addEntriesToTestSoup(entries, callback);
	
};

/**
 * Helper method that adds soup entries to default soup
 */
SmartStoreTestSuite.prototype.addEntriesToTestSoup = function(entries, callback) {
	SFHybridApp.logToConsole("In SFSmartStoreTestSuite.addEntriesToTestSoup: entries.length=" + entries.length);

	var self = this;
    navigator.smartstore.upsertSoupEntries(self.defaultSoupName, entries, 
		function(upsertedEntries) {
		    SFHybridApp.logToConsole("addEntriesToTestSoup of " + upsertedEntries.length + " entries succeeded");
			callback(upsertedEntries);
		}, 
		function(param) { self.setAssertionFailed("upsertSoupEntries failed: " + param); }
	);
};

/** 
 * TEST registerSoup / hasSoup/ removeSoup 
 */
SmartStoreTestSuite.prototype.testRegisterRemoveSoup = function()  {
	SFHybridApp.logToConsole("In SFSmartStoreTestSuite.testRegisterRemoveSoup");
	var soupName = "soupForTestRegisterRemoveSoup";

	var self = this;

	// Start clean
	self.removeSoup(soupName,
		function() {
			// Check soup does not exist
			self.soupExists(soupName,
				function(exists) {
					QUnit.equals(exists, false, "soup should not already exist");
					// Create soup
					self.registerSoup(soupName, self.defaultSoupIndexes, 
						function(soupName2) {
                            QUnit.equals(soupName2,soupName,"registered soup OK");
							// Check soup now exists
							self.soupExists(soupName,
								function(exists) {
									QUnit.equals(exists, true, "soup should now exist");
                                    // Attempt to register the same soup again
                                    self.registerSoup(soupName, self.defaultSoupIndexes,
                                        function(soupName3) {
                                            QUnit.equals(soupName3,soupName,"re-registered existing soup OK");
                                            // Remove soup
                                            self.removeSoup(soupName,  
                                                function() {
                                                    // Check soup no longer exists
                                                    self.soupExists(soupName,
                                                        function(exists) {
                                                            QUnit.equals(exists, false, "soup should no longer exist");
                                                            self.finalizeTest();
                                                        });
                                                });
                                        },
                                        function(err) {QUnit.ok(false,"re-registering existing soup failed " + err);}
                                        );
								});
						},
                        function(err) {QUnit.ok(false,"self.registerSoup failed " + err);}
                        );
				});
	});
}; 


/** 
 * TEST upsertSoupEntries
 */
SmartStoreTestSuite.prototype.testUpsertSoupEntries = function()  {
	SFHybridApp.logToConsole("In SFSmartStoreTestSuite.testUpsertSoupEntries");

	var self = this;
	self.addGeneratedEntriesToTestSoup(7, function(entries) {
		QUnit.equal(entries.length, 7);
		
		//upsert another batch
		self.addGeneratedEntriesToTestSoup(12, function(entries) {
			QUnit.equal(entries.length, 12);
            self.finalizeTest();
		});
	});
}; 

/**
 * TEST retrieveSoupEntries
 */
SmartStoreTestSuite.prototype.testRetrieveSoupEntries = function()  {
	SFHybridApp.logToConsole("In SFSmartStoreTestSuite.testRetrieveSoupEntries");
	
	var self = this; 
	self.stuffTestSoup(function(entries) {
		QUnit.equal(entries.length, 3);
		var soupEntry0Id = entries[0]._soupEntryId;
		var soupEntry2Id = entries[2]._soupEntryId;
		
		navigator.smartstore.retrieveSoupEntries(self.defaultSoupName, [soupEntry2Id, soupEntry0Id], 
			function(retrievedEntries) {
			    QUnit.equal(retrievedEntries.length, 2);
                                                 
                var entryIdArray = new Array();
                for (var i = 0; i < retrievedEntries.length; i++) {
                    entryIdArray[i] = retrievedEntries[i]._soupEntryId;
                }
                self.collectionContains(entryIdArray, soupEntry0Id);
                self.collectionContains(entryIdArray, soupEntry2Id);
                self.finalizeTest();
			}, 
			function(param) { self.setAssertionFailed("retrieveSoupEntries failed: " + param); }
		);
	});
};


/**
 * TEST removeFromSoup
 */
SmartStoreTestSuite.prototype.testRemoveFromSoup = function()  {
	SFHybridApp.logToConsole("In SFSmartStoreTestSuite.testRemoveFromSoup");	
	
	var self = this; 
	self.stuffTestSoup(function(entries) {
		var soupEntryIds = [];
		QUnit.equal(entries.length, 3);
		
		for (var i = entries.length - 1; i >= 0; i--) {
			var entry = entries[i];
			soupEntryIds.push(entry._soupEntryId);
		}
		
		navigator.smartstore.removeFromSoup(self.defaultSoupName, soupEntryIds, 
			function(status) {
				QUnit.equal(status, "OK", "removeFromSoup OK");
				
				var querySpec = new SoupQuerySpec("Name", null);
				navigator.smartstore.querySoup(self.defaultSoupName, querySpec, 
					function(cursor) {
						var nEntries = cursor.currentPageOrderedEntries.length;
						QUnit.equal(nEntries, 0, "currentPageOrderedEntries correct");
                        self.finalizeTest();
					}, 
					function(param) { self.setAssertionFailed("querySoup: " + param); }
				);
			}, 
			function(param) { self.setAssertionFailed("removeFromSoup: " + param); }
		);
	});
};

/* 
TEST querySoup
*/
SmartStoreTestSuite.prototype.testQuerySoup = function()  {
	SFHybridApp.logToConsole("In SFSmartStoreTestSuite.testQuerySoup");	
	
	var self = this;
	self.stuffTestSoup(function(entries) {
		QUnit.equal(entries.length, 3);
		
	    var querySpec = new SoupQuerySpec("Name", "Robot");
	    querySpec.pageSize = 25;
	    navigator.smartstore.querySoup(self.defaultSoupName, querySpec, 
			function(cursor) {
				QUnit.equal(cursor.totalPages, 1, "totalPages correct");
				var nEntries = cursor.currentPageOrderedEntries.length;
				QUnit.equal(nEntries, 1, "currentPageOrderedEntries correct");
                
                navigator.smartstore.closeCursor(cursor,
                    function(param) { QUnit.ok(true,"closeCursor ok"); self.finalizeTest(); },
                    function(param) { self.setAssertionFailed("closeCursor: " + param); }
                    );
			}, 
			function(param) { self.setAssertionFailed("querySoup: " + param); }
	    );
	});
};



/**
 * TEST testManipulateCursor
 */
SmartStoreTestSuite.prototype.testManipulateCursor = function()  {
	SFHybridApp.logToConsole("In SFSmartStoreTestSuite.testManipulateCursor");	
	
	var self = this;
	this.addGeneratedEntriesToTestSoup(self.NUM_CURSOR_MANIPULATION_ENTRIES, function(entries) {

		QUnit.equal(entries.length, self.NUM_CURSOR_MANIPULATION_ENTRIES);
	    var querySpec = new SoupQuerySpec("Name", null);
	
	    navigator.smartstore.querySoup(self.defaultSoupName, querySpec, 
			function(cursor) {
				QUnit.equal(cursor.currentPageIndex, 0, "currentPageIndex correct");
				QUnit.equal(cursor.pageSize, 10, "pageSize correct");
				
				var nEntries = cursor.currentPageOrderedEntries.length;
				QUnit.equal(nEntries, cursor.pageSize, "nEntries matches pageSize");
							
				self.forwardCursorToEnd(cursor);
			}, 
			function(param) { self.setAssertionFailed("querySoup: " + param); }
		);
	});
};

/**
 * Page through the cursor til we reach the end.
 * Used by testManipulateCursor
 */
SmartStoreTestSuite.prototype.forwardCursorToEnd = function(cursor) {
	SFHybridApp.logToConsole("In SFSmartStoreTestSuite.forwardCursorToEnd");	
	
	var self = this;
	
	navigator.smartstore.moveCursorToNextPage(cursor, 
		function(nextCursor) {
			var pageCount = nextCursor.currentPageIndex + 1;
			var nEntries = nextCursor.currentPageOrderedEntries.length;
			
			if (pageCount < nextCursor.totalPages) {
				SFHybridApp.logToConsole("pageCount:" + pageCount + " of " + nextCursor.totalPages);
				QUnit.equal(nEntries, nextCursor.pageSize, "nEntries matches pageSize [" + nextCursor.currentPageIndex + "]" );
				
				self.forwardCursorToEnd(nextCursor);
			} 
			else {
				var expectedCurEntries = nextCursor.pageSize;
				var remainder = self.NUM_CURSOR_MANIPULATION_ENTRIES % nextCursor.pageSize;
				if (remainder > 0) {
					expectedCurEntries = remainder;
					SFHybridApp.logToConsole("remainder: " + remainder);
				}
				
				QUnit.equal(nextCursor.currentPageIndex, nextCursor.totalPages-1, "final pageIndex correct");
				QUnit.equal(nEntries, expectedCurEntries, "last page nEntries matches");
				
                self.finalizeTest();
			}
		}, 
		function(param) { self.setAssertionFailed("moveCursorToNextPage: " + param); }
	);
};

}

