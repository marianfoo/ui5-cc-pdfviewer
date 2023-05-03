// Copyright (c) 2009-2022 SAP SE, All Rights Reserved

/**
 * @fileOverview
 * @version 1.108.12
 */
sap.ui.define([
    "sap/ushell/components/shell/SearchCEP/SearchProviders/SearchProvider",
    "sap/base/Log"
], function (SearchProvider, Log) {
    "use strict";

    /**
     * @constructor
     * @class
     * @since 1.101.0
     * @private
     */
    var RecentAppsProvider = function () {
    };

    /**
     * returns the name of the search provider
     *
     * @returns {string} the name of the provider
     *
     * @since 1.101.0
     * @private
     */
    RecentAppsProvider.prototype.getName = function () {
        return "Recent Applications Provider";
    };

    /**
     * provide the recent applications used
     *
     * @returns {Promise} when resolved, contains the search result array
     *
     * @since 1.101.0
     * @private
     */
    RecentAppsProvider.prototype.execSearch = function () {
        return sap.ushell.Container.getServiceAsync("UserRecents").then(function (UserRecentsService) {
            return UserRecentsService.getFrequentActivity().then(function (oRecents) {
                if (Array.isArray(oRecents) && oRecents.length > 0) {
                    return {
                        recentApplications: oRecents.map(function (item) {
                            if (item.appType === "Application") {
                                item._type = SearchProvider.ENTRY_TYPE.App;
                                item.text = item.text || item.title;
                                item.icon = item.icon || "sap-icon://SAP-icons-TNT/application";
                            } else if (item.appType === "External Link") {
                                item._type = SearchProvider.ENTRY_TYPE.ExternalLink;
                                item.text = item.text || item.title;
                                item.icon = item.icon || "sap-icon://internet-browser";
                            }
                            return item;
                        })
                    };
                }
                return {};
            }, function (sError) {
                Log.error("Recent Applications Provider failed", "error: " + sError, "sap.ushell.components.shell.SearchCEP.SearchProviders.RecentAppsProvider::execSearch");
                return {};
            });
        });
    };

    return new RecentAppsProvider();
}, false);
