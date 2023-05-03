/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */

sap.ui.define([
	"sap/ui/fl/apply/_internal/flexObjects/RevertData"
], function (RevertData) {
	"use strict";

	/**
	 * Class for storing information about reverting variants.
	 *
	 * @class sap.ui.fl.apply._internal.flexObjects.CompVariantRevertData
	 * @extends sap.ui.fl.apply._internal.flexObjects.RevertData
	 * @private
	 * @ui5-restricted
	 * @since 1.87.0
	 */
	return RevertData.extend("sap.ui.fl.apply._internal.flexObjects.CompVariantRevertData", {
		metadata: {
			properties: {
				change: {type: "sap.ui.fl.Change"}
			}
		}
	});
});