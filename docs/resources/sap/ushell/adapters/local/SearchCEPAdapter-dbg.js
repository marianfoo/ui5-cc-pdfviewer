// Copyright (c) 2009-2022 SAP SE, All Rights Reserved

/**
 * @fileOverview The Unified Shell's Search adapter for myHome.
 *
 * @version 1.108.12
 */
/*eslint-disable quote-props*/
sap.ui.define([], function () {
    "use strict";

    var SearchCEPAdapter = function (oSystem, sParameters, oConfig) {
        this._oConfig = (oConfig && oConfig.config) || {};
    };

    SearchCEPAdapter.prototype.execSearch = function (sQuery) {
        var oResult = {
            "applications": [
                {
                    "text": "App Nav Sample",
                    "icon": null,
                    "inboundIdentifier": "cc8_100_3B2D2CC19DF212906AE5063BB6E03BAF_6FMR9SFQJTA1Z1O9RHH65ORPR",
                    "url": "http://localhost:8080/ushell/test-resources/sap/ushell/shells/demo/FioriLaunchpadMyHome.html?sap-ushell-navmode=explace#Action-toappnavsample",
                    "target": "_blank",
                    "recent": false,
                    "semanticObject": "Action",
                    "semanticObjectAction": "toappnavsample"
                },
                {
                    "text": "Letter Boxing",
                    "icon": "sap-icon://Fiori5/F0758",
                    "inboundIdentifier": "cc8_100_3778C1C8F9DA23827397BAFFE67144FD_6FMR9SFQJTA0D2SYT0LHOQFE0",
                    "url": "http://localhost:8080/ushell/test-resources/sap/ushell/shells/demo/FioriLaunchpadMyHome.html?sap-ushell-navmode=explace#Action-toLetterBoxing",
                    "target": "_blank",
                    "recent": false,
                    "semanticObject": "Action",
                    "semanticObjectAction": "toLetterBoxing"
                },
                {
                    "text": "Test App",
                    "icon": "sap-icon://Fiori4/F0576",
                    "inboundIdentifier": "cc8_100_F20410A0ACB6B7C1A07AFF80EEADEAA3_6FMR9SFQJTA1YZI2E8I1SVW0W",
                    "url": "http://localhost:8080/ushell/test-resources/sap/ushell/shells/demo/FioriLaunchpadMyHome.html?sap-ushell-navmode=explace#Action-todefaultapp",
                    "target": "_blank",
                    "recent": false,
                    "semanticObject": "Action",
                    "semanticObjectAction": "todefaultapp"
                },
                {
                    "text": "Test To External App",
                    "icon": "sap-icon://sales-document",
                    "inboundIdentifier": "uyz_copy_9EEB1037CC3FD1B5D091FA756D088B0F_6FMR9SFQJTA1Z1O676YUJMZSE",
                    "url": null,
                    "target": "_blank",
                    "recent": false,
                    "semanticObject": "FioriToExtApp",
                    "semanticObjectAction": "Action"
                },
                {
                    "text": "Test UI5 Isolated App",
                    "icon": "sap-icon://Fiori2/F0021",
                    "inboundIdentifier": "uyz_copy_BEB837870520FA0B8894268F5C15104E_ET091I2703HZJVOYZ1DPGIGGE",
                    "url": "http://localhost:8080/ushell/test-resources/sap/ushell/shells/demo/FioriLaunchpadMyHome.html?sap-ushell-navmode=explace#FioriToExtAppIsolated-Action?sap-app-origin-hint=",
                    "target": "_blank",
                    "recent": false,
                    "semanticObject": "FioriToExtAppIsolated",
                    "semanticObjectAction": "Action"
                },
                {
                    "text": "Bookmarks Isolated",
                    "icon": "sap-icon://Fiori2/F0381",
                    "inboundIdentifier": "uyz_copy_C13D2E1D95543176D8BE0E995B4B40BD_6FMR9SFQJTA1ZA4UNTTS4DLPT",
                    "url": "http://localhost:8080/ushell/test-resources/sap/ushell/shells/demo/FioriLaunchpadMyHome.html?sap-ui-debug=true#BookmarksIsolated-Action?sap-app-origin-hint=",
                    "target": "_blank",
                    "recent": false,
                    "semanticObject": "BookmarksIsolated",
                    "semanticObjectAction": "Action"
                },
                {
                    "text": "State Isolated",
                    "icon": "sap-icon://official-service",
                    "inboundIdentifier": "uyz_copy_A415858F86AF8F0FA60CAAB3F6D95A4F_00O2TRA3CWZY91I819J30EWCK",
                    "url": "http://localhost:8080/ushell/test-resources/sap/ushell/shells/demo/FioriLaunchpadMyHome.html?" +
                        "sap-ushell-navmode=explace#Action-toappcontextsample?sap-app-origin-hint=&//key/TASYMAQSS09J1B9SJ127D262M43JIRIVZE2SVXN94",
                    "target": "_blank",
                    "recent": false,
                    "semanticObject": "Action",
                    "semanticObjectAction": "toappcontextsample"
                },
                {
                    "text": "App For On Close",
                    "description": "Monitor Procurement-Related Tasks - Deprecated",
                    "icon": "sap-icon://Fiori4/F0671",
                    "inboundIdentifier": "uyz_copy_EDB23ED95BE3C01AABCDC6DBF86041A0_ET090M0NO76W9CXMHKTYXZSIN",
                    "url": "http://localhost:8080/ushell/test-resources/sap/ushell/shells/demo/FioriLaunchpadMyHome.html?sap-ushell-navmode=explace#AppBeforeCloseEvent-Action?sap-app-origin-hint=",
                    "target": "_blank",
                    "recent": false,
                    "semanticObject": "AppBeforeCloseEvent",
                    "semanticObjectAction": "Action"
                },
                {
                    "text": "BB1 Application A",
                    "description": "Translate Purchasing Categories",
                    "icon": "sap-icon://Fiori9/F1354",
                    "inboundIdentifier": "uyz_copy_E60F27D5B073D2A72C390D7C66DA039A_ET090M0NO76W9CXMNVXIW1QGX",
                    "url": "http://localhost:8080/ushell/test-resources/sap/ushell/shells/demo/FioriLaunchpadMyHome.html?sap-ushell-navmode=explace#Application-A?sap-app-origin-hint=",
                    "target": "_blank",
                    "recent": false,
                    "semanticObject": "Application",
                    "semanticObjectAction": "A"
                },
                {
                    "text": "Camera And Location Sample",
                    "icon": null,
                    "inboundIdentifier": "uyz_copy_D15368333A0C0006051B3F766B8FC133_ET090PW4NWFG4OW41UD5PLKGN",
                    "url": "http://localhost:8080/ushell/test-resources/sap/ushell/shells/demo/FioriLaunchpadMyHome.html?sap-ushell-navmode=explace#CameraAndLocation-Action?sap-app-origin-hint=",
                    "target": "_blank",
                    "recent": false,
                    "semanticObject": "CameraAndLocation",
                    "semanticObjectAction": "Action"
                }
            ],
            "externalSearchApplications": [
                {
                    "text": "CEP Search Internal",
                    "description": "CEP Search Internal",
                    "icon": "sap-icon://account",
                    "inboundIdentifier": "38cd162a-e185-448c-9c37-a4fc02b3d39d___GenericDefaultSemantic-__GenericDefaultAction",
                    "url": "https://search.int.sap/results%23?t=a&sap-shell=FLP",
                    "target": "_blank",
                    "recent": false,
                    "semanticObject": "Search",
                    "semanticObjectAction": "internal"
                },
                {
                    "text": "CEP Search - Google",
                    "description": "CEP Search - Google",
                    "icon": "",
                    "inboundIdentifier": "751ebcac-b7aa-4bfc-ab04-cb8d5fe78917___GenericDefaultSemantic-__GenericDefaultAction",
                    "url": "https://www.google.com/search?q=SAP&gl=us&sap-shell=FLP",
                    "target": "_blank",
                    "recent": false,
                    "semanticObject": "CepSearch",
                    "semanticObjectAction": "google"
                }
            ]
        };
        if (oResult === undefined || (typeof sQuery === "string" && sQuery.length === 0)) {
            oResult.applications = [];
        }
        return Promise.resolve(oResult);
    };

    return SearchCEPAdapter;
}, false);
/*eslint-enable quote-props*/
