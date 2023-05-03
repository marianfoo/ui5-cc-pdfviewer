// Copyright (c) 2009-2022 SAP SE, All Rights Reserved

sap.ui.define([
    "sap/ushell/components/shell/SearchCEP/SearchProviders/SearchProvider",
    "sap/ushell/components/shell/SearchCEP/SearchProviders/NavigationSvcSearchProvider",
    "sap/ushell/components/shell/SearchCEP/SearchProviders/RecentAppsProvider",
    "sap/ushell/components/shell/SearchCEP/SearchProviders/RecentSearchProvider",
    "sap/base/Log"
], function (SearchProvider, NavigationSvcSearchProvider, RecentAppsProvider, RecentSearchProvider, Log) {
    "use strict";

    return {
        runProviders: function (sQuery) {
            var arrProviders,
                idx;
            if (sQuery !== undefined) {
                arrProviders = [NavigationSvcSearchProvider];
            } else {
                arrProviders = [NavigationSvcSearchProvider, RecentAppsProvider, RecentSearchProvider];
            }

            Log.info("-------------------- run CEP search test for sQuery=" + sQuery + " --------------------");
            for (idx = 0; idx < arrProviders.length; idx++) {
                (function (oProvider) {
                    oProvider.execSearch(sQuery).then(function (oResult) {
                        var sLog = "",
                            bFound = false;
                        sLog += "-------------------- search provider '" + oProvider.getName() + "' results:\n";
                        for (var groupId in SearchProvider.GROUP_TYPE) {
                            var sGroupName = SearchProvider.GROUP_TYPE[groupId];
                            if (Array.isArray(oResult[sGroupName]) && oResult[sGroupName].length > 0) {
                                bFound = true;
                                sLog += "----> group '" + sGroupName + "' results:\n";
                                for (var i = 0; i < oResult[sGroupName].length; i++) {
                                    sLog += "result #" + i + ":\n";
                                    sLog += JSON.stringify(oResult[sGroupName][i], null, 2) + "\n";
                                }
                            }
                        }
                        if (!bFound) {
                            sLog += "----> no results:\n";
                        }
                        Log.info(sLog);
                    });
                })(arrProviders[idx]);
            }
        }
    };
});
