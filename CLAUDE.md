# CLAUDE.md — Salesforce Mobile SDK Shared JavaScript Libraries

---

## About This Project

The Salesforce Mobile SDK Shared repository contains JavaScript libraries and Cordova plugin source code that are shared across the Hybrid Mobile SDK implementations for iOS and Android. This is a **foundational repository** that provides the JavaScript layer for Cordova-based hybrid applications.

**Key constraint**: This is a **public SDK** and a **submodule dependency** of both Android and iOS-Hybrid repositories. Every change impacts hybrid apps across both platforms. Backward compatibility and cross-platform consistency are critical.

## Repository Role in SDK Architecture

This repository serves as the **source of truth** for hybrid JavaScript code:

```
SalesforceMobileSDK-Shared (this repo)
  ├── JavaScript Libraries (libs/)
  │   ├── cordova.force.js      - Cordova plugins
  │   ├── force.js              - REST API client
  │   ├── mobilesync.js         - Data sync framework
  │   └── force+*.js            - Extensions (promises, files)
  │
  ├── Test Suites (test/)
  │   └── JavaScript tests for SmartStore, MobileSync
  │
  ├── Sample Apps (samples/)
  │   └── HTML/JS sample applications
  │
  └── Dependencies (dependencies/)
      └── Third-party libraries (jQuery, Backbone, etc.)

           │
    ┌──────┴──────┐
    │             │
    ▼             ▼
Android Repo   iOS-Hybrid Repo
(submodule)    (submodule)
    │             │
    └──────┬──────┘
           │
           ▼
    CordovaPlugin Repo
    (copies from all sources)
           │
           ▼
     Hybrid Templates
     (use Cordova plugin)
```

### Submodule Relationships

This repo is included as a git submodule in:
- **SalesforceMobileSDK-Android** at `external/shared/`
- **SalesforceMobileSDK-iOS-Hybrid** at `external/shared/`

### Distribution to CordovaPlugin

The `SalesforceMobileSDK-CordovaPlugin` repository runs `tools/update.sh` to copy JavaScript files from this repo to create the final Cordova plugin package.

## Repository Structure

```
SalesforceMobileSDK-Shared/
├── libs/                         # Core JavaScript libraries
│   ├── cordova.force.js          # Cordova plugins (OAuth, SmartStore, MobileSync, SDKInfo)
│   ├── force.js                  # REST API client (callbacks)
│   ├── force+files.js            # File upload/download utilities
│   ├── force+promise.js          # Promise-based REST API client
│   └── mobilesync.js             # Data synchronization framework
│
├── test/                         # Test suites
│   ├── test.html                 # Test runner HTML page
│   ├── SFTestSuite.js            # Test framework base class
│   ├── SFSmartStoreTestSuite.js  # SmartStore tests
│   ├── SFMobileSyncTestSuite.js  # MobileSync tests
│   ├── MockCordova.js            # Mock Cordova for browser testing
│   ├── MockSmartStore.js         # Mock SmartStore plugin
│   └── MockMobileSyncPlugin.js   # Mock MobileSync plugin
│
├── samples/                      # Sample applications
│   ├── accounteditor/            # Account CRUD sample
│   ├── contactexplorer/          # Contact browser sample
│   ├── smartstoreexplorer/       # SmartStore demo
│   ├── mobilesyncexplorer/       # MobileSync demo
│   ├── fileexplorer/             # File operations sample
│   ├── userlist/                 # User list sample
│   ├── usersearch/               # User search sample
│   ├── userandgroupsearch/       # User and group search
│   ├── simplesyncreact/          # React-based sync sample
│   └── vfconnector/              # Visualforce connector sample
│
├── dependencies/                 # Third-party dependencies
│   ├── backbone/                 # Backbone.js (for MobileSync)
│   ├── jquery/                   # jQuery
│   ├── underscore/               # Underscore.js (for MobileSync)
│   ├── promise-polyfill/         # Promise polyfill
│   ├── qunit/                    # QUnit testing framework
│   ├── react/                    # React.js
│   ├── ratchet/                  # Ratchet mobile UI framework
│   ├── ratchet2/                 # Ratchet v2
│   └── fastclick/                # FastClick for mobile
│
├── gen/                          # Generated plugin files
│   ├── plugins/                  # Cordova plugin format
│   └── plugins_with_define/      # AMD module format
│
├── tools/                        # Build and generation scripts
└── credshelper/                  # Credential helper utilities
```

## JavaScript Libraries

### cordova.force.js
**Purpose**: Cordova plugins that bridge JavaScript to native iOS/Android SDK functionality

**Plugins**:
- **oauth**: Authentication, user management, logout
- **smartstore**: Encrypted local storage (soup operations, Smart SQL)
- **mobilesync**: Data synchronization (sync up/down, sync targets)
- **sdkinfo**: SDK version information
- **network**: REST API requests to Salesforce
- **sfaccountmanager**: Multi-user account management

**Usage**: Include after `cordova.js` in HTML:
```html
<script src="cordova.js"></script>
<script src="cordova.force.js"></script>
```

### force.js
**Purpose**: Callback-based REST API client for Salesforce

**Features**:
- Query, create, update, delete, upsert operations
- SOQL and SOSL queries
- Metadata describe operations
- Bulk API access
- Automatic token refresh on 401

**Usage**:
```javascript
force.query('SELECT Id, Name FROM Account',
    function(response) { /* success */ },
    function(error) { /* error */ }
);
```

### force+promise.js
**Purpose**: Promise-based wrapper around force.js

**Usage**:
```javascript
force.query('SELECT Id, Name FROM Account')
    .then(function(response) { /* success */ })
    .catch(function(error) { /* error */ });
```

### force+files.js
**Purpose**: File upload and download utilities

**Features**:
- File upload to Salesforce Files (Chatter Files)
- File download and caching
- Base64 encoding/decoding

### mobilesync.js
**Purpose**: High-level data synchronization framework

**Dependencies**: Requires `force.js`, `cordova.force.js`, `underscore.js`, and `backbone.js`

**Features**:
- Sync down from Salesforce to SmartStore (SOQL, MRU, layout, metadata targets)
- Sync up from SmartStore to Salesforce (create, update, delete)
- Conflict detection and resolution
- Sync status tracking
- Ghost record cleanup (remove server-deleted records)

**Usage**:
```javascript
// Sync down accounts
Force.syncDown(target, soupName, function(sync) {
    console.log('Sync complete');
});

// Sync up local changes
Force.syncUp(target, soupName, function(sync) {
    console.log('Sync up complete');
});
```

## Testing

### Test Framework

The `test/` directory contains a custom JavaScript test framework and test suites:

**Test Runner**: Open `test/test.html` in a browser or Cordova WebView to run tests

**Test Suites**:
- `SFSmartStoreTestSuite.js` - SmartStore CRUD, indexing, Smart SQL tests
- `SFMobileSyncTestSuite.js` - Sync down, sync up, conflict resolution tests

**Mock Infrastructure**:
Tests can run in a browser using mock implementations:
- `MockCordova.js` - Mocks Cordova exec()
- `MockSmartStore.js` - Mocks SmartStore plugin
- `MockMobileSyncPlugin.js` - Mocks MobileSync plugin

**Running Tests**:
```bash
# In a browser (uses mocks)
open test/test.html

# In a Cordova app (uses real plugins)
# Load test/test.html in the app's WebView
```

### Test Coverage

Tests verify:
- **SmartStore**: Soup registration, CRUD operations, indexing, Smart SQL queries, encryption
- **MobileSync**: Sync targets, sync down/up, conflict resolution, sync status
- **REST API**: Query, create, update, delete operations
- **OAuth**: Authentication, logout, token refresh

## Code Standards

### JavaScript Standards
- **ES5 compatible**: Code must run in older WebView implementations
- **No strict mode**: For compatibility with older Cordova environments
- **Namespace pollution**: Use `Force` global namespace for public APIs
- **jQuery style**: Callback-based APIs for backward compatibility
- **Promise support**: Available via `force+promise.js` extension
- **Linting**: Follow existing code style (no enforced linter currently)

### Naming Conventions
- **Functions**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Namespaces**: `Force`, `cordova.require('com.salesforce.*')`

### Compatibility Requirements
- **WebView**: Must work in iOS WKWebView and Android WebView
- **Cordova**: Compatible with Cordova 7.x - 14.x
- **Mobile SDK**: Matches native iOS and Android SDK versions
- **Browsers**: Should work in modern browsers for testing with mocks

## Development Workflow

### Making Changes

1. **Modify JavaScript** in `libs/`
2. **Update tests** in `test/` if behavior changes
3. **Test in browser** using `test/test.html` with mocks
4. **Test in iOS app** (update submodule in iOS-Hybrid repo)
5. **Test in Android app** (update submodule in Android repo)
6. **Generate plugin files** in `gen/` if needed
7. **Document changes** for consumption by CordovaPlugin repo

### Submodule Update Process

When changes are merged to this repo, dependent repos must update their submodules:

**In SalesforceMobileSDK-Android**:
```bash
cd external/shared
git checkout dev
git pull origin dev
cd ../..
git add external/shared
git commit -m "Update Shared submodule to <commit-sha>"
```

**In SalesforceMobileSDK-iOS-Hybrid**:
```bash
cd external/shared
git checkout dev
git pull origin dev
cd ../..
git add external/shared
git commit -m "Update Shared submodule to <commit-sha>"
```

### Distribution to CordovaPlugin

After submodules are updated, the CordovaPlugin repo's `tools/update.sh` script copies files during release:
```bash
cd SalesforceMobileSDK-CordovaPlugin
./tools/update.sh -b dev -o all
```

This copies:
- JavaScript from this repo (`libs/`) → `www/`
- iOS bridge code from iOS-Hybrid → `src/ios/`
- Android bridge code from Android → `src/android/`

## Sample Applications

The `samples/` directory contains demo apps that showcase SDK features:

### Key Samples
- **mobilesyncexplorer** - Complete MobileSync demo with offline sync
- **smartstoreexplorer** - SmartStore operations and Smart SQL
- **accounteditor** - CRUD operations on Account records
- **contactexplorer** - Contact list with search
- **fileexplorer** - File upload/download operations

### Running Samples

Samples are HTML/JavaScript apps designed to run in a Cordova environment. To run:
1. Create a hybrid app using Templates
2. Replace `www/` content with sample code
3. Build and run on device/simulator

## Code Review Checklist

When reviewing PRs:

- [ ] **Cross-platform impact**: Does this work on both iOS and Android?
- [ ] **Backward compatibility**: No breaking changes without deprecation cycle
- [ ] **Tests updated**: Test suites reflect behavior changes
- [ ] **Browser testable**: Tests pass in browser with mocks
- [ ] **Device tested**: Verified on both iOS and Android devices
- [ ] **Dependencies**: No new dependencies without discussion
- [ ] **Documentation**: Comments explain non-obvious code
- [ ] **Submodule aware**: Consider that this will be used as a submodule
- [ ] **CordovaPlugin impact**: Will update.sh copy correctly?
- [ ] **Sample apps**: Do samples still work?

## Agent Behavior Guidelines

### Do
- Test changes in both browser (with mocks) and device (real plugins)
- Verify changes work in both iOS and Android hybrid apps
- Check that samples still run after changes
- Update test suites when modifying library behavior
- Consider that code will be used as a submodule in other repos
- Reference the Cordova plugin documentation when needed

### Don't
- Don't introduce ES6+ syntax without polyfills (breaks older WebViews)
- Don't add new dependencies without team discussion
- Don't modify the test framework without verifying all tests still pass
- Don't change public APIs without deprecation cycle
- Don't assume changes will auto-propagate (submodules require manual updates)
- Don't merge without testing on actual iOS and Android devices

### Escalation — Stop and Flag for Human Review
- Any change to plugin interfaces (cordova.force.js)
- New public APIs or modification to existing API signatures
- Dependency version bumps or new dependencies
- Changes to test framework infrastructure
- Build script modifications
- Changes affecting OAuth or SmartStore encryption

## Key Domain Concepts

- **Cordova Plugin**: JavaScript module that calls native code via `cordova.exec()`
- **Soup**: SmartStore's encrypted JSON storage unit (like a table)
- **Smart SQL**: SQL dialect for querying soups using `{soupName:fieldPath}` syntax
- **Sync Target**: MobileSync definition of what/how to sync (SOQL, MRU, layout, metadata)
- **Force Global**: The `Force` object that exposes MobileSync APIs
- **Mock Plugins**: JavaScript implementations that fake native plugins for browser testing

## Release Process

This repo follows the Mobile SDK release cycle:

1. **Development**: Work happens on `dev` branch
2. **Testing**: Verify in iOS-Hybrid and Android as submodules
3. **Tag Release**: Tagged with SDK version (e.g., `v13.2.0`)
4. **Update Submodules**: iOS-Hybrid and Android repos update their submodules
5. **CordovaPlugin Update**: CordovaPlugin repo runs `tools/update.sh` to copy files
6. **Template Distribution**: Hybrid templates use the updated Cordova plugin

## Related Documentation

- **Mobile SDK Development Guide**: https://developer.salesforce.com/docs/platform/mobile-sdk/guide
- **iOS-Hybrid Repository**: See `SalesforceMobileSDK-iOS-Hybrid/CLAUDE.md`
- **Android Repository**: See `SalesforceMobileSDK-Android/CLAUDE.md`
- **CordovaPlugin Repository**: See `SalesforceMobileSDK-CordovaPlugin/CLAUDE.md`
- **Templates**: Hybrid templates in `SalesforceMobileSDK-Templates` repository
- **Cordova Documentation**: https://cordova.apache.org/docs/en/latest/
