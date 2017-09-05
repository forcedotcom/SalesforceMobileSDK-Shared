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

// Version this js was shipped with
var SALESFORCE_MOBILE_SDK_VERSION = "5.3.0";
var SERVICE = "com.salesforce.smartstore";

var exec = require("com.salesforce.util.exec").exec;

var defaultStoreConfig = {'isGlobalStore':false};
/**
 * SoupSpec constructor
 */
var SoupSpec = function (soupName, features) {
    this.name = soupName;
    this.features = features;
};

/**
 * StoreConfig constructor
 */
var StoreConfig = function (storeName, isGlobalStore) {
    this.storeName = storeName;
    this.isGlobalStore = isGlobalStore;
};


/**
 * SoupIndexSpec consturctor
 */
var SoupIndexSpec = function (path, type) {
    this.path = path;
    this.type = type;
};

/**
 * QuerySpec constructor
 */
var QuerySpec = function (path) {
    // the kind of query, one of: "exact","range", "like" or "smart":
    // "exact" uses matchKey, "range" uses beginKey and endKey, "like" uses likeKey, "smart" uses smartSql
    this.queryType = "exact";

    //path for the original IndexSpec you wish to use for search: may be a compound path eg Account.Owner.Name
    this.indexPath = path;

    //for queryType "exact" and "match"
    this.matchKey = null;

    //for queryType "like"
    this.likeKey = null;

    //for queryType "range"
    //the value at which query results may begin
    this.beginKey = null;
    //the value at which query results may end
    this.endKey = null;

    // for queryType "smart"
    this.smartSql = null;

    //path to sort by : optional
    this.orderPath = null

    //"ascending" or "descending" : optional
    this.order = "ascending";

    //the number of entries to copy from native to javascript per each cursor page
    this.pageSize = 10;

    //selectPaths - null means return soup elements
    this.selectPaths = null;
};

/**
 * StoreCursor constructor
 */
var StoreCursor = function () {
    //a unique identifier for this cursor, used by plugin
    this.cursorId = null;
    //the maximum number of entries returned per page
    this.pageSize = 0;
    // the total number of results
    this.totalEntries = 0;
    //the total number of pages of results available
    this.totalPages = 0;
    //the current page index among all the pages available
    this.currentPageIndex = 0;
    //the list of current page entries, ordered as requested in the querySpec
    this.currentPageOrderedEntries = null;
};

// ====== Logging support ======
var logLevel;
var storeConsole = {};

var setLogLevel = function(level) {
    logLevel = level;
    var methods = ["error", "info", "warn", "debug"];
    var levelAsInt = methods.indexOf(level.toLowerCase());
    for (var i=0; i<methods.length; i++) {
        storeConsole[methods[i]] = (i <= levelAsInt ? console[methods[i]].bind(console) : function() {});
    }
};

// Showing info and above (i.e. error) by default.
setLogLevel("info");

var getLogLevel = function () {
    return logLevel;
};

// ====== querySpec factory methods
// Returns a query spec that will page through all soup entries in order by the given path value
// Internally it simply does a range query with null begin and end keys
var buildAllQuerySpec = function (path, order, pageSize, selectPaths) {
    var inst = new QuerySpec(path);
    inst.queryType = "range";
    inst.orderPath = path;
    if (order) { inst.order = order; } // override default only if a value was specified
    if (pageSize) { inst.pageSize = pageSize; } // override default only if a value was specified
    if (selectPaths) { inst.selectPaths = selectPaths; }
    return inst;
};

// Returns a query spec that will page all entries exactly matching the matchKey value for path
var buildExactQuerySpec = function (path, matchKey, pageSize, order, orderPath, selectPaths) {
    var inst = new QuerySpec(path);
    inst.matchKey = matchKey;
    if (pageSize) { inst.pageSize = pageSize; } // override default only if a value was specified
    if (order) { inst.order = order; } // override default only if a value was specified
    inst.orderPath = orderPath ? orderPath : path;
    if (selectPaths) { inst.selectPaths = selectPaths; }
    return inst;
};

// Returns a query spec that will page all entries in the range beginKey ...endKey for path
var buildRangeQuerySpec = function (path, beginKey, endKey, order, pageSize, orderPath, selectPaths) {
    var inst = new QuerySpec(path);
    inst.queryType = "range";
    inst.beginKey = beginKey;
    inst.endKey = endKey;
    if (order) { inst.order = order; } // override default only if a value was specified
    if (pageSize) { inst.pageSize = pageSize; } // override default only if a value was specified
    inst.orderPath = orderPath ? orderPath : path;
    if (selectPaths) { inst.selectPaths = selectPaths; }
    return inst;
};

// Returns a query spec that will page all entries matching the given likeKey value for path
var buildLikeQuerySpec = function (path, likeKey, order, pageSize, orderPath, selectPaths) {
    var inst = new QuerySpec(path);
    inst.queryType = "like";
    inst.likeKey = likeKey;
    if (order) { inst.order = order; } // override default only if a value was specified
    if (pageSize) { inst.pageSize = pageSize; } // override default only if a value was specified
    inst.orderPath = orderPath ? orderPath : path;
    if (selectPaths) { inst.selectPaths = selectPaths; }
    return inst;
};

// Returns a query spec that will page all entries matching the given full-text search matchKey value for path
// Pass null for path to match matchKey across all full-text indexed fields
var buildMatchQuerySpec = function (path, matchKey, order, pageSize, orderPath, selectPaths) {
    var inst = new QuerySpec(path);
    inst.queryType = "match";
    inst.matchKey = matchKey;
    inst.orderPath = orderPath;
    if (order) { inst.order = order; } // override default only if a value was specified
    if (pageSize) { inst.pageSize = pageSize; } // override default only if a value was specified
    inst.orderPath = orderPath ? orderPath : path;
    if (selectPaths) { inst.selectPaths = selectPaths; }
    return inst;
};

// Returns a query spec that will page all results returned by smartSql
var buildSmartQuerySpec = function (smartSql, pageSize) {
    var inst = new QuerySpec();
    inst.queryType = "smart";
    inst.smartSql = smartSql;
    if (pageSize) { inst.pageSize = pageSize; } // override default only if a value was specified
    return inst;
};

// Helper function to handle calls that don't specify storeConfig as first argument
// If missing, the caller is re-invoked with false prepended to the arguments list and true is returned
// Otherwise, false is returned
var checkFirstArg = function(argumentsOfCaller) {
    // Turning arguments into array
    var args = Array.prototype.slice.call(argumentsOfCaller);

    // If first argument is a store config
    if (typeof(args[0]) === "object" && args[0].hasOwnProperty("isGlobalStore")) {
         return false;
    }

    var isGlobalStore =  false;

    if (typeof(args[0]) === "boolean") {
       isGlobalStore = args.shift() || false;
    }
    args.unshift({'isGlobalStore': isGlobalStore});
    argumentsOfCaller.callee.apply(null, args);
    return true;
};


// ====== Soup manipulation ======
var getDatabaseSize = function (storeConfig, successCB, errorCB) {
    if (checkFirstArg(arguments)) return;
    storeConsole.debug("SmartStore.getDatabaseSize:isGlobalStore=" + storeConfig.isGlobalStore + ",storeName=" + storeConfig.storeName);
    exec(SALESFORCE_MOBILE_SDK_VERSION, successCB, errorCB, SERVICE, "pgGetDatabaseSize", [{"isGlobalStore": storeConfig.isGlobalStore, "storeName": storeConfig.storeName}]);
};

var registerSoup = function (storeConfig, soupName, indexSpecs, successCB, errorCB) {
    if (checkFirstArg(arguments)) return;
    storeConsole.debug("SmartStore.registerSoup:isGlobalStore=" + storeConfig.isGlobalStore + ",storeName=" + storeConfig.storeName + ",soupName=" + soupName + ",indexSpecs=" + JSON.stringify(indexSpecs));
    exec(SALESFORCE_MOBILE_SDK_VERSION, successCB, errorCB, SERVICE,
         "pgRegisterSoup",
         [{"soupName": soupName, "indexes": indexSpecs, "isGlobalStore": storeConfig.isGlobalStore, "storeName": storeConfig.storeName}]
        );
};

var registerSoupWithSpec = function (storeConfig, soupSpec, indexSpecs, successCB, errorCB) {
    if (checkFirstArg(arguments)) return;
    storeConsole.debug("SmartStore.registerSoupWithSpec:isGlobalStore=" + storeConfig.isGlobalStore + ",storeName=" + storeConfig.storeName + ",soupSpec="+ JSON.stringify(soupSpec) + ",indexSpecs=" + JSON.stringify(indexSpecs));
    exec(SALESFORCE_MOBILE_SDK_VERSION, successCB, errorCB, SERVICE,
         "pgRegisterSoup",
         [{"soupSpec": soupSpec, "indexes": indexSpecs, "isGlobalStore": storeConfig.isGlobalStore, "storeName": storeConfig.storeName}]
        );
};

var removeSoup = function (storeConfig, soupName, successCB, errorCB) {
    if (checkFirstArg(arguments)) return;
    storeConsole.debug("SmartStore.removeSoup:isGlobalStore=" + storeConfig.isGlobalStore + ",storeName=" + storeConfig.storeName + ",soupName=" + soupName);
    exec(SALESFORCE_MOBILE_SDK_VERSION, successCB, errorCB, SERVICE,
         "pgRemoveSoup",
         [{"soupName": soupName, "isGlobalStore": storeConfig.isGlobalStore,"storeName": storeConfig.storeName}]
        );
};

var getSoupIndexSpecs = function(storeConfig, soupName, successCB, errorCB) {
    if (checkFirstArg(arguments)) return;
    storeConsole.debug("SmartStore.getSoupIndexSpecs:isGlobalStore=" + storeConfig.isGlobalStore + ",storeName=" + storeConfig.storeName + ",soupName=" + soupName);
    exec(SALESFORCE_MOBILE_SDK_VERSION, successCB, errorCB, SERVICE,
         "pgGetSoupIndexSpecs",
         [{"soupName": soupName, "isGlobalStore": storeConfig.isGlobalStore, "storeName": storeConfig.storeName}]
        );
};

var getSoupSpec = function(storeConfig, soupName, successCB, errorCB) {
    if (checkFirstArg(arguments)) return;
    storeConsole.debug("SmartStore.getSoupSpec:isGlobalStore=" + storeConfig.isGlobalStore + ",storeName=" + storeConfig.storeName + ",soupName=" + soupName);
    exec(SALESFORCE_MOBILE_SDK_VERSION, successCB, errorCB, SERVICE,
         "pgGetSoupSpec",
         [{"soupName": soupName, "isGlobalStore": storeConfig.isGlobalStore, "storeName": storeConfig.storeName}]
        );
};

var alterSoup = function (storeConfig, soupName, indexSpecs, reIndexData, successCB, errorCB) {
    if (checkFirstArg(arguments)) return;
    storeConsole.debug("SmartStore.alterSoup:isGlobalStore=" + storeConfig.isGlobalStore + ",storeName=" + storeConfig.storeName + ",soupName=" + soupName + ",indexSpecs=" + JSON.stringify(indexSpecs) + ",reIndexData=" + reIndexData);
    exec(SALESFORCE_MOBILE_SDK_VERSION, successCB, errorCB, SERVICE,
         "pgAlterSoup",
         [{"soupName": soupName, "indexes": indexSpecs, "reIndexData": reIndexData, "isGlobalStore": storeConfig.isGlobalStore, "storeName": storeConfig.storeName}]
        );
};

var alterSoupWithSpec = function (storeConfig, soupName, soupSpec, indexSpecs, reIndexData, successCB, errorCB) {
    if (checkFirstArg(arguments)) return;
    storeConsole.debug("SmartStore.alterSoupWithSpec:isGlobalStore=" + storeConfig.isGlobalStore + ",storeName=" + storeConfig.storeName + ",soupName=" + soupName + ",soupSpec=" + JSON.stringify(soupSpec) + ",indexSpecs=" + JSON.stringify(indexSpecs) + ",reIndexData=" + reIndexData);
    exec(SALESFORCE_MOBILE_SDK_VERSION, successCB, errorCB, SERVICE,
         "pgAlterSoup",
         [{"soupName": soupName, "soupSpec": soupSpec, "indexes": indexSpecs, "reIndexData": reIndexData, "isGlobalStore": storeConfig.isGlobalStore, "storeName": storeConfig.storeName}]
        );
};

var reIndexSoup = function (storeConfig, soupName, paths, successCB, errorCB) {
    if (checkFirstArg(arguments)) return;
    storeConsole.debug("SmartStore.reIndexSoup:isGlobalStore=" + storeConfig.isGlobalStore + ",storeName=" + storeConfig.storeName + ",soupName=" + soupName + ",paths=" + JSON.stringify(paths));
    exec(SALESFORCE_MOBILE_SDK_VERSION, successCB, errorCB, SERVICE,
         "pgReIndexSoup",
         [{"soupName": soupName, "paths": paths, "isGlobalStore": storeConfig.isGlobalStore, "storeName": storeConfig.storeName}]
        );
};

var clearSoup = function (storeConfig, soupName, successCB, errorCB) {
    if (checkFirstArg(arguments)) return;
    storeConsole.debug("SmartStore.clearSoup:isGlobalStore=" + storeConfig.isGlobalStore + ",storeName=" + storeConfig.storeName + ",soupName=" + soupName);
    exec(SALESFORCE_MOBILE_SDK_VERSION, successCB, errorCB, SERVICE,
         "pgClearSoup",
         [{"soupName": soupName, "isGlobalStore": storeConfig.isGlobalStore, "storeName": storeConfig.storeName}]
        );
};

var showInspector = function(storeConfig) {
    if(storeConfig == null )
      storeConfig = defaultStoreConfig;
    storeConsole.debug("SmartStore.showInspector");
      exec(SALESFORCE_MOBILE_SDK_VERSION, null, null, SERVICE, "pgShowInspector", [{"isGlobalStore": storeConfig.isGlobalStore, "storeName": storeConfig.storeName}]);
};

var soupExists = function (storeConfig, soupName, successCB, errorCB) {
    if (checkFirstArg(arguments)) return;
    storeConsole.debug("SmartStore.soupExists:isGlobalStore=" + storeConfig.isGlobalStore + ",storeName=" + storeConfig.storeName + ",soupName=" + soupName);
    exec(SALESFORCE_MOBILE_SDK_VERSION, successCB, errorCB, SERVICE,
         "pgSoupExists",
         [{"soupName": soupName, "isGlobalStore": storeConfig.isGlobalStore, "storeName": storeConfig.storeName}]
        );
};

var querySoup = function (storeConfig, soupName, querySpec, successCB, errorCB) {
    if (checkFirstArg(arguments)) return;
    if (querySpec.queryType == "smart") throw new Error("Smart queries can only be run using runSmartQuery");
    if (querySpec.order != null && querySpec.orderPath == null) querySpec.orderPath = querySpec.indexPath; // for backward compatibility with pre-3.3 code
    storeConsole.debug("SmartStore.querySoup:isGlobalStore=" + storeConfig.isGlobalStore + ",storeName=" + storeConfig.storeName + ",soupName=" + soupName + ",indexPath=" + querySpec.indexPath);
    exec(SALESFORCE_MOBILE_SDK_VERSION, successCB, errorCB, SERVICE,
         "pgQuerySoup",
         [{"soupName": soupName, "querySpec": querySpec, "isGlobalStore": storeConfig.isGlobalStore, "storeName": storeConfig.storeName}]
        );
};

var runSmartQuery = function (storeConfig, querySpec, successCB, errorCB) {
    if (checkFirstArg(arguments)) return;
    if (querySpec.queryType != "smart") throw new Error("runSmartQuery can only run smart queries");
    storeConsole.debug("SmartStore.runSmartQuery:isGlobalStore=" + storeConfig.isGlobalStore + ",storeName=" + storeConfig.storeName + ",smartSql=" + querySpec.smartSql);
    exec(SALESFORCE_MOBILE_SDK_VERSION, successCB, errorCB, SERVICE,
         "pgRunSmartQuery",
         [{"querySpec": querySpec, "isGlobalStore": storeConfig.isGlobalStore, "storeName": storeConfig.storeName}]
        );
};

var retrieveSoupEntries = function (storeConfig, soupName, entryIds, successCB, errorCB) {
    if (checkFirstArg(arguments)) return;
    storeConsole.debug("SmartStore.retrieveSoupEntries:isGlobalStore=" + storeConfig.isGlobalStore + ",storeName=" + storeConfig.storeName + ",soupName=" + soupName + ",entryIds=" + entryIds);
    exec(SALESFORCE_MOBILE_SDK_VERSION, successCB, errorCB, SERVICE,
         "pgRetrieveSoupEntries",
         [{"soupName": soupName, "entryIds": entryIds, "isGlobalStore": storeConfig.isGlobalStore, "storeName": storeConfig.storeName}]
        );
};

var upsertSoupEntries = function (storeConfig, soupName, entries, successCB, errorCB) {
    if (checkFirstArg(arguments)) return;
    upsertSoupEntriesWithExternalId(storeConfig, soupName, entries, "_soupEntryId", successCB, errorCB);
};

var upsertSoupEntriesWithExternalId = function (storeConfig, soupName, entries, externalIdPath, successCB, errorCB) {
    if (checkFirstArg(arguments)) return;
    storeConsole.debug("SmartStore.upsertSoupEntries:isGlobalStore=" + storeConfig.isGlobalStore + ",storeName=" + storeConfig.storeName + ",soupName=" + soupName + ",entries=" + entries.length + ",externalIdPath=" + externalIdPath);
    exec(SALESFORCE_MOBILE_SDK_VERSION, successCB, errorCB, SERVICE,
         "pgUpsertSoupEntries",
         [{"soupName": soupName, "entries": entries, "externalIdPath": externalIdPath, "isGlobalStore": storeConfig.isGlobalStore, "storeName": storeConfig.storeName}]
        );
};

var getAllStores = function (successCB, errorCB) {
    exec(SALESFORCE_MOBILE_SDK_VERSION, successCB, errorCB, SERVICE,
         "pgGetAllStores",
         [{}]
        );
};

var getAllGlobalStores = function (successCB, errorCB) {
    exec(SALESFORCE_MOBILE_SDK_VERSION, successCB, errorCB, SERVICE,
         "pgGetAllGlobalStores",
         [{}]
        );
};

var removeStore = function (storeConfig,successCB, errorCB) {
    if (checkFirstArg(arguments)) return;
    exec(SALESFORCE_MOBILE_SDK_VERSION, successCB, errorCB, SERVICE,
         "pgRemoveStore",
         [{"isGlobalStore": storeConfig.isGlobalStore, "storeName": storeConfig.storeName}]
        );
};

var removeAllGlobalStores = function (successCB, errorCB) {
    exec(SALESFORCE_MOBILE_SDK_VERSION, successCB, errorCB, SERVICE,
         "pgRemoveAllGlobalStores",
         [{}]
        );
};

var removeAllStores = function (successCB, errorCB) {
    exec(SALESFORCE_MOBILE_SDK_VERSION, successCB, errorCB, SERVICE,
         "pgRemoveAllStores",
         [{}]
        );
};

var removeFromSoup = function (storeConfig, soupName, entryIdsOrQuerySpec, successCB, errorCB) {
    if (checkFirstArg(arguments)) return;
    storeConsole.debug("SmartStore.removeFromSoup:isGlobalStore="  + storeConfig.isGlobalStore + ",storeName=" + storeConfig.storeName + ",soupName=" + soupName + ",entryIdsOrQuerySpec=" + entryIdsOrQuerySpec);
    var execArgs = {"soupName": soupName, "isGlobalStore": storeConfig.isGlobalStore, "storeName": storeConfig.storeName};
    execArgs[entryIdsOrQuerySpec instanceof Array ? "entryIds":"querySpec"] = entryIdsOrQuerySpec;
    exec(SALESFORCE_MOBILE_SDK_VERSION, successCB, errorCB, SERVICE,
         "pgRemoveFromSoup",
         [execArgs]
        );
};

//====== Cursor manipulation ======
var moveCursorToPageIndex = function (storeConfig, cursor, newPageIndex, successCB, errorCB) {
    if (checkFirstArg(arguments)) return;
    storeConsole.debug("moveCursorToPageIndex:isGlobalStore=" + storeConfig.isGlobalStore + ",storeName=" + storeConfig.storeName + ",cursorId=" + cursor.cursorId + ",newPageIndex=" + newPageIndex);
    exec(SALESFORCE_MOBILE_SDK_VERSION, successCB, errorCB, SERVICE,
         "pgMoveCursorToPageIndex",
         [{"cursorId": cursor.cursorId, "index": newPageIndex, "isGlobalStore": storeConfig.isGlobalStore, "storeName": storeConfig.storeName}]
        );
};

var moveCursorToNextPage = function (storeConfig, cursor, successCB, errorCB) {
    if (checkFirstArg(arguments)) return;
    var newPageIndex = cursor.currentPageIndex + 1;
    if (newPageIndex >= cursor.totalPages) {
        errorCB(new Error("moveCursorToNextPage called while on last page"));
    } else {
        moveCursorToPageIndex(storeConfig, cursor, newPageIndex, successCB, errorCB);
    }
};

var moveCursorToPreviousPage = function (storeConfig, cursor, successCB, errorCB) {
    if (checkFirstArg(arguments)) return;
    var newPageIndex = cursor.currentPageIndex - 1;
    if (newPageIndex < 0) {
        errorCB(new Error("moveCursorToPreviousPage called while on first page"));
    } else {
        moveCursorToPageIndex(storeConfig, cursor, newPageIndex, successCB, errorCB);
    }
};

var closeCursor = function (storeConfig, cursor, successCB, errorCB) {
    if (checkFirstArg(arguments)) return;
    storeConsole.debug("closeCursor:isGlobalStore=" + storeConfig.isGlobalStore + ",storeName=" + storeConfig.storeName + ",cursorId=" + cursor.cursorId);
    exec(SALESFORCE_MOBILE_SDK_VERSION, successCB, errorCB, SERVICE,
         "pgCloseCursor",
         [{"cursorId": cursor.cursorId, "isGlobalStore": storeConfig.isGlobalStore, "storeName": storeConfig.storeName}]
        );
};

/**
 * Part of the module that is public
 */
module.exports = {
    alterSoup: alterSoup,
    alterSoupWithSpec: alterSoupWithSpec,
    buildAllQuerySpec: buildAllQuerySpec,
    buildExactQuerySpec: buildExactQuerySpec,
    buildLikeQuerySpec: buildLikeQuerySpec,
    buildRangeQuerySpec: buildRangeQuerySpec,
    buildSmartQuerySpec: buildSmartQuerySpec,
    buildMatchQuerySpec: buildMatchQuerySpec,
    clearSoup: clearSoup,
    closeCursor: closeCursor,
    getDatabaseSize: getDatabaseSize,
    getLogLevel: getLogLevel,
    getSoupIndexSpecs: getSoupIndexSpecs,
    getSoupSpec: getSoupSpec,
    moveCursorToNextPage: moveCursorToNextPage,
    moveCursorToPageIndex: moveCursorToPageIndex,
    moveCursorToPreviousPage: moveCursorToPreviousPage,
    querySoup: querySoup,
    reIndexSoup: reIndexSoup,
    registerSoup: registerSoup,
    registerSoupWithSpec: registerSoupWithSpec,
    removeFromSoup: removeFromSoup,
    removeSoup: removeSoup,
    retrieveSoupEntries: retrieveSoupEntries,
    runSmartQuery: runSmartQuery,
    setLogLevel: setLogLevel,
    showInspector: showInspector,
    soupExists: soupExists,
    upsertSoupEntries: upsertSoupEntries,
    upsertSoupEntriesWithExternalId: upsertSoupEntriesWithExternalId,
    getAllStores: getAllStores,
    getAllGlobalStores: getAllGlobalStores,
    removeStore: removeStore,
    removeAllGlobalStores: removeAllGlobalStores,
    removeAllStores: removeAllStores,
    // Constructors
    SoupSpec: SoupSpec,
    QuerySpec: QuerySpec,
    SoupIndexSpec: SoupIndexSpec,
    StoreConfig: StoreConfig,
    StoreCursor: StoreCursor
};