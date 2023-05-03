
/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
  'sap/ui/model/json/JSONModel',
  'sap/ui/model/resource/ResourceModel',
  "../base/Base.controller",
  "../CardHelper",
  "sap/m/MessageToast",
  "sap/base/Log"
], function (
  JSONModel,
  ResourceModel,
  BaseController,
  CardHelper,
  MessageToast,
  Log
) {
  "use strict";

  var oLogger = Log.getLogger("sap.insights.CardHelper");
  return BaseController.extend('sap.insights.copy.Copy', {
    onInit: function () {
      this._oCopyCardViewModel = new JSONModel({
        oOrgCard: {},
        oCard: {},
        aCards: []
      });
      this.getView().setModel(this._oCopyCardViewModel, "copyCardView");
      var I18_BUNDLE = sap.ui.getCore().getLibraryResourceBundle("sap.insights");
      this.getView().setModel(new ResourceModel({ bundle: I18_BUNDLE }), "i18n");
      this.i18Bundle = this.getView().getModel("i18n").getResourceBundle();
      this.smartFormEditable = true;
    },
    _getCopyCardPage: function () {
      return this.getView().byId('copyCardPage');
    },
    initCopyCard: function(oCard) {
      var sCardId = oCard.descriptorContent["sap.app"].id;
      if (this.oDraftCardParams) {
        this.oDraftCardParams[sCardId] = {};
      }
      CardHelper.getServiceAsync().then(function (oService) {
        return oService.getUserCards().then(function (aCards) {
          this._oCopyCardViewModel.setProperty("/aCards", aCards);
        }.bind(this));
      }.bind(this));

      var oOrgCard = oCard;
      this._oCopyCardViewModel.setProperty("/oOrgCard", oOrgCard);
      var oCopyCard = JSON.parse(JSON.stringify(oOrgCard));   // Deep copy original card
      this._oCopyCardViewModel.setProperty("/oCard", oCopyCard);
      var oContext = this._oCopyCardViewModel.createBindingContext("/oCard");
      this.byId("copyCardPreview").refresh();
      this.getView().byId("copyCardPage").setBindingContext(oContext, "copyCardView");
      this._setSmartFormForCopyCard(oCard);
    },
    handleCopyCardDialogCancel: function () {
      this.byId("CopyCardsEditTitleField").setValueState("None");
      this.isCopyCardDialogOpen = false;
      this._getCopyCardPage().close();
    },
    _setSmartFormForCopyCard: function (oCard) {
      this.byId("copyCardSmartForm").removeAllItems();
      this._setSmartFormForCardEdit(oCard);
    },
    _handleCardPreviewPress: function (oEvent) {
      if (this._oCopyCardViewModel.getProperty("/oCard").descriptorContent["sap.card"].header.title) {
        var oCard = this._mergeDraftParamsIncard(this._oCopyCardViewModel.getProperty("/oCard"));
        this._oCopyCardViewModel.setProperty("/oCard", oCard);
        this._oCopyCardViewModel.refresh();
        this.byId("copyCardPreview").refresh();
      }
    },
    handleCardsInputChange: function (oEvent) {
      var oInput = oEvent.getSource(),
        sValue = oInput.getValue(),
        sId = oInput.getId();

      if (sId && sId.includes("CopyCardsEditTitleField")) {
        if (!sValue) {
          oInput.setValueState("Error");
        }else {
          oInput.setValueState("None");
        }
        this._oCopyCardViewModel.getProperty("/oCard").descriptorContent["sap.card"].header.title = sValue;
      } else if (sId && sId.includes("CopyCardsEditSubTitleField")) {
        this._oCopyCardViewModel.getProperty("/oCard").descriptorContent["sap.card"].header.subTitle = sValue;
      }
    },
    handleCardCopyPress: function () {
      var oSmartFormContainer = this.byId("copyCardSmartForm"),
        oSmartForm = oSmartFormContainer && oSmartFormContainer.getItems()[0];
      if (oSmartForm && !oSmartForm.getSmartFields().some(function (oSmartField) { return oSmartField.checkClientError({ handleSuccess: true }); })) {
        if (this._oCopyCardViewModel.getProperty("/oCard").descriptorContent["sap.card"].header.title) {
          this._getCopyCardPage().setBusy(true);
          var oOriginalCard = this._oCopyCardViewModel.getProperty("/oOrgCard");
          var sOriginalCardId = oOriginalCard.descriptorContent["sap.app"].id;
          var oNewCard = this._oCopyCardViewModel.getProperty("/oCard");
          var sNewCardId = sOriginalCardId + "." + Date.now();
          var aCardList = this._oCopyCardViewModel.getProperty("/aCards") || [];
          // Find Highest Rank in current cards
          if (aCardList && aCardList.length) {
            var oHighestRankObj = aCardList.reduce(function (prev, current) {
              return (prev.rank > current.rank) ? prev : current;
            });
            oNewCard.descriptorContent["sap.insights"].rank = oHighestRankObj.rank + 1;
            oNewCard.rank = oHighestRankObj.rank + 1;
          }
          this.oDraftCardParams[sNewCardId] = {};
          oNewCard = this._mergeDraftParamsIncard(oNewCard);
          oNewCard.descriptorContent["sap.app"].id = sNewCardId;
          var aVisibleCards = aCardList.filter(function (oCard) {
            return oCard.visibility;
          });
          oNewCard.descriptorContent["sap.insights"].visible = aVisibleCards.length < 10 ? true : false;
          oNewCard.visibility = aVisibleCards.length < 10 ? true : false;
          oNewCard.descriptorContent["sap.insights"].parentAppId = oOriginalCard.descriptorContent["sap.insights"].parentAppId;
          oNewCard.descriptorContent["sap.insights"].isDtCardCopy = false;
          oNewCard.descriptorContent["sap.ui5"].componentName = sNewCardId;
          CardHelper.getServiceAsync().then(function (oService) {
            oService.createCard(oNewCard.descriptorContent).then(function () {
              var cardTitle = oOriginalCard.descriptorContent["sap.card"].header.title;
              var msg = this.i18Bundle.getText("copyCardSuccessMsg", cardTitle);
              MessageToast.show(msg);
              oService.getUserCardModel();
              // Navigate Back to List Page
              var cardListPage = this.getView().getParent().getPages()[0];
              this.getView().getParent().to(cardListPage);
            }.bind(this)).catch(function (oError) {
              MessageToast.show(oError.message);
            }).finally(function () {
              this._getCopyCardPage().setBusy(false);
            }.bind(this));
          }.bind(this));
        }
      } else {
        oLogger.error(this.i18Bundle.getText("cardCopyErrorMsg"));
      }
    },
    onNavBack: function() {
      this.getView().getParent().back();
    }
  });
});
