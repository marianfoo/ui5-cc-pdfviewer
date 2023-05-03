sap.ui.define([
	"sap/ui/base/Object",
	"sap/suite/ui/generic/template/js/StableIdHelper",
	"sap/suite/ui/generic/template/lib/MessageUtils",
	"sap/base/util/extend",
	"sap/suite/ui/generic/template/genericUtilities/controlHelper",
	"sap/suite/ui/generic/template/genericUtilities/testableHelper",
	"sap/suite/ui/generic/template/lib/CRUDHelper",
	"sap/base/util/isEmptyObject",
	"sap/ui/model/Context"
], function (BaseObject, StableIdHelper, MessageUtils, extend, controlHelper, testableHelper, CRUDHelper, isEmptyObject, Context) {
	"use strict";

	// This helper class handles creation using dialog in the List Report
	// In case the create with dialog is enabled in List Report it instantiates an instance of
	// sap.suite.ui.generic.template.Listreport.controller.CreateWithDialogHandler which implements the main part of the logic
	// This class only contains the glue code which is used to adapt the services provided by  generic class to the requirements of the List Report

	// oState is used as a channel to transfer data to the controller and back
	// oController is the controller of the enclosing ListReport
	// oTemplateUtils are the template utils as passed to the controller implementation
	function getMethods(oState, oController, oTemplateUtils) {

		var oDialog, oTable;

		function fnGetFilterForCurrentState() {
			return {
				"aFilters": [{
						sPath: "fullTarget",
						sOperator: "StartsWith",
						oValue1: oDialog.getBindingContext().getPath()
					},
					{
						sPath: "target",
						sOperator: "EQ",
						oValue1: "/" + oController.getOwnerComponent().getEntitySet()
					}
				]
			};
		}

		function fnRemoveOldMessageFromModel() {
			var oContextFilter = fnGetFilterForCurrentState(oDialog);
			var oMessageModel = sap.ui.getCore().getMessageManager().getMessageModel();
			if (oContextFilter) {
				var oMessageBinding = oMessageModel.bindList("/", null, null, [oContextFilter]); // Note: It is necessary to create  binding each time, since UI5 does not update it (because there is no change handler)
				var aContexts = oMessageBinding.getContexts();
				if (aContexts.length) {
					var aErrorToBeRemoved = [];
					for (var oContext in aContexts) {
						aErrorToBeRemoved.push(aContexts[oContext].getObject());
					}
					sap.ui.getCore().getMessageManager().removeMessages(aErrorToBeRemoved); //to remove error state from field
				}
			}
		}

		function fnCancelPopUpDialog() {
			oDialog.close();
			oDialog.setVisible(false);
			if (oTemplateUtils.oComponentUtils.isDraftEnabled()) {
				oTemplateUtils.oServices.oCRUDManager.discardDraft(oDialog.getBindingContext());
			} else {
				fnRemoveOldMessageFromModel(oDialog);
				oController.getView().getModel().deleteCreatedEntry(oDialog.getBindingContext());
			}
			oDialog.setBindingContext(null);
		}

		function fnSavePopUpDialog() {
			var bMessageModelContainsError = false;
			var oFilter;
			var oSmartForm = oDialog && typeof oDialog.getContent === "function" && oDialog.getContent() && oDialog.getContent()[0];
			var oCheckPromise = oSmartForm ? oSmartForm.check() : Promise.resolve();
			oCheckPromise.then(function () {
				// client side error processing
				var aModelData = sap.ui.getCore().getMessageManager().getMessageModel().getData();
				bMessageModelContainsError = aModelData.some(function (oErrorInfo) {
					return oErrorInfo.type === "Error" && oErrorInfo.validation;
				});
				if (!bMessageModelContainsError && oTemplateUtils.oComponentUtils.isDraftEnabled()) { //Draft save
					var oCRUDActionHandler = oTemplateUtils.oComponentUtils.getCRUDActionHandler();
					oFilter = fnGetFilterForCurrentState(oDialog);
					oCRUDActionHandler.handleCRUDScenario(1, fnActivateImpl.bind(null, oFilter));
				} else if (!bMessageModelContainsError) { //non-draft save
					oTemplateUtils.oCommonEventHandlers.submitChangesForSmartMultiInput();
					oFilter = fnGetFilterForCurrentState(oDialog);
					var oSaveEntityPromise = oTemplateUtils.oServices.oCRUDManager.saveEntity(oFilter);
					/*  Checking if we are on the Object Page as side effects are not to be executed in the case of LR 
					    since table refresh happens automatically */
					if (oTemplateUtils.oComponentUtils.getViewLevel() === 1) {
						oTemplateUtils.oServices.oApplicationController.executeSideEffects(oTable.getBindingContext(), [], [oTable.getTableBindingPath()]);
					}
					oSaveEntityPromise.then(function () {
						oDialog.close();
						oDialog.setVisible(false);
						// This condition checks for List Report since smarttable is present in LR so it gets refreshed and in case of OP normal Table is refreshed.
						/* TODO: Classes under lib folder should not know about the component (LR and OP) and should be designed in a way which does not really needs
						   this differentiation and it should be refactored. */
						if (oState.oPresentationControlHandler) {
							if (oState.refreshModel) {
								oState.refreshModel();
							} else {
								/* getEntitySet should not be a method of PresentationControlHandler. For more details, refer to the comment mentioned before the 
								   method's definition in the class */
								oTemplateUtils.oCommonUtils.refreshModel(oState.oPresentationControlHandler.getEntitySet());
							}
							oState.oPresentationControlHandler.refresh();
							MessageUtils.showSuccessMessageIfRequired(oTemplateUtils.oCommonUtils.getText("OBJECT_CREATED"), oTemplateUtils.oServices);
						} else {
							oTemplateUtils.oCommonUtils.refreshModel(oTable.getEntitySet());
							oTemplateUtils.oServices.oPresentationControlHandlerFactory.getPresentationControlHandler(oTable).refresh();
							MessageUtils.showSuccessMessageIfRequired(oTemplateUtils.oCommonUtils.getContextText("ITEM_CREATED", oTable.getId()), oTemplateUtils.oServices);
						}
						var oBusyHelper = oTemplateUtils.oServices.oApplication.getBusyHelper();
						oBusyHelper.getUnbusy().then(function () {
							fnRemoveOldMessageFromModel(oDialog);
							oDialog.setBindingContext(null);
						});	
					});
					var oEvent1 = {
						saveEntityPromise: oSaveEntityPromise
					};
					oTemplateUtils.oComponentUtils.fire(oController, "AfterSave", oEvent1);
				}
			});
		}

		function fnActivateImpl(oCreateWithDialogFilter) { //activate draft entity
			var oActivationPromise = oTemplateUtils.oServices.oCRUDManager.activateDraftEntity(oDialog.getBindingContext(), oCreateWithDialogFilter);
			oActivationPromise.then(function (oResponse) {
				if (oResponse && oResponse.response && oResponse.response.statusCode === "200") {
					oDialog.close();
					oDialog.setVisible(false);
					oDialog.setBindingContext(null);
					MessageUtils.showSuccessMessageIfRequired(oTemplateUtils.oCommonUtils.getText("OBJECT_CREATED"), oTemplateUtils.oServices);
					oState.oPresentationControlHandler.refresh();
				}
			}, Function.prototype);
			var oEvent = {
				activationPromise: oActivationPromise
			};
			oTemplateUtils.oComponentUtils.fire(oController, "AfterActivate", oEvent);
		}


		function fnCreateWithDialog(oCreateWithDialog, oEventSource, oPredefinedValues) {
			oTable = oTemplateUtils.oCommonUtils.getOwnerControl(oEventSource);
			oTable = controlHelper.isSmartTable(oTable) ? oTable : oTable.getParent();
			var oParentContext = oTable.getParent().getBindingContext();
			oPredefinedValues = isEmptyObject(oPredefinedValues) ? false : oPredefinedValues;
			if (!oPredefinedValues) {
				var oGetDefaultValuesPromise = oTemplateUtils.oServices.oCRUDManager.getDefaultValues(oEventSource, oPredefinedValues);
				if (oGetDefaultValuesPromise instanceof Promise) {
					var fnGetPredefinedValues = function (aResponse) {
						openDialog(oCreateWithDialog, oEventSource, aResponse[0], oTable, oParentContext);
					};
					oGetDefaultValuesPromise.then(fnGetPredefinedValues, fnGetPredefinedValues);
				} else {
					openDialog(oCreateWithDialog, oEventSource, oPredefinedValues, oTable, oParentContext);
				}
			} else {
				openDialog(oCreateWithDialog, oEventSource, oPredefinedValues, oTable, oParentContext);
			}
		}

		function openDialog(oCreateWithDialog, oEventSource, oPredefinedValues, oTable, oParentContext) {
			var oSmartFilterbar = oState.oSmartFilterbar;
			var sPath = oParentContext ? oTable.getTableBindingPath() : '/' + oTable.getEntitySet();
			var oModel = new sap.ui.model.json.JSONModel();
			oDialog = oCreateWithDialog;
			oDialog.setVisible(true);
			oModel.setProperty("/title", oTemplateUtils.oCommonUtils.getContextText("CREATE_DIALOG_TITLE", oTable.getId()));
			oDialog.setModel(oModel, "localModel");
			oDialog.setEscapeHandler(fnCancelPopUpDialog);
			if (oTemplateUtils.oComponentUtils.isDraftEnabled()) { //Create Dialog load for draft apps
				oTemplateUtils.oCommonEventHandlers.addEntry(oEventSource, false, oSmartFilterbar, oPredefinedValues, false, true).then(
					function (oTargetInfo) {
						oTemplateUtils.oServices.oApplication.registerContext(oTargetInfo);
						oDialog.setBindingContext(oTargetInfo);
						oDialog.open();
					});
			} else { //create dialog for non-draft apps.
				var oNewContext = CRUDHelper.createNonDraft(oParentContext, sPath, oDialog.getModel(), oPredefinedValues);
				oDialog.setBindingContext(oNewContext);
				oDialog.open();
			}
		}

		/* eslint-disable */
		var fnActivateImpl = testableHelper.testable(fnActivateImpl, "fnActivateImpl");
		var fnRemoveOldMessageFromModel = testableHelper.testable(fnRemoveOldMessageFromModel, "fnRemoveOldMessageFromModel");
		var fnGetFilterForCurrentState = testableHelper.testable(fnGetFilterForCurrentState, "fnGetFilterForCurrentState");
		var openDialog = testableHelper.testable(openDialog, "openDialog");
		/* eslint-enable */

		// public instance methods
		return {
			onCancelPopUpDialog: fnCancelPopUpDialog,
			onSavePopUpDialog: fnSavePopUpDialog,
			createWithDialog: fnCreateWithDialog
		};
	}

	return BaseObject.extend("sap.suite.ui.generic.template.lib.CreateWithDialogHandler", {
		constructor: function (oState, oController, oTemplateUtils) {
			extend(this, getMethods(oState, oController, oTemplateUtils));
		}
	});
});
