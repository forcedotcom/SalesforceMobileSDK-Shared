// Creating the application namespace
var app = {
    models: {},
    views: {},
    utils: {}
};

var inBrowser = cordova.interceptExec;

jQuery(document).ready(function() {
    //Add event listeners and so forth here
    console.log("onLoad: jquery ready");
    // FastClick
    new FastClick(document.body);

    if (inBrowser) {
        force.init({loginURL: "https://test.salesforce.com/",
                    appId: "3MVG98dostKihXN53TYStBIiS8BTFb20jwWfFcShqfABb3c.HH3CkmA00FuCmc0aM3v4LZOGR5QBnEi77fotN",
                    oauthCallbackURL: "http://localhost:8200/test/oauthcallback.html",
                    useCordova: false /* running in browser with mock cordova - so do oauth through browser and network through xhr */
                   });
    }
       
    force.login(
        function() {
            console.log("Auth succeeded");

            if (inBrowser) {
                storeMap.setupUserStoreFromDefaultConfig(function() {
                    syncManagerMap.setupUserSyncsFromDefaultConfig(function() {
                        appStart();
                    });
                });
            }
            else {
                appStart();
            }
        },
        function(error) {
            console.log("Auth failed: " + error); 
        }
    );
});

function appStart()
{
    // Force init
    Force.init();


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
