// This class handles the process of editing the objects on List Report. Editing is done in a dialog opened on List Report.
// Single object - Individual object can be selected for editing.
// Multiple objects - Multiple objects can be edited to provide same column values.
//
// - fnOnMultiEditButtonPress: The event handler for the multi edit button on the LR. It decides whether the selected contexts are updatable.
//                            - Yes: Open the Edit Dialog.
//                            - No: Opens a dialog to confirm continuation with only updatable context.
//
//- fnOpenMultiEditDialog: Opens the Edit Dialog and creates its content. Following tasks are performed to create content:
//                          1. Find the updatable and supported properties
//                          2. Create Smartmultiedit/Field for above properties
//                          3. Set smartmultiedit/Container as content of dialog.
//
//- fnOnSaveMultiEditDialog: Updates the changed contexts.

sap.ui.define([
    "sap/ui/base/Object",
    "sap/ui/core/ExtensionPoint",
    "sap/base/util/extend",
    "sap/ui/comp/smartform/Group",
    "sap/ui/comp/smartform/GroupElement",
    "sap/ui/comp/smartmultiedit/Field",
    "sap/ui/comp/smartform/SmartForm",
    "sap/ui/comp/smartmultiedit/Container",
    "sap/suite/ui/generic/template/genericUtilities/testableHelper",
    "sap/suite/ui/generic/template/js/StableIdHelper",
    "sap/suite/ui/generic/template/lib/MessageUtils",
    "sap/m/MessageBox",
    "sap/suite/ui/generic/template/genericUtilities/FeLogger"
], function (BaseObject, ExtensionPoint, extend, Group, GroupElement, Field, SmartForm, Container, testableHelper, StableIdHelper, 
    MessageUtils, MessageBox, FeLogger) {
    "use strict";
    function getMethods(oState, oController, oTemplateUtils) {
        var aUpdatableContexts, bShowVisibleColumns;
        var oCommonUtils = oTemplateUtils.oCommonUtils;
        var oExtensionDetail;

        // Logger Initialization
        var	sClassName = "ListReport.controller.MultiEditHandler";
        var oFeLogger = new FeLogger(sClassName);
        var oLogger = oFeLogger.getLogger();

        function fnOnMultiEditButtonPress() {
            var aContexts = oState.oPresentationControlHandler.getSelectedContexts();
            aUpdatableContexts = aContexts.filter(oCommonUtils.isContextEditable);
            if (aContexts.length === aUpdatableContexts.length) {
                fnOpenMultiEditDialog(aUpdatableContexts);
            } else if (aUpdatableContexts.length === 0 && aContexts.length === 1) {
                MessageBox.error(oCommonUtils.getText("OBJECT_NOT_EDITABLE"));
            } else {
                var sWarningTextKey = aUpdatableContexts.length === 1 ? "EDIT_REMAINING" : "EDIT_REMAINING_PLURAL";
                var sWarningText = oCommonUtils.getText(sWarningTextKey, [aContexts.length - aUpdatableContexts.length, aContexts.length, aUpdatableContexts.length]);
                var sEdit = oCommonUtils.getText("MULTI_EDIT");
                var sCancel = oCommonUtils.getText("CANCEL");
                MessageBox.warning(sWarningText, {
                            actions: [sEdit, sCancel],
                            emphasizedAction: sEdit,
                    onClose: function (sAction) {
                        if (sAction === sEdit) {
                            fnOpenMultiEditDialog(aUpdatableContexts);
                        }
                    },
                    contentWidth: "30rem"
                });
            }
        }

        function fnOpenMultiEditDialog(aUpdatableContexts) {
            var sSelectedTabKey;
            // Check for quickVariantSelectionX to get sSelectedTabKey. 
            // sSelectedTabKey value will be undefined in other scenario like quickVariantSelection and non variants.
            if (oTemplateUtils.oComponentUtils.getSettings().quickVariantSelectionX){
                sSelectedTabKey = oState.oMultipleViewsHandler && oState.oMultipleViewsHandler.getSelectedKey();
            }
            var sIdForMultiEditDialog = StableIdHelper.getStableId({
                type: "ListReportAction",
                subType: "MultiEditDialog",
                sQuickVariantKey : sSelectedTabKey
            });
            var oMultiEditDialog = oController.byId(sIdForMultiEditDialog);
            oMultiEditDialog.setVisible(true);
            var sDialogTitle = oCommonUtils.getText("MULTI_EDIT_DIALOG_TITLE", aUpdatableContexts.length);
            
            var oModel = new sap.ui.model.json.JSONModel();
            oModel.setProperty("/title", sDialogTitle);
            oMultiEditDialog.setModel(oModel,"localModel");
            bShowVisibleColumns = false;

            // Identifying TableSettings
            // If its quickVariantSelectionX then it will have its own tableSettings key and settings.
            // Fallback to main settings if quickVariantSelectionX tableSettings for variant is missing.
            var oTableSettings = oController.getOwnerComponent().getTableSettings();
            if (oTemplateUtils.oComponentUtils.getSettings().quickVariantSelectionX){
                var oVariants = oTemplateUtils.oComponentUtils.getSettings().quickVariantSelectionX.variants || {};
                for (var sKey in oVariants) {
                    if (oVariants[sKey].key === sSelectedTabKey){
                        oTableSettings = oVariants[sKey].tableSettings ? oVariants[sKey].tableSettings : oTableSettings;
                    }
                }
            }
            
            // Generating extension point path as per rule. 
            // It generated from ExtensionName followed by pipe(|) and Entityset Name
            var sExtensionName = "MultiEditFieldsExtension" + "|" + oState.oPresentationControlHandler.getEntitySet() + (sSelectedTabKey ? ("|" + sSelectedTabKey) : "");

            var oViewExtensionList = oTemplateUtils.oComponentUtils.getViewExtensions() || {};
            oExtensionDetail = oViewExtensionList[sExtensionName];
            // In case annotationPath is given in manifest then content of dialog is already created at templating time.
            // Otherwise, content of dialog is created here from the visible columns of table. 
            if (!oTableSettings.multiEdit.annotationPath) {
                bShowVisibleColumns = true;

                if (oExtensionDetail){
                    ExtensionPoint.load({
                        "container": oController.getView(), 
                        "name": sExtensionName,
                        "async":true
                    }).then(function(aControls) {
                        var oGroupExtension = new Group({
                            groupElements:[
                                aControls
                            ]
                        });
                        fnOpenDialog(oMultiEditDialog, oGroupExtension);
                    });
                } else {
                    fnOpenDialog(oMultiEditDialog);
                }
            } else {
                var oMultiEditContainer = oMultiEditDialog.getContent()[0];
                oMultiEditContainer.resetContainer();
                oMultiEditDialog.getContent()[0].setContexts(aUpdatableContexts);
                oMultiEditDialog.open();
            }
            
        }

        function fnOpenDialog(oMultiEditDialog, oGroupExtension){
            // get Columns to be shown for editing.
            var aShowColumns = fnGetColumnsToShow();
            //create Group of columns to be shown
            
            var oGroupColumns = new Group();
            aShowColumns.forEach(function (oColumn) {
                var oGroupElement = new GroupElement();
                var oSmartmultieditField = new Field({
                    propertyName: oColumn.data("p13nData").leadingProperty,
                    useApplyToEmptyOnly: false
                });
                oGroupElement.addElement(oSmartmultieditField);
                oGroupColumns.addGroupElement(oGroupElement);
            });

            // Created two seprate group and adding it to smartForm using smartForm's groups aggregation. 
            var oSmartForm = new SmartForm();
            if (oGroupExtension){
                oSmartForm.addGroup(oGroupExtension);
            }
            // Assuming that oGroupColumns have editable columns always. 
            oSmartForm.addGroup(oGroupColumns);

            // we distroy the content of dailog everytime we close it, because when dialog is opened next time, the visible columns might have been changed
            // hence we need to create the content(Smart container) again.
            var oContainer = new Container();
            /* getEntitySet should not be a method of PresentationControlHandler. For more details, refer to the comment 
                mentioned before the method's definition in the class */
            var sEntitySet = oState.oPresentationControlHandler.getEntitySet();
            oContainer.setEntitySet(sEntitySet);
            
            oContainer.setLayout(oSmartForm);
            oMultiEditDialog.addContent(oContainer);

            var oMultiEditContainer = oMultiEditDialog.getContent()[0];
            oMultiEditContainer.resetContainer();
            oMultiEditDialog.getContent()[0].setContexts(aUpdatableContexts);
            oMultiEditDialog.open();
        }

        // get supported and updatable columns. Ignore actions, dataFieldForAnnotations and custom columns.
        // How to identify above cases:
        // actions - in CustomData actionButton = true
        // dataFieldForAnnotations - column key contains 'DataFieldForAnnotation'
        // custom columns - do not have leadingProperty
        //
        // Immuatble - either Immuatble should not be there. if it is there, it should be false. Only then property would be updatable.          
        function fnGetColumnsToShow() {
            var oMetaModel = oController.getOwnerComponent().getModel().getMetaModel();
            /* getEntitySet should not be a method of PresentationControlHandler. For more details, refer to the comment 
               mentioned before the method's definition in the class */
            var oEntityType = oMetaModel.getODataEntityType(oMetaModel.getODataEntitySet(oState.oPresentationControlHandler.getEntitySet()).entityType);
            
            return oState.oPresentationControlHandler.getVisibleProperties().filter(function (oColumn) {
                var sColumnKey = oColumn.data("p13nData") && oColumn.data("p13nData").columnKey;
                var oProperty = oMetaModel.getODataProperty(oEntityType, oColumn.data("p13nData").leadingProperty);
                if (oProperty) {
                    return oColumn.getVisible() && (sColumnKey.indexOf("DataFieldForAnnotation") < 0) && !oColumn.data("p13nData").actionButton && !!oColumn.data("p13nData").leadingProperty
                        && oProperty["sap:updatable"] !== "false" && (!oProperty["Org.OData.Core.V1.Immutable"] || oProperty["Org.OData.Core.V1.Immutable"].Bool === "false");
                }
            });
        }

        function fnOnSaveMultiEditDialog(oEvent) {
            var oMultiEditDialog = oEvent.getSource().getParent();
            var oMultiEditContainer = oMultiEditDialog.getContent()[0];

            // getErroneousFieldsAndTokens returns fields with errors. The fields with errors are highlighted red by the smartMultiEdit control itself.
            // Save if there are no errors.
            // However getErroneousFieldsAndTokens triggers a call if changed fields include value help or drop down. This needs to be checked because validations should not trigger a backend call.
            var oValidationPromise = oMultiEditContainer.getErroneousFieldsAndTokens();
            oValidationPromise.then(function (aErrorFields) {
                if (aErrorFields.length === 0) {
                    var oUpdatedData;
                    //Add updated field and value in oUpdatedData.
                    var fnPrepareUpdatedData = function (oData, oField) {
                        var sPropName = oField.getPropertyName(),
                            sUomPropertyName = oField.getUnitOfMeasurePropertyName();
                        oUpdatedData[sPropName] = oData[sPropName];
                        if (oField.isComposite()) {
                            oUpdatedData[sUomPropertyName] = oData[sUomPropertyName];
                        }
                    };
                    // Get all the updated objects, with the updated data object.
                    // Fields of oMultiEditContainer could be in one of the following states:
                    // 1. <Keep Existing Value>
                    // 2. <Replace Field Value>
                    // 3. <Clear Field Value>
                    // Filter fields with 2 and 3 values. For each field use fnHandler function to create an object with all the updated field and value pair.
                    //
                    // Following optimization can be done:
                    //          a. oUpdatedData can be derived only once. since updated field values would be same for all context.
                    //          a. explore getAllUpdatedContexts(false), this method return only the fields which are changed. For example if user choose 'Currency = EUR', from selected contexts this function would return only context where previous value was not EUR.
                    //              While exploring getAllUpdatedContexts(false), specially test cases with <Clear fields value>. Also if this approach is taken then oUpdatedData would be different for all contexts.
                    oMultiEditContainer.getAllUpdatedContexts(true).then(function (aUpdatedContexts) {
                        var aContextsToBeUpdated = [];
                        var aChangedFields = oMultiEditContainer.getFields().filter(function (oField) {
                            return !oField.isKeepExistingSelected();
                        });
                        if ((aChangedFields && aChangedFields.length > 0) || oExtensionDetail) {
                            aUpdatedContexts.forEach(function (oUpdatedContext) {
                                oUpdatedData = {};
                                aChangedFields.forEach(fnPrepareUpdatedData.bind(null, oUpdatedContext.data));
                                aContextsToBeUpdated.push({
                                    sContextPath: oUpdatedContext.context.getPath(),
                                    oUpdateData: oUpdatedData
                                });
                            });
                            var oBeforeMultiEditSaveExtensionPromise =  oController.beforeMultiEditSaveExtension(aContextsToBeUpdated);
                            // In case the BeforeMultiEditSaveExtension is defined the default save would be skipped and custom save implemented in the extension would be executed.
                            if (oBeforeMultiEditSaveExtensionPromise) {
                                var oBusyHelper = oTemplateUtils.oServices.oApplication.getBusyHelper();
                                oBusyHelper.setBusy(oBeforeMultiEditSaveExtensionPromise);
                                oBeforeMultiEditSaveExtensionPromise.then(function(){
                                    fnCloseMultiEditDialog(oMultiEditDialog);
                                    oState.oPresentationControlHandler.refresh();
                                }).catch(function(){
                                    fnCloseMultiEditDialog(oMultiEditDialog);
                                });
                                return;
                            } else if (oExtensionDetail){
                                oLogger.error("beforeMultiEditSaveExtension implementation is missing while using MultiEditFieldsExtension");
                                return;
                            }
                            fnCloseMultiEditDialog(oMultiEditDialog);
                            var oSaveMultipleContextsPromise = oTemplateUtils.oServices.oCRUDManager.updateMultipleEntities(aContextsToBeUpdated);
                            oSaveMultipleContextsPromise.then(function (aUpdatedContexts) {
                                // If selected records are updated (all/some), show feedback to user. Otherwise, transtient message dialog will be shown to display failed records.
                                if (aUpdatedContexts.length > 0) {
                                    oState.oPresentationControlHandler.refresh();
                                    if (aUpdatedContexts.length === aContextsToBeUpdated.length) {
                                        MessageUtils.showSuccessMessageIfRequired(oCommonUtils.getText("OBJECT_SAVED"), oTemplateUtils.oServices);
                                    } else {
                                        var sMessage = oCommonUtils.getText("PARTIAL_UPDATE", [aUpdatedContexts.length, aContextsToBeUpdated.length]);
                                        oTemplateUtils.oServices.oApplication.showMessageBox(sMessage, {icon: MessageBox.Icon.SUCCESS, title: oCommonUtils.getText("ST_SUCCESS")});
                                    }
                                }
                            });
                        } else {
                            fnCloseMultiEditDialog(oMultiEditDialog);
                            MessageUtils.showSuccessMessageIfRequired(oCommonUtils.getText("OBJECT_NOT_MODIFIED"), oTemplateUtils.oServices);
                        }
                    });
                }
            });
        }

        function fnOnCancelMultiEditDialog(oEvent) {
            var oMultiEditDialog = oEvent.getSource().getParent();
            fnCloseMultiEditDialog(oMultiEditDialog);
        }

        function fnCloseMultiEditDialog(oMultiEditDialog) {
            oMultiEditDialog.close();
            if (bShowVisibleColumns) {
                oMultiEditDialog.destroyContent();
            }
        }

        /* eslint-disable */
        var fnOnSaveMultiEditDialog = testableHelper.testable(fnOnSaveMultiEditDialog, "fnOnSaveMultiEditDialog");
        /* eslint-disable */

        // public instance methods
        return {
            onMultiEditButtonPress: fnOnMultiEditButtonPress,
            onSaveMultiEditDialog: fnOnSaveMultiEditDialog,
            onCancelMultiEditDialog: fnOnCancelMultiEditDialog

        };
    }

    return BaseObject.extend("sap.suite.ui.generic.template.ListReport.controller.MultiEditHandler", {
        constructor: function (oState, oController, oTemplateUtils) {
            extend(this, getMethods(oState, oController, oTemplateUtils));
        }
    });
});