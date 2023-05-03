/*!
 * SAPUI5
 * (c) Copyright 2009-2022 SAP SE. All rights reserved.
 */

// Provides control sap.ui.comp.navpopover.SmartLink.
sap.ui.define([
	'sap/ui/core/Renderer', 'sap/m/LinkRenderer', 'sap/base/strings/whitespaceReplacer'
], function(Renderer, LinkRenderer, whitespaceReplacer) {
	"use strict";

	var SmartLinkRenderer = Renderer.extend(LinkRenderer);

	SmartLinkRenderer.apiVersion = 2;

	SmartLinkRenderer.render = function(oRm, oControl) {
		var bRenderLink = true;
		if (oControl.getIgnoreLinkRendering()) {
			var oReplaceControl = oControl._getInnerControl();
			if (oReplaceControl) {
				oRm.openStart("div", oControl);
				oRm.openEnd();
				oRm.renderControl(oReplaceControl);
				oRm.close("div");
				bRenderLink = false;
			}
		}
		if (bRenderLink) {
			if (!oControl.getAriaLabelledBy() || (Array.isArray(oControl.getAriaLabelledBy()) && oControl.getAriaLabelledBy().length == 0)) {
				oControl.addAriaLabelledBy(oControl);
			}
			LinkRenderer.render.apply(this, arguments);
		}
	};

	SmartLinkRenderer.writeText = function(oRm, oControl) {
		var sText = whitespaceReplacer(oControl.getText());
		if (!oControl.getUom()) {
			oRm.text(sText);
			return;
		}
		oRm.openStart("span");
		oRm.openEnd();
		oRm.text(sText);
		oRm.close("span");

		oRm.openStart("span");
		oRm.style("display", "inline-block");
		oRm.style("min-width", "2.5em");
		oRm.style("width", "3.0em");
		oRm.style("text-align", "start");
		oRm.openEnd();
		oRm.text(oControl.getUom());
		oRm.close("span");
	};

	return SmartLinkRenderer;

}, /* bExport= */true);
