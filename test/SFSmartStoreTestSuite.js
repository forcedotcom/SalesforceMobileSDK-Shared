/*
 * Copyright (c) 2012-present, salesforce.com, inc.
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
                                         [
                                             {path:"Name", type:"string"},
                                             {path:"Id", type:"string"}
                                         ]);

        // To run specific tests
        //this.testsToRun = ["testCreateMultipleUserStores"];
    };

    // We are sub-classing AbstractSmartStoreTestSuite
    SmartStoreTestSuite.prototype = new AbstractSmartStoreTestSuite();
    SmartStoreTestSuite.prototype.constructor = SmartStoreTestSuite;


    /**
     * Helper method that adds three soup entries to default soup
     */
    SmartStoreTestSuite.prototype.stuffTestSoup = function() {
        console.log("In SFSmartStoreTestSuite.stuffTestSoup");
        var myEntry1 = { Name: "Todd Stellanova", Id: "00300A", attributes:{type:"Contact"}, department:"Engineering"};
        var myEntry2 = { Name: "Pro Bono Bonobo",  Id: "00300B", attributes:{type:"Contact"}, department:"Biology"};
        var myEntry3 = { Name: "Robot", Id: "00300C", attributes:{type:"Contact"}, department:"Engineering"};
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
        self.smartstoreClient.getDatabaseSize()
            .then(function(size) {
                QUnit.ok(size > 0,"check getDatabaseSize result: " + size);
                initialSize = size;
                return self.addGeneratedEntriesToTestSoup(2000)
            })
            .then(function(entries) {
                QUnit.equal(entries.length, 2000, "check addGeneratedEntriesToTestSoup result");
                return self.smartstoreClient.getDatabaseSize();
            })
            .then(function(size) {
                QUnit.ok(size > initialSize,"check getDatabaseSize result: " + size);
                self.finalizeTest();
            });
    };

    /**
     * TEST global store vs regular store with registerSoup / soupExists / removeSoup
     */
    SmartStoreTestSuite.prototype.testRegisterRemoveSoupGlobalStore = function()  {
        console.log("In SFSmartStoreTestSuite.testRegisterRemoveSoupGlobalStore");
        var soupName = "soupForTestRegisterRemoveSoupGlobalStore";

        var self = this;
        var GLOBAL_STORE = true;
        var REGULAR_STORE = false;

        // Start clean
        Promise.all([self.smartstoreClient.removeSoup(REGULAR_STORE, soupName),
                     self.smartstoreClient.removeSoup(GLOBAL_STORE, soupName)])
            .then(function() {
                // Check soup does not exist in either stores
                return Promise.all([self.smartstoreClient.soupExists(REGULAR_STORE, soupName),
                                    self.smartstoreClient.soupExists(GLOBAL_STORE, soupName)]);
            })
            .then(function(result) {
                var exists = result[0], existsGlobal = result[1];
                QUnit.equals(exists, false, "soup should not already exist in regular store");
                QUnit.equals(existsGlobal, false, "soup should not already exist in global store");
                // Create soup in global store
                return self.smartstoreClient.registerSoup(GLOBAL_STORE, soupName, self.defaultSoupIndexes);
            })
            .then(function(soupName2) {
                QUnit.equals(soupName2,soupName,"registered soup OK in global store");
                // Check soup exist only in global store
                return Promise.all([self.smartstoreClient.soupExists(REGULAR_STORE, soupName),
                                    self.smartstoreClient.soupExists(GLOBAL_STORE, soupName)]);
            })
            .then(function(result) {
                var exists = result[0], existsGlobal = result[1];
                QUnit.equals(exists, false, "soup should not exist in regular store");
                QUnit.equals(existsGlobal, true, "soup should now exist in global store");
                // Create soup in regular store
                return self.smartstoreClient.registerSoup(REGULAR_STORE, soupName, self.defaultSoupIndexes);
            })
            .then(function(soupName2) {
                QUnit.equals(soupName2,soupName,"registered soup OK in regular store");
                // Check soup exist only in both stores
                return Promise.all([self.smartstoreClient.soupExists(REGULAR_STORE, soupName),
                                    self.smartstoreClient.soupExists(GLOBAL_STORE, soupName)]);
            })
            .then(function(result) {
                var exists = result[0], existsGlobal = result[1];
                QUnit.equals(exists, true, "soup should now exist in regular store");
                QUnit.equals(existsGlobal, true, "soup should exist in global store");
                // Remove soup from global store
                return self.smartstoreClient.removeSoup(GLOBAL_STORE, soupName);
            })
            .then(function() {
                // Check soup exist only in regular store
                return Promise.all([self.smartstoreClient.soupExists(REGULAR_STORE, soupName),
                                    self.smartstoreClient.soupExists(GLOBAL_STORE, soupName)]);
            })
            .then(function(result) {
                var exists = result[0], existsGlobal = result[1];
                QUnit.equals(exists, true, "soup should still exist in regular store");
                QUnit.equals(existsGlobal, false, "soup should no longer exist in global store");
                // Remove soup from regular store
                return self.smartstoreClient.removeSoup(REGULAR_STORE, soupName);
            })
            .then(function() {
                // Check soup no longer exist in either store
                return Promise.all([self.smartstoreClient.soupExists(REGULAR_STORE, soupName),
                                    self.smartstoreClient.soupExists(GLOBAL_STORE, soupName)]);
            })
            .then(function(result) {
                var exists = result[0], existsGlobal = result[1];
                QUnit.equals(exists, false, "soup should no longer exist in regular store");
                QUnit.equals(existsGlobal, false, "soup should no longer exist in global store");
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
        self.smartstoreClient.removeSoup(soupName)
            .then(function() {
                // Check soup does not exist
                return self.smartstoreClient.soupExists(soupName);
            })
            .then(function(exists) {
                QUnit.equals(exists, false, "soup should not already exist");
                // Create soup
                return self.smartstoreClient.registerSoup(soupName, self.defaultSoupIndexes);
            })
            .then(function(soupName2) {
                QUnit.equals(soupName2,soupName,"registered soup OK");
                // Check soup now exists
                return self.smartstoreClient.soupExists(soupName);
            }, function(err) {QUnit.ok(false,"self.smartstoreClient.registerSoup failed " + err);})
            .then(function(exists) {
                QUnit.equals(exists, true, "soup should now exist");
                // Attempt to register the same soup again
                return self.smartstoreClient.registerSoup(soupName, self.defaultSoupIndexes);
            })
            .then(function(soupName3) {
                QUnit.equals(soupName3,soupName,"re-registered existing soup OK");
                // Remove soup
                return self.smartstoreClient.removeSoup(soupName);
            }, function(err) {QUnit.ok(false,"re-registering existing soup failed " + err);})
            .then(function() {
                // Check soup no longer exists
                return self.smartstoreClient.soupExists(soupName);
            })
            .then(function(exists) {
                QUnit.equals(exists, false, "soup should no longer exist");
                self.finalizeTest();
            });
    };

    /**
     * TEST registerSoupWithSpec / getSoupSpec / removeSoup
     */
    SmartStoreTestSuite.prototype.testRegisterWithSpec = function()  {
        console.log("In SFSmartStoreTestSuite.testRegisterWithSpec");
        var soupName = "soupForTestRegisterWithSpec";

        var self = this;

        // Start clean
        self.smartstoreClient.removeSoup(soupName)
            .then(function() {
                // Check soup does not exist
                return self.smartstoreClient.soupExists(soupName);
            })
            .then(function(exists) {
                QUnit.equals(exists, false, "soup should not already exist");
                // Create soup
                return self.smartstoreClient.registerSoupWithSpec({name:soupName, features:["externalStorage"]}, self.defaultSoupIndexes);
            })
            .then(function(soupName2) {
                QUnit.equals(soupName2,soupName,"registered soup OK");
                // Check soup now exists
                return self.smartstoreClient.soupExists(soupName);
            }, function(err) {QUnit.ok(false,"self.smartstoreClient.registerSoupWithSpec failed " + err);})
            .then(function(exists) {
                QUnit.equals(exists, true, "soup should now exist");
                // Check soup spec
                return self.checkSoupSpec(soupName, {name:soupName, features:["externalStorage"]});
            })
            .then(function() {
                // Remove soup
                return self.smartstoreClient.removeSoup(soupName);
            }, function(err) {QUnit.ok(false,"self.smartstoreClient.getSoupSpec failed " + err);})
            .then(function() {
                // Check soup no longer exists
                return self.smartstoreClient.soupExists(soupName);
            })
            .then(function(exists) {
                QUnit.equals(exists, false, "soup should no longer exist");
                self.finalizeTest();
            });
    };


    /**
     * TEST registerSoup with bogus soup
     */
    SmartStoreTestSuite.prototype.testRegisterBogusSoup = function()  {
        console.log("In SFSmartStoreTestSuite.testRegisterBogusSoup");
        var soupName = null;//intentional bogus soupName
        var self = this;

        self.smartstoreClient.registerSoup(soupName, self.defaultSoupIndexes)
            .catch(function() {
                QUnit.ok(true,"registerSoup should fail with bogus soupName");
                self.finalizeTest();
            });
    };


    /**
     * TEST registerSoup with no indices
     */
    SmartStoreTestSuite.prototype.testRegisterSoupNoIndices = function()  {
        console.log("In SFSmartStoreTestSuite.testRegisterSoupNoIndices");

        var soupName = "soupForRegisterNoIndices";
        var self = this;

        // Start clean
        self.smartstoreClient.removeSoup(soupName)
            .then(function() {
                // Check soup does not exist
                return self.smartstoreClient.soupExists(soupName);
            })
            .then(function(exists) {
                QUnit.equals(exists, false, "soup should not already exist");
                // Create soup
                return self.smartstoreClient.registerSoup(soupName, []);
            })
            .catch(function() {
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
            .then(function(entries1) {
                QUnit.equal(entries1.length, 7);

                //upsert another batch
                return self.addGeneratedEntriesToTestSoup(12);
            })
            .then(function(entries2) {
                QUnit.equal(entries2.length, 12);
                //modify the initial entries
                for (var i = 0; i < entries2.length; i++) {
                    var e = entries2[i];
                    e.updatedField = "Mister Toast " + i;
                }

                //update the entries
                return self.addEntriesToTestSoup(entries2);
            })
            .then(function(entries3) {
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
            .then(function(entries1) {
                QUnit.equal(entries1.length, 11);

                // Now upsert an overlapping batch, using an external ID path.
                var entries2 = self.createGeneratedEntries(16);
                for (var i = 0; i < entries2.length; i++) {
                    var entry = entries2[i];
                    entry.updatedField = "Mister Toast " + i;
                }
                var externalIdPath = self.defaultSoupIndexes[0].path;
                return self.smartstoreClient.upsertSoupEntriesWithExternalId(self.defaultSoupName, entries2, externalIdPath);
            })
            .then(function(entries3) {
                QUnit.equal(entries3.length, 16);

                // Now, query the soup for all entries, and make sure that we have only 16.
                var querySpec = self.smartstore.buildAllQuerySpec("Name", null, 25);
                return self.smartstoreClient.querySoup(self.defaultSoupName, querySpec);
            })
            .then(function(cursor) {
                QUnit.equal(cursor.totalEntries, 16, "Are totalEntries correct?");
                QUnit.equal(cursor.totalPages, 1, "Are totalPages correct?");
                var orderedEntries = cursor.currentPageOrderedEntries;
                var nEntries = orderedEntries.length;
                QUnit.equal(nEntries, 16, "Are there 16 entries in total?");
                QUnit.equal(orderedEntries[0]._soupEntryId, 1, "Is the first soup entry ID correct?");
                QUnit.equal(orderedEntries[0].updatedField, "Mister Toast 0", "Is the first updated field correct?");
                QUnit.equal(orderedEntries[15]._soupEntryId, 16, "Is the last soup entry ID correct?");
                QUnit.equal(orderedEntries[15].updatedField, "Mister Toast 15", "Is the last updated field correct?");

                return self.smartstoreClient.closeCursor(cursor);
            })
            .then(function(param) {
                QUnit.ok(true,"closeCursor ok");
                self.finalizeTest();
            });
    };


    /**
     * TEST upsertSoupEntries to non existent soup
     */
    SmartStoreTestSuite.prototype.testUpsertToNonexistentSoup = function()  {
        console.log("In SFSmartStoreTestSuite.testUpsertToNonexistentSoup");

        var self = this;
        var entries = [{a:1},{a:2},{a:3}];

        self.smartstoreClient.upsertSoupEntries("nonexistentSoup", entries)
            .catch(function() {
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
            .then(function(entries) {
                QUnit.equal(entries.length, 3,"check stuffTestSoup result");
                soupEntry0Id = entries[0]._soupEntryId;
                soupEntry2Id = entries[2]._soupEntryId;

                return self.smartstoreClient.retrieveSoupEntries(self.defaultSoupName, [soupEntry2Id, soupEntry0Id]);
            })
            .then(function(retrievedEntries) {
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
     * TEST removeFromSoup by ids
     */
    SmartStoreTestSuite.prototype.testRemoveFromSoup = function()  {
        console.log("In SFSmartStoreTestSuite.testRemoveFromSoup");

        var self = this;
        self.stuffTestSoup()
            .then(function(entries) {
                var soupEntryIds = [];
                QUnit.equal(entries.length, 3);

                for (var i = entries.length - 1; i >= 0; i--) {
                    var entry = entries[i];
                    soupEntryIds.push(entry._soupEntryId);
                }

                return self.smartstoreClient.removeFromSoup(self.defaultSoupName, soupEntryIds);
            })
            .then(function(status) {
                QUnit.equal(status, "OK", "removeFromSoup OK");

                var querySpec = self.smartstore.buildAllQuerySpec("Name");
                return self.smartstoreClient.querySoup(self.defaultSoupName, querySpec);
            })
            .then(function(cursor) {
                var nEntries = cursor.currentPageOrderedEntries.length;
                QUnit.equal(nEntries, 0, "currentPageOrderedEntries correct");
                return self.smartstoreClient.closeCursor(cursor);
            })
            .then(function(param) {
                QUnit.ok(true,"closeCursor ok");
                self.finalizeTest();
            });
    };

    /**
     * TEST removeFromSoup by query
     */
    SmartStoreTestSuite.prototype.testRemoveFromSoupByQuery = function()  {
        console.log("In SFSmartStoreTestSuite.testRemoveFromSoupByQuery");

        var self = this;
        self.stuffTestSoup()
            .then(function(entries) {
                QUnit.equal(entries.length, 3);
                var querySpecForRemove = self.smartstore.buildExactQuerySpec("Name", "Robot");
                return self.smartstoreClient.removeFromSoup(self.defaultSoupName, querySpecForRemove);
            })
            .then(function(status) {
                QUnit.equal(status, "OK", "removeFromSoup OK");
                var querySpec = self.smartstore.buildAllQuerySpec("Id", "ascending");
                return self.smartstoreClient.querySoup(self.defaultSoupName, querySpec);
            })
            .then(function(cursor) {
                QUnit.equal(cursor.currentPageOrderedEntries.length, 2, "check currentPageOrderedEntries");
                QUnit.equal(cursor.currentPageOrderedEntries[0].Name,"Todd Stellanova","verify first entry");
                QUnit.equal(cursor.currentPageOrderedEntries[1].Name,"Pro Bono Bonobo","verify second entry");
                return self.smartstoreClient.closeCursor(cursor);
            })
            .then(function(param) {
                QUnit.ok(true,"closeCursor ok");
                var querySpecForRemove = self.smartstore.buildLikeQuerySpec("Name", "%Stella%");
                return self.smartstoreClient.removeFromSoup(self.defaultSoupName, querySpecForRemove);
            })
            .then(function(status) {
                QUnit.equal(status, "OK", "removeFromSoup OK");
                var querySpec = self.smartstore.buildAllQuerySpec("Id", "ascending");
                return self.smartstoreClient.querySoup(self.defaultSoupName, querySpec);
            })
            .then(function(cursor) {
                QUnit.equal(cursor.currentPageOrderedEntries.length, 1, "check currentPageOrderedEntries");
                QUnit.equal(cursor.currentPageOrderedEntries[0].Name,"Pro Bono Bonobo","verify only entry");
                return self.smartstoreClient.closeCursor(cursor);
            })
            .then(function(param) {
                QUnit.ok(true,"closeCursor ok");
                var querySpecForRemove = self.smartstore.buildAllQuerySpec("Name");
                return self.smartstoreClient.removeFromSoup(self.defaultSoupName, querySpecForRemove);
            })
            .then(function(status) {
                QUnit.equal(status, "OK", "removeFromSoup OK");
                var querySpec = self.smartstore.buildAllQuerySpec("Id");
                return self.smartstoreClient.querySoup(self.defaultSoupName, querySpec);
            })
            .then(function(cursor) {
                QUnit.equal(cursor.currentPageOrderedEntries.length, 0, "check currentPageOrderedEntries");
                return self.smartstoreClient.closeCursor(cursor);
            })
            .then(function(param) {
                QUnit.ok(true,"closeCursor ok");
                self.finalizeTest();
            });
    };

    /**
     * TEST querySoup with exact query
     */
    SmartStoreTestSuite.prototype.testQuerySoupWithExactQuery = function()  {
        console.log("In SFSmartStoreTestSuite.testQuerySoupWithExactQuery");

        var self = this;
        self.stuffTestSoup()
            .then(function(entries) {
                QUnit.equal(entries.length, 3);
                var querySpec = self.smartstore.buildExactQuerySpec("Name","Robot");
                return self.smartstoreClient.querySoup(self.defaultSoupName, querySpec);
            })
            .then(function(cursor) {
                QUnit.equal(cursor.totalEntries, 1, "totalEntries correct");
                QUnit.equal(cursor.totalPages, 1, "totalPages correct");
                var nEntries = cursor.currentPageOrderedEntries.length;
                QUnit.equal(nEntries, 1, "wrong number of results");
                QUnit.equal(cursor.currentPageOrderedEntries[0]["Name"], "Robot", "wrong name");
                return self.smartstoreClient.closeCursor(cursor);
            })
            .then(function(param) {
                // Now querying with select paths
                var querySpec = self.smartstore.buildExactQuerySpec("Name","Robot",null,null,null,["Name", "Id"]);
                return self.smartstoreClient.querySoup(self.defaultSoupName, querySpec);
            })
            .then(function(cursor) {
                QUnit.equal(cursor.totalEntries, 1, "totalEntries correct");
                QUnit.equal(cursor.totalPages, 1, "totalPages correct");
                var nEntries = cursor.currentPageOrderedEntries.length;
                QUnit.equal(nEntries, 1, "wrong number of results");
                QUnit.equal(cursor.currentPageOrderedEntries[0][0], "Robot", "wrong name");
                QUnit.equal(cursor.currentPageOrderedEntries[0][1], "00300C", "wrong id");
                return self.smartstoreClient.closeCursor(cursor);
            })
            .then(function(param) {
                QUnit.ok(true,"closeCursor ok");
                self.finalizeTest();
            });
    };


    /**
     * TEST querySoup with all query with descending sort order
     */
    SmartStoreTestSuite.prototype.testQuerySoupWithAllQueryDescending = function()  {
        console.log("In SFSmartStoreTestSuite.testQuerySoupWithAllQueryDescending");

        var self = this;
        self.stuffTestSoup().
            then(function(entries) {
                QUnit.equal(entries.length, 3);

                var querySpec = self.smartstore.buildAllQuerySpec("Name", "descending");
                return self.smartstoreClient.querySoup(self.defaultSoupName, querySpec);
            })
            .then(function(cursor) {
                QUnit.equal(cursor.totalEntries, 3, "totalEntries correct");
                QUnit.equal(cursor.totalPages, 1, "totalPages correct");
                QUnit.equal(cursor.currentPageOrderedEntries.length, 3, "check currentPageOrderedEntries");
                QUnit.equal(cursor.currentPageOrderedEntries[0].Name,"Todd Stellanova","verify first entry");
                QUnit.equal(cursor.currentPageOrderedEntries[1].Name,"Robot","verify second entry");
                QUnit.equal(cursor.currentPageOrderedEntries[2].Name,"Pro Bono Bonobo","verify third entry");
                return self.smartstoreClient.closeCursor(cursor);
            })
            .then(function(param) {
                // Now querying with select paths
                var querySpec = self.smartstore.buildAllQuerySpec("Name", "descending", null, ["Name", "Id"]);
                return self.smartstoreClient.querySoup(self.defaultSoupName, querySpec);
            })
            .then(function(cursor) {
                QUnit.equal(cursor.totalEntries, 3, "totalEntries correct");
                QUnit.equal(cursor.totalPages, 1, "totalPages correct");
                QUnit.equal(cursor.currentPageOrderedEntries.length, 3, "check currentPageOrderedEntries");
                QUnit.equal(cursor.currentPageOrderedEntries[0][0],"Todd Stellanova","verify first entry");
                QUnit.equal(cursor.currentPageOrderedEntries[1][0],"Robot","verify second entry");
                QUnit.equal(cursor.currentPageOrderedEntries[2][0],"Pro Bono Bonobo","verify third entry");
                QUnit.equal(cursor.currentPageOrderedEntries[0][1],"00300A","verify first entry");
                QUnit.equal(cursor.currentPageOrderedEntries[1][1],"00300C","verify second entry");
                QUnit.equal(cursor.currentPageOrderedEntries[2][1],"00300B","verify third entry");

                return self.smartstoreClient.closeCursor(cursor);
            })
            .then(function(param) {
                QUnit.ok(true,"closeCursor ok");
                self.finalizeTest();
            });
    };

    /**
     * TEST querySoup with range query using order path
     */
    SmartStoreTestSuite.prototype.testQuerySoupWithRangeQueryWithOrderPath = function()  {
        console.log("In SFSmartStoreTestSuite.testQuerySoupWithRangeQueryWithOrderPath");

        var self = this;
        self.stuffTestSoup().
            then(function(entries) {
                QUnit.equal(entries.length, 3);
                var querySpec = self.smartstore.buildRangeQuerySpec("Id", null, "00300B", "ascending", 3, "Name");
                // should match 00300A and 00300B but sort by name
                return self.smartstoreClient.querySoup(self.defaultSoupName, querySpec);
            })
            .then(function(cursor) {
                QUnit.equal(cursor.totalEntries, 2, "totalEntries correct");
                QUnit.equal(cursor.totalPages, 1, "totalPages correct");
                QUnit.equal(cursor.currentPageOrderedEntries.length, 2, "check currentPageOrderedEntries");
                QUnit.equal(cursor.currentPageOrderedEntries[0].Name,"Pro Bono Bonobo","verify first entry");
                QUnit.equal(cursor.currentPageOrderedEntries[0].Id,"00300B","verify first entry");
                QUnit.equal(cursor.currentPageOrderedEntries[1].Name,"Todd Stellanova","verify last entry");
                QUnit.equal(cursor.currentPageOrderedEntries[1].Id,"00300A","verify last entry");

                return self.smartstoreClient.closeCursor(cursor);
            })
            .then(function(param) {
                // Now querying with select paths
                var querySpec = self.smartstore.buildRangeQuerySpec("Id", null, "00300B", "ascending", 3, "Name", ["Name", "Id"]);
                return self.smartstoreClient.querySoup(self.defaultSoupName, querySpec);
            })
            .then(function(cursor) {
                QUnit.equal(cursor.totalEntries, 2, "totalEntries correct");
                QUnit.equal(cursor.totalPages, 1, "totalPages correct");
                QUnit.equal(cursor.currentPageOrderedEntries.length, 2, "check currentPageOrderedEntries");
                QUnit.equal(cursor.currentPageOrderedEntries[0][0],"Pro Bono Bonobo","verify first entry");
                QUnit.equal(cursor.currentPageOrderedEntries[1][0],"Todd Stellanova","verify second entry");
                QUnit.equal(cursor.currentPageOrderedEntries[0][1],"00300B","verify first entry");
                QUnit.equal(cursor.currentPageOrderedEntries[1][1],"00300A","verify second entry");

                return self.smartstoreClient.closeCursor(cursor);
            })
            .then(function(param) {
                QUnit.ok(true,"closeCursor ok");
                self.finalizeTest();
            });
    };

    /**
     * TEST querySoup with bad query spec
     */
    SmartStoreTestSuite.prototype.testQuerySoupBadQuerySpec = function()  {
        console.log("In SFSmartStoreTestSuite.testQuerySoupBadQuerySpec");

        var self = this;
        self.stuffTestSoup()
            .then(function(entries) {
                QUnit.equal(entries.length, 3);

                //query on a nonexistent index
                var querySpec = self.smartstore.buildRangeQuerySpec("bottlesOfBeer",99,null,"descending");

                return self.smartstoreClient.querySoup(self.defaultSoupName, querySpec);
            })
            .catch(function(param) {
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
            .then(function(entries) {
                QUnit.equal(entries.length, 3);
                //keep in sync with stuffTestSoup
                var querySpec = self.smartstore.buildRangeQuerySpec("Name",null,"Robot");

                return self.smartstoreClient.querySoup(self.defaultSoupName, querySpec);
            })
            .then(function(cursor) {
                var nEntries = cursor.currentPageOrderedEntries.length;
                QUnit.equal(nEntries, 2, "nEntries matches endKey");
                QUnit.equal(cursor.currentPageOrderedEntries[1].Name,"Robot","verify last entry");
                return self.smartstoreClient.closeCursor(cursor);
            })
            .then(function(param) {
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
            .then(function(entries) {
                QUnit.equal(entries.length, 3);
                //keep in sync with stuffTestSoup
                var querySpec = self.smartstore.buildRangeQuerySpec("Name","Robot",null);

                return self.smartstoreClient.querySoup(self.defaultSoupName, querySpec);
            })
            .then(function(cursor) {
                var nEntries = cursor.currentPageOrderedEntries.length;
                QUnit.equal(nEntries, 2, "nEntries matches beginKey");
                QUnit.equal(cursor.currentPageOrderedEntries[0].Name,"Robot","verify first entry");
                return self.smartstoreClient.closeCursor(cursor);
            })
            .then(function(param) {
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
            .then(function(entries) {
                QUnit.equal(entries.length, NUM_ENTRIES);
                var querySpec = self.smartstore.buildAllQuerySpec("Name",null,PAGE_SIZE);
                return self.smartstoreClient.querySoup(self.defaultSoupName, querySpec);
            })
            .then(function(cursor) {
                checkPage(cursor, 0);
                return self.smartstoreClient.moveCursorToNextPage(cursor);
            })
            .then(function(cursor) {
                checkPage(cursor, 1);
                return self.smartstoreClient.moveCursorToNextPage(cursor);
            })
            .then(function(cursor) {
                checkPage(cursor, 2);
                return self.smartstoreClient.moveCursorToPreviousPage(cursor);
            })
            .then(function(cursor) {
                checkPage(cursor, 1);
                return self.smartstoreClient.moveCursorToNextPage(cursor);
            })
            .then(function(cursor) {
                checkPage(cursor, 2);
                return self.smartstoreClient.closeCursor(cursor);
            })
            .then(function(param) {
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
        var cursor;

        self.addGeneratedEntriesToTestSoup(NUM_ENTRIES)
            .then(function(entries) {
                QUnit.equal(entries.length, NUM_ENTRIES);
                var querySpec = self.smartstore.buildAllQuerySpec("Name",null,PAGE_SIZE);
                return self.smartstoreClient.querySoup(self.defaultSoupName, querySpec);
            })
            .then(function(c) {
                cursor = c;
                QUnit.equal(cursor.currentPageIndex, 0, "currentPageIndex correct");
                return self.smartstoreClient.moveCursorToPreviousPage(cursor);
            })
            .catch(function(error) {
                QUnit.ok(error.message.indexOf("moveCursorToPreviousPage") == 0, "error should be about moveCursorToPreviousPage")
                return self.smartstoreClient.closeCursor(cursor);
            })
            .then(function(param) {
                QUnit.ok(true,"closeCursor ok");
                self.finalizeTest();
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
        var cursor;

        self.addGeneratedEntriesToTestSoup(NUM_ENTRIES)
            .then(function(entries) {
                QUnit.equal(entries.length, NUM_ENTRIES);
                var querySpec = self.smartstore.buildAllQuerySpec("Name",null,PAGE_SIZE);
                return self.smartstoreClient.querySoup(self.defaultSoupName, querySpec);
            })
            .then(function(cursor) {
                QUnit.equal(cursor.currentPageIndex, 0, "currentPageIndex correct");
                return self.smartstoreClient.moveCursorToNextPage(cursor);
            })
            .then(function(c) {
                cursor = c;
                QUnit.equal(cursor.currentPageIndex, 1, "currentPageIndex correct");
                return self.smartstoreClient.moveCursorToNextPage(cursor);
            })
            .catch(function(error) {
                QUnit.ok(error.message.indexOf("moveCursorToNextPage") == 0, "error should be about moveCursorToNextPage");
                return self.smartstoreClient.closeCursor(cursor);
            })
            .then(function(param) {
                 QUnit.ok(true,"closeCursor ok");
                 self.finalizeTest();
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
            then(function() {
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
        var matchKey = "matchKeyValue";
        var beginKey = "beginKeyValue";
        var endKey = "endKeyValue";
        var order = "descending";
        var pageSize = 17;
        var orderPath = "orderPathValue";
        var selectPaths = ["x","y"];

        // Exact query with all args
        var query =  self.smartstore.buildExactQuerySpec(path,matchKey,pageSize,order,orderPath,selectPaths);
        QUnit.equal(query.queryType,"exact","check queryType");
        QUnit.equal(query.indexPath,path,"check indexPath");
        QUnit.equal(query.matchKey,matchKey,"check matchKey");
        QUnit.equal(query.order,order, "check order");
        QUnit.equal(query.pageSize,pageSize,"check pageSize");
        QUnit.equal(query.orderPath,orderPath,"check orderPath");
        QUnit.equal(JSON.stringify(query.selectPaths),JSON.stringify(selectPaths),"check selectPaths");

        // Exact query with min args
        query = self.smartstore.buildExactQuerySpec(path,matchKey);
        QUnit.equal(query.queryType,"exact","check queryType");
        QUnit.equal(query.indexPath,path,"check indexPath");
        QUnit.equal(query.matchKey,matchKey,"check matchKey");
        QUnit.equal(query.pageSize,10,"check pageSize");
        QUnit.equal(query.order,"ascending", "check order");
        QUnit.equal(query.orderPath,path,"check orderPath");
        QUnit.ok(query.selectPaths == null,"check selectPaths");

        // Range query with all args
        query = self.smartstore.buildRangeQuerySpec(path,beginKey,endKey,order,pageSize,orderPath,selectPaths);
        QUnit.equal(query.queryType,"range","check queryType");
        QUnit.equal(query.indexPath,path,"check indexPath");
        QUnit.equal(query.beginKey,beginKey,"check beginKey");
        QUnit.equal(query.endKey,endKey,"check endKey");
        QUnit.equal(query.order,order,"check order");
        QUnit.equal(query.pageSize,pageSize,"check pageSize");
        QUnit.equal(query.orderPath,orderPath,"check orderPath");
        QUnit.equal(JSON.stringify(query.selectPaths),JSON.stringify(selectPaths),"check selectPaths");

        // Range query with min args
        query = self.smartstore.buildRangeQuerySpec(path,beginKey);
        QUnit.equal(query.queryType,"range","check queryType");
        QUnit.equal(query.indexPath,path,"check indexPath");
        QUnit.equal(query.beginKey,beginKey,"check beginKey");
        QUnit.ok(query.endKey == null,"check endKey");
        QUnit.equal(query.order,"ascending", "check order");
        QUnit.equal(query.pageSize,10,"check pageSize");
        QUnit.equal(query.orderPath,path,"check orderPath");
        QUnit.ok(query.selectPaths == null,"check selectPaths");

        // Like query with all args
        query = self.smartstore.buildLikeQuerySpec(path,beginKey,order,pageSize,orderPath,selectPaths);
        QUnit.equal(query.queryType,"like","check queryType");
        QUnit.equal(query.indexPath,path,"check indexPath");
        QUnit.equal(query.likeKey,beginKey,"check likeKey");
        QUnit.equal(query.order,order,"check order");
        QUnit.equal(query.pageSize,pageSize,"check pageSize");
        QUnit.equal(query.orderPath,orderPath,"check orderPath");
        QUnit.equal(JSON.stringify(query.selectPaths),JSON.stringify(selectPaths),"check selectPaths");

        // Like query with min args
        query = self.smartstore.buildLikeQuerySpec(path,beginKey);
        QUnit.equal(query.queryType,"like","check queryType");
        QUnit.equal(query.indexPath,path,"check indexPath");
        QUnit.equal(query.likeKey,beginKey,"check likeKey");
        QUnit.equal(query.order,"ascending", "check order");
        QUnit.equal(query.pageSize,10,"check pageSize");
        QUnit.equal(query.orderPath,path,"check orderPath");
        QUnit.ok(query.selectPaths == null,"check selectPaths");

        // All query with all args
        query = self.smartstore.buildAllQuerySpec(path,order,pageSize,selectPaths);
        QUnit.equal(query.queryType,"range","check queryType");
        QUnit.equal(query.indexPath,path,"check indexPath");
        QUnit.equal(query.orderPath,path,"check orderPath");
        QUnit.equal(query.order,order,"check order");
        QUnit.equal(query.pageSize,pageSize,"check pageSize");
        QUnit.equal(query.orderPath,path,"check orderPath");
        QUnit.equal(JSON.stringify(query.selectPaths),JSON.stringify(selectPaths),"check selectPaths");

        // All query with min args
        query = self.smartstore.buildAllQuerySpec(path);
        QUnit.equal(query.queryType,"range","check queryType");
        QUnit.equal(query.indexPath,path,"check indexPath");
        QUnit.equal(query.orderPath,path,"check orderPath");
        QUnit.equal(query.order,"ascending", "check order");
        QUnit.equal(query.pageSize,10,"check pageSize");
        QUnit.equal(query.orderPath,path,"check orderPath");
        QUnit.ok(query.selectPaths == null,"check selectPaths");

        // Match query with all args
        query = self.smartstore.buildMatchQuerySpec(path, matchKey, order, pageSize, orderPath, selectPaths);
        QUnit.equal(query.queryType,"match","check queryType");
        QUnit.equal(query.indexPath,path,"check indexPath");
        QUnit.equal(query.matchKey,matchKey,"check matchKey");
        QUnit.equal(query.order,order,"check order");
        QUnit.equal(query.pageSize,pageSize,"check pageSize");
        QUnit.equal(query.orderPath,orderPath,"check orderPath");
        QUnit.equal(JSON.stringify(query.selectPaths),JSON.stringify(selectPaths),"check selectPaths");

        // Match query with min args
        query = self.smartstore.buildMatchQuerySpec(path, matchKey);
        QUnit.equal(query.queryType,"match","check queryType");
        QUnit.equal(query.indexPath,path,"check indexPath");
        QUnit.equal(query.matchKey,matchKey,"check matchKey");
        QUnit.equal(query.order,"ascending", "check order");
        QUnit.equal(query.pageSize,10,"check pageSize");
        QUnit.equal(query.orderPath,path,"check orderPath");
        QUnit.ok(query.selectPaths == null,"check selectPaths");

        self.finalizeTest();
    };

    /**
     * TEST like query starts with
     */
    SmartStoreTestSuite.prototype.testLikeQuerySpecStartsWith  = function() {
        console.log("In SFSmartStoreTestSuite.testLikeQuerySpecStartsWith");
        var self = this;

        self.stuffTestSoup()
            .then(function(entries) {
                QUnit.equal(entries.length, 3,"check stuffTestSoup result");
                var querySpec = self.smartstore.buildLikeQuerySpec("Name","Todd%");
                return self.smartstoreClient.querySoup(self.defaultSoupName, querySpec);
            })
            .then(function(cursor) {
                var nEntries = cursor.currentPageOrderedEntries.length;
                QUnit.equal(nEntries, 1, "currentPageOrderedEntries correct");
                QUnit.equal(cursor.currentPageOrderedEntries[0].Name,"Todd Stellanova","verify entry");
                return self.smartstoreClient.closeCursor(cursor);
            })
            .then(function(param) {
                // Now querying with select paths
                var querySpec = self.smartstore.buildLikeQuerySpec("Name","Todd%", null, null, null, ["Name", "Id"]);
                return self.smartstoreClient.querySoup(self.defaultSoupName, querySpec);
            })
            .then(function(cursor) {
                QUnit.equal(cursor.totalEntries, 1, "totalEntries correct");
                QUnit.equal(cursor.totalPages, 1, "totalPages correct");
                QUnit.equal(cursor.currentPageOrderedEntries.length, 1, "check currentPageOrderedEntries");
                QUnit.equal(cursor.currentPageOrderedEntries[0][0],"Todd Stellanova","verify second entry");
                QUnit.equal(cursor.currentPageOrderedEntries[0][1],"00300A","verify second entry");

                return self.smartstoreClient.closeCursor(cursor);
            })
            .then(function(param) {
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
            .then(function(entries) {
                QUnit.equal(entries.length, 3,"check stuffTestSoup result");
                var querySpec = self.smartstore.buildLikeQuerySpec("Name","%Stellanova");
                return self.smartstoreClient.querySoup(self.defaultSoupName, querySpec);
            })
            .then(function(cursor) {
                var nEntries = cursor.currentPageOrderedEntries.length;
                QUnit.equal(nEntries, 1, "currentPageOrderedEntries correct");
                QUnit.equal(cursor.currentPageOrderedEntries[0].Name,"Todd Stellanova","verify entry");
                return self.smartstoreClient.closeCursor(cursor);
            })
            .then(function(param) {
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
            .then(function(entries) {
                QUnit.equal(entries.length, 3,"check stuffTestSoup result");
                var querySpec = self.smartstore.buildLikeQuerySpec("Name","%ono%");
                return self.smartstoreClient.querySoup(self.defaultSoupName, querySpec);
            })
            .then(function(cursor) {
                var nEntries = cursor.currentPageOrderedEntries.length;
                QUnit.equal(nEntries, 1, "currentPageOrderedEntries correct");
                QUnit.equal(cursor.currentPageOrderedEntries[0].Name,"Pro Bono Bonobo","verify entry");
                return self.smartstoreClient.closeCursor(cursor);
            })
            .then(function(param) {
                QUnit.ok(true,"closeCursor ok");
                self.finalizeTest();
            });
    };

    /**
     * TEST full-text search
     */
    SmartStoreTestSuite.prototype.testFullTextSearch  = function() {
        console.log("In SFSmartStoreTestSuite.testFullTextSearch");
        var self = this;
        var myEntry1 = { name: "elephant", description:"large mammals", colors:"grey"};
        var myEntry2 = { name: "cat", description:"small mammals", colors:"black tabby white"};
        var myEntry3 = { name: "dog", description:"medium mammals", colors:"grey black"};
        var myEntry4 = { name: "lizard", description:"small reptilian", colors:"black green white"};
        var rawEntries = [myEntry1, myEntry2, myEntry3, myEntry4];
        var soupName = "animals";

        self.removeAndRecreateSoup(soupName, [{path:"name", type:"string"},  {path:"description", type:"full_text"}, {path:"colors", type:"full_text"}])
            .then(function() {
                return self.smartstoreClient.upsertSoupEntries(soupName,rawEntries);
            })
            .then(function(entries) {
                // Searching across fields with one term
                var querySpec = self.smartstore.buildMatchQuerySpec(null, "grey", "ascending", 10, "name");
                return self.tryQuery(soupName, querySpec, ["dog", "elephant"]);
            })
            .then(function() {
                // Searching across fields with multiple terms
                var querySpec = self.smartstore.buildMatchQuerySpec(null, "small black", "descending", 10, "name");
                return self.tryQuery(soupName, querySpec, ["lizard", "cat"]);
            })
            .then(function() {
                // Searching across fields with one term starred
                var querySpec = self.smartstore.buildMatchQuerySpec(null, "gr*", "ascending", 10, "name");
                return self.tryQuery(soupName, querySpec, ["dog", "elephant", "lizard"]);
            })
            .then(function() {
                // Searching across fields with multiple terms one being negated
                var querySpec = self.smartstore.buildMatchQuerySpec(null, "black NOT tabby", "descending", 10, "name");
                return self.tryQuery(soupName, querySpec, ["lizard", "dog"]);
            })
            .then(function() {
                // Searching across fields with multiple terms (one starred, one negated)
                var querySpec = self.smartstore.buildMatchQuerySpec(null, "gr* NOT small", "ascending", 10, "name");
                return self.tryQuery(soupName, querySpec, ["dog", "elephant"]);
            })
            .then(function(entries) {
                // Searching one field with one term
                var querySpec = self.smartstore.buildMatchQuerySpec("colors", "grey");
                return self.tryQuery(soupName, querySpec, ["elephant", "dog"]);
            })
            .then(function() {
                // Searching one field with multiple terms
                var querySpec = self.smartstore.buildMatchQuerySpec("colors", "white black", "ascending", 10, "name");
                return self.tryQuery(soupName, querySpec, ["cat", "lizard"]);
            })
            .then(function() {
                // Searching one field with one term starred
                var querySpec = self.smartstore.buildMatchQuerySpec("colors", "gr*", "ascending", 10, "name");
                return self.tryQuery(soupName, querySpec, ["dog", "elephant", "lizard"]);
            })
            .then(function() {
                // Searching one field with multiple terms one being negated
                var querySpec = self.smartstore.buildMatchQuerySpec("colors", "black NOT tabby", "descending", 10, "name");
                return self.tryQuery(soupName, querySpec, ["lizard", "dog"]);
            })
            .then(function() {
                // Searching one with multiple terms (one starred, one negated)
                var querySpec = self.smartstore.buildMatchQuerySpec("description", "m* NOT small", "ascending", 10, "name");
                return self.tryQuery(soupName, querySpec, ["dog", "elephant"]);
            })
            .then(function(param) {
                QUnit.ok(true,"closeCursor ok");
                self.finalizeTest();
            });
    };

    SmartStoreTestSuite.prototype.tryQuery = function(soupName, querySpec, expectedNames) {
        var self = this;
        return self.smartstoreClient.querySoup(soupName, querySpec)
            .then(function(cursor) {
                var results = cursor.currentPageOrderedEntries;
                QUnit.equal(results.length, expectedNames.length, "check currentPageOrderedEntries when trying match '" + querySpec.matchKey + "'");
                for (var i=0; i<results.length; i++) {
                    QUnit.equal(results[i].name,expectedNames[i],"verify that entry " + i + " is " + expectedNames[i] + " when trying match '" + querySpec.matchKey + "'");
                }
                return self.smartstoreClient.closeCursor(cursor);
            })
            .then(function(param) {
                // Now running query with select paths
                var querySpecWithSelectPaths= JSON.parse(JSON.stringify(querySpec));
                querySpecWithSelectPaths.selectPaths = ["name", "name"];
                return self.smartstoreClient.querySoup(soupName, querySpecWithSelectPaths);
            })
            .then(function(cursor) {
                var results = cursor.currentPageOrderedEntries;
                QUnit.equal(results.length, expectedNames.length, "check currentPageOrderedEntries when trying match '" + querySpec.matchKey + "' with select paths param");
                for (var i=0; i<results.length; i++) {
                    QUnit.equal(results[i][0],expectedNames[i],"verify that entry " + i + " is " + expectedNames[i] + " when trying match '" + querySpec.matchKey + "' with select paths param");
                    QUnit.equal(results[i][1],expectedNames[i],"verify that entry " + i + " is " + expectedNames[i] + " when trying match '" + querySpec.matchKey + "' with select paths param");
                }
                return self.smartstoreClient.closeCursor(cursor);
            })
    };

    /**
     * TEST full-text search against array node
     */
    SmartStoreTestSuite.prototype.testFullTextSearchAgainstArrayNode  = function() {
        console.log("In SFSmartStoreTestSuite.testFullTextSearchAgainstArrayNode");
        var self = this;
        var myEntry1 = { name: "elephant", attributes:[{color: "grey"}] };
        var myEntry2 = { name: "cat", attributes:[{color: "black"}, {color: "tabby"}, {color: "white"}] };
        var myEntry3 = { name: "dog", attributes:[{color: "black"}, {color: "grey"}] };
        var myEntry4 = { name: "lizard", attributes:[{color: "black"}, {color: "green"}, {color: "white"}] };
        var rawEntries = [myEntry1, myEntry2, myEntry3, myEntry4];
        var soupName = "fullTextSearchAgainstArrayNodeSoup";

        self.removeAndRecreateSoup(soupName, [{path:"name", type:"string"},  {path:"attributes.color", type:"full_text"}])
            .then(function() {
                return self.smartstoreClient.upsertSoupEntries(soupName,rawEntries);
            })
            .then(function(entries) {
                var querySpec = self.smartstore.buildMatchQuerySpec("attributes.color", "grey", "descending", 10, "name");
                return self.tryQuery(soupName, querySpec, ["elephant", "dog"]);
            })
            .then(function() {
                var querySpec = self.smartstore.buildMatchQuerySpec("attributes.color", "white black", "ascending", 10, "name");
                return self.tryQuery(soupName, querySpec, ["cat", "lizard"]);
            })
            .then(function() {
                var querySpec = self.smartstore.buildMatchQuerySpec("attributes.color", "gr*", "ascending", 10, "name");
                return self.tryQuery(soupName, querySpec, ["dog", "elephant", "lizard"]);
            })
            .then(function() {
                var querySpec = self.smartstore.buildMatchQuerySpec("attributes.color", "black NOT tabby", "descending", 10, "name");
                return self.tryQuery(soupName, querySpec, ["lizard", "dog"]);
            })
            .then(function(param) {
                QUnit.ok(true,"closeCursor ok");
                self.finalizeTest();
            });
    };

    /**
     * TEST like query against array node
     */
    SmartStoreTestSuite.prototype.testLikeQueryAgainstArrayNode  = function() {
        console.log("In SFSmartStoreTestSuite.testLikeQueryAgainstArrayNode");
        var self = this;
        var myEntry1 = { name: "elephant", attributes:[{color: "grey"}] };
        var myEntry2 = { name: "cat", attributes:[{color: "black"}, {color: "tabby"}, {color: "white"}] };
        var myEntry3 = { name: "dog", attributes:[{color: "black"}, {color: "grey"}] };
        var myEntry4 = { name: "lizard", attributes:[{color: "black"}, {color: "green"}, {color: "white"}] };
        var rawEntries = [myEntry1, myEntry2, myEntry3, myEntry4];
        var soupName = "likeQueryAgainstArrayNodeSoup";

        self.removeAndRecreateSoup(soupName, [{path:"name", type:"string"},  {path:"attributes.color", type:"string"}])
            .then(function() {
                return self.smartstoreClient.upsertSoupEntries(soupName,rawEntries);
            })
            .then(function(entries) {
                var querySpec = self.smartstore.buildLikeQuerySpec("attributes.color", "%grey%", "descending", 10, "name");
                return self.tryQuery(soupName, querySpec, ["elephant", "dog"]);
            })
            .then(function() {
                var querySpec = self.smartstore.buildLikeQuerySpec("attributes.color", "%gr%", "ascending", 10, "name");
                return self.tryQuery(soupName, querySpec, ["dog", "elephant", "lizard"]);
            })
            .then(function(param) {
                QUnit.ok(true,"closeCursor ok");
                self.finalizeTest();
            });
    };

    /**
     * TEST exact query against array node
     */
    SmartStoreTestSuite.prototype.testExactQueryAgainstArrayNode  = function() {
        console.log("In SFSmartStoreTestSuite.testExactQueryAgainstArrayNode");
        var self = this;
        var myEntry1 = { name: "elephant", attributes:[{color: "grey"}] };
        var myEntry2 = { name: "cat", attributes:[{color: "black"}, {color: "tabby"}, {color: "white"}] };
        var myEntry3 = { name: "dog", attributes:[{color: "black"}, {color: "grey"}] };
        var myEntry4 = { name: "lizard", attributes:[{color: "black"}, {color: "green"}, {color: "white"}] };
        var rawEntries = [myEntry1, myEntry2, myEntry3, myEntry4];
        var soupName = "exactQueryAgainstArrayNodeSoup";

        self.removeAndRecreateSoup(soupName, [{path:"name", type:"string"},  {path:"attributes.color", type:"string"}])
            .then(function() {
                return self.smartstoreClient.upsertSoupEntries(soupName,rawEntries);
            })
            .then(function(entries) {
                var querySpec = self.smartstore.buildExactQuerySpec("attributes.color", "[\"grey\"]");
                return self.tryQuery(soupName, querySpec, ["elephant"]);
            })
            .then(function(param) {
                QUnit.ok(true,"closeCursor ok");
                self.finalizeTest();
            });
    };

    /**
     * TEST smart query against array node
     */
    SmartStoreTestSuite.prototype.testSmartQueryAgainstArrayNode  = function() {
        console.log("In SFSmartStoreTestSuite.testSmartQueryAgainstArrayNode");
        var self = this;
        var myEntry1 = { name: "elephant", attributes:[{color: "grey"}] };
        var myEntry2 = { name: "cat", attributes:[{color: "black"}, {color: "tabby"}, {color: "white"}] };
        var myEntry3 = { name: "dog", attributes:[{color: "black"}, {color: "grey"}] };
        var myEntry4 = { name: "lizard", attributes:[{color: "black"}, {color: "green"}, {color: "white"}] };
        var rawEntries = [myEntry1, myEntry2, myEntry3, myEntry4];
        var soupName = "smartQueryAgainstArrayNodeSoup";

        self.removeAndRecreateSoup(soupName, [{path:"name", type:"string"},  {path:"attributes.color", type:"string"}])
            .then(function() {
                return self.smartstoreClient.upsertSoupEntries(soupName,rawEntries);
            })
            .then(function(entries) {
                var querySpec = self.smartstore.buildSmartQuerySpec("SELECT {" + soupName + ":_soup} FROM {" + soupName + "} where {" + soupName + ":attributes.color} LIKE '%grey%' ORDER BY LOWER({" + soupName + ":name})" , 5);
                return self.smartstoreClient.runSmartQuery(querySpec);
            })
            .then(function(cursor) {
                QUnit.equal(2, cursor.currentPageOrderedEntries.length, "check number of rows returned");
                QUnit.equal(1, cursor.currentPageOrderedEntries[0].length, "check number of fields returned");
                QUnit.equal("dog", cursor.currentPageOrderedEntries[0][0].name, "check first row");
                QUnit.equal("elephant", cursor.currentPageOrderedEntries[1][0].name, "check second row");
                return self.smartstoreClient.closeCursor(cursor);
            })
            .then(function(param) {
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
            .then(function() {
                return self.addGeneratedEntriesToSoup(soupName, 3);
            })
            .then(function(entries) {
                QUnit.equal(entries.length, 3,"check addGeneratedEntriesToSoup result");
                //pick out a compound path value and ensure that we can query for the same entry
                var selectedEntry = entries[1];
                selectedUrl = selectedEntry.attributes.url;
                var querySpec = self.smartstore.buildExactQuerySpec("attributes.url",selectedUrl);
                return self.smartstoreClient.querySoup(soupName, querySpec);
            })
            .then(function(cursor) {
                QUnit.equal(cursor.currentPageOrderedEntries.length, 1, "currentPageOrderedEntries correct");
                var foundEntry = cursor.currentPageOrderedEntries[0];
                QUnit.equal(foundEntry.attributes.url,selectedUrl,"Verify same entry");
                return self.smartstoreClient.closeCursor(cursor);
            })
            .then(function(param) {
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
        self.smartstoreClient.querySoup(self.defaultSoupName, querySpec)
            .catch(function(param) {
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
            .then(function() {
                return self.smartstoreClient.upsertSoupEntries(soupName,rawEntries);
            })
            .then(function(entries) {
                var querySpec = self.smartstore.buildRangeQuerySpec("shots", 10, 100,"ascending");
                return self.smartstoreClient.querySoup(soupName, querySpec);
            })
            .then(function(cursor) {
                QUnit.equal(cursor.currentPageOrderedEntries.length, 2, "check currentPageOrderedEntries");
                QUnit.equal(cursor.currentPageOrderedEntries[0].Name,"Todd Stellanova","verify first entry");
                QUnit.equal(cursor.currentPageOrderedEntries[1].Name,"Pro Bono Bonobo","verify last entry");
                return self.smartstoreClient.closeCursor(cursor);
            })
            .then(function(param) {
                QUnit.ok(true,"closeCursor ok");
                self.finalizeTest();
            });
    };

    /**
     * TEST smart query with count
     */
    SmartStoreTestSuite.prototype.testSmartQueryWithCount  = function() {
        console.log("In SFSmartStoreTestSuite.testSmartQueryWithCount");
        var self = this;

        self.stuffTestSoup()
            .then(function(entries) {
                QUnit.equal(entries.length, 3,"check stuffTestSoup result");
                var querySpec = self.smartstore.buildSmartQuerySpec("select count(*) from {" + self.defaultSoupName + "}", 1);
                return self.smartstoreClient.runSmartQuery(querySpec);
            })
            .then(function(cursor) {
                QUnit.equal(1, cursor.currentPageOrderedEntries.length, "check number of rows returned");
                QUnit.equal(1, cursor.currentPageOrderedEntries[0].length, "check number of fields returned");
                QUnit.equal("[[3]]", JSON.stringify(cursor.currentPageOrderedEntries), "check currentPageOrderedEntries");
                return self.smartstoreClient.closeCursor(cursor);
            })
            .then(function(param) {
                QUnit.ok(true,"closeCursor ok");
                self.finalizeTest();
            });
    };

    /**
     * TEST smart query with compare on integer field
     */
    SmartStoreTestSuite.prototype.testSmartQueryWithIntegerCompare  = function() {

        var self = this;
        var myEntry1 = { Name: "A", rank:1 };
        var myEntry2 = { Name: "B", rank:2 };
        var myEntry3 = { Name: "C", rank:3 };
        var myEntry4 = { Name: "D", rank:4 };
        var myEntry5 = { Name: "E", rank:5 };
        var rawEntries = [myEntry1, myEntry2, myEntry3, myEntry4, myEntry5];
        var soupName = "alphabetSoup";

        var pluckNames = function(cursor) {
            var names = "";
            for (var i=0; i<cursor.currentPageOrderedEntries.length; i++) {
                names += cursor.currentPageOrderedEntries[i][0].Name;
            }
            return names;
        };

        var buildQuerySpec = function(comparison) {
            var smartQuery = "select {alphabetSoup:_soup} from {alphabetSoup} where {alphabetSoup:rank} " + comparison + " order by lower({alphabetSoup:Name})";
            return self.smartstore.buildSmartQuerySpec(smartQuery, 5);
        };

        self.removeAndRecreateSoup(soupName, [{path:"Name", type:"string"}, {path:"rank", type:"integer"}])
            .then(function() {
                return self.smartstoreClient.upsertSoupEntries(soupName,rawEntries);
            })
            .then(function(entries) {
                return self.smartstoreClient.runSmartQuery(buildQuerySpec("!= 3"));
            })
            .then(function(cursor) {
                QUnit.equal(pluckNames(cursor), "ABDE");
                return self.smartstoreClient.closeCursor(cursor);
            })
            .then(function(param) {
                QUnit.ok(true,"closeCursor ok");
                return self.smartstoreClient.runSmartQuery(buildQuerySpec("= 3"));
            })
            .then(function(cursor) {
                QUnit.equal(pluckNames(cursor), "C");
                return self.smartstoreClient.closeCursor(cursor);
            })
            .then(function(param) {
                QUnit.ok(true,"closeCursor ok");
                return self.smartstoreClient.runSmartQuery(buildQuerySpec("< 3"));
            })
            .then(function(cursor) {
                QUnit.equal(pluckNames(cursor), "AB");
                return self.smartstoreClient.closeCursor(cursor);
            })
            .then(function(param) {
                QUnit.ok(true,"closeCursor ok");
                return self.smartstoreClient.runSmartQuery(buildQuerySpec("<= 3"));
            })
            .then(function(cursor) {
                QUnit.equal(pluckNames(cursor), "ABC");
                return self.smartstoreClient.closeCursor(cursor);
            })
            .then(function(param) {
                QUnit.ok(true,"closeCursor ok");
                return self.smartstoreClient.runSmartQuery(buildQuerySpec("> 3"));
            })
            .then(function(cursor) {
                QUnit.equal(pluckNames(cursor), "DE");
                return self.smartstoreClient.closeCursor(cursor);
            })
            .then(function(param) {
                QUnit.ok(true,"closeCursor ok");
                return self.smartstoreClient.runSmartQuery(buildQuerySpec(">= 3"));
            })
            .then(function(cursor) {
                QUnit.equal(pluckNames(cursor), "CDE");
                return self.smartstoreClient.closeCursor(cursor);
            })
            .then(function(param) {
                QUnit.ok(true,"closeCursor ok");
                self.finalizeTest();
            });
    };

    /**
     * TEST smartQuery with a WHERE x LIKE y clause.
     */
    SmartStoreTestSuite.prototype.testSmartQueryWithWhereLikeClause  = function() {
        console.log("In SFSmartStoreTestSuite.testSmartQueryWithCount");
        var self = this;
        var testEntries;

        self.stuffTestSoup()
            .then(function(entries) {
                testEntries = entries;
                QUnit.equal(entries.length, 3, "check stuffTestSoup result");
                var querySpec = self.smartstore.buildSmartQuerySpec("SELECT {" + self.defaultSoupName + ":_soup} FROM {" + self.defaultSoupName + "} WHERE {" + self.defaultSoupName + ":Name} LIKE '%bo%'", 10);
                return self.smartstoreClient.runSmartQuery(querySpec);
            })
            .then(function(cursor) {
                var rows = cursor.currentPageOrderedEntries;
                QUnit.equal(2, rows.length, "check number of rows returned");
                var actualNames = [rows[0][0].Name, rows[1][0].Name];
                actualNames.sort();

                // Should return 2nd and 3rd entries.
                QUnit.equal("Pro Bono Bonobo",  actualNames[0]);
                QUnit.equal("Robot",  actualNames[1]);
                return self.smartstoreClient.closeCursor(cursor);
            })
            .then(function(param) {
                QUnit.ok(true,"closeCursor ok");
                self.finalizeTest();
            });
    };

    /**
     * TEST smartQuery with a WHERE x LIKE y ORDER BY LOWER({z}) clause.
     */
    SmartStoreTestSuite.prototype.testSmartQueryWithWhereLikeClauseOrdered  = function() {
        console.log("In SFSmartStoreTestSuite.testSmartQueryWithCount");
        var self = this;
        var testEntries;

        self.stuffTestSoup()
            .then(function(entries) {
                testEntries = entries;
                QUnit.equal(entries.length, 3, "check stuffTestSoup result");
                var querySpec = self.smartstore.buildSmartQuerySpec("SELECT {" + self.defaultSoupName + ":_soup} FROM {" + self.defaultSoupName + "} WHERE {" + self.defaultSoupName + ":Name} LIKE '%o%' ORDER BY LOWER({" + self.defaultSoupName + ":Name})", 10);
                return self.smartstoreClient.runSmartQuery(querySpec);
            })
            .then(function(cursor) {
                var rows = cursor.currentPageOrderedEntries;
                QUnit.equal(3, rows.length, "check number of rows returned");
                var actualNames = [rows[0][0].Name, rows[1][0].Name, rows[2][0].Name];

                // Should return all entries sorted
                QUnit.equal("Pro Bono Bonobo",  actualNames[0]);
                QUnit.equal("Robot",  actualNames[1]);
                QUnit.equal("Todd Stellanova", actualNames[2]);
                return self.smartstoreClient.closeCursor(cursor);
            })
            .then(function(param) {
                QUnit.ok(true,"closeCursor ok");
                self.finalizeTest();
            });
    };

    /**
     * TEST smartQuery SELECT a FROM c WHERE d IN (values) type clause.
     */
    SmartStoreTestSuite.prototype.testSmartQueryWithSingleFieldAndWhereInClause  = function() {
        console.log("In SFSmartStoreTestSuite.testSmartQueryWithCount");
        var self = this;
        var testEntries;

        self.stuffTestSoup()
            .then(function(entries) {
                testEntries = entries;
                QUnit.equal(entries.length, 3, "check stuffTestSoup result");
                var querySpec = self.smartstore.buildSmartQuerySpec("SELECT {" + self.defaultSoupName + ":Name} FROM {" + self.defaultSoupName + "} WHERE {" + self.defaultSoupName + ":Id} IN ('00300A', '00300B')", 10);
                return self.smartstoreClient.runSmartQuery(querySpec);
            })
            .then(function(cursor) {
                QUnit.equal(2, cursor.currentPageOrderedEntries.length, "check number of rows returned");
                QUnit.equal(1, cursor.currentPageOrderedEntries[0].length, "check number of fields returned");

                // Should return 1st and 2nd entries.
                QUnit.equal(JSON.stringify([testEntries[0].Name]), JSON.stringify(cursor.currentPageOrderedEntries[0]), "check currentPageOrderedEntries[0]");
                QUnit.equal(JSON.stringify([testEntries[1].Name]), JSON.stringify(cursor.currentPageOrderedEntries[1]), "check currentPageOrderedEntries[1]");
                return self.smartstoreClient.closeCursor(cursor);
            })
            .then(function(param) {
                QUnit.ok(true,"closeCursor ok");
                self.finalizeTest();
            });
    };

    /**
     * TEST smartQuery SELECT a, b FROM c WHERE d IN (values) type clause.
     */
    SmartStoreTestSuite.prototype.testSmartQueryWithMultipleFieldsAndWhereInClause  = function() {
        console.log("In SFSmartStoreTestSuite.testSmartQueryWithCount");
        var self = this;
        var testEntries;

        self.stuffTestSoup()
            .then(function(entries) {
                testEntries = entries;
                QUnit.equal(entries.length, 3, "check stuffTestSoup result");
                var querySpec = self.smartstore.buildSmartQuerySpec("SELECT {" + self.defaultSoupName + ":Name}, {" + self.defaultSoupName + ":Id} FROM {" + self.defaultSoupName + "} WHERE {" + self.defaultSoupName + ":Id} IN ('00300A', '00300C')", 10);
                return self.smartstoreClient.runSmartQuery(querySpec);
            })
            .then(function(cursor) {
                QUnit.equal(2, cursor.currentPageOrderedEntries.length, "check number of rows returned");
                QUnit.equal(2, cursor.currentPageOrderedEntries[0].length, "check number of fields returned");

                // Should return 1st and 3rd entries.
                QUnit.equal(JSON.stringify([testEntries[0].Name, testEntries[0].Id]),
                            JSON.stringify(cursor.currentPageOrderedEntries[0]), "check currentPageOrderedEntries[0]");
                QUnit.equal(JSON.stringify([testEntries[2].Name, testEntries[2].Id]),
                            JSON.stringify(cursor.currentPageOrderedEntries[1]), "check currentPageOrderedEntries[1]");
                return self.smartstoreClient.closeCursor(cursor);
            })
            .then(function(param) {
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

        if (window.storeMap) {
            // Mock smartstore doesn't support such queries
            self.finalizeTest();
            return;
        }

        self.stuffTestSoup()
            .then(function(entries) {
                QUnit.equal(entries.length, 3,"check stuffTestSoup result");
                expectedEntry = entries[0];
                var sql = "select {" + self.defaultSoupName + ":_soup}, {" + self.defaultSoupName + ":_soupEntryId}, {" + self.defaultSoupName + ":_soupLastModifiedDate} from {" + self.defaultSoupName + "} where {" + self.defaultSoupName + ":Id} = '" + expectedEntry.Id + "'";
                var querySpec = self.smartstore.buildSmartQuerySpec(sql, 1);
                return self.smartstoreClient.runSmartQuery(querySpec);
            })
            .then(function(cursor) {
                QUnit.equal(1, cursor.currentPageOrderedEntries.length, "check number of rows returned");
                QUnit.equal(3, cursor.currentPageOrderedEntries[0].length, "check number of fields returned");
                QUnit.equal(cursor.currentPageOrderedEntries[0][0]._soupEntryId, expectedEntry._soupEntryId, "check _soup's soupEntryId returned");
                QUnit.equal(cursor.currentPageOrderedEntries[0][0].Id, expectedEntry.Id, "check _soup's Id returned");
                QUnit.equal(cursor.currentPageOrderedEntries[0][0].Name, expectedEntry.Name, "check _soup's Name returned");
                QUnit.equal(cursor.currentPageOrderedEntries[0][1], expectedEntry._soupEntryId, "check _soupEntryId returned");
                QUnit.equal(cursor.currentPageOrderedEntries[0][2], expectedEntry._soupLastModifiedDate, "check _soupLastModifieddate returned");
                return self.smartstoreClient.closeCursor(cursor);
            })
            .then(function(param) {
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
        self.smartstoreClient.removeSoup(soupName)
            .then(function() {
                // Create soup
                return self.smartstoreClient.registerSoup(soupName, self.defaultSoupIndexes);
            })
            .then(function(soupName2) {
                QUnit.equals(soupName2,soupName,"registered soup OK");
                // Checking soup indexes
                return self.checkSoupIndexes(soupName, self.defaultSoupIndexes);
            })
            .then(function() {
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
        self.smartstoreClient.soupExists(soupName)
            .then(function(exists) {
                QUnit.equals(exists, false, "soup should not already exist");
                return self.getSoupIndexSpecs(soupName);
            })
            .catch(function() {
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
     * TEST alterSoupWithSpecNoReIndexing
     */
    SmartStoreTestSuite.prototype.testAlterSoupWithSpecNoReIndexing  = function() {
        this.tryAlterSoupWithSpec(false);
    };

    /**
     * TEST alterSoupWithSpecWithReIndexing
     */
    SmartStoreTestSuite.prototype.testAlterSoupWithSpecWithReIndexing  = function() {
        this.tryAlterSoupWithSpec(true);
    };


    /**
     * Helper method for alterSoup tests
     */
    SmartStoreTestSuite.prototype.tryAlterSoup = function(reIndexData) {
        var self = this;
        var alteredIndexes = [{path:"Name", type:"string"}, {path:"attributes.type", type:"string"}];

        // Populate soup
        return self.stuffTestSoup()
            .then(function(entries) {
                QUnit.equal(entries.length, 3,"check stuffTestSoup result");
                // Alter soup
                return self.smartstoreClient.alterSoup(self.defaultSoupName, alteredIndexes, reIndexData);
            })
            .then(function() {
                // Checking altered soup indexes
                return self.checkSoupIndexes(self.defaultSoupName, alteredIndexes);
            })
            .then(function() {
                // Query by a new indexed field
                var querySpec = self.smartstore.buildExactQuerySpec("attributes.type", "Contact", 3);
                return self.smartstoreClient.querySoup(self.defaultSoupName, querySpec);
            })
            .then(function(cursor) {
                QUnit.equal(cursor.currentPageOrderedEntries.length, reIndexData ? 3 : 0, "check number of rows returned");
                return self.smartstoreClient.closeCursor(cursor);
            })
            .then(function() {
                // Query by a previously indexed field
                var querySpec = self.smartstore.buildExactQuerySpec("Name", "Robot", 3);
                return self.smartstoreClient.querySoup(self.defaultSoupName, querySpec);
            })
            .then(function(cursor) {
                QUnit.equal(cursor.currentPageOrderedEntries.length, 1, "check number of rows returned");
                return self.smartstoreClient.closeCursor(cursor);
            })
            .then(function(param) {
                QUnit.ok(true,"closeCursor ok");
                self.finalizeTest();
            });
    };

    /**
     * Helper method for alterSoupWithSpec tests
     * Alter the soup twice changing the storage type each time (internal -> external -> internal)
     */
    SmartStoreTestSuite.prototype.tryAlterSoupWithSpec = function(reIndexData) {
        var self = this;
        var alteredIndexes1 = [{path:"Name", type:"string"}, {path:"attributes.type", type:"string"}];
        var alteredSoupSpec1 = {name: self.defaultSoupName, features: ["externalStorage"]};
        var alteredIndexes2 = [{path:"Name", type:"string"}, {path:"department", type:"string"}];
        var alteredSoupSpec2 = {name: self.defaultSoupName, features: []};

        // Populate soup
        return self.stuffTestSoup()
            .then(function(entries) {
                QUnit.equal(entries.length, 3,"check stuffTestSoup result");
                // Alter soup internal -> external
                return self.smartstoreClient.alterSoupWithSpec(self.defaultSoupName, alteredSoupSpec1, alteredIndexes1, reIndexData);
            })
            .then(function() {
                // Checking altered soup indexes
                return self.checkSoupIndexes(self.defaultSoupName, alteredIndexes1);
            })
            .then(function() {
                // Checking altered soup spec
                return self.checkSoupSpec(self.defaultSoupName, alteredSoupSpec1);
            })
            .then(function() {
                // Query by a new indexed field
                var querySpec = self.smartstore.buildExactQuerySpec("attributes.type", "Contact", 3);
                return self.smartstoreClient.querySoup(self.defaultSoupName, querySpec);
            })
            .then(function(cursor) {
                QUnit.equal(cursor.currentPageOrderedEntries.length, reIndexData ? 3 : 0, "check number of rows returned");
                return self.smartstoreClient.closeCursor(cursor);
            })
            .then(function() {
                // Query by a previously indexed field
                var querySpec = self.smartstore.buildExactQuerySpec("Name", "Robot", 3);
                return self.smartstoreClient.querySoup(self.defaultSoupName, querySpec);
            })
            .then(function(cursor) {
                QUnit.equal(cursor.currentPageOrderedEntries.length, 1, "check number of rows returned");
                return self.smartstoreClient.closeCursor(cursor);
            })
            .then(function(param) {
                QUnit.ok(true,"closeCursor ok");
                // Alter soup external -> internal
                return self.smartstoreClient.alterSoupWithSpec(self.defaultSoupName, alteredSoupSpec2, alteredIndexes2, reIndexData);
            })
            .then(function() {
                // Checking altered soup indexes
                return self.checkSoupIndexes(self.defaultSoupName, alteredIndexes2);
            })
            .then(function() {
                // Checking altered soup spec
                return self.checkSoupSpec(self.defaultSoupName, alteredSoupSpec2);
            })
            .then(function() {
                // Query by a new indexed field
                var querySpec = self.smartstore.buildExactQuerySpec("department", "Engineering", 3);
                return self.smartstoreClient.querySoup(self.defaultSoupName, querySpec);
            })
            .then(function(cursor) {
                QUnit.equal(cursor.currentPageOrderedEntries.length, reIndexData ? 2 : 0, "check number of rows returned");
                return self.smartstoreClient.closeCursor(cursor);
            })
            .then(function() {
                // Query by a previously indexed field
                var querySpec = self.smartstore.buildExactQuerySpec("Name", "Robot", 3);
                return self.smartstoreClient.querySoup(self.defaultSoupName, querySpec);
            })
            .then(function(cursor) {
                QUnit.equal(cursor.currentPageOrderedEntries.length, 1, "check number of rows returned");
                return self.smartstoreClient.closeCursor(cursor);
            })
            .then(function(param) {
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
        self.smartstoreClient.soupExists(soupName)
            .then(function(exists) {
                QUnit.equals(exists, false, "soup should not already exist");
                return self.smartstoreClient.alterSoup(soupName, [{path:"key", type:"string"}], true);
            })
            .catch(function() {
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
            .then(function(entries) {
                QUnit.equal(entries.length, 3,"check stuffTestSoup result");
                // Alter soup
                return self.smartstoreClient.alterSoup(self.defaultSoupName, alteredIndexes, false);
            })
            .then(function() {
                // Checking altered soup indexes
                return self.checkSoupIndexes(self.defaultSoupName, alteredIndexes);
            })
            .then(function() {
                // Query by a new indexed field
                var querySpec = self.smartstore.buildExactQuerySpec("attributes.type", "Contact", 3);
                return self.smartstoreClient.querySoup(self.defaultSoupName, querySpec);
            })
            .then(function(cursor) {
                QUnit.equal(cursor.currentPageOrderedEntries.length, 0, "check number of rows returned");
                return self.smartstoreClient.closeCursor(cursor);
            })
            .then(function(cursor) {
                // Re-index soup
                return self.smartstoreClient.reIndexSoup(self.defaultSoupName, ["attributes.type"]);
            })
            .then(function() {
                // Query by a new indexed field
                var querySpec = self.smartstore.buildExactQuerySpec("attributes.type", "Contact", 3);
                return self.smartstoreClient.querySoup(self.defaultSoupName, querySpec);
            })
            .then(function(cursor) {
                QUnit.equal(cursor.currentPageOrderedEntries.length, 3, "check number of rows returned");
                return self.smartstoreClient.closeCursor(cursor);
            })
            .then(function() {
                // Query by a previously indexed field
                var querySpec = self.smartstore.buildExactQuerySpec("Name", "Robot", 3);
                return self.smartstoreClient.querySoup(self.defaultSoupName, querySpec);
            })
            .then(function(cursor) {
                QUnit.equal(cursor.currentPageOrderedEntries.length, 1, "check number of rows returned");
                return self.smartstoreClient.closeCursor(cursor);
            })
            .then(function(param) {
                QUnit.ok(true,"closeCursor ok");
                self.finalizeTest();
            });
    };


    /**
     * Helper method checkSoupIndexes
     */
    SmartStoreTestSuite.prototype.checkSoupIndexes = function(soupName, expectedIndexes) {
        return this.smartstoreClient.getSoupIndexSpecs(soupName)
            .then(function(soupIndexes) {
                QUnit.equals(soupIndexes.length, expectedIndexes.length, "Check number of soup indices");
                for (i = 0; i< expectedIndexes.length; i++) {
                    QUnit.equals(soupIndexes[i].path, expectedIndexes[i].path, "Check path");
                    QUnit.equals(soupIndexes[i].type, expectedIndexes[i].type, "Check type");
                }
            });
    };

    /**
     * Helper method checkSoupSpec
     */
    SmartStoreTestSuite.prototype.checkSoupSpec = function(soupName, expectedSoupSpec) {
        return this.smartstoreClient.getSoupSpec(soupName)
            .then(function(soupSpec) {
                QUnit.equals(soupSpec.name, expectedSoupSpec.name, "Check soup name in soup spec");
                QUnit.equals(soupSpec.features.length, expectedSoupSpec.features.length, "Check features in soup spec");
                for (i = 0; i< expectedSoupSpec.features.length; i++) {
                    QUnit.equals(soupSpec.features[i], expectedSoupSpec.features[i], "Check feature");
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
            .then(function(entries) {
                QUnit.equal(entries.length, 3);
                return self.smartstoreClient.clearSoup(self.defaultSoupName);
            })
            .then(function(status) {
                QUnit.equal(status, "OK", "clearSoup OK");

                var querySpec = self.smartstore.buildAllQuerySpec("Name");
                return self.smartstoreClient.querySoup(self.defaultSoupName, querySpec);
            })
            .then(function(cursor) {
                var nEntries = cursor.currentPageOrderedEntries.length;
                QUnit.equal(nEntries, 0, "currentPageOrderedEntries correct");
                return self.smartstoreClient.closeCursor(cursor);
            })
            .then(function(param) {
                QUnit.ok(true,"closeCursor ok");
                self.finalizeTest();
            });
    };

    /**
     * TEST testCreateMultipleUserStores Cross check soups
     */
    SmartStoreTestSuite.prototype.testCreateMultipleUserStores = function()  {
        console.log("In SFSmartStoreTestSuite.testCreateMultipleUserStores");

        var storeConfig1 = {'storeName':'USRDB1','isGlobalStore':false};
        var storeConfig2 = {'storeName':'USRDB2','isGlobalStore':false};

        var indexes = [{path:"Name", type:"string"},{path:"Id", type:"string"}];
        var storeConfig1_SoupName = storeConfig1.storeName + "_Soup";
        var storeConfig2_SoupName = storeConfig2.storeName + "_Soup";

        var self = this;

        return this.smartstoreClient
                         .removeAllStores()
                         .then(function() {
                           return Promise.all([self.smartstoreClient.registerSoup(storeConfig1,  storeConfig1_SoupName, indexes),
                                        self.smartstoreClient.registerSoup(storeConfig2, storeConfig2_SoupName, indexes)]);
                          })
                         .then(function() {
                           return Promise.all(
                                   [self.smartstoreClient.soupExists(storeConfig1, storeConfig1_SoupName),
                                   self.smartstoreClient.soupExists(storeConfig2, storeConfig2_SoupName)]);
                         })
                         .then(function(result) {
                            var exists1 = result[0], exists2 = result[1];
                            QUnit.equals(exists1, true, "soup should exist in user store1 " + storeConfig1_SoupName);
                            QUnit.equals(exists2, true, "soup should exist in user store2 " + storeConfig2_SoupName);
                          })
                          .then(function() {
                            return Promise.all(
                                    [self.smartstoreClient.soupExists(storeConfig1, storeConfig2_SoupName),
                                    self.smartstoreClient.soupExists(storeConfig2, storeConfig1_SoupName)]);
                          })
                          .then(function(result) {
                             var exists1 = result[0], exists2 = result[1];
                             QUnit.equals(exists1, false, "soup should not exist in user store1 " + storeConfig2_SoupName);
                             QUnit.equals(exists2, false, "soup should not exist in user store2 " + storeConfig1_SoupName);
                           })
                         .then(function () {
                           return Promise.all(
                                   [self.smartstoreClient.removeStore(storeConfig1),
                                   self.smartstoreClient.removeStore(storeConfig2)]);
                         })
                         .then(function () {
                             return self.smartstoreClient.getAllStores();
                         })
                         .then( function(stores) {
                            QUnit.equals(stores.length, 0, "All user stores removed");
                            self.finalizeTest();
                         });
    };


    /**
     * TEST testCreateMultipleUserStores Cross check soups
     */
    SmartStoreTestSuite.prototype.testCreateMultipleGlobalStores = function()  {
        console.log("In SFSmartStoreTestSuite.testCreateMultipleGlobalStores");
        console.log("In SFSmartStoreTestSuite.testCreateMultipleUserStores");

        var storeConfig1 = {'storeName':'GLBLDB1','isGlobalStore':true};
        var storeConfig2 = {'storeName':'GLBLDB2','isGlobalStore':true};

        var indexes = [{path:"Name", type:"string"},{path:"Id", type:"string"}];
        var storeConfig1_SoupName = storeConfig1.storeName + "_Soup";
        var storeConfig2_SoupName = storeConfig2.storeName + "_Soup";

        var self = this;

        return this.smartstoreClient
                         .removeAllGlobalStores()
                         .then(function() {
                              return  Promise.all([self.smartstoreClient.registerSoup(storeConfig1,  storeConfig1_SoupName, indexes),
                                             self.smartstoreClient.registerSoup(storeConfig2, storeConfig2_SoupName, indexes)]);
                          })
                         .then(function() {
                           return Promise.all(
                                   [self.smartstoreClient.soupExists(storeConfig1, storeConfig1_SoupName),
                                   self.smartstoreClient.soupExists(storeConfig2, storeConfig2_SoupName)]);
                         })
                         .then(function(result) {
                            var exists1 = result[0], exists2 = result[1];
                            QUnit.equals(exists1, true, "soup should exist in global store1 " + storeConfig1_SoupName);
                            QUnit.equals(exists2, true, "soup should exist in global store2 " + storeConfig2_SoupName);
                          })
                          .then(function() {
                            return Promise.all(
                                    [self.smartstoreClient.soupExists(storeConfig1, storeConfig2_SoupName),
                                    self.smartstoreClient.soupExists(storeConfig2, storeConfig1_SoupName)]);
                          })
                          .then(function(result) {
                             var exists1 = result[0], exists2 = result[1];
                             QUnit.equals(exists1, false, "soup should not exist in user store1 " + storeConfig2_SoupName);
                             QUnit.equals(exists2, false, "soup should not exist in user store2 " + storeConfig1_SoupName);
                           })
                         .then(function () {
                           return Promise.all(
                                   [self.smartstoreClient.removeStore(storeConfig1),
                                   self.smartstoreClient.removeStore(storeConfig2)]);
                         })
                         .then(function () {
                             return self.smartstoreClient.getAllGlobalStores();
                         })
                         .then( function(stores) {
                            QUnit.equals(stores.length, 0, "All global stores removed");
                            self.finalizeTest();
                         });
    };

}
