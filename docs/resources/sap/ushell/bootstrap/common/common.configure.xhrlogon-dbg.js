// Copyright (c) 2009-2022 SAP SE, All Rights Reserved
sap.ui.define([
    "sap/ushell/bootstrap/common/common.util",
    "sap/base/Log"
], function (oUtils, Log) {
    "use strict";

    var oModule = {
        start: start,
        initXhrLogonIgnoreList: initXhrLogonIgnoreList,
        createUi5ConnectedXhrLogger: createUi5ConnectedXhrLogger
    };
    return oModule;

    /**
     * Creates a logger for XMLHttpRequest(s) that logs errors, warnings, info
     * and debug messages via Log.
     *
     * @return {object}
     *    A logger that can be assigned to XMLHttpRequest.
     *
     * @private
     */
    function createUi5ConnectedXhrLogger () {
        return ["error", "warning", "info", "debug"].reduce(function (oXhrLogger, sLevel) {
            oXhrLogger[sLevel] = function (sMsg) {
                return Log[sLevel](sMsg);
            };
            return oXhrLogger;
        }, {});
    }

    /**
     * Initializes the ignore list of the XHR logon manager.
     * <p>
     * If the UI5 resources (including the own bootstrap script) are loaded from an absolute URL
     * (in case CDN is activated),
     * this URL is added to the ignore list to prevent CORS preflight requests due to the X headers.
     * We expect that all resources can be loaded without authentication in this case.
     *
     * @param {object} oXHRLogonManager
     *     the logon frame manager instance to use
     *
     * @private
     */
    function initXhrLogonIgnoreList (oXHRLogonManager) {
        var sOrigin = oUtils.getLocationOrigin(),
        sUi5ResourceRootUrl = sap.ui.require.toUrl("");

        // add "/" to origin, as otherwise the following use case will match:
        //      sUi5ResourceRootUrl: http://sap.com:123
        //      sOrigin:             http://sap.com
        if (sUi5ResourceRootUrl && sUi5ResourceRootUrl.indexOf(sOrigin + "/") === -1) {
            // In case UI5 is loaded from a different domain (CDN / AKAMAI), that URL
            // needs to be ignored for the XHR logon, as we expect that the resources
            // are not protected.
            oXHRLogonManager.ignore.add(sUi5ResourceRootUrl);
        }
    }

    /**
     * Enables the handling of the XHR Logon in the FLP.
     * Note: using sap.ui.require.toUrl for initXhrLogonIgnoreList as it
     * will be loaded in CDM (compare to ABAP, where this is not the case)
     *
     * @param {object} oSapUshellContainer
     *    The active <code>sap.ushell.Container</code> instance to configure
     *    the logon manager into.
     *
     * @param {object} oXhrLogonLib XHR logon lib.
     *
     * @private
     */
    function start (oSapUshellContainer, oXhrLogonLib) {
        oXhrLogonLib.start();

        oModule.initXhrLogonIgnoreList(oXhrLogonLib.XHRLogonManager.getInstance());

        // configure logger
        XMLHttpRequest.logger = createUi5ConnectedXhrLogger();

        oSapUshellContainer.oFrameLogonManager = oXhrLogonLib.FrameLogonManager.getInstance();
    }
});
