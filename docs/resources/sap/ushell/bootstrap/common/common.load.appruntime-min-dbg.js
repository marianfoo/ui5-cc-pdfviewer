// Copyright (c) 2009-2022 SAP SE, All Rights Reserved

/*
 * This module provides a function for loading the appruntime-min-x resources.
 */
sap.ui.define([
    "./common.debug.mode",
    "./common.load.script"
], function (bDebugSources, fnLoadScript) {
    "use strict";

    //loadAppRuntimeMin
    function loadAppRuntimeMin (sPath) {
        var sUrlPath = sap.ui.require.toUrl((sPath).replace(/\./g, "/")),
            i;
        if (bDebugSources) {
            // If pure debug mode is turned on (sap-ui-debug=(true|x|X)), it's only
            // needed to require the Core and boot the core because the minified preload
            // modules should be loaded with the single -dbg versions.
            sap.ui.require(["sap/ui/core/Core"], function (core) {
                core.boot();
            });
        } else {
            // check if we can simplify this by using ui5 module loading
            for (i = 0; i < 4; i++) {
                fnLoadScript(sUrlPath + "/appruntime-min-" + i + ".js");
            }
        }
    }
    return loadAppRuntimeMin;
});
