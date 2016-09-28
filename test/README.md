# Helper files for javascript development outside the container

- MockCordova.js: mocks just enough cordova functions to allow testing of plugins outside a container
- MockSmartStore.js: a mock smartstore (all in javascript)
- MockSDKInfo.js: mocks the SDK info native implementation
- test.html: runs SFSmartStoreTestSuite.js, SFSmartStoreLoadTestSuite.js and SFSDKInfoTestSuite.js, ForceEntityTestSuite.js outside the container by leveraging MockCordova.js and MockSmartStore.js and MockSDKInfo.js

When writing an application using SmartStore, to test it outside the container do the following:
- include MockCordova.js instead of cordova-xyz.js
- include MockSmartStore.js after cordova.force.js


# Running the tests in a browser

1. Install proxy server

Because of the browser's cross-origin restrictions, your JavaScript application hosted on your own server (or localhost) will not be able to make API calls directly to the *.salesforce.com domain. The solution is to proxy your API calls through your own server. The easiest it to use [ForceServer](https://github.com/ccoenraets/force-server), a simple development server for Force.com. To install ForceServer, make sure Node.js is installed on your system, open a command prompt and execute the following command:

    ```
    npm install -g force-server
    ```

    On a Mac, you may have to use sudo:

    ```
    sudo npm install -g force-server
    ```
    
2. Run the server.

    Open a command prompt, navigate to your the root directory of your SalesforceMobileSDK-Shared directory and type the following command:

    ```
    force-server
    ```

    This starts the ForceServer server on port 8200.
    Navigate to http://localhost:8200/test/test.html in a browser.
