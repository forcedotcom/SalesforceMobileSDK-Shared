var SalesforceOAuthPlugin = {

	/**
	* Obtain authentication credentials, calling 'authenticate' only if necessary.
	* Most index.html authors can simply use this method to obtain auth credentials
	* after onDeviceReady.
    *   success - The success callback function to use.
    *   fail    - The failure/error callback function to use.
	* PhoneGap returns a dictionary with:
	* 	accessToken
	* 	refreshToken
    *   clientId
	* 	userId
	* 	orgId
    *   loginUrl
	* 	instanceUrl
	* 	userAgent
	*/
    getAuthCredentials: function(success, fail) {
        PhoneGap.exec(success, fail, "com.salesforce.oauth","getAuthCredentials",[]);
    },
    
    /**
     * Initiates the authentication process, with the given app configuration.
     *   success         - The success callback function to use.
     *   fail            - The failure/error callback function to use.
     *   oauthProperties - The configuration properties for the authentication process.
     *                     See OAuthProperties() below.
     * PhoneGap returns a dictionary with:
     *   accessToken
     *   refreshToken
     *   clientId
     *   userId
     *   orgId
     *   loginUrl
     *   instanceUrl
     *   userAgent
     */
    authenticate: function(success, fail, oauthProperties) {
        PhoneGap.exec(success, fail, "com.salesforce.oauth", "authenticate", [JSON.stringify(oauthProperties)]);
    },


    /**
     * Logout the current authenticated user. This removes any current valid session token
     * as well as any OAuth refresh token.  The user is forced to login again.
     * This method does not call back with a success or failure callback, as 
     * (1) this method must not fail and (2) in the success case, the current user
     * will be logged out and asked to re-authenticate.
     */
    logout: function() {
        PhoneGap.exec(null, null, "com.salesforce.oauth", "logoutCurrentUser", []);
    },
    
    /**
     * Gets the app's homepage as an absolute URL.  Used for attempting to load any cached
     * content that the developer may have built into the app (via HTML5 caching).
     *
     * This method will either return the URL as a string, or an empty string if the URL has not been
     * initialized.
     */
    getAppHomeUrl: function(success) {
        PhoneGap.exec(success, null, "com.salesforce.oauth", "getAppHomeUrl", []);
    }
};

/**
 * OAuthProperties data structure, for plugin arguments.
 *   remoteAccessConsumerKey - String containing the remote access object ID (client ID).
 *   oauthRedirectURI        - String containing the redirect URI configured for the remote access object.
 *   oauthScopes             - Array of strings specifying the authorization scope of the app (e.g ["api", "visualforce"]).
 *   autoRefreshOnForeground - Boolean, determines whether the container automatically refreshes OAuth session when app is foregrounded
 */
function OAuthProperties(remoteAccessConsumerKey, oauthRedirectURI, oauthScopes, autoRefreshOnForeground) {
    this.remoteAccessConsumerKey = remoteAccessConsumerKey;
    this.oauthRedirectURI = oauthRedirectURI;
    this.oauthScopes = oauthScopes;
    this.autoRefreshOnForeground = autoRefreshOnForeground;
}
