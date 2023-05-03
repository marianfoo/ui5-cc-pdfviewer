/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */

sap.ui.define([], function () {
	"use strict";

	/**
	 * Available layers
	 *
	 * @alias sap.ui.fl.Layer
	 * @private
	 * @ui5-restricted sap.ui.fl, sap.ui.rta, UX Tools, SAPUI5 Visual Editor
	 * @enum {string}
	 */
	return {
		USER: "USER",
		PUBLIC: "PUBLIC",
		CUSTOMER: "CUSTOMER",
		CUSTOMER_BASE: "CUSTOMER_BASE",
		PARTNER: "PARTNER",
		VENDOR: "VENDOR",
		BASE: "BASE"
	};
});