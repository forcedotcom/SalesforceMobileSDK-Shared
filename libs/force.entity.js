"use strict";

(function($, _, Backbone) {
    // Save a reference to the global object (`window` in the browser).
    var root = this;

    // Save the previous value of the `Force` variable, so that it can be
    // restored later on, if `noConflict` is used.
    var previousForce = root.Force;

    // The top-level namespace. 
    var Force = this.Force = {};

    // Runs in *noConflict* mode, returning the `Force` variable
    // to its previous owner. Returns a reference to this Force object.
    Force.noConflict = function() {
        root.Force = previousForce;
        return this;
    };

    // Utility Function to turn methods with callbacks into jQuery promises
    var promiser = function(object, methodName, objectName) {
        var retfn = function () {
            var args = $.makeArray(arguments);
            var d = $.Deferred();
            args.push(function() {
                console.log("------> Calling successCB for " + objectName + ":" + methodName);
                d.resolve.apply(d, arguments);
            });
            args.push(function() {
                console.log("------> Calling errorCB for " + objectName + ":" + methodName);
                d.reject.apply(d, arguments);
            });
            console.log("-----> Calling " + objectName + ":" + methodName);
            object[methodName].apply(object, args);
            return d.promise();
        };
        return retfn;
    };

    // Private forcetk client with promise-wrapped methods
    var forcetkClient = null;

    // Private smartstore client with promise-wrapped methods
    var smartstoreClient = null; 

    // Init function
    // creds: credentials returned by authenticate call
    // apiVersion: apiVersion to use, when null, v27.0 (Spring' 13) is used
    Force.init = function(creds, apiVersion) {
        apiVersion = apiVersion || "v27.0";
        var innerForcetkClient = new forcetk.Client(creds.clientId, creds.loginUrl);
        innerForcetkClient.setSessionToken(creds.accessToken, apiVersion, creds.instanceUrl);
        innerForcetkClient.setRefreshToken(creds.refreshToken);
        innerForcetkClient.setUserAgentString(creds.userAgent);

        forcetkClient = new Object();
        forcetkClient.create = promiser(innerForcetkClient, "create", "forcetkClient");
        forcetkClient.retrieve = promiser(innerForcetkClient, "retrieve", "forcetkClient");
        forcetkClient.update = promiser(innerForcetkClient, "update", "forcetkClient");
        forcetkClient.del = promiser(innerForcetkClient, "del", "forcetkClient");
        forcetkClient.query = promiser(innerForcetkClient, "query", "forcetkClient");
        forcetkClient.queryMore = promiser(innerForcetkClient, "queryMore", "forcetkClient");
        forcetkClient.search = promiser(innerForcetkClient, "search", "forcetkClient");
        forcetkClient.metadata = promiser(innerForcetkClient, "metadata", "forcetkClient");
        forcetkClient.describe = promiser(innerForcetkClient, "describe", "forcetkClient");

        if (navigator.smartstore) 
        {
            smartstoreClient = new Object();
            smartstoreClient.registerSoup = promiser(navigator.smartstore, "registerSoup", "smartstoreClient");
            smartstoreClient.upsertSoupEntriesWithExternalId = promiser(navigator.smartstore, "upsertSoupEntriesWithExternalId", "smartstoreClient");
            smartstoreClient.querySoup = promiser(navigator.smartstore, "querySoup", "smartstoreClient");
            smartstoreClient.removeFromSoup = promiser(navigator.smartstore, "removeFromSoup", "smartstoreClient");
            smartstoreClient.closeCursor = promiser(navigator.smartstore, "closeCursor", "smartstoreClient");
        }
    };

    // Force.RestError
    // ---------------
    Force.RestError = function(xhr) {
        // 200	“OK” success code, for GET or HEAD request.
        // 201	“Created” success code, for POST request.
        // 204	“No Content” success code, for DELETE request.
        // 300	The value returned when an external ID exists in more than one record. The response body contains the list of matching records.
        // 400	The request couldn’t be understood, usually because the JSON or XML body contains an error.
        // 401	The session ID or OAuth token used has expired or is invalid. The response body contains the message and errorCode.
        // 403	The request has been refused. Verify that the logged-in user has appropriate permissions.
        // 404	The requested resource couldn’t be found. Check the URI for errors, and verify that there are no sharing issues.
        // 405	The method specified in the Request-Line isn’t allowed for the resource specified in the URI.
        // 415	The entity in the request is in a format that’s not supported by the specified method.
        // 500	An error has occurred within Force.com, so the request couldn’t be completed. Contact salesforce.com Customer Support.
        this.xhr = xhr;
        this.status = xhr.status;
        try {
            this.details = JSON.parse(xhr.responseText);
        }
        catch (e) { 
            console.log("Could not parse responseText:" + e);
        }
    };

    // Force.StoreCache
    // ----------------
    // SmartStore-backed cache
    // Soup elements are expected to have the boolean fields __locally_created__, __locally_updated__ and __locally_deleted__
    // A __local__ boolean field is added automatically on save
    // Index are created for keyField and __local__
    //
    Force.StoreCache = function(soupName, additionalIndexSpecs, keyField) {
        this.soupName = soupName;
        this.keyField = keyField || "Id";
        this.additionalIndexSpecs = additionalIndexSpecs;
    };

    _.extend(Force.StoreCache.prototype, {
        // Return promise which initializes backing soup
        init: function() {
            if (smartstoreClient == null) return;
            var indexSpecs = _.union([{path:this.keyField, type:"string"}, {path:"__local__", type:"string"}], 
                                     this.additionalIndexSpecs);
            return smartstoreClient.registerSoup(this.soupName, indexSpecs);
        },

        // Return promise which retrieves cached value for the given key
        // When fieldlist is not null, the cached value is only returned when it has all the fields specified in fieldlist
        retrieve: function(key, fieldlist) {
            if (this.soupName == null) return;
            var querySpec = navigator.smartstore.buildExactQuerySpec(this.keyField, key);
            var record = null;
            return smartstoreClient.querySoup(this.soupName, querySpec)
                .then(function(cursor) {
                    if (cursor.currentPageOrderedEntries.length == 1) record = cursor.currentPageOrderedEntries[0];
                    return smartstoreClient.closeCursor(cursor);
                })
                .then(function() { 
                    // if the cached record doesn't have all the field we are interested in the return null
                    if (record != null && fieldlist != null && _.any(fieldlist, function(field) { 
                        return !_.has(record, field); 
                    })) {
                        console.log("----> In StoreCache:retrieve " + key + ":in cache but missing some fields");
                        record = null;
                    }
                    console.log("----> In StoreCache:retrieve " + key + ":" + (record == null ? "miss" : "hit"));
                    return record;
                });
        },

        // Return promise which stores a record in cache
        save: function(record) {
            if (this.soupName == null) return;
            console.log("----> In StoreCache:save " + record[this.keyField]);
            record.__local__ =  (record.__locally_created__ || record.__locally_updated__ || record.__locally_deleted__);
            return smartstoreClient.upsertSoupEntriesWithExternalId(this.soupName, [ record ], this.keyField);
        },

        // Return promise which stores several records in cache
        saveAll: function(records) {
            if (this.soupName == null) return;
            console.log("----> In StoreCache:saveAll records.length=" + records.length);
            records = _.map(records, function(record) { 
                record.__local__ =  (record.__locally_created__ || record.__locally_updated__ || record.__locally_deleted__);
                return record;
            });
            return smartstoreClient.upsertSoupEntriesWithExternalId(this.soupName, records, this.keyField);
        },


        // Return promise which returns records matching the passed querySpec
        // TODO: paging support
        find: function(querySpec) {
            var records = null;
            return smartstoreClient.querySoup(this.soupName, querySpec)
                .then(function(cursor) {
                    records = cursor.currentPageOrderedEntries;
                    return smartstoreClient.closeCursor(cursor);
                })
                .then(function() { 
                    return records;
                });
        },

        // Return promise which deletes record from cache
        remove: function(key) {
            if (this.soupName == null) return;
            console.log("----> In StoreCache:remove " + key);
            var that = this;
            var querySpec = navigator.smartstore.buildExactQuerySpec(this.keyField, key);
            var soupEntryId = null;
            return smartstoreClient.querySoup(this.soupName, querySpec)
                .then(function(cursor) {
                    if (cursor.currentPageOrderedEntries.length == 1) {
                        soupEntryId = cursor.currentPageOrderedEntries[0]._soupEntryId;
                    }
                    return smartstoreClient.closeCursor(cursor);
                })
                .then(function() {
                    if (soupEntryId != null) {
                        return smartstoreClient.removeFromSoup(that.soupName, [ soupEntryId ])
                    }
                    return null;
                })
                .then(function() { 
                    return null;
                });
        },

        // Return uuid for locally created entry
        makeLocalId: function() {
            return _.uniqueId("local_" + (new Date()).getTime());
        },

        // Return true if id was a locally made id
        isLocalId: function(id) {
            return id != null && id.indexOf("local_") == 0;
        }
    });

    // Force.SObjectType
    // -----------------
    // Represent the meta-data of a SObject type on the client.
    Force.SObjectType = function (sobjectType, cache) {
        this.sobjectType = sobjectType;
        this.cache = cache;
    };

    _.extend(Force.SObjectType.prototype, (function() {
        //TBD: Should we support cache modes here too.
        var that;
        var wasReadFromCache = false;

        /*----- INTERNAL METHODS ------*/
        // Cache actions helper
        /* Check first if cache exists and if data exists in cache.
        Then update the current instance with data from cache. */
        var cacheRetrieve = function() { 
            if (that.cache) {
                return that.cache.retrieve(that.sobjectType)
                        .then(function(data) {
                            if (data) {
                                wasReadFromCache = (data != null); 
                                that._describeResult = data.describeResult;
                                that._metadataResult = data.metadataResult;
                            }
                        });
            }
        };

        /* Check first if cache exists.
        Then save the current instance data to cache. */
        var cacheSave = function() {
            if (that.cache) {
                var record = {
                    describeResult: that._describeResult, 
                    metadataResult: that._metadataResult
                };

                record[that.cache.keyField] = that.sobjectType;
                return that.cache.save(record);
            }
        };

        /* Check first if cache exists. If yes, then 
        clear any data from the cache for this sobject type. */
        var cacheClear = function() {
            if (that.cache) {
                return that.cache.remove(that.sobjectType);
            }
        };
        
        // Server action helper
        /* If no describe data exists on the instance, get it from server.*/
        var serverDescribeUnlessCached = function() { 
            if(!that._describeResult) {
                return forcetkClient.describe(that.sobjectType)
                        .then(function(describeResult) {
                            that._describeResult = describeResult;
                        });
            }
        };

        /* If no metadata data exists on the instance, get it from server.*/
        var serverMetadataUnlessCached = function() { 
            if(!that._metadataResult) {
                return forcetkClient.metadata(that.sobjectType)
                        .then(function(metadataResult) {
                            that._metadataResult = metadataResult;
                        });
            }
        };

        /*----- EXTERNAL METHODS ------*/
        return {
            /* Returns a promise, which once resolved 
            returns describe data of the sobject. */
            describe: function() {
                that = this;
                if (that._describeResult) return $.when(that._describeResult);
                else return $.when(cacheRetrieve())
                        .then(serverDescribeUnlessCached)
                        .then(cacheSave)
                        .then(function() {
                            return that._describeResult;
                        });
            },
            /* Returns a promise, which once resolved 
            returns metadata of the sobject. */
            getMetadata: function() {
                that = this;
                if (that._metadataResult) return $.when(that._metadataResult);
                else return $.when(cacheRetrieve())
                        .then(serverMetadataUnlessCached)
                        .then(cacheSave)
                        .then(function() {
                            return that._metadataResult;
                        });
            },
            /* Returns a promise, which once resolved clears 
            the cached data for the current sobject type. */
            reset: function() {
                that = this;
                wasReadFromCache = false;
                that._metadataResult = that._describeResult = undefined;
                return $.when(clearCache());
            }
        }
    })());


    // Force.syncSObjectWithCache
    // ---------------------------
    // Helper method to do any single record CRUD operation against cache
    // Returns a promise
    //
    // method: create, read, delete or update
    // sobjectType: record type
    // id: record id (null for create)
    // attributes: record attributes given by a map of field name to value
    // fieldlist:<fields>       for read, when not null, the cached record is only returned if it has all the requested fields
    // cache: cache into which  created/read/updated/deleted record are cached    
    // localChange:true|false   pass true if the change is done against the cache only (and has not been done against the server)
    //
    Force.syncSObjectWithCache = function(method, sobjectType, id, attributes, fieldlist, cache, localAction) {
        console.log("---> In Force.syncSObjectWithCache:method=" + method + " id=" + id);

        localAction = localAction || false;
        var isLocalId = cache.isLocalId(id);

        // Cache actions helper
        var cacheCreate = function() {
            var data = _.extend(attributes, {Id: (localAction ? cache.makeLocalId() : id), __locally_created__:localAction, __locally_updated__:false, __locally_deleted__:false});
            return cache.save(data)
                .then(function() { 
                    return data; 
                });
        };

        var cacheRead = function() { 
            return cache.retrieve(id, fieldlist)
                .then(function(data) { 
                    return data; 
                });
        };
        
        var cacheUpdate = function() { 
            var data = _.extend(attributes, {Id: id, __locally_created__: isLocalId, __locally_updated__: localAction, __locally_deleted__: false});
            return cache.save(data)
                .then(function() {
                    return data;
                });
        };
                             

        var cacheDelete = function() {
            if (!localAction || isLocalId) {
                return cache.remove(id);
            }
            else {
                return cache.retrieve(id).
                    then(function(data) {
                        return cache.save(_.extend(data, {__locally_deleted__: true}));
                    })
                    .then(function() {
                        return null;
                    });
            }
        };

        // Chaining promises that return either a promise or created/upated/reda model attributes or null in the case of delete
        var promise = null;
        switch(method) {
        case "create": promise = cacheCreate(); break;
        case "read":   promise = cacheRead();   break;
        case "update": promise = cacheUpdate(); break;
        case "delete": promise = cacheDelete(); break;
        }

        return promise;
    };


    // Force.syncSObjectWithServer
    // ---------------------------
    // Helper method to do any single record CRUD operation against Salesforce server via REST API
    // Returns a promise
    //
    // method: create, read, delete or update
    // sobjectType: record type
    // id: record id (null for create)
    // attributes: record attributes given by a map of field name to value
    // fieldlist:<fields>    fields to fetch for read  otherwise full record is fetched, fields to save for update or create (required)
    // refetch:true          for create or update to refetch the record following the save (useful in case of calculated fields)
    //
    Force.syncSObjectWithServer = function(method, sobjectType, id, attributes, fieldlist, refetch) {
        console.log("---> In Force.syncSObjectWithServer:method=" + method + " id=" + id);

        // Server actions helper
        var serverCreate   = function() { 
            var attributesToSave = _.pick(attributes, fieldlist);
            return forcetkClient.create(sobjectType, _.omit(attributesToSave, "Id"))
                .then(function(resp) {
                    return _.extend(attributes, {Id: resp.id});
                }) 
        };

        var serverRetrieve = function() { 
            return forcetkClient.retrieve(sobjectType, id, fieldlist);
        };

        var serverUpdate   = function() { 
            var attributesToSave = _.pick(attributes, fieldlist);
            return forcetkClient.update(sobjectType, id, _.omit(attributesToSave, "Id"))
                .then(function(resp) { 
                    return attributes; 
                }) 
        };

        var serverDelete   = function() { 
            return forcetkClient.del(sobjectType, id)
                .then(function(resp) { 
                    return null;
                }) 
        };

        // Chaining promises that return either a promise or created/upated/read model attributes or null in the case of delete
        var promise = null;
        switch(method) {
        case "create": promise = serverCreate(); break;
        case "read":   promise = serverRetrieve(); break;
        case "update": promise = serverUpdate(); break;
        case "delete": promise = serverDelete(); break;
        }

        if (refetch) {
            promise = promise.then(serverRetrieve);
        }

        return promise;

    };

    // Force.syncSObject
    // -----------------
    // Helper method combining Force.syncObjectWithServer and Force.syncObjectWithCache
    // Returns a promise
    //
    // If cache is null, it simply calls Force.syncObjectWithServer
    // If cache is not null:
    // * if cacheMode is "server-only" then it simply calls Force.syncObjectWithServer
    // * if cacheMode is "cache-only" then it simply calls Force.syncObjectWithCache
    // * if cacheMode is "cache-first" then during a read, the cache is queried first, and the server is only queried if the cache misses
    // * if cacheMode is "server-first", then the server is queried first and the cache is updated afterwards
    //
    Force.syncSObject = function(method, sobjectType, id, attributes, fieldlist, refetch, cache, cacheMode) {
        console.log("--> In Force.syncSObject:method=" + method + " id=" + id + " cacheMode=" + cacheMode);

        var serverSync = function(method, id) {
            return Force.syncSObjectWithServer(method, sobjectType, id, attributes, fieldlist, refetch);
        };

        var cacheSync = function(method, id, attributes, localAction) {
            return Force.syncSObjectWithCache(method, sobjectType, id, attributes, fieldlist, cache, localAction);
        }            

        // Server only
        if (cache == null || cacheMode == "server-only") {
            return serverSync(method, id);
        }

        // Cache only
        if (cache != null && cacheMode == "cache-only") {
            return cacheSync(method, id, attributes, true);
        }
        
        // Chaining promises that return either a promise or created/upated/reda model attributes or null in the case of delete
        var promise = null;
        var wasReadFromCache = false;

        // Go to cache first
        if (cacheMode == "cache-first") {
            promise = cacheSync(method, id, attributes)
                .then(function(data) {
                    wasReadFromCache = (data != null);
                    if (!wasReadFromCache) {
                        // Not found in cache, go to server
                        return serverSync(method, id);
                    }
                    return data;
                });
        }
        // Go to server first
        else if (cacheMode == "server-first" || cacheMode == null /* no cachMode specified means server-first */) {
            if (cache.isLocalId(id)) {
                if (method == "read" || method == "delete") {
                    throw "Can't " + method + " on server a locally created record";
                }

                // For locally created record, we need to do a create on the server
                var createdData;
                promise = serverSync("create", null)
                .then(function(data) {
                    createdData = data;
                    // Then we need to get rid of the local record with locally created id
                    return cacheSync("delete", id);
                })
                .then(function() {
                    return createdData;
                });
            }
            else {
                promise = serverSync(method, id);
            }
        }

        // Write back to cache if not read from cache
        promise = promise.then(function(data) {
            if (!wasReadFromCache) {
                var targetId = (method == "delete" ? id : data.Id);
                var targetMethod = (method == "read" ? "update" /* we want to write to the cache what was read from the server */: method);
                return cacheSync(targetMethod, targetId, data);
            }
            return data;
        });

        // Done
        return promise;
    };

    // Force.fetchSObjectsFromCache
    // ----------------------------
    // Helper method to fetch a collection of SObjects from cache
    // Return promise 
    //
    // cache: cache into which fetched records should be cached
    // cacheQuery: cache-specific query
    // 
    Force.fetchSObjectsFromCache = function(cache, cacheQuery) {
        console.log("---> In Force.fetchSObjectsFromCache");
        return cache.find(cacheQuery);
    };


    // Force.fetchSObjectsFromServer
    // -----------------------------
    // Helper method to fetch a collection of SObjects from server, using SOQL, SOSL or MRU
    // Return promise 
    //
    // config: {type:"soql", query:"<soql query>"} 
    //   or {type:"sosl", query:"<sosl query>"} 
    //   or {type:"mru", sobjectType:"<sobject type>", fieldlist:"<fields to fetch>"}
    // 
    Force.fetchSObjectsFromServer = function(config) {
        console.log("---> In Force.fetchSObjectsFromServer:config=" + JSON.stringify(config));

        // Server actions helper
        var serverSoql = function(soql) { 
            return forcetkClient.query(soql)
                .then(function(resp) { 
                    return {
                        _nextRecordsUrl: resp.nextRecordsUrl,
                        totalSize: resp.totalSize,
                        records: resp.records,
                        hasMore: function() { return this._nextRecordsUrl != null; },
                        getMore: function() {
                            var that = this;
                            if (!that._nextRecordsUrl) return null;
                            return forcetkClient.queryMore(that._nextRecordsUrl).then(function(resp) {
                                that._nextRecordsUrl = resp.nextRecordsUrl;
                                that.records.pushObjects(resp.records);
                                return resp.records;
                            });
                        }
                    };
                });
        };

        var serverSosl = function(sosl) {
            return forcetkClient.search(sosl)
        };

        var serverMru = function(sobjectType, fieldlist) {
            return forcetkClient.metadata(sobjectType)
                .then(function(resp) {
                    //Only do query if the fieldList is provided.
                    if (fieldlist) {
                        var soql = "SELECT " + fieldlist.join(",") 
                            + " FROM " + sobjectType
                            + " WHERE Id IN ('" + _.pluck(resp.recentItems, "Id").join("','") + "')";
                        return serverSoql(soql);
                    } else return {
                        done: true,
                        records: resp.recentItems, 
                        totalSize: resp.recentItems.length,
                        hasMore: function() { return false; },
                        getMore: function() { return null; }
                    };
                });
        };

        var promise = null;
        switch(config.type) {
        case "soql": promise = serverSoql(config.query); break;
        case "sosl": promise = serverSosl(config.query); break;
        case "mru":  promise = serverMru(config.sobjectType, config.fieldlist); break;
        // XXX what if we fall through the switch
        }

        return promise;
    };


    // Force.fetchSObjects
    // -------------------
    // Helper method combining Force.fetchSObjectsFromCache anf Force.fetchSObjectsFromServer
    // Returns a promise
    //
    // If cache is null, it simply calls Force.fetchSObjectsFromServer
    // If cache is not null and config.type is cache then it simply calls Force.fetchSObjectsFromCache with config.cacheQuery
    // Otherwise, the server is queried first and the cache is updated afterwards
    //
    Force.fetchSObjects = function(config, cache) {
        console.log("--> In Force.fetchSObjects:config.type=" + config.type);

        if (cache == null) {
            return Force.fetchSObjectsFromServer(config);
        }
        if (cache != null && config.type == "cache") {
            return Force.fetchSObjectsFromCache(cache, config.cacheQuery);
        }

        // Cache action helper
        var cacheSave = function(records) { 
            var keys = _.map(records, function(record) { 
                return _.extend(record, {__locally_created__: false, __locally_updated__: false, __locally_deleted__: false})
            });
            return cache.saveAll(keys)
                .then(function() { 
                    return records; 
                });
        };

        var promise = Force.fetchSObjectsFromServer(config);
        if (cache != null) {
            promise = promise.then(cacheSave);
        }

        return promise;
    };

    if (!_.isUndefined(Backbone)) {

        // Force.SObject
        // --------------
        // Subclass of Backbone.Model to represent a SObject on the client (fetch/save/delete update server through the REST API and or cache)
        // 
        Force.SObject = Backbone.Model.extend({
            // Used if none is passed during sync call - can be a string or a function taking the method and returning a string
            fieldlist:null,
            
            // Used if none is passed during sync call - can be a string or a function taking the method and returning a string
            cacheMode:null, 

            // sobjectType is expected on every instance
            sobjectType:null,

            // Id is the id attribute
            idAttribute: 'Id',

            // Return class object
            getClass: function() {
                return this.__proto__.constructor;
            },

            // Overriding Backbone sync method (responsible for all server interactions)
            //
            // Extra options:
            // * fieldlist:<array of fields> during read if you don't want to fetch the whole record, during save fields to save
            // * refetch:true during create/update to do a fetch following the create/update
            // * cacheMode: "server-only" | "cache-only" | "cache-first" | null (see Force.syncSObject for details)
            //
            // Instead of passing fieldlist or cacheMode in the options, you can also define the fieldlist or cacheMode properties on this object
            //
            sync: function(method, model, options) {
                console.log("-> In Force.SObject:sync method=" + method + " model.id=" + model.id);

                var fieldlist = options.fieldlist || (_.isFunction(this.fieldlist) ? this.fieldlist(method) : this.fieldlist);
                var cacheMode = options.cacheMode || (_.isFunction(this.cacheMode) ? this.cacheMode(method) : this.cacheMode);
                Force.syncSObject(method, this.sobjectType, model.id, model.attributes, fieldlist, options.refetch, this.getClass().cache, cacheMode)
                    .done(options.success)
                    .fail(options.error);
            }
        },{
            // Cache used to store local copies of any record fetched or saved
            // Read go to cache first when cache:true is passed as option
            cache: null,

            // Method to setup cache for all models of this class
            setupCache: function(cache) {
                this.cache = cache;
            }
        });


        // Force.SObjectCollection
        // -----------------------
        // Subclass of Backbone.Collection to represent a collection of SObject's on the client.
        // Only fetch is supported (no create/update or delete).
        // To define the set of SObject's to fetch pass an options.config or set the config property on this collection object.
        // Where the config is 
        // config: {type:"soql", query:"<soql query>"} 
        //   or {type:"sosl", query:"<sosl query>"} 
        //   or {type:"mru", sobjectType:"<sobject type>", fieldlist:"<fields to fetch>"}
        //   or {type:"cache", cacheQuery:<cache query>}
        //
        // TODO: query-more support
        // 
        Force.SObjectCollection = Backbone.Collection.extend({
            // Used if none is passed during sync call - can be a string or a function returning a string
            config:null, 

            // Return class object
            getClass: function() {
                return this.__proto__.constructor;
            },

            // Overriding Backbone sync method (responsible for all server interactions)
            //
            sync: function(method, model, options) {
                console.log("-> In Force.SObjectCollection:sync method=" + method);
                if (method != "read") {
                    throw "Method " + method  + " not supported";
                }
                
                var config = options.config || (_.isFunction(this.config) ? this.config() : this.config);
                if (config == null) {
                    options.success([]);
                    return;
                }

                options.reset = true;
                Force.fetchSObjects(config, this.getClass().cache)
                    .done(options.success)
                    .fail(options.error);
            },

            // Overriding Backbone parse method (responsible for parsing server response)
            //
            parse: function(resp, options) {
                var that = this;
                return _.map(resp, function(result) {
                    var sobjectType = result.attributes.type;
                    var sobject = new that.model(result);
                    sobject.sobjectType = sobjectType;
                    return sobject;
                });
            }
        },{
            cache: null,

            // Method to setup cache for all objects of this class
            setupCache: function(cache) {
                this.cache = cache;
            }
        });

    } // if (!_.isUndefined(Backbone)) {
})
.call(this, $, _, window.Backbone);