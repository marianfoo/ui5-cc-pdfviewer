// Copyright (c) 2009-2022 SAP SE, All Rights Reserved

sap.ui.define([
    "sap/ushell/appRuntime/ui5/AppRuntimePostMessageAPI",
    "sap/ushell/appRuntime/ui5/AppRuntimeService",
    "sap/base/util/UriParameters",
    "sap/ui/thirdparty/URI",
    "sap/ui/thirdparty/jquery",
    "sap/ui/Device",
    "sap/ui/core/BusyIndicator",
    "sap/ushell/appRuntime/ui5/performance/FesrEnhancer",
    "sap/ushell/EventHub",
    "sap/base/Log",
    "sap/ui/thirdparty/hasher",
    "sap/ushell/resources"
], function (AppRuntimePostMessageAPI, AppRuntimeService, UriParameters, URI, jQuery, Device, BusyIndicator, FesrEnhancer, EventHub, Log, hasher, resources) {
    "use strict";

    function AppLifeCycleAgent () {
        var that = this,
            sAppResolutionModule,
            oAppResolution,
            bEnableAppResolutionCache = true,
            oAppResolutionCache = {},
            fnCreateApplication,
            oCachedApplications = {},
            oRouterDisableRetriggerApplications = {},
            oAppDirtyStateProviders = {},
            oAppBackNavigationFunc = {},
            oRunningApp,
            fnRenderApp,
            oShellUIService,
            sDatalossMessage,
            oShellNavigationService;

        this.init = function (sModule, ofnCreateApplication, ofnRenderApp, bEnableCache, sAppId, oAppInfo) {
            sAppResolutionModule = sModule;
            fnCreateApplication = ofnCreateApplication;
            fnRenderApp = ofnRenderApp;
            if (bEnableCache !== undefined) {
                bEnableAppResolutionCache = bEnableCache;
            }
            this.addAppInfoToCache(sAppId, oAppInfo);

            // register this create & destroy as a appLifeCycleCommunication handler
            AppRuntimePostMessageAPI.registerCommHandlers({
                "sap.ushell.services.appLifeCycle": {
                    oServiceCalls: {
                        create: {
                            executeServiceCallFn: function (oMessageData) {
                                FesrEnhancer.startInteraction();
                                AppRuntimeService.sendMessageToOuterShell(
                                    "sap.ushell.appRuntime.iframeIsBusy", {
                                        bValue: true
                                    });
                                var oMsg = JSON.parse(oMessageData.oMessage.data),
                                    sAppIdNew = UriParameters.fromURL(oMsg.body.sUrl).get("sap-ui-app-id");

                                hasher.disableCFLPUpdate = true;
                                hasher.replaceHash(oMsg.body.sHash);
                                hasher.disableCFLPUpdate = false;
                                that.create(sAppIdNew, oMsg.body.sUrl);
                                return new jQuery.Deferred().resolve().promise();
                            }
                        },
                        destroy: {
                            executeServiceCallFn: function (oMessageData) {
                                var oMsg = JSON.parse(oMessageData.oMessage.data);
                                that.destroy(oMsg.body.sCacheId);
                                return new jQuery.Deferred().resolve().promise();
                            }
                        },
                        store: {
                            executeServiceCallFn: function (oMessageData) {
                                var oMsg = JSON.parse(oMessageData.oMessage.data);
                                that.store(oMsg.body.sCacheId);
                                return new jQuery.Deferred().resolve().promise();
                            }
                        },
                        restore: {
                            executeServiceCallFn: function (oMessageData) {
                                var oMsg = JSON.parse(oMessageData.oMessage.data);

                                hasher.disableCFLPUpdate = true;
                                hasher.replaceHash(oMsg.body.sHash);
                                hasher.disableCFLPUpdate = false;
                                that.restore(oMsg.body.sCacheId);
                                return new jQuery.Deferred().resolve().promise();
                            }
                        }
                    }
                }
            });
            EventHub.on("disableKeepAliveRestoreRouterRetrigger").do(function (oData) {
                if (oData.componentId && oRouterDisableRetriggerApplications[oData.componentId]) {
                    oRouterDisableRetriggerApplications[oData.componentId] = oData.disable;
                }
            });

            AppRuntimeService.sendMessageToOuterShell(
                "sap.ushell.services.appLifeCycle.setup", {
                    isStateful: true,
                    isKeepAlive: true,
                    isIframeValid: true,
                    isIframeBusy: true
                });

            //handle dirty state confirmation dialog within the iframe and not
            //in the outer shell
            if (!resources.browserI18n) {
                resources.browserI18n = resources.getTranslationModel(window.navigator.language).getResourceBundle();
            }
            sDatalossMessage = resources.browserI18n.getText("dataLossExternalMessage");
            window.addEventListener("onbeforeunload", function () {
                if (sap.ushell && sap.ushell.Container && sap.ushell.Container.getDirtyFlag()) {
                    return sDatalossMessage;
                }
                return undefined;
            });
        };

        this.create = function (appId, sUrl) {
            //BusyIndicator work in hidden iframe only in chrome
            if (Device.browser.chrome) {
                BusyIndicator.show(0);
            }
            if (oShellUIService) {
                oShellUIService._resetBackNavigationCallback();
            }
            sap.ui.getCore().getEventBus().publish("launchpad", "appOpening", {});
            var applicationInfoPromis = new Promise(function (fnResolve) {
                that.getAppInfo(appId, sUrl).then(function (oAppInfo) {
                    fnResolve(oAppInfo);
                });
            }).then(function (oAppInfo) {
                that.getURLParameters(new URI(sUrl).query(true)).then(function (oURLParameters) {
                    fnCreateApplication(appId, oURLParameters, oAppInfo)
                        .then(function (oResolutionResult) {
                            fnRenderApp(oResolutionResult);
                            AppRuntimeService.sendMessageToOuterShell(
                                "sap.ushell.appRuntime.iframeIsBusy", {
                                    bValue: false
                                });
                            sap.ui.getCore().getEventBus().publish("sap.ushell", "appOpened", {});
                        });
                });
            });

            return applicationInfoPromis;
        };

        this.destroy = function (sStorageKey) {
            function appDestroy (oApplication) {
                var sAppId = oApplication.sId || "<unkown>";
                try {
                    oApplication.destroy();
                } catch (e) {
                    Log.error("exception when trying to close sapui5 application with id '" + sAppId +
                        "' when running inside the appruntim iframe '" + document.URL +
                            "'. This error must be fixed in order for the iframe to operate properly.\n",
                        e.stack,
                        "sap.ushell.appRuntime.ui5.services.AppLifeCycleAgent::destroy");
                }
            }

            if (sStorageKey && oCachedApplications[sStorageKey]) {
                if (oCachedApplications[sStorageKey] === oRunningApp) {
                    oRunningApp = undefined;
                }
                delete oRouterDisableRetriggerApplications[oCachedApplications[sStorageKey].sId];
                appDestroy(oCachedApplications[sStorageKey]);
                delete oCachedApplications[sStorageKey];
            } else if (oRunningApp) {
                delete oRouterDisableRetriggerApplications[oRunningApp.sId];
                appDestroy(oRunningApp);
                oRunningApp = undefined;
            }
            sap.ushell.Container.cleanDirtyStateProviderArray();
            if (oShellUIService) {
                oShellUIService._resetBackNavigationCallback();
            }
            FesrEnhancer.setAppShortId();
            sap.ui.getCore().getEventBus().publish("sap.ushell", "appClosed", {});
        };

        this.store = function (sStorageKey) {
            var oCachedEntry = oRunningApp,
                oApp;

            oCachedApplications[sStorageKey] = oCachedEntry;
            if (oShellUIService) {
                oAppBackNavigationFunc[sStorageKey] = oShellUIService._getBackNavigationCallback();
            }

            oApp = oCachedEntry.getComponentInstance();
            oCachedEntry.setVisible(false);

            // keep application's dirty state providers when stored
            if (sap.ushell.Container) {
                oAppDirtyStateProviders[sStorageKey] = sap.ushell.Container.getAsyncDirtyStateProviders();
                sap.ushell.Container.cleanDirtyStateProviderArray();
            }

            if (oApp) {
                if (oApp.isKeepAliveSupported && oApp.isKeepAliveSupported() === true) {
                    oApp.deactivate();
                } else {
                    if (oApp.suspend) {
                        oApp.suspend();
                    }
                    if (oApp.getRouter && oApp.getRouter()) {
                        oApp.getRouter().stop();
                    }
                }
            }
            sap.ui.getCore().getEventBus().publish("sap.ushell", "appClosed", {});
        };

        this.restore = function (sStorageKey) {
            var oCachedEntry = oCachedApplications[sStorageKey],
                oApp = oCachedEntry.getComponentInstance(),
                bRouterDisableRetrigger = oRouterDisableRetriggerApplications[oCachedEntry.sId];

            sap.ui.getCore().getEventBus().publish("launchpad", "appOpening", {});
            oCachedEntry.setVisible(true);

            // re-register application's dirty state providers when restored
            if (oAppDirtyStateProviders[sStorageKey] && sap.ushell.Container) {
                sap.ushell.Container.setAsyncDirtyStateProviders(oAppDirtyStateProviders[sStorageKey]);
            }
            if (oShellUIService) {
                oShellUIService.setBackNavigation(oAppBackNavigationFunc[sStorageKey]);
            }

            if (oApp) {
                if (oApp.isKeepAliveSupported && oApp.isKeepAliveSupported() === true) {
                    oApp.activate();
                } else {
                    if (oApp.restore) {
                        oApp.restore();
                    }
                    if (oApp.getRouter && oApp.getRouter() && oApp.getRouter().initialize) {
                        if (bRouterDisableRetrigger === false) {
                            oApp.getRouter().initialize();
                        } else {
                            oApp.getRouter().initialize(true);
                        }
                    }
                }

                oRunningApp = oCachedEntry;
            }
            sap.ui.getCore().getEventBus().publish("sap.ushell", "appOpened", {});
        };

        this.getURLParameters = function (oUrlParameters) {
            return new Promise(function (fnResolve, fnReject) {
                if (oUrlParameters.hasOwnProperty("sap-intent-param")) {
                    var sAppStateKey = oUrlParameters["sap-intent-param"];
                    AppRuntimeService.sendMessageToOuterShell("sap.ushell.services.CrossApplicationNavigation.getAppStateData", { sAppStateKey: sAppStateKey })
                        .then(function (sParameters) {
                            delete oUrlParameters["sap-intent-param"];
                            var oUrlParametersExpanded = jQuery.extend({}, oUrlParameters, (new URI("?" + sParameters)).query(true), true);
                            fnResolve(oUrlParametersExpanded);
                        }, function (sError) {
                            fnResolve(oUrlParameters);
                        });
                } else {
                    fnResolve(oUrlParameters);
                }
            });
        };

        this.getAppInfo = function (appId, sUrl) {
            return new Promise(function (fnResolve) {
                function fnGetAppInfo () {
                    oAppResolution.getAppInfo(appId, sUrl).then(function (oAppInfo) {
                        that.addAppInfoToCache(appId, oAppInfo);
                        fnResolve(oAppInfo);
                    });
                }

                if (bEnableAppResolutionCache === true && oAppResolutionCache[appId]) {
                    fnResolve(JSON.parse(JSON.stringify(oAppResolutionCache[appId])));
                } else if (oAppResolution) {
                    fnGetAppInfo();
                } else {
                    sap.ui.require([sAppResolutionModule.replace(/\./g, "/")], function (oObj) {
                        oAppResolution = oObj;
                        fnGetAppInfo();
                    });
                }
            });
        };

        this.addAppInfoToCache = function (sAppId, oAppInfo) {
            if (sAppId && oAppInfo &&
                bEnableAppResolutionCache === true &&
                oAppResolutionCache[sAppId] === undefined) {
                oAppResolutionCache[sAppId] = JSON.parse(JSON.stringify(oAppInfo));
            }
        };

        this.setComponent = function (oApp) {
            oRunningApp = oApp;
            // Initializing the disableKeepAliveRestoreRouterRetrigger flag to true
            if (oRunningApp) {
                oRouterDisableRetriggerApplications[oRunningApp.sId] = true;
            }
        };

        this.setShellUIService = function (oService) {
            oShellUIService = oService;
        };

        /**
         * @private
         */
        this.setShellNavigationService = function (oService) {
            oShellNavigationService = oService;
        };

        /**
         * @private
         */
        this.checkDataLossAndContinue = function () {
            if (sap.ushell && sap.ushell.Container && sap.ushell.Container.getDirtyFlag(oShellNavigationService.getNavigationContext())) {
                // eslint-disable-next-line no-alert
                if (window.confirm(sDatalossMessage)) {
                    sap.ushell.Container.setDirtyFlag(false);
                    return true;
                } else {
                    return false;
                }
            }
            return true;
        };

    }

    return new AppLifeCycleAgent();
}, true);
