/**
 * This class is used for dealing with the preparation of an explicit Save operation.
 * The following scenarios are covered:
 * - Save, while still validation messages are available -> Save not allowed
 * - Apply, while still validation messages are available -> tbd
 * - Save, while warnings or (non-validation) errors are available -> Depending on configuration the user is asked, whether he wants to proceed
 *
 * Note that in FCL scenarios messages from more than one view might need to be aggregated.
 * It has options to handle the scenario when there is error coming from the backend and we still want to save in second try.
 */

 sap.ui.define(["sap/ui/base/Object", "sap/ui/model/Filter", "sap/ui/model/FilterOperator", "sap/base/util/extend", "sap/suite/ui/generic/template/lib/MessageUtils", 	"sap/ui/model/json/JSONModel"
], function(BaseObject, Filter, FilterOperator, extend, MessageUtils, JSONModel) {
	"use strict";

	// A Filter that filters for messages that are at least of severity warning
	var oAtLeastWarningFilter = new Filter({
		filters: [new Filter({
			path: "type",
			operator: FilterOperator.EQ,
			value1: sap.ui.core.MessageType.Warning
			}), new Filter({
			path: "type",
			operator: FilterOperator.EQ,
			value1: sap.ui.core.MessageType.Error
		})],
		and: false
	});
	// A Filter that filters for messages that are of severity error
	var oBaseErrorFilter = new Filter({
		path: "type",
		operator: FilterOperator.EQ,
		value1: sap.ui.core.MessageType.Error
	});

	var sLocalModelName = "model";
	function getMethods(oTemplateContract, oController, oCommonUtils) {

		var fnYes, fnNo; // global functions which should be called when the user either accepts or rejects the operation
		var oItemBinding; // initialized on demand
		var bShowConfirmationOnDraftActivate = (function(){
			var oComponent = oController.getOwnerComponent();
			var oRegistryEntry = oTemplateContract.componentRegistry[oComponent.getId()];
			return !!(oRegistryEntry.methods.showConfirmationOnDraftActivate && oRegistryEntry.methods.showConfirmationOnDraftActivate());
		})();

		// aControlIds is an array of control ids.
		// The function returns a faulty value if it is not possible to scroll to at least one of the given controls.
		// Otherwise it returns a function that would perform this scrolling.
		function getScrollFunction(aControlIds){
			var aActiveComponents = oTemplateContract.oNavigationControllerProxy.getActiveComponents();
			// Loop over all active detail pages and check whether they are able to scroll to the control
			var fnRet;
			for (var i = 0; i < aActiveComponents.length && !fnRet; i++){
				var sComponentId = aActiveComponents[i];
				var oRegistryEntry = oTemplateContract.componentRegistry[sComponentId];
				fnRet = oRegistryEntry.viewLevel && (oRegistryEntry.methods.getScrollFunction || Function.prototype)(aControlIds);
			}
			return fnRet || null;
		}

		// iSituation: 1: Validations for activate, 2: Validation for Apply, 3: Warnings before activate/delete
		// sCRUDAction: Activate, Delete, BOPFAction
		// mParameters: object having following properties:
		// 				messagesForUserDecison: Array, any messages to be shown for asking user decsion, useful in 412 warning case
		//				actionName: string, name of BOPF action, if sCRUDAction is BOPFAction.
		function getConfiguredPopoverIfNeeded(iSituation, sCRUDAction, mParameters){
			// TODO: sCRUDAction === "callAction" || sCRUDAction === "Delete"; when callAction is implemented for 412 warning case
			var aMessages = mParameters && mParameters.messagesForUserDecison;
			return new Promise(function (fnResolve) {
				var oRet, oLocalModel, oMessageView;
				oCommonUtils.getDialogFragmentAsync("sap.suite.ui.generic.template.fragments.MessageInfluencingCRUDAction", {
					onMessageSelect: function(){
						oLocalModel.setProperty("/backbtnvisibility", true);
					},
					onBackButtonPress: function(){
						oMessageView.navigateBack();
						oLocalModel.setProperty("/backbtnvisibility", false);
					},
					onAccept: function(){
						(fnYes || Function.prototype)();
						oRet.close();
					},
					onReject: function(){
						(fnNo || Function.prototype)();
						oRet.close();
					},
					isPositionable: function(aControlIds){
						return !!(aControlIds && getScrollFunction(aControlIds));
					},
					titlePressed: function(oEvent){ // the user wants to navigate from the message to the corresponding control
						oRet.close();
						var oMessageItem = oEvent.getParameter("item");
						var oMessage = oMessageItem.getBindingContext("msg").getObject();
						var fnAfterClose = getScrollFunction(oMessage.controlIds);
						(fnAfterClose || Function.prototype)();
						oRet.close();
					},
					afterClose: function(){
						fnYes = null;
						fnNo = null;
						oMessageView.navigateBack();
					}
				}, sLocalModelName, function(oFragment){
					oMessageView = oFragment.getContent()[0];
					oFragment.setModel(sap.ui.getCore().getMessageManager().getMessageModel(), "msg");
					oItemBinding = oFragment.getContent()[0].getBinding("items");
				}).then(function (oFragment) {
					oRet = oFragment;
					oLocalModel = oRet.getModel(sLocalModelName);
					
					var oMsgModel = aMessages ? new JSONModel(aMessages) : sap.ui.getCore().getMessageManager().getMessageModel();
					oFragment.setModel(oMsgModel, "msg");
					oLocalModel.setProperty("/situation", iSituation);
					oLocalModel.setProperty("/backbtnvisibility", false);

					var oOverallFilter = oAtLeastWarningFilter;
					var oErrorFilter = oBaseErrorFilter;
					var oUIModel = oController.getOwnerComponent().getModel("ui");
					var bCreateMode = oUIModel.getProperty("/createMode");
					oItemBinding = oFragment.getContent()[0].getBinding("items");
					if (!aMessages) {
						var aFilters = [];
						var aActiveComponents = oTemplateContract.oNavigationControllerProxy.getActiveComponents();
						var bOnlyValidation = (iSituation < 3);
						for (var i = 0; i < aActiveComponents.length; i++) {
							var sComponentId = aActiveComponents[i];
							var oRegistryEntry = oTemplateContract.componentRegistry[sComponentId];
							if (oRegistryEntry.oController === oController || iSituation !== 2) {
								var aComponentFilters = (oRegistryEntry.methods.getMessageFilters || Function.prototype)(bOnlyValidation);
								aFilters = aComponentFilters ? aFilters.concat(aComponentFilters) : aFilters;
							}
						}
						if (aFilters.length === 0) {
							fnResolve(null);
							return;
						}
						oOverallFilter = aFilters.length === 1 ? aFilters[0] : new Filter({
							filters: aFilters,
							and: false
						});
					}
					if (iSituation === 3) {
						oErrorFilter = new Filter({
							filters: [oOverallFilter, oBaseErrorFilter],
							and: true
						});
						oOverallFilter = new Filter({
							filters: [oOverallFilter, oAtLeastWarningFilter], // make sure that only messages that are at least warnings are shown
							and: true
						});
						var sConfirmationButtonText;
						switch (sCRUDAction) {
							case "Delete":
								sConfirmationButtonText = oCommonUtils.getText("DELETE");
								break;
							case "BOPFAction":
								sConfirmationButtonText = mParameters.actionName;
								break;
							default:
								// This case will be either save or create, not mentioned specifically.
								if (bCreateMode) {
									sConfirmationButtonText = oCommonUtils.getText("CREATE");
								} else {
									sConfirmationButtonText = oCommonUtils.getText("SAVE");
								}
						}
						oLocalModel.setProperty("/CRUDAction", sConfirmationButtonText);
						if (oItemBinding.filter(oErrorFilter).getLength() === 0) {
							oLocalModel.setProperty("/situation", 4);
						}
						
					}
					oItemBinding.filter(oOverallFilter);
					var aMsg = oItemBinding.getCurrentContexts().map(function(oContext) { 
						return oContext.getObject();
					});
					var oMsgDialogHeaderInfo = MessageUtils.getMessageDialogTitleAndSeverity(aMsg, oTemplateContract);
					oLocalModel.setProperty("/title", oMsgDialogHeaderInfo.sTitle);
					oLocalModel.setProperty("/messageType", oMsgDialogHeaderInfo.sSeverity);
					fnResolve(oItemBinding.getLength() && oRet);
				});
			});
		}

		// Returns a Promise that is resolved, if the operation may be performed and rejected when the operation should be stopped
		// bIsActivation: true: Activate/Save action, false: Apply action
		// oController: the controller that actually has started the operation
		function fnBeforeOperation(bIsActivation){
			return new Promise(function(fnResolve, fnReject){
				var oValidationPopup;
				getConfiguredPopoverIfNeeded(bIsActivation ? 1 : 2).then(function(oPopup){
					oValidationPopup = oPopup;
					if (oValidationPopup){
						oValidationPopup.open();
						return fnReject();
					}
					if (!(bIsActivation && bShowConfirmationOnDraftActivate)){
						return fnResolve();
					}
					getConfiguredPopoverIfNeeded(3).then(function(oPopup){
						oValidationPopup = oPopup;
						if (oValidationPopup){
							fnYes = fnResolve;
							fnNo = fnReject;
							oValidationPopup.open();
						} else {
							fnResolve();
						}
					});
				});
			});

		}

		// Performs an Activate/Save resp. Apply operation when all prerequisites are given
		function fnPrepareAndRunSaveOperation(bIsActivation, fnOperation){
			oTemplateContract.oApplicationProxy.performAfterSideEffectExecution(function(){
				fnBeforeOperation(bIsActivation).then(fnOperation);
			}, true);
		}

		function fnRestartCRUDAction(fnOperationCallback, fnCancelCallback, sCRUDAction, mParameters){
			fnYes = fnOperationCallback;
			fnNo = fnCancelCallback;
			return getConfiguredPopoverIfNeeded(3, sCRUDAction, mParameters).then(function(oWarningDialog){
				if (oWarningDialog) {
					oTemplateContract.oBusyHelper.getUnbusy().then(function(){
						oWarningDialog.open();
					}, function(){
						oWarningDialog.open();
					});
				} else {
					fnCancelCallback();
				}
			});
		}

		//iScenario = 1 ; Activation
		//iScenario = 2 ; Apply
		//iScenario = 3 ; Save (non Draft)
		//iScenario = 4 ; Restart the operation in warning scenarios
		//For iScenario = 4 parameter sCRUDAction specifies the action (“Activate” or “Delete”)
		//For iScenario = 4 and sCRUDAction != "Activate" aMessages contains the list of messages to be shown
		// mParameters: object having following properties:
		// 				messagesForUserDecison: Array, any messages to be shown for asking user decsion, useful in 412 warning case.
		//				actionName: String, name of BOPF action, if sCRUDAction is BOPFAction, undefined otherwise.
		//Handels the scenario in which CRUD Action should be performed.
		function fnHandleCRUDScenario(iScenario, fnPerformOperation, fnCancel, sCRUDAction, mParameters) {
			if (iScenario === 4) {
				return fnRestartCRUDAction(fnPerformOperation, fnCancel, sCRUDAction, mParameters);
			} else {
				return fnPrepareAndRunSaveOperation((iScenario === 1), fnPerformOperation);
			}
		}

		function hasValidationMessageOnDetailsViews(){
			return new Promise(function name(fnResolve) {
				getConfiguredPopoverIfNeeded(1).then(function (oPopup) {
					fnResolve(!!oPopup);
				});
			});

			// return !!getConfiguredPopoverIfNeeded(1);
		}

		return {
			handleCRUDScenario: fnHandleCRUDScenario,
			hasValidationMessageOnDetailsViews: hasValidationMessageOnDetailsViews
		};
	}

	return BaseObject.extend("sap.suite.ui.generic.template.lib.CRUDActionHandler", {
		constructor: function(oTemplateContract, oController, oCommonUtils) {
			extend(this, getMethods(oTemplateContract, oController, oCommonUtils));
		}
	});
});
