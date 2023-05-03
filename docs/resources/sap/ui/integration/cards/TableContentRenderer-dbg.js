/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */

sap.ui.define(["./BaseContentRenderer", "../library"], function (BaseContentRenderer, library) {
	"use strict";

	/**
	 * TableContentRenderer renderer.
	 * @author SAP SE
	 * @namespace
	 */
	var TableContentRenderer = BaseContentRenderer.extend("sap.ui.integration.cards.TableContentRenderer", {
		apiVersion: 2
	});

	/**
	 * @override
	 */
	TableContentRenderer.getMinHeight = function (oConfiguration, oContent, oCard) {
		var  iMaxItems = oCard.getContentPageSize(oConfiguration);

		if (!iMaxItems) {
			return this.DEFAULT_MIN_HEIGHT;
		}

		var bIsCompact = this.isCompact(oContent),
			iRowHeight = bIsCompact ? 2 : 2.75, // table row height in "rem"
			iTableHeaderHeight = bIsCompact ? 2 : 2.75; // table header height in "rem"

		return (iMaxItems * iRowHeight + iTableHeaderHeight) + "rem";
	};

	TableContentRenderer.getItemMinHeight = function (oConfiguration, oControl) {
		if (!oConfiguration || !oConfiguration.row) {
			return 0;
		}

		var bIsCompact = this.isCompact(oControl);

		return bIsCompact ? 2 : 2.75;
	};

	return TableContentRenderer;
});
