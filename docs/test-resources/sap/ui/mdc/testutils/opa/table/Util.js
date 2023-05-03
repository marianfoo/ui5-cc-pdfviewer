/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define([
	"../Utils"
], function(
	TestUtils
) {
	"use strict";

	var oTableUtils = {
		SortDialogTitle: TestUtils.getTextFromResourceBundle("sap.ui.mdc", "sort.PERSONALIZATION_DIALOG_TITLE"),
		ColumnDialogTitle: TestUtils.getTextFromResourceBundle("sap.ui.mdc", "table.SETTINGS_COLUMN"),
		SortButtonIcon: "sap-icon://sort",
		ColumnButtonIcon: "sap-icon://action-settings",
		MoveToTopIcon: "sap-icon://collapse-group"
	};

	return oTableUtils;
});
