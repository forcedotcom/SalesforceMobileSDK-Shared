//////////////////////////////////////////////////////////////////////////////////////
//
// Copyright 2012 Piotr Walczyszyn (http://outof.me | @pwalczyszyn)
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
//////////////////////////////////////////////////////////////////////////////////////
(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['underscore', 'Backbone'], factory);
    } else {
        // Browser globals
        factory(root._, root.Backbone);
    }
}(this, function(_, Backbone) {

    var methodMap = {
        'create': 'POST',
        'update': 'PATCH',
        'delete': 'DELETE',
        'read': 'GET'
    };

    var Force = Backbone.Force = {

        initialize: function(forctkClient) {
            this.client = forctkClient;
        },

        sync: function(method, model, options) {
            // Setting options if were not set
            options || (options = {});

            var that = this,
                client = Force.client,
                error = options.error;

            // Extending options with Salesforce specific settings
            _.extend(options, {
                cache: false,
                dataType: 'json',
                processData: false,
                type: methodMap[method],
                async: client.asyncAjax,
                contentType: 'application/json',
                beforeSend: function(xhr) {
                    if (client.proxyUrl !== null) {
                        xhr.setRequestHeader('SalesforceProxy-Endpoint', options.url);
                    }
                    xhr.setRequestHeader(client.authzHeader, "OAuth " + client.sessionId);
                    xhr.setRequestHeader('X-User-Agent', 'salesforce-toolkit-rest-javascript/' + client.apiVersion);
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    if (client.refreshToken && jqXHR.status === 401) {
                        client.refreshAccessToken(function(oauthResponse) {
                            client.setSessionToken(oauthResponse.access_token, null, oauthResponse.instance_url);
                            that.sync.call(that, method, model, options);
                        });
                    } else if (error) {
                        error(jqXHR, textStatus, errorThrown);
                    }
                }
            });

            // In case of update it has to follow custom logic because Salesforce uses PATCH method and accepts only
            // changed attributes
            if (method === 'update') {

                // Getting updates
                var changes = _.clone(model.changesToUpdate) || [],
                    updates = _.pick(model.toJSON(), changes);

                // Making sure that Id attribute is not part of an update
                delete updates.Id;

                // Handling error
                var error = options.error;
                options.error = function() {

                    // In case of error reverting back changes to update
                    model.changesToUpdate = _.union(model.changesToUpdate, changes);

                    // Calling original error function
                    if (error) error.apply(this, Array.prototype.slice.call(arguments));

                };

                // Clearing current changes
                model.changesToUpdate.length = 0;

                // Setting options data property with updates
                options.data = JSON.stringify(updates);
            }

            // Calling original sync function
            Backbone.sync(method, model, options)
        },

        _getServiceURL: function() {
            return this.client.instanceUrl + '/services/data/' + this.client.apiVersion;
        }
    };

    var Model = Force.Model = Backbone.Model.extend({

        // Salesforce Id attribute
        idAttribute: 'Id',

        // Type of Salesforce object e.g. Opportunity, Account...
        type: null,

        // Fields to be loaded from Salesforce in fetch function
        fields: null,

        // Array of fields to be updated with next save funciton call
        changesToUpdate: null,

        // Setting Salesforce specific sync implementation
        sync: Force.sync,

        fetch: function(options) {
            // Setting options if it wasn't passed to the function
            options || (options = {});

            // Setting flag that indicates that this is fetch change
            options.addToUpdates = false;

            // Getting fields to fetch
            var fields = this.fields ? '?fields=' + this.fields.join(',') : '';

            // Setting options url property
            _.extend(options, {
                url: (Force._getServiceURL() + '/sobjects/' + this.type + '/' + this.id + fields)
            });

            // Calling Backbone's fetch function
            return Backbone.Model.prototype.fetch.call(this, options);
        },

        save: function(key, value, options) {
            // Getting options property
            if (_.isObject(key) || key == null) options = value;

            // Setting options if it wasn't passed to the function
            options || (options = {});

            // Setting url option
            _.extend(options, {
                url: (Force._getServiceURL() + '/sobjects/' + this.type + '/' + (!this.isNew() ? this.id : ''))
            });

            // Calling Backbone's save function
            return Backbone.Model.prototype.save.call(this, key, value, options);
        },

        set: function(key, value, options) {
            var attrs;

            // Handle both `"key", value` and `{key: value}` -style arguments.
            if (_.isObject(key) || key == null) {
                attrs = key;
                options = value;
            } else {
                attrs = {};
                attrs[key] = value;
            }

            // If attrs are set and this is not a fetch update
            if (attrs && !this.isNew() && (!options || options.addToUpdates !== false)) {
                // Setting changesToUpdate if were not set previously
                this.changesToUpdate || (this.changesToUpdate = []);
                // Adding current updates to this.changesToUpdate
                this.changesToUpdate = _.union(this.changesToUpdate, Object.keys(attrs));
            }

            // Calling Backbone's set function
            return Backbone.Model.prototype.set.call(this, key, value, options);
        },

        parse: function(resp, xhr) {
            var result = resp;

            if (resp != null) {
                // Cloning resp
                result = _.clone(resp);

                // Renaming id to Id
                if (result.hasOwnProperty('id')) {
                    result.Id = result.id;
                    delete result.id;
                }

                if (result.hasOwnProperty('attributes')) {
                    // Checking if type is set, if not using the one from resp
                    if (this.type == null) this.type = result.attributes.type;
                    // deleting attributes property
                    delete result.attributes;
                }

                // Removing property
                delete result.success;

                // Removing errors array property
                if (result.errors && result.errors.length > 0) delete result.errors;

            }

            return result;
        }

    });

    var Collection = Force.Collection = Backbone.Collection.extend({

        // Query string, either full query with SELECT part or only WHERE part
        query: null,

        // Model type that should extend Force.Model
        model: Model,

        // Setting Salesforce specific sync implementation
        sync: Force.sync,

        fetch: function(options) {

            // Throwing an error if query is null
            if (this.query == null) throw new Error('Force.Collection.query property is required!');

            var query = this.query;

            // Checking if this is just a WHERE query
            if (this.query.toLowerCase()
                .indexOf('where') == 0) {
                var model = new this.model();

                if (model.fields == null) throw new Error('With WHERE queries Model.fields property needs to be set!');
                if (model.type == null) throw new Error('With WHERE queries Model.type property needs to be set!');

                query = 'SELECT ' + model.fields.join(',') + ' FROM ' + model.type + ' ' + this.query;
            }

            // Setting options if it wasn't passed to the function
            options = options ? _.clone(options) : {};

            // Setting options url property
            options.url = Force._getServiceURL() + '/query/?q=' + encodeURIComponent(query);

            if (options.parse === undefined) options.parse = true;
            var collection = this,
                success = options.success,
                records = [];
            options.success = function(resp, status, xhr) {

                // Adding result to the records array
                records.push.apply(records, resp.records);

                // Checking if the result is not paged
                if (resp.nextRecordsUrl !== undefined) {

                    var _options = _.clone(options);

                    // Setting url to next records batch
                    _options.url = Force._getServiceURL() + resp.nextRecordsUrl;

                    // Making another request for next records batch
                    collection.sync.call(collection, 'read', collection, _options);

                } else {
                    collection[options.add ? 'add' : 'reset'](collection.parse(records, xhr), options);
                    if (success) success(collection, resp);
                }

            };
            options.error = Backbone.wrapError(options.error, collection, options);
            return this.sync.call(this, 'read', this, options);
        }
    });

    return Force;
}));