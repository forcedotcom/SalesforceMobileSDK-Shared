"use strict";

(function(Backbone, _, $) {
    // Private forcetk client
    var forcetkClient;

    // Private function
    var getFrontDoorURL = function(url) {
        return forcetkClient.instanceUrl + "/secur/frontdoor.jsp?"
            + "sid=" + encodeURIComponent(forcetkClient.sessionId) 
            + "&retURL=" + encodeURIComponent(url);
    };

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
                                       options.success(result, {'parse':true});
                                   },
                                   function(error) {
                                       options.error(error);
                                   });
        }
        else
        {
            // TBD
        }
    };

    Backbone.sfdc.Model = Backbone.Model.extend({
        // NB: subclass must have class properties sobjectType and fieldsOfInterest
        sync: Backbone.sfdc.sync,

        parse: function(response, options) {
            var modelClass = this.__proto__.constructor;
            var result = {};
            for (var i = 0; i < modelClass.fieldsOfInterest.length; i++) {
                var key = modelClass.fieldsOfInterest[i];
                var value = response[key] || '';
                result[key] = value;
            }
            result.Id = response.Id;
            return result;
        }
    });

    Backbone.sfdc.Collection = Backbone.Collection.extend({
        query: function(whereClause) {
            var that = this;
            forcetkClient.query("SELECT " + this.model.fieldsOfInterest.join(",")  
                                + " FROM "  + this.model.sobjectType
                                + " WHERE " + whereClause,
                                function(results) {
                                    that.reset(results.records, {'parse':true});
                                },
                                function(error) {
                                    console.log(error);
                                });
        }
    });


})(Backbone, _, $);
