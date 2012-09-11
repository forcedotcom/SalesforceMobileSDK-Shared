//Sample code for SmartStore

// This file assumes that all of the javascript and css files required
// as well as the required DOM objects are specified in the index.html file.

var SAMPLE_SOUP_NAME = "myPeopleSoup";
var lastSoupCursor = null;
var sfSmartstore = cordova.require("salesforce/plugin/smartstore");


function regLinkClickHandlers() {
    var logToConsole = cordova.require("salesforce/util/logger").logToConsole;
    logToConsole("regLinkClickHandlers");


    
    $('#link_fetch_sfdc_contacts').click(function() {
                                         logToConsole("link_fetch_sfdc_contacts clicked");
                                         forcetkClient.query("SELECT Name,Id FROM Contact", onSuccessSfdcContacts, onErrorSfdc); 
                                         });
    

    
    $('#link_reset').click(function() {
                           logToConsole("link_reset clicked");
                           $("#div_device_contact_list").html("");
                           $("#div_sfdc_contact_list").html("");
                           $("#div_sfdc_account_list").html("");
                           $("#div_sfdc_soup_entry_list").html("");
                           $("#console").html("");
    });
                  
         
    $('#link_logout').click(function() {
             logToConsole("link_logout clicked");
             var sfOAuthPlugin = cordova.require("salesforce/plugin/oauth");
             sfOAuthPlugin.logout();
             });
    
    $('#link_reg_soup').click(function() {
      logToConsole("link_reg_soup clicked");

      var indexes = [
                     {path:"Name",type:"string"},
                     {path:"Id",type:"string"}
                     ];
        
      sfSmartstore.registerSoup(SAMPLE_SOUP_NAME,
                                        indexes,                                  
                                        onSuccessRegSoup, 
                                        onErrorRegSoup
        );
      
    });
                              
                              
    
    $('#link_stuff_soup').click(function() {
        logToConsole("link_stuff_soup clicked");
        runStuffSoup();
    });
                            
    

    $('#link_remove_soup').click(function() {
        sfSmartstore.removeSoup(SAMPLE_SOUP_NAME,
                                     onSuccessRemoveSoup, 
                                     onErrorRemoveSoup);
    });
    
    
    $('#link_soup_exists').click(function() {
                                 sfSmartstore.soupExists(SAMPLE_SOUP_NAME,
                                                                 onSoupExistsDone,
                                                                 onSoupExistsDone);
                                 });
    
    
    $('#link_query_soup').click(function() {
        runQuerySoup();
    });

    $('#link_retrieve_entries').click(function() {
                                runRetrieveEntries();
                                });
    
    
    
     $('#link_cursor_page_zero').click(function() {
        logToConsole("link_cursor_page_zero clicked");
        sfSmartstore.moveCursorToPageIndex(lastSoupCursor,0, onSuccessQuerySoup,onErrorQuerySoup);
    });
     
     $('#link_cursor_page_prev').click(function() {
        logToConsole("link_cursor_page_prev clicked");
        sfSmartstore.moveCursorToPreviousPage(lastSoupCursor,onSuccessQuerySoup,onErrorQuerySoup);
    });
     
    
    $('#link_cursor_page_next').click(function() {
        logToConsole("link_cursor_page_next clicked");
        sfSmartstore.moveCursorToNextPage(lastSoupCursor,onSuccessQuerySoup,onErrorQuerySoup);
    });
}


function addEntriesToTestSoup(entries,cb) {
    var logToConsole = cordova.require("salesforce/util/logger").logToConsole;
    sfSmartstore.upsertSoupEntries(SAMPLE_SOUP_NAME,entries,
                                           function(items) {
                                               logToConsole("added entries: " + items.length);
                                               $("#div_soup_status_line").html("Soup upsert OK");

                                               if (typeof cb !== "undefined") {
                                                cb(items);
                                               }
                                           },
                                           function(err) {
                                               logToConsole("onErrorUpsert: " + err);
                                               $("#div_soup_status_line").html("Soup upsert ERROR");
                                               if (typeof cb !== "undefined") {
                                                cb(null);
                                               }                                           
                                           }
                                           );
}


function addGeneratedEntriesToTestSoup(nEntries, cb) {
	cordova.require("salesforce/util/logger").logToConsole("addGeneratedEntriesToTestSoup " + nEntries);
    
	var entries = [];
	for (var i = 0; i < nEntries; i++) {
		var myEntry = { Name: "Todd Stellanova" + i, Id: "00300" + i,  attributes:{type:"Contact"} };
		entries.push(myEntry);
	}
	
	addEntriesToTestSoup(entries,cb);
	
}

function runStuffSoup() {
    var inputStr = $('#input_stuff_soup_count').val();
    if (inputStr.length === 0) {
        inputStr = null;
    }
    var inputVal = 1;
    if (inputStr !== null) {
        inputVal = parseInt(inputStr);
    }
    
    addGeneratedEntriesToTestSoup(inputVal);
    
}

function runQuerySoup() {
	
	var indexPath = $('#input_indexPath').val();
    if (indexPath.length === 0) {
        indexPath = null;
    }

    var beginKey = $('#input_querySoup_beginKey').val();
    if (beginKey.length === 0) {
        beginKey = null;
    }
    
    var endKey = $('#input_querySoup_endKey').val();
    if (endKey.length === 0) {
        endKey = null;
    }
    
	var queryType =  $('#select_querySoup_type').val();


    var pageSizeStr = $('#input_querySoup_pageSize').val();
    if (pageSizeStr.length === 0) {
        pageSizeStr = null;
    }
    var pageSizeVal = 25;
    if (pageSizeStr !== null) {
        pageSizeVal = parseInt(pageSizeStr);
    }
    
    
    cordova.require("salesforce/util/logger").logToConsole("querySoup path: '"+ indexPath + "' begin: '" + beginKey + "' end: '" + endKey + "' [" + pageSizeVal + ']');
    var querySpec;
	if ("range" == queryType) {
		querySpec = sfSmartstore.buildRangeQuerySpec(indexPath,beginKey,endKey,null,pageSizeVal);
	} else if ("like" == queryType) {
		querySpec = sfSmartstore.buildLikeQuerySpec(indexPath,beginKey,null,pageSizeVal);
	} else if ("all" == queryType) {
		querySpec = sfSmartstore.buildAllQuerySpec(indexPath, null, pageSizeVal) ;
	}
	else { //"exact"
		querySpec = sfSmartstore.buildExactQuerySpec(indexPath,beginKey,null,pageSizeVal);
	}
	
                                
    sfSmartstore.querySoup(SAMPLE_SOUP_NAME,querySpec,
                                       onSuccessQuerySoup, 
                                       onErrorQuerySoup
                                                );
}

function runRetrieveEntries() {
    var inputStr = $('#input_retrieve_entries').val();
    if (inputStr.length === 0) {
        inputStr = null;
    }
    
    cordova.require("salesforce/util/logger").logToConsole("runRetrieveEntries: " + inputStr );
    var entryIds = eval(inputStr);
    
    sfSmartstore.retrieveSoupEntries(SAMPLE_SOUP_NAME,
                                             entryIds,
                                             onSuccessRetrieveEntries,
                                             onErrorRetrieveEntries
                                             );
}
    
function onSuccessRegSoup(param) {
    cordova.require("salesforce/util/logger").logToConsole("onSuccessRegSoup: " + param);
    $("#div_soup_status_line").html("Soup registered: " + SAMPLE_SOUP_NAME);
}

function onErrorRegSoup(param) {
    cordova.require("salesforce/util/logger").logToConsole("onErrorRegSoup: " + param);
    $("#div_soup_status_line").html("registerSoup ERROR");
}

                         

function onSuccessUpsert(param) {
    cordova.require("salesforce/util/logger").logToConsole("onSuccessUpsert: " + param);
    $("#div_soup_status_line").html("Soup upsert OK");
}

function onErrorUpsert(param) {
    cordova.require("salesforce/util/logger").logToConsole("onErrorUpsert: " + param);
    $("#div_soup_status_line").html("Soup upsert ERROR");
}


    
function onSuccessQuerySoup(cursor) {

    cordova.require("salesforce/util/logger").logToConsole("onSuccessQuerySoup totalPages: " + cursor.totalPages);
    lastSoupCursor = cursor;

    $("#div_sfdc_soup_entry_list").html("");
    var ul = $('<ul data-role="listview" data-inset="true" data-theme="a" data-dividertheme="a">Page ' + 
               (cursor.currentPageIndex+1) + '/' + cursor.totalPages + 
               ' Entries: ' + cursor.currentPageOrderedEntries.length + 
               ' </ul>');
    $("#div_sfdc_soup_entry_list").append(ul);
    
    var curPageEntries = cursor.currentPageOrderedEntries;
    
    $.each(curPageEntries, function(i,entry) {
           var formattedName = entry.name; 
           var entryId = entry._soupEntryId;
           var phatName = entry.Name;
        if (phatName) {
            formattedName = phatName;
        }

        var newLi = $("<li><a href='#'>" + entryId + " - " + formattedName + "</a></li>");
        ul.append(newLi);
    });
    
    $("#div_sfdc_soup_entry_list").trigger( "create" );

    
}


function onErrorQuerySoup(param) {
    cordova.require("salesforce/util/logger").logToConsole("onErrorQuerySoup: " + param);
}


function onSuccessRetrieveEntries(entries ) {
    cordova.require("salesforce/util/logger").logToConsole("onSuccessRetrieveEntries : " + entries.length);
    
    $("#div_sfdc_soup_entry_list").html("");
    var ul = $('<ul data-role="listview" data-inset="true" data-theme="a" data-dividertheme="a"> ' + 
               ' Entries: ' + entries.length + 
               ' </ul>');
    $("#div_sfdc_soup_entry_list").append(ul);

    $.each(entries, function(i,entry) {
           var formattedName = entry.name; 
           var entryId = entry._soupEntryId;
           var phatName = entry.Name;
           if (phatName) {
           formattedName = phatName;
           }
           
           var newLi = $("<li><a href='#'>" + entryId + " - " + formattedName + "</a></li>");
           ul.append(newLi);
           });
    
    $("#div_sfdc_soup_entry_list").trigger( "create" );


}

function onErrorRetrieveEntries(param) {
    cordova.require("salesforce/util/logger").logToConsole("onErrorRetrieveEntries: " + param);
}



function onSuccessRemoveSoup(param) {
    cordova.require("salesforce/util/logger").logToConsole("onSuccessRemoveSoup: " + param);
    $("#div_soup_status_line").html("Soup removed: " + SAMPLE_SOUP_NAME);
}
function onErrorRemoveSoup(param) {
    cordova.require("salesforce/util/logger").logToConsole("onErrorRemoveSoup: " + param);
    $("#div_soup_status_line").html("removeSoup ERROR");
}



function onSoupExistsDone(param) {
    cordova.require("salesforce/util/logger").logToConsole("onSoupExistsDone: " + param);
    $("#div_soup_status_line").html("Soup exists: " + param);
}





function onSuccessSfdcContacts(response) {
    var logToConsole = cordova.require("salesforce/util/logger").logToConsole;
    logToConsole("onSuccessSfdcContacts: received " + response.totalSize + " contacts");
    
	var entries = [];
    
    $("#div_sfdc_contact_list").html("");
    var ul = $('<ul data-role="listview" data-inset="true" data-theme="a" data-dividertheme="a"></ul>');
    $("#div_sfdc_contact_list").append(ul);
    
    ul.append($('<li data-role="list-divider">Salesforce Contacts: ' + response.totalSize + '</li>'));
    $.each(response.records, function(i, contact) {
           entries.push(contact);
           logToConsole("name: " + contact.Name);
           var newLi = $("<li><a href='#'>" + (i+1) + " - " + contact.Name + "</a></li>");
           ul.append(newLi);
           });
    
    if (entries.length > 0) {
        sfSmartstore.upsertSoupEntries(SAMPLE_SOUP_NAME,
                                               entries,
                                               
                                               function(items) {
                                                   var statusTxt = "upserted: " + items.length + " contacts";
                                                   logToConsole(statusTxt);
                                                   $("#div_soup_status_line").html(statusTxt);
                                                    $("#div_sfdc_contact_list").trigger( "create" );
                                               },
                                               
                                               onErrorUpsert);
    }
    
    

    
}


function onErrorSfdc(error) {
    cordova.require("salesforce/util/logger").logToConsole("onErrorSfdc: " + JSON.stringify(error));
    alert('Error getting sfdc contacts!');
}