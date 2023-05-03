sap.ui.define(["sap/ui/base/Object", "sap/base/util/extend"],function(BaseObject, extend) {
	"use strict";

	function getMethods(oTemplateContract) {
		var bSuppressPopup = oTemplateContract.oAppComponent.suppressDataLossPopup();

		var fnOnDataLossConfirmed;
		var fnOnDataLossCancel;
		/*
        ShowsDataLosspopup
        */
		function fnDataLossConfirmation(onDataLossConfirmed, onDataLossCancel, oCommonUtils, bIsLeaving, bIsTechnical) {
			var oDataLossModel, oDataLossPopup;
			fnOnDataLossConfirmed = onDataLossConfirmed;
			fnOnDataLossCancel = onDataLossCancel;
			var sFragmentname = bIsTechnical ? "sap.suite.ui.generic.template.fragments.DataLossTechnicalError" : "sap.suite.ui.generic.template.fragments.DataLoss";
			oCommonUtils.getDialogFragmentAsync(sFragmentname, {
				onDataLossOK: function () {
					oDataLossPopup.close();
					fnOnDataLossConfirmed();
				},
				onDataLossCancel: function () {
					oDataLossPopup.close();
					fnOnDataLossCancel();
				}
			}, "dataLoss").then(function (oPopup) {
				oDataLossPopup = oPopup;
				oDataLossModel = oDataLossPopup.getModel("dataLoss");
				oDataLossModel.setProperty("/isLeaving", bIsLeaving);
				oDataLossPopup.open();
			});
		}
		
		function fnGetAffectedNonDraftRegistryEntryInfo(){
			var aActiveComponents = oTemplateContract.oNavigationControllerProxy.getActiveComponents();
			var oFirstRegistryEntryEditable, oFirstRegistryEntryWithExternalChanges, oFirstRegistryEntry; // will be set to the corresponding registry entry for the view which might have pending non-draft changes if there is one
			// "first" always refers to the first registry entry found fulfilling the condition. Registry is ordered by viewLevel (if not, this check should be added accordingly)
			aActiveComponents.forEach(function(sComponentId){ // ensure, that application callback is called for all active views
				var oRegistryEntry = oTemplateContract.componentRegistry[sComponentId];
				if (oRegistryEntry.utils.isDraftEnabled()) {
					return;
				}
				oFirstRegistryEntry = oFirstRegistryEntry || oRegistryEntry;
				var oUiModel = oRegistryEntry.oComponent.getModel("ui");
				if (oUiModel.getProperty("/editable")) {
					oFirstRegistryEntryEditable = oFirstRegistryEntryEditable || oRegistryEntry;
				}
				if (oRegistryEntry.aUnsavedDataCheckFunctions && oRegistryEntry.aUnsavedDataCheckFunctions.some(function (fnUnsavedCheck){
					return fnUnsavedCheck();
				})) {
					oFirstRegistryEntryWithExternalChanges = oFirstRegistryEntryWithExternalChanges || oRegistryEntry;
				}
			});
			return {
				relevantRegistryEntry: oFirstRegistryEntryWithExternalChanges || oFirstRegistryEntryEditable || oFirstRegistryEntry, // this defines the priority of the indications which view might be the right one to choose for the popup - room for discussion
				hasExternalChanges: !!oFirstRegistryEntryWithExternalChanges 
			};
		}

		function fnPerformIfNoDataLossImpl(fnPositive, fnNegative, bIsLeaving, bIsTechnical) {
			var oRelevantRegistryEntryInfo = fnGetAffectedNonDraftRegistryEntryInfo();
			var bHasChanges = oRelevantRegistryEntryInfo.relevantRegistryEntry && (oRelevantRegistryEntryInfo.hasExternalChanges || oTemplateContract.oAppComponent.getModel().hasPendingChanges());
			var fnPerformAction = oRelevantRegistryEntryInfo.relevantRegistryEntry ? function(){
				oRelevantRegistryEntryInfo.relevantRegistryEntry.utils.cancelEdit(null, bHasChanges);
				if (bIsLeaving) {
					oTemplateContract.oNavigationControllerProxy.userHasAcceptedDataLoss();
				}
				fnPositive();
			} : fnPositive;
			var bNeedsPopup = !bSuppressPopup && bHasChanges;
			if (bNeedsPopup){ 
				fnDataLossConfirmation(fnPerformAction, fnNegative, oRelevantRegistryEntryInfo.relevantRegistryEntry.oControllerUtils.oCommonUtils, bIsLeaving, bIsTechnical);
			} else {
				fnPerformAction();
			}
		}

		// Parameter sMode has same possible values as fnProcessDataLossOrDraftDiscardConfirmation in CommonUtils.
		// Note that values "LeavePage and "LeaveApp" will be treated identical by this function
		function fnPerformIfNoDataLoss(fnProcessFunction, fnCancelFunction, sMode, bNoBusyCheck, bIsTechnical) {
			var bIsLeaving = sMode.startsWith("Leave");
			var oRet = new Promise(function(fnResolve, fnReject){
				var fnPositive = function(){
					var oRet = fnProcessFunction();
					fnResolve(oRet);
				};
				var fnNegative = function(){
					fnCancelFunction();
					fnReject();
				};
				if (bNoBusyCheck){
					fnPerformIfNoDataLossImpl(fnPositive, fnNegative, bIsLeaving, bIsTechnical);
				} else {
					oTemplateContract.oApplicationProxy.performAfterSideEffectExecution(fnPerformIfNoDataLossImpl.bind(null, fnPositive, fnNegative, bIsLeaving, bIsTechnical), true);
				}
			});
			return oRet;
		}

		// work protection call back to analyse if any data was modified or not and to display shell dataloss dialog
		// returns true - pop up is needed
		// returns false - no popup needed or modified data is not lost as the user is navigating to the modified node.
		function fnGetShellDataLossPopup(oShellContext) {
			var bNeedsDataLossPopup = !bSuppressPopup && oTemplateContract.oNavigationControllerProxy.unwantedDataLossPossible(oShellContext);
			if (bNeedsDataLossPopup) {
				var oRelevantRegistryEntryInfo = fnGetAffectedNonDraftRegistryEntryInfo();
				var bHasChanges = oRelevantRegistryEntryInfo.relevantRegistryEntry && (oRelevantRegistryEntryInfo.hasExternalChanges || oTemplateContract.oAppComponent.getModel().hasPendingChanges());
				return !!bHasChanges;
			}
			return false;
		}

		return {
			performIfNoDataLoss: fnPerformIfNoDataLoss,
			getShellDataLossPopup: fnGetShellDataLossPopup
		};

	}

	return BaseObject.extend("sap.suite.ui.generic.template.lib.DataLossHandler", {
		constructor: function (oTemplateContract) {
			extend(this, getMethods(oTemplateContract));
		}
	});
});
