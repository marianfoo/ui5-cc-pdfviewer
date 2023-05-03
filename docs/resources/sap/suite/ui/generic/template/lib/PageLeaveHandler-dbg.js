sap.ui.define(["sap/ui/base/Object", 
	"sap/base/util/extend", 
	"sap/suite/ui/generic/template/lib/CRUDHelper",
	"sap/suite/ui/generic/template/lib/MessageUtils"
], function (BaseObject, extend, CRUDHelper, MessageUtils) {
	"use strict";

	function getMethods(oTemplateContract) {

		var fnOnDiscardOrKeepDraftConfirmed, 
			fnOnDiscardOrKeepDraftCancel;

		function getSelectedKey(oKeepDiscardPopup) {
			var oPopup = oKeepDiscardPopup.getContent()[1];
			return oPopup.getSelectedItem().data("itemKey");
		}

		function selectAndFocusFirstEntry(oKeepDiscardPopup) {
			var oPopup = oKeepDiscardPopup.getContent()[1];
			var firstListItemOption = oPopup.getItems()[0];
			oPopup.setSelectedItem(firstListItemOption);
			firstListItemOption.focus();
		}

		/*
		ShowDiscardDraftPopUp
		*/
		function fnDiscardOrKeepDraftConfirmation(onDiscardOrKeepDraftConfirmed, onDiscardOrKeepDraftCancel, sMode) {
			fnOnDiscardOrKeepDraftConfirmed = onDiscardOrKeepDraftConfirmed;
			fnOnDiscardOrKeepDraftCancel = onDiscardOrKeepDraftCancel;

			var oDraftPopup, 
				oComponent = getComponent(),
				oController = oComponent.oController;
			var sFragmentname = "sap.suite.ui.generic.template.ObjectPage.view.fragments.DraftConfirmationPopup";
			oComponent.oControllerUtils.oCommonUtils.getDialogFragmentAsync(sFragmentname, {
				onDraftPopupOk: function () {
					var selectedItem = getSelectedKey(oDraftPopup);
					switch (selectedItem) {
						case "draftPopupOptionSave": {
							var oBeforeSavePromise = Promise.resolve(getComponent().oController.beforeSaveExtension());
							oBeforeSavePromise.then(fnSaveDraft.bind(null, oTemplateContract), Function.prototype);
							oDraftPopup.close();
						} break;
						case "draftPopupOptionKeep": {
							fnOnDiscardOrKeepDraftConfirmed();
							oDraftPopup.close();
						} break;
						case "draftPopupOptionDiscard": {
							var discardDraftPromise = fnDiscardDraft(sMode).then(fnOnDiscardOrKeepDraftConfirmed);
							discardDraftPromise.catch(fnOnDiscardOrKeepDraftCancel);
							oDraftPopup.close();
						} break;
						default:
							break;
					}
				},
				onDraftPopupCancel: function () {
					fnOnDiscardOrKeepDraftCancel();
					oDraftPopup.close();
				}
			}, "draftConfirmationPopup").then(function (oPopup) {
				oDraftPopup = oPopup;
				var sText ,bCreateMode = isCreateMode(oController);
				if (bCreateMode) {
					sText = getComponent().oControllerUtils.oCommonUtils.getText("ST_KEEP_DRAFT_MESSAGE_CREATE");
				} else {
					sText = getComponent().oControllerUtils.oCommonUtils.getText("ST_KEEP_DRAFT_MESSAGE_EDIT");
				}
				oDraftPopup.getContent()[0].setProperty("text", sText);
				selectAndFocusFirstEntry(oPopup);
				oDraftPopup.open();
			});
		}

		function fnSaveDraft(oTemplateContract) {
			var oComponent = getComponent();
			var oServices = oComponent.oControllerUtils.oServices;
			var oController = oComponent.oController;
			var oActivationPromise = CRUDHelper.activateDraftEntity(null, null, oTemplateContract.oBusyHelper, oServices, oController, oComponent.oControllerUtils.oComponentUtils);
			oActivationPromise.then(function (oResponse) {
				var oOwnerComponent = oController.getOwnerComponent();
				var bCreateMode = isCreateMode(oController);
				// when the message model contains at least one transient message this will be shown at the end of the busy session. Otherwise we show a generic success message.
				if (bCreateMode) {
					MessageUtils.showSuccessMessageIfRequired(oComponent.oControllerUtils.oCommonUtils.getText("OBJECT_CREATED"), oServices);
				} else {
					MessageUtils.showSuccessMessageIfRequired(oComponent.oControllerUtils.oCommonUtils.getText("OBJECT_SAVED"), oServices);
				}
				oServices.oViewDependencyHelper.setAllPagesDirty([oOwnerComponent.getId()]);
				oServices.oViewDependencyHelper.unbindChildren(oOwnerComponent);
				oServices.oApplication.invalidatePaginatorInfo();
				fnOnDiscardOrKeepDraftConfirmed();
			}, Function.prototype);
			oActivationPromise.catch(function () {
				oComponent.oControllerUtils.oInfoObjectHandler.executeForAllInformationObjects("smartTable",function(oInfoObject){
					oInfoObject.onSaveWithError();
				});
			});
			var oEvent = {
				activationPromise: oActivationPromise
			};
			oComponent.oControllerUtils.oComponentUtils.fire(oComponent.oController, "AfterActivate", oEvent);
		}

		function fnDiscardDraft(sMode) {
			var oTransactionController = oTemplateContract.oAppComponent.getTransactionController();
			var oDraftController = oTransactionController.getDraftController();
			var oApplicationProxy = oTemplateContract.oApplicationProxy;
			var oBindingContextOfRootObject = oApplicationProxy.getContextForPath(getRootObjectPath());
			var oCurrentIdentity = oTemplateContract.oNavigationControllerProxy.getCurrentIdentity();
			var oBackNavigationPromise = (sMode === "LeaveApp" && oTemplateContract.oApplicationProxy.getNavigateAfterDraftCancelPromise(oBindingContextOfRootObject, true)) || Promise.resolve();
			var oDiscardPromise = oBackNavigationPromise.then(function (oBackNavigationOption) {
				return CRUDHelper.discardDraft(oDraftController, oTransactionController, oApplicationProxy, oBindingContextOfRootObject).then(function () {
					oTemplateContract.oNavigationControllerProxy.setBackNavigationOption(oBackNavigationOption);
					oTemplateContract.oViewDependencyHelper.setRootPageToDirty();
					oTemplateContract.oViewDependencyHelper.unbindChildrenUsingTreeNode(oCurrentIdentity.treeNode);
					// Draft discard is a kind of cross navigation -> invalidate paginator info
					oApplicationProxy.invalidatePaginatorInfo();
				});
			});
			oTemplateContract.oBusyHelper.setBusy(oDiscardPromise);
			return oDiscardPromise;
		}

		function fnPerformAfterDiscardOrKeepDraftImpl(fnPositive, fnNegative, sMode, bIsTechnical) {
			var sEnableDiscardDraftConfirmation = oTemplateContract.oNavigationControllerProxy.isDiscardDraftConfirmationNeeded();
			var bNeedsPopup = ((sEnableDiscardDraftConfirmation === "always" && sMode.startsWith("Leave")) || (sEnableDiscardDraftConfirmation === "restricted" && sMode === "LeavePage")) && isObjectEditable();
			if (bNeedsPopup) {
				fnDiscardOrKeepDraftConfirmation(fnPositive, fnNegative, sMode);
			} else {
				fnPositive();
			}
		}

		function getComponent() {
			var oComponent;
			var oCurrentIdentity = oTemplateContract.oNavigationControllerProxy.getCurrentIdentity();
			var oAncestralNode = oTemplateContract.oApplicationProxy.getAncestralNode(oCurrentIdentity.treeNode, 1);
			var sComponentId = oAncestralNode.componentId ? oAncestralNode.componentId : oCurrentIdentity.treeNode.componentId;
			oComponent = oTemplateContract.componentRegistry[sComponentId];
			return oComponent;
		}

		function isCreateMode(oController) {
			var oUIModel = oController.getOwnerComponent().getModel("ui");
			return oUIModel.getProperty("/createMode");
		}

		function isObjectEditable() {
			return oTemplateContract.oApplicationProxy.checkIfObjectIsADraftInstance(getRootObjectPath());
		}

		function getRootObjectPath() {
			var oCurrentIdentity = oTemplateContract.oNavigationControllerProxy.getCurrentIdentity();
			var oAncestralNode = oTemplateContract.oApplicationProxy.getAncestralNode(oCurrentIdentity.treeNode, 1);
			var sPath = oAncestralNode.getPath(3, oCurrentIdentity.keys);
			return sPath;
		}

		// Parameter sMode has same possible values as fnProcessDataLossOrDraftDiscardConfirmation in CommonUtils
		function fnPerformAfterDiscardOrKeepDraft(fnProcessFunction, fnCancelFunction, sMode, bNoBusyCheck, bIsTechnical) {
			var oRet = new Promise(function (fnResolve, fnReject) {
				var fnPositive = function () {
					var oRet = fnProcessFunction();
					fnResolve(oRet);
				};
				var fnNegative = function () {
					fnCancelFunction();
					fnReject();
				};
				if (bNoBusyCheck) {
					fnPerformAfterDiscardOrKeepDraftImpl(fnPositive, fnNegative, sMode, bIsTechnical);
				} else {
					oTemplateContract.oApplicationProxy.performAfterSideEffectExecution(fnPerformAfterDiscardOrKeepDraftImpl.bind(null, fnPositive, fnNegative, sMode, bIsTechnical), true);
				}
			});
			return oRet;
		}

		// public instance methods
		return {
			discardDraft: fnDiscardDraft,
			performAfterDiscardOrKeepDraft: fnPerformAfterDiscardOrKeepDraft
		};
	}

	return BaseObject.extend("sap.suite.ui.generic.template.lib.PageLeaveHandler", {
		constructor: function (oTemplateContract) {
			extend(this, getMethods(oTemplateContract));
		}
	});
});
