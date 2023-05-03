// Copyright (c) 2009-2022 SAP SE, All Rights Reserved

sap.ui.define([
    "sap/ushell/services/NavTargetResolution",
    "sap/ushell/appRuntime/ui5/AppRuntimeService"
], function (NavTargetResolution, AppRuntimeService) {
    "use strict";

    function NavTargetResolutionProxy (oAdapter, oContainerInterface, sParameters, oServiceConfiguration) {
        NavTargetResolution.call(this, oAdapter, oContainerInterface, sParameters, oServiceConfiguration);

        this.getDistinctSemanticObjects = function () {
            return AppRuntimeService.sendMessageToOuterShell(
                "sap.ushell.services.NavTargetResolution.getDistinctSemanticObjects"
            );
        };

        this.expandCompactHash = function (sHashFragment) {
            return AppRuntimeService.sendMessageToOuterShell(
                "sap.ushell.services.NavTargetResolution.expandCompactHash", {
                sHashFragment: sHashFragment
            });
        };

        this.resolveHashFragment = function (sHashFragment) {
            return AppRuntimeService.sendMessageToOuterShell(
                "sap.ushell.services.NavTargetResolution.resolveHashFragment", {
                sHashFragment: sHashFragment
            });
        };

        this.isNavigationSupported = function (aIntents) {
            return AppRuntimeService.sendMessageToOuterShell(
                "sap.ushell.services.NavTargetResolution.isNavigationSupported", {
                aIntents: aIntents
            });
        };
    }

    NavTargetResolutionProxy.prototype = NavTargetResolution.prototype;
    NavTargetResolutionProxy.hasNoAdapter = NavTargetResolution.hasNoAdapter;

    return NavTargetResolutionProxy;
}, true);
