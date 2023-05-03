/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
], function () {
	"use strict";

	// -----------------------------------------------------------------|| Class Information ||----------------------------------------------------------------------------------//
	//
	// This file is intended to do all the operations on Metadata of the application.
	// All the logic which extracts property from different entity set or parse Metadata to extract relevant information should be written here.
	//
	// ------------------------------------------------------------------------------------------------------------------------------------------------------------------------//

	return {

		/**
		 * @param {sap.ui.model.odata.v2.ODataModel} oModel oModel
		 * @param {Object} sEntitySet sEntitySet
		 * @returns {Array} Return An Array
		 */
		getPropertyNamesOfEntitySet: function (oModel, sEntitySet) {
			if (!oModel || !oModel.getMetaModel) {
				return [];
			}

			var oMetaModel = oModel.getMetaModel();
			var oEntitySet = oMetaModel.getODataEntitySet(sEntitySet);
			var aPropertyNames = [];
			if (oEntitySet) {
				var oEntityType = oMetaModel.getODataEntityType(oEntitySet.entityType);
				oEntityType.property.forEach(function (oProperty) {
					aPropertyNames.push(oProperty.name);
				});
			}
			return aPropertyNames;
		},

		/**
		 * @param {sap.ui.model.odata.v2.ODataModel} oModel oModel
		 * @param {Object} sEntitySet sEntitySet
		 */
		getParameterisedEntitySetByEntitySet: function (oModel, sEntitySet) {
			if (!oModel || !oModel.getMetaModel) {
				return;
			}

			var oMetaModel = oModel.getMetaModel();

			var oEntitySet = oMetaModel.getODataEntitySet(sEntitySet);
			if (oEntitySet) {
				var oEntityType = oMetaModel.getODataEntityType(oEntitySet.entityType);
				var aNavigationProperties = oEntityType.navigationProperty;

				if (!aNavigationProperties) {
					return;
				}

				// filter the parameter entityset for extracting it's key and it's entityset name
				var aParameterisedNavigation = aNavigationProperties.filter(function (oNavProperty) {
					var oNavigationEntitySet = oMetaModel.getODataAssociationEnd(oEntityType, oNavProperty.name);
					var oNavigationEntityType = oMetaModel.getODataEntityType(oNavigationEntitySet.type);
					return oNavigationEntityType["sap:semantics"] === "parameters" && oNavigationEntityType.key;
				});

				if (aParameterisedNavigation && aParameterisedNavigation.length) {
					return oMetaModel.getODataAssociationSetEnd(oEntityType, aParameterisedNavigation[0].name).entitySet;
				}
			}
			return;
		},

		/**
		 * @param {sap.ui.model.odata.v2.ODataModel} oModel oModel
		 * @param {Object} sEntitySet sEntitySet
		 * @param {string} sProperty sProperty
		 * @returns {Boolean} Return Boolean
		 */
		getPropertyFilterRestrictionByEntitySet: function (oModel, sEntitySet, sProperty) {
			if (!oModel || !oModel.getMetaModel) {
				return false;
			}
			var oMetaModel = oModel.getMetaModel();
			var oEntitySet = oMetaModel.getODataEntitySet(sEntitySet);
			if (oEntitySet) {
				var oEntityType = oMetaModel.getODataEntityType(oEntitySet.entityType);
				var oPropertyDetails;
				oPropertyDetails = oEntityType.property.find(function (oProperty) {
					return oProperty.name === sProperty;
				});
				if (oPropertyDetails && oPropertyDetails["sap:filter-restriction"] && oPropertyDetails["sap:filter-restriction"] === "single-value") {
					return true;
				}
			}
			return false;
		},

		/**
		 * @param {sap.ui.model.odata.v2.ODataModel} oModel oModel
		 * @param {Object} sEntitySet sEntitySet
		 * @param {string} sProperty sProperty
		 * @returns {Boolean} Return Boolean
		 */
		isDate: function (oModel, sEntitySet, sProperty) {
			if (!oModel || !oModel.getMetaModel) {
				return false;
			}
			var oMetaModel = oModel.getMetaModel(),
				oEntitySet = oMetaModel.getODataEntitySet(sEntitySet);

			if (!oEntitySet) {
				return false;
			}
			var oEntityType = oMetaModel.getODataEntityType(oEntitySet.entityType),
				oProperty = oEntityType.property.find(function (oProp) {
					return oProp.name === sProperty;
				});
			return oProperty && oProperty.type === "Edm.DateTime";
		},

		/**
		 * @param {sap.ui.model.odata.v2.ODataModel} oModel oModel
		 * @param {Object} sEntitySet sEntitySet
		 * @param {string} sProperty sProperty
		 * @returns {Boolean} Return Boolean
		 */
		isValueListWithFixedValues: function (oModel, sEntitySet, sProperty) {
			if (!oModel || !oModel.getMetaModel) {
				return false;
			}
			var oMetaModel = oModel.getMetaModel(),
				oEntitySet = oMetaModel.getODataEntitySet(sEntitySet),
				bFixedValueListFirstCheck,
				bFixedValueListSecondCheck;
			if (oEntitySet) {
				var oEntityType = oMetaModel.getODataEntityType(oEntitySet.entityType),
					oProperty = oEntityType.property.find(function (oProp) {
						return oProp.name === sProperty;
					}),
					sValueListTerm = "com.sap.vocabularies.Common.v1.ValueList",
					sFixedValueListTerm = "com.sap.vocabularies.Common.v1.ValueListWithFixedValues",
					oValueListTerm = oProperty && oProperty[sValueListTerm],
					oFixedValueListTerm = oProperty && oProperty[sFixedValueListTerm],
					sValueListAnnotation = oProperty && oProperty["sap:value-list"];

				bFixedValueListFirstCheck = oValueListTerm && (sValueListAnnotation === "fixed-values");
				bFixedValueListSecondCheck = !!oFixedValueListTerm && oFixedValueListTerm.Bool === "true";
			}
			return bFixedValueListFirstCheck || bFixedValueListSecondCheck || false;
		}
	};

});
