/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define(['sap/ui/core/mvc/Controller',
    'sap/ui/model/json/JSONModel',
    'sap/ui/model/resource/ResourceModel',
    "sap/m/MessageToast",
    '../CardHelper'], function (Controller, JSONModel, ResourceModel, MessageToast, CardHelper) {
        return Controller.extend('sap.insights.preview.Preview', {
            onInit: function () {
                this.getView().setModel(new JSONModel({
                    descriptor: {}
                }), "cardPreviewModel");
                this.I18_BUNDLE = sap.ui.getCore().getLibraryResourceBundle("sap.insights");
                this.getView().setModel(new ResourceModel({ bundle: this.I18_BUNDLE }), "i18n");
            },
            save: function () {
                var oCard = this.getView().getModel("cardPreviewModel").getProperty("/descriptor");
                if (oCard["sap.card"].header.title) {
                    // oCard["sap.insights"].visible = oCard["sap.insights"].visible || false;
                    oCard["sap.insights"].visible = true;
                    this._getPreviewDialog().setBusy(true);
                    CardHelper.getServiceAsync().then(function (oCardHelperServiceInstance) {
                        oCardHelperServiceInstance.createCard(oCard).then(function (oCreatedCard) {
                            MessageToast.show("Card created Successfully.");
                            this._getPreviewDialog().setBusy(false);
                            this._getPreviewDialog().close();
                        }.bind(this)).catch(function (oError) {
                            MessageToast.show(oError.message);
                            this._getPreviewDialog().setBusy(false);
                        }.bind(this));
                    }.bind(this));
                }
            },
            cancel: function () {
                this._getPreviewDialog().close();
            },
            handleTitleChange: function (oEvent) {
                var oTitleInput = oEvent.getSource();
                var sTitleText = oTitleInput.getValue();
                var oCard = this.getView().byId("insightsCard");
                if (sTitleText) {
                    oTitleInput.setValueState("None");
                    oTitleInput.setValueStateText("");
                    oCard.getCardHeader().setTitle(sTitleText);
                } else {
                    oTitleInput.setValueState("Error");
                    oTitleInput.setValueStateText(this.I18_BUNDLE.getText("INT_Preview_Title_ValueStateText"));
                }
            },
            handleSubTitleChange: function(oEvent) {
                var oSubTitleInput = oEvent.getSource();
                var sSubTitleText = oSubTitleInput.getValue();
                var oCard = this.getView().byId("insightsCard");
                oCard.getCardHeader().setSubtitle(sSubTitleText);
            },
            handleVisibilityChange: function(oEvent) {
                var oModel = this.getView().getModel("cardPreviewModel");
                var val = oEvent.getParameter("state");
                var oCard = oModel.getProperty("/descriptor");
                oCard["sap.insights"].visible = val;
                oModel.setProperty("/descriptor", oCard);
            },
            showCardSelectionDialog: function () {
                this._getPreviewDialog().close();
                var oModel = this.getView().getModel("cardPreviewModel");
                var oCard = oModel.getProperty("/descriptor");
                CardHelper.getServiceAsync("UIService").then(function (oCardUIHelperInstance) {
                    oCardUIHelperInstance._showCardSelectionDialog(oCard);
                });
            },
            _getPreviewDialog: function () {
                return this.getView().byId('previewDialog');
            },
            _onCardManifestApplied: function(oEvent) {
                var oCard = oEvent.getSource();
                oCard.attachEvent("_error", this._onCardLoadFailure.bind(this, oCard));
                oCard.attachEvent("stateChanged", this._onCardStateChanged.bind(this, oCard));
            },
            _onCardLoadFailure: function (oCard, oError) {
                if (oError && oError.getParameters()) {
                    //Error thrown if no data available as well as Internal Server error, but set bCardError only when there is error or timeout error
                    if (oError.getParameters().message && (oError.getParameters().message.includes("Internal Server Error") || oError.getParameters().message.includes('Data service unavailable. timeout'))) {
                        this.bCardError = true;
                    }
                }
            },
            _onCardStateChanged: function (oCard) {
                var oModel = this.getView().getModel("cardPreviewModel");
                if (oCard.isReady() && !this.bCardError) {
                    oModel.setProperty("/bAddButton", true);
                } else {
                    oModel.setProperty("/bAddButton", false);
                }
            },
            showPreview: function (oCard, calledInternally) {
                var oModel = this.getView().getModel("cardPreviewModel");
                return CardHelper.getServiceAsync().then(function (oCardHelperServiceInstance) {
                    return oCardHelperServiceInstance.getUserCards().then(function (aCards) {
                        var aVisibleCards = aCards.filter(function (oCard) {
                            return oCard.visibility;
                        });
                        if (aVisibleCards.length > 9) {
                            oCard["sap.insights"].visible = false;
                        }
                        oModel.setProperty("/descriptor", oCard);
                        if (!calledInternally){
                            oModel.setProperty("/bAddButton", false);
                        }
                        this.bCardError = false;
                        this._getPreviewDialog().open();
                        return Promise.resolve();
                    }.bind(this));
                }.bind(this));
            }
        });
    });
