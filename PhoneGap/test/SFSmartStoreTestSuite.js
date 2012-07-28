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

var smartstore = require("salesforce/plugin/smartstore");

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
	self.removeAndRecreateSoup(this.defaultSoupName, this.defaultSoupIndexes, 
		function(soupName) {
			self[methName]();
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
    smartstore.registerSoup(soupName, soupIndexes, 
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
    smartstore.soupExists(soupName,  
		function(exists) { 
			SFHybridApp.logToConsole("soupExists succeeded");
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
SmartStoreTestSuite.prototype.removeAndRecreateSoup = function(soupName, soupIndexes, callback) {
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
    smartstore.removeSoup(soupName, 
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
 * Helper method that adds entry to the named soup
 */
SmartStoreTestSuite.prototype.addGeneratedEntriesToSoup = function(soupName, nEntries, callback) {
	SFHybridApp.logToConsole("In SFSmartStoreTestSuite.addGeneratedEntriesToSoup: " + soupName + " nEntries=" + nEntries);
 
	var entries = this.createGeneratedEntries(nEntries);
	
	this.addEntriesToSoup(soupName, entries, callback);
};

/**
 * Creates a list of generated entries, with index fields that should order well automatically.
 *   nEntries - The number of generated entries to create.
 * Return: An array of generated entries.
 */
SmartStoreTestSuite.prototype.createGeneratedEntries = function(nEntries) {
    var entries = [];
    for (var i = 0; i < nEntries; i++) {
        var paddedIndex = this.padNumber(i, nEntries, "0");
        var entityId = "003" + paddedIndex;
        var myEntry = { Name: "Todd Stellanova" + paddedIndex, Id: entityId,  attributes:{type:"Contact", url:"/foo/Contact/"+paddedIndex} };
        entries.push(myEntry);
    }
    return entries;
};

/**
 * Pads a number to match a specified number of numerals.
 *  numberToPad - The original number to pad.
 *  maxSize     - The ultimate size, in numerals, of the padded number.
 *  paddingChar - The character used to pad the number.
 * Returns: The padded number string.
 */
SmartStoreTestSuite.prototype.padNumber = function(numberToPad, maxSize, paddingChar) {
    var numberToPadString = numberToPad + "";
    var numberToPadStringLength = numberToPadString.length;
    var maxSizeString = maxSize + "";
    var maxSizeStringLength = maxSizeString.length;
    for (var i = 0; i < (maxSizeStringLength - numberToPadStringLength); i++) {
        numberToPadString = paddingChar + numberToPadString;
    }
    return numberToPadString;
};

/**
 * Helper method that adds soup entries to the named soup
 */
SmartStoreTestSuite.prototype.addEntriesToSoup = function(soupName, entries, callback) {
	SFHybridApp.logToConsole("In SFSmartStoreTestSuite.addEntriesToSoup: " + soupName + " entries.length=" + entries.length);

	var self = this;
    smartstore.upsertSoupEntries(soupName, entries, 
		function(upsertedEntries) {
		    SFHybridApp.logToConsole("addEntriesToSoup of " + upsertedEntries.length + " entries succeeded");
			callback(upsertedEntries);
		}, 
		function(param) { self.setAssertionFailed("upsertSoupEntries failed: " + param); }
	);
};
    
/**
 * Helper method that upserts soup entries to the named soup, with the given external id path.
 */
SmartStoreTestSuite.prototype.upsertEntriesToSoupWithExternalIdPath = function(soupName, entries, externalIdPath, callback) {
    SFHybridApp.logToConsole("In SFSmartStoreTestSuite.upsertEntriesToSoupWithExternalIdPath: " + soupName + " entries.length=" + entries.length + " externalIdPath: " + externalIdPath);
        
    var self = this;
    smartstore.upsertSoupEntriesWithExternalId(soupName, entries, externalIdPath,
        function(upsertedEntries) {
            SFHybridApp.logToConsole("upsertEntriesToSoupWithExternalIdPath of " + upsertedEntries.length + " entries succeeded");
            callback(upsertedEntries);
        },
        function(param) { self.setAssertionFailed("upsertEntriesToSoupWithExternalIdPath '" + externalIdPath + "' failed: " + param); }
    );
};

/**
 * Helper method that adds n soup entries to default soup
 */
SmartStoreTestSuite.prototype.addGeneratedEntriesToTestSoup = function(nEntries, callback) {
	SFHybridApp.logToConsole("In SFSmartStoreTestSuite.addGeneratedEntriesToTestSoup: nEntries=" + nEntries);
	this.addGeneratedEntriesToSoup(this.defaultSoupName,nEntries,callback);	
};

/**
 * Helper method that adds soup entries to default soup
 */
SmartStoreTestSuite.prototype.addEntriesToTestSoup = function(entries, callback) {
	SFHybridApp.logToConsole("In SFSmartStoreTestSuite.addEntriesToTestSoup: entries.length=" + entries.length);
	this.addEntriesToSoup(this.defaultSoupName,entries,callback);	
};

/** 
 * TEST registerSoup / soupExists / removeSoup 
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
 * TEST registerSoup
 */
SmartStoreTestSuite.prototype.testRegisterBogusSoup = function()  {
	SFHybridApp.logToConsole("In SFSmartStoreTestSuite.testRegisterBogusSoup");
	var soupName = null;//intentional bogus soupName
	var self = this;

	smartstore.registerSoup(soupName, self.defaultSoupIndexes, 
		function(soupName2) {
			self.setAssertionFailed("registerSoup should fail with bogus soupName " + soupName2);
		},
		function() {            
			QUnit.ok(true,"registerSoup should fail with bogus soupName");
			self.finalizeTest();
		}
	);
};


/** 
 * TEST registerSoup
 */
SmartStoreTestSuite.prototype.testRegisterSoupNoIndices = function()  {
	SFHybridApp.logToConsole("In SFSmartStoreTestSuite.testRegisterSoupNoIndices");

	var soupName = "soupForRegisterNoIndices";
	var self = this;

	// Start clean
	self.removeSoup(soupName,
		function() {
			// Check soup does not exist
			self.soupExists(soupName,
				function(exists) {
					QUnit.equals(exists, false, "soup should not already exist");
					// Create soup
					smartstore.registerSoup(soupName, [], 
						function(soupName2) {
							self.setAssertionFailed("registerSoup should fail with bogus indices " + soupName2);
						},
						function() {            
							QUnit.ok(true,"registerSoup should fail with bogus indices");
							self.finalizeTest();
						}
					);
				}
			);
		}
	);
}

/** 
 * TEST upsertSoupEntries
 */
SmartStoreTestSuite.prototype.testUpsertSoupEntries = function()  {
	SFHybridApp.logToConsole("In SFSmartStoreTestSuite.testUpsertSoupEntries");

	var self = this;
	self.addGeneratedEntriesToTestSoup(7, function(entries1) {
		QUnit.equal(entries1.length, 7);
		
		//upsert another batch
		self.addGeneratedEntriesToTestSoup(12, function(entries2) {
			QUnit.equal(entries2.length, 12);
            //modify the initial entries
            for (var i = 0; i < entries2.length; i++) {
                var e = entries2[i];
                e.updatedField = "Mister Toast " + i;
            }
            
            //update the entries
            self.addEntriesToTestSoup(entries2,
                function(entries3) {
                    QUnit.equal(entries3.length,entries2.length,"updated list match initial list len");
                    QUnit.equal(entries3[0].updatedField,"Mister Toast 0","updatedField is correct");
                    self.finalizeTest();
                },
                function(err) { QUnit.ok(false,"updating entries failed: " + err); }
        	);            
		});
	});
}; 

/** 
 * TEST upsertSoupEntriesWithExternalId
 */
SmartStoreTestSuite.prototype.testUpsertSoupEntriesWithExternalId = function()  {
	SFHybridApp.logToConsole("In SFSmartStoreTestSuite.testUpsertSoupEntriesWithExternalId");

	var self = this;
	self.addGeneratedEntriesToTestSoup(11, function(entries1) {
		QUnit.equal(entries1.length, 11);
		
		// Now upsert an overlapping batch, using an external ID path.
        var entries2 = self.createGeneratedEntries(16);
        for (var i = 0; i < entries2.length; i++) {
            var entry = entries2[i];
            entry.updatedField = "Mister Toast " + i;
        }
        var externalIdPath = self.defaultSoupIndexes[0].path;
        self.upsertEntriesToSoupWithExternalIdPath(self.defaultSoupName, entries2, externalIdPath,
            function(entries3) {
                QUnit.equal(entries3.length, 16);
                
                // Now, query the soup for all entries, and make sure that we have only 16.
                var querySpec = smartstore.buildAllQuerySpec("Name", null, 25);
                smartstore.querySoup(self.defaultSoupName, querySpec,
                    function(cursor) {
                        QUnit.equal(cursor.totalPages, 1, "Are totalPages correct?");
                        var orderedEntries = cursor.currentPageOrderedEntries;
                        var nEntries = orderedEntries.length;
                        QUnit.equal(nEntries, 16, "Are there 16 entries in total?");
                        QUnit.equal(orderedEntries[0]._soupEntryId, 1, "Is the first soup entry ID correct?");
                        QUnit.equal(orderedEntries[0].updatedField, "Mister Toast 0", "Is the first updated field correct?");
                        QUnit.equal(orderedEntries[15]._soupEntryId, 16, "Is the last soup entry ID correct?");
                        QUnit.equal(orderedEntries[15].updatedField, "Mister Toast 15", "Is the last updated field correct?");
                                                                                  
                        smartstore.closeCursor(cursor,
                            function(param) { QUnit.ok(true,"closeCursor ok"); self.finalizeTest(); },
                            function(err) { self.setAssertionFailed("closeCursor failed: " + err); }
                        );
                    },
                    function(err) { self.setAssertionFailed("querySoup failed: " + err); }
                );
            },
            function(err) {
                self.setAssertionFailed("Upserting entries with external ID '" + externalIdPath + "' failed: " + err);
            }
        );
    });
}; 


/** 
 * TEST upsertSoupEntries
 */
SmartStoreTestSuite.prototype.testUpsertToNonexistentSoup = function()  {
	SFHybridApp.logToConsole("In SFSmartStoreTestSuite.testUpsertToNonexistentSoup");

	var self = this;
	var entries = [{a:1},{a:2},{a:3}];
	
    smartstore.upsertSoupEntries("nonexistentSoup", entries, 
		function(upsertedEntries) {
			self.setAssertionFailed("upsertSoupEntries should fail with nonexistent soup ");
		},
		function() {            
			QUnit.ok(true,"upsertSoupEntries should fail with nonexistent soup");
			self.finalizeTest();
		}
	);
};
	
/**
 * TEST retrieveSoupEntries
 */
SmartStoreTestSuite.prototype.testRetrieveSoupEntries = function()  {
	SFHybridApp.logToConsole("In SFSmartStoreTestSuite.testRetrieveSoupEntries");
	
	var self = this; 
	self.stuffTestSoup(function(entries) {
		QUnit.equal(entries.length, 3,"check stuffTestSoup result");
		var soupEntry0Id = entries[0]._soupEntryId;
		var soupEntry2Id = entries[2]._soupEntryId;
		
		smartstore.retrieveSoupEntries(self.defaultSoupName, [soupEntry2Id, soupEntry0Id], 
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
		
		smartstore.removeFromSoup(self.defaultSoupName, soupEntryIds, 
			function(status) {
				QUnit.equal(status, "OK", "removeFromSoup OK");
				
				var querySpec = smartstore.buildAllQuerySpec("Name");
				smartstore.querySoup(self.defaultSoupName, querySpec, 
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

/**
 * TEST querySoup
 */
SmartStoreTestSuite.prototype.testQuerySoup = function()  {
	SFHybridApp.logToConsole("In SFSmartStoreTestSuite.testQuerySoup");	
	
	var self = this;
	self.stuffTestSoup(function(entries) {
		QUnit.equal(entries.length, 3);
		
		var querySpec = smartstore.buildExactQuerySpec("Name","Robot");
	    smartstore.querySoup(self.defaultSoupName, querySpec, 
			function(cursor) {
				QUnit.equal(cursor.totalPages, 1, "totalPages correct");
				var nEntries = cursor.currentPageOrderedEntries.length;
				QUnit.equal(nEntries, 1, "currentPageOrderedEntries correct");
                
                smartstore.closeCursor(cursor,
                    function(param) { QUnit.ok(true,"closeCursor ok"); self.finalizeTest(); },
                    function(param) { self.setAssertionFailed("closeCursor: " + param); }
                    );
			}, 
			function(param) { self.setAssertionFailed("querySoup: " + param); }
	    );
	});
};


/**
 * TEST querySoup
 */
SmartStoreTestSuite.prototype.testQuerySoupDescending = function()  {
	SFHybridApp.logToConsole("In SFSmartStoreTestSuite.testQuerySoupDescending");	
	
	var self = this;
	self.stuffTestSoup(function(entries) {
		QUnit.equal(entries.length, 3);
		
		var querySpec = smartstore.buildAllQuerySpec("Name", "descending");		
	    smartstore.querySoup(self.defaultSoupName, querySpec, 
			function(cursor) {
				QUnit.equal(cursor.totalPages, 1, "totalPages correct");
				QUnit.equal(cursor.currentPageOrderedEntries.length, 3, "check currentPageOrderedEntries");
				QUnit.equal(cursor.currentPageOrderedEntries[0].Name,"Todd Stellanova","verify first entry");
				QUnit.equal(cursor.currentPageOrderedEntries[2].Name,"Pro Bono Bonobo","verify last entry");
				
                smartstore.closeCursor(cursor,
                    function(param) { QUnit.ok(true,"closeCursor ok"); self.finalizeTest(); },
                    function(param) { self.setAssertionFailed("closeCursor: " + param); }
                    );
			}, 
			function(param) { self.setAssertionFailed("querySoup: " + param); }
	    );
	});
};

/**
 * TEST querySoup
 */
SmartStoreTestSuite.prototype.testQuerySoupBadQuerySpec = function()  {
	SFHybridApp.logToConsole("In SFSmartStoreTestSuite.testQuerySoupBadQuerySpec");	
	
	var self = this;
	self.stuffTestSoup(function(entries) {
		QUnit.equal(entries.length, 3);
		
		//query on a nonexistent index
		var querySpec = smartstore.buildRangeQuerySpec("bottlesOfBeer",99,null,"descending");				
		
	    smartstore.querySoup(self.defaultSoupName, querySpec, 
			function(cursor) {
				self.setAssertionFailed("querySoup with bogus querySpec should fail");
			}, 
			function(param) { 
				QUnit.ok(true,"querySoup with bogus querySpec should fail");
				self.finalizeTest();                
			}
	    );
	});
};


/**
 * TEST querySoup  with an endKey and no beginKey
 */
SmartStoreTestSuite.prototype.testQuerySoupEndKeyNoBeginKey = function()  {
	SFHybridApp.logToConsole("In SFSmartStoreTestSuite.testQuerySoupEndKeyNoBeginKey");	
	var self = this;
	
	self.stuffTestSoup(function(entries) {
		QUnit.equal(entries.length, 3);
		//keep in sync with stuffTestSoup
		var querySpec = smartstore.buildRangeQuerySpec("Name",null,"Robot");				

	    smartstore.querySoup(self.defaultSoupName, querySpec, 
			function(cursor) {
				var nEntries = cursor.currentPageOrderedEntries.length;
				QUnit.equal(nEntries, 2, "nEntries matches endKey");
				QUnit.equal(cursor.currentPageOrderedEntries[1].Name,"Robot","verify last entry");
				self.finalizeTest();                
			}, 
			function(param) { 
				self.setAssertionFailed("querySoup failed");              
			}
	    );
	});
};

/**
 * TEST querySoup  with beginKey and no endKey
 */
SmartStoreTestSuite.prototype.testQuerySoupBeginKeyNoEndKey = function()  {
	SFHybridApp.logToConsole("In SFSmartStoreTestSuite.testQuerySoupBeginKeyNoEndKey");	
	var self = this;

	self.stuffTestSoup(function(entries) {
		QUnit.equal(entries.length, 3);
		//keep in sync with stuffTestSoup
		var querySpec = smartstore.buildRangeQuerySpec("Name","Robot",null);				

	    smartstore.querySoup(self.defaultSoupName, querySpec, 
			function(cursor) {
				var nEntries = cursor.currentPageOrderedEntries.length;
				QUnit.equal(nEntries, 2, "nEntries matches beginKey");
				QUnit.equal(cursor.currentPageOrderedEntries[0].Name,"Robot","verify first entry");
				self.finalizeTest();                
			}, 
			function(param) { 
				self.setAssertionFailed("querySoup failed");              
			}
	    );
	});

};

/**
 * TEST testManipulateCursor
 */
SmartStoreTestSuite.prototype.testManipulateCursor = function()  {
	SFHybridApp.logToConsole("In SFSmartStoreTestSuite.testManipulateCursor");	
	var self = this;
	
	this.addGeneratedEntriesToTestSoup(self.NUM_CURSOR_MANIPULATION_ENTRIES, 
		function(entries) {
			QUnit.equal(entries.length, self.NUM_CURSOR_MANIPULATION_ENTRIES);
			var querySpec = smartstore.buildAllQuerySpec("Name",null,10);
			
		    smartstore.querySoup(self.defaultSoupName, querySpec, 
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
	
	smartstore.moveCursorToNextPage(cursor, 
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


/**
 * TEST unusual soup names
 */
SmartStoreTestSuite.prototype.testArbitrarySoupNames = function() {
	SFHybridApp.logToConsole("In SFSmartStoreTestSuite.testArbitrarySoupNames");	
	var self = this;
	
	var soupName = "123This should-be a_valid.soup+name!?100";
	
	//simply register and verify that the soup exists
	self.removeAndRecreateSoup(soupName,self.defaultSoupIndexes,
		function(soupName2) {
			self.finalizeTest();
		});
};


/**
 * TEST querySpec factory functions
 */
SmartStoreTestSuite.prototype.testQuerySpecFactories = function() {
	SFHybridApp.logToConsole("In SFSmartStoreTestSuite.testQuerySpecFactories");
	var self = this;
	
	var path = "Name";
	var beginKey = "Qbert";
	var endKey = "Zzzzbert";
	var order = "descending";
	var pageSize = 17;
	var query =  smartstore.buildExactQuerySpec(path,beginKey,pageSize);
	QUnit.equal(query.queryType,"exact","check queryType");
	QUnit.equal(query.indexPath,path,"check indexPath");
	QUnit.equal(query.matchKey,beginKey,"check matchKey");
	QUnit.equal(query.pageSize,pageSize,"check pageSize");
	
	query =  smartstore.buildRangeQuerySpec(path,beginKey,endKey,order,pageSize);
	QUnit.equal(query.queryType,"range","check queryType");
	QUnit.equal(query.indexPath,path,"check indexPath");
	QUnit.equal(query.beginKey,beginKey,"check beginKey");
	QUnit.equal(query.endKey,endKey,"check endKey");
	QUnit.equal(query.order,order,"check order");
	QUnit.equal(query.pageSize,pageSize,"check pageSize");
	
	query =  smartstore.buildLikeQuerySpec(path,beginKey,order,pageSize);
	QUnit.equal(query.queryType,"like","check queryType");
	QUnit.equal(query.indexPath,path,"check indexPath");
	QUnit.equal(query.likeKey,beginKey,"check likeKey");
	QUnit.equal(query.order,order,"check order");
	QUnit.equal(query.pageSize,pageSize,"check pageSize");
	
	var query =  smartstore.buildAllQuerySpec(path,order,pageSize);
	QUnit.equal(query.queryType,"range","check queryType");
	QUnit.equal(query.indexPath,path,"check indexPath");
	QUnit.equal(query.beginKey,null,"check beginKey");
	QUnit.equal(query.endKey,null,"check endKey");
	QUnit.equal(query.order,order,"check order");
	QUnit.equal(query.pageSize,pageSize,"check pageSize");
	
	self.finalizeTest();
};

SmartStoreTestSuite.prototype.testLikeQuerySpecStartsWith  = function() {
	SFHybridApp.logToConsole("In SFSmartStoreTestSuite.testLikeQuerySpecStartsWith");
	var self = this;
	
	self.stuffTestSoup(function(entries) {
		QUnit.equal(entries.length, 3,"check stuffTestSoup result");
		var querySpec = smartstore.buildLikeQuerySpec("Name","Todd%");
		smartstore.querySoup(self.defaultSoupName, querySpec, 
			function(cursor) {
				var nEntries = cursor.currentPageOrderedEntries.length;
				QUnit.equal(nEntries, 1, "currentPageOrderedEntries correct");
                self.finalizeTest();
			}, 
			function(param) { self.setAssertionFailed("querySoup: " + param); }
		);
	});
};

SmartStoreTestSuite.prototype.testLikeQuerySpecEndsWith  = function() {
	SFHybridApp.logToConsole("In SFSmartStoreTestSuite.testLikeQuerySpecEndsWith");
	var self = this;
	
	self.stuffTestSoup(function(entries) {
		QUnit.equal(entries.length, 3,"check stuffTestSoup result");
		var querySpec = smartstore.buildLikeQuerySpec("Name","%Stellanova");
		smartstore.querySoup(self.defaultSoupName, querySpec, 
			function(cursor) {
				var nEntries = cursor.currentPageOrderedEntries.length;
				QUnit.equal(nEntries, 1, "currentPageOrderedEntries correct");
                self.finalizeTest();
			}, 
			function(param) { self.setAssertionFailed("querySoup: " + param); }
		);
	});
};

SmartStoreTestSuite.prototype.testLikeQueryInnerText  = function() {
	SFHybridApp.logToConsole("In SFSmartStoreTestSuite.testLikeQueryInnerText");
	var self = this;
	
	self.stuffTestSoup(function(entries) {
		QUnit.equal(entries.length, 3,"check stuffTestSoup result");
		var querySpec = smartstore.buildLikeQuerySpec("Name","%ono%");
		smartstore.querySoup(self.defaultSoupName, querySpec, 
			function(cursor) {
				var nEntries = cursor.currentPageOrderedEntries.length;
				QUnit.equal(nEntries, 1, "currentPageOrderedEntries correct");
                self.finalizeTest();
			}, 
			function(param) { self.setAssertionFailed("querySoup: " + param); }
		);
	});
};

SmartStoreTestSuite.prototype.testCompoundQueryPath  = function() {
	SFHybridApp.logToConsole("In SFSmartStoreTestSuite.testCompoundQueryPath");
	var self = this;
	//attributes.url is a nonsensical path but it works for testing compound paths
	var indices = [{path:"Name", type:"string"}, {path:"Id", type:"string"}, {path:"attributes.url", type:"string"}];
	var soupName = "compoundPathSoup";
	self.removeAndRecreateSoup(soupName,indices,
		function(soupName) {
			self.addGeneratedEntriesToSoup(soupName, 3, 
				function(entries) {
					QUnit.equal(entries.length, 3,"check addGeneratedEntriesToSoup result");
					//pick out a compound path value and ensure that we can query for the same entry
					var selectedEntry = entries[1];
					var selectedUrl = selectedEntry.attributes.url;
					var querySpec = smartstore.buildExactQuerySpec("attributes.url",selectedUrl);
					smartstore.querySoup(soupName, querySpec, 
						function(cursor) {
							QUnit.equal(cursor.currentPageOrderedEntries.length, 1, "currentPageOrderedEntries correct");
							var foundEntry = cursor.currentPageOrderedEntries[0];
							QUnit.equal(foundEntry.attributes.url,selectedUrl,"Verify same entry");
							smartstore.closeCursor(cursor,
			                    function(param) { QUnit.ok(true,"closeCursor ok"); self.finalizeTest(); },
			                    function(param) { self.setAssertionFailed("closeCursor: " + param); }
			                    );
						}, 
						function(param) { self.setAssertionFailed("querySoup: " + param); }
					);
				});
		});
	
};

SmartStoreTestSuite.prototype.testEmptyQuerySpec  = function() {
	SFHybridApp.logToConsole("In SFSmartStoreTestSuite.testEmptyQuerySpec");
	var self = this;
	
	var querySpec = new SoupQuerySpec(null);
	querySpec.queryType = null; 
	smartstore.querySoup(self.defaultSoupName, querySpec, 
		function(param) { self.setAssertionFailed("querySoup should have failed"); }, 
		function(param) { self.finalizeTest(); }
	);
};


SmartStoreTestSuite.prototype.testIntegerQuerySpec  = function() {
	SFHybridApp.logToConsole("In SFSmartStoreTestSuite.testIntegerQuerySpec");
	var self = this;
	var myEntry1 = { Name: "Todd Stellanova", shots:37 };
    var myEntry2 = { Name: "Pro Bono Bonobo",  shots:92  };
    var myEntry3 = { Name: "Robot",  shots:0  };
    var rawEntries = [myEntry1, myEntry2, myEntry3];
	var soupName = "charmingSoup";

	self.removeAndRecreateSoup(soupName, [{path:"Name", type:"string"}, {path:"shots", type:"integer"}], 
		function(soupName) {
			self.addEntriesToSoup(soupName,rawEntries,
				function(entries) {
					var querySpec = smartstore.buildRangeQuerySpec("shots", 10, 100,"ascending");
					smartstore.querySoup(soupName, querySpec, 
						function(cursor) {
							QUnit.equal(cursor.currentPageOrderedEntries.length, 2, "check currentPageOrderedEntries");
							QUnit.equal(cursor.currentPageOrderedEntries[0].Name,"Todd Stellanova","verify first entry");
							QUnit.equal(cursor.currentPageOrderedEntries[1].Name,"Pro Bono Bonobo","verify last entry");
							smartstore.closeCursor(cursor,
				                function(param) { QUnit.ok(true,"closeCursor ok"); self.finalizeTest(); },
				                function(param) { self.setAssertionFailed("closeCursor: " + param); }
				                );
						},
						function(param) { self.setAssertionFailed("querySoup: " + param); }
					);
				});
		});
		
};

}

