/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */

sap.ui.define([
	"sap/m/GroupHeaderListItem",
	"sap/ui/thirdparty/jquery"
], function(
	GroupHeaderListItem,
	jQuery
) {
	"use strict";

	/**
	 * Provides data utility functions for the Content Browser.
	 *
	 * @constructor
	 * @alias sap.ui.fl.support.apps.contentbrowser.utils.DataUtils
	 * @author SAP SE
	 * @version 1.108.8
	 * @experimental Since 1.45
	 */
	var DataUtils = {
		aExcludeList: [{
			category: "NS",
			name: "LREP_HOME_CONTENT",
			ns: "UIF/"
		}, {
			category: "NS",
			name: "virtual~",
			ns: "/"
		}],

		/**
		 * Pretty printer for specific file types.
		 *
		 * @param {Object} oData - Data to be formatted
		 * @param {string} sFileType - File type of data
		 * @returns {Object} Data after formatting
		 * @public
		 */
		formatData: function (oData, sFileType) {
			// code extension and properties files do not need formation
			if ((sFileType === "js") || (sFileType === "properties")) {
				return oData;
			}
			// other files should be formatted to JSON
			try {
				oData = JSON.parse(oData);
				return JSON.stringify(oData, null, '\t');
			} catch (oError) {
				var ErrorUtils = sap.ui.require("sap/ui/fl/support/apps/contentbrowser/utils/ErrorUtils");
				ErrorUtils.displayError("Error", oError.name, oError.message);
				return oData;
			}
		},

		/**
		 * Factory for creating list group header objects for the metadata list.
		 * @param {Object} oGroup - Group data passed from the lists model binding
		 * @returns {sap.m.GroupHeaderListItem} New GroupHeaderListItem
		 * @public
		 */
		getGroupHeader: function (oGroup) {
			var sTitle = "{i18n>systemData}";

			if (oGroup.key === "custom") {
				sTitle = "{i18n>externalReferences}";
			}

			return new GroupHeaderListItem({
				title: sTitle,
				upperCase: false
			});
		},

		/**
		 * Verifies if item content is not in the exclude list.
		 * @param {Object} oContentItem - Content item needs to be verified
		 * @returns {boolean} <code>true</code> if the item is not excluded
		 * @public
		 */
		isNotExcluded: function (oContentItem) {
			var bNotExcluded = true;
			jQuery.each(this.aExcludeList, function (index, mExcludeListElement) {
				var bAllPropertiesMatched = true;

				jQuery.each(mExcludeListElement, function (sProperty, sValue) {
					bAllPropertiesMatched = bAllPropertiesMatched && oContentItem[sProperty] === sValue;
				});

				if (bAllPropertiesMatched) {
					bNotExcluded = false;
					return false; // break each
				}
			});
			return bNotExcluded;
		},

		/**
		 * Removes leading and trailing slashes from a string.
		 * @param {string} sNamespace - Input string
		 * @returns {string} String after removing leading and trailing slashes
		 * @public
		 */
		cleanLeadingAndTrailingSlashes: function (sNamespace) {
			if (!sNamespace) {
				return "";
			}
			if (sNamespace[0] === "/") {
				var sNamespaceWithoutLeadingSlash = sNamespace.substring(1, sNamespace.length);
				return this.cleanLeadingAndTrailingSlashes(sNamespaceWithoutLeadingSlash);
			}
			if (sNamespace[sNamespace.length - 1] === "/") {
				var sNamespaceWithoutTrailingSlash = sNamespace.substring(0, sNamespace.length - 1);
				return this.cleanLeadingAndTrailingSlashes(sNamespaceWithoutTrailingSlash);
			}
			return sNamespace;
		},

		/**
		 * Title formatter: combines the items namespace, filename and type.
		 * @param {object} mModelData - Object with model data
		 * @param {string} mModelData.namespace - Namespace
		 * @param {string} mModelData.fileName - Filename
		 * @param {string} mModelData.fileType - Filetype
		 * @returns {string} Item title after formatting
		 * @public
		 */
		formatItemTitle: function (mModelData) {
			return mModelData.namespace + mModelData.fileName + "." + mModelData.fileType;
		},

		/**
		 * Helper function to determine if a file ends with a specified suffix.
		 *
		 * @param {string} sString - String that has to be checked
		 * @param {string} sSuffix - Suffix
		 * @returns {boolean} <code>true</code> if the passed suffix is the last part of the passed string
		 * @public
		 */
		endsStringWith: function (sString, sSuffix) {
			return sString.indexOf(sSuffix, sString.length - sSuffix.length) !== -1;
		}
	};

	return DataUtils;
}, true);