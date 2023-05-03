/*!
 * Copyright (c) 2009-2022 SAP SE, All Rights Reserved
 */

sap.ui.define([
    "sap/ui/core/Control",
    "sap/ushell/components/workPageBuilder/controls/WorkPageColumnResizer",
    "sap/ushell/components/workPageBuilder/controls/WorkPageButton",
    "sap/m/Button",
    "sap/ushell/components/workPageBuilder/controls/WorkPageColumnRenderer"
], function (
    Control,
    WorkPageColumnResizer,
    WorkPageButton,
    Button,
    Renderer
) {
    "use strict";
    /**
     * Constructor for a new WorkPageColumn.
     *
     * @param {string} [sId] ID for the new control, generated automatically if no ID is given
     * @param {object} [mSettings] Initial settings for the new control
     *
     * @class
     * The WorkPageColumn represents a collection of WorkPageCells.
     * @extends sap.ui.core.Control
     *
     *
     * @version 1.108.12
     *
     * @private
     * @experimental
     * @alias sap.ushell.components.workPageBuilder.controls.WorkPageColumn
     */
    var WorkPageColumn = Control.extend("sap.ushell.components.workPageBuilder.controls.WorkPageColumn",
        /** @lends sap.ushell.components.workPageBuilder.controls.WorkPageColumn.prototype */ {
        metadata: {
            library: "sap.ushell",
            properties: {
                /**
                 * The colspan of the WorkPageColumn.
                 */
                colspan: {type: "int", defaultValue: 24},
                /**
                 * Indicating if the control should be rendered in edit mode.
                 */
                editMode: { type: "boolean", group: "Misc", defaultValue: false },
                /**
                 * Tooltip to display for the "Delete Column" button.
                 */
                deleteColumnButtonTooltip: { type: "string", group: "Misc", defaultValue: "" },
                /**
                 * Tooltip to display for the "Add Column" button.
                 */
                addColumnButtonTooltip: { type: "string", group: "Misc", defaultValue: "" },
                /**
                 * Text for the "Add Widget" button.
                 */
                addWidgetButtonText: { type: "string", group: "Misc", defaultValue: "" }
            },
            defaultAggregation: "cells",
            aggregations: {
                /**
                 * A set of WorkPageCells to be rendered in the WorkPageColumn.
                 */
                cells: { type: "sap.ushell.components.workPageBuilder.controls.WorkPageCell", multiple: true, singularName: "cell" },
                /**
                 * A private aggregation for the "Delete" button.
                 * @private
                 */
                _deleteButton: { type: "sap.m.Button", multiple: false, visibility: "hidden" },
                /**
                 * A private aggregation for the "Add Widget" button.
                 * @private
                 */
                _addWidgetButton: { type: "sap.m.Button", multiple: false, visibility: "hidden" },
                /**
                 * A private aggregation for the "Add Column" button left.
                 * @private
                 */
                _addButtonLeft: { type: "sap.ushell.components.workPageBuilder.controls.WorkPageButton", multiple: false, visibility: "hidden" },
                /**
                 * A private aggregation for the "Add Column" button right.
                 * @private
                 */
                _addButtonRight: { type: "sap.ushell.components.workPageBuilder.controls.WorkPageButton", multiple: false, visibility: "hidden" },
                /**
                 * A private aggregation for the "Resizer" control.
                 * @private
                 */
                _resizer: { type: "sap.ushell.components.workPageBuilder.controls.WorkPageColumnResizer", multiple: false, visibility: "hidden" }
            },
            events: {
                /**
                 * Fired if a column is added to the left or to the right of this column.
                 */
                addColumn: {
                    left: { type: "boolean" }
                },
                /**
                 * Fired if the addWidget button is clicked.
                */
                addWidget: {},
                /**
                 * Fired if the column is removed.
                 */
                removeColumn: {},
                /**
                 * Fired if this column is resized.
                 */
                columnResized: {
                    parameters: {
                        /**
                         * The difference between the x-position and the source element.
                         */
                        posXDiff: { type: "float" }
                    }
                }
            }
        },
        renderer: Renderer
    });

    /**
     * Initializes the control.
     * Bind the handlers and initializes the resize event.
     */
    WorkPageColumn.prototype.init = function () {
        Control.prototype.init.apply(this, arguments);
        this._fnHandleResize = this._handleResizerMoved.bind(this);
        this._fnHandleRemoveColumn = this._handleRemoveColumn.bind(this);
        this._oResizer = new WorkPageColumnResizer()
            .attachEvent("resizerMoved", this._fnHandleResize);
    };

    /**
     * Override setProperty for the property "colspan". This must be called with bSuppressInvalidate == true
     * as the column resize is done by DOM manipulation.
     *
     * @param {string} sAssociationName The name of the property.
     * @param {string} sId The id of the property.
     * @param {boolean} bSuppressInvalidate Boolean that indicates if the change should be propagated to the renderer
     * @return {sap.ushell.components.workPageBuilder.controls.WorkPageColumn} The WorkPageColumn instance.
     */
    WorkPageColumn.prototype.setProperty = function (sAssociationName, sId, bSuppressInvalidate) {
        if (sAssociationName === "colspan") {
            bSuppressInvalidate = true;
        }
        return Control.prototype.setProperty.call(this, sAssociationName, sId, bSuppressInvalidate);
    };

    /**
     * Creates the Delete button for this WorkPageColumn.
     *
     * @return {sap.m.Button} The button control.
     * @private
     */
    WorkPageColumn.prototype._createDeleteButton = function () {
        return new Button({
            icon: "sap-icon://delete",
            tooltip: this.getDeleteColumnButtonTooltip(),
            press: function () {
                this.fireEvent("removeColumn");
            }.bind(this)
        }).addStyleClass("sapCepWorkPageColumnDeleteButton");
    };

    /**
     * Checks if the button control already exists in the aggregation. If not, it will be created and saved in the aggregation.
     *
     * @return {sap.m.Button} The button control.
     */
    WorkPageColumn.prototype.getDeleteButton = function () {
        if (!this.getAggregation("_deleteButton")) {
            this.setAggregation("_deleteButton", this._createDeleteButton());
        }
        return this.getAggregation("_deleteButton");
    };

    /**
     * Creates the "Add Column" button for this WorkPageColumn at the given sPosition.
     *
     * @param {string} sPosition The position for the button ("left"|"right").
     * @return {sap.m.Button} The button control.
     * @private
     */
    WorkPageColumn.prototype._createAddButton = function (sPosition) {
        var sClass = sPosition === "left" ? "sapCepColumnButtonLeft" : "sapCepColumnButtonRight";
        return new WorkPageButton({
            icon: "sap-icon://add",
            tooltip: this.getAddColumnButtonTooltip(),
            press: function () {
                this.fireEvent("addColumn", {
                    left: sPosition === "left"
                });
            }.bind(this)
        }).addStyleClass("sapCepDividerButton " + sClass);
    };

    /**
     * Checks if the button control for the given position already exists in the aggregation.
     * If not, it will be created and saved in the aggregation.
     *
     * @param {string} sPosition The button position.
     * @return {sap.m.Button} The button control.
     */
    WorkPageColumn.prototype.getAddButton = function (sPosition) {
        if (sPosition === "left") {
            if (!this.getAggregation("_addButtonLeft")) {
                this.setAggregation("_addButtonLeft", this._createAddButton("left"));
            }
            return this.getAggregation("_addButtonLeft");
        }

        if (!this.getAggregation("_addButtonRight")) {
            this.setAggregation("_addButtonRight", this._createAddButton("right"));
        }
        return this.getAggregation("_addButtonRight");

    };

    /**
     * Returns the Resizer control, which was created on init.
     *
     * @return {sap.ushell.components.workPageBuilder.controls.WorkPageColumnResizer} The resizer control.
     */
    WorkPageColumn.prototype.getResizer = function () {
        return this._oResizer;
    };

    /**
     * Handler for the "removeColumn" event, fired by the resizer.
     * Propagates the event by firing a new "removeColumn" event.
     *
     * @param {sap.base.Event} oEvent The removeColumn event.
     * @private
     */
    WorkPageColumn.prototype._handleRemoveColumn = function (oEvent) {
        var oData = oEvent.getParameters();
        this.fireEvent("removeColumn", oData);
    };

    /**
     * Handler for the "columnResized" event, fired by the resizer.
     * Propagates the event by firing a new "columnResized" event.
     *
     * @param {sap.base.Event} oEvent The columnResized event.
     * @private
     */
    WorkPageColumn.prototype._handleResizerMoved = function (oEvent) {
        var oData = oEvent.getParameters();
        this.fireEvent("columnResized", oData);
    };

    /**
     * Lifecycle method. Called if the control is destroyed. Detaches all listeners.
     */
    WorkPageColumn.prototype.exit = function () {
        Control.prototype.exit.apply(this, arguments);
        this._oResizer.detachEvent("resizerMoved", this._fnHandleResize);
    };

    /**
     * Creates a new "Add Widget" button.
     * @return {sap.m.Button} The button control.
     * @private
     */
    WorkPageColumn.prototype._createAddWidgetButton = function () {
        return new Button({
            text: this.getAddWidgetButtonText(),
            type: sap.m.ButtonType.Emphasized,
            press: function () {
                this.fireEvent("addWidget");
            }.bind(this)
        }).addStyleClass("sapCepAddWidgetButton");
    };

    /**
     * Checks if the "Add Widget" button already exists in the aggregation. If not, a new one is created.
     *
     * @return {sap.m.Button} The button control.
     */
    WorkPageColumn.prototype.getAddWidgetButton = function () {
        if (!this.getAggregation("_addWidgetButton")) {
            this.setAggregation("_addWidgetButton", this._createAddWidgetButton());
        }
        return this.getAggregation("_addWidgetButton");
    };

    return WorkPageColumn;

});
