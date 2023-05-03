// Copyright (c) 2009-2022 SAP SE, All Rights Reserved
/**
 * This module provides a function <code>load</code> for loading the core-min-x resource bundles.
 * Besides that <code>loaded</code> indicates if core-min bundles have been loaded - or not.
 */
sap.ui.define([
    "./common.debug.mode",
    "./common.load.script"
], function (bDebugSources, fnLoadScript) {
    "use strict";

    var coreMinLoader = {};

    // Indicates if core-min bundles have been used (or if debug sources / single requests have been used)
    coreMinLoader.loaded = isCoreMinAlreadyLoaded();

    coreMinLoader.load = function (sPath) {
        var sUrlPath = sap.ui.require.toUrl((sPath).replace(/\./g, "/"));
        var i;

        if (bDebugSources) {
            // If pure debug mode is turned on (sap-ui-debug=(true|x|X)), it's only
            // needed to require the Core and boot the core because the minified preload
            // modules should be loaded with the single -dbg versions.
            sap.ui.require(["sap/ui/core/Core"], function (core) {
                core.boot();
            });
        } else {
            for (i = 0; i < 4; i++) {
                fnLoadScript(sUrlPath + "/core-min-" + i + ".js");
                coreMinLoader.loaded = true;
            }
        }
    };

    function isCoreMinAlreadyLoaded () {
        var aScriptTagElements = Array.from(document.getElementsByTagName("script"));

        var bCoreMinLoaded = aScriptTagElements.some(function (oSrcTag) {
            var sSrcAttribute = oSrcTag.getAttribute("src");
            return sSrcAttribute && sSrcAttribute.indexOf("core-min-0.js") > -1;
        });
        return bCoreMinLoaded;
    }

    return coreMinLoader;
});
