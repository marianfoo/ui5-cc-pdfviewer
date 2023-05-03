/*!
 * SAPUI5
 * (c) Copyright 2009-2022 SAP SE. All rights reserved.
 */

/**
 * Initialization Code and shared classes of library sap.suite.ui.microchart.
 */
sap.ui.define([
	"sap/ui/thirdparty/jquery",
	"sap/ui/core/IntervalTrigger",
	"sap/ui/core/Core", // provides sap.ui.getCore()
	"sap/ui/core/library", // library dependency
	"sap/m/library" // library dependency
], function(jQuery, IntervalTrigger) {
	"use strict";

	/**
	 * UI5 library: sap.suite.ui.microchart.
	 *
	 * @namespace
	 * @alias sap.suite.ui.microchart
	 * @author SAP SE
	 * @version 1.108.8
	 * @public
	 */
	var thisLib = sap.ui.getCore().initLibrary({
		name: "sap.suite.ui.microchart",
		version: "1.108.8",
		// library dependencies
		dependencies: ["sap.ui.core", "sap.m"],
		types: [
			"sap.suite.ui.microchart.AreaMicroChartViewType",
			"sap.suite.ui.microchart.BulletMicroChartModeType",
			"sap.suite.ui.microchart.CommonBackgroundType",
			"sap.suite.ui.microchart.ComparisonMicroChartViewType",
			"sap.suite.ui.microchart.DeltaMicroChartViewType",
			"sap.suite.ui.microchart.HorizontalAlignmentType",
			"sap.suite.ui.microchart.LoadStateType",
			"sap.suite.ui.microchart.LineType"

		],
		interfaces: [],
		controls: [
			"sap.suite.ui.microchart.AreaMicroChart",
			"sap.suite.ui.microchart.BulletMicroChart",
			"sap.suite.ui.microchart.ColumnMicroChart",
			"sap.suite.ui.microchart.ComparisonMicroChart",
			"sap.suite.ui.microchart.DeltaMicroChart",
			"sap.suite.ui.microchart.HarveyBallMicroChart",
			"sap.suite.ui.microchart.LineMicroChart",
			"sap.suite.ui.microchart.InteractiveBarChart",
			"sap.suite.ui.microchart.InteractiveDonutChart",
			"sap.suite.ui.microchart.InteractiveLineChart",
			"sap.suite.ui.microchart.RadialMicroChart",
			"sap.suite.ui.microchart.StackedBarMicroChart"
		],
		elements: [
			"sap.suite.ui.microchart.AreaMicroChartPoint",
			"sap.suite.ui.microchart.AreaMicroChartItem",
			"sap.suite.ui.microchart.AreaMicroChartLabel",
			"sap.suite.ui.microchart.BulletMicroChartData",
			"sap.suite.ui.microchart.ColumnMicroChartData",
			"sap.suite.ui.microchart.ColumnMicroChartLabel",
			"sap.suite.ui.microchart.ComparisonMicroChartData",
			"sap.suite.ui.microchart.HarveyBallMicroChartItem",
			"sap.suite.ui.microchart.LineMicroChartPoint",
			"sap.suite.ui.microchart.LineMicroChartEmphasizedPoint",
			"sap.suite.ui.microchart.LineMicroChartLine",
			"sap.suite.ui.microchart.InteractiveBarChartBar",
			"sap.suite.ui.microchart.InteractiveDonutChartSegment",
			"sap.suite.ui.microchart.InteractiveLineChartPoint",
			"sap.suite.ui.microchart.StackedBarMicroChartBar"
		]
	});

	/**
	 * Enum of available views for the area micro chart concerning the position of the labels.
	 *
	 * @enum {string}
	 * @public
	 * @since 1.34
	 */
	thisLib.AreaMicroChartViewType = {

		/**
		 * The view with labels on the top and bottom.
		 * @public
		 */
		Normal: "Normal",

		/**
		 * The view with labels on the left and right.
		 * @public
		 */
		Wide: "Wide"

	};

	/**
	 * Defines if the horizontal bar represents a current value only or if it represents the delta between a current value and a threshold value.
	 *
	 * @enum {string}
	 * @public
	 * @since 1.34
	 */
	thisLib.BulletMicroChartModeType = {
		/**
		 * Displays the Actual value.
		 * @public
		 */
		Actual: "Actual",

		/**
		 * Displays delta between the Actual and Threshold values.
		 * @public
		 */
		Delta: "Delta"
	};

	/**
	 * Lists the available theme-specific background colors.
	 *
	 * @enum {string}
	 * @public
	 * @since 1.34
	 */
	thisLib.CommonBackgroundType = {
		/**
		 * The lightest background color.
		 * @public
		 */
		Lightest: "Lightest",

		/**
		 * Extra light background color.
		 * @public
		 */
		ExtraLight: "ExtraLight",

		/**
		 * Light background color.
		 * @public
		 */
		Light: "Light",

		/**
		 * Medium light background color.
		 * @public
		 */
		MediumLight: "MediumLight",

		/**
		 * Medium background color.
		 * @public
		 */
		Medium: "Medium",

		/**
		 * Dark background color.
		 * @public
		 */
		Dark: "Dark",

		/**
		 * Extra dark background color.
		 * @public
		 */
		ExtraDark: "ExtraDark",

		/**
		 * The darkest background color.
		 * @public
		 */
		Darkest: "Darkest",

		/**
		 * The transparent background color.
		 * @public
		 */
		Transparent: "Transparent"
	};

	/**
	 * Type of the microchart line.
	 *
	 * @enum {string}
	 * @public
	 * @since 1.60
	 */
	thisLib.LineType = {
		/**
		 * Solid line.
		 * @public
		 */
		Solid: "Solid",

		/**
		 * Dashed line.
		 * @public
		 */
		Dashed: "Dashed",

		/**
		 * Dotted line.
		 * @public
		 */
		Dotted: "Dotted"
	};

	/**
	 * Alignment type for the microchart content.
	 *
	 * @enum {string}
	 * @public
	 * @since 1.62
	 */
	thisLib.HorizontalAlignmentType = {
		/**
		 * Left alignment.
		 * @public
		 */
		Left: "Left",

		/**
		 * Center alignment.
		 * @public
		 */
		Center: "Center",

		/**
		 * Right alignment.
		 * @public
		 */
		Right: "Right"
	};

	/**
	 * Lists the views of the comparison micro chart concerning the position of titles and labels.
	 *
	 * @enum {string}
	 * @public
	 * @since 1.34
	 */
	thisLib.ComparisonMicroChartViewType = {
		/**
		 * Titles and values are displayed above the bars.
		 * @public
		 */
		Normal: "Normal",

		/**
		 * Titles and values are displayed in the same line with the bars.
		 * @public
		 */
		Wide: "Wide",

		/**
		 * Behavior changes based on the current width of the chart.
		 * <code>Normal</code> view is used for charts up to 192px wide, and <code>Wide</code> is used for wider charts.
		 *
		 * @public
		 */
		Responsive: "Responsive"
	};

	/**
	 * Lists the views of the delta micro chart concerning the position of titles.
	 *
	 * @enum {string}
	 * @public
	 * @since 1.61
	 */
	thisLib.DeltaMicroChartViewType = {
		/**
		 * Titles are displayed above the bars.
		 * @public
		 */
		Normal: "Normal",

		/**
		 * Titles are displayed in the same line with the bars.
		 * @public
		 */
		Wide: "Wide",

		/**
		 * Behavior changes based on the current width of the chart.
		 * <code>Normal</code> view is used for charts up to 192px wide, and <code>Wide</code> is used for wider charts.
		 *
		 * @public
		 */
		Responsive: "Responsive"
	};

	/**
	 * Contains available loading states.
	 *
	 * @deprecated Since 1.46
	 */
	thisLib.LoadStateType = {
		/**
		 * LoadableView is loading the control.
		 * @public
		 */
		Loading: "Loading",

		/**
		 * LoadableView has loaded the control.
		 * @public
		 */
		Loaded: "Loaded",

		/**
		 * LoadableView failed to load the control.
		 * @public
		 */
		Failed: "Failed",

		/**
		 * LoadableView disabled to load the control.
		 * @public
		 */
		Disabled: "Disabled"
	};

	thisLib._aStandardMarginClassNames = [
		"sapUiTinyMargin", "sapUiSmallMargin", "sapUiMediumMargin", "sapUiLargeMargin", "sapUiTinyMarginBeginEnd", "sapUiTinyMarginTopBottom", "sapUiSmallMarginBeginEnd",
		"sapUiSmallMarginTopBottom", "sapUiMediumMarginBeginEnd", "sapUiMediumMarginTopBottom", "sapUiLargeMarginBeginEnd", "sapUiLargeMarginTopBottom", "sapUiTinyMarginTop",
		"sapUiTinyMarginBottom", "sapUiTinyMarginBegin", "sapUiTinyMarginEnd", "sapUiSmallMarginTop", "sapUiSmallMarginBottom", "sapUiSmallMarginBegin", "sapUiSmallMarginEnd",
		"sapUiMediumMarginTop", "sapUiMediumMarginBottom", "sapUiMediumMarginBegin", "sapUiMediumMarginEnd", "sapUiLargeMarginTop", "sapUiLargeMarginBottom", "sapUiLargeMarginBegin",
		"sapUiLargeMarginEnd", "sapUiResponsiveMargin", "sapUiNoMargin", "sapUiNoMarginTop", "sapUiNoMarginBottom", "sapUiNoMarginBegin", "sapUiNoMarginEnd"
	];

	/**
	 * Removes all SAP standard margin classes from control.
	 * @param {Object} oChart The outer Chart instance wrapper
	 * @private
	 */
	thisLib._removeStandardMargins = function(oChart) {
		for (var i = 0; i < thisLib._aStandardMarginClassNames.length; i++) {
			if (oChart.hasStyleClass(thisLib._aStandardMarginClassNames[i])) {
				oChart.removeStyleClass(thisLib._aStandardMarginClassNames[i]);
			}
		}
	};

	/**
	 * Passes the parent container context to the child of the chart.
	 * @param {Object} oChart The microchart control instance that may have sapMargins as a custom style.
	 * @param {Object} oChildChart The inner Chart instance which gets the outer Chart instance wrapper instance context
	 * @private
	 */
	thisLib._passParentContextToChild = function(oChart, oChildChart) {
		if (oChart.data("_parentRenderingContext")) {
			oChildChart.data("_parentRenderingContext", oChart.data("_parentRenderingContext"));
		} else if (typeof oChart.getParent === "function") {
			oChildChart.data("_parentRenderingContext", oChart.getParent());
		}
	};

	/**
	 * Tests if tooltip consists of empty characters. In such case the tooltip should be suppressed.
	 * @param {string} tooltip The string to be checked.
	 * @returns {boolean} True if the tooltip consists of only whitespace characters, false otherwise.
	 * @private
	 */
	thisLib._isTooltipSuppressed = function(tooltip) {
		return tooltip !== null && tooltip !== undefined && !tooltip.trim();
	};

	/**
	 * Checks the given control's visibility in a defined interval and calls the given callback function when the control becomes visible.
	 *
	 * @param {sap.ui.core.Control} control The control whose visibility is to be checked
	 * @param {function} callback The callback function to be called when the control becomes visible
	 * @private
	 */
	thisLib._checkControlIsVisible = function(control, callback) {
		function isControlVisible() {
			return control.getVisible() && control.getDomRef() && control.$().is(":visible") && control.getDomRef().getBoundingClientRect().width !== 0;
		}

		/**
		 * Checks the control's visibility in a defined interval
		 */
		function doVisibilityCheck() {
			if (isControlVisible()) {
				IntervalTrigger.removeListener(doVisibilityCheck);
				callback.call(control);
			}
		}

		var fnOriginalExit = control.exit;
		control.exit = function() {
			IntervalTrigger.removeListener(doVisibilityCheck);
			if (fnOriginalExit) {
				fnOriginalExit.call(control);
			}
		};

		if (isControlVisible()) {
			callback.call(control);
		} else {
			IntervalTrigger.addListener(doVisibilityCheck);
		}
	};




	return thisLib;
});
