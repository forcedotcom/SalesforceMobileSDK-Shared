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
        QUnit.equals(record.Id, "007", "wrong record returned");
        QUnit.equals(record.Name, "JamesBond", "wrong record returned");
        QUnit.equals(record.Address.City, "London", "wrong record returned");
        console.log("## Trying an existing record but asking for a field that is in the cache");
        return cache.retrieve("007", ["Name"]);
    })
    .then(function(record) {
        console.log("## Checking returned record");
        QUnit.equals(record.Id, "007", "wrong record returned");
        console.log("## Trying an existing record but asking a non-top level field that is in the cache");
        return cache.retrieve("007", ["Address.City"]);
    })
    .then(function(record) {
        console.log("## Checking returned record");
        QUnit.equals(record.Id, "007", "wrong record returned");
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
        QUnit.equals(records[0].Id, "007", "wrong record returned");
        QUnit.equals(records[0].Name, "JamesBond", "wrong record returned");
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
        QUnit.equals(records[0].Id, "007", "wrong record returned");
        QUnit.equals(records[0].Name, "JamesBond", "wrong record returned");
        QUnit.equals(records[0].Mission, "TopSecret2", "wrong record returned");
        QUnit.equals(records[0].Organization, "MI6", "wrong record returned");
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
        QUnit.equals(records[0].Id, "007", "wrong record returned");
        QUnit.equals(records[1].Id, "008", "wrong record returned");
        QUnit.equals(records[2].Id, "009", "wrong record returned");
        console.log("## Saving partial records to cache");
        var partialRecords = [{Id:"007", Mission:"TopSecret-007"},{Id:"008", Team:"Team-008"}, {Id:"009", Organization:"MI6"}];        
        return cache.saveAll(partialRecords);
    })
    .then(function(record) {
        console.log("## Direct retrieve from underlying cache");
        return Force.smartstoreClient.retrieveSoupEntries(soupName, soupEntryIds);
    })
    .then(function(records) {
        console.log("## Checking returned records are the merge of original fields and newly provided fields");
        QUnit.equals(records.length, 3, "three records should have been returned");
        QUnit.equals(records[0].Id, "007", "wrong record returned");
        QUnit.equals(records[0].Name, "JamesBond", "wrong record returned");
        QUnit.equals(records[0].Mission, "TopSecret-007", "wrong record returned");
        QUnit.equals(records[1].Id, "008", "wrong record returned");
        QUnit.equals(records[1].Name, "Agent008", "wrong record returned");
        QUnit.equals(records[1].Team, "Team-008", "wrong record returned");
        QUnit.equals(records[2].Id, "009", "wrong record returned");
        QUnit.equals(records[2].Name, "JamesOther", "wrong record returned");
        QUnit.equals(records[2].Organization, "MI6", "wrong record returned");

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
        QUnit.equals(records[0].Id, "007", "wrong record returned");
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
        cache = new Force.StoreCache(soupName, [ {path:"Name", type:"string"} ]);
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
        QUnit.equals(result.records[0].Id, "008", "wrong record returned");
        QUnit.equals(result.hasMore(), false, "there should not be more records");
        console.log("## Doing a find with like query spec");
        return cache.find({queryType:"like", indexPath:"Name", likeKey:"James%", order:"ascending", pageSize:2});
    })
    .then(function(result) {
        console.log("## Checking returned result");
        QUnit.equals(result.records.length, 2, "two records should have been returned");
        QUnit.equals(result.records[0].Id, "007", "wrong record returned");
        QUnit.equals(result.records[1].Id, "009", "wrong record returned");
        QUnit.equals(result.hasMore(), false, "there should not be more records");
        console.log("## Doing a find with all query spec and a pageSize smaller than result set");
        return cache.find({queryType:"range", indexPath:"Id", order:"ascending", pageSize:2});
    })
    .then(function(result) {
        resultSet = result;
        console.log("## Checking returned result");
        QUnit.equals(resultSet.records.length, 2, "two records should have been returned");
        QUnit.equals(resultSet.records[0].Id, "007", "wrong record returned");
        QUnit.equals(resultSet.records[1].Id, "008", "wrong record returned");
        QUnit.equals(resultSet.hasMore(), true, "there should be more records");
        console.log("## Getting the next page of records");
        return resultSet.getMore();
    })
    .then(function(records) {
        console.log("## Checking returned result");
        QUnit.equals(records.length, 1, "one record should have been returned");
        QUnit.equals(records[0].Id, "009", "wrong record returned");
        QUnit.equals(resultSet.hasMore(), false, "there should not be more records");
        QUnit.equals(resultSet.records.length, 3, "three records should be in result set");
        QUnit.equals(resultSet.records[0].Id, "007", "wrong record returned");
        QUnit.equals(resultSet.records[1].Id, "008", "wrong record returned");
        QUnit.equals(resultSet.records[2].Id, "009", "wrong record returned");
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
    QUnit.equals(record.Id, "007", "add local fields changed Id field");
    QUnit.equals(record.Name, "JamesBond", "add local fields changed Name field");
    QUnit.equals(record.__local__, false, "add local fields didn't add __local__");
    QUnit.equals(record.__locally_created__, false, "add local fields didn't add __locally_created__");
    QUnit.equals(record.__locally_updated__, false, "add local fields didn't add __locally_updated__");
    QUnit.equals(record.__locally_deleted__, false, "add local fields didn't add __locally_deleted__");

    console.log("Add local fields when some are present");
    record = {Id:"007", Name:"JamesBond", __locally_deleted__:true};
    record = cache.addLocalFields(record);
    QUnit.equals(record.Id, "007", "add local fields changed Id field");
    QUnit.equals(record.Name, "JamesBond", "add local fields changed Name field");
    QUnit.equals(record.__local__, true, "add local fields didn't add __local__");
    QUnit.equals(record.__locally_created__, false, "add local fields didn't add __locally_created__");
    QUnit.equals(record.__locally_updated__, false, "add local fields didn't add __locally_updated__");
    QUnit.equals(record.__locally_deleted__, true, "add local fields changed __locally_deleted__");

    this.finalizeTest();
}


}
