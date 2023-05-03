/*!
 * SAPUI5
 * (c) Copyright 2009-2022 SAP SE. All rights reserved.
 */

sap.ui.define([
	"sap/ui/thirdparty/jquery",
	"./library",
	"sap/m/library",
	"sap/m/FlexBox",
	"sap/ui/core/Control",
	"sap/ui/Device",
	"sap/ui/core/ResizeHandler",
	"sap/ui/events/KeyCodes",
	"sap/suite/ui/microchart/MicroChartUtils",
	"./DeltaMicroChartRenderer"
], function(
	jQuery,
	library,
	MobileLibrary,
	FlexBox,
	Control,
	Device,
	ResizeHandler,
	KeyCodes,
	MicroChartUtils
) {
	"use strict";

	// shortcut for sap.m.ValueColor
	var ValueColor = MobileLibrary.ValueColor;
	var Size = MobileLibrary.Size;
	var DeltaMicroChartViewType = library.DeltaMicroChartViewType;

	/**
	 * Constructor for a new DeltaMicroChart control.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 *
	 * @class
	 * Represents the delta of two values as a chart. This control replaces the deprecated sap.suite.ui.commons.DeltaMicroChart.
	 * <br>Note: You can assign a custom tooltip for this microchart. The custom tooltip can be set using expression binding. When no custom tooltip is defined, the tooltip is generated automatically based on the logic described in {@link sap.ui.core.Element#getTooltip_AsString}. For a combination of a generated and a custom tooltip, use <code>((AltText))</code> inside of the tooltip string.
	 * @extends sap.ui.core.Control
	 *
	 * @author SAP SE
	 * @version 1.108.8
	 * @since 1.34
	 *
	 * @public
	 * @alias sap.suite.ui.microchart.DeltaMicroChart
	 */
	var DeltaMicroChart = Control.extend("sap.suite.ui.microchart.DeltaMicroChart", /** @lends sap.suite.ui.microchart.DeltaMicroChart.prototype */ { metadata: {

		library: "sap.suite.ui.microchart",
		properties: {

			/**
			 * The first value for delta calculation.
			 */
			value1: {type: "float", group: "Misc" },

			/**
			 * The second value for delta calculation.
			 */
			value2: {type: "float", group: "Misc" },

			/**
			 * The first value title.
			 */
			title1: {type: "string", group: "Misc", defaultValue: null},

			/**
			 * The second value title.
			 */
			title2: {type: "string", group: "Misc", defaultValue: null},

			/**
			 * If this property is set, it is rendered instead of value1.
			 */
			displayValue1: {type: "string", group: "Misc", defaultValue: null},

			/**
			 * If this property is set, it is rendered instead of value2.
			 */
			displayValue2: {type: "string", group: "Misc", defaultValue: null},

			/**
			 * If this property is set, it is rendered instead of a calculated delta.
			 */
			deltaDisplayValue: {type: "string", group: "Misc", defaultValue: null},

			/**
			 * The semantic color of the delta value.
			 */
			color: {type: "sap.m.ValueCSSColor", group: "Misc", defaultValue: "Neutral"},

			/**
			 * The view of the chart. If not set, the <code>Normal</code> view is used by default.
			 * @since 1.61.0
			 */
			view: {type: "sap.suite.ui.microchart.DeltaMicroChartViewType", group: "Appearance", defaultValue: "Normal"},

			/**
			 * The width of the chart. Overrides the width specified in the <code>size</code> property.
			 */
			width: {type: "sap.ui.core.CSSSize", group: "Misc"},

			/**
			 * The height of the chart. Overrides the height specified in the <code>size</code> property.
			 */
			height: {group: "Misc", type: "sap.ui.core.CSSSize"},

			/**
			 * The size of the microchart. If not set, the default size is applied based on the size of the device tile.
			 * Responsive size takes width and height of the parent container where the delta micro chart is included.
			 */
			size: {type: "sap.m.Size", group: "Misc", defaultValue: "Auto"},

			/**
			 * If this set to true, width and height of the control are determined by the width and height of the container in which the control is placed. Size and Width properties are ignored in such case.
			 * @since 1.38.0
			 * @deprecated Since 1.61.0
			 */
			isResponsive: {type: "boolean", group: "Appearance", defaultValue: false},

			/**
			 * If this is set to True, the control will be hidden in 'No data' scenario.
			 * @since 1.84
			 */
			hideOnNoData: { type: "boolean", group: "Appearance", defaultValue: false }

		},
		associations: {

			/**
			 * Controls or IDs that label this control. Can be used by screen reader software.
			 * @since 1.60.0
			 */
			ariaLabelledBy: { type: "sap.ui.core.Control", multiple: true, singularName: "ariaLabelledBy" }
		},
		events: {

			/**
			 * The event is triggered when the chart is pressed.
			 */
			press: {}

		}

	}});

	// numbers are in rem units
	DeltaMicroChart.THRESHOLD_LOOK_XS = 1.125;
	DeltaMicroChart.THRESHOLD_LOOK_S = 3.5;
	DeltaMicroChart.THRESHOLD_LOOK_M = 4.5;
	DeltaMicroChart.THRESHOLD_LOOK_L = 5.875;
	DeltaMicroChart.THRESHOLD_WIDTH_NO_LABEL = 6;
	DeltaMicroChart.THRESHOLD_WIDTH_WIDE_MODE = 12;

	DeltaMicroChart.prototype.init = function() {
		this._oRb = sap.ui.getCore().getLibraryResourceBundle("sap.suite.ui.microchart");
		this.setAggregation("tooltip", "((AltText))", true);
		this._bThemeApplied = true;
		if (!sap.ui.getCore().isInitialized()) {
			this._bThemeApplied = false;
			sap.ui.getCore().attachInit(this._handleCoreInitialized.bind(this));
		} else {
			this._handleCoreInitialized();
		}
	};

	DeltaMicroChart.prototype.setSize = function(size) {
		if (this.getSize() !== size) {
			if (size === Size.Responsive) {
				this.setProperty("isResponsive", true, true);
			} else {
				this.setProperty("isResponsive", false, true);
			}
			this.setProperty("size", size, false);
		}
		return this;
	};

	// for backward compatibilty
	DeltaMicroChart.prototype.setIsResponsive = function(bIsResponsive) {
		var sSize,
			sCurrentSize = this.getSize();

		this.setProperty("isResponsive", bIsResponsive);

		if (bIsResponsive) {
			sSize = Size.Responsive;
		} else {
			sSize = sCurrentSize === Size.Responsive ? Size.Auto : sCurrentSize;
		}

		this.setProperty("size", sSize);
		return this;
	};

	/**
	 * Handler for the core's init event. The control will only be rendered if all themes are loaded
	 * and everything is properly initialized. We attach a theme check here.
	 *
	 * @private
	 */
	DeltaMicroChart.prototype._handleCoreInitialized = function() {
		this._bThemeApplied = sap.ui.getCore().isThemeApplied();
		if (!this._bThemeApplied) {
			sap.ui.getCore().attachThemeChanged(this._handleThemeApplied, this);
		}
	};

	/**
	 * The chart will only be rendered if the theme is applied.
	 * If this is the case, the control invalidates itself.
	 *
	 * @private
	 */
	DeltaMicroChart.prototype._handleThemeApplied = function() {
		this._bThemeApplied = true;
		this.invalidate();
		sap.ui.getCore().detachThemeChanged(this._handleThemeApplied, this);
	};

	DeltaMicroChart.prototype._calcChartData = function() {
		var fVal1 = this.getValue1();
		var fVal2 = this.getValue2();

		var fMin = Math.min(fVal1, fVal2, 0);
		var fMax = Math.max(fVal1, fVal2, 0);
		var fTotal = fMax - fMin;

		function calcPercent(fVal) {
			return (fTotal === 0 ?  0 : Math.abs(fVal) / fTotal * 100).toFixed(2);
		}

		var oConf = {};
		var fDelta = fVal1 - fVal2;

		oConf.delta = {
			left: fMax === 0,
			width: calcPercent(fDelta),
			isFirstStripeUp: fVal1 < fVal2,
			isMax: (fVal1 < 0 && fVal2 >= 0) || (fVal1 >= 0 && fVal2 < 0),
			isZero: fVal1 === 0 && fVal2 === 0,
			isEqual: fDelta === 0
		};

		oConf.bar1 = {
			left: fVal2 >= 0,
			width: calcPercent(fVal1),
			isSmaller: Math.abs(fVal1) < Math.abs(fVal2)
		};

		oConf.bar2 = {
			left: fVal1 >= 0,
			width: calcPercent(fVal2),
			isSmaller: Math.abs(fVal2) < Math.abs(fVal1)
		};

		return oConf;
	};

	DeltaMicroChart.prototype._getDeltaValue = function() {
		var fVal1 = this.getValue1(),
			fVal2 = this.getValue2();

		return Math.abs(fVal1 - fVal2).toFixed(Math.max(this._digitsAfterDecimalPoint(fVal1), this._digitsAfterDecimalPoint(fVal2)));
	};

	DeltaMicroChart.prototype._getLocalizedColorMeaning = function(sColor) {
		return ValueColor[sColor] ? this._oRb.getText(("SEMANTIC_COLOR_" + sColor).toUpperCase()) : "";
	};

	DeltaMicroChart.prototype._getAltHeaderText = function(bIsActive) {
		var sAltText = this._oRb.getText("DELTAMICROCHART");

		if (bIsActive) {
			sAltText += " " + this._oRb.getText("IS_ACTIVE");
		}

		sAltText += "\n";

		if (!this._hasData()) {
			sAltText += this._oRb.getText("NO_DATA");
			return sAltText;
		}

		var sDv1 = this.getDisplayValue1();
		var sDv2 = this.getDisplayValue2();
		var sDdv = this.getDeltaDisplayValue();
		var fVal1 = this.getValue1();
		var fVal2 = this.getValue2();
		var sAdv1ToShow = sDv1 ? sDv1 : "" + fVal1;
		var sAdv2ToShow = sDv2 ? sDv2 : "" + fVal2;
		var sAddvToShow = sDdv ? sDdv : "" + Math.abs(fVal1 - fVal2).toFixed(Math.max(this._digitsAfterDecimalPoint(fVal1), this._digitsAfterDecimalPoint(fVal2)));
		var sMeaning = this._getLocalizedColorMeaning(this.getColor());

		sAltText += this.getTitle1() + " " + sAdv1ToShow + "\n" + this.getTitle2() + " " + sAdv2ToShow + "\n" +  this._oRb.getText("DELTAMICROCHART_DELTA_TOOLTIP", [sAddvToShow, sMeaning]);

		return sAltText;
	};

	/**
	 * Returns the translated accessibility control type. It describes the type of the MicroChart control.
	 *
	 * @returns {string} The translated accessibility control type
	 * @private
	 */
	DeltaMicroChart.prototype._getAccessibilityControlType = function() {
		return this._oRb.getText("ACC_CTR_TYPE_DELTAMICROCHART");
	};

	DeltaMicroChart.prototype.onBeforeRendering = function() {
		this._oChartData = this._calcChartData();
		if (this._sResizeHandlerId) {
			ResizeHandler.deregister(this._sResizeHandlerId);
		}
		this.$().off("mouseenter");
		this.$().off("mouseleave");
	};

	DeltaMicroChart.prototype.onAfterRendering = function() {
		library._checkControlIsVisible(this, this._onControlIsVisible);

		//attaches handler for mouse enter event
		this.$().on("mouseenter", this._addTitleAttribute.bind(this));
		this.$().on("mouseleave", this._removeTitleAttribute.bind(this));
	};

	/**
	 * Callback function which is called when the control is visible, which means that the check via
	 * library._checkControlIsVisible was successful.
	 *
	 * @private
	 */
	DeltaMicroChart.prototype._onControlIsVisible = function() {
		if (this._hasData()) {
			this._onResize();
			this._sResizeHandlerId = ResizeHandler.register(this, this._onResize.bind(this));
		}
	};

	DeltaMicroChart.prototype.exit = function() {
		ResizeHandler.deregister(this._sResizeHandlerId);
	};

	/**
	 * Handles the responsiveness.
	 *
	 * @private
	 */
	DeltaMicroChart.prototype._onResize = function() {
		var $Control = this.$(),
			iControlWidth = parseInt($Control.width()),
			iControlHeight = parseInt($Control.height()),
			$RightLabels = $Control.find(".sapSuiteDMCLbls .sapSuiteDMCLabel"),
			sView = this.getView();

		$Control.removeClass("sapSuiteDMCNoLabels sapSuiteDMCNoRightLabels sapSuiteDMCLookM sapSuiteDMCLookS sapSuiteDMCLookXS");

		if (sView === DeltaMicroChartViewType.Responsive) {
			$Control.removeClass("sapSuiteDMCWideMode");
		}

		// hide all labels if chart width is too small
		if (iControlWidth <= this.convertRemToPixels(DeltaMicroChart.THRESHOLD_WIDTH_NO_LABEL) ||
			iControlHeight <= this.convertRemToPixels(DeltaMicroChart.THRESHOLD_LOOK_XS)) {
			$Control.addClass("sapSuiteDMCNoLabels");
		}
		if (sView === DeltaMicroChartViewType.Responsive && iControlWidth > this.convertRemToPixels(DeltaMicroChart.THRESHOLD_WIDTH_WIDE_MODE)) {
			$Control.addClass("sapSuiteDMCWideMode");
		}
		if (iControlHeight < this.convertRemToPixels(DeltaMicroChart.THRESHOLD_LOOK_S)) {
			$Control.addClass("sapSuiteDMCLookXS");
		} else if (iControlHeight < this.convertRemToPixels(DeltaMicroChart.THRESHOLD_LOOK_M)) {
			$Control.addClass("sapSuiteDMCLookS");
		} else if (iControlHeight < this.convertRemToPixels(DeltaMicroChart.THRESHOLD_LOOK_L)) {
			$Control.addClass("sapSuiteDMCLookM");
		}

		if (this._isAnyLabelTruncated($RightLabels)) {
			$Control.addClass("sapSuiteDMCNoRightLabels");
		}
	};

	DeltaMicroChart.prototype.attachEvent = function(sEventId, oData, fnFunction, oListener) {
		Control.prototype.attachEvent.call(this, sEventId, oData, fnFunction, oListener);
		if (this.hasListeners("press")) {
			this.$().attr("tabindex", 0).addClass("sapSuiteUiMicroChartPointer");
		}
		return this;
	};

	DeltaMicroChart.prototype.detachEvent = function(sEventId, fnFunction, oListener) {
		Control.prototype.detachEvent.call(this, sEventId, fnFunction, oListener);
		if (!this.hasListeners("press")) {
			this.$().removeAttr("tabindex").removeClass("sapSuiteUiMicroChartPointer");
		}
		return this;
	};

	DeltaMicroChart.prototype.ontap = function(oEvent) {
		if (Device.browser.msie) {
			this.$().trigger("focus");
		}
		this.firePress();
	};

	DeltaMicroChart.prototype.onkeydown = function(oEvent) {
		if (oEvent.which === KeyCodes.SPACE) {
			oEvent.preventDefault();
		}
	};

	DeltaMicroChart.prototype.onkeyup = function(oEvent) {
		if (oEvent.which === KeyCodes.ENTER || oEvent.which === KeyCodes.SPACE) {
			this.firePress();
			oEvent.preventDefault();
		}
	};

	/**
	 * Adds title attribute to show tooltip when the mouse enters chart.
	 *
	 * @private
	 */
	DeltaMicroChart.prototype._addTitleAttribute = function() {
		if (!this.$().attr("title") && this._hasData()) {
			this.$().attr("title", this.getTooltip_AsString());
		}
	};

	/**
	 * Removes title attribute to let tooltip disappear when the mouse left the chart.
	 *
	 * @private
	 */
	DeltaMicroChart.prototype._removeTitleAttribute = function() {
		if (this.$().attr("title")) {
			this.$().removeAttr("title");
		}
	};

	/**
	 * A simple check to make sure the value is an actually useable number for the chart.
	 *
	 * @private
	 * @param {*} vValue Any value
	 * @returns {boolean} True if the value is a number, false for NaN but also null and Infinity
	 */
	DeltaMicroChart.prototype._isActuallyANumber = function(vValue) {
		return !isNaN(vValue) && vValue !== null && (vValue !== "Infinity" && vValue !== "-Infinity");
	};

	/**
	 * Tests if there is any data for the control to display.
	 *
	 * @returns {boolean} Whether data are present
	 * @private
	 */
	DeltaMicroChart.prototype._hasData = function() {
		return this._isActuallyANumber(this.getValue1()) || this._isActuallyANumber(this.getValue2());
	};

	// to prevent press event in No Data mode
	DeltaMicroChart.prototype.firePress = function() {
		if (this._hasData()) {
			Control.prototype.fireEvent.call(this, "press", arguments);
		}

	};

	MicroChartUtils.extendMicroChart(DeltaMicroChart);

	return DeltaMicroChart;
});
