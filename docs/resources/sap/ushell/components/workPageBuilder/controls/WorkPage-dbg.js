// Copyright (c) 2009-2022 SAP SE, All Rights Reserved

sap.ui.define([
    "sap/ui/core/Control",
    "sap/ushell/components/workPageBuilder/controls/WorkPageRenderer",
    "sap/m/IllustratedMessage",
    "sap/m/IllustratedMessageType",
    "sap/m/IllustratedMessageSize",
    "sap/m/Button",
    "sap/ushell/utils"
], function (
    Control,
    Renderer,
    IllustratedMessage,
    IllustratedMessageType,
    IllustratedMessageSize,
    Button,
    Utils
) {
    "use strict";

    /**
     * Constructor for a new WorkPage.
     *
     * @param {string} [sId] ID for the new control, generated automatically if no ID is given
     * @param {object} [mSettings] Initial settings for the new control
     *
     * @class
     * The WorkPage represents a collection of WorkPageRows.
     * @extends sap.ui.core.Control
     *
     *
     * @version 1.108.12
     *
     * @private
     * @experimental
     * @alias sap.ushell.components.workPageBuilder.controls.WorkPage
     */
    var WorkPage = Control.extend("sap.ushell.components.workPageBuilder.controls.WorkPage", /** @lends sap.ushell.components.workPageBuilder.controls.WorkPage.prototype */ {
        metadata: {
            library: "sap.ushell",
            properties: {
                /**
                 * Specifies whether the addSection button is visible.
                 */
                editMode: { type: "boolean", group: "Misc", defaultValue: false },
                /**
                 * Title to display on the empty page illustration
                 */
                emptyIllustrationTitle: { type: "string", group: "Misc", defaultValue: "" },
                /**
                 * Message to display on the empty page illustration
                 */
                emptyIllustrationMessage: { type: "string", group: "Misc", defaultValue: "" },
                /**
                 * Message to display on the Add Row button on the empty page illustration
                 */
                emptyIllustrationButtonText: { type: "string", group: "Misc", defaultValue: "" },
                /**
                 * Boolean to indicate if the WorkPage has been loaded yet
                 */
                loaded: {type: "boolean", defaultValue: false}
            },
            defaultAggregation: "rows",
            aggregations: {
                /**
                 * Aggregation of WorkPageRows that are displayed on the WorkPage.
                 */
                rows: { type: "sap.ushell.components.workPageBuilder.controls.WorkPageRow", multiple: true, singularName: "row" },
                /**
                 * The page title control
                 */
                title: { type: "sap.ui.core.Control", multiple: false, defaultValue: "" },
                /**
                 * Private aggregation for the Illustrated Message that is displayed if the WorkPage is empty.
                 * @private
                 */
                _emptyIllustration: { type: "sap.m.IllustratedMessage", multiple: false, visibility: "hidden" }

            },
            events: {
                /**
                 * Fired if the first row is added to the page.
                 */
                addFirstRow: {}
            }
        },
        renderer: Renderer
    });

    WorkPage.prototype.init = function () {
        this.addDelegate({
            onAfterRendering: function () {
                Utils.setPerformanceMark("FLP -- work page after rendering");
            }
        });
    };
        /**
     * Checks if the private aggregation "_emptyIllustration" exists.
     * If not, the control is created and stored in the aggregation.
     *
     * @return {sap.m.IllustratedMessage} The IllustratedMessage control.
     */
    WorkPage.prototype.getIllustratedMessage = function () {
        if (!this.getAggregation("_emptyIllustration")) {
            this.setAggregation("_emptyIllustration", this._createIllustratedMessage());
        }
        return this.getAggregation("_emptyIllustration");
    };

    /**
     * Creates an IllustratedMessage control with an additional button to add the first row.
     * This control is displayed if the WorkPage is empty.
     *
     * @return {sap.m.IllustratedMessage} The IllustratedMessage control.
     * @private
     */
    WorkPage.prototype._createIllustratedMessage = function () {
        return new IllustratedMessage({
            illustrationType: IllustratedMessageType.AddColumn,
            illustrationSize: IllustratedMessageSize.Spot,
            title: this.getEmptyIllustrationTitle(),
            description: this.getEmptyIllustrationMessage(),
            additionalContent: [
                new Button({
                    text: this.getEmptyIllustrationButtonText(),
                    press: function () {
                        this.fireEvent("addFirstRow");
                    }.bind(this)
                }).addStyleClass("sapUiTinyMarginBegin sapUiTinyMarginEnd")
            ],
            visible: "{/editMode}"
        });
    };


    return WorkPage;
});
