# SalesforceMobileSDK-Shared

JavaScript source of truth for the Salesforce Mobile SDK hybrid (Cordova) stack.

This repository is included as a git submodule inside both [SalesforceMobileSDK-Android](https://github.com/forcedotcom/SalesforceMobileSDK-Android) (at `external/shared/`) and [SalesforceMobileSDK-iOS-Hybrid](https://github.com/forcedotcom/SalesforceMobileSDK-iOS-Hybrid) (at `external/shared/`). Its generated files are also copied into [SalesforceMobileSDK-CordovaPlugin](https://github.com/forcedotcom/SalesforceMobileSDK-CordovaPlugin).

## `libs/` -- Source JavaScript Files

These are the authoritative source files for the hybrid JavaScript layer:

| File | Description |
|------|-------------|
| `cordova.force.js` | Cordova plugin bridge providing OAuth, SmartStore, MobileSync, Network, SDKInfo, and SFAccountManager plugins. These call into native code via `cordova.exec()`. |
| `force.js` | Callback-based REST API client for Salesforce: SOQL, SOSL, CRUD operations, metadata describe, and automatic token refresh. |
| `force+promise.js` | Promise wrapper around `force.js` for async/await usage. |
| `force+files.js` | Salesforce Files API utilities: upload, download, and caching with base64 encoding. |
| `mobilesync.js` | Data synchronization framework built on Backbone.js: sync down (SOQL/MRU targets), sync up, and conflict detection. |

## `gen/plugins/com.salesforce/` -- Generated Cordova Plugin Files

These files are in Cordova plugin format and are what gets copied to `SalesforceMobileSDK-CordovaPlugin/www/` by the CordovaPlugin's `tools/update.sh` script.

**Do not edit these files directly.** Edit the source in `libs/` and regenerate.

- `com.salesforce.plugin.mobilesync.js`
- `com.salesforce.plugin.network.js`
- `com.salesforce.plugin.oauth.js`
- `com.salesforce.plugin.sdkinfo.js`
- `com.salesforce.plugin.sfaccountmanager.js`
- `com.salesforce.plugin.smartstore.client.js`
- `com.salesforce.plugin.smartstore.js`
- `com.salesforce.util.bootstrap.js`
- `com.salesforce.util.event.js`
- `com.salesforce.util.exec.js`
- `com.salesforce.util.logger.js`
- `com.salesforce.util.promiser.js`
- `com.salesforce.util.push.js`

## `samples/` -- Sample Applications

HTML/JavaScript sample apps used by hybrid sample apps in the Android and iOS-Hybrid repos (which include this repo as a submodule):

- `accounteditor` -- Account CRUD operations
- `contactexplorer` -- Contact list browser with search
- `fileexplorer` -- File upload and download
- `mobilesyncexplorer` -- Offline data sync with MobileSync
- `simplesyncreact` -- React-based sync sample
- `smartstoreexplorer` -- SmartStore operations and Smart SQL
- `userandgroupsearch` -- Combined user and group search
- `userlist` -- User list display
- `usersearch` -- User search
- `vfconnector` -- Visualforce connector

To run a sample, create a hybrid app using the SDK templates, replace the app's `www/` content with the sample code, and build for iOS or Android.

## Submodule Usage

This repository is a git submodule at `external/shared/` in both:

- [SalesforceMobileSDK-Android](https://github.com/forcedotcom/SalesforceMobileSDK-Android)
- [SalesforceMobileSDK-iOS-Hybrid](https://github.com/forcedotcom/SalesforceMobileSDK-iOS-Hybrid)

Hybrid sample apps in those repos reference JavaScript directly from the submodule. When changes are merged here, both repos must update their submodule pointer:

```bash
cd external/shared
git checkout dev
git pull origin dev
cd ../..
git add external/shared
git commit -m "Update Shared submodule"
```

## Making Changes

1. Edit source files in `libs/`.
2. Regenerate the `gen/plugins/com.salesforce/` files.
3. Update the submodule reference in the Android and iOS-Hybrid repos.
4. Run `tools/update.sh` in the CordovaPlugin repo to copy the new generated files into its `www/` directory.

## Related Repositories

| Repository | Role |
|------------|------|
| [SalesforceMobileSDK-CordovaPlugin](https://github.com/forcedotcom/SalesforceMobileSDK-CordovaPlugin) | Distribution package for the Cordova plugin; copies generated files from this repo |
| [SalesforceMobileSDK-Android](https://github.com/forcedotcom/SalesforceMobileSDK-Android) | Native Android SDK; hosts this repo as a submodule for hybrid apps |
| [SalesforceMobileSDK-iOS-Hybrid](https://github.com/forcedotcom/SalesforceMobileSDK-iOS-Hybrid) | Native iOS hybrid bridge; hosts this repo as a submodule for hybrid apps |
