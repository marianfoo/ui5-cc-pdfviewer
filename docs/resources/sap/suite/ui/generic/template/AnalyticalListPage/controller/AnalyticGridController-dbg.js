sap.ui.define([
		'sap/ui/core/mvc/Controller',
		// this will fail the tomcat applications as we do not have the sap.zen.dsh in the nexus for dependency loading
		//"sap/zen/dsh/AnalyticGrid",
		"sap/ui/comp/state/UIState"
], function(Controller, UIState) {
	"use strict";
	var oContoller = Controller.extend("sap.suite.ui.generic.template.AnalyticalListPage.controller.AnalyticGridController", {
		setState: function(oState) {
			this.oState = oState;
		},
		initAnalyticGrid: function () {
			// lazy load AnalyticGrid and the creation is done in the Async function
			sap.ui.require(['sap/zen/dsh/AnalyticGrid'], function(AnalyticGrid) {
				var _queryName = this.oState.oController.getOwnerComponent().getProperty('dshQueryName');
				this.oState.oAnalyticGrid = new AnalyticGrid({
					//todo: apply CSS using style classes
					height: "500px",
					width: "100%",
					queryName: _queryName
				}).setState(window.ZENState);
				//todo : load DSH with initial set of filters from ALP if available
				this.oState.oSmartFilterbar.attachSearch(this._onSearchButtonPressed, this);
				this.oState.oAnalyticGridContainer.addItem(this.oState.oAnalyticGrid);
			}.bind(this));
		},
		_onSearchButtonPressed: function (oEvent) {
			if (!this.oState.oAnalyticGrid) {
				return;
			}
			this._applyFilters();
		},
		_applyFilters: function () {
			this.oState.oAnalyticGrid.setSelection(this.oState.oSmartFilterbar.getUiState().getSelectionVariant());
		}
	});
	return oContoller;	
});