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
    // In memory cache for Force.Model's
    //
    // The cache can be shared by several Force.Model subclasses
    // Once the cache is setup, data for any model fetched or saved will also be saved in the cache
    // To read from the cache during a fetch, simply pass the option cache:true
    //
    // Usage: 
    //   MyModel = Force.Model.extend({...});
    //   var cache = new Force.ModelMemCache();
    //   MyModel.setupCache(cache)
    //   var model = new MyModel({Id: ...});
    //   model.fetch({cache:true, ...});
    //
    Force.ModelMemCache = function() {
        this.data = {};
    };

    _.extend(Force.ModelMemCache.prototype, {
        // Return promise which retrieves cached model attributes or null if not cached
        retrieve: function(id) {
            console.log("In ModelMemCache:retrieve " + id + ":" + (this.data[id] == null ? "miss" : "hit"));
            var d = $.Deferred();
            d.resolve(this.data[id]);
            return d.promise();
        },

        // Return promise which stores model attributes in cache
        save: function(attrs) {
            console.log("In ModelMemCache:save " + attrs.Id);
            this.data[attrs.Id] = _.clone(attrs);
            var d = $.Deferred();
            d.resolve();
            return d.promise();
        },

        // Return promise which deletes model from cache
        remove: function(id) {
            console.log("In ModelMemCache:remove " + id);
            delete this.data[id];
            var d = $.Deferred();
            d.resolve();
            return d.promise();
        }
    });

    // Force.ModelStoreCache
    // -------------------
    // SmartStore-backed cache for Force.Model's
    //
    // The cache can be shared by several Force.Model subclasses
    // Once the cache is setup, data for any model fetched or saved will also be saved in the cache
    // To read from the cache during a fetch, simply pass the option cache:true
    //
    // Records are stored in soup elements of the form {id:sobject-id, attributes:{sobject-attributes}}
    //
    // Usage: 
    //   MyModel = Force.Model.extend({...});
    //   var cache = new Force.ModelStoreCache("soupName");
    //   MyModel.setupCache(cache)
    //   var model = new MyModel({Id: ...});
    //   model.fetch({cache:true, ...});
    //
    Force.ModelStoreCache = function(soupName) {
        if (smartstoreClient == null) return;
        this.soupName = soupName;
        var indexSpecs = [{path:"id", type:"string"}];
        smartstoreClient.registerSoup(soupName, indexSpecs); // XXX need callback when async all completes
    };

    _.extend(Force.ModelStoreCache.prototype, {
        // Return promise which retrieves cached model attributes or null if not cached
        retrieve: function(id) {
            if (smartstoreClient == null) return;
            var querySpec = navigator.smartstore.buildExactQuerySpec("id", id);
            var result = null;
            return smartstoreClient.querySoup(this.soupName, querySpec)
                .then(function(cursor) {
                    if (cursor.currentPageOrderedEntries.length == 1) result = cursor.currentPageOrderedEntries[0].attributes;
                    return smartstoreClient.closeCursor(cursor);
                })
                .then(function() { 
                    console.log("In ModelStoreCache:retrieve " + id + ":" + (result == null ? "miss" : "hit"));
                    return result;
                });
        },

        // Return promise which stores model attributes in cache
        save: function(attrs) {
            if (smartstoreClient == null) return;
            console.log("In ModelStoreCache:save " + attrs.Id);
            return smartstoreClient.upsertSoupEntriesWithExternalId(this.soupName, [ {'id': attrs.Id, 'attributes': attrs} ], "id");
        },

        // Return promise which deletes model from cache
        remove: function(id) {
            if (smartstoreClient == null) return;
            console.log("In ModelStoreCache:remove " + id);
            var that = this;
            var querySpec = navigator.smartstore.buildExactQuerySpec("id", id);
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
    // Subclass of Backbone.Model that can talk to Salesforce REST API and supports caching in SmartStore or in memory
    // 
    Force.Model = Backbone.Model.extend({
        // sobjectType is expected on every instance
        sobjectType:null,

        // Id is the id attribute
        idAttribute: 'Id',

        // Return class object
        getClass: function() {
            return this.__proto__.constructor;
        },

        // Return true if setupCache has been called for class
        hasCache: function() {
            return this.getClass().cache != null;
        },
        
        // Private
        // Read from cache if a cache has been setup and options.cache is true
        // Return a promise that resolves to null if cache is not setup or options.cache is not true or model.is is not found in cache
        readFromCacheIfApplicable: function(options) {
            if (options.cache && this.hasCache()) {
                return this.getClass().cache.retrieve(this.id);
            }
            else {
                var d = $.Deferred();
                d.resolve(null);
                return d.promise();
            }
        },

        // Overriding Backbone sync method (responsible for all server interactions)
        //
        // Extra options:
        // * fieldlist:<array of fields> during read if you don't want to fetch the whole record
        // * refetch:true during create/update to do a fetch following the create/update
        // * cache:true during read to check cache first (if one is setup) and only go to server if it's a miss
        //
        sync: function(method, model, options) {
            console.log("In Force.Model:sync method=" + method + " model.id=" + model.id);

            //
            // We are chaining promises that either return 
            // * another promise or 
            // * the full model attributes (for create/read/update) 
            // * or null (for delete)
            //

            var promise = null;

            // True if we end up getting the data from the cache instead of going to the server
            var readFromCache = false;

            switch(method) {
            case "read":   
                // Go to the cache first if applicable
                promise = model.readFromCacheIfApplicable(options)
                    .then(function(data) {
                        readFromCache = (data != null); // data is null if cache is not setup or doesn't contain the record
                        return readFromCache 
                            ? data // all the attributes for the model
                            : forcetkClient.retrieve(model.sobjectType, model.id, options.fieldlist) // we need to go to the server
                            .then(function(data) {
                                return _.omit(data, "attributes");                                
                            });
                    }); 
                break;

            case "delete": 
                // Go to the server
                promise = forcetkClient.del(model.sobjectType, model.id); break;

            case "create": 
                // Go to the server
                promise = forcetkClient.create(model.sobjectType, _.omit(model.attributes, 'Id')) 
                    .then(function(data) {
                        model.set('Id', data.id);
                        return model.attributes; // all the attributes for the model
                    }); 
                break;

            case "update":
                // Go to the server
                promise = forcetkClient.update(model.sobjectType, model.id, model.changed)
                    .then(function() {
                        return model.attributes; // all the attributes for the model
                    });
                break;
            }

            // Refetch if requested
            if (options.refetch)
            {
                promise = promise
                    .then(function() {
                        return forcetkClient.retrieve(model.sobjectType, model.id, options.fieldlist); // going back to server to refetch data
                    })
                    .then(function(data) {
                        return _.omit(data, "attributes");
                    });
            }

            // Updating cache if applicable
            if (model.hasCache()) {
                promise = promise
                    .then(function(data) {
                        // At this point data should contain all the model attributes (new and old) or be null (delete)
                        // For a delete, we need to remove the model from the cache
                        if (method == "delete") return model.getClass().cache.remove(model.id);
                        // In all other cases, if the data was not read from the cache, we need to update the cache
                        if (!readFromCache) return model.getClass().cache.save(data).then(function() { return data;});
                        else return data;
                    });
            }

            // Done!
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

    // Force.Collection
    // --------------
    // Subclass of Backbone.Collection that can talk to Salesforce REST API
    // 
    Force.Collection = Backbone.Collection.extend({
        // soql or sosl should be not null but not both at once
        soql:null,
        sosl:null,


        // Overriding Backbone sync method (responsible for all server interactions)
        //
        sync: function(method, model, options) {
            var promise = null;
            switch(method) {
            case "read": 
                options.reset = true;
                // soql-backed collection
                if (this.soql != null) {
                    promise = forcetkClient.query(this.soql).then(function(results) { return results.records; });
                }
                // sosl-backed collection
                else if (this.sosl != null) {
                    promise = forcetkClient.search(this.sosl);
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
        },

        // Overriding Backbone parse method (responsible for parsing server response)
        //
        parse: function(resp, options) {
            var that = this;
            var records = [];
            _.each(resp, function(result) {
                var sobjectType = result.attributes.type;
                var sobject = new that.model(_.omit(result, 'attributes'));
                sobject.sobjectType = sobjectType;
                records.push(sobject);
            });
            return records;
        }
    });


})
.call(this, Backbone, _, $);
