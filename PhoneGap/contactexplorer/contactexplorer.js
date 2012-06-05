//Sample code for Hybrid REST Explorer

function regLinkClickHandlers() {
    var $j = jQuery.noConflict();
    $j('#link_fetch_device_contacts').click(function() {
                                           SFHybridApp.logToConsole("link_fetch_device_contacts clicked");
                                           var options = new ContactFindOptions();
                                           options.filter = ""; // empty search string returns all contacts
                                           options.multiple = true;
                                           var fields = ["name"];
                                           navigator.contacts.find(fields, onSuccessDevice, onErrorDevice, options);
                                           });
    
    $j('#link_fetch_sfdc_contacts').click(function() {
                                         SFHybridApp.logToConsole("link_fetch_sfdc_contacts clicked");
                                         forcetkClient.query("SELECT Name FROM Contact", onSuccessSfdcContacts, onErrorSfdc); 
                                         });
    
    $j('#link_fetch_sfdc_accounts').click(function() {
                                         SFHybridApp.logToConsole("link_fetch_sfdc_accounts clicked");
                                         forcetkClient.query("SELECT Name FROM Account", onSuccessSfdcAccounts, onErrorSfdc); 
                                         });
    
    $j('#link_reset').click(function() {
                           SFHybridApp.logToConsole("link_reset clicked");
                           $j("#div_device_contact_list").html("")
                           $j("#div_sfdc_contact_list").html("")
                           $j("#div_sfdc_account_list").html("")
                           $j("#console").html("")
                           });
                           
    $j('#link_logout').click(function() {
             SFHybridApp.logToConsole("link_logout clicked");
             SalesforceOAuthPlugin.logout();
             });
}

function onSuccessDevice(contacts) {
    var $j = jQuery.noConflict();
    SFHybridApp.logToConsole("onSuccessDevice: received " + contacts.length + " contacts");
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
    SFHybridApp.logToConsole("onErrorDevice: " + JSON.stringify(error) );
    alert('Error getting device contacts!');
}

function onSuccessSfdcContacts(response) {
    var $j = jQuery.noConflict();
    SFHybridApp.logToConsole("onSuccessSfdcContacts: received " + response.totalSize + " contacts");
    
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
    SFHybridApp.logToConsole("onSuccessSfdcAccounts: received " + response.totalSize + " accounts");
    
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
    SFHybridApp.logToConsole("onErrorSfdc: " + JSON.stringify(error));
    alert('Error getting sfdc contacts!');
}