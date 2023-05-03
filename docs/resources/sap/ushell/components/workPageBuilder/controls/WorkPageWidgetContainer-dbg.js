/*!
 * Copyright (c) 2009-2022 SAP SE, All Rights Reserved
 */

sap.ui.define([
    "sap/ui/core/Control",
    "sap/m/Button"
], function (
    Control,
    Button
) {
    "use strict";
    /**
     * Constructor for a new WorkPageWidgetContainer.
     *
     * @param {string} [sId] ID for the new control, generated automatically if no ID is given
     * @param {object} [mSettings] Initial settings for the new control
     *
     * @class
     * The WorkPageWidgetContainer represents a wrapper for the actual widget.
     * It contains controls to delete the widget or enter the widget settings.
     * @extends sap.ui.core.Control
     *
     *
     * @version 1.108.12
     *
     * @private
     * @experimental
     * @alias sap.ushell.components.workPageBuilder.controls.WorkPageWidgetContainer
     */
    var WorkPageWidgetContainer = Control.extend("sap.ushell.components.workPageBuilder.controls.WorkPageWidgetContainer",
        /** @lends sap.ushell.components.workPageBuilder.controls.WorkPageWidgetContainer.prototype */ {
        metadata: {
            library: "sap.ushell",
            properties: {
                /**
                 * Indicating if the control should be rendered in edit mode.
                 */
                editMode: {type: "boolean", defaultValue: false},
                /**
                 * Tooltip to display for the "Open Widget Settings" button
                 */
                openWidgetSettingsTooltip: { type: "string", defaultValue: "" },
                /**
                 * Tooltip to display for the "Delete Widget" button
                 */
                deleteWidgetTooltip: { type: "string", defaultValue: "" }
            },
            aggregations: {
                /**
                 * The widget control.
                 */
                widget: { type: "sap.ui.core.Control", multiple: false },
                /**
                 * Internal aggregation for the delete button control.
                 */
                _deleteButton: { type: "sap.m.Button", multiple: false, visibility: "hidden" }
            },
            events: {
                deleteWidget: {}
            }
        },
        renderer: {
            apiVersion: 2,

            /**
             * Renders the HTML for the WorkPageWidgetContainer, using the provided {@link sap.ui.core.RenderManager}.
             *
             * @param {sap.ui.core.RenderManager} rm The RenderManager.
             * @param {sap.ushell.components.workPageBuilder.controls.WorkPageWidgetContainer} workPageWidgetContainer The WorkPageWidgetContainer to be rendered.
             */
            render: function (rm, workPageWidgetContainer) {
                rm.openStart("div", workPageWidgetContainer);
                rm.class("sapCepWorkPageWidgetContainer");
                rm.openEnd();  // div - tag

                rm.openStart("div");
                rm.class("sapCepWorkPageWidgetContainerInner");
                rm.openEnd();  // div - tag
                rm.renderControl(workPageWidgetContainer.getWidget());
                rm.close("div");

                if (workPageWidgetContainer.getEditMode()) {
                    rm.openStart("div");
                    rm.class("sapCepWidgetToolbar");
                    rm.openEnd(); // div - tag

                    rm.renderControl(workPageWidgetContainer.getDeleteButton());

                    rm.close("div");
                }

                rm.close("div");
            }
        }
    });


    /**
     * Checks if the aggregation for the delete button exists. If not, create and store it.
     *
     * @return {sap.m.Button} The button control.
     */
    WorkPageWidgetContainer.prototype.getDeleteButton = function () {
        if (!this.getAggregation("_deleteButton")) {
            this.setAggregation("_deleteButton", new Button({
                icon: "sap-icon://delete",
                tooltip: this.getDeleteWidgetTooltip(),
                press: function () {
                    this.fireEvent("deleteWidget");
                }.bind(this)
            }));
        }
        return this.getAggregation("_deleteButton");
    };

    return WorkPageWidgetContainer;
});
