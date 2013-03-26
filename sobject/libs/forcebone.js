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
        sobjectType:null,
        fieldsOfInterest:null,
        idAttribute: 'Id',

        sync: function(method, model, options) {
            var that = this;
            if (method == "read")
            {
                forcetkClient.retrieve(this.sobjectType, this.id, this.fieldsOfInterest, 
                                       function(result) {
                                           options.success(result);
                                       },
                                       function(error) {
                                           options.error(error);
                                       });
            }
            else if (method == "create")
            {
                forcetkClient.create(this.sobjectType, _.omit(this.attributes, 'Id'),
                                       function(result) {
                                           that.set('Id', result.id);
                                           options.success(that);
                                       },
                                       function(error) {
                                           options.error(error);
                                       });
            }
            else if (method == "update")
            {
                forcetkClient.update(this.sobjectType, this.id, this.changed,
                                       function(result) {
                                           options.success(that);
                                       },
                                       function(error) {
                                           options.error(error);
                                       });
            }
            else
            {
                // TBD
            }
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
                                            that.reset(results.records);
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
