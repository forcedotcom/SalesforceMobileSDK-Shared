# Salesforce.com Mobile SDK Shared 
This repository contains JavaScript artifacts that are shared between the different Salesforce Mobile SDK repositories. 
For more information, please check out the [Salesforce Mobile SDK for Android](https://github.com/forcedotcom/SalesforceMobileSDK-Android/), or the [Salesforce Mobile SDK for iOS](https://github.com/forcedotcom/SalesforceMobileSDK-iOS).

# /libs

Contains all the SalesforceMobileSDK JavaScript libraries.

**cordova.force.js**

Contains all the Cordova plugins for the SalesforceMobileSDK (oauth / smartstore / sdkinfo).
Includes this library after cordova.js in your HTML application.

**forcetk.mobilesdk.js**

Library to do REST API calls from JavaScript.

**smartsync.js**

Contains the new SDK 2.0 SmartSync data library. 
This library depends on forcetk.mobilesdk.js and cordova.force.js. It also requires jquery, underscore and backbone.

# /test

Contains all the tests for the SalesforceMobileSDK JavaScript libraries.

**test.html**

HTML page to run the tests outside the container.

**MockCordova.js, MockSDKInfo.js, MockSmartStore.js**

Libraries used to mock the container when running tests directly in a browser.

**SFTestSuite.js, SFAbstractSmartStoreTestSuite.js**

Super class of test suites.

**SFSmartStoreTestSuite.js, SFLSmartStoreLoadTestSuite.js**

Test suites for SmartStore.

**SFSmartSyncTestSuite.js**

Test suite for the new SDK 2.0 SmartSync library.
