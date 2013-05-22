/*
 * Copyright (c) 2013, salesforce.com, inc.
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

/**
 * An abstract super class for SmartStore test suites
 * This file assumes that qunit.js has been previously loaded, as well as jquery.js and SFTestSuite.js
 */
if (typeof ForceEntityTestSuite === 'undefined') { 



/**
 * Constructor
 */
var ForceEntityTestSuite = function () {
    SFTestSuite.call(this, "ForceEntityTestSuite");

    // To run specific tests
    // this.testsToRun = ["testSyncSObjectDetectConflictUpdate"];
};

// We are sub-classing SFTestSuite
ForceEntityTestSuite.prototype = new SFTestSuite();
ForceEntityTestSuite.prototype.constructor = ForceEntityTestSuite;

/** 
 * TEST Force.StoreCache.init 
 */
ForceEntityTestSuite.prototype.testStoreCacheInit = function() {
    console.log("# In ForceEntityTestSuite.testStoreCacheInit");
    var self = this;
    var soupName = "testSoupForStoreCache";
    Force.smartstoreClient.soupExists(soupName)
    .then(function(exists) {
        QUnit.equals(exists, false, "soup should not already exist");
        console.log("## Initialization of StoreCache");
        var cache = new Force.StoreCache(soupName);
        return cache.init();
    })
    .then(function() {
        console.log("## Verifying that underlying soup was created");
        return Force.smartstoreClient.soupExists(soupName)        
    })
    .then(function(exists) {
        QUnit.equals(exists, true, "soup should now exist");
        console.log("## Cleaning up");
        return Force.smartstoreClient.removeSoup(soupName);
    })
    .then(function() {
        self.finalizeTest();
    });
}


/** 
 * TEST Force.StoreCache.retrieve
 */
ForceEntityTestSuite.prototype.testStoreCacheRetrieve = function() {
    console.log("# In ForceEntityTestSuite.testStoreCacheRetrieve");
    var self = this;
    var cache;
    var soupName = "testSoupForStoreCache";
    Force.smartstoreClient.removeSoup(soupName)
    .then(function() {
        console.log("## Initialization of StoreCache");
        cache = new Force.StoreCache(soupName);
        return cache.init();
    })
    .then(function() {
        console.log("## Direct upsert in underlying soup");
        return Force.smartstoreClient.upsertSoupEntriesWithExternalId(soupName, [{Id:"007", Name:"JamesBond", Address:{City:"London"}}], "Id");
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
        return Force.smartstoreClient.removeSoup(soupName);        
    })
    .then(function() {
        self.finalizeTest();
    });
}

/** 
 * TEST Force.StoreCache.save
 */
ForceEntityTestSuite.prototype.testStoreCacheSave = function() {
    console.log("# In ForceEntityTestSuite.testStoreCacheSave");
    var self = this;
    var cache;
    var soupName = "testSoupForStoreCache";
    Force.smartstoreClient.removeSoup(soupName)
    .then(function() {
        console.log("## Initialization of StoreCache");
        cache = new Force.StoreCache(soupName);
        return cache.init();
    })
    .then(function() {
        console.log("## Saving record to cache");
        return cache.save({Id:"007", Name:"JamesBond", Mission:"TopSecret"});
    })
    .then(function(record) {
        console.log("## Direct retrieve from underlying cache");
        return Force.smartstoreClient.retrieveSoupEntries(soupName, [record._soupEntryId]);
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
        return Force.smartstoreClient.retrieveSoupEntries(soupName, [record._soupEntryId]);
    })
    .then(function(records) {
        console.log("## Checking returned record is the merge of original fields and newly provided fields");
        QUnit.equals(records.length, 1, "one record should have been returned");
        assertContains(records[0], {Id:"007", Name:"JamesBond", Mission:"TopSecret2", Organization:"MI6"});

        console.log("## Saving partial record to cache with noMerge flag");
        return cache.save({Id:"007", Mission:"TopSecret3"}, true);
    })
    .then(function(record) {
        console.log("## Direct retrieve from underlying cache");
        return Force.smartstoreClient.retrieveSoupEntries(soupName, [record._soupEntryId]);
    })
    .then(function(records) {
        console.log("## Checking returned record just has newly provided fields");
        QUnit.equals(records.length, 1, "one record should have been returned");
        assertContains(records[0], {Id:"007", Mission:"TopSecret3"});
        QUnit.equals(_.has(records[0], "Name"), false, "Should not have a name field");
        QUnit.equals(_.has(records[0], "Organization"), false, "Should not have an organization field");
        console.log("## Cleaning up");
        return Force.smartstoreClient.removeSoup(soupName);        
    })
    .then(function() {
        self.finalizeTest();
    });
}


/** 
 * TEST Force.StoreCache.saveAll
 */
ForceEntityTestSuite.prototype.testStoreCacheSaveAll = function() {
    console.log("# In ForceEntityTestSuite.testStoreCacheSaveAll");
    var self = this;
    var cache;
    var soupName = "testSoupForStoreCache";
    var soupEntryIds;
    Force.smartstoreClient.removeSoup(soupName)
    .then(function() {
        console.log("## Initialization of StoreCache");
        cache = new Force.StoreCache(soupName);
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
        return Force.smartstoreClient.retrieveSoupEntries(soupName, soupEntryIds);
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
        return Force.smartstoreClient.retrieveSoupEntries(soupName, soupEntryIds);
    })
    .then(function(records) {
        console.log("## Checking returned records are the merge of original fields and newly provided fields");
        QUnit.equals(records.length, 3, "three records should have been returned");
        assertContains(records[0], {Id:"007", Name:"JamesBond", Mission:"TopSecret-007"});
        assertContains(records[1], {Id:"008", Name:"Agent008", Team:"Team-008"});
        assertContains(records[2], {Id:"009", Name:"JamesOther", Organization:"MI6"});

        console.log("## Saving partial records to cache with noMerge flag");
        var partialRecords = [{Id:"007", Mission:"TopSecret"},{Id:"008", Team:"Team"}, {Id:"009", Organization:"Org"}];        
        return cache.saveAll(partialRecords, true);
    })
    .then(function(records) {
        console.log("## Direct retrieve from underlying cache");
        return Force.smartstoreClient.retrieveSoupEntries(soupName, soupEntryIds);
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
        return Force.smartstoreClient.removeSoup(soupName);        
    })
    .then(function() {
        self.finalizeTest();
    });
}

/** 
 * TEST Force.StoreCache.remove
 */
ForceEntityTestSuite.prototype.testStoreCacheRemove = function() {
    console.log("# In ForceEntityTestSuite.testStoreCacheRemove");
    var self = this;
    var cache;
    var soupName = "testSoupForStoreCache";
    var recordEntryId;
    Force.smartstoreClient.removeSoup(soupName)
    .then(function() {
        console.log("## Initialization of StoreCache");
        cache = new Force.StoreCache(soupName);
        return cache.init();
    })
    .then(function() {
        console.log("## Direct upsert in underlying soup");
        return Force.smartstoreClient.upsertSoupEntriesWithExternalId(soupName, [{Id:"007", Name:"JamesBond"}], "Id");
    })
    .then(function(records) {
        recordEntryId = records[0]._soupEntryId;
        console.log("## Removing non-existent record");
        return cache.remove("008");
    })
    .then(function() {
        console.log("## Checking record is still there");
        return Force.smartstoreClient.retrieveSoupEntries(soupName, [recordEntryId]);
    })
    .then(function(records) {
        console.log("## Checking returned record");
        assertContains(records[0], {Id:"007"});
        console.log("## Removing record");
        return cache.remove("007");
    })
    .then(function() {
        console.log("## Checking record is no longer there");
        return Force.smartstoreClient.retrieveSoupEntries(soupName, [recordEntryId]);
    })
    .then(function(records) {
        QUnit.equals(records[0], undefined, "wrong record returned");
        console.log("## Cleaning up");
        return Force.smartstoreClient.removeSoup(soupName);        
    })
    .then(function() {
        self.finalizeTest();
    });
}

/** 
 * TEST Force.StoreCache.find
 */
ForceEntityTestSuite.prototype.testStoreCacheFind = function() {
    console.log("# In ForceEntityTestSuite.testStoreCacheFind");
    var self = this;
    var cache;
    var soupName = "testSoupForStoreCache";
    var resultSet;
    Force.smartstoreClient.removeSoup(soupName)
    .then(function() {
        console.log("## Initialization of StoreCache");
        cache = new Force.StoreCache(soupName, [ {path:"Name", type:"string"}, {path:"Mission", type:"string"} ]);
        return cache.init();
    })
    .then(function() {
        console.log("## Direct upsert in underlying soup");
        var records = [{Id:"007", Name:"JamesBond"},{Id:"008", Name:"Agent008"}, {Id:"009", Name:"JamesOther"}];
        return Force.smartstoreClient.upsertSoupEntriesWithExternalId(soupName, records, "Id");
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
        return cache.find({queryType:"smart", smartSql:"SELECT {testSoupForStoreCache:_soup} FROM {testSoupForStoreCache} WHERE {testSoupForStoreCache:Name} LIKE '%' ORDER BY LOWER({testSoupForStoreCache:Mission})", pageSize:3});
    })
    .then(function(result) {
        console.log("## Checking returned result - expect case-insensitive sorting");        
        QUnit.equals(result.records.length, 3, "three records should have been returned");
        assertContains(result.records[0], {Id:"007", Name:"JamesBond", Mission:"ABC"});
        assertContains(result.records[1], {Id:"008", Name:"Agent008", Mission:"bcd"});
        assertContains(result.records[2], {Id:"009", Name:"JamesOther", Mission:"EFG"});
        QUnit.equals(result.hasMore(), false, "there should not be more records");

        console.log("## Cleaning up");
        return Force.smartstoreClient.removeSoup(soupName);
    })
    .then(function() {
        self.finalizeTest();
    });
}

/** 
 * TEST Force.StoreCache.addLocalFields
 */
ForceEntityTestSuite.prototype.testStoreCacheAddLocalFields = function() {
    console.log("# In ForceEntityTestSuite.testStoreCacheAddLocalFields");
    var soupName = "testSoupForStoreCache";
    var cache = new Force.StoreCache(soupName);    

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
 * TEST Force.SObjectType.describe
 */
ForceEntityTestSuite.prototype.testSObjectTypeDescribe = function() {
    console.log("# In ForceEntityTestSuite.testSObjectTypeDescribe");
    var self = this;
    var soupName = "testSoupForSObjectType";
    var cache;
    var describeResult;

    Force.smartstoreClient.removeSoup(soupName)
    .then(function() {
        console.log("## Initialization of StoreCache");
        cache = new Force.StoreCache(soupName);
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
        return Force.smartstoreClient.removeSoup(soupName);
    })
    .then(function() {
        self.finalizeTest();
    });

}

/** 
 * TEST Force.SObjectType.getMetadata
 */
ForceEntityTestSuite.prototype.testSObjectTypeGetMetadata = function() {
    console.log("# In ForceEntityTestSuite.testSObjectTypeGetMetadata");
    var self = this;
    var soupName = "testSoupForSObjectType";
    var cache;
    var metadataResult;

    Force.smartstoreClient.removeSoup(soupName)
    .then(function() {
        console.log("## Initialization of StoreCache");
        cache = new Force.StoreCache(soupName);
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
        return Force.smartstoreClient.removeSoup(soupName);
    })
    .then(function() {
        self.finalizeTest();
    });

}

/** 
 * TEST Force.SObjectType.reset
 */
ForceEntityTestSuite.prototype.testSObjectTypeRest = function() {
    console.log("# In ForceEntityTestSuite.testSObjectTypeRest");
    var self = this;
    var soupName = "testSoupForSObjectType";
    var cache;
    var sobjectType;

    Force.smartstoreClient.removeSoup(soupName)
    .then(function() {
        console.log("## Initialization of StoreCache");
        cache = new Force.StoreCache(soupName);
        return cache.init();
    })
    .then(function() { 
        console.log("## Calling getMetadata and describe");
        sobjectType = new Force.SObjectType("Account", cache);
        return $.when(sobjectType.getMetadata(), sobjectType.describe());
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
        return Force.smartstoreClient.removeSoup(soupName);
    })
    .then(function() {
        self.finalizeTest();
    });

}

/** 
 * TEST Force.syncSObjectWithCache for create method
 */
ForceEntityTestSuite.prototype.testSyncSObjectWithCacheCreate = function() {
    console.log("# In ForceEntityTestSuite.testSyncSObjectWithCacheCreate");
    var self = this;
    var soupName = "testSoupForSyncSObjectWithCache";
    var cache;

    Force.smartstoreClient.removeSoup(soupName)
    .then(function() {
        console.log("## Initialization of StoreCache");
        cache = new Force.StoreCache(soupName);
        return cache.init();
    })
    .then(function() {
        console.log("## Trying a create with localAction true");
        return Force.syncSObjectWithCache("create", null, {Name:"JamesBond"}, ["Name"], cache, true);
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
        return Force.syncSObjectWithCache("create", "008", {Name:"JamesOther"}, ["Name"], cache, false);
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
        return Force.syncSObjectWithCache("create", "009", {Name:"JamesNine", Mission:"TopSecret", City:"London"}, ["Name", "City"], cache, false);
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
        return Force.syncSObjectWithCache("create", "010", {Name:"JamesTen", Mission:"TopSecret", City:"London"}, null, cache, false);
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
        return Force.smartstoreClient.removeSoup(soupName);
    })
    .then(function() {
        self.finalizeTest();
    });

}

/** 
 * TEST Force.syncSObjectWithCache for read method
 */
ForceEntityTestSuite.prototype.testSyncSObjectWithCacheRead = function() {
    console.log("# In ForceEntityTestSuite.testSyncSObjectWithCacheRead");
    var self = this;
    var soupName = "testSoupForSyncSObjectWithCache";
    var cache;

    Force.smartstoreClient.removeSoup(soupName)
    .then(function() {
        console.log("## Initialization of StoreCache");
        cache = new Force.StoreCache(soupName);
        return cache.init();
    })
    .then(function() {
        console.log("## Direct upsert in underlying soup");
        var records = [{Id:"007", Name:"JamesBond"},{Id:"008", Name:"Agent008"}, {Id:"009", Name:"JamesOther"}];
        return cache.saveAll(records);
    })
    .then(function(records) {
        console.log("## Trying read for existing record");
        return Force.syncSObjectWithCache("read", "007", null, ["Name"], cache);
    })
    .then(function(data) {
        console.log("## Checking data returned by sync call");
        assertContains(data, {Id:"007", Name:"JamesBond"});

        console.log("## Trying read for non-existing record");
        return Force.syncSObjectWithCache("read", "010", null, ["Name"], cache);
    })
    .then(function(data) {
        console.log("## Checking data returned by sync call");
        QUnit.equals(data, null, "No data should have been returned");

        console.log("## Trying read for existing record but asking for missing fields");
        return Force.syncSObjectWithCache("read", "007", null, ["Name", "Mission"], cache);
    })
    .then(function(data) {
        console.log("## Checking data returned by sync call");
        QUnit.equals(data, null, "No data should have been returned");

        console.log("## Trying read for existing record with null fieldlist");
        return Force.syncSObjectWithCache("read", "007", null, null, cache);
    })
    .then(function(data) {
        console.log("## Checking data returned by sync call");
        assertContains(data, {Id:"007", Name:"JamesBond"});

        console.log("## Cleaning up");
        return Force.smartstoreClient.removeSoup(soupName);
    })
    .then(function() {
        self.finalizeTest();
    });
}

/** 
 * TEST Force.syncSObjectWithCache for update method
 */
ForceEntityTestSuite.prototype.testSyncSObjectWithCacheUpdate = function() {
    console.log("# In ForceEntityTestSuite.testSyncSObjectWithUpdate");
    var self = this;
    var soupName = "testSoupForSyncSObjectWithCache";
    var cache;

    Force.smartstoreClient.removeSoup(soupName)
    .then(function() {
        console.log("## Initialization of StoreCache");
        cache = new Force.StoreCache(soupName);
        return cache.init();
    })
    .then(function() {
        console.log("## Trying a create with localAction true");
        return Force.syncSObjectWithCache("create", null, {Name:"JamesBond"}, ["Name"], cache, true);
    })
    .then(function(data) {
        console.log("## Trying an update with localAction true");
        return Force.syncSObjectWithCache("update", data.Id, {Mission:"TopSecret"}, ["Mission"], cache, true);
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
        return Force.syncSObjectWithCache("update", "007", {Id:"007", Name:"JamesBond", Mission:"TopSecret2"}, ["Name", "Mission"], cache, false);
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
        return Force.syncSObjectWithCache("update", "007", {Name:"JamesBond3", Mission:"TopSecret3"}, ["Mission"], cache, false);
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
        return Force.syncSObjectWithCache("update", "007", {Name:"JamesBond4", Mission:"TopSecret4"}, null, cache, false);
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
        return Force.smartstoreClient.removeSoup(soupName);
    })
    .then(function() {
        self.finalizeTest();
    });

}

/** 
 * TEST Force.syncSObjectWithCache for delete method
 */
ForceEntityTestSuite.prototype.testSyncSObjectWithCacheDelete = function() {
    console.log("# In ForceEntityTestSuite.testSyncSObjectWithCacheDelete");
    var self = this;
    var soupName = "testSoupForSyncSObjectWithCache";
    var cache;

    Force.smartstoreClient.removeSoup(soupName)
    .then(function() {
        console.log("## Initialization of StoreCache");
        cache = new Force.StoreCache(soupName);
        return cache.init();
    })
    .then(function() {
        console.log("## Direct upsert in underlying soup");
        var records = [{Id:"007", Name:"JamesBond"},{Id:"008", Name:"Agent008"}, {Id:"009", Name:"JamesOther"}];
        return cache.saveAll(records);
    })
    .then(function(records) {
        console.log("## Trying delete for existing record");
        return Force.syncSObjectWithCache("delete", "007", null, null, cache);
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
        return Force.syncSObjectWithCache("delete", "008", null, null, cache, true);
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
        return Force.syncSObjectWithCache("delete", "010", null, null, cache);
    })
    .then(function(data) {
        console.log("## Checking data returned by sync call");
        QUnit.equals(data, null, "No data should have been returned");

        console.log("## Cleaning up");
        return Force.smartstoreClient.removeSoup(soupName);
    })
    .then(function() {
        self.finalizeTest();
    });
}

/** 
 * TEST Force.syncSObjectWithServer for create method
 */
ForceEntityTestSuite.prototype.testSyncSObjectWithServerCreate = function() {
    console.log("# In ForceEntityTestSuite.testSyncSObjectWithServerCreate");
    var self = this;
    var id;

    console.log("## Trying create");
    Force.syncSObjectWithServer("create", "Account", null, {Name:"TestAccount"}, ["Name"])
    .then(function(data) {
        console.log("## Checking data returned by sync call");
        id = data.Id;
        assertContains(data, {Name:"TestAccount"});

        console.log("## Direct retrieve from server");
        return Force.forcetkClient.retrieve("Account", id, ["Id", "Name"]);
    })
    .then(function(data) {
        console.log("## Checking data returned from server");
        assertContains(data, {Id:id, Name:"TestAccount"});

        console.log("## Cleaning up");
        return Force.forcetkClient.del("account", id);
    })
    .then(function() {
        self.finalizeTest();
    });

}

/** 
 * TEST Force.syncSObjectWithServer for read method
 */
ForceEntityTestSuite.prototype.testSyncSObjectWithServerRead = function() {
    console.log("# In ForceEntityTestSuite.testSyncSObjectWithServerRead");
    var self = this;
    var id;

    console.log("## Direct creation against server");    
    Force.forcetkClient.create("Account", {Name:"TestAccount"})
        .then(function(resp) {
            id = resp.id;

            console.log("## Trying read call");
            return Force.syncSObjectWithServer("read", "Account", id, null, ["Id", "Name"]);
        })
        .then(function(data) {
            console.log("## Checking data returned from sync call");
            assertContains(data, {Id:id, Name:"TestAccount"});

            console.log("## Cleaning up");
            return Force.forcetkClient.del("account", id);
        })
        .then(function() {
            self.finalizeTest();
        });
};

/** 
 * TEST Force.syncSObjectWithServer for update method
 */
ForceEntityTestSuite.prototype.testSyncSObjectWithServerUpdate = function() {
    console.log("# In ForceEntityTestSuite.testSyncSObjectWithServerUpdate");
    var self = this;
    var id;

    console.log("## Direct creation against server");    
    Force.forcetkClient.create("Account", {Name:"TestAccount"})
        .then(function(resp) {
            id = resp.id;

            console.log("## Trying update call");
            return Force.syncSObjectWithServer("update", "Account", id, {Name:"TestAccount2"}, ["Name"]);
        })
        .then(function(data) {
            console.log("## Checking data returned from sync call");
            assertContains(data, {Name:"TestAccount2"});

            console.log("## Direct retrieve from server");
            return Force.forcetkClient.retrieve("Account", id, ["Id", "Name"]);
        })
        .then(function(data) {
            console.log("## Checking data returned from server");
            assertContains(data, {Id:id, Name:"TestAccount2"});

            console.log("## Cleaning up");
            return Force.forcetkClient.del("account", id);
        })
        .then(function() {
            self.finalizeTest();
        });
};

/** 
 * TEST Force.syncSObjectWithServer for delete method
 */
ForceEntityTestSuite.prototype.testSyncSObjectWithServerDelete = function() {
    console.log("# In ForceEntityTestSuite.testSyncSObjectWithServerDelete");
    var self = this;
    var id;

    console.log("## Direct creation against server");    
    Force.forcetkClient.create("Account", {Name:"TestAccount"})
        .then(function(resp) {
            id = resp.id;

            console.log("## Trying delete call");
            return Force.syncSObjectWithServer("delete", "Account", id);
        })
        .then(function(data) {
            QUnit.equals(data, null, "Expected null");
            checkServer(id, null);
        })
        .then(function() {
            self.finalizeTest();
        });
};

/** 
 * TEST Force.syncSObject for method create
 */
ForceEntityTestSuite.prototype.testSyncSObjectCreate = function() {
    console.log("# In ForceEntityTestSuite.testSyncSObjectCreate");
    var self = this;

    var cache;
    var soupName = "testSyncSObjectCreate";
    var id, id2;

    Force.smartstoreClient.removeSoup(soupName)
        .then(function() {
            console.log("## Initialization of StoreCache");
            cache = new Force.StoreCache(soupName);
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
            return $.when(Force.forcetkClient.del("account", id), Force.forcetkClient.del("account", id2), Force.smartstoreClient.removeSoup(soupName));
        })
        .then(function() {
            self.finalizeTest();
        });
};

/** 
 * TEST Force.syncSObject for method retrieve
 */
ForceEntityTestSuite.prototype.testSyncSObjectRetrieve = function() {
    console.log("# In ForceEntityTestSuite.syncSObjectRetrieve");
    var self = this;

    var cache;
    var soupName = "syncSObjectRetrieve";
    var id;
    var id2;

    Force.smartstoreClient.removeSoup(soupName)
        .then(function() {
            console.log("## Initialization of StoreCache");
            cache = new Force.StoreCache(soupName);
            return cache.init();
        })
        .then(function() {
            console.log("## Direct creation against server");    
            return Force.forcetkClient.create("Account", {Name:"TestAccount"});
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
            return Force.syncSObject("read", "Account", id, null, ["Name"], cache, Force.CACHE_MODE.CACHE_ONLY);
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
            return Force.forcetkClient.create("Account", {Name:"TestAccount2"});
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
            return $.when(Force.forcetkClient.del("account", id), Force.forcetkClient.del("account", id2), Force.smartstoreClient.removeSoup(soupName));
        })
        .then(function() {
            self.finalizeTest();
        });
};

/** 
 * TEST Force.syncSObject for method update
 */
ForceEntityTestSuite.prototype.testSyncSObjectUpdate = function() {
    console.log("# In ForceEntityTestSuite.syncSObjectUpdate");
    var self = this;
    var cache;
    var soupName = "syncSObjectUpdate";
    var id;

    Force.smartstoreClient.removeSoup(soupName)
        .then(function() {
            console.log("## Initialization of StoreCache");
            cache = new Force.StoreCache(soupName);
            return cache.init();
        })
        .then(function() {
            console.log("## Direct creation against server");    
            return Force.forcetkClient.create("Account", {Name:"TestAccount"});
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
            return Force.syncSObject("update", "Account", id, {Name:"TestAccount-updated2"}, ["Name"], cache, Force.CACHE_MODE.CACHE_ONLY);
        })
        .then(function(data) {
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
            return $.when(Force.forcetkClient.del("account", id), Force.smartstoreClient.removeSoup(soupName));
        })
        .then(function() {
            self.finalizeTest();
        });
};

/** 
 * TEST Force.syncSObject for method delete
 */
ForceEntityTestSuite.prototype.testSyncSObjectDelete = function() {
    console.log("# In ForceEntityTestSuite.syncSObjectDelete");
    var self = this;
    var cache;
    var soupName = "syncSObjectDelete";
    var id, id2;

    Force.smartstoreClient.removeSoup(soupName)
        .then(function() {
            console.log("## Initialization of StoreCache");
            cache = new Force.StoreCache(soupName);
            return cache.init();
        })
        .then(function() {
            console.log("## Direct creation against server");    
            return Force.forcetkClient.create("Account", {Name:"TestAccount"});
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
            return Force.forcetkClient.create("Account", {Name:"TestAccount"});
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
            return $.when(Force.smartstoreClient.removeSoup(soupName));
        })
        .then(function() {
            self.finalizeTest();
        });
};

/** 
 * TEST Force.syncSObjectDetectConflict for method create
 */
ForceEntityTestSuite.prototype.testSyncSObjectDetectConflictCreate = function() {
    console.log("# In ForceEntityTestSuite.syncSObjectDetectConflictCreate");
    var self = this;

    var cache, cacheForOriginals;
    var soupName = "testSyncSObjectDetectConflictCreate";
    var soupNameForOriginals = "testSyncSObjectDetectConflictCreate-originals";
    var id, id2;

    Force.smartstoreClient.removeSoup(soupName)
        .then(function() {
            console.log("## Initialization of StoreCaches");
            cache = new Force.StoreCache(soupName);
            cacheForOriginals = new Force.StoreCache(soupNameForOriginals);
            return $.when(cache.init(), cacheForOriginals.init());
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
            return $.when(Force.forcetkClient.del("account", id), Force.smartstoreClient.removeSoup(soupName), Force.smartstoreClient.removeSoup(soupNameForOriginals));
        })
        .then(function() {
            self.finalizeTest();
        });
};

/** 
 * TEST Force.syncSObjectDetectConflict for method retrieve
 */
ForceEntityTestSuite.prototype.testSyncSObjectDetectConflictRetrieve = function() {
    console.log("# In ForceEntityTestSuite.syncSObjectDetectConflictRetrieve");
    var self = this;

    var cache, cacheForOriginals;
    var soupName = "testSyncSObjectDetectConflictRetrieve";
    var soupNameForOriginals = "testSyncSObjectDetectConflictRetrieve-originals";
    var id, id2;

    Force.smartstoreClient.removeSoup(soupName)
        .then(function() {
            console.log("## Initialization of StoreCaches");
            cache = new Force.StoreCache(soupName);
            cacheForOriginals = new Force.StoreCache(soupNameForOriginals);
            return $.when(cache.init(), cacheForOriginals.init());
        })
        .then(function() {
            console.log("## Direct creation against server");    
            return Force.forcetkClient.create("Account", {Name:"TestAccount"});
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
            return Force.forcetkClient.create("Account", {Name:"TestAccount2"});
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
            return $.when(Force.forcetkClient.del("account", id), Force.forcetkClient.del("account", id2), Force.smartstoreClient.removeSoup(soupName), Force.smartstoreClient.removeSoup(soupNameForOriginals));
        })
        .then(function() {
            self.finalizeTest();
        });
};

/** 
 * TEST Force.syncSObjectDetectConflict for method update
 */
ForceEntityTestSuite.prototype.testSyncSObjectDetectConflictUpdate = function() {
    console.log("# In ForceEntityTestSuite.syncSObjectDetectConflictUpdate");
    var self = this;
    var cache, cacheForOriginals;
    var soupName = "testSyncSObjectDetectConflictUpdate";
    var soupNameForOriginals = "testSyncSObjectDetectConflictUpdate-originals";
    var id;

    Force.smartstoreClient.removeSoup(soupName)
        .then(function() {
            console.log("## Initialization of StoreCaches");
            cache = new Force.StoreCache(soupName);
            cacheForOriginals = new Force.StoreCache(soupNameForOriginals);
            return $.when(cache.init(), cacheForOriginals.init());
        })
        .then(function() {
            console.log("## Direct creation against server");    
            return Force.forcetkClient.create("Account", {Name:"TestAccount"});
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

    //
    // TODO Try update with conflicts and various merge modes
    // 

        .then(function() {
            console.log("## Cleaning up");
            return $.when(Force.forcetkClient.del("account", id), Force.smartstoreClient.removeSoup(soupName));
        })
        .then(function() {
            self.finalizeTest();
        });
};

/** 
 * TEST Force.syncSObjectDetectConflict for method delete
 */
ForceEntityTestSuite.prototype.testSyncSObjectDetectConflictDelete = function() {
    console.log("# In ForceEntityTestSuite.syncSObjectDetectConflictDelete");
    var self = this;
    var cache, cacheForOriginals;
    var soupName = "testSyncSObjectDetectConflictDelete";
    var soupNameForOriginals = "testSyncSObjectDetectConflictDelete-originals";
    var id, id2, id3;
    var base, yours, theirs;

    Force.smartstoreClient.removeSoup(soupName)
        .then(function() {
            console.log("## Initialization of StoreCaches");
            cache = new Force.StoreCache(soupName);
            cacheForOriginals = new Force.StoreCache(soupNameForOriginals);
            return $.when(cache.init(), cacheForOriginals.init());
        })
        .then(function() {
            console.log("## Direct creation against server");    
            return Force.forcetkClient.create("Account", {Name:"TestAccount"});
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
            return Force.forcetkClient.create("Account", {Name:"TestAccount"});
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
            console.log("## Direct creation against server");    
            return Force.forcetkClient.create("Account", {Name:"TestAccount-1", Industry: "Computer-1", Phone:"111"});
        })
        .then(function(data) {
            id3 = data.id;
            theirs = {Id:id3, Name:"TestAccount-1", Industry:"Computer-1"};
            base = {Id:id3, Name:"TestAccount-0", Industry:"Computer-1"};
            console.log("## Direct insertion in cacheForOriginals with name different from server");    
            return cacheForOriginals.save(base);
        })
        .then(function() {
            console.log("## Trying delete server-first with mergeMode MERGE_FAIL_IF_CHANGED with non-conflicting remote change");
            yours = {Id:id3, Name: "TestAccount-0", Industry:"Computer-1"};
            return rejectedPromiseWrapper(Force.syncSObjectDetectConflict("delete", "Account", id3, yours, ["Name", "Industry"], cache, Force.CACHE_MODE.SERVER_FIRST, cacheForOriginals, Force.MERGE_MODE.MERGE_FAIL_IF_CHANGED));
        })
        .then(function(result) {
            assertContains(result, {success: false, result: {localChanges:[], remoteChanges:["Name"], conflictingChanges:[], base:base, yours:yours, theirs:theirs}});

            console.log("## Trying delete server-first with mergeMode MERGE_FAIL_IF_CHANGED with conflicting change");
            yours = {Id:id3, Name: "TestAccount-2", Industry:"Computer-1"};
            return rejectedPromiseWrapper(Force.syncSObjectDetectConflict("delete", "Account", id3, yours, ["Name", "Industry"], cache, Force.CACHE_MODE.SERVER_FIRST, cacheForOriginals, Force.MERGE_MODE.MERGE_FAIL_IF_CHANGED));
        })
        .then(function(result) {
            assertContains(result, {success: false, result: {localChanges:["Name"], remoteChanges:["Name"], conflictingChanges:["Name"], base:base, yours:yours, theirs:theirs}});

            console.log("## Trying delete server-first with mergeMode MERGE_FAIL_IF_CONFLICT with conflicting change");
            yours = {Id:id3, Name: "TestAccount-2", Industry:"Computer-1"};
            return rejectedPromiseWrapper(Force.syncSObjectDetectConflict("delete", "Account", id3, yours, ["Name", "Industry"], cache, Force.CACHE_MODE.SERVER_FIRST, cacheForOriginals, Force.MERGE_MODE.MERGE_FAIL_IF_CONFLICT));
        })
        .then(function(result) {
            assertContains(result, {success: false, result: {localChanges:["Name"], remoteChanges:["Name"], conflictingChanges:["Name"], base:base, yours:yours, theirs:theirs}});

            console.log("## Trying delete server-first with mergeMode MERGE_FAIL_IF_CONFLICT with conflicting change and non-conflicting change");
            yours = {Id:id3, Name: "TestAccount-2", Industry:"Computer-2"};
            return rejectedPromiseWrapper(Force.syncSObjectDetectConflict("delete", "Account", id3, yours, ["Name", "Industry"], cache, Force.CACHE_MODE.SERVER_FIRST, cacheForOriginals, Force.MERGE_MODE.MERGE_FAIL_IF_CONFLICT));
        })
        .then(function(result) {
            assertContains(result, {success: false, result: {localChanges:["Name", "Industry"], remoteChanges:["Name"], conflictingChanges:["Name"], base:base, yours:yours, theirs:theirs}});

            console.log("## Trying delete server-first with mergeMode MERGE_FAIL_IF_CONFLICT with non-conflicting remote change");
            return Force.syncSObjectDetectConflict("delete", "Account", id3, base, ["Name", "Industry"], cache, Force.CACHE_MODE.SERVER_FIRST, cacheForOriginals, Force.MERGE_MODE.MERGE_FAIL_IF_CONFLICT);
        })
        .then(function(data) {
            return checkResultServerAndCaches(data, null, id3, null, null, cache, null, cacheForOriginals);
        })
        .then(function() {
            console.log("## Cleaning up");
            return $.when(Force.smartstoreClient.removeSoup(soupName));
        })
        .then(function() {
            self.finalizeTest();
        });
};

/** 
 * TEST Force.SObject.fetch
 */
ForceEntityTestSuite.prototype.testSObjectFetch = function() {
    console.log("# In ForceEntityTestSuite.testSObjectFetch");
    var self = this;

    QUnit.ok(false, "Test not implemented");

    self.finalizeTest();
};

/** 
 * TEST Force.SObject.save
 */
ForceEntityTestSuite.prototype.testSObjectSave = function() {
    console.log("# In ForceEntityTestSuite.testSObjectSave");
    var self = this;

    QUnit.ok(false, "Test not implemented");

    self.finalizeTest();
};

/** 
 * TEST Force.SObject.destroy
 */
ForceEntityTestSuite.prototype.testSObjectDestroy = function() {
    console.log("# In ForceEntityTestSuite.testSObjectDestroy");
    var self = this;

    QUnit.ok(false, "Test not implemented");

    self.finalizeTest();
};

/** 
 * TEST Force.fetchSObjectsFromCache
 */
ForceEntityTestSuite.prototype.testFetchSObjectsFromCache = function() {
    console.log("# In ForceEntityTestSuite.fetchSObjectsFromCache");
    var self = this;

    var cache;
    var soupName = "testSoupForFetchSObjectsFromCache";
    var resultSet;

    Force.smartstoreClient.removeSoup(soupName)
    .then(function() {
        console.log("## Initialization of StoreCache");
        cache = new Force.StoreCache(soupName, [ {path:"Name", type:"string"} ]);
        return cache.init();
    })
    .then(function() {
        console.log("## Direct save to cache");
        var records = [{Id:"007", Name:"JamesBond"},{Id:"008", Name:"Agent008"}, {Id:"009", Name:"JamesOther"}];
        return cache.saveAll(records);
    })
    .then(function(records) {
        console.log("## Doing a fetchSObjectsFromCache with an exact query spec");
        return Force.fetchSObjectsFromCache(cache, {queryType:"exact", indexPath:"Name", matchKey:"Agent008", order:"ascending", pageSize:1});
    })
    .then(function(result) {
        console.log("## Checking returned result");
        QUnit.equals(result.records.length, 1, "one record should have been returned");
        assertContains(result.records[0], {Id:"008"});
        QUnit.equals(result.hasMore(), false, "there should not be more records");
        console.log("## Doing a fetchSObjectsFromCache with like query spec");
        return Force.fetchSObjectsFromCache(cache, {queryType:"like", indexPath:"Name", likeKey:"James%", order:"ascending", pageSize:2});
    })
    .then(function(result) {
        console.log("## Checking returned result");
        QUnit.equals(result.records.length, 2, "two records should have been returned");
        assertContains(result.records[0], {Id:"007"});
        assertContains(result.records[1], {Id:"009"});
        QUnit.equals(result.hasMore(), false, "there should not be more records");
        console.log("## Doing a fetchSObjectsFromCache with all query spec and a pageSize smaller than result set");
        return Force.fetchSObjectsFromCache(cache, {queryType:"range", indexPath:"Id", order:"ascending", pageSize:2});
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
        return Force.smartstoreClient.removeSoup(soupName);
    })
    .then(function() {
        self.finalizeTest();
    });
};

/** 
 * TEST Force.fetchSObjectsFromServer
 */
ForceEntityTestSuite.prototype.testFetchSObjectsFromServer = function() {
    console.log("# In ForceEntityTestSuite.fetchSObjectsFromServer");
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
ForceEntityTestSuite.prototype.testFetchSObjects = function() {
    console.log("# In ForceEntityTestSuite.testFetchSObjects");
    var self = this;
    var idToName = {};
    var soupName = "testFetchSObjects";
    var originalsSoupName = "originals-" + soupName;
    var cache;
    var cacheForOriginals;

    Force.smartstoreClient.removeSoup(soupName)
        .then(function() {
            console.log("## Initialization of StoreCache's");
            cache = new Force.StoreCache(soupName, [ {path:"Name", type:"string"} ]);
            cacheForOriginals = new Force.StoreCache(originalsSoupName, [ {path:"Name", type:"string"} ]);
            return $.when(cache.init(), cacheForOriginals.init());
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

            console.log("## Trying fetch with sosl with no cache parameter");
            return Force.fetchSObjects({type:"sosl", query:"FIND {testFetchSObjects*} IN ALL FIELDS RETURNING Account(Id, Name) LIMIT 10"});
        })
        .then(function(result) {
            console.log("## Checking data returned from fetch call");
            QUnit.ok(result.totalSize > 0, "Expected results");
            var expectedNames = _.values(idToName).sort();
            QUnit.deepEqual(expectedNames, _.intersection(expectedNames, _.pluck(result.records, "Name")), "Wrong names");

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
            console.log("## Checking data retured from cache");
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
            console.log("## Checking data retured from cache");
            QUnit.equals(result.records.length, 3, "Expected 3 records");
            QUnit.deepEqual(_.values(idToName).sort(), _.pluck(result.records, "Name"), "Wrong names");

            console.log("## Checking cacheForOriginals");
            return cacheForOriginals.find({queryType:"range", indexPath:"Name", order:"ascending", pageSize:3});
        })
        .then(function(result) {
            console.log("## Checking data retured from cacheForOriginals");
            QUnit.equals(result.records.length, 3, "Expected 3 records");
            QUnit.deepEqual(_.values(idToName).sort(), _.pluck(result.records, "Name"), "Wrong names");

            console.log("## Cleaning up");
            return $.when(deleteRecords(idToName), Force.smartstoreClient.removeSoup(soupName), Force.smartstoreClient.removeSoup(originalsSoupName));
        })
        .then(function() {
            self.finalizeTest();
        });
};

/** 
 * TEST Force.Collection.fetch
 */
ForceEntityTestSuite.prototype.testCollectionFetch = function() {
    console.log("# In ForceEntityTestSuite.testCollectionFetch");
    var self = this;
    var idToName = {};
    var soupName = "testFetchSObjects";
    var originalsSoupName = "originals-" + soupName;
    var cache;
    var cacheForOriginals;
    var collection = new Force.SObjectCollection();
    collection.config = function() {
        return {type:"soql", query:"SELECT Id, Name FROM Account WHERE Id IN ('" +  _.keys(idToName).join("','") + "') ORDER BY Name"};
    };
    var collectionFetch = optionsPromiser(collection, "fetch", "collection");

    Force.smartstoreClient.removeSoup(soupName)
        .then(function() {
            console.log("## Initialization of StoreCache's");
            cache = new Force.StoreCache(soupName, [ {path:"Name", type:"string"} ]);
            cacheForOriginals = new Force.StoreCache(originalsSoupName, [ {path:"Name", type:"string"} ]);
            return $.when(cache.init(), cacheForOriginals.init());
        })
        .then(function() { 
            console.log("## Direct creation against server");    
            return createRecords(idToName, "testFetchSObjects", 3);
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
            return collectionFetch({config: {type:"sosl", query:"FIND {testFetchSObjects*} IN ALL FIELDS RETURNING Account(Id, Name) LIMIT 10"}} );
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
            console.log("## Checking data retured from cache");
            QUnit.equals(result.records.length, 3, "Expected 3 records");
            QUnit.deepEqual(_.values(idToName).sort(), _.pluck(result.records, "Name"), "Wrong names");

            console.log("## Trying fetch with cache query");
            return collectionFetch({config: {type:"cache", cacheQuery:{queryType:"range", indexPath:"Name", order:"ascending", pageSize:3}}, cache:cache});
        })
        .then(function(result) {
            console.log("## Checking data returned from fetch call");
            QUnit.equals(collection.length, 3, "Expected 3 results");
            QUnit.deepEqual(_.values(idToName).sort(), collection.pluck("Name"), "Wrong names");
            
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
            console.log("## Checking data retured from cache");
            QUnit.equals(result.records.length, 3, "Expected 3 records");
            QUnit.deepEqual(_.values(idToName).sort(), _.pluck(result.records, "Name"), "Wrong names");

            console.log("## Checking cacheForOriginals");
            return cacheForOriginals.find({queryType:"range", indexPath:"Name", order:"ascending", pageSize:3});
        })
        .then(function(result) {
            console.log("## Checking data retured from cacheForOriginals");
            QUnit.equals(result.records.length, 3, "Expected 3 records");
            QUnit.deepEqual(_.values(idToName).sort(), _.pluck(result.records, "Name"), "Wrong names");

            console.log("## Cleaning up");
            return $.when(deleteRecords(idToName), Force.smartstoreClient.removeSoup(soupName), Force.smartstoreClient.removeSoup(originalsSoupName));
        })
        .then(function() {
            self.finalizeTest();
        });
};

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
		var entry = e.stack.split("\n")[3]; // 0->Error, 1-->getCaller, 2-->assertContains or checkLocalFlags, 3-->the caller we are interested in!
        return entry.match(/\((.*)\)/)[1]; // we only want the source:lineNumber, the function name will be useless with all the promises
	} 
}

/**
 * Helper method to create several records on server
 */
var createRecords = function(idToName, prefix, count) {
    return $.when.apply(null, (_.map(_.range(count), function(i) {
        var name = prefix + i;
        console.log("Creating " + name);
        return Force.forcetkClient.create("Account", {Name:name})
            .then(function(resp) {
                console.log("Created" + name);
                idToName[resp.id] = name;
            });
    })));
};

/**
 * Helper method to delete several records on server
 */
var deleteRecords = function(idToName) {
    return $.when.apply(null, (_.map(_.keys(idToName), function(id) {
        var name = idToName[id];
        console.log("Deleting " + name);
        return Force.forcetkClient.del("account", id)
                    .then(function() {
                        console.log("Deleted " + name);
                    });
    })));
};


/**
 * Helper function turning function taking success/error options into promise
 */
var optionsPromiser = function(object, methodName, objectName) {
    var retfn = function () {
        var args = $.makeArray(arguments);
        var d = $.Deferred();
        if (args.length == 0) { args.push({}); }
        var options = _.last(args);
        options.success = function() {d.resolve.apply(d, arguments); };
        options.error = function() { d.reject.apply(d, arguments); };
        console.log("-----> Calling " + objectName + ":" + methodName);
        object[methodName].apply(object, args);
        return d.promise();
    };
    return retfn;
};

/**
 * Helper function to wrap a rejected promise into a promise that returns either:
 * {success:true, result:<wrapped promise result>} or {success:false, result:<wrapper promise fail result>}
 */
var rejectedPromiseWrapper = function(p) {
    var d = $.Deferred();
    p
        .then(function(result) {
            d.resolve.apply(d, [{success:true, result:result}]);
        })
        .fail(function(err) {
            d.resolve.apply(d, [{success:false, result:err}]);
        });
    return d.promise();
};


/** 
 * Helper function to check cache
 */
var checkCache = function(id, expectedCacheRecord, cache, caller) {
    if (cache == null) { 
        // no cache specified: expectedCacheRecord should be null
        assertContains(null, expectedCacheRecord, caller);
        return $.when();
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
        return $.when();
    }
    console.log("## Direct retrieve from server");
    return Force.forcetkClient.query("select " + (expectedServerRecord == null ? "Id" : _.keys(expectedServerRecord).join(",")) + " from Account where Id = '" + id + "'")
        .then(function(resp) {
            console.log("## Checking data returned from server");
            assertContains(resp.records.length == 0 ? null : resp.records[0], expectedServerRecord, caller);
        });
};

/** 
 * Helper function to check result, server and caches
 */
var checkResultServerAndCaches = function(data, expectedData, id, expectedServerRecord, expectedCacheRecord, cache, expectedCacheRecord2, cache2) {
    var caller = getCaller();
    console.log("## Checking data returned by sync call");
    assertContains(data, expectedData, caller);
    return $.when(checkServer(id, expectedServerRecord, caller), checkCache(id, expectedCacheRecord, cache, caller), checkCache(id, expectedCacheRecord2, cache2, caller));
};
}
