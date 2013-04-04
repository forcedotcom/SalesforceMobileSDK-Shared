"use strict";

(function(Backbone, _, $) {
    // Save a reference to the global object (`window` in the browser)
    var root = this;

    // Save the previous value of the `Force` variable, so that it can be
    // restored later on, if `noConflict` is used.
    var previousForce = root.Force;

    // The top-level namespace. All public Backbone classes and modules will
    // be attached to this. Exported for both the browser and the server.
    var Force = root.Force = {};

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
    //
    Force.StoreCache = function(soupName) {
        if (smartstoreClient == null) return;
        var indexSpecs = [{path:"key", type:"string"}];
        var that = this;
        smartstoreClient.registerSoup(soupName, indexSpecs)
            .done(function() { 
                that.trigger("ready");
                console.log("Force.StoreCache: " + soupName + " ready");
                that.soupName = soupName;

            })
            .fail(function() {
                that.trigger("initerror");
                console.log("Force.StoreCache: " + soupName + " registration failed");
                that.soupName = null;
            });
    };

    _.extend(Force.StoreCache.prototype, Backbone.Events, {
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

    // Force.SObject
    // --------------
    // Subclass of Backbone.Model that can talk to Salesforce REST API and supports caching in SmartStore or in memory
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
        // * fieldlist:<array of fields> during read if you don't want to fetch the whole record
        // * refetch:true during create/update to do a fetch following the create/update
        // * cache:true during read to check cache first (if one is setup) and only go to server if it's a miss
        //
        sync: function(method, model, options) {
            console.log("In Force.SObject:sync method=" + method + " model.id=" + model.id);

            // Server actions helper
            var serverCreate   = function() { 
                return forcetkClient.create(model.sobjectType, _.omit(model.attributes, 'Id'))
                    .then(function(resp) {
                        return _.extend(model.attributes, {Id: resp.id});
                    }) 
            };

            var serverRetrieve = function() { 
                return forcetkClient.retrieve(model.sobjectType, model.id, options.fieldlist)
                    .then(function(resp) {
                        return _.omit(resp, "attributes");
                    });
            };

            var serverUpdate   = function() { 
                return forcetkClient.update(model.sobjectType, model.id, model.changed)
                    .then(function(resp) { 
                        return model.attributes; 
                    }) 
            };

            var serverDelete   = function() { 
                return forcetkClient.del(model.sobjectType, model.id)
                    .then(function(resp) { 
                        return null;
                    }) 
            };

            var serverRefetchIfRequested  = function(data) { 
                return options.refetch ? serverRetrieve() : data; 
            };

            var serverRetrieveUnlessFound = function(data) { 
                return !options.wasReadFromCache ? serverRetrieve() : data; 
            };

            // Cache actions helper
            var cache = model.getClass().cache;
            var cacheRetrieveIfApplicable  = function(data) { 
                if (cache != null && options.cache) {
                    return cache.retrieve(model.id, options.fieldlist)
                        .then(function(data) { 
                            options.wasReadFromCache = (data != null); 
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
                if (cache != null &&  !options.wasReadFromCache) {
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
                return cache != null ? cache.remove(model.id) : null;
            };

            // Chaining promises that return either a promise or created/upated/reda model attributes or null in the case of delete
            var promise = null;
            switch(method) {
                case "create": promise = serverCreate().then(serverRefetchIfRequested).then(cacheSaveIfApplicable); break;
                case "read":   promise = cacheRetrieveIfApplicable().then(serverRetrieveUnlessFound).then(cacheSaveIfApplicable); break;
                case "update": promise = serverUpdate().then(serverRefetchIfRequested).then(cacheSaveIfApplicable); break;
                case "delete": promise = serverDelete().then(cacheRemoveIfApplicable); break;
            }

            // Done
            promise.done(options.success).fail(options.error);
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
    // Subclass of Backbone.Collection to represent Force.SObjectCollection backed by SOQL, SOSL or MRU
    // 
    Force.SObjectCollection = Backbone.Collection.extend({
        // soql or sosl or mru should be not null but not more than one at a time
        soql:null,
        sosl:null,
        mru:null,

        // Return class object
        getClass: function() {
            return this.__proto__.constructor;
        },

        // Overriding Backbone sync method (responsible for all server interactions)
        //
        sync: function(method, model, options) {
            var that = this;
            if (method != "read") {
                throw "Method " + method  + " not supported";
            }

            // Server actions helper
            var serverSoql = function() { 
                return forcetkClient.query(that.soql)
                    .then(function(resp) { 
                        return resp.records; 
                    });
            };

            var serverSosl = function() {
                return forcetkClient.search(that.sosl)
            };

            var serverMru = function() {
                return forcetkClient.metadata(that.mru)
                .then(function(resp) {
                    return resp.recentItems;
                });
            };

            // Cache action helper
            var cache = model.getClass().cache;
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


            options.reset = true;

            var collectionType = (this.soql != null ? "soql" : (this.sosl != null ? "sosl" : (this.mru != null ? "mru" : null)));
            if (collectionType == null) {
                options.success([]);
                return;
            }

            var promise = null;
            switch(collectionType) {
            case "soql": promise = serverSoql(); break;
            case "sosl": promise = serverSosl(); break;
            case "mru":  promise = serverMru(); break;
            }

            promise
                .then(cacheSaveIfApplicable)
                .done(options.success)
                .fail(options.error);
        },

        // Overriding Backbone parse method (responsible for parsing server response)
        //
        parse: function(resp, options) {
            var that = this;
            return _.map(resp, function(result) {
                var sobjectType = result.attributes.type;
                var sobject = new that.model(_.omit(result, 'attributes'));
                sobject.sobjectType = sobjectType;
                return sobject;
            });
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


})
.call(this, Backbone, _, $);
