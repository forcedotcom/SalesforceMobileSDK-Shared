// Creating the application namespace
var app = {
    models: {},
    views: {},
    utils: {}
};

jQuery(document).ready(function() {
    //Add event listeners and so forth here
    console.log("onLoad: jquery ready");
    // FastClick
    new FastClick(document.body);
	document.addEventListener("deviceready", onDeviceReady,false);
});

// When this function is called, cordova has been initialized and is ready to roll 
function onDeviceReady() {
    console.log("onDeviceReady: cordova ready");
	//Call getAuthCredentials to get the initial session credentials
    cordova.require("com.salesforce.plugin.oauth").getAuthCredentials(
        function(creds) {
            appStart( _.extend(creds, {userAgent: navigator.userAgent}) );
        }, 
        function(error) { 
            console.log("Auth failed: " + error); 
        });

}

function appStart(creds)
{
    // Force init
    Force.init(creds, null, null, cordova.require("com.salesforce.plugin.oauth").forcetkRefresh);


    // Register for push
    // cordova.require("com.salesforce.util.push").registerPushNotificationHandler(
    //     function(message) {
    //         // alert(JSON.stringify(message));
    //         if (!message["foreground"] && message["payload"] && message["payload"]["Id"]) {
    //             app.router.navigate("#edit/accounts/" + message["payload"]["Id"] + "/true",  {trigger:true});
    //         }
    //     },
    //     function(error) {
    //         // alert(JSON.stringify(error));
    //     }
    // );

    // router
    app.router = new app.Router();

    // Go!
    Backbone.history.start();
}
