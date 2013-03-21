"use strict";

(function(Backbone, _, $) {
    // Private forcetk client
    var forcetkClient;

    // Create namespace
    Backbone.sfdc = {};

    // Init function
    Backbone.sfdc.init = function(creds, apiVersion) {
        forcetkClient = new forcetk.Client(creds.clientId, creds.loginUrl);
        forcetkClient.setSessionToken(creds.accessToken, apiVersion, creds.instanceUrl);
        forcetkClient.setRefreshToken(creds.refreshToken);
        forcetkClient.setUserAgentString(creds.userAgent);
    };

    // Sync function
    Backbone.sfdc.sync = function(method, model, options) {
        var modelClass = model.__proto__.constructor;
        var that = this;
        if (method == "read")
        {
            forcetkClient.retrieve(modelClass.sobjectType, model.Id, modelClass.fieldsOfInterest, 
                                   function(result) {
                                       for (var key in modelClass.fieldsOfInterest) {
                                           result[key] = result[key] || '';
                                       }

                                       options.success(result);
                                   },
                                   function(error) {
                                       console.log(error)
                                   });
        }
        else
        {
            // TBD
        }
    };

    Backbone.sfdc.Model = Backbone.Model.extend({
        // NB: subclass must have class properties sobjectType and fieldsOfInterest
        sync: Backbone.sfdc.sync
    });

    Backbone.sfdc.Collection = Backbone.Collection.extend({
        query: function(whereClause) {
            var that = this;
            forcetkClient.query("SELECT " + this.model.fieldsOfInterest.join(",")  
                                + " FROM "  + this.model.sobjectType
                                + " WHERE " + whereClause,
                                function(results) {
                                    that.reset(results.records);
                                },
                                function(error) {
                                    console.log(error);
                                });
        }
    });


})(Backbone, _, $);
