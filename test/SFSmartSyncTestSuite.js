/*
 * Copyright (c) 2013-present, salesforce.com, inc.
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
"use strict";

if (typeof SmartSyncTestSuite === 'undefined') {

/**
 * Constructor
 */
var SmartSyncTestSuite = function () {
    SFTestSuite.call(this, "SmartSyncTestSuite");
    //default store config
    this.defaultStoreConfig = {"isGlobalStore" : false};
    this.defaultGlobalStoreConfig = {"isGlobalStore" : true};

    // To run specific tests
    // this.testsToRun = ["testSyncDownGetSyncDeleteSyncById", "testSyncDownGetSyncDeleteSyncByName", "testSyncUpGetSyncDeleteSyncById", "testSyncUpGetSyncDeleteSyncByName"];
};

// We are sub-classing SFTestSuite
SmartSyncTestSuite.prototype = new SFTestSuite();
SmartSyncTestSuite.prototype.constructor = SmartSyncTestSuite;


// SmartSyncPlugin
var promiser = cordova.require("com.salesforce.util.promiser").promiser;
SmartSyncTestSuite.prototype.cleanResyncGhosts = promiser(cordova.require("com.salesforce.plugin.smartsync"), "cleanResyncGhosts");
SmartSyncTestSuite.prototype.reSync = promiser(cordova.require("com.salesforce.plugin.smartsync"), "reSync");
SmartSyncTestSuite.prototype.syncDown = promiser(cordova.require("com.salesforce.plugin.smartsync"), "syncDown");
SmartSyncTestSuite.prototype.syncUp = promiser(cordova.require("com.salesforce.plugin.smartsync"), "syncUp");
SmartSyncTestSuite.prototype.getSyncStatus = promiser(cordova.require("com.salesforce.plugin.smartsync"), "getSyncStatus");
SmartSyncTestSuite.prototype.deleteSync = promiser(cordova.require("com.salesforce.plugin.smartsync"), "deleteSync");


//-------------------------------------------------------------------------------------------------------
//
// Tests for Force.StoreCache
//
//-------------------------------------------------------------------------------------------------------

/**
 * TEST Force.StoreCache.init
 */
SmartSyncTestSuite.prototype.testStoreCacheInit = function() {
    console.log("# In SmartSyncTestSuite." + this.module.currentTestName);
    var self = this;
    var soupName = "soupFor_" + this.module.currentTestName; 
    Force.smartstoreClient.soupExists(self.defaultStoreConfig,soupName)
    .then(function(exists) {
        QUnit.equals(exists, false, "soup should not already exist");
        console.log("## Initialization of StoreCache");
        var cache = new Force.StoreCache(soupName,null,null,self.defaultStoreConfig.isGlobalStore,self.defaultStoreConfig.storeName);
        return cache.init();
    })
    .then(function() {
        console.log("## Verifying that underlying soup was created");
        return Force.smartstoreClient.soupExists(self.defaultStoreConfig,soupName)
    })
    .then(function(exists) {
        QUnit.equals(exists, true, "soup should now exist");
        console.log("## Cleaning up");
        return Force.smartstoreClient.removeSoup(self.defaultStoreConfig,soupName);
    })
    .then(function() {
        self.finalizeTest();
    });
}

/**
 * TEST Force.StoreCache.retrieve
 */
SmartSyncTestSuite.prototype.testStoreCacheRetrieve = function() {
    console.log("# In SmartSyncTestSuite." + this.module.currentTestName);
    var self = this;
    var cache;
    var soupName = "soupFor_" + this.module.currentTestName; 
    Force.smartstoreClient.removeSoup(self.defaultStoreConfig,soupName)
    .then(function() {
        console.log("## Initialization of StoreCache");
        cache = new Force.StoreCache(soupName,null,null,self.defaultStoreConfig.isGlobalStore,self.defaultStoreConfig.storeName);
        return cache.init();
    })
    .then(function() {
        console.log("## Direct upsert in underlying soup");
        return Force.smartstoreClient.upsertSoupEntriesWithExternalId(self.defaultStoreConfig,soupName, [{Id:"007", Name:"JamesBond", Address:{City:"London"}}], "Id");
    })
    .then(function() {
        console.log("## Trying an existing record with no fields specified");
        return cache.retrieve("007");
    })
    .then(function(record) {
        console.log("## Checking returned record");
        assertContains(record, {Id:"007", Name:"JamesBond", Address:{City:"London"}});
        console.log("## Trying an existing record but asking for a field that is in the cache");
        return cache.retrieve("007", ["Name"]);
    })
    .then(function(record) {
        console.log("## Checking returned record");
        assertContains(record, {Id:"007"});
        console.log("## Trying an existing record but asking a non-top level field that is in the cache");
        return cache.retrieve("007", ["Address.City"]);
    })
    .then(function(record) {
        console.log("## Checking returned record");
        assertContains(record, {Id:"007"});
        console.log("## Trying an existing record but asking for field that is in the cache");
        return cache.retrieve("007", ["Name", "Mission"]);
    })
    .then(function(record) {
        QUnit.equals(record, null, "null should have been returned");
        console.log("## Trying an existing record but asking for non-top level field that is not in the cache");
        return cache.retrieve("007", ["Name", "Address.Street"]);
    })
    .then(function(record) {
        QUnit.equals(record, null, "null should have been returned");
        console.log("## Trying a non-existing record");
        return cache.retrieve("008");
    })
    .then(function(record) {
        QUnit.equals(record, null, "null should have been returned");
        console.log("## Cleaning up");
        return Force.smartstoreClient.removeSoup(self.defaultStoreConfig,soupName);
    })
    .then(function() {
        self.finalizeTest();
    });
}

/**
 * TEST Force.StoreCache.save
 */
SmartSyncTestSuite.prototype.testStoreCacheSave = function() {
    console.log("# In SmartSyncTestSuite." + this.module.currentTestName);
    var self = this;
    var cache;
    var soupName = "soupFor_" + this.module.currentTestName; 
    Force.smartstoreClient.removeSoup(self.defaultStoreConfig,soupName)
    .then(function() {
        console.log("## Initialization of StoreCache");
        cache = new Force.StoreCache(soupName,null,null,self.defaultStoreConfig.isGlobalStore,self.defaultStoreConfig.storeName);
        return cache.init();
    })
    .then(function() {
        console.log("## Saving record to cache");
        return cache.save({Id:"007", Name:"JamesBond", Mission:"TopSecret"});
    })
    .then(function(record) {
        console.log("## Direct retrieve from underlying cache");
        return Force.smartstoreClient.retrieveSoupEntries(self.defaultStoreConfig,soupName, [record._soupEntryId]);
    })
    .then(function(records) {
        console.log("## Checking returned record");
        QUnit.equals(records.length, 1, "one record should have been returned");
        assertContains(records[0], {Id:"007", Name:"JamesBond", Mission:"TopSecret"});
        console.log("## Saving partial record to cache");
        return cache.save({Id:"007", Mission:"TopSecret2", Organization:"MI6"});
    })
    .then(function(record) {
        console.log("## Direct retrieve from underlying cache");
        return Force.smartstoreClient.retrieveSoupEntries(self.defaultStoreConfig,soupName, [record._soupEntryId]);
    })
    .then(function(records) {
        console.log("## Checking returned record is the merge of original fields and newly provided fields");
        QUnit.equals(records.length, 1, "one record should have been returned");
        assertContains(records[0], {Id:"007", Name:"JamesBond", Mission:"TopSecret2", Organization:"MI6"});

        console.log("## Saving partial record to cache with noMerge flag");
        return cache.save({Id:"007", Mission:"TopSecret3"}, cordova.require("com.salesforce.plugin.smartsync").MERGE_MODE.OVERWRITE);
    })
    .then(function(record) {
        console.log("## Direct retrieve from underlying cache");
        return Force.smartstoreClient.retrieveSoupEntries(self.defaultStoreConfig,soupName, [record._soupEntryId]);
    })
    .then(function(records) {
        console.log("## Checking returned record just has newly provided fields");
        QUnit.equals(records.length, 1, "one record should have been returned");
        assertContains(records[0], {Id:"007", Mission:"TopSecret3"});
        QUnit.equals(_.has(records[0], "Name"), false, "Should not have a name field");
        QUnit.equals(_.has(records[0], "Organization"), false, "Should not have an organization field");
        console.log("## Cleaning up");
        return Force.smartstoreClient.removeSoup(self.defaultStoreConfig,soupName);
    })
    .then(function() {
        self.finalizeTest();
    });
}

/**
 * TEST Force.StoreCache.saveAll
 */
SmartSyncTestSuite.prototype.testStoreCacheSaveAll = function() {
    console.log("# In SmartSyncTestSuite." + this.module.currentTestName);
    var self = this;
    var cache;
    var soupName = "soupFor_" + this.module.currentTestName; 
    var soupEntryIds;
    Force.smartstoreClient.removeSoup(self.defaultStoreConfig,soupName)
    .then(function() {
        console.log("## Initialization of StoreCache");
        cache = new Force.StoreCache(soupName,null,null,self.defaultStoreConfig.isGlobalStore,self.defaultStoreConfig.storeName);
        return cache.init();
    })
    .then(function() {
        console.log("## Saving records to cache");
        var records = [{Id:"007", Name:"JamesBond", Mission:"TopSecret"},{Id:"008", Name:"Agent008"}, {Id:"009", Name:"JamesOther"}];
        return cache.saveAll(records);
    })
    .then(function(records) {
        soupEntryIds = _.pluck(records, "_soupEntryId");
        console.log("## Direct retrieve from underlying cache");
        return Force.smartstoreClient.retrieveSoupEntries(self.defaultStoreConfig,soupName, soupEntryIds);
    })
    .then(function(records) {
        console.log("## Checking returned record");
        QUnit.equals(records.length, 3, "three records should have been returned");
        assertContains(records[0], {Id:"007"});
        assertContains(records[1], {Id:"008"});
        assertContains(records[2], {Id:"009"});
        console.log("## Saving partial records to cache");
        var partialRecords = [{Id:"007", Mission:"TopSecret-007"},{Id:"008", Team:"Team-008"}, {Id:"009", Organization:"MI6"}];
        return cache.saveAll(partialRecords);
    })
    .then(function(records) {
        console.log("## Direct retrieve from underlying cache");
        return Force.smartstoreClient.retrieveSoupEntries(self.defaultStoreConfig,soupName, soupEntryIds);
    })
    .then(function(records) {
        console.log("## Checking returned records are the merge of original fields and newly provided fields");
        QUnit.equals(records.length, 3, "three records should have been returned");
        assertContains(records[0], {Id:"007", Name:"JamesBond", Mission:"TopSecret-007"});
        assertContains(records[1], {Id:"008", Name:"Agent008", Team:"Team-008"});
        assertContains(records[2], {Id:"009", Name:"JamesOther", Organization:"MI6"});

        console.log("## Saving partial records to cache with noMerge flag");
        var partialRecords = [{Id:"007", Mission:"TopSecret"},{Id:"008", Team:"Team"}, {Id:"009", Organization:"Org"}];
        return cache.saveAll(partialRecords, cordova.require("com.salesforce.plugin.smartsync").MERGE_MODE.OVERWRITE);
    })
    .then(function(records) {
        console.log("## Direct retrieve from underlying cache");
        return Force.smartstoreClient.retrieveSoupEntries(self.defaultStoreConfig,soupName, soupEntryIds);
    })
    .then(function(records) {
        console.log("## Checking returned records just have newly provided fields");
        QUnit.equals(records.length, 3, "three records should have been returned");
        assertContains(records[0], {Id:"007", Mission:"TopSecret"});
        QUnit.equals(_.has(records[0], "Name"), false, "Should not have a name field");
        assertContains(records[1], {Id:"008", Team:"Team"});
        QUnit.equals(_.has(records[1], "Name"), false, "Should not have a name field");
        assertContains(records[2], {Id:"009", Organization:"Org"});
        QUnit.equals(_.has(records[2], "Name"), false, "Should not have a name field");
        console.log("## Cleaning up");
        return Force.smartstoreClient.removeSoup(self.defaultStoreConfig,soupName);
    })
    .then(function() {
        self.finalizeTest();
    });
}

/**
 * TEST Force.StoreCache.remove
 */
SmartSyncTestSuite.prototype.testStoreCacheRemove = function() {
    console.log("# In SmartSyncTestSuite." + this.module.currentTestName);
    var self = this;
    var cache;
    var soupName = "soupFor_" + this.module.currentTestName; 
    var recordEntryId;
    Force.smartstoreClient.removeSoup(self.defaultStoreConfig,soupName)
    .then(function() {
        console.log("## Initialization of StoreCache");
        cache = new Force.StoreCache(soupName,null,null,self.defaultStoreConfig.isGlobalStore,self.defaultStoreConfig.storeName);
        return cache.init();
    })
    .then(function() {
        console.log("## Direct upsert in underlying soup");
        return Force.smartstoreClient.upsertSoupEntriesWithExternalId(self.defaultStoreConfig,soupName, [{Id:"007", Name:"JamesBond"}], "Id");
    })
    .then(function(records) {
        recordEntryId = records[0]._soupEntryId;
        console.log("## Removing non-existent record");
        return cache.remove("008");
    })
    .then(function() {
        console.log("## Checking record is still there");
        return Force.smartstoreClient.retrieveSoupEntries(self.defaultStoreConfig,soupName, [recordEntryId]);
    })
    .then(function(records) {
        console.log("## Checking returned record");
        assertContains(records[0], {Id:"007"});
        console.log("## Removing record");
        return cache.remove("007");
    })
    .then(function() {
        console.log("## Checking record is no longer there");
        return Force.smartstoreClient.retrieveSoupEntries(self.defaultStoreConfig,soupName, [recordEntryId]);
    })
    .then(function(records) {
        QUnit.equals(records[0], undefined, "wrong record returned");
        console.log("## Cleaning up");
        return Force.smartstoreClient.removeSoup(self.defaultStoreConfig,soupName);
    })
    .then(function() {
        self.finalizeTest();
    });
}

/**
 * TEST Force.StoreCache.find
 */
SmartSyncTestSuite.prototype.testStoreCacheFind = function() {
    console.log("# In SmartSyncTestSuite." + this.module.currentTestName);
    var self = this;
    var cache;
    var soupName = "soupFor_" + this.module.currentTestName; 
    var resultSet;
    Force.smartstoreClient.removeSoup(self.defaultStoreConfig,soupName)
    .then(function() {
        console.log("## Initialization of StoreCache");
        cache = new Force.StoreCache(soupName, [ {path:"Name", type:"string"}, {path:"Mission", type:"string"} ],null,self.defaultStoreConfig.isGlobalStore,self.defaultStoreConfig.storeName);
        return cache.init();
    })
    .then(function() {
        console.log("## Direct upsert in underlying soup");
        var records = [{Id:"007", Name:"JamesBond"},{Id:"008", Name:"Agent008"}, {Id:"009", Name:"JamesOther"}];
        return Force.smartstoreClient.upsertSoupEntriesWithExternalId(self.defaultStoreConfig,soupName, records, "Id");
    })
    .then(function() {
        console.log("## Doing a find with an exact query spec");
        return cache.find({queryType:"exact", indexPath:"Name", matchKey:"Agent008", order:"ascending", pageSize:1});
    })
    .then(function(result) {
        console.log("## Checking returned result");
        QUnit.equals(result.records.length, 1, "one record should have been returned");
        assertContains(result.records[0], {Id:"008"});
        QUnit.equals(result.hasMore(), false, "there should not be more records");
        console.log("## Doing a find with like query spec");
        return cache.find({queryType:"like", indexPath:"Name", likeKey:"James%", order:"ascending", pageSize:2});
    })
    .then(function(result) {
        console.log("## Checking returned result");
        QUnit.equals(result.records.length, 2, "two records should have been returned");
        assertContains(result.records[0], {Id:"007"});
        assertContains(result.records[1], {Id:"009"});
        QUnit.equals(result.hasMore(), false, "there should not be more records");
        console.log("## Doing a find with all query spec and a pageSize smaller than result set");
        return cache.find({queryType:"range", indexPath:"Id", order:"ascending", pageSize:2});
    })
    .then(function(result) {
        resultSet = result;
        console.log("## Checking returned result");
        QUnit.equals(resultSet.records.length, 2, "two records should have been returned");
        assertContains(resultSet.records[0], {Id:"007"});
        assertContains(resultSet.records[1], {Id:"008"});
        QUnit.equals(resultSet.hasMore(), true, "there should be more records");
        console.log("## Getting the next page of records");
        return resultSet.getMore();
    })
    .then(function(records) {
        console.log("## Checking returned result");
        QUnit.equals(records.length, 1, "one record should have been returned");
        assertContains(records[0], {Id:"009"});
        QUnit.equals(resultSet.hasMore(), false, "there should not be more records");
        QUnit.equals(resultSet.records.length, 3, "three records should be in result set");
        assertContains(resultSet.records[0], {Id:"007"});
        assertContains(resultSet.records[1], {Id:"008"});
        assertContains(resultSet.records[2], {Id:"009"});

        console.log("## Adding extra field to all records");
        var partialRecords = [{Id:"007", Mission:"ABC"},{Id:"008", Mission:"bcd"}, {Id:"009", Mission:"EFG"}];
        return cache.saveAll(partialRecords);
    })
    .then(function(records) {
        console.log("## Doing a find with like query spec");
        return cache.find({queryType:"like", indexPath:"Mission", likeKey:"%", order:"ascending", pageSize:3});
    })
    .then(function(result) {
        console.log("## Checking returned result - expect case-sensitive sorting");
        QUnit.equals(result.records.length, 3, "three records should have been returned");
        assertContains(result.records[0], {Id:"007", Name:"JamesBond", Mission:"ABC"});
        assertContains(result.records[1], {Id:"009", Name:"JamesOther", Mission:"EFG"});
        assertContains(result.records[2], {Id:"008", Name:"Agent008", Mission:"bcd"});
        QUnit.equals(result.hasMore(), false, "there should not be more records");

        console.log("## Doing a find with smart query spec");
        return cache.find({queryType:"smart", smartSql:"SELECT {" + soupName + ":_soup} FROM {" + soupName + "} WHERE {" + soupName + ":Name} LIKE '%' ORDER BY LOWER({" + soupName + ":Mission})", pageSize:3});
    })
    .then(function(result) {
        console.log("## Checking returned result - expect case-insensitive sorting");
        QUnit.equals(result.records.length, 3, "three records should have been returned");
        assertContains(result.records[0], {Id:"007", Name:"JamesBond", Mission:"ABC"});
        assertContains(result.records[1], {Id:"008", Name:"Agent008", Mission:"bcd"});
        assertContains(result.records[2], {Id:"009", Name:"JamesOther", Mission:"EFG"});
        QUnit.equals(result.hasMore(), false, "there should not be more records");

        console.log("## Doing a find with smart query spec and a pageSize smaller than result set");
        return cache.find({queryType:"smart", smartSql:"SELECT {" + soupName + ":_soup} FROM {" + soupName + "} WHERE {" + soupName + ":Name} LIKE '%' ORDER BY LOWER({" + soupName + ":Mission})", pageSize:2});
    })
    .then(function(result) {
        resultSet = result;
        console.log("## Checking returned result");
        QUnit.equals(resultSet.records.length, 2, "two records should have been returned");
        assertContains(resultSet.records[0], {Id:"007"});
        assertContains(resultSet.records[1], {Id:"008"});
        QUnit.equals(resultSet.hasMore(), true, "there should be more records");
        console.log("## Getting the next page of records");
        return resultSet.getMore();
    })
    .then(function(records) {
        console.log("## Checking returned result");
        QUnit.equals(records.length, 1, "one record should have been returned");
        assertContains(records[0], {Id:"009"});
        QUnit.equals(resultSet.hasMore(), false, "there should not be more records");
        QUnit.equals(resultSet.records.length, 3, "three records should be in result set");
        assertContains(resultSet.records[0], {Id:"007"});
        assertContains(resultSet.records[1], {Id:"008"});
        assertContains(resultSet.records[2], {Id:"009"});

        console.log("## Cleaning up");
        return Force.smartstoreClient.removeSoup(self.defaultStoreConfig,soupName);
    })
    .then(function() {
        self.finalizeTest();
    });
}

/**
 * TEST Force.StoreCache.addLocalFields
 */
SmartSyncTestSuite.prototype.testStoreCacheAddLocalFields = function() {
    console.log("# In SmartSyncTestSuite." + this.module.currentTestName);
    var soupName = "soupFor_" + this.module.currentTestName; 
    var cache = new Force.StoreCache(soupName,null,null,this.defaultStoreConfig.isGlobalStore,this.defaultStoreConfig.storeName);

    console.log("Add local fields when none are present");
    var record = {Id:"007", Name:"JamesBond"};
    record = cache.addLocalFields(record);
    assertContains(record, {Id:"007", Name:"JamesBond"});
    checkLocalFlags(record, false, false, false, false);

    console.log("Add local fields when some are present");
    record = {Id:"007", Name:"JamesBond", __locally_deleted__:true};
    record = cache.addLocalFields(record);
    assertContains(record, {Id:"007", Name:"JamesBond"});
    checkLocalFlags(record, true, false, false, true);

    this.finalizeTest();
}

/**
 * TEST Force.StoreCache backed by global store
 */
SmartSyncTestSuite.prototype.testStoreCacheWithGlobalStore = function() {
    console.log("# In SmartSyncTestSuite." + this.module.currentTestName);
    var self = this;
    var cache;
    var cacheGlobal;
    var soupName = "soupFor_" + this.module.currentTestName; 
    var resultSet;
    var GLOBAL_STORE = true;
    var REGULAR_STORE = false;
    var indexSpecs = [ {path:"Name", type:"string"}];
    var agent007 = {Id:"007", Name:"JamesBond"};
    var agent008 = {Id:"008", Name:"Vilain"};
    var querySpec007 = {queryType:"exact", indexPath:"Name", matchKey:"JamesBond", order:"ascending", pageSize:1}
    var querySpec008 = {queryType:"exact", indexPath:"Name", matchKey:"Vilain", order:"ascending", pageSize:1}

    Promise.all([Force.smartstoreClient.removeSoup(self.defaultStoreConfig, soupName),
                 Force.smartstoreClient.removeSoup(self.defaultGlobalStoreConfig, soupName)])
        .then(function() {
            console.log("## Initialization of StoreCache's");
            cache = new Force.StoreCache(soupName, indexSpecs, null,self.defaultStoreConfig.isGlobalStore,self.defaultStoreConfig.storeName);
            cacheGlobal = new Force.StoreCache(soupName, indexSpecs, null,self.defaultGlobalStoreConfig.isGlobalStore,self.defaultGlobalStoreConfig.storeName);
            return Promise.all([cache.init(), cacheGlobal.init()]);
        })
        .then(function() {
            console.log("## Save record into regular cache");
            return cache.save(agent007);
        })
        .then(function() {
            console.log("## Looking for record in both caches");
            return Promise.all([cache.find(querySpec007), cacheGlobal.find(querySpec007)]);
        })
        .then(function(results) {
            var result = results[0], resultGlobal = results[1];
            console.log("## Checking result from regular cache");
            QUnit.equals(result.records.length, 1);
            assertContains(result.records[0], agent007);
            console.log("## Checking result from global cache");
            QUnit.equals(resultGlobal.records.length, 0);
            console.log("## Save record into global cache");
            return cacheGlobal.save(agent008);
        })
        .then(function() {
            console.log("## Looking for record in both caches");
            return Promise.all([cache.find(querySpec008), cacheGlobal.find(querySpec008)]);
        })
        .then(function(results) {
            var result = results[0], resultGlobal = results[1];
            console.log("## Checking result from regular cache");
            QUnit.equals(result.records.length, 0);
            console.log("## Checking result from global cache");
            QUnit.equals(resultGlobal.records.length, 1);
            assertContains(resultGlobal.records[0], agent008);
            console.log("## Save record into global cache");

            // Cleaning up
            return Promise.all([Force.smartstoreClient.removeSoup(self.defaultStoreConfig, soupName),
                                Force.smartstoreClient.removeSoup(self.defaultGlobalStoreConfig, soupName)])
        })
        .then(function() {
            self.finalizeTest();
        });
}


/**
 * TEST Force.StoreCache backed by global store
 */
SmartSyncTestSuite.prototype.testStoreCacheWithGlobalStoreNamed = function() {
    console.log("# In SmartSyncTestSuite." + this.module.currentTestName);
    var self = this;
    var cache;
    var cacheGlobal;
    var soupName = "soupFor_" + this.module.currentTestName; 
    var resultSet;
    var GLOBAL_STORE = true;
    var REGULAR_STORE = false;
    var indexSpecs = [ {path:"Name", type:"string"}];
    var agent007 = {Id:"007", Name:"JamesBond"};
    var agent008 = {Id:"008", Name:"Vilain"};
    var querySpec007 = {queryType:"exact", indexPath:"Name", matchKey:"JamesBond", order:"ascending", pageSize:1}
    var querySpec008 = {queryType:"exact", indexPath:"Name", matchKey:"Vilain", order:"ascending", pageSize:1}
    var storeConfigWithName =  {"isGlobalStore" : false, "storeName" : "userStoreFor_" + this.module.currentTestName};
    var globalStoreConfigWithName =  {"isGlobalStore" : true, "storeName" : "globalStoreFor_" + this.module.currentTestName};

    Promise.all([Force.smartstoreClient.removeSoup(storeConfigWithName, soupName),
                 Force.smartstoreClient.removeSoup(globalStoreConfigWithName, soupName)])
        .then(function() {
            console.log("## Initialization of StoreCache's");
            cache = new Force.StoreCache(soupName, indexSpecs, null,storeConfigWithName.isGlobalStore,storeConfigWithName.storeName);
            cacheGlobal = new Force.StoreCache(soupName, indexSpecs, null,globalStoreConfigWithName.isGlobalStore,globalStoreConfigWithName.storeName);
            return Promise.all([cache.init(), cacheGlobal.init()]);
        })
        .then(function() {
            console.log("## Save record into regular cache");
            return cache.save(agent007);
        })
        .then(function() {
            console.log("## Looking for record in both caches");
            return Promise.all([cache.find(querySpec007), cacheGlobal.find(querySpec007)]);
        })
        .then(function(results) {
            var result = results[0], resultGlobal = results[1];
            console.log("## Checking result from regular cache");
            QUnit.equals(result.records.length, 1);
            assertContains(result.records[0], agent007);
            console.log("## Checking result from global cache");
            QUnit.equals(resultGlobal.records.length, 0);
            console.log("## Save record into global cache");
            return cacheGlobal.save(agent008);
        })
        .then(function() {
            console.log("## Looking for record in both caches");
            return Promise.all([cache.find(querySpec008), cacheGlobal.find(querySpec008)]);
        })
        .then(function(results) {
            var result = results[0], resultGlobal = results[1];
            console.log("## Checking result from regular cache");
            QUnit.equals(result.records.length, 0);
            console.log("## Checking result from global cache");
            QUnit.equals(resultGlobal.records.length, 1);
            assertContains(resultGlobal.records[0], agent008);
            console.log("## Save record into global cache");
            // Cleaning up
            return Promise.all([Force.smartstoreClient.removeSoup(storeConfigWithName, soupName),
                                Force.smartstoreClient.removeSoup(globalStoreConfigWithName, soupName)]);
        })
        .then(function() {
            self.finalizeTest();
        });
}

//-------------------------------------------------------------------------------------------------------
//
// Tests for Force.SObjectType
//
//-------------------------------------------------------------------------------------------------------

/**
 * TEST Force.SObjectType.describe
 */
SmartSyncTestSuite.prototype.testSObjectTypeDescribe = function() {
    console.log("# In SmartSyncTestSuite." + this.module.currentTestName);
    var self = this;
    var soupName = "soupFor_" + this.module.currentTestName; 
    var cache;
    var describeResult;

    Force.smartstoreClient.removeSoup(self.defaultStoreConfig,soupName)
    .then(function() {
        console.log("## Initialization of StoreCache");
        cache = new Force.StoreCache(soupName,null,null,self.defaultStoreConfig.isGlobalStore,self.defaultStoreConfig.storeName);
        return cache.init();
    })
    .then(function() {
        console.log("## Calling describe");
        var sobjectType = new Force.SObjectType("Account", cache);
        return sobjectType.describe();
    })
    .then(function(data) {
        describeResult = data;
        assertContains(describeResult, {name:"Account", keyPrefix:"001"});
        QUnit.equals(_.has(describeResult, "childRelationships"), true, "Child relationships expected");
        console.log("## Checking underlying cache");
        return cache.retrieve("Account");
    })
    .then(function(cacheRow) {
        assertContains(describeResult, cacheRow.describeResult);
        console.log("## Cleaning up");
        return Force.smartstoreClient.removeSoup(self.defaultStoreConfig,soupName);
    })
    .then(function() {
        self.finalizeTest();
    });

}

/**
 * TEST Force.SObjectType.getMetadata
 */
SmartSyncTestSuite.prototype.testSObjectTypeGetMetadata = function() {
    console.log("# In SmartSyncTestSuite." + this.module.currentTestName);
    var self = this;
    var soupName = "soupFor_" + this.module.currentTestName; 
    var cache;
    var metadataResult;

    Force.smartstoreClient.removeSoup(self.defaultStoreConfig,soupName)
    .then(function() {
        console.log("## Initialization of StoreCache");
        cache = new Force.StoreCache(soupName,null,null,self.defaultStoreConfig.isGlobalStore,self.defaultStoreConfig.storeName);
        return cache.init();
    })
    .then(function() {
        console.log("## Calling getMetadata");
        var sobjectType = new Force.SObjectType("Account", cache);
        return sobjectType.getMetadata();
    })
    .then(function(data) {
        metadataResult = data;
        assertContains(metadataResult, {objectDescribe: {name:"Account", keyPrefix:"001"}});
        QUnit.equals(_.has(metadataResult, "recentItems"), true, "Recent items expected");
        console.log("## Checking underlying cache");
        return cache.retrieve("Account");
    })
    .then(function(cacheRow) {
        assertContains(metadataResult, cacheRow.metadataResult);
        console.log("## Cleaning up");
        return Force.smartstoreClient.removeSoup(self.defaultStoreConfig,soupName);
    })
    .then(function() {
        self.finalizeTest();
    });

}

/**
 * TEST Force.SObjectType.describeLayout
 */
SmartSyncTestSuite.prototype.testSObjectTypeDescribeLayout = function() {
    console.log("# In SmartSyncTestSuite." + this.module.currentTestName);
    var self = this;
    var soupName = "soupFor_" + this.module.currentTestName; 
    var cache;
    var describeLayoutResult;

    Force.smartstoreClient.removeSoup(self.defaultStoreConfig,soupName)
    .then(function() {
        console.log("## Initialization of StoreCache");
        cache = new Force.StoreCache(soupName,null,null,self.defaultStoreConfig.isGlobalStore,self.defaultStoreConfig.storeName);
        return cache.init();
    })
    .then(function() {
        console.log("## Calling describe layout");
        var sobjectType = new Force.SObjectType("Account", cache);
        return sobjectType.describeLayout();
    })
    .then(function(data) {
        describeLayoutResult = data;
        QUnit.equals(_.has(describeLayoutResult, "detailLayoutSections"), true, "Detail layout sections expected");
        console.log("## Checking underlying cache");
        return cache.retrieve("Account");
    })
    .then(function(cacheRow) {
        assertContains(describeLayoutResult, cacheRow['layoutInfo_012000000000000AAA']);
        console.log("## Cleaning up");
        return Force.smartstoreClient.removeSoup(self.defaultStoreConfig,soupName);
    })
    .then(function() {
        self.finalizeTest();
    });
}

/**
 * TEST Force.SObjectType cache merge by multiple instances
 */
SmartSyncTestSuite.prototype.testSObjectTypeCacheOnlyMode = function() {
    console.log("# In SmartSyncTestSuite." + this.module.currentTestName);
    var self = this;
    var soupName = "soupFor_" + this.module.currentTestName; 
    var cache, data = {
        describeResult: {name:"MockObject", keyPrefix:"00X"},
        metadataResult: {objectDescribe: {name:"MockObject", keyPrefix:"00X"}},
        layoutInfo_012000000000000AAA: {detailLayoutSections: []},
        Id: 'MockObject'
    };

    Force.smartstoreClient.removeSoup(self.defaultStoreConfig,soupName)
    .then(function() {
        console.log("## Initialization of StoreCache");
        cache = new Force.StoreCache(soupName,null,null,self.defaultStoreConfig.isGlobalStore,self.defaultStoreConfig.storeName);
        return cache.init();
    })
    .then(function() {
        return cache.save(data);
    })
    .then(function() {
        console.log("## Calling describe layout");
        var sobjectType = new Force.SObjectType("MockObject", cache, Force.CACHE_MODE.CACHE_ONLY);
        return Promise.all([sobjectType.describe(), sobjectType.getMetadata(), sobjectType.describeLayout()]);
    })
    .then(function(results) {
        var descResult = results[0], metadataResult = results[1], layoutResult = results[2];
        assertContains(descResult, data.describeResult);
        assertContains(metadataResult, data.metadataResult);
        assertContains(layoutResult, data.layoutInfo_012000000000000AAA);
        console.log("## Cleaning up");
        return Force.smartstoreClient.removeSoup(self.defaultStoreConfig,soupName);
    })
    .then(function() {
        self.finalizeTest();
    });
}

/**
 * TEST Force.SObjectType cache merge by multiple instances
 */
SmartSyncTestSuite.prototype.testSObjectTypeCacheMerge = function() {
    console.log("# In SmartSyncTestSuite." + this.module.currentTestName);
    var self = this;
    var soupName = "soupFor_" + this.module.currentTestName; 
    var cache, describeResult, metadataResult;
    var sobjectType1, sobjectType2;

    Force.smartstoreClient.removeSoup(self.defaultStoreConfig,soupName)
    .then(function() {
        console.log("## Initialization of StoreCache");
        cache = new Force.StoreCache(soupName,null,null,self.defaultStoreConfig.isGlobalStore,self.defaultStoreConfig.storeName);
        return cache.init();
    })
    .then(function() {
        console.log("## Calling describe layout");
        sobjectType1 = new Force.SObjectType("Account", cache);
        sobjectType2 = new Force.SObjectType("Account", cache);
        return sobjectType1.describe();
    })
    .then(function(data1, data2) {
        describeResult = data1;
        return sobjectType2.getMetadata();
    })
    .then(function(data2) {
        metadataResult = data2;
        // Fetch the cache row to check if both describeResult and metadata Result are saved.
        console.log("## Checking underlying cache");
        return cache.retrieve("Account");
    })
    .then(function(cacheRow) {
        assertContains(describeResult, cacheRow.describeResult);
        assertContains(metadataResult, cacheRow.metadataResult);
        console.log("## Cleaning up");
        return Force.smartstoreClient.removeSoup(self.defaultStoreConfig,soupName);
    })
    .then(function() {
        self.finalizeTest();
    });
}

/**
 * TEST Force.SObjectType multiple types
 */
SmartSyncTestSuite.prototype.testMultiSObjectTypes = function() {
    console.log("# In SmartSyncTestSuite." + this.module.currentTestName);
    var self = this;
    var soupName = "soupFor_" + this.module.currentTestName; 
    var cache, accountDescribe, contactDescribe;

    Force.smartstoreClient.removeSoup(self.defaultStoreConfig,soupName)
    .then(function() {
        console.log("## Initialization of StoreCache");
        cache = new Force.StoreCache(soupName,null,null,self.defaultStoreConfig.isGlobalStore,self.defaultStoreConfig.storeName);
        return cache.init();
    })
    .then(function() {
        console.log("## Calling describe layout");
        var accountType = new Force.SObjectType("Account", cache);
        var contactType = new Force.SObjectType("Contact", cache);
        return Promise.all([accountType.describe(), contactType.describe()]);
    })
    .then(function(results) {
        var data1 = results[0], data2 = results[1];
        accountDescribe = data1;
        contactDescribe = data2;
        QUnit.equals('Account', accountDescribe.name, 'Describe result should be for Account');
        QUnit.equals('Contact', contactDescribe.name, 'Describe result should be for Contact');
        console.log("## Checking underlying cache");
        return Promise.all([cache.retrieve("Account"), cache.retrieve("Contact")]);
    })
    .then(function(results) {
        var accountCache = results[0], contactCache = results[1];
        assertContains(accountDescribe, accountCache.describeResult);
        assertContains(contactDescribe, contactCache.describeResult);
        console.log("## Cleaning up");
        return Force.smartstoreClient.removeSoup(self.defaultStoreConfig,soupName);
    })
    .then(function() {
        self.finalizeTest();
    });
}

/**
 * TEST Force.SObjectType.reset
 */
SmartSyncTestSuite.prototype.testSObjectTypeReset = function() {
    console.log("# In SmartSyncTestSuite." + this.module.currentTestName);
    var self = this;
    var soupName = "soupFor_" + this.module.currentTestName; 
    var cache;
    var sobjectType;

    Force.smartstoreClient.removeSoup(self.defaultStoreConfig,soupName)
    .then(function() {
        console.log("## Initialization of StoreCache");
        cache = new Force.StoreCache(soupName,null,null,self.defaultStoreConfig.isGlobalStore,self.defaultStoreConfig.storeName);
        return cache.init();
    })
    .then(function() {
        console.log("## Calling getMetadata and describe");
        sobjectType = new Force.SObjectType("Account", cache);
        return Promise.all([sobjectType.getMetadata(), sobjectType.describe()]);
    })
    .then(function() {
        console.log("## Checking underlying cache");
        return cache.retrieve("Account");
    })
    .then(function(cacheRow) {
        QUnit.equals(_.has(cacheRow, "describeResult"), true, "Cache entry should have describe data");
        QUnit.equals(_.has(cacheRow, "metadataResult"), true, "Cache entry should have metadata");
        console.log("## Calling reset");
        return sobjectType.reset();
    })
    .then(function() {
        console.log("## Checking underlying cache");
        return cache.retrieve("Account");
    })
    .then(function(cacheRow) {
        QUnit.equals(cacheRow, null, "No cache entry should have been found");
        console.log("## Cleaning up");
        return Force.smartstoreClient.removeSoup(self.defaultStoreConfig,soupName);
    })
    .then(function() {
        self.finalizeTest();
    });
}

//-------------------------------------------------------------------------------------------------------
//
// Tests for Force.syncRemoteObjectWithCache
//
//-------------------------------------------------------------------------------------------------------

/**
 * TEST Force.syncRemoteObjectWithCache for create method
 */
SmartSyncTestSuite.prototype.testSyncRemoteObjectWithCacheCreate = function() {
    console.log("# In SmartSyncTestSuite." + this.module.currentTestName);
    var self = this;
    var soupName = "soupFor_" + this.module.currentTestName; 
    var cache;

    Force.smartstoreClient.removeSoup(self.defaultStoreConfig,soupName)
    .then(function() {
        console.log("## Initialization of StoreCache");
        cache = new Force.StoreCache(soupName,null,null,self.defaultStoreConfig.isGlobalStore,self.defaultStoreConfig.storeName);
        return cache.init();
    })
    .then(function() {
        console.log("## Trying a create with localAction true");
        return Force.syncRemoteObjectWithCache("create", null, {Name:"JamesBond"}, ["Name"], cache, true);
    })
    .then(function(data) {
        console.log("## Checking data returned by sync call");
        QUnit.ok(cache.isLocalId(data.Id), "Should have a local id");
        assertContains(data, {Name:"JamesBond"});
        checkLocalFlags(data, true, true, false, false);

        console.log("## Checking underlying cache");
        return cache.retrieve(data.Id);
    })
    .then(function(data) {
        console.log("## Checking data returned from cache");
        assertContains(data, {Name:"JamesBond"});
        checkLocalFlags(data, true, true, false, false);

        console.log("## Trying a create with localAction false");
        return Force.syncRemoteObjectWithCache("create", "008", {Name:"JamesOther"}, ["Name"], cache, false);
    })
    .then(function(data) {
        console.log("## Checking data returned by sync call");
        assertContains(data, {Id:"008", Name:"JamesOther"});
        checkLocalFlags(data, false, false, false, false);

        console.log("## Checking underlying cache");
        return cache.retrieve(data.Id);
    })
    .then(function(data) {
        console.log("## Checking data returned from cache");
        assertContains(data, {Id:"008", Name:"JamesOther"});
        checkLocalFlags(data, false, false, false, false);

        console.log("## Trying a create with fieldlist being a subset of attributes");
        return Force.syncRemoteObjectWithCache("create", "009", {Name:"JamesNine", Mission:"TopSecret", City:"London"}, ["Name", "City"], cache, false);
    })
    .then(function(data) {
        console.log("## Checking data returned by sync call");
        assertContains(data, {Id:"009", Name:"JamesNine", City:"London"});
        QUnit.equals(_.has(data, "Mission"), false, "Mission should not have been saved");
        checkLocalFlags(data, false, false, false, false);

        console.log("## Checking underlying cache");
        return cache.retrieve(data.Id);
    })
    .then(function(data) {
        console.log("## Checking data returned from cache");
        assertContains(data, {Id:"009", Name:"JamesNine", City:"London"});
        QUnit.equals(_.has(data, "Mission"), false, "Mission should not have been saved");
        checkLocalFlags(data, false, false, false, false);

        console.log("## Trying a create with null fieldlist");
        return Force.syncRemoteObjectWithCache("create", "010", {Name:"JamesTen", Mission:"TopSecret", City:"London"}, null, cache, false);
    })
    .then(function(data) {
        console.log("## Checking data returned by sync call");
        assertContains(data, {Id:"010", Name:"JamesTen", Mission:"TopSecret", City:"London"});
        checkLocalFlags(data, false, false, false, false);

        console.log("## Checking underlying cache");
        return cache.retrieve(data.Id);
    })
    .then(function(data) {
        console.log("## Checking data returned from cache");
        assertContains(data, {Id:"010", Name:"JamesTen", Mission:"TopSecret", City:"London"});
        checkLocalFlags(data, false, false, false, false);

        console.log("## Cleaning up");
        return Force.smartstoreClient.removeSoup(self.defaultStoreConfig,soupName);
    })
    .then(function() {
        self.finalizeTest();
    });
}

/**
 * TEST Force.syncRemoteObjectWithCache for read method
 */
SmartSyncTestSuite.prototype.testSyncRemoteObjectWithCacheRead = function() {
    console.log("# In SmartSyncTestSuite." + this.module.currentTestName);
    var self = this;
    var soupName = "soupFor_" + this.module.currentTestName; 
    var cache;

    Force.smartstoreClient.removeSoup(self.defaultStoreConfig,soupName)
    .then(function() {
        console.log("## Initialization of StoreCache");
        cache = new Force.StoreCache(soupName,null,null,self.defaultStoreConfig.isGlobalStore,self.defaultStoreConfig.storeName);
        return cache.init();
    })
    .then(function() {
        console.log("## Direct upsert in underlying soup");
        var records = [{Id:"007", Name:"JamesBond"},{Id:"008", Name:"Agent008"}, {Id:"009", Name:"JamesOther"}];
        return cache.saveAll(records);
    })
    .then(function(records) {
        console.log("## Trying read for existing record");
        return Force.syncRemoteObjectWithCache("read", "007", null, ["Name"], cache);
    })
    .then(function(data) {
        console.log("## Checking data returned by sync call");
        assertContains(data, {Id:"007", Name:"JamesBond"});

        console.log("## Trying read for non-existing record");
        return Force.syncRemoteObjectWithCache("read", "010", null, ["Name"], cache);
    })
    .then(function(data) {
        console.log("## Checking data returned by sync call");
        QUnit.equals(data, null, "No data should have been returned");

        console.log("## Trying read for existing record but asking for missing fields");
        return Force.syncRemoteObjectWithCache("read", "007", null, ["Name", "Mission"], cache);
    })
    .then(function(data) {
        console.log("## Checking data returned by sync call");
        QUnit.equals(data, null, "No data should have been returned");

        console.log("## Trying read for existing record with null fieldlist");
        return Force.syncRemoteObjectWithCache("read", "007", null, null, cache);
    })
    .then(function(data) {
        console.log("## Checking data returned by sync call");
        assertContains(data, {Id:"007", Name:"JamesBond"});

        console.log("## Cleaning up");
        return Force.smartstoreClient.removeSoup(self.defaultStoreConfig,soupName);
    })
    .then(function() {
        self.finalizeTest();
    });
}

/**
 * TEST Force.syncRemoteObjectWithCache for update method
 */
SmartSyncTestSuite.prototype.testSyncRemoteObjectWithCacheUpdate = function() {
    console.log("# In SmartSyncTestSuite." + this.module.currentTestName);
    var self = this;
    var soupName = "soupFor_" + this.module.currentTestName; 
    var cache;

    Force.smartstoreClient.removeSoup(self.defaultStoreConfig,soupName)
    .then(function() {
        console.log("## Initialization of StoreCache");
        cache = new Force.StoreCache(soupName,null,null,self.defaultStoreConfig.isGlobalStore,self.defaultStoreConfig.storeName);
        return cache.init();
    })
    .then(function() {
        console.log("## Trying a create with localAction true");
        return Force.syncRemoteObjectWithCache("create", null, {Name:"JamesBond"}, ["Name"], cache, true);
    })
    .then(function(data) {
        console.log("## Trying an update with localAction true");
        return Force.syncRemoteObjectWithCache("update", data.Id, {Mission:"TopSecret"}, ["Mission"], cache, true);
    })
    .then(function(data) {
        console.log("## Checking data returned by sync call");
        assertContains(data, {Name:"JamesBond", Mission:"TopSecret"});
        checkLocalFlags(data, true, true, true, false);

        console.log("## Checking underlying cache");
        return cache.retrieve(data.Id);
    })
    .then(function(data) {
        console.log("## Checking data returned from cache");
        assertContains(data, {Name:"JamesBond", Mission:"TopSecret"});
        checkLocalFlags(data, true, true, true, false);

        console.log("## Trying an update with localAction false");
        return Force.syncRemoteObjectWithCache("update", "007", {Id:"007", Name:"JamesBond", Mission:"TopSecret2"}, ["Name", "Mission"], cache, false);
    })
    .then(function(data) {
        console.log("## Checking data returned by sync call");
        assertContains(data, {Id:"007", Name:"JamesBond", Mission:"TopSecret2"});
        checkLocalFlags(data, false, false, false, false);

        console.log("## Checking underlying cache");
        return cache.retrieve(data.Id);
    })
    .then(function(data) {
        console.log("## Checking data returned from cache");
        assertContains(data, {Id:"007", Name:"JamesBond", Mission:"TopSecret2"});
        checkLocalFlags(data, false, false, false, false);

        console.log("## Trying an update with only a subset of existing attributes provided");
        return Force.syncRemoteObjectWithCache("update", "007", {Name:"JamesBond3", Mission:"TopSecret3"}, ["Mission"], cache, false);
    })
    .then(function(data) {
        console.log("## Checking data returned by sync call");
        assertContains(data, {Id:"007", Name:"JamesBond", Mission:"TopSecret3"});
        checkLocalFlags(data, false, false, false, false);

        console.log("## Checking underlying cache");
        return cache.retrieve(data.Id);
    })
    .then(function(data) {
        console.log("## Checking data returned from cache");
        assertContains(data, {Id:"007", Name:"JamesBond", Mission:"TopSecret3"});
        checkLocalFlags(data, false, false, false, false);

        console.log("## Trying an update with null fieldlist");
        return Force.syncRemoteObjectWithCache("update", "007", {Name:"JamesBond4", Mission:"TopSecret4"}, null, cache, false);
    })
    .then(function(data) {
        console.log("## Checking data returned by sync call");
        assertContains(data, {Id:"007", Name:"JamesBond4", Mission:"TopSecret4"});
        checkLocalFlags(data, false, false, false, false);

        console.log("## Checking underlying cache");
        return cache.retrieve(data.Id);
    })
    .then(function(data) {
        console.log("## Checking data returned from cache");
        assertContains(data, {Id:"007", Name:"JamesBond4", Mission:"TopSecret4"});
        checkLocalFlags(data, false, false, false, false);

        console.log("## Cleaning up");
        return Force.smartstoreClient.removeSoup(self.defaultStoreConfig,soupName);
    })
    .then(function() {
        self.finalizeTest();
    });

}

/**
 * TEST Force.syncRemoteObjectWithCache for delete method
 */
SmartSyncTestSuite.prototype.testSyncRemoteObjectWithCacheDelete = function() {
    console.log("# In SmartSyncTestSuite." + this.module.currentTestName);
    var self = this;
    var soupName = "soupFor_" + this.module.currentTestName; 
    var cache;

    Force.smartstoreClient.removeSoup(self.defaultStoreConfig,soupName)
    .then(function() {
        console.log("## Initialization of StoreCache");
        cache = new Force.StoreCache(soupName,null,null,self.defaultStoreConfig.isGlobalStore,self.defaultStoreConfig.storeName);
        return cache.init();
    })
    .then(function() {
        console.log("## Direct upsert in underlying soup");
        var records = [{Id:"007", Name:"JamesBond"},{Id:"008", Name:"Agent008"}, {Id:"009", Name:"JamesOther"}];
        return cache.saveAll(records);
    })
    .then(function(records) {
        console.log("## Trying delete for existing record");
        return Force.syncRemoteObjectWithCache("delete", "007", null, null, cache);
    })
    .then(function(data) {
        console.log("## Checking data returned by sync call");
        QUnit.equals(data, null, "No data should have been returned");

        console.log("## Checking underlying cache");
        return cache.retrieve("007");
    })
    .then(function(data) {
        console.log("## Checking data returned from cache");
        QUnit.equals(data, null, "No data should have been returned");

        console.log("## Trying local delete");
        return Force.syncRemoteObjectWithCache("delete", "008", null, null, cache, true);
    })
    .then(function(data) {
        console.log("## Checking data returned by sync call");
        QUnit.equals(data, null, "No data should have been returned");

        console.log("## Checking underlying cache");
        return cache.retrieve("008");
    })
    .then(function(data) {
        console.log("## Checking data returned from cache");
        assertContains(data, {Id:"008", Name:"Agent008"});
        checkLocalFlags(data, true, false, false, true);

        console.log("## Trying delete for non-existing record");
        return Force.syncRemoteObjectWithCache("delete", "010", null, null, cache);
    })
    .then(function(data) {
        console.log("## Checking data returned by sync call");
        QUnit.equals(data, null, "No data should have been returned");

        console.log("## Cleaning up");
        return Force.smartstoreClient.removeSoup(self.defaultStoreConfig,soupName);
    })
    .then(function() {
        self.finalizeTest();
    });
}

//-------------------------------------------------------------------------------------------------------
//
// Tests for Force.syncSObjectWithServer
//
//-------------------------------------------------------------------------------------------------------

/**
 * TEST Force.syncSObjectWithServer for create method
 */
SmartSyncTestSuite.prototype.testSyncSObjectWithServerCreate = function() {
    console.log("# In SmartSyncTestSuite." + this.module.currentTestName);
    var self = this;
    var id;

    console.log("## Trying create");
    Force.syncSObjectWithServer("create", "Account", null, {Name:"TestAccount"}, ["Name"])
    .then(function(data) {
        console.log("## Checking data returned by sync call");
        id = data.Id;
        assertContains(data, {Name:"TestAccount"});

        console.log("## Direct retrieve from server");
        return Force.forceJsClient.retrieve("Account", id, ["Id", "Name"]);
    })
    .then(function(data) {
        console.log("## Checking data returned from server");
        assertContains(data, {Id:id, Name:"TestAccount"});

        console.log("## Cleaning up");
        return Force.forceJsClient.del("account", id);
    })
    .then(function() {
        self.finalizeTest();
    });

}

/**
 * TEST Force.syncSObjectWithServer for read method
 */
SmartSyncTestSuite.prototype.testSyncSObjectWithServerRead = function() {
    console.log("# In SmartSyncTestSuite." + this.module.currentTestName);
    var self = this;
    var id;

    console.log("## Direct creation against server");
    Force.forceJsClient.create("Account", {Name:"TestAccount"})
        .then(function(resp) {
            id = resp.id;

            console.log("## Trying read call");
            return Force.syncSObjectWithServer("read", "Account", id, null, ["Id", "Name"]);
        })
        .then(function(data) {
            console.log("## Checking data returned from sync call");
            assertContains(data, {Id:id, Name:"TestAccount"});

            console.log("## Cleaning up");
            return Force.forceJsClient.del("account", id);
        })
        .then(function() {
            self.finalizeTest();
        });
};

/**
 * TEST Force.syncSObjectWithServer for update method
 */
SmartSyncTestSuite.prototype.testSyncSObjectWithServerUpdate = function() {
    console.log("# In SmartSyncTestSuite." + this.module.currentTestName);
    var self = this;
    var id;

    console.log("## Direct creation against server");
    Force.forceJsClient.create("Account", {Name:"TestAccount"})
        .then(function(resp) {
            id = resp.id;

            console.log("## Trying update call");
            return Force.syncSObjectWithServer("update", "Account", id, {Name:"TestAccount2"}, ["Name"]);
        })
        .then(function(data) {
            console.log("## Checking data returned from sync call");
            assertContains(data, {Name:"TestAccount2"});

            console.log("## Direct retrieve from server");
            return Force.forceJsClient.retrieve("Account", id, ["Id", "Name"]);
        })
        .then(function(data) {
            console.log("## Checking data returned from server");
            assertContains(data, {Id:id, Name:"TestAccount2"});

            console.log("## Cleaning up");
            return Force.forceJsClient.del("account", id);
        })
        .then(function() {
            self.finalizeTest();
        });
};

/**
 * TEST Force.syncSObjectWithServer for delete method
 */
SmartSyncTestSuite.prototype.testSyncSObjectWithServerDelete = function() {
    console.log("# In SmartSyncTestSuite." + this.module.currentTestName);
    var self = this;
    var id;

    console.log("## Direct creation against server");
    Force.forceJsClient.create("Account", {Name:"TestAccount"})
        .then(function(resp) {
            id = resp.id;

            console.log("## Trying delete call");
            return Force.syncSObjectWithServer("delete", "Account", id);
        })
        .then(function(data) {
            QUnit.equals(data, null, "Expected null");
            return checkServer(id, null);
        })
        .then(function() {
            self.finalizeTest();
        });
};


//-------------------------------------------------------------------------------------------------------
//
// Tests for Force.syncSObject
//
//-------------------------------------------------------------------------------------------------------

/**
 * TEST Force.syncSObject for method create
 */
SmartSyncTestSuite.prototype.testSyncSObjectCreate = function() {
    console.log("# In SmartSyncTestSuite." + this.module.currentTestName);
    var self = this;

    var cache;
    var soupName = "soupFor_" + this.module.currentTestName; 
    var id, id2;

    Force.smartstoreClient.removeSoup(self.defaultStoreConfig,soupName)
        .then(function() {
            console.log("## Initialization of StoreCache");
            cache = new Force.StoreCache(soupName,null,null,self.defaultStoreConfig.isGlobalStore,self.defaultStoreConfig.storeName);
            return cache.init();
        })
        .then(function() {
            console.log("## Trying create server-only");
            return Force.syncSObject("create", "Account", null, {Name:"TestAccount"}, ["Name"], cache, Force.CACHE_MODE.SERVER_ONLY);
        })
        .then(function(data) {
            id = data.Id;
            return checkResultServerAndCaches(data, {Name:"TestAccount"}, id, {Id:id, Name:"TestAccount"}, null, cache);
        })
        .then(function() {
            console.log("## Trying create server-first");
            return Force.syncSObject("create", "Account", null, {Name:"TestAccount2"}, ["Name"], cache, Force.CACHE_MODE.SERVER_FIRST);
        })
        .then(function(data) {
            id2 = data.Id;
            return checkResultServerAndCaches(data, {Id:id2, Name:"TestAccount2"}, id2, {Id:id2, Name:"TestAccount2"}, {Id:id2, Name:"TestAccount2"}, cache);
        })
        .then(function() {
            console.log("## Trying create cache-only");
            return Force.syncSObject("create", "Account", null, {Name:"TestAccount3"}, ["Name"], cache, Force.CACHE_MODE.CACHE_ONLY);
        })
        .then(function(data) {
            var localId = data.Id;
            return checkResultServerAndCaches(data, {Id:localId, Name:"TestAccount3"}, localId, null, {Id:localId, Name:"TestAccount3"}, cache);
        })
        .then(function() {
            console.log("## Cleaning up");
            return Promise.all([Force.forceJsClient.del("account", id), Force.forceJsClient.del("account", id2), Force.smartstoreClient.removeSoup(soupName)]);
        })
        .then(function() {
            self.finalizeTest();
        });
};

/**
 * TEST Force.syncSObject for method retrieve
 */
SmartSyncTestSuite.prototype.testSyncSObjectRetrieve = function() {
    console.log("# In SmartSyncTestSuite." + this.module.currentTestName);
    var self = this;

    var cache;
    var soupName = "soupFor_" + this.module.currentTestName; 
    var id;
    var id2;

    Force.smartstoreClient.removeSoup(soupName)
        .then(function() {
            console.log("## Initialization of StoreCache");
            cache = new Force.StoreCache(soupName,null,null,self.defaultStoreConfig.isGlobalStore,self.defaultStoreConfig.storeName);
            return cache.init();
        })
        .then(function() {
            console.log("## Direct creation against server");
            return Force.forceJsClient.create("Account", {Name:"TestAccount"});
        })
        .then(function(resp) {
            id = resp.id;

            console.log("## Direct creation against cache");
            return cache.save({Id:id, Name:"TestAccount-local"});
        })
        .then(function() {
            console.log("## Trying retrieve server-only");
            return Force.syncSObject("read", "Account", id, null, ["Name"], cache, Force.CACHE_MODE.SERVER_ONLY);
        })
        .then(function(data) {
            return checkResultServerAndCaches(data, {Name:"TestAccount"}, id, {Id:id, Name:"TestAccount"}, {Id:id, Name:"TestAccount-local"}, cache);
        })
        .then(function() {
            console.log("## Trying retrieve cache-only");
            /* Try fetching more fields than they are present in store cache. CACHE_ONLY mode should should return the result. */
            return Force.syncSObject("read", "Account", id, null, ["Name", "Website"], cache, Force.CACHE_MODE.CACHE_ONLY);
        })
        .then(function(data) {
            return checkResultServerAndCaches(data, {Name:"TestAccount-local"}, id, {Id:id, Name:"TestAccount"}, {Id:id, Name:"TestAccount-local"}, cache);
        })
        .then(function() {
            console.log("## Trying retrieve server-first");
            return Force.syncSObject("read", "Account", id, null, ["Name"], cache, Force.CACHE_MODE.SERVER_FIRST);
        })
        .then(function(data) {
            return checkResultServerAndCaches(data, {Name:"TestAccount"}, id, {Id:id, Name:"TestAccount"}, {Id:id, Name:"TestAccount"}, cache);
        })
        .then(function() {
            console.log("## Direct update of cache");
            return cache.save({Id:id, Name:"TestAccount-local-again"});
        })
        .then(function() {
            console.log("## Trying retrieve cache-first when data is in the cache");
            return Force.syncSObject("read", "Account", id, null, ["Name"], cache, Force.CACHE_MODE.CACHE_FIRST);
        })
        .then(function(data) {
            return checkResultServerAndCaches(data, {Name:"TestAccount-local-again"}, id, {Id:id, Name:"TestAccount"}, {Id:id, Name:"TestAccount-local-again"}, cache);
        })
        .then(function() {
            console.log("## Direct creation against server");
            return Force.forceJsClient.create("Account", {Name:"TestAccount2"});
        })
        .then(function(resp) {
            id2 = resp.id;

            console.log("## Trying retrieve cache-first when data is not in the cache");
            return Force.syncSObject("read", "Account", id2, null, ["Name"], cache, Force.CACHE_MODE.CACHE_FIRST);
        })
        .then(function(data) {
            return checkResultServerAndCaches(data, {Name:"TestAccount2"}, id2, {Id:id2, Name:"TestAccount2"}, {Id:id2, Name:"TestAccount2"}, cache);
        })
        .then(function() {
            console.log("## Cleaning up");
            return Promise.all([Force.forceJsClient.del("account", id), Force.forceJsClient.del("account", id2), Force.smartstoreClient.removeSoup(soupName)]);
        })
        .then(function() {
            self.finalizeTest();
        });
};

/**
 * TEST Force.syncSObject for method update
 */
SmartSyncTestSuite.prototype.testSyncSObjectUpdate = function() {
    console.log("# In SmartSyncTestSuite." + this.module.currentTestName);
    var self = this;
    var cache;
    var soupName = "soupFor_" + this.module.currentTestName; 
    var id;

    Force.smartstoreClient.removeSoup(self.defaultStoreConfig,soupName)
        .then(function() {
            console.log("## Initialization of StoreCache");
            cache = new Force.StoreCache(soupName,null,null,self.defaultStoreConfig.isGlobalStore,self.defaultStoreConfig.storeName);
            return cache.init();
        })
        .then(function() {
            console.log("## Direct creation against server");
            return Force.forceJsClient.create("Account", {Name:"TestAccount"});
        })
        .then(function(data) {
            id = data.id;

            console.log("## Trying update server-only");
            return Force.syncSObject("update", "Account", id, {Name:"TestAccount-updated"}, ["Name"], cache, Force.CACHE_MODE.SERVER_ONLY);
        })
        .then(function(data) {
            return checkResultServerAndCaches(data, {Name:"TestAccount-updated"}, id, {Id:id, Name:"TestAccount-updated"}, null, cache);
        })
        .then(function() {
            console.log("## Direct insertion in cache");
            return cache.save({Id:id, Name:"TestAccount-updated"});
        })
        .then(function(data) {
            console.log("## Trying update cache-only");
            return Force.syncSObject("update", "Account", id, {Name:"TestAccount-updated2", Website:"www.account.com"}, ["Name"], cache, Force.CACHE_MODE.CACHE_ONLY);
        })
        .then(function(data) {
             QUnit.equals(_.has(data, "Website"), false, "Should not contain field Website");
            return checkResultServerAndCaches(data, {Name:"TestAccount-updated2"}, id, {Id:id, Name:"TestAccount-updated"},  {Id:id, Name:"TestAccount-updated2"}, cache);
        })
        .then(function() {
            console.log("## Trying update server-first");
            return Force.syncSObject("update", "Account", id, {Name:"TestAccount-updated4"}, ["Name"], cache, Force.CACHE_MODE.SERVER_FIRST);
        })
        .then(function(data) {
            return checkResultServerAndCaches(data, {Name:"TestAccount-updated4"}, id, {Id:id, Name:"TestAccount-updated4"},  {Id:id, Name:"TestAccount-updated4"}, cache);
        })
        .then(function() {
            console.log("## Cleaning up");
            return Promise.all([Force.forceJsClient.del("account", id), Force.smartstoreClient.removeSoup(soupName)]);
        })
        .then(function() {
            self.finalizeTest();
        });
};

/**
 * TEST Force.syncSObject for method delete
 */
SmartSyncTestSuite.prototype.testSyncSObjectDelete = function() {
    console.log("# In SmartSyncTestSuite." + this.module.currentTestName);
    var self = this;
    var cache;
    var soupName = "soupFor_" + this.module.currentTestName; 
    var id, id2;

    Force.smartstoreClient.removeSoup(self.defaultStoreConfig,soupName)
        .then(function() {
            console.log("## Initialization of StoreCache");
            cache = new Force.StoreCache(soupName,null,null,self.defaultStoreConfig.isGlobalStore,self.defaultStoreConfig.storeName);
            return cache.init();
        })
        .then(function() {
            console.log("## Direct creation against server");
            return Force.forceJsClient.create("Account", {Name:"TestAccount"});
        })
        .then(function(data) {
            id = data.id;
            console.log("## Trying delete server-only");
            return Force.syncSObject("delete", "Account", id, null, null, cache, Force.CACHE_MODE.SERVER_ONLY);
        })
        .then(function(data) {
            return checkResultServerAndCaches(data, null, id, null, null, cache);
        })
        .then(function() {
            console.log("## Direct creation against server");
            return Force.forceJsClient.create("Account", {Name:"TestAccount"});
        })
        .then(function(data) {
            id2 = data.id;
            console.log("## Direct insertion in cache");
            return cache.save({Id:id2, Name:"TestAccount"});
        })
        .then(function(data) {
            console.log("## Trying delete cache-only");
            return Force.syncSObject("delete", "Account", id2, null, null, cache, Force.CACHE_MODE.CACHE_ONLY);
        })
        .then(function(data) {
            return checkResultServerAndCaches(data, null, id2, {Id:id2, Name:"TestAccount"}, {Id:id2, Name:"TestAccount", __locally_deleted__:true}, cache);
        })
        .then(function() {
            console.log("## Trying delete server-first");
            return Force.syncSObject("delete", "Account", id2, null, null, cache, Force.CACHE_MODE.SERVER_FIRST);
        })
        .then(function(data) {
            return checkResultServerAndCaches(data, null, id2, null, null, cache);
        })
        .then(function() {
            console.log("## Cleaning up");
            return Force.smartstoreClient.removeSoup(soupName);
        })
        .then(function() {
            self.finalizeTest();
        });
};

//-------------------------------------------------------------------------------------------------------
//
// Tests for Force.syncSObjectDetectConflict
//
//-------------------------------------------------------------------------------------------------------

/**
 * TEST Force.syncSObjectDetectConflict for method create
 */
SmartSyncTestSuite.prototype.testSyncSObjectDetectConflictCreate = function() {
    console.log("# In SmartSyncTestSuite." + this.module.currentTestName);
    var self = this;

    var cache, cacheForOriginals;
    var soupName = "soupFor_" + this.module.currentTestName; 
    var soupNameForOriginals = "originalsFor" + soupName;
    var id, id2;

    Promise.all([Force.smartstoreClient.removeSoup(self.defaultStoreConfig,soupName), Force.smartstoreClient.removeSoup(self.defaultStoreConfig,soupNameForOriginals)])
        .then(function() {
            console.log("## Initialization of StoreCaches");
            cache = new Force.StoreCache(soupName,null,null,self.defaultStoreConfig.isGlobalStore,self.defaultStoreConfig.storeName);
            cacheForOriginals = new Force.StoreCache(soupNameForOriginals,null,null,self.defaultStoreConfig.isGlobalStore,self.defaultStoreConfig.storeName);
            return Promise.all([cache.init(), cacheForOriginals.init()]);
        })
        .then(function() {
            console.log("## Trying create server-only");
            return Force.syncSObjectDetectConflict("create", "Account", null, {Name:"TestAccount"}, ["Name"], cache, Force.CACHE_MODE.SERVER_ONLY, cacheForOriginals);
        })
        .then(function(data) {
            id = data.Id;
            return checkResultServerAndCaches(data, {Name:"TestAccount"}, id, {Id:id, Name:"TestAccount"}, null, cache, {Id:id, Name:"TestAccount"}, cacheForOriginals);
        })
        .then(function() {
            console.log("## Trying create server-first");
            return Force.syncSObjectDetectConflict("create", "Account", null, {Name:"TestAccount2"}, ["Name"], cache, Force.CACHE_MODE.SERVER_FIRST, cacheForOriginals);
        })
        .then(function(data) {
            id2 = data.Id;
            return checkResultServerAndCaches(data, {Id:id2, Name:"TestAccount2"}, id2, {Id:id2, Name:"TestAccount2"}, {Id:id2, Name:"TestAccount2"}, cache, {Id:id2, Name:"TestAccount2"}, cacheForOriginals);
        })
        .then(function() {
            console.log("## Trying create cache-only");
            return Force.syncSObjectDetectConflict("create", "Account", null, {Name:"TestAccount3"}, ["Name"], cache, Force.CACHE_MODE.CACHE_ONLY, cacheForOriginals);
        })
        .then(function(data) {
            var localId = data.Id;
            return checkResultServerAndCaches(data, {Id:localId, Name:"TestAccount3"}, localId, null, {Id:localId, Name:"TestAccount3"}, cache, null, cacheForOriginals);
        })
        .then(function(data) {
            console.log("## Cleaning up");
            return Promise.all([Force.forceJsClient.del("account", id),
                                Force.smartstoreClient.removeSoup(soupName),
                                Force.smartstoreClient.removeSoup(soupNameForOriginals),
                                Force.forceJsClient.del("account", id2),
                                Force.smartstoreClient.removeSoup(soupName),
                                Force.smartstoreClient.removeSoup(soupNameForOriginals)]);

        })
        .then(function() {
            self.finalizeTest();
        });
};

/**
 * TEST Force.syncSObjectDetectConflict for method retrieve
 */
SmartSyncTestSuite.prototype.testSyncSObjectDetectConflictRetrieve = function() {
    console.log("# In SmartSyncTestSuite." + this.module.currentTestName);
    var self = this;

    var cache, cacheForOriginals;
    var soupName = "soupFor_" + this.module.currentTestName; 
    var soupNameForOriginals = "originalsFor" + soupName;
    var id, id2;

    Promise.all([Force.smartstoreClient.removeSoup(self.defaultStoreConfig,soupName), Force.smartstoreClient.removeSoup(self.defaultStoreConfig,soupNameForOriginals)])
        .then(function() {
            console.log("## Initialization of StoreCaches");
            cache = new Force.StoreCache(soupName,null,null,self.defaultStoreConfig.isGlobalStore,self.defaultStoreConfig.storeName);
            cacheForOriginals = new Force.StoreCache(soupNameForOriginals,null,null,self.defaultStoreConfig.isGlobalStore,self.defaultStoreConfig.storeName);
            return Promise.all([cache.init(), cacheForOriginals.init()]);
        })
        .then(function() {
            console.log("## Direct creation against server");
            return Force.forceJsClient.create("Account", {Name:"TestAccount"});
        })
        .then(function(resp) {
            id = resp.id;

            console.log("## Direct creation against cache");
            return cache.save({Id:id, Name:"TestAccount-local"});
        })
        .then(function() {
            console.log("## Trying retrieve server-only");
            return Force.syncSObjectDetectConflict("read", "Account", id, null, ["Name"], cache, Force.CACHE_MODE.SERVER_ONLY, cacheForOriginals);
        })
        .then(function(data) {
            return checkResultServerAndCaches(data, {Name:"TestAccount"}, id, {Id:id, Name:"TestAccount"}, {Id:id, Name:"TestAccount-local"}, cache, {Id:id, Name:"TestAccount"}, cacheForOriginals);
        })
        .then(function() {
            console.log("## Trying retrieve cache-only");
            return Force.syncSObjectDetectConflict("read", "Account", id, null, ["Name"], cache, Force.CACHE_MODE.CACHE_ONLY, cacheForOriginals);
        })
        .then(function(data) {
            return checkResultServerAndCaches(data, {Name:"TestAccount-local"}, id, {Id:id, Name:"TestAccount"}, {Id:id, Name:"TestAccount-local"}, cache, {Id:id, Name:"TestAccount"}, cacheForOriginals);
        })
        .then(function() {
            console.log("## Trying retrieve server-first");
            return Force.syncSObjectDetectConflict("read", "Account", id, null, ["Name"], cache, Force.CACHE_MODE.SERVER_FIRST, cacheForOriginals);
        })
        .then(function(data) {
            return checkResultServerAndCaches(data, {Name:"TestAccount"}, id, {Id:id, Name:"TestAccount"}, {Id:id, Name:"TestAccount"}, cache, {Id:id, Name:"TestAccount"}, cacheForOriginals);
        })
        .then(function() {
            console.log("## Direct update of cache");
            return cache.save({Id:id, Name:"TestAccount-local-again"});
        })
        .then(function() {
            console.log("## Trying retrieve cache-first when data is in the cache");
            return Force.syncSObjectDetectConflict("read", "Account", id, null, ["Name"], cache, Force.CACHE_MODE.CACHE_FIRST, cacheForOriginals);
        })
        .then(function(data) {
            // XXX broken for now - data is written back to cacheForOriginals even though it was read from cache
            return checkResultServerAndCaches(data, {Name:"TestAccount-local-again"}, id, {Id:id, Name:"TestAccount"}, {Id:id, Name:"TestAccount-local-again"}, cache, {Id:id, Name:"TestAccount"}, cacheForOriginals);
        })
        .then(function() {
            console.log("## Direct creation against server");
            return Force.forceJsClient.create("Account", {Name:"TestAccount2"});
        })
        .then(function(resp) {
            id2 = resp.id;

            console.log("## Trying retrieve cache-first when data is not in the cache");
            return Force.syncSObjectDetectConflict("read", "Account", id2, null, ["Name"], cache, Force.CACHE_MODE.CACHE_FIRST, cacheForOriginals);
        })
        .then(function(data) {
            return checkResultServerAndCaches(data, {Name:"TestAccount2"}, id2, {Id:id2, Name:"TestAccount2"}, {Id:id2, Name:"TestAccount2"}, cache, {Id:id2, Name:"TestAccount2"}, cacheForOriginals);
        })
        .then(function() {
            console.log("## Cleaning up");
            return Promise.all([Force.forceJsClient.del("account", id),
                                Force.forceJsClient.del("account", id2),
                                Force.smartstoreClient.removeSoup(soupName),
                                Force.smartstoreClient.removeSoup(soupNameForOriginals)]);
        })
        .then(function() {
            self.finalizeTest();
        });
};

/**
 * TEST Force.syncSObjectDetectConflict for method update
 */
SmartSyncTestSuite.prototype.testSyncSObjectDetectConflictUpdate = function() {
    console.log("# In SmartSyncTestSuite." + this.module.currentTestName);
    var self = this;
    var cache, cacheForOriginals;
    var soupName = "soupFor_" + this.module.currentTestName; 
    var soupNameForOriginals = "originalsFor" + soupName;
    var id;

    Promise.all([Force.smartstoreClient.removeSoup(self.defaultStoreConfig,soupName), Force.smartstoreClient.removeSoup(self.defaultStoreConfig,soupNameForOriginals)])
        .then(function() {
            console.log("## Initialization of StoreCaches");
            cache = new Force.StoreCache(soupName,null,null,self.defaultStoreConfig.isGlobalStore,self.defaultStoreConfig.storeName);
            cacheForOriginals = new Force.StoreCache(soupNameForOriginals,null,null,self.defaultStoreConfig.isGlobalStore,self.defaultStoreConfig.storeName);
            return Promise.all([cache.init(), cacheForOriginals.init()]);
        })
        .then(function() {
            console.log("## Direct creation against server");
            return Force.forceJsClient.create("Account", {Name:"TestAccount"});
        })
        .then(function(data) {
            id = data.id;
            console.log("## Trying update server-only");
            return Force.syncSObjectDetectConflict("update", "Account", id, {Id: id, Name:"TestAccount-2"}, ["Name"], cache, Force.CACHE_MODE.SERVER_ONLY, cacheForOriginals);
        })
        .then(function(data) {
            return checkResultServerAndCaches(data, {Id:id, Name:"TestAccount-2"}, id, {Id:id, Name:"TestAccount-2"}, null, cache, {Id:id, Name:"TestAccount-2"}, cacheForOriginals);
        })
        .then(function() {
            console.log("## Trying update cache-only");
            return Force.syncSObjectDetectConflict("update", "Account", id, {Name:"TestAccount-3"}, ["Name"], cache, Force.CACHE_MODE.CACHE_ONLY, cacheForOriginals);
        })
        .then(function(data) {
            return checkResultServerAndCaches(data, {Id:id, Name:"TestAccount-3"}, id, {Id:id, Name:"TestAccount-2"}, {Id:id, Name:"TestAccount-3"}, cache, {Id:id, Name:"TestAccount-2"}, cacheForOriginals);
        })
        .then(function() {
            console.log("## Trying update server-first");
            return Force.syncSObjectDetectConflict("update", "Account", id, {Name:"TestAccount-4"}, ["Name"], cache, Force.CACHE_MODE.SERVER_FIRST, cacheForOriginals);
        })
        .then(function(data) {
            return checkResultServerAndCaches(data, {Id:id, Name:"TestAccount-4"}, id, {Id:id, Name:"TestAccount-4"}, {Id:id, Name:"TestAccount-4"}, cache, {Id:id, Name:"TestAccount-4"}, cacheForOriginals);
        })
        .then(function() {
            var theirs = {Name:"TestAccount-1", Industry:"Computer-0", Phone:"Phone-0"};
            var base = {Name:"TestAccount-0", Industry:"Computer-0", Phone:"Phone-0"};
            var yours = base;
            return tryConflictDetection("with only remote change",
                                        cache, cacheForOriginals, theirs, yours, base, "delete", ["Name", "Industry", "Phone"], Force.CACHE_MODE.SERVER_FIRST, Force.MERGE_MODE.MERGE_FAIL_IF_CHANGED,
                                        {success: false, result: {localChanges:[], remoteChanges:["Name"], conflictingChanges:[], base:base, yours:yours, theirs:theirs}},
                                        true);
        })
        .then(function() {
            var theirs = {Name:"TestAccount-1", Industry:"Computer-0", Phone:"Phone-0"};
            var base = {Name:"TestAccount-0", Industry:"Computer-0", Phone:"Phone-0"};
            var yours = base;
            var after = {Name:"TestAccount-1", Industry:"Computer-0", Phone:"Phone-0"};
            return tryConflictDetection("with only remote change",
                                        cache, cacheForOriginals, theirs, yours, base, "update", ["Name", "Industry", "Phone"], Force.CACHE_MODE.SERVER_FIRST, Force.MERGE_MODE.MERGE_FAIL_IF_CONFLICT,
                                        {success: true, result: after},
                                        true,
                                        after, after, after);
        })
        .then(function() {
            var theirs = {Name:"TestAccount-1", Industry:"Computer-0", Phone:"Phone-0"};
            var base = {Name:"TestAccount-0", Industry:"Computer-0", Phone:"Phone-0"};
            var yours = base;
            var after = {Name:"TestAccount-1", Industry:"Computer-0", Phone:"Phone-0"};
            return tryConflictDetection("with only remote change",
                                        cache, cacheForOriginals, theirs, yours, base, "update", ["Name", "Industry", "Phone"], Force.CACHE_MODE.SERVER_FIRST, Force.MERGE_MODE.MERGE_ACCEPT_YOURS,
                                        {success: true, result: after},
                                        true,
                                        after, after, after);
        })
        .then(function() {
            var theirs = {Name:"TestAccount-1", Industry:"Computer-0", Phone:"Phone-0"};
            var base = {Name:"TestAccount-0", Industry:"Computer-0", Phone:"Phone-0"};
            var yours = base;
            var after = {Name:"TestAccount-0", Industry:"Computer-0", Phone:"Phone-0"};
            return tryConflictDetection("with only remote change",
                                        cache, cacheForOriginals, theirs, yours, base, "update", ["Name", "Industry", "Phone"], Force.CACHE_MODE.SERVER_FIRST, Force.MERGE_MODE.OVERWRITE,
                                        {success: true, result: after},
                                        true,
                                        after, after, after);
        })
        .then(function() {
            var theirs = {Name:"TestAccount-0", Industry:"Computer-1", Phone:"Phone-0"};
            var base = {Name:"TestAccount-0", Industry:"Computer-0", Phone:"Phone-0"};
            var yours = {Name: "TestAccount-0", Industry:"Computer-0", Phone:"Phone-1"};
            return tryConflictDetection("with non-conflicting changes",
                                        cache, cacheForOriginals, theirs, yours, base, "update", ["Name", "Industry", "Phone"], Force.CACHE_MODE.SERVER_FIRST, Force.MERGE_MODE.MERGE_FAIL_IF_CHANGED,
                                        {success: false, result: {localChanges:["Phone"], remoteChanges:["Industry"], conflictingChanges:[], base:base, yours:yours, theirs:theirs}},
                                        true);
        })
        .then(function() {
            var theirs = {Name:"TestAccount-0", Industry:"Computer-1", Phone:"Phone-0"};
            var base = {Name:"TestAccount-0", Industry:"Computer-0", Phone:"Phone-0"};
            var yours = {Name: "TestAccount-0", Industry:"Computer-0", Phone:"Phone-1"};
            var after = {Name: "TestAccount-0", Industry:"Computer-1", Phone:"Phone-1"};
            return tryConflictDetection("with non-conflicting changes",
                                        cache, cacheForOriginals, theirs, yours, base, "update", ["Name", "Industry", "Phone"], Force.CACHE_MODE.SERVER_FIRST, Force.MERGE_MODE.MERGE_FAIL_IF_CONFLICT,
                                        {success: true, result: after},
                                        true,
                                        after, after, after);
        })
        .then(function() {
            var theirs = {Name:"TestAccount-0", Industry:"Computer-1", Phone:"Phone-0"};
            var base = {Name:"TestAccount-0", Industry:"Computer-0", Phone:"Phone-0"};
            var yours = {Name: "TestAccount-0", Industry:"Computer-0", Phone:"Phone-1"};
            var after = {Name: "TestAccount-0", Industry:"Computer-1", Phone:"Phone-1"};
            return tryConflictDetection("with non-conflicting changes",
                                        cache, cacheForOriginals, theirs, yours, base, "update", ["Name", "Industry", "Phone"], Force.CACHE_MODE.SERVER_FIRST, Force.MERGE_MODE.MERGE_ACCEPT_YOURS,
                                        {success: true, result: after},
                                        true,
                                        after, after, after);
        })
        .then(function() {
            var theirs = {Name:"TestAccount-0", Industry:"Computer-1", Phone:"Phone-0"};
            var base = {Name:"TestAccount-0", Industry:"Computer-0", Phone:"Phone-0"};
            var yours = {Name: "TestAccount-0", Industry:"Computer-0", Phone:"Phone-1"};
            var after = {Name: "TestAccount-0", Industry:"Computer-0", Phone:"Phone-1"};
            return tryConflictDetection("with non-conflicting changes",
                                        cache, cacheForOriginals, theirs, yours, base, "update", ["Name", "Industry", "Phone"], Force.CACHE_MODE.SERVER_FIRST, Force.MERGE_MODE.OVERWRITE,
                                        {success: true, result: after},
                                        true,
                                        after, after, after);
        })
        .then(function() {
            var theirs = {Name:"TestAccount-b", Industry:"Computer-1", Phone:"Phone-0"};
            var base = {Name:"TestAccount-0", Industry:"Computer-0", Phone:"Phone-0"};
            var yours = {Name: "TestAccount-a", Industry:"Computer-0", Phone:"Phone-1"};
            return tryConflictDetection("with conflicting and non-conflicting changes",
                                        cache, cacheForOriginals, theirs, yours, base, "update", ["Name", "Industry", "Phone"], Force.CACHE_MODE.SERVER_FIRST, Force.MERGE_MODE.MERGE_FAIL_IF_CHANGED,
                                        {success: false, result: {localChanges:["Name", "Phone"], remoteChanges:["Name", "Industry"], conflictingChanges:["Name"], base:base, yours:yours, theirs:theirs}},
                                        true);
        })
        .then(function() {
            var theirs = {Name:"TestAccount-b", Industry:"Computer-1", Phone:"Phone-0"};
            var base = {Name:"TestAccount-0", Industry:"Computer-0", Phone:"Phone-0"};
            var yours = {Name: "TestAccount-a", Industry:"Computer-0", Phone:"Phone-1"};
            return tryConflictDetection("with conflicting and non-conflicting changes",
                                        cache, cacheForOriginals, theirs, yours, base, "update", ["Name", "Industry", "Phone"], Force.CACHE_MODE.SERVER_FIRST, Force.MERGE_MODE.MERGE_FAIL_IF_CONFLICT,
                                        {success: false, result: {localChanges:["Name", "Phone"], remoteChanges:["Name", "Industry"], conflictingChanges:["Name"], base:base, yours:yours, theirs:theirs}},
                                        true);
        })
        .then(function() {
            var theirs = {Name:"TestAccount-b", Industry:"Computer-1", Phone:"Phone-0"};
            var base = {Name:"TestAccount-0", Industry:"Computer-0", Phone:"Phone-0"};
            var yours = {Name: "TestAccount-a", Industry:"Computer-0", Phone:"Phone-1"};
            var after = {Name: "TestAccount-a", Industry:"Computer-1", Phone:"Phone-1"};
            return tryConflictDetection("with conflicting and non-conflicting changes",
                                        cache, cacheForOriginals, theirs, yours, base, "update", ["Name", "Industry", "Phone"], Force.CACHE_MODE.SERVER_FIRST, Force.MERGE_MODE.MERGE_ACCEPT_YOURS,
                                        {success: true, result: after},
                                        true,
                                        after, after, after);
        })
        .then(function() {
            var theirs = {Name:"TestAccount-b", Industry:"Computer-1", Phone:"Phone-0"};
            var base = {Name:"TestAccount-0", Industry:"Computer-0", Phone:"Phone-0"};
            var yours = {Name: "TestAccount-a", Industry:"Computer-0", Phone:"Phone-1"};
            var after = {Name: "TestAccount-a", Industry:"Computer-0", Phone:"Phone-1"};
            return tryConflictDetection("with conflicting and non-conflicting changes",
                                        cache, cacheForOriginals, theirs, yours, base, "update", ["Name", "Industry", "Phone"], Force.CACHE_MODE.SERVER_FIRST, Force.MERGE_MODE.OVERWRITE,
                                        {success: true, result: yours},
                                        true,
                                        after, after, after);
        })
        .then(function() {
            console.log("## Cleaning up");
            return Promise.all([Force.forceJsClient.del("account", id),
                                Force.smartstoreClient.removeSoup(soupName),
                                Force.smartstoreClient.removeSoup(soupNameForOriginals)]);
        })
        .then(function() {
            self.finalizeTest();
        });
};

/**
 * TEST Force.syncSObjectDetectConflict for method delete
 */
SmartSyncTestSuite.prototype.testSyncSObjectDetectConflictDelete = function() {
    console.log("# In SmartSyncTestSuite." + this.module.currentTestName);
    var self = this;
    var cache, cacheForOriginals;
    var soupName = "soupFor_" + this.module.currentTestName; 
    var soupNameForOriginals = "originalsFor" + soupName;
    var id, id2;

    Promise.all([Force.smartstoreClient.removeSoup(self.defaultStoreConfig,soupName), Force.smartstoreClient.removeSoup(self.defaultStoreConfig,soupNameForOriginals)])
        .then(function() {
            console.log("## Initialization of StoreCaches");
            cache = new Force.StoreCache(soupName,null,null,self.defaultStoreConfig.isGlobalStore,self.defaultStoreConfig.storeName);
            cacheForOriginals = new Force.StoreCache(soupNameForOriginals,null,null,self.defaultStoreConfig.isGlobalStore,self.defaultStoreConfig.storeName);
            return Promise.all([cache.init(), cacheForOriginals.init()]);
        })
        .then(function() {
            console.log("## Direct creation against server");
            return Force.forceJsClient.create("Account", {Name:"TestAccount"});
        })
        .then(function(data) {
            id = data.id;
            console.log("## Trying delete server-only");
            return Force.syncSObjectDetectConflict("delete", "Account", id, {Id:id, Name:"TestAccount"}, ["Name"], cache, Force.CACHE_MODE.SERVER_ONLY, cacheForOriginals);
        })
        .then(function(data) {
            return checkResultServerAndCaches(data, null, id, null, null, cache, null, cacheForOriginals);
        })
        .then(function() {
            console.log("## Direct creation against server");
            return Force.forceJsClient.create("Account", {Name:"TestAccount"});
        })
        .then(function(data) {
            id2 = data.id;
            console.log("## Direct insertion in cache");
            return cache.save({Id:id2, Name:"TestAccount"});
        })
        .then(function(data) {
            console.log("## Direct insertion in cacheForOriginals");
            return cacheForOriginals.save({Id:id2, Name:"TestAccount"});
        })
        .then(function(data) {
            console.log("## Trying delete cache-only");
            return Force.syncSObjectDetectConflict("delete", "Account", id2, {Id:id2, Name:"TestAccount"}, ["Name"], cache, Force.CACHE_MODE.CACHE_ONLY, cacheForOriginals);
        })
        .then(function(data) {
            return checkResultServerAndCaches(data, null, id2, {Id:id2, Name:"TestAccount"}, {Id:id2, Name:"TestAccount", __locally_deleted__:true}, cache, {Id:id2, Name:"TestAccount", __locally_deleted__:false}, cacheForOriginals);
        })
        .then(function() {
            console.log("## Trying delete server-first");
            return Force.syncSObjectDetectConflict("delete", "Account", id2, {Id:id, Name:"TestAccount"}, ["Name"], cache, Force.CACHE_MODE.SERVER_FIRST, cacheForOriginals);
        })
        .then(function(data) {
            return checkResultServerAndCaches(data, null, id2, null, null, cache, null, cacheForOriginals);
        })
        .then(function() {
            var theirs = {Name:"TestAccount-1", Industry:"Computer-0", Phone:"Phone-0"};
            var base = {Name:"TestAccount-0", Industry:"Computer-0", Phone:"Phone-0"};
            var yours = base;
            return tryConflictDetection("with only remote change",
                                        cache, cacheForOriginals, theirs, yours, base, "delete", ["Name", "Industry", "Phone"], Force.CACHE_MODE.SERVER_FIRST, Force.MERGE_MODE.MERGE_FAIL_IF_CHANGED,
                                        {success: false, result: {localChanges:[], remoteChanges:["Name"], conflictingChanges:[], base:base, yours:yours, theirs:theirs}},
                                        true);
        })
        .then(function() {
            var theirs = {Name:"TestAccount-1", Industry:"Computer-0", Phone:"Phone-0"};
            var base = {Name:"TestAccount-0", Industry:"Computer-0", Phone:"Phone-0"};
            var yours = base;
            return tryConflictDetection("with only remote change",
                                        cache, cacheForOriginals, theirs, yours, base, "delete", ["Name", "Industry", "Phone"], Force.CACHE_MODE.SERVER_FIRST, Force.MERGE_MODE.MERGE_FAIL_IF_CONFLICT,
                                        {success: true, result: null},
                                        false,
                                        null, null, null);
        })
        .then(function() {
            var theirs = {Name:"TestAccount-1", Industry:"Computer-0", Phone:"Phone-0"};
            var base = {Name:"TestAccount-0", Industry:"Computer-0", Phone:"Phone-0"};
            var yours = base;
            return tryConflictDetection("with only remote change",
                                        cache, cacheForOriginals, theirs, yours, base, "delete", ["Name", "Industry", "Phone"], Force.CACHE_MODE.SERVER_FIRST, Force.MERGE_MODE.MERGE_ACCEPT_YOURS,
                                        {success: true, result: null},
                                        false,
                                        null, null, null);
        })
        .then(function() {
            var theirs = {Name:"TestAccount-1", Industry:"Computer-0", Phone:"Phone-0"};
            var base = {Name:"TestAccount-0", Industry:"Computer-0", Phone:"Phone-0"};
            var yours = base;
            return tryConflictDetection("with only remote change",
                                        cache, cacheForOriginals, theirs, yours, base, "delete", ["Name", "Industry", "Phone"], Force.CACHE_MODE.SERVER_FIRST, Force.MERGE_MODE.OVERWRITE,
                                        {success: true, result: null},
                                        false,
                                        null, null, null);
        })
        .then(function() {
            var theirs = {Name:"TestAccount-0", Industry:"Computer-1", Phone:"Phone-0"};
            var base = {Name:"TestAccount-0", Industry:"Computer-0", Phone:"Phone-0"};
            var yours = {Name: "TestAccount-0", Industry:"Computer-0", Phone:"Phone-1"};
            return tryConflictDetection("with non-conflicting changes",
                                        cache, cacheForOriginals, theirs, yours, base, "delete", ["Name", "Industry", "Phone"], Force.CACHE_MODE.SERVER_FIRST, Force.MERGE_MODE.MERGE_FAIL_IF_CHANGED,
                                        {success: false, result: {localChanges:["Phone"], remoteChanges:["Industry"], conflictingChanges:[], base:base, yours:yours, theirs:theirs}},
                                        true);
        })
        .then(function() {
            var theirs = {Name:"TestAccount-0", Industry:"Computer-1", Phone:"Phone-0"};
            var base = {Name:"TestAccount-0", Industry:"Computer-0", Phone:"Phone-0"};
            var yours = {Name: "TestAccount-0", Industry:"Computer-0", Phone:"Phone-1"};
            return tryConflictDetection("with non-conflicting changes",
                                        cache, cacheForOriginals, theirs, yours, base, "delete", ["Name", "Industry", "Phone"], Force.CACHE_MODE.SERVER_FIRST, Force.MERGE_MODE.MERGE_FAIL_IF_CONFLICT,
                                        {success: true, result: null},
                                        false,
                                        null, null, null);
        })
        .then(function() {
            var theirs = {Name:"TestAccount-0", Industry:"Computer-1", Phone:"Phone-0"};
            var base = {Name:"TestAccount-0", Industry:"Computer-0", Phone:"Phone-0"};
            var yours = {Name: "TestAccount-0", Industry:"Computer-0", Phone:"Phone-1"};
            return tryConflictDetection("with non-conflicting changes",
                                        cache, cacheForOriginals, theirs, yours, base, "delete", ["Name", "Industry", "Phone"], Force.CACHE_MODE.SERVER_FIRST, Force.MERGE_MODE.MERGE_ACCEPT_YOURS,
                                        {success: true, result: null},
                                        false,
                                        null, null, null);
        })
        .then(function() {
            var theirs = {Name:"TestAccount-0", Industry:"Computer-1", Phone:"Phone-0"};
            var base = {Name:"TestAccount-0", Industry:"Computer-0", Phone:"Phone-0"};
            var yours = {Name: "TestAccount-0", Industry:"Computer-0", Phone:"Phone-1"};
            return tryConflictDetection("with non-conflicting changes",
                                        cache, cacheForOriginals, theirs, yours, base, "delete", ["Name", "Industry", "Phone"], Force.CACHE_MODE.SERVER_FIRST, Force.MERGE_MODE.OVERWRITE,
                                        {success: true, result: null},
                                        false,
                                        null, null, null);
        })
        .then(function() {
            var theirs = {Name:"TestAccount-b", Industry:"Computer-1", Phone:"Phone-0"};
            var base = {Name:"TestAccount-0", Industry:"Computer-0", Phone:"Phone-0"};
            var yours = {Name: "TestAccount-a", Industry:"Computer-0", Phone:"Phone-1"};
            return tryConflictDetection("with conflicting and non-conflicting changes",
                                        cache, cacheForOriginals, theirs, yours, base, "delete", ["Name", "Industry", "Phone"], Force.CACHE_MODE.SERVER_FIRST, Force.MERGE_MODE.MERGE_FAIL_IF_CHANGED,
                                        {success: false, result: {localChanges:["Name", "Phone"], remoteChanges:["Name", "Industry"], conflictingChanges:["Name"], base:base, yours:yours, theirs:theirs}},
                                        true);
        })
        .then(function() {
            var theirs = {Name:"TestAccount-b", Industry:"Computer-1", Phone:"Phone-0"};
            var base = {Name:"TestAccount-0", Industry:"Computer-0", Phone:"Phone-0"};
            var yours = {Name: "TestAccount-a", Industry:"Computer-0", Phone:"Phone-1"};
            return tryConflictDetection("with conflicting and non-conflicting changes",
                                        cache, cacheForOriginals, theirs, yours, base, "delete", ["Name", "Industry", "Phone"], Force.CACHE_MODE.SERVER_FIRST, Force.MERGE_MODE.MERGE_FAIL_IF_CONFLICT,
                                        {success: false, result: {localChanges:["Name", "Phone"], remoteChanges:["Name", "Industry"], conflictingChanges:["Name"], base:base, yours:yours, theirs:theirs}},
                                        true);
        })
        .then(function() {
            var theirs = {Name:"TestAccount-b", Industry:"Computer-1", Phone:"Phone-0"};
            var base = {Name:"TestAccount-0", Industry:"Computer-0", Phone:"Phone-0"};
            var yours = {Name: "TestAccount-a", Industry:"Computer-0", Phone:"Phone-1"};
            return tryConflictDetection("with conflicting and non-conflicting changes",
                                        cache, cacheForOriginals, theirs, yours, base, "delete", ["Name", "Industry", "Phone"], Force.CACHE_MODE.SERVER_FIRST, Force.MERGE_MODE.MERGE_ACCEPT_YOURS,
                                        {success: true, result: null},
                                        false,
                                        null, null, null);
        })
        .then(function() {
            var theirs = {Name:"TestAccount-b", Industry:"Computer-1", Phone:"Phone-0"};
            var base = {Name:"TestAccount-0", Industry:"Computer-0", Phone:"Phone-0"};
            var yours = {Name: "TestAccount-a", Industry:"Computer-0", Phone:"Phone-1"};
            return tryConflictDetection("with conflicting and non-conflicting changes",
                                        cache, cacheForOriginals, theirs, yours, base, "delete", ["Name", "Industry", "Phone"], Force.CACHE_MODE.SERVER_FIRST, Force.MERGE_MODE.OVERWRITE,
                                        {success: true, result: null},
                                        false,
                                        null, null, null);
        })
        .then(function() {
            console.log("## Cleaning up");
            return Promise.all([Force.smartstoreClient.removeSoup(soupName),
                                Force.smartstoreClient.removeSoup(soupNameForOriginals)]);
        })
        .then(function() {
            self.finalizeTest();
        });
};

//-------------------------------------------------------------------------------------------------------
//
// Tests for Force.SObject
//
//-------------------------------------------------------------------------------------------------------

/**
 * TEST Force.SObject.fetch
 */
SmartSyncTestSuite.prototype.testSObjectFetch = function() {
    console.log("# In SmartSyncTestSuite." + this.module.currentTestName);
    var self = this;
    var soupName = "soupFor_" + this.module.currentTestName; 
    var soupNameForOriginals = "originalsFor" + soupName;
    var cache = new Force.StoreCache(soupName,null,null,self.defaultStoreConfig.isGlobalStore,self.defaultStoreConfig.storeName);
    var cacheForOriginals = new Force.StoreCache(soupNameForOriginals,null,null,self.defaultStoreConfig.isGlobalStore,self.defaultStoreConfig.storeName);
    var Account = Force.SObject.extend({sobjectType:"Account", fieldlist:["Id", "Name"], cache:cache, cacheForOriginals:cacheForOriginals});
    var account = new Account();
    var accountFetch = optionsPromiser(account, "fetch", "account");
    var id;

    Promise.all([Force.smartstoreClient.removeSoup(self.defaultStoreConfig,soupName), Force.smartstoreClient.removeSoup(self.defaultStoreConfig,soupNameForOriginals)])
        .then(function() {
            console.log("## Initialization of StoreCaches");
            return Promise.all([cache.init(), cacheForOriginals.init()]);
        })
        .then(function() {
            console.log("## Direct creation against server");
            return Force.forceJsClient.create("Account", {Name:"TestAccount"});
        })
        .then(function(data) {
            id = data.id;
            console.log("## Trying fetch with default cacheMode and mergeMode");
            account.set({Id:id});
            return accountFetch();
        })
        .then(function(obj) {
            QUnit.equals(obj, account, "Should have returned same account");
            return checkResultServerAndCaches(account.attributes, {Id:id, Name:"TestAccount"}, id, {Id:id, Name:"TestAccount"}, {Id:id, Name:"TestAccount"}, cache, {Id:id, Name:"TestAccount"}, cacheForOriginals);
        })
        .then(function() {
            console.log("## Cleaning up");
            return Promise.all([Force.forceJsClient.del("account", id),
                                Force.smartstoreClient.removeSoup(soupName),
                                Force.smartstoreClient.removeSoup(soupNameForOriginals)]);
        })
        .then(function() {
            self.finalizeTest();
        });

};

/**
 * TEST Force.SObject.save
 */
SmartSyncTestSuite.prototype.testSObjectSave = function() {
    console.log("# In SmartSyncTestSuite." + this.module.currentTestName);
    var self = this;
    var soupName = "soupFor_" + this.module.currentTestName; 
    var soupNameForOriginals = "originalsFor" + soupName;
    var cache = new Force.StoreCache(soupName,null,null,self.defaultStoreConfig.isGlobalStore,self.defaultStoreConfig.storeName);
    var cacheForOriginals = new Force.StoreCache(soupNameForOriginals,null,null,self.defaultStoreConfig.isGlobalStore,self.defaultStoreConfig.storeName);
    var Account = Force.SObject.extend({sobjectType:"Account", fieldlist:["Id", "Name"], cache:cache, cacheForOriginals:cacheForOriginals});
    var account = new Account();
    var accountSave = optionsPromiser(account, "save", "account");
    var id;

    Promise.all([Force.smartstoreClient.removeSoup(self.defaultStoreConfig,soupName), Force.smartstoreClient.removeSoup(self.defaultStoreConfig,soupNameForOriginals)])
        .then(function() {
            console.log("## Initialization of StoreCaches");
            return Promise.all([cache.init(), cacheForOriginals.init()]);
        })
        .then(function() {
            console.log("## Trying save with default cacheMode and mergeMode");
            account.set({Name:"TestAccount"});
            return accountSave(null);
        })
        .then(function(obj) {
            QUnit.equals(obj, account, "Should return back the account object");
            id = account.id;
            return checkResultServerAndCaches(account.attributes, {Id:id, Name:"TestAccount"}, id, {Id:id, Name:"TestAccount"}, {Id:id, Name:"TestAccount"}, cache, {Id:id, Name:"TestAccount"}, cacheForOriginals);
        })
        .then(function() {
            console.log("## Cleaning up");
            return Promise.all([Force.forceJsClient.del("account", id),
                                Force.smartstoreClient.removeSoup(self.defaultStoreConfig,soupName),
                                Force.smartstoreClient.removeSoup(self.defaultStoreConfig,soupNameForOriginals)]);
        })
        .then(function() {
            self.finalizeTest();
        });
};

/**
 * TEST Force.SObject.destroy
 */
SmartSyncTestSuite.prototype.testSObjectDestroy = function() {
    console.log("# In SmartSyncTestSuite." + this.module.currentTestName);
    var self = this;
    var soupName = "soupFor_" + this.module.currentTestName; 
    var soupNameForOriginals = "originalsFor" + soupName;
    var cache = new Force.StoreCache(soupName,null,null,self.defaultStoreConfig.isGlobalStore,self.defaultStoreConfig.storeName);
    var cacheForOriginals = new Force.StoreCache(soupNameForOriginals,null,null,self.defaultStoreConfig.isGlobalStore,self.defaultStoreConfig.storeName);
    var Account = Force.SObject.extend({sobjectType:"Account", fieldlist:["Id", "Name"], cache:cache, cacheForOriginals:cacheForOriginals});
    var account = new Account();
    var accountSave = optionsPromiser(account, "save", "account");
    var accountDestroy = optionsPromiser(account, "destroy", "account");
    var id;

    Promise.all([Force.smartstoreClient.removeSoup(self.defaultStoreConfig,soupName), Force.smartstoreClient.removeSoup(self.defaultStoreConfig,soupNameForOriginals)])
        .then(function() {
            console.log("## Initialization of StoreCaches");
            return Promise.all([cache.init(), cacheForOriginals.init()]);
        })
        .then(function() {
            console.log("## Trying destroy with default cacheMode and mergeMode");
            account.set({Name:"TestAccount"});
            return accountSave(null);
        })
        .then(function() {
            id = account.id;
            return checkResultServerAndCaches(account.attributes, {Id:id, Name:"TestAccount"}, id, {Id:id, Name:"TestAccount"}, {Id:id, Name:"TestAccount"}, cache, {Id:id, Name:"TestAccount"}, cacheForOriginals);
        })
        .then(function() {
            console.log("## Trying destroy with default cacheMode and mergeMode");
            return accountDestroy();
        })
        .then(function() {
            return checkResultServerAndCaches(null, null, id, null, null, cache, null, cacheForOriginals);
        })
        .then(function() {
            console.log("## Cleaning up");
            return Promise.all([Force.smartstoreClient.removeSoup(self.defaultStoreConfig,soupName), Force.smartstoreClient.removeSoup(self.defaultStoreConfig,soupNameForOriginals)]);
        })
        .then(function() {
            self.finalizeTest();
        });
};

//-------------------------------------------------------------------------------------------------------
//
// Tests for Force.syncApexRestObjectWithServer
//
//  You need to create the following Apex Rest resource in your test organization
//
//  @RestResource(urlMapping='/simpleAccount/*')
//  global with sharing class SimpleAccountResource {
//      static String getIdFromURI() {
//          RestRequest req = RestContext.request;
//  		return req.requestURI.substring(req.requestURI.lastIndexOf('/')+1);
//      }
//
//      @HttpGet global static Map<String, String> doGet() {
//          String id = getIdFromURI();
//          Account acc = [select Id, Name from Account where Id = :id];
//          return new Map<String, String>{'accountId'=>acc.Id, 'accountName'=>acc.Name};
//      }
//
//      @HttpPost global static Map<String, String> doPost(String accountName) {
//  		Account acc = new Account(Name=accountName);
//          insert acc;
//          return new Map<String, String>{'accountId'=>acc.Id, 'accountName'=>acc.Name};
//      }
//
//      @HttpPatch global static Map<String, String> doPatch(String accountName) {
//          String id = getIdFromURI();
//          Account acc = [select Id from Account where Id = :id];
//          acc.Name = accountName;
//          update acc;
//          return new Map<String, String>{'accountId'=>acc.Id, 'accountName'=>acc.Name};
//      }
//
//      @HttpDelete global static void doDelete() {
//          String id = getIdFromURI();
//          Account acc = [select Id from Account where Id = :id];
//  		delete acc;
//          RestContext.response.statusCode = 204;
//      }
//  }
//
//-------------------------------------------------------------------------------------------------------

/**
 * TEST Force.syncApexRestObjectWithServer For create method
 */
SmartSyncTestSuite.prototype.testSyncApexRestObjectWithServerCreate = function() {
    console.log("# In SmartSyncTestSuite." + this.module.currentTestName);
    var self = this;
    var id;

    console.log("## Trying create");
    Force.syncApexRestObjectWithServer("create", "/simpleAccount", null, "accountId", {accountName:"TestAccount"}, ["accountName"])
    .then(function(data) {
        console.log("## Checking data returned by sync call");
        id = data.accountId;
        assertContains(data, {accountName:"TestAccount"});

        console.log("## Direct retrieve from server");
        return Force.forceJsClient.retrieve("Account", id, ["Id", "Name"]);
    })
    .then(function(data) {
        console.log("## Checking data returned from server");
        assertContains(data, {Id:id, Name:"TestAccount"});

        console.log("## Cleaning up");
        return Force.forceJsClient.del("account", id);
    })
    .then(function() {
        self.finalizeTest();
    });
};


/**
 * TEST Force.syncApexRestObjectWithServer for read method
 */
SmartSyncTestSuite.prototype.testSyncApexRestObjectWithServerRead = function() {
    console.log("# In SmartSyncTestSuite." + this.module.currentTestName);
    var self = this;
    var id;

    console.log("## Direct creation against server");
    Force.forceJsClient.create("Account", {Name:"TestAccount"})
        .then(function(resp) {
            id = resp.id;

            console.log("## Trying read call");
            return Force.syncApexRestObjectWithServer("read", "/simpleAccount", id, "accountId", null, ["accountId", "accountName"]);
        })
        .then(function(data) {
            console.log("## Checking data returned from sync call");
            assertContains(data, {accountId:id, accountName:"TestAccount"});

            console.log("## Cleaning up");
            return Force.forceJsClient.del("account", id);
        })
        .then(function() {
            self.finalizeTest();
        });
};

/**
 * TEST Force.syncApexRestObjectWithServer for update method
 */
SmartSyncTestSuite.prototype.testSyncApexRestObjectWithServerUpdate = function() {
    console.log("# In SmartSyncTestSuite." + this.module.currentTestName);
    var self = this;
    var id;

    console.log("## Direct creation against server");
    Force.forceJsClient.create("Account", {Name:"TestAccount"})
        .then(function(resp) {
            id = resp.id;

            console.log("## Trying update call");
            return Force.syncApexRestObjectWithServer("update", "/simpleAccount", id, "accountId", {accountName:"TestAccount2"}, ["accountName"]);
        })
        .then(function(data) {
            console.log("## Checking data returned from sync call");
            assertContains(data, {accountName:"TestAccount2"});

            console.log("## Direct retrieve from server");
            return Force.forceJsClient.retrieve("Account", id, ["Id", "Name"]);
        })
        .then(function(data) {
            console.log("## Checking data returned from server");
            assertContains(data, {Id:id, Name:"TestAccount2"});

            console.log("## Cleaning up");
            return Force.forceJsClient.del("account", id);
        })
        .then(function() {
            self.finalizeTest();
        });
};

/**
 * TEST Force.syncApexRestObjectWithServer for delete method
 */
SmartSyncTestSuite.prototype.testSyncApexRestObjectWithServerDelete = function() {
    console.log("# In SmartSyncTestSuite." + this.module.currentTestName);
    var self = this;
    var id;

    console.log("## Direct creation against server");
    Force.forceJsClient.create("Account", {Name:"TestAccount"})
        .then(function(resp) {
            id = resp.id;

            console.log("## Trying delete call");
            return Force.syncApexRestObjectWithServer("delete", "/simpleAccount", id, "accountId");
        })
        .then(function(data) {
            QUnit.equals(data, null, "Expected null");
            return checkServer(id, null);
        })
        .then(function() {
            self.finalizeTest();
        });
};

//-------------------------------------------------------------------------------------------------------
//
// Test for Force.fetchApexRestObjectsFromServer
//
// You need to create the following Apex Rest resource in your test organization
//
// @RestResource(urlMapping='/simpleAccounts/*')
// global with sharing class SimpleAccountsResource {
//     @HttpGet global static SimpleAccountsList doGet() {
//         String namePattern = RestContext.request.params.get('namePattern');
//         List<SimpleAccount> records = new List<SimpleAccount>();
//         for (SObject sobj : Database.query('select Id, Name from Account where Name like \'' + namePattern + '\'')) {
//             Account acc = (Account) sobj;
// 	        records.add(new SimpleAccount(acc.Id, acc.Name));
//         }
//         return new SimpleAccountsList(records.size(), records);
//     }
//
//     global class SimpleAccountsList {
//         global Integer totalSize;
//         global List<SimpleAccount> records;
//
//         global SimpleAccountsList(Integer totalSize, List<SimpleAccount> records) {
//             this.totalSize = totalSize;
//             this.records = records;
//         }
//     }
//
//     global class SimpleAccount {
//         global String accountId;
//         global String accountName;
//
//         global SimpleAccount(String accountId, String accountName) {
//             this.accountId = accountId;
//             this.accountName = accountName;
//         }
//     }
// }
//
//-------------------------------------------------------------------------------------------------------

/**
 * TEST Force.fetchApexRestObjectsFromServer
 */
SmartSyncTestSuite.prototype.testFetchApexRestObjectsFromServer = function() {
    console.log("# In SmartSyncTestSuite." + this.module.currentTestName);
    var self = this;
    var idToName = {};
    var accountNamePrefix = "testFetchApexRestObjectsFromServer" + (new Date()).getTime(); // because we query by name, we don't want to pick up records created by another test run

    console.log("## Direct creation against server");
    createRecords(idToName, accountNamePrefix, 3)
        .then(function() {
            console.log("## Trying fetch with apex rest end point");
            var config = {apexRestPath: "/simpleAccounts", params: {namePattern:accountNamePrefix + "%"}};
            return Force.fetchApexRestObjectsFromServer(config);
        })
        .then(function(result) {
            console.log("## Checking data returned from fetch call");
            QUnit.equals(result.totalSize, 3, "expected 3 results");
            QUnit.deepEqual(_.values(idToName).sort(), _.pluck(result.records, "accountName").sort(), "Wrong names");

            console.log("## Cleaning up");
            return deleteRecords(idToName)
        })
        .then(function() {
            self.finalizeTest();
        });
};

//-------------------------------------------------------------------------------------------------------
//
// Tests for Force.fetchSObjectsFromServer and Force.fetchSObjects and Force.SObjectCollection
//
//-------------------------------------------------------------------------------------------------------

/**
 * TEST Force.fetchSObjectsFromServer
 */
SmartSyncTestSuite.prototype.testFetchSObjectsFromServer = function() {
    console.log("# In SmartSyncTestSuite." + this.module.currentTestName);
    var self = this;
    var idToName = {};

    console.log("## Direct creation against server");
    createRecords(idToName, "testFetchSObjectsFromServer", 3)
        .then(function() {
            console.log("## Trying fetch with soql");
            var config = {type:"soql", query:"SELECT Name FROM Account WHERE Id IN ('" +  _.keys(idToName).join("','") + "')"};
            return Force.fetchSObjectsFromServer(config);
        })
        .then(function(result) {
            console.log("## Checking data returned from fetch call");
            QUnit.equals(result.totalSize, 3, "expected 3 results");
            QUnit.deepEqual(_.values(idToName).sort(), _.pluck(result.records, "Name").sort(), "Wrong names");

            console.log("## Cleaning up");
            return deleteRecords(idToName)
        })
        .then(function() {
            self.finalizeTest();
        });
};

/**
 * TEST Force.fetchSObjects
 */
SmartSyncTestSuite.prototype.testFetchSObjects = function() {
    console.log("# In SmartSyncTestSuite." + this.module.currentTestName);
    var self = this;
    var idToName = {};
    var soupName = "soupFor_" + this.module.currentTestName; 
    var soupNameForOriginals = "originalsFor" + soupName;
    var cache;
    var cacheForOriginals;

    Force.smartstoreClient.removeSoup(soupName)
        .then(function() {
            console.log("## Initialization of StoreCache's");
            cache = new Force.StoreCache(soupName, [ {path:"Name", type:"string"} ],null,self.defaultStoreConfig.isGlobalStore,self.defaultStoreConfig.storeName);
            cacheForOriginals = new Force.StoreCache(soupNameForOriginals, [ {path:"Name", type:"string"} ],null,self.defaultStoreConfig.isGlobalStore,self.defaultStoreConfig.storeName);
            return Promise.all([cache.init(), cacheForOriginals.init()]);
        })
        .then(function() {
            console.log("## Direct creation against server");
            return createRecords(idToName, "testFetchSObjects", 3);
        })
        .then(function() {
            console.log("## Trying fetch with soql with no cache parameter");
            return Force.fetchSObjects({type:"soql", query:"SELECT Name FROM Account WHERE Id IN ('" +  _.keys(idToName).join("','") + "') ORDER BY Name"});
        })
        .then(function(result) {
            console.log("## Checking data returned from fetch call");
            QUnit.equals(result.totalSize, 3, "Expected 3 results");
            QUnit.deepEqual(_.values(idToName).sort(), _.pluck(result.records, "Name"), "Wrong names");
            // Wait a bit before doing a sosl call
            return timeoutPromiser(1000);
        })
        .then(function() {
            console.log("## Trying fetch with sosl with no cache parameter");
            return Force.fetchSObjects({type:"sosl", query:"FIND {testFetchSObjects*} IN ALL FIELDS RETURNING Account(Id, Name) LIMIT 10"});
        })
        .then(function(result) {
            console.log("## Checking data returned from fetch call");
            QUnit.ok(result.totalSize >= 0, "Expected results");
            console.log("## Trying fetch with mru with no cache parameter");
            return Force.fetchSObjects({type:"mru", sobjectType:"Account", fieldlist:["Name"]});
        })
        .then(function(result) {
            console.log("## Checking data returned from fetch call");
            QUnit.ok(result.totalSize > 0, "Expected results");
            var expectedNames = _.values(idToName).sort();
            QUnit.deepEqual(expectedNames, _.intersection(expectedNames, _.pluck(result.records, "Name")), "Wrong names");

            console.log("## Trying fetch with soql with cache parameter");
            return Force.fetchSObjects({type:"soql", query:"SELECT Id, Name FROM Account WHERE Id IN ('" +  _.keys(idToName).join("','") + "') ORDER BY Name"}, cache);
        })
        .then(function(result) {
            console.log("## Checking data returned from fetch call");
            QUnit.equals(result.totalSize, 3, "Expected 3 results");
            QUnit.deepEqual(_.values(idToName).sort(), _.pluck(result.records, "Name"), "Wrong names");

            console.log("## Checking cache");
            return cache.find({queryType:"range", indexPath:"Name", order:"ascending", pageSize:3});
        })
        .then(function(result) {
            console.log("## Checking data returned from cache");
            QUnit.equals(result.records.length, 3, "Expected 3 records");
            QUnit.deepEqual(_.values(idToName).sort(), _.pluck(result.records, "Name"), "Wrong names");

            console.log("## Trying fetch with cache query");
            return Force.fetchSObjects({type:"cache", cacheQuery:{queryType:"range", indexPath:"Name", order:"ascending", pageSize:3}}, cache);
        })
        .then(function(result) {
            console.log("## Checking data returned from fetch call");
            QUnit.equals(result.records.length, 3, "Expected 3 results");
            QUnit.deepEqual(_.values(idToName).sort(), _.pluck(result.records, "Name"), "Wrong names");

            console.log("## Trying fetch with soql with cache parameter and cacheForOriginals parameter");
            return Force.fetchSObjects({type:"soql", query:"SELECT Id, Name FROM Account WHERE Id IN ('" +  _.keys(idToName).join("','") + "') ORDER BY Name"}, cache, cacheForOriginals);
        })
        .then(function(result) {
            console.log("## Checking data returned from fetch call");
            QUnit.equals(result.totalSize, 3, "Expected 3 results");
            QUnit.deepEqual(_.values(idToName).sort(), _.pluck(result.records, "Name"), "Wrong names");

            console.log("## Checking cache");
            return cache.find({queryType:"range", indexPath:"Name", order:"ascending", pageSize:3});
        })
        .then(function(result) {
            console.log("## Checking data returned from cache");
            QUnit.equals(result.records.length, 3, "Expected 3 records");
            QUnit.deepEqual(_.values(idToName).sort(), _.pluck(result.records, "Name"), "Wrong names");

            console.log("## Checking cacheForOriginals");
            return cacheForOriginals.find({queryType:"range", indexPath:"Name", order:"ascending", pageSize:3});
        })
        .then(function(result) {
            console.log("## Checking data returned from cacheForOriginals");
            QUnit.equals(result.records.length, 3, "Expected 3 records");
            QUnit.deepEqual(_.values(idToName).sort(), _.pluck(result.records, "Name"), "Wrong names");

            console.log("## Cleaning up");
            return Promise.all([deleteRecords(idToName), Force.smartstoreClient.removeSoup(soupName), Force.smartstoreClient.removeSoup(soupNameForOriginals)]);
        })
        .then(function() {
            self.finalizeTest();
        });
};

/**
 * TEST Force.SObjectCollection.fetch
 */
SmartSyncTestSuite.prototype.testSObjectCollectionFetch = function() {
    console.log("# In SmartSyncTestSuite." + this.module.currentTestName);
    var self = this;
    var idToName = {};
    var soupName = "soupFor_" + this.module.currentTestName; 
    var soupNameForOriginals = "originalsFor" + soupName;
    var cache;
    var cacheForOriginals;
    var collection = new Force.SObjectCollection();
    collection.config = function() {
        return {type:"soql", query:"SELECT Id, Name FROM Account WHERE Id IN ('" +  _.keys(idToName).join("','") + "') ORDER BY Name"};
    };
    var collectionFetch = optionsPromiser(collection, "fetch", "collection");

    Force.smartstoreClient.removeSoup(self.defaultStoreConfig,soupName)
        .then(function() {
            console.log("## Initialization of StoreCache's");
            cache = new Force.StoreCache(soupName, [ {path:"Name", type:"string"} ],null,self.defaultStoreConfig.isGlobalStore,self.defaultStoreConfig.storeName);
            cacheForOriginals = new Force.StoreCache(soupNameForOriginals, [ {path:"Name", type:"string"} ],null,self.defaultStoreConfig.isGlobalStore,self.defaultStoreConfig.storeName);
            return Promise.all([cache.init(), cacheForOriginals.init()]);
        })
        .then(function() {
            console.log("## Direct creation against server");
            return createRecords(idToName, "testSObjectCollectionFetch", 3);
        })
        .then(function() {
            console.log("## Trying fetch with soql with no cache parameter");
            return collectionFetch();
        })
        .then(function(result) {
            console.log("## Checking data returned from fetch call");
            QUnit.equals(collection.length, 3, "Expected 3 results");
            QUnit.deepEqual(_.values(idToName).sort(), collection.pluck("Name"), "Wrong names");

            console.log("## Trying fetch with sosl with no cache parameter");
            return collectionFetch({config: {type:"sosl", query:"FIND {testSObjectCollectionFetch*} IN ALL FIELDS RETURNING Account(Id, Name) LIMIT 10"}} );
        })
        .then(function(result) {
            console.log("## Checking data returned from fetch call");
            QUnit.ok(collection.length > 0, "Expected results");
            var expectedNames = _.values(idToName).sort();
            QUnit.deepEqual(expectedNames, _.intersection(expectedNames, collection.pluck("Name")), "Wrong names");

            console.log("## Trying fetch with mru with no cache parameter");
            return collectionFetch({config: {type:"mru", sobjectType:"Account", fieldlist:["Name"]}} );
        })
        .then(function(result) {
            console.log("## Checking data returned from fetch call");
            QUnit.ok(collection.length > 0, "Expected results");
            var expectedNames = _.values(idToName).sort();
            QUnit.deepEqual(expectedNames, _.intersection(expectedNames, collection.pluck("Name")), "Wrong names");

            console.log("## Trying fetch with soql with cache parameter");
            return collectionFetch({cache:cache});
        })
        .then(function(result) {
            console.log("## Checking data returned from fetch call");
            QUnit.equals(collection.length, 3, "Expected 3 results");
            QUnit.deepEqual(_.values(idToName).sort(), collection.pluck("Name"), "Wrong names");

            console.log("## Checking cache");
            return cache.find({queryType:"range", indexPath:"Name", order:"ascending", pageSize:3});
        })
        .then(function(result) {
            console.log("## Checking data returned from cache");
            QUnit.equals(result.records.length, 3, "Expected 3 records");
            QUnit.deepEqual(_.values(idToName).sort(), _.pluck(result.records, "Name"), "Wrong names");

            console.log("## Trying fetch with cache query. Fetch first 2 records.");
            return collectionFetch({config: {type:"cache", cacheQuery:{queryType:"range", indexPath:"Name", order:"ascending", pageSize:2}}, cache:cache});
        })
        .then(function(result) {
            console.log("## Checking data returned from fetch call");
            QUnit.equals(collection.length, 2, "Expected 2 results");
            QUnit.deepEqual(_.values(idToName).sort().slice(0, 2), collection.pluck("Name"), "Wrong names");
            QUnit.ok(collection.hasMore(), "Collection must have more records to fetch.");

            console.log("## Trying to get more records from the cache.")
            return collection.getMore();
        }).then(function(records) {
            console.log("## Checking data from collection getMore");
            QUnit.equals(records.length, 1, "Expected 1 record");
            QUnit.equals(collection.length, 3, "Expected collection length 3.");
            QUnit.ok(!collection.hasMore(), "Collection must not have more records to fetch.");

            console.log("## Trying fetch with soql with cache parameter and cacheForOriginals parameter");
            return collectionFetch({cache:cache, cacheForOriginals:cacheForOriginals});
        })
        .then(function(result) {
            console.log("## Checking data returned from fetch call");
            QUnit.equals(collection.length, 3, "Expected 3 results");
            QUnit.deepEqual(_.values(idToName).sort(), collection.pluck("Name"), "Wrong names");

            console.log("## Checking cache");
            return cache.find({queryType:"range", indexPath:"Name", order:"ascending", pageSize:3});
        })
        .then(function(result) {
            console.log("## Checking data returned from cache");
            QUnit.equals(result.records.length, 3, "Expected 3 records");
            QUnit.deepEqual(_.values(idToName).sort(), _.pluck(result.records, "Name"), "Wrong names");

            console.log("## Checking cacheForOriginals");
            return cacheForOriginals.find({queryType:"range", indexPath:"Name", order:"ascending", pageSize:3});
        })
        .then(function(result) {
            console.log("## Checking data returned from cacheForOriginals");
            QUnit.equals(result.records.length, 3, "Expected 3 records");
            QUnit.deepEqual(_.values(idToName).sort(), _.pluck(result.records, "Name"), "Wrong names");

            console.log("## Cleaning up");
            return Promise.all([deleteRecords(idToName), Force.smartstoreClient.removeSoup(soupName), Force.smartstoreClient.removeSoup(soupNameForOriginals)]);
        })
        .then(function() {
            self.finalizeTest();
        });
};

//-------------------------------------------------------------------------------------------------------
//
// Tests for sync down
//
//-------------------------------------------------------------------------------------------------------

/**
 * TEST smartsyncplugin sync down
 */
SmartSyncTestSuite.prototype.testSyncDown = function() {
    console.log("# In SmartSyncTestSuite." + this.module.currentTestName);
    var self = this;
    var idToName = {};
    var soupName = "soupFor_" + this.module.currentTestName; 
    var cache;

    Force.smartstoreClient.removeSoup(self.defaultStoreConfig,soupName)
        .then(function() {
            QUnit.ok(1, "Passed");
            console.log("## Initialization of StoreCache's");
            cache = new Force.StoreCache(soupName, [ {path:"Name", type:"string"} ],"Id",self.defaultStoreConfig.isGlobalStore,self.defaultStoreConfig.storeName);
            return cache.init();
        })
        .then(function() {
            console.log("## Direct creation against server");
            return createRecords(idToName, "testSyncDown", 3);
        })
        .then(function() {
            console.log("## Calling sync down");
            return self.trySyncDown(self.defaultStoreConfig,cache, soupName, idToName, cordova.require("com.salesforce.plugin.smartsync").MERGE_MODE.OVERWRITE);
        })
        .then(function() {
            return Promise.all([deleteRecords(idToName), Force.smartstoreClient.removeSoup(self.defaultStoreConfig,soupName)]);
        })
        .then(function() {
            self.finalizeTest();
        });
};

/**
 * TEST smartsyncplugin sync down to global store soup
 */
SmartSyncTestSuite.prototype.testSyncDownToGlobalStore = function() {
    console.log("# In SmartSyncTestSuite." + this.module.currentTestName);
    var self = this;
    var idToName = {};
    var soupName = "soupFor_" + this.module.currentTestName; 
    var cache;

    Force.smartstoreClient.removeSoup(self.defaultGlobalStoreConfig, soupName)
        .then(function() {
            console.log("## Initialization of StoreCache's");
            cache = new Force.StoreCache(soupName, [ {path:"Name", type:"string"} ],null,self.defaultGlobalStoreConfig.isGlobalStore,self.defaultGlobalStoreConfig.storeName);
            return cache.init();
        })
        .then(function() {
            console.log("## Direct creation against server");
            return createRecords(idToName, "testSyncDownToGlobalStore", 3);
        })
        .then(function() {
            console.log("## Calling sync down");
            return self.trySyncDown(self.defaultGlobalStoreConfig,cache, soupName, idToName, cordova.require("com.salesforce.plugin.smartsync").MERGE_MODE.OVERWRITE);
        })
        .then(function() {
            console.log("## Check both stores");
            return Promise.all([Force.smartstoreClient.soupExists(self.defaultStoreConfig, soupName), Force.smartstoreClient.soupExists(self.defaultGlobalStoreConfig, soupName)]);
        })
        .then(function(results) {
            var exists = results[0], existsGlobal = results[1];
            QUnit.equals(exists, false, "soup should not exist in regular store");
            QUnit.equals(existsGlobal, true, "soup should exist in global store");
            return Promise.all([deleteRecords(idToName), Force.smartstoreClient.removeSoup(self.defaultGlobalStoreConfig, soupName)]);
        })
        .then(function() {
            self.finalizeTest();
        });
};

/**
 * TEST smartsyncplugin sync down to global store soup
 */
SmartSyncTestSuite.prototype.testSyncDownToGlobalStoreNamed = function() {
    console.log("# In SmartSyncTestSuite." + this.module.currentTestName);
    var self = this;
    var idToName = {};
    var soupName = "soupFor_" + this.module.currentTestName; 
    var cache;
    var globalStoreConfigWithName =  {"isGlobalStore" : true, "storeName" : "globalStoreFor_" + this.module.currentTestName};

    Force.smartstoreClient.removeSoup(globalStoreConfigWithName, soupName)
        .then(function() {
            console.log("## Initialization of StoreCache's");
            cache = new Force.StoreCache(soupName, [ {path:"Name", type:"string"} ],null,globalStoreConfigWithName.isGlobalStore,globalStoreConfigWithName.storeName);
            return cache.init();
        })
        .then(function() {
            console.log("## Direct creation against server");
            return createRecords(idToName, "testSyncDownToGlobalStoreNamed", 3);
        })
        .then(function() {
            console.log("## Calling sync down");
            return self.trySyncDown(globalStoreConfigWithName,cache, soupName, idToName, cordova.require("com.salesforce.plugin.smartsync").MERGE_MODE.OVERWRITE);
        })
        .then(function() {
            console.log("## Check both stores");
            return Promise.all([Force.smartstoreClient.soupExists(self.defaultGlobalStoreConfig, soupName), Force.smartstoreClient.soupExists(globalStoreConfigWithName, soupName)]);
        })
        .then(function(results) {
            var exists = results[0], existsGlobal = results[1];
            QUnit.equals(exists, false, "soup should not exist in default global store");
            QUnit.equals(existsGlobal, true, "soup should exist in global store");
            return Promise.all([deleteRecords(idToName),
              Force.smartstoreClient.removeSoup(globalStoreConfigWithName, soupName),
            ]);
        })
        .then(function() {
            self.finalizeTest();
        });
};

/**
 * TEST smartsyncplugin sync down with merge mode leave-if-changed
 */
SmartSyncTestSuite.prototype.testSyncDownWithNoOverwrite = function() {
    console.log("# In SmartSyncTestSuite." + this.module.currentTestName);
    var self = this;
    var idToName = {};
    var idToUpdatedName = {};
    var updatedRecords;
    var options = {fieldlist: ["Name"]};
    var soupName = "soupFor_" + this.module.currentTestName; 
    var cache;

    Force.smartstoreClient.removeSoup(self.defaultStoreConfig,soupName)
        .then(function() {
            console.log("## Initialization of StoreCache's");
            cache = new Force.StoreCache(soupName, [ {path:"Name", type:"string"} ],null,self.defaultStoreConfig.isGlobalStore,self.defaultStoreConfig.storeName);
            return cache.init();
        })
        .then(function() {
            console.log("## Direct creation against server");
            return createRecords(idToName, "testSyncDownWithNoOverwrite", 3);
        })
        .then(function() {
            console.log("## Calling sync down");
            return self.trySyncDown(self.defaultStoreConfig,cache, soupName, idToName, cordova.require("com.salesforce.plugin.smartsync").MERGE_MODE.OVERWRITE);
        })
        .then(function() {
            console.log("## Updating local records");
            updatedRecords = [];
            _.each(_.keys(idToName), function(id) {
                idToUpdatedName[id] = idToName[id]+"Updated";
                updatedRecords.push({Id:id, Name:idToUpdatedName[id], __locally_updated__:true});
            });
            return cache.saveAll(updatedRecords);
        })
        .then(function() {
            console.log("## Calling sync down with mergeMode leave-if-changed");
            return self.trySyncDown(self.defaultStoreConfig,cache, soupName, idToUpdatedName, cordova.require("com.salesforce.plugin.smartsync").MERGE_MODE.LEAVE_IF_CHANGED);
        })
        .then(function() {
            console.log("## Checking cache");
            return cache.find({queryType:"range", indexPath:"Name", order:"ascending", pageSize:3});
        })
        .then(function(result) {
            console.log("## Checking data returned from cache");
            QUnit.equals(result.records.length, 3, "Expected 3 records");
            _.each(result.records, function(record) {
                QUnit.ok(record.__local__, "Record should still be marked as local");
                QUnit.ok(record.__locally_updated__, "Record should still be marked as updated");
                QUnit.ok(record.Name.indexOf("Updated") > -1, "Record name should still have update");
            });

            console.log("## Calling sync down with mergeMode overwrite");
            return self.trySyncDown(self.defaultStoreConfig,cache, soupName, idToName, cordova.require("com.salesforce.plugin.smartsync").MERGE_MODE.OVERWRITE);
        })
        .then(function() {
            console.log("## Checking cache");
            return cache.find({queryType:"range", indexPath:"Name", order:"ascending", pageSize:3});
        })
        .then(function(result) {
            console.log("## Checking data returned from cache");
            QUnit.equals(result.records.length, 3, "Expected 3 records");
            _.each(result.records, function(record) {
                QUnit.ok(!record.__local__, "Record should no longer be marked as local");
                QUnit.ok(!record.__locally_updated__, "Record should no longer be marked as updated");
                QUnit.ok(record.Name.indexOf("Updated") == -1, "Record name should no longer have update");
            });

            return Promise.all([deleteRecords(idToName), Force.smartstoreClient.removeSoup(self.defaultStoreConfig,soupName)]);
        })
        .then(function() {
            self.finalizeTest();
        });
};

/**
 * TEST smartsyncplugin sync down with refresh-sync-down
 */
SmartSyncTestSuite.prototype.testRefreshSyncDown = function() {
    console.log("# In SmartSyncTestSuite." + this.module.currentTestName);
    var self = this;
    var idToName = {};
    var idToUpdatedName = {};
    var soupName = "soupFor_" + this.module.currentTestName; 
    var cache;

    Force.smartstoreClient.removeSoup(self.defaultStoreConfig,soupName)
        .then(function() {
            console.log("## Initialization of StoreCache's");
            cache = new Force.StoreCache(soupName,[ {path:"Name", type:"string"} ],null,self.defaultStoreConfig.isGlobalStore,self.defaultStoreConfig.storeName);
            return cache.init();
        })
        .then(function() {
            console.log("## Direct creation against server");
            return createRecords(idToName, "testRefreshSyncDown", 3);
        })
        .then(function() {
            console.log("## Calling sync down");
            return self.trySyncDown(self.defaultStoreConfig,cache, soupName, idToName, cordova.require("com.salesforce.plugin.smartsync").MERGE_MODE.OVERWRITE);
        })
        .then(function() {
            console.log("## Updating records on server");
            idToUpdatedName = {};
            var ids = [_.keys(idToName)[0], _.keys(idToName)[2]];
            _.each(ids, function(id) {
                idToUpdatedName[id] = idToName[id] + "Updated";
            });
            return updateRecords(idToUpdatedName);
        })
        .then(function() {
            console.log("## Calling refresh sync down");
            idToName = _.extend(idToName, idToUpdatedName);
            var target = {soupName:soupName, type:"refresh", sobjectType:"Account", fieldlist:["Id", "Name"]};
            return self.trySyncDown(self.defaultStoreConfig,cache, soupName, idToName, cordova.require("com.salesforce.plugin.smartsync").MERGE_MODE.OVERWRITE, target);
        })
        .then(function() {
            return Promise.all([deleteRecords(idToName), Force.smartstoreClient.removeSoup(self.defaultStoreConfig,soupName)]);
        })
        .then(function() {
            self.finalizeTest();
        });
};


/**
 * TEST smartsyncplugin reSync
 */
SmartSyncTestSuite.prototype.testReSync = function() {
    console.log("# In SmartSyncTestSuite." + this.module.currentTestName);
    var self = this;
    var idToName = {};
    var idToUpdatedName = {};
    var soupName = "soupFor_" + this.module.currentTestName; 
    var cache;
    var syncDownId;

    Force.smartstoreClient.removeSoup(self.defaultStoreConfig,soupName)
        .then(function() {
            console.log("## Initialization of StoreCache's");
            cache = new Force.StoreCache(soupName, [ {path:"Name", type:"string"} ],null,self.defaultStoreConfig.isGlobalStore,self.defaultStoreConfig.storeName);
            return cache.init();
        })
        .then(function() {
            console.log("## Direct creation against server");
            return createRecords(idToName, "testReSync", 3);
        })
        .then(function() {
            console.log("## Calling sync down");
            return self.trySyncDown(self.defaultStoreConfig,cache, soupName, idToName, cordova.require("com.salesforce.plugin.smartsync").MERGE_MODE.OVERWRITE);
        })
        .then(function(syncId) {
            syncDownId = syncId;
            return timeoutPromiser(1000);
        })
        .then(function() {
            console.log("## Updating records on server");
            idToUpdatedName = {};
            var ids = [_.keys(idToName)[0], _.keys(idToName)[2]];
            _.each(ids, function(id) {
                idToUpdatedName[id] = idToName[id] + "Updated";
            });
            return updateRecords(idToUpdatedName);
        })
        .then(function() {
            console.log("## Calling reSync");
            idToName = _.extend(idToName, idToUpdatedName);
            return self.tryReSync(cache, soupName, idToName, syncDownId, _.keys(idToUpdatedName).length);
        })
        .then(function() {
            return Promise.all([deleteRecords(idToName), Force.smartstoreClient.removeSoup(self.defaultStoreConfig,soupName)]);
        })
        .then(function() {
            self.finalizeTest();
        });
};

/**
 * TEST smartsyncplugin cleanResyncGhosts
 */
SmartSyncTestSuite.prototype.testCleanResyncGhosts = function() {
    console.log("# In SmartSyncTestSuite." + this.module.currentTestName);
    var self = this;
    var idToName = {};
    var ids;
    var delRecordId;
    var soupName = "soupFor_" + this.module.currentTestName; 
    var syncDownId;
    var cache;
    var mustDelRecords = {};
    var stayRecordIdsSorted;

    Force.smartstoreClient.removeSoup(self.defaultStoreConfig,soupName)
        .then(function() {
            console.log("## Initialization of StoreCache's");
            cache = new Force.StoreCache(soupName, [ {path:"Name", type:"string"} ],null,self.defaultStoreConfig.isGlobalStore,self.defaultStoreConfig.storeName);
            return cache.init();
        })
        .then(function() {
            console.log("## Direct creation against server");
            return createRecords(idToName, "testCleanResyncGhosts", 3);
        })
        .then(function() {
            console.log("## Calling sync down");
            return self.trySyncDown(self.defaultStoreConfig,cache, soupName, idToName, cordova.require("com.salesforce.plugin.smartsync").MERGE_MODE.LEAVE_IF_CHANGED);
        })
        .then(function(syncId) {
            syncDownId = syncId;
            return timeoutPromiser(1000);
        })
        .then(function() {
            ids = _.keys(idToName);
            delRecordId = ids[0];
            //make sure record id is in ascending order
            stayRecordIdsSorted = ids.slice(1).sort();
            var delRecord = {};
            delRecord[delRecordId] = idToName[delRecordId];
            console.log("## Deleting record: " + delRecord);
            return deleteRecords(delRecord);
        })
        .then(function() {
            console.log("## Calling cleanResyncGhosts");
            self.cleanResyncGhosts(self.defaultStoreConfig, syncDownId);
            return timeoutPromiser(5000);
        })
        .then(function() {
            console.log("## Fetching records from SmartStore");
            var querySpec = {queryType:"range", indexPath:"Id", order:"ascending", pageSize:10};
            return Force.smartstoreClient.querySoup(self.defaultStoreConfig,soupName, querySpec);
        })
        .then(function(cursor) {
            QUnit.equals(cursor.totalEntries, 2, "Expected 2 records");
            var entries = cursor["currentPageOrderedEntries"];
            var firstEntry = entries[0];
            var secondEntry = entries[1];
            var firstId = firstEntry["Id"];
            var secondId = secondEntry["Id"];
            console.log("## Actual records Ids are " + firstId + " and " + secondId);
            console.log("## Expected records Ids are " + stayRecordIdsSorted[0] + " and " + stayRecordIdsSorted[1]);
            QUnit.equals(firstId, stayRecordIdsSorted[0], "ID should not still exist in SmartStore");
            QUnit.equals(secondId, stayRecordIdsSorted[1], "ID should not still exist in SmartStore");
            mustDelRecords[firstId] = idToName[firstId];
            mustDelRecords[secondId] = idToName[secondId];
        })
        .then(function() {
            return Promise.all([deleteRecords(mustDelRecords), Force.smartstoreClient.removeSoup(self.defaultStoreConfig,soupName)]);
        })
        .then(function() {
            self.finalizeTest();
        });
};

/**
 * TEST smartsyncplugin syncDown + getSyncStatus + deleteSync by id
 */
SmartSyncTestSuite.prototype.testSyncDownGetSyncDeleteSyncById = function() {
    console.log("# In SmartSyncTestSuite." + this.module.currentTestName);
    var self = this;
    var idToName = {};
    var soupName = "soupFor_" + this.module.currentTestName; 
    var cache;
    var syncDownId;

    Force.smartstoreClient.removeSoup(self.defaultStoreConfig,soupName)
        .then(function() {
            QUnit.ok(1, "Passed");
            console.log("## Initialization of StoreCache's");
            cache = new Force.StoreCache(soupName, [ {path:"Name", type:"string"} ],"Id",self.defaultStoreConfig.isGlobalStore,self.defaultStoreConfig.storeName);
            return cache.init();
        })
        .then(function() {
            console.log("## Direct creation against server");
            return createRecords(idToName, "testSyncDownGetSyncDeleteSyncById", 3);
        })
        .then(function() {
            console.log("## Calling sync down");
            return self.trySyncDown(self.defaultStoreConfig,cache, soupName, idToName, cordova.require("com.salesforce.plugin.smartsync").MERGE_MODE.OVERWRITE);
        })
        .then(function(syncId) {
            syncDownId = syncId;
            return self.getSyncStatus(self.defaultStoreConfig, syncDownId);
        })
        .then(function(sync) {
            assertContains(sync, {_soupEntryId: syncDownId, type:"syncDown", progress:100, soupName: soupName});
            return self.deleteSync(self.defaultStoreConfig, syncDownId);
        })
        .then(function() {
            return self.getSyncStatus(self.defaultStoreConfig, syncDownId);
        })
        .then(function(sync) {
            QUnit.ok(sync == null, "Sync should no longer exist");
            return Promise.all([deleteRecords(idToName), Force.smartstoreClient.removeSoup(self.defaultStoreConfig,soupName)]);
        })
        .then(function() {
            self.finalizeTest();
        });
};

/**
 * TEST smartsyncplugin syncDown + getSyncStatus + deleteSync by name
 */
SmartSyncTestSuite.prototype.testSyncDownGetSyncDeleteSyncByName = function() {
    console.log("# In SmartSyncTestSuite." + this.module.currentTestName);
    var self = this;
    var idToName = {};
    var soupName = "soupFor_" + this.module.currentTestName;
    var syncName = "syncFor_" + this.module.currentTestName;
    var cache;
    var syncDownId;

    Force.smartstoreClient.removeSoup(self.defaultStoreConfig,soupName)
        .then(function() {
            QUnit.ok(1, "Passed");
            console.log("## Initialization of StoreCache's");
            cache = new Force.StoreCache(soupName, [ {path:"Name", type:"string"} ],"Id",self.defaultStoreConfig.isGlobalStore,self.defaultStoreConfig.storeName);
            return cache.init();
        })
        .then(function() {
            console.log("## Direct creation against server");
            return createRecords(idToName, "testSyncDownGetSyncDeleteSyncByName", 3);
        })
        .then(function() {
            console.log("## Calling sync down");
            return self.trySyncDown(self.defaultStoreConfig,cache, soupName, idToName, cordova.require("com.salesforce.plugin.smartsync").MERGE_MODE.OVERWRITE, null, syncName);
        })
        .then(function(syncId) {
            syncDownId = syncId;
            return self.getSyncStatus(self.defaultStoreConfig, syncName);
        })
        .then(function(sync) {
            assertContains(sync, {_soupEntryId: syncDownId, type:"syncDown", progress:100, soupName: soupName, name: syncName});
            return self.deleteSync(self.defaultStoreConfig, syncName);
        })
        .then(function() {
            return self.getSyncStatus(self.defaultStoreConfig, syncName);
        })
        .then(function(sync) {
            QUnit.ok(sync == null, "Sync should no longer exist");
            return self.getSyncStatus(self.defaultStoreConfig, syncDownId);
        })
        .then(function(sync) {
            QUnit.ok(sync == null, "Sync should no longer exist");
            return Promise.all([deleteRecords(idToName), Force.smartstoreClient.removeSoup(self.defaultStoreConfig,soupName)]);
        })
        .then(function() {
            self.finalizeTest();
        });
};

//-------------------------------------------------------------------------------------------------------
//
// Tests for sync up
//
//-------------------------------------------------------------------------------------------------------

/**
 * TEST smartsyncplugin sync up with locally updated records
 */
SmartSyncTestSuite.prototype.testSyncUpLocallyUpdated = function() {
    console.log("# In SmartSyncTestSuite." + this.module.currentTestName);
    var self = this;
    var idToName = {};
    var updatedRecords;
    var options = {fieldlist: ["Name"], mergeMode: cordova.require("com.salesforce.plugin.smartsync").MERGE_MODE.OVERWRITE};
    var soupName = "soupFor_" + this.module.currentTestName; 
    var cache;

    Force.smartstoreClient.removeSoup(self.defaultStoreConfig,soupName)
        .then(function() {
            console.log("## Initialization of StoreCache's");
            cache = new Force.StoreCache(soupName, [ {path:"Name", type:"string"} ],null,self.defaultStoreConfig.isGlobalStore,self.defaultStoreConfig.storeName);
            return cache.init();
        })
        .then(function() {
            console.log("## Direct creation against server");
            return createRecords(idToName, "testSyncUpLocallyUpdated", 3);
        })
        .then(function() {
            console.log("## Calling sync down");
            return self.trySyncDown(self.defaultStoreConfig,cache, soupName, idToName, cordova.require("com.salesforce.plugin.smartsync").MERGE_MODE.OVERWRITE);
        })
        .then(function() {
            console.log("## Updating local records");
            updatedRecords = [];
            _.each(_.keys(idToName), function(id) {
                updatedRecords.push({Id:id, Name:idToName[id] + "Updated", __locally_updated__:true});
            });
            return cache.saveAll(updatedRecords);
        })
        .then(function(records) {
            console.log("## Calling sync up");
            return self.trySyncUp(self.defaultStoreConfig, soupName, options);
        })
        .then(function() {
            console.log("## Checking cache");
            return cache.find({queryType:"range", indexPath:"Name", order:"ascending", pageSize:3});
        })
        .then(function(result) {
            console.log("## Checking data returned from cache");
            QUnit.equals(result.records.length, 3, "Expected 3 records");
            _.each(result.records, function(record) {
                QUnit.ok(!record.__local__, "Record should no longer marked as local");
                QUnit.ok(!record.__locally_updated__, "Record should no longer marked as updated");
            });

            console.log("## Checking server");
            return checkServerMultiple(updatedRecords);
        })
        .then(function() {
            return Promise.all([deleteRecords(idToName), Force.smartstoreClient.removeSoup(soupName)]);
        })
        .then(function() {
            self.finalizeTest();
        });
};

/**
 * TEST smartsyncplugin sync up with locally updated records in global store soup
 */
SmartSyncTestSuite.prototype.testSyncUpLocallyUpdatedWithGlobalStore = function() {
    console.log("# In SmartSyncTestSuite." + this.module.currentTestName);
    var self = this;
    var idToName = {};
    var updatedRecords;
    var options = {fieldlist: ["Name"], mergeMode: cordova.require("com.salesforce.plugin.smartsync").MERGE_MODE.OVERWRITE};
    var soupName = "soupFor_" + this.module.currentTestName; 
    var cache;

    Force.smartstoreClient.removeSoup(self.defaultGlobalStoreConfig, soupName)
        .then(function() {
            console.log("## Initialization of StoreCache's");
            cache = new Force.StoreCache(soupName, [ {path:"Name", type:"string"} ],null,self.defaultGlobalStoreConfig.isGlobalStore,self.defaultGlobalStoreConfig.storeName);
            return cache.init();
        })
        .then(function() {
            console.log("## Direct creation against server");
            return createRecords(idToName, "testSyncUpLocallyUpdatedWithGlobalStore", 3);
        })
        .then(function() {
            console.log("## Calling sync down");
            return self.trySyncDown(self.defaultGlobalStoreConfig,cache, soupName, idToName, cordova.require("com.salesforce.plugin.smartsync").MERGE_MODE.OVERWRITE);
        })
        .then(function() {
            console.log("## Updating local records");
            updatedRecords = [];
            _.each(_.keys(idToName), function(id) {
                updatedRecords.push({Id:id, Name:idToName[id] + "Updated", __locally_updated__:true});
            });
            return cache.saveAll(updatedRecords);
        })
        .then(function(records) {
            console.log("## Calling sync up");
            return self.trySyncUp(self.defaultGlobalStoreConfig, soupName, options);
        })
        .then(function() {
            console.log("## Check both stores");
            return Promise.all([Force.smartstoreClient.soupExists(self.defaultStoreConfig, soupName), Force.smartstoreClient.soupExists(self.defaultGlobalStoreConfig, soupName)]);
        })
        .then(function(results) {
            var exists = results[0], existsGlobal = results[1];
            QUnit.equals(exists, false, "soup should not exist in regular store");
            QUnit.equals(existsGlobal, true, "soup should exist in global store");
            console.log("## Checking cache");
            return cache.find({queryType:"range", indexPath:"Name", order:"ascending", pageSize:3});
        })
        .then(function(result) {
            console.log("## Checking data returned from cache");
            QUnit.equals(result.records.length, 3, "Expected 3 records");
            _.each(result.records, function(record) {
                QUnit.ok(!record.__local__, "Record should no longer marked as local");
                QUnit.ok(!record.__locally_updated__, "Record should no longer marked as updated");
            });

            console.log("## Checking server");
            return checkServerMultiple(updatedRecords);
        })
        .then(function() {
            return Promise.all([deleteRecords(idToName), Force.smartstoreClient.removeSoup(self.defaultGlobalStoreConfig, soupName)]);
        })
        .then(function() {
            self.finalizeTest();
        });
};


/**
 * TEST smartsyncplugin sync up with locally updated records in global store soup
 */
SmartSyncTestSuite.prototype.testSyncUpLocallyUpdatedWithGlobalStoreNamed = function() {
    console.log("# In SmartSyncTestSuite." + this.module.currentTestName);
    var self = this;
    var idToName = {};
    var updatedRecords;
    var options = {fieldlist: ["Name"], mergeMode: cordova.require("com.salesforce.plugin.smartsync").MERGE_MODE.OVERWRITE};
    var soupName = "soupFor_" + this.module.currentTestName; 
    var cache;
    var storeConfigWithName =  {"isGlobalStore" : false, "storeName" : "userStoreFor_" + this.module.currentTestName};
    var globalStoreConfigWithName =  {"isGlobalStore" : true, "storeName" : "globalStoreFor_" + this.module.currentTestName};
    Promise.all([
        Force.smartstoreClient.removeSoup(storeConfigWithName, soupName),
        Force.smartstoreClient.removeSoup(globalStoreConfigWithName, soupName)])
       .then(function() {
            console.log("## Initialization of StoreCache's");
            cache = new Force.StoreCache(soupName, [ {path:"Name", type:"string"} ],null,globalStoreConfigWithName.isGlobalStore,globalStoreConfigWithName.storeName);
            return cache.init();
        })
        .then(function() {
            console.log("## Direct creation against server");
            return createRecords(idToName, "testSyncUpLocallyUpdatedWithGlobalStore", 3);
        })
        .then(function() {
            console.log("## Calling sync down");
            return self.trySyncDown(globalStoreConfigWithName,cache, soupName, idToName, cordova.require("com.salesforce.plugin.smartsync").MERGE_MODE.OVERWRITE);
        })
        .then(function() {
            console.log("## Updating local records");
            updatedRecords = [];
            _.each(_.keys(idToName), function(id) {
                updatedRecords.push({Id:id, Name:idToName[id] + "Updated", __locally_updated__:true});
            });
            return cache.saveAll(updatedRecords);
        })
        .then(function(records) {
            console.log("## Calling sync up");
            return self.trySyncUp(globalStoreConfigWithName, soupName, options);
        })
        .then(function() {
            console.log("## Check both stores");
            return Promise.all([Force.smartstoreClient.soupExists(storeConfigWithName, soupName), Force.smartstoreClient.soupExists(globalStoreConfigWithName, soupName)]);
        })
        .then(function(results) {
            var exists = results[0], existsGlobal = results[1];
            QUnit.equals(exists, false, "soup should not exist in regular store");
            QUnit.equals(existsGlobal, true, "soup should exist in global store");
            console.log("## Checking cache");
            return cache.find({queryType:"range", indexPath:"Name", order:"ascending", pageSize:3});
        })
        .then(function(result) {
            console.log("## Checking data returned from cache");
            QUnit.equals(result.records.length, 3, "Expected 3 records");
            _.each(result.records, function(record) {
                QUnit.ok(!record.__local__, "Record should no longer marked as local");
                QUnit.ok(!record.__locally_updated__, "Record should no longer marked as updated");
            });

            console.log("## Checking server");
            return checkServerMultiple(updatedRecords);
        })
        .then(function() {
            return Promise.all([deleteRecords(idToName),
              Force.smartstoreClient.removeSoup(globalStoreConfigWithName, soupName),
            ]);
        })
        .then(function() {
            self.finalizeTest();
        });
};

/**
 * TEST smartsyncplugin sync up with locally updated records and merge mode leave-if-changed
 */
SmartSyncTestSuite.prototype.testSyncUpLocallyUpdatedWithNoOverwrite = function() {
    console.log("# In SmartSyncTestSuite." + this.module.currentTestName);
    var self = this;
    var idToName = {};
    var idToUpdatedName = {};
    var updatedLocalRecords;
    var options = {fieldlist: ["Name"], mergeMode: cordova.require("com.salesforce.plugin.smartsync").MERGE_MODE.LEAVE_IF_CHANGED};
    var soupName = "soupFor_" + this.module.currentTestName; 
    var cache;

    Force.smartstoreClient.removeSoup(soupName)
        .then(function() {
            console.log("## Initialization of StoreCache's");
            cache = new Force.StoreCache(soupName, [ {path:"Name", type:"string"} ],null,self.defaultStoreConfig.isGlobalStore,self.defaultStoreConfig.storeName);
            return cache.init();
        })
        .then(function() {
            console.log("## Direct creation against server");
            return createRecords(idToName, "testSyncUpLocallyUpdatedWithNoOverwrite", 3);
        })
        .then(function() {
            console.log("## Calling sync down");
            return self.trySyncDown(self.defaultStoreConfig,cache, soupName, idToName, cordova.require("com.salesforce.plugin.smartsync").MERGE_MODE.LEAVE_IF_CHANGED);
        })
        .then(function() {
            console.log("## Updating local records");
            updatedLocalRecords = [];
            _.each(_.keys(idToName), function(id) {
                updatedLocalRecords.push({Id:id, Name:idToName[id] + "Updated", __locally_updated__:true});
            });
            return cache.saveAll(updatedLocalRecords);
        })
        .then(function() {
            return timeoutPromiser(1000);
        })
        .then(function() {
            console.log("## Updating records on server");
            idToUpdatedName = {};
            var ids = [_.keys(idToName)[0], _.keys(idToName)[1], _.keys(idToName)[2]];
            _.each(ids, function(id) {
                idToUpdatedName[id] = idToName[id] + "Updated again";
            });
            return updateRecords(idToUpdatedName);
        })
        .then(function() {
            console.log("## Calling sync up");
            return self.trySyncUp(self.defaultStoreConfig, soupName, options);
        })
        .then(function() {
            console.log("## Checking cache");
            return cache.find({queryType:"range", indexPath:"Name", order:"ascending", pageSize:3});
        })
        .then(function(result) {
            console.log("## Checking data returned from cache");
            QUnit.equals(result.records.length, 3, "Expected 3 records");
            _.each(result.records, function(record) {
                QUnit.ok(record.__local__, "Record should still be marked as local");
                QUnit.ok(record.__locally_updated__, "Record should still be marked as updated");
            });
            console.log("## Checking server");
            return Force.forceJsClient.query("select Id, Name from Account where Id in ('" + _.keys(idToName)[0] + "', '" + _.keys(idToName)[1] + "', '" + _.keys(idToName)[2] + "')");
        })
        .then(function(result) {
            QUnit.equals(result.records.length, 3, "Expected 3 records");
            return Promise.all([deleteRecords(idToName), Force.smartstoreClient.removeSoup(soupName)]);
        })
        .then(function() {
            self.finalizeTest();
        });
};

/**
 * TEST smartsyncplugin sync up with locally deleted records
 */
SmartSyncTestSuite.prototype.testSyncUpLocallyDeleted = function() {
    console.log("# In SmartSyncTestSuite." + this.module.currentTestName);
    var self = this;
    var idToName = {};
    var deletedRecords;
    var options = {fieldlist: ["Name"], mergeMode: cordova.require("com.salesforce.plugin.smartsync").MERGE_MODE.OVERWRITE};
    var soupName = "soupFor_" + this.module.currentTestName; 
    var cache;

    Force.smartstoreClient.removeSoup(self.defaultStoreConfig,soupName)
        .then(function() {
            console.log("## Initialization of StoreCache's");
            cache = new Force.StoreCache(soupName, [ {path:"Name", type:"string"} ],null,self.defaultStoreConfig.isGlobal,self.defaultStoreConfig.storeName);
            return cache.init();
        })
        .then(function() {
            console.log("## Direct creation against server");
            return createRecords(idToName, "testSyncUpLocallyDeleted", 3);
        })
        .then(function() {
            console.log("## Calling sync down");
            return self.trySyncDown(self.defaultStoreConfig,cache, soupName, idToName, cordova.require("com.salesforce.plugin.smartsync").MERGE_MODE.OVERWRITE);
        })
        .then(function() {
            console.log("## Deleted local records");
            deletedRecords = [];
            _.each(_.keys(idToName), function(id) {
                deletedRecords.push({Id:id, __locally_deleted__:true});
            });
            return cache.saveAll(deletedRecords);
        })
        .then(function(records) {
            console.log("## Calling sync up");
            return self.trySyncUp(self.defaultStoreConfig,soupName, options);
        })
        .then(function() {
            console.log("## Checking cache");
            return cache.find({queryType:"range", indexPath:"Name", order:"ascending", pageSize:3});
        })
        .then(function(result) {
            console.log("## Checking data returned from cache");
            QUnit.equals(result.records.length, 0, "Expected 0 records");
            console.log("## Checking server");
            return Force.forceJsClient.query("select Id from Account where Id in ('" + _.pluck(deletedRecords, "Id").join("','") + "')");
        })
        .then(function(resp) {
            console.log("## Checking data returned from server");
            QUnit.equals(resp.records.length, 0, "Expected 0 records");

            // Cleanup
            return Force.smartstoreClient.removeSoup(self.defaultStoreConfig,soupName);
        })
        .then(function() {
            self.finalizeTest();
        });
};

/**
 * TEST smartsyncplugin sync up with locally deleted records and merge mode leave-if-changed
 */
SmartSyncTestSuite.prototype.testSyncUpLocallyDeletedWithNoOverwrite = function() {
    console.log("# In SmartSyncTestSuite." + this.module.currentTestName);
    var self = this;
    var idToName = {};
    var idToUpdatedName = {};
    var deletedRecords;
    var options = {fieldlist: ["Name"], mergeMode: cordova.require("com.salesforce.plugin.smartsync").MERGE_MODE.LEAVE_IF_CHANGED};
    var soupName = "soupFor_" + this.module.currentTestName; 
    var cache;

    Force.smartstoreClient.removeSoup(self.defaultStoreConfig,soupName)
        .then(function() {
            console.log("## Initialization of StoreCache's");
            cache = new Force.StoreCache(soupName, [ {path:"Name", type:"string"} ],null,self.defaultStoreConfig.isGlobal,self.defaultStoreConfig.storeName);
            return cache.init();
        })
        .then(function() {
            console.log("## Direct creation against server");
            return createRecords(idToName, "testSyncUpLocallyDeletedWithNoOverwrite", 3);
        })
        .then(function() {
            console.log("## Calling sync down");
            return self.trySyncDown(self.defaultStoreConfig,cache, soupName, idToName, cordova.require("com.salesforce.plugin.smartsync").MERGE_MODE.LEAVE_IF_CHANGED);
        })
        .then(function() {
            console.log("## Deleted local records");
            deletedRecords = [];
            _.each(_.keys(idToName), function(id) {
                deletedRecords.push({Id:id, __locally_deleted__:true});
            });
            return cache.saveAll(deletedRecords);
        })
        .then(function() {
            return timeoutPromiser(1000);
        })
        .then(function() {
            console.log("## Updating records on server");
            idToUpdatedName = {};
            var ids = [_.keys(idToName)[0], _.keys(idToName)[1], _.keys(idToName)[2]];
            _.each(ids, function(id) {
                idToUpdatedName[id] = idToName[id] + "Updated";
            });
            return updateRecords(idToUpdatedName);
        })
        .then(function() {
            console.log("## Calling sync up");
            return self.trySyncUp(self.defaultStoreConfig, soupName, options);
        })
        .then(function() {
            console.log("## Checking cache");
            return cache.find({queryType:"range", indexPath:"Name", order:"ascending", pageSize:3});
        })
        .then(function(result) {
            console.log("## Checking data returned from cache");
            QUnit.equals(result.records.length, 3, "Expected 3 records");
            _.each(result.records, function(record) {
                QUnit.ok(record.__local__, "Record should still be marked as local");
                QUnit.ok(record.__locally_deleted__, "Record should still be marked as deleted");
            });
            console.log("## Checking server");
            return Force.forceJsClient.query("select Id from Account where Id in ('" + _.pluck(deletedRecords, "Id").join("','") + "')");
        })
        .then(function(resp) {
            console.log("## Checking data returned from server");
            QUnit.equals(resp.records.length, 3, "Expected 3 records");

            // Cleanup
            return Promise.all([deleteRecords(idToName), Force.smartstoreClient.removeSoup(self.defaultGlobalStoreConfig,soupName)]);
        })
        .then(function() {
            self.finalizeTest();
        });
};

/**
 * TEST smartsyncplugin sync up with locally created records
 */
SmartSyncTestSuite.prototype.testSyncUpLocallyCreated = function() {
    console.log("# In SmartSyncTestSuite." + this.module.currentTestName);
    var self = this;
    var idToName = {};
    var createdRecords;
    var options = {fieldlist: ["Name"], mergeMode: cordova.require("com.salesforce.plugin.smartsync").MERGE_MODE.OVERWRITE};
    var soupName = "soupFor_" + this.module.currentTestName; 
    var cache;

    Force.smartstoreClient.removeSoup(self.defaultStoreConfig,soupName)
        .then(function() {
            console.log("## Initialization of StoreCache's");
            cache = new Force.StoreCache(soupName, [ {path:"Name", type:"string"} ],null,self.defaultStoreConfig.isGlobal,self.defaultStoreConfig.storeName);
            return cache.init();
        })
        .then(function() {
            console.log("## Local creation");
            createdRecords = [];
            for (var i = 0; i < 3; i++) {
                createdRecords.push({Id:"local_" + i, Name:"testSyncUpLocallyCreated" + i, __locally_created__:true, attributes:{type:"Account"}});
            }
            return cache.saveAll(createdRecords);
        })
        .then(function(records) {
            console.log("## Calling sync up");
            return self.trySyncUp(self.defaultStoreConfig, soupName, options);
        })
        .then(function() {
            console.log("## Checking cache");
            return cache.find({queryType:"range", indexPath:"Name", order:"ascending", pageSize:3});
        })
        .then(function(result) {
            console.log("## Checking data returned from cache");
            QUnit.equals(result.records.length, 3, "Expected 3 records");
            _.each(result.records, function(record) {
                QUnit.ok(!record.__local__, "Record should no longer marked as local");
                QUnit.ok(!record.__locally_created__, "Record should no longer marked as created");
                QUnit.ok(record.Id.indexOf("local_") == -1, "Record's id should no longer be a local id");
            });

            _.each(result.records, function(record) {
                idToName[record.Id] = record.Name;
            });

            console.log("## Checking server");
            return checkServerMultiple(result.records);
        })
        .then(function() {
            return Promise.all([deleteRecords(idToName), Force.smartstoreClient.removeSoup(soupName)]);
        })
        .then(function() {
            self.finalizeTest();
        });
};


/**
 * TEST smartsyncplugin syncUp + getSyncStatus + deleteSync by id
 */
SmartSyncTestSuite.prototype.testSyncUpGetSyncDeleteSyncById = function() {
    console.log("# In SmartSyncTestSuite." + this.module.currentTestName);
    var self = this;
    var idToName = {};
    var createdRecords;
    var options = {fieldlist: ["Name"], mergeMode: cordova.require("com.salesforce.plugin.smartsync").MERGE_MODE.OVERWRITE};
    var soupName = "soupFor_" + this.module.currentTestName; 
    var cache;
    var syncUpId;

    Force.smartstoreClient.removeSoup(self.defaultStoreConfig,soupName)
        .then(function() {
            QUnit.ok(1, "Passed");
            console.log("## Initialization of StoreCache's");
            cache = new Force.StoreCache(soupName, [ {path:"Name", type:"string"} ],"Id",self.defaultStoreConfig.isGlobalStore,self.defaultStoreConfig.storeName);
            return cache.init();
        })
        .then(function() {
            console.log("## Local creation");
            createdRecords = [];
            for (var i = 0; i < 3; i++) {
                createdRecords.push({Id:"local_" + i, Name:"testSyncUpLocallyCreated" + i, __locally_created__:true, attributes:{type:"Account"}});
            }
            return cache.saveAll(createdRecords);
        })
        .then(function() {
            console.log("## Calling sync up");
            return self.trySyncUp(self.defaultStoreConfig, soupName, options);
        })
        .then(function(syncId) {
            syncUpId = syncId;
            return self.getSyncStatus(self.defaultStoreConfig, syncUpId);
        })
        .then(function(sync) {
            assertContains(sync, {_soupEntryId: syncUpId, type:"syncUp", progress:100, soupName: soupName});
            return self.deleteSync(self.defaultStoreConfig, syncUpId);
        })
        .then(function() {
            return self.getSyncStatus(self.defaultStoreConfig, syncUpId);
        })
        .then(function(sync) {
            QUnit.ok(sync == null, "Sync should no longer exist");
            return Promise.all([deleteRecords(idToName), Force.smartstoreClient.removeSoup(soupName)]);
        })
        .then(function() {
            self.finalizeTest();
        });
};

/**
 * TEST smartsyncplugin syncUp + getSyncStatus + deleteSync by name
 */
SmartSyncTestSuite.prototype.testSyncUpGetSyncDeleteSyncByName = function() {
    console.log("# In SmartSyncTestSuite." + this.module.currentTestName);
    var self = this;
    var idToName = {};
    var createdRecords;
    var options = {fieldlist: ["Name"], mergeMode: cordova.require("com.salesforce.plugin.smartsync").MERGE_MODE.OVERWRITE};
    var soupName = "soupFor_" + this.module.currentTestName; 
    var syncName = "syncFor_" + this.module.currentTestName;
    var cache;
    var syncUpId;

    Force.smartstoreClient.removeSoup(self.defaultStoreConfig,soupName)
        .then(function() {
            QUnit.ok(1, "Passed");
            console.log("## Initialization of StoreCache's");
            cache = new Force.StoreCache(soupName, [ {path:"Name", type:"string"} ],"Id",self.defaultStoreConfig.isGlobalStore,self.defaultStoreConfig.storeName);
            return cache.init();
        })
        .then(function() {
            console.log("## Local creation");
            createdRecords = [];
            for (var i = 0; i < 3; i++) {
                createdRecords.push({Id:"local_" + i, Name:"testSyncUpLocallyCreated" + i, __locally_created__:true, attributes:{type:"Account"}});
            }
            return cache.saveAll(createdRecords);
        })
        .then(function() {
            console.log("## Calling sync up");
            return self.trySyncUp(self.defaultStoreConfig, soupName, options, syncName);
        })
        .then(function(syncId) {
            syncUpId = syncId;
            return self.getSyncStatus(self.defaultStoreConfig, syncName);
        })
        .then(function(sync) {
            assertContains(sync, {_soupEntryId: syncUpId, type:"syncUp", progress:100, soupName: soupName, name: syncName});
            return self.deleteSync(self.defaultStoreConfig, syncName);
        })
        .then(function() {
            return self.getSyncStatus(self.defaultStoreConfig, syncName);
        })
        .then(function(sync) {
            QUnit.ok(sync == null, "Sync should no longer exist");
            return self.getSyncStatus(self.defaultStoreConfig, syncUpId);
        })
        .then(function(sync) {
            QUnit.ok(sync == null, "Sync should no longer exist");
            return Promise.all([deleteRecords(idToName), Force.smartstoreClient.removeSoup(soupName)]);
        })
        .then(function() {
            self.finalizeTest();
        });
};


//-------------------------------------------------------------------------------------------------------
//
// Helper methods
//
//-------------------------------------------------------------------------------------------------------

/**
 * Helper method to check local flags
 */
var checkLocalFlags = function (data, local, locallyCreated, locallyUpdated, locallyDeleted) {
    QUnit.equals(data.__local__, local, "__local__ wrong at " + getCaller());
    QUnit.equals(data.__locally_created__, locallyCreated, "__locally_created__ wrong at " + getCaller());
    QUnit.equals(data.__locally_updated__, locallyUpdated, "__locally_created__ wrong at " + getCaller());
    QUnit.equals(data.__locally_deleted__, locallyDeleted, "__locally_created__ wrong at " + getCaller());
};

/**
 * Helper method that checks that <data> contains <expectedData> and fires QUnit failures otherwise
 */
var assertContains = function (data, expectedData, caller, ctx) {
    if (caller == null) caller = getCaller();
    if (expectedData == null || data == null) {
        QUnit.equals(data, expectedData, "null " + (expectedData == null ? "" : "not ") + "expected at " + caller);
        return;
    }
    _.each(_.keys(expectedData), function(key) {
        var ctxKey = (ctx == null ? "" : ctx + ".") + key;
        QUnit.equals(_.has(data, key), true, "Should contain field " + ctxKey + " at " + caller);
        if (!_.isObject(data[key])) {
            // console.log("Comparing value for field " + ctxKey + " at " + caller);
            QUnit.equals(data[key], expectedData[key], "Not the expected value for field " + ctxKey + " at " + caller);
        } else {
            assertContains(data[key], expectedData[key], caller, ctxKey);
        }
    });
}

/**
 * Helper method to get the caller + line number of the function calling getCaller()
 */
var getCaller = function() {
	try {
		throw new Error();
	} catch ( e ) {
        var simplifiedStack = _.filter(_.map(e.stack.split("\n"),
                                             function(line) {var m = line.match(/SmartSyncTestSuite.js:[0-9]*:[0-9]*/); return m == null ? null : m[0];}),
                                       function(x) { return x != null; });
        return simplifiedStack[2]; // 0->getCaller, 1-->assertContains or checkLocalFlags, 2-->the caller we are interested in!
	}
}

/**
 * Helper method to create several records on server
 */
var createRecords = function(idToName, prefix, count) {
    return Promise.all(_.map(_.range(count), function(i) {
        var name = prefix + i;
        console.log("Creating " + name);
        return Force.forceJsClient.create("Account", {Name:name})
            .then(function(resp) {
                console.log("Created" + name);
                idToName[resp.id] = name;
            });
    }));
};

/**
 * Helper method to update several records on server
 */
var updateRecords = function(idToUpdatedName) {
    return Promise.all(_.map(_.keys(idToUpdatedName), function(id) {
        var updatedName = idToUpdatedName[id];
        console.log("Updating " + updatedName);
        return Force.forceJsClient.update("Account",{Id:id, Name:updatedName})
            .then(function(resp) {
                console.log("Updated " + updatedName);
            });
    }));
};

/**
 * Helper method to delete several records on server
 */
var deleteRecords = function(idToName) {
    return Promise.all(_.map(_.keys(idToName), function(id) {
        var name = idToName[id];
        console.log("Deleting " + name);
        return Force.forceJsClient.del("account", id)
                    .then(function() {
                        console.log("Deleted " + name);
                    });
    }));
};

/**
 * Helper function turning event listener into promise
 */
var eventPromiser = function(object, eventName, filter) {
    return new Promise(function(resolve, reject) {
        var listener = function(e) {
            if (filter(e)) {
                resolve(e);
                object.removeEventListener(eventName, listener);
            }
        }
        object.addEventListener(eventName, listener, false);
    });
};

/**
 * Helper function turning setTimeout into promise
 */
var timeoutPromiser = function(millis) {
    return new Promise(function(resolve, reject) {
        setTimeout(function() {
            resolve();
        }, millis);
    });
};

/**
 * Helper function turning function taking success/error options into promise
 */
var optionsPromiser = function(object, methodName, objectName) {
    var retfn = function () {
        var args = Array.prototype.slice.call(arguments);

        return new Promise(function(resolve, reject) {
            if (args.length == 0 || !_.isObject(_.last(args))) { args.push({}); }
            var options = _.last(args);
            options.success = function() {resolve.apply(null, arguments);};
            options.error = function() {reject.apply(null, arguments);};
            console.log("-----> Calling " + objectName + ":" + methodName);
            object[methodName].apply(object, args);
        });
    };
    return retfn;
};

/**
 * Helper function to wrap a rejected promise into a promise that returns either:
 * {success:true, result:<wrapped promise result>} or {success:false, result:<wrapper promise fail result>}
 */
var rejectedPromiseWrapper = function(p) {
    return new Promise(function(resolve, reject) {
        p
            .then(function(result) {
                resolve({success:true, result:result});
            })
            .catch(function(err) {
                resolve({success: false, result:err});
            });
    });
};


/**
 * Helper function to check cache
 */
var checkCache = function(id, expectedCacheRecord, cache, caller) {
    if (cache == null) {
        // no cache specified: expectedCacheRecord should be null
        assertContains(null, expectedCacheRecord, caller);
        return Promise.resolve();
    }
    if (caller == null) caller = getCaller();
    console.log("## Direct retrieve from cache");
    return cache.retrieve(id)
        .then(function(data) {
            console.log("## Checking data returned from cache");
            assertContains(data, expectedCacheRecord, caller);
        });
};

/**
 * Helper function to check server
 */
var checkServer = function(id, expectedServerRecord, caller) {
    if (caller == null) caller = getCaller();
    if (id.indexOf("local_") == 0) {
        // local id: server won't have record
        assertContains(null, expectedServerRecord, caller);
        return Promise.resolve();
    }
    console.log("## Direct retrieve from server");
    var fields = expectedServerRecord == null ? "Id" : _.select(_.keys(expectedServerRecord), function(field) { return field.indexOf("__local") == -1; }).join(",");
    return Force.forceJsClient.query("select " + fields + " from Account where Id = '" + id + "'")
        .then(function(resp) {
            console.log("## Checking data returned from server");
            assertContains(resp.records.length == 0 ? null : resp.records[0], expectedServerRecord, caller);
        });
};

/**
 * Helper method to check several records on server
 */
var checkServerMultiple = function(records, caller) {
    if (caller == null) caller = getCaller();
    return Promise.all(_.map(records, function(record) {
        var expectedServerRecord = _.omit(record, "__local__", "__locally_created__", "__locally_deleted__", "__locally_updated__", "attributes", "_soupEntryId", "_soupLastModifiedDate");
        return checkServer(record.Id, expectedServerRecord, caller);
    }));
};


/**
 * Helper function to check result, server and caches
 */
var checkResultServerAndCaches = function(data, expectedData, id, expectedServerRecord, expectedCacheRecord, cache, expectedCacheRecord2, cache2, caller) {
    if (caller == null) caller = getCaller();
    console.log("## Checking data returned by sync call");
    assertContains(data, expectedData, caller);
    return Promise.all([checkServer(id, expectedServerRecord, caller), checkCache(id, expectedCacheRecord, cache, caller), checkCache(id, expectedCacheRecord2, cache2, caller)]);
};

/**
 * Helper function to try syncSObjectDetectConflict
 * Save theirs to server, yours to cache and base to cacheForOriginals
 * Then does a syncSObjectDetectConflict with the given method, cacheMode and mergeMode
 * Compare the result with expectedResult
 * When the operation is successful, also checks that the server now has newTheirs, cache has newYours and cacheForOriginals has newBase
 * If cleanup is true, the record is then deleted from the server
 */
var tryConflictDetection = function(message, cache, cacheForOriginals, theirs, yours, base, method, fieldlist, cacheMode, mergeMode, expectedResult, cleanup, newTheirs, newYours, newBase) {
    var caller = getCaller();
    var id;
    console.log("## Direct creation on server");
    return Force.forceJsClient.create("Account", theirs)
    .then(function(data) {
        id = data.id;
        console.log("## Direct insertion in cache");
        if (cache != null && yours != null) return cache.save(_.extend({Id:id}, yours));
    })
    .then(function() {
        console.log("## Direct insertion in cacheForOriginals");
        if (cacheForOriginals != null && base != null) return cacheForOriginals.save(_.extend({Id:id}, base));
    })
    .then(function() {
        console.log("## Trying " + method + " " + cacheMode + " with mergeMode " + mergeMode + " " + message);
        return rejectedPromiseWrapper(Force.syncSObjectDetectConflict(method, "Account", id, yours, fieldlist, cache, cacheMode, cacheForOriginals, mergeMode))
    })
    .then(function(result) {
        assertContains(result, expectedResult, caller);
        if (expectedResult.success) return checkResultServerAndCaches(result.result, newTheirs, id, newTheirs, newYours, cache, newBase, cacheForOriginals, caller);
    })
    .then(function() {
        if (cleanup) return Force.forceJsClient.del("account", id);
    });
};

}


/**
 Helper function to run sync down and consume all status updates until done
 */
SmartSyncTestSuite.prototype.trySyncDown = function(storeConfig, cache, soupName, idToName, mergeMode, target, syncName) {
    var isGlobalStore = storeConfig.isGlobalStore;
    var options = {mergeMode: mergeMode};
    target = target || {type:"soql", query:"SELECT Id, Name, LastModifiedDate FROM Account WHERE Id IN ('" +  _.keys(idToName).join("','") + "') ORDER BY Name"};
    var numberRecords = _.keys(idToName).length;
    var syncDownId;
    return this.syncDown(storeConfig, target, soupName, options, syncName)
        .then(function(sync) {
            console.log("## Checking sync");
            syncDownId = sync._soupEntryId;
            assertContains(sync, {type:"syncDown", target: target, status:"RUNNING", progress:0, soupName: soupName, options:options});
            return eventPromiser(document, "sync", function(event) { return event.detail.status == "DONE";});
        })
        .then(function(event) {
            console.log("## Checking event");
            assertContains(event.detail, {type:"syncDown", target: target, status:"DONE", progress:100, totalSize: numberRecords, soupName: soupName, options:options});
            console.log("## Checking cache");
            return cache.find({queryType:"range", indexPath:"Name", order:"ascending", pageSize:numberRecords});
        })
        .then(function(result) {
            console.log("## Checking data returned from cache");
            QUnit.equals(result.records.length, numberRecords, "Expected " + numberRecords + " records");
            QUnit.deepEqual(_.values(idToName).sort(), _.pluck(result.records, "Name"), "Wrong names");
            return syncDownId;
        });
};

/**
 Helper function to run reSync and consume all status updates until done
 */
SmartSyncTestSuite.prototype.tryReSync = function(cache, soupName, idToName, syncDownId, updatedCount) {
    var numberRecords = _.keys(idToName).length;
    return this.reSync(syncDownId)
        .then(function(sync) {
            console.log("## Checking sync");
            assertContains(sync, {_soupEntryId:syncDownId, type:"syncDown", status:"RUNNING", progress:0, soupName: soupName});
            return eventPromiser(document, "sync", function(event) { return event.detail.status == "DONE";});
        })
        .then(function(event) {
            console.log("## Checking event");
            assertContains(event.detail, {_soupEntryId: syncDownId, type:"syncDown", status:"DONE", progress:100, totalSize: updatedCount, soupName: soupName});

            console.log("## Checking cache");
            return cache.find({queryType:"range", indexPath:"Name", order:"ascending", pageSize:numberRecords});
        })
        .then(function(result) {
            console.log("## Checking data returned from cache");
            QUnit.equals(result.records.length, numberRecords, "Expected " + numberRecords + " records");
            QUnit.deepEqual(_.values(idToName).sort(), _.pluck(result.records, "Name"), "Wrong names");
            return syncDownId;
        });
};


/**
 Helper function to run sync up and consume all status updates until done
 */
SmartSyncTestSuite.prototype.trySyncUp = function(storeConfig, soupName, options, syncName) {
    var target = null;
    var syncUpId;
    return this.syncUp(storeConfig, target, soupName, options, syncName)
        .then(function(sync) {
            console.log("## Checking sync");
            syncUpId = sync._soupEntryId;
            assertContains(sync, {type:"syncUp", options: options, status:"RUNNING", progress:0, soupName: soupName});
            return eventPromiser(document, "sync", function(event) { return event.detail.status == "DONE";});
        })
        .then(function(event) {
            console.log("## Checking event");
            assertContains(event.detail, {type:"syncUp", options: options, status:"DONE", progress:100, soupName: soupName, isGlobalStore: storeConfig.isGlobalStore});
            return syncUpId;
        });
};
