// Copyright (c) 2009-2022 SAP SE, All Rights Reserved
sap.ui.define([
    "sap/ui/core/mvc/XMLView",
    "sap/ui/core/UIComponent",
    "sap/ui/model/json/JSONModel",
    "sap/ushell/Config",
    "sap/ushell/EventHub",
    "sap/ushell/resources",
    "sap/ushell/components/shell/Settings/ProfilingLoader",
    "sap/ushell/components/shell/Settings/userAccount/UserAccountEntry",
    "sap/ushell/components/shell/Settings/appearance/AppearanceEntry",
    "sap/ushell/components/shell/Settings/homepage/HomepageEntry",
    "sap/ushell/components/shell/Settings/spaces/SpacesEntry",
    "sap/ushell/components/shell/Settings/userActivities/UserActivitiesEntry",
    "sap/ushell/components/shell/Settings/userProfiling/UserProfilingEntry",
    "sap/ushell/components/shell/Settings/notifications/NotificationsEntry",
    "sap/ushell/components/shell/Settings/userDefaults/UserDefaultsEntry",
    "sap/ushell/components/shell/Settings/userLanguageRegion/UserLanguageRegionEntry",
    "sap/ushell/ui/shell/ShellHeadItem",
    "sap/ushell/utils"
], function (
    XMLView,
    UIComponent,
    JSONModel,
    Config,
    EventHub,
    resources,
    fnLoadStandardProfiling,
    UserAccountEntry,
    AppearanceEntry,
    HomepageEntry,
    SpacesEntry,
    UserActivitiesEntry,
    UserProfilingEntry,
    NotificationsEntry,
    UserDefaultsEntry,
    UserLanguageRegionEntry,
    ShellHeadItem,
    Utils
) {
    "use strict";

    var aDoables = [];

    return UIComponent.extend("sap.ushell.components.shell.Settings.Component", {

        metadata: {
            version: "1.108.12",
            library: "sap.ushell",
            dependencies: {
                libs: {
                    "sap.m": {},
                    "sap.ui.layout": {
                        lazy: true
                    }
                }
            }
        },

        /**
         * Initalizes the user settings and add standard entity into Config
         *
         * @private
         */
        init: function () {
            UIComponent.prototype.init.apply(this, arguments);
            var oShellConfig = sap.ushell.Container.getRenderer("fiori2").getShellConfig();
            if (oShellConfig.moveUserSettingsActionToShellHeader) {
                this.oSettingsBtn = this._addUserSettingsButton();
            }

            this._addStandardEntityToConfig();
            fnLoadStandardProfiling();
            this._addNotificationSettings().then(function (oAvailability) {
                // in case the dialog was opened already, overwrite its model
                if (oAvailability.notificationsAvailable && this.oSettingsView) {
                    this.oSettingsView.setModel(Config.createModel("/core/userPreferences", JSONModel));
                }
            }.bind(this));
            aDoables.push(EventHub.on("openUserSettings").do(this._openUserSettings.bind(this)));
        },

        /**
         * Get all standard entity of setting dialog and update ushell Config
         * - sets the performance mark for search entry, if active
         * @private
         */
        _addStandardEntityToConfig: function () {
            var aEntities = Config.last("/core/userPreferences/entries");

            aEntities.push(UserAccountEntry.getEntry()); // User account
            aEntities.push(AppearanceEntry.getEntry()); // Appearance

            if (SpacesEntry.isRelevant()) {
                aEntities.push(SpacesEntry.getEntry()); // Spaces
            }
            aEntities.push(UserLanguageRegionEntry.getEntry()); // Language

            if (Config.last("/core/shell/enableRecentActivity")) {
                aEntities.push(UserActivitiesEntry.getEntry()); // User Activities
            }
            aEntities.push(UserProfilingEntry.getEntry()); // User Profiling

            // Search
            if (Config.last("/core/shell/model/searchAvailable")) {
                sap.ushell.Container.getFLPPlatform().then(function (sPlatform) {
                    if (sPlatform !== "MYHOME") {
                        sap.ui.require(["sap/ushell/components/shell/Settings/search/SearchEntry"], function (SearchEntry) {
                            SearchEntry.getEntry().then(function (searchEntry) {
                                searchEntry.isActive().then(function (isActive) {
                                    if (!isActive) {
                                        return;
                                    }
                                    Utils.setPerformanceMark("FLP -- search setting entry is set active");
                                    aEntities = Config.last("/core/userPreferences/entries");
                                    aEntities.push(searchEntry);
                                    Config.emit("/core/userPreferences/entries", aEntities);
                                });
                            });
                        });
                    }
                });
            }

            if (Config.last("/core/home/enableHomePageSettings") && !Config.last("/core/spaces/enabled")) {
                aEntities.push(HomepageEntry.getEntry()); // Home Page
            }

            if (Config.last("/core/shell/model/userDefaultParameters")) {
                aEntities.push(UserDefaultsEntry.getEntry()); // User Defaults
            }

            aEntities = sap.ushell.Container.getRenderer("fiori2").reorderUserPrefEntries(aEntities);
            Config.emit("/core/userPreferences/entries", aEntities);
        },

        /**
         * Add the notifications settings entry and update the shell config. For this, the Notifications service has to be loaded and its
         * settings have to be retreived. Only after that, the settings dialog should be opened.
         *
         * @returns {Promise<object>} A promise that resolves, when the notifications settings have been loaded.
         * @private
         */
        _addNotificationSettings: function () {
            var oReturnValue = { notificationsAvailable: false };
            if (Config.last("/core/shell/model/enableNotifications")) { // Notifications
                sap.ushell.Container.getServiceAsync("Notifications")
                    .then(function (service) {
                        service._userSettingInitialization();
                        service._getNotificationSettingsAvalability()
                            .done(function (status) {
                                if (status.settingsAvailable) {
                                    var aEntities = Config.last("/core/userPreferences/entries");
                                    aEntities.push(NotificationsEntry.getEntry());
                                    Config.emit("/core/userPreferences/entries", aEntities);
                                    oReturnValue.notificationsAvailable = true;
                                    return Promise.resolve(oReturnValue);
                                }
                                return Promise.resolve(oReturnValue);
                            });
                    });
            }
            return Promise.resolve(oReturnValue);
        },

        /**
         * Create and open settings dialog
         * @param {object} oEvent Event contain id and time.
         * @private
         */
        _openUserSettings: function (oEvent) {
            if (!this.oDialog) {
                XMLView.create({
                    id: "settingsView",
                    viewName: "sap.ushell.components.shell.Settings.UserSettings"
                }).then(function (oSettingView) {
                    this.oSettingsView = oSettingView;
                    var oModel = Config.createModel("/core/userPreferences", JSONModel);
                    oSettingView.setModel(oModel);
                    oSettingView.setModel(resources.i18nModel, "i18n");
                    this.oDialog = oSettingView.byId("userSettingsDialog");
                    var sControlId = oEvent.controlId || "shell-header";
                    sap.ui.getCore().byId(sControlId).addDependent(oSettingView);

                    this.oDialog.open();
                }.bind(this));
            } else {
                this.oDialog.open();
            }
        },

        /**
         * Create and add the settings button to the header
         *
         * @returns {sap.ushell.ui.shell.ShellHeadItem} settings button
         */
        _addUserSettingsButton: function () {
            var oUserSettingsButton = new ShellHeadItem({
                id: "userSettingsBtn",
                icon: "sap-icon://action-settings",
                tooltip: resources.i18n.getText("ControlKey") + " + " + resources.i18n.getText("CommaKey"),
                text: resources.i18n.getText("userSettings"),
                ariaHaspopup: "dialog",
                press: this._openUserSettings.bind(this)
            });
            //Use ElementsModel, because button should be added only for specific states without propagation
            sap.ushell.Container.getRenderer("fiori2").oShellModel.addHeaderEndItem(
                [oUserSettingsButton.getId()],
                false,
                ["home", "app", "minimal", "standalone", "embedded", "embedded-home", "merged", "merged-home"],
                true
            );

            return oUserSettingsButton;
        },

        /**
         * Turns the eventlistener in this component off.
         *
         * @private
         */
        exit: function () {
            for (var i = 0; i < aDoables.length; i++) {
                aDoables[i].off();
            }
            if (this.oSettingsView) {
                this.oSettingsView.destroy();
                this.oSettingsView = null;
                this.oDialog = null;
            }
            if (this.oSettingsBtn) {
                this.oSettingsBtn.destroy();
                this.oSettingsBtn = null;
            }
        }
    });
});
