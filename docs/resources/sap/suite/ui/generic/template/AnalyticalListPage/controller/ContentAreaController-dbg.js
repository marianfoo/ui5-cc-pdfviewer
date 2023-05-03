sap.ui.define([
	"sap/m/OverflowToolbar",
	"sap/m/ToolbarSpacer",
	"sap/m/FlexItemData",
	"sap/ui/core/mvc/Controller",
	"sap/suite/ui/generic/template/listTemplates/controller/SmartChartController",
	"sap/suite/ui/generic/template/listTemplates/controller/DetailController",
	"sap/ui/model/json/JSONModel"
],	function(OverflowToolbar, ToolbarSpacer, FlexItemData, Controller, SmartChartController, DetailController, JSONModel) {
		"use strict";
		var oController = Controller.extend("sap.suite.ui.generic.template.AnalyticalListPage.controller.ContentAreaController", {

			/**
			 * This function set the object state
			 * @param  {object} oState object state
			 * @return {void}
			 */
			setState: function(oState) {
				if (oState.oSmartChart) {
					oState.chartController = new SmartChartController();
					oState.chartController.setState(oState);
				}
				if (oState.oSmartTable) {
					oState.detailController = new DetailController();
					oState.detailController.setState(oState);
				}
				this.oState = oState;
				oState.bCustomView1Exist = oState.oController.byId("template::contentViewExtensionToolbar") !== undefined;
				oState.bCustomView2Exist = oState.oController.byId("template::contentViewExtension2Toolbar") !== undefined;
				oState.toolbarController.setState(oState);
			},
			/**
			 * This function enables the toolbar
			 * @return {void}
			 */
			enableToolbar: function() {
				if (this.oState.oSmartChart) {
					this.oState.oSmartChart.getToolbar().setEnabled(true);
				}
				if (this.oState.oSmartTable) {
					this.oState.oSmartTable.getCustomToolbar().setEnabled(true);
				}
			},
			/**
			 * This function create a custom model for app developer
			 * @return {void}
			 */
			createAndSetCustomModel: function(oState) {
				var oCustomModel = new JSONModel();
				oCustomModel.setData({
					required: {
						master: true
					},
					icon: {
						master: "sap-icon://vertical-bar-chart-2",
						hybrid: "sap-icon://chart-table-view",
						customview1: "sap-icon://grid",
						customview2: "sap-icon://table-row"
					},
					tooltip: {
						master: "{i18n>CONTAINER_VIEW_CHART}",
						hybrid: "{i18n>CONTAINER_VIEW_CHARTTABLE}",
						customview1: "Custom View 1",
						customview2: "Custom View 2"
					}
				});
				//provides a way to change the data in custom model
				oState.oController.onAfterCustomModelCreation(oCustomModel);
				oState.oController.oView.setModel(oCustomModel, "alpCustomModel");
			}
		});
		return oController;
	});
