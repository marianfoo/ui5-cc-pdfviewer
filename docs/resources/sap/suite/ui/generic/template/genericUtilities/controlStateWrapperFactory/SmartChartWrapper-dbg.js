sap.ui.define([
	"sap/suite/ui/generic/template/genericUtilities/controlStateWrapperFactory/SmartTableChartCommon"
], function(SmartTableChartCommon) {
	"use strict";
	
	function SmartChartWrapper(oSmartChart, oController, oFactory){
		return new SmartTableChartCommon(oSmartChart, oController, oFactory, "initialized");
	}
	return SmartChartWrapper;
});