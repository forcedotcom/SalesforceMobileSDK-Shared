# Salesforce.com Mobile SDK Shared 
This repository contains JavaScript artifacts that are shared between the different Salesforce Mobile SDK repositories. 
For more information, please check out the [Salesforce Mobile SDK for Android](https://github.com/forcedotcom/SalesforceMobileSDK-Android/), or the [Salesforce Mobile SDK for iOS Hybrid](https://github.com/forcedotcom/SalesforceMobileSDK-iOS-Hybrid).

# /libs

Contains all the SalesforceMobileSDK JavaScript libraries.

**cordova.force.js**

Contains all the Cordova plugins for the SalesforceMobileSDK (oauth / smartstore / sdkinfo).
Includes this library after cordova.js in your HTML application.

**force.js**

Library to do REST API calls from JavaScript.

**force+files.js**

Library to do file related REST API calls from JavaScript.

**force+promise.js**

Library to do REST API calls from JavaScript using promises instead of callbacks.

**mobilesync.js**

Contains the MobileSync data library. 
This library depends on force.js and cordova.force.js. It also requires underscore and backbone.

# /test

Contains all the tests for the SalesforceMobileSDK JavaScript libraries.

**test.html**

HTML page to run the tests outside the container.

**MockCordova.js, MockSDKInfo.js, MockSmartStore.js, MockMobileSyncPlugin.js**

Libraries used to mock the container when running tests directly in a browser.

**SFTestSuite.js, SFAbstractSmartStoreTestSuite.js**

Super class of test suites.

**SFSmartStoreTestSuite.js, SFLSmartStoreLoadTestSuite.js**

Test suites for SmartStore.

**SFMobileSyncTestSuite.js**

Test suite for MobileSync library.
