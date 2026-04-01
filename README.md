# Salesforce Mobile SDK Shared JavaScript Libraries

This repository contains JavaScript libraries and Cordova plugin source code that are shared across the Hybrid Mobile SDK implementations for iOS and Android.

## Overview

The Shared repository provides the **JavaScript layer** for Cordova-based hybrid applications that integrate with the Salesforce platform. It serves as a submodule dependency for both the iOS and Android hybrid implementations.

### Repository Role

```
SalesforceMobileSDK-Shared (source of truth)
              │
       ┌──────┴──────┐
       │             │
       ▼             ▼
Android (submodule)  iOS-Hybrid (submodule)
       │             │
       └──────┬──────┘
              │
              ▼
      CordovaPlugin
      (copies files)
              │
              ▼
      Hybrid Templates
```

This repo is included as a git submodule in:
- [SalesforceMobileSDK-Android](https://github.com/forcedotcom/SalesforceMobileSDK-Android) at `external/shared/`
- [SalesforceMobileSDK-iOS-Hybrid](https://github.com/forcedotcom/SalesforceMobileSDK-iOS-Hybrid) at `external/shared/`

## JavaScript Libraries

### `/libs` Directory

Contains all the Salesforce Mobile SDK JavaScript libraries:

**cordova.force.js**
- Cordova plugins for OAuth, SmartStore, MobileSync, and SDKInfo
- Bridges JavaScript to native iOS and Android implementations
- Include after `cordova.js` in your HTML application

**force.js**
- Callback-based REST API client for Salesforce
- Query, create, update, delete, and upsert operations
- SOQL and SOSL query support
- Automatic token refresh

**force+files.js**
- File upload and download utilities
- Integration with Salesforce Files (Chatter Files)
- Base64 encoding/decoding helpers

**force+promise.js**
- Promise-based wrapper around force.js
- Modern async/await compatible API
- Preferred for new development

**mobilesync.js**
- High-level data synchronization framework
- Bidirectional sync between SmartStore and Salesforce
- Conflict detection and resolution
- Depends on force.js, cordova.force.js, underscore.js, and backbone.js

### Usage Example

```html
<!DOCTYPE html>
<html>
<head>
    <script src="cordova.js"></script>
    <script src="cordova.force.js"></script>
    <script src="force.js"></script>
    <script src="mobilesync.js"></script>
</head>
<body>
    <script>
        // Query Salesforce
        force.query('SELECT Id, Name FROM Account LIMIT 10',
            function(response) {
                console.log('Found ' + response.totalSize + ' accounts');
            },
            function(error) {
                console.error('Query failed:', error);
            }
        );

        // Or use promises
        force.query('SELECT Id, Name FROM Contact')
            .then(function(response) {
                console.log('Contacts:', response.records);
            });
    </script>
</body>
</html>
```

## Test Suites

### `/test` Directory

Contains comprehensive test suites for the JavaScript libraries:

**test.html**
- HTML test runner page
- Can run in browser (with mocks) or Cordova WebView (with real plugins)

**Test Infrastructure**:
- `SFTestSuite.js` - Base test framework
- `SFAbstractSmartStoreTestSuite.js` - SmartStore test base class
- `MockCordova.js` - Mock Cordova for browser testing
- `MockSmartStore.js` - Mock SmartStore plugin
- `MockMobileSyncPlugin.js` - Mock MobileSync plugin

**Test Suites**:
- `SFSmartStoreTestSuite.js` - SmartStore CRUD, indexing, and Smart SQL tests
- `SFSmartStoreLoadTestSuite.js` - SmartStore performance tests
- `SFMobileSyncTestSuite.js` - MobileSync synchronization tests

### Running Tests

**In a browser** (uses mocks for Cordova plugins):
```bash
open test/test.html
```

**In a Cordova app** (uses real native plugins):
1. Create a hybrid app using templates
2. Copy `test/test.html` to the app's `www/` directory
3. Run the app on a device or simulator

## Sample Applications

### `/samples` Directory

Demo applications showcasing SDK features:

| Sample | Description |
|--------|-------------|
| **mobilesyncexplorer** | Complete MobileSync demo with offline sync |
| **smartstoreexplorer** | SmartStore operations and Smart SQL queries |
| **accounteditor** | CRUD operations on Account records |
| **contactexplorer** | Contact list browser with search |
| **fileexplorer** | File upload/download operations |
| **userlist** | User list with Salesforce data |
| **usersearch** | User search functionality |
| **userandgroupsearch** | Combined user and group search |
| **simplesyncreact** | React-based sync sample |
| **vfconnector** | Visualforce connector sample |

### Running Samples

Samples are designed to run in a Cordova environment:
1. Create a hybrid app using the SDK templates
2. Replace the `www/` directory content with sample code
3. Build and run on iOS or Android device/simulator

## Dependencies

### `/dependencies` Directory

Third-party JavaScript libraries used by the SDK:

- **backbone** - MVC framework (required by mobilesync.js)
- **underscore** - Utility library (required by mobilesync.js and Backbone)
- **jquery** - DOM manipulation and AJAX
- **promise-polyfill** - Promise support for older browsers
- **qunit** - Unit testing framework
- **react** - UI framework (for React samples)
- **ratchet** - Mobile UI framework
- **fastclick** - Touch event optimization for mobile

## Development

### Prerequisites

- **Git**: Required for cloning and submodule management
- **Text editor**: Any editor for JavaScript development
- **Web browser**: For running tests with mocks
- **Cordova environment**: For testing with real plugins (iOS/Android)

### Making Changes

1. **Clone the repository**:
```bash
git clone https://github.com/forcedotcom/SalesforceMobileSDK-Shared.git
cd SalesforceMobileSDK-Shared
```

2. **Make changes** to JavaScript files in `libs/`

3. **Test in browser**:
```bash
open test/test.html
```

4. **Test in iOS/Android**:
   - Update submodule in iOS-Hybrid or Android repository
   - Build and test in actual hybrid app

5. **Commit and push**:
```bash
git add .
git commit -m "Description of changes"
git push origin dev
```

### Submodule Updates

After changes are merged, dependent repositories must update their submodules:

**In iOS-Hybrid or Android repos**:
```bash
cd external/shared
git checkout dev
git pull origin dev
cd ../..
git add external/shared
git commit -m "Update Shared submodule"
```

## Distribution

### To CordovaPlugin Repository

The [SalesforceMobileSDK-CordovaPlugin](https://github.com/forcedotcom/SalesforceMobileSDK-CordovaPlugin) repository uses a script to copy files from this repo (and others) to create the final Cordova plugin package:

```bash
cd SalesforceMobileSDK-CordovaPlugin
./tools/update.sh -b dev -o all
```

This copies JavaScript libraries from `libs/` to the Cordova plugin's `www/` directory.

## Version Compatibility

| Shared SDK | iOS SDK | Android SDK | Cordova iOS | Cordova Android |
|-----------|---------|-------------|-------------|-----------------|
| 13.2.0    | 13.2.0  | 13.2.0      | 7.1.1       | 14.0.1          |
| 13.1.0    | 13.1.0  | 13.1.0      | 7.1.0       | 13.0.0          |
| 13.0.0    | 13.0.0  | 13.0.0      | 7.1.0       | 13.0.0          |

See [release notes](https://github.com/forcedotcom/SalesforceMobileSDK-Shared/releases) for detailed version history.

## Documentation

### Developer Resources
- **Mobile SDK Development Guide**: https://developer.salesforce.com/docs/platform/mobile-sdk/guide
- **Mobile SDK Trail**: https://trailhead.salesforce.com/trails/mobile_sdk_intro
- **Cordova Documentation**: https://cordova.apache.org/docs/

### Related Repositories
- **iOS Hybrid**: https://github.com/forcedotcom/SalesforceMobileSDK-iOS-Hybrid
- **Android**: https://github.com/forcedotcom/SalesforceMobileSDK-Android
- **Cordova Plugin**: https://github.com/forcedotcom/SalesforceMobileSDK-CordovaPlugin
- **Templates**: https://github.com/forcedotcom/SalesforceMobileSDK-Templates

## Support

- **Issues**: [GitHub Issues](https://github.com/forcedotcom/SalesforceMobileSDK-Shared/issues)
- **Questions**: [Salesforce Stack Exchange](https://salesforce.stackexchange.com/questions/tagged/mobilesdk)
- **Community**: [Trailblazer Community](https://trailhead.salesforce.com/trailblazer-community/groups/0F94S000000kH0HSAU)

## Contributing

We welcome contributions! Please:
1. Read the [CLAUDE.md](CLAUDE.md) file for development guidelines
2. Follow existing JavaScript code style
3. Write or update tests for new functionality
4. Test on both iOS and Android platforms
5. Submit a pull request with a clear description

## License

Salesforce Mobile SDK License. See [LICENSE](LICENSE) file for details.
