/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define([], function () {
	"use strict";
	/**
	 * P13n/Settings helper class for sap.ui.mdc.Chart.
	 *
	 * @author SAP SE
	 * @private
	 * @experimental
	 * @since 1.60
	 * @alias sap.ui.mdc.chart.ChartSettings
	 */

	var ChartSettings = {

		showPanel: function (oControl, sP13nType, oSource, aProperties) {
			ChartSettings["showUI" + sP13nType](oControl, oSource);
		},

		showUIChart: function (oControl, oSource) {
			oControl.getEngine().uimanager.show(oControl, "Item");
		},

		showUISort: function(oControl, oSource){
			oControl.getEngine().uimanager.show(oControl, "Sort");
		}

	};
	return ChartSettings;
});
