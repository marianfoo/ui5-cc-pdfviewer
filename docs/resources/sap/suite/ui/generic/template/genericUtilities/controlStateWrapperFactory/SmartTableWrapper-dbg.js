sap.ui.define([
	"sap/suite/ui/generic/template/genericUtilities/controlStateWrapperFactory/SmartTableChartCommon"
], function(SmartTableChartCommon) {
	"use strict";
	
	function SmartTableWrapper(oSmartTable, oController, oFactory){
		return new SmartTableChartCommon(oSmartTable, oController, oFactory, "initialise");
	}

	return SmartTableWrapper;
});