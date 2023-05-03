// Copyright (c) 2009-2022 SAP SE, All Rights Reserved

/**
 * @fileOverview Card Navigation
 *
 * @version 1.108.12
 */

sap.ui.define([
    "sap/ui/core/service/Service",
    "sap/ushell/Config",
    "sap/ushell/library",
    "sap/base/Log",
    "sap/ushell/utils/WindowUtils"
],
function (Service, Config, ushellLibrary, UI5Log, WindowUtils) {
    "use strict";

    var AppType = ushellLibrary.AppType;

    /**
     * Constructor for the navigation service used by the sap.ui.integration.widgets.Card control.
     *
     * @class
     * This navigation service is used by sap.ui.integration.widget.Cards to enable navigation
     * inside the FLP if a user clicks on the header or an item.
     * @extends sap.ui.core.service.Service
     *
     * @constructor
     * @private
     * @name sap.ushell.services.CardNavigation
     * @since 1.64
     */
    var CardNavigation = Service.extend("sap.ushell.ui5service.CardNavigation", {
        constructor: function () {
            this.oCrossAppNavPromise = sap.ushell.Container.getServiceAsync("CrossApplicationNavigation");
        }
    });

    /**
     * Overwrites navigate to execute a cross app navigation. Gets called as soon as the user clicks
     * on a card item or header.
     *
     * @private
     * @param {object} oContext An object that gives the service information about the target.
     * @param {object} oContext.parameters A map with parameters.
     * @returns {Promise<void>} Resolves once the action was triggered
     * @since 1.64
     */
    CardNavigation.prototype.navigate = function (oContext) {
        var oParameters = oContext.parameters;
        if (oParameters.openUI) {
            if (oParameters.openUI === "RecentActivities" || oParameters.openUI === "FrequentActivities") {
                sap.ui.require([
                    "sap/ushell/ui/QuickAccess"
                ], function (QuickAccess) {
                    var sTabName = oParameters.openUI === "RecentActivities" ? "recentActivityFilter" : "frequentlyUsedFilter";
                    QuickAccess.openQuickAccessDialog(sTabName);
                });
            } else {
                UI5Log.error("Request to open unknown User Interface: '" + oParameters.openUI + "'");
            }
            return Promise.resolve();
        } else if (oParameters.url && oParameters.url !== "") {
            var bLogRecentActivity = Config.last("/core/shell/enableRecentActivity") && Config.last("/core/shell/enableRecentActivityLogging");
            if (bLogRecentActivity) {
                var oRecentEntry = {
                    title: oParameters.title,
                    url: oParameters.url,
                    appType: AppType.URL,
                    appId: oParameters.url
                };
                sap.ushell.Container.getRenderer("fiori2").logRecentActivity(oRecentEntry);
            }

            WindowUtils.openURL(oParameters.url, "_blank");
            return Promise.resolve();
        }

        return this.oCrossAppNavPromise.then(function (oCrossAppNav) {
            return oCrossAppNav.toExternal({
                target: {
                    semanticObject: oParameters.intentSemanticObject,
                    action: oParameters.intentAction
                },
                params: oParameters.intentParameters,
                appSpecificRoute: oParameters.intentAppRoute
            });
        });
    };

    /**
     * Overwrites enabled to indicate whether the user can click the card header or item to navigate.
     *
     * @private
     * @param {object} oContext An object that gives the service information about the target.
     * @param {object} oContext.parameters A map with parameters.
     * @returns {promise} A promise that resolves with true if the navigation is supported.
     * @since 1.64
     */
    CardNavigation.prototype.enabled = function (oContext) {
        var oParameters = oContext.parameters;
        if (oParameters.openUI) {
            if (["RecentActivities", "FrequentActivities"].indexOf(oParameters.openUI) > -1) {
                return Promise.resolve(true);
            }
            return Promise.resolve(false);
        }
        var oNavigation = {
            target: {
                semanticObject: oParameters.intentSemanticObject,
                action: oParameters.intentAction
            },
            params: oParameters.intentParameters
        };

        return this.oCrossAppNavPromise.then(function (oCrossAppNav) {
            return new Promise(function (resolve) {
                oCrossAppNav.isNavigationSupported([oNavigation])
                    .done(function (aResponses) {
                        resolve(aResponses[0].supported);
                    })
                    .fail(function () {
                        resolve(false);
                    });
            });
        });
    };

    return CardNavigation;
});
