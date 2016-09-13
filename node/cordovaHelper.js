var shelljs = require('shelljs');

/**
 * Gets the the version of the currently installed cordova CLI tool.
 *
 * @return {String} The version of the cordova CLI tool, or null if the tool is not installed.
 */
var getCordovaCliVersion = function() {
	var cordovaVersionResult = shelljs.exec('cordova -v', { 'silent' : true });
    if (cordovaVersionResult.code !== 0) {
        return null;
    }

    var cordovaCliVersion = cordovaVersionResult.stdout.replace(/\r?\n|\r/, '');
    return cordovaCliVersion;
};

module.exports.getCordovaCliVersion = getCordovaCliVersion;
