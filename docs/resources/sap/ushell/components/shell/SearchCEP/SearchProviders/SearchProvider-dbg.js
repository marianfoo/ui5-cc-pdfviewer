// Copyright (c) 2009-2022 SAP SE, All Rights Reserved

/**
 * @fileOverview This module is the search provider main interface
 * @version 1.108.12
 */
sap.ui.define([], function () {
    "use strict";

    var SearchProvider = {
    };

    SearchProvider.GROUP_TYPE = {
        Applications: "applications",
        RecentApplications: "recentApplications",
        RecentSearches: "recentSearches",
        ExternalSearchApplications: "externalSearchApplications"
    };

    SearchProvider.ENTRY_TYPE = {
        App: "app",
        ExternalLink: "ex-link",
        SearchText: "text"
    };

    return SearchProvider;
}, false);
