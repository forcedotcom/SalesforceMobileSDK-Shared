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

module.exports.getVersionNumberFromString = getVersionNumberFromString;