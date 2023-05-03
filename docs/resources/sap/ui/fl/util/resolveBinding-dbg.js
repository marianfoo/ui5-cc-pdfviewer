/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define([
	"sap/ui/base/ManagedObject",
	"sap/ui/fl/Utils"
], function (
	ManagedObject,
	FlUtils
) {
	"use strict";

	// Helper class to resolve bindings
	var HelperControl = ManagedObject.extend("sap.ui.fl.util.HelperControl", {
		metadata: {
			library: "sap.ui.fl",
			properties: {
				resolved: {
					type: "any"
				}
			}
		}
	});

	/**
	 * Resolves bindings synchronously by copying model and binding context information
	 * from a given reference control.
	 *
	 * @param {object|string} vValue - Binding string or binding object
	 * @param {sap.ui.core.Control} oReferenceControl - Control to copy binding information from
	 * @returns {any} - Resolved value
	 *
	 * @function
	 * @author SAP SE
	 * @version 1.108.8
	 * @alias sap.ui.fl.util.resolveBinding
	 * @experimental
	 * @since 1.91
	 * @private
	 * @ui5-restricted sap.ui.fl, sap.ui.rta, sap.ui.dt
	 */
	return function(vValue, oReferenceControl) {
		if (!FlUtils.isBinding(vValue)) {
			return undefined;
		}

		var oView = FlUtils.getViewForControl(oReferenceControl);
		var oController = oView && oView.getController();
		var oBindingInfo = typeof vValue === "string"
			? ManagedObject.bindingParser(vValue, oController)
			: Object.assign({}, vValue);

		if (!oBindingInfo) {
			return undefined;
		}

		var oHelperControl = new HelperControl();

		var aParts = oBindingInfo.parts || [oBindingInfo];
		aParts.forEach(function (oBindingPart) {
			var sModelName = oBindingPart.model;
			if (sModelName) {
				oHelperControl.setModel(oReferenceControl.getModel(sModelName), sModelName);
				oHelperControl.setBindingContext(oReferenceControl.getBindingContext(sModelName), sModelName);
			} else {
				oHelperControl.setModel(oReferenceControl.getModel());
				oHelperControl.setBindingContext(oReferenceControl.getBindingContext());
			}
		});

		oHelperControl.bindProperty("resolved", oBindingInfo);
		var vResolvedValue = oHelperControl.getResolved();
		oHelperControl.destroy();

		return vResolvedValue;
	};
});
