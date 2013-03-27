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

    Backbone.Force.RestError = function(xhr) {
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


    Backbone.Force.Model = Backbone.Model.extend({
        // Fields that need to be defined on every instance
        sobjectType:null,
        idAttribute: 'Id',

        sync: function(method, model, options) {
            var that = this;

            if (method == "read")
            {
                forcetkClient.retrieve(this.sobjectType, this.id, options.fieldlist, 
                                       options.success,
                                       options.error);
            }
            else if (method == "create")
            {
                forcetkClient.create(this.sobjectType, _.omit(this.attributes, 'Id'),
                                     function(result) {
                                         that.set('Id', result.id);
                                         options.success(that);
                                     }, 
                                     options.error);
            }
            else if (method == "update")
            {
                forcetkClient.update(this.sobjectType, this.id, this.changed, 
                                     options.success,
                                     options.error);
                                     
            }
            else if (method == "delete")
            {
                forcetkClient.del(this.sobjectType, this.id,
                                  options.success,
                                  options.error);
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
                options.reset = true;
                if (this.soql != null) {
                    forcetkClient.query(this.soql,
                                        function(results) {
                                            options.success(results.records);
                                        },
                                        options.error);
                }
                else 
                {
                    options.success([]);
                }
            }
            else
            {
                // TBD
            }
        }
    });


})(Backbone, _, $);
