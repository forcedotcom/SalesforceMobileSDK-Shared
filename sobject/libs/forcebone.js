"use strict";

(function(Backbone, _, $) {
    // Private forcetk client
    var forcetkClient;

    // Create namespace
    Backbone.Force = {};

    // Init function
    Backbone.Force.init = function(creds, apiVersion) {
        forcetkClient = new forcetk.Client(creds.clientId, creds.loginUrl);
        forcetkClient.setSessionToken(creds.accessToken, apiVersion, creds.instanceUrl);
        forcetkClient.setRefreshToken(creds.refreshToken);
        forcetkClient.setUserAgentString(creds.userAgent);
    };

    Backbone.Force.Model = Backbone.Model.extend({
        // Fields that need to be defined on every instance
        Id:null,
        sobjectType:null,
        fieldsOfInterest:null,
        
        sync: function(method, model, options) {
            if (method == "read")
            {
                forcetkClient.retrieve(this.sobjectType, this.Id, this.fieldsOfInterest, 
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
        },

        parse: function(response, options) {
            var result = {};
            for (var i = 0; i < this.fieldsOfInterest.length; i++) {
                var key = this.fieldsOfInterest[i];
                var value = response[key] || '';
                result[key] = value;
            }
            result.Id = response.Id;
            return result;
        }
    });

    Backbone.Force.Collection = Backbone.Collection.extend({
        soql:null,
        sosl:null,

        sync: function(method, model, options) {
            var that = this;
            if (method == "read")
            {
                if (this.soql != null) {
                    forcetkClient.query(_.isFunction(this.soql) ? this.soql() : this.soql,
                                        function(results) {
                                            that.reset(results.records, {'parse':true});
                                        },
                                        function(error) {
                                            options.error(error);
                                        });
                }
            }
            else
            {
                // TBD
            }
        }
    });


})(Backbone, _, $);
