## Short Guide on Using the MobileSync Plugin for Offline Functionality

The following example demonstrates how to use the Mobile Sync plugin without the mobilesync.js library. 

This sample uses the Contact object as it is used for many sample hybrid apps. You can add this code to a Lightning Web Component and modify it as needed with respect to the component.

Here's a summary of the app's flow:
- Register the soup in SmartStore with the necessary object specifications.
- Call sync down to populate the soup with records from the Salesforce server.
- Create a new contact locally and adds it to SmartStore.
- Call sync up to push the records to the Salesforce server.

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
