// Copyright (c) 2009-2022 SAP SE, All Rights Reserved

/**
 * @fileOverview contentFinderAppSearch Component
 *
 *
 * @version 1.108.12
 */
sap.ui.define([
    "sap/ui/core/UIComponent"
], function (UIComponent) {
    "use strict";

    /**
     * Component of the ContentFinderAppSearch view.
     *
     * @param {string} sId Component id
     * @param {object} oSParams Component parameter
     *
     * @class
     * @extends sap.ui.core.UIComponent
     *
     * @private
     * @since 1.106.0
     * @alias sap.ushell.components.ContentFinderAppSearch.Component
     */
    return UIComponent.extend("sap.ushell.components.contentFinderAppSearch.Component", /** @lends sap.ushell.components.contentFinderAppSearch.Component */{
        metadata: {
            manifest: "json",
            library: "sap.ushell",
            events: {
            }
        },


        init: function () {
            UIComponent.prototype.init.apply(this, arguments);
        }

    });
});
