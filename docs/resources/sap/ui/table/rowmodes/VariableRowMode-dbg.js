/*
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define([
	"../library",
	"./RowMode"
], function(
	library,
	RowMode
) {
	"use strict";

	/**
	 * Constructor for a new auto variable mode.
	 *
	 * @param {string} [sId] id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new control
	 *
	 * @class
	 * // TODO: Class description
	 * @extends sap.ui.table.rowmodes.RowMode
	 *
	 * @author SAP SE
	 * @version 1.108.8
	 *
	 * @constructor
	 * @private
	 * @experimental
	 * @alias sap.ui.table.rowmodes.VariableRowMode
	 */
	var VariableRowMode = RowMode.extend("sap.ui.table.rowmodes.VariableRowMode", {
		metadata: {
			library: "sap.ui.table",
			properties: {
				tableHeight: {type: "sap.ui.core.CSSSize", defaultValue: "100%", group: "Dimension"}
			}
		},
		constructor: function(sId) {
			Object.defineProperty(this, "bLegacy", {
				value: typeof sId === "boolean" ? sId : false
			});

			if (this.bLegacy) {
				RowMode.call(this);
			} else {
				RowMode.apply(this, arguments);
			}
		}
	});

	/**
	 * @inheritDoc
	 */
	VariableRowMode.prototype.getComputedRowCounts = function() {
		var iTotalRowCount = this.getTotalRowCountOfTable();
		var iRowCount = this.getHideEmptyRows() ? Math.min(this.getRowCount(), iTotalRowCount) : this.getRowCount();

		return {
			count: iRowCount,
			fixedTopCount: this.getFixedTopRowCount(),
			fixedBottomCount: this.getFixedBottomRowCount()
		};
	};

	/**
	 * @inheritDoc
	 */
	VariableRowMode.prototype.getComputedRowCounts = function() {
		var iTotalRowCount = this.getTotalRowCountOfTable();
		var iRowCount = this.getHideEmptyRows() ? Math.min(this.getRowCount(), iTotalRowCount) : this.getRowCount();

		return {
			count: iRowCount,
			fixedTopCount: this.getFixedTopRowCount(),
			fixedBottomCount: this.getFixedBottomRowCount()
		};
	};

	/**
	 * @inheritDoc
	 */
	VariableRowMode.prototype.getTableHeight = function() {
		return {
			height: this.getTableHeight()
		};
	};

	/**
	 * @inheritDoc
	 */
	VariableRowMode.prototype.getRowContainerHeight = function() {
		return {
			height: this.getComputedRowCounts().count * this.getBaseRowHeightOfTable()
		};
	};

	return VariableRowMode;
});