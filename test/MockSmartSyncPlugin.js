/*
 * Copyright (c) 2014, salesforce.com, inc.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification, are permitted provided
 * that the following conditions are met:
 *
 * Redistributions of source code must retain the above copyright notice, this list of conditions and the
 * following disclaimer.
 *
 * Redistributions in binary form must reproduce the above copyright notice, this list of conditions and
 * the following disclaimer in the documentation and/or other materials provided with the distribution.
 *
 * Neither the name of salesforce.com, inc. nor the names of its contributors may be used to endorse or
 * promote products derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED
 * WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A
 * PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED
 * TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
 * HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 * NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */

/**
 * MockSmartSyncPlugin
 * Meant for development and testing only, the data is stored in SessionStorage, queries do full scans.
 */

var MockSmartSyncPlugin = (function(window) {

    // Constructor
    var module = function() {}; 

    var lastSyncId = 0;
    var syncs = {};

    // Prototype
    module.prototype = {
        constructor: module,

        recordSync: function(type, target, soupName, options) {
            var syncId = lastSyncId++;
            var sync = {syncId: syncId, type:type, target:target, soupName:soupName, options: options, status: "started"};
            syncs[syncId] = sync;
            return syncId;
        },

        sendUpdate: function(syncId, status, extras) {
            var sync = syncs[syncId];
            sync.status = status;
            var event = new CustomEvent(sync.type, {detail: _.extend(sync, extras)});
            document.dispatchEvent(event);
        },

        getSyncStatus: function(syncId, successCB, errorCB) {
            successCB(syncs[syncId]);
        },

        syncDown: function(target, soupName, options, successCB, errorCB) {
            if (target.type === "cache") {
                errorCB("Wrong target type: " + target.type);
                return;
            }

            var self = this;
            var syncId = self.recordSync("syncDown", target, soupName, options);
            var cache = new Force.StoreCache(soupName);
            var collection = new Force.SObjectCollection();
            collection.cache = cache;
            collection.config = target;

            var onFetch = function() {
               if (collection.hasMore()) {
                   collection.getMore().then(onFetch);
               }
                else {
                    self.sendUpdate(syncId, "done");                    
                }
            };


            cache.init().then(function() {
                successCB(syncs[syncId]);

                collection.fetch({
                    success: onFetch,
                    error: function() {
                        self.sendUpdate(syncId, "failed");
                    }
                });
            });
        },

        syncUp: function(target, soupName, options, successCB, errorCB) {
            if (target.type !== "cache") {
                errorCB("Wrong target type: " + target.type);
                return;
            }

            var self = this;
            var syncId = self.recordSync("syncUp", target, soupName, options);
            var cache = new Force.StoreCache(soupName);
            var collection = new Force.SObjectCollection();
            collection.cache = cache;
            collection.config = target;

            var sync = function() {
                if (collection.length == 0) {
                    self.sendUpdate(syncId, "done");
                    return;
                }
                
                var record = collection.shift();
                var saveOptions = {
                    fieldlist: options.fieldlist,
                    cache: cache,
                    cacheMode: Force.CACHE_MODE.SERVER_FIRST,
                    mergeMode: Force.MERGE_MODE.OVERWRITE,
                    success: function() {
                        sync();
                    },
                    error: function() {
                        self.sendUpdate(syncId, "failed", {recordId: record.id}); // or should we update the cached record with __sync_failed__ = true                  
                        sync();
                    }
                };

                return record.get("__locally_deleted__") ? record.destroy(saveOptions) : record.save(null, saveOptions);
            };

            cache.init().then(function() {
                successCB(syncs[syncId]);

                collection.fetch({
                    success: function() {
                        sync();
                    },
                    error: function() {
                        self.sendUpdate(syncId, "failed");
                    }
                });
            });        
        },

        hookToCordova: function(cordova) {
            var SMARTSYNC_SERVICE = "com.salesforce.smartsync";
            var self = this;

            cordova.interceptExec(SMARTSYNC_SERVICE, "syncUp", function (successCB, errorCB, args) {
                self.syncUp(args[0].target, args[0].soupName, args[0].options, successCB, errorCB);
            });

            cordova.interceptExec(SMARTSYNC_SERVICE, "syncDown", function (successCB, errorCB, args) {
                self.syncDown(args[0].target, args[0].soupName, args[0].options, successCB, errorCB); 
            });

            cordova.interceptExec(SMARTSYNC_SERVICE, "getSyncStatus", function (successCB, errorCB, args) {
                self.getSyncStatus(args[0].syncId, successCB, errorCB); 
            });
        }

    };

    // Return module
    return module;
})(window);

var mockSmartSyncPlugin = new MockSmartSyncPlugin();
mockSmartSyncPlugin.hookToCordova(cordova);

