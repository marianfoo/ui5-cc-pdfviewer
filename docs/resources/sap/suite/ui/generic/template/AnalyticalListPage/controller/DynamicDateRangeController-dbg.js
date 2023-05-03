sap.ui.define([
		'sap/ui/core/mvc/Controller',
		'sap/m/ResponsivePopover',
		'sap/m/library',
		"sap/base/util/deepExtend",
		'sap/m/DynamicDateRange'
	], function(Controller, ResponsivePopover, SapMLibrary, deepExtend, DynamicDateRange) {
	"use strict";


	var DynamicDateRangeController = Controller.extend("sap.suite.ui.generic.template.AnalyticalListPage.controller.DynamicDateRangeController", {});
	/**
	 * createDynamicDateRange creates a DynamicDateRange control with pre filled from compact filter value entity set it's selections.
	 *
	 * @param {oControl, oChart}
	 * oControl - current element control
	 * oChart - chart
	 * @returns {void}
	 *
	 * @private
	 */

	sap.suite.ui.generic.template.AnalyticalListPage.controller.DynamicDateRangeController.createDynamicDateRange = function (aControlOptions) {
		this._oDynamicDateRange = new DynamicDateRange({
			options: aControlOptions,
			hideInput: true
		});
		return this._oDynamicDateRange;
	};

	sap.suite.ui.generic.template.AnalyticalListPage.controller.DynamicDateRangeController.openDynamicDateRange = function (oControl, oChart) {
		var oContent = oControl.getParent().getContent();
		this._oDynamicDateRange = oContent[oContent.length - 1];
		this._oDynamicDateRange.attachChange(this._handleDynamicDateRangeSelect.bind(this));
		this._oChart = oChart;
		// to sync compact filter date to visualfilter
		if (oChart.getDimensionFilter()) {
			this._setSelectedDate(oChart.getDimensionFilter());
		} else if (this._oOldDate) { //to sync empty date filter to visualfilter
			this._removeAllDynamicDateSelections();
		}
		this._oDynamicDateRange.openBy(oControl);
	};

	/**
	 * To set the passed date to DynamicDateRange Control
	 *
	 * @param {Date object}
	 * @returns {void}
	 *
	 * @private
	 */
	sap.suite.ui.generic.template.AnalyticalListPage.controller.DynamicDateRangeController._setSelectedDate = function(oDate) {
		var oCurDynamicDateVal = {
			operator: null,
			values: []
		};
		if (oDate && oDate.ranges && oDate.ranges.length) {
			for (var i in oDate.ranges) {
				if (oDate.ranges[i] && oDate.ranges[i].value1) {
					oCurDynamicDateVal.operator = oDate.conditionTypeInfo.data.operation;
					oCurDynamicDateVal.values.push(oDate.ranges[i].value1);
				}
			}
			this._oDynamicDateRange.setValue(oCurDynamicDateVal);
			this._oOldDate = oCurDynamicDateVal;
		} else {
			this._oDynamicDateRange.setValue(null);
			this._oOldDate = null;
		}
	};

	/**
	 * To handle Dynamic Date selection and deselection(clear)
	 *
	 * @param {oEvent object}
	 * @returns {void}
	 *
	 * @private
	 */
	sap.suite.ui.generic.template.AnalyticalListPage.controller.DynamicDateRangeController._handleDynamicDateRangeSelect = function (oEvent) {
		var oChartDimDetails = deepExtend({}, this._oChart.getDimensionFilter());
		var oCurDynamicDateSel = oEvent.getParameter("value");
		//if previous selected date and current selected date are same,clear the selection
		if (JSON.stringify(this._oOldDate) === JSON.stringify(oCurDynamicDateSel)) {
			this._removeAllDynamicDateSelections();
			this._oChart.setDimensionFilter(null);
		} else {
			oChartDimDetails.conditionTypeInfo.data.operation = oCurDynamicDateSel.operator;
			oChartDimDetails.conditionTypeInfo.data["value1"] = oCurDynamicDateSel.values[0];
			oChartDimDetails.ranges = [];
			this._oChart.setDimensionFilter(oChartDimDetails);
		}
		this._oDynamicDateRange.detachChange(this._handleDynamicDateRangeSelect);
		this._oChart.fireFilterChange();
		
		// Old Code - to open DDR
		// this._oPopoverDialog.close();

		// New Code - to open DDR
		//this._oDynamicDateRange.close();
	};

	/**
	 * Remove any Dynamic Date selection
	 *
	 * @returns {void}
	 *
	 * @private
	 */
	sap.suite.ui.generic.template.AnalyticalListPage.controller.DynamicDateRangeController._removeAllDynamicDateSelections = function () {
		this._oDynamicDateRange.setValue(null);
		this._oOldDate = null;
	};

	return DynamicDateRangeController;

});