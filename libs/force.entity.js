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
            var indexSpecs = _.union([{path:this.keyField, type:"string"}, {path:"__local__", type:"boolean"}], 
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
            return smartstoreClient.querySoup(this.soupName, querySpec)
                .then(function(cursor) {
                    return cursor.currentPageOrderedEntries.length == 1 
                        ? smartstoreClient.removeFromSoup(that.soupName, [cursor.currentPageOrderedEntries[0]._soupEntryId])
                        : null;
                    
                })
                .then(function(cursor) {
                    return smartstoreClient.closeCursor(cursor);
                })
                .then(function() { 
                    return null;
                });
        }
    });

    // Force.SObjectType
    // -----------------
    // Represent the meta-data of a SObject type on the client.
    Force.SObjectType = function (sobjectType, cache) {
        this.sobjectType = sobjectType;
        this.cache = cache;
    };

    _.extend(Force.SObjectType.prototype, {
        fetch: function(options) {
            var options = options || {};
            var wasReadFromCache = false;
            var that = this;

            // Cache actions helper
            var cacheRetrieve = function() { 
                return that.cache.retrieve(that.sobjectType)
                    .then(function(data) { 
                        wasReadFromCache = (data != null); 
                        return data.describeData;
                    })
            };

            var cacheSave = function(describeData) {
                var record = {describeData: describeData};
                record[that.cache.keyField] = that.sobjectType;
                return that.cache.save(record)
                    .then(function() { 
                        return describeData;
                    })
            };
            
            // Server action helper
            var serverDescribeUnlessCached = function(describeData) { 
                return describeData == null ? forcetkClient.describe(that.sobjectType) : describeData; 
            };

            var promise = null;
            // No cache is setup
            if (this.cache == null) {
                promise = serverDescribeUnlessCached(null);
            }
            // Cache is setup
            else {
                promise = cacheRetrieve()
                    .then(serverDescribeUnlessCached)
                    .then(cacheSave);
            }

            promise = promise
                .done(function(describeData) {
                    that.attributes = describeData;
                    if (options.success) options.success(data);
                })
                .fail(options.error);
        }
    });


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

        var uuid = function() {
            return _.uniqueId("local_" + (new Date()).getTime());
        };

        var locallyCreated = function() {
            // Cheaper than retrieving the soup entry and checking the __locally_created__ field
            return id.indexOf("local_") == 0;
        };

        // Cache actions helper
        var cacheCreate = function() {
            if (localAction) {
                var data = _.extend(attributes, {Id: uuid(), __locally_created__:true, __locally_updated__:false, __locally_deleted__:false});
                return cache.save(data)
                    .then(function() { 
                        return data; 
                    });
            }
            else {
                console.error("Force.syncSObjectWithCache called with localAction=false and method=create");
                return null;
            }
        };

        var cacheRead = function() { 
            return cache.retrieve(id, fieldlist)
                .then(function(data) { 
                    return data; 
                });
        };
        
        var cacheUpdate = function() { 
            var data = _.extend(attributes, {Id: id, __locally_created__: locallyCreated(), __locally_updated__: localAction, __locally_deleted__: false});
            return cache.save(data)
                .then(function() {
                    return data;
                });
        };
                             

        var cacheDelete = function() {
            if (!localAction || locallyCreated()) {
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

        // Chaining promises that return either a promise or created/upated/reda model attributes or null in the case of delete
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

        var serverSync = function() {
            return Force.syncSObjectWithServer(method, sobjectType, id, attributes, fieldlist, refetch);
        };

        var cacheSync = function(method, id, attributes, localAction) {
            return Force.syncSObjectWithCache(method, sobjectType, id, attributes, fieldlist, cache, localAction);
        }            

        if (cache == null || cacheMode == "server-only") {
            return serverSync();
        }
        if (cache != null && cacheMode == "cache-only") {
            return cacheSync(method, id, attributes, true);
        }
        
        // Chaining promises that return either a promise or created/upated/reda model attributes or null in the case of delete
        var promise = null;
        var wasReadFromCache = false;

        if (cacheMode == "cache-first") {
            if (method != "read") {
                msg = "cache-first only applies to read";
                console.err(msg);
                throw msg;
            }
            // Go to cache first
            promise = cacheSync(method, id, attributes)
                .then(function(data) {
                    wasReadFromCache = (data != null);
                    if (!wasReadFromCache) {
                        // Not found in cache, go to server
                        return serverSync();
                    }
                    return data;
                });
        }

        if (cacheMode == "server-first" || cacheMode == null) {
            // Go to server first
            promise = serverSync();
        }

        // Write back to cache if not read from cache
        promise = promise.then(function(data) {
            if (!wasReadFromCache) {
                return method == "delete" ? cacheSync("delete", id) : cacheSync("update", data.Id, data);
            }
            return data;
        });

        // For locally created record, delete local record now that it has been saved on server
        // The cacheSync("update",...) above will upsert a new record because the server provided id is different from the locally generated if
        if (method == "create" && attributes.__locally_created__) {
            promise = promise.then(function(data) {
                return cacheSync("delete", id)
                    .then(function() {
                        return data;
                    });
            });
        }


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
                    return resp.records; 
                });
        };

        var serverSosl = function(sosl) {
            return forcetkClient.search(sosl)
        };

        var serverMru = function(sobjectType, fieldlist) {
            return forcetkClient.metadata(sobjectType)
                .then(function(resp) {
                    var soql = "SELECT " + fieldlist.join(",") 
                        + " FROM " + sobjectType
                        + " WHERE Id IN ('" + _.pluck(resp.recentItems, "Id").join("','") + "')";
                    return serverSoql(soql);
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
            sync: function(method, model, options) {
                console.log("-> In Force.SObject:sync method=" + method + " model.id=" + model.id);

                Force.syncSObject(method, this.sobjectType, model.id, model.attributes, options.fieldlist, options.refetch, this.getClass().cache, options.cacheMode)
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
        // To define the set of SObject's to fetch pass an options.config
        // Where the config is 
        // config: {type:"soql", query:"<soql query>"} 
        //   or {type:"sosl", query:"<sosl query>"} 
        //   or {type:"mru", sobjectType:"<sobject type>", fieldlist:"<fields to fetch>"}
        //   or {type:"cache", cacheQuery:<cache query>}
        //
        // TODO: query-more support
        // 
        Force.SObjectCollection = Backbone.Collection.extend({
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
                if (options.config == null) {
                    options.success([]);
                    return;
                }

                options.reset = true;
                Force.fetchSObjects(options.config, this.getClass().cache)
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
