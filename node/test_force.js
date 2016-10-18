#!/usr/bin/env node

// Enums
var COLOR = {
    'red': '\x1b[31;1m',
    'green': '\x1b[32;1m',
    'yellow': '\x1b[33;1m',
    'magenta': '\x1b[35;1m',
    'cyan': '\x1b[36;1m',
    'reset': '\x1b[0m'
};

var OS = {
    'ios': 'ios',
    'android': 'android'
};

var APP_TYPE = {
    'native': 'native',
    'react_native': 'react_native',
    'native_swift': 'native_swift',
    'hybrid_local': 'hybrid_local',
    'hybrid_remote': 'hybrid_remote'
}

// Dependencies
var execSync = require('child_process').execSync,
    path = require('path'),
    commandLineUtils = require('./commandLineUtils'),
    miscUtils = require('./utils'),
    shelljs
;

shelljs = require('shelljs');

// Calling main
main(process.argv);

// 
// Main function
// 
function main(args) {
    var commandLineArgs = process.argv.slice(2, args.length);
    var parsedArgs = commandLineUtils.parseArgs(commandLineArgs);

    // Args extraction
    var usageRequested = parsedArgs.hasOwnProperty('usage');
    var version = parsedArgs.version || '5.0.0';
    var chosenOperatingSystems = cleanSplit(parsedArgs.os, ',');
    var fork = parsedArgs.fork || 'forcedotcom';
    var branch = parsedArgs.branch || 'unstable';
    var pluginFork = parsedArgs.plugin_fork || 'forcedotcom';
    var pluginBranch = parsedArgs.plugin_branch || 'unstable';
    var chosenAppTypes = cleanSplit(parsedArgs.test, ',');
    var testingIOS = chosenOperatingSystems.indexOf(OS.ios) >= 0;
    var testingAndroid = chosenOperatingSystems.indexOf(OS.android) >= 0;
    var testingHybrid = chosenAppTypes.indexOf(APP_TYPE.hybrid_local) >= 0 || chosenAppTypes.indexOf(APP_TYPE.hybrid_remote) >= 0;

    // Validation
    validateVersion(version);
    validateOperatingSystems(chosenOperatingSystems);
    validateAppTypes(chosenAppTypes);

    // Usage
    if (usageRequested || (!testingIOS && !testingAndroid) || chosenAppTypes.length === 0) {
        usage();
        process.exit(1);
    }

    // Actual testing
    cleanup();
    var tmpDir = mkTmpDir();

    // Get ios repo if requested
    if (testingIOS) {
        var repoName = 'SalesforceMobileSDK-iOS';
        var repoDir = cloneRepo(tmpDir, fork, repoName, branch);
        runProcessThrowError('sh install.sh', repoDir);
        createDeployForcePackage(repoDir, tmpDir, OS.ios, version);
        editCreateAppToNotDoPodInstall(tmpDir);
    }

    // Get android repo if requested
    if (testingAndroid) {
        var repoName = 'SalesforceMobileSDK-Android';
        var repoDir = cloneRepo(tmpDir, fork, repoName, branch);
        runProcessThrowError((require('os').platform() == 'win32' ? 'cscript install.vbs' : 'sh install.sh'), repoDir);
        createDeployForcePackage(repoDir, tmpDir, OS.android, version);
    }

    // Get cordova plugin repo if any hybrid testing requested
    if (testingHybrid) {
        var pluginRepoDir = cloneRepo(tmpDir, pluginFork, 'SalesforceMobileSDK-CordovaPlugin', pluginBranch);
        if (testingIOS) updatePluginRepo(tmpDir, pluginRepoDir, branch, OS.ios);
        if (testingAndroid) updatePluginRepo(tmpDir, pluginRepoDir, branch, OS.android);
        if (testingIOS) editForceScriptToUseLocalPluginRepo(tmpDir, OS.ios);
        if (testingAndroid) editForceScriptToUseLocalPluginRepo(tmpDir, OS.android);
    }
    
    // Test all the platforms / app types requested
    for (var i=0; i<chosenOperatingSystems.length; i++) {
        var os = chosenOperatingSystems[i];
        for (var j=0; j<chosenAppTypes.length; j++) {
            var appType = chosenAppTypes[j];
            createCompileApp(tmpDir, appType, os);
        }
    }
}

//
// Usage
//
function usage() {
    log('Usage:',  COLOR.cyan);
    log('  test_force.js --usage\n'
        + 'OR \n'
        + '  test_force.js\n'
        + '    --os=os1,os2,etc\n'
        + '      where osN are : ios, android\n'
        + '    --test=appType1,appType2,etc\n'
        + '      where appTypeN are in: native, native_swift, react_native, hybrid_local, hybrid_remote\n'
        + '    [--version=x.y.z (defaults to 5.0.0)]\n'
        + '    [--fork=FORK (defaults to forcedotcom)]\n'
        + '    [--branch=BRANCH (defaults to unstable)]\n'
        + '    [--plugin_fork=PLUGIN_FORK (defaults to forcedotcom)]\n'
        + '    [--plugin_branch=PLUGIN_BRANCH (defaults to unstable)]\n'
        + '\n'
        + '  If ios is targeted:\n'
        + '  - clones https://github.com/FORK/SalesforceMobileSDK-iOS at branch BRANCH\n'
        + '  - runs install.sh\n'
        + '  - generates forceios package and deploys it to a temporary directory\n'
        + '  - creates and compile the application types selected\n'
        + '\n'
        + '  If android is targeted:\n'
        + '  - clones https://github.com/FORK/SalesforceMobileSDK-Android at branch BRANCH\n'
        + '  - runs install.sh or install.vbs\n'
        + '  - generates forcedroid package and deploys it to a temporary directory\n'
        + '  - creates and compile the application types selected\n'
        + '\n'
        + '  If native is targeted (for ios):\n'
        + '  - it also edits podfile of generated app to point to local clone of SalesforceMobileSDK-iOS\n'
        + '\n'
        + '  If hybrid is targeted:\n'
        + '  - clones https://github.com/PLUGIN_FORK/SalesforceMobileSDK-CordovaPlugin at branch PLUGIN_BRANCH\n'
        + '  - runs ./tools/update.sh -b BRANCH to update clone of plugin repo\n'
        + '  - edit node_modules/force<ios|droid>/node/force<ios|droid>.js to cordova plugin add from the local clone of the plugin repo\n'
        , COLOR.magenta);
}

//
// Cleanup
//
function cleanup() {
    log('Cleaning up temp dirs', COLOR.green);
    shelljs.rm('-rf', 'tmp');
}

//
// Make temp dir and return its path
//
function mkTmpDir() {
    var tmpDir = path.join('tmp', 'testforce' + random(1000));
    log('Making temp dir:' + tmpDir, COLOR.green);
    shelljs.mkdir('-p', tmpDir);
    return tmpDir;
}

//
// Clone repo and returns its path
// 
function cloneRepo(tmpDir, fork, repoName, branch) {
    var repoUrl = 'https://github.com/' + fork + '/' + repoName;
    log('Cloning ' + repoUrl + ' at ' + branch, COLOR.green);
    var repoDir = path.join(tmpDir, repoName);
    shelljs.mkdir('-p', repoDir);
    runProcessThrowError('git clone --branch ' + branch + ' --single-branch --depth 1 --recurse-submodules ' + repoUrl + ' ' + repoDir);
    return repoDir;
}

//
// Create and deploy forceios/forcedroid
//
function createDeployForcePackage(repoDir, tmpDir, os, version) {
    log('Generating ' + forcePackageNameForOs(os) + ' package', COLOR.green);
    var buildNpmPath = os === OS.ios ? path.join(repoDir, 'build', 'build_npm.xml') : path.join(repoDir, 'build_npm.xml');
    runProcessThrowError('ant -f ' + buildNpmPath);
    runProcessThrowError('npm install --prefix ' + tmpDir + ' ' + path.join(repoDir, forcePackageNameForOs(os) + '-' + version + '.tgz'));
}

//
// Create and compile app 
//
function createCompileApp(tmpDir, appType, os) {
    if (appType === APP_TYPE.native_swift && os === OS.android) return; // that app type doesn't exist for android

    var target = appType + ' app for ' + os;
    log('==== ' + target + ' ====', COLOR.green);
    var appName = appType + os + 'App';
    var appId = '3MVG9Iu66FKeHhINkB1l7xt7kR8czFcCTUhgoA8Ol2Ltf1eYHOU4SqQRSEitYFDUpqRWcoQ2.dBv_a1Dyu5xa';
    var callbackUri = 'testsfdc:///mobilesdk/detect/oauth/done';
    var appDir = path.join(tmpDir, appName);
    var forcePath = path.join(tmpDir, 'node_modules', '.bin', forcePackageNameForOs(os));

    var forceArgs = 'create '
        + ' --apptype=' + appType
        + ' --appname=' + appName;

    if (os == OS.ios) {
        // ios only args
        forceArgs += ' --companyid=com.mycompany'
            + ' --organization=MyCompany'
            + ' --outputdir=' + tmpDir
            + ' --appid=' + appId
            + ' --callbackuri=' + callbackUri
            + ' --startPage=/apex/testPage';
    }
    else {
        // android only args
        var targetDir;

        if (appType.indexOf('native')>=0) {
            targetDir = appDir;
            shelljs.mkdir('-p', targetDir);
        }
        else {
            targetDir = tmpDir;
        }

        forceArgs += ' --packagename=com.mycompany'
            + ' --targetdir=' + targetDir
            + ' --usesmartstore=yes'
            +' --startpage=/apex/testPage';
    }

    // Generation
    var generationSucceeded = runProcessCatchError(forcePath + ' ' + forceArgs, 'GENERATING ' + target);

    if (!generationSucceeded) {
        return; // no point continuing
    }

    // Compilation
    if (appType.indexOf('native') >=0) {
        if (os == OS.ios) {
            // IOS - Native
            editPodfileToUseLocalRepo(appDir);
            var workspacePath = path.join(appDir, appName + '.xcworkspace');
            runProcessThrowError('pod update', appDir);    
            runProcessCatchError('xcodebuild -workspace ' + workspacePath 
                                 + ' -scheme ' + appName
                                 + ' clean build CODE_SIGN_IDENTITY="" CODE_SIGNING_REQUIRED=NO', 
                                 'COMPILING ' + target); 
        }
        else {
            // Android - Native
            var gradle = isWindows() ? '.\\gradlew.bat' : './gradlew';
            runProcessCatchError(gradle + ' assembleDebug', 'COMPILING ' + target, appDir);
        }
    }
    else {
        if (os == OS.ios) {
            // IOS - Native
            runProcessCatchError('cordova build', 'COMPILING ' + target, appDir);    
        }
        else {
            // Android - Native
            var gradle = isWindows() ? '.\\gradlew.bat' : './gradlew';
            runProcessCatchError(gradle + ' assembleDebug', 'COMPILING ' + target, path.join(appDir, 'platforms', 'android'));
        }
    }
}

//
// Update cordova plugin repo
//
function updatePluginRepo(tmpDir, pluginRepoDir, branch, os) {
    log('Updating cordova plugin at ' + branch, COLOR.green);
    runProcessThrowError(path.join('tools', 'update.sh') + ' -b ' + branch + ' -o ' + os, pluginRepoDir);
}

//
// Update forceios/forcedroid script to use local plugin repo
//
function editForceScriptToUseLocalPluginRepo(tmpDir, os) {
    log('Editing  ' + forcePackageNameForOs(os) + '.js to use local cordova plugin', COLOR.green);
    miscUtils.replaceTextInFile(path.join(tmpDir, 'node_modules', forcePackageNameForOs(os), 'node', forcePackageNameForOs(os) + '.js'), new RegExp('\'cordova plugin add .*\'', 'g'), '\'cordova plugin add ../SalesforceMobileSDK-CordovaPlugin\'');
}

//
// Update createApp.sh to not do pod install
// 
function editCreateAppToNotDoPodInstall(tmpDir) {
    log('Editing  createApp.sh to not do pod install', COLOR.green);
    miscUtils.replaceTextInFile(path.join(tmpDir, 'node_modules', 'forceios', 'build', 'app_template_files', 'createApp.sh'), new RegExp('^\\s*pod install', 'g'), '# pod install');

}


//
// Update podfile to use local ios repo
// 
function editPodfileToUseLocalRepo(appDir) {
    log('Editing podfile to use local ios repo', COLOR.green);
    miscUtils.replaceTextInFile(path.join(appDir, 'Podfile'), new RegExp('pod (\'Salesforce.*\')', 'g'), 'pod $1, :path => \'../SalesforceMobileSDK-iOS\'');
    miscUtils.replaceTextInFile(path.join(appDir, 'Podfile'), new RegExp('pod (\'Smart.*\')', 'g'), 'pod $1, :path => \'../SalesforceMobileSDK-iOS\'')
}

//
// Helper to run arbitrary shell command - errors caught (and reported)
// Returns true if successful
//
function runProcessCatchError(cmd, msg, dir) {
    var success = false;
    log('Running: ' + cmd);
    if (dir) shelljs.pushd(dir);
    try {
        execSync(cmd);
        if (msg) log('!SUCCESS! ' + msg, COLOR.yellow);
        success = true;
    } catch (err) {
        if (msg) log('!FAILURE! ' + msg, COLOR.red);
        console.error(err.stderr.toString());
    }
    finally {
        if (dir) shelljs.popd();
        return success;
    }
}

//
// Helper to run arbitrary shell command - errors thrown
//
function runProcessThrowError(cmd, dir) {
    log('Running: ' + cmd);
    if (dir) shelljs.pushd(dir);
    try {
        execSync(cmd);
    }
    finally {
        if (dir) shelljs.popd();
    }
}

//
// Print important information
//
function log(msg, color) {
    if (color) {
        console.log(color + msg + COLOR.reset);
    }
    else {
        console.log(msg);
    }
}


//
// Return random number between n/10 and n
//
function random(n) {
    return (n/10)+Math.floor(Math.random()*(9*n/10));
}

//
// Helper to validate version
// 
function validateVersion(version) {
    if (version.match(/\d\.\d\.\d/) == null) {
            log('Invalid version: ' + version, COLOR.red);
            process.exit(1);
    }
}

//
// Helper to validate operating systems
//
function validateOperatingSystems(chosenOperatingSystems) {
    for (var i=0; i<chosenOperatingSystems.length; i++) {
        var os = chosenOperatingSystems[i];
        if (!OS.hasOwnProperty(os) || (isWindows() && os === OS.ios)) {
            log('Invalid os: ' + os, COLOR.red);
            process.exit(1);
        }
    }
}

// 
// Helper to validate app types
//
function validateAppTypes(chosenAppTypes) {
    for (var i=0; i<chosenAppTypes.length; i++) {
        var appType = chosenAppTypes[i];
        if (!APP_TYPE.hasOwnProperty(appType)) {
            log('Invalid appType: ' + appType, COLOR.red);
            process.exit(1);
        }
    }
}


// 
// Like split, but splitting null returns [] instead of throwing an error
//                 splitting '' returns [] instead of ['']
//
//
function cleanSplit(str, delimiter) {
    if (str == null || str === '') {
        return [];
    }
    else {
        return str.split(delimiter);
    }
}

//
// Return forceios for ios and forcedroid for android
//
function forcePackageNameForOs(os) {
    switch(os) {
        case OS.android: return 'forcedroid';
        case OS.ios: return 'forceios';
    }
}

//
// Return true if running on Windows
//
function isWindows() {
    return /^win/.test(process.platform);
}
