var fs = require('fs');
/**
 * Creates a comparable version number from a version string in the format x[.y[.ignored]].
 * Currently only looks for major and minor version numbers.
 *
 * Examples:
 * getVersionNumberFromString('5') will return 5000.
 * getVersionNumberFromString('5.8') will return 5008
 * getVersionNumberFromString('5.11.26-43.3.7') will return 5011
 * getVersionNumberFromString('sandwich') will log an error and return 0
 *
 * @param {String} versionString The string representation of the version.
 * @return {Number} The numeric version number, or 0 if the version string isn't a valid format.
 */
var getVersionNumberFromString = function (versionString) {
	// Only supporting major/minor version checking at this point.
	var versionRegex = /^(\d+)(\.(\d+))?.*$/;
	var matchArray = versionString.match(versionRegex);
	if (matchArray === null) {
		console.log('Invalid version string "' + versionString + '". Should be in the format x[.y[.ignored]]');
		return 0;
	} else {
		var majorVersion = parseInt(matchArray[1]);
		var minorVersion = (matchArray[3] === undefined ? 0 : parseInt(matchArray[3]));
		var combinedVersion = (1000 * majorVersion) + minorVersion;
		return combinedVersion;
	}
};

/** 
* Replaces text in a file
*
* @param {String} fileName The file in which the text needs to be replaced
* @param {String} textInFile Text in the file to be replaced
* @param {String} replacementText Text used to replace the text in file
*/
var replaceTextInFile = function (fileName, textInFile, replacementText) {
    var contents = fs.readFileSync(fileName, 'utf8');
    var lines = contents.split(/\r*\n/);
    var result = lines.map(function (line) {
      return line.replace(textInFile, replacementText);
    }).join('\n');

    fs.writeFileSync(fileName, result, 'utf8'); 
}

module.exports.getVersionNumberFromString = getVersionNumberFromString;
module.exports.replaceTextInFile = replaceTextInFile;