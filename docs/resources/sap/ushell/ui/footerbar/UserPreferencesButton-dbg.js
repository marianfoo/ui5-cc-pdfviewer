// Copyright (c) 2009-2022 SAP SE, All Rights Reserved

// Provides control sap.ushell.ui.footerbar.UserPreferencesButton.
sap.ui.define([
    "sap/base/Log",
    "sap/m/Bar",
    "sap/m/Button",
    "sap/m/ButtonRenderer", // will load the renderer async
    "sap/m/Dialog",
    "sap/m/DisplayListItem",
    "sap/m/library",
    "sap/m/List",
    "sap/m/Text",
    "sap/m/ObjectIdentifier",
    "sap/ui/core/IconPool",
    "sap/ui/Device",
    "sap/ui/layout/VerticalLayout",
    "sap/ui/model/json/JSONModel",
    "sap/ui/thirdparty/jquery",
    "sap/ushell/Config",
    "sap/ushell/EventHub",
    "sap/ushell/library", // css style dependency
    "sap/ushell/resources",
    "sap/ushell/ui/launchpad/AccessibilityCustomData",
    "sap/ushell/ui/launchpad/ActionItem",
    "sap/ushell/ui/utils"
], function (
    Log,
    Bar,
    Button,
    ButtonRenderer,
    Dialog,
    DisplayListItem,
    mobileLibrary,
    List,
    Text,
    ObjectIdentifier,
    IconPool,
    Device,
    VerticalLayout,
    JSONModel,
    jQuery,
    Config,
    EventHub,
    ushellLibrary,
    resources,
    AccessibilityCustomData,
    ActionItem,
    oUiUtils
) {
    "use strict";

    var ButtonType = mobileLibrary.ButtonType;

    /**
     * Constructor for a new ui/footerbar/UserPreferencesButton.
     *
     * @param {string} [sId] id for the new control, generated automatically if no id is given
     * @param {object} [mSettings] initial settings for the new control
     * @class Add your documentation for the new ui/footerbar/UserPreferencesButton
     * @extends sap.ushell.ui.launchpad.ActionItem
     * @constructor
     * @public
     * @name sap.ushell.ui.footerbar.UserPreferencesButton
     * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
     */
    var UserPreferencesButton = ActionItem.extend("sap.ushell.ui.footerbar.UserPreferencesButton", /** @lends sap.ushell.ui.footerbar.UserPreferencesButton.prototype */ {
        metadata: { library: "sap.ushell" },
        renderer: "sap.m.ButtonRenderer"
    });

    /**
     * UserPreferencesButton
     *
     * @name sap.ushell.ui.footerbar.UserPreferencesButton
     * @private
     * @since 1.16.0
     */
    UserPreferencesButton.prototype.init = function () {
        //call the parent button init method
        if (ActionItem.prototype.init) {
            ActionItem.prototype.init.apply(this, arguments);
        }
        this.setIcon("sap-icon://person-placeholder");
        this.translationBundle = resources.i18n;
        this.setText(this.translationBundle.getText("userSettings"));
        this.setTooltip(this.translationBundle.getText("settings_tooltip"));
        this.attachPress(this.showUserPreferencesDialog);
        this.oModel = Config.createModel("/core/userPreferences", JSONModel);
        this.setModel(this.oModel);
    };

    UserPreferencesButton.prototype.createDialog = function () {
        var that = this;

        this.saveButton = this._createSaveButton();
        this.cancelButton = this._createCancelButton();

        this.oDialog = new Dialog({
            id: "userPreferencesDialog",
            title: "{/dialogTitle}",
            contentWidth: "29.6rem",
            content: null,
            contentHeight: "17rem",
            buttons: [this.saveButton, this.cancelButton],
            afterClose: function () {
                this._destroyDialog();
                this.oUser.resetChangedProperties();
            }.bind(that),
            stretch: Device.system.phone
        }).addStyleClass("sapUshellUserPreferencesDialog").addStyleClass("sapContrastPlus");

        this._addDialogBackButton();
        this.oDialog.setModel(this.getModel());
        this.oDialog.addCustomData(new AccessibilityCustomData({
            key: "aria-label",
            value: that.translationBundle.getText("Settings_Dialog_Main_label"),
            writeToDom: true
        }));
        this.oDialog.addContent(this._getOriginalDialogContent());
    };

    UserPreferencesButton.prototype._getOriginalDialogContent = function () {
        if (!this.oInitialContent) {
            var oUserDetails,
                oEntryList;

            oUserDetails = this._getUserDetailsControl();
            oEntryList = this._getEntryListControl();

            this.oInitialContent = new VerticalLayout("userPreferencesLayout", {
                content: [oUserDetails, oEntryList],
                width: "100%"
            });
        }

        return this.oInitialContent;
    };

    UserPreferencesButton.prototype._getEntryListControl = function () {
        var oEntryTemplate = this._getUserPrefEntriesTemplate(),
            xRayEnabled = this.getModel() && this.getModel().getProperty("/enableHelp"),
            that = this,
            i,
            sUserName = this.oUser.getFullName(),
            origOnAfterRendering,
            entryList = new List("userPrefEnteryList", {
                items: {
                    path: "/entries",
                    template: oEntryTemplate
                }
            });

        entryList.addCustomData(new AccessibilityCustomData({
            key: "aria-label",
            value: that.translationBundle.getText("Settings_EntryList_label") + sUserName,
            writeToDom: true
        }));

        origOnAfterRendering = entryList.onAfterRendering;
        entryList.onAfterRendering = function () {
            var aEntries = this.getItems(),
                entryPath;

            // Execute the genuine onAfterRendering logic of the list.
            origOnAfterRendering.apply(this, arguments);
            // for each item in the list we need to add XRay help id
            // for each item in the list we need to execute the relevant function to get the entry value
            for (i = 0; i < aEntries.length; i++) {
                entryPath = aEntries[i].getBindingContext().getPath();
                // we would like to set the current entry value in case valueResult property is null
                if (!that.getModel().getProperty(entryPath + "/valueResult")) {
                    that._setEntryValueResult(entryPath);
                }
                if (xRayEnabled) {
                    that._addXRayHelpId(entryPath, aEntries[i]);
                }
            }
        };

        return entryList;
    };

    UserPreferencesButton.prototype._addXRayHelpId = function (entryPath, oListItem) {
        var helpID = this.getModel().getProperty(entryPath + "/entryHelpID");

        if (helpID) {
            oListItem.addStyleClass("help-id-" + helpID);
        }
    };

    UserPreferencesButton.prototype._setEntryValueResult = function (entryPath) {
        var that = this,
            isEditable = this.getModel().getProperty(entryPath + "/editable"),
            valueArgument = this.getModel().getProperty(entryPath + "/valueArgument");
        if (typeof valueArgument === "function") {
            // Display "Loading..." and disable the entry until the value result is available
            this.getModel().setProperty(entryPath + "/valueResult", this.translationBundle.getText("genericLoading"));
            this.getModel().setProperty(entryPath + "/editable", false);
            var oValuePromise = valueArgument();

            oValuePromise.done(function (valueResult) {
                that.getModel().setProperty(entryPath + "/editable", isEditable);
                that.getModel().setProperty(entryPath + "/visible", typeof (valueResult) === "object" ? !!valueResult.value : true);
                that.getModel().setProperty(entryPath + "/valueResult", typeof (valueResult) === "object" ? valueResult.displayText : valueResult);
            });
            oValuePromise.fail(function () {
                that.getModel().setProperty(entryPath + "/valueResult", that.translationBundle.getText("loadingErrorMessage"));
            });
        } else if (valueArgument) { // if valueArgument is not null or undefined, we would like to present it
            this.getModel().setProperty(entryPath + "/valueResult", valueArgument);
            this.getModel().setProperty(entryPath + "/editable", isEditable);
        } else { // in any other case (valueArgument is not function \ String \ Number \ Boolean)
            this.getModel().setProperty(entryPath + "/valueResult", this.translationBundle.getText("loadingErrorMessage"));
        }
    };

    UserPreferencesButton.prototype._emitEntryOpened = function (entryPath) {
        var oUserSettingsEntriesToSave = EventHub.last("UserSettingsOpened") || {},
            sPosition = entryPath.split("/").pop();
        oUserSettingsEntriesToSave[sPosition] = true;

        EventHub.emit("UserSettingsOpened", oUserSettingsEntriesToSave);
    };

    UserPreferencesButton.prototype._getUserPrefEntriesTemplate = function () {
        var that = this,
            oItem,
            pressHandler = function (e) {
                var oEventObj = {};

                oEventObj = jQuery.extend(true, {}, {}, e);

                sap.ui.require([
                    "sap/m/FlexBox",
                    "sap/m/FlexAlignItems",
                    "sap/m/FlexJustifyContent",
                    "sap/m/BusyIndicator"
                ], function (FlexBox, FlexAlignItems, FlexJustifyContent, BusyIndicator) {
                    var isContentValid = true,
                        oContent,
                        sContentId,
                        entryLabel = oEventObj.getSource().getLabel(),
                        entryPath = oEventObj.getSource().getBindingContext().getPath();

                    that.getModel().setProperty("/activeEntryPath", entryPath);
                    that._setDetailedEntryModeMode(true, entryPath, entryLabel, entryPath);
                    that.oDialog.removeAllContent();
                    sContentId = that.getModel().getProperty(entryPath + "/contentResult");
                    if (sContentId) {
                        oContent = sap.ui.getCore().byId(sContentId);
                        that.oDialog.addContent(oContent);
                        that._emitEntryOpened(entryPath);
                    } else {
                        var oBusyIndicator = null, // oBusyIndicator is initialized only when bShowBusyIndicator === true
                            oContentPromise,
                            bShowBusyIndicator = true,
                            bIsBusyIndicatorShown = false,
                            contentFunction = that.getModel().getProperty(entryPath + "/contentFunc");

                        if (typeof contentFunction === "function") {
                            that._emitEntryOpened(entryPath);

                            oContentPromise = contentFunction();

                            oContentPromise.done(function (contentResult) {
                                bShowBusyIndicator = false;
                                if (bIsBusyIndicatorShown === true) {
                                    that.oDialog.removeAllContent();
                                    oBusyIndicator.destroy(); // oBusyIndicator is destroyed only when it is actually presented
                                }

                                if (contentResult instanceof sap.ui.core.Control) {
                                    that.getModel().setProperty(entryPath + "/contentResult", contentResult.getId());
                                    that.oDialog.addContent(contentResult);
                                } else {
                                    isContentValid = false;
                                }
                            });
                            oContentPromise.fail(function () {
                                bShowBusyIndicator = false;
                                if (bIsBusyIndicatorShown === true) {
                                    that.oDialog.removeAllContent();
                                    oBusyIndicator.destroy(); // oBusyIndicator is destroyed only when it is actually presented
                                }
                                isContentValid = false;
                            });

                            oContentPromise.always(function () {
                                if (isContentValid === false) {
                                    var oErrorContent = new FlexBox("userPrefErrorFlexBox", {
                                        height: "5rem",
                                        alignItems: FlexAlignItems.Center,
                                        justifyContent: FlexJustifyContent.Center,
                                        items: [new Text("userPrefErrorText", { text: that.translationBundle.getText("loadingErrorMessage") })]
                                    });

                                    that.getModel().setProperty(entryPath + "/contentResult", oErrorContent.getId());
                                    that.oDialog.addContent(oErrorContent);
                                }
                            });

                            if (bShowBusyIndicator === true) {
                                oBusyIndicator = new BusyIndicator("userPrefLoadingBusyIndicator", { size: "2rem" });
                                that.oDialog.addContent(oBusyIndicator);
                                bIsBusyIndicatorShown = true;
                            }
                        }
                    }
                });
            };

        oItem = new DisplayListItem({
            label: "{title}",
            value: "{valueResult}",
            tooltip: {
                path: "valueResult",
                formatter: function (valueResult) {
                    return typeof (valueResult) === "string" ? valueResult : "";
                }
            },
            type: {
                path: "editable",
                formatter: function (editable) {
                    return (editable === true) ? "Navigation" : "Inactive"; // Default is Inactive
                }
            },
            visible: {
                path: "visible",
                formatter: function (visible) {
                    return (visible !== undefined) ? visible : true;
                }
            },
            press: pressHandler,
            customData: new AccessibilityCustomData({
                key: "aria-label",
                value: {
                    parts: [
                        { path: "title" },
                        { path: "valueResult" }
                    ],
                    formatter: function (sTitle, sValue) {
                        sValue = sValue || "";
                        return sTitle + " " + sValue;
                    }
                },
                writeToDom: true
            })
        });
        return oItem;
    };

    UserPreferencesButton.prototype._getUserDetailsControl = function () {
        return new ObjectIdentifier({
            title: this.oUser.getFullName(),
            text: this.oUser.getEmail()
        }).addStyleClass("sapUshellUserPrefUserIdentifier");
    };

    UserPreferencesButton.prototype._createCancelButton = function () {
        var that = this;
        return new Button({
            id: "cancelButton",
            text: {
                parts: ["/entries"],
                formatter: function (aEntries) {
                    if (!aEntries) {
                        return "";
                    }
                    var bEditableExist = aEntries.some(function (oEntry) {
                        return oEntry.editable;
                    });
                    return bEditableExist > 0 ? that.translationBundle.getText("cancelBtn") : that.translationBundle.getText("close");
                }
            },
            press: that._dialogCancelButtonHandler.bind(that),
            visible: true
        });
    };

    UserPreferencesButton.prototype._createSaveButton = function () {
        var that = this;
        return new Button({
            id: "saveButton",
            text: this.translationBundle.getText("saveBtn"),
            type: ButtonType.Emphasized,
            press: that._dialogSaveButtonHandler.bind(that),
            visible: {
                parts: ["/entries"],
                formatter: function (aEntries) {
                    if (!aEntries) {
                        return false;
                    }
                    return aEntries.some(function (oEntry) {
                        return oEntry.editable;
                    });
                }
            }
        });
    };

    UserPreferencesButton.prototype._setDetailedEntryModeMode = function (isDetailedEntryMode, entryPath, entryLabel, entryValue) {
        this.getModel().setProperty("/isDetailedEntryMode", !!isDetailedEntryMode);
        this.getModel().setProperty("/dialogTitle", entryLabel);
    };

    UserPreferencesButton.prototype.showUserPreferencesDialog = function () {
        this.oUser = sap.ushell.Container.getUser();
        this.createDialog();
        this.oDialog.open();
    };

    UserPreferencesButton.prototype._dialogBackButtonHandler = function (/*e*/) {
        var that = this;
        that.getModel().setProperty("/isDetailedEntryMode", false);
        that.getModel().setProperty("/dialogTitle", that.translationBundle.getText("userSettings"));
        that.oDialog.removeAllContent();
        that.oDialog.addContent(that._getOriginalDialogContent());
        that._setEntryValueResult(that.getModel().getProperty("/activeEntryPath"));
        that.getModel().setProperty("/activeEntryPath", null);
    };

    UserPreferencesButton.prototype._destroyDialog = function () {
        this.oHeadBar.destroy();
        this.oInitialContent.destroy();
        this.oInitialContent = null;
        this._modelCleanUpToInitial();
        this._entriesCleanUp();

        this.oDialog.destroy();
        this.saveButton.destroy();
        this.cancelButton.destroy();
    };

    UserPreferencesButton.prototype._entriesCleanUp = function () {
        var i,
            entriesArray = this.getModel().getProperty("/entries"),
            sContentResultId,
            oContentResult;

        for (i = 0; i < entriesArray.length; i++) {
            // destroy entry content if exists
            sContentResultId = entriesArray[i].contentResult;
            delete entriesArray[i].contentResult;
            if (sContentResultId) {
                oContentResult = sap.ui.getCore().byId(sContentResultId);
                oContentResult.destroy();
                oContentResult = null;
            }
            entriesArray[i].valueResult = null;
        }
        // update the entries model with the clean array
        this.getModel().setProperty("/entries", entriesArray);
    };

    UserPreferencesButton.prototype._modelCleanUpToInitial = function () {
        this.getModel().setProperty("/isDetailedEntryMode", false);
        this.getModel().setProperty("/dialogTitle", this.translationBundle.getText("userSettings"));
    };

    UserPreferencesButton.prototype._dialogSaveButtonHandler = function () {
        var that = this,
            isDetailedEntryMode,
            aEntries = this.getModel().getProperty("/entries"),
            saveEntriesPromise = oUiUtils.saveUserPreferenceEntries(aEntries);

        // in case the save button is pressed in the detailed entry mode, there is a need to update value result in the model
        isDetailedEntryMode = this.getModel().getProperty("/isDetailedEntryMode");
        if (isDetailedEntryMode) {
            this.getModel().setProperty("/activeEntryPath", null);
        }

        saveEntriesPromise.done(function () {
            that._showSaveMessageToast();
        });

        saveEntriesPromise.fail(function (failureMsgArr) {
            var errMessageText,
                errMessageLog = "";

            if (failureMsgArr.length === 1) {
                errMessageText = that.translationBundle.getText("savingEntryError") + " ";
            } else {
                errMessageText = that.translationBundle.getText("savingEntriesError") + "\n";
            }
            failureMsgArr.forEach(function (errObject) {
                errMessageText += errObject.entry + "\n";
                errMessageLog += "Entry: " + errObject.entry + " - Error message: " + errObject.message + "\n";
            });

            sap.ushell.Container.getServiceAsync("Message").then(function (oMessageService) {
                oMessageService.error(errMessageText, that.translationBundle.getText("Error"));
            });

            Log.error(
                "Failed to save the following entries",
                errMessageLog,
                "sap.ushell.ui.footerbar.UserPreferencesButton"
            );
        });
        this.oDialog.close();
        this._destroyDialog();
    };

    UserPreferencesButton.prototype._dialogCancelButtonHandler = function () {
        var i,
            aEntries = this.getModel().getProperty("/entries");

        // Invoke onCancel function for each userPreferences entry
        for (i = 0; i < aEntries.length; i++) {
            if (aEntries[i] && aEntries[i].onCancel) {
                aEntries[i].onCancel();
            }
        }
        this.oDialog.close();
        this._destroyDialog();
    };

    UserPreferencesButton.prototype._addDialogBackButton = function () {
        var that = this,
            oBackButton = new Button("userPrefBackBtn", {
                visible: "{/isDetailedEntryMode}",
                icon: IconPool.getIconURI("nav-back"),
                press: that._dialogBackButtonHandler.bind(that),
                tooltip: this.translationBundle.getText("feedbackGoBackBtn_tooltip")
            }),

            oDialogTitle = new Text("userPrefTitle", {
                text: "{/dialogTitle}"
            });

        this.oHeadBar = new Bar({
            contentLeft: [oBackButton],
            contentMiddle: [oDialogTitle]
        });

        this.oDialog.setCustomHeader(this.oHeadBar);
    };

    UserPreferencesButton.prototype._showSaveMessageToast = function () {
        var that = this;
        sap.ui.require(["sap/m/MessageToast"],
            function (MessageToast) {
                var message = that.translationBundle.getText("savedChanges");

                MessageToast.show(message, {
                    duration: 3000,
                    width: "15em",
                    my: "center bottom",
                    at: "center bottom",
                    of: window,
                    offset: "0 -50",
                    collision: "fit fit"
                });
            });
    };
    return UserPreferencesButton;
});
