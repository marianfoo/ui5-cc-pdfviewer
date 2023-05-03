/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define(["sap/m/library"],function(e){"use strict";var r="https://ui5.sap.com/";var t="03265b0408e2432c9571d6b3feb6b1fd";function i(){var e=sap.ui.getVersionInfo().version;if(e.indexOf("-SNAPSHOT")!==-1){return r+"#/topic/"+t}else{return r+e+"/#/topic/"+t}}function n(){e.URLHelper.redirect(i(),true)}return{getDocuURL:i,openDocumentation:n}});
//# sourceMappingURL=Documentation.js.map