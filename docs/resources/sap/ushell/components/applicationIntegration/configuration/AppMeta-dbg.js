// Copyright (c) 2009-2022 SAP SE, All Rights Reserved
/**
 * @fileOverview handle all the resources for the different applications.
 * @version 1.108.12
 */
sap.ui.define([
    "sap/ushell/services/AppConfiguration",
    "sap/ushell/components/applicationIntegration/elements/model",
    "sap/ui/Device",
    "sap/ushell/Config",
    "sap/ushell/utils",
    "sap/ushell/resources",
    "sap/ushell/EventHub",
    "sap/ushell/components/applicationIntegration/relatedShellElements/RelatedShellElements",
    "sap/ui/thirdparty/jquery",
    "sap/ui/performance/Measurement",
    "sap/ui/util/Mobile"
], function (
    AppConfiguration,
    ElementsModel,
    Device,
    Config,
    utils,
    resources,
    EventHub,
    RelatedShellElements,
    jQuery,
    Measurement,
    Mobile
) {
"use strict";

    function AppMeta () {
        var isTitleChanged,
            that = this,
            isHierarchyChanged,
            sRootIntent,
            isRelatedAppsChanged;

        this.getIsTitleChanged = function () {
            return isTitleChanged;
        };

        this.getIsRelatedAppsChanged = function () {
            return isRelatedAppsChanged;
        };

        this.getHierarchyDefaultValue = function () {
            var oHierarchy = [];
            var sCurrentStateName = Config.last("/core/shell/model/currentState/stateName");

            //If we navigate for a page with state == app add home to it
            if (sCurrentStateName && ((sCurrentStateName === "app" || sCurrentStateName === "embedded") /*|| sCurrentStateName === "home"*/)) {
                //add home entry to hierarchy
                oHierarchy = [
                    {
                        icon: "sap-icon://home",
                        title: resources
                            .i18n.getText("actionHomePage"),
                        // Intent is set to root directly to avoid multiple hash changes.
                        intent: sRootIntent ? "#" + sRootIntent : "#"
                    }
                ];

                // In spaces mode, additionally add the origin page as a step into the hierarchy.
                // The page info is set in PageRuntime.controller as custom data of the root control there during navigation to the page.
                // AppLifeCycle gets data from the root control in the attachBeforeNavigate listener of the AppLifeCycle service, when an app is opened from a space/page.
                // Then the AppLifeCycle service extends the application object.
                // Here, we access data from the application object.
                var oTitles = Config.last("/core/shell/model/currentSpaceAndPage");
                if (oTitles !== undefined) {
                    oHierarchy.splice(0, 0, { // insert at 0 index because the hierarchy is shown as stack
                        icon: "sap-icon://circle-task-2",
                        title: oTitles.pageTitle,
                        subtitle: oTitles.pageTitle !== oTitles.spaceTitle ? oTitles.spaceTitle : undefined, // Do not show the same string twice if space name is the same as page name
                        intent: "#" + oTitles.hash
                    });
                }
            }
            return oHierarchy;
        };

        this.init = function (sInRootIntent) {
            sRootIntent = sInRootIntent;
        };

        this.getIsHierarchyChanged = function () {
            return isHierarchyChanged;
        };

        this.onHierarchyChange = function (oEvent) {
            isHierarchyChanged = true;
            var aHierarchy = oEvent.getParameters().data,
                aExtendedHierarchy = [],
                sCurrentStateName = Config.last("/core/shell/model/currentState/stateName");

            if (!aHierarchy) {
                aHierarchy = [];
            }
            // we take the default value and save it with the data recived
            var oHierarchyDefaultValue = that.getHierarchyDefaultValue();
            //We have to copy the passed array and its objects to prevent direct properties access.
            aHierarchy.forEach(function (oItem, index) {
                aExtendedHierarchy[index] = jQuery.extend({}, oItem);
            });
            aExtendedHierarchy = aExtendedHierarchy.concat(oHierarchyDefaultValue);

            if (sCurrentStateName === "home") {
                ElementsModel.updateStateProperty("application/hierarchy", aExtendedHierarchy, false, ["home"]);
            }
            ElementsModel.updateStateProperty("application/hierarchy", aExtendedHierarchy, true);
        };

        this.onRelatedAppsChange = function (oEvent) {
            isRelatedAppsChanged = true;
            var oRelatedApps = oEvent.getParameters().data,
                sCurrentStateName = Config.last("/core/shell/model/currentState/stateName");

            if (!oRelatedApps) {
                oRelatedApps = [];
            }

            if (sCurrentStateName === "home") {
                ElementsModel.updateStateProperty("application/relatedApps", oRelatedApps, false, ["home"]);
            }
            ElementsModel.updateStateProperty("application/relatedApps", oRelatedApps, true);
        };

        this.resetShellUIServiceHandlers = function () {
            isRelatedAppsChanged = false;
            isHierarchyChanged = false;
            isTitleChanged = false;
        };

        this.onTitleChange = function (oEvent) {
            isTitleChanged = true;
            var sTitle = oEvent.getParameters().data;

            if (!sTitle) {
                sTitle = this.getAppMeta().getTitleDefaultValue();
            }

            var sCurrentStateName = Config.last("/core/shell/model/currentState/stateName");

            if (sCurrentStateName === "home") {
                ElementsModel.updateStateProperty("application/title", sTitle, false, ["home"]);
            }
            ElementsModel.updateStateProperty("application/title", sTitle, true);
            RelatedShellElements.genericSetItem("application/title", sTitle);
            window.document.title = sTitle;
            utils.setPerformanceMark("FLP -- title change");
            EventHub.emit("TitleChanged", sTitle);
        };

        /*
         * Helper function to get the favIcon image URL based on a given theme parameter.
         */
        this._getDefaultFavIcon = function (oParameters) {
            var favIcon = oParameters.get("sapUiShellFavicon");
            if (favIcon) {
                var match = /url[\s]*\('?"?([^'")]*)'?"?\)/.exec(favIcon);
                if (match) {
                    favIcon = match[1];
                } else if (favIcon === "''" || favIcon === "none") {
                    favIcon = null;
                }
            }

            if (!favIcon) {
                var sModulePath = sap.ui.require.toUrl("sap/ushell");
                return sModulePath + "/themes/base/img/launchpad_favicon.ico";
            }

            return favIcon;

        };

        this.getFavIconHref = function () {
            return jQuery("link").filter("[rel=\"shortcut icon\"]").attr("href") || "";
        };

        this.getAppIcon = function () {
            var sIcon = "sap-icon://folder",
                appMetaData = AppConfiguration.getMetadata();

            if (appMetaData && appMetaData.icon) {
                sIcon = appMetaData.icon;
            }
            return sIcon;
        };

        this.setAppIcons = function (oMetadataConfig) {
            //Performance Debug
            Measurement.start("FLP:ShellController.setAppIcons", "setValues", "FLP");

            sap.ui.require(["sap/ui/core/theming/Parameters"], function (Parameters) {
                if (sap.ui.getCore().isThemeApplied()) {
                    this.setValues(oMetadataConfig, Parameters);
                } else {
                    sap.ui.getCore().attachThemeChanged(function () {
                        this.setValues(oMetadataConfig, Parameters);
                    }.bind(this));
                }
            }.bind(this));

            Measurement.end("FLP:ShellController.setAppIcons");
        };

        this.setValues = function (oMetadataConfig, Parameters) {
            var sModulePath = sap.ui.require.toUrl("sap/ushell"),
                oLaunchIconPhone = (oMetadataConfig && oMetadataConfig.homeScreenIconPhone) ||
                    (sModulePath + "/themes/base/img/launchicons/57_iPhone_Desktop_Launch.png"),
                oLaunchIconPhone2 = (oMetadataConfig && oMetadataConfig["homeScreenIconPhone@2"]) ||
                    (sModulePath + "/themes/base/img/launchicons/114_iPhone-Retina_Web_Clip.png"),
                oLaunchIconTablet = (oMetadataConfig && oMetadataConfig.homeScreenIconTablet) ||
                    (sModulePath + "/themes/base/img/launchicons/72_iPad_Desktop_Launch.png"),
                oLaunchIconTablet2 = (oMetadataConfig && oMetadataConfig["homeScreenIconTablet@2"]) ||
                    (sModulePath + "/themes/base/img/launchicons/144_iPad_Retina_Web_Clip.png"),
                oFavIcon = (oMetadataConfig && oMetadataConfig.favIcon) || (this._getDefaultFavIcon(Parameters)),
                sCurrentFavIconHref = this.getFavIconHref();
            if (Device.os.ios) {
                Mobile.setIcons({
                    "phone": oLaunchIconPhone,
                    "phone@2": oLaunchIconPhone2,
                    "tablet": oLaunchIconTablet,
                    "tablet@2": oLaunchIconTablet2,
                    "favicon": oFavIcon,
                    "precomposed": false
                });
            } else if (sCurrentFavIconHref !== oFavIcon) {
                Mobile.setIcons({
                    "phone": "",
                    "phone@2": "",
                    "tablet": "",
                    "tablet@2": "",
                    "favicon": oFavIcon,
                    "precomposed": true
                });
            }
        };

        //The priority order is (from left to right): UserInfo, application metadata, device type
        this._applyContentDensityByPriority = function (isCompact, isUserChange) {
            var that = this;

            return new Promise(function (resolve) {
                sap.ushell.Container.getServiceAsync("UserInfo").then(function (userInfoService) {
                    var appMetaData;
                    if (isCompact === undefined) {
                        //in case non of the below conditions is relevant, then cannot determine cozy or compact
                        if (Device.system.combi) {
                            var oUser = userInfoService.getUser(),
                                sContentDensity = "autoDetect";
                            // if oUser doesn't exist - then default is auto detect
                            if (oUser) {
                                sContentDensity = oUser.getContentDensity();
                            }
                            switch (sContentDensity) {
                                case "cozy":
                                    isCompact = false;
                                    break;
                                case "compact":
                                    isCompact = true;
                                    break;
                                default: //autoDetect
                                    appMetaData = AppConfiguration.getMetadata();
                                    // Compact == true , Cozy == false
                                    // All other cases - go to Cozy
                                    if (appMetaData.compactContentDensity && !appMetaData.cozyContentDensity) {
                                        isCompact = true;
                                    } else {
                                        isCompact = false;
                                    }
                            }
                        } else {
                            appMetaData = AppConfiguration.getMetadata();
                            if (appMetaData.compactContentDensity && !appMetaData.cozyContentDensity) {
                                isCompact = true;
                            } else if (!appMetaData.compactContentDensity && appMetaData.cozyContentDensity) {
                                isCompact = false;
                            } else {
                                isCompact = that._isCompactContentDensityByDevice();
                            }
                        }
                    }
                    that._applyContentDensityClass(isCompact, isUserChange).then(resolve);
                });
            });
        };

        this._applyContentDensityClass = function (isCompact, isUserChange) {
            return new Promise(function (resolve, reject) {
                function setClasses (compact) {
                    jQuery("body")
                    .toggleClass("sapUiSizeCompact", compact)
                    .toggleClass("sapUiSizeCozy", !compact);

                    if (isUserChange === true) {
                        sap.ui.require(["sap/ushell/components/applicationIntegration/AppLifeCycle"], function (AppLifeCycle) {
                            AppLifeCycle.postMessageToIframeApp("sap.ushell.appRuntime", "uiDensityChange", {"isTouch": (compact ? "0" : "1")});
                        });
                    }
                    resolve();
                }
                if (isCompact === undefined) {
                    sap.ushell.Container.getServiceAsync("UserInfo").then(function (userInfoService) {
                        var oUser = userInfoService.getUser ? userInfoService.getUser() : undefined;
                        var bSetUiToCompact;
                        if (oUser && oUser.getContentDensity() === "compact") {
                            bSetUiToCompact = true;
                        } else if (oUser && oUser.getContentDensity() === "cozy") {
                            bSetUiToCompact = false;
                        } else {
                            bSetUiToCompact = that._isCompactContentDensityByDevice();
                        }
                        setClasses(bSetUiToCompact);
                    });
                } else {
                    setClasses(!!isCompact);
                }
            });
        };

        this._isCompactContentDensityByDevice = function () {
            // Combi - If this flag is set to true, the device is recognized as a combination of a desktop system and tablet.
            // Touch - If this flag is set to true, the used browser supports touch events.
            return !Device.support.touch || Device.system.combi;
        };

        this.getTitleDefaultValue = function () {
            var sTitle = "",
                appMetaData = AppConfiguration.getMetadata();

            if (appMetaData && appMetaData.title) {
                sTitle = appMetaData.title;
            }
            return sTitle;
        };

        this.create = function () {
        };


        this.restore = function (oInMeta) {
            this._applyContentDensityByPriority();
            this.setAppIcons(oInMeta);
        };

        this.store = function (oInMeta) {
        };


        this.destroy = function (oInMeta) {
            //handle destroy of the services
        };

    }


    return new AppMeta();
}, /* bExport= */ true);
