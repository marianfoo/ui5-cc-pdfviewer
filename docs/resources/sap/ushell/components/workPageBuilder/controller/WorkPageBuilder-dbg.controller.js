//Copyright (c) 2009-2022 SAP SE, All Rights Reserved

/**
 * @file WorkPageBuilder controller for WorkPageBuilder view
 * @version 1.108.12
 */
sap.ui.define([
    "sap/base/Log",
    "sap/ui/core/mvc/Controller",
    "sap/base/util/uid",
    "sap/ushell/EventHub",
    "sap/ushell/components/workPageBuilder/controls/WorkPageWidgetContainer",
    "sap/ushell/components/workPageBuilder/controls/WorkPageCell",
    "sap/ushell/components/workPageBuilder/controls/WorkPageSection",
    "sap/ui/integration/widgets/Card",
    "sap/ui/core/Fragment",
    "sap/ui/integration/Host",
    "sap/base/util/ObjectPath"
], function (
    Log,
    Controller,
    uid,
    EventHub,
    WorkPageWidgetContainer,
    WorkPageCell,
    WorkPageSection,
    Card,
    Fragment,
    Host,
    ObjectPath
) {
    "use strict";

    var MIN_GRID_COLSPAN = 4;
    var MAX_GRID_COLSPAN = 24;
    var STEP_SIZE = 2;
    var MAX_COLS = 6;

    function _setDirtyFlag () {
        EventHub.emit("WorkPageHasChanges", true);
    }

    /**
     * Controller of the WorkPageBuilder view.
     *
     * @param {string} sId Controller id
     * @param {object} oParams Controller parameters
     * @class
     * @assigns sap.ui.core.mvc.Controller
     * @private
     * @since 1.99.0
     * @alias sap.ushell.components.workPageBuilder.controller.WorkPages
     */
    return Controller.extend("sap.ushell.components.workPageBuilder.controller.WorkPageBuilder",
        /** @lends sap.ushell.components.workPageBuilder.controller.WorkPageBuilder.prototype */ {

            onInit: function () {
                this._fnDeleteRowHandler = this.deleteRow.bind(this);
                this._sModelRootPath = this.getOwnerComponent().getModelRootPath();
                this._sWorkPageRootPath = this._sModelRootPath + "/WorkPage";
                this._sVizRootPath = this._sModelRootPath + "/Visualizations";
                this._sCatalogRootPath = this._sModelRootPath + "/Catalog";

                this._saveHost();
                this.byId("sapCepWorkPage").bindElement({
                    path: this._sWorkPageRootPath
                });
            },

            /**
             * Handler for the "addColumn" event of the WorkPageColumn.
             * Creates an empty column on the left or the right of the event source and calculates
             * the new width of the neighboring columns.
             *
             * @param {sap.base.Event} oEvent The "addColumn" event.
             */
            onAddColumn: function (oEvent) {
                var oModel = this.getView().getModel();
                var oColumnControl = oEvent.getSource();
                var oRow = oColumnControl.getParent();
                var iColumnIndex = oRow.indexOfAggregation("columns", oColumnControl);
                var sRowBindingContextPath = oRow.getBindingContext().getPath();
                var sColumnPath = sRowBindingContextPath + "/Columns/";
                var sColumnColspanPath = oColumnControl.getBindingContext().getPath() + "/Descriptor/colspan";
                var aColumnsData = oModel.getProperty(sColumnPath);
                var iColumnCount = aColumnsData.length;
                var bAddToLeft = oEvent.getParameter("left");
                if (iColumnCount >= MAX_COLS) {
                    return;
                }
                var iColspan = oColumnControl.getProperty("colspan");
                var iColSize = Math.floor(iColspan / 2) >= MIN_GRID_COLSPAN ? Math.floor(iColspan / 2) : MIN_GRID_COLSPAN;
                var iModulo = iColSize % 2;
                oModel.setProperty(sColumnColspanPath, iColSize + iModulo);

                var iIndex = oRow.indexOfAggregation("columns", oColumnControl) + (bAddToLeft === true ? 0 : 1);
                aColumnsData.splice(iIndex, 0, this._createEmptyColumn(iColSize - iModulo));

                var iTotalColumns = aColumnsData.reduce(function (iAccumulator, oSingleColumn) {
                    return iAccumulator + this._getColSpan(oSingleColumn);
                }.bind(this), 0);

                if (iTotalColumns > MAX_GRID_COLSPAN) {
                    this._calculateColSpans(aColumnsData, iColumnIndex, iTotalColumns);
                }
                oModel.setProperty(sColumnPath, aColumnsData);
                _setDirtyFlag();
            },

            /**
             * Handler for the "removeColumn" event of the WorkPageColumn.
             * Removes the column that issues the event and calculates the width of the remaining columns.
             *
             * @param {sap.base.Event} oEvent The "removeColumn" event.
             */
            onDeleteColumn: function (oEvent) {
                var oModel = this.getView().getModel();
                var oColumn = oEvent.getSource();
                var iColSpan = oColumn.getColspan();
                var oRow = oColumn.getParent();
                var iColumnIndex = oRow.indexOfAggregation("columns", oColumn);
                var sRowBindingContextPath = oRow.getBindingContext().getPath();
                var sColumnPath = sRowBindingContextPath + "/Columns/";
                var aColumns = oModel.getProperty(sColumnPath);

                aColumns.splice(iColumnIndex, 1);

                // split the colspan among remaining cols
                var iLoopCount = (iColSpan / 2);
                var iIndex = iColumnIndex - 1 < 0 ? iColumnIndex : iColumnIndex - 1;
                while (iLoopCount > 0) {
                    var oCurrentColumn = aColumns[iIndex];
                    this._setColSpan(oCurrentColumn, (this._getColSpan(oCurrentColumn)) + STEP_SIZE);
                    iIndex = ++iIndex >= aColumns.length ? 0 : iIndex++;
                    iLoopCount--;
                }

                oModel.setProperty(sColumnPath, aColumns);
                _setDirtyFlag();
            },

            /**
             * Handler for the "Add Row" button on an empty WorkPage.
             * Creates an array with an empty row and sets it to the model.
             *
             */
            onAddFirstRow: function () {
                var sRowsPath = this._sWorkPageRootPath + "/Rows/";
                this.getView().getModel().setProperty(sRowsPath, [this._createEmptyRow()]);
                _setDirtyFlag();
            },

            /**
             * Handler for the "Add Row" button on a WorkPageRow.
             * Creates a new empty row and adds it to the existing rows.
             *
             * @param {sap.base.Event} oEvent The "addRow" event.
             */
            onAddRow: function (oEvent) {
                var oModel = this.getView().getModel();
                var oRow = oEvent.getSource();
                var oPage = this.byId("sapCepWorkPage");
                var sRowsPath = this._sWorkPageRootPath + "/Rows/";
                var aRows = oModel.getProperty(sRowsPath);
                var oNewRow = this._createEmptyRow();

                var iIndex = oPage.indexOfAggregation("rows", oRow) + (oEvent.getParameter("bottom") === true ? 1 : 0);

                aRows.splice(iIndex, 0, oNewRow);
                oModel.setProperty(sRowsPath, aRows);
                _setDirtyFlag();
            },

            /**
             * Handler for the "columnResized" event issued by the WorkPageColumn.
             * Calculates the required resize steps left or right and updates the model accordingly.
             *
             * @param {sap.base.Event} oEvent The "columnResized" event.
             */
            onResize: function (oEvent) {
                var iDiff = oEvent.getParameter("posXDiff");
                var oColumn = oEvent.getSource();
                var oRow = oColumn.getParent();
                var iColumnWidth = oRow.getSingleColumnWidth();
                var fDeltaFromOrigin, iColumnsDelta, sDragDirection, iRightColumnIndex, iLeftColumnIndex,
                    iLeftColSpan, iRightColSpan, oResult;

                if (iColumnWidth === 0) {
                    return;
                }

                fDeltaFromOrigin = iDiff / iColumnWidth;

                if (fDeltaFromOrigin > -1 && fDeltaFromOrigin < 1) {
                    return;
                }

                iColumnsDelta = fDeltaFromOrigin < 0 ? Math.floor(iDiff / iColumnWidth) : Math.ceil(iDiff / iColumnWidth);
                sDragDirection = iColumnsDelta >= 0 ? "right" : "left";
                iRightColumnIndex = oRow.indexOfAggregation("columns", oColumn);
                iLeftColumnIndex = iRightColumnIndex - 1;
                iLeftColSpan = this._getCurrentColSpan(oRow, iLeftColumnIndex);
                iRightColSpan = this._getCurrentColSpan(oRow, iRightColumnIndex);

                oResult = this._doColumnResizeStep(oRow, iLeftColumnIndex, iRightColumnIndex, iLeftColSpan, iRightColSpan, sDragDirection);
                if (oResult) {
                    this._updateModelWithColSpans(oRow, iLeftColumnIndex, iRightColumnIndex, oResult.newLeftColSpan, oResult.newRightColSpan);
                }
                _setDirtyFlag();
            },

            /**
             * Handler for the "deleteWidget" event issued by the WorkPageWidgetContainer.
             * Deletes the widget from the model.
             *
             * @param {sap.ushell.components.workPageBuilder.controls.WorkPageWidgetContainer} oWidgetContainer The widget container control.
             * @param {sap.ushell.components.workPageBuilder.controls.WorkPageCell} oCell The cell wrapping the widgetContainer.
             */
            onDeleteWidget: function (oWidgetContainer, oCell) {
                var oModel = this.getView().getModel();
                var oColumn = oCell.getParent();

                var iCellIndex = oColumn.indexOfAggregation("cells", oCell);
                var sCellsPath = oColumn.getBindingContext().getPath() + "/Cells";
                var aCells = oModel.getProperty(sCellsPath);
                aCells.splice(iCellIndex, 1);
                oModel.setProperty(sCellsPath, aCells);
                _setDirtyFlag();
            },

            /**
             * Handler for the "deleteVisualization" event issued by the WorkPageSection.
             * Deletes the visualization from the model.
             *
             * @param {sap.ushell.ui.launchpad.VizInstanceCdm|sap.ushell.ui.launchpad.VizInstanceLink} oVizInstance the viz instance.
             */
            onDeleteVisualization: function (oVizInstance) {
                var oVizInstanceContext = oVizInstance.getBindingContext();
                var sVizInstancePath = oVizInstanceContext.getPath();
                var oModel = this.getView().getModel();
                var sWidgetsPath = sVizInstancePath.substring(0, sVizInstancePath.lastIndexOf("/"));
                var oVizInstanceObject = oModel.getProperty(sVizInstancePath);

                var aVizInstances = oModel.getProperty(sWidgetsPath).filter(function (oObj) {
                    return oObj.Visualization.Id !== oVizInstanceObject.Visualization.Id;
                });

                oModel.setProperty(sWidgetsPath, aVizInstances);
                _setDirtyFlag();

            },

            /**
             * Handler for the "change" event of the edit title input.
             * Set the dirty flag
             */
             onEditTitle: function () {
                _setDirtyFlag();
            },

            /**
             * Handler for the "addWidget" event of the ContentFinderDialog.
             * Set the dirty flag
             */
             onWidgetAdded: function () {
                _setDirtyFlag();
            },

            /**
             * Handler for the "Add Widget" button on a WorkPageColumn.
             * Open the content finder dialog
             *
             * @param {sap.base.Event} oEvent The "addWidget" event.
             * @return {sap.m.Dialog} The ContentFinder Dialog Instance
             */
            onAddWidget: function (oEvent) {
                this._oColumn = oEvent.getSource();
                if (!this._oPromise) {
                    this._oPromise = this._loadContentFinderDialog();
                }
                return this._oPromise.then(function (oDialog) {
                    this.oContentFinderDialog = oDialog;
                    var oDataProvider = {
                        oWorkPageBuilderView: this.getView(),
                        sCatalogRootPath: this._sCatalogRootPath,
                        sVizRootPath: this._sVizRootPath,
                        oColumn: this._oColumn,
                        fnOnWidgetAdded: this.onWidgetAdded
                    };
                    this.oContentFinderDialogController.connect(
                        this.sFragmentId,
                        oDialog,
                        oDataProvider,
                        {
                            iCurrentPageIndex: 0
                        }
                    );
                    this.oContentFinderDialog.open();
                }.bind(this));
            },

            /**
             * Handler for the "Add Applications" button on a WorkPageCell.
             * Opens the content finder dialog in restricted mode with the widget selection opened.
             *
             * @param {sap.base.Event} oEvent The "addApplications" event.
             * @returns {Promise<sap.m.Dialog>} The ContentFinder Dialog Instance
             */
            onAddApplications: function (oEvent) {
                var oCell = oEvent.getSource();
                if (!this._oPromise) {
                    this._oPromise = this._loadContentFinderDialog();
                }
                return this._oPromise.then(function (oDialog) {
                    this.oContentFinderDialog = oDialog;
                    var oDataProvider = {
                        oWorkPageBuilderView: this.getView(),
                        sCatalogRootPath: this._sCatalogRootPath,
                        sVizRootPath: this._sVizRootPath,
                        oCell: oCell,
                        fnOnWidgetAdded: this.onWidgetAdded
                    };
                    this.oContentFinderDialogController.connect(
                        this.sFragmentId,
                        oDialog,
                        oDataProvider,
                        {
                            iCurrentPageIndex: 1,
                            bRestrictedMode: true,
                            sWidgetType: "widgets-tiles"
                        }
                    );
                    this.oContentFinderDialog.open();
                }.bind(this));
            },

            /**
             * Returns the ContentFinderDialog Instance.
             *
             * @return {promise} The ContentFinder Dialog Instance
             */
            _loadContentFinderDialog: function () {
                return new Promise(function (resolve, reject) {
                    sap.ui.require([
                        "sap/ushell/components/workPageBuilder/controller/ContentFinderDialog.controller"
                    ], function (ContentFinderDialogController) {
                        this.oContentFinderDialogController = new ContentFinderDialogController();
                        this.sFragmentId = this.createId("ContentFinderDialog");
                        this.oContentFinderDialogController.init();
                        Fragment.load({
                            id: this.sFragmentId,
                            fragmentName: "sap.ushell.components.workPageBuilder.view.ContentFinderDialog",
                            controller: this.oContentFinderDialogController
                        }).then(function (oDialog) {
                            this.getView().addDependent(oDialog);
                            resolve(oDialog);
                        }.bind(this)).catch(reject);
                    }.bind(this), reject);
                }.bind(this));
            },

            /**
            * Instantiate the content picker controller
            * @return {Promise} Promise resolves content picker controller
            * @private
            */
            _getContentPickerController: function () {
                if (!this._oContentFinderController) {
                    return new Promise(function (resolve, reject) {
                        Controller.create({ name: "sap.ushell.components.workPageBuilder.controller.ContentPicker" }).then(function (oController) {
                            this._oContentFinderController = oController;
                            oController.setProvider({
                                oWorkPageBuilderView: this.getView(),
                                sCatalogRootPath: this._sCatalogRootPath,
                                sVizRootPath: this._sVizRootPath,
                                oColumn: this._oColumn
                            });
                            resolve(oController);
                        }.bind(this));
                    }.bind(this));
                }
                this._oContentFinderController.getProvider().oColumn = this._oColumn;
                return Promise.resolve(this._oContentFinderController);
            },

            /**
             * Handler for the "press" event in the WorkPageRow OverflowToolbar button.
             * Opens a confirmation prompt.
             *
             * @param {sap.base.Event} oEvent The "deleteRow" event.
             */
            onDeleteRow: function (oEvent) {
                var oRootView = this.getOwnerComponent().getRootControl();
                var oWorkPageRowContext = oEvent.getSource().getBindingContext();

                if (!this.oLoadDeleteDialog) {
                    this.oLoadDeleteDialog = Fragment.load({
                        id: oRootView.createId("rowDeleteDialog"),
                        name: "sap.ushell.components.workPageBuilder.view.WorkPageRowDeleteDialog",
                        controller: this
                    }).then(function (oDialog) {
                        oDialog.setModel(this.getView().getModel("i18n"), "i18n");
                        return oDialog;
                    }.bind(this));
                }

                this.oLoadDeleteDialog.then(function (oDialog) {
                    oDialog.getBeginButton().detachEvent("press", this._fnDeleteRowHandler);
                    oDialog.getBeginButton().attachEvent("press", {
                        rowContext: oWorkPageRowContext
                    }, this._fnDeleteRowHandler);
                    oDialog.open();
                }.bind(this));
            },

            /**
             * Deletes the row with the context given in oRowData.
             *
             * @param {sap.base.Event} oEvent The "press" event.
             * @param {object} oRowData Object containing the WorkPageRow context to delete.
             */
            deleteRow: function (oEvent, oRowData) {
                var oModel = this.getView().getModel();
                var oWorkPageRowContext = oRowData.rowContext;
                var aRows = oModel.getProperty(this._sWorkPageRootPath + "/Rows");
                var iWorkPageRowIndex = aRows.indexOf(oWorkPageRowContext.getObject());
                if (iWorkPageRowIndex <= -1) {
                    return;
                }
                aRows.splice(iWorkPageRowIndex, 1);
                oModel.setProperty(this._sWorkPageRootPath + "/Rows", aRows);
                _setDirtyFlag();
                this.oLoadDeleteDialog.then(function (oDialog) {
                    oDialog.close();
                });
            },

            /**
             * Called when the "Cancel" button is pressed on the RowDelete dialog.
             */
            onRowDeleteCancel: function () {
                this.oLoadDeleteDialog.then(function (oDialog) {
                    oDialog.close();
                });
            },

            /**
             * Determine if the current cell is a section cell.
             *
             * @param {object} oCellContext The cell context.
             * @return {boolean} True if the cell is a section cell, false if not.
             * @private
             */
            _isSectionCell: function (oCellContext) {
                var aWidgets = oCellContext.getProperty("Widgets");

                // cell is empty -> false
                if (aWidgets.length === 0) {
                    return false;
                }

                // mode is set -> true
                if (oCellContext.getProperty("Descriptor/tileMode")) {
                    return true;
                }

                // more than one widget -> must be section -> true
                if (aWidgets.length > 1) {
                    return true;
                }

                // check if the only widget is of a standard tile type.
                // This is a workaround and should be removed when we can rely on the mode always being set correctly.
                var sId = aWidgets[0].Visualization.Id;
                var oViz = oCellContext.getModel().getProperty("/data/Visualizations/" + sId);

                return oViz
                    ? ["sap.ushell.StaticAppLauncher", "sap.ushell.DynamicAppLauncher"].indexOf(oViz.Type) > -1
                    : false;
            },

            /**
             * Factory for WorkPageCells.
             *
             * If the cell has tileMode:true, create one WidgetContainer and bind all widgets (visualizations) to it.
             * If the cell has mode "", create a WidgetContainer for each widget.
             *
             * @param {string} sCellId The DOM id of the cell.
             * @param {sap.ui.model.Context} oCellContext The binding context of the WorkPageCell instance.
             * @return {sap.ushell.components.workPageBuilder.controls.WorkPageCell} The WorkPageCell.
             */
            cellFactory: function (sCellId, oCellContext) {
                var oCell = new WorkPageCell(sCellId, {});

                if (this._isSectionCell(oCellContext)) {
                    var sSectionId = this.createId("sapCepWorkPageSection") + sCellId;
                    var sWidgetContainerId = this.createId("sapCepWorkPageWidgetContainer") + sSectionId;
                    var oSection = this._createSection(sSectionId, {});
                    var oWidgetContainer = this._createWidgetContainer(sWidgetContainerId, oCell);
                    oSection.bindAggregation("visualizations", {
                        path: "Widgets"
                    });
                    oSection.bindProperty("editMode", {
                        path: "/editMode"
                    });
                    oCell.addAggregation("widgetContainers", oWidgetContainer.setWidget(oSection));
                } else {
                    oCell.bindAggregation("widgetContainers", {
                        path: "Widgets",
                        factory: this.widgetFactory.bind(this, oCell)
                    });
                }
                return oCell;
            },

            /**
             * Factory for widgets.
             * Creates the widget according to the "Visualization/Type" entry.
             *
             * @param {sap.ushell.components.workPageBuilder.controls.WorkPageCell} oCell The WorkPageCell.
             * @param {string} sWidgetId The DOM id of the widget.
             * @param {sap.ui.model.Context} oWidgetContext The widget context.
             * @return {sap.ui.core.Control} The widget.
             */
            widgetFactory: function (oCell, sWidgetId, oWidgetContext) {
                var sVizId = oWidgetContext.getProperty("Visualization/Id");
                var sWidgetContainerId = this.createId("sapCepWorkPageWidgetContainer") + sWidgetId;
                var oWidgetContainer = this._createWidgetContainer(sWidgetContainerId, oCell);

                if (!sVizId) {
                    Log.error("No vizId found");
                    return oWidgetContainer;
                }

                var oViz = this.getView().getModel().getProperty(this._sVizRootPath + "/" + sVizId);

                if (!oViz || !oViz.Type) {
                    Log.error("No viz or vizType found for vizId " + sVizId);
                    return oWidgetContainer;
                }

                switch (oViz.Type) {
                    case "sap.card":
                        return oWidgetContainer.setWidget(this._createCard(sWidgetId, oViz));
                    default:
                        return oWidgetContainer;
                }
            },

            /**
             * Creates a WidgetContainer control.
             *
             * @param {string} sId The WorkPageWidgetContainer id.
             * @param {sap.ushell.components.workPageBuilder.controls.WorkPageCell} oCell The WorkPageCell control.
             * @return {sap.ushell.components.workPageBuilder.controls.WorkPageWidgetContainer} The WidgetContainer control.
             * @private
             */
            _createWidgetContainer: function (sId, oCell) {
                var oWorkPageWidgetContainer = new WorkPageWidgetContainer(sId, {
                    editMode: "{/editMode}",
                    openWidgetSettingsTooltip: "{i18n>WorkPage.WidgetContainer.OpenWidgetSettingsButtonTooltip}",
                    deleteWidgetTooltip: "{i18n>WorkPage.WidgetContainer.DeleteWidgetButtonTooltip}"
                }).attachEvent("deleteWidget", this._deleteWidget.bind(this, oCell));
                oCell.addDependent(oWorkPageWidgetContainer);
                return oWorkPageWidgetContainer;
            },

            /**
             * Creates a WorkPageSection control.
             *
             * @param {string} sId The WorkPageSection id.
             * @return {sap.ushell.components.workPageBuilder.controls.WorkPageSection} The WorkPageSection control.
             * @private
             */
            _createSection: function (sId) {
                var oWorkPageSection = new WorkPageSection(sId);
                oWorkPageSection.attachEvent("deleteVisualization", this._deleteVisualization.bind(this));
                oWorkPageSection.attachEvent("addApplications", this.onAddApplications.bind(this));
                return oWorkPageSection;
            },

            /**
             * Deletes a visualization.
             * Calls the respective delete handler
             *
             * @param {sap.base.Event} oEvent The "deleteVisualization" event.
             * @private
             */

            _deleteVisualization: function (oEvent) {
                var oVizInstance = oEvent.getParameters().getSource();
                this.onDeleteVisualization(oVizInstance);
            },

            /**
             * Deletes a widget.
             * Calls the respective delete handler according to the cell mode property ("Section" widget or regular widget).
             *
             * @param {sap.ushell.components.workPageBuilder.controls.WorkPageCell} oCell The WorkPageCell control.
             * @param {sap.base.Event} oEvent The "deleteWidget" event.
             * @private
             */
            _deleteWidget: function (oCell, oEvent) {
                this.onDeleteWidget(oEvent.getSource(), oCell);
            },

            /**
             * Creates a new Card.
             *
             * @param {string} sWidgetId The DOM id for the widget.
             * @param {object} oViz The visualization data.
             * @return {sap.ui.integration.widgets.Card} The card instance.
             * @private
             */
            _createCard: function (sWidgetId, oViz) {
                var oOptions = {};
                var bHasDescriptor = oViz.Descriptor && oViz.Descriptor["sap.card"];
                var bHasDescriptorResources = oViz.DescriptorResources && (oViz.DescriptorResources.BaseUrl || oViz.DescriptorResources.DescriptorPath);

                if (!bHasDescriptor && !bHasDescriptorResources) {
                    Log.error("No Descriptor or DescriptorResources for Card");
                    return new Card(sWidgetId);
                }

                if (bHasDescriptor) {
                    oOptions.manifest = oViz.Descriptor;

                    if (bHasDescriptorResources) {
                        oOptions.baseUrl = oViz.DescriptorResources.BaseUrl + oViz.DescriptorResources.DescriptorPath;
                    }
                } else if (bHasDescriptorResources) {
                    oOptions.manifest = oViz.DescriptorResources.BaseUrl + oViz.DescriptorResources.DescriptorPath + "/manifest.json";
                }

                // Ensure trailing slash for base url
                if (oOptions.baseUrl && oOptions.baseUrl.substr(-1) !== "/") {
                    oOptions.baseUrl += "/";
                }

                var oCard = new Card(sWidgetId, oOptions).addStyleClass("sapCepWidget");

                oCard.attachAction(this.executeNavigation);
                oCard.setHost(this.oHost);
                return oCard;
            },

            /**
             * executes the Navigation, will open a new window
             * if Event is of type Navigation
             * @param {Object} oEvent Event triggered by the card
             * @returns {Promise} Promise that will resolve if Navigation is succesfull
             */
            executeNavigation: function (oEvent) {
                var oParameters = oEvent.getParameter("parameters");
                if (oEvent.getParameter("type") !== "Navigation") {
                    return Promise.resolve();
                }
                return sap.ushell.Container.getServiceAsync("CrossApplicationNavigation")
                    .then(function (oCrossAppNavigation) {
                        return oCrossAppNavigation.toExternal({
                            target: {
                                semanticObject: oParameters.ibnTarget.semanticObject,
                                action: oParameters.ibnTarget.action
                            },
                            params: oParameters.ibnParams
                        });
                    });
            },

            /**
             * Close the edit mode and request to save changes by firing the "closeEditMode" event. The edit mode needs to be managed
             * the outer component to also handle the UserAction Menu button for edit mode.´
             */
            saveEditChanges: function () {
                this.getOwnerComponent().fireEvent("closeEditMode", {
                    saveChanges: true
                });
            },

            /**
             * Close the edit mode and request to cancel changes by firing the "closeEditMode" event. The edit mode needs to be managed
             * the outer component to also handle the UserAction Menu button for edit mode.´
             */
             cancelEditChanges: function () {
                this.getOwnerComponent().fireEvent("closeEditMode", {
                    saveChanges: false
                });
            },

            /**
             * Updates the model with the colspans.
             *
             * @param {sap.ushell.components.workPageBuilder.controls.WorkPageCell} oRow The surrounding row.
             * @param {int} iLeftColumnIndex The index of the left column to update.
             * @param {int} iRightColumnIndex The index of the right column to update.
             * @param {int} iNewLeftColumnColSpan The new colspan value for the left column.
             * @param {int} iNewRightColumnColSpan The new colspan value for the right column.
             * @private
             */
            _updateModelWithColSpans: function (oRow, iLeftColumnIndex, iRightColumnIndex, iNewLeftColumnColSpan, iNewRightColumnColSpan) {
                var oModel = this.getView().getModel();
                var oRowBindingContext = oRow.getBindingContext();
                var sRowBindingContextPath = oRowBindingContext.getPath();
                var sLeftColumnPath = sRowBindingContextPath + "/Columns/" + iLeftColumnIndex + "/Descriptor/colspan";
                var sRightColumnPath = sRowBindingContextPath + "/Columns/" + iRightColumnIndex + "/Descriptor/colspan";
                oModel.setProperty(sLeftColumnPath, iNewLeftColumnColSpan);
                oModel.setProperty(sRightColumnPath, iNewRightColumnColSpan);
            },

            /**
             * Updates the DOM classes for the column with the given iColumnIndex.
             *
             * @param {sap.ushell.components.workPageBuilder.controls.WorkPageRow} oRow The WorkPageRow instance.
             * @param {int} iColumnIndex The index of the column to update.
             * @param {int} iColSpan The new colspan.
             * @private
             */
            _updateColSpanClass: function (oRow, iColumnIndex, iColSpan) {
                oRow.$().find(".sapCepWorkPageColumn").eq(iColumnIndex)
                    .removeClass(function (index, className) {
                        return (className.match(/sapCepColSpan.*/g) || []).join(" ");
                    })
                    .addClass("sapCepColSpan" + iColSpan);
            },

            /**
             * Calculates the step to be taken, based on the input parameters.
             * If the new colspan is smaller than MIN_GRID_COLSPAN, do nothing.
             * Else, update the colspans via DOM manipulation.
             *
             * @param {sap.ushell.components.workPageBuilder.controls.WorkPageRow} oRow The WorkPageRow control instance.
             * @param {int} iLeftColumnIndex The index of the left column to update.
             * @param {int} iRightColumnIndex The index of the right column to update.
             * @param {int} iLeftColSpan The old colspan of the left column.
             * @param {int} iRightColSpan The old colspan of the right column.
             * @param {string} sDirection The resize direction: "left" or "right"
             * @return {null|{newLeftColSpan: int, newRightColSpan: int}} The resulting values.
             * @private
             */
            _doColumnResizeStep: function (oRow, iLeftColumnIndex, iRightColumnIndex, iLeftColSpan, iRightColSpan, sDirection) {
                var bRtl = sap.ui.getCore().getConfiguration().getRTL();
                var iStep = 0;

                if (!bRtl) {
                    iStep = sDirection === "right" ? STEP_SIZE : -STEP_SIZE;
                } else {
                    iStep = sDirection === "right" ? -STEP_SIZE : STEP_SIZE;
                }
                var iNewLeftColumnColSpan = iLeftColSpan + iStep;
                var iNewRightColumnColSpan = iRightColSpan - iStep;

                if (iNewLeftColumnColSpan < MIN_GRID_COLSPAN || iNewRightColumnColSpan < MIN_GRID_COLSPAN) {
                    Log.debug("new column value too small", iNewLeftColumnColSpan, iNewRightColumnColSpan);
                    return null;
                }

                this._updateColSpanClass(oRow, iLeftColumnIndex, iNewLeftColumnColSpan);
                this._updateColSpanClass(oRow, iRightColumnIndex, iNewRightColumnColSpan);

                return {
                    newLeftColSpan: iNewLeftColumnColSpan,
                    newRightColSpan: iNewRightColumnColSpan
                };
            },

            /**
             * Retrieves the colspan for the column with the given iColumnIndex from the model.
             *
             * @param {sap.ushell.components.workPageBuilder.controls.WorkPageRow} oRow The WorkPageRow control instance.
             * @param {int} iLeftColumnIndex The index of the left column.
             * @return {int} The colspan.
             * @private
             */
            _getCurrentColSpan: function (oRow, iLeftColumnIndex) {
                var sRowBindingContextPath = oRow.getBindingContext().getPath();
                var sColumnPath = sRowBindingContextPath + "/Columns/" + iLeftColumnIndex + "/Descriptor/colspan";
                return this.getView().getModel().getProperty(sColumnPath);
            },

            _getColSpan: function (oColumn) {
                return ObjectPath.get("Descriptor.colspan", oColumn) || MAX_GRID_COLSPAN;
            },

            _setColSpan: function (oColumn, iColspan) {
                return ObjectPath.set("Descriptor.colspan", iColspan, oColumn);
            },

            /**
             *
             * @param {sap.ushell.components.workPageBuilder.controls.WorkPageColumn[]} aColumns An array of WorkPageColumn controls.
             * @param {int} iColumnIndex The column index.
             * @param {int} iTotalColumns The total number of columns.
             * @return {sap.ushell.components.workPageBuilder.controls.WorkPageColumn[]} The updated array of WorkPageColumn controls.
             * @private
             */
            _calculateColSpans: function (aColumns, iColumnIndex, iTotalColumns) {
                var oColumn = aColumns[iColumnIndex];

                if (this._getColSpan(oColumn) - STEP_SIZE >= MIN_GRID_COLSPAN) {
                    this._setColSpan(oColumn, this._getColSpan(oColumn) - STEP_SIZE);
                    iTotalColumns = iTotalColumns - STEP_SIZE;
                }

                if (iTotalColumns > MAX_GRID_COLSPAN) {
                    var nextIndex = iColumnIndex - 1 >= 0 ? iColumnIndex - 1 : aColumns.length - 1;
                    this._calculateColSpans(aColumns, nextIndex, iTotalColumns);
                }

                return aColumns;
            },

            /**
             * Returns the data representation of an empty WorkPageColumn.
             *
             * @param {int} iColspan The colspan for the column.
             * @return {object} The WorkPageColumn data object.
             * @private
             */
            _createEmptyColumn: function (iColspan) {
                return {
                    Id: uid(),
                    Descriptor: {
                        colspan: iColspan
                    },
                    Configurations: [],
                    Cells: []
                };
            },

            /**
             * Returns the data representation of an empty WorkPageRow.
             *
             * @return {object} The WorkPageRow data object.
             * @private
             */
            _createEmptyRow: function () {
                return {
                    Id: uid(),
                    Descriptor: {
                        title: this.getView().getModel("i18n").getResourceBundle().getText("WorkPage.Row.OverflowToolbar.RowTitleLabel"),
                        description: "this is not yet rendered",
                        fillRowHeight: false,
                        fullWidth: false
                    },
                    Columns: [this._createEmptyColumn(MAX_GRID_COLSPAN)]
                };
            },

            _createEmptyCell: function () {
                return {
                    Id: uid(),
                    Descriptor: {},
                    Widgets: []
                };
            },

            /**
             * Saves the host in a variable to be attached to a card.
             *
             * @private
             */
            _saveHost: function () {
                this.oHost = sap.ui.getCore().byId("sap.shell.host.environment");

                if (!this.oHost) {
                    this.oHost = new Host("sap.shell.host.environment", {
                        resolveDestination: function (sDestinationName) {
                            if (!sDestinationName) {
                                return Promise.reject();
                            }
                            return Promise.resolve("/dynamic_dest/" + sDestinationName);
                        }
                    });
                }
            }
        });
});
