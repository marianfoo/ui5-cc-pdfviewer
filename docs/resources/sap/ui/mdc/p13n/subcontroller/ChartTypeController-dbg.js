/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */

sap.ui.define([
	'./BaseController'
], function (BaseController) {
	"use strict";

    var ChartTypeController = BaseController.extend("sap.ui.mdc.p13n.subcontroller.ChartTypeController", {
        constructor: function() {
			BaseController.apply(this, arguments);
			this._bResetEnabled = true;
		}
    });

    ChartTypeController.prototype.getCurrentState = function() {
		return {properties: {chartType: this.getAdaptationControl().getChartType()}};
	};

    ChartTypeController.prototype.getStateKey = function() {
		return "supplementaryConfig";
	};

    ChartTypeController.prototype.getDelta = function(mPropertyBag) {

        var sNewType = mPropertyBag.changedState.type ? mPropertyBag.changedState.type : mPropertyBag.changedState.properties.chartType;
        var sOldType = this.getAdaptationControl().getChartType();

        var aChartTypeChanges = [];

        if (sNewType !== sOldType) {
            aChartTypeChanges = [{
                selectorElement: mPropertyBag.control,
                changeSpecificData: {
                    changeType: "setChartType",
                    content: {
                        chartType: sNewType
                    }
                }
            }];
        }

        return aChartTypeChanges;
	};

	return ChartTypeController;

});
