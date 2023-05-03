/*!
 * SAPUI5
 * (c) Copyright 2009-2022 SAP SE. All rights reserved.
 */

/**
 * @namespace Factory to access <code>ushell</code> services.
 * @name sap.ui.comp.navpopover.Factory
 * @author SAP SE
 * @version 1.108.8
 * @private
 * @since 1.36.0
 */
sap.ui.define([
	'sap/ui/comp/library'
], function(CompLibrary) {
	"use strict";
	var Factory = {

		getService: function(sServiceName) {
			switch (sServiceName) {
				case "CrossApplicationNavigation":
					return sap.ushell && sap.ushell.Container && sap.ushell.Container.getService("CrossApplicationNavigation");
				case "URLParsing":
					return sap.ushell && sap.ushell.Container && sap.ushell.Container.getService("URLParsing");
				default:
					return null;
			}
		}
	};

	return Factory;
}, /* bExport= */true);
