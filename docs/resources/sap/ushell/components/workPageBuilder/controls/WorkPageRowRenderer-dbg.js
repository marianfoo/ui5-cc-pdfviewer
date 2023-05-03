// Copyright (c) 2009-2022 SAP SE, All Rights Reserved

sap.ui.define(function () {
    "use strict";

    /**
     * @class WorkPageRow renderer.
     * @static
     *
     * @private
     */
    var WorkPageRowRenderer = {
        apiVersion: 2,
        /**
         * Renders the HTML for the given control, using the provided {@link sap.ui.core.RenderManager}.
         *
         * @param {sap.ui.core.RenderManager} rm the RenderManager that can be used for writing to the render output buffer
         * @param {sap.ushell.components.workPageBuilder.controls.WorkPageRow} workPageRow an object representation of the control that should be rendered
         */
        render: function (rm, workPageRow) {
            // Return immediately if control is invisible
            if (!workPageRow.getVisible()) {
                return;
            }
            var iIndex = workPageRow.getParent().indexOfAggregation("rows", workPageRow);

            rm.openStart("div", workPageRow);

            if (workPageRow.getBackgroundColor()) {
                rm.style("background-color", workPageRow.getBackgroundColor());
            }

            rm.class("sapCepWorkPageRow");

            if (workPageRow.getFullWidthBackground()) {
                rm.class("sapCepWorkPageRowFullWidth");
            }

            if (iIndex === 0) {
                rm.class("sapCepWorkPageRowFirst");
            }

            rm.openEnd(); // div - tag

            rm.openStart("div", workPageRow);
            rm.class("sapCepWorkPageRowLimiter");
            rm.openEnd(); // div - tag

            // Header bar
            rm.renderControl(workPageRow.getHeaderBar());

            rm.openStart("div");
            rm.class("sapCepWorkPageRowInner");
            rm.openEnd(); // div - tag
            var aColumns = workPageRow.getColumns();
            for (var i = 0; i < aColumns.length; i++) {
                rm.renderControl(aColumns[i]);
            }
            if (workPageRow.getEditMode()) {
                rm.renderControl(workPageRow.getAddButton("top"));
                rm.renderControl(workPageRow.getAddButton("bottom"));
            }
            rm.close("div");
            rm.close("div");
            rm.close("div");
        }
    };

    return WorkPageRowRenderer;
}, /* bExport= */ true);
