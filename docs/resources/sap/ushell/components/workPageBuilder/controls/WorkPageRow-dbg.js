/*!
 * Copyright (c) 2009-2022 SAP SE, All Rights Reserved
 */

sap.ui.define([
    "sap/ui/core/Control",
    "sap/ushell/components/workPageBuilder/controls/WorkPageButton",
    "sap/ushell/components/workPageBuilder/controls/WorkPageRowRenderer"
], function (
    Control,
    WorkPageButton,
    Renderer
) {
    "use strict";
    /**
     * Constructor for a new WorkPageRow.
     *
     * @param {string} [sId] ID for the new control, generated automatically if no ID is given
     * @param {object} [mSettings] Initial settings for the new control
     *
     * @class
     * The WorkPageRow represents a title and a collection of WorkPageColumns.
     * In edit mode, there are "Add Row" buttons rendered, additionally.
     * @extends sap.ui.core.Control
     *
     *
     * @version 1.108.12
     *
     * @private
     * @experimental
     * @alias sap.ushell.components.workPageBuilder.controls.WorkPageRow
     */
    var WorkPageRow = Control.extend("sap.ushell.components.workPageBuilder.controls.WorkPageRow", /** @lends sap.ushell.components.workPageBuilder.controls.WorkPageRow.prototype */ {
        metadata: {
            library: "sap.ushell",
            properties: {
                /**
                 * Indicates if the WorkPageRow should span the full width of the page.
                 */
                fullWidthBackground: {type: "boolean", defaultValue: false},
                /**
                 * A background color for the WorkPageRow.
                 */
                backgroundColor: {type: "sap.m.ValueCSSColor", defaultValue: ""},
                /**
                 * Indicating if the WorkPageRow should render itself in edit mode.
                 */
                editMode: { type: "boolean", group: "Misc", defaultValue: false },
                /**
                 * The tooltip text to display for the "Add Row" button
                 */
                addRowButtonTooltip: { type: "string", group: "Misc", defaultValue: "" }
            },
            defaultAggregation: "columns",
            aggregations: {
                /**
                 * A set of WorkPage Columns which are rendered horizontally in the WorkPageRow.
                 */
                columns: { type: "sap.ushell.components.workPageBuilder.controls.WorkPageColumn", multiple: true, singularName: "column" },
                /**
                 * The header toolbar that display the title and some row configuration options.
                 */
                headerBar: { type: "sap.m.IBar", multiple: false},
                /**
                 * Private aggregation to store the "Add Row" button.
                 * @private
                 */
                _addButtonBottom: { type: "sap.ushell.components.workPageBuilder.controls.WorkPageButton", multiple: false, visibility: "hidden" },
                /**
                 * Private aggregation to store the "Add Row" button.
                 * @private
                 */
                _addButtonTop: { type: "sap.ushell.components.workPageBuilder.controls.WorkPageButton", multiple: false, visibility: "hidden" }
            },
            events: {
                /**
                 * Fired if an "Add Row" button was pressed.
                 */
                addRow: {
                    parameters: {
                        /**
                         * Indicates if the new WorkPageRow should be added after or before the current one.
                         */
                        bottom: { type: "boolean" }
                    }
                }
            }
        },
        renderer: Renderer
    });

    /**
     * Returns the width of one single column in the row.
     * There are max. 24 columns.
     *
     * @return {number} The value.
     */
    WorkPageRow.prototype.getSingleColumnWidth = function () {
        return this.$().width() / 24;
    };

    /**
     * Creates a new "Add Row" button at the given position.
     * @param {string} sPosition The position of the button ("top"|"bottom").
     * @return {sap.ushell.components.workPageBuilder.controls.WorkPageButton} The WorkPageButton control.
     * @private
     */
    WorkPageRow.prototype._createAddButton = function (sPosition) {
        var sClass = sPosition === "bottom" ? "sapCepRowButtonBottom" : "sapCepRowButtonTop";

        return new WorkPageButton({
            icon: "sap-icon://add",
            tooltip: this.getAddRowButtonTooltip(),
            press: function () {
                this.fireEvent("addRow", {
                    bottom: sPosition === "bottom"
                });
            }.bind(this)
        }).addStyleClass("sapCepRowButton " + sClass);
    };

    /**
     * Checks if the "Add Row" button for the given position already exists in the aggregation. If not, a new
     * button is created and stored.
     *
     * @param {string} sPosition The button position.
     * @return {sap.ushell.components.workPageBuilder.controls.WorkPageButton} The WorkPageButton control.
     */
    WorkPageRow.prototype.getAddButton = function (sPosition) {
        if (sPosition === "bottom") {
            if (!this.getAggregation("_addButtonBottom")) {
                this.setAggregation("_addButtonBottom", this._createAddButton(sPosition));
            }
            return this.getAggregation("_addButtonBottom");
        } else if (!this.getAggregation("_addButtonTop")) {
            this.setAggregation("_addButtonTop", this._createAddButton(sPosition));
        }
        return this.getAggregation("_addButtonTop");
    };

    return WorkPageRow;

});
