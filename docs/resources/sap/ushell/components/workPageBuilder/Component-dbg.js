//Copyright (c) 2009-2022 SAP SE, All Rights Reserved
/**
 * @fileOverview WorkPageBuilder Component
 * This UIComponent gets initialized by the FLP renderer upon visiting
 * #Launchpad-openWorkPage if work pages are enabled (/core/workPages/enabled).
 *
 * @version 1.108.12
 */

sap.ui.define([
    "sap/ui/core/UIComponent"
], function (UIComponent) {
    "use strict";

    /**
     * Component of the WorkPagesRuntime view.
     *
     * @param {string} sId Component id
     * @param {object} oSParams Component parameter
     *
     * @class
     * @extends sap.ui.core.UIComponent
     *
     * @private
     * @since 1.99.0
     * @alias sap.ushell.components.workPageBuilder.Component
     */
    return UIComponent.extend("sap.ushell.components.workPageBuilder.Component", /** @lends sap.ushell.components.workPageBuilder.Component */{
        metadata: {
            manifest: "json",
            library: "sap.ushell",
            properties: {
                /**
                 * Defines the root path for the WorkPage in the model.
                 * Can be set by an external entity.
                 */
                modelRootPath: {
                    type: "string",
                    multiple: false,
                    defaultValue: "/data"
                }
            },
            events: {
                loadCatalog: {},
                closeEditMode: {
                    parameters: {
                        /**
                         * Indicates if the changes have to be saved
                         */
                        saveChanges: {type: "boolean"}
                    }
                }
            }
        },

        init: function () {
            UIComponent.prototype.init.apply(this, arguments);
        }
    });
});
