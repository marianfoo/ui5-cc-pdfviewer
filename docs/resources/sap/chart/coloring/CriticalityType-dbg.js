/*!
 * SAPUI5
 * (c) Copyright 2009-2022 SAP SE. All rights reserved.
 */

sap.ui.define(function() {
    "use strict";

    /**
    * Enumeration for supported criticality types in analytical chart
    *
    * @enum {string}
    * @public
    * @alias sap.chart.coloring.CriticalityType
    */
    var CriticalityType = {
        /**
         * Negative
         * @public
         */
        Negative: "Negative",

        /**
         * Critical
         * @public
         */
        Critical: "Critical",

        /**
         * Positive
         * @public
         */
        Positive: "Positive",

        /**
         * Neutral
         * @public
         */
        Neutral: "Neutral"
    };

    return CriticalityType;

}, /* bExport= */ true);
