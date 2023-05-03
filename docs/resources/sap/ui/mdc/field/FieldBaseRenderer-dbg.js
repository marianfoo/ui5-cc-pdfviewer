/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */

sap.ui.define([
	'sap/ui/core/Renderer',
	'sap/ui/core/IconPool',
	'sap/ui/mdc/enum/EditMode'
], function(
	Renderer,
	IconPool,
	EditMode
) {
	"use strict";

	/**
	 * FieldBase renderer.
	 * @namespace
	 */
	var FieldBaseRenderer = Renderer.extend("sap.ui.mdc.field.FieldBaseRenderer");

	FieldBaseRenderer = Object.assign(FieldBaseRenderer, {
		apiVersion: 2
	});

	FieldBaseRenderer.render = function(oRm, oField) {
		var aContent = oField._getContent();
		var sWidth = oField.getWidth();
		var aConditions = oField.getConditions();
		var sEditMode = oField.getEditMode();
		var bShowEmptyIndicator = oField.getShowEmptyIndicator() && aConditions.length === 0 && sEditMode === EditMode.Display && !oField.getContent() && !oField.getContentDisplay();

		oRm.openStart("div", oField);
		oRm.class("sapUiMdcFieldBase");

		if (aContent.length > 1) {
			oRm.class("sapUiMdcFieldBaseMoreFields");
		}

		if (bShowEmptyIndicator) {
			oRm.class("sapMShowEmpty-CTX"); // to allow the Text control determine if empty indicator is needed or not
		}

		oRm.style("width", sWidth);
		oRm.openEnd();

		for (var i = 0; i < aContent.length; i++) {
			var oContent = aContent[i];
			oRm.renderControl(oContent);
		}

		oRm.close("div");
	};

	return FieldBaseRenderer;
});
