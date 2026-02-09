# Helper files for javascript development outside the container

- MockCordova.js: mocks just enough cordova functions to allow testing of plugins outside a container
- MockSmartStore.js: a mock smartstore (all in javascript)
- MockSDKInfo.js: mocks the SDK info native implementation
- test.html: runs SFSmartStoreTestSuite.js, SFSmartStoreLoadTestSuite.js and SFSDKInfoTestSuite.js, ForceEntityTestSuite.js outside the container by leveraging MockCordova.js and MockSmartStore.js and MockSDKInfo.js

When writing an application using SmartStore, to test it outside the container do the following:
- include MockCordova.js instead of cordova-xyz.js
- include MockSmartStore.js after cordova.force.js


# Running the tests in a browser

1. Install [ForceServer](https://github.com/ccoenraets/force-server)

To install ForceServer, make sure Node.js is installed on your system, open a command prompt and execute the following command:

    ```
    npm install -g force-server
    ```

    On a Mac, you may have to use sudo:

    ```
    sudo npm install -g force-server
    ```
    
2. Provide a valid Connected App consumer key for appId in the test files.

Replace the placeholder `__CONSUMER_KEY__` (and `__REDIRECT_URI__` where present) with your Connected App values. The Connected App callback URL must match the `oauthCallbackURL` / `oauthRedirectURI` used in the test (e.g. `http://localhost:8200/test/oauthcallback.html` for browser tests).

Test files that need to be updated:
- test/test.html
- test/MockSDKInfo.js

3. Whitelist your local server for CORS in your Org.

Go to Setup: Administer > Security Controls > CORS.
Add http://localhost:8200


4. Run the server.

    Open a command prompt, navigate to your the root directory of your SalesforceMobileSDK-Shared directory and type the following command:

    ```
    force-server
    ```

    This starts the ForceServer server on port 8200.
    Navigate to http://localhost:8200/test/test.html in a browser.

    
