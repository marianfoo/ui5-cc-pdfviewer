sap.ui.define([
    "sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, JSONModel) {
        "use strict";

        return Controller.extend("pdfviewer.controller.Main", {
            onInit: function() {
                this.getView().setModel(new JSONModel({
                    pdfsource: ""
                }));
            },
            onFileChange: function(oEvent) {
                var reader = new FileReader(),
                    me = this;
                reader.onload = function(oEvent){
                    me.getView().getModel().setProperty("/pdfsource", oEvent.target.result);
                };
                reader.readAsDataURL(oEvent.getParameter("files")[0]);
            },
            onOpenPDFViewer:function(oEvent){
                if (! this._oDialog) {
                    this._oDialog = sap.ui.xmlfragment("pdfviewer.view.fragment.PDFViewer", this);
                    this.getView().addDependent(this._oDialog);
                }
                this._oDialog.open();
            },
            onClose:function(oEvent){
                if(this._oDialog){
                    this._oDialog.close();
                }
            }
        });
    });
