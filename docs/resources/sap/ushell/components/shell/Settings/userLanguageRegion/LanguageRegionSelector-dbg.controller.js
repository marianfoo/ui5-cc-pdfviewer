// Copyright (c) 2009-2022 SAP SE, All Rights Reserved

sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/performance/Measurement",
    "sap/base/util/UriParameters",
    "sap/base/util/ObjectPath",
    "sap/base/Log",
    "sap/ui/core/Locale",
    "sap/ui/core/LocaleData",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/message/Message",
    "sap/ui/core/MessageType"
], function (
    Controller,
    Measurement,
    UriParameters,
    ObjectPath,
    Log,
    Locale,
    LocaleData,
    JSONModel,
    Message,
    MessageType
) {
    "use strict";

    return Controller.extend("sap.ushell.components.shell.Settings.userLanguageRegion.LanguageRegionSelector", {
        onInit: function () {
            this.oUserInfoServicePromise = sap.ushell.Container.getServiceAsync("UserInfo");
            return this.oUserInfoServicePromise
                .then(function (UserInfo) {
                    this.oUser = sap.ushell.Container.getUser();

                    var oLocale = sap.ui.getCore().getConfiguration().getFormatSettings().getFormatLocale();
                    var oLocaleData = LocaleData.getInstance(oLocale);
                    var sDatePattern, sTimePattern, sTimeFormat, sNumberFormat;

                    var bIsEnableSetLanguage = sap.ushell.Container.getRenderer("fiori2").getShellConfig().enableSetLanguage || false;
                    var bIsLanguagePersonalized = this.oUser.isLanguagePersonalized();
                    var bIsEnableSetUserPreference = UserInfo.getUserSettingListEditSupported();//Check if adapter supports user setting editing

                    var aUserPreferenceAndLanguageSettingPromises = [];
                    if (bIsEnableSetUserPreference) {
                        var oFormatSetting = sap.ui.getCore().getConfiguration().getFormatSettings();
                        sDatePattern = oFormatSetting.getLegacyDateFormat();
                        sTimeFormat = oFormatSetting.getLegacyTimeFormat();
                        sNumberFormat = this._getLegacyNumberFormat(oFormatSetting);
                        aUserPreferenceAndLanguageSettingPromises.push(this._loadUserSettingList());
                    } else {
                        sDatePattern = oLocaleData.getDatePattern("medium");
                        sTimePattern = oLocaleData.getTimePattern("medium");
                        sTimeFormat = (sTimePattern.indexOf("H") === -1) ? "12h" : "24h";
                    }

                    var oModel = new JSONModel({
                        languageList: null,
                        DateFormatList: null,
                        TimeFormatList: null,
                        NumberFormatList: null,
                        TimeZoneList: null,
                        selectedLanguage: this.oUser.getLanguage(),
                        selectedLanguageText: this.oUser.getLanguageText(),
                        selectedDatePattern: sDatePattern,
                        selectedTimeFormat: sTimeFormat,
                        selectedNumberFormat: sNumberFormat,
                        selectedTimeZone: this.oUser.getTimeZone(),
                        isSettingsLoaded: true,
                        isLanguagePersonalized: bIsLanguagePersonalized,
                        isEnableSetLanguage: bIsEnableSetLanguage,
                        isEnableUserProfileSetting: bIsEnableSetUserPreference,
                        isTimeZoneIanaAvailable: true
                    });
                    oModel.setSizeLimit(1000);

                    var sTimeZoneIana = sap.ushell.Container.getUser().getTimeZoneIana();
                    if (sTimeZoneIana === undefined || (sTimeZoneIana !== "" && typeof sTimeZoneIana === "string")) {
                        oModel.setProperty("/isTimeZoneIanaAvailable", false);
                    }

                    if (bIsEnableSetLanguage) {
                        aUserPreferenceAndLanguageSettingPromises.push(this._loadLanguagesList());
                    }
                    if (aUserPreferenceAndLanguageSettingPromises.length > 0) {
                        this.getView().setBusy(true);
                        return Promise.all(aUserPreferenceAndLanguageSettingPromises).then(function (aResults) {

                            var aUserSettingList = bIsEnableSetUserPreference ? aResults[0] : null;
                            var aLanguageList = null;
                            if (bIsEnableSetLanguage) {
                                aLanguageList = aResults.length === 1 ? aResults[0] : aResults[1];
                            }


                            if (aLanguageList && aLanguageList.length > 1) {
                                oModel.setProperty("/languageList", aLanguageList);
                                var bHasDefault = aLanguageList.some(function (oLanguage) {
                                    return oLanguage.key === "default";
                                });
                                if (!bIsLanguagePersonalized && bHasDefault) {
                                    oModel.setProperty("/selectedLanguage", "default");
                                }
                            }
                            if (aUserSettingList && aUserSettingList.TIME_FORMAT && aUserSettingList.TIME_FORMAT.length > 0) {
                                oModel.setProperty("/TimeFormatList", aUserSettingList.TIME_FORMAT);
                            }
                            if (aUserSettingList && aUserSettingList.DATE_FORMAT && aUserSettingList.DATE_FORMAT.length > 0) {
                                oModel.setProperty("/DateFormatList", aUserSettingList.DATE_FORMAT);
                            }
                            if (aUserSettingList && aUserSettingList.TIME_ZONE && aUserSettingList.TIME_ZONE.length > 0) {
                                oModel.setProperty("/TimeZoneList", aUserSettingList.TIME_ZONE);
                            }
                            if (aUserSettingList && aUserSettingList.NUMBER_FORMAT && aUserSettingList.NUMBER_FORMAT.length > 0) {
                                oModel.setProperty("/NumberFormatList", aUserSettingList.NUMBER_FORMAT);
                            }

                            this.oView.setModel(oModel);
                            this.getView().setBusy(false);
                        }.bind(this));
                    }
                    this.oView.setModel(oModel);
            }.bind(this));
        },

        /**
         * Load language via userInfoService API
         * @returns {Promise} the language list from the platforms
         * @private
         */
        _loadLanguagesList: function () {
            Measurement.start("FLP:LanguageRegionSelector._getLanguagesList", "_getLanguagesList", "FLP");
            return this.oUserInfoServicePromise
                .then(function (UserInfo) {
                    return new Promise(function (resolve) {
                        Measurement.start("FLP:LanguageRegionSelector._getLanguagesList", "_getLanguagesList", "FLP");
                        UserInfo.getLanguageList()
                            .done(function (oData) {
                                Measurement.end("FLP:LanguageRegionSelector._getLanguagesList");
                                resolve(oData);
                            })
                            .fail(function (error) {
                                Measurement.end("FLP:LanguageRegionSelector._getLanguagesList");
                                Log.error("Failed to load language list.", error,
                                    "sap.ushell.components.ushell.settings.userLanguageRegion.LanguageRegionSelector.controller");
                                resolve(null);
                            });
                    });
                });
        },

        /**
         * Load User Profile settings List via userInfoService API
         * @returns {Promise} the Language List ,Date Format List,Time Format list and Time Zone List from the platforms
         * @private
         */
        _loadUserSettingList: function () {
            Measurement.start("FLP:LanguageRegionSelector._loadUserSettingList", "_loadUserSettingList", "FLP");
            return this.oUserInfoServicePromise
                .then(function (UserInfo) {
                    return new Promise(function (resolve) {
                        Measurement.start("FLP:LanguageRegionSelector._loadUserSettingList", "_loadUserSettingList", "FLP");
                        UserInfo.getUserSettingList()
                            .then(function (oData) {
                                Measurement.end("FLP:LanguageRegionSelector._loadUserSettingList");
                                resolve(oData);
                            });
                    });
                });
        },


        onCancel: function () {
            var oModel = this.getView().getModel(),
                oModelData = oModel.getData(),
                aLanguageList = oModelData.languageList,
                isEnableSetLanguage = oModelData.isEnableSetLanguage;
            if (isEnableSetLanguage && aLanguageList) {
                var oUserLanguage = this.oUser.getLanguage();
                // if the user language isn't personalzied - need to return browser language in select
                var sSelectedLanguage = oModelData.isLanguagePersonalized ? oUserLanguage : "default";
                oModel.setProperty("/selectedLanguage", sSelectedLanguage);
                //Date and time format are taken from current language
                this._updateTextFields(oUserLanguage);
            }
            if (oModelData.isEnableUserProfileSetting) {
                this._restoreUserSettingPreferenceValues();
            }
        },

        /**
         * Event fired on the Save of the Language and Region Settings
         * @private
         */
        onSave: function () {
            var oUser = this.oUser,
                oModelData = this.getView().getModel().getData(),
                sSelectedLanguage = oModelData.selectedLanguage,
                sOriginLanguage = oUser.getLanguage(),
                bLanguageChanged = sSelectedLanguage !== (oModelData.isLanguagePersonalized ? sOriginLanguage : "default"),
                bIsEnableSetUserProfileSetting = oModelData.isEnableUserProfileSetting,
                bUpdateLanguage = oModelData.isEnableSetLanguage && oModelData.languageList && bLanguageChanged;

            if (bUpdateLanguage || bIsEnableSetUserProfileSetting) {
                return this.oUserInfoServicePromise
                    .then(function (UserInfo) {
                        return new Promise(function (resolve, reject) {
                            if (bUpdateLanguage) {
                                oUser.setLanguage(sSelectedLanguage);
                            }
                            if (bIsEnableSetUserProfileSetting) {
                                var oFormatSetting = sap.ui.getCore().getConfiguration().getFormatSettings();
                                if (oFormatSetting.getLegacyDateFormat() !== oModelData.selectedDatePattern) {
                                    oUser.setChangedProperties({
                                        propertyName: "dateFormat",
                                        name: "DATE_FORMAT"
                                    }, oFormatSetting.getLegacyDateFormat(), oModelData.selectedDatePattern);
                                }
                                if (oFormatSetting.getLegacyTimeFormat() !== oModelData.selectedTimeFormat) {
                                    oUser.setChangedProperties({
                                        propertyName: "timeFormat",
                                        name: "TIME_FORMAT"
                                    }, oFormatSetting.getLegacyTimeFormat(), oModelData.selectedTimeFormat);
                                }

                                if (this._getLegacyNumberFormat(oFormatSetting) !== oModelData.selectedNumberFormat) {
                                    oUser.setChangedProperties({
                                        propertyName: "numberFormat",
                                        name: "NUMBER_FORMAT"
                                    }, this._getLegacyNumberFormat(oFormatSetting), oModelData.selectedNumberFormat);
                                }
                                if (this.oUser.getTimeZone() !== oModelData.selectedTimeZone) {
                                    oUser.setChangedProperties({
                                        propertyName: "timeZone",
                                        name: "TIME_ZONE"
                                    }, this.oUser.getTimeZone(), oModelData.selectedTimeZone);
                                }
                            }


                            UserInfo.updateUserPreferences(oUser)
                                .done(function () {
                                    var oResolvedResult = {
                                        refresh: true
                                    };
                                    if (bUpdateLanguage) {
                                        oUser.resetChangedProperty("language");
                                        var sLanguageinUrl = UriParameters.fromQuery(window.location.search).get("sap-language");
                                        if (sLanguageinUrl && sSelectedLanguage !== "default") {
                                            oResolvedResult.urlParams = [{
                                                "sap-language": sSelectedLanguage
                                            }];
                                        }

                                        // the backend would use the language of the sap-usercontext cookie after the reload
                                        // without the language in the cookie the backend uses the language from the user defaults
                                        // this has to be done after the last backend request and right before the reload as a
                                        // backend request would reset the language in the cookie
                                        this._removeLanguageFromUserContextCookie();
                                    }

                                    resolve(oResolvedResult); //refresh the page to apply changes.
                                }.bind(this))
                                // in case of failure - return to the original language
                                .fail(function (errorMessage, parsedErrorInformation) {
                                    if (bUpdateLanguage) {
                                        oUser.setLanguage(sOriginLanguage);
                                        oUser.resetChangedProperty("language");
                                        this._updateTextFields(sOriginLanguage);
                                    }
                                    if (oModelData.isEnableUserProfileSetting) {
                                        this._restoreUserSettingPreferenceValues();
                                    }
                                    Log.error("Failed to save Language and Region Settings", errorMessage,
                                        "sap.ushell.components.ushell.settings.userLanguageRegion.LanguageRegionSelector.controller");

                                    reject(new Message({
                                        type: MessageType.Error,
                                        description: errorMessage,
                                        message: parsedErrorInformation.message.value,
                                        date: parsedErrorInformation.innererror.timestamp,
                                        httpStatus: parsedErrorInformation.httpStatus
                                    }));
                                }.bind(this));
                        }.bind(this));
                    }.bind(this));
            }

            return Promise.resolve();
        },
        /**
         * Restores the User settings Preference original values
         *
         * @private
         */
        _restoreUserSettingPreferenceValues: function () {
            var oModel = this.getView().getModel();
            var oFormatSetting = sap.ui.getCore().getConfiguration().getFormatSettings();
            oModel.setProperty("/selectedDatePattern", oFormatSetting.getLegacyDateFormat());
            oModel.setProperty("/selectedTimeFormat", oFormatSetting.getLegacyTimeFormat());
            oModel.setProperty("/selectedNumberFormat", this._getLegacyNumberFormat(oFormatSetting));
            oModel.setProperty("/selectedTimeZone", this.oUser.getTimeZone());
        },

        /**
         * Remove the language from the sap-usercontext cookie
         *
         * @private
         * @since 1.79.0
         */
        _removeLanguageFromUserContextCookie: function () {
            var sUserContextCookie = document.cookie.split(";").find(function (cookie) {
                return cookie.indexOf("sap-usercontext") !== -1;
            });

            // the cookie is only present on the ABAP platform
            if (!sUserContextCookie) {
                return;
            }

            // the cookie should always look like this: sap-usercontext=sap-language=EN&sap-client=120
            // to be on the safe side the language is removed while preserving the other parameters
            var aCookieValues = sUserContextCookie.replace("sap-usercontext=", "").split("&");
            aCookieValues = aCookieValues.filter(function (sValue) {
                return sValue.indexOf("sap-language") === -1;
            });

            document.cookie = "sap-usercontext=" + aCookieValues.join("&") + ";path=/";
        },

        /**
         * This method call handle the change in the selection language
         * @param {string} oEvent control event
         * @private
         */
        _handleSelectChange: function (oEvent) {
            var sSelectedLanguage = oEvent.getParameters().selectedItem.getKey();
            this._updateTextFields(sSelectedLanguage);
        },

        /**
         * Update Date and Time text fields
         * @param {string} language the newly selected language
         * @private
         */
        _updateTextFields: function (language) {
            var oLocale;

            if (language === this.oUser.getLanguage()) {
                oLocale = sap.ui.getCore().getConfiguration().getFormatSettings().getFormatLocale();
            } else {
                oLocale = new Locale(language);
            }

            var oModel = this.getView().getModel(),
                oLocaleData = LocaleData.getInstance(oLocale),
                sDatePattern = oLocaleData.getDatePattern("medium"),
                sTimePattern = oLocaleData.getTimePattern("medium"),
                sTimeFormat = (sTimePattern.indexOf("H") === -1) ? "12h" : "24h";
            if (!oModel.getData().isEnableUserProfileSetting) {
                oModel.setProperty("/selectedDatePattern", sDatePattern);
                oModel.setProperty("/selectedTimeFormat", sTimeFormat);
            }
        },

        /**
         * Returns the legacy number format from the core Configuration.
         * ATTENTION: We store the legacy number format as a string with a space character (" ") in the core config, while
         * the key returned by the backend is an empty string (""). Therefore we must convert it to empty string to make
         * valid comparisons.
         *
         * @param {object} oFormatSetting The object with format settings.
         * @returns {string|undefined} The number format if it exists or undefined if not.
         * @private
         */
        _getLegacyNumberFormat: function (oFormatSetting) {
            var sLegacyNumberFormat = oFormatSetting.getLegacyNumberFormat();
            if (sLegacyNumberFormat) {
                return sLegacyNumberFormat.trim();
            }
        }
    });
});
