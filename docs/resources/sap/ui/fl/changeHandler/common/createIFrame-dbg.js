/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */

sap.ui.define([
	"sap/ui/fl/util/IFrame"
], function(
) {
	"use strict";

	/**
	 * Create an IFrame control and set its properties
	 *
	 * @param {sap.ui.fl.Change} oChange Change object with instructions to be applied on the control map
	 * @param {object} mPropertyBag Map of properties
	 * @param {object} mPropertyBag.modifier Modifier for the controls
	 * @param {object} [oSelector] Selector to calculate the ID for the control that is created
	 * @param {string} [oSelector.id] Control ID targeted by the change
	 * @param {boolean} [oSelector.isLocalId] <code>true</code> if the ID within the selector is a local ID or a global ID
	 * @returns {Promise} Promise resolving with the created IFrame
	 * @ui5-restricted sap.ui.fl
	 */
	return function (oChange, mPropertyBag, oSelector) {
		var oModifier = mPropertyBag.modifier;
		var oChangeContent = oChange.getContent();
		var oView = mPropertyBag.view;
		var oComponent = mPropertyBag.appComponent;
		var mIFrameSettings = { _settings: {} };
		["url", "width", "height"].forEach(function (sIFrameProperty) {
			var vValue = oChangeContent[sIFrameProperty];
			mIFrameSettings[sIFrameProperty] = vValue;
			mIFrameSettings._settings[sIFrameProperty] = vValue;
		});

		return Promise.resolve()
			.then(function() {
				return oModifier.createControl("sap.ui.fl.util.IFrame", oComponent, oView, oSelector, mIFrameSettings, false);
			});
	};
});
