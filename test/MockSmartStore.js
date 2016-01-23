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
 * MockSmartStore: a JavaScript SmartStore
 * Meant for development and testing only, the data is stored in SessionStorage, queries do full scans.
 *
 * Note: we are using the module pattern (see http://briancray.com/posts/javascript-module-pattern/)
 */

var MockSmartStore = (function(window) {
    // Constructor
    var module = function(isGlobalStore) {
        this.isGlobalStore = isGlobalStore || false;
        this._soups = {};     
        this._soupIndexedData = {}; 
        this._soupIndexSpecs = {};
        this._cursors = {};
        this._nextSoupEltIds = {};
        this._nextCursorId = 1;
    };

    // Prototype
    module.prototype = {
        constructor: module,

        reset: function() {
            this._soups = {};
            this._soupIndexedData = {};
            this._soupIndexSpecs = {};
            this._cursors = {};
            this._nextSoupEltIds = {};
            this._nextCursorId = 1;
        },

        useSessionStorage: function() {
            if (window.sessionStorage) {
                // Restore smartstore from storage
                var STORAGE_KEY_MOCKSTORE = this.isGlobalStore ? "mockGlobalStore" : "mockStore";
                var json = window.sessionStorage.getItem(STORAGE_KEY_MOCKSTORE);
                if (json) {
                    console.log("Getting store from session storage");
                    this.fromJSON(json);
                }
                // Save smartstore to storage when onBeforeUnload fires
                window.onbeforeunload = function() {
                    if (window.sessionStorage) {
                        console.log("Saving store to session storage");
                        var json = this.toJSON();
                        window.sessionStorage.setItem(STORAGE_KEY_MOCKSTORE, json);
                    }
                };
            }
        },

        toJSON: function() {
            return JSON.stringify({
                soups: this._soups,
                soupIndexedData: this._soupIndexedData,
                soupIndexSpecs: this._soupIndexSpecs,
                cursors: this._cursors,
                nextSoupEltIds: this._nextSoupEltIds,
                nextCursorId: this._nextCursorId
            });
        },

        fromJSON: function(json) {
            var obj = JSON.parse(json);
            this._soups = obj.soups;
            this._soupIndexedData = obj.soupIndexedData;
            this._soupIndexSpecs = obj.soupIndexSpecs;
            this._cursors = obj.cursors;
            this._nextSoupEltIds = obj.nextSoupEltIds;
            this._nextCursorId = obj.nextCursorId;
        },

        checkSoup: function(soupName) {
            if (!this.soupExists(soupName))  throw new Error("Soup: " + soupName + " does not exist");
        },

        checkIndex: function(soupName, path) {
            if (["_soup", "_soupEntryId"].indexOf(path) == -1 && !this.indexExists(soupName, path)) throw new Error(soupName + " does not have an index on " + path); 
        },

        soupExists: function(soupName) {
            return this._soups[soupName] !== undefined;
        },

        indexExists: function(soupName, indexPath) {
            var indexSpecs = this._soupIndexSpecs[soupName];
            if (indexSpecs != null) {
                for (var i=0; i<indexSpecs.length; i++) {
                    var indexSpec = indexSpecs[i];
                    if (indexSpec.path == indexPath) {
                        return true;
                    }
                }
            }
            return false;
        },

        registerSoup: function(soupName, indexSpecs) {
            if (!this.soupExists(soupName)) {
                this._soups[soupName] = {};
                this._soupIndexSpecs[soupName] = indexSpecs;
                this._soupIndexedData[soupName] = {};
            }
            return soupName;
        },

        removeSoup: function(soupName) {
            delete this._soups[soupName];
            delete this._soupIndexSpecs[soupName];
            delete this._nextSoupEltIds[soupName];
        },

        getSoupIndexSpecs: function(soupName) {
            this.checkSoup(soupName); 
            return this._soupIndexSpecs[soupName];
        },

        alterSoup: function(soupName, indexSpecs, reIndexData) {
            this.checkSoup(soupName); 

            // Gather path---type of old index specs
            var oldPathTypes = [];
            var oldIndexSpecs = this._soupIndexSpecs[soupName];
            for (var i=0; i<oldIndexSpecs.length; i++) {
                var indexSpec = oldIndexSpecs[i];
                oldPathTypes.push(indexSpec.path + "---" + indexSpec.type);
            }

            // Update this._soupIndexSpecs
            this._soupIndexSpecs[soupName] = indexSpecs;

            // Update soupIndexedData
            var soup = this._soups[soupName];
            this._soupIndexedData[soupName] = {};
            var soupIndexedData = this._soupIndexedData[soupName];
            for (var soupEntryId in soup) {
                soupIndexedData[soupEntryId] = {};
                var soupElt = soup[soupEntryId];

                for (var i=0; i<indexSpecs.length; i++) {
                    var path = indexSpecs[i].path;
                    var type = indexSpecs[i].type;
                    if (reIndexData || oldPathTypes.indexOf(path + "---" + type) >= 0) {
                        soupIndexedData[soupEntryId][path] = this.project(soupElt, path);
                    }
                }

            }

            return soupName;
        },

        reIndexSoup: function(soupName, paths) {
            this.checkSoup(soupName);

            var soup = this._soups[soupName];
            var indexSpecs = this._soupIndexSpecs[soupName];
            var soupIndexedData = this._soupIndexedData[soupName];
            for (var soupEntryId in soup) {
                var soupElt = soup[soupEntryId];

                for (var i=0; i<indexSpecs.length; i++) {
                    var path = indexSpecs[i].path;
                    if (paths.indexOf(path) >= 0) {
                        soupIndexedData[soupEntryId][path] = this.project(soupElt, path);
                    }
                }

            }
            return soupName;
        },

        clearSoup: function(soupName) {
            this.checkSoup(soupName);
            this._soups[soupName] = {};
            this._soupIndexedData[soupName] = {};
        },

        upsertSoupEntries: function(soupName, entries, externalIdPath) {
            this.checkSoup(soupName); 
            if (externalIdPath != "_soupEntryId" && !this.indexExists(soupName, externalIdPath)) 
                throw new Error(soupName + " does not have an index on " + externalIdPath); 

            var soup = this._soups[soupName];
            var soupIndexedData = this._soupIndexedData[soupName];
            var indexSpecs = this._soupIndexSpecs[soupName];
            var upsertedEntries = [];
            
            for (var i=0; i<entries.length; i++) {
                var entry = JSON.parse(JSON.stringify(entries[i])); // clone
                var isNew = true;

                // upsert by external id
                if (externalIdPath != "_soupEntryId") {
                    var externalId = this.project(entry, externalIdPath);
                    for (var soupEltId in soup) {
                        var soupElt = soup[soupEltId];
                        var projection = this.project(soupElt, externalIdPath);
                        if (projection == externalId) {
                            if (!isNew) {
                                msg = "There are more than one soup elements where " + externalIdPath + " is " + externalId;
                                console.error(msg);
                                throw new Error(msg);
                            }
                            entry._soupEntryId = soupEltId;
                            isNew = false;
                        }
                    }
                }

                // create
                if (!("_soupEntryId" in entry)) { 
                    this._nextSoupEltIds[soupName] = (soupName in this._nextSoupEltIds ? this._nextSoupEltIds[soupName]+1 : 1);
                    entry._soupEntryId = this._nextSoupEltIds[soupName];
                }

                // last modified date
                entry._soupLastModifiedDate = (new Date()).getTime();
                
                // update/insert into soup
                soup[entry._soupEntryId] = entry;
                upsertedEntries.push(entry);

                // update this._soupIndexedData
                var indexedData = {};
                for (var j=0; j<indexSpecs.length; j++) {
                    var path = indexSpecs[j].path;
                    indexedData[path] = this.project(entry, path);
                }
                soupIndexedData[entry._soupEntryId] = indexedData;
            }
            return upsertedEntries;
        },

        retrieveSoupEntries: function(soupName, entryIds) {
            this.checkSoup(soupName); 
            var soup = this._soups[soupName];
            var entries = [];
            for (var i=0; i<entryIds.length; i++) {
                var entryId = entryIds[i];
                entries.push(soup[entryId]);
            }
            return entries;
        },

        removeFromSoup: function(soupName, entryIds) {
            this.checkSoup(soupName); 
            var soup = this._soups[soupName];
            var soupIndexedData = this._soupIndexedData[soupName];
            for (var i=0; i<entryIds.length; i++) {
                var entryId = entryIds[i];
                delete soup[entryId];
                delete soupIndexedData[entryId];
            }
        },

        project: function(soupElt, path) {
            if (soupElt == null) {
                return null;
            }
            if (path == null || path.length == 0) {
                return soupElt;
            }
            var pathElements = path.split(".");
		    return this.projectHelper(soupElt, pathElements, 0);
        },

        projectHelper: function(jsonObj, pathElements, index) {
		    var result = null;

		    if (index == pathElements.length) {
			    return jsonObj;
		    }

		    if (null != jsonObj) {
			    var pathElement = pathElements[index];

			    if (jsonObj instanceof Array) {
				    result = [];
				    for (var i=0; i<jsonObj.length; i++) {
					    var resultPart = this.projectHelper(jsonObj[i], pathElements, index);
					    if (resultPart != null) {
                            result.push(resultPart)
					    }
				    }
				    if (result.length == 0) {
					    result = null;
				    }
			    }
			    else {
				    result = this.projectHelper(jsonObj[pathElement], pathElements, index+1);
			    }
		    }

		    return result;
	    },
        
        supportedQueries : function() {
            // NB we don't have full support evidently
            return [
                { 
                    name: "Query with variable select fields and where clause {soup:field} IN list of values", 
                    example: "SELECT {soupName:selectField1}, {soupName:selectField2} FROM {soupName} WHERE {soupName:whereField} IN (values)", 
                    pattern: /SELECT (.*) FROM {(.*)} WHERE {(.*):(.*)} IN \((.*)\)/i, 
                    processor: this.smartQuerySoupIn 
                },
                { 
                    name: "Query with where clause {soup:field} like 'value' with optional order by", 
                    example: "SELECT {soupName:_soup} FROM {soupName} WHERE {soupName:whereField} LIKE 'value' ORDER BY LOWER({soupName:orderByField})", 
                    pattern: /SELECT {(.*):_soup} FROM {(.*)} WHERE {(.*):(.*)} LIKE '(.*)'(?: ORDER BY LOWER\({(.*):(.*)}\))?/i, 
                    processor: this.smartQuerySoupLikeOrdered 
                },
                { 
                    name: "Count of soup items", 
                    example: "SELECT count(*) FROM {soupName}", 
                    pattern: /SELECT count\(\*\) FROM {(.*)}/i, 
                    processor: this.smartQuerySoupCount
                },
                { 
                    name: "Comparing soup item to integer with optional order by", 
                    example: "SELECT {soupName:_soup} FROM {soupName} WHERE {soupName:whereField} > 123456 ORDER BY LOWER({soupName:orderByField})", 
                    pattern: /SELECT {(.*):_soup} FROM {(.*)} WHERE {(.*):(.*)} ([!=<>]+) ([0-9]+)(?: ORDER BY LOWER\({(.*):(.*)}\))?/i,
                    processor: this.smartQuerySoupCompare
                }

            ];
        },

        smartQuerySoupIn : function(queryDesc, matches, smartSql) {
            var soupName = matches[2];
            var selectFields = this.getSelectFields(soupName, matches[1]);
            var whereField = matches[4];
            var values = matches[5].split(",");

            if (selectFields != null) {
                var i;
                for (i = 0; i < values.length; i++) {
                    values[i] = values[i].split("'")[1]; // getting rid of surrounding '
                }

                // Make sure the soup has all the appropriate fields.
                this.checkSoup(soupName);
                for (i = 0; i < selectFields.length; i++) {
                    this.checkIndex(soupName, selectFields[i]);
                }
                this.checkIndex(soupName, whereField);

                var soup = this._soups[soupName];

                // Pull results out from soup iteratively.
                var results = [];
                for (var soupEntryId in soup) {
                    var soupElt = soup[soupEntryId];
                    var value = (whereField === "_soupEntryId" ? soupEntryId : this.getTypedIndexedData(soupName, whereField, soupEntryId));
                    if (values.indexOf(value) >= 0) {
                        var self = this;
                        var row = [];
                        selectFields.forEach(function(selectField) {
                            row.push(selectField === "_soup" ? soupElt : (selectField === "_soupEntryId" ? soupEntryId : self.getTypedIndexedData(soupName, selectField, soupEntryId)));
                        })
                        results.push(row);
                    }
                }

                return results;
            }
        },

        // Expect comma separated of {soupName:y}, return array with the values of y
        getSelectFields: function(soupName, s) {
            var fields = [];
            var fieldPattern = /{(.*):(.*)}/;
            var soupFields = s.split(",");
            for (var i=0; i<soupFields.length; i++) {
                var soupField = soupFields[i].trim();
                var matches = soupField.match(fieldPattern);
                if (matches == null || matches[1] !== soupName) {
                    return null;
                }
                else {
                    fields.push(matches[2]);
                }
            }
            return fields;
        },

        smartQuerySoupLikeOrdered : function(queryDesc, matches, smartSql) {
            if (matches[1] === matches[2] && matches[1] === matches[3] && (!matches[6] || matches[1] === matches[6])) {
                var soupName = matches[1];
                var whereField = matches[4];
                var likeRegexp = new RegExp("^" + matches[5].replace(/%/g, ".*"), "i");
                var orderField = matches[6] ? matches[7] : null;

                this.checkSoup(soupName); 
                this.checkIndex(soupName, whereField);
                if (orderField) this.checkIndex(soupName, orderField);
                var soup = this._soups[soupName];

                var results = [];
                for (var soupEntryId in soup) {
                    var soupElt = soup[soupEntryId];
                    var projection = this.getTypedIndexedData(soupName, whereField, soupEntryId) || "";
                    if (projection.match(likeRegexp)) {
                        var row = [];
                        row.push(soupElt);
                        results.push(row);
                    }
                }

                if (orderField) {
                    results = results.sort(function(row1, row2) {
                        var p1 = row1[0][orderField].toLowerCase();
                        var p2 = row2[0][orderField].toLowerCase();
                        return ( p1 > p2 ? 1 : (p1 === p2 ? 0 : -1));
                    });
                }

                return results;
            }
        },

        smartQuerySoupCount : function(queryDesc, matches, smartSql) {
            var soupName = matches[1];
            this.checkSoup(soupName); 
            var soup = this._soups[soupName];
            var count = 0;
            for (var soupEntryId in soup) {
                count++;
            }
            return [[count]];
        },

        smartQuerySoupCompare : function(queryDesc, matches, smartSql) {
            if (matches[1] === matches[2] && matches[1] === matches[3] && (!matches[7] || matches[1] === matches[7])) {
                // Gather the parameters.
                var soupName = matches[2];
                var whereField = matches[4];
                var comparator = matches[5];
                var compareTo = parseInt(matches[6], 10);
                var orderField = matches[7] ? matches[8] : null;
                
                // Make sure the soup has all the appropriate fields.
                this.checkSoup(soupName);
                this.checkIndex(soupName, whereField);
                
                var soup = this._soups[soupName];
                
                // Pull results out from soup iteratively.
                var results = [];
                for (var soupEntryId in soup) {
                    var soupElt = soup[soupEntryId];
                    var projection = this.getTypedIndexedData(soupName, whereField, soupEntryId) || 0;
                    if((comparator == "!=" && projection != compareTo)
                       || (comparator == "=" && projection == compareTo)
                       || (comparator == "<" && projection < compareTo)
                       || (comparator == "<=" && projection <= compareTo)
                       || (comparator == ">=" && projection >= compareTo)
                       || (comparator == ">" && projection > compareTo))
                    {
                        var row = [];
                        row.push(soupElt);
                        results.push(row);
                    }
                }

                if (orderField) {
                    results = results.sort(function(row1, row2) {
                        var p1 = row1[0][orderField].toLowerCase();
                        var p2 = row2[0][orderField].toLowerCase();
                        return ( p1 > p2 ? 1 : (p1 === p2 ? 0 : -1));
                    });
                }
                
                return results;
            }
        },        

        smartQuerySoupFull: function(querySpec) {
            // Match the query against the supported queries in test and then execute.

            var smartSql = querySpec.smartSql;
            var supportedQueries = this.supportedQueries();

            for (var i = 0; i < supportedQueries.length; i++) {
                queryDesc = supportedQueries[i];
                var matches = smartSql.match(queryDesc.pattern);
                if (matches !== null) {
                    var results = queryDesc.processor.call(this, queryDesc, matches, smartSql);
                    if (results == null) {
                        throw new Error("SmartQuery for \"" + queryDesc.name + "\" (Example: " +
                                        queryDesc.example + ") had an error executing: " + smartSql);
                    }
                    else {
                        return results;
                    }
                }
            }

            throw new Error("SmartQuery not supported by MockSmartStore:" + smartSql);
        },

        // Support some full-text queries (see doesFullTextMatch for details)
        querySoupFullTextSearch: function(soupName, querySpec) {
            this.checkSoup(soupName); 
            var soup = this._soups[soupName];
            var results = [];

            for (var soupEntryId in soup) {
                var soupElt = soup[soupEntryId];

                var text = "";
                if (querySpec.indexPath) {
                    text = this.getTypedIndexedData(soupName, querySpec.indexPath, soupEntryId);
                }
                else {
                    // No indexPath provided, match against all full-text fields
                    var indexSpecs = this._soupIndexSpecs[soupName];
                    for (var i=0; i<indexSpecs.length; i++) {
                        var indexSpec = indexSpecs[i];
                        if (indexSpec.type === "full_text") {
                            text += this.getTypedIndexedData(soupName, indexSpec.path, soupEntryId) + " ";
                        }
                    }
                }
                if (this.doesFullTextMatch(text, querySpec.matchKey)) {
                    results.push(soupElt);
                }
            }

            return this.sortResults(results, querySpec);
        },

        typeForPath: function(soupName, path) {
            var indexSpecs = this._soupIndexSpecs[soupName];
            if (indexSpecs != null) {
                for (var i=0; i<indexSpecs.length; i++) {
                    var indexSpec = indexSpecs[i];
                    if (indexSpec.path == path) {
                        return indexSpec.type;
                    }
                }
            }
            return null;
        },

        asType: function(type, value) {
            switch(type) {
            case "string":
            case "full_text":
                // e.g. non-leaf nodes
                if (typeof value !== "string") {
                    return JSON.stringify(value);
                }
                break;
            case "integer":
            case "floating":
                if (typeof value === "string") {
                    return (type === "integer" ? parseInt(value, 10) : parseFloat(value));
                }
                break;
            }
            // XXX might not get a number back if a number is expected
            return value;
        },

        getTypedIndexedData: function(soupName, path, soupEntryId) {
            this.checkIndex(soupName, path);
            var soupIndexedData = this._soupIndexedData[soupName];
            var dataRaw = soupIndexedData[soupEntryId][path];
            var type = this.typeForPath(soupName, path);
            return this.asType(type, dataRaw);
        },

        // query: space separated terms that all need to be in text
        // A term can be prefixed by - to indicate it should not be present.
        // A term can be suffixed by * to indicate to match any words starting with that term
        //
        // Example for the text: "the fox jumped over the dog"
        // query "fox dog" will return true
        // query "fox NOT dog" will return false
        // query "f* dog" will return true
        doesFullTextMatch: function(text, query) {
            var queryWithMinusForNots = query.replace(/ NOT /g, " -"); // code was originally written for standard syntax, turning "abc NOT def" into "abc -def"
            var wordsOfQuery = queryWithMinusForNots.toLowerCase().split(/[^a-zA-Z0-9*-]/);
            wordsOfQuery.sort(); // to move the "-" words first
            var wordsOfElt = text.toLowerCase().split(/\W/);
            wordsOfElt.sort(); // to speed up matches
            for (var j=0; j<wordsOfQuery.length; j++) {
                var wordOfQuery = wordsOfQuery[j].trim();
                if (wordOfQuery == "") {
                    continue;
                }

                // Negative keyword (keyword to exclude)
                if (wordOfQuery.indexOf("-") == 0) {
                    wordOfQuery = wordOfQuery.substring(1);

                    for (var i=0; i<wordsOfElt.length; i++) {
                        var wordOfElt = wordsOfElt[i].trim();
                        if (wordOfElt == "") {
                            continue;
                        }
                        if (wordOfElt.indexOf(wordOfQuery) == 0) {
                            // A query word to exclude was found
                            return false;
                        }
                    }
                }
                // Regular keyword
                else {
                    var foundQueryWord = false;
                    for (var i=0; i<wordsOfElt.length; i++) {
                        var wordOfElt = wordsOfElt[i].trim();
                        if (wordOfElt == "") {
                            continue;
                        }

                        if (wordOfQuery.endsWith("*")) {
                            if (wordOfElt.indexOf(wordOfQuery.substring(0, wordOfQuery.length - 1)) == 0) {
                                foundQueryWord = true;
                                // all the "-" tests have already been conducted, we don't need to test further
                                break;
                            }
                        }
                        else if (wordOfQuery == wordOfElt) {
                            foundQueryWord = true;
                            // all the "-" tests have already been conducted, we don't need to test further
                            break;
                        }
                    }
                    // This query word was not found
                    if (!foundQueryWord) {
                        return false;
                    }
                }
            }
            return true;
        },

        querySoupFull: function(soupName, querySpec) {
            if (querySpec.queryType == "smart") {
                return this.smartQuerySoupFull(querySpec);
            }

            if (querySpec.queryType == "match") {
                return this.querySoupFullTextSearch(soupName, querySpec);
            }

            // other query type
            this.checkSoup(soupName);

            // other query type (but not all query)
            if (!(querySpec.queryType == "range" && querySpec.beginKey == null && querySpec.endKey == null)) {
                this.checkIndex(soupName, querySpec.indexPath);
            }

            var soup = this._soups[soupName];
            var results = [];
            var likeRegexp = (querySpec.likeKey ? new RegExp("^" + querySpec.likeKey.replace(/%/g, ".*"), "i") : null);
            for (var soupEntryId in soup) {
                var soupElt = soup[soupEntryId];
                var projection = querySpec.indexPath == null ? null : this.getTypedIndexedData(soupName, querySpec.indexPath, soupEntryId);
                if (querySpec.queryType === "exact") {
                    if (projection == querySpec.matchKey) {
                        results.push(soupElt);
                    }
                }
                else if (querySpec.queryType === "range") {
                    if ((querySpec.beginKey == null || projection >= querySpec.beginKey)
                        && (querySpec.endKey == null || projection <= querySpec.endKey)) {
                        results.push(soupElt);
                    }
                }
                else if (querySpec.queryType === "like") {
                    if (projection.match(likeRegexp)) {
                        results.push(soupElt);
                    }
                }
            }

            return this.sortResults(results, querySpec);
        },

        sortResults: function(results, querySpec) {
            var resultsSorted = results.sort(function(soupElt1,soupElt2) {
                var p1 = soupElt1[querySpec.orderPath];
                var p2 = soupElt2[querySpec.orderPath];
                var compare = ( p1 > p2 ? 1 : (p1 == p2 ? 0 : -1));
                return (querySpec.order == "ascending" ? compare : -compare);
            });

            return resultsSorted;
        },

        querySoup: function(soupName, querySpec) {
            var results = this.querySoupFull(soupName, querySpec);
            var cursorId = this._nextCursorId++;
            var cursor = {
                cursorId: cursorId, 
                pageSize: querySpec.pageSize,
                soupName: soupName, 
                querySpec: querySpec, 
                currentPageIndex: 0,
                currentPageOrderedEntries: results.slice(0, querySpec.pageSize),
                totalPages: Math.ceil(results.length / querySpec.pageSize),
                totalEntries: results.length
            };

            this._cursors[cursorId] = cursor;
            // Since original cursor from smarstore doesn't contain querySpec and soupName, 
            // remove them here too before returning cursor to the user.
            return this.omit(cursor, 'soupName', 'querySpec');
        },

        moveCursorToPage: function(cursorId, pageIndex) {
            var cursor = this._cursors[cursorId];
            var querySpec = cursor.querySpec;
            var results = this.querySoupFull(cursor.soupName, querySpec);

            cursor.currentPageIndex = pageIndex;
            cursor.currentPageOrderedEntries = results.slice(pageIndex*querySpec.pageSize, (pageIndex+1)*querySpec.pageSize);

            // Since original cursor from smarstore doesn't contain querySpec and soupName, 
            // remove them here too before returning cursor to the user.
            return this.omit(cursor, 'soupName', 'querySpec');
        },

        omit: function(obj, varNames) {
            var ret = {};
            for(var i in obj) {
                if(varNames.indexOf(i) < 0) {
                    ret[i] = obj[i];
                }
            }
            return ret;
        },

        closeCursor: function(cursorId) {
            delete this._cursors[cursorId];
        },
    };

    // Return module
    return module;
})(window);

var mockStore = new MockSmartStore(false);
var mockGlobalStore = new MockSmartStore(true);
(function (cordova, store, globalStore) {
    
    var SMARTSTORE_SERVICE = "com.salesforce.smartstore";

    cordova.interceptExec(SMARTSTORE_SERVICE, "pgGetDatabaseSize", function (successCB, errorCB, args) {
        var targetStore = args[0].isGlobalStore ? globalStore : store;
        successCB(targetStore.toJSON().length);
    });

    cordova.interceptExec(SMARTSTORE_SERVICE, "pgRegisterSoup", function (successCB, errorCB, args) {
        var targetStore = args[0].isGlobalStore ? globalStore : store;
        var soupName = args[0].soupName;
        var indexSpecs = args[0].indexes;
        if (soupName == null) {errorCB("Bogus soup name: " + soupName); return;}
        if (indexSpecs !== undefined && indexSpecs.length == 0) {errorCB("No indexSpecs specified for soup: " + soupName); return;}
        successCB(targetStore.registerSoup(soupName, indexSpecs));
    });

    cordova.interceptExec(SMARTSTORE_SERVICE, "pgRemoveSoup", function (successCB, errorCB, args) {
        var targetStore = args[0].isGlobalStore ? globalStore : store;
        var soupName = args[0].soupName;
        targetStore.removeSoup(soupName);
        successCB("OK");
    });

    cordova.interceptExec(SMARTSTORE_SERVICE, "pgClearSoup", function (successCB, errorCB, args) {
        var targetStore = args[0].isGlobalStore ? globalStore : store;
        var soupName = args[0].soupName;
        targetStore.clearSoup(soupName);
        successCB("OK");
    });

    cordova.interceptExec(SMARTSTORE_SERVICE, "pgGetSoupIndexSpecs", function (successCB, errorCB, args) {
        var targetStore = args[0].isGlobalStore ? globalStore : store;
        var soupName = args[0].soupName;
        if (soupName == null) {errorCB("Bogus soup name: " + soupName); return;}
        successCB(targetStore.getSoupIndexSpecs(soupName));
    });

    cordova.interceptExec(SMARTSTORE_SERVICE, "pgAlterSoup", function (successCB, errorCB, args) {
        var targetStore = args[0].isGlobalStore ? globalStore : store;
        var soupName = args[0].soupName;
        var indexSpecs = args[0].indexes;
        var reIndexData = args[0].reIndexData;
        if (soupName == null) {errorCB("Bogus soup name: " + soupName); return;}
        successCB(targetStore.alterSoup(soupName, indexSpecs, reIndexData));
    });

    cordova.interceptExec(SMARTSTORE_SERVICE, "pgReIndexSoup", function (successCB, errorCB, args) {
        var targetStore = args[0].isGlobalStore ? globalStore : store;
        var soupName = args[0].soupName;
        var paths = args[0].paths;
        if (soupName == null) {errorCB("Bogus soup name: " + soupName); return;}
        successCB(targetStore.reIndexSoup(soupName, paths));
    });

    cordova.interceptExec(SMARTSTORE_SERVICE, "pgSoupExists", function (successCB, errorCB, args) {
        var targetStore = args[0].isGlobalStore ? globalStore : store;
        var soupName = args[0].soupName;
        successCB(targetStore.soupExists(soupName));
    });

    cordova.interceptExec(SMARTSTORE_SERVICE, "pgQuerySoup", function (successCB, errorCB, args) {
        var targetStore = args[0].isGlobalStore ? globalStore : store;
        var soupName = args[0].soupName;
        var querySpec = args[0].querySpec;
        successCB(targetStore.querySoup(soupName, querySpec));
    });

    cordova.interceptExec(SMARTSTORE_SERVICE, "pgRunSmartQuery", function (successCB, errorCB, args) {
        var targetStore = args[0].isGlobalStore ? globalStore : store;
        var querySpec = args[0].querySpec;
        successCB(targetStore.querySoup(null, querySpec));
    });

    cordova.interceptExec(SMARTSTORE_SERVICE, "pgRetrieveSoupEntries", function (successCB, errorCB, args) {
        var targetStore = args[0].isGlobalStore ? globalStore : store;
        var soupName = args[0].soupName;
        var entryIds = args[0].entryIds;
        successCB(targetStore.retrieveSoupEntries(soupName, entryIds));
    });

    cordova.interceptExec(SMARTSTORE_SERVICE, "pgUpsertSoupEntries", function (successCB, errorCB, args) {
        var targetStore = args[0].isGlobalStore ? globalStore : store;
        var soupName = args[0].soupName;
        var entries = args[0].entries;
        var externalIdPath = args[0].externalIdPath;
        successCB(targetStore.upsertSoupEntries(soupName, entries, externalIdPath));
    });

    cordova.interceptExec(SMARTSTORE_SERVICE, "pgRemoveFromSoup", function (successCB, errorCB, args) {
        var targetStore = args[0].isGlobalStore ? globalStore : store;
        var soupName = args[0].soupName;
        var entryIds = args[0].entryIds;
        targetStore.removeFromSoup(soupName, entryIds);
        successCB("OK");
    });

    cordova.interceptExec(SMARTSTORE_SERVICE, "pgMoveCursorToPageIndex", function (successCB, errorCB, args) {
        var targetStore = args[0].isGlobalStore ? globalStore : store;
        var cursorId = args[0].cursorId;
        var index = args[0].index;
        successCB(targetStore.moveCursorToPage(cursorId, index));
    });

    cordova.interceptExec(SMARTSTORE_SERVICE, "pgCloseCursor", function (successCB, errorCB, args) {
        var targetStore = args[0].isGlobalStore ? globalStore : store;
        var cursorId = args[0].cursorId;
        targetStore.closeCursor(cursorId);
        if (successCB) {
            successCB("OK");
        }
    });

})(cordova, mockStore, mockGlobalStore);
