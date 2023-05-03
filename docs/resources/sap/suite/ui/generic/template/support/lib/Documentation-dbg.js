/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */

sap.ui.define([
	"sap/m/library"
], function (mLibrary) {
	"use strict";

	var EXT_DOCU_DOMAIN = "https://ui5.sap.com/";
	var EXT_DOCU_TOPIC = "03265b0408e2432c9571d6b3feb6b1fd";

	/**
	 * @returns {string} link to external documentation
	 */
	function fnGetDocuURL() {
		var sUI5Version = sap.ui.getVersionInfo().version;
		if (sUI5Version.indexOf("-SNAPSHOT") !== -1) {
			return EXT_DOCU_DOMAIN + "#/topic/" + EXT_DOCU_TOPIC;
		} else {
			return EXT_DOCU_DOMAIN + sUI5Version + "/#/topic/" + EXT_DOCU_TOPIC;
		}
	}

	/**
	 * Opens the documentation
	 */
	function fnOpenDocumentation() {
		mLibrary.URLHelper.redirect(fnGetDocuURL(), true);
	}

	return {
		getDocuURL: fnGetDocuURL,
		openDocumentation: fnOpenDocumentation
	};
});
