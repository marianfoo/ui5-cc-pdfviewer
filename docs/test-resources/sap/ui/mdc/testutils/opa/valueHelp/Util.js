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

	var Util = {

		texts: {
			ok: oMDCBundle.getText("valuehelp.OK"),
			cancel: oMDCBundle.getText("valuehelp.CANCEL"),
			defineConditions: oMDCBundle.getText("valuehelp.DEFINECONDITIONSNONUMBER"),
			add: oMDCBundle.getText("valuehelp.DEFINECONDITIONS_ADDCONDITION")
		},

		icons: {
			decline: "sap-icon://decline"
		}


	};

	return Util;
});