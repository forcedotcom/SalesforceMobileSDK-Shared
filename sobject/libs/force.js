"use strict";

(function(_, $) {
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
                d.resolve.apply(d, arguments);
            });
            args.push(function() {
                d.reject.apply(d, arguments);
            });
            console.log("Calling " + objectName + ":" + methodName);
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
    // SmartStore-backed key-value cache
    // Soup elements of the form {key:.., value:...} indexed by key
    // Fires a ready event when ready and an invalid event if initialization fails
    //
    Force.StoreCache = function(soupName) {
        this.soupName = soupName;
    };

    _.extend(Force.StoreCache.prototype, {
        // Return promise which initializes backing soup
        init: function() {
            if (smartstoreClient == null) return;
            var indexSpecs = [{path:"key", type:"string"}];
            var that = this;
            return smartstoreClient.registerSoup(this.soupName, indexSpecs);
        },

        // Return promise which retrieves cached value for the given key
        // When fieldlist is not null, the cached value is only returned when it has all the fields specified in fieldlist
        retrieve: function(key, fieldlist) {
            if (this.soupName == null) return;
            var querySpec = navigator.smartstore.buildExactQuerySpec("key", key);
            var result = null;
            return smartstoreClient.querySoup(this.soupName, querySpec)
                .then(function(cursor) {
                    if (cursor.currentPageOrderedEntries.length == 1) result = cursor.currentPageOrderedEntries[0].value;
                    return smartstoreClient.closeCursor(cursor);
                })
                .then(function() { 
                    // if the cached record doesn't have all the field we are interested in the return null
                    if (result != null && fieldlist != null && _.any(fieldlist, function(field) { 
                        return !_.has(result, field); 
                    })) {
                        console.log("In StoreCache:retrieve key=" + key + ":in cache but missing some fields");
                        result = null;
                    }
                    console.log("In StoreCache:retrieve key=" + key + ":" + (result == null ? "miss" : "hit"));
                    return result;
                });
        },

        // Return promise which stores key-value in cache
        save: function(keyValue) {
            if (this.soupName == null) return;
            console.log("In StoreCache:save key=" + keyValue.key);
            return smartstoreClient.upsertSoupEntriesWithExternalId(this.soupName, [ keyValue ], "key");
        },

        // Return promise which stores several key-value in cache
        saveAll: function(arrayKeyValue) {
            if (this.soupName == null) return;
            console.log("In StoreCache:saveAll arrayKeyValue.length=" + arrayKeyValue.length);
            return smartstoreClient.upsertSoupEntriesWithExternalId(this.soupName, arrayKeyValue, "key");
        },

        // Return promise which deletes key-value from cache
        remove: function(key) {
            if (this.soupName == null) return;
            console.log("In StoreCache:remove key=" + key);
            var that = this;
            var querySpec = navigator.smartstore.buildExactQuerySpec("key", key);
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
                        return data;
                    })
            };

            var cacheSave = function(data) {
                return that.cache.save({key:that.sobjectType, value:data})
                    .then(function() { 
                        return data;
                    })
            };
            
            // Server action helper
            var serverDescribeUnlessCached = function(data) { 
                return data == null ? forcetkClient.describe(that.sobjectType) : data; 
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
                .done(function(data) {
                    that.attributes = data;
                    if (options.success) options.success(data);
                })
                .fail(options.error);
        }
    });


    // Force.syncSObject
    // -----------------
    // Helper method to do any single record CRUD operations with Salesforce REST API
    // Returns a promise
    // See forcebone.js's Force.SObject for an example
    //
    // method: create, read, delete or update
    // sobjectType: record type
    // id: record id (null for create)
    // attributes: record attributes given by a map of field name to value
    // options: map with some or all of the following
    // * fieldlist:<fields>       for read: fields to fetch for read or to save for update, otherwise full record is fetched or saved
    // * refetch:<boolean>        for create: update to refetch the record following the save (useful in case of calculated fields)
    // * cache:<boolean>          for read: when a cache is specified, a cached record data is returned if found (and if it has all the fields listed in options.fieldlist)
    // cache: cache into which created/read/updated/deleted record should be cached
    //
    Force.syncSObject = function(method, sobjectType, id, attributes, options, cache) {
        console.log("In Force.syncObject:method=" + method + " id=" + id);

        // Cache actions helper
        var wasReadFromCache = false;
        var cacheRetrieveIfApplicable  = function() { 
            if (cache != null && options.cache) {
                return cache.retrieve(id, options.fieldlist)
                    .then(function(data) { 
                        wasReadFromCache = (data != null); 
                        return data; 
                    });
            }
            else {
                var d = $.Deferred();
                d.resolve(null);
                return d.promise();
            }
        };

        var cacheSaveIfApplicable = function(data) { 
            if (cache != null &&  !wasReadFromCache) {
                return cache.save({key:data.Id, value:data})
                    .then(function() { 
                        return data; 
                    });
            }
            else {
                return data;
            }
        };

        var cacheRemoveIfApplicable = function(data) {
            return cache != null ? cache.remove(id) : null;
        };

        // Server actions helper
        var serverCreate   = function() { 
            return forcetkClient.create(sobjectType, _.omit(attributes, 'Id'))
                .then(function(resp) {
                    return _.extend(attributes, {Id: resp.id});
                }) 
        };

        var serverRetrieve = function() { 
            return forcetkClient.retrieve(sobjectType, id, options.fieldlist)
                .then(function(resp) {
                    return _.omit(resp, "attributes");
                });
        };

        var serverUpdate   = function() { 
            var attributesToSave = options.fieldlist != null ? _.pick(attributes, options.fieldlist) : attributes;
            return forcetkClient.update(sobjectType, id, attributesToSave)
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

        var serverRefetchIfRequested  = function(data) { 
            return options.refetch ? serverRetrieve() : data; 
        };

        var serverRetrieveUnlessCached = function(data) { 
            return !wasReadFromCache ? serverRetrieve() : data; 
        };

        // Chaining promises that return either a promise or created/upated/reda model attributes or null in the case of delete
        var promise = null;
        switch(method) {
        case "create": promise = serverCreate().then(serverRefetchIfRequested).then(cacheSaveIfApplicable); break;
        case "read":   promise = cacheRetrieveIfApplicable().then(serverRetrieveUnlessCached).then(cacheSaveIfApplicable); break;
        case "update": promise = serverUpdate().then(serverRefetchIfRequested).then(cacheSaveIfApplicable); break;
        case "delete": promise = serverDelete().then(cacheRemoveIfApplicable); break;
        }
        return promise;
    };

    // Force.fetchSObjects
    // -------------------
    // Helper method to fetch a collection of SObjects defined by a SOQL query, a SOSL search of or the MRU of an sobject type
    // Return promise 
    //
    // config: {type:"soql", query:"<soql query>"} or {type:"sosl", query:"<sosl query>"} or {type:"mru", sobjectType:"<sobject type>", fieldlist:"<fields to fetch>"}
    // cache: cache into which fetched records should be cached
    // 
    Force.fetchSObjects = function(config, cache) {
        // Cache action helper
        var cacheSaveIfApplicable = function(records) { 
            if (cache != null) {
                var keyValues = _.map(records, function(record) { 
                    return {key:record.Id, value:_.omit(record, "attributes")}; 
                });
                return cache.saveAll(keyValues)
                    .then(function() { 
                        return records; 
                    });
            }
            else {
                return records
            }
        };

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
        case "soql": promise = serverSoql(config.query).then(cacheSaveIfApplicable); break;
        case "sosl": promise = serverSosl(config.query).then(cacheSaveIfApplicable); break;
        case "mru":  promise = serverMru(config.sobjectType, config.fieldlist).then(cacheSaveIfApplicable); break;
        // XXX what if we fall through the switch
        }

        return promise;
    };
})
.call(this, _, $);
