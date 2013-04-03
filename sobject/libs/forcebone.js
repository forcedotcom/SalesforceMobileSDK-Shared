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

    // Function to turn methods with callbacks into jQuery promises
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
    Force.init = function(creds, apiVersion) {
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
    // -----------------
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

    // Force.ModelMemCache
    // -------------------
    Force.ModelMemCache = function() {
        this.data = {};
    };

    _.extend(Force.ModelMemCache.prototype, {
        retrieve: function(id) {
            console.log("In ModelMemCache:retrieve " + id + ":" + (this.data[id] == null ? "miss" : "hit"));
            var d = $.Deferred();
            d.resolve(this.data[id]);
            return d.promise();
        },

        save: function(model) {
            console.log("In ModelMemCache:save " + model.id);
            this.data[model.id] = _.clone(model.attributes);
            var d = $.Deferred();
            d.resolve(model);
            return d.promise();
        },

        remove: function(id) {
            console.log("In ModelMemCache:remove " + id);
            delete this.data[id];
            var d = $.Deferred();
            d.resolve();
            return d.promise();
        }
    });

    // Force.ModelStoreCache
    // ---------------------
    Force.ModelStoreCache = function(soupName, fieldlist) {
        if (smartstoreClient == null) return;
        this.soupName = soupName;
        var indexSpecs = [];
        _.each(fieldlist, function(field) { indexSpecs.push({path:field, type:"string"}); });
        smartstoreClient.registerSoup(soupName, indexSpecs); // XXX this is an async call!
    };

    _.extend(Force.ModelStoreCache.prototype, {
        retrieve: function(id) {
            if (smartstoreClient == null) return;
            var querySpec = navigator.smartstore.buildExactQuerySpec("Id", id);
            var result = null;
            return smartstoreClient.querySoup(this.soupName, querySpec)
                .then(function(cursor) {
                    if (cursor.currentPageOrderedEntries.length == 1) result = cursor.currentPageOrderedEntries[0];
                    return smartstoreClient.closeCursor(cursor);
                })
                .then(function() { 
                    console.log("In ModelStoreCache:retrieve " + id + ":" + (result == null ? "miss" : "hit"));
                    return result;
                });
        },

        save: function(model) {
            if (smartstoreClient == null) return;
            console.log("In ModelStoreCache:save " + model.id);
            return smartstoreClient.upsertSoupEntriesWithExternalId(this.soupName, [ model.attributes ], "Id");
        },

        remove: function(id) {
            if (smartstoreClient == null) return;
            console.log("In ModelStoreCache:remove " + id);
            var querySpec = navigator.smartstore.buildExactQuerySpec("Id", id);
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

    // Force.Model
    // --------------
    Force.Model = Backbone.Model.extend({
        // sobjectType is expected on every instance
        sobjectType:null,
        idAttribute: 'Id',
        destroyed: false,

        getClass: function() {
            return this.__proto__.constructor;
        },

        hasCache: function() {
            return this.getClass().cache != null;
        },
        
        // Read from cache (return a promise)
        // Resolve to null if cache is not setup or options.cache is not true or model.is is not found in cache
        readFromCacheIfPossible: function(options) {
            if (options.cache && this.hasCache()) {
                return this.getClass().cache.retrieve(this.id);
            }
            else {
                var d = $.Deferred();
                d.resolve(null);
                return d.promise();
            }
        },

        // Extra options:
        // * fieldlist:<array of fields> during read if you don't want to fetch the whole record
        // * refetch:true during create/update to do a fetch following the create/update
        // * cache:true during read to check cache first (if one is setup) and only go to server if it's a miss
        sync: function(method, model, options) {
            console.log("In Force.Model:sync method=" + method + " model.id=" + model.id);

            // Go to server (or to the cache if applicable)
            var promise = null;
            var readFromCache = false;
            switch(method) {
            case "read":   promise = model.readFromCacheIfPossible(options).then(function(data) {readFromCache = (data != null); return readFromCache ? data : forcetkClient.retrieve(model.sobjectType, model.id, options.fieldlist);}); break;
            case "delete": promise = forcetkClient.del(model.sobjectType, model.id); break;
            case "create": promise = forcetkClient.create(model.sobjectType, _.omit(model.attributes, 'Id')).then(function(data) {model.set("Id", data.id); return data;}); break;
            case "update": promise = forcetkClient.update(model.sobjectType, model.id, model.changed); break;
            }

            // Refetch if requested
            if (options.refetch)
            {
                promise = promise.then(function() {return forcetkClient.retrieve(model.sobjectType, model.id, options.fieldlist);});
            }

            // Update cache if applicable
            promise = promise.then(function(data) {
                model.set(data);
                if (model.hasCache()) {
                    if (method == "delete") return model.getClass().cache.remove(model.id);
                    if (!readFromCache) return model.getClass().cache.save(model);
                }
                else {
                    return data;
                }
            });

            // Done!
            promise.done(options.success).fail(options.error);
        }
    },{
        // Cache used to store local copies of any record fetched or saved
        // Read go to cache first when cache:true is passed as option
        cache: null,

        setupCache: function(cache) {
            this.cache = cache;
        }
    });

    // Force.Collection
    // ----------------
    Force.Collection = Backbone.Collection.extend({
        soql:null,
        sosl:null,

        sync: function(method, model, options) {
            var promise = null;
            switch(method) {
            case "read": 
                options.reset = true;
                if (this.soql != null) {
                    promise = forcetkClient.query(this.soql).then(function(results) { return results.records; });
                }
                else if (this.sosl != null) {
                    promise = forcetkClient.search(this.sosl);
                }

                if (promise != null) {
                    promise = promise.then(function(results) {
                        var records = [];
                        _.each(results, function(result) {
                            var sobjectType = result.attributes.type;
                            var sobject = new model.model(_.omit(result, 'attributes'));
                            sobject.sobjectType = sobjectType;
                            records.push(sobject);
                        });
                        return records;
                    });
                }

                break;
            }

            if (promise != null)
            {
                promise.done(options.success).fail(options.error);
            }
            else
            {
                options.success([]);
            }
        }
    });


})
.call(this, Backbone, _, $);
