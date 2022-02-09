## Short Guide on using MobileSync Plugin without the mobilesync.js library, for Offline Functionality

The SalesforceMobileSDK-Shared repository and the Salesforce Mobile SDK documentation did not have any full samples of the mobilesync using only the plugin and no mobilesync.js library, so here
is a sample of how mobilesync can be used with the plugin. Particularly a demonstration of sync up was hard to find, so here it is.

You can put the segment below in a Lightning Web Component and modify as needed with respect the the Object.
Below, the Contact object is used as is used for many sample hybrid apps.

Basically first the soup is registered in the smartstore with the necessary object specifications.
Then the soup is populated with records from the Salesforce server using sync down.
Next a new contact is locally created, and added to the smartstore.
Finally sync up is used to push the records to the Salesforce server.

````md
//register
var indexSpecs = [
  { "path": "Id", "type": "string"},
  { "path": "Firstname", "type": "full_text"},
  { "path": "Lastname", "type": "full_text"},
  { "path": "__local__", "type": "string"},
  { "path": "__locally_created__", "type": "string"},
  { "path": "__locally_updated__", "type": "string"},
  { "path": "__locally_deleted__", "type": "string"},
  { "path": "__sync_id__", "type": "integer"}
];
var sfSmartstore = function() {
  return cordova.require("com.salesforce.plugin.smartstore");
};
sfSmartstore().registerSoup('contact', indexSpecs, function(param) {
  console.log("Success register callback:");
  console.log(param);
}, function(param) {
  console.log("Error register callback:");
  console.log(param);
});

//sync down
const fieldlist = ["Id", "Firstname", "Lastname", "LastModifiedDate"];
const target = {type: "soql", query: "SELECT Id, Name, LastModifiedDate FROM Contact"};
var sfMobilesync = function() {
  return cordova.require("com.salesforce.plugin.mobilesync");
};
sfMobilesync().syncDown(false, target, "contact", {mergeMode:"OVERWRITE"}, function(param) {
  console.log("SyncDOWN:");
  console.log(JSON.stringify(param));
});

//add
const newContact = {
  Id: `local_${(new Date()).getTime()}`,
  Firstname: "Firstname",
  Lastname: "Lastname",
  attributes: {type: 'Contact'},
  __locally_created__: true,
  __locally_updated__: false,
  __locally_deleted__: false,
  __local__: true
};
sfSmartstore().upsertSoupEntries(false, "contact", [newContact], function(param) {
  console.log(JSON.stringify(param));
},  function(param) {
  console.log(JSON.stringify(param));
});

//sync up
sfMobilesync().syncUp({ isGlobalStore: false }, {createFieldlist:["Id","Firstname", "Lastname"]}, "contact", {mergeMode:"OVERWRITE", fieldlist: ["Id", "Firstname", "Lastname"]}, function(param) {
  console.log("Sync UP");
  console.log(JSON.stringify(param));
});
````
