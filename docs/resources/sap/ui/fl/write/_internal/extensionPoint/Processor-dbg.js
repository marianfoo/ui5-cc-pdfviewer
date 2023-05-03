/*!
* OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
*/
sap.ui.define([
	"sap/ui/fl/apply/_internal/extensionPoint/Processor",
	"sap/base/util/merge"
],
function(
	ApplyProcessor,
	merge
) {
	"use strict";

	function applyExtensionPoint(oExtensionPoint, bSkipInsertContent) {
		var mExtensionPointInfo = merge({defaultContent: []}, oExtensionPoint);
		return ApplyProcessor.registerExtensionPoint(mExtensionPointInfo)
			.then(ApplyProcessor.createDefaultContent.bind(this, oExtensionPoint, bSkipInsertContent, applyExtensionPoint, []/*in base processor changes are not taken into account*/))
			.then(ApplyProcessor.addDefaultContentToExtensionPointInfo.bind(this, mExtensionPointInfo, bSkipInsertContent));
	}

	/**
	 * Implements the <code>Extension Points</code> provider by SAPUI5 flexibility that can be hooked in the <code>sap.ui.core.ExtensionPoint</code> life cycle.
	 * It is used only in design mode and does not consider the availability of UI changes. Therefore, the processor is not a precondition for applying internal flex changes.
	 *
	 * @name sap.ui.fl.write._internal.extensionPoint.Processor
	 * @class
	 * @constructor
	 * @author SAP SE
	 * @version 1.108.8
	 */
	var Processor = {
		applyExtensionPoint: function(oExtensionPoint) {
			return applyExtensionPoint(oExtensionPoint, false);
		}
	};

	return Processor;
});