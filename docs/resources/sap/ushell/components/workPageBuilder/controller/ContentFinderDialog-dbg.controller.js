// Copyright (c) 2009-2022 SAP SE, All Rights Reserved

/**
 * @file ContentFinder dialog controller for WorkPageBuilder view
 * @version 1.108.12
 */
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/Device",
    "sap/ui/model/json/JSONModel",
    "sap/ushell/resources",
    "sap/base/util/deepExtend",
    "sap/ui/core/Fragment",
    "sap/ushell/library",
    "sap/m/library",
    "sap/base/Log",
    "sap/base/util/ObjectPath",
    "sap/base/util/uid"
], function (
    Controller,
    Device,
    JSONModel,
    resources,
    deepExtend,
    Fragment,
    ushellLibrary,
    mobileLibrary,
    Log,
    ObjectPath,
    uid
) {

    "use strict";

    // shortcut for sap.m.FrameType
    var FrameType = mobileLibrary.FrameType;

    // shortcut for sap.ushell.AppBoxPreviewSize
    var AppBoxPreviewSize = ushellLibrary.AppBoxPreviewSize;

    /**
     * Categories to display.
     *
     * @type {object}
     */
    var oCategories = {
        applicationWidgets: {
            id: "applicationWidgets",
            title: resources.i18n.getText("ContentFinder.Categories.Applications.Title"),
            widgets: [{
                id: "widgets-tiles",
                title: resources.i18n.getText("ContentFinder.Widgets.Tiles.Title"),
                description: resources.i18n.getText("ContentFinder.Widgets.Tiles.Description"),
                icon: "sap-icon://header"
            }, {
                id: "widgets-cards",
                title: resources.i18n.getText("ContentFinder.Widgets.Cards.Title"),
                description: resources.i18n.getText("ContentFinder.Widgets.Cards.Description"),
                icon: "sap-icon://card"
            }]

        }
        // myHomeWidgets: {
        //     id: "myHomeWidgets",
        //     title: resources.i18n.getText("ContentFinder.Categories.MyHomeWidgets.Title"),
        //     widgets: [{
        //         id: "widgets-todos",
        //         title: resources.i18n.getText("ContentFinder.Widgets.ToDos.Title"),
        //         description: resources.i18n.getText("ContentFinder.Widgets.ToDos.Description"),
        //         icon: "sap-icon://multi-select"
        //     }, {
        //         id: "widgets-insights",
        //         title: resources.i18n.getText("ContentFinder.Widgets.Insights.Title"),
        //         description: resources.i18n.getText("ContentFinder.Widgets.Insights.Description"),
        //         icon: "sap-icon://idea-wall"
        //     }]
        // }
    };

    /**
     * Data for the special "All Widgets" category.
     * @type {object}
     */
    var oAllWidgetsCategory = {
        title: resources.i18n.getText("ContentFinder.Categories.AllWidgets.Title"),
        categories: Object.values(oCategories)
    };

    /**
     * Initial data to be set to the model
     * @type {object}
     */
    var oInitialData = {
        currentPageIndex: 0,
        currentBreakpoint: null,
        currentCategory: oAllWidgetsCategory,
        selectedWidget: "",
        restrictedMode: false,
        selectedAppCount: 0,
        navigation: [{
            id: "allWidgets",
            title: resources.i18n.getText("ContentFinder.Categories.AllWidgets.Title")
        }, {
            id: "applicationWidgets",
            title: resources.i18n.getText("ContentFinder.Categories.Applications.Title")
        }//, {
        //     id: "myHomeWidgets",
        //     title: resources.i18n.getText("ContentFinder.Categories.MyHomeWidgets.Title")
        // }
        ]
    };

    return Controller.extend("sap.ushell.components.workPageBuilder.controller.ContentFinderDialog", {
        /**
         * Initializes the controller instance. Only to be called once.
         */
        init: function () {
            this.oModel = new JSONModel();
            this.oModel.setData(deepExtend({}, oInitialData));
        },

        /**
         * Press handler for the Widget Types of the Widget Gallery
         *
         * @param {sap.base.Event} oEvent The selection event.
         */
        selectWidgetType: function (oEvent) {
            var sId = oEvent.getSource().getBindingContext().getProperty("id");
            if (this._isMyHomeWidget(sId)) {
                this.addWidget();
                return;
            }

            this.navigate(1, sId);
        },

        /**
         * Called once the catalog data is loaded.
         * @param {string} sId The type of widget selected.
         * @private
         */
        _onCatalogLoaded: function (sId) {
            var oEditModel = this.oWorkPageDataProvider.oWorkPageBuilderView.getModel();
            var aPreselectedWidgets = this._getPreselectedWidgets();
            var oContentFinderAppSearchData = this._prepareAppSearchModel(oEditModel.getProperty("/data/Catalog"), aPreselectedWidgets);
            oEditModel.setProperty("/data/AppSearchData/tiles", oContentFinderAppSearchData.Tiles);
            oEditModel.setProperty("/data/AppSearchData/cards", oContentFinderAppSearchData.Cards);
            oEditModel.setProperty("/data/AppSearchData/appBoxCount", sId === "widgets-tiles"
                ? oContentFinderAppSearchData.Tiles.length
                : oContentFinderAppSearchData.Cards.length);
        },


        /**
         * Returns the widgets which are already selected when in restricted mode
         *
         * @returns {object[]} aPreselectedWidgets The already selected widgets
         */
        _getPreselectedWidgets: function () {
            var aPreselectedWidgets = [];
            // If we are not in restricted mode we do not want to mark the already selected widgets
            var bRestrictedMode = this.oModel.getProperty("/restrictedMode");
            if (bRestrictedMode) {
                try {
                    var sCellDataPath = this.oWorkPageDataProvider.oCell.getBindingContext().getPath();
                    aPreselectedWidgets = this.oWorkPageDataProvider.oWorkPageBuilderView.getModel().getProperty(sCellDataPath).Widgets;
                } catch (error) {
                    Log.error("Error looking up the preselected widgets", null, "sap.ushell.components.workPageBuilder.controller.ContentFinderDialog");
                }
            }
            return aPreselectedWidgets;
        },

        /**
         * Formats the tiles and cards data for the ContentFinderAppSearch component
         *
         * @param {object[]} aCatalogData The data coming from the catalog API.
         * @param {object[]} aPreselectedWidgets The Widgets already present in the cell.
         * @return {object} The ContentFinderAppSearch data formatted in the correct structure.
         */
        _prepareAppSearchModel: function (aCatalogData, aPreselectedWidgets) {
            var oData = {};
            var aCatalogTilesData = aCatalogData.filter(function (tile) {
                return [
                    "sap.ushell.StaticAppLauncher",
                    "sap.ushell.DynamicAppLauncher"
                ].indexOf(tile.Type) > -1;
            });

            oData.Tiles = aCatalogTilesData.map(function (tile, index) {
                if (!tile.Descriptor) {
                    Log.error("No Descriptor available. Cannot load this tile!", null, "sap.ushell.components.workPageBuilder.controller.ContentFinderDialog");
                    return;
                }

                var bIsAlreadySelected = aPreselectedWidgets.some(function (widget) {
                    return widget.Visualization.Id === tile.Id;
                });

                var oTileSapUi = tile.Descriptor["sap.ui"];
                var oTileSapApp = tile.Descriptor["sap.app"];
                var oTileSapFiori = tile.Descriptor["sap.fiori"];
                var oTileSapFlp = tile.Descriptor["sap.flp"];
                var sAppID = "";

                if (oTileSapFiori) {
                    sAppID = oTileSapFiori.registrationIds[0];
                } else if (oTileSapApp && oTileSapApp.hasOwnProperty("id")) {
                    sAppID = oTileSapApp.id;
                }

                return {
                    id: tile.Id,
                    appId: sAppID,
                    icon: ObjectPath.get("icons.icon", oTileSapUi) || "",
                    info: oTileSapApp && oTileSapApp.info || "",
                    launchUrl: oTileSapFlp && oTileSapFlp.target || "",
                    previewSize: AppBoxPreviewSize.Small,
                    posinset: index + 1,
                    setsize: aCatalogTilesData.length,
                    subtitle: oTileSapApp && oTileSapApp.subTitle || "",
                    title: oTileSapApp && oTileSapApp.title || "",
                    type: tile.Type,
                    frameType: FrameType.OneByOne,
                    catalogData: tile,
                    selected: bIsAlreadySelected,
                    disabled: bIsAlreadySelected
                };
            });

            var aCatalogCardsData = aCatalogData.filter(function (tile) {
                return tile.Type === "sap.card";
            });

            oData.Cards = aCatalogCardsData.map(function (card, index) {
                if (!card.Descriptor) {
                    Log.error("No Descriptor available. Cannot load this card!", null, "sap.ushell.components.workPageBuilder.controller.ContentFinderDialog");
                    return;
                }

                var oCardSapApp = card.Descriptor["sap.app"];
                var oCardSapUi = card.Descriptor["sap.ui"];
                var sAppID = oCardSapApp && oCardSapApp.id || "";

                return {
                    id: card.Id,
                    appId: sAppID,
                    icon: ObjectPath.get("icons.icon", oCardSapUi) || "",
                    info: oCardSapApp && oCardSapApp.info || "",
                    previewSize: AppBoxPreviewSize.Large,
                    posinset: index + 1,
                    setsize: aCatalogCardsData.length,
                    subtitle: oCardSapApp && oCardSapApp.subTitle || "",
                    title: oCardSapApp && oCardSapApp.title || "",
                    type: card.Type,
                    manifest: card.Descriptor,
                    catalogData: card
                };
            });
            return oData;
        },

        /**
         * Initializes the model for the ContentFinderAppSearch Component.
         *
         * @param {string} sType The selected widget type.
         * @return {object} Initial ContentFinderAppSearch component model
         */
        _prepareContentFinderModel: function (sType) {
            var o18nModel = resources.i18nModel.getResourceBundle();

            return {
                type: sType,
                CurrentSelectedTreeNode: sType === "tiles" ? "All Tiles" : "All Cards",
                selectedAppCount: 0,
                showSelectedPressed: false,
                selectAllBtnPressed: false,
                tilePreviewShown: false,
                cardPreviewShown: false,
                hasSelectables: sType === "tiles",
                appBoxCount: 0,
                tiles: [],
                cards: [],
                tree: [
                    {
                        title: sType === "tiles"
                            ? o18nModel.getText("ContentFinder.CategoryTree.Row.AllTiles")
                            : o18nModel.getText("ContentFinder.CategoryTree.Row.AllCards")
                    }
                ]
            };
        },

        /**
         * Triggers navigation within the ContentFinder Dialog
         *
         * @param {int} iPageIndex The index of the target page
         * @param {string} [sWidgetType] The widget type in case the target is the WidgetSelectionPage
         *
         * @private
         * @since 1.107.0
         */
        navigate: function (iPageIndex, sWidgetType) {
            switch (iPageIndex) {
                case 0:
                    this._navigateToCategoryPage();
                    break;
                case 1:
                    this._navigateToWidgetSelectionPage(sWidgetType);
                    break;
                default:
                    Log.error("Invalid page index provided for navigation", null, "sap.ushell.components.workPageBuilder.controller.ContentFinderDialog");
            }
        },

        /**
         * Navigates to the category selection page.
         */
        _navigateToCategoryPage: function () {
            this.oModel.setProperty("/selectedWidget", "");
            this.oModel.setProperty("/selectedAppCount", 0);
            this._oNavContainer.to(this._oCategorySelectionPage);
        },

        /**
         * Navigates to the widget selection page.
         * To prepare the relevant data the AppSearchData in the Model of the WorkPageBuilder is updated with the available control types of the selected Widget Type (@see _prepareContentFinderModel).
         * Afterwards an Event is fired to trigger a data update from WorkPage side. (loadCatalog)
         * Finally the WorkPageBuilder updates its model. The ContentFinder listens to the models propertyChange event to receive and display the relevant widgets.
         *
         * @param {string} sWidgetType The type of the widgets to be included on the page. Possible values are "widgets-tiles" and "widgets-cards"
         * @private
         * @since 1.107.0
         */
        _navigateToWidgetSelectionPage: function (sWidgetType) {
            var aCatalogData;

            if (sWidgetType === "widgets-tiles") {
                aCatalogData = ["sap.ushell.StaticAppLauncher", "sap.ushell.DynamicAppLauncher"];
            } else if (sWidgetType === "widgets-cards") {
                aCatalogData = ["sap.card"];
            } else {
                Log.error("_navigateToWidgetSelectionPage: Invalid Widget type provided: " + sWidgetType, null, "sap.ushell.components.workPageBuilder.controller.ContentFinderDialog");
                return;
            }

            this.oContentFinderData = this._prepareContentFinderModel(sWidgetType === "widgets-tiles" ? "tiles" : "cards");
            this.oModel.setProperty("/selectedWidget", sWidgetType);

            var oEditModel = this.oWorkPageDataProvider.oWorkPageBuilderView.getModel();
            oEditModel.setProperty("/data/AppSearchData", this.oContentFinderData);
            oEditModel.attachEventOnce("propertyChange", this._onCatalogLoaded.bind(this, sWidgetType));

            this.oWorkPageDataProvider.oWorkPageBuilderView.getController().getOwnerComponent().fireEvent("loadCatalog", aCatalogData);

            // Workaround to try and reset the filters of the Widget Selection Page
            // Normally a simple Router event listener would be sufficient but since we
            // use a nested view with a NavContainer at the moment it is not possible to
            // use such an approach. Try/Catch to make sure we don't crash here in case
            // the component instance is not yet available or other issued with the LifeCycle of the WidgetSelection page
            try {
                var oComponentInstance = this._oWidgetSelectionPage.getContent()[0].getComponentInstance();
                if (oComponentInstance) {
                    oComponentInstance.getRootControl().getController().resetFilters();
                }
            } catch (e) {
                // No need for error handling. We assume this is the first navigation and therefor no filters can be set at this point
            }

            this._oNavContainer.to(this._oWidgetSelectionPage, {
                type: sWidgetType
            });
        },

        /**
         * Called after navigation in the NavContainer occurred.
         * Writes the index of the current page to the model.
         */
        afterNavigate: function () {
            var iIndex = this._oNavContainer.indexOfPage(this._oNavContainer.getCurrentPage());
            this.oModel.setProperty("/currentPageIndex", iIndex);
        },

        /**
         * The connect function allows to pass some external values into the dialog controller.
         * Should be called each time the dialog is opened.
         *
         * @param {string} sFragmentId The id of the fragment for the dialog.
         * @param {sap.ui.core.Control} oDialog The dialog control.
         * @param {object} oWorkPageDataProvider The WorkPageRuntime Controller object.
         * @param {object} oConfig Options to influence the ContentFinderDialog. See list below.
         * @param {int} oConfig.iCurrentPageIndex The index of the page to open in the NavContainer.
         * @param {string} [oConfig.sWidgetType] In case iCurrentPageIndex is 1 this indicates the application type. Possible values: 'widgets-tiles' and 'widgets-cards'
         * @param {boolean} [oConfig.bRestrictedMode=false] Indicated if the dialog should start in restricted mode. Only works when iCurrentPageIndex is not 0
         */
        connect: function (sFragmentId, oDialog, oWorkPageDataProvider, oConfig) {
            var bRestrictedMode = oConfig.iCurrentPageIndex !== 0 ? !!oConfig.bRestrictedMode : false;
            this.oModel.setProperty("/restrictedMode", bRestrictedMode);
            this._sFragmentId = sFragmentId;
            this._oDialog = oDialog;
            this._oDynamicSideContent = this._getDynamicSideContent();
            this._oNavContainer = this._getNavContainer();
            this._oCategorySelectionPage = this._oNavContainer.getPage(this._getScopedId("sapCepContentFinderCategoryPage"));
            this._oWidgetSelectionPage = this._oNavContainer.getPage(this._getScopedId("sapCepContentFinderWidgetPage"));
            this._oDialog.setModel(this.oModel);
            this._oDialog.setModel(resources.i18nModel, "i18n");
            this._oDialog.addStyleClass(Device.support.touch ? "sapUiSizeCozy" : "sapUiSizeCompact");
            this.oWorkPageDataProvider = oWorkPageDataProvider;
            this._setInitialPage(oConfig.iCurrentPageIndex, oConfig.sWidgetType);
        },

        /**
         * Called if the "Add" button is pressed.
         */
        addWidget: function () {
            var sSelectedWidget = this.oModel.getProperty("/selectedWidget");
            var iSelectedAppCount = this.oModel.getProperty("/selectedAppCount");

            if (!this._isMyHomeWidget(sSelectedWidget) && iSelectedAppCount > 0) {
                var bRestrictedMode = this.oModel.getProperty("/restrictedMode");
                var oModel = this.oWorkPageDataProvider.oWorkPageBuilderView.getModel();
                var aContentFinderTiles = this.oContentFinderAppSearchView.getModel().getProperty("/data/AppSearchData/tiles");
                var aContentFinderSelectedTiles = aContentFinderTiles.filter(function (tile) {
                        return tile.selected && !tile.disabled;
                    });

                aContentFinderSelectedTiles.forEach(function (selectedTile) {
                    var sVizSelectedItemPath = this.oWorkPageDataProvider.sVizRootPath + "/" + selectedTile.catalogData.Id;
                    if (!oModel.getProperty(sVizSelectedItemPath)) {
                        oModel.setProperty(sVizSelectedItemPath, selectedTile.catalogData);
                    }
                }.bind(this));

                var aWidgetData = aContentFinderSelectedTiles.map(function (tile) {
                    return {
                        Id: uid(),
                        Descriptor: {},
                        Visualization: {
                            Id: tile.catalogData.Id
                        }
                    };
                });

                if (bRestrictedMode) {
                    this._setCellData(aWidgetData);
                } else {
                    this._setColumnData(aWidgetData);
                }
            }
            this.close();
        },

        /**
         * Called if the "Add" button is pressed.
         * @param {sap.ui.base.Event} oEvent Card press Event object.
         */
        addCardSelected: function (oEvent) {
            var oSelectedCard = oEvent.getParameters().getSource().getBindingContext().getObject().catalogData;
            var oModel = this.oWorkPageDataProvider.oWorkPageBuilderView.getModel();
            var sVizSelectedItemPath = this.oWorkPageDataProvider.sVizRootPath + "/" + oSelectedCard.Id;

            if (!oModel.getProperty(sVizSelectedItemPath)) {
                oModel.setProperty(sVizSelectedItemPath, oSelectedCard);
            }

            var aWidgetData = [{
                Id: uid(),
                Descriptor: {},
                Visualization: {
                    Id: oSelectedCard.Id
                }
            }];

            this._setColumnData(aWidgetData);
            this.close();
        },

        /**
         * Adds the cards/tiles to the WorkPage column
         * @param {object[]} aWidgetData Array of widgets to be added to the WorkPage column.
         */
        _setColumnData: function (aWidgetData) {
            var oColumn = this.oWorkPageDataProvider.oColumn;
            if (!oColumn) {
                // Nothing to do if we don't have a Column
                return;
            }
            var oModel = this.oWorkPageDataProvider.oWorkPageBuilderView.getModel();
            var sColumnPath = oColumn.getBindingContext().getPath();
            var oColumnData = oModel.getProperty(sColumnPath);

            if (!oColumnData.Cells) {
                oColumnData.Cells = [];
            }

            oColumnData.Cells.push({
                Id: uid(),
                Widgets: aWidgetData
            });

            oModel.setProperty(sColumnPath, oColumnData);
            if (this.oWorkPageDataProvider.fnOnWidgetAdded) {
                this.oWorkPageDataProvider.fnOnWidgetAdded(); // inform the consumer to set dirty state
            }
        },

        /**
         * Adds the provided Widgets to the cell provided when the Dialog was created
         *
         * @param {object[]} aWidgetData The Widgets to be added to the cell
         *
         * @private
         * @since 1.107.0
         */
        _setCellData: function (aWidgetData) {
            var oCell = this.oWorkPageDataProvider.oCell;
            if (!oCell) {
                // Nothing to do if we don't have a Cell
                return;
            }

            var oModel = this.oWorkPageDataProvider.oWorkPageBuilderView.getModel();
            var sCellPath = oCell.getBindingContext().getPath();

            // The CellData object needs to be cloned and the Widgets array needs to be a new reference
            // otherwise the cell will not get rerendered which will lead to a missing button to delete the tile
            var oCellData = Object.assign({}, oModel.getProperty(sCellPath));
            oCellData.Widgets = oCellData.Widgets.concat(aWidgetData);

            oModel.setProperty(sCellPath, oCellData);
            if (this.oWorkPageDataProvider.fnOnWidgetAdded) {
                this.oWorkPageDataProvider.fnOnWidgetAdded(); // inform the consumer to set dirty state
            }
        },

        /**
         * Called if the "Cancel" button is pressed.
         */
        close: function () {
            this._oDialog.close();
        },

        /**
         * Called after the dialog closes. Re-sets the model data.
         */
        afterClose: function () {
            this.oModel.setData(deepExtend({}, oInitialData));
        },

        /**
         * Sets the initial page that should be opened when the dialog opens.
         *
         * @param {int} iCurrentPageIndex The index of the page to be opened.
         * @param {string} [sWidgetType] In case iCurrentPageIndex is 1 this indicates the WidgetType. Possible values: 'widgets-tiles' and 'widgets-cards'
         * @private
         */
        _setInitialPage: function (iCurrentPageIndex, sWidgetType) {
            var iInitialPageIndex = [0, 1].indexOf(iCurrentPageIndex) > -1 ? iCurrentPageIndex : 0;

            if (iInitialPageIndex === 1 && sWidgetType !== "widgets-tiles" && sWidgetType !== "widgets-cards") {
                Log.error(
                    "Initial page is WidgetSelectionPage but no widget type was provided. Navigating to Widget Gallery instead.",
                    null,
                    "sap.ushell.components.workPageBuilder.controller.ContentFinderDialog"
                );
                iInitialPageIndex = 0;
            }

            this.navigate(iInitialPageIndex, sWidgetType);
            this.oModel.setProperty("/currentPageIndex", iInitialPageIndex);
        },

        /**
         * Toggles the dynamic side content if the dialog is on breakpoint "S".
         */
        handleToggle: function () {
            if (this.oModel.getProperty("/currentPageIndex") === 0) {
                this._oDynamicSideContent.toggle();
            } else if (this.oModel.getProperty("/currentPageIndex") === 1) {
                this.oContentFinderAppBoxDynamicSideControl.toggle();
            }
        },

        /**
         * Returns the NavContainer control.
         *
         * @return {sap.m.NavContainer|null} The NavContainer control.
         * @private
         */
        _getNavContainer: function () {
            return sap.ui.getCore().byId(this._getScopedId("sapCepContentFinderNavContainer"));
        },

        /**
         * Returns the DynamicSideContent control.
         *
         * @return {sap.m.NavContainer|null} The NavContainer control.
         * @private
         */
        _getDynamicSideContent: function () {
            return sap.ui.getCore().byId(this._getScopedId("sapCepContentFinderDynamicSideContent"));
        },

        /**
         * Returns the AddButton control.
         *
         * @return {sap.m.button} The Add button.
         * @private
         */
        _getAddButton: function () {
            return sap.ui.getCore().byId(this._getScopedId("sapCepContentFinderAddButton"));
        },

        /**
         * Returns an ID scoped to the namespace of the dialog.
         *
         * @param {string} sId The ID to scope.
         * @return {string} The scoped ID.
         * @private
         */
        _getScopedId: function (sId) {
            return Fragment.createId(this._sFragmentId, sId);
        },

        /**
         * Determines if the provided ID belongs to a MyHome widget
         *
         * @param {string} sId The widget id
         * @returns {boolean} true if MyHome widget is detected; false otherwise
         * @since 1.107.0
         * @private
         */
        _isMyHomeWidget: function (sId) {
            // MyHome Widgets are currently disabled, hence no such section exists in oCategories
            if (!oCategories.myHomeWidgets) {
                return false;
            }

            return oCategories.myHomeWidgets.widgets.some(function (widget) {
                return widget.id === sId;
            });
        },

        /**
        * Called when the ContentFinderAppSearch Component is created.
        *
        * @param {sap.base.Event} oEvent The ComponentCreated event object.
        */
        onAppBoxContainerCreated: function (oEvent) {
            var oContentFinderAppSearchComponent = oEvent.getSource().getComponentInstance();
            var oEditModel = this.oWorkPageDataProvider.oWorkPageBuilderView.getModel();
            this.oContentFinderAppSearchView = oEvent.getSource().getComponentInstance().getRootControl();
            this.oContentFinderAppBoxDynamicSideControl = sap.ui.getCore().byId(this.oContentFinderAppSearchView.getId() + "--ContentFinderAppSearchDynamicSideContent");

            if (this.oContentFinderData) {
                this.oContentFinderAppSearchView.setModel(oEditModel);
                this.oContentFinderAppSearchView.bindObject({ path: "/data/AppSearchData" });
            }
            oContentFinderAppSearchComponent.attachEvent("cardSelected", this.addCardSelected.bind(this));
        },

        /**
        * Formatter for Dialog Title.
        *
        * @param {int} iCurrentPageIndex Current Page Index.
        * @param {string} sSelectedWidget Selected Widget Type.
        * @return {string} The Dialog Title.
        * @since 1.106.0
        */
        titleFormatter: function (iCurrentPageIndex, sSelectedWidget) {
            if (iCurrentPageIndex === 0) {
                return resources.i18n.getText("ContentFinder.Dialog.Title");
            }
            if (sSelectedWidget === "widgets-tiles") {
                return resources.i18n.getText("ContentFinder.Dialog.AddTiles.TitleLabel");
            }
            return resources.i18n.getText("ContentFinder.Dialog.AddCards.TitleLabel");
        }
    });
});
