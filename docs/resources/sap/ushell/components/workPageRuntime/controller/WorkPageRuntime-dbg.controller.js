//Copyright (c) 2009-2022 SAP SE, All Rights Reserved

/**
 * @file WorkPageRuntime controller for WorkPageRuntime view
 * @version 1.108.12
 */
sap.ui.define([
    "sap/base/Log",
    "sap/ui/core/mvc/Controller",
    "sap/ushell/components/workPageRuntime/services/WorkPage",
    "sap/ui/model/json/JSONModel",
    "sap/base/util/deepExtend",
    "sap/ushell/EventHub",
    "sap/ushell/components/pages/controller/PagesAndSpaceId",
    "sap/ushell/resources",
    "sap/ushell/Config"
], function (
    Log,
    Controller,
    WorkPageService,
    JSONModel,
    deepExtend,
    EventHub,
    PagesAndSpaceId,
    resources,
    Config
) {
    "use strict";

    /**
     * Controller of the WorkPageRuntime view
     *
     * @param {string} sId Controller id
     * @param {object} oParams Controller parameters
     * @class
     * @assigns sap.ui.core.mvc.Controller
     * @private
     * @since 1.99.0
     * @alias sap.ushell.components.workPageRuntime.controller.WorkPages
     */
    return Controller.extend("sap.ushell.components.workPageRuntime.controller.WorkPageRuntime", /** @lends sap.ushell.components.workPageRuntime.controller.WorkPageRuntime.prototype */ {
        /**
         * UI5 lifecycle method which is called upon controller initialization.
         * @return {Promise} Promise that resolves if method is successful
         * @private
         * @since 1.99.0
         */
        onInit: function () {
            var oRenderer = sap.ushell.Container.getRenderer();
            var oUrlParams = new URLSearchParams(window.location.search);

            this.oWorkPageService = new WorkPageService();
            this.oOriginalModel = new JSONModel();
            this.oEditModel = new JSONModel({
                editMode: false,
                loaded: false
            });
            this.oWorkPageNavContainer = this.byId("workpageNavContainer");
            this.oEmptyPage = this.byId("emptyPage");

            this.oEditModel.setSizeLimit(Infinity); // allows more list bindings than the model default limit of 100 entries
            this.getView().setModel(this.oEditModel);


            return this._getPageId()
                .then(function (sPageId) {
                    this._sPageId = sPageId;
                    this._sSiteId = oUrlParams.get("siteId") || Config.last("/core/site/siteId");

                    return this._loadWorkPageAndVisualizations(this._sSiteId, this._sPageId)
                        .then(this._handleEditModeButton.bind(this))
                        .then(this._navigate.bind(this))
                        .finally(function () {
                            // Required to load the core-ext bundles to enable menubar, usersettings, search, ...
                            EventHub.emit("CenterViewPointContentRendered");

                            if (!this.getOwnerComponent().getNavigationDisabled()) {
                                this.oContainerRouter = oRenderer.getRouter();
                                this.oContainerRouter.getRoute("home").attachMatched(this.onRouteMatched.bind(this, false));
                                this.oContainerRouter.getRoute("openFLPPage").attachMatched(this.onRouteMatched.bind(this, false));
                                this.oContainerRouter.getRoute("openWorkPage").attachMatched(this.onRouteMatched.bind(this, false));
                            }
                            EventHub.on("WorkPageHasChanges").do(this._onWorkPageChanged.bind(this));
                        }.bind(this));
                }.bind(this))
                .catch(this._handleErrors.bind(this));
        },

        /**
         * On first rendering of the page
         * @return {Promise} Promise Resolves if operation is successful
         * @private
         *
         */
        _handleEditModeButton: function () {
            var bPageIsEditable = this.oOriginalModel.getProperty("/editable"); // Editable property comes from server
            var bIsAdminUser = sap.ushell.Container.getUser().isAdminUser(); // The flag comes from the server, too.
            if (bPageIsEditable && bIsAdminUser) {
                return this._createEditModeButton(
                    this._createEditButtonControlProperties()
                );
            }
            this._hideEditModeButton();
            return Promise.resolve();
        },

        /**
         * Called when the user has changed the work page during editing or the dirty state is cleared.
         * @param {boolean} bChanged If the page was changed after last save
         * @private
         *
         */
        _onWorkPageChanged: function (bChanged) {
            this.oEditModel.setProperty("/workPageHasChanges", !!bChanged);
            sap.ushell.Container.setDirtyFlag(!!bChanged);
        },

        /**
         * Navigates to the WorkPage page in the NavContainer.
         *
         * @private
         */
        _navigate: function () {
            this.oWorkPageNavContainer.to(this.byId("workPage"));
        },

        /**
         * Create control properties for edit button
         * @returns {Object} control properties for the edit button
         * @private
         */
        _createEditButtonControlProperties: function () {
            var sButtonText = resources.i18n.getText("WorkpageRuntime.EditMode.Activate");
            Log.debug("cep/editMode: create Edit Button", "Workpage runtime");
            return {
                id: "EditModeBtn",
                text: sButtonText,
                icon: "sap-icon://edit",
                press: [this.pressEditModeButton, this]
            };
        },

        /**
         * Creates the edit button or sets visibility to true if it exists
         * @param {Object} oEditButtonObjectData UI data for edit button
         * @return {Promise} Promise Resolves if operation is successful
         * @private
         *
         */
        _createEditModeButton: function (oEditButtonObjectData) {
            var oAddEditButtonParameters = {
                controlType: "sap.ushell.ui.launchpad.ActionItem",
                oControlProperties: oEditButtonObjectData,
                bIsVisible: true,
                aStates: ["home"]
            };
            this._showEditModeButton();
            return sap.ushell.Container
                .getRenderer("fiori2")
                .addUserAction(oAddEditButtonParameters)
                .then(function (oEditButton) {
                    // if xRay is enabled
                    if (Config.last("/core/extension/enableHelp")) {
                        oEditButton.addStyleClass("help-id-EditModeBtn");// xRay help ID
                    }
                });
        },

        /**
         * Sets the text ID for the edit button
         * @param {String} sTextId Text ID
         * @private
         */
        _setEditButtonText: function (sTextId) {
            if (sTextId) {
                var oEditModeButton = sap.ui.getCore().byId("EditModeBtn");
                if (oEditModeButton) {
                    var sEditModeText = resources.i18n.getText(sTextId);
                    oEditModeButton.setText(sEditModeText);
                    oEditModeButton.setTooltip(sEditModeText);
                }
            }
        },

        /**
         * Toggles the edit mode via the user menu
         * Toggles the text of the edit menu entry
         * @private
         */
        pressEditModeButton: function () {
            // If edit mode and there are changes
            if (this.oEditModel.getProperty("/editMode")) {
                if (this.oEditModel.getProperty("/workPageHasChanges")) {
                    this._saveChanges(); // Save and exit
                } else {
                    this._toggleEditMode(false); // No changes, exit directly
                }
            } else {
                this._toggleEditMode(true); // Activate editing mode
            }
        },

        /**
         * Toggles the edit mode according to the given bEditMode argument.
         *
         * @param {boolean} bEditMode Boolean indicating if editMode should be entered or left.
         * @private
         */
        _toggleEditMode: function (bEditMode) {
            EventHub.emit("enableMenuBarNavigation", !bEditMode);
            Log.debug("cep/editMode: toggle edit mode", " Work Page runtime");
            this.oEditModel.setProperty("/editMode", bEditMode);
            this._setEditButtonText(
                bEditMode ? "PageRuntime.EditMode.Exit" : "WorkpageRuntime.EditMode.Activate"
            );
            // Clear the dirty flag when start or done with editing.
            EventHub.emit("WorkPageHasChanges", false);
        },

        /**
         * Cancel any changes when the user pressed Cancel in Editing Mode and close editing.
         *
         * @private
         */
        _cancelChanges: function () {
            this._toggleEditMode(false);
            this._setModels(); // restore model from original data
        },

        /**
         * Save changes when the user pressed Save in Editing Mode and close editing.
         *
         * @private
         */
         _saveChanges: function () {
            var oView = this.getView();
            oView.setBusy(true);
            this._updateWorkPage()
            .then(function (oWorkPageData) {
                    // Show message and update model.
                    sap.ui.require(["sap/m/MessageToast"], function (MessageToast) {
                        MessageToast.show(resources.i18n.getText("savedChanges"), { duration: 4000 });
                    });
                    this._toggleEditMode(false);
                    this._setModels(); // Update model from the service
                }.bind(this))
            .catch(function (oError) {
                    // Show error message
                    var sErrorMsg = oError.responseText || oError;
                    sap.ui.require(["sap/m/MessageBox"], function (MessageBox) {
                        MessageBox.error(sErrorMsg, {
                            title: oError.statusText
                        });
                    });
                })
            .finally(function () {
                    oView.setBusy(false);
                });
        },

        /**
         * Closes the edit mode.
         *
         * @param {sap.base.Event} oEvent Event indicating if the changes have to be saved.
         * @private
         */
        _closeEditMode: function (oEvent) {
            (oEvent.getParameter("saveChanges") ? this._saveChanges : this._cancelChanges).bind(this)();
        },

        /**
         * Attach the event "loadCatalog" once the component is created
         * @param {sap.base.Event} oEvent The "onWorkPageBuilderCreated" event.
         */
        onWorkPageBuilderCreated: function (oEvent) {
            var oComponent = oEvent.getParameter("component");
            oComponent.attachEvent("loadCatalog", this._loadCatalog.bind(this));
            oComponent.attachEvent("closeEditMode", this._closeEditMode.bind(this));
        },

        /**
         * Loads the WorkPage with references to all used visualizations. The visualizations are also part of the result.
         * @param {string} sSiteId The id of the CDM site.
         * @param {string} sPageId The id of the CDM WorkPage.
         * @return {Promise} A promise that resolves with the page type when all data is loaded and the models have been filled.
         * @private
         */
        _loadWorkPageAndVisualizations: function (sSiteId, sPageId) {
            return this.oWorkPageService.loadWorkPageAndVisualizations(sSiteId, sPageId)
                .then(this._setModels.bind(this));
        },

        /**
         * Loads the WorkPage with references to all used visualizations.
         * Additionally, the visualizations are loaded.
         * @param {string} sSiteId The id of the CDM site.
         * @param {string} sPageId The id of the CDM WorkPage.
         * @return {Promise} A promise that resolves when all data is loaded and the models have been filled.
         * @private
         */
        _loadWorkPage: function (sSiteId, sPageId) {
            Log.debug("cep/editMode: load Work Page: " + sPageId, "Work Page runtime");
            return this.oWorkPageService.loadWorkPage(sSiteId, sPageId).then(function () {
                var aVizIds = this.oWorkPageService.getAllVizIds(this.oWorkPageService.getModel().getData());
                this.oWorkPageService.loadVisualizations(sSiteId, aVizIds)
                    .then(this._setModels.bind(this));
            }.bind(this));
        },

        /**
         * Loads the Catalog calling its respective service.
         * @return {Promise} A promise that resolves when all data is loaded and the models have been filled.
         * @param {object[]} aType Array of Tiles or Cards type to fetch
         * @private
        */
        _loadCatalog: function (aType) {
            return this.oWorkPageService.loadCatalog("", aType.getParameters()).then(function () {
                this.oEditModel.setProperty("/data/Catalog", this.oWorkPageService.getModel().getProperty("/data/Catalog"));
                this.oEditModel.firePropertyChange({ type: "Catalog" });
            }.bind(this));
        },

        /**
         * Saves the WorkPage on the backend after editing.
         * @return {Promise} A promise that resolves when data is saved.
         * @private
         */
         _updateWorkPage: function () {
            var oPageData = deepExtend({Id: this._sPageId}, this.oEditModel.getProperty("/data/WorkPage"));
            return this.oWorkPageService.updateWorkPage(this._sPageId, oPageData);
        },

        /**
         * Sets the data loaded in the workPageService model to the view models.
         *
         * @private
         */
        _setModels: function () {
            var oData = this.oWorkPageService.getModel().getData();
            this.oOriginalModel.setData(deepExtend({}, oData));
            if (this.oEditModel.getProperty("/editMode") === true) {
                // Make sure that the edit mode is properly reset when user overrides dirty dialog and returns back to the work page later.
                this._toggleEditMode(false);
            }
            this.oEditModel.setData(deepExtend({
                editMode: false,
                loaded: true,
                workPageHasChanges: false
            }, oData));

            this.getView().setModel(this.oEditModel);
        },

        /**
         * Hides the edit mode button
         *
         * @private
         * @since 1.107.0
         */
         _hideEditModeButton: function () {
             var oEditModeButton = sap.ui.getCore().byId("EditModeBtn");
             Log.debug("cep/editMode: hide Edit Mode button", "Work Page runtime");
            if (oEditModeButton) {
                oEditModeButton.setVisible(false);
            }
        },
        /**
         * Shows the edit mode button.
         *
         * @private
         * @since 1.107.0
         */
        _showEditModeButton: function () {
            var oEditModeButton = sap.ui.getCore().byId("EditModeBtn");
            Log.debug("cep/editMode: show Edit Mode button", "Work Page runtime");
            if (oEditModeButton) {
                oEditModeButton.setVisible(true);
            }
        },

        /**
         * Handles errors.
         * Hides the edit button.
         * Navigates to the error page.
         *
         * @param {object|string} vError An error object or string.
         * @private
         */
        _handleErrors: function (vError) {
            this._hideEditModeButton();
            Log.error("An error occurred while loading the page", vError);
            Log.debug("cep/editMode: on Route matched: Handle errors", "Work Page runtime");
            this.oWorkPageNavContainer.to(this.byId("errorPage"));
        },

        /**
         * Called if the Launchpad-openWorkPage route is matched.
         * The page type is work page
         * This should be removed if the intents are equal (Launchpad-openFLPPage).
         *
         * @return {Promise} Resolves when the data has been loaded.
         * @private
         */
        onRouteMatched: function () {
            Log.debug("cep/editMode: on Route matched", "Work Page runtime");

            return this._getPageId()
                .then(function (sPageId) {
                    this._sPageId = sPageId;

                    return this._loadWorkPageAndVisualizations(this._sSiteId, this._sPageId)
                        .then(this._navigate.bind(this));
                }.bind(this))
                .then(this._handleEditModeButton.bind(this))
                .catch(this._handleErrors.bind(this));
        },

        /**
         * Resolves with the MyHome pageId if it exists,
         * otherwise resolved the pageId from the hash or the default pageId.
         *
         * @return {Promise<string>} Promise resolving to the pageId string.
         * @private
         */
        _getPageId: function () {
            if (Config.last("/core/workPages/myHome/pageId")) {
                return Promise.resolve(Config.last("/core/workPages/myHome/pageId"));
            }
            return PagesAndSpaceId._getPageAndSpaceId()
                .then(function (oResult) { return oResult.pageId; });
        },

        /**
         * Hides the runtime.
         */
        hideRuntime: function () {
            Log.debug("cep/editMode: navigate to empty page", "Page runtime");
            this._hideEditModeButton();
            this.oWorkPageNavContainer.to(this.oEmptyPage);
        }
    });
});
