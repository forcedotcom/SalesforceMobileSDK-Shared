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



if (!PhoneGap.hasResource("smartstore")) {

PhoneGap.addResource("smartstore");

/**
 *  SmartStoreError.
 *  An error code assigned by an implementation when an error has occurred
 */
var SmartStoreError = function () {
    this.code = null;
};

/**
 * Error codes
 */
SmartStoreError.UNKNOWN_ERROR = 0;
SmartStoreError.INVALID_ARGUMENT_ERROR = 1;
SmartStoreError.TIMEOUT_ERROR = 2;
SmartStoreError.PENDING_OPERATION_ERROR = 3;
SmartStoreError.IO_ERROR = 4;
SmartStoreError.NOT_SUPPORTED_ERROR = 5;
SmartStoreError.PERMISSION_DENIED_ERROR = 20;
 
/**
 * IndexSpec
 */
var SoupIndexSpec = function (path, type) {
    this.path = path;
    this.type = type;
};

/**
 * QuerySpec
 */
var SoupQuerySpec = function (path) {
	
	//the kind of query, one of: "exact","range", or "like":
	//"exact" uses matchKey, "range" uses beginKey and endKey, "like" uses likeKey
	this.queryType = "exact";
	
    //path for the original IndexSpec you wish to use for search: may be a compound path eg Account.Owner.Name
    this.indexPath = path;

	//for queryType "exact"
    this.matchKey = null;
	//for queryType "like"
	this.likeKey = null;
    
	//for queryType "range"
    //the value at which query results may begin
    this.beginKey = null;
    //the value at which query results may end
    this.endKey = null;

    //"ascending" or "descending" : optional
    this.order = "ascending";

    //the number of entries to copy from native to javascript per each cursor page
    this.pageSize = 10;
};




/**
 * Cursor
 */
var PagedSoupCursor = function () {
    //the soup name from which this cursor was generated
    this.soupName = null;
    //a unique identifier for this cursor, used by plugin
    this.cursorId = null;
    //the query spec that generated this cursor
    this.querySpec = null;
    //the maximum number of entries returned per page 
    this.pageSize = 0;
    //the total number of pages of results available
    this.totalPages = 0;
    //the current page index among all the pages available
    this.currentPageIndex = 0;

    //the list of current page entries, ordered as requested in the querySpec
    this.currentPageOrderedEntries = null;
};

/**
 * SmartStore constructor
 */
var SmartStore = function () {
    SFHybridApp.logToConsole("new SmartStore");
    this.logLevel = 0;
};
 

// ====== querySpec factory methods


/**
 * Returns a cursor that will page through all soup entries in order by the given path value
 * Internally it simply does a range query with null begin and end keys
 */
SmartStore.prototype.buildAllQuerySpec = function(path, order, pageSize) {
	var inst = new SoupQuerySpec(path);
	inst.queryType = "range";
	if (order) { inst.order = order; } // override default only if a value was specified
	if (pageSize) { inst.pageSize = pageSize; } // override default only if a value was specified
	return inst;
};

/**
 * Returns a cursor that will page all entries exactly matching the matchKey value for path
 */
SmartStore.prototype.buildExactQuerySpec = function(path, matchKey, pageSize) {
	var inst = new SoupQuerySpec(path);
	inst.matchKey = matchKey;
	if (pageSize) { inst.pageSize = pageSize; } // override default only if a value was specified
	return inst;
};

/**
 * Returns a cursor that will page all entries in the range beginKey ...endKey for path
 */
SmartStore.prototype.buildRangeQuerySpec = function(path, beginKey, endKey, order, pageSize) {
	var inst = new SoupQuerySpec(path);
	inst.queryType = "range";
	inst.beginKey = beginKey;
	inst.endKey = endKey;
	if (order) { inst.order = order; } // override default only if a value was specified
	if (pageSize) { inst.pageSize = pageSize; } // override default only if a value was specified
	return inst;
};

/**
 * Returns a cursor that will page all entries matching the given likeKey value for path
 */
SmartStore.prototype.buildLikeQuerySpec = function(path, likeKey, order, pageSize) {
	var inst = new SoupQuerySpec(path);
	inst.queryType = "like";
	inst.likeKey = likeKey;
	if (order) { inst.order = order; } // override default only if a value was specified
	if (pageSize) { inst.pageSize = pageSize; } // override default only if a value was specified
	return inst;
};



// ====== Soup manipulation ======

SmartStore.prototype.registerSoup = function (soupName, indexSpecs, successCB, errorCB) {
    SFHybridApp.logToConsole("SmartStore.registerSoup: '" + soupName + "' indexSpecs: " + indexSpecs);
    
    PhoneGap.exec(successCB, errorCB, 
                  "com.salesforce.smartstore", 
                  "pgRegisterSoup", 
                  [{"soupName":soupName, "indexes":indexSpecs}]
                  );                  
};

SmartStore.prototype.removeSoup = function (soupName, successCB, errorCB) {
    SFHybridApp.logToConsole("SmartStore.removeSoup: " + soupName );
    
    PhoneGap.exec(successCB, errorCB, 
                  "com.salesforce.smartstore", 
                  "pgRemoveSoup", 
                  [{"soupName":soupName}]
                  );                  
};

SmartStore.prototype.soupExists = function (soupName, successCB, errorCB) {
    SFHybridApp.logToConsole("SmartStore.soupExists: " + soupName );
    
    PhoneGap.exec(successCB, errorCB, 
                  "com.salesforce.smartstore", 
                  "pgSoupExists", 
                  [{"soupName":soupName}]
                  );                  
};

SmartStore.prototype.querySoup = function (soupName, querySpec, successCB, errorCB) {
    SFHybridApp.logToConsole("SmartStore.querySoup: '" + soupName + "' indexPath: " + querySpec.indexPath);
    
    PhoneGap.exec(successCB, errorCB, 
                  "com.salesforce.smartstore", 
                  "pgQuerySoup", 
                  [{"soupName":soupName, "querySpec":querySpec}]
                  );
};

SmartStore.prototype.retrieveSoupEntries = function (soupName, entryIds, successCB, errorCB) {
    if (this.logLevel > 0) 
        SFHybridApp.logToConsole("SmartStore.retrieveSoupEntry: '" + soupName + "' entryIds: " + entryIds);
    
    PhoneGap.exec(successCB, errorCB, 
                  "com.salesforce.smartstore", 
                  "pgRetrieveSoupEntries", 
                  [{"soupName":soupName, "entryIds":entryIds}]
                  );
};

SmartStore.prototype.upsertSoupEntries = function (soupName, entries, successCB, errorCB) {
    if (this.logLevel > 0) 
        SFHybridApp.logToConsole("SmartStore.upsertSoupEntries: '" + soupName + "' entries.length: " + entries.length);

    PhoneGap.exec(successCB, errorCB, 
                  "com.salesforce.smartstore", 
                  "pgUpsertSoupEntries", 
                  [{"soupName":soupName, "entries":entries}]
                  );
};

SmartStore.prototype.removeFromSoup = function (soupName, entryIds, successCB, errorCB) {
    SFHybridApp.logToConsole("SmartStore.removeFromSoup: '" + soupName + "' entryIds: " + entryIds);

    PhoneGap.exec(successCB, errorCB, 
                  "com.salesforce.smartstore", 
                  "pgRemoveFromSoup", 
                  [{"soupName":soupName, "entryIds":entryIds}]
                  );
};

//====== Cursor manipulation ======
    
SmartStore.prototype.moveCursorToPageIndex = function (cursor, newPageIndex, successCB, errorCB) {
    SFHybridApp.logToConsole("moveCursorToPageIndex: " + cursor.cursorId + "  newPageIndex: " + newPageIndex);

    PhoneGap.exec(successCB, errorCB, 
    "com.salesforce.smartstore", 
    "pgMoveCursorToPageIndex", 
    [{"cursorId":cursor.cursorId, "index":newPageIndex}]
    );
};

SmartStore.prototype.moveCursorToNextPage = function (cursor, successCB, errorCB) {
    var newPageIndex = cursor.currentPageIndex + 1;
    if (newPageIndex >= cursor.totalPages) {
        return;//TODO callback with error?
    }

    this.moveCursorToPageIndex(cursor, newPageIndex, successCB, errorCB);
};

SmartStore.prototype.moveCursorToPreviousPage = function (cursor, successCB, errorCB) {
    var newPageIndex = cursor.currentPageIndex - 1;
    if (newPageIndex < 0) {
        return;//TODO callback with error?
    }

    this.moveCursorToPageIndex(cursor, newPageIndex, successCB, errorCB);
};

SmartStore.prototype.closeCursor = function (cursor, successCB, errorCB) {
    SFHybridApp.logToConsole("closeCursor: " + cursor.cursorId);

    PhoneGap.exec(successCB, errorCB, 
    "com.salesforce.smartstore", 
    "pgCloseCursor", 
    [{"cursorId":cursor.cursorId}]
    );
};


//======Plugin creation / installation ======
    

    
PhoneGap.addConstructor(function () {
        SFHybridApp.logToConsole("SmartStore pre-install");
         if (typeof navigator.smartstore === 'undefined') {
             SFHybridApp.logToConsole("SmartStore.install");
             navigator.smartstore = new SmartStore();
         }
});

}


    

