(function () {

    "use strict";

    /* Adding platform (ios/android) specific css */
    var platformStyle = document.createElement('link');
    platformStyle.setAttribute('rel', 'stylesheet');
    if (/Android/.test(navigator.userAgent)) {
        platformStyle.setAttribute('href', 'css/ratchet-theme-android.css');
    } else if (/iPhone/.test(navigator.userAgent)) {
        platformStyle.setAttribute('href', 'css/ratchet-theme-ios.css');
    }
    document.querySelector('head').appendChild(platformStyle);

    /* This will only be true when testing in a browser with MockCordova */
    if (cordova.interceptExec) {
        force.init({loginURL: "https://test.salesforce.com/",
                    appId: "3MVG98dostKihXN53TYStBIiS8BTFb20jwWfFcShqfABb3c.HH3CkmA00FuCmc0aM3v4LZOGR5QBnEi77fotN",
                    oauthCallbackURL: "http://localhost:8200/test/oauthcallback.html",
                    useCordova: false /* running in browser with mock cordova - so do oauth through browser and network through xhr */
                   });
    }
       
    /* Do login */
    force.login(
        function() {
            console.log("Auth succeeded"); 
            showUsersList();
        },
        function(error) {
            console.log("Auth failed: " + error); 
        }
    );

    /* This method will render a list of users from current salesforce org */
    var showUsersList = function() {

        fetchRecords(function(data) {
            var users = data.records;

            var listItemsHtml = '';
            for (var i=0; i < users.length; i++) {
                listItemsHtml += ('<li class="table-view-cell"><div class="media-body">' + users[i].Name + '</div></li>');
            }

            document.querySelector('#users').innerHTML = listItemsHtml;
        })
    }

    /* This method will fetch a list of user records from salesforce. 
    Just change the soql query to fetch another sobject. */
    var fetchRecords = function (successHandler) {
        var soql = 'SELECT Id, Name FROM User LIMIT 10';
        force.query(soql, successHandler, function(error) {
            alert('Failed to fetch users: ' + error);
        });
    };

})();
