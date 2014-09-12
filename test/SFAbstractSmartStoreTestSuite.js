/*
 * Copyright (c) 2012, salesforce.com, inc.
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
 * An abstract super class for SmartStore test suites
 * This file assumes that qunit.js has been previously loaded, as well as jquery.js and SFTestSuite.js
 */
if (typeof AbstractSmartStoreTestSuite === 'undefined') { 

/**
 * Constructor
 */
var AbstractSmartStoreTestSuite = function (module, defaultSoupName, defaultSoupIndexes) {
    SFTestSuite.call(this, module);
    this.defaultSoupName = defaultSoupName;
    this.defaultSoupIndexes = defaultSoupIndexes;
};

// We are sub-classing SFTestSuite
AbstractSmartStoreTestSuite.prototype = new SFTestSuite();
AbstractSmartStoreTestSuite.prototype.constructor = AbstractSmartStoreTestSuite;

/*
 * For each test, we first remove and re-add the default soup
 */
AbstractSmartStoreTestSuite.prototype.runTest= function (methName) {
    console.log("In runTest: methName=" + methName);
    var self = this;
    self.removeAndRecreateSoup(this.defaultSoupName, this.defaultSoupIndexes)
        .done(
            function() {
                self[methName]();
            });
};

/**
 * Helper methods to do smartstore operations using promises
 */
AbstractSmartStoreTestSuite.prototype.alterSoup = promiser(navigator.smartstore, "alterSoup");
AbstractSmartStoreTestSuite.prototype.clearSoup = promiser(navigator.smartstore, "clearSoup");
AbstractSmartStoreTestSuite.prototype.closeCursor = promiser(navigator.smartstore, "closeCursor");
AbstractSmartStoreTestSuite.prototype.getDatabaseSize = promiser(navigator.smartstore, "getDatabaseSize");
AbstractSmartStoreTestSuite.prototype.getSoupIndexSpecs = promiser(navigator.smartstore, "getSoupIndexSpecs");
AbstractSmartStoreTestSuite.prototype.moveCursorToNextPage = promiser(navigator.smartstore, "moveCursorToNextPage");
AbstractSmartStoreTestSuite.prototype.moveCursorToPreviousPage = promiser(navigator.smartstore, "moveCursorToPreviousPage");
AbstractSmartStoreTestSuite.prototype.querySoup = promiser(navigator.smartstore, "querySoup");
AbstractSmartStoreTestSuite.prototype.reIndexSoup = promiser(navigator.smartstore, "reIndexSoup");
AbstractSmartStoreTestSuite.prototype.registerSoup = promiser(navigator.smartstore, "registerSoup");
AbstractSmartStoreTestSuite.prototype.removeFromSoup = promiser(navigator.smartstore, "removeFromSoup");
AbstractSmartStoreTestSuite.prototype.removeSoup = promiser(navigator.smartstore, "removeSoup");
AbstractSmartStoreTestSuite.prototype.retrieveSoupEntries = promiser(navigator.smartstore, "retrieveSoupEntries");
AbstractSmartStoreTestSuite.prototype.runSmartQuery = promiser(navigator.smartstore, "runSmartQuery");
AbstractSmartStoreTestSuite.prototype.soupExists = promiser(navigator.smartstore, "soupExists");
AbstractSmartStoreTestSuite.prototype.upsertEntriesToSoupWithExternalIdPath = promiser(navigator.smartstore, "upsertSoupEntriesWithExternalId");
AbstractSmartStoreTestSuite.prototype.upsertSoupEntries = promiser(navigator.smartstore, "upsertSoupEntries");

AbstractSmartStoreTestSuite.prototype.alterSoupNoAssertion = promiser(navigator.smartstore, "alterSoup", true);
AbstractSmartStoreTestSuite.prototype.clearSoupNoAssertion = promiser(navigator.smartstore, "clearSoup", true);
AbstractSmartStoreTestSuite.prototype.getSoupIndexSpecsNoAssertion = promiser(navigator.smartstore, "getSoupIndexSpecs", true);
AbstractSmartStoreTestSuite.prototype.moveCursorToNextPageNoAssertion = promiser(navigator.smartstore, "moveCursorToNextPage", true);
AbstractSmartStoreTestSuite.prototype.moveCursorToPreviousPageNoAssertion = promiser(navigator.smartstore, "moveCursorToPreviousPage", true);
AbstractSmartStoreTestSuite.prototype.querySoupNoAssertion = promiser(navigator.smartstore, "querySoup", true);
AbstractSmartStoreTestSuite.prototype.reIndexSoupNoAssertion = promiser(navigator.smartstore, "reIndexSoup", true);
AbstractSmartStoreTestSuite.prototype.registerSoupNoAssertion = promiser(navigator.smartstore, "registerSoup", true);
AbstractSmartStoreTestSuite.prototype.upsertSoupEntriesNoAssertion = promiser(navigator.smartstore, "upsertSoupEntries", true);

AbstractSmartStoreTestSuite.prototype.registerDefaultSoup = function() {
    return this.registerSoup(this.defaultSoupName, this.defaultSoupIndexes);
};

AbstractSmartStoreTestSuite.prototype.removeDefaultSoup = function() {
    return this.removeSoup(this.defaultSoupName);
};

/**
 * Helper method that removes and recreates a soup, ensuring a known good state
 */
AbstractSmartStoreTestSuite.prototype.removeAndRecreateSoup = function(soupName, soupIndexes) {
    var self = this;
    // Start clean
    return self.removeSoup(soupName)
        .pipe(function() {
            // Check soup does not exist
            return self.soupExists(soupName);
        })
        .pipe(function(exists) {
            QUnit.equals(exists, false, "soup should not already exist");
            // Create soup
            return self.registerSoup(soupName, soupIndexes);
        })
        .pipe(function(soupName2) {
            QUnit.equals(soupName2,soupName,"registered soup OK");
            // Check soup now exists
            return self.soupExists(soupName);
        })
        .done(function(exists2) {
            QUnit.equals(exists2, true, "soup should now exist");
        });
}


/**
 * Helper method that adds entry to the named soup
 */
AbstractSmartStoreTestSuite.prototype.addGeneratedEntriesToSoup = function(soupName, nEntries) {
    console.log("In addGeneratedEntriesToSoup: " + soupName + " nEntries=" + nEntries);
    var entries = this.createGeneratedEntries(nEntries);
    return this.upsertSoupEntries(soupName, entries);
};

/**
 * Creates a list of generated entries, with index fields that should order well automatically.
 *   nEntries - The number of generated entries to create.
 * Return: An array of generated entries.
 */
AbstractSmartStoreTestSuite.prototype.createGeneratedEntries = function(nEntries) {
    console.log("In createGeneratedEntries: nEntries=" + nEntries);
    var entries = [];
    for (var i = 0; i < nEntries; i++) {
        var paddedIndex = this.padNumber(i, nEntries, "0");
        var entityId = "003" + paddedIndex;
        var myEntry = { Name: "Todd Stellanova" + paddedIndex, Id: entityId,  attributes:{type:"Contact", url:"/foo/Contact/"+paddedIndex} };
        entries.push(myEntry);
    }
    return entries;
};

/**
 * Pads a number to match a specified number of numerals.
 *  numberToPad - The original number to pad.
 *  maxSize     - The ultimate size, in numerals, of the padded number.
 *  paddingChar - The character used to pad the number.
 * Returns: The padded number string.
 */
AbstractSmartStoreTestSuite.prototype.padNumber = function(numberToPad, maxSize, paddingChar) {
    var numberToPadString = numberToPad + "";
    var numberToPadStringLength = numberToPadString.length;
    var maxSizeString = maxSize + "";
    var maxSizeStringLength = maxSizeString.length;
    for (var i = 0; i < (maxSizeStringLength - numberToPadStringLength); i++) {
        numberToPadString = paddingChar + numberToPadString;
    }
    return numberToPadString;
};

/**
 * Helper method that adds n soup entries to default soup
 */
AbstractSmartStoreTestSuite.prototype.addGeneratedEntriesToTestSoup = function(nEntries) {
    console.log("In addGeneratedEntriesToTestSoup: nEntries=" + nEntries);
    return this.addGeneratedEntriesToSoup(this.defaultSoupName,nEntries);
};

/**
 * Helper method that adds soup entries to default soup
 */
AbstractSmartStoreTestSuite.prototype.addEntriesToTestSoup = function(entries) {
    console.log("In addEntriesToTestSoup: entries.length=" + entries.length);
    return this.upsertSoupEntries(this.defaultSoupName,entries);
};
    
AbstractSmartStoreTestSuite.prototype.addEntriesWithExternalIdToTestSoup = function(entries, externalIdPath) {
    console.log("In addEntriesWithExternalIdToTestSoup: entries.length=" + entries.length);
    return this.upsertEntriesToSoupWithExternalIdPath(this.defaultSoupName, entries, externalIdPath);
};

}

