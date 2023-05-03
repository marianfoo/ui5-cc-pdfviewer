
/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */

sap.ui.define([
], function(
) {
	"use strict";


	/**
	 * Descriptor change merger for change type <code>appdescr_ui5_addComponentUsages</code>.
	 * Adds component usages under <code>sap.ui5/componentUsages</code> node and creates parent node if not yet existing.
	 * Throws exception if to be added component usage already exists.
	 *
	 * Only available during build time {@link sap.ui.fl.apply._internal.changes.descriptor.RegistrationBuild}.
	 *
	 * @namespace sap.ui.fl.apply._internal.changes.descriptor.ui5.AddComponentUsages
	 * @experimental
	 * @since 1.86
	 * @version 1.108.8
	 * @private
	 * @ui5-restricted sap.ui.fl.apply._internal
	 */
	var AddComponentUsages = /** @lends sap.ui.fl.apply._internal.changes.descriptor.ui5.AddComponentUsages */ {

		/**
		 * Method to apply the <code>appdescr_ui5_addComponentUsages</code> change to the manifest.
		 * @param {object} oManifest Original manifest
		 * @param {object} oChange Change with type <code>appdescr_ui5_addComponentUsages</code>
		 * @returns {object} Updated manifest with <code>sap.ui5/componentUsages</code> entity
		 *
		 * @private
		 * @ui5-restricted sap.ui.fl.apply._internal
		 */
		applyChange: function(oManifest, oChange) {
			var oChangeComponentUsages = oChange.getContent().componentUsages;

			// sap.ui5 node is mandatory in UI5 manifest
			if (!oManifest["sap.ui5"]["componentUsages"]) {
				oManifest["sap.ui5"]["componentUsages"] = {};
			}
			var oManifestComponentUsages = oManifest["sap.ui5"].componentUsages;

			Object.keys(oChangeComponentUsages).forEach(function(sComponentUsageName) {
				if (oManifestComponentUsages[sComponentUsageName]) {
					throw new Error("Component usage '" + sComponentUsageName + "' already exists");
				} else {
					oManifestComponentUsages[sComponentUsageName] = oChangeComponentUsages[sComponentUsageName];
				}
			});
			return oManifest;
		}


	};

	return AddComponentUsages;
});