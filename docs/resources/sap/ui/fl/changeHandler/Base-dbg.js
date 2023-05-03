/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */

sap.ui.define([
	"sap/base/util/LoaderExtensions"
], function(
	LoaderExtensions
) {
	"use strict";

	/**
	 * Base functionality for all change handlers, which provides some reuse methods
	 * @namespace sap.ui.fl.changeHandler.Base
	 * @version 1.108.8
	 * @private
	 * @ui5-restricted change handlers
	 */
	var Base = /** @lends sap.ui.fl.changeHandler.Base */{
		/**
		 * Deprecated. Use setText on the flex object instance instead
		 *
		 * @param {object} oChange - Change object
		 * @param {string} sKey - Text key
		 * @param {string} sText - Text value
		 * @param {string} sType - Translation text type, e.g. XBUT, XTIT, XTOL, XFLD
		 *
		 * @deprecated
		 * @private
		 * @ui5-restricted
		 */
		setTextInChange: function(oChange, sKey, sText, sType) {
			if (!oChange.texts) {
				oChange.texts = {};
			}
			if (!oChange.texts[sKey]) {
				oChange.texts[sKey] = {};
			}
			oChange.texts[sKey].value = sText;
			oChange.texts[sKey].type = sType;
		},

		/**
		 * Instantiates an XML fragment inside a change.
		 * @param {sap.ui.fl.Change} oChange - Change object with instructions to be applied on the control
		 * @param {object} mPropertyBag - Property bag
		 * @param {sap.ui.core.util.reflection.BaseTreeModifier} mPropertyBag.modifier - Modifier for the controls
		 * @param {object} mPropertyBag.appComponent - App component
		 * @param {object} mPropertyBag.view - Root view
		 * @returns {Element[]|sap.ui.core.Element[]} Array with the nodes/instances of the controls of the fragment
		 * @public
		 */
		instantiateFragment: function(oChange, mPropertyBag) {
			var sModuleName = oChange.getModuleName();
			if (!sModuleName) {
				return Promise.reject(new Error("The module name of the fragment is not set. This should happen in the backend"));
			}
			var sViewId = mPropertyBag.viewId ? mPropertyBag.viewId + "--" : "";
			var sProjectId = oChange.getProjectId() || "";
			var sFragmentId = (
				oChange.getExtensionPointInfo
				&& oChange.getExtensionPointInfo()
				&& oChange.getExtensionPointInfo().fragmentId
			) || "";
			var sSeparator = sProjectId && sFragmentId ? "." : "";
			var sIdPrefix = sViewId + sProjectId + sSeparator + sFragmentId;

			var oModifier = mPropertyBag.modifier;
			var oView = mPropertyBag.view;
			return Promise.resolve()
				.then(function () {
					var sFragment = LoaderExtensions.loadResource(sModuleName, {dataType: "text"});
					return oModifier.instantiateFragment(sFragment, sIdPrefix, oView)
						.catch(function (oError) {
							throw new Error("The following XML Fragment could not be instantiated: " + sFragment + " Reason: " + oError.message);
						});
				});
		},

		/**
		 * Creates a return object. Should be called in case the change is not applicable.
		 * @param {string} sNotApplicableCauseMessage - Indicates why the change is not applicable
		 * @param {boolean} bAsync - Determines whether a non-applicable object should be thrown (synchronous), or whether an asynchronous promise reject with the same object should be returned
		 * @returns {Promise} Returns rejected promise with non-applicable message inside
		 */
		markAsNotApplicable: function(sNotApplicableCauseMessage, bAsync) {
			var oReturn = { message: sNotApplicableCauseMessage };
			if (!bAsync) {
				throw oReturn;
			}
			return Promise.reject(oReturn);
		}
	};

	return Base;
}, /* bExport= */true);
