/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */

sap.ui.define([
	"sap/ui/fl/Change"
], function(
	Change
) {
	"use strict";

	/**
	 * Prepares the AppDescriptorMap from the flex response
	 *
	 * @param {object} mPropertyBag - Property Bag
	 * @param {object} [mPropertyBag.storageResponse.changes.appDescriptorChanges] - All app descriptor changes
	 *
	 * @returns {object} The prepared map of App Descriptors
	 *
	 * @experimental since 1.74
	 * @function
	 * @since 1.74
	 * @private
	 * @ui5-restricted
	 * @alias module:sap/ui/fl/apply/_internal/flexState/appDescriptorChanges/prepareAppDescriptorMap
	 */
	return function(mPropertyBag) {
		var aChangeDefinitions = mPropertyBag.storageResponse.changes.appDescriptorChanges || [];
		//TODO: add filtering for condensable changeTypes once necessary

		var aChanges = aChangeDefinitions.map(function(oChangeDefinition) {
			return new Change(oChangeDefinition);
		});
		return {
			appDescriptorChanges: aChanges
		};
	};
});
