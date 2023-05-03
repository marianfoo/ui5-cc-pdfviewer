/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define([
	"sap/ui/test/Opa5"
], function(
	Opa5
) {
	"use strict";

	return function waitForTable(oSettings) {
		return this.waitFor({
			controlType: "sap.ui.mdc.Table",
			success: function(aTables) {
				Opa5.assert.strictEqual(aTables.length, 1, 'The mdc.Table was found');

				if (typeof oSettings.success === "function") {
					var oTable = aTables[0];
					oSettings.success.call(this, oTable);
				}
			},
			errorMessage: "The mdc.Table was not found",
			timeout: 40
		});
	};
});
