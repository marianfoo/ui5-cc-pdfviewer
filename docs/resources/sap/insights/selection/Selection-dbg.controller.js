/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define(
    [
        'sap/ui/model/resource/ResourceModel',
        '../CardHelper',
        "sap/m/MessageBox",
        "sap/m/MessageToast",
        "../base/Base.controller",
        "sap/ui/model/Filter",
        "sap/ui/model/FilterOperator",
        "sap/base/util/UriParameters",
        "sap/m/FormattedText",
        "sap/m/Link"
    ],
    function (
        ResourceModel,
        CardHelper,
        MessageBox,
        MessageToast,
        BaseController,
        Filter,
        FilterOperator,
        UriParameters,
        FormattedText,
        Link
    ) {
        var DEFAULT_CARD_RANK = 500;
        return BaseController.extend('sap.insights.selection.Selection', {
            onInit: function () {
                var I18_BUNDLE = sap.ui.getCore().getLibraryResourceBundle("sap.insights");
                this.getView().setModel(new ResourceModel({ bundle: I18_BUNDLE }), "i18n");
                this.i18Bundle = this.getView().getModel("i18n").getResourceBundle();
                this.oNavCon = this.getView().byId("selectionNavCon");
                this.oNavCon.setBusy(true);
                /* Todo: Move this to onBeforeRendering (Currently as it's not getting binded to DOM, onBeforeRendering or onAfterRendering is not triggered) */
                this.initUserCards();
            },
            showSelectionDialog: function (oCard) {
                this.orgCard = oCard;
                this.getView().getModel("view").setProperty("/selectionDialogOpen", true);
                this._getSelectionDialog().open();
            },
            _getSelectionDialog: function () {
                return this.getView().byId('insightsSelectionDialog');
            },
            _getSelectionFragment: function () {
                return this.getView().byId("flexContainerCardsContent");
            },
            _getCardListPage: function () {
                return this.getView().byId("insightCardPage");
            },
            _getPreviewPage: function () {
                return this.getView().byId("previewPage");
            },
            closeDialog: function () {
                CardHelper.getServiceAsync("UIService").then(function (oInstance) {
                    this.oNavCon.to(this._getCardListPage());
                    this.getView().getModel("view").setProperty("/selectionDialogOpen", false);
                    this._getSelectionDialog().close();
                    oInstance.showCardPreview(this.orgCard, true);
                }.bind(this));
            },
            handleCardListItemPress: function (oEvent, oDynCard) {
                var oModel = this.getView().getModel("view");
                if (oEvent) {
                    this.currentCardPreviewPath = oEvent.getSource().getBindingContextPath();
                } else if (oDynCard) {
                    this.currentCardPreviewPath = oDynCard.getBindingContextPath();
                }
                var cardTitle = oModel.getProperty(this.currentCardPreviewPath).descriptorContent["sap.card"].header.title;
                oModel.setProperty("/selectedCardTitle", cardTitle);
                var oPage = this.getView().byId("previewPage");
                this.oNavCon.to(oPage);

                var oContext = oModel.createBindingContext(this.currentCardPreviewPath);
                this.byId("previewCard").setBindingContext(oContext, "view");
                this.byId("insightsPreviewOverflowLayer").setBindingContext(oContext, "view");
                var oFormElement = this.byId("smartForm");
                oFormElement.removeAllItems();
                this._setSmartFormForCardEdit(oModel.getProperty(this.currentCardPreviewPath));
                this.oCardHelperServiceInstance.getParentAppDetails(oModel.getProperty(this.currentCardPreviewPath)).then(function(oParentAppDetails) {
                    oModel.setProperty("/parentAppTitle", oParentAppDetails.title);
                    oModel.setProperty("/parentAppUrl", oParentAppDetails.semanticURL);
                    oModel.setProperty("/parentAppsectionVisible", this.getIsNavigationEnabled(oParentAppDetails));
                }.bind(this));
            },
            setCopyVisible: function (oManifest) {
                var oModel = this.getView().getModel("view");
                oModel.setProperty("/showCopyButton", false);
                if (oManifest) {
                    var oCardDataSource = oManifest["sap.app"].dataSources;
                    var oFilterService = oCardDataSource.filterService;
                    var uri = oFilterService && oFilterService.uri;
                    var oTempSettings = oFilterService && oFilterService.settings;
                    if (uri && oTempSettings && oTempSettings.odataVersion === "2.0") {
                        oModel.setProperty("/showCopyButton", true);
                    }
                }
            },
            handleCardVisibilityToggle: function (oEvent) {
                this._getSelectionFragment().setBusy(true);
                var oEventParameters = oEvent.getSource();
                var sPath = oEventParameters.getBindingContext("view").getPath();
                var oCard = this.getView().getModel("view").getProperty(sPath);
                var bToggleValue = oEventParameters.getSelected();
                oCard.visibility = bToggleValue;
                oCard.descriptorContent["sap.insights"].visible = bToggleValue;
                this.setSelectedCards();
                this.oCardHelperServiceInstance.updateCard(oCard.descriptorContent).then(function () {
                    this._getSelectionFragment().setBusy(false);
                }.bind(this)).catch(function (oError) {
                    oCard.visibility = !bToggleValue;
                    oCard.descriptorContent["sap.insights"].visible = !bToggleValue;
                    this.getView().getModel("view").refresh();
                    this._getSelectionFragment().setBusy(false);
                    MessageToast.show(oError.message);
                }.bind(this));
            },
            setSelectedCards: function () {
                var insightsCardsListTable = this.byId("insightsCardsListTable");
                if (insightsCardsListTable) {
                    this.getView().getModel("view").setProperty("/visibleCardCount", this.getSelectedCards().length);
                }
            },
            onEditInsightCardsDrop: function (oEvent) {
                var oDragItem = oEvent.getParameter("draggedControl"),
                    iDragItemIndex = oDragItem.getParent().indexOfItem(oDragItem),
                    oDropItem = oEvent.getParameter("droppedControl"),
                    iDropItemIndex = oDragItem.getParent().indexOfItem(oDropItem);

                if (iDragItemIndex !== iDropItemIndex) {
                    var oCardRankObj = this._setCardsRanking(iDragItemIndex, iDropItemIndex);
                    try {
                        this._getSelectionFragment().setBusy(true);
                        this.oCardHelperServiceInstance.setCardsRanking(oCardRankObj)
                            .then(function (aUpdatedCards) {
                                var oModel = this.getView().getModel("view");
                                oModel.setProperty("/cards", aUpdatedCards);
                                oModel.setProperty("/cardCount", aUpdatedCards.length);
                                this._createOdataModelsforDialog(aUpdatedCards);
                                this.setDTCards();
                            }.bind(this))
                            .finally(function () {
                                this._getSelectionFragment().setBusy(false);
                            }.bind(this));
                    } catch (e) {
                        this._getSelectionFragment().setBusy(false);
                    }
                }
            },
            handleCardDeleteConfirm: function () {
                MessageBox.show(this.i18Bundle.getText("deleteCardMsg"), {
                    icon: MessageBox.Icon.WARNING,
                    title: this.i18Bundle.getText("delete"),
                    actions: [MessageBox.Action.DELETE, MessageBox.Action.CANCEL],
                    emphasizedAction: MessageBox.Action.DELETE,
                    onClose: function (sAction) {
                        if (sAction === MessageBox.Action.DELETE) {
                            this.handleCardDelete(this.currentCardPreviewPath);
                        }
                    }.bind(this)
                });
            },
            handleCardDelete: function (sPath) {
                var oModel = this.getView().getModel("view");
                this._getPreviewPage().setBusy(true);
                var oCard = oModel.getProperty(sPath);
                var sCardId = oCard.descriptorContent["sap.app"].id;
                var sCardTitle = oCard.descriptorContent["sap.card"].header.title;
                this.oCardHelperServiceInstance.deleteCard(sCardId).then(function () {
                    this._getPreviewPage().setBusy(false);
                    MessageToast.show(this.i18Bundle.getText("deleteCardSuccess", sCardTitle));
                    var aNewCardSet = oModel.getProperty("/cards").filter(function (oCard) {
                        return oCard.descriptorContent["sap.app"].id !== sCardId;
                    });
                    var aVisibleCards = aNewCardSet.filter(function (oCard) {
                        return oCard.visibility;
                    });
                    oModel.setProperty("/cards", aNewCardSet);
                    oModel.setProperty("/cardCount", aNewCardSet.length);
                    oModel.setProperty("/visibleCardCount", aVisibleCards.length);
                    this.setDTCards();
                    this.oNavCon.back();
                    this.setSelectedCards();

                }.bind(this)).catch(function (oError) {
                    this._getPreviewPage().setBusy(false);
                    MessageToast.show(oError.message);
                }.bind(this));
            },
            getSelectedCards: function () {
                var aCards = this.getView().getModel("view").getProperty("/cards");
                aCards = aCards.filter(function (oCard) {
                    return oCard.visibility;
                });
                return aCards;
            },
            initUserCards: function () {
                return CardHelper.getServiceAsync().then(function (oService) {
                    this.oCardHelperServiceInstance = oService;
                    return this.oCardHelperServiceInstance.getUserCardModel().then(function (userCardModel) {
                        this.getView().setModel(userCardModel, "view");
                        var aCards = this.getView().getModel("view").getProperty("/cards");
                        var iVisibleCount = 0;
                        aCards.forEach(function (oCard) {
                            if (oCard.visibility) {
                                if (++iVisibleCount > 10) {
                                    oCard.visibility = false;
                                }
                            }
                            if (oCard.rank === 0) {
                                oCard.rank = 500;
                            }
                        });
                        var oModel = this.getView().getModel("view");
                        oModel.setProperty("/selectionDialogOpen", false);
                        oModel.setProperty("/cards", aCards);
                        this.oSmartFormMap = {};
                        this._createOdataModelsforDialog(aCards);
                        this.setDTCards();
                        var bDeleteAllEnabled = this.isDeleteAllCardsEnabled();
                        oModel.setProperty("/deleteAllEnabled", bDeleteAllEnabled);
                        this.oNavCon.setBusy(false);
                        return Promise.resolve();
                    }.bind(this));
                }.bind(this));
            },
            _setCardsRanking: function (iDragIndex, iDropIndex) {
                /* Read Cards from UI for scenario of cards filtered by search field */
                var aCards = this.byId("insightsCardsListTable").getItems().map(function(oItem){
                        return oItem.getBindingContext("view").getObject();
                    }),
                    aCardsRank = [];

                var getAffectedCardsList = function (index) {
                    var iDropIndexCardRank = aCards[index].rank;
                    // If rank is custom defined rank
                    if (iDropIndexCardRank !== DEFAULT_CARD_RANK) {
                        aCardsRank.push({
                            id: aCards[index + 1].descriptorContent["sap.app"].id,
                            rank: iDropIndexCardRank + 1
                        });
                    } else { // If rank is default rank
                        aCardsRank.push({
                            id: aCards[index + 1].descriptorContent["sap.app"].id,
                            rank: null
                        });

                        if (index) {
                            getAffectedCardsList(index - 1);
                        } else {
                            aCardsRank.push({
                                id: aCards[index].descriptorContent["sap.app"].id,
                                rank: null
                            });
                        }
                    }
                };

                var setRankForAffectedCards = function () {
                    aCardsRank.forEach(function (oCard, index) {
                        if (index === 0) {
                            // If 1st card has no rank value assign 1
                            if (!oCard.rank) {
                                aCardsRank[index].rank = 1;
                            }
                        } else {
                            oCard.rank = aCardsRank[index - 1].rank + 1; // For other cards set previous card rank + 1
                        }
                    });
                };

                // If dropped index card has custom defined rank
                var iDropIndexCardRank = aCards[iDropIndex].rank;
                if (iDropIndexCardRank !== DEFAULT_CARD_RANK) {
                    if (iDragIndex < iDropIndex) {
                        aCardsRank.push({
                            id: aCards[iDragIndex].descriptorContent["sap.app"].id,
                            rank: iDropIndexCardRank + 1
                        });
                    } else {
                        aCardsRank.push({
                            id: aCards[iDragIndex].descriptorContent["sap.app"].id,
                            rank: iDropIndexCardRank
                        });
                    }

                } else { // If dropped index Card has default rank
                    if (iDropIndex === 0) {   // On Dropping on 1st element
                        aCardsRank.push({
                            id: aCards[iDragIndex].descriptorContent["sap.app"].id,
                            rank: 1
                        });
                    } else {
                        var removedCard = aCards.splice(iDragIndex, 1);
                        aCards.splice(iDropIndex, 0, removedCard[0]);
                        getAffectedCardsList(iDropIndex - 1);
                        aCardsRank.reverse();
                        setRankForAffectedCards();
                        aCardsRank.reverse();
                    }
                }
                return {
                    "Ranking": aCardsRank
                };
            },
            onNavBack: function () {
                this.oNavCon.back();
            },
            navigateToCopyCard: function () {
                var oPage = this.getView().byId("insightsCopyCardView");
                var oCard = this.getView().getModel("view").getProperty(this.currentCardPreviewPath);
                this.oNavCon.to(oPage);
                oPage.getController().initCopyCard(oCard);
            },
            onCardSearch: function (oEvent) {
                var sQuery = oEvent.getSource().getValue();
                var filter = new Filter("descriptorContent/sap.card/header/title", FilterOperator.Contains, sQuery);
                var aFilters = [];
                aFilters.push(filter);
                var oList = this.byId("insightsCardsListTable");
                var oBinding = oList.getBinding("items");
                oBinding.filter(aFilters, "Application");
            },
            refreshCardList: function () {
                var bIsDeleteAllEnable = this.isDeleteAllCardsEnabled(),
                    sContent;

                /* In case of delete all cards parameter true */
                if (bIsDeleteAllEnable) {
                    sContent = this.i18Bundle.getText("deleteAllCardsMsg");
                } else {
                    var aDTCards = this.getView().getModel("view").getProperty("/DTCards");
                    var sContentText = '<p>' + this.i18Bundle.getText("refreshAllCards") + '</p>';
                    sContentText += '<ul>';
                    aDTCards.forEach(function(oDTCard){
                        sContentText +=  '<li class="sapUiTinyMarginBottom">' + oDTCard.descriptorContent["sap.card"].header.title + '</li>';
                    });
                    sContentText += '</ul>';
                    sContent = new FormattedText({ htmlText: sContentText });
                }

                MessageBox.show(sContent, {
                    icon: MessageBox.Icon.WARNING,
                    title: this.i18Bundle.getText("refresh"),
                    actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                    emphasizedAction: MessageBox.Action.OK,
                    onClose: function (sAction) {
                        if (sAction === MessageBox.Action.OK) {
                            this.oNavCon.setBusy(true);
                            this.oCardHelperServiceInstance._refreshUserCards(bIsDeleteAllEnable).then(function(){
                                this.initUserCards();
                            }.bind(this));
                        }
                    }.bind(this)
                });
            },
            isDeleteAllCardsEnabled: function () {
                var sEnableDeleteAllCardsFlag = UriParameters.fromQuery(window.location.search).get("delete-all-cards") || "";
                return sEnableDeleteAllCardsFlag.toUpperCase() === "TRUE" ? true : false;
            },
            /* Method to allow applications to navigate to parent app of the card */
            navigateToParentApp:function() {
                var oModel = this.getView().getModel("view");
                var sUrl = oModel.getProperty("/parentAppUrl");
                sap.ushell.Container.getServiceAsync("CrossApplicationNavigation").then(function (oCrossAppNavigator) {
                    oCrossAppNavigator.toExternal({
                        target: {
                            shellHash: sUrl
                        }
                    });
                    this.oNavCon.back();
                }.bind(this));
            },
            /* Method to allow applications to navigate to any card preview */
            navigateToCardPreview:function(sCardId) {
                var oModel = this.getView().getModel("view");
                var aCards = oModel.getProperty("/cards");
                var iCardIndex = aCards.findIndex(function(oCard){
                    return oCard.descriptorContent["sap.app"].id === sCardId;
                });
                if (iCardIndex !== -1){
                    var aCardList = this.getView().byId("insightsCardsListTable").getItems();
                    this.handleCardListItemPress(null,aCardList[iCardIndex]);
                }
            },

            /* Method to check if parent app navigation is supported */
            getIsNavigationEnabled: function(oParentAppDetails) {
                return sap.ushell.Container.getServiceAsync("CrossApplicationNavigation")
                    .then(function (crossApplicationNavigationService) {
                        return crossApplicationNavigationService.isNavigationSupported([{
                            target: {
                                semanticObject: oParentAppDetails.semanticObject,
                                action: oParentAppDetails.action
                            }
                        }]);
                    })
                    .then(function(aResponses){
                        return aResponses[0].supported || false;
                    });
            },

            /* Set DT cards for refresh */
            setDTCards: function() {
                var oModel = this.getView().getModel("view");
                var aCards = oModel.getProperty("/cards");
                var aDTCards = aCards.filter(function(oCard){
                    return oCard.descriptorContent["sap.insights"].isDtCardCopy;
                });
                oModel.setProperty("/DTCards", aDTCards);
            }
        });
    });
