/*
 * Copyright (c) 2012-present, salesforce.com, inc.
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

// Version this js was shipped with
var SALESFORCE_MOBILE_SDK_VERSION = "5.3.0";

var smartstore = require("com.salesforce.plugin.smartstore");
var promiser = require("com.salesforce.util.promiser").promiser;

// Promise-based APIs
var client = new Object();
client.alterSoup = promiser(smartstore, "alterSoup", "smartstore.client");
client.alterSoupWithSpec = promiser(smartstore, "alterSoupWithSpec", "smartstore.client");
client.clearSoup = promiser(smartstore, "clearSoup", "smartstore.client");
client.closeCursor = promiser(smartstore, "closeCursor", "smartstore.client");
client.getDatabaseSize = promiser(smartstore, "getDatabaseSize", "smartstore.client");
client.getSoupIndexSpecs = promiser(smartstore, "getSoupIndexSpecs", "smartstore.client");
client.getSoupSpec = promiser(smartstore, "getSoupSpec", "smartstore.client");
client.moveCursorToNextPage = promiser(smartstore, "moveCursorToNextPage", "smartstore.client");
client.moveCursorToPageIndex = promiser(smartstore, "moveCursorToPageIndex", "smartstore.client");
client.moveCursorToPreviousPage = promiser(smartstore, "moveCursorToPreviousPage", "smartstore.client");
client.querySoup = promiser(smartstore, "querySoup", "smartstore.client");
client.reIndexSoup = promiser(smartstore, "reIndexSoup", "smartstore.client");
client.registerSoup = promiser(smartstore, "registerSoup", "smartstore.client");
client.registerSoupWithSpec = promiser(smartstore, "registerSoupWithSpec", "smartstore.client");
client.removeFromSoup = promiser(smartstore, "removeFromSoup", "smartstore.client");
client.removeSoup = promiser(smartstore, "removeSoup", "smartstore.client");
client.retrieveSoupEntries = promiser(smartstore, "retrieveSoupEntries", "smartstore.client");
client.runSmartQuery = promiser(smartstore, "runSmartQuery", "smartstore.client");
client.soupExists = promiser(smartstore, "soupExists", "smartstore.client");
client.upsertSoupEntries = promiser(smartstore, "upsertSoupEntries", "smartstore.client");
client.upsertSoupEntriesWithExternalId = promiser(smartstore, "upsertSoupEntriesWithExternalId", "smartstore.client");
client.getAllStores = promiser(smartstore, "getAllStores", "smartstore.client");
client.getAllGlobalStores = promiser(smartstore, "getAllGlobalStores", "smartstore.client");
client.removeAllGlobalStores = promiser(smartstore, "removeAllGlobalStores", "smartstore.client");
client.removeAllStores = promiser(smartstore, "removeAllStores", "smartstore.client");
client.removeStore = promiser(smartstore, "removeStore", "smartstore.client");

/**
 * Part of the module that is public
 */
module.exports = client;