// Creating the application namespace
var app = {
    models: {},
    views: {},
    utils: {}
};

jQuery(document).ready(function() {
    //Add event listeners and so forth here
    console.log("onLoad: jquery ready");

    // Use following when in container
	// document.addEventListener("deviceready", onDeviceReady,false);

    // Use  when testing in browser
    // Also make sure to start browser with same origin policy disable
    // See http://joshuamcginnis.com/2011/02/28/how-to-disable-same-origin-policy-in-chrome/
    var creds = {
        accessToken: "--will-be-obtained-by-refres",
        refreshToken: "5Aep861_OKMvio5gy9sGt9Z9mdt62xXK.9ugif6nZJYknXeANTICBf4ityN9j6YDgHjFvbzu6FTUQ==",
        clientId: "3MVG92.uWdyphVj4bnolD7yuIpCQsNgddWtqRND3faxrv9uKnbj47H4RkwheHA2lKY4cBusvDVp0M6gdGE8hp",
        loginUrl: "https://test.salesforce.com",
        instanceUrl: "https://tapp0.salesforce.com",
        accountAgent: "sobject-proto"
    };
    appStart(creds);
});

// When this function is called, cordova has been initialized and is ready to roll 
function onDeviceReady() {
    console.log("onDeviceReady: cordova ready");
	//Call getAuthCredentials to get the initial session credentials
    cordova.require("salesforce/plugin/oauth").getAuthCredentials(
        function(creds) {
            appStart(creds);
        }, 
        function(error) { 
            console.log("Auth failed: " + error); 
        });

}

function appStart(creds)
{
    var apiVersion = "v26.0";

    // Backbone.Force init
    Backbone.Force.init(creds, apiVersion);

    // router
    app.router = new app.Router();

    // Go!
    Backbone.history.start();
}


