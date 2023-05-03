/* global window sap */
sap.ui.define(["sap/ui/generic/app/navigation/service/SelectionVariant",
	"sap/suite/ui/generic/template/AnalyticalListPage/extensionAPI/ExtensionAPI",
	"sap/suite/ui/generic/template/AnalyticalListPage/controller/FilterBarController",
	"sap/suite/ui/generic/template/listTemplates/controller/ToolbarController",
	"sap/suite/ui/generic/template/AnalyticalListPage/controller/VisualFilterBarController",
	"sap/suite/ui/generic/template/AnalyticalListPage/controller/VisualFilterDialogController","sap/suite/ui/generic/template/AnalyticalListPage/controller/AnalyticGridController",
	"sap/ui/table/AnalyticalTable",
	"sap/ui/model/odata/AnnotationHelper",
	"sap/ui/model/analytics/odata4analytics",
	"sap/suite/ui/generic/template/AnalyticalListPage/controller/ContentAreaController",
	"sap/suite/ui/generic/template/listTemplates/controller/IappStateHandler",
	"sap/ui/Device",
	"sap/m/SegmentedButtonItem",
	"sap/m/SegmentedButton",
	"sap/m/OverflowToolbar",
	"sap/m/ToolbarSpacer",
	"sap/m/library",
	"sap/ui/model/Context",
	"sap/suite/ui/generic/template/AnalyticalListPage/util/AnnotationHelper",
	"sap/suite/ui/generic/template/genericUtilities/controlHelper",
	"sap/suite/ui/generic/template/genericUtilities/FeLogger",
	"sap/suite/ui/generic/template/AnalyticalListPage/util/FilterUtil",
	"sap/base/util/ObjectPath",
	"sap/suite/ui/generic/template/lib/ShareUtils",
	"sap/base/util/merge",
	"sap/base/util/deepExtend",
	"sap/suite/ui/generic/template/listTemplates/listUtils",
	"sap/suite/ui/generic/template/listTemplates/controller/MultipleViewsHandler",
	"sap/suite/ui/generic/template/js/StableIdHelper",
	"sap/suite/ui/generic/template/listTemplates/controller/MessageStripHelper",
	"sap/ui/model/json/JSONModel",
	"sap/suite/ui/generic/template/listTemplates/controller/DetailController",
	"sap/ui/comp/personalization/Util",
	"sap/suite/ui/generic/template/lib/AddCardsHelper"
], function(SelectionVariant, ExtensionAPI,
			FilterBarController, ToolbarController, VisualFilterBarController, VisualFilterDialogController, AnalyticGridController, AnalyticalTable,
			ODataAnnotationHelper, Analytics, ContentAreaController, IappStateHandler, Device, SegmentedButtonItem, SegmentedButton,
			OverflowToolbar, ToolbarSpacer, SapMLibrary, Context, ALPHelper, controlHelper, FeLogger, FilterUtil, ObjectPath, ShareUtils, merge, deepExtend,
			ListUtils, MultipleViewsHandler, StableIdHelper, MessageStripHelper, JSONModel, DetailController, PersonalizationControllerUtil, AddCardsHelper) {

		"use strict";

	    var oFeLogger = new FeLogger("AnalyticalListPage.controller.ControllerImplementation");
	    var oLogger = oFeLogger.getLogger();
	    var oLevel = oFeLogger.Level;
		// Constants which are used as property names for storing custom filter data and generic filter data
		var CONTAINER_VIEW_CHART	= "chart",
			FILTER_MODE_VISUAL      = "visual",
			FILTER_MODE_COMPACT     = "compact",
			COZY_MIN_RESOLUTION     = 900;//in px
		return {
			getMethods: function(oViewProxy, oTemplateUtils, oController) {
				var oState = {};// contains attributes oSmartFilterbar and oSmartTable. Initialized in onInit.
				oState.oRefreshTimer = null;
				oState.nRefreshInterval = 0;
				oState.bVisualFilterInitialised = false;
				oState._bIsStartingUp = true;

				function attachRefreshInterval(nRefreshInterval) {
					oState.oRefreshTimer = setTimeout(function () {
						var oComponent = oController.getOwnerComponent();
						var oTemplatePrivateModel = oComponent.getModel("_templPriv");
						//If filterchanged in FilterBar true then dont do refresh Binding
						if (!oTemplatePrivateModel.getProperty("/alp/filterChanged")) {
							oViewProxy.refreshBinding();
						}
					}, nRefreshInterval);
				}

				function clearingRefreshTimerInterval(bIsCleared) {
					if (oState.nRefreshInterval !== 0) {
						if (oState.oRefreshTimer !== null) {
							clearTimeout(oState.oRefreshTimer);
						}
						if (!bIsCleared) {
							attachRefreshInterval(oState.nRefreshInterval);
						}
					}
				}

				// -- Begin of methods that are used in onInit only
				function fnSetIsLeaf() {
					var oComponent = oController.getOwnerComponent();
					var oTemplatePrivateModel = oComponent.getModel("_templPriv");
					oTemplatePrivateModel.setProperty("/listReport/isLeaf", oComponent.getIsLeaf());
				}
				// -- End of used in onInit only

				function determineDefaultValues(oEntityType, sTerm) {
					var aProperties = oEntityType && oEntityType.property;
					return aProperties.filter(function(property) {
						return typeof property[sTerm] !== "undefined";
					});
				}

				function createDefaultFilter(oSmartFilterbar) {
					var oModel = oSmartFilterbar.getModel(),
						oMetaModel = oModel && oModel.getMetaModel(),
						oResultEntityType = oMetaModel && oMetaModel.getODataEntityType(oSmartFilterbar.getEntityType()),
						oDataSuiteFormat,
						sResultEntityType = oMetaModel && oMetaModel.getODataEntityType(oSmartFilterbar.getEntityType(), true),
						oSV = ALPHelper.createSVAnnotation(oResultEntityType, oMetaModel, oState.oController.getOwnerComponent().getQualifier());
					if (oState.oController.getOwnerComponent().getFilterDefaultsFromSelectionVariant() && oSV) {
						//if there is SV, then create the object
						oDataSuiteFormat = ListUtils.createSVObject(merge({}, oSV), oSmartFilterbar);
					} else {
						if (oState.oController.getOwnerComponent().getFilterDefaultsFromSelectionVariant() && !oSV) {//Log warning only if filterDefaultsFromSelectionVarian setting is true but there is no SV in the annotations
							oLogger.warning("No SelectionVariant found in the annotation : No default values filled in FilterBar");
						}
						var aResultDefaultProperties = oResultEntityType && determineDefaultValues(oResultEntityType, "com.sap.vocabularies.Common.v1.FilterDefaultValue"),
							o4AnaModel, oParameterization, oParameterEntitySet, oParameterEntityType,
							oQueryResult, aParameterDefaultProperties = [];

						try {
							//Find the parameter set and check the properties
							o4AnaModel = new Analytics.Model(new Analytics.Model.ReferenceByModel(oModel));
							oQueryResult = o4AnaModel && o4AnaModel.findQueryResultByName(oSmartFilterbar.getEntitySet());
							oParameterization = oQueryResult && oQueryResult.getParameterization();
							oParameterEntitySet = oParameterization && oMetaModel.getODataEntitySet(oParameterization.getEntitySet().getQName());
							oParameterEntityType = oParameterEntitySet && oMetaModel.getODataEntityType(oParameterEntitySet.entityType);
							aParameterDefaultProperties = oParameterEntityType ? determineDefaultValues(oParameterEntityType, "defaultValue") : [];
						} catch (e) {
							oLogger.error(e);
						}
						if (aResultDefaultProperties.length > 0 || aParameterDefaultProperties.length > 0) {
							oDataSuiteFormat = new SelectionVariant();
							aResultDefaultProperties.forEach(function (property) {
								var oContext = oMetaModel.createBindingContext(sResultEntityType + "/property/[${path:'name'}===\'" + property.name + "']/com.sap.vocabularies.Common.v1.FilterDefaultValue");
								oDataSuiteFormat.addSelectOption(property.name, "I", "EQ", ODataAnnotationHelper.format(oContext));
							});
							aParameterDefaultProperties.forEach(function (property) {
								oDataSuiteFormat.addParameter(property.name, property.defaultValue);
							});
						}
					}
					return oDataSuiteFormat;
				}

				function onSmartFilterBarInitialise(oEvent){
					var oSmartFilterbar = oEvent.getSource();

					//Pref Improvement - Suspend SetFilterData until the app load
					oSmartFilterbar.suspendSetFilterData();

					var oDefaultFilterSuiteFormat = createDefaultFilter(oSmartFilterbar); //TODO: Refactor the code so that this is done only in the case of initial load + Standard Variant.

					//Set default values if available
					if (oDefaultFilterSuiteFormat) {
						oState.oIappStateHandler.fnSetFiltersUsingUIState(oDefaultFilterSuiteFormat.toJSONObject(), {}, true, false);
					}
					oState.oIappStateHandler.onSmartFilterBarInitialise();
					oController.onInitSmartFilterBarExtension(oEvent);
					oController.templateBaseExtension.onInitSmartFilterBar(oEvent);
				}
				function onSmartFilterBarInitialized(){
					var manifestSetting = oState.oController.getOwnerComponent();
					if (oState.hideVisualFilter || (manifestSetting.getDefaultFilterMode() == "visual" && manifestSetting.getModel().mMetadataUrlParams && manifestSetting.getModel().mMetadataUrlParams["sap-value-list"] === "none" )) {
						if (oState.alr_visualFilterBar && !oState.alr_visualFilterBar.getAssociateValueListsCalled()) {
							oState.alr_visualFilterBar.setAssociateValueListsCalled(true);
						}
						oState.oSmartFilterbar.associateValueLists();
					}
					var oAppStatePromise = oState.oIappStateHandler.onSmartFilterBarInitialized();
					oAppStatePromise.then(function(){
						oState._bIsStartingUp = false;
						//visual filter config and bindings must be updated after vf has been initialised
						if (oState.bVisualFilterInitialised) {
							oState.oIappStateHandler.fnUpdateVisualFilterBar();
						}
						//to generate the appstate on initial laod
						if (oState.sNavType !== sap.ui.generic.app.navigation.service.NavType.iAppState) {
							oState.oIappStateHandler.fnStoreCurrentAppStateAndAdjustURL();
						}

					}, function(oError){ // improve?
						if (oError instanceof Error) {
							oError.showMessageBox(); // improve?
						}
						oState.oIappStateHandler.fnOnError();
						oState._bIsStartingUp = false;

					}).finally(function(){
						if (oState.oSmartFilterableKPI) {
							var oContent = oState.oSmartFilterableKPI.getContent();
							oContent.forEach(function(oItem) {
								if (oItem.getSmartFilterId) {
									oItem._bStopDataLoad  = false;
									oItem._updateKpiList(true);
								}
							});
						}
					});
				}

				// selectionChange for MultiSelectionPlugin
				function fnOnMultiSelectionChange(oEvent) {
					var oPlugin = oEvent.getSource(),
						bLimitReached = oEvent.getParameters().limitReached,
						iIndices = oPlugin.getSelectedIndices(),
						sMessage, oTable;

					if (iIndices.length > 0) {
						if (bLimitReached) {
							//sMessage = oTemplateUtils.oCommonUtils.getText("ST_SELECTION_LIMIT_REACHED", [oPlugin.getLimit()]);
							sMessage = "Your last selection was limited to the maximum of " + oPlugin.getLimit() + " items."; //TODO i18n
							oTemplateUtils.oServices.oApplication.showMessageToast(sMessage);
							//oPopoverDialog = new sap.m.Popover("", {	}); //TODO
						}
					}
					oTable = oPlugin.getParent();
					oTemplateUtils.oCommonUtils.setEnabledToolbarButtons(oTable);
				}

				function fnOnSemanticObjectLinkNavigationPressed(oEvent){
					var oEventParameters = oEvent.getParameters();
					var oEventSource = oEvent.getSource();
					oTemplateUtils.oCommonEventHandlers.onSemanticObjectLinkNavigationPressed(oEventSource, oEventParameters);
				}

				function fnOnSemanticObjectLinkNavigationTargetObtained(oEvent) {
					var oEventParameters, oEventSource;
					oEventParameters = oEvent.getParameters();
					oEventSource = oEvent.getSource();	//set on semanticObjectController
					oTemplateUtils.oCommonEventHandlers.onSemanticObjectLinkNavigationTargetObtained(oEventSource.getEntitySet(), oEventSource.getFieldSemanticObjectMap(), oEventParameters, oState);
				}

				function _getFilters(oSmartCtrl) {
					var oSmartFilterbar = oState.oSmartFilterbar;
					var filters = [];
					if (oSmartCtrl.fetchVariant() && oSmartCtrl.fetchVariant().filter && oSmartCtrl.fetchVariant().filter.filterItems) {
						filters = oSmartCtrl.fetchVariant().filter.filterItems;
					}
					var mSmartCtrlConfig = {
						search: !!oSmartFilterbar.getBasicSearchValue(),
						filter: !!(filters.length || oSmartFilterbar.retrieveFiltersWithValues().length)
					};
					return mSmartCtrlConfig;
				}

				function setNoDataChartTextIfRequired(oSmartChart) {
					var sSmartChartId = oSmartChart.getId();
					var mSmartChartConfig = _getFilters(oSmartChart);
					var sNoDataText = "";
					if (mSmartChartConfig.search || mSmartChartConfig.filter) {
						sNoDataText = oTemplateUtils.oCommonUtils.getContextText("NOITEMS_SMARTCHART_WITH_FILTER", sSmartChartId);
					} else {
						sNoDataText = oTemplateUtils.oCommonUtils.getContextText("NOITEMS_SMARTCHART", sSmartChartId);
					}
					oSmartChart.getChartAsync().then(function (chart) {
						chart.setCustomMessages({
							NO_DATA: sNoDataText
						});
					});
				}
				function onShareListReportActionButtonPressImpl(oButton) {
					var oFragmentController = {

						sharePageToPressed: function(target) {
							var oBusyHelper = oTemplateUtils.oServices.oApplication.getBusyHelper();
							if (oBusyHelper.isBusy()) {
								return; // Ignore user interaction while the app is busy.
							}
							var sSubject = oTemplateUtils.oServices.oApplication.getAppTitle();
							var oTriggerPromise = ShareUtils.getCurrentUrl().then(function(sCurrentUrl){
								switch (target) {
									case "MicrosoftTeams":
										ShareUtils.openMSTeamsShareDialog(sSubject, sCurrentUrl);
										break;
									case "Email":
										sSubject = oTemplateUtils.oCommonUtils.getText("EMAIL_HEADER", [ sSubject ]);
										sap.m.URLHelper.triggerEmail(null, sSubject, sCurrentUrl);
										break;
									default:
										break;
								}
							});
							oBusyHelper.setBusy(oTriggerPromise);
						},

						shareJamPressed: function() {
							ShareUtils.openJamShareDialog(oTemplateUtils.oServices.oApplication.getAppTitle());
						},

						shareTilePressed: function() {
							ShareUtils.fireBookMarkPress();
						},

						getDownloadUrl: function() {
							var oTable = oState.oSmartTable.getTable();
							var oBinding = oTable.getBinding("rows") || oTable.getBinding("items");

							return oBinding && oBinding.getDownloadUrl() || "";
						},

						getServiceUrl: function () {
							// only create static tile, if filter for any semanticDateRangeProperty (including custom filter field) exists
							return oState.oSmartFilterbar.hasDateRangeTypeFieldsWithValue().then(function (bStaticTileToBeCreated) {
								var sServiceUrl = bStaticTileToBeCreated ? "" : oFragmentController.getDownloadUrl();
								sServiceUrl = sServiceUrl && sServiceUrl + "&$top=0&$inlinecount=allpages";
								var oShareInfo = {
									serviceUrl: sServiceUrl
								};
								oController.onSaveAsTileExtension(oShareInfo);

								return oShareInfo.serviceUrl;
							});
						},

						getModelData: function() {
							var fnGetUser = ObjectPath.get("sap.ushell.Container.getUser");
							var oMetadata = oController.getOwnerComponent().getAppComponent().getMetadata();
							var oUIManifest = oMetadata.getManifestEntry("sap.ui");
							var oAppManifest = oMetadata.getManifestEntry("sap.app");
							
							return oFragmentController.getServiceUrl().then(function(sServiceUrl) {
								return ShareUtils.getCurrentUrl().then(function (sCurrentUrl) {
									return {
										serviceUrl: sServiceUrl,
										icon: oUIManifest && oUIManifest.icons ? oUIManifest.icons.icon : "",
										title: oAppManifest ? oAppManifest.title : "",
										isShareInJamActive: !!fnGetUser && fnGetUser().isJamActive(),
										customUrl: ShareUtils.getCustomUrl(),
										currentUrl: sCurrentUrl
									};
								});
							});
						}
					};

					ShareUtils.openSharePopup(oTemplateUtils.oCommonUtils, oButton, oFragmentController);
					// var oBookmarkButton = this.getView().byId("bookmarkButton");
					// oBookmarkButton.setBeforePressHandler(function() {
					// 	// set the focus to share button
					// 	oButton.focus();
					// });
				}
				// Generation of Event Handlers
				return {
					onInit: function() {
						var oComponent = oController.getOwnerComponent();
						//By default the log level is set to ERROR and warning messages dont appear in the console. Lowering the level only for the case where warning is logged due to undefined SV
						oLogger.setLevel(oLevel.WARNING, "ALPSmartFilterBar");
						var oTemplatePrivateModel = oComponent.getModel("_templPriv");
						oTemplatePrivateModel.setProperty("/alp", {
							filterMode: oComponent.getHideVisualFilter() ? FILTER_MODE_COMPACT : oComponent.getDefaultFilterMode(),
							contentView: oComponent.getDefaultContentView(),
							autoHide: oComponent.getAutoHide(),
							visibility: {
								hybridView: (Device.system.phone || Device.system.tablet && !Device.system.desktop) ? false : true
							},
							filterChanged : false
						});
						oState.hideVisualFilter = oComponent.getHideVisualFilter();
						oState.hideVisualFilter = (oState.hideVisualFilter === undefined || oState.hideVisualFilter !== true) ? false : true;
						oState.quickVariantSelectionX = oComponent.getQuickVariantSelectionX();
						oState.oSmartFilterbar = oController.byId("template::SmartFilterBar");
						oState.oSmartTable = oController.byId("table");
						oState.oSmartFilterableKPI = oController.byId("template::KPITagContainer::filterableKPIs");
						oState.oPage = oController.byId("template::Page");
						oState.oSmartChart = oController.byId("chart");
						var oMultipleViewsHandler = new MultipleViewsHandler(oState, oController, oTemplateUtils);
						oState.oMultipleViewsHandler = oMultipleViewsHandler;
						oState.oMessageStripHelper = new MessageStripHelper(oTemplateUtils.oServices.oPresentationControlHandlerFactory.getPresentationControlHandler(oState.oSmartTable), oMultipleViewsHandler, oController, oTemplateUtils, "alp");
						if (oController.getOwnerComponent().getProperty("dshQueryName")) {
							oState.oAnalyticGridContainer = oController.byId("template::AnalyticGridContainer");
							oState.oAnalyticGridController = new AnalyticGridController();
							oState.oAnalyticGridController.setState(oState);
						}
						oState.alr_compactFilterContainer = oController.byId("template::CompactFilterContainer");
						oState.alr_visualFilterContainer = oController.byId("template::VisualFilterContainer");
						oState.alr_filterContainer = oController.byId("template::FilterContainer");
						oState.alr_visualFilterBar = oController.byId("template::VisualFilterBar");
						var sKey = "";
						if (oState.quickVariantSelectionX){
							sKey = oMultipleViewsHandler.getSelectedKey();
						}
						var responsiveHightlightColId = StableIdHelper.getStableId( {type: "ALPTable", subType: "ColumnListItem", sQuickVariantKey: sKey});
						oState.alp_ColumnListItem = oController.byId(responsiveHightlightColId);

						if (oState.alr_visualFilterBar) {
							var oFilterSettings = oComponent.getFilterSettings();
							if (oFilterSettings && Object.keys(oFilterSettings).length > 0) {
								oState.alr_visualFilterBar.setFilterSettings(oFilterSettings);
							}
							oState.alr_visualFilterBar.setSmartFilterId(oState.oSmartFilterbar.getId());
							oState.alr_visualFilterBar.attachOnFilterItemAdded(function(oEvent) {
								var oFilterItem = oEvent.getParameters();
								oFilterItem.attachBeforeRebindVisualFilter(function(oEvt) {
									var mParams = oEvt.getParameters();
									var sEntityType = mParams.sEntityType;
									var sDimension = mParams.sDimension;
									var sMeasure = mParams.sMeasure;
									var oContext = mParams.oContext;

									var oExtController = oState.oController;
									oExtController.onBeforeRebindVisualFilterExtension(sEntityType, sDimension, sMeasure, oContext);
								});
							});
						}
						oState.oKpiTagContainer = oController.byId("template::KPITagContainer::globalKPIs");
						oState.oFilterableKpiTagContainer = oController.byId("template::KPITagContainer::filterableKPIs");
						if (oState.oKpiTagContainer || oState.oFilterableKpiTagContainer) {
							sap.ui.require(["sap/suite/ui/generic/template/AnalyticalListPage/controller/KpiTagController"], function (oKpiTagController) {
								oKpiTagController.init(oState);
							});
						}
						oState.oContentArea = new ContentAreaController();
						oState.oTemplateUtils = oTemplateUtils;
						oState.toolbarController = new ToolbarController();
						oState.oController = oController;
						oState.filterBarController = new FilterBarController();
						oState.filterBarController.init(oState);
						oState.oContentArea.createAndSetCustomModel(oState);
						oState.oMultipleViewsHandler.getInitializationPromise().then(function() {
							oState.oContentArea.setState(oState);
						});

						if (!oState.hideVisualFilter) {
							oState.visualFilterBarContainer = new VisualFilterBarController();
							oState.visualFilterBarContainer.init(oState);
						}
						// adding custom filter value after rendering of visual filter values.
						// BCP: 1980291471
						if (oState.alr_visualFilterBar) {
							oState.alr_visualFilterBar.addEventDelegate({
								onAfterRendering : function () {
									if (oState.oSmartFilterbar.isInitialised()) {
										oState.oSmartFilterbar.setFilterData({
											_CUSTOM : oState.oIappStateHandler.getFilterState()
										});
									}
								}
							});
						}

						oState.oIappStateHandler = new IappStateHandler(oState, oController, oTemplateUtils);
						fnSetIsLeaf();

						oController.byId("template::FilterText").attachBrowserEvent("click", function () {
							oController.byId("template::Page").setHeaderExpanded(true);
						});

						oTemplatePrivateModel.setProperty("/listReport/isHeaderExpanded", true);

						oTemplatePrivateModel.setProperty("/generic/bDataAreShownInChart", false);
						//Making Condense is the default mode in ALP,but in List Report Compact is the default
						//compare the following logic with Application.js->getContentDensityClass:
						if (oState.oSmartTable) {
							var oTable = oState.oSmartTable.getTable();
						}
						var sCozyClass = "sapUiSizeCozy", sCompactClass = "sapUiSizeCompact", sCondensedClass = "sapUiSizeCondensed";
						if (controlHelper.isUiTable(oTable) || oTable instanceof AnalyticalTable) {
							var oView = oController.getView();
							var oBody = document.body;
							if (oBody.classList.contains(sCozyClass) || oView.hasStyleClass(sCozyClass)){
								oState.oSmartTable.addStyleClass(sCozyClass);
							} else if (oBody.classList.contains(sCompactClass) || oView.hasStyleClass(sCompactClass)) {
								var bCondensedTableLayout = oComponent.getCondensedTableLayout();
								if (bCondensedTableLayout === false) {
									oState.oSmartTable.addStyleClass(sCompactClass);
								} else {
									oState.oSmartTable.addStyleClass(sCondensedClass);
								}
							}
						}

						//to attach onBeforeRebindFilterableKPIExtension and also assign the _templPriv model to FilterableKPITag container
						if (oState.oSmartFilterableKPI) {
							oState.oSmartFilterableKPI.setModel(oComponent.getModel("_templPriv"), "_templPriv");
							var oContent = oState.oSmartFilterableKPI.getContent(),
								oExtController = oState.oController;
							oContent.forEach(function(oItem) {
								if (oItem.getSmartFilterId) {
									oItem.attachBeforeRebindFilterableKPI(function(oEvent) {
										var oParams = oEvent.getParameters(),
											oSelectionVariant = oParams.selectionVariant,
											sEntityType = oParams.entityType,
											sKPIId = oEvent.getSource().getId();
										oExtController.onBeforeRebindFilterableKPIExtension(oSelectionVariant, sEntityType, sKPIId);
									}, oExtController);
								}
							});
						}

						/**
						 * This function return the URL parameter info
						 * @return {promise}
						 */
						oViewProxy.getUrlParameterInfo = function(){
							return oState.oIappStateHandler.getUrlParameterInfo();
						};

						// Give component access to below methods via oViewProxy
						oViewProxy.onComponentActivate = function(){
							//TODO Need to implements this as ListReport has implemented.
							//require to implements IappStateHandler to be implemented in ALP.
							/*if (!oState._bIsStartingUp){
								oIappStateHandler.parseUrlAndApplyAppState();
							}*/
						};
						//
						oViewProxy.refreshBinding = function(){
							//Update Binding in chart Items in Smart Filter Bar
							if (oState.alr_visualFilterBar && oState.alr_visualFilterBar.updateVisualFilterBindings) {
								oState.alr_visualFilterBar.updateVisualFilterBindings();
							}
							// Rebind chart
							if (oState.oSmartChart && oState.oSmartChart.rebindChart) {
								oState.oSmartChart.rebindChart();
							}
							// Rebind table
							if (oState.oSmartTable) {
								oTemplateUtils.oServices.oPresentationControlHandlerFactory.getPresentationControlHandler(oState.oSmartTable).refresh();
							}
							//Refresh Global Kpi
							if (oState.oKpiTagContainer) {
								var aContent = oState.oKpiTagContainer.mAggregations.content;
								for (var i in aContent){
									if (aContent[i]._createGlobalKpi) {
										aContent[i]._createGlobalKpi();
									}
								}
							}
							//Refresh Filterable Kpi
							if (oState.oFilterableKpiTagContainer) {
								var aContent = oState.oFilterableKpiTagContainer.mAggregations.content;
								for (var i in aContent){
									if (aContent[i]._createFilterableKpi) {
										aContent[i]._createFilterableKpi();
									}
								}
							}
							clearingRefreshTimerInterval();
						};

						oViewProxy.onSuspend = function() {
							clearingRefreshTimerInterval(true);
						};

						oViewProxy.onRestore = function() {
							if (oState.nRefreshInterval) {
								attachRefreshInterval(oState.nRefreshInterval);
							}
						};

						if (oState.alr_visualFilterBar) {
							oState.alr_visualFilterBar.attachInitialized(function(oEvent) {
								oState.bVisualFilterInitialised = true;
								if (!oState._bIsStartingUp) {
									oState.oIappStateHandler.fnUpdateVisualFilterBar(true);
								}
							});
						}
						//Update filter model so that UI can adapt on each filter change
						oState.oSmartFilterbar.attachFilterChange(function(oEvent) {
							var oTemplatePrivateModel = oComponent.getModel("_templPriv");
							// check if search can be performed or not after filter change
							oState.oIappStateHandler.fnCheckMandatory();	//Check and update searchable property
							var bIsDialogOpen = oState.oSmartFilterbar.isDialogOpen();
							var sfb  = oEvent.getSource(), oAllFilterData; //, filterbarModel, filterDialogModel;
							// get filter data for all fields so that model change via two-way binding does not
							// re-trigger set dimension filter in visual filter
							oAllFilterData = deepExtend({}, sfb.getFilterData(true));
							if (bIsDialogOpen && oState.visualFilterDialogContainer) {//check for presence of vf dialog as it is absent in case of hideVisualfilter=true
								var filterDialogModel = oState.visualFilterDialogContainer.oVerticalBox.getModel("_dialogFilter");
								filterDialogModel.setData(oAllFilterData);
							} else {
								var filterbarModel = oState.oController.getOwnerComponent().getModel("_filter");
								filterbarModel.setData(oAllFilterData);
							}
							if (oEvent.getParameters().filterItem) { // call changeVisibility() only if a filterItem is added or deleted
								if (!oState.hideVisualFilter) {
									oState.filterBarController.changeVisibility(oEvent);
								}
								// BCP: 1770556353 - When visibility of filter item is changed in dialog, search is triggered.
								//chart rebind is prevented; however table is rebound. In this case chart selection must be applied to table.
								oTemplatePrivateModel.setProperty('/alp/_ignoreChartSelections', false);
							}
							oState.filterBarController._updateFilterLink();
							if (!oState.oSmartFilterbar.isLiveMode() && !oState.oSmartFilterbar.isDialogOpen()) {
								// If No Filterable KPI's are there, removed oState.oSmartFilterableKPI check as its
								// blocking the filterChanged Value to True when Filter is Changed
								oTemplatePrivateModel.setProperty('/alp/filterChanged', true);
							}
						});

						var oView = oController.getView();
						var oBody = document.body;
						var bIsCozyMode, defaultView;
						if (oBody.classList.contains(sCozyClass) || oView.hasStyleClass(sCozyClass)){
							bIsCozyMode = true;
						}
						if (bIsCozyMode && oComponent.getTableType() !== "ResponsiveTable") {
							var templPrivModel = oComponent.getModel("_templPriv");
							if (Device.resize.height <= COZY_MIN_RESOLUTION) {
								defaultView = templPrivModel.getProperty('/alp/contentView');
								templPrivModel.setProperty('/alp/enableHybridMode', false);
								templPrivModel.setProperty('/alp/contentView', defaultView === "charttable" ? "chart" : defaultView);
							}
							oState.resizeHandler = function(mParams) {
								var windowHeight = mParams.height;
								if (windowHeight <= COZY_MIN_RESOLUTION) {
									defaultView = templPrivModel.getProperty('/alp/contentView');
									templPrivModel.setProperty('/alp/enableHybridMode', false);
									templPrivModel.setProperty('/alp/contentView', defaultView === "charttable" ? "chart" : defaultView);
								} else {
									templPrivModel.setProperty('/alp/enableHybridMode', true);
								}
							};
							Device.resize.attachHandler(oState.resizeHandler);
						}

						//Setting refreshInterval on Load of the Application
						if (oComponent.getRefreshIntervalInMinutes()) {
							oState.nRefreshInterval = oComponent.getRefreshIntervalInMinutes();
							oState.nRefreshInterval = (oState.nRefreshInterval < 1 ? 1 : oState.nRefreshInterval) * 60000;
						}
						var oMenuButton = oController.byId(StableIdHelper.getStableId({
							type: "ALPAction",
							subType: "Share"
						}) + "-internalBtn");
						if (oMenuButton) {
							oMenuButton.attachPress(function(){
								onShareListReportActionButtonPressImpl(oMenuButton);
							});
						}
					},

					attachRefreshInterval : attachRefreshInterval,
					clearingRefreshTimerInterval: clearingRefreshTimerInterval,

					onExit: function() {
						if (oState.resizeHandler) {
							Device.resize.detachHandler(oState.resizeHandler);
						}
						if (oState.oRefreshTimer !== null) {
							clearTimeout(oState.oRefreshTimer);
						}
					},

					handlers: {
						onBack: function() {
							oTemplateUtils.oServices.oNavigationController.navigateBack();
						},
						onSmartTableInit: function(oEvent) {
							var oSmartTable = oEvent.getSource(),
								toolbar = oSmartTable.getCustomToolbar(),
								oToolBarcontent = toolbar.getContent(),
								nSettingsLength ;
							//To check if navigation targets are supported of the toolbar buttons are supported
							oSmartTable.setHeight("100%");
							oTemplateUtils.oCommonUtils.checkToolbarIntentsSupported(oSmartTable);
							//Adding view switch button to smart table toolbar
							//BUttons added here as opposed to XML because of maintaining their position in toolbar
							if (oState._pendingTableToolbarInit) {
								if (!oState.oSmartFilterableKPI && !oState.oMultipleViewsHandler.getMode()){
									toolbar.insertContent(oState.alr_viewSwitchButtonOnTable, oToolBarcontent.length);
								}
							}
							// Add to the SmartTable's toolbar to the left of the settings button.
							if ( oState._pendingTableToolbarInit ){
									// this block gets the position of the eye icon in the toolbar i.e just before the settins icon
									for (var i = 0; i < oToolBarcontent.length ;  i++) {
										if (oToolBarcontent[i].mProperties.text === "Settings") {
											nSettingsLength = i ;
																	}
									}
									toolbar.insertContent(oState._autoHideToggleBtn, nSettingsLength);
							}
							delete oState._pendingTableToolbarInit;
							//Disable the toolbars once search is triggered
							oSmartTable.attachShowOverlay(function(oEvent){
								oSmartTable.getCustomToolbar().setEnabled(!oEvent.getParameter("overlay").show);
							});
							var tableHighlightModel = new JSONModel({"highlightMode":"rebindTable"});
							oSmartTable.setModel(tableHighlightModel,"_tableHighlight");
						},
						onBeforeRebindTable: function(oEvent) {
							var oSmartTable = oEvent.getSource();
							var variant = oSmartTable && oSmartTable.fetchVariant();
							var oBindingParams = oEvent.getParameter("bindingParams");
							
							// add handler for change event
							oState.oMessageStripHelper.onBeforeRebindControl(oEvent);
							if (oState.chartController && oState.chartController.oChart) {
								var oChart = oState.chartController.oChart,
									oChartInfo = oState.chartController._chartInfo;
									oChartInfo.drillStack = oState.chartController.oChart.getDrillStack();
								var filtersFromChartDrilldown = (oChartInfo.drillStack && oChartInfo.drillStack.length > 0) ? oChartInfo.drillStack[oChartInfo.drillStack.length - 1] : undefined;
							}
							if (!variant) {
								return;
							}
							var oTemplatePrivateModel = oController.getOwnerComponent().getModel("_templPriv");
							//Ignore chart selections when there are fresh filters from SmartFilterBar
							var _ignoreChartSelections = oTemplatePrivateModel.getProperty('/alp/_ignoreChartSelections');
							//To apply chart selections on the table without using _applyParamToTableAsFilters()
							if (oState.detailController.isFilter() && oState.oSmartChart && !_ignoreChartSelections) {
								oState.detailController._applyChartSelectionOnTableAsFilter(oEvent, oChart);
							}
							//Apply drill down filters if available irrespective of whether ignoreChartselection is true/false only in FilterMode
							if (oState.detailController.isFilter() && filtersFromChartDrilldown && filtersFromChartDrilldown.filter) {
								oBindingParams.filters.push(filtersFromChartDrilldown.filter);
							}
							// Update the chart with the personalization state
							// Get the list of grouped columns
							var groupList = [];
							var colList = oSmartTable.getTable().getColumns();
							for (var i = 0; i < colList.length; i++) {
								var col = colList[i];
								//getGrouped is only available for Analytical Table
								if (col.getGrouped && col.getGrouped()) {
									groupList.push(col.getLeadingProperty ? col.getLeadingProperty() : PersonalizationControllerUtil.getColumnKey(col));
								}
							}
							oState.detailController._updateExpandLevelInfo(groupList);
							//Setting the provideTotalResultSize in binding parameters to improve performance for Analytical Table
							if (oController.getOwnerComponent().getModel().getDefaultCountMode() === "None" && oSmartTable._isAnalyticalTable){
								oBindingParams.parameters.provideTotalResultSize = false;
								oSmartTable.setShowRowCount(false);
							}
							//Call controller extension
							oController.onBeforeRebindTableExtension(oEvent);
							oState.oMultipleViewsHandler.aTableFilters =  deepExtend({}, oBindingParams.filters);
							var fnRefresh = oBindingParams.events.refresh || Function.prototype;
							oBindingParams.events.refresh = function(oRefreshEvent){
								oState.oMultipleViewsHandler.onDataRequested();
								fnRefresh.call(this, oRefreshEvent);
							};
							var fnDataRequested = oBindingParams.events.dataRequested || Function.prototype;
							oBindingParams.events.dataRequested = function(oRequestEvent){
								oState.detailController.onSmartTableDataRequested(oSmartTable);
								fnDataRequested.call(this, oRequestEvent);
							};
							var fnDataReceived = oBindingParams.events.dataReceived || Function.prototype;
							oBindingParams.events.dataReceived = function(oReceivedEvent){
								oState.oContentArea.enableToolbar();
								oTemplateUtils.oCommonEventHandlers.onDataReceived(oSmartTable);
								oTemplateUtils.oComponentUtils.hidePlaceholder();
								fnDataReceived.call(this, oReceivedEvent);
							};
							
							oTemplateUtils.oCommonEventHandlers.onBeforeRebindTable(oEvent, {
								setBindingPath: oSmartTable.setTableBindingPath.bind(oSmartTable),
								ensureExtensionFields: oController.templateBaseExtension.ensureFieldsForSelect,
								addExtensionFilters: oController.templateBaseExtension.addFilters,
								resolveParamaterizedEntitySet: oState.oMultipleViewsHandler.resolveParameterizedEntitySet,
								isMandatoryFiltersRequired: false,
								isFieldControlRequired: false,
								isPopinWithoutHeader: false,
								isDataFieldForActionRequired: false,
								isFieldControlsPathRequired: false
							});
							// initial filters from smarttable, a copy
							var aFiltersFromSmartTable = oBindingParams.filters.slice(0);
							oState.oMultipleViewsHandler.onRebindContentControl(oBindingParams, aFiltersFromSmartTable);
							oSmartTable.getModel("_tableHighlight") && oSmartTable.getModel("_tableHighlight").setProperty("/highlightMode","rebindTable");
							oState.detailController._applyCriticalityInfo(oEvent, oSmartTable);
							ListUtils.handleErrorsOnTableOrChart(oTemplateUtils, oEvent, oState);
						},
						onSelectionDetailsActionPress: function (oEvent) {
							oState.oMultipleViewsHandler.onDetailsActionPress(oEvent);
						},
						addEntry: function(oEvent) {
							var oEventSource = oEvent.getSource();
								oTemplateUtils.oCommonEventHandlers.addEntry(oEventSource, false, oState.oSmartFilterbar);
						},
						deleteEntries: function(oEvent) {
							oTemplateUtils.oCommonEventHandlers.deleteEntries(oEvent);
						},
						onSelectionChange: function(oEvent) {
							var oTable = oEvent.getSource(),
								oModel = oTable.getModel(),
								oPrivModel = oTable.getModel("_templPriv");

							var oMetaModel = oModel.getMetaModel(),
								oEntitySet = oMetaModel.getODataEntitySet(this.getOwnerComponent().getEntitySet()),
								oDeleteRestrictions = oEntitySet["Org.OData.Capabilities.V1.DeleteRestrictions"];

							var sDeletablePath = (oDeleteRestrictions && oDeleteRestrictions.Deletable && oDeleteRestrictions.Deletable.Path) ? oDeleteRestrictions.Deletable.Path : "";
							var bDeleteEnabled = false;

							var bAllLocked = true;
							var bAllNotDeletable = (sDeletablePath && sDeletablePath !== ""); // if Deletable-Path is undefined, then the items are deletable.

							var aContexts = oTemplateUtils.oServices.oPresentationControlHandlerFactory.getPresentationControlHandler(oTemplateUtils.oCommonUtils.getOwnerPresentationControl(oTable)).getSelectedContexts();
							if (aContexts.length > 0) {
								for (var i = 0; i < aContexts.length; i++) {
									var oObject = oModel.getObject(aContexts[i].getPath());

									// check if item is locked
									if (!(oObject.IsActiveEntity && oObject.HasDraftEntity && oObject.DraftAdministrativeData && oObject.DraftAdministrativeData.InProcessByUser)) {
										bAllLocked = false;
									}
									// check if item is deletable
									if (bAllNotDeletable) {
										if (oModel.getProperty(sDeletablePath, aContexts[i])) {
											bAllNotDeletable = false;
										}
									}
									if (!bAllLocked && !bAllNotDeletable) {
										bDeleteEnabled = true;
										break;
									}
								}
							}
							oPrivModel.setProperty("/listReport/deleteEnabled", bDeleteEnabled);

						},
						onMultiSelectionChange: fnOnMultiSelectionChange,

						onChange: function(oEvent) {
							oTemplateUtils.oCommonEventHandlers.onChange(oEvent);
						},
						onContactDetails: function(oEvent) {
							oTemplateUtils.oCommonEventHandlers.onContactDetails(oEvent);
						},
						onSmartFilterBarInitialise: onSmartFilterBarInitialise,
						onSmartFilterBarInitialized: onSmartFilterBarInitialized,

						onEditStateFilterChanged: function(oEvent) {
							oEvent.getSource().fireChange();
						},
						onFilterPress: function(oEvent){
							oState.filterBarController.showDialog.call(oState.filterBarController);
						},
						onClearPress: function(oEvent){
							oState.filterBarController.clearFilters();
							oController.onClearFilterExtension(oEvent);
						},
						//Event handler for go button press
						onGoPress: function(oEvent){
							oState.filterBarController.fnCheckMandatory();
							var bIsDialogOpen = oState.oSmartFilterbar.isDialogOpen();
							if (!bIsDialogOpen) {
								oState.filterBarController.onGoFilter();
							}
						},

						onBeforeSFBVariantSave: function() {
							/*
							 * When the app is started, the VariantManagement of the SmartFilterBar saves the initial state in the
							 * STANDARD (=default) variant and therefore this event handler is called. So, even though the name of
							 * the event handler is confusing, we need to provide the initial state to allow the SmartFilterBar to
							 * restore it when needed (i.e. when the user clicks on restore). Thus, no check against STANDARD
							 * context is needed!
							 */
							if (oState.oSmartFilterbar.isDialogOpen() && !oState.hideVisualFilter) { //on click of save in the dialog, update the filterbar as well without waiting for the user to confirm/cancel by clicking go/cancel
								oState.visualFilterDialogContainer._updateFilterBarFromDialog.call(oState.visualFilterDialogContainer);
							}
							var oCurrentAppState = oState.oIappStateHandler.getCurrentAppState();
							if (!this.getOwnerComponent().getProperty('smartVariantManagement')) {
								delete oCurrentAppState.customData["sap.suite.ui.generic.template.genericData"].contentView;
							}

							var oFilterData = oState.oSmartFilterbar.getFilterData(true); //to include empty/invisible fields filter data
							// workaround since getFilterData() does not provide the content of the search field:
							var sSearchFieldValue, oBasicSearchField = oState.oSmartFilterbar.getBasicSearchControl();
							if (oBasicSearchField && oBasicSearchField.getValue) {
								sSearchFieldValue = oBasicSearchField.getValue();
							}
							oFilterData._CUSTOM = oCurrentAppState.customData;
							oState.oSmartFilterbar.setFilterData(oFilterData, true);
							if (sSearchFieldValue) { // the previous statement has blanked the content of the search field -> reset it to the stored value
								oState.oSmartFilterbar.getBasicSearchControl().setValue(sSearchFieldValue);
							}
							oState.oSmartFilterbar.fireFilterChange();
						},
						onAfterSFBVariantLoad: function(oEvent) {
							if (!oState.oSmartFilterbar.isDialogOpen()) {
								oState.filterBarController._afterSFBVariantLoad();
								if (oState.oSmartFilterableKPI && !oState.oSmartFilterbar.isLiveMode()) {
									var oContent = oState.oSmartFilterableKPI.getContent();
									oContent.forEach(function(oItem) {
										if (oItem.getSmartFilterId) {
											if (oEvent.getParameter("executeOnSelect")) {
												oItem.bSearchTriggred = true;
											}
										}
									});
								}
							}
						},
						onBeforeRebindChart: function(oEvent) {
							var oSmartChart = oEvent.getSource();
							setNoDataChartTextIfRequired(oSmartChart);
							//oState.oSmartChart.oModels = oState.oSmartChart.getChart().oPropagatedProperties.oModels;
							var oBindingParams = oEvent.getParameters().bindingParams;
							oState.oMultipleViewsHandler.aTableFilters =  deepExtend({}, oBindingParams.filters);
							var aFiltersFromSmartChart = oBindingParams.filters.slice(0);
							var oCallbacks = {
								setBindingPath: oSmartChart.setChartBindingPath.bind(oSmartChart),
								ensureExtensionFields: Function.prototype, 
								addExtensionFilters: oController.templateBaseExtension.addFilters,
								resolveParamaterizedEntitySet: oState.oMultipleViewsHandler.resolveParameterizedEntitySet,
								isFieldControlRequired: false,
								isMandatoryFiltersRequired: true
							};
							oController.onBeforeRebindChartExtension(oEvent);
							var fnDataReceived = oBindingParams.events.dataReceived || Function.prototype;
							oBindingParams.events.dataReceived = function(oReceivedEvent){
								if (!oSmartChart.getToolbar().getEnabled()) {
									oState.oContentArea.enableToolbar();
								}
								oTemplateUtils.oComponentUtils.hidePlaceholder();
								fnDataReceived.call(this, oReceivedEvent);
							};
							oTemplateUtils.oCommonUtils.onBeforeRebindTableOrChart(oEvent, oCallbacks, oState.oSmartFilterbar);
							oState.oMultipleViewsHandler.onRebindContentControl(oBindingParams, aFiltersFromSmartChart);
							ListUtils.handleErrorsOnTableOrChart(oTemplateUtils, oEvent);
						},
						onListNavigate: function(oEvent) {
							oTemplateUtils.oCommonEventHandlers.onListNavigate(oEvent, oState);
						},
						onCallActionFromToolBar: function(oEvent) {
							// Since our content toolbar is detached from the SmartTable, the standard util function getParentTable
							// would not work in our case.  We need to override this function when this action is triggered from our table

							var getParentTable_orig = oTemplateUtils.oCommonUtils.getParentTable;
							oTemplateUtils.oCommonUtils.getParentTable = function(){return oState.oSmartTable;};
							oTemplateUtils.oCommonEventHandlers.onCallActionFromToolBar(oEvent, oState);
							oTemplateUtils.oCommonUtils.getParentTable = getParentTable_orig;
							getParentTable_orig = null;
						},
						onCallActionFromList: function(oEvent) {

						},
						onDataFieldForIntentBasedNavigation: function(oEvent) {
							oTemplateUtils.oCommonEventHandlers.onDataFieldForIntentBasedNavigation(oEvent, oState);
						},
						onDataFieldWithIntentBasedNavigation: function(oEvent) {
							oTemplateUtils.oCommonEventHandlers.onDataFieldWithIntentBasedNavigation(oEvent, oState);
						},
						onBeforeSemanticObjectLinkPopoverOpens: function(oEvent) {
							var oSmartControl = oEvent.getSource();
							var oSelectionVariant = oState.oSmartFilterbar.getUiState({
								allFilters : false
							}).getSelectionVariant();
							//In case of Multiple View Applications, the filter context URL needs to be adjusted as the selected tab's context could be different from that of the filter context.
							if (oState.oSmartFilterbar.getEntitySet() !== oSmartControl.getEntitySet()) {
								oSelectionVariant.FilterContextUrl = oTemplateUtils.oServices.oApplication.getNavigationHandler().constructContextUrl(oSmartControl.getEntitySet(), oSmartControl.getModel());
							}
							var sSelectionVariant = JSON.stringify(oSelectionVariant);
							oTemplateUtils.oCommonUtils.semanticObjectLinkNavigation(oEvent, sSelectionVariant, oController);
						},
						onAssignedFiltersChanged: function(oEvent) {
							if (oEvent && oEvent.getSource()) {
								if (oState && oState.oSmartFilterbar && oState.filterBarController) {
									oController.byId("template::FilterText").setText(oState.oSmartFilterbar.retrieveFiltersWithValuesAsText());
								}
							}
						},
						onToggleFiltersPressed: function() {
							var oComponent = oController.getOwnerComponent();
							var oTemplatePrivateModel = oComponent.getModel("_templPriv");
							oTemplatePrivateModel.setProperty("/listReport/isHeaderExpanded", (oTemplatePrivateModel.getProperty("/listReport/isHeaderExpanded") === true) ? false : true);
						},

						// ---------------------------------------------
						// store navigation context
						// note: function itself is handled by the corresponding control
						// ---------------------------------------------
						onSearchButtonPressed: function() {
							if (Device.system.phone && oState.oPage.getHeaderExpanded()) { //Check if isHeaderExpanded = true. If yes, collapse the header (on press of Go) (only for phone)
								oState.oPage.setHeaderExpanded(false);
							}
							var oModel = oController.getOwnerComponent().getModel();
							oState.oController.getOwnerComponent().getModel("_templPriv").setProperty('/alp/filterChanged', false);
							oState.oController.getOwnerComponent().getModel("_templPriv").setProperty("/generic/bDataAreShownInChart", true);
							oModel.attachEventOnce("requestSent", function() {
									if (!oState._bIsStartingUp) {
										oState.oIappStateHandler.fnStoreCurrentAppStateAndAdjustURL();
									} else {
										// resolve starup promise
										oState.oIappStateHandler.fnResolveStartUpPromise();
									}
								});
							//chart selection needn't be retained for filter bar search / table personalisation
							oState.oController.getOwnerComponent().getModel("_templPriv").setProperty('/alp/_ignoreChartSelections', true);
							if (oState.oSmartTable) {
								oTemplateUtils.oCommonUtils.refreshModel(oState.oSmartTable.getEntitySet());
							} else {
								oTemplateUtils.oCommonUtils.refreshModel(oState.oSmartChart.getEntitySet());
							}
							clearingRefreshTimerInterval();
						},
						onSemanticObjectLinkNavigationPressed: fnOnSemanticObjectLinkNavigationPressed,
						onSemanticObjectLinkNavigationTargetObtained: fnOnSemanticObjectLinkNavigationTargetObtained,
						onAfterTableVariantSave: function() {
							oState.oIappStateHandler.fnStoreCurrentAppStateAndAdjustURL();
						},
						onAfterApplyTableVariant: function() {
							oState.oIappStateHandler.fnStoreCurrentAppStateAndAdjustURL();
						},
						onAfterChartVariantSave: function(ev) {
							oState.oIappStateHandler.fnStoreCurrentAppStateAndAdjustURL();
							oTemplateUtils.oCommonUtils.setEnabledToolbarButtons(ev.getSource());
						},
						onAfterApplyChartVariant: function() {
							oState.oIappStateHandler.fnStoreCurrentAppStateAndAdjustURL();
						},
						onFilterModeSegmentedButtonChange: function(oEvent) {
							oState.filterBarController.handleFilterSwitch(oEvent.getParameter("key"), oEvent.oSource._bApplyingVariant);
							oState.oController._templateEventHandlers.onSegmentButtonPressed();
							oState.filterBarController.fnCheckMandatory();
						},
						onContentViewSegmentButtonPressed: function(oEvent){
							//todo: check if DSH loads if the default filter mode is crosstable
							//ideally we can init DSH post GO button press
							if (oEvent.getParameter("key") === "crosstable" && !oState.oAnalyticGrid) {
								oState.oAnalyticGridController.initAnalyticGrid();
							}
							if (!oState.oSmartFilterableKPI && !oState.oController.getOwnerComponent().getContentTitle()) {
								var oContentView = oState.oController.getView(),
									sToolbarId;
								if (oEvent.getSource().getSelectedKey() === "customview1") {
									sToolbarId = "template::contentViewExtensionToolbar";
								} else if (oEvent.getSource().getSelectedKey() === "customview2") {
									sToolbarId = "template::contentViewExtension2Toolbar";
								} else if (oEvent.getSource().getSelectedKey() === "chart" || oEvent.getSource().getSelectedKey() === "charttable") {
									sToolbarId = oContentView.byId("template::masterViewExtensionToolbar") ? "template::masterViewExtensionToolbar" : "template::ChartToolbar";
								} else if (oEvent.getSource().getSelectedKey() === "table") {
									sToolbarId = "template::TableToolbar";
								}
								oState.oController._templateEventHandlers.setFocusOnContentViewSegmentedButtonItem(oContentView, sToolbarId);
							}
							oState.oController._templateEventHandlers.onSegmentButtonPressed(!oState.oController.getOwnerComponent().getProperty('smartVariantManagement'));
						},
						setFocusOnContentViewSegmentedButtonItem: function(oContentView, sToolbarId) {
							var oToolbar = oContentView.byId(sToolbarId);
							if (oToolbar) {
								var iToolbarContentLength = oToolbar.getContent().length,
									oSegmentButton = oToolbar.getContent()[iToolbarContentLength - 1 ];
								if (oSegmentButton) {
									oSegmentButton.addEventDelegate({
										onAfterRendering : function(oEvent) {
											oEvent.srcControl.focus();
										}
									});
								}
							}
						},
						/**
						* Called from Segmented Button to update the selected key to the variant and adjust the app state
						* @param {boolean} bIgnoreVariant - if true then do not store the selected key in variant
						**/
						onSegmentButtonPressed: function(bIgnoreVariant){
							if (!bIgnoreVariant) {
									oState.oController.byId('template::PageVariant').currentVariantSetModified(true);
									oState.oSmartFilterbar.setFilterData({
										_CUSTOM : oState.oIappStateHandler.getFilterState()
									});
							}
							oState.oIappStateHandler.fnStoreCurrentAppStateAndAdjustURL();
						},
						// ---------------------------------------------
						// END store navigation context
						// ---------------------------------------------
						onShareListReportActionButtonPress: function (oEvent) {
							oTemplateUtils.oCommonUtils.executeIfControlReady(onShareListReportActionButtonPressImpl, StableIdHelper.getStableId({
								type: "ALPAction",
								subType: "Share"
							}) + "-internalBtn");
						},

						/**
						 * Called from Determining Button belonging to Table's Annotation of type DataFieldForAction
						 * @param  {object} oEvent
						 */
						onDeterminingDataFieldForAction: function(oEvent) {
							var oTemplatePrivate = oState.oController.getOwnerComponent().getModel("_templPriv");
							var oContainerView = oTemplatePrivate.getProperty('/alp/contentView');
							var oPresentationControlHandler = oTemplateUtils.oServices.oPresentationControlHandlerFactory.getPresentationControlHandler(oContainerView === CONTAINER_VIEW_CHART ? oState.oSmartChart : oState.oSmartTable);
							oTemplateUtils.oCommonEventHandlers.onDeterminingDataFieldForAction(oEvent, oPresentationControlHandler);
						},
						/**
						 * Called from Determining Button belonging to Table and Chart Annotation of type DataFieldForIntentBasedNavigation
						 * @param  {object} oEvent
						 */
						onDeterminingDataFieldForIntentBasedNavigation: function(oEvent) {
							var oButton = oEvent.getSource();
							var oTemplatePrivate = oState.oController.getOwnerComponent().getModel("_templPriv");
							var oContainerView = oTemplatePrivate.getProperty('/alp/contentView');
							var aSelectedContexts = oTemplateUtils.oServices.oPresentationControlHandlerFactory.getPresentationControlHandler(oContainerView === CONTAINER_VIEW_CHART ? oState.oSmartChart : oState.oSmartTable).getSelectedContexts();
							oTemplateUtils.oCommonEventHandlers.onDeterminingDataFieldForIntentBasedNavigation(oButton, aSelectedContexts, oState.oSmartFilterbar);
						},
						/**
						* onInlineDataFieldForAction Trigger the action as specified in the inline buttons
						* @param  {Object} oEvent Event object
						*/
						onInlineDataFieldForAction: function(oEvent) {
							oTemplateUtils.oCommonEventHandlers.onInlineDataFieldForAction(oEvent);
						},
						/**
						* onInlineDataFieldForIntentBasedNavigation Trigger the navigation as specified in the inline buttons
						* @param  {Object} oEvent Event object
						*/
						onInlineDataFieldForIntentBasedNavigation: function(oEvent) {
							oTemplateUtils.oCommonEventHandlers.onInlineDataFieldForIntentBasedNavigation(oEvent.getSource(), oState);
						},
						/**
						 * Select handler for Auto Hide Segment Button
						 * @param  {Object} oEvent object
						 */
						onAutoHideToggle: function() {
							// eyeModeSwitch to highlightMode needs table rebind
							oState.oSmartTable.getModel("_tableHighlight").setProperty("/highlightMode", "eyeModeSwitch");
							oState.chartController && oState.chartController._updateTable();
							oState.oIappStateHandler.fnStoreCurrentAppStateAndAdjustURL();
						},
						/**
						 * Event handler when SmartControl full screen mode is changed
						 * @param  {sap.ui.base.Event} oEvent object
						 */
						onFullScreenToggled: function(oEvent) {
							var fullScreen = oEvent.getParameter("fullScreen");
							var oTemplatePrivate = oEvent.getSource().getModel("_templPriv");
							oTemplatePrivate.setProperty("/alp/fullScreen", fullScreen);
						},
						onDialogClosed: function(oEvent) {
							oState.visualFilterDialogContainer._closeDialog.call(oState.visualFilterDialogContainer, oEvent);
						},
						/**
						 * Event handler when Filter Dialog is launched
						 * @param  {Object} oEvent object
						 */
						onDialogOpened: function(oEvent) {
							if (!oState.visualFilterDialogContainer) {
								oState.visualFilterDialogContainer = new VisualFilterDialogController();
								oState.visualFilterDialogContainer.init(oState);
							}
							//oState.filterBarController.fnCheckMandatory();
							//filter dialog content should be decided based on current filterMode and bSearchable
							//If bSearchable then which mode is on that content should be active
							//if bSearchable is false then compact should come up first
							var oTemplatePrivate = oState.oController.getView().getModel("_templPriv"), sKey = FILTER_MODE_VISUAL, mCustomView = {}, bIsSearchable;
							bIsSearchable = oTemplatePrivate.getProperty("/alp/searchable");
							if (!bIsSearchable) { //if not searchable
								if (oState.alr_visualFilterBar && !oState.alr_visualFilterBar.getAssociateValueListsCalled()) {
									oState.alr_visualFilterBar.setAssociateValueListsCalled(true);
									oState.oSmartFilterbar.associateValueLists();
								}
							}
							mCustomView.item = new SegmentedButtonItem({icon:"sap-icon://filter-analytics", tooltip:"{i18n>FILTER_VISUAL}", key:sKey, enabled: "{_templPriv>/alp/searchable}"});
							mCustomView.selectionChange = function (oEvent) {
								oState.visualFilterDialogContainer._toggle.call(oState.visualFilterDialogContainer, oEvent);
							};
							mCustomView.content = oState.visualFilterDialogContainer._createForm();
							mCustomView.search = function (oEvent) {
								oState.visualFilterDialogContainer._triggerSearchInFilterDialog.call(oState.visualFilterDialogContainer, oEvent);
							};
							mCustomView.filterSelect = function (oEvent) {
								oState.visualFilterDialogContainer._triggerDropdownSearch.call(oState.visualFilterDialogContainer, oEvent);
							};
							oState.oSmartFilterbar.addAdaptFilterDialogCustomContent(mCustomView);
						},
						//Event handling for dialog buttons
						onSearchForFilters: function(oEvent) {
							oState.visualFilterDialogContainer._triggerSearchInFilterDialog.call(oState.visualFilterDialogContainer, oEvent);
						},
						onDialogSearch: function(oEvent) {
							oState.visualFilterDialogContainer._searchDialog.call(oState.visualFilterDialogContainer);
						},
						onDialogClear: function(oEvent) {
							oController.onClearFilterExtension(oEvent);
						},
						onRestore: function(oEvent) {
							oState.visualFilterDialogContainer._restoreDialog.call(oState.visualFilterDialogContainer);
						},
						onDialogCancel: function(oEvent) {
							oState.visualFilterDialogContainer._cancelDialog.call(oState.visualFilterDialogContainer);
						},
						//Enable/Disable toolbar buttons on row selection in table
						onRowSelectionChange: function(oEvent) {
							var oTable = oEvent.getSource();
							oTemplateUtils.oCommonUtils.setEnabledToolbarButtons(oTable);
						},
						dataStateFilter: function(oMessage, oTable){
							return oState.oMessageStripHelper.dataStateFilter(oMessage, oTable);
						},
						dataStateClose: function(){
							oState.oMessageStripHelper.onClose();
						},
						onAddCardsToRepository: function(oEvent){
							var oPresentationControlHandler = oTemplateUtils.oServices.oPresentationControlHandlerFactory.getPresentationControlHandler(oState.oSmartChart);
							var oComponent = oState.oController.getOwnerComponent();
							var oModel = oPresentationControlHandler.getModel();
							var sEntitySet = oPresentationControlHandler.getEntitySet();
							var oView = oState.oController.getView();
							var oEntitySet = oModel.getMetaModel().getODataEntitySet(sEntitySet);
							var oEntityType = oModel.getMetaModel().getODataEntityType(oEntitySet.entityType);
							var oCardDefinition = {};
							oCardDefinition['currentControlHandler'] = oPresentationControlHandler;
							oCardDefinition['component'] = oComponent;
							oCardDefinition['view'] = oView;
							oCardDefinition['entitySet'] = oEntitySet;
							oCardDefinition['entityType'] = oEntityType;
							oCardDefinition['oSmartFilterbar'] = oState.oSmartFilterbar;
							var oAnalyticalCardManifest = AddCardsHelper.createAnalyticalCardForPreview(oCardDefinition);
							var oTemplatePrivateModel = oTemplateUtils.oComponentUtils.getTemplatePrivateModel();
							var oInsightsInstance = oTemplatePrivateModel.getProperty("/oInsightsInstance");
							oInsightsInstance.showCardPreview(oAnalyticalCardManifest);
						}
					},

					formatters: {
						formatItemTextForMultipleView: function(oItem) {
							return oState.oMultipleViewsHandler ? oState.oMultipleViewsHandler.formatItemTextForMultipleView(oItem) : "";
						},
						formatMessageStrip: function(aIgnoredFilters, sSelectedKey) {
							return oState.oMultipleViewsHandler ? oState.oMultipleViewsHandler.formatMessageStrip(aIgnoredFilters, sSelectedKey) : "";
						}
					},
					extensionAPI: new ExtensionAPI(oTemplateUtils, oController, oState)
				};
			}
		};
	});
