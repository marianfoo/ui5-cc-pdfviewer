sap.ui.define([
	"./HistoryItem",
	"sap/base/assert"
], function(HistoryItem, assert) {
	"use strict";

	/**
	 * Constructor for a new CropRectangleHistoryItem.
	 *
	 * @param {object} mProperties Property bag
	 * @param {int} mProperties.x X value
	 * @param {int} mProperties.y Y value
	 * @param {int} mProperties.width Width of the rectangle
	 * @param {int} mProperties.height Height of the rectangle
	 * @param {int} mProperties.oldWidth Previous width of the rectangle
	 * @param {int} mProperties.oldHeight Previous height of the rectangle
	 *
	 * @class Holds information about an {@link sap.suite.ui.commons.imageeditor.ImageEditor} action history item
	 * that was created by the {@link sap.suite.ui.commons.imageeditor.ImageEditor#rectangleCrop} method.
	 *
	 * @extends sap.suite.ui.commons.imageeditor.HistoryItem
	 *
	 * @author SAP SE
	 * @version 1.108.4
	 * @since 1.66.0
	 *
	 * @constructor
	 * @public
	 *
	 * @alias sap.suite.ui.commons.imageeditor.CropRectangleHistoryItem
	 */
	var CropRectangleHistoryItem = HistoryItem.extend("sap.suite.ui.commons.imageeditor.CropRectangleHistoryItem", {
		constructor: function(mProperties) {
			HistoryItem.apply(this, arguments);

			mProperties = mProperties || {};

			assert(typeof mProperties.x === "number", "X must be a number.");
			assert(typeof mProperties.y === "number", "Y must be a number.");
			assert(typeof mProperties.width === "number", "Width must be a number.");
			assert(typeof mProperties.height === "number", "Height value must be a number.");
			assert(typeof mProperties.oldWidth === "number", "Old width value must be a number.");
			assert(typeof mProperties.oldHeight === "number", "Old height value must be a number.");


			this._iX = mProperties.x;
			this._iY = mProperties.y;
			this._iWidth = mProperties.width;
			this._iHeight = mProperties.height;
			this._iOldWidth = mProperties.oldWidth;
			this._iOldHeight = mProperties.oldHeight;
		}
	});

	CropRectangleHistoryItem.prototype.getX = function() {
		return this._iX;
	};

	CropRectangleHistoryItem.prototype.getY = function() {
		return this._iY;
	};

	CropRectangleHistoryItem.prototype.getWidth = function() {
		return this._iWidth;
	};

	CropRectangleHistoryItem.prototype.getHeight = function() {
		return this._iHeight;
	};

	CropRectangleHistoryItem.prototype.getOldWidth = function() {
		return this._iOldWidth;
	};

	CropRectangleHistoryItem.prototype.getOldHeight = function() {
		return this._iOldHeight;
	};

	CropRectangleHistoryItem.prototype.compare = function(oHistoryItem) {
		var aMethods = ["getWidth", "getHeight"];

		return this._compare(oHistoryItem, aMethods);
	};

	return CropRectangleHistoryItem;
});
