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
    var promiser = function(object, methodName) {
        var retfn = function () {
            var args = $.makeArray(arguments);
            var d = $.Deferred();
            args.push(function() {
                d.resolve.apply(d, arguments);
            });
            args.push(function() {
                d.reject.apply(d, arguments);
            });
            object[methodName].apply(object, args);
            return d.promise();
        };
        return retfn;
    };

    // Private forcetk client with promise-wrapped methods
    var forcetkClient;

    // Private smartstore client with promise-wrapped methods
    /* var smartstoreClient; */

    // Init function
    Force.init = function(creds, apiVersion) {
        var innerForcetkClient = new forcetk.Client(creds.clientId, creds.loginUrl);
        innerForcetkClient.setSessionToken(creds.accessToken, apiVersion, creds.instanceUrl);
        innerForcetkClient.setRefreshToken(creds.refreshToken);
        innerForcetkClient.setUserAgentString(creds.userAgent);

        forcetkClient = new Object();
        forcetkClient.create = promiser(innerForcetkClient, "create");
        forcetkClient.retrieve = promiser(innerForcetkClient, "retrieve");
        forcetkClient.update = promiser(innerForcetkClient, "update");
        forcetkClient.del = promiser(innerForcetkClient, "del");
        forcetkClient.query = promiser(innerForcetkClient, "query");
        forcetkClient.search = promiser(innerForcetkClient, "search");

        /* TBD
        smartstoreClient = new Object();
        smartstoreClient.registerSoup = promiser(navigator.smartstore, "registerSoup");
        smartstoreClient.upsertSoupEntries = promiser(navigator.smartstore, "upsertSoupEntries");
        smartstoreClient.retrieveSoupEntries = promiser(navigator.smartstore, "retrieveSoupEntries");
        smartstoreClient.removeFromSoup = promiser(navigator.smartstore, "removeFromSoup");
        */
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

    // Force.ModelCache
    // -----------------
    Force.ModelCache = function() {
        this.cache = {};
    };

    _.extend(Force.ModelCache.prototype, {
        has: function(model) {
            return !_.isUndefined(this.cache[model.id]);
        },

        retrieve: function(model) {
            model.set(this.cache[model.id].attributes);
            return model;
        },

        save: function(model) {
            this.cache[model.id] = _.clone(model);
        },

        remove: function(model) {
            delete this.cache[model.id];
        }
    })


    // Force.Model
    // --------------
    Force.Model = Backbone.Model.extend({
        // sobjectType is expected on every instance
        sobjectType:null,
        idAttribute: 'Id',

        getClass: function() {
            return this.__proto__.constructor;
        },

        initialize: function() {
            if (this.getClass().cache != null) {
                this.bind('sync', this.afterSync);
                this.bind('destroy', this.afterDestroy);
            }
        },

        afterSync: function(model, resp, options) {
            if (options.cache) {
                model.getClass().cache.save(model);
            }
        },

        afterDestroy: function(model, resp, options) {
            if (options.cache) {
                model.getClass().cache.remove(model);
            }
        },

        // Extra options:
        // * fieldlist:<array of fields> during read if you don't want to fetch the whole record
        // * refetch:true during create/update to do a fetch following the create/update
        // * cache:true during create/update/read/delete to save/retrieve model to/from cache
        sync: function(method, model, options) {
            if (options.cache && method=="read" && model.getClass().cache.has(model))  
            {
                options.success(model.getClass().cache.retrieve(model));
            }
            else 
            {
                var promise = null;
                switch(method) {
                case "create": promise = forcetkClient.create(model.sobjectType, _.omit(model.attributes, 'Id')).then(function(data) {model.id = data.id; return data;}); break;
                case "read":   promise = forcetkClient.retrieve(model.sobjectType, model.id, options.fieldlist); break;
                case "update": promise = forcetkClient.update(model.sobjectType, model.id, model.changed); break;
                case "delete": promise = forcetkClient.del(model.sobjectType, model.id); break;
                }

                if (options.refetch)
                {
                    promise = promise.then(function() {return forcetkClient.retrieve(model.sobjectType, model.id, options.fieldlist);});
                }

                promise.done(options.success).fail(options.error);
            }
        }
    },{
        // Cache used when cache:true is specified during CRUD operation
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
