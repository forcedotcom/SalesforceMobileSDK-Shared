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

    // Container
    if (window.cordova && !cordova.interceptExec) {
        document.addEventListener("deviceready", function() {
            console.log("onDeviceReady: cordova ready");

            //Call getAuthCredentials to get the initial session credentials
            cordova.require("com.salesforce.plugin.oauth").getAuthCredentials(
                function(creds) {
                    appStart( _.extend(creds, {userAgent: navigator.userAgent}), cordova.require("com.salesforce.plugin.oauth").forcetkRefresh);
                }, 
                function(error) { 
                    console.log("Auth failed: " + error); 
                });
        });
    }
    // Browser
    else {
        var loginUrl = "https://login.salesforce.com/";
        var consumerKey = "3MVG98dostKihXN53TYStBIiS8HkwJJ.hsRQPcdchz8X9k16IRCU4KpvmoRuPRgAsWhy2cwXyX0JUr21qQ.mX";
        var callbackUrl = "https://sfdc-sobject-editor.herokuapp.com/oauth/success";

        // Instantiating forcetk ClientUI
        var oauthClient = new ForceOAuth(loginUrl, consumerKey, callbackUrl,
                                         function forceOAuthUI_successHandler(forcetkClient) { // successCallback
                                             console.log('OAuth success!');
                                             creds = {
                                                 accessToken: oauthClient.oauthResponse.access_token,
                                                 instanceUrl: oauthClient.oauthResponse.instance_url
                                             };
                                             appStart(creds);
                                         },
                                         function forceOAuthUI_errorHandler(error) { // errorCallback
                                             console.log('OAuth error!');
                                             if (confirm("Authentication Failed. Try again?")) oauthClient.login();
                                         });

        oauthClient.login();
    }
});

function appStart(creds, refresh)
{
    // Force init
    Force.init(creds, null, null, refresh);


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
