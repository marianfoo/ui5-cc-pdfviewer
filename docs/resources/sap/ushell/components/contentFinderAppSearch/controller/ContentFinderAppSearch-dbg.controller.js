//Copyright (c) 2009-2022 SAP SE, All Rights Reserved

/**
 * @file ContentFinderAppSearch controller for ContentFinderAppSearch view
 * @version 1.108.12
 */
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ushell/ui/contentFinder/AppBox",
    "sap/f/GridContainerItemLayoutData",
    "sap/base/Log"
], function (
    Controller,
    Filter,
    FilterOperator,
    AppBox,
    GridContainerItemLayoutData,
    Log
) {
    "use strict";

    /**
     * Controller of the ContentFinderAppSearch view.
     *
     * @param {string} sId Controller id
     * @param {object} oParams Controller parameters
     * @class
     * @assigns sap.ui.core.mvc.Controller
     * @private
     * @since 1.106.0
     * @alias sap.ushell.components.ContentFinderAppSearch.controller.ContentFinderAppSearch
     */
    return Controller.extend("sap.ushell.components.ContentFinderAppSearch.controller.ContentFinderAppSearch",
    /** @lends sap.ushell.components.ContentFinderAppSearch.controller.ContentFinderAppSearch.prototype */ {

            /**
            * The function called on after rendering the view
            * @since 1.106.0
            */
            onAfterRendering: function () {
                this.oModel = this.getView().getModel();
                this.oBindingPath = this.getView().getBindingContext().getPath();
                if (this.oModel) {
                    this.byId("overflowToolbar").setVisible(true);
                }
                if (this.getOwnerComponent().getModel()) {
                    this.oParentContentFinderDialogModel = this.getOwnerComponent().getModel();
                }
            },

            /**
             * The init function called after the view is initialized
             *
             * @since 1.107.0
             * @private
             */
            onInit: function () {
                this._oFilters = {};
            },

            /**
             * Called if the dialog is resized.
             *
             * @param {sap.base.Event} oEvent The breakpointChanged event.
             * @since 1.106.0
             */
            handleBreakpointChanged: function (oEvent) {
                // Only if the ContentFinderAppSearch view is displayed (which is currentPageIndex = 1)
                if (this.oParentContentFinderDialogModel && this.oParentContentFinderDialogModel.getProperty("/currentPageIndex") === 1) {
                    var sCurrentBreakpoint = oEvent.getParameter("currentBreakpoint");
                    this.oParentContentFinderDialogModel.setProperty("/currentBreakpoint", sCurrentBreakpoint);
                }
            },

            /**
            * Event Fired after the preview is shown.
            *
            * @param {sap.ui.base.Event} oEvent AppBox previewShown Event object.
            * @since 1.106.0
            */
            showPreview: function (oEvent) {
                if (this.oModel.getProperty(this.oBindingPath + "/type") === "tiles") {
                    this.oModel.setProperty(this.oBindingPath + "/tilePreviewShown", oEvent.getParameter("showPreview"));
                } else {
                    this.oModel.setProperty(this.oBindingPath + "/cardPreviewShown", oEvent.getParameter("showPreview"));
                }
            },

            /**
            * Called when the catalog search is triggered.
            *
            * @param {sap.ui.base.Event} oEvent SearchBox Search Event Object.
            * @since 1.106.0
            */
            // onCatalogSearch: function (oEvent) {
            //     // add filter for search
            //     var aFilters = [];
            //     var sQuery = oEvent.getSource().getValue();
            //     if (sQuery && sQuery.length > 0) {
            //         var oFilter = new Filter("title", FilterOperator.Contains, sQuery);
            //         aFilters.push(oFilter);
            //     }

            //     // update list binding CategoryTree
            //     var oList = this.byId("CategoryTree");
            //     var oBinding = oList.getBinding("items");
            //     oBinding.filter(aFilters, "Control");
            // },

            /**
            * Get the GridContainer Control.
            *
            * @return {sap.ui.layout.cssgrid.GridContainer} The GridContainer control.
            * @since 1.106.0
            */
            _getGridContainer: function () {
                if (this.oModel) {
                    return this.byId(this.oModel.getProperty(this.oBindingPath + "/type") === "tiles" ? "tileGridList" : "cardGridList");
                }
                return this.byId("tileGridList");
            },

            /**
            * Called when Tiles Search is triggered.
            *
            * @param {sap.ui.base.Event} oEvent SearchBox Search Event Object.
            * @since 1.106.0
            */
            onTileSearch: function (oEvent) {
                var sQuery = oEvent.getParameter("newValue");
                if (sQuery) {
                    this._oFilters.oSearchFilter = new Filter({
                        filters: [
                            new Filter("appId", FilterOperator.Contains, sQuery),
                            new Filter("title", FilterOperator.Contains, sQuery),
                            new Filter("subtitle", FilterOperator.Contains, sQuery),
                            new Filter("systemInfo", FilterOperator.Contains, sQuery)
                        ],
                        and: false
                    });
                    this._applyFilters();
                } else {
                    this.resetFilters(["oSearchFilter"]);
                }
            },

            /**
            * Apply the filter for the GridContainer List.
            * @since 1.106.0
            */
            _applyFilters: function () {
                var oGridContainer = this._getGridContainer();
                var oBinding = oGridContainer.getBinding("items");

                // update list binding
                oBinding.filter(new Filter({
                    filters: Object.values(this._oFilters),
                    and: true
                }), "Control");
                this._setSelectAllButton();
            },

            /**
            * Formatter to set the title of GridContainer List.
            *
            * @param {string} type Currently selected widget Type
            * @param {string} appBoxCount Appbox item count
            * @param {string} searchTerm GridContainer Searchfield query
            * @param {boolean} showSelectedPressed Show All Selected Button pressed property
            * @param {string} selectedAppCount Count of all the Selected Apps
            * @param {string} currentSelectedTreeNode Currently selected Tree List title
            *
            * @return {string} The GridContainer Title text.
            * @since 1.106.0
            */
            titleFormatter: function (type, appBoxCount, searchTerm, showSelectedPressed, selectedAppCount, currentSelectedTreeNode) {
                var iCount = this._getGridContainer().getItems().length;
                var bNoItems = iCount === 0;
                var oI18nModel = this.getView().getModel("i18n");

                if (searchTerm) {
                    if (bNoItems) {
                        return oI18nModel.getResourceBundle().getText("ContentFinder.AppBoxContainer.Title.NoSearchResult", searchTerm);
                    }
                    return oI18nModel.getResourceBundle().getText("ContentFinder.AppBoxContainer.Title.SearchResult", [iCount, searchTerm]);
                }

                if (showSelectedPressed) {
                    if (selectedAppCount === 0) {
                        return oI18nModel.getResourceBundle().getText("ContentFinder.AppBoxContainer.Title.NoSelectedApp");
                    }
                    return oI18nModel.getResourceBundle().getText("ContentFinder.AppBoxContainer.Title.SelectedApp", selectedAppCount);
                }

                if (currentSelectedTreeNode &&
                    currentSelectedTreeNode !== oI18nModel.getResourceBundle().getText("ContentFinder.CategoryTree.Row.AllTiles") &&
                    currentSelectedTreeNode !== oI18nModel.getResourceBundle().getText("ContentFinder.CategoryTree.Row.AllCards")) {
                    return currentSelectedTreeNode + " (" + iCount + ")";
                }

                if (type === "tiles") {
                    if (bNoItems) {
                        return oI18nModel.getResourceBundle().getText("ContentFinder.AppBoxContainer.Title.NoTiles");
                    }
                    return oI18nModel.getResourceBundle().getText("ContentFinder.AppBoxContainer.Title.AllTiles", iCount);
                }

                if (bNoItems) {
                    return oI18nModel.getResourceBundle().getText("ContentFinder.AppBoxContainer.Title.NoCards");
                }

                return oI18nModel.getResourceBundle().getText("ContentFinder.AppBoxContainer.Title.AllCards", iCount);
            },

            /**
            * Event fired when the catalog/roles is selected.
            *
            * @param {sap.ui.base.Event} oEvent Tree onSelect Event object.
            * @since 1.106.0
            */
            // onTreeListItemPressed: function (oEvent) {
            //     this._updateFiltersAfterSelectionChange(oEvent.getParameter("listItem"));
            // },

            /**
             * Event Handler :: An app box was selected.
             *
             * Updates selection related model data.
             *
             * @since 1.106.0
             * @private
             */
            onAppBoxSelected: function () {
                // Update model data: /selectedAppCount
                var iSelectedAppBoxes = this.oModel.getProperty(this.oBindingPath + "/tiles").filter(function (oAppBox) {
                    return oAppBox.selected && !oAppBox.disabled;
                }).length;
                if (this.oParentContentFinderDialogModel) {
                    this.oParentContentFinderDialogModel.setProperty("/selectedAppCount", iSelectedAppBoxes);
                }
                this.oModel.setProperty(this.oBindingPath + "/selectedAppCount", iSelectedAppBoxes);

                // Update model data: /appBoxCount, /hasSelectables
                this._setSelectAllButton();
            },

            /**
            * Event called when a Card is selected.
            * @param {sap.ui.base.Event} oEvent Button Press Event object.
            * @since 1.107.0
            * @private
            */
            onCardAppBoxPressed: function (oEvent) {
                this.getOwnerComponent().fireEvent("cardSelected", oEvent);
            },

            /**
            * Called on Select All Button Press to select all the Tile/Cards.
            *
            * @param {sap.ui.base.Event} oEvent Button Press Event object.
            * @since 1.106.0
            * @private
            */
            onSelectAllPressed: function (oEvent) {
                var bSelectAll = oEvent.getParameter("pressed");
                var oGridContainer = this._getGridContainer();
                oGridContainer.getItems().forEach(function (oAppBox) {
                    if (!oAppBox.getDisabled()) {
                        oAppBox.setSelected(bSelectAll);
                    }
                });
                this.onAppBoxSelected();
                this._setSelectAllButton();

                // For the user's convenience:
                // Automatically take out show-all-selected tile filter if the user just deselected all tiles
                var bShowSelectedPressed = this.oModel.getProperty(this.oBindingPath + "/showSelectedPressed");
                if (!bSelectAll && bShowSelectedPressed) {
                    this.byId("ShowSelectedToggleBtn").setPressed(false).firePress();
                }
            },

            /**
            * Called on Display Selected Button is pressed to select all the Tile/Cards.
            *
            * @param {sap.ui.base.Event} oEvent Button Press Event object.
            * @since 1.106.0
            * @private
            */
            onShowSelectedPressed: function (oEvent) {
                this._updateFiltersAfterShowSelectedChange(oEvent.getParameter("pressed"));
            },

            /**
             * Updates the filters after the show selected button state was altered
             *
             * @param {boolean} bShowSelected The new button state
             * @since 1.107.0
             * @private
             */
            _updateFiltersAfterShowSelectedChange: function (bShowSelected) {
                if (bShowSelected) {
                    // Clear search filters
                    // this.byId("CategorySearch").clear(); CategorySearch is disabled for now
                    this.byId("AppBoxSearch").clear();

                    // var oCategoryTree = this.byId("CategoryTree");

                    // var oRootTreeItem = oCategoryTree.getItems()[0];
                    // oCategoryTree.setSelectedItem(oRootTreeItem);
                    // this._updateFiltersAfterSelectionChange(oRootTreeItem);

                    // var oCategoryBinding = oCategoryTree.getBinding("items");
                    // oCategoryBinding.aFilters = null;
                    // oCategoryBinding.filter(null, "Control");

                    // filter by Selected Items
                    this._oFilters.oSelectFilter = new Filter("selected", FilterOperator.EQ, true);
                    this._applyFilters();
                } else {
                    // Clear filters and the search
                    this.resetFilters(["oSelectFilter", "oSearchFilter"]);
                    this.byId("AppBoxSearch").clear();
                }
            },

            /**
             * Updates the filter according to the selected StandardTreeItem of the Tree control
             *
             * @param {object} oStandardTreeItem The newly selected StandardTreeItem
             * @since 1.107.0
             * @private
             */
            _updateFiltersAfterSelectionChange: function (oStandardTreeItem) {
                var bIsLeaf = oStandardTreeItem.isLeaf();
                var sTitle = oStandardTreeItem.getTitle();
                var oI18nModel = this.getView().getModel("i18n");
                var bIsRoot = sTitle === oI18nModel.getResourceBundle().getText("ContentFinder.CategoryTree.Row.AllTiles")
                    || sTitle === oI18nModel.getResourceBundle().getText("ContentFinder.CategoryTree.Row.AllCards");

                var oModel = this.getView().getModel();
                oModel.setProperty("/CurrentSelectedTreeNode", sTitle);

                if (bIsRoot || !bIsLeaf) {
                    this.resetFilters(["oCatalogFilter"]);
                } else {
                    var bIsARole = !!oModel.getProperty("/roles")[sTitle];

                    if (bIsARole) {
                        var aCatalogNames = oModel.getProperty("/roles")[sTitle];
                        this._oFilters.oCatalogFilter = new Filter({
                            filters: aCatalogNames.map(function (sCatalogName) {
                                return new Filter("catalogId", FilterOperator.EQ, sCatalogName);
                            }),
                            and: false
                        });
                    } else {
                        this._oFilters.oCatalogFilter = new Filter("catalogId", FilterOperator.EQ, sTitle);
                    }

                    var oShowSelectedButton = this.byId("ShowSelectedToggleBtn");
                    if (oShowSelectedButton.getPressed()) {
                        oShowSelectedButton.setPressed(false);
                        this._updateFiltersAfterShowSelectedChange(false);
                    }
                    this._applyFilters();
                }

                this.byId("ContentFinderAppSearchDynamicSideContent").toggle();
            },

            /**
            * Reset the Preview properties.
            * @since 1.106.0
            * @private
            */
            _resetPreviews: function () {
                this.oModel.setProperty(this.oBindingPath + "/tilePreviewShown", false);
                this.oModel.setProperty(this.oBindingPath + "/cardPreviewShown", false);
                this.oModel.getProperty(this.oBindingPath + "/tiles").forEach(function (oTileData) {
                    oTileData.showPreview = false;
                });
                this.oModel.getProperty(this.oBindingPath + "/cards").forEach(function (oTileData) {
                    oTileData.showPreview = false;
                });
                this.oModel.refresh(true);
            },

            /**
             * Updates model data that determine the title of the [Select All]/[Deselect All] button
             *
             * It's called after the selection of app boxes was changed.
             *
             * @since 1.106.0
             * @private
             */
            _setSelectAllButton: function () {
                // Update model data: /appBoxCount, /hasSelectables
                var oGridContainer = this._getGridContainer();
                var iAppBoxesCount = oGridContainer.getItems().length;
                var iSelectedAppBoxes = oGridContainer.getItems().filter(function (oAppBox) {
                    return oAppBox.getSelected();
                }).length;
                var bHasSelectables = iAppBoxesCount !== iSelectedAppBoxes;
                this.oModel.setProperty(this.oBindingPath + "/hasSelectables", bHasSelectables);
                this.oModel.setProperty(this.oBindingPath + "/appBoxCount", iAppBoxesCount);
            },

            /**
            * Cards factory function.
            * @since 1.106.0
            * @param {string} sId The Id of the control
            * @param {object} oContext Context Object
            * @returns {sap.ushell.ui.contentFinder.AppBox} The AppBox control
            * @private
            */
            _cardAppBoxFactory: function (sId, oContext) {
                var oLayoutData = new GridContainerItemLayoutData({
                    columns: "{= ${showPreview} ? 2 : 1}",
                    rows: "{= ${showPreview} ? 2 : 1}"
                });

                // var oData = oContext.getObject();
                // var oCard = new IntegrationCard({
                //     height: "100%",
                //     manifest: oData.manifest
                // });

                return new AppBox({
                    id: "ContentFinderAppBoxCard-" + sId,
                    appId: "{appId}",
                    dataHelpId: "{dataHelpId}",
                    disabled: "{disabled}",
                    disablePreview: "{= !${showPreview} && ${/cardPreviewShown}}",
                    gridGapSize: 0.75,
                    icon: "{icon}",
                    info: "{info}",
                    launchUrl: "{launchUrl}",
                    previewSize: "Large",
                    posinset: "{posinset}",
                    selectable: false,
                    setsize: "{setsize}",
                    showExtraInformation: true,
                    showPreview: "{showPreview}",
                    subtitle: "{subtitle}",
                    systemInfo: "{systemInfo}",
                    title: "{title}",
                    type: "{type}",
                    visible: "{visible}",
                    previewShown: this.showPreview.bind(this),
                    press: this.onCardAppBoxPressed.bind(this),
                    // preview: oCard,
                    layoutData: oLayoutData
                });
            },

            /**
             * Resets the provided filters.
             * If no filters are provided all available filters are reset instead.
             *
             * @param {string[]} [aFilters] The filters which need to be reset. By default all filters are reset
             * @private
             */
            resetFilters: function (aFilters) {
                var aValidFilters = ["oSearchFilter", "oSelectFilter", "oCatalogFilter"];
                if (!aFilters) {
                    aFilters = Object.keys(this._oFilters);
                }

                aFilters.forEach(function (filter) {
                    if (!aValidFilters.includes(filter)) {
                        Log.error("Invalid filter provided. Skipping.", null, "sap.ushell.components.ContentFinderAppSearch.controller.ContentFinderAppSearch");
                        return;
                    }
                    delete this._oFilters[filter];
                }.bind(this));

                this._applyFilters();
            }
        });
});
