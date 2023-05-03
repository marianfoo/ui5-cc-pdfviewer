sap.ui.define([	"sap/suite/ui/generic/template/genericUtilities/FeLogger", "sap/ui/core/UIComponent", "sap/ui/core/routing/HashChanger", "sap/ui/model/Filter", "sap/ui/model/FilterOperator", "sap/suite/ui/generic/template/genericUtilities/controlHelper",
	"sap/suite/ui/generic/template/extensionAPI/NavigationController", "sap/suite/ui/generic/template/lib/MessageButtonHelper", "sap/suite/ui/generic/template/genericUtilities/testableHelper",
	"sap/suite/ui/generic/template/detailTemplates/DiscardEditHandler", "sap/suite/ui/generic/template/detailTemplates/PaginatorButtonsHelper",
	"sap/suite/ui/generic/template/ObjectPage/extensionAPI/DraftTransactionController", "sap/suite/ui/generic/template/ObjectPage/extensionAPI/NonDraftTransactionController",
	"sap/m/DraftIndicator"],
	function(FeLogger, UIComponent, HashChanger, Filter, FilterOperator, controlHelper, NavigationController, MessageButtonHelper, testableHelper, DiscardEditHandler, PaginatorButtonsHelper, DraftTransactionController, NonDraftTransactionController) {
		"use strict";
		var oLogger = new FeLogger("detailTemplates.detailUtils").getLogger();

		var DraftIndicatorState = sap.m.DraftIndicatorState; // namespace cannot be imported by sap.ui.define

		var oPersistentFilter = new Filter({
			path: "persistent",
			operator: FilterOperator.EQ,
			value1: false
		}); // exclude all messages that are persistent for frontend (i.e. transient for backend)

		function getComponentBase(oComponent, oComponentUtils, oViewProxy){
			function init(){
				var oTemplatePrivateModel = oComponentUtils.getTemplatePrivateModel();
				oTemplatePrivateModel.setProperty("/objectPage", {
					displayMode: 0, // possible values are explained in the documentation of fnNavigateToRoute in lib.NavigationController
					headerInfo: { // contains information about title and subtitle of the page
						objectTitle: "",
						objectSubtitle: ""
					}, 
					cancelEnabled: true        // should the cancel buuton in the footer bar be enabled (only relevant if it is visible)
				});
			}

			function onActivate(sBindingPath, bIsComponentCurrentlyActive) {
				if (!oComponentUtils.isDraftEnabled()){
					var oUIModel = oComponent.getModel("ui");
					var oTemplatePrivateModel = oComponentUtils.getTemplatePrivateModel();
					var bCreateMode = oUIModel.getProperty("/createMode");
					oTemplatePrivateModel.setProperty("/objectPage/displayMode", bCreateMode ? 4 : 1);
				}
				(oViewProxy.onComponentActivate || Function.prototype)(sBindingPath, bIsComponentCurrentlyActive);
			}

			// This method is called when a new binding context has been retrieved for this Component.
			// If the entity is draft enabled this happens whenever a different instance is displayed or the edit status changes.
			// If the entity is not draft enabled this only happens when a different instance is displayed.
			// It does not happen when changing to edit mode or creating a new instance. In this case the adjustment of the JSON models is already done in onActivate.
			function updateBindingContext(oBindingContext) {
				// set draft status to blank according to UI decision
				var oTemplatePrivateGlobal = oComponent.getModel("_templPrivGlobal");
				oTemplatePrivateGlobal.setProperty("/generic/draftIndicatorState", DraftIndicatorState.Clear);
				(oViewProxy.applyHeaderContextToSmartTablesDynamicColumnHide || Function.prototype)(oBindingContext);
			}

			function fnNavigateUp(){
				oViewProxy.navigateUp();
			}

			// checks whether this view has a reason to prevent saving. If yes a message is returned
			function getMessageFilters(bOnlyValidation){
				return 	oViewProxy.getMessageFilters(bOnlyValidation);
			}

			function getScrollFunction(aControlIds){
				return oViewProxy.getScrollFunction && oViewProxy.getScrollFunction(aControlIds);
			}
			
			function getStatePreserverSettings(){
				return {
					callAlways: true
				};
			}

			return {
				init: init,
				onActivate: onActivate,
				getTitle: oComponentUtils.getTitle,
				updateBindingContext: updateBindingContext,
				navigateUp: fnNavigateUp,
				getMessageFilters: getMessageFilters,
				getScrollFunction: getScrollFunction,
				getStatePreserverSettings: getStatePreserverSettings
			};
		}

		function getControllerBase(oViewProxy, oTemplateUtils, oController){

			var oControllerBase;

			var oPaginatorButtonsHelper; // initialized in onInit, if needed

			function fnGetHashChangerInstance() {
				var oRouter = UIComponent.getRouterFor(oController);

				return oRouter ? oRouter.getHashChanger() : HashChanger.getInstance();
			}

			// this method is called, when the editablity status is changed
			function setEditable(bIsEditable) {
				var bIsNonDraft = !oTemplateUtils.oComponentUtils.isDraftEnabled();
				// Setting editable to false is done immidiately
				// Setting editable to true is (in draft case) postponed until the header data are read (method updateBindingContext).
				if (bIsNonDraft || !bIsEditable){
					var oUIModel = oController.getView().getModel("ui");
					oUIModel.setProperty("/editable", bIsEditable);
				}
			}

			function fnOnBack() {
				oTemplateUtils.oServices.oApplication.onBackButtonPressed();
			}

			function fnAdaptLinksToUpperLevels(){
				var aLinkInfos = oTemplateUtils.oServices.oApplication.getLinksToUpperLayers();
				var iViewLevel = oTemplateUtils.oComponentUtils.getViewLevel();
				var iDisplayMode;
				if (oTemplateUtils.oComponentUtils.isDraftEnabled()){
					var oTemplatePrivateModel = oTemplateUtils.oComponentUtils.getTemplatePrivateModel();
					iDisplayMode = oTemplatePrivateModel.getProperty("/objectPage/displayMode");
				} else {
					iDisplayMode = 1;
				}
				oViewProxy.navigateUp = aLinkInfos[iViewLevel - 1].navigate.bind(null, iDisplayMode, false);
				var aBreadCrumbs = oViewProxy.aBreadCrumbs;
				var iLength = aBreadCrumbs ? aBreadCrumbs.length : 0;
				for (var i = 0; i < iLength; i++){
					var oLink = aBreadCrumbs[i];
					var oLinkInfo = aLinkInfos[i + 1]; // offset 1 because aLinkInfos also contains entry for root, aBreadCrumbs not
					oLinkInfo.adaptBreadCrumbLink(oLink);
					var oLinkSettings = {
						id: oLink.getId(),
						navigate: oLinkInfo.navigate.bind(null, iDisplayMode, true)
					};
					oTemplateUtils.oInfoObjectHandler.initializeLinkInfoObject(oLinkSettings);
				}
			}

			function getApplyChangesPromise(oControl){
				var oContext = oControl.getBindingContext();
				var sHash = fnGetHashChangerInstance().getHash();
				return oTemplateUtils.oServices.oApplicationController.propertyChanged(sHash, oContext);
			}

			function fnNavigateUp(){
				oViewProxy.navigateUp();
			}

			// Event handler for the Apply button. Only visible in draft scenarios and not on the object root.
			function fnApplyAndUpImpl(oControl) {
				var oBusyHelper = oTemplateUtils.oServices.oApplication.getBusyHelper();
				var oUIModel = oController.getView().getModel("ui");
				var oApplyPromise = getApplyChangesPromise(oControl).then(function(oReponse){
					fnNavigateUp();
					//the toast is shown independent of FCL
					//the next statement should not be deleted but a comment!!
					//oTemplateUtils.oServices.oApplication.showMessageToast(oTemplateUtils.oCommonUtils.getText("ST_CHANGES_APPLIED"));
				}, function(){
					oBusyHelper.getUnbusy().then(function(oReponse){
					oTemplateUtils.oCommonUtils.processDataLossTechnicalErrorConfirmation(function() {
						fnNavigateUp();
						oUIModel.setProperty("/enabled", true); //in case you leave the page set this
						}, Function.prototype, oControllerBase.state);
					});
				});
				oBusyHelper.setBusy(oApplyPromise);
			}

			// Event handler for the Apply button. Only visible in draft scenarios and not on the object root.
			function fnApplyAndUp(oEvent) {
				var oControl = oEvent.getSource();
				var oCRUDActionHandler = oTemplateUtils.oComponentUtils.getCRUDActionHandler();
				oCRUDActionHandler.handleCRUDScenario(2, fnApplyAndUpImpl.bind(null, oControl));
			}

			var oDiscardEditHandler; // singleton, initialized on demand
			function fnCancel(oCancelButton, fnSetFocus){ // note that oCancelButton is optional
				oDiscardEditHandler = oDiscardEditHandler || new DiscardEditHandler(oController, oTemplateUtils, oViewProxy, oControllerBase.state);
				return oDiscardEditHandler.discardEdit(oCancelButton, fnSetFocus);
			}

			function onShowMessages() {
				var oBusyHelper = oTemplateUtils.oServices.oApplication.getBusyHelper();
				if (oBusyHelper.isBusy()){
					return;
				}
				oControllerBase.state.messageButtonHelper.toggleMessagePopover();
			}

			function getMessageFilters(bOnlyValidation){
				return oControllerBase.state.messageButtonHelper && oControllerBase.state.messageButtonHelper.getMessageFilters(bOnlyValidation);
			}

			function getNavigationControllerFunction(){
				var oNavigationController;
				return function(){
					oNavigationController = oNavigationController || new NavigationController(oTemplateUtils, oController, oControllerBase.state);
					return oNavigationController;
				};
			}

			function getTransactionControllerFunction() {
				var oTransactionController;
				return function(){
					if (!oTransactionController) {
						var Class = oTemplateUtils.oComponentUtils.isDraftEnabled() ? DraftTransactionController : NonDraftTransactionController;
						oTransactionController = new Class(oTemplateUtils, oController, oControllerBase.state);
					}
					return oTransactionController;
				};
			}

			function handleShowNextObject(oEvent){
				oPaginatorButtonsHelper.handleShowNextObject(oEvent);
			}
			
			function fnSwitchToNextObject(){
				oPaginatorButtonsHelper.switchToNextObject();
			}

			function handleShowPrevObject(oEvent){
				oPaginatorButtonsHelper.handleShowPrevObject(oEvent);
			}
			
			// Expose selected private functions to unit tests
			/* eslint-disable */
			var fnGetHashChangerInstance = testableHelper.testable(fnGetHashChangerInstance, "getHashChangerInstance");
			var fnAdaptLinksToUpperLevels = testableHelper.testable(fnAdaptLinksToUpperLevels, "adaptLinksToUpperLevels");
			/* eslint-enable */

			oControllerBase = {
				onInit: function(oRequiredControls, oMessageButtonHost){
					if (!oRequiredControls || oRequiredControls.footerBar){
						var bIsODataBased = oTemplateUtils.oComponentUtils.isODataBased();
						oControllerBase.state.messageButtonHelper = new MessageButtonHelper(oTemplateUtils, oMessageButtonHost || { controller: oController }, bIsODataBased);
						if (!oTemplateUtils.oComponentUtils.isDraftEnabled()){ // in the non-draft case prepare logic to remove all state messages when changing from edit to display mode (there are scenarios in which the message model will not do the job)
							var oUiModel = oController.getOwnerComponent().getModel("ui");
							var oEditableBinding = oUiModel.bindProperty("/editable");
							var oMessageManager = sap.ui.getCore().getMessageManager();
							var oMessageModel = oMessageManager.getMessageModel();
							oEditableBinding.attachChange(function(){
								if (!oEditableBinding.getValue()){
									var oContextFilter = oControllerBase.state.messageButtonHelper.getContextFilter(false);
									var oMessageBinding = oMessageModel.bindList("/", null, null, [oContextFilter, oPersistentFilter]);
									var aContexts = oMessageBinding.getContexts();
									var aMessages = aContexts.map(function(oContext){
										return oContext.getObject();
									});
									oMessageManager.removeMessages(aMessages);
								}
							});
						}
						oTemplateUtils.oServices.oTemplateCapabilities.oMessageButtonHelper = oControllerBase.state.messageButtonHelper;
						oControllerBase.state.onCancel = fnCancel;
					}
					if (!oRequiredControls || oRequiredControls.paginatorButtons){
						oPaginatorButtonsHelper = new PaginatorButtonsHelper(oControllerBase, oController, oTemplateUtils, oViewProxy);
					}
					oViewProxy.getScrollFunction = function(aControlIds){
						var sControlId = oTemplateUtils.oCommonUtils.getPositionableControlId(aControlIds);
						return sControlId && controlHelper.focusControl.bind(null, sControlId);
					};
				},
				handlers: {
					handleShowNextObject: handleShowNextObject,
					handleShowPrevObject: handleShowPrevObject,
					onShowMessages: onShowMessages,
					applyAndUp: fnApplyAndUp,
					onSave: function(){
						oLogger.error("Save for this floorplan not implemented yet"); // fallback, currently for canvas
					},
					onBack: fnOnBack
				},
				extensionAPI: {
					getNavigationControllerFunction: getNavigationControllerFunction,
					getTransactionControllerFunction: getTransactionControllerFunction
				},
				fclInfo: {
					isContainedInFCL: false
				},
				state: {},
				onComponentActivate: function(sBindingPath, bIsComponentCurrentlyActive){
					if (oControllerBase.state.messageButtonHelper){
						oControllerBase.state.messageButtonHelper.adaptToContext(sBindingPath);
					}
					fnAdaptLinksToUpperLevels();
					// set visibility of up/down buttons
					if (oPaginatorButtonsHelper){
                        oPaginatorButtonsHelper.computeAndSetVisibleParamsForNavigationBtns();
					}
				},
				utils: {
					switchToNextObject: fnSwitchToNextObject
				}
			};

			oViewProxy.navigateUp = fnNavigateUp;
			oViewProxy.setEditable = setEditable;
			oViewProxy.getMessageFilters = getMessageFilters;

			var oFclProxy = oTemplateUtils.oComponentUtils.getFclProxy();
			if (oFclProxy.oActionButtonHandlers){
				oControllerBase.handlers.fclActionButtonHandlers = oFclProxy.oActionButtonHandlers;
				oControllerBase.fclInfo.isContainedInFCL = true;
			}
			return oControllerBase;
		}

		return {
			getComponentBase: getComponentBase,
			getControllerBase: getControllerBase
		};
	});
