/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */

sap.ui.define([],
    function() {
        "use strict";

        /**
         * Chart renderer.
         * @namespace
         */
        var ChartRenderer = {
            apiVersion: 2
        };

        /**
         * CSS class to be applied to the HTML root element of the control.
         *
         * @readonly
         * @const {string}
         */
        ChartRenderer.CSS_CLASS = "sapUiMDCChart";

        /**
         * Renders the HTML for the given control, using the provided {@link sap.ui.core.RenderManager}.
         *
         * @param {sap.ui.core.RenderManager} oRm The RenderManager that can be used for writing to the render output buffer
         * @param {sap.ui.mdc.Chart} oMDCChart An object representation of the control that should be rendered
         */
        ChartRenderer.render = function(oRm, oChartImplContainer) {
                oRm.openStart("div", oChartImplContainer);
                //TODO: Clarify why providing the control in openStart doesn't work on rerender
                oRm.attr("id", oChartImplContainer.getId());
                //oRm.class(ChartRenderer.CSS_CLASS);
                //oRm.class("sapUiFixFlex");
                //oRm.style("overflow", "hidden");
                oRm.style("height", "100%");
                oRm.style("width", "100%");
                oRm.style("min-height", "200px");
                oRm.openEnd();
                oRm.renderControl(oChartImplContainer.getContent());
                oRm.renderControl(oChartImplContainer.getNoDataContent());
                oRm.renderControl(oChartImplContainer._getChartNoDataForRenderer());
                oRm.close("div");
        };

        return ChartRenderer;
    }, true);
