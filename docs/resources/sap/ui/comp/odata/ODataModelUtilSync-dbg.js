/*!
 * SAPUI5
 * (c) Copyright 2009-2022 SAP SE. All rights reserved.
 */

// -------------------------------------------------------------------------------
// Helper class used for generic ODataModel related handling
// -------------------------------------------------------------------------------
sap.ui.define([
	"sap/ui/comp/odata/ODataModelUtil",
	"sap/ui/fl/apply/api/FlexRuntimeInfoAPI"
], function (
	ODataModelUtil,
	FlexRuntimeInfoAPI
) {
	"use strict";

	/**
	 * Object used for for generic ODataModel related handling
	 *
	 * @private
	 * @experimental This module is only for internal/experimental use!
	 */
	var ODataModelUtilSync = Object.create(ODataModelUtil, {
		_waitForFlexChanges: {
			value: function (oModel, oSmartControl, fModelInitCallback, vWaitForFlexChanges) {
				return this._flexRuntimeInfoAPIHandler(FlexRuntimeInfoAPI, oModel, oSmartControl, fModelInitCallback, vWaitForFlexChanges);
			}
		}
	});

	return ODataModelUtilSync;

}, /* bExport= */true);
