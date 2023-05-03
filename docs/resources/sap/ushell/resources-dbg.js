// Copyright (c) 2009-2022 SAP SE, All Rights Reserved
/**
 * @fileOverview This file handles the resource bundles.
 */

sap.ui.define(["sap/ui/model/resource/ResourceModel"], function (ResourceModel) {
    "use strict";

    // ensure that sap.ushell exists
    var resources = {};

    resources.getTranslationModel = function (sLocale) {
        var oResourceModel;
        if (resources._oResourceModel) {
            oResourceModel = resources._oResourceModel;
        } else {
            // create translation resource model
            oResourceModel = new ResourceModel({
                bundleUrl: sap.ui.require.toUrl("sap/ushell/renderers/fiori2/resources/resources.properties"),
                bundleLocale: sLocale
            });
            resources._oResourceModel = oResourceModel;
        }
        return oResourceModel;
    };

    resources.i18nModel = resources.getTranslationModel(sap.ui.getCore().getConfiguration().getLanguage());
    resources.i18n = resources.i18nModel.getResourceBundle();

    return resources;
}, /* bExport= */ true);
