sap.ui.define(["sap/ui/core/mvc/Controller", "sap/m/MessageBox", "./AnnotationHelper", "sap/base/util/each"], function (MVCController, MessageBox, AnnotationHelper, each) {
    "use strict";

    var BaseController = MVCController.extend("sap.suite.ui.generic.template.js.QuickTemplates.QuickActionBaseController", {

            onInit: function() {
                if (!this._bIsInitialized) {
                    this._bIsInitialized = true;
                    this.oComponent = this.getOwnerComponent() || this.getView().getViewData().component;
                    var oView = this.getView();
                    oView.setModel(this.oComponent.getModel());
                    this.sEntitySet = this.oComponent.getEntitySet();

                    this.oDraftController = this.oComponent.getTransactionController().getDraftController();
                    this.bDraftEnabled = this.oDraftController.getDraftContext().isDraftEnabled(this.sEntitySet);

                    var oMetaModel = this.getView().getModel().getMetaModel();

                    this.oEntitySetMeta = oMetaModel.getODataEntitySet(this.sEntitySet);
                    this.oEntityTypeMeta = oMetaModel.getODataEntityType(this.oEntitySetMeta.entityType);

                    this.oSmartFieldEventDelegate = {
                        onAfterRendering: function (oEvent) {
                            this._onSmartFieldAfterRendering(oEvent);
                        }.bind(this)
                    };
                }
            },

            _onMetaModelLoaded: function() {
                // redefine in subclass for initialization logic after meta data is available
            },

            _onSmartFieldAfterRendering: function(oEvent) {
              // redefine if controller needs to react to smart fields being created
            },

            onBeforeRendering: function () {
                if (!this._bMetaDataInit) {
                    this._bMetaDataInit = true;
                    this.getView().getModel().getMetaModel().loaded().then(this._onMetaModelLoaded.bind(this), this.onError.bind(this));
                }
                this.setBusy(false);
            },

            setBusy: function(bBusy) {
                if (this.getView().getModel("ui")) {
                    this.getView().getModel("ui").setProperty("/busy", bBusy);
                    this.getView().getModel("ui").updateBindings();
                }
            },

            bindView: function (oContext) {
                var oInterface = this._getFormatterInterface(oContext);

                var expandParam = AnnotationHelper.formatExpandBindingPathForHeaderObject(oInterface, this.oEntityTypeMeta.namespace + "." + this.oEntityTypeMeta.name);

                this.oContext = oContext;

                this.getView().bindElement({
                   path: oContext.getPath(),
                   parameters: {
                      expand: expandParam
                   }
                });

            },

            onError: function (oError) {
                this.setBusy(false);
                if (oError.message) {
                    this._showErrorMessage(oError);
                } else if (oError.response) {
                    this._showErrorMessage(oError.response);
                } else {
                    this._showErrorMessage({message: this.formatI18NMessage("QuickAction_Generic_Error")});
                }
            },

            onSmartFieldsCreated: function (oEvent) {
                var control = oEvent.getParameters()[0];
                if (control && typeof control.addEventDelegate === 'function') {
                    control.removeEventDelegate(this.oSmartFieldEventDelegate);
                    control.addEventDelegate(this.oSmartFieldEventDelegate);
                }
            },


            // used by XML views
            formatI18NMessage: function() {
                if (arguments && arguments[0]) {
                    var sI18N = arguments[0];

                    var resBundle = this.getView().getModel("i18n").getResourceBundle();

                    if (arguments.length > 1) {
                        var args = Array.prototype.slice.call(arguments);
                        return resBundle.getText(sI18N, args.splice(1, arguments.length - 1));
                    }
                    return resBundle.getText(sI18N);
                }

                return arguments;
            },

            _getFormatterInterface: function(oContext) {
                var context = oContext ? oContext : this.getView().getBindingContext();
                return AnnotationHelper.createFormatterInterface(context);
            },

            _setBindingContext: function(oContext) {
                this.getView().setBindingContext(oContext);
                this.setBusy(false);
            },

            _showErrorMessage: function (oError) {
                var error = oError.response || oError;
                var sDetails = error.message;
                if (error.statusText) {
                    sDetails = error.statusText;
                }
                if (error && error.responseText) {
                    try {
                        var oErrObj = JSON.parse(error.responseText);
                        var sErrDetail = this._getErrorDetail(oErrObj);
                        sDetails = (sErrDetail && sErrDetail.length > 0) ? sErrDetail : sDetails;
                    } catch (exc) {
                        // not a valid JSON string
                    }
                }
                //return details;
                MessageBox.show(sDetails, {
                        icon: MessageBox.Icon.ERROR,
                        title: this.formatI18NMessage("QuickAction_Error_Popover"),
                        actions: [MessageBox.Action.OK]
                    }
                );
            },

            _displaySeverity : function(errorSeverity) {
                var errorSeverityI18N;
               switch (errorSeverity) {
                   case "error":
                       errorSeverityI18N = "Error_Severity_Error";
                       break;
                   case "abort":
                       errorSeverityI18N = "Error_Severity_Abort";
                       break;
                   case "warning":
                       errorSeverityI18N = "Error_Severity_Warning";
                       break;
                   case "info":
                       errorSeverityI18N = "Error_Severity_Info";
                       break;
                   case "termination":
                       errorSeverityI18N = "Error_Severity_Termination";
                       break;
                   case "success":
                       errorSeverityI18N = "Error_Severity_Success";
                       break;
                   }
                   return errorSeverityI18N;
               },

            _getErrorDetail: function (oErrObj) {
                var sDetails = "";
                if (oErrObj && oErrObj.error && oErrObj.error.message) {
                    if (oErrObj.error.innererror && oErrObj.error.innererror.errordetails && oErrObj.error.innererror.errordetails.length > 0) {
                        each(oErrObj.error.innererror.errordetails, function (i, errorDetail) {
                            sDetails += errorDetail.message + '\n';
                        });
                    } else if (oErrObj.error.message.value) {
                        sDetails = oErrObj.error.message.value;
                    }
                }
                return sDetails;
            }


        });


        return BaseController;

}, /* bExport= */true);
