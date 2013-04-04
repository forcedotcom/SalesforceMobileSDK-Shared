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
        retrieve: function(id, fieldlist) {
            if (smartstoreClient == null) return;
            var querySpec = navigator.smartstore.buildExactQuerySpec("id", id);
            var result = null;
            return smartstoreClient.querySoup(this.soupName, querySpec)
                .then(function(cursor) {
                    if (cursor.currentPageOrderedEntries.length == 1) result = cursor.currentPageOrderedEntries[0].attributes;
                    return smartstoreClient.closeCursor(cursor);
                })
                .then(function() { 
                    // if the cached record doesn't have all the field we are interested in the return null
                    if (result != null && fieldlist != null && _.any(fieldlist, function(field) { 
                        return !_.has(result, field); 
                    })) {
                        console.log("In ModelStoreCache:retrieve id=" + id + ":in cache but missing some fields");
                        result = null;
                    }
                    console.log("In ModelStoreCache:retrieve id=" + id + ":" + (result == null ? "miss" : "hit"));
                    return result;
                });
        },

        // Return promise which stores model attributes in cache
        save: function(attrs) {
            if (smartstoreClient == null) return;
            console.log("In ModelStoreCache:save id=" + attrs.Id);
            return smartstoreClient.upsertSoupEntriesWithExternalId(this.soupName, [ {'id': attrs.Id, 'attributes': attrs} ], "id");
        },

        // Return promise which stores several model attributes in cache
        saveAll: function(arrayOfattrs) {
            if (smartstoreClient == null) return;
            console.log("In ModelStoreCache:saveAll ids=" + _.pluck(arrayOfattrs, 'Id'));
            var soupEntries = _.map(arrayOfattrs, function(attrs) { 
                return {'id': attrs.Id, 'attributes': attrs}; 
            });
            return smartstoreClient.upsertSoupEntriesWithExternalId(this.soupName, soupEntries, "id");
        },

        // Return promise which deletes model from cache
        remove: function(id) {
            if (smartstoreClient == null) return;
            console.log("In ModelStoreCache:remove id=" + id);
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

        // Overriding Backbone sync method (responsible for all server interactions)
        //
        // Extra options:
        // * fieldlist:<array of fields> during read if you don't want to fetch the whole record
        // * refetch:true during create/update to do a fetch following the create/update
        // * cache:true during read to check cache first (if one is setup) and only go to server if it's a miss
        //
        sync: function(method, model, options) {
            console.log("In Force.Model:sync method=" + method + " model.id=" + model.id);

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
                    return cache.save(data)
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

    // Force.Collection
    // --------------
    // Subclass of Backbone.Collection that can talk to Salesforce REST API
    // 
    Force.Collection = Backbone.Collection.extend({
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
                    var cleanRecords = _.map(records, function(record) { 
                        return _.omit(record, "attributes"); 
                    });
                    return cache.saveAll(cleanRecords)
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
