// Copyright (c) 2009-2022 SAP SE, All Rights Reserved
/**
 * @fileOverview handle all the services for the different applications.
 * @version 1.108.12
 */
sap.ui.define([], function () {
    "use strict";

    function RelatedServices () {
        //handle the history service
        var bDefaultBrowserBack = false,
            fnCustomBackNavigation,
            bBackNavigation = false;

        this.resetBackNavigationFlag = function () {
            bBackNavigation = false;
        };

        sap.ui.getCore().getEventBus().subscribe("relatedServices", "resetBackNavigation", this.resetBackNavigationFlag, this);

        this._defaultBackNavigation = function () {
            window.history.back();
        };

        this.isBackNavigation = function () {
            return bBackNavigation;
        };

        this.navigateBack = function () {
            var that = this;
            bBackNavigation = true;
            if (bDefaultBrowserBack === true) {
                this._defaultBackNavigation();
            } else if (fnCustomBackNavigation) {
                fnCustomBackNavigation();
            } else {
                sap.ushell.Container.getServiceAsync("CrossApplicationNavigation").then(function (oCANService) {
                    oCANService.isInitialNavigationAsync().then(function (bIsInitialNavigation) {
                        if (bIsInitialNavigation) {
                            // go back home
                            oCANService.toExternal({ target: { shellHash: "#" }, writeHistory: false });
                            return;
                        }
                        that._defaultBackNavigation();
                    });
                });
            }
        };

        this.setNavigateBack = function (inFnBKImp) {
            bDefaultBrowserBack = false;
            fnCustomBackNavigation = inFnBKImp;
        };

        this.resetNavigateBack = function () {
            bDefaultBrowserBack = true;
            fnCustomBackNavigation = undefined;
        };

        this.restore = function (oInServices) {
            bDefaultBrowserBack = oInServices.bDefaultBrowserBack;
            fnCustomBackNavigation = oInServices.fnCustomBackNavigation;
        };

        this.store = function (oServices) {
            oServices.bDefaultBrowserBack = bDefaultBrowserBack;
            oServices.fnCustomBackNavigation = fnCustomBackNavigation;
        };
    }


    return new RelatedServices();
}, /* bExport= */ true);
