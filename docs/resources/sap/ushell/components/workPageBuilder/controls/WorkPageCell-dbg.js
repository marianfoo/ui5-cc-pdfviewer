/*!
 * Copyright (c) 2009-2022 SAP SE, All Rights Reserved
 */

sap.ui.define([
    "sap/ui/core/Control"
], function (
    Control
) {
    "use strict";
    /**
     * Constructor for a new WorkPageCell.
     *
     * @param {string} [sId] ID for the new control, generated automatically if no ID is given
     * @param {object} [mSettings] Initial settings for the new control
     *
     * @class
     * The WorkPageCell represents a collection of WidgetContainers.
     * @extends sap.ui.core.Control
     *
     *
     * @version 1.108.12
     *
     * @private
     * @experimental
     * @alias sap.ushell.components.workPageBuilder.controls.WorkPageCell
     */
    var WorkPageCell = Control.extend("sap.ushell.components.workPageBuilder.controls.WorkPageCell",
        /** @lends sap.ushell.components.workPageBuilder.controls.WorkPageCell.prototype */ {
        metadata: {
            library: "sap.ushell",
            aggregations: {
                /**
                 * A set of WidgetContainers that hold one widget each.
                 */
                widgetContainers: {
                    type: "sap.ushell.components.workPageBuilder.controls.WorkPageWidgetContainer",
                    multiple: true,
                    singularName: "widgetContainer"
                }
            }
        },

        renderer: {
            apiVersion: 2,

            /**
             * Renders the HTML for the WorkPageCell, using the provided {@link sap.ui.core.RenderManager}.
             *
             * @param {sap.ui.core.RenderManager} rm The RenderManager.
             * @param {sap.ushell.components.workPageBuilder.controls.WorkPageCell} workPageCell The WorkPageCell to be rendered.
             */
            render: function (rm, workPageCell) {
                var aWidgetContainers = workPageCell.getWidgetContainers();

                rm.openStart("div", workPageCell);
                rm.class("sapCepWorkPageCell");
                if (!aWidgetContainers.length) {
                    rm.class("sapCepWorkPageCellEmpty");
                }
                rm.openEnd(); // div - tag

                aWidgetContainers.forEach(function (oWidgetContainer) {
                    rm.renderControl(oWidgetContainer);
                });
                rm.close("div");
            }
        }
    });

    return WorkPageCell;
});
