sap.ui.define(["sap/ui/core/mvc/Controller",
	"sap/suite/ui/generic/template/listTemplates/listUtils",
	"sap/suite/ui/generic/template/genericUtilities/FeLogger",
	"sap/base/util/merge",
	"sap/base/util/deepExtend",
	"sap/ui/Device"
], function(Controller, listUtils, FeLogger, merge, deepExtend, Device) {
		"use strict";
	    var oLogger = new FeLogger("listTemplates.controller.SmartChartController").getLogger();
		var oVizProperties = {};
		var oVizPlotArea = {};
		var bEnableStableColors = false;
		var cController = Controller.extend("sap.suite.ui.generic.template.listTemplates.controller.SmartChartController", {
			setState: function(oState) {
				this.triggeredByTableSort = false;
				//this.tableSortSelection;
				this._selectFilterByMeasure = false; // else will filter by all dimensions/measures at the selection
				this.oState = oState;
				// Attach the init method to e.g., hook into the data selection event
				oState.oSmartChart.attachInitialized(this._onSmartChartInit, this);
				oState.oSmartChart.attachBeforeRebindChart(this._onBeforeRebindChart, this);
			},
			/**
			 * onBeforeRebindChart binds the table query params
			 * @param  {Object} oEvent Event object
			 */
			_onBeforeRebindChart: function (oEvent) {
				// modifying chart binding params to sort chart based on table data
				if (this.triggeredByTableSort && this.tableSortSelection) {
					var variant = this.oState.oSmartChart.fetchVariant();
					if (this.tableSortSelection.length > 0) {
						variant.sort = {};
						variant.sort.sortItems = [];
						for (var i = 0; i < (this.tableSortSelection.length); i++) {
							oEvent.mParameters.bindingParams.sorter.push(this.tableSortSelection[i]);
							variant.sort.sortItems.push({
								columnKey: this.tableSortSelection[i].sPath,
								operation: this.tableSortSelection[i].bDescending ? "Descending" : "Ascending"
							});
						}
					} else {
						oEvent.mParameters.bindingParams.sorter = this.tableSortSelection;
						// to set data in personalization dailog
						if (variant.sort) {
							delete variant.sort;
						}
					}

					// apply variant so that P13n is also updated, rebind chart does not update p13n
					this.oState.oSmartChart.applyVariant(variant);
					this.triggeredByTableSort = false;
				}

				//Make sure views with paramters are working
				if (this.oState.oSmartFilterbar && this.oState.oSmartFilterbar.getAnalyticBindingPath && this.oState.oSmartFilterbar.getConsiderAnalyticalParameters()) {
					try {
						var sAnalyticalPath = this.oState.oSmartFilterbar.getAnalyticBindingPath();
						if (sAnalyticalPath) {
							this.oState.oSmartChart.setChartBindingPath(sAnalyticalPath);
						}
					} catch (e) {
						oLogger.warning("Mandatory parameters have no values");
					}
				}
			},
			_onSmartChartInit: function(ev) {
				var oState = this.oState;
				var oEv = merge({}, ev);
				oState.oSmartChart.getChartAsync().then(function(oChart) {
					this.oChart = oChart;
					//workaround for Safari browsers as described via Webkit Bug #198375
					if (Device.browser.safari) {
						oState.oSmartChart.setHeight("50vH");
					} else {
						oState.oSmartChart.setHeight("100%");
					}
					oChart.setHeight("100%");
					this._chartInfo = {};
					this._chartInfo.drillStack = this.oChart.getDrillStack();
					//Disable the toolbars once search is triggered
					oState.oSmartChart.attachShowOverlay(function(oEvent){
						oState.oSmartChart.getToolbar().setEnabled(!oEvent.getParameter("overlay").show);
					}, this);
					// TODO: check if need to handle chart type change
					this.oState.oTemplateUtils.oCommonUtils.setEnabledToolbarButtons(oEv.getSource());
					//To check if navigation targets are supported of the toolbar buttons are supported
					this.oState.oTemplateUtils.oCommonUtils.checkToolbarIntentsSupported(oEv.getSource());
					this.oChart.attachSelectData(this._onChartSelectData, this);
					this.oChart.attachDeselectData(this._onChartDeselectData, this);
					this.oState.oSmartChart.attachChartDataChanged(this._onPersonalisationDimeasureChange, this);

					// Adding the view switch button to smartChart toolbar
					// Buttons added here as opposed to XML to maintain their position in toolbar
					//content view switch buttons are added only when both chart and table annotations are present
					if (this.oState._pendingChartToolbarInit && this.oState.oSmartTable) {
						if (!this.oState.oSmartFilterableKPI && !this.oState.oMultipleViewsHandler.getMode()){
							this.oState.oSmartChart.getToolbar().insertContent(this.oState.alr_viewSwitchButtonOnChart, this.oState.oSmartChart.getToolbar().getContent().length);
						}
					}

					delete this.oState._pendingChartToolbarInit;

					this._changeValueAxisTitleVisibility();
					var oComponent = this.oState.oController.getOwnerComponent();
					var bShowDatalabel = oComponent && oComponent.getChartSettings() && oComponent.getChartSettings().showDataLabel;
					bEnableStableColors = oComponent && oComponent.getChartSettings() && oComponent.getChartSettings().enableStableColors;
					oVizProperties = {
							"legendGroup":{
								"layout":{
									"position":"bottom"
								}
							},
							"categoryAxis": {
								"layout":{
									"maxHeight": 0.5
								}
							}
					};
					oVizPlotArea = {
						"plotArea": {
							"dataLabel": {
								"visible": false
							}
						}
					};
					if (bShowDatalabel) {
						oVizPlotArea.plotArea.dataLabel.visible = true;
						Object.assign(oVizProperties, oVizPlotArea);
					}
					if (bEnableStableColors) {
						this.applyStableColoringToChart();
					} else {
						this.oChart.setVizProperties(oVizProperties);
					}
	
					/**
					 * * attachSelectionDetailsActionPress Navigates from showDetails button of chart
					 * @param { object} [oEvent] [The event clicked - here this is chart]
					 * *
					*/
					this.oState.oSmartChart.attachSelectionDetailsActionPress(function(oEvent) {
						var oEventSource = oEvent.getSource();
						//Based on smart chart's new implementation every list can hold as many buttons as required
						//Each button will hold the binding context and is placed as each item in an array
						//We get this array by invoking oEvent.getParameter("itemContexts")
						//As we have only one show details button, Our binding context will be only the first item of this array
						//So we refer to the index 0 of this array to fetch the binding context of the selected item.
						var bindingContext = oEvent.getParameter("itemContexts") && oEvent.getParameter("itemContexts")[0];
						// Internal and Cross Navigation
						oState.oTemplateUtils.oCommonUtils.fnProcessDataLossOrDraftDiscardConfirmation(function() {
							//processing allowed
							if (!bindingContext){
								oLogger.error("Binding context for the selected chart item is missing");
								return;
							}
							if (oEventSource.data("CrossNavigation")) {
							// outbound navigation
								oState.oTemplateUtils.oCommonEventHandlers.onEditNavigateIntent(oEventSource, bindingContext, oState.oSmartFilterbar, oState.oSmartChart.oChart);
								return;
							}
							// // internal navigation
							oState.oTemplateUtils.oCommonUtils.navigateFromListItem(bindingContext);
						}, Function.prototype);
					});
					oLogger.info("Smart Chart Annotation initialized");
				}.bind(this));

			},
			_onChartSelectData: function(ev) {
				this.oState.oController.getOwnerComponent().getModel("_templPriv").setProperty('/alp/_ignoreChartSelections', (ev.getId() === "chartDataChanged"));
				var chart = this.oChart;
				this._chartInfo.drillStack = chart.getDrillStack();
				var oVizSelection = chart._getVizFrame().vizSelection();
				if (oVizSelection) { // workaround for bug in chart, will get null pointer exception if vizSelection is not checked
					this._chartInfo.vizSelection = oVizSelection;
					this._chartInfo.chartSelectionBehavior = this.oChart.getSelectionBehavior();
					this._chartInfo.chartSelection = this.oState.oTemplateUtils.oCommonUtils.getSelectionPoints(chart, this._chartInfo.chartSelectionBehavior);
					var selList = this._chartInfo.chartSelection.dataPoints;
					this._lastSelected = this._getLastSel(selList, this._lastSelectedList);
					this._lastSelectedList = selList;
				}
				// get the set of filter critera based on the selection, could be differences based on type, so get in a different function
				this._updateTable();
				this.oState.oTemplateUtils.oCommonUtils.setEnabledToolbarButtons(ev.getSource(), this._chartInfo.chartSelectionBehavior, this._chartInfo.chartSelection);
				//storing chartinfo object in iapp state
				this.oState.oIappStateHandler.fnStoreCurrentAppStateAndAdjustURL();
			},
			/*_onPersonalisationDimeasureChange is used to attach the recently implemented chartDataChanged from smartChart team.
				it returns a oEvent with changeTypes of object with boolean properties dimeasure, filter & sort.
				We only consider dimeasure to consider here rest event changes direclty triggers table changes from begining.
				So its kept as is.*/
			_onPersonalisationDimeasureChange: function(oEvent) {
				// BCP 2180233518 removed _onChartSelectData check for Sequential round trip issue-cancelled
				if (bEnableStableColors) {
					this.applyStableColoringToChart();
				}
				this._changeValueAxisTitleVisibility();
			},
			applyStableColoringToChart : function() {
				var oComponent = this.oState.oController.getOwnerComponent();
				var rules = [];
				var oDimensionSettings = oComponent.getChartSettings().dimensionSettings;
				var oDimensionPaths = Object.keys(oDimensionSettings);
				var defaultColoringRules = {};
				for (var i = 0; i < oDimensionPaths.length; i++) {
					var dimensionName = oDimensionPaths[i];
					var dimensionValues = Object.keys(oDimensionSettings[oDimensionPaths[i]]);
					if (this.oChart.getVisibleDimensions().indexOf(dimensionName) > -1) {
						for (var j = 0; j < dimensionValues.length; j++) {
							var oRule = {
									properties : {},
									dataContext: {},
									displayName: ""
								};
							var sDimensionValue =  dimensionValues[j];
							oRule.dataContext[dimensionName] = sDimensionValue;
							oRule.displayName = sDimensionValue;
							if (oDimensionSettings[dimensionName][dimensionValues[j]].color) {
								oRule.properties["color"] = oDimensionSettings[dimensionName][dimensionValues[j]].color;
							}
							rules.push(oRule);
						}
					}
					if (dimensionName === "default") {
						defaultColoringRules["others"] = {
							"properties" : {
								color: oDimensionSettings[dimensionName].color
							}
						};
					}
				}
				oVizPlotArea.plotArea.dataPointStyle = oVizPlotArea.plotArea.dataPointStyle || {};
				oVizPlotArea.plotArea.dataPointStyle = defaultColoringRules;
				oVizPlotArea.plotArea.dataPointStyle["rules"] = rules;
				Object.assign(oVizProperties, oVizPlotArea);
				this.oChart.setVizProperties(oVizProperties);
			},
			_getLastSel: function(newList, oldList) {
				var chart = this.oChart;
				var newSelList = this.oState.detailController && this.oState.detailController._getSelParamsFromDPList(newList);
				var oldSelList = this.oState.detailController && this.oState.detailController._getSelParamsFromDPList(oldList);
				if (newSelList) {
					for (var i = 0; i < newSelList.length; i++) {
						var newSel = newSelList[i];
						var match = false;
						for (var j = 0; j < oldSelList.length; j++) {
							var oldSel = oldSelList[j];

							match = true;
							for (var a in oldSel) {
								if (a.indexOf("__") != -1) {
									continue;
								}

								if (newSel[a] != oldSel[a]) {
									match = false;
									break;
								}
							}

							if (match) {
								break;
							}
						}

						if (!match) {
							var dimList = chart.getVisibleDimensions();
							var newSelOnlyDim = {};
							for (var j = 0; j < dimList.length; j++) {
								var name = dimList[j];
								newSelOnlyDim[name] = newSel[name];
							}

							return newSelOnlyDim;
						}
					}
				}

				return null;
			},
			_onChartDeselectData: function(ev) {
				var me = this;
				this._lastSelected = null;
				var oEvent = deepExtend({}, ev);
				setTimeout(function() { // due to the selection data points not being updated during the deselectData event, must check again asynchronously
					var chart = me.oChart;
					if (chart.getSelectedDataPoints().count == 0) {// Clear the filter if no selections remain.  If a selection exists it would have come through the SelectData event
						me._updateTable();
					} else if (chart.getSelectionMode() == "MULTIPLE") {// Treat an unselect with remaining selection points as a select
						me._onChartSelectData(oEvent);
					}
				}, 1);

				// A drilldown via the breadcrumb (no other event to listen to drilldown events), the drilledUp event doesn't get triggered in this case
				var evtSrc = ev.getParameter("oSource");
				if (evtSrc && evtSrc instanceof sap.m.Link && evtSrc.getParent() instanceof sap.m.Breadcrumbs) {
					me._onChartDrilledUp(ev);
				}
				this.oState.oTemplateUtils.oCommonUtils.setEnabledToolbarButtons(ev.getSource());
				this.oState.oTemplateUtils.oCommonUtils.setEnabledFooterButtons(ev.getSource());
			},
			_onChartDrilledUp: function(ev) {
				this._updateTable();
			},
			_onChartDrilledDown: function(ev) {
				this._updateTable();
			},
			_updateTable: function() {
				var chart = this.oChart;
				if (!chart) {
					return;
				}
				var dpList = [];
				var oVizSelection = this._chartInfo.vizSelection;
				oVizSelection = oVizSelection || chart._getVizFrame().vizSelection();
				if (oVizSelection && oVizSelection.length) {// workaround for bug in chart, will get null pointer exception if vizSelection is not checked
					dpList = this._chartInfo.chartSelection.dataPoints;
				}
				if (!dpList || dpList.length == 0) {
					this._lastSelected = null;
				}
				if (this.oState.detailController) {
					this.oState.detailController.applyParamsToTable();
				}
			},
			/*
			* @private
			* sets the value axis title visibility based on the chart type
			*/
			_changeValueAxisTitleVisibility: function(oEvent) {
				if (this.oChart.getChartType().indexOf("dual_") == 0) {
					this.oChart.setVizProperties({
						"valueAxis":{
							"title":{
								"visible":true
							}
						}
					});
				} else {
					this.oChart.setVizProperties({
						"valueAxis":{
							"title":{
								"visible":false
							}
						}
					});
				}
			}
		});
		return cController;
	});
