/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */

sap.ui.define([
	"sap/base/util/merge",
	"sap/base/util/ObjectPath"
], function(
	merge,
	ObjectPath
) {
	"use strict";

	var oStorageResultMerger = {};

	/**
	 * Concatenates all flex objects from a list of flex data request responses, into a passed result array and removes duplicates.
	 *
	 * @param {object[]} aResponses List of responses containing flex object type properties to be concatenated
	 * @param {string} sPath Type of flex object signified by object property
	 * @returns {object[]} Merged array of flex objects
	 * @private
	 * @ui5-restricted sap.ui.fl.Cache, sap.ui.fl.apply._internal.flexState.FlexState
	 */
	function concatFlexObjects(aResponses, sPath) {
		var aFlexObjects = aResponses.reduce(function (aFlexObjects, oResponse) {
			if (ObjectPath.get(sPath, oResponse)) {
				return aFlexObjects.concat(ObjectPath.get(sPath, oResponse));
			}
			return aFlexObjects;
		}, []);

		var aFlexObjectIds = [];
		return aFlexObjects.filter(function (oFlexObject) {
			var sFileName = oFlexObject.fileName;
			var bObjectAlreadyAdded = aFlexObjectIds.indexOf(sFileName) !== -1;
			if (bObjectAlreadyAdded) {
				return false;
			}

			aFlexObjectIds.push(sFileName);
			return true;
		});
	}

	/**
	 * Concatenates all ui2personalization from a list of flex data request responses into a passed result object and removed duplicates.
	 *
	 * @param {object[]} aResponses List of responses containing a changes property to be concatenated
	 * @param {object[]} aResponses.ui2personalization List of the change definitions
	 * @returns {object[]} Merged array of ui2personalization
	 * @private
	 * @ui5-restricted sap.ui.fl.Cache
	 */
	function concatUi2personalization(aResponses) {
		return aResponses.reduce(function (oUi2Section, oResponse) {
			return merge({}, oUi2Section, oResponse.ui2personalization);
		}, {});
	}

	/**
	 * Concatenates all Etag from a list of flex data request responses headers into a passed result string.
	 *
	 * @param {object[]} aResponses List of responses containing Etag header to be concatenated
	 * @param {string} [aResponses.etag] Etag value
	 * @returns {string | null} Concatenated string of all etag values or null if no responses headers carry a etag value
	 * @private
	 * @ui5-restricted sap.ui.fl.Cache
	 */
	function _concatEtag(aResponses) {
		return aResponses.reduce(function (sCacheKey, oResponse) {
			// eslint-disable-next-line no-return-assign
			return oResponse.cacheKey ? sCacheKey += oResponse.cacheKey : sCacheKey;
		}, "") || null;
	}

	/**
	 * Concatenates all allContextsProvided from a list of flex data request responses headers into a passed result string.
	 *
	 * @param {object[]} aResponses List of responses containing allContextsProvided header to be concatenated
	 * @param {string} [aResponses.allContextsProvided] allContextsProvided value
	 * @returns {boolean | undefined} Returns allContextsProvided value if response has allContextsProvided true or false, otherwise returns undefined
	 * @private
	 * @ui5-restricted sap.ui.fl.Cache
	 */
	function isAllContextsProvided(aResponses) {
		for (var i = 0; i < aResponses.length; i++) {
			if (aResponses[i].info) {
				return aResponses[i].info.allContextsProvided;
			}
		}
	}

	/**
	 * Merges the results from all involved connectors.
	 *
	 * @param {object[]} aResponses All responses provided by the different connectors
	 * @returns {object} Merged result
	 *
	 * @private
	 * @ui5-restricted sap.ui.fl.initial._internal.Storage
	 */
	oStorageResultMerger.merge = function(aResponses) {
		var oResult = {
			appDescriptorChanges: concatFlexObjects(aResponses, "appDescriptorChanges"),
			changes: concatFlexObjects(aResponses, "changes"),
			ui2personalization: concatUi2personalization(aResponses),
			comp: {
				variants: concatFlexObjects(aResponses, "comp.variants"),
				changes: concatFlexObjects(aResponses, "comp.changes"),
				defaultVariants: concatFlexObjects(aResponses, "comp.defaultVariants"),
				standardVariants: concatFlexObjects(aResponses, "comp.standardVariants")
			},
			variants: concatFlexObjects(aResponses, "variants"),
			variantChanges: concatFlexObjects(aResponses, "variantChanges"),
			variantDependentControlChanges: concatFlexObjects(aResponses, "variantDependentControlChanges"),
			variantManagementChanges: concatFlexObjects(aResponses, "variantManagementChanges"),
			cacheKey: _concatEtag(aResponses)
		};
		var bAllContextsProvided = isAllContextsProvided(aResponses);
		if (bAllContextsProvided !== undefined) {
			oResult.info = {
				allContextsProvided: bAllContextsProvided
			};
		}
		return oResult;
	};

	return oStorageResultMerger;
});