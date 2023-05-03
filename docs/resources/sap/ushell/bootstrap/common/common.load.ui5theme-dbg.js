// Copyright (c) 2009-2022 SAP SE, All Rights Reserved
sap.ui.define([
    "sap/ushell/bootstrap/common/common.boot.path",
    "sap/base/Log",
    "sap/ui/dom/includeStylesheet"
], function (bootPath, Log, includeStylesheet) {
    "use strict";

    function applyBootTheme (oBootTheme) {
        if (!oBootTheme || !oBootTheme.theme) {
            Log.error("No boot theme could be applied", null,
                "common.load.ui5theme"
            );
            return;
        }

        var oSAPUIConfig = window["sap-ui-config"] || {},
            sAdjustedThemeRoot = adjustThemeRoot(oBootTheme.root),
            sThemeName = oBootTheme.theme,
            bHaveDifferentBootTheme = oSAPUIConfig.theme !== sThemeName;

        includePreloadStylesheet(sThemeName, sAdjustedThemeRoot || (bootPath + "/"));

        if (sAdjustedThemeRoot || bHaveDifferentBootTheme) {
            var oCore = sap.ui.getCore();
            var aApplyThemeArgs = [sThemeName, sAdjustedThemeRoot]
                .filter(function (s) { return s; });

            oCore.applyTheme.apply(oCore, aApplyThemeArgs);
        }

        Log.debug("Boot theme applied: theme = '" + oBootTheme.theme +
            "' theme root = '" + oBootTheme.root + "'", null,
            "common.load.ui5theme"
        );
    }

    function adjustThemeRoot (sThemeRoot) {
        if (sThemeRoot) {
            return sThemeRoot + "/UI5/";
        }

        return undefined;
    }

    function includePreloadStylesheet (sTheme, sThemeBaseUrl) {
        var sLanguage = sap.ui.getCore().getConfiguration().getLanguage(),
            sThemePrefix = sThemeBaseUrl + "sap/fiori/themes/" + sTheme,
            bIsRtl = isRtlLanguage(sLanguage),
            sFileName = bIsRtl ? "library-RTL.css" : "library.css";

        includeStylesheet(sThemePrefix + "/" + sFileName, "sap-ui-theme-sap.fiori");
    }

    function isRtlLanguage (sLanguage) {
        // a list of RTL locales ('iw' is an old code for 'he')
        var A_RTL_LOCALES = ["ar", "fa", "he", "iw"];

        // remove the region part of the locale if it exists
        sLanguage = sLanguage.toLowerCase().substring(0, 2);

        return A_RTL_LOCALES.indexOf(sLanguage) >= 0;
    }

    return applyBootTheme;
});
