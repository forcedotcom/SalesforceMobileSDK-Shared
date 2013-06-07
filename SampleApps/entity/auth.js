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
    cordova.require("salesforce/plugin/oauth").getAuthCredentials(
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
    Force.init(creds, null, null, cordova.require("salesforce/plugin/oauth").forcetkRefresh);

    // router
    app.router = new app.Router();

    // Go!
    Backbone.history.start();
}


