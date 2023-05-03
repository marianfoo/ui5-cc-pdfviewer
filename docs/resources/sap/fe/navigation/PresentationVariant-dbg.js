/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
        (c) Copyright 2009-2021 SAP SE. All rights reserved
    
 */
sap.ui.define(
	["./NavError", "sap/ui/base/Object", "sap/base/util/extend", "sap/base/util/each", "sap/base/Log"],
	function (NavError, BaseObject, extend, each, Log) {
		"use strict";

		/**
		 * @class
		 * This is the successor of {@link sap.ui.generic.app.navigation.service.PresentationVariant}.<br>
		 * Creates a new instance of a PresentationVariant class. If no parameter is passed,
		 * an new empty instance is created whose ID has been set to <code>""</code>.
		 * Passing a JSON-serialized string complying to the Selection Variant Specification will parse it,
		 * and the newly created instance will contain the same information.
		 * @extends sap.ui.base.Object
		 * @class
		 * @public
		 * @since 1.83.0
		 * @name sap.fe.navigation.PresentationVariant
		 * @param {string|object} [vPresentationVariant] If of type <code>string</code>, the selection variant is JSON-formatted;
		 * if of type <code>object</code>, the object represents a selection variant
		 * @throws An instance of {@link sap.fe.navigation.NavError} in case of input errors. Valid error codes are:
		 * <table>
		 * <tr><th>NavError code</th><th>Description</th></tr>
		 * <tr><td>PresentationVariant.INVALID_INPUT_TYPE</td><td>Indicates that the data format of the selection variant provided is inconsistent</td></tr>
		 * <tr><td>PresentationVariant.UNABLE_TO_PARSE_INPUT</td><td>Indicates that the provided string is not a JSON-formatted string</td></tr>
		 * <tr><td>PresentationVariant.INPUT_DOES_NOT_CONTAIN_SELECTIONVARIANT_ID</td><td>Indicates that the PresentationVariantID cannot be retrieved</td></tr>
		 * <tr><td>PresentationVariant.PARAMETER_WITHOUT_VALUE</td><td>Indicates that there was an attempt to specify a parameter, but without providing any value (not even an empty value)</td></tr>
		 * <tr><td>PresentationVariant.SELECT_OPTION_WITHOUT_PROPERTY_NAME</td><td>Indicates that a selection option has been defined, but the Ranges definition is missing</td></tr>
		 * <tr><td>PresentationVariant.SELECT_OPTION_RANGES_NOT_ARRAY</td><td>Indicates that the Ranges definition is not an array</td></tr>
		 * </table>
		 * These exceptions can only be thrown if the parameter <code>vPresentationVariant</code> has been provided.
		 */
		return BaseObject.extend(
			"sap.fe.navigation.PresentationVariant",
			/** @lends sap.fe.navigation.PresentationVariant.prototype */ {
				constructor: function (vPresentationVariant) {
					this._sId = "";

					if (vPresentationVariant !== undefined) {
						if (typeof vPresentationVariant === "string") {
							this._parseFromString(vPresentationVariant);
						} else if (typeof vPresentationVariant === "object") {
							this._parseFromObject(vPresentationVariant);
						} else {
							throw new NavError("PresentationVariant.INVALID_INPUT_TYPE");
						}
					}
				},

				/**
				 * Returns the identification of the selection variant.
				 *
				 * @returns {string} The identification of the selection variant as made available during construction
				 * @public
				 */
				getID: function () {
					return this._sId;
				},

				/**
				 * Sets the identification of the selection variant.
				 *
				 * @param {string} sId The new identification of the selection variant
				 * @public
				 */
				setID: function (sId) {
					this._sId = sId;
				},

				/**
				 * Sets the text / description of the selection variant.
				 *
				 * @param {string} sNewText The new description to be used
				 * @public
				 * @throws An instance of {@link sap.fe.navigation.NavError} in case of input errors. Valid error codes are:
				 * <table>
				 * <tr><th>NavError code</th><th>Description</th></tr>
				 * <tr><td>PresentationVariant.INVALID_INPUT_TYPE</td><td>Indicates that an input parameter has an invalid type</td></tr>
				 * </table>
				 */
				setText: function (sNewText) {
					if (typeof sNewText !== "string") {
						throw new NavError("PresentationVariant.INVALID_INPUT_TYPE");
					}
					this._sText = sNewText;
				},

				/**
				 * Returns the current text / description of this selection variant.
				 *
				 * @returns {string} The current description of this selection variant.
				 * @public
				 */
				getText: function () {
					return this._sText;
				},

				/**
				 * Sets the context URL.
				 *
				 * @param {string} sURL The URL of the context
				 * @public
				 * @throws An instance of {@link sap.fe.navigation.NavError} in case of input errors. Valid error codes are:
				 * <table>
				 * <tr><th>NavError code</th><th>Description</th></tr>
				 * <tr><td>PresentationVariant.INVALID_INPUT_TYPE</td><td>Indicates that an input parameter has an invalid type</td></tr>
				 * </table>
				 */
				setContextUrl: function (sURL) {
					if (typeof sURL !== "string") {
						throw new NavError("PresentationVariant.INVALID_INPUT_TYPE");
					}
					this._sCtxUrl = sURL;
				},

				/**
				 * Gets the current context URL intended for the query.
				 *
				 * @returns {string} The current context URL for the query
				 * @public
				 */
				getContextUrl: function () {
					return this._sCtxUrl;
				},

				/**
				 * Returns <code>true</code> if the presentation variant does not contain any properties.
				 * nor ranges.
				 *
				 * @returns {boolean} If set to <code>true</code> there are no current properties set; <code>false</code> otherwise.
				 * @public
				 */
				isEmpty: function () {
					return (
						Object.keys(this.getTableVisualization()).length === 0 &&
						Object.keys(this.getChartVisualization()).length === 0 &&
						Object.keys(this.getProperties()).length === 0
					);
				},

				/**
				 * Sets the more trivial properties. Basically all properties with the exception of the Visualization.
				 *
				 * @param {any} mProperties The properties to be used.
				 * @public
				 */
				setProperties: function (mProperties) {
					this._mProperties = extend({}, mProperties);
				},

				/**
				 * Gets the more trivial properties. Basically all properties with the exception of the Visualization.
				 *
				 * @returns {any} The current properties.
				 * @public
				 */
				getProperties: function () {
					return this._mProperties;
				},

				/**
				 * Sets the table visualization property.
				 *
				 * @param {any} mProperties An object containing the properties to be used for the table visualization.
				 * @public
				 */
				setTableVisualization: function (mProperties) {
					this._mVisTable = extend({}, mProperties);
				},

				/**
				 * Gets the table visualization property.
				 *
				 * @returns {any} An object containing the properties to be used for the table visualization.
				 * @public
				 */
				getTableVisualization: function () {
					return this._mVisTable;
				},

				/**
				 * Sets the chart visualization property.
				 *
				 * @param {any} mProperties An object containing the properties to be used for the chart visualization.
				 * @public
				 */
				setChartVisualization: function (mProperties) {
					this._mVisChart = extend({}, mProperties);
				},

				/**
				 * Gets the chart visualization property.
				 *
				 * @returns {any} An object containing the properties to be used for the chart visualization.
				 * @public
				 */
				getChartVisualization: function () {
					return this._mVisChart;
				},

				/**
				 * Returns the external representation of the selection variant as JSON object.
				 *
				 * @returns {object} The external representation of this instance as a JSON object
				 * @public
				 */
				toJSONObject: function () {
					var oExternalPresentationVariant = {
						Version: {
							// Version attributes are not part of the official specification,
							Major: "1", // but could be helpful later for implementing a proper lifecycle/interoperability
							Minor: "0",
							Patch: "0"
						},
						PresentationVariantID: this._sId
					};

					if (this._sCtxUrl) {
						oExternalPresentationVariant.ContextUrl = this._sCtxUrl;
					}

					if (this._sText) {
						oExternalPresentationVariant.Text = this._sText;
					} else {
						oExternalPresentationVariant.Text = "Presentation Variant with ID " + this._sId;
					}

					this._serializeProperties(oExternalPresentationVariant);
					this._serializeVisualizations(oExternalPresentationVariant);

					return oExternalPresentationVariant;
				},

				/**
				 * Serializes this instance into a JSON-formatted string.
				 *
				 * @returns {string} The JSON-formatted representation of this instance in stringified format
				 * @public
				 */
				toJSONString: function () {
					return JSON.stringify(this.toJSONObject());
				},

				_serializeProperties: function (oExternalPresentationVariant) {
					if (!this.getProperties()) {
						return;
					}

					extend(oExternalPresentationVariant, this.getProperties());
				},

				_serializeVisualizations: function (oExternalPresentationVariant) {
					if (this.getTableVisualization()) {
						if (!oExternalPresentationVariant.Visualizations) {
							oExternalPresentationVariant.Visualizations = [];
						}
						oExternalPresentationVariant.Visualizations.push(this.getTableVisualization());
					}

					if (this.getChartVisualization()) {
						if (!oExternalPresentationVariant.Visualizations) {
							oExternalPresentationVariant.Visualizations = [];
						}
						oExternalPresentationVariant.Visualizations.push(this.getChartVisualization());
					}
				},

				_parseFromString: function (sJSONString) {
					if (sJSONString === undefined) {
						throw new NavError("PresentationVariant.UNABLE_TO_PARSE_INPUT");
					}

					if (typeof sJSONString !== "string") {
						throw new NavError("PresentationVariant.INVALID_INPUT_TYPE");
					}

					var oInput = JSON.parse(sJSONString);
					// the input needs to be an JSON string by specification

					this._parseFromObject(oInput);
				},

				_parseFromObject: function (oInput) {
					if (oInput.PresentationVariantID === undefined) {
						// Do not throw an error, but only write a warning into the log.
						// The PresentationVariantID is mandatory according to the specification document version 1.0,
						// but this document is not a universally valid standard.
						// It is said that the "implementation of the SmartFilterBar" may supersede the specification.
						// Thus, also allow an initial PresentationVariantID.
						//		throw new sap.fe.navigation.NavError("PresentationVariant.INPUT_DOES_NOT_CONTAIN_SELECTIONVARIANT_ID");
						Log.warning("PresentationVariantID is not defined");
						oInput.PresentationVariantID = "";
					}

					var oInputCopy = extend({}, oInput);
					delete oInputCopy.Version;

					this.setID(oInput.PresentationVariantID);
					delete oInputCopy.PresentationVariantID;

					if (oInput.ContextUrl !== undefined && oInput.ContextUrl !== "") {
						this.setContextUrl(oInput.ContextUrl);
						delete oInputCopy.ContextUrl;
					}

					if (oInput.Text !== undefined) {
						this.setText(oInput.Text);
						delete oInputCopy.Text;
					}

					if (oInput.Visualizations) {
						this._parseVisualizations(oInput.Visualizations);
						delete oInputCopy.Visualizations;
					}

					this._parseProperties(oInputCopy);
				},

				_parseProperties: function (oInput) {
					var mProperties = {};

					each(oInput, function (sKey, vValue) {
						mProperties[sKey] = vValue;
					});

					this.setProperties(mProperties);
				},

				_parseVisualizations: function (aVisualizations) {
					if (!Array.isArray(aVisualizations)) {
						throw new NavError("PresentationVariant.INVALID_INPUT_TYPE");
					}
					if (typeof aVisualizations.length > 2) {
						throw new NavError("PresentationVariant.TOO_MANY_VISUALIZATIONS");
					}

					for (var i = 0; i < aVisualizations.length; i++) {
						if (aVisualizations[i].Type && aVisualizations[i].Type.indexOf("Chart") >= 0) {
							this.setChartVisualization(aVisualizations[i]);
						} else {
							this.setTableVisualization(aVisualizations[i]);
						}
					}
				}
			}
		);
	}
);
