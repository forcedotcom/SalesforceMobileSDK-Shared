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

    // Prototype
    module.prototype = {
        constructor: module,

        sendUpdate: function(type, syncId, status) {
          var event = new CustomEvent(type, {syncId: syncId, status:status});
          document.dispatchEvent(event);
        },

        syncDown: function(target, soupName, options, successCB, errorCB) {
          var self = this;
          var syncId = lastSyncId++;
          var cache = new Force.StoreCache(soupName);
          var collection = new Force.SObjectCollection();
          collection.cache = cache;
          collection.config = target;

          cache.init().then(function() {
            successCB({syncId: syncId, status:"started"});

            collection.fetch({
              sucess: function() {
                self.sendUpdate("syncUp", syncId, "done");
              },
              error: function() {
                self.sendUpdate("syncUp", syncId, "failed");
              }
            });
          });
        },

        syncUp: function(target, soupName, options, successCB, errorCB) {
        },

        hookToCordova: function(cordova) {
            var SDKINFO_SERVICE = "com.salesforce.smartsync";
            var self = this;

            cordova.interceptExec(SDKINFO_SERVICE, "syncUp", function (successCB, errorCB, args) {
              self.syncUp(args[0].target, args[0].soupName, args[0].options, successCB, errorCB);
            });

            cordova.interceptExec(SDKINFO_SERVICE, "syncDown", function (successCB, errorCB, args) {
               self.syncDown(args[0].target, args[0].soupName, args[0].options, successCB, errorCB); 
            });
        }

    };

    // Return module
    return module;
})(window);

var mockSmartSyncPlugin = new MockSmartSyncPlugin();
mockSmartSyncPlugin.hookToCordova(cordova);

