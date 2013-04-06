"use strict";

(function(Force, Backbone, _, $) {

    // Force.SObject
    // --------------
    // Subclass of Backbone.Model to represent a SObject on the client (fetch/save/delete update server through the REST API)
    // When a cache is setup (by calling setupCache), the cache gets a copy of the record after any fetch/save operation (and also destroys any copy of the record after a destroy)
    // During a fetch, set options.cache to true to check the cache first and skip going to the server if a cached copy is found.
    // Furthermore, if options.fieldlist is not null, the cached copy will be returned only if it has all the desired fields.
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

            if (method == "update") {
                options.fieldlist = _.keys(model.changed);
            }

            Force.syncSObject(method, this.sobjectType, model.id, model.attributes, options, this.getClass().cache)
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
    // To define the set of SObject's to fetch, use configureForSOQL, configureForSOSL or configureForMRU.
    // When a cache is setup (by calling setupCache), the cache gets a copy of all records after any fetch operations.
    // TODO: query-more support
    // 
    Force.SObjectCollection = Backbone.Collection.extend({
        config: null, // don't set directly, use configureFor* methods

        // Return class object
        getClass: function() {
            return this.__proto__.constructor;
        },

        // To run SOQL on fetch
        configureForSOQL: function(soql) {
            this.config = {type:"soql", query: soql};
        },

        // To run SOSL on fetch
        configureForSOSL: function(sosl) {
            this.config = {type:"sosl", query: sosl};
        },

        // To get MRU on fetch
        configureForMRU: function(sobjectType, fieldlist) {
            this.config = {type:"mru", sobjectType:sobjectType, fieldlist:fieldlist};
        },

        // Overriding Backbone sync method (responsible for all server interactions)
        //
        sync: function(method, model, options) {
            if (method != "read") {
                throw "Method " + method  + " not supported";
            }
            if (this.config == null) {
                options.success([]);
                return;
            }

            options.reset = true;
            Force.fetchSObjects(this.config, this.getClass().cache)
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
        cache: null,

        // Method to setup cache for all objects of this class
        setupCache: function(cache) {
            this.cache = cache;
        }
    });


})
.call(this, Force, Backbone, _, $);
