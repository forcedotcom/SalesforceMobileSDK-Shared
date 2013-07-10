# Helper files for javascript development outside the container

- MockCordova.js: mocks just enough cordova functions to allow testing of plugins outside a container
- MockSmartStore.js: a mock smartstore (all in javascript)
- MockSDKInfo.js: mocks the SDK info native implementation
- test.html: runs SFSmartStoreTestSuite.js, SFSmartStoreLoadTestSuite.js and SFSDKInfoTestSuite.js, ForceEntityTestSuite.js outside the container by leveraging MockCordova.js and MockSmartStore.js and MockSDKInfo.js

When writing an application using SmartStore, to test it outside the container do the following:
- include MockCordova.js instead of cordova-xyz.js
- include MockSmartStore.js after cordova.force.js


