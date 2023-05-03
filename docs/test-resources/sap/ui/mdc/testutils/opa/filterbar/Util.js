/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define([
	"sap/ui/core/Core"
], function(oCore) {
	"use strict";

	var oMDCBundle = oCore.getLibraryResourceBundle("sap.ui.mdc");
	//var oMBundle = oCore.getLibraryResourceBundle("sap.m");

	var Util = {

		texts: {
			go: oMDCBundle.getText("filterbar.GO")
		},

		icons: {
			decline: "sap-icon://decline",
			valueHelp: "sap-icon://value-help"
		}

	};

	return Util;
});
