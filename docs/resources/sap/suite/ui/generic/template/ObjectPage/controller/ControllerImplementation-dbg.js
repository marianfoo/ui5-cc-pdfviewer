sap.ui.define([
	"sap/ui/core/mvc/ControllerExtension",
	"sap/m/MessageBox",
	"sap/ui/model/Filter",
	"sap/ui/model/Sorter",
	"sap/ui/model/base/ManagedObjectModel",
	"sap/ui/generic/app/navigation/service/SelectionVariant",
	"sap/suite/ui/generic/template/genericUtilities/controlHelper",
	"sap/suite/ui/generic/template/genericUtilities/testableHelper",
	"sap/suite/ui/generic/template/detailTemplates/detailUtils",
	"sap/suite/ui/generic/template/ObjectPage/controller/MessageSortingHandler",
	"sap/suite/ui/generic/template/ObjectPage/controller/MessageStripHelper",
	"sap/suite/ui/generic/template/ObjectPage/controller/SideContentHandler",
	"sap/suite/ui/generic/template/ObjectPage/extensionAPI/ExtensionAPI",
	"sap/m/Table",
	"sap/suite/ui/generic/template/lib/ShareUtils",
	"sap/suite/ui/generic/template/genericUtilities/FeLogger",
	"sap/suite/ui/generic/template/ObjectPage/controller/MultipleViewsHandler",
	"sap/suite/ui/generic/template/lib/MessageUtils",
	"sap/ui/events/KeyCodes",
	"sap/base/util/merge",
	"sap/ui/model/FilterProcessor",
	"sap/suite/ui/generic/template/js/StableIdHelper",
	"sap/base/util/extend",
	"sap/base/util/UriParameters",
	"sap/base/util/isEmptyObject",
	"sap/ui/dom/getFirstEditableInput",
	"sap/ui/dom/jquery/Focusable",
	"sap/suite/ui/generic/template/genericUtilities/FeError",
	"sap/suite/ui/generic/template/lib/CreateWithDialogHandler",
	"sap/ui/Device",
	"sap/base/strings/whitespaceReplacer",
	"sap/base/util/deepExtend",
	"sap/suite/ui/generic/template/ObjectPage/controller/InlineCreationRowsHelper",
	"sap/suite/ui/generic/template/ObjectPage/controller/RelatedAppsHandler",
	"sap/suite/ui/generic/template/genericUtilities/metadataAnalyser"
], function (ControllerExtension, MessageBox, Filter, Sorter, ManagedObjectModel, SelectionVariant, controlHelper, 
	testableHelper, detailUtils, MessageSortingHandler, MessageStripHelper, SideContentHandler, ExtensionAPI, 
	ResponsiveTable, ShareUtils, FeLogger, MultipleViewsHandler, MessageUtils, KeyCodes, merge, FilterProcessor, 
	StableIdHelper, extend, UriParameters, isEmptyObject, getFirstEditableInput, Focusable, FeError, 
	CreateWithDialogHandler, Device, whitespaceReplacer, deepExtend, InlineCreationRowsHelper, RelatedAppsHandler,
	metadataAnalyser) {
	"use strict";
	var sClassName = "ObjectPage.controller.ControllerImplementation";
	var oLogger = new FeLogger(sClassName).getLogger();
	var DEFAULT_GROWING_THRESHOLD = 20;

	// Scroll the specified object page to top
	function fnScrollObjectPageToTop(oObjectPage) {
		oObjectPage.setSelectedSection(null);
	}

	function fnIsSmartTableWithInlineCreate(oSmartTable) {
		return oSmartTable.data("inlineCreate") === "true";
	}

	function fnIsInlineCreationRowsEnabled (oSmartTable) {
		return oSmartTable.data("inlineCreationRows") === "true";
	}

	function fnSetPropertyBindingInternalType(oBinding, sInternalType) {
		if (oBinding.getBindings) { // composite Binding
			var aBindings = oBinding.getBindings();
			for (var i = 0; i < aBindings.length; i++) {
				fnSetPropertyBindingInternalType(aBindings[i], sInternalType);
			}
		} else {
			var oType = oBinding.getType();
			oBinding.setType(oType, sInternalType);
		}
	}

	var oMethods = {
		getMethods: function (oViewProxy, oTemplateUtils, oController) {

			// contains all the helper objects which can be accessed across helper or extension methods of OP floorplan
			var oState = {};
			var oBase = detailUtils.getControllerBase(oViewProxy, oTemplateUtils, oController);
			oViewProxy.oController = oController; //Controller attached to ViewProxy so that it's available wherever oViewProxy is accessed
			var oObjectPage; // the object page, initialized in onInit
			var oObjectPageLayoutWrapper; //Wrapper object to get and set state of object page header
			//TODO: Need to see whether we need to initialize the SideContentHandler here
			var oSideContentHandler = new SideContentHandler(oController, oTemplateUtils, oTemplateUtils.oComponentUtils.stateChanged); // handles all task connected with SideContent
			var oRelatedAppsHandler = new RelatedAppsHandler(oController, oTemplateUtils); //Handle related app Case

			oTemplateUtils.oSideContentHandler = oSideContentHandler;
			var oMultipleViewsHandler;
			var oCreateWithDialogHandler;
			// current state
			var mTablesWithMessagesToDataStateIndicators = Object.create(null); //used by functions fnDataStateFilter and fnRegisterForEditableChange
			var mTableThresholdInfo = Object.create(null); // holds table id as key and initial growingThreshold as value
			var sSectionId = null; // id of the last section that was navigated to
			var sSelectedSubSectionId = null; //Selected SubSections Id
			oTemplateUtils.initialStateAppliedPromise = null; // Promise telling, whether app state has been applied. Will be created in onInit and recreated when component is rebound
			// any asynchronous actions triggered by applying the state are not considered - promise is resolved as soon, as synchronous
			// processing is completed
			var fnInitialStateAppliedResolve = null; // resolve function for oStateAppliedAfterBindPromise
			
			var mTablesWithSelectionChangeDuringDraftEdit = Object.create(null); // initialized in draft edit; collects the ids of all tables that have a selction change during the edit session

			// This represents the global state of object page. There are different things, for which object page sub-sections might be waiting for,
			// We use this variable to check whether those things have completed or not. This state can only be changed by method fnHandleStateChangeForAllSubSections,
			// this method changes the flag of state and trigger a side-effect to tell all the subsections that if they are listening for any state value, they can
			// update themselves.
			// This state is reset in every rebind cycle and set appropriatly whenever some events happen like, headerdata available, stateApplied, layoutFinished.
			// currently structre of this state looks like
			// oWaitForState = {
			// 	bLayoutFinished: boolean,
			// 	bStateApplied: boolean,
			// 	bRebindCompleted :boolean
			// };
			var oWaitForState;
			// If this flag is set to false, it will activate the binding of all subsections which are currently
			// not is viewport but potentially visible, and their waitForState has set. If any of the parameter of their waitForState is
			// still not set, it will not activate their bindings. Useful, when we want to find target of messages
			// and want when someone opens message popover, because their targets need not to be in viewport, thus we
			// need to activate those subsections.
			var bWaitForViewPort;
			// end state
			// Map would contain the SubSections which has come to ViewPort once for the current ObjectPage context
			// and the onSubSectionEnteredExtension is called. When the OP context is changed in the beforeRebind method
			// the Map will be reset the states 
			var mSubSectionsInitState = Object.create(null);

			function adjustAndProvideBindingParamsForSmartTableOrChart(oEvent) {
				var oBindingParams = oEvent.getParameter("bindingParams");
				oBindingParams.parameters = oBindingParams.parameters || {};
				oBindingParams.parameters.usePreliminaryContext = true;
				oBindingParams.parameters.bCanonicalRequest = oTemplateUtils.oServices.oApplication.mustRequireRequestsCanonical();
				oBindingParams.parameters.batchGroupId = "facets";
				return oBindingParams;
			}

			// Implementation of Save for the draft case
			function onActivateImpl(bEditNextObject) {
				oLogger.info("Activate object");
				var oActivationPromise = oTemplateUtils.oServices.oCRUDManager.activateDraftEntity();
				var oUIModel = oObjectPage.getModel("ui");
				var bCreateMode = oUIModel.getProperty("/createMode");
				oActivationPromise.then(function (oResponse) {
					fnDetachPasteHandlers();
					// when the message model contains at least one transient message this will be shown at the end of the busy session. Otherwise we show a generic success message.
					MessageUtils.showSuccessMessageIfRequired(oTemplateUtils.oCommonUtils.getText(bCreateMode ? "OBJECT_CREATED" : "OBJECT_SAVED"), oTemplateUtils.oServices);
					// it's not enough to set root to dirty: Scenario: subitem has been displayed (active document), then changed (draft) and shall be
					// displayed again after activation - now data has to be read again
					// therefore we set all pages to dirty, excluding the current one (here the active data is already returned by the function import)
					var oComponent = oController.getOwnerComponent();
					oTemplateUtils.oServices.oViewDependencyHelper.setAllPagesDirty([oComponent.getId()]);
					oTemplateUtils.oServices.oViewDependencyHelper.unbindChildren(oComponent);
					// Draft activation is a kind of cross navigation -> invalidate paginator info
					
					var bNavToListOnSave = oComponent.getNavToListOnSave();
					var sEditFlow = oTemplateUtils.oServices.oApplication.getEditFlowOfRoot();
					if (sEditFlow === "direct" && bEditNextObject) {
						oBase.utils.switchToNextObject();
					} else if (sEditFlow === "direct" && bNavToListOnSave !== false ) {
						oTemplateUtils.oServices.oApplication.invalidatePaginatorInfo();
						oTemplateUtils.oServices.oApplication.navigateAfterActivation(false);
						
					} else {
						oTemplateUtils.oServices.oApplication.invalidatePaginatorInfo();
						var oActiveContext = !bNavToListOnSave && oResponse.context;
						if (oActiveContext){
							oTemplateUtils.oServices.oApplication.setNextFocus(fnFocusOnFirstActionButton);
						}
						oTemplateUtils.oServices.oApplication.navigateAfterActivation(oActiveContext);
					}
				}, Function.prototype);
				oActivationPromise.catch(function(){
					oTemplateUtils.oInfoObjectHandler.executeForAllInformationObjects("smartTable", function(oInfoObject){
						oInfoObject.onSaveWithError();
					});
				});
				var oEvent = {
					activationPromise: oActivationPromise
				};
				oTemplateUtils.oComponentUtils.fire(oController, "AfterActivate", oEvent);
			}
			
			// Contains the common code when returning to display mode via save or cancel in a non-draft scenario
			function fnReturnToDisplayNonDraft(){
				if (mTablesWithSelectionChangeDuringDraftEdit){ // will not be fulfilled in the create case
					for (var sTableId in mTablesWithSelectionChangeDuringDraftEdit){
						oTemplateUtils.oCommonUtils.setEnabledToolbarButtons(oController.byId(sTableId));
					}
					mTablesWithSelectionChangeDuringDraftEdit = Object.create(null);
				}
			}
			
			// Implementation of save for the non-draft case
			function onSaveImpl(bStayInEdit, bEditNextObject) {
				var oView = oController.getView();
				var oModel = oView.getModel();
				var bIsComponentDirty = oTemplateUtils.oComponentUtils.isComponentDirty();
				var oPendingChanges = oModel.getPendingChanges();
				var mPendingChangesToContextInfo = Object.create(null);
				if (oPendingChanges) {
					for (var sProperty in oPendingChanges) {
						if (oPendingChanges.hasOwnProperty(sProperty)) {
							var oPendingContext = oModel.getContext("/" + sProperty); // Currently there's no other option than using the private ODataModel#getContext API according to BCP 1980351206
							mPendingChangesToContextInfo[sProperty] = {
								context: oPendingContext,
								change: oPendingChanges[sProperty]
							};
						}
					}
				}
				oTemplateUtils.oCommonEventHandlers.submitChangesForSmartMultiInput();
				var oSaveEntityPromise = oTemplateUtils.oServices.oCRUDManager.saveEntity(); // This Promise may include a dialog step (warning scenario) -> do not use it for busy handling
				var bSuccess = false; // will be set before the busy session ends
				oSaveEntityPromise.then(function (oContext) {
					if (!bStayInEdit) {
						var oTemplatePrivateModel = oTemplateUtils.oComponentUtils.getTemplatePrivateModel();
						//	switch to display mode
						oTemplatePrivateModel.setProperty("/objectPage/displayMode", 1);
						fnReturnToDisplayNonDraft();
						oViewProxy.setEditable(false);
					}
					performAfterSaveOperations(oContext, oView, bIsComponentDirty, mPendingChangesToContextInfo, bStayInEdit, bEditNextObject);
					bSuccess =  true;
				}, function(){
					oTemplateUtils.oInfoObjectHandler.executeForAllInformationObjects("smartTable", function(oInfoObject){
						oInfoObject.onSaveWithError();
					});
				});
				// Define a function that is called after the end of the busy session to set the focus. It can rely on bSuccess
				var fnSetFocusAfterwards = bStayInEdit ? Function.prototype : function(){
					if (bSuccess){
						fnFocusOnFirstActionButton();
					}
				};
				oTemplateUtils.oServices.oApplication.setNextFocus(fnSetFocusAfterwards);
				var oEvent = {
					saveEntityPromise: oSaveEntityPromise
				};
				oTemplateUtils.oComponentUtils.fire(oController, "AfterSave", oEvent);
			}

			//common flow for Save and Save-continue Edit (Non draft)
			function performAfterSaveOperations(oContext, oView, bSomethingWasChanged, mPendingChangesToContextInfo, bStayInEdit, bEditNextObject) {
				var oUIModel = oObjectPage.getModel("ui");
				var bCreateMode = oUIModel.getProperty("/createMode");
				var oComponent = oController.getOwnerComponent();
				oTemplateUtils.oServices.oViewDependencyHelper.setParentToDirty(oComponent, oComponent.getEntitySet(), 1);
				oTemplateUtils.oServices.oViewDependencyHelper.unbindChildren(oComponent);
				var bNavToListOnSave = oComponent.getNavToListOnSave();
				var sEditFlow = oTemplateUtils.oServices.oApplication.getEditFlowOfRoot();
				var bStayOnPage;
				if (sEditFlow === "direct"){
					bStayOnPage = bNavToListOnSave === false || bStayInEdit;
				} else {
					bStayOnPage = !bNavToListOnSave || bStayInEdit;
				}
				if (bStayOnPage){
					if (bEditNextObject){
						oBase.utils.switchToNextObject();
					} else if (bCreateMode){ // UI5 has adapted the binding context of the view, however, the url (and internal information) needs to be adapted
						oTemplateUtils.oComponentUtils.adaptUrlAfterNonDraftCreateSaved(oView.getBindingContext(), bStayInEdit);
					}
				} else {
					oViewProxy.navigateUp();
				}
				var sSuccessMessageKey;
				if (bCreateMode) {
					sSuccessMessageKey = "OBJECT_CREATED";
				} else {
					sSuccessMessageKey = bSomethingWasChanged ? "OBJECT_SAVED" : "OBJECT_NOT_MODIFIED";
				}
				MessageUtils.showSuccessMessageIfRequired(oTemplateUtils.oCommonUtils.getText(sSuccessMessageKey), oTemplateUtils.oServices);

				for (var sProperty in mPendingChangesToContextInfo) {
					var oInfo = mPendingChangesToContextInfo[sProperty];
					var oCurrentContext = oInfo.context;
					var oPendingChangesPerContext = oInfo.change;
					var aSourceProperties = Object.keys(oPendingChangesPerContext) || [];

					/*	The OData model returns also a __metadata object with the canonical URL and further
					 information. As we don't want to check if sideEffects are annotated for this
					 property we remove it from the pending changes
					 */
					var iMetaDataIndex = aSourceProperties.indexOf("__metadata");
					if (iMetaDataIndex > -1) {
						aSourceProperties.splice(iMetaDataIndex, 1);
					}
					oTemplateUtils.oServices.oApplicationController.executeSideEffects(oCurrentContext, aSourceProperties);
				}
			}

			function onSaveAndContinueEdit(oEvent) {
				var sButtonId = oEvent.getSource().getId();
				onSave("SaveAndContEdit", sButtonId);
			}

			function onSaveAndEditNext(oEvent){
				var sButtonId = oEvent.getSource().getId();
				onSave("SaveAndEditNext", sButtonId);
			}

			// Save of draft and non-draft case. Forwards either to onActivateImpl (draft) or onSaveImpl (non-draft) or onSaveAndContinueEditImpl (non draft, save and continue edit)
			function onSave(sSaveCase, sBtnId) {
				// Analyse what we want to do
				var iScenario;
				var fnImpl;
				var sButtonId;
				if (oTemplateUtils.oComponentUtils.isDraftEnabled()) {
					iScenario = 1;
					if (sSaveCase === "SaveAndEditNext") {
						fnImpl = onActivateImpl.bind(null, true);
						sButtonId = sBtnId;
					} else {
						fnImpl = onActivateImpl.bind(null, false);
						sButtonId = "activate";
					}
				} else {
					iScenario = 3;
					if (sSaveCase === "SaveAndContEdit") {
						fnImpl = onSaveImpl.bind(null, true, false);
						sButtonId = sBtnId;
					} else if (sSaveCase === "SaveAndEditNext") {
						fnImpl = onSaveImpl.bind(null, true, true);
						sButtonId = sBtnId;
					} else {
						fnImpl = onSaveImpl.bind(null, false, false);
						sButtonId = "save";
					}
				}
				oTemplateUtils.oCommonUtils.executeIfControlReady(function(){ // Make sure that the action is only performed if it is allowed
					// Start with beforeSaveExtension. If this function returns a Promise, wait for this Promise to be resolved.
					var oBeforeSavePromise = Promise.resolve(oController.beforeSaveExtension());
					oBeforeSavePromise.then(function(){
						var oCRUDActionHandler = oTemplateUtils.oComponentUtils.getCRUDActionHandler();
						oCRUDActionHandler.handleCRUDScenario(iScenario, fnImpl);
					});
				}, sButtonId);	
			}

			function fnAdaptBindingParamsForInlineCreate(oEvent) {
				var oSmartTable = oEvent.getSource();
				if (fnIsSmartTableWithInlineCreate(oSmartTable)) {
					var oBindingParams = oEvent.getParameter("bindingParams");
					if (oBindingParams.filters && oBindingParams.filters.length) {
						/*
						 * Add a new filter condition to always show all items that are just created. In case we are in a draft,
						 * that just means to add "or HasActiveEntity = false". For active documents however, that condition
						 * would always be true. Thus, we have to add
						 * "or (HasActiveEntity = false and IsActiveEntity = false)".
						 * However, this condition is not evaluated correctly by gateway, so we have to transform it to
						 * (IsActvieEntity = true and x) or (Is ActvieEntity = false and (x or HasActvieEntity = false)),
						 * where x is the condition provided by the user
						 */
						var oUserFilter = FilterProcessor.groupFilters(oBindingParams.filters);
						if (!oEvent.getParameter("messageFilterActive")) {
							oBindingParams.filters = new Filter({
								filters: [
									new Filter({
										filters: [
											new Filter({
												path: "IsActiveEntity",
												operator: "EQ",
												value1: true
											}), oUserFilter
										],
										and: true
									}),
									new Filter({
										filters: [
											new Filter({
												path: "IsActiveEntity",
												operator: "EQ",
												value1: false
											}), new Filter({
												filters: [
													oUserFilter, new Filter({
														path: "HasActiveEntity",
														operator: "EQ",
														value1: false
													})
												],
												and: false
											})
										],
										and: true
									})
								],
								and: false
							});
						} else {
							oBindingParams.filters = oUserFilter;
						}
					}
					var fnGroup = oBindingParams.sorter[0] && oBindingParams.sorter[0].getGroupFunction();
					var fnGroupExtended = fnGroup && function (oContext) {
						var oObject = oContext.getObject();
						if (oObject.IsActiveEntity || oObject.HasActiveEntity) {
							var oRet = extend({}, fnGroup(oContext));
							oRet.key = oRet.key.charAt(0) === "§" ? "§" + oRet.key : oRet.key;
							return oRet;
						}
						return {
							key: "§",
							text: oTemplateUtils.oCommonUtils.getText("NEW_ENTRY_GROUP")
						};
					};
					//read the custom data of the smart table set by manifest flag "disableDefaultInlineCreateSort"
					if (oSmartTable.data("disableInlineCreateSort") === "false") {
						// Ensure that new rows are excluded from the standard sorting.
						// They should be put on top ordered by the creation time (starting with the newest).
						// Note that DraftEntityCreationDateTime will have the same (older) value for all rows that
						// already exist in the active version. Hence, those rows are sorted according to the normal sort order.
						// As DraftEntityCreationDateTime might not be avialable for all services we use HasActiveEntity as a fallback
						var oEntityType = oTemplateUtils.oCommonUtils.getMetaModelEntityType(oSmartTable.getEntitySet());
						var sFilterPropertyName = "DraftEntityCreationDateTime";
						var bHasDraftEntityCreationDateTime = oEntityType.property.some(function (oDef) {
							return oDef.name === sFilterPropertyName;
						});
						if (!bHasDraftEntityCreationDateTime) {
							sFilterPropertyName = "HasActiveEntity";
						}
						oBindingParams.sorter.unshift(new Sorter(sFilterPropertyName, bHasDraftEntityCreationDateTime, fnGroupExtended));
					}
				}
			}

			function getObjectHeader() {
				return oObjectPage.getHeaderTitle();
			}

			function onShareObjectPageActionButtonPressImpl(oButton) {
				var oTemplatePrivateModel = oTemplateUtils.oComponentUtils.getTemplatePrivateModel();
				var oFragmentController = {
					sharePageToPressed: function (target) {
						var sSubject = oTemplatePrivateModel.getProperty("/objectPage/headerInfo/objectTitle");
						var sObjectSubtitle = oTemplatePrivateModel.getProperty("/objectPage/headerInfo/objectSubtitle");
						if (sObjectSubtitle) {
							sSubject = sSubject + " - " + sObjectSubtitle;
						}
						var oBusyHelper = oTemplateUtils.oServices.oApplication.getBusyHelper();
						if (oBusyHelper.isBusy()) {
							return; // Ignore user interaction while the app is busy.
						}
						// Getting the sibling context to navigate.
						var oContext = oController.getView().getBindingContext();
						var IsActiveEntity = oContext.getObject().IsActiveEntity;
						var oTriggerPromise = ShareUtils.getCurrentUrl().then(function (sCurrentUrl) {
							if (IsActiveEntity || IsActiveEntity === undefined) {
								switch (target) {
									case "MicrosoftTeams":
										ShareUtils.openMSTeamsShareDialog(sSubject, sCurrentUrl);
										break;
									case "Email":
										sap.m.URLHelper.triggerEmail(null, sSubject, sCurrentUrl);
										break;
									default:
										break;
								}
							} else {
								var oSiblingContextPromise = oTemplateUtils.oServices.oApplication.getDraftSiblingPromise(oContext);
								var URLParser = sap.ushell.services && new sap.ushell.services.URLParsing();
								oBusyHelper.setBusy(oSiblingContextPromise.then(function (oSiblingContext) {
									var sPath = URLParser ? sCurrentUrl.split(URLParser.getHash(sCurrentUrl))[0] + URLParser.getShellHash(sCurrentUrl) + "&" + oSiblingContext.sDeepPath : sCurrentUrl;
									switch (target) {
										case "MicrosoftTeams":
											ShareUtils.openMSTeamsShareDialog(sSubject, sPath);
											break;
										case "Email":
											sap.m.URLHelper.triggerEmail(null, sSubject, sPath);
											break;
										default:
											break;
									}
								}));
							}
						});
						oBusyHelper.setBusy(oTriggerPromise);
					},

					shareJamPressed: function () {
						ShareUtils.openJamShareDialog(oTemplatePrivateModel.getProperty("/objectPage/headerInfo/objectTitle") + " " + oTemplatePrivateModel.getProperty("/objectPage/headerInfo/objectSubtitle"));
					},

					shareTilePressed: function() {
						ShareUtils.fireBookMarkPress();
					},

					getModelData: function () {
						var oContext = oController.getView().getBindingContext();
						var IsActiveEntity = oContext.getObject().IsActiveEntity;
						var oMetadata = oController.getOwnerComponent().getAppComponent().getMetadata();
						var oAppManifest = oMetadata.getManifestEntry("sap.app");
						if (IsActiveEntity === false) { // We have not negated it because we wanted to differentiate between false and undefined
							var oSiblingContextPromise = oTemplateUtils.oServices.oApplication.getDraftSiblingPromise(oContext);
							var URLParser = new sap.ushell.services.URLParsing();
							return oSiblingContextPromise.then(function (oSiblingContext) {
								return ShareUtils.getCurrentUrl().then(function (sCurrentUrl) {
									var sPath = URLParser ? sCurrentUrl.split(URLParser.getHash(sCurrentUrl))[0] + URLParser.getShellHash(sCurrentUrl) + "&" + oSiblingContext.sDeepPath : sCurrentUrl;
									var sUrl = "#" + URLParser.getShellHash(document.URL) + "&" + oSiblingContext.sDeepPath;
									return {
										serviceUrl: "",
										appTitle: oAppManifest ? oAppManifest.title : "",
										title: oTemplatePrivateModel.getProperty("/objectPage/headerInfo/objectTitle"),
										subtitle: oTemplatePrivateModel.getProperty("/objectPage/headerInfo/objectSubtitle"),
										customUrl: sUrl,
										currentUrl: sPath
									};
								});
							});
						} else {
							return Promise.resolve().then(function () {
								return ShareUtils.getCurrentUrl().then(function (sCurrentUrl) {
									return {
										serviceUrl: "",
										appTitle: oAppManifest ? oAppManifest.title : "",
										title: oTemplatePrivateModel.getProperty("/objectPage/headerInfo/objectTitle"),
										subtitle: oTemplatePrivateModel.getProperty("/objectPage/headerInfo/objectSubtitle"),
										customUrl: ShareUtils.getCustomUrl(),
										currentUrl: sCurrentUrl
									};
								});
							});
						}
					}
				};

				ShareUtils.openSharePopup(oTemplateUtils.oCommonUtils, oButton, oFragmentController);
			}
			
			var fnDeleteConfirmationOnDelete;

			function getObjectPageDeleteDialog() {
				fnDeleteConfirmationOnDelete = function (oEvent) {
					var oDialog = oEvent.getSource().getParent();
					var oBusyHelper = oTemplateUtils.oServices.oApplication.getBusyHelper();
					if (oBusyHelper.isBusy()) {
						return;
					}
					var oComponent = oController.getOwnerComponent();
					var oTemplPrivGlobal = oComponent.getModel("_templPrivGlobal");
					var oObjPage = {
						objectPage: {
							currentEntitySet: oComponent.getProperty("entitySet")
						}
					};
					oTemplPrivGlobal.setProperty("/generic/multipleViews", oObjPage);
					var oDeleteEntityPromise = oTemplateUtils.oServices.oCRUDManager.deleteEntity();
					var sPath = oComponent.getBindingContext().getPath();
					var mObjectsToDelete = Object.create(null);
					mObjectsToDelete[sPath] = oDeleteEntityPromise;

					var oDeleteEvent = {
						deleteEntityPromise: oDeleteEntityPromise
					};
					oTemplateUtils.oComponentUtils.fire(oController, "AfterDelete", oDeleteEvent);
					oDialog.close();
				};

				return oTemplateUtils.oCommonUtils.getDialogFragmentAsync("sap.suite.ui.generic.template.ObjectPage.view.fragments.TableDeleteConfirmation", {
					onCancel: function (oEvent) {
						var oDialog = oEvent.getSource().getParent();
						oDialog.close();
					},
					// to be called within a function to asure that fnDeleteConfirmationOnDelete contains correct coding (see below function getTableDeleteDialog)
					onDelete: function (oEvent) {
						fnDeleteConfirmationOnDelete(oEvent);
					}
				}, "delete", Function.prototype, true);
			}


			function onDeleteImpl() {
				var oBusyHelper = oTemplateUtils.oServices.oApplication.getBusyHelper();
				if (oBusyHelper.isBusy()) {
					return;
				}
				var oTemplatePrivateModel = oTemplateUtils.oComponentUtils.getTemplatePrivateModel();
				var sObjectTitle = (oTemplatePrivateModel.getProperty("/objectPage/headerInfo/objectTitle") || "").trim();
				var sObjectSubtitle = oTemplatePrivateModel.getProperty("/objectPage/headerInfo/objectSubtitle");
				var iViewLevel = oTemplateUtils.oComponentUtils.getViewLevel();
				var isSubObjectPage = iViewLevel > 1;

				var oDialogParameter = {};
				oDialogParameter.title = oTemplateUtils.oCommonUtils.getText("ST_GENERIC_DELETE_TITLE");
				oDialogParameter.text = oTemplateUtils.oCommonEventHandlers.getDeleteText(sObjectTitle, sObjectSubtitle, !isSubObjectPage, isSubObjectPage);

				// ensure to have a Promise (even if extension returns sth. different)
				var oBeforeDeleteExtensionPromise = Promise.resolve(oController.beforeDeleteExtension());
				oBeforeDeleteExtensionPromise.then(function (oExtensionResult) {
						extend(oDialogParameter, oExtensionResult);

						// get Delete Confirmation Popup fragment
						getObjectPageDeleteDialog().then(function (oDialog) {
							var oDeleteDialogModel = oDialog.getModel("delete");
							oDeleteDialogModel.setData(oDialogParameter);
							oDialog.open();
						});
					},
					/*
					 * In case the Promise returned from extension is rejected, don't show a popup and don't execute
					 * deletion. If extension needs an asynchronous step (e.g. backend request) to determine special text
					 * that could fail, it should use securedExecution. Then error messages from backend are shown by
					 * busyHelper automatically.
					 */
					Function.prototype);
			}

			// BEGIN - Functions related to the copy-paste from Excel

			function fnOnBeforeSmartTablePaste(oEvent) {
				var aColumnData = oEvent.getParameter("columnInfos");
				//Remove the ignored fields(not visible in the table and actions) from the column data
				var index = aColumnData && aColumnData.length - 1;

				while (index >= 0) {
					if (aColumnData[index].ignore) {
						aColumnData.splice(index, 1);
					}
					index -= 1;
				}
				//Using seperate loops to work on the array without ignored fields.
				var aUnsupportedColumns = aColumnData.reduce(function (aColumns, oColumn) {
					// Data formats for which paste is not yet supported.
					if (!oColumn.type && !oColumn.customParseFunction) {
						aColumns.push(oColumn);
					}
					return aColumns;
				}, []);

				if (aUnsupportedColumns.length > 0) {
					//Appropriate messages for columns with unsupported data formats.
					var sUnsupportedFormatError = oTemplateUtils.oCommonUtils.getText("DATA_PASTE_UNSUPPORTED_FORMAT_MESSAGE");
					MessageBox.show(sUnsupportedFormatError, {
						icon: MessageBox.Icon.ERROR,
						title: oTemplateUtils.oCommonUtils.getText("ST_ERROR"),
						actions: [sap.m.MessageBox.Action.CLOSE]
					});
				}
			}

			function fnOnSmartTablePaste(oEvent) {
				var aParsedData;
				var oSmartTable = oEvent.getSource();
				var sSmartTableId = oSmartTable.getId();
				var sAddEntryId = sSmartTableId.split("::Table")[0] + "::addEntry";
				var oAddEntry = oController.byId(sAddEntryId); //Instance of the Create button
				var bIsInlineCreationRowsEnabled = fnIsInlineCreationRowsEnabled(oSmartTable);
				//Paste is allowed when an add button is present in the table (or) inline creation rows feature is enabled
				var bIsPasteAllowed = oAddEntry || bIsInlineCreationRowsEnabled;
				var oEventSource = oAddEntry || oSmartTable;
				if (!bIsPasteAllowed) {
					return;
				}
				var oResult = oEvent.getParameter("result");
				if (oResult) {
					if (oResult.errors) {
						var aErrorMessages = oResult.errors.map(function (oElement) {
							return oElement.message;
						});
						var sPasteError = oTemplateUtils.oCommonUtils.getText("DATA_PASTE_ERROR_MESSAGE", [aErrorMessages.length]);
						var sErrorCorrection = oTemplateUtils.oCommonUtils.getText("DATA_PASTE_ERROR_CORRECTION_MESSAGE");
						var sNote = oTemplateUtils.oCommonUtils.getText("DATA_PASTE_ERROR_CORRECTION_NOTE");
						//Push correction  message and note message to the aErrorMessages
						aErrorMessages.unshift(""); //To show space b/w the short text and detail text
						aErrorMessages.unshift(sNote);
						aErrorMessages.unshift(sErrorCorrection);
						MessageBox.show(sPasteError, {
							icon: MessageBox.Icon.ERROR,
							title: oTemplateUtils.oCommonUtils.getText("ST_ERROR"),
							actions: [sap.m.MessageBox.Action.CLOSE],
							details: aErrorMessages.join("<br>")
						});
					} else if (oResult.parsedData) {
						aParsedData = oResult.parsedData;
						if (aParsedData && aParsedData.length) {
							var iParsedDataLength = aParsedData.length;
							var bIgnoreTableRefresh;
							var oAddEntryPromise, aAddEntryPromises = [];
							var DraftSavedState = sap.m.DraftIndicatorState.Saved; //Indicator for the footer

							for (var i = 0; i < iParsedDataLength; i++) {
								bIgnoreTableRefresh = i < iParsedDataLength - 1; //Flag to overcome multiple table refreshs when records are pasted.
								oAddEntryPromise = oTemplateUtils.oCommonEventHandlers.addEntry(oEventSource, true, undefined, aParsedData[i], bIgnoreTableRefresh);
								aAddEntryPromises.push(oAddEntryPromise);
							}

							Promise.all(aAddEntryPromises).then(function () {
								//After the records are added, show a draft saved indicator on the footer
								var oTemplatePrivateGlobal = oTemplateUtils.oComponentUtils.getTemplatePrivateGlobalModel();
								oTemplatePrivateGlobal.setProperty("/generic/draftIndicatorState", DraftSavedState);
							});
						}
					}
				}
			}

			/*
				Function to detach the paste handlers once the user is out of edit mode.
				We do not want to initialize the paste functionality when the object page is in display mode.
			*/
			function fnDetachPasteHandlers() {
				//To-DO: Evaluate if there's a better way of doing this. Refactor if required.
				var oTemplatePrivateModel = oTemplateUtils.oComponentUtils.getTemplatePrivateModel();
				var aPasteAttachedTables = oTemplatePrivateModel.getProperty("/objectPage/aPasteAttachedTables");
				var index = aPasteAttachedTables.length;
				var sFacet;
				var oControl;
				while (index >= 0) {
					sFacet = aPasteAttachedTables[index];
					oControl = oController.byId(sFacet + "::Table");
					if (oControl && oControl.isA("sap.ui.comp.smarttable.SmartTable") && oControl.hasListeners("paste")) {
						oControl.detachBeforePaste(fnOnBeforeSmartTablePaste);
						oControl.detachPaste(fnOnSmartTablePaste);
						aPasteAttachedTables.splice(index, 1);
					}
					index -= 1;
				}
			}

			// END - Functions related to the copy-paste from Excel

			function onDelete(oEvent) {
				oTemplateUtils.oCommonUtils.executeIfControlReady(onDeleteImpl, "delete");
			}
			
			function isObjectPageScrolledToTop(){
				var aObjectPageSections = oObjectPage.getSections() || [];
				var oFirstVisibleSection = aObjectPageSections.find(function(oSection){
					return oSection.getVisible() && oSection._bInternalVisible !== false;
				});
				return !!oFirstVisibleSection && oFirstVisibleSection.getId() === oObjectPage.getSelectedSection();
			}

			// This method is called when editing of an entity has started and the corresponding context is available
			// aResult can contain both the target context for navigation in edit state and the target key,treenode of the target node or just the target context
			// bContinueEditing is to navigate to the context directly.
			//  - bContinueEditing faulty: User has pressed the 'Edit' button (draft and non-draft scenario)
			//  - bContinueEditing truthy: User has pressed the 'Continue Editing' button (only draft scenario)
			function fnStartEditing(oResult, bContinueEditing) {
				var oDraft, oContext;
				if (oResult) {
					// if oResult contains both the property targetSiblingKey and context/draftAdministrativeData, initialise oContext with value context/draftAdministrativeData
					oContext = oResult.context || (oResult.targetSiblingKey ? oResult.draftAdministrativeData : oResult);
					if (oTemplateUtils.oServices.oDraftController.getDraftContext().hasDraft(oContext)) {
						oTemplateUtils.oServices.oViewDependencyHelper.setRootPageToDirty();
						oDraft = oContext.context || oContext;
					}
				}
				var bMoveToTop = !oObjectPage.getUseIconTabBar() && isObjectPageScrolledToTop();
				if (oDraft) {
					// navigate to draft
					// is a kind of cross navigation -> invalidate paginator info
					oTemplateUtils.oServices.oApplication.invalidatePaginatorInfo();
					oTemplateUtils.oServices.oApplication.switchToDraft(oDraft, oResult.targetSiblingKey);
					oTemplateUtils.oServices.oApplication.setNextFocus(fnFocusForEdit.bind(null, bMoveToTop));
				} else {
					var oTemplatePrivateModel = oTemplateUtils.oComponentUtils.getTemplatePrivateModel();
					oTemplatePrivateModel.setProperty("/objectPage/displayMode", 2);
					fnFocusForEdit(bMoveToTop);
				}
				//set Editable independent of the fact that the instance is a draft or not
				oViewProxy.setEditable(true);
			}

			var fnExpiredLockDialog; // declare function already here, to avoid usage before declaration
			// This method is called when the user decides to edit an entity.
			// Parameter bUnconditional contains the information, whether the user has already confirmed to discard unsaved changes of another user(discard other user's draft), or whether this is still open
			function fnEditEntity(bUnconditional) {
				// For all other values apart from boolean we consider it to be false.
				bUnconditional = !!bUnconditional && typeof bUnconditional === "boolean";
				var oEditPromises = oTemplateUtils.oServices.oCRUDManager.editEntity(bUnconditional);
				oEditPromises.then(function (oEditAndSiblingInfo) {
					if (oEditAndSiblingInfo.draftAdministrativeData) {
						fnExpiredLockDialog(oEditAndSiblingInfo.draftAdministrativeData.CreatedByUserDescription || oEditAndSiblingInfo.draftAdministrativeData.CreatedByUser);
					} else {
						fnStartEditing(oEditAndSiblingInfo, false);
					}
				});
			}

			// This method is called when the user wants to edit an entity, for which a non-locking draft of another user exists.
			// The method asks the user, whether he wants to continue editing anyway. If this is the case editing is triggered.
			// sCreatedByUser is the name of the user possessing the non-locking draft
			fnExpiredLockDialog = function (sCreatedByUser) {
				var oUnsavedChangesDialog;
				oTemplateUtils.oCommonUtils.getDialogFragmentAsync(
					"sap.suite.ui.generic.template.ObjectPage.view.fragments.UnsavedChangesDialog", {
						onEdit: function () {
							oUnsavedChangesDialog.close();
							fnEditEntity(true);
						},
						onCancel: function () {
							oUnsavedChangesDialog.close();
						}
					}, "Dialog").then(function (oFragment) {
					oUnsavedChangesDialog = oFragment;
					// always access i18n text from the Main Object page level
					var oDraftLockTextPromise = oTemplateUtils.oComponentUtils.getMainComponentUtils();
					var oBusyHelper = oTemplateUtils.oServices.oApplication.getBusyHelper();
					oBusyHelper.setBusy(oDraftLockTextPromise);
					oDraftLockTextPromise.then(function (oMainUtils) {
						var sDialogContentText = oMainUtils.getText("DRAFT_LOCK_EXPIRED", [sCreatedByUser]);
						var oDialogModel = oUnsavedChangesDialog.getModel("Dialog");
						oDialogModel.setProperty("/unsavedChangesQuestion", sDialogContentText);
						oUnsavedChangesDialog.open();
					});
				});
			};

			function getSelectionVariant() {
				// oTemplateUtils, oController
				// if there is no selection we pass an empty one with the important escaping of ", passing "" or
				// null...was not possible
				// "{\"SelectionVariantID\":\"\"}";
				var sResult = "{\"SelectionVariantID\":\"\"}";

				/*
				 * rules don't follow 1:1 association, only header entity type fields don't send fields with empty
				 * values also send not visible fields remove Ux fields (e.g. UxFcBankStatementDate) send all kinds of
				 * types String, Boolean, ... but stringify all types
				 */

				var oComponent = oController.getOwnerComponent();
				var sEntitySet = oComponent.getEntitySet();
				var model = oComponent.getModel();
				var oMetaModel = model.getMetaModel();
				var oEntitySet = oMetaModel.getODataEntitySet(sEntitySet);
				var oEntityType = oMetaModel.getODataEntityType(oEntitySet.entityType);
				var aAllFieldsMetaModel = oEntityType.property;

				//collect the names of attributes to be deleted
				//objects with existing sap:field-control -> mapped to com.sap.vocabularies.Common.v1.FieldControl attribute
				//e.g. ProductForEdit_fc field control fields shouldn't be transferred
				var aFieldsToBeIgnored = [];
				for (var x in aAllFieldsMetaModel) {
					var oEntityProperty = aAllFieldsMetaModel[x];
					var sFieldControl = oEntityProperty["com.sap.vocabularies.Common.v1.FieldControl"] && oEntityProperty["com.sap.vocabularies.Common.v1.FieldControl"].Path;
					if (sFieldControl && aFieldsToBeIgnored.indexOf(sFieldControl) < 0) {
						aFieldsToBeIgnored.push(sFieldControl);
					}
				}

				var context = oController.getView().getBindingContext();
				var object = context.getObject();

				var oSelectionVariant = new SelectionVariant();
				for (var i in aAllFieldsMetaModel) {
					var type = aAllFieldsMetaModel[i].type;
					var name = aAllFieldsMetaModel[i].name;
					var value = object[aAllFieldsMetaModel[i].name];

					if (aFieldsToBeIgnored.indexOf(name) > -1) {
						continue;
					}

					if (name && (value || type === "Edm.Boolean")) { // also if boolean is false this must be sent
						if (type === "Edm.Time" && value.ms !== undefined) { // in case of Time an object is returned
							value = value.ms;
						}
						if (value instanceof Date) {
							value = value.toJSON();
						}
						if (typeof value !== "string") {
							try {
								value = value.toString();
							} catch (e) {
								value = value + "";
							}
						}
						oSelectionVariant.addParameter(name, value);
					}
				}

				sResult = oSelectionVariant.toJSONString();
				return sResult;
			}

			function fnIsEntryDeletable(oContext, oSmartTable) {
				var bDeletable = true;
				var oModel = oSmartTable.getModel();
				//Since the introduction of the property "placeToolbarinTable", the hierarchy of toolbar is changed. To adjust this property the below condition is added
				oSmartTable = oSmartTable instanceof ResponsiveTable ? oSmartTable.getParent() : oSmartTable;
				var oDeleteRestrictions = oTemplateUtils.oCommonUtils.getDeleteRestrictions(oSmartTable);
				var sDeletablePath = oDeleteRestrictions && oDeleteRestrictions.Deletable && oDeleteRestrictions.Deletable.Path;
				if (sDeletablePath) {
					bDeletable = oModel.getProperty(sDeletablePath, oContext);
				}
				return bDeletable;
			}

			var fnTableDeleteConfirmationOnDelete;
			/**
			 * Return an instance of the DeleteConfirmation fragment
			 *
			 * @param {sap.ui.comp.smarttable.SmartTable} oSmartTable - smart table object
			 * @param {array} aContexts - array of selected items in the table
			 * @param {string} sUiElementId - id of table
			 * @returns {sap.m.Dialog} The Delete Confirmation Dialog
			 * @private
			 */
			function getTableDeleteDialog(oSmartTable, aContexts, sUiElementId) {
				var aPath = [];
				fnTableDeleteConfirmationOnDelete = function (oEvent) {
					var oBusyHelper = oTemplateUtils.oServices.oApplication.getBusyHelper();
					var oDialog = oEvent.getSource().getParent();
					aPath = [];
					var iSuccessfullyDeletedCount;
					var iFailedToDeleteCount;
					var oEntity = oController.getView().getModel().getObject(aContexts[0].getPath());
					for (var i = 0; i < aContexts.length; i++) {
						// check if item is deletable
						if (fnIsEntryDeletable(aContexts[i], oSmartTable)) {
							aPath.push(aContexts[i].getPath());
						}
					}
					var oDeletePromise = oTemplateUtils.oServices.oCRUDManager.deleteEntities({
						pathes: aPath,
						suppressRefreshAllComponents: true,
						smartTable: oSmartTable
					});
					oBusyHelper.setBusy(oDeletePromise);
					oTemplateUtils.oServices.oApplicationController.executeSideEffects(oSmartTable.getBindingContext(), [], [oSmartTable.getTableBindingPath()]);
					oDeletePromise.then(function (aFailedPath) {
						if (oEntity.IsActiveEntity === false) {
							iFailedToDeleteCount = 0;
						} else {
							iFailedToDeleteCount = aFailedPath.length;
						}
						iSuccessfullyDeletedCount = aPath.length - iFailedToDeleteCount;
						var sMessage = "";
						if (iSuccessfullyDeletedCount > 0) {
							var oInnerTable = oSmartTable.getTable();
							if (controlHelper.isUiTable(oInnerTable)) {
								//The UI table uses indices for selection.
								//When an index is removed(record deletion), another row gets the selected index and stays selected.
								//Since the selection is not affected when an item is removed from the binding, the selection has to be cleared explicitly.
								var oSelectionPlugin = oInnerTable.getPlugin("sap.ui.table.plugins.SelectionPlugin");
								if (oSelectionPlugin) {
									oSelectionPlugin.clearSelection();
								}
							}
							//CASE: Records have been deleted successfully
							if (iSuccessfullyDeletedCount > 1) {
								//CASE: Multiple records successfully deleted
								sMessage = oTemplateUtils.oCommonUtils.getContextText("DELETE_SUCCESS_PLURAL_WITH_COUNT", oSmartTable.getId(), null, [iSuccessfullyDeletedCount]);
							} else if (iFailedToDeleteCount > 0) {
								//CASE: One record successfully deleted with some records failed to delete
								sMessage = oTemplateUtils.oCommonUtils.getContextText("DELETE_SUCCESS_WITH_COUNT", oSmartTable.getId(), null, [iSuccessfullyDeletedCount]);
							} else {
								//CASE: Only one record was selected for delete & operation completed successfully
								sMessage = oTemplateUtils.oCommonUtils.getContextText("ITEM_DELETED", oSmartTable.getId());
							}
						}

						if (iFailedToDeleteCount > 0) {
							if (iFailedToDeleteCount > 1) {
								//CASE: Failed to delete multiple records
								sMessage += sMessage && sMessage + "\n";
								sMessage += oTemplateUtils.oCommonUtils.getContextText("DELETE_ERROR_PLURAL_WITH_COUNT", oSmartTable.getId(), null, [iFailedToDeleteCount]);
							} else if (iSuccessfullyDeletedCount > 0) {
								//CASE: There is record failed for delete but some records got deleted succefully
								sMessage += "\n";
								sMessage += oTemplateUtils.oCommonUtils.getContextText("DELETE_ERROR_WITH_COUNT", oSmartTable.getId(), null, [iFailedToDeleteCount]);
							} else {
								//CASE: Only one record was selected for delete & operation failed to execute
								sMessage += oTemplateUtils.oCommonUtils.getContextText("DELETE_ERROR", oSmartTable.getId());
							}
						}

						if (sMessage) {
							if (iFailedToDeleteCount > 0) {
								//CASE: Error messages are show more prominent
								// For multiple delete line items, show only generic message and suppress transient message
								var bShowGenericDeleteError = !oTemplateUtils.oComponentUtils.isDraftEnabled() && aPath.length !== 1;
								if (bShowGenericDeleteError) {
									oTemplateUtils.oServices.oApplication.removeTransientMessages();
									MessageBox.error(sMessage);
								}
							} else {
								//CASE: Only success message and shown as a Message Toast
								MessageUtils.showSuccessMessageIfRequired(sMessage, oTemplateUtils.oServices);
							}
						}
					});

					// This object will be consumed by Application Developer via attachAfterLineItemDelete extension API
					var oAfterLineItemDeleteProperties = {
						deleteEntitiesPromise: oDeletePromise,
						sUiElementId: sUiElementId,
						aContexts: aContexts
					};
					oTemplateUtils.oComponentUtils.fire(oController, "AfterLineItemDelete", oAfterLineItemDeleteProperties);
					oDialog.close();
				};

				return oTemplateUtils.oCommonUtils.getDialogFragmentAsync("sap.suite.ui.generic.template.ObjectPage.view.fragments.TableDeleteConfirmation", {
					onCancel: function (oEvent) {
						var oDialog = oEvent.getSource().getParent();
						oDialog.close();
					},
					// to be called within a function to asure that fnTableDeleteConfirmationOnDelete contains correct coding (see above function getObjectPageDeleteDialog)
					onDelete: function (oEvent) {
						fnTableDeleteConfirmationOnDelete(oEvent);
					}
				}, "delete", Function.prototype, true);
			}

			function fnDeleteEntries(oButton) {
				var oSmartTable = oTemplateUtils.oCommonUtils.getOwnerControl(oButton); //returns a sap.m.table
				if (!controlHelper.isSmartTable(oSmartTable)) {
					oSmartTable = oSmartTable.getParent();
				}
				var aContexts = oTemplateUtils.oServices.oPresentationControlHandlerFactory.getPresentationControlHandler(oSmartTable).getSelectedContexts();
				var sUiElementId = oButton.getParent().getParent().getId();
				fnDeleteEntriesImpl(oSmartTable, aContexts, sUiElementId);
			}

			function fnDeleteEntriesImpl(oSmartTable, aContexts, sUiElementId) {
				if (aContexts.length === 0) {
					MessageBox.error(oTemplateUtils.oCommonUtils.getText("ST_GENERIC_NO_ITEM_SELECTED"), {
						styleClass: oTemplateUtils.oCommonUtils.getContentDensityClass()
					});
					return;
				}

				var aPath = [];
				var sTableMode;
				var aNonDeletableContext = [];
				if ("getMode" in oSmartTable.getTable()) {
					sTableMode = oSmartTable.getTable().getMode();
				}
				for (var i = 0; i < aContexts.length; i++) {
					// check if item is deletable
					if (fnIsEntryDeletable(aContexts[i], oSmartTable)) {
						aPath.push(aContexts[i].getPath());
					} else {
						aNonDeletableContext.push(aContexts[i]);
					}
				}

				var oDialogParameter = {};
				oDialogParameter.undeletableCount = 0;
				oDialogParameter.tableMode = sTableMode;
				if (aContexts.length > 1) {
					oDialogParameter.title = oTemplateUtils.oCommonUtils.getText("ST_GENERIC_DELETE_TITLE_WITH_COUNT", [aContexts.length]);
					oDialogParameter.text = oTemplateUtils.oCommonUtils.getContextText("DELETE_SELECTED_ITEMS", oSmartTable.getId());

				} else {
					oDialogParameter.title = oTemplateUtils.oCommonUtils.getText("ST_GENERIC_DELETE_TITLE");
					oDialogParameter.text = oTemplateUtils.oCommonEventHandlers.getSelectedItemContextForDeleteMessage(oSmartTable, aContexts[0], true);
				}

				if (aNonDeletableContext.length > 0) {
					oDialogParameter.undeletableText = oTemplateUtils.oCommonUtils.getContextText("DELETE_UNDELETABLE_ITEMS", oSmartTable.getId(), null,
						[aNonDeletableContext.length, aContexts.length]);
					if (sTableMode === 'Delete') {
						oDialogParameter.undeletableCount = aNonDeletableContext.length;
						oDialogParameter.undeletableText = undefined;
						oDialogParameter.text = oTemplateUtils.oCommonUtils.getText("DELETE_UNDELETABLE_ITEM");
					}
				}

				var oBeforeLineItemDeleteProperties = {
					sUiElementId: sUiElementId,
					aContexts: aContexts
				};
				// ensure to have a Promise (even if extension returns sth. different)
				var oBeforeLineItemDeleteExtensionPromise = Promise.resolve(oController.beforeLineItemDeleteExtension(oBeforeLineItemDeleteProperties));
				oBeforeLineItemDeleteExtensionPromise.then(function (oExtensionResult) {
						extend(oDialogParameter, oExtensionResult);
						// get Delete Confirmation Popup fragment
						getTableDeleteDialog(oSmartTable, aContexts, sUiElementId).then(function (oDialog) {
							if (!aNonDeletableContext.length) {
								oDialogParameter.undeletableText = undefined;
							}
							var oDeleteDialogModel = oDialog.getModel("delete");
							oDeleteDialogModel.setData(oDialogParameter);
							oDialog.open();
						});
					},
					/*
					 * In case the Promise returned from extension is rejected, don't show a popup and don't execute
					 * deletion. If extension needs an asynchronous step (e.g. backend request) to determine special text
					 * that could fail, it should use securedExecution. Then error messages from backend are shown by
					 * busyHelper automatically.
					 */
					Function.prototype);
			}

			function getImageDialog() {
				var oImageDialog = oController.byId("imageDialog");
				var oImageDialogPromise = oImageDialog ? Promise.resolve(oImageDialog) : oTemplateUtils.oCommonUtils.getDialogFragmentAsync(
					"sap.suite.ui.generic.template.ObjectPage.view.fragments.ImageDialog", {
						onImageDialogClose: function () {
							oImageDialog.close();
						}
					}, "headerImage");
				oImageDialogPromise.then(function (oDialog) {
					oImageDialog = oDialog;
				});
				return oImageDialogPromise;
			}

			function fnAttachDynamicHeaderStateChangeHandler() {
				var oTemplatePrivateModel = oTemplateUtils.oComponentUtils.getTemplatePrivateModel();
				oTemplatePrivateModel.setProperty("/objectPage/isHeaderExpanded", true);

				var oObjectPageDynamicHeaderTitle = oController.byId("template::ObjectPage::ObjectPageHeader");
				oObjectPageDynamicHeaderTitle.attachStateChange(function (oEvent) {
					var bExpanded = oEvent.getParameter("isExpanded");
					oTemplatePrivateModel.setProperty("/objectPage/isHeaderExpanded", bExpanded);
				});
			}

			// This function will be called in onInit. It ensures that the /objectPage/headerInfo/ segment of the template private model will be updated.
			// Note that this segment was added in onInit defined in ComponentBase in sap.suite.ui.generic.template.detailTemplates.detailUtils.
			// according to the content of the corresponding customData.
			// Note that there is a special logic which ensures a fallback title which is derived from i18n-properties will	be used in createMode when no title can be derived from the OData model.
			// This fallback does not apply, when the title is a constant anyway.
			function fnEnsureTitleTransfer() {
				var sDefaultObjectTitleForCreated; // initialized on demand
				var oTemplatePrivateModel = oTemplateUtils.oComponentUtils.getTemplatePrivateModel();
				var fnCreateChangeHandlerForTitle = function (sKey) { // This function produces the change handler which will be added to the binding of the customData for key sKey.
					return function (oEvent) { // the change handler which will be applied to the property binding
						var oBinding = oEvent.getSource();
						var sValue = oBinding.getExternalValue();
						sValue = whitespaceReplacer(sValue);
						oTemplatePrivateModel.setProperty("/objectPage/headerInfo/" + sKey, sValue);
						if (sKey === "objectTitle") {
							oTemplateUtils.oComponentUtils.setText(sValue);
							if (!sValue) { // If no value for the title can be derived from the binding we have to check whether we are in create mode
								var oHeaderDataAvailablePromise = oTemplateUtils.oComponentUtils.getHeaderDataAvailablePromise();
								oHeaderDataAvailablePromise.then(function (oContext) { // evaluation must be postponed, until property createMode in the ui model has been set accordingly
									sValue = oBinding.getExternalValue();
									if (sValue) {
										return; // If meanwhile a value has been determined, ignore this asynchronous call
									}
									var oView = oController.getView();
									var oObject = oContext.getObject();
									var oUiModel = oView.getModel("ui");
									var bCreateMode = oUiModel.getProperty("/createMode");
									if (bCreateMode && oObject && (oObject.IsActiveEntity === undefined || oObject.IsActiveEntity === false || oObject.HasActiveEntity === false)) {
										sDefaultObjectTitleForCreated = sDefaultObjectTitleForCreated || oTemplateUtils.oCommonUtils.getText("NEW_OBJECT");
										oTemplatePrivateModel.setProperty("/objectPage/headerInfo/objectTitle", sDefaultObjectTitleForCreated);
										oTemplateUtils.oComponentUtils.setText(sDefaultObjectTitleForCreated);
									}
								});
							}
						}
					};
				};
				// Loop over customData and attach changeHandler (if necesary)
				oObjectPage.getCustomData().forEach(function (oCustomDataElement) {
					var sKey = oCustomDataElement.getKey();
					if (sKey === "objectTitle" || sKey === "objectSubtitle") { // check for the two properties handled in the headerInfo segment
						var oBinding = oCustomDataElement.getBinding("value");
						// UI5 does not gurantee the binding to be already available at this point in time.
						// If the binding is not available, we access the binding info as a fallback
						var oBindingInfo = !oBinding && oCustomDataElement.getBindingInfo("value");
						if (!oBinding && !oBindingInfo) { // constant -> No change handler needed, but the value must be transfered to the template private model once
							oTemplatePrivateModel.setProperty("/objectPage/headerInfo/" + sKey, oCustomDataElement.getValue());
							return; // done
						}
						var fnChangeHandler = fnCreateChangeHandlerForTitle(sKey); // Now we have the change handler
						// Moreover, the internal type of the binding must be changed from "any" (default for the value-property of the CustomData) to "string"
						if (oBinding) { // If the binding is already available we attach the change handler to the binding
							oBinding.attachChange(fnChangeHandler);
							fnSetPropertyBindingInternalType(oBinding, "string");
						} else { // otherwise the binding info will be enhanced accordingly -> binding will already be created with the corresponding change-handler
							oBindingInfo.events = {
								change: fnChangeHandler
							};
							for (var i = 0; i < oBindingInfo.parts.length; i++) {
								oBindingInfo.parts[i].targetType = "string";
							}
						}
					}
				});
			}

			function onBreadCrumbUrlPressed(oEvent) {
				oEvent.preventDefault();
				var oLinkId = oEvent.getSource().getId();
				var oInfoObject = oTemplateUtils.oInfoObjectHandler.getControlInformation(oLinkId);
				if (oInfoObject) { // link not ready
					if (oTemplateUtils.oComponentUtils.isDraftEnabled()) {
						oInfoObject.navigate();
					} else {
						oTemplateUtils.oCommonUtils.fnProcessDataLossOrDraftDiscardConfirmation(oInfoObject.navigate, Function.prototype);
					}
				}
			}

			/* End of functions dealing with subsections (in particular lazy loading and refreshing of subsections) */
			function fnGetVisibleControls(aControls) {
				var aVisibleControls = [];
				for (var i = 0; i < aControls.length; i++) {
					if (aControls[i].getVisible()) {
						aVisibleControls.push(aControls[i]);
					}
				}
				return aVisibleControls;
			}

			/**
			 *
			 * @param {Object} oSection - Optional
			 * If oSection is provided then it returns true, if that section has only one subsection.
			 * If oSection is not provided then it returns true, if OP has only one section with one subsection.
			 */
			function fnIsSingleSectionOrSubsectionVisible(oSection) {
				var aAvailableControls = oSection ? oSection.getSubSections() : oObjectPage.getSections();
				var aVisibleControls = fnGetVisibleControls(aAvailableControls);
				return aVisibleControls.length === 1 && !!(oSection || fnIsSingleSectionOrSubsectionVisible(aVisibleControls[0]));
			}

			/**
			 * For UI tables the smart table is kept within the grid layout of ObjectPageSubSection hence we iterate to
			 * find the exact layout type.
			 * If Grid layout is found, apply/remove sGridExpandClass style based on bSetFitContainer value.
			 * If ObjectPageSubSection layout is found, apply/remove sFitContainerClass style and
			 * set fit container of smartTable based on bSetFitContainer value and break the loop.
			 * @param {object} oSmartTable - instance of smart table
			 * @param {boolean} bSetFitContainer
			 */
			function fnHandleUITableExpand(oSmartTable, bSetFitContainer) {
				var oParent = oSmartTable.getParent();
				var sGridExpandClass = "sapSmartTemplatesObjectPageSubSectionGridExpand",
					sFitContainerClass = "sapUxAPObjectPageSubSectionFitContainer",
					sStyleClassAction = bSetFitContainer ? "addStyleClass" : "removeStyleClass";
				while (oParent) {
					if (controlHelper.isGrid(oParent)) {
						oParent[sStyleClassAction](sGridExpandClass);
					} else if (controlHelper.isObjectPageSubSection(oParent)) {
						oParent[sStyleClassAction](sFitContainerClass);
						oSmartTable.setFitContainer(bSetFitContainer);
						// when ObjectPageSubSection found exit loop and function returns
						return null;
					} else {
						oLogger.warning("Unexpected parent " + oParent.toString() + " in fnHandleUiTableExpand method");
					}
					oParent = oParent.getParent();
				}
			}

			/**
			 * Function "fnSetSizeCondensedCssClass" add/remove condensed class.
			 * If "bCondensedTableLayout" or "bSetFitContainer" is false, or table already has condensed class then simply return.
			 * If "bSetFitContainer" is true and compact class is set on body then add condensed class, else remove condensed class.
			 * @param {Object} oTableInfoObject - info. about table
			 * @param {Object} oTable - sap.ui.table instance
			 */
			function fnSetSizeCondensedCssClass(oTableInfoObject, oTable) {
				var sCompactClass = "sapUiSizeCompact",
					sCondensedClass = "sapUiSizeCondensed",
					oBody;
				oBody = document.body;
				if (!oTableInfoObject.bCondensedTableLayout || !(oTableInfoObject.bSetFitContainer || oTable.hasStyleClass("sapUiSizeCondensed"))) {
					return null;
				} else if (oTableInfoObject.bSetFitContainer && oBody.classList.contains(sCompactClass)) {
					oTable.addStyleClass(sCondensedClass);
				} else {
					oTable.removeStyleClass(sCondensedClass);
				}
			}

			function fnSetGrowingThresholdAndCondensedCssClass(oSmartTable, oTable, oTableInfoObject) {
				if (oTable.isA("sap.m.Table")) {
					oTable.setGrowingThreshold(oTableInfoObject.growingThreshold);
					oTable.setGrowingScrollToLoad(oTableInfoObject.bGrowingScrollOnLoad);
				} else if (oTable.isA("sap.ui.table.Table")) {
					fnHandleUITableExpand(oSmartTable, oTableInfoObject.bSetFitContainer);
					fnSetSizeCondensedCssClass(oTableInfoObject, oTable);
				}
			}

			function fnApplyTableThresholdValueAndCssClass(oSmartTable, oTable, sCurrentFacet) {
				var oTableInfoObject = {
					growingThreshold: mTableThresholdInfo[oTable.getId()],
					bSetFitContainer: false,
					bGrowingScrollOnLoad: false

				};
				// Adding condensedClass as a styleClass to sap.ui.table
				var oObjectPageSettings = oController.getOwnerComponent().mProperties;
				oTableInfoObject.bCondensedTableLayout = oObjectPageSettings.condensedTableLayout;
				if (oObjectPageSettings && oObjectPageSettings.sections) {
					var oSection = oObjectPageSettings.sections[sCurrentFacet];
					if (oSection && oSection.hasOwnProperty("condensedTableLayout")) {
						oTableInfoObject.bCondensedTableLayout = oSection.condensedTableLayout;
					}
				}
				var oParent;
				if (oObjectPage.getUseIconTabBar()) {
					oParent = oTable.getParent();
					while (oParent && oParent.sParentAggregationName !== "sections") {
						oParent = oParent.getParent();
					}
				}
				// Setting growing threshold to 25 in case of responsive table and 1 section
				if (fnIsSingleSectionOrSubsectionVisible(oParent)) {
					oTableInfoObject.growingThreshold = DEFAULT_GROWING_THRESHOLD;
					oTableInfoObject.bGrowingScrollOnLoad = true;
					oTableInfoObject.bSetFitContainer = true;
				}
				fnSetGrowingThresholdAndCondensedCssClass(oSmartTable, oTable, oTableInfoObject);
			}

			/**
			 * Function for handling the navigation of sections using shortcut
			 * @param {Boolean} bForward - direction of switching of the tabs forward or backward
			 */
			function fnOnSwitchTabs(bForward) {
				// filterout the header section and invisible section
				var aSections = oObjectPage.getSections().filter(function (oSection) {
					return (oSection.getTitle() === "Header" || !oSection._bInternalVisible) ? false : true;
				});
				var oNextSection;
				for (var i = 0; i < aSections.length; i++) {
					var oSwitchingItem = aSections[i];
					var sSwitchingItemKey = oSwitchingItem.getId();
					var sCurrentKey = oObjectPage.getSelectedSection();
					if (sSwitchingItemKey === sCurrentKey) {
						// based on the direction, select the next section
						oNextSection = (bForward) ? aSections[(i + 1 === aSections.length) ? 0 : i + 1] : aSections[(i === 0) ? aSections.length - 1 : i - 1];
						var sSectionId = oNextSection.getId();
						oObjectPage.setSelectedSection(sSectionId);
						fnSectionChanged(sSectionId);
						break;
					}
				}
			}

			//Method should be called with oEvent parameter in case of Facet navigation (click event by user)
			//Priority is always given to oEvent in case passed and the section is derived out from the oEvent.
			//ObjectPageLayout.getSelectedSection method will not return the newly selected section in case of click
			//but oEvent object would contain named parameter section which will be set as selected section.
			//ObjectPageLayout.getSelectedSection is used as fallback only in cases where oEvent is not passed
			function fnGetSelectedSectionInfo(oEvent) {
				var oSelectedSection = oEvent && oEvent.getParameter("section");
				var sNewSectionId = oSelectedSection ? oSelectedSection.getId() : oObjectPage.getSelectedSection();
				var oSelectedSubSection = oEvent && oEvent.getParameter("subSection");
				var sNewSubSectionId = oSelectedSubSection && oSelectedSubSection.getId();
				if (sNewSectionId !== sSectionId || sNewSubSectionId !== sSelectedSubSectionId) {
					oLogger.info("Selected Section: " + sNewSectionId + " and SubSection: " + sNewSectionId);
				}
				return {
					sNewSectionId: sNewSectionId,
					sNewSubSectionId: sNewSubSectionId
				};
			}

			/**
			 * Handles whenever selected section is changed
			 */
			function fnSectionChanged(sNewSectionId, sNewSubSectioId) {
				sSectionId = sNewSectionId;
				sSelectedSubSectionId = sNewSubSectioId; //when a section changes, subsection value must be overwritten
				oTemplateUtils.oComponentUtils.stateChanged();
			}

			function fnSectionChangedEvent(oEvent) {
				var oSelectedSectionInfo = fnGetSelectedSectionInfo(oEvent);
				fnSectionChanged(oSelectedSectionInfo.sNewSectionId, oSelectedSectionInfo.sNewSubSectionId);
			}
			
			function fnFocusOnFirstActionButton(){
				setTimeout(function(){
					var oObjectHeader = oObjectPage.getHeaderTitle();
					var aActions = oObjectHeader.getActions();
					var oActionButton = aActions.find(function(oAction){
						// Ignore controls which do not have an enabled property. They may be InvisibleTexts
						return oAction.getVisible() && oAction.getEnabled && oAction.getEnabled();
					});
					if (oActionButton){
						controlHelper.focusControl(oActionButton.getId()); 
					}
				}, 0);
			}
			
			// Returns a Promise which either resolves to an editable control within the given SmartField which that can be used for focussing or vDefault (in case such a control cannot be found). 
			function fnFocusSmartFieldForInput(oSmartField, vDefault){
				return oSmartField._innerControlsRendered.then(function(){
					var oFirstFocusableInput = oSmartField.getEditable() && getFirstEditableInput(oSmartField.getDomRef());
					var oInput = oFirstFocusableInput && oFirstFocusableInput.type !== "checkbox" && controlHelper.getUI5ControlForDomElement(oFirstFocusableInput);
					return oInput || vDefault;
				});				
			}
			
			// Returns the first editable UI5 control.
			// bFocusAtTop determines whether the search should start at the first subsection of the page or at the currently selected subsection.
			// Note that this call also moves the selected section and subsection to the identified control.
			function getFirstFocussableInput(bFocusAtTop){
				var sSelectedSection = !bFocusAtTop && oObjectPage.getSelectedSection();
				var oSelectedSection = sSelectedSection && sap.ui.getCore().byId(sSelectedSection);
				var oFallbackSection = oSelectedSection && oSelectedSection.getVisible() && oSelectedSection;
				var sSelectedSubSection, oFallbackSubSection;
				if (oFallbackSection){
					sSelectedSubSection = oSelectedSection.getSelectedSubSection();
					oFallbackSubSection = sSelectedSubSection && sap.ui.getCore().byId(sSelectedSubSection);
					oFallbackSubSection = oFallbackSubSection && oFallbackSubSection.getVisible() && oFallbackSubSection;
					sSelectedSubSection = oFallbackSubSection && sSelectedSubSection;
				} else {
					sSelectedSection = null;
				}
				// Search for a suitable control with a depth first search
				var oRet = controlHelper.searchInTree(oObjectPage, function(oControl){
					if (controlHelper.isObjectPageSection(oControl)){
						if (sSelectedSection === oControl.getId()){
							sSelectedSection = null;
						}
						if (sSelectedSection){ // sSelectedSection was not yet processed, but we want to get only sections that come after that  
							return false;
						}
						oSelectedSection = oControl;
						oObjectPage.setSelectedSection(oSelectedSection);
						return null;
					}
					if (controlHelper.isObjectPageSubSection(oControl)){
						if (sSelectedSubSection === oControl.getId()){
							sSelectedSubSection = null;
						}
						if (sSelectedSubSection){ // sSelectedSubSection was not yet processed, but we want to get only subsections that come after that
							return false;
						}
						// Scroll to thwe given subsection and make sure that controls and bindings for this subsection are initialized (necessary because of lazy loading) 
						oSelectedSection.setSelectedSubSection(oControl);
						fnSubSectionEntered(oControl);
						// Maybe we can already make the decision on the subsection level
						var oSubSectionDomRef = oControl.getDomRef();
						var oFirstFocusableInput = getFirstEditableInput(oSubSectionDomRef);
						if (oFirstFocusableInput && oFirstFocusableInput.type !== "checkbox"){
							var oUI5Control = controlHelper.getUI5ControlForDomElement(oFirstFocusableInput);
							if (!oUI5Control){
								return null;
							}
							var oSmartField;
							var bIsVisible = controlHelper.isElementVisibleOnView(oUI5Control.getId(), oController.getView(), function(oParent){
								if (controlHelper.isSmartField(oParent)){
									oSmartField = oParent;
								}
							});
							if (!bIsVisible){
								return null;
							}
							return oSmartField ? fnFocusSmartFieldForInput(oSmartField, null) : oUI5Control;
						}
						return null;
					}
					if (controlHelper.isSmartField(oControl)){ // check whether the SmartField is the correct target for focussing
						return fnFocusSmartFieldForInput(oControl, false);
					}
					return null;
				});
				return Promise.resolve(oRet).then(function(oTargetControl){
					if (!oTargetControl){ // If no target control can be found, at least try to revert the section/subsection change
						if (oFallbackSection){
							oObjectPage.setSelectedSection(oFallbackSection);
							if (oFallbackSubSection){
								oFallbackSection.setSelectedSubSection(oFallbackSubSection);
							}
						} else {
							fnScrollObjectPageToTop(oObjectPage);
						}
					}
					return oTargetControl;
				}); // Normalize the return value such that it always is a Promise
			}
			
			function fnFocusForEdit(bFocusAtTop){
				setTimeout(function(){
					var oFirstFocussableInputPromise = getFirstFocussableInput(bFocusAtTop);
					oFirstFocussableInputPromise.then(function(oFirstFocussableInput){
						controlHelper.focusUI5Control(oFirstFocussableInput);
					});
				}, 0);
			}

			/* Begin: Functions dealing with the search field on tables */

			// a search field in one of the tables is used to trigger a search.
			function onSearchObjectPage(oEvent) {
				var sControlId = oEvent.getSource().getId();
				oTemplateUtils.oInfoObjectHandler.pushCategory(sControlId, "searchField");
				var oSmartTableInfoObject = oTemplateUtils.oInfoObjectHandler.getControlInformation(sControlId);
				oSmartTableInfoObject.rebindTable();
			}

			// Callback function used in the implementation of fnClearSearchField. This function clears one search field.
			function fnClearSearchField(oSmartTableInfoObject) {
				oSmartTableInfoObject.getControlAsync().then(function() {
					var oSearchField = oController.byId(oSmartTableInfoObject.getSearchFieldId());
					if (oSearchField) {
						oSearchField.setValue("");
						oSmartTableInfoObject.rebindTable();
					}
				});
			}

			// set back the content of all search fields
			function fnClearSearchFields() {
				oTemplateUtils.oInfoObjectHandler.executeForAllInformationObjects("searchField", fnClearSearchField, true);
			}

			/* End: Functions dealing with the search field on tables */

			//Calls addEntry method for Inline create and handles response
			function addEntryForInlineCreate(oEventSource, oSmartTable) {
				oTemplateUtils.oCommonEventHandlers.addEntry(oEventSource, true);
			}

			function addEntryImpl(oPredefinedValues, oButton) {
				var oGetDefaultValuesPromise = oTemplateUtils.oServices.oCRUDManager.getDefaultValues(oButton, oPredefinedValues);
				if (oGetDefaultValuesPromise instanceof Promise) {
					var fnGetPredefinedValues = function (aResponse) {
						callAddEntryImpl(aResponse[0], oButton);
					};
					oGetDefaultValuesPromise.then(fnGetPredefinedValues, fnGetPredefinedValues);
				} else {
					callAddEntryImpl(oPredefinedValues, oButton);
				}
			}

			function callAddEntryImpl(oPredefinedValues, oButton) {
				var oTable = oTemplateUtils.oCommonUtils.getOwnerControl(oButton);
				var oSmartTable = controlHelper.isMTable(oTable) ? oTable.getParent() : oTable;
				if (!oButton.data("CrossNavigation")){
					var bSuppressNavigation = fnIsSmartTableWithInlineCreate(oSmartTable);
					if (bSuppressNavigation) {
						addEntryForInlineCreate(oButton, oSmartTable);
						return;
					} else if (oTemplateUtils.oComponentUtils.isDraftEnabled()) {
						oTemplateUtils.oCommonEventHandlers.addEntry(oButton, false);
						return;
					}
				}
				oTemplateUtils.oCommonUtils.fnProcessDataLossOrDraftDiscardConfirmation(function () {
					oTemplateUtils.oCommonEventHandlers.addEntry(oButton, false, undefined, oPredefinedValues);
				}, Function.prototype, "LeaveApp");
			}

			function fnAddEntry(sFacetId) {
				var sIdForAddButton = StableIdHelper.getStableId({
					type: "ObjectPageAction",
					subType: "Create",
					sFacet: sFacetId
				});
				oTemplateUtils.oCommonUtils.executeIfControlReady(function (oCreateButton) {
					var sIdForCreateWithDialog = StableIdHelper.getStableId({
						type: "ObjectPageAction",
						subType: "CreateWithDialog",
						sFacet: sFacetId
					});

					var oCreationDialog = sIdForCreateWithDialog && oController.byId(sIdForCreateWithDialog);
					var oSmartTable = oTemplateUtils.oCommonUtils.getOwnerControl(oCreateButton);
					var bIsInlineCreationRowsEnabled = fnIsInlineCreationRowsEnabled(oSmartTable);

					if (oCreationDialog) {
						oCreateWithDialogHandler.createWithDialog(oCreationDialog, oCreateButton);
					} else if (bIsInlineCreationRowsEnabled && controlHelper.isUiTable(oSmartTable.getTable())) {
						//If the table type is "GridTable" and inline-creation-rows feature enabled, 
						//Scroll down to display the last persisted row when "Create" button is clicked
						oState.oInlineCreationRowsHelper.scrollToLastPersistedRecord(oSmartTable.getTable());
					} else {
						addEntryImpl(null, oCreateButton);
					}
				}, sIdForAddButton);
			}

			// This function is called by the DataStateIndicator plugin for each message that is considered to
			// belong to this table.
			// It returns a boolean value that indicates whether the message should be shown in the message strip belonging to the table.
			// This is the case exactly if the object page is in edit mode.
			// Note that the table (and the DataStateIndicator) are stored in mTablesWithMessagesToDataStateIndicators.
			// This is done to ensure that the corresponding DataStateIndicator can be refreshed via the logic implemented in fnRegisterForEditableChange
			// when the edit/display mode is changing
			function fnDataStateFilter(oMessage, oTable) {
				var bRet = oState.oMessageStripHelper.dataStateFilter(oMessage, oTable);
				oLogger.info("Filtering message " + oMessage.getMessage() + " (id: " + oMessage.getId() + ") for table " + oTable.getId() + " returns " + bRet);
				return bRet;
			}
			
			function fnDataStateClose(oEvent){
				oState.oMessageStripHelper.onClose(oEvent);
			}

			// This function is called in onInit. It ensures that all necessary actions are taken care of when edit mode changes.
			// This is currently to ensure that all DataStateIndicators which have been registered in mTablesWithMessagesToDataStateIndicators are triggered to refresh.
			function fnRegisterForEditableChange() {
				var oUIModel = oController.getOwnerComponent().getModel("ui");
				oUIModel.bindProperty("/editable").attachChange(function () {
					var mLastTablesWithMessages = mTablesWithMessagesToDataStateIndicators;
					mTablesWithMessagesToDataStateIndicators = Object.create(null); // Start with a new registration list. Refresh will ensure that it will be filled again correctly.
					for (var sKey in mLastTablesWithMessages) {
						var oDataStateIndicator = mLastTablesWithMessages[sKey];
						oDataStateIndicator.refresh();
					}
				});
			}
			
			function onDataReceivedForTable(oControl) {
				setNoDataTextIfRequired(oControl);
			}

			function onSwitchDraftAndActiveObjectPopOverImpl(oToggleButton) {
				var oSheet;
				return oTemplateUtils.oCommonUtils.getDialogFragmentAsync("sap.suite.ui.generic.template.ObjectPage.view.fragments.SwitchDraftAndActiveObjectPopOver", {
					onEditAndActiveToggle: function (oEvent, bHasDraftEntity) {
						var sSelectedKey = oEvent.getParameter("item").getProperty("key");
						if (sSelectedKey === (bHasDraftEntity ? "SwitchToActive" : "SwitchToDraft")) {
							return;
						}
						oTemplateUtils.oServices.oApplication.performAfterSideEffectExecution(function () {
							// Focus should stay on the toggle button, but the sheet should be closed
							oTemplateUtils.oServices.oApplication.setNextFocus(function(){
								controlHelper.focusUI5Control(oToggleButton);
								oSheet.close();
							});
							var oBusyHelper = oTemplateUtils.oServices.oApplication.getBusyHelper();
							oBusyHelper.setBusy(oTemplateUtils.oServices.oApplication.getSwitchToSiblingFunctionPromise(bHasDraftEntity).then(function(fnSwitch){
								fnSwitch();
							}));
						}, true);
					}
				}, "SwitchDraftAndActiveObjectPopOver", Function.prototype, true).then(function(oControl){
					oSheet = oControl;
					return oControl;
				});
			}

			// sets the no data text for the given table.
			// For multi-view tables there is a special no data text. Otherwise it depends whether the data are restricted by any filter or search condition.
			// Not that custom filter conditions added by the application are not considered.
			function setNoDataTextIfRequired(oSmartTable) {
				var sTextId, sSmartTableId = oSmartTable.getId(); // the ids to determine the text via CommonUtils.getContextText
				var bIsSegmentedButton = oMultipleViewsHandler.isSmartControlMulti(oSmartTable);
				if (bIsSegmentedButton) {
					sTextId = "NOITEMS_SMARTTABLE_WITH_FILTER_FOR_SEGMENTEDBUTTON";
				} else { // check whether any filters or search conditions have been applied
					var oSmartTableVariant = oSmartTable.fetchVariant();
					var bHasFiltersOrSearches = oSmartTableVariant && oSmartTableVariant.filter && oSmartTableVariant.filter.filterItems.length > 0;
					if (!bHasFiltersOrSearches){ // if there are no filters there can still be a search
						var oSmartTableInfoObject = oTemplateUtils.oInfoObjectHandler.getControlInformation(sSmartTableId);
						var sSearchFieldId = oSmartTableInfoObject.getSearchFieldId();
						var oSearchField = sSearchFieldId && oController.byId(sSearchFieldId);
						bHasFiltersOrSearches = oSearchField && oSearchField.getValue().trim();
					}
					sTextId = bHasFiltersOrSearches ? "NOITEMS_SMARTTABLE_WITH_FILTER" : "NOITEMS_SMARTTABLE";
				}	
				var sNoDataText = oTemplateUtils.oCommonUtils.getContextText(sTextId, sSmartTableId);
				oSmartTable.setNoData(sNoDataText);
			}

			// Begin: Filling the viewProxy with functions provided for the TemplateComponent to be called on the view

			oViewProxy.refreshFacets = function (mRefreshInfos) {
				var fnRefreshSubSection = function (oSubSection) {
					var oSubSectionInfoObject = oTemplateUtils.oInfoObjectHandler.getControlInformation(oSubSection.getId());
					if (oSubSectionInfoObject) { // In case editableHeaderContent is enabled in manifest, There will be a HeaderFacet in edit mode for SubSectionInfo is not created. This just needs to be skipped 
						oSubSectionInfoObject.refresh(mRefreshInfos, false);
					}
				};
				oObjectPage.getSections().forEach(function (oSection) {
					oSection.getSubSections().forEach(fnRefreshSubSection);
				});
			};

			oViewProxy.onComponentActivate = function(sBindingPath, bIsComponentCurrentlyActive){
				oBase.onComponentActivate(sBindingPath, bIsComponentCurrentlyActive);
				mTablesWithSelectionChangeDuringDraftEdit = Object.create(null);
			};

			oViewProxy.getCurrentState = function () {
				var oRet = Object.create(null);
				var bPageOrPagination = oTemplateUtils.oServices.oApplication.getStatePreservationMode() === "persistence";

				function fnFormatStateObject(oData) {
					return {
						data: oData,
						lifecycle: {
							permanent: true,
							pagination: bPageOrPagination,
							page: false,
							session: true
						}
					};
				}
				// In persistence mode store information, which section is currently selected
				if (sSectionId) {
					oRet.section = fnFormatStateObject(sSectionId);
				}

				if (sSelectedSubSectionId) {
					oRet.subSection = fnFormatStateObject(sSelectedSubSectionId);
				}

				//For Table and Chart starts
				var mSmartControls = {};
				oTemplateUtils.oInfoObjectHandler.executeForAllInformationObjects("smartControl", function (oSmartControlInfoObject) {
					mSmartControls[oSmartControlInfoObject.getId()] = oSmartControlInfoObject.getControlStateWrapper().getState();
				});
				if (!isEmptyObject(mSmartControls)) {
					oRet.smartControls = fnFormatStateObject(mSmartControls);
				}
				//Ends

				var oSideContent = oSideContentHandler.getCurrentState();
				if (oSideContent) {
					oRet.sideContent = fnFormatStateObject(oSideContent); // add information about side content
				}

				var oMultipleViews = oMultipleViewsHandler.getCurrentState();
				if (oMultipleViews) {
					oRet.multipleViews = fnFormatStateObject(oMultipleViews); // add information about multipleviews
				}

				oRet.objectPageLayout = fnFormatStateObject(oObjectPageLayoutWrapper.getState());

				// Now store state from application extensions
				var oCustomState = Object.create(null);
				oController.provideCustomStateExtension(oCustomState);
				for (var sCustomKey in oCustomState) {
					oRet["$custom$" + sCustomKey] = oCustomState[sCustomKey];
				}
				// Now store state from adaptation extensions
				var bIsAllowed = true; // check for synchronous calls
				var fnSetExtensionStateData = function (oControllerExtension, oExtensionState) {
					if (!(oControllerExtension instanceof ControllerExtension)) {
						throw new FeError(sClassName, "State must always be set with respect to a ControllerExtension");
					}
					if (!bIsAllowed) {
						throw new FeError(sClassName, "State must always be provided synchronously");
					}
					var sExtensionId = oControllerExtension.getMetadata().getNamespace(); // extension is identified by its namespace
					if (oExtensionState) {
						for (var sExtensionKey in oExtensionState) {
							oRet["$extension$" + sExtensionId + "$" + sExtensionKey] = oExtensionState[sExtensionKey];
						}
					}
				};
				oController.templateBaseExtension.provideExtensionStateData(fnSetExtensionStateData);
				bIsAllowed = false;

				return oRet;
			};

			function resetWaitForState() {
				oWaitForState = {
					bLayoutFinished: false,
					bStateApplied: false,
					bRebindCompleted: false
				};
				bWaitForViewPort = true;
			}

			function setWaitForState(sPropName) {
				oWaitForState[sPropName] = true;
				fnHandleStateChangeForAllSubSections();
			}

			function checkGlobalWaitState(oStrategy) {
				var allGlobalStateSet = true;
				for (var sProperty in oStrategy.waitFor) {
					if (oStrategy.waitFor[sProperty] && !oWaitForState[sProperty]) {
						allGlobalStateSet = false;
						break;
					}
				}
				return allGlobalStateSet;
			}
			// This methods deals with the state change, on which loading of any object page subsection depends.
			// If all the states are set, for which subsection is waiting, it will activate the sub section.
			function fnHandleStateChangeForAllSubSections() {
				var sCategory = bWaitForViewPort ? "subSectionNotWaitingForViewPort" : "subSection";
				var oView = oController.getView();
				oTemplateUtils.oInfoObjectHandler.executeForAllInformationObjects(sCategory, function (oSubSectionInfoObj) {
					// Checking whether a subSection Entered into view port or not is something local state compared to global state. Thus it is tested seperate to
					// to global state
					var bExecuteNow = (bWaitForViewPort || controlHelper.isElementVisibleOnView(oSubSectionInfoObj.getId(), oView)) && checkGlobalWaitState(oSubSectionInfoObj.getLoadingStrategy());
					// Checking whether a subSection Entered into view port or not is something local state compared to global state. Thus it is tested seperate to
					// to global state
					var oStrategy = oSubSectionInfoObj.getLoadingStrategy();
					bExecuteNow = checkGlobalWaitState(oStrategy);
					if (bExecuteNow) {
						oSubSectionInfoObj.getControlAsync().then(function(oSubSection) {
							oStrategy.activeHandler(oSubSection, oSubSectionInfoObj);
						});
					}
				});
				// trigger visibility change event for currently visible subsection so that they can update themselves
				// if they are waiting for any state change.
				if (bWaitForViewPort) {
					oObjectPage._triggerVisibleSubSectionsEvents();
				}
			}
			// Helper functions for applyState that are called when this has finished to set the layout
			function resolveStateApplied() {
				if (fnInitialStateAppliedResolve) {
					fnInitialStateAppliedResolve(); // trigger whatever has been waiting for the state to be applied
					fnInitialStateAppliedResolve = null; // ensure, that a new Promise is created when component is rebound
					setWaitForState("bStateApplied");
				}
			}

			function fnLayoutFinished() {
				setWaitForState("bLayoutFinished");
			}

			function fnScrollUp() {
				fnScrollObjectPageToTop(oObjectPage);
				fnLayoutFinished();
			}

			function fnSubSectionEntered(oSubSection) {
				var oSubSectionInfoObj = oTemplateUtils.oInfoObjectHandler.setInformationWithControl(oSubSection); // Assigning the SubSection control to Info Object, in case it is assigned infoObject is returned without doing anything
				// Check if initialization code is executed for the SubSection. If not initialize the same
				var sSubSectionId = oSubSection.getId();
				if (!mSubSectionsInitState[sSubSectionId]) {
					// Execute Application specific logic which needs to be executed 
					oController.onSubSectionEnteredExtension(oSubSection);
					mSubSectionsInitState[sSubSectionId] = true;
				}

				if (oSubSectionInfoObj) { // In case of EditableHeaderFacet Sections & SubSection is created at runtime and there is info object handling
					oMultipleViewsHandler.subSectionEntered(oSubSectionInfoObj); // Assigning the SubSection control MultipleViewsHandler. In case not relevant method simply returns
					var oStrategy = oSubSectionInfoObj.getLoadingStrategy();
					var bExecuteNow = checkGlobalWaitState(oStrategy);
					if (bExecuteNow) {
						oStrategy.activeHandler(oSubSection, oSubSectionInfoObj);
					}
				}
			}

			function fnSmartFieldModelValueChanged(oEvent) {
				var aFieldGroupIds;
				var oSmartField = oEvent.getSource();
				var sSideEffectCustomData = oSmartField.getCustomData().find(function (oCustomData) {
					return oCustomData.getKey() === "SideEffectSourcePropertyType";
				}).getValue();
				
				switch (sSideEffectCustomData) {
					case "OnlySingleSource":
						var aInnerControls = oSmartField.getInnerControls();
						aFieldGroupIds = aInnerControls && aInnerControls[0] && aInnerControls[0].getFieldGroupIds();
						if (aFieldGroupIds) {
							oSmartField.triggerValidateFieldGroup(aFieldGroupIds);
						}
						break;
					case "SingleAndMultipleSource":
						oSmartField._getComputedMetadata().then(function (oComputedMetaData) {
							if (oComputedMetaData) {
								var oSideEffect;
								var oClonedMetaData = deepExtend({}, oComputedMetaData);
								for (var sEntityAttributeKey in oComputedMetaData.entityType) {
									if (sEntityAttributeKey.startsWith("com.sap.vocabularies.Common.v1.SideEffects")) {
										oSideEffect = oComputedMetaData.entityType[sEntityAttributeKey];
										// since only the side effect which has the given smartfield as the single source property should get triggered with this event, the other side effect(s)
										// where the given smartfield is used in combination with other property needs to be eliminated, in order to get only the relevant fieldGroupIds.
										if (oSideEffect.SourceProperties && oSideEffect.SourceProperties.length > 1 && metadataAnalyser.hasPropertyInSideEffect(oSideEffect, oComputedMetaData.path)) {
											delete oClonedMetaData.entityType[sEntityAttributeKey];
										}
									}
								}
								aFieldGroupIds = oSmartField._calculateFieldGroupIDs(oClonedMetaData);
								if (aFieldGroupIds) {
									oSmartField.triggerValidateFieldGroup(aFieldGroupIds);
								}
							}
						});
						break;
					default:
						break;
				}
				
			}

			oViewProxy.applyState = function (oState, bIsSameAsLast) {
				// originally, applyState was only called when HeaderData was available, as HeaderData was always used to determine bIsSameAsLast
				// now, in some cases bIsSameAsLast can be determined earlier, however, we don't know, whether any extensions implicitly rely on header data being available
				// therefore, call extensions only after oHeaderDataAvailablePromise is resolved
				var oHeaderDataAvailablePromise = oTemplateUtils.oComponentUtils.getHeaderDataAvailablePromise() || Promise.resolve();
				oHeaderDataAvailablePromise.then(function () {
					var oCustomState = Object.create(null);
					var mExtensionState = Object.create(null);
					for (var sKey in oState) {
						if (sKey.indexOf("$custom$") === 0) {
							oCustomState[sKey.substring(8)] = oState[sKey];
						} else if (sKey.indexOf("$extension$") === 0) {
							var sExtensionId = sKey.substring(11, sKey.indexOf("$", 11)); //get the extensionID from sKey
							var oExtensionState = mExtensionState[sExtensionId];
							if (!oExtensionState) {
								oExtensionState = Object.create(null);
								mExtensionState[sExtensionId] = oExtensionState;
							}
							var sExtensionKey = sKey.substring(sKey.indexOf("$", 11) + 1, sKey.length); //get the extensionKey from sKey
							oExtensionState[sExtensionKey] = oState[sKey];
						}
					}
					oController.applyCustomStateExtension(oCustomState, bIsSameAsLast);
					var bIsAllowed = true;
					var fnGetExtensionStateData = function (oControllerExtension) {
						if (!(oControllerExtension instanceof ControllerExtension)) {
							throw new FeError(sClassName, "State must always be retrieved with respect to a ControllerExtension");
						}
						if (!bIsAllowed) {
							throw new FeError(sClassName, "State must always be restored synchronously");
						}
						var sExtensionId = oControllerExtension.getMetadata().getNamespace(); // extension is identified by its namespace

						return mExtensionState[sExtensionId];
					};
					oController.templateBaseExtension.restoreExtensionStateData(fnGetExtensionStateData, bIsSameAsLast);
					bIsAllowed = false;
				});

				// restore sideContent: display of sideContent depends on browser size, and resizing could have happened between last display of object page and now
				// => therefore, state has to be applied explicitly even if we are on the some object as the last time
				oSideContentHandler.applyState(oState.sideContent, bIsSameAsLast);
				oMultipleViewsHandler.applyState(oState.multipleViews, bIsSameAsLast);

				oObjectPageLayoutWrapper.setState(oState.objectPageLayout);

				//Restore Table/Chart state(variant + uiState) starts
				oTemplateUtils.oInfoObjectHandler.executeForAllInformationObjects("smartControl", function (oSmartControlInfoObject) {
					oSmartControlInfoObject.getControlStateWrapper().setState(oState.smartControls && oState.smartControls[oSmartControlInfoObject.getId()]);
				});
				//ends

				// remaining things: clear search field (not really in appState) and scroll position (would be less exact) should not be applied, if we are on the same object as before
				// don't move other things (exactly stored in appState) here: if opening third column in FCL, then changing these in second column, and then using browser back, the (old) appState would not be applied correct
				if (bIsSameAsLast) {
					if (sSectionId !== (oState.section || "")) {
						oTemplateUtils.oComponentUtils.stateChanged();
					}
					resolveStateApplied();
					fnLayoutFinished();
					return; // rely on the fact that the state needs not to be adapted, since view is like we left it
				}

				// On object change all search fields should be cleared
				fnClearSearchFields();

				// scroll to the specified section/subsection or to top is no section is specified
				if (oState.section) {
					sSectionId = oState.section;
					oLogger.info("Restoring Selected Section: " + sSectionId);
					oObjectPage.setSelectedSection(sSectionId);
					if (oState.subSection) {
						var oSection;
						oObjectPage.getSections().some(function (oCurrentSection) {
							if (oCurrentSection.getId() === oState.section) {
								oSection = oCurrentSection;
								return true;
							}
							return false;
						});

						if (oSection) {
							oSection.setSelectedSubSection(oState.subSection);
						}

						sSelectedSubSectionId = oState.subSection;
						oLogger.info("Restoring Selected Subsection: " + sSelectedSubSectionId);
					}
					fnLayoutFinished();
				} else {
					// if no section is specified, scroll to top. In case of editable header fields, "top" depends on whether we are on a draft or an active object,
					// therefore we need to wait for HeaderDataAvailablePromise
					Promise.all([
						oHeaderDataAvailablePromise,
						oTemplateUtils.oComponentUtils.getNavigationFinishedPromise()
					]).then(fnScrollUp);
					sSectionId = "";
				}
				resolveStateApplied();
			};
			
			oViewProxy.prepareForControlNavigation = function(sTargetControlId){
				var bUseIconTabBar = oObjectPage.getUseIconTabBar();
				if (!bUseIconTabBar) {
					return;
				}
				var sTargetSubSectionId;
				var sTargetSectionId = controlHelper.isElementVisibleOnView(sTargetControlId, false, function(oAncestor){
					var bFound = controlHelper.isObjectPageSection(oAncestor);
					if (bFound){
						return oAncestor.getId();
					}
					sTargetSubSectionId = oAncestor.getId(); 
				});
				var sSelectedSectionId = sTargetSectionId && oObjectPage.getSelectedSection();
				if (sTargetSectionId !== sSelectedSectionId) {
					oObjectPage.setSelectedSection(sTargetSectionId);
					fnSectionChanged(sTargetSectionId, sTargetSubSectionId);
				}					
			};
			
			function fnPrepareForMessageNavigation(aMessages){
				var bNeedsPreparation = aMessages.some(function(oMessage){ // check whether there is at least one message which cannot be positioned on a not-table currently
					var sId = oTemplateUtils.oCommonUtils.getPositionableControlId(oMessage.controlIds, true);
					return !sId || controlHelper.isTable(controlHelper.byId(sId));
				});
				if (bNeedsPreparation){
					// disable lazy loading
					bWaitForViewPort = false;
					fnHandleStateChangeForAllSubSections();
				}
			}
			
			oViewProxy.prepareForMessageNavigation = fnPrepareForMessageNavigation;			

			// Loops over all SmartTables with dynamically hidden columns and adapts hiding the columns on the specified context
			// Moreover, ensures that the hiding columns will be adapted on any change of the context (which influences this hiding)
			oViewProxy.applyHeaderContextToSmartTablesDynamicColumnHide = function (oContext) {
				var oModel = oContext.getModel();
				// Two scenarios for calling this function:
				// 1. bFirstTimeForContext = New context has been retrieved for this page -> Derive hiding columns for the specified SmartTable
				//                           and register for all relevant updates on that context so that we call the same function with
				// 2. !bFirstTimeForContext = adapt to the change
				var fnExecuteDynamicColumnHide = function (bFirstTimeForContext, oSmartTableInfoObject) {
					var aHiddenColumnInfo = oSmartTableInfoObject.getHiddenColumnInfo();

					// if columns are hidden only statically, no need to refresh hiding here
					if (isEmptyObject(aHiddenColumnInfo.columnKeyToHiddenPath)) {
						return;
					}
					
					var aHiddenColumns = aHiddenColumnInfo.staticHiddenColumns.slice(); // start with a copy of the list of statically hidden columns
					// Now add the dynamically hidden columns if applicable
					var fnOnChange = bFirstTimeForContext && fnExecuteDynamicColumnHide.bind(null, false, oSmartTableInfoObject);
					for (var sColumnKey in aHiddenColumnInfo.columnKeyToHiddenPath) {
						var sPath = aHiddenColumnInfo.columnKeyToHiddenPath[sColumnKey];
						if (oContext.getProperty(sPath)) {
							aHiddenColumns.push(sColumnKey);
						}
						if (fnOnChange) {
							var oPropertyBinding = oModel.bindProperty(sPath, oContext);
							oPropertyBinding.attachChange(fnOnChange);
						}
					}

					oSmartTableInfoObject.getControlAsync().then(function(oSmartTable) {
						oSmartTable.deactivateColumns(aHiddenColumns); // Note: This will replace the set of hidden columns defined last time
					});
				};
				oTemplateUtils.oInfoObjectHandler.executeForAllInformationObjects("smartTableWithColumnHide", fnExecuteDynamicColumnHide.bind(null, true));
			};

			// End: Filling the viewProxy with functions provided for the TemplateComponent to be called on the view.
			// Note that one last member is added to the viewProxy in onInit, since it is only available at this point in time.

			// Expose selected private functions to unit tests
			/* eslint-disable */
			var fnEditEntity = testableHelper.testable(fnEditEntity, "editEntity");
			var fnIsEntryDeletable = testableHelper.testable(fnIsEntryDeletable, "isEntryDeletable");
			var onActivateImpl = testableHelper.testable(onActivateImpl, "onActivateImpl");
			var onSaveImpl = testableHelper.testable(onSaveImpl, "onSaveImpl");
			testableHelper.testable(function () {
				return oTemplateUtils.initialStateAppliedPromise;
			}, "getStateAppliedPromise");
			/* eslint-enable */

			function fnInitializeSubSections() {
				// Initialize the information objects for each of SubSection object. Please note that
				// information objects will only be initialized based on data available from manifest & annotation
				// Control based information will be assigned only once the subsection enters view port
				var aSectionSettings = oTemplateUtils.oComponentUtils.getParameterModelForTemplating().getObject("/templateSpecific/sections");
				aSectionSettings.forEach(function (oSectionSettings) {
					oSectionSettings.subSections.forEach(oTemplateUtils.oInfoObjectHandler.initializeSubSectionInfoObject);
				});

				// Initialize the sections which are created based on the embedded component configuration
				var oTreeNode = oTemplateUtils.oComponentUtils.getParameterModelForTemplating().getObject("/treeNode");
				if (oTreeNode && oTreeNode.leadingComponents) {
					for (var sLeadingComponentKey in oTreeNode.leadingComponents) {
						var oLeadingComponent = oTreeNode.leadingComponents[sLeadingComponentKey];
						oLeadingComponent.followingComponents.forEach(fnInitializeEmbeddedComponentSubSection);
					}
				}

				//Initialize the embedded components in facets
				if (oTreeNode && oTreeNode.facetsWithEmbeddedComponents) {
					for (var sFacetId in oTreeNode.facetsWithEmbeddedComponents) {
						var aEmbeddedComponentsInFacet = oTreeNode.facetsWithEmbeddedComponents[sFacetId];
						for (var i = 0; i < aEmbeddedComponentsInFacet.length; i++) {
							var sEmbeddedComponentId = aEmbeddedComponentsInFacet[i];
							var oEmbeddedComponent = oTreeNode.embeddedComponents[sEmbeddedComponentId];
							fnInitializeEmbeddedComponentSubSection(oEmbeddedComponent);
						}
					}
				}

				function fnInitializeEmbeddedComponentSubSection(oFollowingComponent) {
					var oSubSectionSettings = {};
					oSubSectionSettings.additionalData = {};
					oSubSectionSettings.additionalData.facetId = oFollowingComponent.sectionId;
					oSubSectionSettings.id = oFollowingComponent.subSectionId;
					oSubSectionSettings.loadingStrategy = "reuseComponent";
					oTemplateUtils.oInfoObjectHandler.initializeSubSectionInfoObject(oSubSectionSettings);
				}
			}
			
			function onSelectionChange(oEvent){
				var oEventSource = oEvent.getSource();
				oTemplateUtils.oCommonUtils.setEnabledToolbarButtons(oEventSource);
				if (mTablesWithSelectionChangeDuringDraftEdit){ // will be truthy in the draft edit case
					mTablesWithSelectionChangeDuringDraftEdit[oEventSource.getId()] = true;
				}
			}

			// Generation of Event Handlers
			var oControllerImplementation = {
				onInit: function () {
					oObjectPage = oController.byId("objectPage");
					var bHeaderContent = oObjectPage.getShowHeaderContent();
					var oTemplatePrivateModel = oTemplateUtils.oComponentUtils.getTemplatePrivateModel();
					oTemplatePrivateModel.setProperty("/objectPage/headerContentVisible", bHeaderContent);
					// Create a wrapper around the objectpage
					// Use this wrapper to store/restore the pinned status of the header.
					oObjectPageLayoutWrapper = oTemplateUtils.oCommonUtils.getControlStateWrapper(oObjectPage);
					oObjectPageLayoutWrapper.attachStateChanged(oTemplateUtils.oComponentUtils.stateChanged);
					fnRegisterForEditableChange();
					var oComponent = oController.getOwnerComponent();
					// create Promise to control, whether app state has been applied
					oTemplateUtils.initialStateAppliedPromise = new Promise(function (resolve) {
						fnInitialStateAppliedResolve = resolve;
					});
					// reset Wait for state
					resetWaitForState();
					
					// Initialize the information objects for SubSections & child aggregations
					fnInitializeSubSections();

					// Create and bind breadcrumbs
					var oTitle = getObjectHeader();
					var oAppComponent = oComponent.getAppComponent();
					var bIsObjectPageDynamicHeaderTitleUsed = oAppComponent.getObjectPageHeaderType() === "Dynamic";
					oViewProxy.aBreadCrumbs = oTitle && (bIsObjectPageDynamicHeaderTitleUsed ? oTitle.getBreadcrumbs().getLinks() : oTitle.getBreadCrumbsLinks()); // If ObjectPageDynamicHeaderTitle is used then oTitle.getBreadcrumbs().getLinks() is used
					(oViewProxy.aBreadCrumbs || []).forEach(function (oLink, i) {
						oTemplateUtils.oComponentUtils.registerAncestorTitleUpdater(oLink, "text", i + 1);
					});
					if (bIsObjectPageDynamicHeaderTitleUsed) {
						fnAttachDynamicHeaderStateChangeHandler();
					}
					var oMessageSortingHandler = new MessageSortingHandler(oController, oTemplateUtils, oObjectPage);
					var getPrepareMessageDisplayPromise = function(aMessages){
						fnPrepareForMessageNavigation(aMessages);
						return Promise.resolve(oMessageSortingHandler.getMessageSorter());
					};
					var oMessageButtonHost = {
						controller: oController,
						getPrepareMessageDisplayPromise: getPrepareMessageDisplayPromise,
						getGroupTitle: oMessageSortingHandler.getGroupTitle,
						getSubtitle: oMessageSortingHandler.getSubtitle
					};					
					oBase.onInit(null, oMessageButtonHost);
					fnEnsureTitleTransfer();
					oTemplateUtils.oCommonUtils.executeGlobalSideEffect();
					
					oViewProxy.beforeRebind = function (oWaitForPromise) {
						// Reset the mSubSectionInitState map as the binding context is changed
						mSubSectionsInitState = Object.create(null);

						oMessageSortingHandler.beforeRebind();
						oState.oInlineCreationRowsHelper.onBeforeRebindObjectPage();                         
						resetWaitForState();
						oWaitForPromise.then(function () {
							setWaitForState("bRebindCompleted");
						});
						if (!fnInitialStateAppliedResolve) {
							// renew Promise to control, whether app state has been applied
							oTemplateUtils.initialStateAppliedPromise = new Promise(function (resolve) {
								fnInitialStateAppliedResolve = resolve;
							});
						}
						oTemplateUtils.oInfoObjectHandler.executeForAllInformationObjects("subSection", function (oInfoObject) {
							// Need to access the SubSection early and could not use the general mechanism of
							// oInfoObject.getControlAsync as this is resolved only after SubSection enters 
							// viewport. As the View Lazy Loading could be applied only to children of subsection, subsection
							// control should be rendered on view initialization
							var oSubSection = oController.byId(oInfoObject.getId());
							if (oSubSection) {
								oInfoObject.getLoadingStrategy().inActiveHandler(oSubSection, oInfoObject);
								return;
							}
						});
					};
		
					oViewProxy.afterRebind = function () {
						oLogger.info("Call of _triggerVisibleSubSectionsEvents (afterRebind)");
						oObjectPage._triggerVisibleSubSectionsEvents();
					};
					
					// This is the falback implementation. Note that certain scenarios are already covered inplace (Edit, Save, Cancel)
					oViewProxy.setFocus = function(oBeforeData, oAdditionalData){
						var aActiveComponentsBefore = oBeforeData.activeComponents;
						if (aActiveComponentsBefore.length > 0 && !(oAdditionalData && oAdditionalData.isCreate)){
							var sPreviousComponentId = aActiveComponentsBefore[aActiveComponentsBefore.length - 1];
							if (sPreviousComponentId === oController.getOwnerComponent().getId() || oTemplateUtils.oComponentUtils.getHierachicalDistance(sPreviousComponentId) > 0){ // pagination scenario
								var bFocusStays = oTemplateUtils.oServices.oApplication.getStatePreservationMode() === "persistence" || oTemplateUtils.oComponentUtils.getCurrentKeys().every(function(sCurrentKey, i){
									return sCurrentKey === oBeforeData.currentKeys[i];                                           
								});
								if (bFocusStays){
									var oLastFocus = oTemplateUtils.oComponentUtils.getLastFocus();
									if (oLastFocus){
										controlHelper.focusControl(oLastFocus.getId());
									}
									return;										
								}
							}
						}
						var oUiModel = oObjectPage.getModel("ui");
						var bEditable = oUiModel.getProperty("/editable");
						if (bEditable){
							fnFocusForEdit(true);	
						} else {
							fnFocusOnFirstActionButton();
						}
					};
					
					oObjectPage.attachEvent("subSectionEnteredViewPort", function (oEvent) {
						var oSubSection = oEvent.getParameter("subSection");
						oLogger.info("Viewport entered ", "Subsection: " + oSubSection.getId());
						fnSubSectionEntered(oSubSection);
					});

					oCreateWithDialogHandler = new CreateWithDialogHandler(oState, oController, oTemplateUtils);
					oState.oCreateWithDialogHandler = oCreateWithDialogHandler;
					oMultipleViewsHandler = new MultipleViewsHandler(oController, oTemplateUtils, oTemplateUtils.oComponentUtils.stateChanged);
					oState.oMultipleViewsHandler = oMultipleViewsHandler;
					oState.oInlineCreationRowsHelper = new InlineCreationRowsHelper(oObjectPage, oTemplateUtils);
					oState.oMessageStripHelper = new MessageStripHelper(oMultipleViewsHandler, oController, oTemplateUtils, oBase.state.messageButtonHelper);
			
					var oTemplatePrivateModel = oTemplateUtils.oComponentUtils.getTemplatePrivateModel();
					oTemplatePrivateModel.setProperty("/objectPage/aPasteAttachedTables", []);
					oTemplateUtils.oComponentUtils.attach(oController, "PageDataLoaded", function (oEvent) {
						var aStreamEnabledAsscoiatedEntites = oTemplateUtils.oComponentUtils.getParameterModelForTemplating().getObject("/templateSpecific/streamEnabledAssociatedEntites");
						if (aStreamEnabledAsscoiatedEntites && aStreamEnabledAsscoiatedEntites.length > 0) {
							for (var i = 0; i < aStreamEnabledAsscoiatedEntites.length; i++) {
								var oStreamData = oTemplateUtils.oCommonUtils.getStreamData(aStreamEnabledAsscoiatedEntites[i], oEvent.context);
								oTemplateUtils.oCommonUtils.setStreamData(oStreamData, aStreamEnabledAsscoiatedEntites[i]);
							}
						} 
						var oStreamDataSelf = oTemplateUtils.oCommonUtils.getStreamData(null, oEvent.context);
						oTemplateUtils.oCommonUtils.setStreamData(oStreamDataSelf);
						
						oTemplateUtils.oComponentUtils.hidePlaceholder();
					});
					var oMenuButton = oController.byId(StableIdHelper.getStableId({
						type: "ObjectPageAction",
						subType: "Share"
					}) + "-internalBtn");
					if (oMenuButton) {
						oMenuButton.attachPress(function(){
							onShareObjectPageActionButtonPressImpl(oMenuButton);
						});
					}
				},
				handlers: {
					onEditAndActiveToggle: function () {
						var oUIModel = oObjectPage.getModel("ui");
						var bIsEditable = oUIModel.getProperty("/editable");
						oTemplateUtils.oServices.oApplication.performAfterSideEffectExecution(function () {
							var oBusyHelper = oTemplateUtils.oServices.oApplication.getBusyHelper();
							oBusyHelper.setBusy(oTemplateUtils.oServices.oApplication.getSwitchToSiblingFunctionPromise(!bIsEditable).then(function(fnSwitch){
								fnSwitch();
								// as the toggling is implemented by two buttons which are made visible/invisible vice versa we have to create the id of the other button which will become visible now
								oTemplateUtils.oServices.oApplication.setNextFocus(function(){
									var sOtherButtonId = oController.createId(StableIdHelper.getStableId({
										type: "ObjectPageAction",
										subType: bIsEditable ? "ContinueEditing" : "DisplayActiveVersion"
									}));
									setTimeout(controlHelper.focusControl.bind(null, sOtherButtonId), 0);
								});
							}));
						}, true);
					},
					
					addEntry: fnAddEntry,
					
					onCancelCreateWithPopUpDialog: function () {
						oCreateWithDialogHandler.onCancelPopUpDialog();
					},
					
					onSaveCreateWithPopUpDialog: function (oEvent) {
						oCreateWithDialogHandler.onSavePopUpDialog(oEvent);
					},

					submitChangesForSmartMultiInput: function (oEvent) {
						if (oTemplateUtils.oComponentUtils.isDraftEnabled()) {
							oTemplateUtils.oCommonEventHandlers.submitChangesForSmartMultiInput(oEvent);
						}
					},
					
					contextEditableChanged: function (oEvent) {
						/* Set the FieldGroupIds of the SmartField(s) which are 1:1 associated with the object page entity set so that side effect annotation targeting
						   the object entity set would work. Assigning FieldGroupIds to other SmartFields is already taken care by the SmartFields  */
						if (oEvent.getParameter("editable")) {
							var oSmartField = oEvent.getSource();
							oSmartField._getComputedMetadata().then(function (oComputedMetaData) {
								if (oComputedMetaData && oComputedMetaData.navigationPath && !!oSmartField.getBindingContext()) {
									var oClonedMetaData = deepExtend({}, oComputedMetaData);
									var oMetaModel = oController.getOwnerComponent().getModel().getMetaModel();

									/* EntitySet and EntityType of the cloned metamodel of smartfield needs to be changed to the parent entity so that when
									   _calculateFieldGroupIDs looks through the passed metamodel, it should be able to find the corresponding side effect annotation */
									oClonedMetaData.entitySet = oMetaModel.getODataEntitySet(oController.getOwnerComponent().getEntitySet());
									oClonedMetaData.entityType = oMetaModel.getODataEntityType(oClonedMetaData.entitySet.entityType);

									var aIDs = oSmartField._calculateFieldGroupIDs(oClonedMetaData);
									if (aIDs) {
										oSmartField._setInternalFieldGroupIds(aIDs);
									}
								}
							});
						}
					},

					deleteEntry: function (oEvent) {
						var oListItem = oEvent.getParameter("listItem");
						var oListItemContext = oListItem.getBindingContext();
						var oSmartTable = oTemplateUtils.oCommonUtils.getOwnerControl(oEvent.getSource());
						if (!controlHelper.isSmartTable(oSmartTable)) {
							oSmartTable = oSmartTable.getParent();
						}
						var aContexts = [oListItemContext];
						var sUiElementId = oEvent.getSource().getId();
						fnDeleteEntriesImpl(oSmartTable, aContexts, sUiElementId);
					},

					deleteEntries: function (sFacetId) {
						var sIdForDeleteButton = StableIdHelper.getStableId({
							type: "ObjectPageAction",
							subType: "Delete",
							sFacet: sFacetId
						});
						oTemplateUtils.oCommonUtils.executeIfControlReady(fnDeleteEntries, sIdForDeleteButton);
					},

					onSelectionChange: onSelectionChange,
					
					checkUpdateFinished: function (oEvent) {
						// in case of the table get refreshed through table filter or sort 
						// onDataRecieved may not be called 
						oTemplateUtils.oCommonUtils.setEnabledToolbarButtons(oEvent.getSource());
					},
					// selectionChange for MultiSelectionPlugin
					onMultiSelectionChange: function (oEvent) {
						oTemplateUtils.oCommonEventHandlers.onMultiSelectionChange(oEvent);
					},

					//Cancel event for draft and non draft case
					onCancel: function () {
						var bIsDraftEnabled = oTemplateUtils.oComponentUtils.isDraftEnabled();
						var sCancelButtonLocalId = StableIdHelper.getStableId({
							type: "ObjectPageAction",
							subType: "CommonAction",
							sAction: bIsDraftEnabled ? "discard" : "cancel"
						});
						var oCancelButton = sap.ui.getCore().byId(oController.createId(sCancelButtonLocalId));
						var bIsEditFlowDirect = oTemplateUtils.oServices.oApplication.getEditFlowOfRoot() === "direct";
						var bStaysOnPage = !bIsEditFlowDirect && !(oObjectPage.getModel("ui").getProperty("/createMode"));
						var oCancelPromise = oBase.state.onCancel(oCancelButton, bStaysOnPage && fnFocusOnFirstActionButton);
						oCancelPromise.then(function () {
							fnDetachPasteHandlers();
							if (!bIsDraftEnabled) {
								fnReturnToDisplayNonDraft();
							} 
							if (bIsEditFlowDirect){
								oViewProxy.navigateUp();
							}
						}, Function.prototype); // to avoid console errors add an event handler for the reject case
					},

					onContactDetails: function (oEvent) {
						oTemplateUtils.oCommonEventHandlers.onContactDetails(oEvent);
					},
					onSmartFieldInitialise: function (oEvent) {
						var sViewId = this.getView().getId();
						oTemplateUtils.oCommonEventHandlers.onSmartFieldInitialise(oEvent, sViewId);
					},
					onPressDraftInfo: function (oEvent) {
						var oBindingContext = oController.getView().getBindingContext();
						var oLockButton = sap.ui.getCore().byId(
							oEvent.getSource().getId() + (oEvent.getId() === "markChangesPress" ? "-changes" : "-lock"));

						oTemplateUtils.oCommonUtils.showDraftPopover(oBindingContext, oLockButton);
					},
					onPressDraftInfoObjectPageDynamicHeaderTitle: function (oEvent) {
						var oBindingContext = oController.getView().getBindingContext();
						var oLockButton = oController.byId("template::ObjectPage::ObjectMarkerObjectPageDynamicHeaderTitle");
						oTemplateUtils.oCommonUtils.showDraftPopover(oBindingContext, oLockButton);
					},

					onSwitchDraftAndActiveObjectPopOver: function (oEvent) {
						var oSource = oEvent.getSource();
						onSwitchDraftAndActiveObjectPopOverImpl(oSource).then(function (oFragment) {
							oFragment.openBy(oSource);
						});
					},

					onShareObjectPageActionButtonPress: function (oEvent) {
						oTemplateUtils.oCommonUtils.executeIfControlReady(onShareObjectPageActionButtonPressImpl, StableIdHelper.getStableId({
							type: "ObjectPageAction",
							subType: "Share"
						}) + "-internalBtn");
					},

					onRelatedApps: function (oEvent) {
						oRelatedAppsHandler.getRelatedApps(oEvent);
					},
					onEdit: function (oEvent) {
						var oEditButton = oController.byId("edit");
						if (oEditButton.data("CrossNavigation")) {
							// intent based navigation
							oTemplateUtils.oCommonEventHandlers.onEditNavigateIntent(oEditButton);
							return;
						}
						oTemplateUtils.oCommonUtils.executeIfControlReady(fnEditEntity, "edit");
					},
					onSave: onSave,
					onSaveAndContinueEdit: onSaveAndContinueEdit,
					onSaveAndEditNext: onSaveAndEditNext,
					onBreadCrumbUrlPressed: onBreadCrumbUrlPressed,
					onDelete: onDelete,
					onCallActionFromToolBar: function (oEvent) {
						oTemplateUtils.oCommonEventHandlers.onCallActionFromToolBar(oEvent, oBase.state);
					},
					onCallAction: function (sAction, sActionId, sInvocationGrouping, bIsCopyAction) {
						oTemplateUtils.oServices.oApplication.performAfterSideEffectExecution(function () {
							var oBindingContext = oController.getView().getBindingContext();
							if (oBindingContext) {
								// dataloss popup is needed only for non-draft cases in call action
								oTemplateUtils.oServices.oDataLossHandler.performIfNoDataLoss(function () {
									var oComponent = oController.getOwnerComponent();
									var sEntitySet = oComponent.getEntitySet();
									//Skip "ResultIsActiveEntity" when the action is annotated with "IsCopyAction"
									var oSkipProperties = bIsCopyAction ? {"ResultIsActiveEntity": true} : {};
									var mParameters = {
										functionImportPath: sAction,
										contexts: [oBindingContext],
										sourceControlHandler: "",
										label: oController.byId(sActionId).getText(),
										operationGrouping: sInvocationGrouping,
										skipProperties: oSkipProperties
									};
									oTemplateUtils.oServices.oCRUDManager.callAction(mParameters).then(function (aResponses) {
										var oResponse = aResponses && aResponses[0];
										if (oResponse && oResponse.context && (!oResponse.actionContext || oResponse.actionContext && oResponse.context.getPath() !== oResponse.actionContext.getPath())) {
											// set my parent page to dirty
											oTemplateUtils.oServices.oViewDependencyHelper.setParentToDirty(oComponent, sEntitySet, 1);
										}
									});
								}, Function.prototype, "Proceed", true);
							}
						}, true);
					},
					onDataFieldForIntentBasedNavigation: function (oEvent) {
						oEvent = merge({}, oEvent);
						oTemplateUtils.oServices.oApplication.performAfterSideEffectExecution(function () {
							oTemplateUtils.oCommonUtils.fnProcessDataLossOrDraftDiscardConfirmation(function () {
								oTemplateUtils.oCommonEventHandlers.onDataFieldForIntentBasedNavigation(oEvent, oBase.state);
							}, Function.prototype, "LeaveApp");
						}, true);
					},
					onDataFieldWithIntentBasedNavigation: function (oEvent) {
						oTemplateUtils.oCommonEventHandlers.onDataFieldWithIntentBasedNavigation(oEvent, oBase.state);
					},
					onDataFieldWithNavigationPath: function (oEvent) {
						oTemplateUtils.oCommonEventHandlers.onDataFieldWithNavigationPath(oEvent);
					},
					onChartInit: function (oEvent) {
						var oSmartChart = oEvent.getSource();
						oTemplateUtils.oInfoObjectHandler.setInformationWithControl(oSmartChart);
						oSmartChart.getChartAsync().then(function (oChart) {
							// workaround for Safari browsers as described via Webkit Bug #198375
							if (Device.browser.safari) {
								oSmartChart.setHeight("50vH");
							}
							oChart.attachSelectData(onSelectionChange).attachDeselectData(onSelectionChange);
							oTemplateUtils.oCommonUtils.checkToolbarIntentsSupported(oSmartChart);
						});
					},
					onBeforeRebindDetailTable: function (oEvent) {
						var oSmartTable = oEvent.getSource();
						if (!oSmartTable.getModel()) {
							return; // In Scenarion when Table is not bound on the initial load (Ex. When table is inside moreBlocks sections)
						}
						// Attach dataRecieved event
						oEvent.mParameters.bindingParams.events["dataReceived"] = onDataReceivedForTable.bind(null, oSmartTable);
						oState.oInlineCreationRowsHelper.onBeforeRebindControl(oEvent);
						
						// Set data loading text when data is loading
						oSmartTable.setNoData(oTemplateUtils.oCommonUtils.getText("WAITING_SMARTTABLE"));
						var oBindingParams = adjustAndProvideBindingParamsForSmartTableOrChart(oEvent);
						// add the content of the search field to the search if necessary
						var oSmartTableInfoObject = oTemplateUtils.oInfoObjectHandler.getControlInformation(oSmartTable.getId());
						var sSearchFieldId = oSmartTableInfoObject.getSearchFieldId();
						if (sSearchFieldId) { // note that in this case the info object for the search field surely exists
							var oSearchField = oController.byId(sSearchFieldId);
							var sSearchString = (oSearchField && oSearchField.getValue() || "");
							if (sSearchString) {
								oBindingParams.parameters.custom = {
									search: sSearchString
								};
							}
						}

						oTemplateUtils.oCommonEventHandlers.onBeforeRebindTable(oEvent, {
							ensureExtensionFields: oController.templateBaseExtension.ensureFieldsForSelect,
							addExtensionFilters: oController.templateBaseExtension.addFilters,
							isFieldControlRequired: true,
							isPopinWithoutHeader: true,
							isDataFieldForActionRequired: true,
							isFieldControlsPathRequired: true,
							isMandatoryFiltersRequired: true
						});
						oController.onBeforeRebindTableExtension(oEvent);
						var fnRefresh = oBindingParams.events.refresh || Function.prototype;
						oBindingParams.events.refresh = function(oRefreshEvent){
							var sSmartTableId = oSmartTable.getId();
							oLogger.info("Data requested (SmartTable: " + sSmartTableId + ")");
							oMultipleViewsHandler.onDataRequested(sSmartTableId);
							fnRefresh.call(this, oRefreshEvent);
						};
						var fnDataReceived = oBindingParams.events.dataReceived || Function.prototype;
						oBindingParams.events.dataReceived = function(oReceivedEvent){
							oTemplateUtils.oCommonEventHandlers.onDataReceived(oSmartTable);
							fnDataReceived.call(this, oReceivedEvent);
						};
						oMultipleViewsHandler.onRebindContentControl(oSmartTable.getId(), oBindingParams);
						fnAdaptBindingParamsForInlineCreate(oEvent);
						oState.oMessageStripHelper.onBeforeRebindControl(oEvent);
						if (controlHelper.isAnalyticalTable(oSmartTable.getTable())) {
							oBindingParams.parameters.entitySet = oSmartTable.getEntitySet();
						}
					},
					onListNavigate: function (oEvent) {
						oTemplateUtils.oCommonEventHandlers.onListNavigate(oEvent, oBase.state);
					},
					onBeforeSemanticObjectLinkPopoverOpens: function (oEvent) {
						var sSelectionVariant = getSelectionVariant();
						oTemplateUtils.oCommonUtils.semanticObjectLinkNavigation(oEvent, sSelectionVariant, oController, oState);
					},

					onBeforeSemanticObjectLinkNavigationCallback: function (oNavigationInfo) {
						return oTemplateUtils.oCommonEventHandlers.onBeforeSemanticObjectLinkNavigationCallback(oNavigationInfo);
					},

					onSemanticObjectLinkNavigationPressed: function (oEvent) {
						var oEventParameters = oEvent.getParameters();
						var oEventSource = oEvent.getSource();
						oTemplateUtils.oCommonEventHandlers.onSemanticObjectLinkNavigationPressed(oEventSource, oEventParameters);
					},

					onSemanticObjectLinkNavigationTargetObtained: function (oEvent) {
						var oEventParameters = oEvent.getParameters();
						var oEventSource = oEvent.getSource(); //set on semanticObjectController
						oTemplateUtils.oCommonEventHandlers.onSemanticObjectLinkNavigationTargetObtained(oEventSource.getEntitySet(), oEventSource.getFieldSemanticObjectMap(), oEventParameters, oBase.state);
					},
					onSemanticObjectLinkNavigationTargetObtainedSmartLink: function (oEvent) {
						var oEventParameters, oEventSource;
						oEventParameters = oEvent.getParameters();
						oEventSource = oEvent.getSource(); //set on smart link
						// set on smart table
						while (oEventSource.getMetadata().getName() !== "sap.ui.comp.smarttable.SmartTable" && oEventSource.getParent()) {
							oEventSource = oEventSource.getParent();
						}
						oTemplateUtils.oCommonEventHandlers.onSemanticObjectLinkNavigationTargetObtained(oEventSource.getEntitySet(), {}, oEventParameters, oBase.state);
					},
					onHeaderImagePress: function (oEvent) {
						if (oEvent.getSource().getSrc() === "") {
							return;
						}
						var sId = oEvent.getSource().getId();
						var sSource = oEvent.getSource().getSrc();
						getImageDialog().then(function (oImageDialog) {
							if (oImageDialog.getAriaLabelledBy() && oImageDialog.getAriaLabelledBy().indexOf(sId) === -1) {
								// No aria labelled by information for the dialog. Add it once.
								oImageDialog.addAriaLabelledBy(sId);
							}
							var oImageDialogModel = oImageDialog.getModel("headerImage");
							oImageDialogModel.setProperty("/src", sSource);
							if (sap.ui.Device.system.phone) {
								oImageDialog.setProperty("stretch", true);
							}
							oImageDialog.open();
						});
					},
					sectionChange: fnSectionChangedEvent,
					onSwitchTabs: fnOnSwitchTabs,
					uploadStream: function(oEvent) {
						oTemplateUtils.oCommonEventHandlers.uploadStream(oEvent);	
					},

					handleUploadComplete: function(oEvent) {
						oTemplateUtils.oCommonEventHandlers.handleUploadComplete(oEvent);
					},

					removeStream: function(oEvent) {
						oTemplateUtils.oCommonEventHandlers.removeStream(oEvent);
					},

					onInlineDataFieldForAction: function (oEvent) {
						oTemplateUtils.oCommonEventHandlers.onInlineDataFieldForAction(oEvent);
					},
					onInlineDataFieldForIntentBasedNavigation: function (oEvent) {
						oTemplateUtils.oCommonEventHandlers.onInlineDataFieldForIntentBasedNavigation(oEvent.getSource(), oBase.state);
					},
					onDeterminingDataFieldForAction: function (oEvent) {
						oTemplateUtils.oCommonEventHandlers.onDeterminingDataFieldForAction(oEvent);
					},
					onBeforeRebindChart: function (oEvent) {
						var oSmartChart = oEvent.getSource();
						if (!oSmartChart.getModel()) {
							return; // In Scenarion when Chart is not bound on the initial load (Ex. When chart is inside moreBlocks sections)
						}
						adjustAndProvideBindingParamsForSmartTableOrChart(oEvent);
						//setNoDataChartTextIfRequired(oSmartChart);
						oSmartChart.getChartAsync().then(function (oChart) {
							oSmartChart.oModels = oChart.oPropagatedProperties.oModels;
						});
						var oCallbacks = {
							ensureExtensionFields: Function.prototype, // needs further clarification
							addExtensionFilters: oController.templateBaseExtension.addFilters,
							isFieldControlRequired: true,
							isMandatoryFiltersRequired: true
						};
						oTemplateUtils.oCommonUtils.onBeforeRebindTableOrChart(oEvent, oCallbacks);
					},
					// forward handlers for side content related events to SideContentHandler
					onToggleDynamicSideContent: oSideContentHandler.onToggleDynamicSideContent,
					sideContentBreakpointChanged: oSideContentHandler.sideContentBreakpointChanged,

					onTableInit: function (oEvent, sCurrentFacet) {
						var oSmartTable = oEvent.getSource();
						var oTable = oSmartTable.getTable();
						var oInfoObject = oTemplateUtils.oInfoObjectHandler.setInformationWithControl(oSmartTable);
						// TableObserver is required to get the Smart Table's editable property for Smart 
						// MultiInput Control
						var oModel = new ManagedObjectModel(oSmartTable);
						oSmartTable.setModel(oModel, "tableobserver");
						oState.oMessageStripHelper.initSmartTable(oSmartTable, sCurrentFacet);

						var aHiddenColumnInfo = oInfoObject.getHiddenColumnInfo();
						if (aHiddenColumnInfo && aHiddenColumnInfo.staticHiddenColumns && aHiddenColumnInfo.staticHiddenColumns.length > 0) {
							// Hide all columns which are statically hidden at initialization of the table
							oSmartTable.deactivateColumns(aHiddenColumnInfo.staticHiddenColumns);
						}
						
						oTemplateUtils.oCommonUtils.checkToolbarIntentsSupported(oSmartTable);
						var bIsMTable = controlHelper.isMTable(oTable);
						if (bIsMTable || controlHelper.isUiTable(oTable)) {
							var sTableId = oTable.getId(); 
							var fnOnSubSectionVisibilityChanged = function () {
								if (bIsMTable && !mTableThresholdInfo[sTableId]) {
									mTableThresholdInfo[sTableId] = oTable.getGrowingThreshold && oTable.getGrowingThreshold(); // store the default growingthreshold value of the table
								}
								fnApplyTableThresholdValueAndCssClass(oSmartTable, oTable, sCurrentFacet);
							};
							// this event gets fired when the visibility of any subsection changes or incase of Icon tab bar mode when a different tab is selected
							oObjectPage.attachEvent("subSectionVisibilityChange", fnOnSubSectionVisibilityChanged);
							// By the time table is initialized, the subSectionVisibilityChange event may have already been triggered.
							// We ensure that the table occupies whole space whenever applicable by calling this method on table init.
							// Subsequently, this method is called every time the subsection visibility is changed.
							fnOnSubSectionVisibilityChanged();							
						}
						if (fnIsSmartTableWithInlineCreate(oSmartTable) && !oSmartTable.data("CrossNavigation")) {
							oTable.addEventDelegate({
								// CTRL + ENTER Shortcut to add an entry for tables with inline support.
								onkeyup: function (oEvent) {
									if (oEvent.ctrlKey && oEvent.keyCode === KeyCodes.ENTER && oSmartTable.getEditable()) {
										addEntryForInlineCreate(oSmartTable, oSmartTable);
										oEvent.preventDefault();
										oEvent.setMarked();
									}
								}
							});
						}

						var oTemplatePrivateModel = oTemplateUtils.oComponentUtils.getTemplatePrivateModel();
						if (fnIsSmartTableWithInlineCreate(oSmartTable) || fnIsInlineCreationRowsEnabled(oSmartTable)) {
							oTable.addEventDelegate({
								//Attach paste handlers for tables in edit mode
								onAfterRendering: function (oEvent) {
									var aPasteAttachedTables;
									if (oSmartTable.getEditable() && !oSmartTable.hasListeners("paste")) {
										oSmartTable.attachBeforePaste(fnOnBeforeSmartTablePaste);
										oSmartTable.attachPaste(fnOnSmartTablePaste);
										aPasteAttachedTables = oTemplatePrivateModel.getProperty("/objectPage/aPasteAttachedTables");
										if (aPasteAttachedTables) {
											aPasteAttachedTables.push(sCurrentFacet);
										}
									}
								}
							});
						}
					},
					onSearchObjectPage: onSearchObjectPage,
					onSmartTablePaste: fnOnSmartTablePaste,
					onUITableExpand: fnHandleUITableExpand,
					onSingleSectionOrSubsectionVisible: fnIsSingleSectionOrSubsectionVisible,
					dataStateFilter: fnDataStateFilter,
					dataStateClose: fnDataStateClose,
					onSmartFieldModelValueChanged: fnSmartFieldModelValueChanged
				},
				formatters: {
					sideContentActionButtonText: oSideContentHandler.formatSideContentActionButtonText,

					setNoDataTextForSmartTable: function (sSmartTableId) {
						if (oTemplateUtils.oCommonUtils && sSmartTableId) {
							var sNoDataText = oTemplateUtils.oCommonUtils.getContextText("WAITING_SMARTTABLE", sSmartTableId);
							if (sNoDataText !== "WAITING_SMARTTABLE") {
								return sNoDataText;
							}
							return "";
						}
					},

					setVMVisibilityForVendor: function () {
						var oUriParameters = new UriParameters(window.location.href);
						if (oUriParameters.mParams["sap-ui-layer"]) {
							var aUiLayer = oUriParameters.mParams["sap-ui-layer"];
							for (var i = 0; i < aUiLayer.length; i++) {
								if (aUiLayer[i].toUpperCase() === "VENDOR") {
									return true;
								}
							}
						}
						return false;
					},

					/*
						Formats the Text to be shown in the segmented button used for multple views in object page tables
					*/
					formatItemTextForMultipleView: function (oItem) {
						return oItem && oMultipleViewsHandler ? oMultipleViewsHandler.formatItemTextForMultipleView(oItem) : "";
					}
				},
				extensionAPI: new ExtensionAPI(oTemplateUtils, oController, oBase, oState)
			};

			oControllerImplementation.handlers = extend(oBase.handlers, oControllerImplementation.handlers);

			return oControllerImplementation;
		}
	};
	return oMethods;
});
