var ACCOUNTS_SOUP_NAME = "ct__accountsSoup";
var OPPORTUNITIES_SOUP_NAME = "ct__opportunitiesSoup";
var INDEXES_ACCOUNTS = [
    {path:"Id", type:"string"},
    {path:"Name", type:"string"},
    {path:"Description", type:"string"},
    {path:"isDirty", type:"string"}
];
var INDEXES_OPPORTUNITIES = [
    {path:"Id", type:"string"},
    {path:"Name", type:"string"},
    {path:"Description", type:"string"},
    {path:"AccountId", type:"string"},
    {path:"CloseDate", type:"string"},
    {path:"StageName", type:"string"},
    {path:"isDirty", type:"string"}
];

var sfSmartstore = cordova.require("salesforce/plugin/smartstore");

function regAccSoup() {
    cordova.require("salesforce/util/logger").logToConsole("In regAccSoup");
    // Registers soup for storing accounts.
    sfSmartstore.registerSoup(ACCOUNTS_SOUP_NAME,
            INDEXES_ACCOUNTS, regOppSoup, regOppSoup);
}

function regOppSoup() {
    cordova.require("salesforce/util/logger").logToConsole("In regOppSoup");
    // Registers soup for storing opportunities.
    sfSmartstore.registerSoup(OPPORTUNITIES_SOUP_NAME,
            INDEXES_OPPORTUNITIES, onSuccessRegSoup, onErrorRegSoup);
}

function removeAccSoup() {
    sfSmartstore.removeSoup(ACCOUNTS_SOUP_NAME, removeOppSoup, removeOppSoup);
}

function removeOppSoup() {
    sfSmartstore.removeSoup(OPPORTUNITIES_SOUP_NAME, onSuccessRemoveSoup, onErrorRemoveSoup);
}

function addAccounts(entries, success, error) {
    sfSmartstore.upsertSoupEntriesWithExternalId(ACCOUNTS_SOUP_NAME, entries, "Id",
            success, error);
}

function addOpportunities(entries, success, error) {
    sfSmartstore.upsertSoupEntriesWithExternalId(OPPORTUNITIES_SOUP_NAME, entries, "Id",
            success, error);
}

function getAccounts(numAccounts, success, error) {
    var querySpec = sfSmartstore.buildAllQuerySpec("Id", null, numAccounts);
    sfSmartstore.querySoup(ACCOUNTS_SOUP_NAME, querySpec, function(cursor) {
        success(cursor);
    }, error);
}

function getOpportunities(numOpportunities, success, error) {
    var querySpec = sfSmartstore.buildAllQuerySpec("Id", null, numOpportunities);
    sfSmartstore.querySoup(OPPORTUNITIES_SOUP_NAME, querySpec, function(cursor) {
        success(cursor);
    }, error);
}

function getAccById(id, success, error) {
    var querySpec = sfSmartstore.buildExactQuerySpec("Id", id, 1);
    sfSmartstore.querySoup(ACCOUNTS_SOUP_NAME, querySpec, function(cursor) {
        success(cursor);
    }, error);
}

function getOppById(id, success, error) {
    var querySpec = sfSmartstore.buildExactQuerySpec("Id", id, 1);
    sfSmartstore.querySoup(OPPORTUNITIES_SOUP_NAME, querySpec, function(cursor) {
        success(cursor);
    }, error);
}

function getNumAccounts(success, error) {
    var querySpec = sfSmartstore.buildAllQuerySpec("Id", null, 1);
    sfSmartstore.querySoup(ACCOUNTS_SOUP_NAME, querySpec, function(cursor) {
        success(cursor);
    }, error);
}

function getNumOpportunities(success, error) {
    var querySpec = sfSmartstore.buildAllQuerySpec("Id", null, 1);
    sfSmartstore.querySoup(OPPORTUNITIES_SOUP_NAME, querySpec, function(cursor) {
        success(cursor);
    }, error);
}

function updateAccount(id, newName, newDesc, success, error) {
    var fields = {};
    if (newName != null) {
        fields.Name = newName;
    }
    if (newDesc != null) {
        fields.Description = newDesc;
    }
    forcetkClient.upsert("Account", "Id", id, fields, success, error);
}

function updateOpportunity(id, newName, newDesc, newAccountId, newCloseDate, newStageName, success, error) {
    var fields = {};
    if (newName != null) {
        fields.Name = newName;
    }
    if (newDesc != null) {
        fields.Description = newDesc;
    }
    if (newCloseDate != null) {
        fields.AccountId = newCloseDate;
    }
    if (newCloseDate != null) {
        fields.CloseDate = newCloseDate;
    }
    if (newStageName != null) {
        fields.StageName = newStageName;
    }
    forcetkClient.upsert("Opportunity", "Id", id, fields, success, error);
}

function fetchDirtyAccounts(success, error) {
    var querySpec = sfSmartstore.buildExactQuerySpec("isDirty", "true", 1);
    sfSmartstore.querySoup(ACCOUNTS_SOUP_NAME, querySpec, function(response) {
        var allQuerySpec = sfSmartstore.buildExactQuerySpec("isDirty", "true", response.totalPages - 1);
        sfSmartstore.querySoup(ACCOUNTS_SOUP_NAME, allQuerySpec, function(cursor) {
            success(cursor);
        }, error);
    }, error);
}

function fetchDirtyOpportunities(success, error) {
    var querySpec = sfSmartstore.buildExactQuerySpec("isDirty", "true", 1);
    sfSmartstore.querySoup(OPPORTUNITIES_SOUP_NAME, querySpec, function(response) {
        var allQuerySpec = sfSmartstore.buildExactQuerySpec("isDirty", "true", response.totalPages - 1);
        sfSmartstore.querySoup(OPPORTUNITIES_SOUP_NAME, allQuerySpec, function(cursor) {
            success(cursor);
        }, error);
    }, error);
}
