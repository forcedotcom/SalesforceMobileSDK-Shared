// Creating the application namespace
var app = {
    models: {},
    views: {},
    utils: {}
};

jQuery(document).ready(function() {
    //Add event listeners and so forth here
    console.log("onLoad: jquery ready");

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
    // End local testing
});

function appStart(creds)
{
    // Force init
    Force.init(creds);

    // router
    app.router = new app.Router();

    // Go!
    Backbone.history.start();
}


