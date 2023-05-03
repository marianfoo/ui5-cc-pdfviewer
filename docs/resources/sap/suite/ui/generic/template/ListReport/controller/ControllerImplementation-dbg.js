/* global window */
sap.ui.define([
	"sap/ui/model/Filter",
	"sap/suite/ui/generic/template/ListReport/extensionAPI/ExtensionAPI",
	"sap/suite/ui/generic/template/listTemplates/listUtils",
	"sap/suite/ui/generic/template/listTemplates/controller/MessageStripHelper",
	"sap/suite/ui/generic/template/ListReport/controller/IappStateHandler",
	"sap/suite/ui/generic/template/ListReport/controller/MultipleViewsHandler",
	"sap/suite/ui/generic/template/ListReport/controller/WorklistHandler",
	"sap/suite/ui/generic/template/lib/ShareUtils",
	"sap/suite/ui/generic/template/genericUtilities/controlHelper",
	"sap/suite/ui/generic/template/genericUtilities/FeLogger",
	"sap/base/util/ObjectPath",
	"sap/suite/ui/generic/template/js/StableIdHelper",
	"sap/base/util/deepExtend",
	"sap/suite/ui/generic/template/lib/CreateWithDialogHandler",
	"sap/suite/ui/generic/template/ListReport/controller/MultiEditHandler",
	"sap/ui/generic/app/navigation/service/SelectionVariant",
	"sap/suite/ui/generic/template/lib/AddCardsHelper",
	"sap/ui/model/json/JSONModel"
], function (Filter, ExtensionAPI, listUtils, MessageStripHelper, IappStateHandler, MultipleViewsHandler,
	WorklistHandler, ShareUtils, controlHelper, FeLogger, ObjectPath, StableIdHelper, deepExtend, CreateWithDialogHandler, MultiEditHandler, SelectionVariant, AddCardsHelper, JSONModel) {
	"use strict";

	var oLogger = new FeLogger("ListReport.controller.ControllerImplementation").getLogger();
	var oMethods = {
		getMethods: function (oViewProxy, oTemplateUtils, oController) {
			/**
			 * contains instance attributes that are shared with helper classes:
			 * oSmartFilterbar, oSmartTable, oIappStateHandler, oMultipleViewsHandler, bLoadListAndFirstEntryOnStartup, oWorklistData, oWorklistHandler, sNavType
			 * and functions updateControlOnSelectionChange and (from oIappStateHandler) getCurrentAppState.
			 * Initialized in onInit.
			 * Note: in multiple views multiple tables mode oSmartTable will be switched to the smart control responsible for the current tab on each tab change.
			 * In this case oSmartTable may even be a SmartChart.
			 */
			var oState = {};
			oState.oWorklistData = {
				bWorkListEnabled: !!oTemplateUtils.oComponentUtils.getSettings().isWorklist
			}; //object which saves worklist related data

			var oFclProxy;

			var aWaitingForDisplayNextObjectInfo = null;

			// -- Begin of methods that are used in onInit only
			function fnSetIsLeaf() {
				var oComponent = oController.getOwnerComponent();
				var oTemplatePrivateModel = oTemplateUtils.oComponentUtils.getTemplatePrivateModel();
				oTemplatePrivateModel.setProperty("/listReport/isLeaf", oComponent.getIsLeaf());
			}

			function onSmartFilterBarInitialise(oEvent) {
				var oSmartFilterbar = oEvent.getSource();
				// Apply filter defaults from the Selection Variant Annotation. 
				var sAnnotationPath = oController.getOwnerComponent().getAnnotationPath();
				if (sAnnotationPath !== undefined) {
					fnApplyFilterDefaultsFromSV(oSmartFilterbar, sAnnotationPath);
				}
				oController.onInitSmartFilterBarExtension(oEvent);
				oController.templateBaseExtension.onInitSmartFilterBar(oEvent);
			}

			function fnApplyFilterDefaultsFromSV(oSmartFilterbar, sAnnotationPath) {
				if (sAnnotationPath.indexOf('com.sap.vocabularies.UI.v1.PresentationVariant') > -1) {
					// To avoid setting an empty UI state to the filterbar
					// This configuration means that only the sorters have to be picked from PV. The filter defaults could still come from other defaults.
					return;
				}
				//Set the UI state of the filterbar with the filters defined in the selection variant annotation
				//This will override any filters coming from the Common.FilterDefaultValues annotations.
				var oSFBSelectionVariant = new SelectionVariant(JSON.stringify(oSmartFilterbar.getUiState().getSelectionVariant()));
				var oMetaModel = oController.getOwnerComponent().getModel().getMetaModel();
				var sEntitySet = oController.getOwnerComponent().getEntitySet();
				var oEntityType = oMetaModel.getODataEntityType(oMetaModel.getODataEntitySet(sEntitySet).entityType);
				var oTargetAnnotation = oMetaModel.getObject(oEntityType.$path + "/" + sAnnotationPath);
				if (oTargetAnnotation && oTargetAnnotation.SelectionVariant && (oTargetAnnotation.SelectionVariant.Path || oTargetAnnotation.SelectionVariant.AnnotationPath)) {
					sAnnotationPath = (oTargetAnnotation.SelectionVariant.Path || oTargetAnnotation.SelectionVariant.AnnotationPath).split("@")[1];
				}
				var oSelectionVariant = oMetaModel.getObject(oEntityType.$path + "/" + sAnnotationPath);
				if (oSelectionVariant) {
					oSelectionVariant = listUtils.createSVObject(oSelectionVariant, oSmartFilterbar);
					oSelectionVariant.FilterContextUrl = oSFBSelectionVariant.getFilterContextUrl();
					oState.oIappStateHandler.setFiltersUsingUIState(oSelectionVariant.toJSONObject(), true, false);
				} else {
					var oNavigationController = oController.getOwnerComponent().getAppComponent().getNavigationController();
					oNavigationController.navigateToMessagePage({
						title: oTemplateUtils.oCommonUtils.getText("ST_ERROR"),
						text: "Manifest property 'annotationPath' is configured with " + sAnnotationPath + " but no such annotation found.",
						description: ""
					});
				}
			}

			// oControl is either a SmartTable or a SmartChart
			function fnUpdateControlOnSelectionChange(oControl) {
				oTemplateUtils.oCommonUtils.setEnabledToolbarButtons(oControl);
				if (!controlHelper.isSmartChart(oControl)) { //Chart does not have footer buttons
					oTemplateUtils.oCommonUtils.setEnabledFooterButtons(oControl);
				}
			}

			function fnRegisterToChartEvents(oEvent) {
				var oSmartChart;
				oSmartChart = oEvent.getSource();
				oSmartChart.getChartAsync().then(function (oChart) {
					//attach to the selectData event of the sap.chart.Chart
					oChart.attachSelectData(fnUpdateControlOnSelectionChange.bind(null, oSmartChart));
					oChart.attachDeselectData(fnUpdateControlOnSelectionChange.bind(null, oSmartChart));
				});
			}

			function fnOnSemanticObjectLinkNavigationPressed(oEvent) {
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

			function fnOnSemanticObjectLinkNavigationTargetObtainedSmartLink(oEvent) {
				var oEventParameters = oEvent.getParameters(),
					oMainNavigation = oEventParameters.mainNavigation,
					oEventSource = oEvent.getSource(), //set on smart link
					sTitle;
				if (oMainNavigation) {
					sTitle = oEventSource.getText && oEventSource.getText();
					var oCustomData = oTemplateUtils.oCommonUtils.getCustomData(oEvent);
					if (oCustomData && oCustomData["LinkDescr"]) {
						var sDescription = oCustomData["LinkDescr"];
						oMainNavigation.setDescription(sDescription);
					}
				}
				oTemplateUtils.oCommonEventHandlers.onSemanticObjectLinkNavigationTargetObtained(oState.oPresentationControlHandler.getEntitySet(), {}, oEventParameters, oState, sTitle);
			}
			
			function getItemInTable(sContextPath) {
				var aItems = oViewProxy.getItems();
				for (var i = 0; i < aItems.length; i++) {
					if (!sContextPath || aItems[i].getBindingContextPath() === sContextPath) {
						return aItems[i];
					}
				}
			}

			function fnNavigateToListItemProgrammatically(oItem) {
				oTemplateUtils.oCommonEventHandlers.onListNavigate(oItem, oState, undefined, true);
			}

			function getDefaultValuesImpl(oPredefinedValues, oButton, fnParam) {
				var oGetDefaultValuesPromise = oTemplateUtils.oServices.oCRUDManager.getDefaultValues(oButton, oPredefinedValues);
				if (oGetDefaultValuesPromise instanceof Promise) {
					var fnGetPredefinedValues = function (aResponse) {
						fnParam.call(this, aResponse[0], oButton);
					};
					oGetDefaultValuesPromise.then(fnGetPredefinedValues, fnGetPredefinedValues);
				} else {
					fnParam.call(this, oPredefinedValues, oButton);
				}
			}

			function addEntryImpl(oPredefinedValues, oButton) {
				if (oPredefinedValues) {
					callAddEntryImpl(oPredefinedValues, oButton);
				} else {
					getDefaultValuesImpl(null, oButton, callAddEntryImpl);
				}
			}

			function callAddEntryImpl(oPredefinedValues, oButton) {
				if (oButton.data("CrossNavigation")) {
					oTemplateUtils.oCommonUtils.fnProcessDataLossOrDraftDiscardConfirmation(function () {
						oTemplateUtils.oCommonEventHandlers.addEntry(oButton, false, oState.oSmartFilterbar, oPredefinedValues);
					},  Function.prototype, "LeaveApp");
				} else {
					oTemplateUtils.oCommonEventHandlers.addEntry(oButton, false, oState.oSmartFilterbar, oPredefinedValues);
				}
			}

			function addEntry() {
				var sVariantKey = (oState.oMultipleViewsHandler.getMode() !== "single" && oState.oMultipleViewsHandler.getSelectedKey()) || "";
				var sIdForCreateButton = StableIdHelper.getStableId({
					type: "ListReportAction",
					subType: "Create",
					sQuickVariantKey: sVariantKey
				});
				oTemplateUtils.oCommonUtils.executeIfControlReady(function (oCreateButton) {
					var sIdForCreationDialog = StableIdHelper.getStableId({
						type: "ListReportAction",
						subType: "CreateWithDialog",
						sQuickVariantKey: sVariantKey
					});
					var oCreationDialog = sIdForCreationDialog && oController.byId(sIdForCreationDialog);
					if (oCreationDialog) {
						oState.oCreateWithDialogHandler.createWithDialog(oCreationDialog, oCreateButton);
					} else {
						addEntryImpl(null, oCreateButton);
					}
				}, sIdForCreateButton);
			}

			function addEntryWithFilters(oEvent) {
				getDefaultValuesImpl(undefined, oEvent.getSource(), addEntryWithFiltersImpl);
			}

			function addEntryWithFiltersImpl(oDefaultValues, oButton) {
				var oCreateWithFilters = oController.getOwnerComponent().getCreateWithFilters();
				var sStrategy = oCreateWithFilters.strategy || "extension";
				var oPredefinedValues;
				switch (sStrategy) {
					case "extension":
						oPredefinedValues = oController.getPredefinedValuesForCreateExtension(oState.oSmartFilterbar, oDefaultValues) || {};
						break;
					default:
						oLogger.error(sStrategy + " is not a valid strategy to extract values from the SmartFilterBar");
						return;
				}
				var sIdForCreationDialog = StableIdHelper.getStableId({
					type: "ListReportAction",
					subType: "CreateWithDialog"
				});
				var oCreationDialog = sIdForCreationDialog && oController.byId(sIdForCreationDialog);
				if (oCreationDialog) {
					oState.oCreateWithDialogHandler.createWithDialog(oCreationDialog, oButton, oPredefinedValues);
				} else {
					addEntryImpl(oPredefinedValues, oButton);
				}
			}

			function fnDeleteEntries(oEvent) {
				var oTemplatePrivateModel = oTemplateUtils.oComponentUtils.getTemplatePrivateModel();
				var bDeleteEnabled = oTemplatePrivateModel.getProperty("/listReport/deleteEnabled");
				// Shortcut Key: Don't trigger the shortcut if the delete button is disabled
				if (bDeleteEnabled) {
					oTemplateUtils.oCommonEventHandlers.deleteEntries(oEvent);
				}
			}

			function fnAddEditStateFilter(aFilters) {
				if (!oTemplateUtils.oComponentUtils.isDraftEnabled()) {
					return;
				}
				var oTemplatePrivateModel = oTemplateUtils.oComponentUtils.getTemplatePrivateModel();
				var vDraftState = oTemplatePrivateModel.getProperty("/listReport/vDraftState");
				switch (vDraftState) {
					case "1": // Unchanged
						// IsActiveDocument and siblingEntity eq null
						aFilters.push(new Filter("IsActiveEntity", "EQ", true));
						aFilters.push(new Filter("HasDraftEntity", "EQ", false));
						break;
					case "2": // Draft
						aFilters.push(new Filter("IsActiveEntity", "EQ", false));
						break;
					case "3": // Locked
						aFilters.push(new Filter("IsActiveEntity", "EQ", true));
						aFilters.push(new Filter("SiblingEntity/IsActiveEntity", "EQ", null));
						aFilters.push(new Filter("DraftAdministrativeData/InProcessByUser", "NE", ""));
						break;
					case "4": // Unsaved changes
						aFilters.push(new Filter("IsActiveEntity", "EQ", true));
						aFilters.push(new Filter("SiblingEntity/IsActiveEntity", "EQ", null));
						aFilters.push(new Filter("DraftAdministrativeData/InProcessByUser", "EQ", ""));
						break;
					case "5": // All (Hiding Drafts)
						aFilters.push(new Filter("IsActiveEntity", "EQ", true));
						break;
					default: // All
							var oOwnMultiFilter = new Filter({
								filters: [new Filter("IsActiveEntity", "EQ", false),
									new Filter("SiblingEntity/IsActiveEntity", "EQ", null)
								],
								and: false
							});
							if (aFilters[0] && aFilters[0].aFilters) {
								var oSmartTableMultiFilter = aFilters[0];
								aFilters[0] = new Filter([oSmartTableMultiFilter, oOwnMultiFilter], true);
							} else {
								aFilters.push(oOwnMultiFilter);
							}
						break;
				}
			}

			function fnGetSearchString() {
				// in case of Worklist, no basicSearchField is configured to the SFB, so first part of expression would return empty string.
				return oState.oSmartFilterbar.getBasicSearchValue() || oState.oWorklistHandler.getSearchString();
			}

			function onShareListReportActionButtonPressImpl(oButton) {
				var oFragmentController = {
					sharePageToPressed: function (target) {
						var oBusyHelper = oTemplateUtils.oServices.oApplication.getBusyHelper();
						if (oBusyHelper.isBusy()) {
							return; // Ignore user interaction while the app is busy.
						}
						var sSubject = oTemplateUtils.oServices.oApplication.getAppTitle();
						var oTriggerPromise = ShareUtils.getCurrentUrl().then(function (sCurrentUrl) {
							switch (target) {
								case "MicrosoftTeams":
									ShareUtils.openMSTeamsShareDialog(sSubject, sCurrentUrl);
									break;
								case "Email":
									sSubject = oTemplateUtils.oCommonUtils.getText("EMAIL_HEADER", [sSubject]);
									sap.m.URLHelper.triggerEmail(null, sSubject, sCurrentUrl);
									break;
								default:
									break;
							}
						});
						oBusyHelper.setBusy(oTriggerPromise);
					},

					shareJamPressed: function () {
						ShareUtils.openJamShareDialog(oTemplateUtils.oServices.oApplication.getAppTitle());
					},

					shareTilePressed: function() {
						ShareUtils.fireBookMarkPress();
					},
					
					getDownloadUrl: function () {
						var oBinding = oState.oPresentationControlHandler.getBinding(oState);
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

					getModelData: function () {
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
			}

			function setNoDataTextIfRequired(oSmartTable) {
				var sSmartTableId = oSmartTable.getId();
				var oSmartFilterbar = oState.oSmartFilterbar;
				var sNoDataText = "";
				var filters = [];
				var bIsMultiView = !!(oTemplateUtils.oComponentUtils && oTemplateUtils.oComponentUtils.getSettings() && (oTemplateUtils.oComponentUtils.getSettings().quickVariantSelectionX || oTemplateUtils.oComponentUtils.getSettings().quickVariantSelection));
				if (oSmartTable.fetchVariant() && oSmartTable.fetchVariant().filter && oSmartTable.fetchVariant().filter.filterItems) {
					filters = oSmartTable.fetchVariant().filter.filterItems;
				}
				var mSmartTableConfig = {
					search: !!oSmartFilterbar.getBasicSearchValue(),
					filter: !!(filters.length || oSmartFilterbar.retrieveFiltersWithValues().length)
				};
				if (bIsMultiView) {
					sNoDataText = oTemplateUtils.oCommonUtils.getContextText("NOITEMS_MULTIVIEW_LR_SMARTTABLE_WITH_FILTER", sSmartTableId);
				} else if (mSmartTableConfig.search || mSmartTableConfig.filter) {
					sNoDataText = oTemplateUtils.oCommonUtils.getContextText("NOITEMS_LR_SMARTTABLE_WITH_FILTER", sSmartTableId);
				} else {
					sNoDataText = oTemplateUtils.oCommonUtils.getContextText("NOITEMS_LR_SMARTTABLE", sSmartTableId);
				}
				oSmartTable.setNoData(sNoDataText);
			}

			function setNoDataChartTextIfRequired(oSmartChart) {
				var sSmartChartId = oSmartChart.getId();
				var sNoDataText = oTemplateUtils.oCommonUtils.getContextText("NOITEMS_LR_SMARTCHART", sSmartChartId);
				oSmartChart.getChartAsync().then(function (chart) {
					chart.setCustomMessages({
						NO_DATA: sNoDataText
					});
				});
			}

			function onSmartTableDataRequested(oSmartTable) {
				var sRouteName = oSmartTable.getEntitySet();
				oTemplateUtils.oComponentUtils.preloadComponent(sRouteName);
			}

			var fnDataLoaded; // temporary solution to keep track when data are loaded for the first time

			function fnOnDataReceived (oControl) {
				if (fnDataLoaded) {
					fnDataLoaded();
				}
				fnDataLoaded = Function.prototype; // indicate that data have been loaded once
				oTemplateUtils.oCommonEventHandlers.onDataReceived(oControl);

				if (aWaitingForDisplayNextObjectInfo) {
					var oItem;
					var bSuccess = false;
					for (var i = 0; i < aWaitingForDisplayNextObjectInfo.aWaitingObjects.length && !bSuccess; i++) {
						oItem = getItemInTable(aWaitingForDisplayNextObjectInfo.aWaitingObjects[i]);
						if (oItem) {
							fnNavigateToListItemProgrammatically(oItem);
							aWaitingForDisplayNextObjectInfo.resolve();
							bSuccess = true;
						}
					}
					if (!bSuccess) {
						oItem = getItemInTable();
						if (oItem) {
							fnNavigateToListItemProgrammatically(oItem);
							aWaitingForDisplayNextObjectInfo.resolve();
						} else {
							aWaitingForDisplayNextObjectInfo.reject();
						}
					}
					aWaitingForDisplayNextObjectInfo = null;
					return;
				}

				oFclProxy.handleDataReceived(oControl, fnNavigateToListItemProgrammatically);
				var oTemplatePrivateModel = oTemplateUtils.oComponentUtils.getTemplatePrivateModel();
				oTemplatePrivateModel.setProperty("/listReport/firstSelection", true);
				oState.oIappStateHandler.setDataShownInTable(true);
				oTemplateUtils.oComponentUtils.hidePlaceholder();
			}

			function checkSimpleTableColumns(oEntityType) {
				var oMetaModel = oState.oPresentationControlHandler.getModel().getMetaModel();
				return oState.oPresentationControlHandler.getVisibleProperties().some(function (oColumn) {
					var sColumnKey = oColumn.data("p13nData") && oColumn.data("p13nData").columnKey;
					var oProperty = oMetaModel.getODataProperty(oEntityType, oColumn.data("p13nData").leadingProperty);
					if (oProperty && (oProperty.type === 'Edm.Date' || oProperty.type === 'Edm.DateTime' || oProperty.type === 'Edm.DateTimeOffset')) {
						return;
					}
					if (oProperty &&  oProperty["sap:label"]) {
						if (oColumn.getVisible() && ((sColumnKey.indexOf("DataFieldForAnnotation") < 0) && !oColumn.data("p13nData").actionButton && !!oColumn.data("p13nData").leadingProperty)) {
							return true;
						}
					}
				});
			}

			function fnOpenCardMessagesDialog(oModel){
				var oCardMessagesPromise =  oTemplateUtils.oCommonUtils.getDialogFragmentAsync("sap.suite.ui.generic.template.ListReport.view.fragments.CardMessages", {
					onClose: function(oEvent) {
						var oDialog = oEvent.getSource().getParent();
						oDialog.close();
					}
				}, "cardMessages");

				oCardMessagesPromise.then(function (oDialog) {
					oDialog.setModel(oModel, "list");
					oDialog.open();
				});
			}

			// Generation of Event Handlers
			return {
				onInit: function () {
					oState.oSmartFilterbar = oController.byId("listReportFilter");
					oState.oPresentationControlHandler = oTemplateUtils.oServices.oPresentationControlHandlerFactory.getPresentationControlHandler(
						oController.byId(StableIdHelper.getStableId({type: "ListReportTable", subType: "SmartTable"})) ||
						oController.byId(StableIdHelper.getStableId({type: "ListReportTable", subType: "SmartList"}))
					);
					// Make the fnUpdateControlOnSelectionChange function available for others via the oState object
					oState.updateControlOnSelectionChange = fnUpdateControlOnSelectionChange;
					oFclProxy = oTemplateUtils.oComponentUtils.getFclProxy();
					oState.bLoadListAndFirstEntryOnStartup = oFclProxy.isListAndFirstEntryLoadedOnStartup();
					var oMultipleViewsHandler = new MultipleViewsHandler(oState, oController, oTemplateUtils);
					oState.oMultipleViewsHandler = oMultipleViewsHandler;
					oState.oMessageStripHelper = new MessageStripHelper(oState.oPresentationControlHandler, oMultipleViewsHandler, oController, oTemplateUtils, "listReport");
					// proxy for oCommonUtils.refreshModel that ensures that also the other SmartTable instances 
					// pointing to the same entity set will be refreshed 
					oState.refreshModel = function () {
						/* getEntitySet should not be a method of PresentationControlHandler. For more details, refer to the comment 
			   	   		   mentioned before the method's definition in the class */
						var bIsInvalidating = oTemplateUtils.oCommonUtils.refreshModel(oState.oPresentationControlHandler.getEntitySet());
						if (bIsInvalidating) {
							oMultipleViewsHandler.refreshSiblingControls(oState.oPresentationControlHandler);
						}
					};
					oState.oCreateWithDialogHandler = new CreateWithDialogHandler(oState, oController, oTemplateUtils);
					oState.oWorklistHandler = new WorklistHandler(oState, oController, oTemplateUtils);
					oState.oIappStateHandler = new IappStateHandler(oState, oController, oTemplateUtils);
					oState.oMultiEditHandler = new MultiEditHandler(oState, oController, oTemplateUtils);
					

					var oTemplatePrivateModel = oTemplateUtils.oComponentUtils.getTemplatePrivateModel();
					oTemplatePrivateModel.setProperty("/generic/bDataAreShownInTable", false);
					//set a property for the state of LR table. At this state data have never been requested for LR table. Later once data is recieved for LR table we will set it to true.
					oTemplatePrivateModel.setProperty("/listReport/firstSelection", false);

					// Initialise headerExpanded property to true as a fix for incident 1770402849. Text of toggle filter button depends on this value.
					oTemplatePrivateModel.setProperty("/listReport/isHeaderExpanded", true);

					// set property for enable/disable of the Delete button
					oTemplatePrivateModel.setProperty("/listReport/deleteEnabled", false);

					// Set property for enable/disable of the Multi edit button
					oTemplatePrivateModel.setProperty("/listReport/multiEditEnabled", false);

					// initialization of data related to active objects toggle and edit state dropdown
					if (oTemplateUtils.oComponentUtils.isDraftEnabled()) {
						oTemplatePrivateModel.setProperty("/listReport/vDraftState", "0");
					}

					// initialise the message trip in LR to be hidden on load
					oTemplatePrivateModel.setProperty("/listReport/multipleViews/msgVisibility", false);
					
					oViewProxy.adaptToChildContext = function(sCurrentChildContext) {
						oState.oPresentationControlHandler.scrollToSelectedItemAsPerChildContext(sCurrentChildContext);
					};

					oViewProxy.getItems = function() {
						return oState.oPresentationControlHandler.getItems();
					};

					oViewProxy.displayNextObject = function(aOrderObjects) {
						return new Promise(function(resolve, reject) {
							aWaitingForDisplayNextObjectInfo = {
								aWaitingObjects: aOrderObjects,
								resolve: resolve,
								reject: reject
							};
						});
					};

					oViewProxy.refreshBinding = function (bUnconditional, mEntitySets) {
						if (oState.oIappStateHandler.areDataShownInTable()) { // only if data are currently shown a refresh needs to be triggered
							if (oState.oMultipleViewsHandler.refreshOperation(2, null, !bUnconditional && mEntitySets)) {
								return; // multiple views handler has done the job
							}
							if (bUnconditional || mEntitySets[oController.getOwnerComponent().getEntitySet()]) {
								oTemplateUtils.oCommonUtils.refreshModel(oController.getOwnerComponent().getEntitySet());
								oState.oPresentationControlHandler.refresh();
							}
						}
					};

					oViewProxy.getCurrentState = function () {
						return {
							permanentState: {
								data: oState.oIappStateHandler.getCurrentAppState(),
								lifecycle: {
									permanent: true
								}
							}
						};
					};

					oViewProxy.applyState = function (oViewState) {
						oState.oIappStateHandler.applyState(oViewState.permanentState).then(function(){
							if (!oState.oIappStateHandler.areDataShownInTable()){
								// In case of missing mandatory filters (parameters), analysis in iAppstateHandler could lead to not loading data even situations that require loading data on
								// startup, e.g. list-detail layout (to immediately load first item).
								// In this case, call FCLs dataReceived method already now to indicate that it makes no sense to wait for that event.
								// First parameter being undefined means that there is no item to show (like if empty list was received), second parameter is superfluous if first parameter is not
								// given.
								// TODO: Rethink name of that method.
								oFclProxy.handleDataReceived();
							}
						});
					};

					fnSetIsLeaf();

					oController.byId("template::FilterText").attachBrowserEvent("click", function () {
						oController.byId("page").setHeaderExpanded(true);
					});

					var oMenuButton = oController.byId(StableIdHelper.getStableId({
						type: "ListReportAction",
						subType: "Share"
					}) + "-internalBtn");
					oMenuButton.attachPress(function(){
						onShareListReportActionButtonPressImpl(oMenuButton);
					});
				},

				handlers: {
					addEntry: addEntry,
					addEntryWithFilters: addEntryWithFilters,
					deleteEntries: fnDeleteEntries,
					deleteEntry: function (oEvent) {
						oTemplateUtils.oCommonEventHandlers.deleteEntry(oEvent);
					},
					updateTableTabCounts: function () {
						oState.oMultipleViewsHandler.fnUpdateTableTabCounts();
					},
					onCancelCreateWithPopUpDialog: function () {
						oState.oCreateWithDialogHandler.onCancelPopUpDialog();
					},
					onSaveCreateWithPopUpDialog: function (oEvent) {
						oState.oCreateWithDialogHandler.onSavePopUpDialog(oEvent);
					},
					onSelectionChange: function (oEvent) {
						var oTable = oEvent.getSource();
						fnUpdateControlOnSelectionChange(oTable);
					},
					onMultiSelectionChange: function (oEvent) {
						oTemplateUtils.oCommonEventHandlers.onMultiSelectionChange(oEvent);
					},
					onContactDetails: function (oEvent) {
						oTemplateUtils.oCommonEventHandlers.onContactDetails(oEvent);
					},
					onSmartFilterBarInitialise: onSmartFilterBarInitialise,

					onSmartFilterBarInitialized: function () {
						oState.oIappStateHandler.onSmartFilterBarInitialized();
					},

					onAfterSFBVariantLoad: function (oEvent) {
						oState.oIappStateHandler.onAfterSFBVariantLoad(oEvent);
					},

					onSmartListDataReceived: function (oEvent) {
						var oSmartList = oEvent.getSource();
						fnOnDataReceived(oSmartList);
					},

					onBeforeRebindTable: function (oEvent) {
						var oSmartTable = oEvent.getSource();
						setNoDataTextIfRequired(oSmartTable);
						//in table tabs case oEvent.bindingParams.filters do not contain the values from the SmartFilterbar so far but it will contain filters
						//which can be set directly on the table under 'settings'
						// we have to remember these filters in order to exclude them later for counts
						var oBindingParams = oEvent.getParameters().bindingParams;
						var oTemplatePrivateModel = oTemplateUtils.oComponentUtils.getTemplatePrivateModel();
						var oTableSelectionVariant = oSmartTable.getUiState().getSelectionVariant();
						if (oTableSelectionVariant && oTableSelectionVariant.SelectOptions && oTableSelectionVariant.SelectOptions.length) {
							oTemplatePrivateModel.setProperty("/listReport/tableFiltersActive", true);
						} else {
							oTemplatePrivateModel.setProperty("/listReport/tableFiltersActive", false);
						}
						oState.oMultipleViewsHandler.aTableFilters = deepExtend({}, oBindingParams.filters);
						// initial filters from smarttable, a copy
						var aFiltersFromSmartTable = oBindingParams.filters.slice(0);
						oTemplateUtils.oCommonEventHandlers.onBeforeRebindTable(oEvent, {
							determineSortOrder: oState.oMultipleViewsHandler.determineSortOrder,
							ensureExtensionFields: oController.templateBaseExtension.ensureFieldsForSelect,
							addTemplateSpecificFilters: fnAddEditStateFilter,
							getSearchString: fnGetSearchString,
							addExtensionFilters: oController.templateBaseExtension.addFilters,
							resolveParamaterizedEntitySet: oState.oMultipleViewsHandler.resolveParameterizedEntitySet,
							isFieldControlRequired: false,
							isPopinWithoutHeader: true,
							isDataFieldForActionRequired: true,
							isFieldControlsPathRequired: true,
							isMandatoryFiltersRequired: true
						});
						oController.onBeforeRebindTableExtension(oEvent);
						var fnDataRequested = oBindingParams.events.dataRequested || Function.prototype;
						oBindingParams.events.dataRequested = function(oRequestEvent){
							onSmartTableDataRequested(oSmartTable);
							fnDataRequested.call(this, oRequestEvent);
						};
						var fnDataReceived = oBindingParams.events.dataReceived || Function.prototype;
						oBindingParams.events.dataReceived = function(oReceivedEvent){
							fnOnDataReceived(oSmartTable);
							fnDataReceived.call(this, oReceivedEvent);
						};
						var fnRefresh = oBindingParams.events.refresh || Function.prototype;
						oBindingParams.events.refresh = function(oRefreshEvent){
							oState.oMultipleViewsHandler.onDataRequested();
							fnRefresh.call(this, oRefreshEvent);
						};
						oState.oMessageStripHelper.onBeforeRebindControl(oEvent);
						oState.oMultipleViewsHandler.onRebindContentControl(oBindingParams, aFiltersFromSmartTable);
						listUtils.handleErrorsOnTableOrChart(oTemplateUtils, oEvent, oState);
					},
					onListNavigate: function (oEvent) {
						oTemplateUtils.oCommonEventHandlers.onListNavigate(oEvent, oState);
					},
					onEdit: function(oEvent) {
						oTemplateUtils.oCommonEventHandlers.onListNavigate(oEvent, oState, undefined, undefined, true);
					},
					onCallActionFromToolBar: function(oEvent) {
						oTemplateUtils.oCommonEventHandlers.onCallActionFromToolBar(oEvent, oState);
					},
					onDataFieldForIntentBasedNavigation: function (oEvent) {
						oTemplateUtils.oCommonEventHandlers.onDataFieldForIntentBasedNavigation(oEvent, oState);
					},
					onDataFieldWithIntentBasedNavigation: function (oEvent) {
						oTemplateUtils.oCommonEventHandlers.onDataFieldWithIntentBasedNavigation(oEvent, oState);
					},
					onBeforeSemanticObjectLinkNavigationCallback: function (oNavigationInfo) {
						return oTemplateUtils.oCommonEventHandlers.onBeforeSemanticObjectLinkNavigationCallback(oNavigationInfo);
					},
					onBeforeSemanticObjectLinkPopoverOpens: function (oEvent) {
						var oSmartControl = oEvent.getSource();
						var oSelectionVariant = oState.oSmartFilterbar.getUiState().getSelectionVariant();
						//In case of Multiple View Applications, the filter context URL needs to be adjusted as the selected tab's context could be different from that of the filter context.
						if (oState.oSmartFilterbar.getEntitySet() !== oSmartControl.getEntitySet()) {
							oSelectionVariant.FilterContextUrl = oTemplateUtils.oServices.oApplication.getNavigationHandler().constructContextUrl(oSmartControl.getEntitySet(), oSmartControl.getModel());
						}
						var sSelectionVariant = JSON.stringify(oSelectionVariant);
						oTemplateUtils.oCommonUtils.semanticObjectLinkNavigation(oEvent, sSelectionVariant, oController, oState);
					},
					onSemanticObjectLinkNavigationPressed: fnOnSemanticObjectLinkNavigationPressed,
					onSemanticObjectLinkNavigationTargetObtained: fnOnSemanticObjectLinkNavigationTargetObtained,
					onSemanticObjectLinkNavigationTargetObtainedSmartLink: fnOnSemanticObjectLinkNavigationTargetObtainedSmartLink,
					onDraftLinkPressed: function (oEvent) {
						var oButton = oEvent.getSource();
						var oBindingContext = oButton.getBindingContext();
						oTemplateUtils.oCommonUtils.showDraftPopover(oBindingContext, oButton);
					},
					onAssignedFiltersChanged: function (oEvent) {
						if (oEvent.getSource()) {
							oController.byId("template::FilterText").setText(oEvent.getSource().retrieveFiltersWithValuesAsText());
						}
					},

					onSearchButtonPressed: function(){
						oState.oIappStateHandler.onSearchPressed();
					},

					// Logic to add cards to repository
					onAddCardsToRepository: function(oEvent){
						var oPresentationControlHandler = oState.oPresentationControlHandler;
						var oModel = oPresentationControlHandler.getModel();
						var sEntitySet = oPresentationControlHandler.getEntitySet();
						var oEntitySet = oModel.getMetaModel().getODataEntitySet(sEntitySet);
						var oEntityType = oModel.getMetaModel().getODataEntityType(oEntitySet.entityType);
						var oComponent = oController.getOwnerComponent();
						var oRb = oComponent.getModel("i18n").getResourceBundle();
						var bIsSimpleColumnsApplied = checkSimpleTableColumns(oEntityType);
						var oTemplatePrivateModel = oTemplateUtils.oComponentUtils.getTemplatePrivateModel();
						var tableFiltersActive = oTemplatePrivateModel.getProperty("/listReport/tableFiltersActive");
						if (oState.oSmartFilterbar.getUiState().getSemanticDates() || tableFiltersActive || !bIsSimpleColumnsApplied) {
							var oModel = new JSONModel({
								items: [
									{text: oRb.getText("ST_CARDS_INFO_TEXT_2")},
									{text: oRb.getText("ST_CARDS_INFO_TEXT_3")},
									{text: oRb.getText("ST_CARDS_INFO_TEXT_4")}
								]
							});
							fnOpenCardMessagesDialog(oModel);
						} else {
							var oView = oController.getView();
							var oCardDefinition = {};
							oCardDefinition['currentControlHandler'] = oPresentationControlHandler;
							oCardDefinition['component'] = oComponent;
							oCardDefinition['view'] = oView;
							oCardDefinition['entitySet'] = oEntitySet;
							oCardDefinition['entityType'] = oEntityType;
							oCardDefinition['oSmartFilterbar'] = oState.oSmartFilterbar;
							var oInsightsInstance = oTemplatePrivateModel.getProperty("/listReport/oInsightsInstance");
							var vDraftState = oTemplatePrivateModel.getProperty("/listReport/vDraftState");
							if (vDraftState && Number(vDraftState)) {
								oCardDefinition['oFECustomFilterData'] = {
									"name": "IsActiveEntity",
									"value": vDraftState
								};
							}
							AddCardsHelper.showColumnsForCardGeneration(oCardDefinition, oEvent.getSource()).then(function (oCardManifest){
								oInsightsInstance.showCardPreview(oCardManifest);
							});
						}
					},

					onBeforeRebindChart: function (oEvent) {
						var oSmartChart = oEvent.getSource();
						setNoDataChartTextIfRequired(oSmartChart);
						//in table tabs case oEvent.bindingParams.filters do not contain the values from the SmartFilterbar so far but it will contain filters
						//which can be set directly on the table under 'settings'
						// we have to remember these filters in order to exclude them later for counts
						var oBindingParams = oEvent.getParameters().bindingParams;
						oState.oMultipleViewsHandler.aTableFilters = deepExtend({}, oBindingParams.filters);
						var aFiltersFromSmartChart = oBindingParams.filters.slice(0);
						var oCallbacks = {
							setBindingPath: oSmartChart.setChartBindingPath.bind(oSmartChart),
							ensureExtensionFields: Function.prototype, // needs further clarification
							addTemplateSpecificFilters: fnAddEditStateFilter,
							addExtensionFilters: oController.templateBaseExtension.addFilters,
							resolveParamaterizedEntitySet: oState.oMultipleViewsHandler.resolveParameterizedEntitySet,
							isFieldControlRequired: false,
							isMandatoryFiltersRequired: true
						};
						oTemplateUtils.oCommonUtils.onBeforeRebindTableOrChart(oEvent, oCallbacks, oState.oSmartFilterbar);

						// add custom filters
						oController.onBeforeRebindChartExtension(oEvent);
						var fnDataReceived = oBindingParams.events.dataReceived || Function.prototype;
						oBindingParams.events.dataReceived = function(oReceivedEvent){
							oState.oMultipleViewsHandler.onDataRequested();
							oTemplateUtils.oComponentUtils.hidePlaceholder();
							fnDataReceived.call(this, oReceivedEvent);
						};
						oState.oMultipleViewsHandler.onRebindContentControl(oBindingParams, aFiltersFromSmartChart);
						listUtils.handleErrorsOnTableOrChart(oTemplateUtils, oEvent, oState);
					},
					onChartInitialized: function (oEvent) {
						fnRegisterToChartEvents(oEvent);
						oTemplateUtils.oCommonUtils.checkToolbarIntentsSupported(oEvent.getSource());
					},
					onSelectionDetailsActionPress: function (oEvent) {
						oState.oMultipleViewsHandler.onDetailsActionPress(oEvent);
					},

					onShareListReportActionButtonPress: function (oEvent) {
						oTemplateUtils.oCommonUtils.executeIfControlReady(onShareListReportActionButtonPressImpl, StableIdHelper.getStableId({
							type: "ListReportAction",
							subType: "Share"
						}) + "-internalBtn");
					},
					onInlineDataFieldForAction: function (oEvent) {
						oTemplateUtils.oCommonEventHandlers.onInlineDataFieldForAction(oEvent);
					},
					onInlineDataFieldForIntentBasedNavigation: function (oEvent) {
						oTemplateUtils.oCommonEventHandlers.onInlineDataFieldForIntentBasedNavigation(oEvent.getSource(), oState);
					},
					onDeterminingDataFieldForAction: function(oEvent) {
						oTemplateUtils.oCommonEventHandlers.onDeterminingDataFieldForAction(oEvent, oState.oPresentationControlHandler);
					},
					onDeterminingDataFieldForIntentBasedNavigation: function(oEvent) {
						oTemplateUtils.oCommonEventHandlers.onDeterminingDataFieldForIntentBasedNavigation(oEvent.getSource(), oState.oPresentationControlHandler.getSelectedContexts(), oState.oSmartFilterbar);
					},

					// Note: In the multiple view multi tables mode this will be called once for each SmartTable
					onTableInit: function (oEvent) {
						var oSmartTable = oEvent.getSource();
						oTemplateUtils.oCommonUtils.checkToolbarIntentsSupported(oSmartTable);
						var oModel = new sap.ui.model.base.ManagedObjectModel(oSmartTable);
						oSmartTable.setModel(oModel, "tableobserver");
					},
					//search function called in worklist light version of LR
					onSearchWorkList: function (oEvent) {
						oState.oWorklistHandler.performWorklistSearch(oEvent);
					},
					onMultiEditButtonPress: function () {
						oState.oMultiEditHandler.onMultiEditButtonPress();
					},
					onSaveMultiEditDialog: function (oEvent) {
						oState.oMultiEditHandler.onSaveMultiEditDialog(oEvent);
					},
					onCancelMultiEditDialog: function (oEvent) {
						oState.oMultiEditHandler.onCancelMultiEditDialog(oEvent);
					},
					dataStateFilter: function(oMessage, oTable){
						return oState.oMessageStripHelper.dataStateFilter(oMessage, oTable);
					},
					dataStateClose: function(){
						oState.oMessageStripHelper.onClose();
					}
				},
				formatters: {
					formatDraftType: function (oDraftAdministrativeData, bIsActiveEntity, bHasDraftEntity) {
						if (oDraftAdministrativeData && oDraftAdministrativeData.DraftUUID) {
							if (!bIsActiveEntity) {
								return sap.m.ObjectMarkerType.Draft;
							} else if (bHasDraftEntity) {
								return oDraftAdministrativeData.InProcessByUser ? sap.m.ObjectMarkerType.Locked : sap.m.ObjectMarkerType.Unsaved;
							}
						}
						return sap.m.ObjectMarkerType.Flagged;
					},

					formatDraftVisibility: function (oDraftAdministrativeData, bIsActiveEntity) {
						if (oDraftAdministrativeData && oDraftAdministrativeData.DraftUUID) {
							if (!bIsActiveEntity) {
								return sap.m.ObjectMarkerVisibility.TextOnly; //for Draft mode only the text will be shown
							}
						}
						return sap.m.ObjectMarkerVisibility.IconAndText; //Default text and icon
					},

					formatDraftLineItemVisible: function (oDraftAdministrativeData, sSelectedEditStateFilter) {
						if (oDraftAdministrativeData && oDraftAdministrativeData.DraftUUID) {
							if (sSelectedEditStateFilter === "5") {
								// marker shouldnot be shown for All(Hiding Draft) case
								return false;
							}
							return true;
						}
						return false;
					},

					// Returns full user name or ID of owner of a draft with status "unsaved changes" or "locked" in the format "by full name" or "by UserId"
					// If the user names and IDs are not maintained we display for example "locked by another user"
					formatDraftOwner: function (oDraftAdministrativeData, bHasDraftEntity) {
						var sDraftOwnerDescription = "";
						if (oDraftAdministrativeData && oDraftAdministrativeData.DraftUUID && bHasDraftEntity) {
							var sUserDescription = oDraftAdministrativeData.InProcessByUserDescription || oDraftAdministrativeData.InProcessByUser || oDraftAdministrativeData.LastChangedByUserDescription || oDraftAdministrativeData.LastChangedByUser;
							if (sUserDescription) {
								sDraftOwnerDescription = oTemplateUtils.oCommonUtils.getText("ST_DRAFT_OWNER", [sUserDescription]);
							} else {
								sDraftOwnerDescription = oTemplateUtils.oCommonUtils.getText("ST_DRAFT_ANOTHER_USER");
							}
						}
						return sDraftOwnerDescription;
					},

					formatItemTextForMultipleView: function (oItem) {
						return oState.oMultipleViewsHandler ? oState.oMultipleViewsHandler.formatItemTextForMultipleView(oItem) : "";
					},
					formatMessageStrip: function (aIgnoredFilters, sSelectedKey) {
						return oState.oMultipleViewsHandler ? oState.oMultipleViewsHandler.formatMessageStrip(aIgnoredFilters, sSelectedKey) : "";
					}
				},

				extensionAPI: new ExtensionAPI(oTemplateUtils, oController, oState)
			};
		}
	};
	return oMethods;
});
