//Sample code for Hybrid REST Explorer

function regLinkClickHandlers() {
    var $j = jQuery.noConflict();
    var logToConsole = cordova.require("com.salesforce.util.logger").logToConsole;
    $j('#link_fetch_device_contacts').click(function() {
                                           logToConsole("link_fetch_device_contacts clicked");
                                           var contactOptionsType = cordova.require("org.apache.cordova.contacts.ContactFindOptions");
                                           var options = new contactOptionsType();
                                           options.filter = ""; // empty search string returns all contacts
                                           options.multiple = true;
                                           var fields = ["name"];
                                           var contactsObj = cordova.require("org.apache.cordova.contacts.contacts");
                                           contactsObj.find(fields, onSuccessDevice, onErrorDevice, options);
                                           });
    
    $j('#link_fetch_sfdc_contacts').click(function() {
                                         logToConsole("link_fetch_sfdc_contacts clicked");
                                         forcetkClient.query("SELECT Name FROM Contact LIMIT 25", onSuccessSfdcContacts, onErrorSfdc); 
                                         });
    
    $j('#link_fetch_sfdc_accounts').click(function() {
                                         logToConsole("link_fetch_sfdc_accounts clicked");
                                         forcetkClient.query("SELECT Name FROM Account LIMIT 25", onSuccessSfdcAccounts, onErrorSfdc); 
                                         });
    
    $j('#link_reset').click(function() {
                           logToConsole("link_reset clicked");
                           $j("#div_device_contact_list").html("")
                           $j("#div_sfdc_contact_list").html("")
                           $j("#div_sfdc_account_list").html("")
                           $j("#console").html("")
                           });
                      
    $j('#link_logout').click(function() {
    	logToConsole("link_logout clicked");
        var sfAccManagerPlugin = cordova.require("com.salesforce.plugin.sfaccountmanager");
        sfAccManagerPlugin.logout();
    });

    $j('#link_get_current_user').click(function() {
        logToConsole("link_get_current_user clicked");
        var sfAccManagerPlugin = cordova.require("com.salesforce.plugin.sfaccountmanager");
        sfAccManagerPlugin.getCurrentUser(function(user) {
            logToConsole("Success callback");
            logToConsole("Auth Token: " + user.authToken);
            logToConsole("Refresh Token: " + user.refreshToken);
            logToConsole("Login Server: " + user.loginServer);
            logToConsole("ID URL: " + user.idUrl);
            logToConsole("Instance Server: " + user.instanceServer);
            logToConsole("Org ID: " + user.orgId);
            logToConsole("User ID: " + user.userId);
            logToConsole("Username: " + user.username);
            logToConsole("Client ID: " + user.clientId);
        }, null)
    });

    $j('#link_switch_user').click(function() {
        logToConsole("link_switch_user clicked");
        var sfAccManagerPlugin = cordova.require("com.salesforce.plugin.sfaccountmanager");
        sfAccManagerPlugin.switchToUser();
    });

    $j('#link_get_all_users').click(function() {
        logToConsole("link_get_all_users clicked");
        var sfAccManagerPlugin = cordova.require("com.salesforce.plugin.sfaccountmanager");
        sfAccManagerPlugin.getUsers(function(user) {
            logToConsole("Success callback");
        	var size = user.length;
        	for (var i = 0; i < size; i++) {
                logToConsole("Auth Token: " + user[i].authToken);
                logToConsole("Refresh Token: " + user[i].refreshToken);
                logToConsole("Login Server: " + user[i].loginServer);
                logToConsole("ID URL: " + user[i].idUrl);
                logToConsole("Instance Server: " + user[i].instanceServer);
                logToConsole("Org ID: " + user[i].orgId);
                logToConsole("User ID: " + user[i].userId);
                logToConsole("Username: " + user[i].username);
                logToConsole("Client ID: " + user[i].clientId);
        	}
        }, null)
    });
}

function onSuccessDevice(contacts) {
    var $j = jQuery.noConflict();
    cordova.require("com.salesforce.util.logger").logToConsole("onSuccessDevice: received " + contacts.length + " contacts");
    $j("#div_device_contact_list").html("")
    var ul = $j('<ul data-role="listview" data-inset="true" data-theme="a" data-dividertheme="a"></ul>');
    $j("#div_device_contact_list").append(ul);
    
    ul.append($j('<li data-role="list-divider">Device Contacts: ' + contacts.length + '</li>'));
    $j.each(contacts, function(i, contact) {
           var formattedName = contact.name.formatted;
           if (formattedName) {
           var newLi = $j("<li><a href='#'>" + (i+1) + " - " + formattedName + "</a></li>");
           ul.append(newLi);
           }
           });
    
    $j("#div_device_contact_list").trigger( "create" )
}

function onErrorDevice(error) {
    cordova.require("com.salesforce.util.logger").logToConsole("onErrorDevice: " + JSON.stringify(error) );
    alert('Error getting device contacts!');
}

function onSuccessSfdcContacts(response) {
    var $j = jQuery.noConflict();
    cordova.require("com.salesforce.util.logger").logToConsole("onSuccessSfdcContacts: received " + response.totalSize + " contacts");
    
    $j("#div_sfdc_contact_list").html("")
    var ul = $j('<ul data-role="listview" data-inset="true" data-theme="a" data-dividertheme="a"></ul>');
    $j("#div_sfdc_contact_list").append(ul);
    
    ul.append($j('<li data-role="list-divider">Salesforce Contacts: ' + response.totalSize + '</li>'));
    $j.each(response.records, function(i, contact) {
           var newLi = $j("<li><a href='#'>" + (i+1) + " - " + contact.Name + "</a></li>");
           ul.append(newLi);
           });
    
    $j("#div_sfdc_contact_list").trigger( "create" )
}

function onSuccessSfdcAccounts(response) {
    var $j = jQuery.noConflict();
    cordova.require("com.salesforce.util.logger").logToConsole("onSuccessSfdcAccounts: received " + response.totalSize + " accounts");
    
    $j("#div_sfdc_account_list").html("")
    var ul = $j('<ul data-role="listview" data-inset="true" data-theme="a" data-dividertheme="a"></ul>');
    $j("#div_sfdc_account_list").append(ul);
    
    ul.append($j('<li data-role="list-divider">Salesforce Accounts: ' + response.totalSize + '</li>'));
    $j.each(response.records, function(i, record) {
           var newLi = $j("<li><a href='#'>" + (i+1) + " - " + record.Name + "</a></li>");
           ul.append(newLi);
           });
    
    $j("#div_sfdc_account_list").trigger( "create" )
}

function onErrorSfdc(error) {
    cordova.require("com.salesforce.util.logger").logToConsole("onErrorSfdc: " + JSON.stringify(error));
    alert('Error getting sfdc contacts!');
}
