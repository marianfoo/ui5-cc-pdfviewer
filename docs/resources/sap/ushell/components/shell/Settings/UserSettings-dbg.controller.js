// Copyright (c) 2009-2022 SAP SE, All Rights Reserved

sap.ui.define([
    "sap/base/Log",
    "sap/base/util/UriParameters",
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/Fragment",
    "sap/ui/model/json/JSONModel",
    "sap/ui/Device",
    "sap/ushell/EventHub",
    "sap/ushell/resources",
    "sap/ushell/utils",
    "sap/ushell/utils/WindowUtils",
    "sap/ushell/components/shell/Settings/ErrorMessageHelper",
    "sap/ui/core/message/Message",
    "sap/ushell/components/shell/Settings/UserSettingsErrorMessagePopover",
    "sap/ui/core/MessageType"
], function (
    Log,
    UriParameters,
    Controller,
    Fragment,
    JSONModel,
    Device,
    EventHub,
    resources,
    ushellUtils,
    windowUtils,
    ErrorMessageHelper,
    Message,
    UserSettingsErrorMessagePopover,
    MessageType
) {
    "use strict";

    return Controller.extend("sap.ushell.components.shell.Settings.UserSettings", {
        /**
         * Initalizes the user settings dialog.
         *
         * @private
         */
        onInit: function () {
            this.getView().byId("userSettingEntryList").addEventDelegate({
                onAfterRendering: this._listAfterRendering.bind(this)
            });

            Device.orientation.attachHandler(function () {
                var oSplitApp = this.getView().byId("settingsApp");
                this._updateHeaderButtonVisibility(oSplitApp.isMasterShown());
            }.bind(this));
        },

        /**
         * Handle focus after closing the dialog.
         * If the dialog was opened
         *  - from MeArea, should set focus to me area button, because me area popover is closed
         *  - from header button, the focus will automatically be set on the header button
         *
         * @private
         */
        _afterClose: function () {
            if (window.document.activeElement && window.document.activeElement.tagName === "BODY") {
                window.document.getElementById("meAreaHeaderButton").focus();
            }
        },

        /**
         * Handles after renderering code of the list.
         *
         * @private
         */
        _listAfterRendering: function () {
            var oMasterEntryList = this.getView().byId("userSettingEntryList");

            var aEntries = oMasterEntryList.getItems();
            // For each item in the list we need to execute the relevant function to get the entry value
            for (var i = 0; i < aEntries.length; i++) {
                var sPath = aEntries[i].getBindingContextPath();
                this._setEntryValueResult(sPath);
            }

            if (!Device.system.phone) {
                var oFirstEntry = oMasterEntryList.getItems()[0];
                if (oFirstEntry) {
                    oMasterEntryList.setSelectedItem(oFirstEntry);
                    this._toDetail(oFirstEntry);
                    //keep focus on the first item when reopen the dialog
                    oFirstEntry.getDomRef().focus();
                }
            }
        },

        /**
         * Tries to load the information for the list item of an entry async.
         *
         * @param {string} sEntryPath a speific path of one of the entries
         * @private
         */
        _setEntryValueResult: function (sEntryPath) {
            var oModel = this.getView().getModel(),
                valueArgument = oModel.getProperty(sEntryPath + "/valueArgument"),
                sValueResult = oModel.getProperty(sEntryPath + "/valueResult");

            if (typeof valueArgument === "function") {
                // Display "Loading..."
                oModel.setProperty(sEntryPath + "/valueResult", resources.i18n.getText("genericLoading"));
                try {
                    valueArgument().then(
                        function (valueResult) {
                            //TO-DO think about interface
                            if (valueResult && valueResult.value !== undefined) {
                                oModel.setProperty(sEntryPath + "/visible", !!valueResult.value);
                            }

                            var sDisplayText;
                            if (typeof (valueResult) === "object") {
                                sDisplayText = valueResult.displayText || "";
                            } else {
                                sDisplayText = valueResult || "";
                            }
                            oModel.setProperty(sEntryPath + "/valueResult", sDisplayText);
                        }, function () {
                            oModel.setProperty(sEntryPath + "/valueResult", resources.i18n.getText("loadingErrorMessage"));
                        });
                } catch (error) {
                    Log.error("Can not load value for " + oModel.getProperty(sEntryPath + "/title") + " entry", error);
                    oModel.setProperty(sEntryPath + "/valueResult", resources.i18n.getText("loadingErrorMessage"));
                }
            } else if (sValueResult === null || sValueResult === undefined) { //Don't trigger check binding for the already set value
                oModel.setProperty(sEntryPath + "/valueResult", valueArgument || "");
            }
        },

        /**
         * Handles the Back button press
         *
         * @private
         */
        _navBackButtonPressHandler: function () {
            var oSplitApp = this.getView().byId("settingsApp");

            oSplitApp.backDetail();
            this._updateHeaderButtonVisibility(true);
        },

        /**
         * Handles the toggle button press in the header
         *
         * @private
         */
        _navToggleButtonPressHandler: function () {
            var oSplitApp = this.getView().byId("settingsApp"),
                bIsMasterShown = oSplitApp.isMasterShown();

            if (bIsMasterShown) {
                oSplitApp.hideMaster();
            } else {
                oSplitApp.showMaster();
            }
            this._updateHeaderButtonVisibility(!bIsMasterShown);
        },

        /**
         * Update header button
         *
         * @param {boolean} bIsMasterShown If master page is shown
         *
         * @private
         */
        _updateHeaderButtonVisibility: function (bIsMasterShown) {
            if (Device.system.phone) {
                var oBackButton = this.getView().byId("userSettingsNavBackButton");
                oBackButton.setVisible(!bIsMasterShown);
            } else {
                var oMenuButton = this.getView().byId("userSettingsMenuButton");
                if (Device.orientation.portrait) {
                    oMenuButton.setVisible(true);
                    oMenuButton.setPressed(bIsMasterShown);
                    oMenuButton.setTooltip(resources.i18n.getText(bIsMasterShown ? "ToggleButtonHide" : "ToggleButtonShow"));
                } else {
                    oMenuButton.setVisible(false);
                }
            }
        },

        /**
         * Handles the entry item press
         *
         * @param {object} oEvent the event that was fired
         * @private
         */
        _itemPress: function (oEvent) {
            this._toDetail(oEvent.getSource().getSelectedItem());
        },

        /**
         * Navigates to the detail page that belongs to the given selected item
         *
         * @param {object} oSelectedItem the entry control that should be handled
         * @returns {Promise<undefined>} A promise which resolves when the navigation was done.
         * @private
         */
        _toDetail: function (oSelectedItem) {
            var oModel = this.getView().getModel(),
                sEntryPath = oSelectedItem.getBindingContextPath(),
                sDetailPageId = oModel.getProperty(sEntryPath + "/contentResult");

            // Clear selection from list.
            if (Device.system.phone) {
                oSelectedItem.setSelected(false);
            }

            if (sDetailPageId) {
                this._navToDetail(sDetailPageId, sEntryPath);
                return Promise.resolve();
            }
            var oEntry = oModel.getProperty(sEntryPath);

            return this._createEntryContent(oEntry).then(function (sNewDetailPageId) {
                oModel.setProperty(sEntryPath + "/contentResult", sNewDetailPageId);
                this._navToDetail(sNewDetailPageId, sEntryPath);
            }.bind(this));
        },

        /**
         * Creates a detail page for the given Entry
         *
         * @param {object} oEntry that needs a detail page
         * @returns {Promise<string>} that resolves with the created Page id
         * @private
         */
        _createEntryContent: function (oEntry) {
            var that = this;
            var oCreateWrapperPromise = this._addContentWrapper(oEntry);

            if (typeof oEntry.contentFunc === "function") {
                oEntry.contentFunc().then(
                    function (oContentResult) {
                        if (oContentResult instanceof sap.ui.core.Control) {
                            oCreateWrapperPromise = oCreateWrapperPromise
                                .then(function (oPageWrapper) {
                                    oPageWrapper.addContent(oContentResult);
                                    oPageWrapper.setBusy(false);
                                    return oPageWrapper;
                                });
                        } else {
                            oCreateWrapperPromise = oCreateWrapperPromise
                                .then(that._addErrorContentToWrapper.bind(null, resources.i18n.getText("loadingErrorMessage")));
                        }
                    }, function (error) {
                        Log.error("Can not load content for " + oEntry.title + " entry", error);
                        oCreateWrapperPromise = oCreateWrapperPromise
                            .then(that._addErrorContentToWrapper.bind(null, resources.i18n.getText("loadingErrorMessage")));
                    });
            } else {
                oCreateWrapperPromise = oCreateWrapperPromise
                    .then(this._addErrorContentToWrapper.bind(null, resources.i18n.getText("userSettings.noContent")));
            }

            return oCreateWrapperPromise.then(function (oPageWrapper) {
                return oPageWrapper.getId();
            });
        },

        _addContentWrapper: function (oEntry) {
            var that = this;
            return Fragment.load({
                name: "sap.ushell.components.shell.Settings.ContentWrapper"
            }).then(function (oPageWrapper) {
                var oModel = new JSONModel({
                    title: oEntry.title,
                    showHeader: !oEntry.provideEmptyWrapper
                });
                oPageWrapper.setModel(oModel, "entryInfo");
                that.getView().byId("settingsApp").addDetailPage(oPageWrapper);
                return oPageWrapper;
            });
        },

        _addErrorContentToWrapper: function (sMessage, oPageWrapper) {
            return Fragment.load({
                name: "sap.ushell.components.shell.Settings.ErrorContent"
            }).then(function (oErrorFragment) {
                oPageWrapper.setBusy(false);
                oPageWrapper.getModel("entryInfo").setProperty("/errorMessage", sMessage);
                oPageWrapper.addContent(oErrorFragment);
                return oPageWrapper;
            });
        },

        /**
         * Navigates to the corresponding detail Page
         *
         * @param {string} sId the id of the detail Page the AppSplit-Container schould navigate to
         * @param {string} sEntryPath the path ot the entry that should be navigated to
         * @private
         */
        _navToDetail: function (sId, sEntryPath) {
            var oSplitApp = this.getView().byId("settingsApp");

            oSplitApp.toDetail(sId);
            if (oSplitApp.getMode() === "ShowHideMode") {
                oSplitApp.hideMaster();
                this._updateHeaderButtonVisibility(false);
            }
            this._emitEntryOpened(sEntryPath);
        },

        /**
         * Emits an event to notify that the given entry needs to be saved.
         *
         * @param {string} sEntryPath the model path of the entry
         * @private
         */
        _emitEntryOpened: function (sEntryPath) {
            var aUserSettingsEntriesToSave = EventHub.last("UserSettingsOpened") || {},
                oEntry = this.getView().getModel().getProperty(sEntryPath),
                sId = oEntry.id;

            if (!sId) {
                sId = ushellUtils._getUid();
                this.getView().getModel().setProperty(sEntryPath + "/id", sId);
            }
            aUserSettingsEntriesToSave[sId] = true;
            EventHub.emit("UserSettingsOpened", aUserSettingsEntriesToSave);
        },

        /**
         * Create the MessagePopover for error messages.
         *
         * @returns {Promise} The promise to load the MessagePopover-fragment
         * @private
         */
        _createMessagePopover: function () {
            if (!this.oMessagePopover) {
                return UserSettingsErrorMessagePopover.create()
                    .then(function (oMessagePopover) {
                        oMessagePopover.setModel(this.getView().getModel("i18n"), "i18n");
                        this.oMessagePopover = oMessagePopover;
                    }.bind(this));
            }
            return Promise.resolve();
        },

        /**
         * Open/Close the MessagePopover.
         *
         * @param {sap.ui.base.Event} event The press event
         * @private
         */
        _handleMessagePopoverPress: function (event) {
            this.oMessagePopover.toggle(event.getSource());
        },

        /**
         * Save and close User Settings Dialog.
         *
         * @returns {Promise} Resolves with undefined once the function is completed
         * @private
         */
        _handleSaveButtonPress: function () {
            ErrorMessageHelper.removeErrorMessages();

            var that = this,
                oDialog = this.getView().byId("userSettingsDialog"),
                aEntries = this.getView().getModel().getProperty("/entries"),
                oOpenedEntries = EventHub.last("UserSettingsOpened") || {},
                aSavePromises;

            if (Object.keys(oOpenedEntries).length === 0) {
                this._handleSettingsDialogClose();
                this._showSuccessMessageToast();
                return Promise.resolve();
            }
            oDialog.setBusy(true);

            aSavePromises = aEntries.reduce(function (aResult, oEntry) {
                if (oOpenedEntries[oEntry.id]) {
                    // onSave can be native Promise or jQuerry promise.
                    aResult.push(this._executeEntrySave(oEntry));
                }
                return aResult;
            }.bind(this), []);

            return Promise.all(aSavePromises)
                .then(function (aResults) {
                    var aFailedExecutions = ErrorMessageHelper.filterMessagesToDisplay();

                    oDialog.setBusy(false);

                    if (aFailedExecutions.length > 0) {
                        var oMessagePopoverButton = that.getView().byId("userSettingsMessagePopoverBtn");
                        oMessagePopoverButton.setText(aFailedExecutions.length);
                        oMessagePopoverButton.setVisible(true);

                        var oOnAfterRenderingPromise = new Promise(function (resolve) {
                            var oDelegate = {
                                onAfterRendering: function () {
                                    oMessagePopoverButton.removeEventDelegate(oDelegate);
                                    resolve();
                                }
                            };
                            oMessagePopoverButton.invalidate();
                            oMessagePopoverButton.addEventDelegate(oDelegate);
                        });

                        var sErrMessageLog = "";
                        aFailedExecutions.forEach(function (oError) {
                            sErrMessageLog += "Entry: " + oError.getAdditionalText() + " - Error message: " + oError.getDescription() + "\n";
                        });
                        Log.error("Failed to save the following entries", sErrMessageLog);

                        return Promise.all([
                            oOnAfterRenderingPromise,
                            that._createMessagePopover()
                        ]).then(function () {
                            that.oMessagePopover.setModel(new JSONModel(aFailedExecutions), "errorMessages");
                            that.oMessagePopover.openBy(oMessagePopoverButton);
                        });
                    }
                    that._handleSettingsDialogClose();
                    that._showSuccessMessageToast();
                    EventHub.emit("UserSettingsOpened", null);
                    var bRefresh = false,
                        bNoHash = false;
                    var aUrlParams = [];
                    aResults.forEach(function (oResult) {
                        if (oResult && oResult.refresh) {
                            bRefresh = true;
                        }
                        if (oResult && oResult.noHash) {
                            bNoHash = true;
                        }
                        if (oResult && oResult.urlParams && oResult.urlParams.length > 0) {
                            aUrlParams = aUrlParams.concat(oResult.urlParams);
                        }
                    });
                    if (bRefresh && !bNoHash) {
                        windowUtils.refreshBrowser(aUrlParams);
                    } else if (bRefresh && bNoHash) {
                        // Remove hash, otherwise we navigate to "content" we do not want.
                        window.location = window.location.href.replace(window.location.hash, "");
                    }
                    return Promise.resolve();
                });
        },

        _executeEntrySave: function (oEntry) {
            var onSavePromise,
                oResultPromise;

            function onSuccess (params) {
                return params || {};
            }

            function onError (errorInformation) {
                var sMessage;
                var sEntryId = oEntry.id;
                var sEntryTitle = oEntry.title;

                if (!errorInformation) {
                    sMessage = resources.i18n.getText("userSettings.SavingError.Undefined");
                } else if (typeof (errorInformation) === "string") {
                    sMessage = errorInformation;
                } else if (Array.isArray(errorInformation)) {
                    errorInformation.forEach(function (message) {
                        message.setAdditionalText(sEntryTitle);
                        message.setTechnicalDetails({pluginId: sEntryId});
                        ErrorMessageHelper.addMessage(message);
                    });
                    return;
                } else if (errorInformation instanceof sap.ui.core.message.Message) {
                    errorInformation.setAdditionalText(sEntryTitle);
                    errorInformation.setTechnicalDetails({pluginId: sEntryId});
                    ErrorMessageHelper.addMessage(errorInformation);
                    return;
                } else {
                    sMessage = resources.i18n.getText("userSettings.SavingError.WithMessage", errorInformation.message);
                }

                ErrorMessageHelper.addMessage(new Message({
                    type: MessageType.Error,
                    additionalText: sEntryTitle,
                    technicalDetails: {
                        pluginId: sEntryId
                    },
                    description: sMessage,
                    message: sMessage
                }));
            }

            try {
                // Reset changed properties before each batch operation. Otherwise it can happen that changed
                // properties from previous entries are sent again.
                sap.ushell.Container.getUser().resetChangedProperties();
                onSavePromise = oEntry.onSave();
            } catch (error) {
                return onError(error);
            }

            //jQuerry promise
            if (onSavePromise && onSavePromise.promise) {
                Log.warning("jQuery.promise is used to save " + oEntry.title + " settings entry.\n"
                    + "The using of jQuery.promise for onSave is deprecated. Please use the native promise instead.");
                oResultPromise = new Promise(function (resolve) {
                    onSavePromise
                        .done(function (params) {
                            resolve(onSuccess(params));
                        })
                        .fail(function (sErrorMessage) {
                            resolve(onError(sErrorMessage));
                        });
                });
            } else {
                oResultPromise = onSavePromise.then(onSuccess, onError);
            }
             return oResultPromise;
        },

        _showSuccessMessageToast: function () {
            sap.ui.require(["sap/m/MessageToast"], function (MessageToast) {
                var sMessage = resources.i18n.getText("savedChanges");

                MessageToast.show(sMessage, {
                    offset: "0 -50"
                });
            });
        },

        /**
         * Close User Settings Dialog without saving.
         *
         * @private
         */
        _handleCancel: function () {
            var aEntries = this.getView().getModel().getProperty("/entries");
            // Invoke onCancel function for opened entity
            var oInvokedEntities = EventHub.last("UserSettingsOpened") || {};
            if (oInvokedEntities) {
                aEntries.forEach(function (oEntry) {
                    if (oInvokedEntities[oEntry.id] && oEntry.onCancel) {
                        try {
                            oEntry.onCancel();
                        } catch (error) {
                            Log.error("Failed to cancel the following entries", error);
                        }
                    }
                });
            }
            EventHub.emit("UserSettingsOpened", null);
            this._handleSettingsDialogClose();
        },

        /**
         * Close User Settings Dialog.
         *
         * @private
         */
        _handleSettingsDialogClose: function () {
            //to be sure that all user changes reset
            sap.ushell.Container.getUser().resetChangedProperties();
             // Clear selection from list.
             if (Device.system.phone) {
                this.getView().byId("settingsApp").toMaster("settingsView--userSettingMaster");
            }
            this.getView().byId("userSettingsMessagePopoverBtn").setVisible(false);
            this.getView().byId("userSettingsDialog").close();
        }

    });

});
