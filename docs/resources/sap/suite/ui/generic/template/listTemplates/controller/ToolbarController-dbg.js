sap.ui.define([
	"sap/m/SegmentedButtonItem",
	"sap/m/Button",
	"sap/ui/base/EventProvider",
	"sap/m/SegmentedButton",
	"sap/ui/core/mvc/Controller",
	"sap/m/OverflowToolbarLayoutData",
	"sap/ui/Device",
	"sap/m/library",
	"sap/base/util/extend"
    ],
    function(SegmentedButtonItem, Button, EventProvider, SegmentedButton, Controller, OverflowToolbarLayoutData, Device, SapMLibrary, extend) {
        "use strict";

		var	CONTAINER_VIEW_TABLE = "table",
			CONTAINER_VIEW_CHART = "chart",
			CONTAINER_VIEW_CHARTTABLE = "charttable",
			CONTAINER_VIEW_CUSTOMVIEW1 = "customview1",
			CONTAINER_VIEW_CUSTOMVIEW2 = "customview2",
			CONTAINER_VIEW_CROSSTAB = "crosstable";

		var tbController = Controller.extend("sap.suite.ui.generic.template.listTemplates.controller.ToolbarController", {
			setState:function(oState) {
				var me = this;
				me.oState = oState;

				var defaultView = oState.oController.getOwnerComponent().getDefaultContentView();

				// delay insertion out custom toolbar buttons until the
				// smartTable and smartChart are properly initialized
				me.oState._pendingTableToolbarInit = true;
				me.oState._pendingChartToolbarInit = true;

				//Creating the view switch buttons for the chart and table
				if (!me.oState.alr_viewSwitchButtonOnChart || !me.oState.alr_viewSwitchButtonOnTable ) {
					me.oState.alr_viewSwitchButtonOnChart = me.createViewSwitchButton(true);
					me.oState.alr_viewSwitchButtonOnTable = me.createViewSwitchButton(false);
				}
				var oTemplatePrivate = me.oState.oController.getOwnerComponent().getModel("_templPriv");
				//on load of app in tablet, set default view mode to chart
				defaultView = (!oTemplatePrivate.getProperty('/alp/visibility/hybridView') && defaultView === "charttable") ? "chart" : defaultView;
				oTemplatePrivate.setProperty('/alp/contentView', defaultView);
			},
			createViewSwitchButton:function(chartMode) {
				var oCustomModel = this.oState.oController.oView.getModel("alpCustomModel");
				var buttonItems = [];
				//The edges of the buttons are not rendering properly when visibility is set using custom model
				if (Device.system.desktop) {//create and push hybrid view only in desktop mode
					buttonItems.push(new SegmentedButtonItem({
						tooltip: "{i18n>CONTAINER_VIEW_CHARTTABLE}",
						key: CONTAINER_VIEW_CHARTTABLE,
						icon: oCustomModel.getProperty("/icon/hybrid"),
						enabled: "{_templPriv>/alp/enableHybridMode}"
					}));
				}
				if (oCustomModel.getProperty("/required/master")) {
					buttonItems.push(new SegmentedButtonItem({
						tooltip: "{i18n>CONTAINER_VIEW_CHART}",
						key: CONTAINER_VIEW_CHART,
						icon: oCustomModel.getProperty("/icon/master")
					}));
				}
				if (this.oState.bCustomView1Exist) {
					buttonItems.push(new SegmentedButtonItem({
						tooltip: oCustomModel.getProperty("/tooltip/customview1"),
						key: CONTAINER_VIEW_CUSTOMVIEW1,
						icon: oCustomModel.getProperty("/icon/customview1")
					}));
				}
				if (this.oState.bCustomView2Exist) {
					buttonItems.push(new SegmentedButtonItem({
						tooltip: oCustomModel.getProperty("/tooltip/customview2"),
						key: CONTAINER_VIEW_CUSTOMVIEW2,
						icon: oCustomModel.getProperty("/icon/customview2")
					}));
				}
				if (this.oState.oAnalyticGridContainer) {
					buttonItems.push(new SegmentedButtonItem({
						tooltip: "{i18n>CONTAINER_VIEW_CROSSTAB}",
						key: CONTAINER_VIEW_CROSSTAB,
						icon: "sap-icon://grid"
					}));
				}
				buttonItems.push(new SegmentedButtonItem({
					tooltip: "{i18n>CONTAINER_VIEW_TABLE}",
					key: CONTAINER_VIEW_TABLE,
					icon: "sap-icon://table-view"
				}));
				var btnSettings = {
					select:  function(oEvent){
						this.oState.oController._templateEventHandlers.onContentViewSegmentButtonPressed(oEvent);
						}.bind(this),
					layoutData: new OverflowToolbarLayoutData({
						priority: SapMLibrary.OverflowToolbarPriority.NeverOverflow
					}),
					items:buttonItems,
					selectedKey: "{_templPriv>/alp/contentView}"
				};
				if (chartMode) {
					extend(btnSettings, {
						visible: "{= (${_templPriv>/alp/contentView} === 'chart' || ${_templPriv>/alp/contentView} === 'charttable') && !${_templPriv>/alp/fullScreen} }"
					});
					var segBtn = new SegmentedButton(btnSettings);
				} else {
					extend(btnSettings, {
						visible: "{= (${_templPriv>/alp/contentView} === 'table'  || ${_templPriv>/alp/contentView} === 'crosstable') && !${_templPriv>/alp/fullScreen} }"
					});
					var segBtn = new SegmentedButton(btnSettings);
				}
				return segBtn;
			}
		});
		return tbController;
});
