#!/usr/bin/env node

// Constant
var version='4.1.0';

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
    shelljs
;

try {
    shelljs = require('shelljs');
}
catch (e) {
    log('You need to run: npm install shelljs, before running test_force.js', COLOR.red);
    process.exit(1);
}

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
    var chosenOperatingSystems = cleanSplit(parsedArgs.os, ',');
    var fork = parsedArgs.fork || 'forcedotcom';
    var branch = parsedArgs.branch || 'unstable';
    var pluginFork = parsedArgs.pluginFork || 'forcedotcom';
    var pluginBranch = parsedArgs.pluginBranch || 'unstable';
    var chosenAppTypes = cleanSplit(parsedArgs.test, ',');
    var testingIOS = chosenOperatingSystems.indexOf(OS.ios) >= 0;
    var testingAndroid = chosenOperatingSystems.indexOf(OS.android) >= 0;
    var testingHybrid = chosenAppTypes.indexOf(APP_TYPE.hybrid_local) >= 0 || chosenAppTypes.indexOf(APP_TYPE.hybrid_remote) >= 0;

    // Validation
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
        createDeployForcePackage(repoDir, tmpDir, OS.ios);
    }

    // Get android repo if requested
    if (testingAndroid) {
        var repoName = 'SalesforceMobileSDK-Android';
        var repoDir = cloneRepo(tmpDir, fork, repoName, branch);
        createDeployForcePackage(repoDir, tmpDir, OS.android);
    }

    // Get cordova plugin repo if any hybrid testing requested
    if (testingHybrid) {
        var pluginRepoDir = cloneRepo(tmpDir, pluginFork, 'SalesforceMobileSDK-CordovaPlugin', pluginBranch);
        updatePluginRepo(tmpDir, pluginRepoDir, branch);
        if (testingIOS) editForceScriptToUseLocalPluginRepo(tmpDir, OS.ios);
        if (testingAndroid) editForceScriptToUseLocalPluginRepo(tmpDir, OS.android);
    }
    
    // Test all the platforms / app types requested
    for (var i=0; i<chosenOperatingSystems.length; i++) {
        var os = chosenOperatingSystems[i];
        for (var j=0; j<chosenAppTypes.length; j++) {
            var appType = chosenAppTypes[j];
            if (appType === APP_TYPE.native_swift && os === OS.android) continue; // that app type doesn't exist for android
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
        + '    [--fork=FORK (defaults to forcedotcom)]\n'
        + '    [--branch=BRANCH (defaults to unstable)]\n'
        + '    [--pluginFork=PLUGIN_FORK (defaults to forcedotcom)]\n'
        + '    [--pluginBranch=PLUGIN_BRANCH (defaults to unstable)]\n'
        + '\n'
        + '  If ios is targeted:\n'
        + '  - clones https://github.com/FORK/SalesforceMobileSDK-iOS at branch BRANCH\n'
        + '  - generates forceios package and deploys it to a temporary directory\n'
        + '  - creates and compile the application types selected\n'
        + '\n'
        + '  If android is targeted:\n'
        + '  - clones https://github.com/FORK/SalesforceMobileSDK-Android at branch BRANCH\n'
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
function createDeployForcePackage(repoDir, tmpDir, os) {
    log('Generating ' + forcePackageNameForOs(os) + ' package', COLOR.green);
    var buildNpmPath = os === OS.ios ? path.join(repoDir, 'build', 'build_npm.xml') : path.join(repoDir, 'build_npm.xml');
    runProcessThrowError('ant -f ' + buildNpmPath);
    runProcessThrowError('npm install --prefix ' + tmpDir + ' ' + path.join(repoDir, forcePackageNameForOs(os) + '-' + version + '.tgz'));
}

//
// Create and compile app 
//
function createCompileApp(tmpDir, appType, os) {
    var target = appType + ' app for ' + os;
    log('==== TESTING ' + target + '====', COLOR.green);
    var appName = appType + os + 'App';
    var appId = '3MVG9Iu66FKeHhINkB1l7xt7kR8czFcCTUhgoA8Ol2Ltf1eYHOU4SqQRSEitYFDUpqRWcoQ2.dBv_a1Dyu5xa';
    var callbackUri = 'testsfdc:///mobilesdk/detect/oauth/done';

    var forcePath = path.join(tmpDir, 'node_modules', '.bin', forcePackageNameForOs(os));

    if (os === OS.ios) {
        forceiosArgs = 'create '
            + ' --apptype=' + appType
            + ' --appname=' + appName
            + ' --companyid=com.mycompany'
            + ' --organization=MyCompany'
            + ' --outputdir=' + tmpDir
            + ' --appid=' + appId
            + ' --callbackuri=' + callbackUri;
        if (appType === 'hybrid_remote') {
            forceiosArgs += ' --startPage=/apex/testPage';
        }

        runProcessCatchError(forcePath + ' ' + forceiosArgs, 'GENERATING ' + target);

        if (appType.indexOf('native') >=0) {
            // Pointing to repoDir in Podfile
            shelljs.sed('-i', /pod ('Salesforce.*')/g, 'pod $1, :path => \'../SalesforceMobileSDK-iOS\'', path.join(tmpDir, appName, 'Podfile'));
            shelljs.sed('-i', /pod ('Smart.*')/g, 'pod $1, :path => \'../SalesforceMobileSDK-iOS\'', path.join(tmpDir, appName, 'Podfile'));

            shelljs.pushd(path.join(tmpDir, appName));
            runProcessCatchError('pod update');    
            shelljs.popd();

            var workspacePath = path.join(tmpDir, appName, appName + '.xcworkspace');
            runProcessCatchError('xcodebuild -workspace ' + workspacePath + ' -scheme Pods-' + appName + ' clean build', 'COMPILING ' + target)
        }
        else {
            shelljs.pushd(path.join(tmpDir, appName));
            runProcessCatchError('cordova build', 'COMPILING ' + target);    
            shelljs.popd();
        }
        
    }
    else if (os === OS.android) {
        var targetDir = path.join(tmpDir, appName);
        shelljs.mkdir('-p', targetDir);

        var forcedroidArgs = 'create '
            + ' --apptype=' + appType
            + ' --appname=' + appName
            + ' --packagename=com.mycompany'
            + ' --targetdir=' + targetDir
            + ' --usesmartstore=yes';
            if (appType === 'hybrid_remote') {
                forcedroidArgs += ' --startpage=/apex/testPage';
            }

        runProcessCatchError(forcePath + ' ' + forcedroidArgs, 'GENERATING ' + target);

        if (appType.indexOf('native')>=0) {
            shelljs.pushd(targetDir);
            runProcessCatchError('./gradlew', 'COMPILING ' + target);    
            shelljs.popd();
        }
        else {
            shelljs.pushd(path.join(tmpDir, appName));
            runProcessCatchError('cordova build', 'COMPILING ' + target);    
            shelljs.popd();
        }
    }
}

//
// Update cordova plugin repo
//
function updatePluginRepo(tmpDir, pluginRepoDir, branch) {
    log('Updating cordova plugin at ' + branch, COLOR.green);
    shelljs.pushd(pluginRepoDir);
    runProcessThrowError(path.join('tools', 'update.sh') + ' -b ' + branch);    
    shelljs.popd();
}

//
// Update forceios/forcedroid script to use local plugin repo
//
function editForceScriptToUseLocalPluginRepo(tmpDir, os) {
    log('Editing  ' + forcePackageNameForOs(os) + '.js to use local cordova plugin', COLOR.green);
    shelljs.sed('-i', /'cordova plugin add .*'/g, '\'cordova plugin add ../SalesforceMobileSDK-CordovaPlugin\'', path.join(tmpDir, 'node_modules', forcePackageNameForOs(os), 'node', forcePackageNameForOs(os) + '.js'));
}    

//
// Helper to run arbitrary shell command - errors caught (and reported)
//
function runProcessCatchError(cmd, msg) {
    try {
        if (msg) log('!STARTING!  ' + msg, COLOR.yellow);
        log('Running: ' + cmd);
        execSync(cmd);
        if (msg) log('!COMPLETED! ' + msg, COLOR.yellow);
    } catch (err) {
        if (msg) log('!FAILED!    ' + msg, COLOR.red);
        console.error(err.stderr.toString());
    }
}

//
// Helper to run arbitrary shell command - errors thrown
//
function runProcessThrowError(cmd) {
    log('Running: ' + cmd);
    execSync(cmd);
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
// Helper to validate operating systems
//
function validateOperatingSystems(chosenOperatingSystems) {
    for (var i=0; i<chosenOperatingSystems.length; i++) {
        var os = chosenOperatingSystems[i];
        if (!OS.hasOwnProperty(os)) {
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
