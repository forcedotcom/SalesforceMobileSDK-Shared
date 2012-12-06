# Helper files for javascript development outside the container

- MockCordova.js: mocks just enough cordova functions to allow testing of plugins outside a container
- MockSmartStore.js: a mock smartstore (all in javascript)
- MockSDKInfo.js: mocks the SDK info native implementation
- test.html: runs SFSmartStoreTestSuite.js, SFSmartStoreLoadTestSuite.js and SFSDKInfoTestSuite.js outside the container by leveraging MockCordova.js and MockSmartStore.js

When writting an application using SmartStore, to test it outside the container do the following:
- include MockCordova.js instead of cordova-xyz.js
- include MockSmartStore.js after SFSmartStorePlugin.js and/or include MockSDKInfo.js after SFHybridApp.js


