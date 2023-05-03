// Copyright (c) 2009-2022 SAP SE, All Rights Reserved

sap.ui.define([
    "sap/base/Log",
    "sap/ui/core/mvc/Controller",
    "sap/ushell/EventHub",
    "sap/ushell/Config",
    "sap/ui/core/Component",
    "sap/ui/thirdparty/jquery",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/theming/Parameters",
    "sap/ui/Device",
    "sap/ushell/resources",
    "sap/ui/core/message/Message",
    "sap/ui/core/MessageType",
    "sap/ushell/User",
    "sap/ushell/services/DarkModeSupport"
], function (
    Log,
    Controller,
    EventHub,
    Config,
    Component,
    jQuery,
    JSONModel,
    Parameters,
    Device,
    resources,
    Message,
    MessageType,
    User
) {
    "use strict";

    // gets the common name of complementary (dark/lite) themes
    function getCommonName (themeId) {
        switch (themeId) {
            case "sap_fiori_3":
            case "sap_fiori_3_dark":
                return "SAP Quartz";
            case "sap_horizon":
            case "sap_horizon_dark":
                return "SAP Horizon";
            case "sap_fiori_3_hcb":
            case "sap_fiori_3_hcw":
                return resources.i18n.getText("AppearanceHighContrastTheme", "SAP Quartz");
            case "sap_horizon_hcb":
            case "sap_horizon_hcw":
                return resources.i18n.getText("AppearanceHighContrastTheme", "SAP Horizon");
            default:
                Log.error("Can not find common name for the theme", themeId);
                return themeId || "";
        }
    }

    var SAP_THEMES = {
        base: "sapUshellBaseIconStyle",
        sap_bluecrystal: "sapUshellBlueCrystalIconStyle",
        sap_belize_hcb: "sapUshellHCBIconStyle sapUshellHCBIconStyleOnHCB",
        sap_belize_hcw: "sapUshellHCWIconStyle sapUshellHCWIconStyleOnHCW",
        sap_belize: "sapUshellBelizeIconStyle",
        sap_belize_plus: "sapUshellPlusIconStyle",
        sap_fiori_3_hcb: "sapUshellQuartzHCBIconStyle sapUshellHCBIconStyleOnHCB",
        sap_fiori_3_hcw: "sapUshellQuartzHCWIconStyle sapUshellHCWIconStyleOnHCW",
        sap_fiori_3: "sapUshellQuartzLightIconStyle",
        sap_fiori_3_dark: "sapUshellQuartzDarkIconStyle",
        sap_horizon_hcb: "sapUshellHorizonHCBIconStyle sapUshellHCBIconStyleOnHCB",
        sap_horizon_hcw: "sapUshellHorizonHCWIconStyle sapUshellHCWIconStyleOnHCW",
        sap_horizon: "sapUshellHorizonLightIconStyle",
        sap_horizon_dark: "sapUshellHorizonDarkIconStyle"
    };

    return Controller.extend("sap.ushell.components.shell.Settings.appearance.Appearance", {
        TILE_SIZE: {
            Small: 0,
            Responsive: 1,

            getName: function (iValue) {
                return Object.keys(this)[iValue];
            }
        },

        onInit: function () {
            var oView = this.getView();

            this.oUser = sap.ushell.Container.getUser();
            this.aThemeListFromServer = oView.getViewData().themeList || [];

            this.oPersonalizers = {};

            // set models
            var oResourceModel = resources.getTranslationModel();
            oView.setModel(oResourceModel, "i18n");
            oView.setModel(this.getConfigurationModel(), "config");

            // listener
            sap.ui.getCore().attachThemeChanged(this._handleThemeApplied, this);

            return this.getDarkModeModel(this.aThemeListFromServer)
                .then(function (oDarkModeModel) {
                    this._oDarkModeModel = oDarkModeModel;
                    oView.setModel(this._oDarkModeModel, "darkMode");

                    // Model for the tab with theme list
                    var oUserTheme = this.oUser.getTheme();
                    oView.setModel(new JSONModel({
                        options: this._getThemeListData(this.aThemeListFromServer, oUserTheme),
                        ariaTexts: { headerLabel: resources.i18n.getText("Appearance") }
                    }));
                }.bind(this));

        },

        onExit: function () {
            sap.ui.getCore().detachThemeChanged(this._handleThemeApplied, this);
        },

        // Return the ID of the currently selected theme in the theme list.
        // If no selection, return the current user theme.
        _getSelectedTheme: function () {
            var oSelectedItem = this.getView().byId("themeList").getSelectedItem(),
                oBindingContext = oSelectedItem ? oSelectedItem.getBindingContext() : null,
                sThemeId = oBindingContext ? oBindingContext.getProperty("id") : this.oUser.getTheme();
            return sThemeId;
        },

        _getThemeListData: function (aThemeList, sCurrentThemeId) {
            if (this.oUser.isSetThemePermitted() === false) {
                var sName = sCurrentThemeId;
                for (var i = 0; i < aThemeList.length; i++) {
                    if (aThemeList[i].id === sCurrentThemeId) {
                        sName = aThemeList[i].name || sCurrentThemeId;
                        break;
                    }
                }
                return [{
                    id: sCurrentThemeId,
                    name: sName
                }];
            }
            var oDarkModeModelData = this.getView().getModel("darkMode").getData(),
                isDarkModeActive = this._isDarkModeActive();
            return aThemeList.reduce(function (aList, oTheme) {
                var oThemeForModel = {
                    id: oTheme.id,
                    name: oTheme.name || oTheme.id || "",
                    isVisible: true,
                    isSelected: oTheme.id === sCurrentThemeId,
                    isSapTheme: !!SAP_THEMES[oTheme.id]
                };

                if (isDarkModeActive && oDarkModeModelData.supportedThemes[oTheme.id]) {
                    var oThemeDarkModeConfig = oDarkModeModelData.supportedThemes[oTheme.id];
                    if (oThemeDarkModeConfig.complementaryTheme === sCurrentThemeId || oTheme.id === sCurrentThemeId) {
                        // if one theme from pair is selected show selected theme with common name
                        oThemeForModel.isVisible = oTheme.id === sCurrentThemeId;
                    } else {
                        // if theme is not selected, show light theme as combine
                        oThemeForModel.isVisible = oThemeDarkModeConfig.mode === sap.ushell.services.DarkModeSupport.Mode.LIGHT;
                    }
                    // don't change the name, because leads to different sorting and error in onAfterRendering
                    oThemeForModel.combineName = oThemeDarkModeConfig.combineName;
                }

                aList.push(oThemeForModel);
                return aList;
            }, []).sort(function (theme1, theme2) {
                var iOrder = theme1.name.localeCompare(theme2.name);
                if (iOrder === 0) {
                    iOrder = theme1.id.localeCompare(theme2.id);
                }
                return iOrder;
            });
        },

        getConfigurationModel: function () {
            return new JSONModel({
                themeConfigurable: Config.last("/core/shell/model/setTheme"),
                sizeBehaviorConfigurable: Config.last("/core/home/sizeBehaviorConfigurable"),
                tileSize: this.TILE_SIZE[Config.last("/core/home/sizeBehavior")],
                contentDensityConfigurable: Config.last("/core/shell/model/contentDensity") && !Device.system.phone,
                isCozyContentMode: document.body.classList.contains("sapUiSizeCozy"),
                sapUiContentIconColor: Parameters.get("sapUiContentIconColor"),
                textAlign: Device.system.phone ? "Left" : "Right"
            });
        },

        getDarkModeModel: function (aThemeList) {
            var oDarkModeModel = new JSONModel({});
            var oDarkModeModelData = {
                enabled: false,
                detectionSupported: false,
                detectionEnabled: false,
                supportedThemes: {}
            };
            var oPromise;

            if (Config.last("/core/darkMode/enabled")) {
                oPromise = sap.ushell.Container.getServiceAsync("DarkModeSupport")
                    .then(function (oDarkModeSupport) {
                        oDarkModeModelData.enabled = true;
                        oDarkModeModelData.detectionSupported = oDarkModeSupport.canAutomaticallyToggleDarkMode();
                        // If detection is not supported, e.g. due to the &sap-theme= url parameter, do not enable dark mode detection disregarding the previous user setting.
                        oDarkModeModelData.detectionEnabled = oDarkModeModelData.detectionSupported && this.oUser.getDetectDarkMode(); // If possible and enabled by the user.
                        oDarkModeModelData.supportedThemes = this._getSupportedDarkModeThemes(aThemeList, Config.last("/core/darkMode/supportedThemes") || []);
                        oDarkModeModel.setData(oDarkModeModelData);
                        return oDarkModeModel;
                    }.bind(this));
            } else {
                oDarkModeModel.setData(oDarkModeModelData);
                oPromise = Promise.resolve(oDarkModeModel);
            }

            return oPromise;
        },

        _getSupportedDarkModeThemes: function (aThemeList, aSupportedThemePairs) {
            var oThemeNamesMap = aThemeList.reduce(function (oResult, oTheme) {
                oResult[oTheme.id] = oTheme.name;
                return oResult;
            }, {});

            return aSupportedThemePairs.reduce(function (oResult, oPair) {
                var sLightThemeId = oPair.light,
                    sDarkThemeId = oPair.dark,
                    sLightThemeName = oThemeNamesMap[sLightThemeId],
                    sDarkThemeName = oThemeNamesMap[sDarkThemeId];

                if (sLightThemeName && sDarkThemeName && !oResult[sLightThemeId] && !oResult[sDarkThemeId]) {
                    // skip if some theme is missing from pair in aThemeList or some of the theme is used (wrong configuration)
                    var sCombineName = getCommonName(sLightThemeId);
                    oResult[sLightThemeId] = {
                        mode: sap.ushell.services.DarkModeSupport.Mode.LIGHT,
                        complementaryTheme: sDarkThemeId,
                        combineName: sCombineName
                    };
                    oResult[sDarkThemeId] = {
                        mode: sap.ushell.services.DarkModeSupport.Mode.DARK,
                        complementaryTheme: sLightThemeId,
                        combineName: sCombineName
                    };
                }
                return oResult;
            }, {});
        },

        onAfterRendering: function () {
            var bDarkModeActive = this._isDarkModeActive(),
                isListSelected = this.getView().getModel("config").getProperty("/themeConfigurable");

            var oList = this.getView().byId("themeList"),
                items = oList.getItems(),
                oIcon,
                sThemeId;

            oList.toggleStyleClass("sapUshellThemeListDisabled", !isListSelected);
            items.forEach(function (oListItem, index) {
                sThemeId = oListItem.getCustomData()[0].getValue();
                oIcon = oListItem.getContent()[0].getItems()[0].getItems()[0];

                if (SAP_THEMES[sThemeId]) {
                    oIcon.addStyleClass(SAP_THEMES[sThemeId]);
                }
                oIcon.toggleStyleClass("sapUshellDarkMode", bDarkModeActive); // special icon for combined themes in the dark mode
            });
        },

        _handleThemeApplied: function () {

            var oConfigModel = this.getView().getModel("config");
            if (oConfigModel) {
                oConfigModel.setProperty("/sapUiContentIconColor", Parameters.get("sapUiContentIconColor"));
                 // readjusts the theme list after the dark mode change
                var oUserTheme = this.oUser.getTheme();
                var aThemeListData = this._getThemeListData(this.aThemeListFromServer, oUserTheme);

                this.getView().getModel().setProperty("/options", aThemeListData);
            }
        },

        onCancel: function () {
            var oConfigModel = this.getView().getModel("config");

            if (oConfigModel.getProperty("/themeConfigurable")) {
                var sUserTheme = this.oUser.getTheme(),
                    aThemeOptions = this.getView().getModel().getProperty("/options");
                aThemeOptions.forEach(function (oThemeOption) {
                    oThemeOption.isSelected = sUserTheme === oThemeOption.id;
                });
                this.getView().getModel().setProperty("/options", aThemeOptions);
            }
            if (oConfigModel.getProperty("/contentDensityConfigurable")) {
                oConfigModel.setProperty("/isCozyContentMode", this.oUser.getContentDensity() === "cozy");
            }
            if (oConfigModel.getProperty("/sizeBehaviorConfigurable")) {
                oConfigModel.setProperty("/tileSize", this.TILE_SIZE[Config.last("/core/home/sizeBehavior")]);
            }

            if (this._oDarkModeModel && this._oDarkModeModel.getProperty("/enabled")) {
                this._oDarkModeModel.setProperty("/detectionEnabled", this.oUser.getDetectDarkMode());
                this.oUser.resetChangedProperty("detectDarkMode");
            }
        },

        onSave: function () {
            var oConfigModel = this.getView().getModel("config"),
                aSavePromises = [];

            if (oConfigModel.getProperty("/themeConfigurable")) {
                aSavePromises.push(this.onSaveThemes().then(function () {
                   EventHub.emit("themeChanged", Date.now());
                }));
            }

            if (oConfigModel.getProperty("/contentDensityConfigurable")) {
                aSavePromises.push(this.onSaveContentDensity());
            }

            if (oConfigModel.getProperty("/sizeBehaviorConfigurable")) {
                aSavePromises.push(this.onSaveTileSize());
            }

            if (this._oDarkModeModel && this._oDarkModeModel.getProperty("/enabled")) {
                aSavePromises.push(this.onSaveDarkModeEnabled());
            }

            if (this._updateUserPreferencesPromise) {
                this._updateUserPreferencesPromise.sendRequest(); // Send the combined batch request.
            }

            return Promise.all(aSavePromises)
                .then(function (aResult) {
                    var aMessages = [];
                    aResult.forEach(function (arrayEntry) {
                        if (arrayEntry && arrayEntry instanceof sap.ui.core.message.Message) {
                            aMessages.push(arrayEntry);
                        }
                    });
                    return aMessages.length > 0 ? Promise.reject(aMessages) : Promise.resolve();
                });
        },

        onSaveThemes: function () {
            var oConfigModel = this.getView().getModel("config"),
                sNewThemeId = this._getSelectedTheme(),
                oUser = this.oUser,
                sOriginalThemeId = oUser.getTheme(User.prototype.constants.themeFormat.ORIGINAL_THEME);

            if (sNewThemeId && sNewThemeId !== sOriginalThemeId && oConfigModel.getProperty("/themeConfigurable")) {
                oUser.setTheme(sNewThemeId);
                return this._updateUserPreferences(oUser)
                    .then(function () {
                        oUser.resetChangedProperty("theme");
                        return this._applyDarkMode(); // make sure that the dark mode is applied after the theme change
                    }.bind(this))
                    .catch(function (errorMessage, parsedErrorInformation) {
                        oUser.setTheme(sOriginalThemeId);
                        oUser.resetChangedProperty("theme");
                        Log.error("Can not save selected theme", errorMessage);
                        return new Message({
                            type: MessageType.Error,
                            description: errorMessage,
                            message: parsedErrorInformation.message.value,
                            date: parsedErrorInformation.innererror.timestamp,
                            httpStatus: parsedErrorInformation.httpStatus
                        });
                });
            }
            return Promise.resolve();
        },

        onSaveContentDensity: function () {
            var oConfigModel = this.getView().getModel("config"),
                oUser = this.oUser,
                sNewContentDensity = oConfigModel.getProperty("/isCozyContentMode") ? "cozy" : "compact",
                sUserContentDensity = oUser.getContentDensity();

            if (sNewContentDensity !== sUserContentDensity && oConfigModel.getProperty("/contentDensityConfigurable")) {
                oUser.setContentDensity(sNewContentDensity);
                return this._updateUserPreferences(this.oUser)
                    .then(function () {
                        oUser.resetChangedProperty("contentDensity");
                        sap.ui.getCore().getEventBus().publish("launchpad", "toggleContentDensity", {
                            contentDensity: sNewContentDensity
                        });
                        EventHub.emit("toggleContentDensity", {
                            contentDensity: sNewContentDensity
                        });
                        return new Promise(function (resolve) {
                            // resolve the promise _after_ the event has been processed;
                            // we need to do this in an event handler, as the EventHub is asynchronous.
                            EventHub.once("toggleContentDensity").do(function () {
                                resolve();
                            });
                        });
                    })
                    .catch(function (errorMessage, parsedErrorInformation) {
                        oUser.setContentDensity(sUserContentDensity);
                        oUser.resetChangedProperty("contentDensity");
                        Log.error("Can not save content density configuration", errorMessage);
                        return new Message({
                            type: MessageType.Error,
                            description: errorMessage,
                            message: parsedErrorInformation.message.value,
                            date: parsedErrorInformation.innererror.timestamp,
                            httpStatus: parsedErrorInformation.httpStatus
                        });
                    });
            }
            return Promise.resolve();
        },

        onSaveTileSize: function () {
            var oConfigModel = this.getView().getModel("config"),
                sNewSizeBehavior = this.TILE_SIZE.getName(oConfigModel.getProperty("/tileSize")), // take string value, not index
                sCurrentSizeBehavior = Config.last("/core/home/sizeBehavior");

            if (sNewSizeBehavior && sNewSizeBehavior !== sCurrentSizeBehavior && oConfigModel.getProperty("/sizeBehaviorConfigurable")) {
                return new Promise(function (resolve) {
                    this.writeToPersonalization("flp.settings.FlpSettings", "sizeBehavior", sNewSizeBehavior)
                        .done(function () {
                            Config.emit("/core/home/sizeBehavior", sNewSizeBehavior);
                            // todo move to other place?
                            if (sNewSizeBehavior === "Responsive") {
                                jQuery(".sapUshellTile").removeClass("sapUshellSmall");
                            } else {
                                jQuery(".sapUshellTile").addClass("sapUshellSmall");
                            }
                            resolve();
                        })
                        .fail(function (errorMessage, parsedErrorInformation) {
                            Log.error("Can not save tile size configuration", errorMessage);
                            resolve(new Message({
                                type: MessageType.Error,
                                description: errorMessage,
                                message: parsedErrorInformation.message.value,
                                date: parsedErrorInformation.innererror.timestamp,
                                httpStatus: parsedErrorInformation.httpStatus
                            }));
                        });
                }.bind(this));
            }
            return Promise.resolve();
        },

        // Save the value of the Enable Auto Dark Mode Detection switch
        onSaveDarkModeEnabled: function () {
            var sNewDarkModeEnabled = this._oDarkModeModel.getProperty("/detectionEnabled");
            var sOldDarkModeEnabled = this.oUser.getDetectDarkMode();
            var oUser = this.oUser;

            if (sNewDarkModeEnabled !== sOldDarkModeEnabled) {
                oUser.setDetectDarkMode(sNewDarkModeEnabled);
                return Promise.all([
                    sap.ushell.Container.getServiceAsync("DarkModeSupport"),
                    this._updateUserPreferences(this.oUser)
                ])
                    .then(function (aValues) {
                        var oDarkModeSupport = aValues[0];
                        oUser.resetChangedProperty("detectDarkMode");
                        if (sNewDarkModeEnabled) {
                            oDarkModeSupport.enableDarkModeBasedOnSystem();
                        } else {
                            oDarkModeSupport.disableDarkModeBasedOnSystem();
                        }
                    })
                    .catch(function (errorMessage, parsedErrorInformation) {
                        oUser.setDetectDarkMode(sOldDarkModeEnabled);
                        oUser.resetChangedProperty("detectDarkMode");
                        Log.error("Can not save dark mode configuration", errorMessage);
                        return new Message({
                            type: MessageType.Error,
                            description: errorMessage,
                            message: parsedErrorInformation.message.value,
                            date: parsedErrorInformation.innererror.timestamp,
                            httpStatus: parsedErrorInformation.httpStatus
                        });
                    });
            }
            return Promise.resolve();
        },

        /**
         * Calls the Personalization service to write the given value to the backend
         * at the given place identified by the container and item name.
         *
         * @param {string} sContainer The name of the container.
         * @param {string} sItem The name of the item.
         * @param {*} vValue The value to be posted to the personalization service.
         * @returns {Promise} Resolves once the personalization data is written. Rejected if the service fails in doing so.
         */
        writeToPersonalization: function (sContainer, sItem, vValue) {
            return jQuery.when(
                    this.getPersonalizer(sContainer, sItem)
                        .then(function (oPersonalizer) {
                            return oPersonalizer.setPersData(vValue);
                        }))
                        .catch(function (oError) {
                            Log.error("Personalization service does not work:");
                            Log.error(oError.name + ": " + oError.message);
                        }
                );
        },

        /**
         * Retrieves a Personalizer instance from the Personalization service and stores it in an internal map.
         *
         * @param {string} sContainer The container ID.
         * @param {string} sItem The item ID.
         * @returns {Promise<object>} A promise which resolves with a new or cached Personalizer instance.
         */
        getPersonalizer: function (sContainer, sItem) {
            var sKey = sContainer + "-" + sItem;

            if (this.oPersonalizers[sKey]) {
                return Promise.resolve(this.oPersonalizers[sKey]);
            }

            return sap.ushell.Container.getServiceAsync("Personalization")
                .then(function (oPersonalizationService) {
                    var oComponent = Component.getOwnerComponentFor(this);
                    var oScope = {
                        keyCategory: oPersonalizationService.constants.keyCategory.FIXED_KEY,
                        writeFrequency: oPersonalizationService.constants.writeFrequency.LOW,
                        clientStorageAllowed: true
                    };

                    if (!this.oPersonalizers[sKey]) {
                        this.oPersonalizers[sKey] = oPersonalizationService.getPersonalizer({
                            container: sContainer,
                            item: sItem
                        }, oScope, oComponent);
                    }

                    return this.oPersonalizers[sKey];
                }.bind(this));
        },

        // Update user preferences using the UserInfo service
        _updateUserPreferences: function (oUser) {
            if (this._updateUserPreferencesPromise) { // use one batch for several calls (theme, cozy/compact and dark mode)
                return this._updateUserPreferencesPromise;
            }

            var _resolve, _reject;

            this._updateUserPreferencesPromise = new Promise(function (resolve, reject) {
                _resolve = resolve;
                _reject = reject;
            });

            // the request is not sent immediately but when .sendRequest is called onSave
            this._updateUserPreferencesPromise.sendRequest = function () {
                sap.ushell.Container.getServiceAsync("UserInfo").then(function (oUserInfo) {
                    oUserInfo.updateUserPreferences(oUser)
                        .done(_resolve)
                        .fail(_reject)
                        .always(function () {
                            // prepare for the next call; tests have to make sure that the previous call is always finished
                            this._updateUserPreferencesPromise = null;
                        }.bind(this));
                }.bind(this));
            }.bind(this);

            return this._updateUserPreferencesPromise;
        },

        // applies dark mode after the user has selected a new theme
        _applyDarkMode: function () {
            var oModel = this._oDarkModeModel;
            var oPromise;
            if (oModel.getProperty("/enabled") && oModel.getProperty("/detectionSupported") && oModel.getProperty("/detectionEnabled")) {
                oPromise = sap.ushell.Container.getServiceAsync("DarkModeSupport")
                    .then(function (oDarkModeSupport) {
                        oDarkModeSupport._toggleDarkModeBasedOnSystemColorScheme();
                    });
            } else {
                oPromise = Promise.resolve();
            }

            return oPromise;
        },

        _isDarkModeActive: function () {
            var oModelData = this._oDarkModeModel.getProperty("/");
            return oModelData.enabled && oModelData.detectionSupported && oModelData.detectionEnabled;
        },

        changeSystemModeDetection: function (oEvent) {
            // update the theme list after the dark mode detection is changed by the user
            var oUserTheme = this._getSelectedTheme();
            this.getView().getModel().setProperty("/options", this._getThemeListData(this.aThemeListFromServer, oUserTheme));
            this.getView().invalidate();
        }
    });
});
