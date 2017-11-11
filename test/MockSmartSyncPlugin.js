/*
 * Copyright (c) 2014-present, salesforce.com, inc.
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
 * NB: cleanResyncGhosts only works for soql sync down
 */

var MockSmartSyncPlugin = (function(window) {
    // Constructor
    var module = function(storeConfig) {
        this.storeConfig = storeConfig;
        this.lastSyncId = 0;
        this.syncs = {};
    };

    // Prototype
    module.prototype = {
        constructor: module,

        recordSync: function(type, target, soupName, options, syncName) {
            var syncId = this.lastSyncId++;
            var sync = {_soupEntryId: syncId, type:type, target:target, soupName:soupName, options: options, status: "RUNNING", progress: 0, name: syncName};
            this.syncs[syncId] = sync;
            return syncId;
        },

        sendUpdate: function(syncId, status, progress, extras) {
            extras = _.extend(this.storeConfig);
            var sync = this.syncs[syncId];
            sync.status = status;
            sync.progress = progress;
            var event = new CustomEvent("sync", {detail: _.extend(sync, extras)});
            document.dispatchEvent(event);
            console.log("Sync type:" + sync.type + " id:" + syncId + " status:" + status + " progress:" + progress);
        },

        getSyncStatus: function(syncIdOrName, successCB, errorCB) {
            var syncId = typeof syncIdOrName === "string" ? this.getSyncIdFromName(syncIdOrName) : syncIdOrName;
            // cordova can't send back a null, so it sends a {} instead
            var sync = syncId != null ? this.syncs[syncId] : null;
            successCB(sync == null ? {} : sync);
        },

        getSyncIdFromName: function(syncName) {
            for (var syncId in this.syncs) {
                if (this.syncs[syncId].name === syncName) {
                    return syncId;
                }
            }
            return null;
        },

        deleteSync: function(syncIdOrName, successCB, errorCB) {
            var syncId = typeof syncIdOrName === "string" ? this.getSyncIdFromName(syncIdOrName) : syncIdOrName;
            if (syncId != null) {
                delete this.syncs[syncId];
            }
            successCB();;
        },

        syncDown: function(target, soupName, options, syncName, successCB, errorCB) {
            if (target.type === "cache") {
                errorCB("Wrong target type: " + target.type);
                return;
            }
            var syncId = this.recordSync("syncDown", target, soupName, options, syncName);
            this.actualSyncDown(syncId, successCB, errorCB);
        },

        actualSyncDown: function(syncId, successCB, errorCB) {
            var self = this;
            var sync = this.syncs[syncId];
            var target = sync.target;
            var soupName = sync.soupName;
            var options = sync.options;
            var cache = new Force.StoreCache(soupName, null, null, this.storeConfig.isGlobalStore,this.storeConfig.storeName);
            var collection = new Force.SObjectCollection();
            var progress = 0;
            collection.cache = cache;

            if (target.type == "soql") {
                // Missing Id or LastModifiedDate
                var query = self.addSelectFieldIfMissing(self.addSelectFieldIfMissing(target.query, "Id"), "LastModifiedDate");
                // Resync?
                var maxTimeStamp = sync.maxTimeStamp;
                if (_.isNumber(maxTimeStamp) && maxTimeStamp > 0) query = self.addFilterForReSync(query, maxTimeStamp);
                collection.config = {type:"soql", query: query};
            }
            else {
                collection.config = target;
            }

            var onFetch = function() {
                progress += (100 - progress) / 2; // bogus but we don't have the totalSize
                if (collection.hasMore()) {
                    collection.getMore().then(onFetch);
                    self.sendUpdate(syncId, "RUNNING", progress);
                }
                else {
                    if (target.type == "soql") {
                        sync.maxTimeStamp = _.max(_.map(_.pluck(_.pluck(collection.models, "attributes"), "LastModifiedDate"), function(d) { return (new Date(d)).getTime(); }));
                    }
                    sync.totalSize = collection.models.length;
                    self.sendUpdate(syncId, "DONE", 100);
                }
            };


            self.sendUpdate(syncId, "RUNNING", 0);

            var fetchOptions = {
                success: onFetch,
                error: function() {
                    self.sendUpdate(syncId, "FAILED", 0);
                },
                mergeMode: options.mergeMode
            };

            cache.init().then(function() {
                successCB(sync);

                if (target.type == "refresh") {
                    // smartsync.js doesn't have something equivalent to the (new in 5.0) refresh sync down
                    // So we need to get the local ids, build a soql query out of them
                    // And use that for the collection
                    cache.find({queryType:"range", orderPath:cache.keyField, pageSize:500}) // XXX not handling case with more than 500 local ids
                        .then(function(result) {
                            var localIds = _.pluck(result.records, cache.keyField);
                            var soql = "SELECT " + target.fieldlist.join(",") + " FROM " + target.sobjectType + " WHERE Id IN ('" + localIds.join("','") + "')";
                            collection.config = {type:"soql", query: soql};
                            collection.fetch(fetchOptions);
                        });
                }
                else {
                    collection.fetch(fetchOptions);
                }
            });
        },

        reSync: function(syncIdOrName, successCB, errorCB) {
            var syncId = typeof syncIdOrName === "string" ? this.getSyncIdFromName(syncIdOrName) : syncIdOrName;
            var sync = this.syncs[syncId];
            if (sync.type == "syncDown") {
                this.actualSyncDown(syncId, successCB, errorCB);
            }
            else {
                this.actualSyncUp(syncId, successCB, errorCB);
            }
        },

        cleanResyncGhosts: function(syncId, successCB, errorCB) {
            var self = this;
            var sync = this.syncs[syncId];
            var target = sync.target;
            var soupName = sync.soupName;
            var cache = new Force.StoreCache(soupName, null, null, self.storeConfig.isGlobalStore,self.storeConfig.storeName);
            cache.find({queryType:"range", orderPath:cache.keyField, pageSize:500}) // XXX not handling case with more than 500 local ids
                .then(function(result) {
                    var localIds = _.pluck(result.records, cache.keyField);
                    var collection = new Force.SObjectCollection();
                    var soqlTemplate = "SELECT " + cache.keyField + " $1 WHERE " + cache.keyField + " IN ('" + localIds.join("','") + "')";
                    // We need the object type -- that will only works with soql sync down target
                    var soql = target.query.replace(/.*( [fF][rR][oO][mM][ ]+[^ ]*[ ]).*/, soqlTemplate);
                    collection.config = {type:"soql", query:soql};
                    collection.fetch({
                        success: function() {
                            var remoteIds = _.pluck(_.pluck(collection.models, "attributes"), cache.keyField);
                            var idsToRemove = _.difference(localIds, remoteIds);
                            _.each(idsToRemove, function(id) { cache.remove(id); });
                            successCB();
                        },
                        error: errorCB
                    });
                });
        },

        addSelectFieldIfMissing: function(soql, field) {
            if (soql.indexOf(field) == -1) {
                return soql.replace(/[sS][eE][lL][eE][cC][tT][ ]/, "select " + field + ", ")
            }
            return soql;
        },
        
        addFilterForReSync: function(query, maxTimeStamp) {
            var extraPredicate = "LastModifiedDate > " + (new Date(maxTimeStamp)).toISOString();
            var modifiedQuery = query.toLowerCase().indexOf(" where ") > 0
                ? query.replace(/( [wW][hH][eE][rR][eE] )/, "$1" + extraPredicate + " and ")
                : query.replace(/( [fF][rR][oO][mM][ ]+[^ ]*)/, "$1 where " + extraPredicate);
            return modifiedQuery;
        },

        syncUp: function(target, soupName, options, syncName, successCB, errorCB) {
            var syncId = this.recordSync("syncUp", target, soupName, options, syncName);
            this.actualSyncUp(syncId, successCB, errorCB);
        },

        actualSyncUp: function(syncId, successCB, errorCB) {
            var self = this;
            var sync = self.syncs[syncId];
            var target = sync.target;
            var soupName = sync.soupName;
            var options = sync.options;
            var cache = new Force.StoreCache(soupName,  null, null, self.storeConfig.isGlobalStore,self.storeConfig.storeName);
            var collection = new Force.SObjectCollection();
            var numberRecords;
            collection.cache = cache;
            collection.config = {type:"cache", cacheQuery:{queryType:"exact", indexPath:"__local__", matchKey:true, order:"ascending", pageSize:10000}};

            var sync = function() {
                var progress = Math.floor((numberRecords - collection.length)*100/numberRecords);
                self.sendUpdate(syncId, (progress < 100 ? "RUNNING" : "DONE"), progress);

                if (collection.length == 0) {
                    return;
                }

                var record = collection.shift();
                var saveOptions = {
                    fieldlist: options.fieldlist,
                    cache: cache,
                    cacheMode: Force.CACHE_MODE.SERVER_FIRST,
                    mergeMode: Force.MERGE_MODE.OVERWRITE,
                    success: function() {
                        sync(); // Next record
                    },
                    error: function() {
                        self.sendUpdate(syncId, "FAILED", 0, {recordId: record.id});
                        sync(); // Next record
                    }
                };

                if (options.mergeMode == "LEAVE_IF_CHANGED" && record.get("LastModifiedDate")) {
                    // Getting LastModifiedDate from record on server
                    var serverRecord = new Force.SObject();
                    serverRecord.sobjectType = record.sobjectType;
                    serverRecord.id = record.id;
                    serverRecord.fetch({
                        success: function() {
                            if (serverRecord.get("LastModifiedDate") > record.get("LastModifiedDate")) {
                                // Record has changed, leave it alone
                                console.log("Record " + record.id + " has changed on server - leaving unchanged");
                                sync(); // Next record
                            }

                            else {
                                // Record hasn't change, save over
                                record.get("__locally_deleted__") ? record.destroy(saveOptions) : record.save(null, saveOptions);
                            }
                        },
                        error: function() {
                            self.sendUpdate(syncId, "FAILED", 0, {recordId: record.id});
                            sync(); // Next record
                        }
                    });
                }
                else {
                    record.get("__locally_deleted__") ? record.destroy(saveOptions) : record.save(null, saveOptions);
                }
            };

            cache.init().then(function() {
                successCB(self.syncs[syncId]);

                collection.fetch({
                    success: function() {
                        numberRecords = collection.length;
                        sync();
                    },
                    error: function() {
                        self.sendUpdate(syncId, "FAILED", 0);
                    }
                });
            });
        }
    };

    // Return module
    return module;
})(window);


// Store functions
var SyncManagerMap = (function() {
  // Constructor
  var module = function() {
      this.globalSyncManagers= {};
      this.userSyncManagers = {};
  };

  // Prototype
  module.prototype = {
      constructor: module,

      getSyncManager: function (args) {

         var isGlobalStore = args[0].isGlobalStore;
         var storeName = (args[0].storeName==='undefined' || args[0].storeName == null)?"defaultStore":args[0].storeName;
         var syncManager;

         if(isGlobalStore == null)
               isGlobalStore = false;

         syncManager = isGlobalStore?this.globalSyncManagers[storeName]:this.userSyncManagers[storeName];

         if(syncManager == null) {
            syncManager = new MockSmartSyncPlugin({'isGlobalStore': isGlobalStore,'storeName' :storeName});
            if(isGlobalStore == true)
               this.globalSyncManagers[storeName] = syncManager;
            else
               this.userSyncManagers[storeName] = syncManager;
         }
         return syncManager;
      },

      reset: function (){
        this.globalSyncManagers = {};
        this.userSyncManagers = {};
      },

      setupUserSyncsFromDefaultConfig: function(callback) {
          this.setupSyncsFromConfig(this.getSyncManager([false]), 'usersyncs.json', callback);
      },

      setupGlobalSyncsFromDefaultConfig: function(callback) {
          this.setupSyncsFromConfig(this.getSyncManager([true]), 'globalsyncs.json', callback);
      },

      setupSyncsFromConfig: function(syncMgr, configFilePath, callback) {
          fetch(configFilePath)
              .then(resp => resp.json())
              .then(config => {
                  if (!config.error) {
                      console.log("Setting up syncs using config: " + configFilePath);
                      var syncConfigs = config.syncs;
                      for (i=0; i<syncConfigs.length;i++) {
                          var syncConfig = syncConfigs[i];
                          if (syncMgr.getSyncIdFromName(syncConfig.syncName)) {
                              continue;
                          }
                          syncMgr.recordSync(syncConfig.syncType, syncConfig.target, syncConfig.soupName, syncConfig.options, syncConfig.syncName);
                      }
                  }
              })
              .then(() => callback());
      }
    };
    return module;
  })();

var syncManagerMap = new SyncManagerMap();

(function (cordova, syncManager, globalSyncManager) {

    var SMARTSYNC_SERVICE = "com.salesforce.smartsync";

    cordova.interceptExec(SMARTSYNC_SERVICE, "syncUp", function (successCB, errorCB, args) {
        var mgr = syncManagerMap.getSyncManager(args);
        mgr.syncUp(args[0].target, args[0].soupName, args[0].options, args[0].syncName, successCB, errorCB);
    });

    cordova.interceptExec(SMARTSYNC_SERVICE, "syncDown", function (successCB, errorCB, args) {
        var mgr = syncManagerMap.getSyncManager(args);
        mgr.syncDown(args[0].target, args[0].soupName, args[0].options, args[0].syncName, successCB, errorCB);
    });

    cordova.interceptExec(SMARTSYNC_SERVICE, "getSyncStatus", function (successCB, errorCB, args) {
        var mgr = syncManagerMap.getSyncManager(args);
        mgr.getSyncStatus(args[0].syncId || args[0].syncName, successCB, errorCB);
    });

    cordova.interceptExec(SMARTSYNC_SERVICE, "reSync", function (successCB, errorCB, args) {
        var mgr = syncManagerMap.getSyncManager(args);
        mgr.reSync(args[0].syncId || args[0].syncName, successCB, errorCB);
    });

    cordova.interceptExec(SMARTSYNC_SERVICE, "cleanResyncGhosts", function (successCB, errorCB, args) {
        var mgr = syncManagerMap.getSyncManager(args);
        mgr.cleanResyncGhosts(args[0].syncId, successCB, errorCB);
    });

    cordova.interceptExec(SMARTSYNC_SERVICE, "deleteSync", function (successCB, errorCB, args) {
        var mgr = syncManagerMap.getSyncManager(args);
        mgr.deleteSync(args[0].syncId || args[0].syncName, successCB, errorCB);
    });

})(cordova, syncManagerMap);
