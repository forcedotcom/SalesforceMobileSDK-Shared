# Helper files for javascript development outside the container

- MockCordova.js: mocks just enough cordova functions to allow testing of plugins outside a container
- MockSmartStore.js: a mock smartstore (all in javascript)
- test.html: runs SFSmartStoreTestSuite.js and SFSmartStoreLoadTestSuite.js  outside the container by leveraging MockCordova.js and MockSmartStore.js

When writting an application using SmartStore, to test it outside the container do the following:
- include MockCordova.js instead of cordova-xyz.js
- include MockSmartStore.js after SFSmartStorePlugin.js
- make sure to initialize MockSmartStore before using it by calling MockSmartStore.init(...)


