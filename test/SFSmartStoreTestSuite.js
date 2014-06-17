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
 * This file assumes that qunit.js has been previously loaded, as well as jquery.js,  SFTestSuite.js and SFAbstractSmartStoreTestSuite.js
 * To display results you'll need to load qunit.css.
 */
if (typeof SmartStoreTestSuite === 'undefined') { 

/**
 * Constructor for SmartStoreTestSuite
 */
var SmartStoreTestSuite = function () {
    AbstractSmartStoreTestSuite.call(this, 
                                     "smartstore", 
                                     "myPeopleSoup", 
                                     [
                                         {path:"Name", type:"string"}, 
                                         {path:"Id", type:"string"}
                                     ]);
};

// We are sub-classing AbstractSmartStoreTestSuite
SmartStoreTestSuite.prototype = new AbstractSmartStoreTestSuite();
SmartStoreTestSuite.prototype.constructor = SmartStoreTestSuite;


/**
 * Helper method that adds three soup entries to default soup
 */
SmartStoreTestSuite.prototype.stuffTestSoup = function() {
    console.log("In SFSmartStoreTestSuite.stuffTestSoup");
    var myEntry1 = { Name: "Todd Stellanova", Id: "00300A",  attributes:{type:"Contact"} };
    var myEntry2 = { Name: "Pro Bono Bonobo",  Id: "00300B", attributes:{type:"Contact"}  };
    var myEntry3 = { Name: "Robot", Id: "00300C", attributes:{type:"Contact"}  };
    var entries = [myEntry1, myEntry2, myEntry3];
    return this.addEntriesToTestSoup(entries);
};


/** 
 * TEST getDatabaseSize
 */
SmartStoreTestSuite.prototype.testGetDatabaseSize  = function() {
    console.log("In SFSmartStoreTestSuite.testGetDatabaseSize");
    var self = this;
    var initialSize;

    // Start clean
    self.getDatabaseSize()
        .pipe(function(size) {
            QUnit.ok(size > 0,"check getDatabaseSize result: " + size);
            initialSize = size;
            return self.addGeneratedEntriesToTestSoup(2000)
        })
        .pipe(function(entries) {
            QUnit.equal(entries.length, 2000, "check addGeneratedEntriesToTestSoup result");
            return self.getDatabaseSize();
        })
        .pipe(function(size) {
            QUnit.ok(size > initialSize,"check getDatabaseSize result: " + size);
            self.finalizeTest();
        });
};

/** 
 * TEST registerSoup / soupExists / removeSoup 
 */
SmartStoreTestSuite.prototype.testRegisterRemoveSoup = function()  {
    console.log("In SFSmartStoreTestSuite.testRegisterRemoveSoup");
    var soupName = "soupForTestRegisterRemoveSoup";

    var self = this;

    // Start clean
    self.removeSoup(soupName)
        .pipe(function() {
            // Check soup does not exist
            return self.soupExists(soupName);
        })
        .pipe(function(exists) {
            QUnit.equals(exists, false, "soup should not already exist");
            // Create soup
            return self.registerSoup(soupName, self.defaultSoupIndexes);
        })
        .pipe(function(soupName2) {
            QUnit.equals(soupName2,soupName,"registered soup OK");
            // Check soup now exists
            return self.soupExists(soupName);
        }, function(err) {QUnit.ok(false,"self.registerSoup failed " + err);})
        .pipe(function(exists) {
            QUnit.equals(exists, true, "soup should now exist");
            // Attempt to register the same soup again
            return self.registerSoup(soupName, self.defaultSoupIndexes);
        })
        .pipe(function(soupName3) {
            QUnit.equals(soupName3,soupName,"re-registered existing soup OK");
            // Remove soup
            return self.removeSoup(soupName);
        }, function(err) {QUnit.ok(false,"re-registering existing soup failed " + err);})
        .pipe(function() {
            // Check soup no longer exists
            return self.soupExists(soupName);
        })
        .done(function(exists) {
            QUnit.equals(exists, false, "soup should no longer exist");
            self.finalizeTest();
        });
}; 


/** 
 * TEST registerSoup
 */
SmartStoreTestSuite.prototype.testRegisterBogusSoup = function()  {
    console.log("In SFSmartStoreTestSuite.testRegisterBogusSoup");
    var soupName = null;//intentional bogus soupName
    var self = this;

    self.registerSoupNoAssertion(soupName, self.defaultSoupIndexes)
        .done(function(soupName2) {
            self.setAssertionFailed("registerSoup should fail with bogus soupName " + soupName2);
        })
        .fail(function() {            
            QUnit.ok(true,"registerSoup should fail with bogus soupName");
            self.finalizeTest();
        });
};


/** 
 * TEST registerSoup
 */
SmartStoreTestSuite.prototype.testRegisterSoupNoIndices = function()  {
    console.log("In SFSmartStoreTestSuite.testRegisterSoupNoIndices");

    var soupName = "soupForRegisterNoIndices";
    var self = this;

    // Start clean
    self.removeSoup(soupName)
        .pipe(function() {
            // Check soup does not exist
            return self.soupExists(soupName);
        })
        .pipe(function(exists) {
            QUnit.equals(exists, false, "soup should not already exist");
            // Create soup
            return self.registerSoupNoAssertion(soupName, []);
        })
        .done(function(soupName2) {
            self.setAssertionFailed("registerSoup should fail with bogus indices " + soupName2);
        })
        .fail(function() {            
            QUnit.ok(true,"registerSoup should fail with bogus indices");
            self.finalizeTest();
        });
}

/** 
 * TEST upsertSoupEntries
 */
SmartStoreTestSuite.prototype.testUpsertSoupEntries = function()  {
    console.log("In SFSmartStoreTestSuite.testUpsertSoupEntries");

    var self = this;
    self.addGeneratedEntriesToTestSoup(7)
        .pipe(function(entries1) {
            QUnit.equal(entries1.length, 7);
            
            //upsert another batch
            return self.addGeneratedEntriesToTestSoup(12);
        })
        .pipe(function(entries2) {
            QUnit.equal(entries2.length, 12);
            //modify the initial entries
            for (var i = 0; i < entries2.length; i++) {
                var e = entries2[i];
                e.updatedField = "Mister Toast " + i;
            }
            
            //update the entries
            return self.addEntriesToTestSoup(entries2);
        })
        .done(function(entries3) {
            QUnit.equal(entries3.length,12,"updated list match initial list len");
            QUnit.equal(entries3[0].updatedField,"Mister Toast 0","updatedField is correct");
            self.finalizeTest();
        });
}; 

/** 
 * TEST upsertSoupEntriesWithExternalId
 */
SmartStoreTestSuite.prototype.testUpsertSoupEntriesWithExternalId = function()  {
    console.log("In SFSmartStoreTestSuite.testUpsertSoupEntriesWithExternalId");

    var self = this;
    self.addGeneratedEntriesToTestSoup(11)
        .pipe(function(entries1) {
            QUnit.equal(entries1.length, 11);
            
            // Now upsert an overlapping batch, using an external ID path.
            var entries2 = self.createGeneratedEntries(16);
            for (var i = 0; i < entries2.length; i++) {
                var entry = entries2[i];
                entry.updatedField = "Mister Toast " + i;
            }
            var externalIdPath = self.defaultSoupIndexes[0].path;
            return self.upsertEntriesToSoupWithExternalIdPath(self.defaultSoupName, entries2, externalIdPath);
        })
        .pipe(function(entries3) {
            QUnit.equal(entries3.length, 16);
            
            // Now, query the soup for all entries, and make sure that we have only 16.
            var querySpec = navigator.smartstore.buildAllQuerySpec("Name", null, 25);
            return self.querySoup(self.defaultSoupName, querySpec);
        })
        .pipe(function(cursor) {
            QUnit.equal(cursor.totalEntries, 16, "Are totalEntries correct?");
            QUnit.equal(cursor.totalPages, 1, "Are totalPages correct?");
            var orderedEntries = cursor.currentPageOrderedEntries;
            var nEntries = orderedEntries.length;
            QUnit.equal(nEntries, 16, "Are there 16 entries in total?");
            QUnit.equal(orderedEntries[0]._soupEntryId, 1, "Is the first soup entry ID correct?");
            QUnit.equal(orderedEntries[0].updatedField, "Mister Toast 0", "Is the first updated field correct?");
            QUnit.equal(orderedEntries[15]._soupEntryId, 16, "Is the last soup entry ID correct?");
            QUnit.equal(orderedEntries[15].updatedField, "Mister Toast 15", "Is the last updated field correct?");
            
            return self.closeCursor(cursor);
        })
        .done(function(param) { 
            QUnit.ok(true,"closeCursor ok"); 
            self.finalizeTest(); 
        });
}; 


/** 
 * TEST upsertSoupEntries
 */
SmartStoreTestSuite.prototype.testUpsertToNonexistentSoup = function()  {
    console.log("In SFSmartStoreTestSuite.testUpsertToNonexistentSoup");

    var self = this;
    var entries = [{a:1},{a:2},{a:3}];
    
    self.upsertSoupEntriesNoAssertion("nonexistentSoup", entries)
        .done(function(upsertedEntries) {
            self.setAssertionFailed("upsertSoupEntries should fail with nonexistent soup ");
        })
        .fail(function() {            
            QUnit.ok(true,"upsertSoupEntries should fail with nonexistent soup");
            self.finalizeTest();
        });
};
    
/**
 * TEST retrieveSoupEntries
 */
SmartStoreTestSuite.prototype.testRetrieveSoupEntries = function()  {
    console.log("In SFSmartStoreTestSuite.testRetrieveSoupEntries");
    
    var self = this; 
    var soupEntry0Id;
    var soupEntry2Id;

    self.stuffTestSoup()
        .pipe(function(entries) {
            QUnit.equal(entries.length, 3,"check stuffTestSoup result");
            soupEntry0Id = entries[0]._soupEntryId;
            soupEntry2Id = entries[2]._soupEntryId;
            
            return self.retrieveSoupEntries(self.defaultSoupName, [soupEntry2Id, soupEntry0Id]);
        })
        .done(function(retrievedEntries) {
            QUnit.equal(retrievedEntries.length, 2);
            
            var entryIdArray = new Array();
            for (var i = 0; i < retrievedEntries.length; i++) {
                entryIdArray[i] = retrievedEntries[i]._soupEntryId;
            }
            self.collectionContains(entryIdArray, soupEntry0Id);
            self.collectionContains(entryIdArray, soupEntry2Id);
            self.finalizeTest();
        }); 
};


/**
 * TEST removeFromSoup
 */
SmartStoreTestSuite.prototype.testRemoveFromSoup = function()  {
    console.log("In SFSmartStoreTestSuite.testRemoveFromSoup");    
    
    var self = this; 
    self.stuffTestSoup()
        .pipe(function(entries) {
            var soupEntryIds = [];
            QUnit.equal(entries.length, 3);
            
            for (var i = entries.length - 1; i >= 0; i--) {
                var entry = entries[i];
                soupEntryIds.push(entry._soupEntryId);
            }
            
            return self.removeFromSoup(self.defaultSoupName, soupEntryIds);
        })
        .pipe(function(status) {
            QUnit.equal(status, "OK", "removeFromSoup OK");
            
            var querySpec = navigator.smartstore.buildAllQuerySpec("Name");
            return self.querySoup(self.defaultSoupName, querySpec);
        })
        .pipe(function(cursor) {
            var nEntries = cursor.currentPageOrderedEntries.length;
            QUnit.equal(nEntries, 0, "currentPageOrderedEntries correct");
            return self.closeCursor(cursor);
        })
        .done(function(param) { 
            QUnit.ok(true,"closeCursor ok"); 
            self.finalizeTest(); 
        });
};

/**
 * TEST querySoup
 */
SmartStoreTestSuite.prototype.testQuerySoup = function()  {
    console.log("In SFSmartStoreTestSuite.testQuerySoup"); 
    
    var self = this;
    self.stuffTestSoup()
        .pipe(function(entries) {
            QUnit.equal(entries.length, 3);
            
            var querySpec = navigator.smartstore.buildExactQuerySpec("Name","Robot");
            return self.querySoup(self.defaultSoupName, querySpec);
        })
        .pipe(function(cursor) {
            QUnit.equal(cursor.totalEntries, 1, "totalEntries correct");
            QUnit.equal(cursor.totalPages, 1, "totalPages correct");
            var nEntries = cursor.currentPageOrderedEntries.length;
            QUnit.equal(nEntries, 1, "currentPageOrderedEntries correct");
            return self.closeCursor(cursor);
        })
        .done(function(param) { 
            QUnit.ok(true,"closeCursor ok"); 
            self.finalizeTest(); 
        });
};


/**
 * TEST querySoup
 */
SmartStoreTestSuite.prototype.testQuerySoupDescending = function()  {
    console.log("In SFSmartStoreTestSuite.testQuerySoupDescending");   
    
    var self = this;
    self.stuffTestSoup().
        pipe(function(entries) {
            QUnit.equal(entries.length, 3);
            
            var querySpec = navigator.smartstore.buildAllQuerySpec("Name", "descending");       
            return self.querySoup(self.defaultSoupName, querySpec);
        })
        .pipe(function(cursor) {
            QUnit.equal(cursor.totalEntries, 3, "totalEntries correct");
            QUnit.equal(cursor.totalPages, 1, "totalPages correct");
            QUnit.equal(cursor.currentPageOrderedEntries.length, 3, "check currentPageOrderedEntries");
            QUnit.equal(cursor.currentPageOrderedEntries[0].Name,"Todd Stellanova","verify first entry");
            QUnit.equal(cursor.currentPageOrderedEntries[2].Name,"Pro Bono Bonobo","verify last entry");
            return self.closeCursor(cursor);
        })
        .done(function(param) { 
            QUnit.ok(true,"closeCursor ok"); 
            self.finalizeTest(); 
        });
};

/**
 * TEST querySoup
 */
SmartStoreTestSuite.prototype.testQuerySoupBadQuerySpec = function()  {
    console.log("In SFSmartStoreTestSuite.testQuerySoupBadQuerySpec"); 
    
    var self = this;
    self.stuffTestSoup()
        .pipe(function(entries) {
            QUnit.equal(entries.length, 3);
            
            //query on a nonexistent index
            var querySpec = navigator.smartstore.buildRangeQuerySpec("bottlesOfBeer",99,null,"descending");             
            
            return self.querySoupNoAssertion(self.defaultSoupName, querySpec);
        })
        .done(function(cursor) {
            self.setAssertionFailed("querySoup with bogus querySpec should fail");
        })
        .fail(function(param) { 
            QUnit.ok(true,"querySoup with bogus querySpec should fail");
            self.finalizeTest();                
        });
};


/**
 * TEST querySoup  with an endKey and no beginKey
 */
SmartStoreTestSuite.prototype.testQuerySoupEndKeyNoBeginKey = function()  {
    console.log("In SFSmartStoreTestSuite.testQuerySoupEndKeyNoBeginKey"); 
    var self = this;
    
    self.stuffTestSoup()
        .pipe(function(entries) {
            QUnit.equal(entries.length, 3);
            //keep in sync with stuffTestSoup
            var querySpec = navigator.smartstore.buildRangeQuerySpec("Name",null,"Robot");              

            return self.querySoup(self.defaultSoupName, querySpec);
        })
        .pipe(function(cursor) {
            var nEntries = cursor.currentPageOrderedEntries.length;
            QUnit.equal(nEntries, 2, "nEntries matches endKey");
            QUnit.equal(cursor.currentPageOrderedEntries[1].Name,"Robot","verify last entry");
            return self.closeCursor(cursor);
        })
        .done(function(param) { 
            QUnit.ok(true,"closeCursor ok"); 
            self.finalizeTest(); 
        });
};

/**
 * TEST querySoup  with beginKey and no endKey
 */
SmartStoreTestSuite.prototype.testQuerySoupBeginKeyNoEndKey = function()  {
    console.log("In SFSmartStoreTestSuite.testQuerySoupBeginKeyNoEndKey"); 
    var self = this;

    self.stuffTestSoup()
        .pipe(function(entries) {
            QUnit.equal(entries.length, 3);
            //keep in sync with stuffTestSoup
            var querySpec = navigator.smartstore.buildRangeQuerySpec("Name","Robot",null);              

            return self.querySoup(self.defaultSoupName, querySpec);
        })
        .pipe(function(cursor) {
            var nEntries = cursor.currentPageOrderedEntries.length;
            QUnit.equal(nEntries, 2, "nEntries matches beginKey");
            QUnit.equal(cursor.currentPageOrderedEntries[0].Name,"Robot","verify first entry");
            return self.closeCursor(cursor);
        })
        .done(function(param) { 
            QUnit.ok(true,"closeCursor ok"); 
            self.finalizeTest(); 
        });
};

/**
 * TEST testManipulateCursor
 */
SmartStoreTestSuite.prototype.testManipulateCursor = function()  {
  console.log("In SFSmartStoreTestSuite.testManipulateCursor");  
  var self = this;

  var NUM_ENTRIES = 42;
  var PAGE_SIZE = 20;
  var LAST_PAGE_SIZE = NUM_ENTRIES % PAGE_SIZE; // 2
  var NUM_PAGES = Math.ceil(NUM_ENTRIES / PAGE_SIZE); // 3
  
  var checkPage = function(cursor, expectedPage) {
      var expectedPageSize = (expectedPage < NUM_PAGES - 1 ? PAGE_SIZE : LAST_PAGE_SIZE);
      var expectedIdOfFirstRowOnPage = "003" + self.padNumber(expectedPage*PAGE_SIZE, NUM_ENTRIES, "0");
      var expectedIdOfLastRowOnPage = "003" + self.padNumber(expectedPage*PAGE_SIZE+expectedPageSize-1, NUM_ENTRIES, "0");

      QUnit.equal(cursor.currentPageIndex, expectedPage, "currentPageIndex correct");
      QUnit.equal(cursor.totalEntries, NUM_ENTRIES, "totalEntries correct");
      QUnit.equal(cursor.totalPages, NUM_PAGES, "totalPages correct");
      QUnit.equal(cursor.currentPageOrderedEntries.length, expectedPageSize, "pageSize correct");      
      QUnit.equal(cursor.currentPageOrderedEntries[0].Id, expectedIdOfFirstRowOnPage , "pageSize correct");      
      QUnit.equal(cursor.currentPageOrderedEntries[expectedPageSize-1].Id, expectedIdOfLastRowOnPage, "pageSize correct");      
  };

  self.addGeneratedEntriesToTestSoup(NUM_ENTRIES)
        .pipe(function(entries) {
            QUnit.equal(entries.length, NUM_ENTRIES);
            var querySpec = navigator.smartstore.buildAllQuerySpec("Name",null,PAGE_SIZE);
            return self.querySoup(self.defaultSoupName, querySpec);
        })
        .pipe(function(cursor) {
            checkPage(cursor, 0);
            return self.moveCursorToNextPage(cursor);
        })
        .pipe(function(cursor) {
            checkPage(cursor, 1);
            return self.moveCursorToNextPage(cursor);
        })
        .pipe(function(cursor) {
            checkPage(cursor, 2);
            return self.moveCursorToPreviousPage(cursor);
        })
        .pipe(function(cursor) {
            checkPage(cursor, 1);
            return self.moveCursorToNextPage(cursor);
        })
        .pipe(function(cursor) {
            checkPage(cursor, 2);
            return self.closeCursor(cursor);
        })
        .done(function(param) { 
            QUnit.ok(true,"closeCursor ok"); 
            self.finalizeTest(); 
        });
};

/**
 * TEST testMoveCursorToPreviousPageFromFirstPage
 */
SmartStoreTestSuite.prototype.testMoveCursorToPreviousPageFromFirstPage = function()  {
  console.log("In SFSmartStoreTestSuite.testMoveCursorToPreviousPageFromFirstPage");  
  var self = this;

  var NUM_ENTRIES = 8;
  var PAGE_SIZE = 5;
  var NUM_PAGES = Math.ceil(NUM_ENTRIES / PAGE_SIZE); // 2
  
  self.addGeneratedEntriesToTestSoup(NUM_ENTRIES)
        .pipe(function(entries) {
            QUnit.equal(entries.length, NUM_ENTRIES);
            var querySpec = navigator.smartstore.buildAllQuerySpec("Name",null,PAGE_SIZE);
            return self.querySoup(self.defaultSoupName, querySpec);
        })
        .pipe(function(cursor) {
            QUnit.equal(cursor.currentPageIndex, 0, "currentPageIndex correct");
            return self.moveCursorToPreviousPageNoAssertion(cursor);
        })
        .fail(function(cursor, error) {
            QUnit.equal(cursor.currentPageIndex, 0, "currentPageIndex should not have changed");
            QUnit.ok(error.message.indexOf("moveCursorToPreviousPage") == 0, "error should be about moveCursorToPreviousPage");
            self.closeCursor(cursor)
                .done(function(param) { 
                    QUnit.ok(true,"closeCursor ok"); 
                    self.finalizeTest(); 
                });
        });
};


/**
 * TEST testMoveCursorToNextPageFromLastPage
 */
SmartStoreTestSuite.prototype.testMoveCursorToNextPageFromLastPage = function()  {
  console.log("In SFSmartStoreTestSuite.testMoveCursorToNextPageFromLastPage");  
  var self = this;

  var NUM_ENTRIES = 8;
  var PAGE_SIZE = 5;
  var NUM_PAGES = Math.ceil(NUM_ENTRIES / PAGE_SIZE); // 2
  
  self.addGeneratedEntriesToTestSoup(NUM_ENTRIES)
        .pipe(function(entries) {
            QUnit.equal(entries.length, NUM_ENTRIES);
            var querySpec = navigator.smartstore.buildAllQuerySpec("Name",null,PAGE_SIZE);
            return self.querySoup(self.defaultSoupName, querySpec);
        })
        .pipe(function(cursor) {
            QUnit.equal(cursor.currentPageIndex, 0, "currentPageIndex correct");
            return self.moveCursorToNextPage(cursor);
        })
        .pipe(function(cursor) {
            QUnit.equal(cursor.currentPageIndex, 1, "currentPageIndex correct");
            return self.moveCursorToNextPageNoAssertion(cursor);
        })
        .fail(function(cursor, error) {
            QUnit.equal(cursor.currentPageIndex, 1, "currentPageIndex should not have changed");
            QUnit.ok(error.message.indexOf("moveCursorToNextPage") == 0, "error should be about moveCursorToNextPage");
            self.closeCursor(cursor)
                .done(function(param) { 
                    QUnit.ok(true,"closeCursor ok"); 
                    self.finalizeTest(); 
                });
        });
};


/**
 * TEST unusual soup names
 */
SmartStoreTestSuite.prototype.testArbitrarySoupNames = function() {
    console.log("In SFSmartStoreTestSuite.testArbitrarySoupNames");    
    var self = this;
    var soupName = "123This should-be a_valid.soup+name!?100";
    
    //simply register and verify that the soup exists
    self.removeAndRecreateSoup(soupName,self.defaultSoupIndexes).
        done(function() {
            self.finalizeTest();
        });
};


/**
 * TEST querySpec factory functions
 */
SmartStoreTestSuite.prototype.testQuerySpecFactories = function() {
    console.log("In SFSmartStoreTestSuite.testQuerySpecFactories");
    var self = this;
    
    var path = "Name";
    var beginKey = "Qbert";
    var endKey = "Zzzzbert";
    var order = "descending";
    var pageSize = 17;
    var query =  navigator.smartstore.buildExactQuerySpec(path,beginKey,pageSize);
    QUnit.equal(query.queryType,"exact","check queryType");
    QUnit.equal(query.indexPath,path,"check indexPath");
    QUnit.equal(query.matchKey,beginKey,"check matchKey");
    QUnit.equal(query.pageSize,pageSize,"check pageSize");
    
    query =  navigator.smartstore.buildRangeQuerySpec(path,beginKey,endKey,order,pageSize);
    QUnit.equal(query.queryType,"range","check queryType");
    QUnit.equal(query.indexPath,path,"check indexPath");
    QUnit.equal(query.beginKey,beginKey,"check beginKey");
    QUnit.equal(query.endKey,endKey,"check endKey");
    QUnit.equal(query.order,order,"check order");
    QUnit.equal(query.pageSize,pageSize,"check pageSize");
    
    query =  navigator.smartstore.buildLikeQuerySpec(path,beginKey,order,pageSize);
    QUnit.equal(query.queryType,"like","check queryType");
    QUnit.equal(query.indexPath,path,"check indexPath");
    QUnit.equal(query.likeKey,beginKey,"check likeKey");
    QUnit.equal(query.order,order,"check order");
    QUnit.equal(query.pageSize,pageSize,"check pageSize");
    
    var query =  navigator.smartstore.buildAllQuerySpec(path,order,pageSize);
    QUnit.equal(query.queryType,"range","check queryType");
    QUnit.equal(query.indexPath,path,"check indexPath");
    QUnit.equal(query.beginKey,null,"check beginKey");
    QUnit.equal(query.endKey,null,"check endKey");
    QUnit.equal(query.order,order,"check order");
    QUnit.equal(query.pageSize,pageSize,"check pageSize");
    
    self.finalizeTest();
};

/**
 * TEST like query starts with
 */
SmartStoreTestSuite.prototype.testLikeQuerySpecStartsWith  = function() {
    console.log("In SFSmartStoreTestSuite.testLikeQuerySpecStartsWith");
    var self = this;
    
    self.stuffTestSoup()
        .pipe(function(entries) {
            QUnit.equal(entries.length, 3,"check stuffTestSoup result");
            var querySpec = navigator.smartstore.buildLikeQuerySpec("Name","Todd%");
            return self.querySoup(self.defaultSoupName, querySpec);
        })
        .pipe(function(cursor) {
            var nEntries = cursor.currentPageOrderedEntries.length;
            QUnit.equal(nEntries, 1, "currentPageOrderedEntries correct");
            return self.closeCursor(cursor);
        })
        .done(function(param) { 
            QUnit.ok(true,"closeCursor ok"); 
            self.finalizeTest();
        });
};


/**
 * TEST like query ends with
 */
SmartStoreTestSuite.prototype.testLikeQuerySpecEndsWith  = function() {
    console.log("In SFSmartStoreTestSuite.testLikeQuerySpecEndsWith");
    var self = this;
    
    self.stuffTestSoup()
        .pipe(function(entries) {
            QUnit.equal(entries.length, 3,"check stuffTestSoup result");
            var querySpec = navigator.smartstore.buildLikeQuerySpec("Name","%Stellanova");
            return self.querySoup(self.defaultSoupName, querySpec);
        })
        .pipe(function(cursor) {
            var nEntries = cursor.currentPageOrderedEntries.length;
            QUnit.equal(nEntries, 1, "currentPageOrderedEntries correct");
            return self.closeCursor(cursor);
        })
        .done(function(param) { 
            QUnit.ok(true,"closeCursor ok"); 
            self.finalizeTest(); 
        });
};

/**
 * TEST like query inner text
 */
SmartStoreTestSuite.prototype.testLikeQueryInnerText  = function() {
    console.log("In SFSmartStoreTestSuite.testLikeQueryInnerText");
    var self = this;
    
    self.stuffTestSoup()
        .pipe(function(entries) {
            QUnit.equal(entries.length, 3,"check stuffTestSoup result");
            var querySpec = navigator.smartstore.buildLikeQuerySpec("Name","%ono%");
            return self.querySoup(self.defaultSoupName, querySpec);
        })
        .pipe(function(cursor) {
            var nEntries = cursor.currentPageOrderedEntries.length;
            QUnit.equal(nEntries, 1, "currentPageOrderedEntries correct");
            return self.closeCursor(cursor);
        })
        .done(function(param) { 
            QUnit.ok(true,"closeCursor ok"); 
            self.finalizeTest(); 
        });
};

/**
 * TEST query with compound path
 */
SmartStoreTestSuite.prototype.testCompoundQueryPath  = function() {
    console.log("In SFSmartStoreTestSuite.testCompoundQueryPath");
    var self = this;
    //attributes.url is a nonsensical path but it works for testing compound paths
    var indices = [{path:"Name", type:"string"}, {path:"Id", type:"string"}, {path:"attributes.url", type:"string"}];
    var soupName = "compoundPathSoup";
    var selectedUrl;
    self.removeAndRecreateSoup(soupName,indices)
        .pipe(function() {
            return self.addGeneratedEntriesToSoup(soupName, 3);
        })
        .pipe(function(entries) {
            QUnit.equal(entries.length, 3,"check addGeneratedEntriesToSoup result");
            //pick out a compound path value and ensure that we can query for the same entry
            var selectedEntry = entries[1];
            selectedUrl = selectedEntry.attributes.url;
            var querySpec = navigator.smartstore.buildExactQuerySpec("attributes.url",selectedUrl);
            return self.querySoup(soupName, querySpec); 
        })
        .pipe(function(cursor) {
            QUnit.equal(cursor.currentPageOrderedEntries.length, 1, "currentPageOrderedEntries correct");
            var foundEntry = cursor.currentPageOrderedEntries[0];
            QUnit.equal(foundEntry.attributes.url,selectedUrl,"Verify same entry");
            return self.closeCursor(cursor);
        })
        .done(function(param) { 
            QUnit.ok(true,"closeCursor ok"); 
            self.finalizeTest(); 
        });
};

/**
 * TEST query with empty query spec
 */
SmartStoreTestSuite.prototype.testEmptyQuerySpec  = function() {
    console.log("In SFSmartStoreTestSuite.testEmptyQuerySpec");
    var self = this;
    
    var querySpec = new QuerySpec(null);
    querySpec.queryType = null; 
    self.querySoupNoAssertion(self.defaultSoupName, querySpec)
    .done(function(param) { 
        self.setAssertionFailed("querySoup should have failed"); 
    })
    .fail(function(param) { 
        self.finalizeTest(); 
    });
};


/**
 * TEST query against integer field
 */
SmartStoreTestSuite.prototype.testIntegerQuerySpec  = function() {
    console.log("In SFSmartStoreTestSuite.testIntegerQuerySpec");
    var self = this;
    var myEntry1 = { Name: "Todd Stellanova", shots:37 };
    var myEntry2 = { Name: "Pro Bono Bonobo",  shots:92  };
    var myEntry3 = { Name: "Robot",  shots:0  };
    var rawEntries = [myEntry1, myEntry2, myEntry3];
    var soupName = "charmingSoup";

    self.removeAndRecreateSoup(soupName, [{path:"Name", type:"string"}, {path:"shots", type:"integer"}])
    .pipe(function() {
        return self.upsertSoupEntries(soupName,rawEntries);
    })
    .pipe(function(entries) {
        var querySpec = navigator.smartstore.buildRangeQuerySpec("shots", 10, 100,"ascending");
        return self.querySoup(soupName, querySpec);
    })
    .pipe(function(cursor) {
        QUnit.equal(cursor.currentPageOrderedEntries.length, 2, "check currentPageOrderedEntries");
        QUnit.equal(cursor.currentPageOrderedEntries[0].Name,"Todd Stellanova","verify first entry");
        QUnit.equal(cursor.currentPageOrderedEntries[1].Name,"Pro Bono Bonobo","verify last entry");
        return self.closeCursor(cursor);
    })
    .done(function(param) { 
        QUnit.ok(true,"closeCursor ok"); 
        self.finalizeTest();
    });
};

SmartStoreTestSuite.prototype.testSmartQueryWithCount  = function() {
    console.log("In SFSmartStoreTestSuite.testSmartQueryWithCount");
    var self = this;
    
    self.stuffTestSoup()
        .pipe(function(entries) {
            QUnit.equal(entries.length, 3,"check stuffTestSoup result");
            var querySpec = navigator.smartstore.buildSmartQuerySpec("select count(*) from {myPeopleSoup}", 1);
            return self.runSmartQuery(querySpec);
        })
        .pipe(function(cursor) {
            QUnit.equal(1, cursor.currentPageOrderedEntries.length, "check number of rows returned");
            QUnit.equal(1, cursor.currentPageOrderedEntries[0].length, "check number of fields returned");
            QUnit.equal("[[3]]", JSON.stringify(cursor.currentPageOrderedEntries), "check currentPageOrderedEntries");
            return self.closeCursor(cursor);
        })
        .done(function(param) { 
            QUnit.ok(true,"closeCursor ok"); 
            self.finalizeTest();
        });
};


/**
 * TEST query with special field
 */
SmartStoreTestSuite.prototype.testSmartQueryWithSpecialFields  = function() {
    console.log("In SFSmartStoreTestSuite.testSmartQueryWithSpecialFields");
    var self = this;
    var expectedEntry;
    
    if (window.mockStore) {
        // Mock smartstore doesn't support such queries
        self.finalizeTest();
        return;
    }
    
    self.stuffTestSoup()
        .pipe(function(entries) {
            QUnit.equal(entries.length, 3,"check stuffTestSoup result");
            expectedEntry = entries[0];
            var sql = "select {myPeopleSoup:_soup}, {myPeopleSoup:_soupEntryId}, {myPeopleSoup:_soupLastModifiedDate} from {myPeopleSoup} where {myPeopleSoup:Id} = '" + expectedEntry.Id + "'";
            var querySpec = navigator.smartstore.buildSmartQuerySpec(sql, 1);
            return self.runSmartQuery(querySpec);
        })
        .pipe(function(cursor) {
            QUnit.equal(1, cursor.currentPageOrderedEntries.length, "check number of rows returned");
            QUnit.equal(3, cursor.currentPageOrderedEntries[0].length, "check number of fields returned");
            QUnit.equal(expectedEntry._soupEntryId, cursor.currentPageOrderedEntries[0][0]._soupEntryId, "check _soup's soupEntryId returned");
            QUnit.equal(expectedEntry.Id, cursor.currentPageOrderedEntries[0][0].Id, "check _soup's Id returned");
            QUnit.equal(expectedEntry.Name, cursor.currentPageOrderedEntries[0][0].Name, "check _soup's Name returned");
            QUnit.equal(expectedEntry._soupEntryId, cursor.currentPageOrderedEntries[0][1], "check _soupEntryId returned");
            QUnit.equal(expectedEntry._soupLastModifiedDate, cursor.currentPageOrderedEntries[0][2], "check _soupLastModifieddate returned");
            return self.closeCursor(cursor);
        })
        .done(function(param) { 
            QUnit.ok(true,"closeCursor ok"); 
            self.finalizeTest();
        });
};


/**
 * TEST getSoupIndexSpecs
 */
SmartStoreTestSuite.prototype.testGetSoupIndexSpecs  = function() {
    var soupName = "soupForGetSoupIndexSpecs";
    var self = this;

    // Start clean
    self.removeSoup(soupName)
        .pipe(function() {
            // Create soup
            return self.registerSoupNoAssertion(soupName, self.defaultSoupIndexes);
        })
        .pipe(function(soupName2) {
            QUnit.equals(soupName2,soupName,"registered soup OK");
            // Checking soup indexes
            return self.checkSoupIndexes(soupName, self.defaultSoupIndexes);
        })
        .done(function() {
            self.finalizeTest();
        });
};


/**
 * TEST getSoupIndexSpecs with bogus soupName
 */
SmartStoreTestSuite.prototype.testGetSoupIndexSpecsWithBogusSoupName  = function() {
    var soupName = "soupForGetSoupIndexSpecsWithBogusSoupName";
    var self = this;

    // Check soup does not exist
    self.soupExists(soupName)
        .pipe(function(exists) {
            QUnit.equals(exists, false, "soup should not already exist");
            return self.getSoupIndexSpecsNoAssertion(soupName);
        })
        .done(function() {
            self.setAssertionFailed("getSoupIndexSpecs with bogus soupName should fail");
        })
        .fail(function() {            
            QUnit.ok(true,"getSoupIndexSpecs should fail for bogus soupName");
            self.finalizeTest();
        });
};


/**
 * TEST alterSoupNoReIndexing
 */
SmartStoreTestSuite.prototype.testAlterSoupNoReIndexing  = function() {
    this.tryAlterSoup(false);
};

/**
 * TEST alterSoupWithReIndexing
 */
SmartStoreTestSuite.prototype.testAlterSoupWithReIndexing  = function() {
    this.tryAlterSoup(true);
};

/**
 * Helper method for alterSoup tests
 */
SmartStoreTestSuite.prototype.tryAlterSoup = function(reIndexData) {
    var self = this;
    var alteredIndexes = [{path:"Name", type:"string"}, {path:"attributes.type", type:"string"}];

    // Populate soup
    return self.stuffTestSoup()
        .pipe(function(entries) {
            QUnit.equal(entries.length, 3,"check stuffTestSoup result");
            // Alter soup
            return self.alterSoup(self.defaultSoupName, alteredIndexes, reIndexData);
        })
        .pipe(function() {
            // Checking altered soup indexes 
            return self.checkSoupIndexes(self.defaultSoupName, alteredIndexes);
        })
        .pipe(function() {
            // Query by a new indexed field
            var querySpec = navigator.smartstore.buildExactQuerySpec("attributes.type", "Contact", 3);
            return self.querySoup(self.defaultSoupName, querySpec);
        })
        .pipe(function(cursor) {
            QUnit.equal(cursor.currentPageOrderedEntries.length, reIndexData ? 3 : 0, "check number of rows returned");
            return self.closeCursor(cursor);
        })
        .pipe(function() {
            // Query by a previously indexed field
            var querySpec = navigator.smartstore.buildExactQuerySpec("Name", "Robot", 3);
            return self.querySoup(self.defaultSoupName, querySpec);
        })
        .pipe(function(cursor) {
            QUnit.equal(cursor.currentPageOrderedEntries.length, 1, "check number of rows returned");
            return self.closeCursor(cursor);
        })
        .done(function(param) { 
            QUnit.ok(true,"closeCursor ok"); 
            self.finalizeTest();
        });
};


/**
 * TEST alterSoup with bogus soupName
 */
SmartStoreTestSuite.prototype.testAlterSoupWithBogusSoupName  = function() {
    var soupName = "soupForAlterSoupWithBogusSoupName";
    var self = this;

    // Check soup does not exist
    self.soupExists(soupName)
        .pipe(function(exists) {
            QUnit.equals(exists, false, "soup should not already exist");
            return self.alterSoupNoAssertion(soupName, [{path:"key", type:"string"}], true);
        })
        .done(function() {
            self.setAssertionFailed("alterSoup with bogus soupName should fail");
        })
        .fail(function() {            
            QUnit.ok(true,"alterSoup should fail for bogus soupName");
            self.finalizeTest();
        });
};

/**
 * TEST reIndexSoup
 */
SmartStoreTestSuite.prototype.testReIndexSoup = function() {
    var self = this;
    var alteredIndexes = [{path:"Name", type:"string"}, {path:"attributes.type", type:"string"}];

    // Populate soup
    return self.stuffTestSoup()
        .pipe(function(entries) {
            QUnit.equal(entries.length, 3,"check stuffTestSoup result");
            // Alter soup
            return self.alterSoup(self.defaultSoupName, alteredIndexes, false);
        })
        .pipe(function() {
            // Checking altered soup indexes 
            return self.checkSoupIndexes(self.defaultSoupName, alteredIndexes);
        })
        .pipe(function() {
            // Query by a new indexed field
            var querySpec = navigator.smartstore.buildExactQuerySpec("attributes.type", "Contact", 3);
            return self.querySoup(self.defaultSoupName, querySpec);
        })
        .pipe(function(cursor) {
            QUnit.equal(cursor.currentPageOrderedEntries.length, 0, "check number of rows returned");
            return self.closeCursor(cursor);
        })
        .pipe(function(cursor) {
            // Re-index soup
            return self.reIndexSoup(self.defaultSoupName, ["attributes.type"]);
        })
        .pipe(function() {
            // Query by a new indexed field
            var querySpec = navigator.smartstore.buildExactQuerySpec("attributes.type", "Contact", 3);
            return self.querySoup(self.defaultSoupName, querySpec);
        })
        .pipe(function(cursor) {
            QUnit.equal(cursor.currentPageOrderedEntries.length, 3, "check number of rows returned");
            return self.closeCursor(cursor);
        })
        .pipe(function() {
            // Query by a previously indexed field
            var querySpec = navigator.smartstore.buildExactQuerySpec("Name", "Robot", 3);
            return self.querySoup(self.defaultSoupName, querySpec);
        })
        .pipe(function(cursor) {
            QUnit.equal(cursor.currentPageOrderedEntries.length, 1, "check number of rows returned");
            return self.closeCursor(cursor);
        })
        .done(function(param) { 
            QUnit.ok(true,"closeCursor ok"); 
            self.finalizeTest();
        });
};


/**
 * Helper method checkSoupIndexes
 */
SmartStoreTestSuite.prototype.checkSoupIndexes = function(soupName, expectedIndexes) {
    return this.getSoupIndexSpecs(soupName)
        .done(function(soupIndexes) {
            QUnit.equals(expectedIndexes.length, soupIndexes.length, "Check number of soup indices");
            for (i = 0; i< expectedIndexes.length; i++) {
                QUnit.equals(expectedIndexes[i].path, soupIndexes[i].path, "Check path");
                QUnit.equals(expectedIndexes[i].type, soupIndexes[i].type, "Check type");
            }
        });
};


/**
 * TEST clearSoup
 */
SmartStoreTestSuite.prototype.testClearSoup = function()  {
    console.log("In SFSmartStoreTestSuite.testClearSoup");    
    
    var self = this; 
    self.stuffTestSoup()
        .pipe(function(entries) {
            QUnit.equal(entries.length, 3);
            return self.clearSoup(self.defaultSoupName);
        })
        .pipe(function(status) {
            QUnit.equal(status, "OK", "clearSoup OK");
            
            var querySpec = navigator.smartstore.buildAllQuerySpec("Name");
            return self.querySoup(self.defaultSoupName, querySpec);
        })
        .pipe(function(cursor) {
            var nEntries = cursor.currentPageOrderedEntries.length;
            QUnit.equal(nEntries, 0, "currentPageOrderedEntries correct");
            return self.closeCursor(cursor);
        })
        .done(function(param) { 
            QUnit.ok(true,"closeCursor ok"); 
            self.finalizeTest(); 
        });
};

}

