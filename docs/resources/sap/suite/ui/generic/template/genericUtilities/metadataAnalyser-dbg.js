sap.ui.define([
	"sap/suite/ui/generic/template/genericUtilities/FeError"
], function (FeError) {
	"use strict";

	// -----------------------------------------------------------------|| Class Information ||----------------------------------------------------------------------------------//
	//
	// This file is intended to do all the operations on Metadata of the application.
	// All the logic which extracts property from different entity set or parse Metadata to extract relevant information should be written here.
	//
	//																		||To Be Done||
	//
	// There are many function and code lines in ChangeHandlerUtils.js which perform operations, which are intended to perfrom via this library.
	// In future we must Refactor ChangeHandlerUtils.js and bring common logics here , so that we can centralize the operation of interaction with metadata in our framework.
	// Also, we should enhance this class and make it as a singleton class and it's object should be instantiated when the application intially starts.
	//
	// ------------------------------------------------------------------------------------------------------------------------------------------------------------------------//
	var	sClassName = "genericUtilities.metadataAnalyser";

	function hasPropertyInSideEffect(oSideEffect, sInputPropertyPath) {
		return oSideEffect.SourceProperties.find(function (oSourceProperty) {
			return oSourceProperty.PropertyPath === sInputPropertyPath;
		});
	}
	
	return {
		/**
		 * Retrieve the all the properties of the EntitySet. .
		 * @param: {object} Instance of model which we can be used to derive the metamodel.
		 * @param: {string} Name of the EntitySet.
		 *
		 * @return: {array} Array of properties in the EntitySet
		 */
		getPropertyOfEntitySet: function (oModel, sEntitySet) {
			if (!oModel || !oModel.getMetaModel) {
				throw new FeError(sClassName, "OData Model needs to be passed as an argument");

			}

			var oMetaModel = oModel.getMetaModel();
			var oEntitySet = oMetaModel.getODataEntitySet(sEntitySet);
			var oEntityType = oMetaModel.getODataEntityType(oEntitySet.entityType);
			return oEntityType.property ? Array.from(oEntityType.property) : [];
		},
		/**
		 * Extract properties of parameter EntitySet with other relevant informations.
		 * @param: {object} Instance of model which we can be used to derive the metamodel.
		 * @param: {string} Name of the EntitySet which has Parameter Entityset in association.
		 *
		 * @return: {object} Contains name of Parameter EntitySet, keys of Parameter EntitySet and Name of Navigation property.
		 */
		getParametersByEntitySet: function (oModel, sEntitySet) {
			if (!oModel || !oModel.getMetaModel) {
				throw new FeError(sClassName, "OData Model needs to be passed as an argument");

			}

			var oMetaModel = oModel.getMetaModel();
			var oResult = {
				entitySetName: null,
				parameters: [],
				navPropertyName: null
			};

			var oEntitySet = oMetaModel.getODataEntitySet(sEntitySet);
			var oEntityType = oMetaModel.getODataEntityType(oEntitySet.entityType);
			var aNavigationProperties = oEntityType.navigationProperty;

			if (!aNavigationProperties) {
				return oResult;
			}
			// filter the parameter entityset for extracting it's key and it's entityset name
			aNavigationProperties.filter(function (oNavProperty) {
				var oNavigationEntitySet = oMetaModel.getODataAssociationEnd(oEntityType, oNavProperty.name);
				var oNavigationEntityType = oMetaModel.getODataEntityType(oNavigationEntitySet.type);
				if (oNavigationEntityType && oNavigationEntityType["sap:semantics"] === "parameters" && oNavigationEntityType.key) {
					oResult.entitySetName = oMetaModel.getODataAssociationSetEnd(oEntityType, oNavProperty.name).entitySet;
					for (var i = 0; i < oNavigationEntityType.key.propertyRef.length; i++) {
						oResult.parameters.push(oNavigationEntityType.key.propertyRef[i].name);
					}
					var aSubNavigationProperties = oNavigationEntityType.navigationProperty;
					// Parameter entityset must have association back to main entityset.
					var bBackAssociationPresent = aSubNavigationProperties.some(function (oSubNavigationProperty) {
						var sSubNavigationEntityType = oMetaModel.getODataAssociationEnd(oNavigationEntityType, oSubNavigationProperty.name).type;
						sSubNavigationEntityType === oEntitySet.entityType ? oResult.navPropertyName = oSubNavigationProperty.name : Function.prototype();
						return oResult.navPropertyName;
					});

					return bBackAssociationPresent && oResult.navPropertyName && oResult.entitySetName;
				}
				return false;
			});
			return oResult;
		},
		/**
		* Check for Content-ID referencing across changeSet is supported or not
		*
		* @return Bool
		*/
		isContentIdReferencingAllowed: function(oModel) {
			var oMetaModel = oModel.getMetaModel();
			var oEntityContainer = oMetaModel.getODataEntityContainer();
			var oBatchSupport = oEntityContainer["Org.OData.Capabilities.V1.BatchSupport"];
			if (oBatchSupport && oBatchSupport.ReferencesAcrossChangeSetsSupported && oBatchSupport.ReferencesAcrossChangeSetsSupported.Bool) {
				return oBatchSupport.ReferencesAcrossChangeSetsSupported.Bool === "true";
			}
			return false;
		},

		/**
		 * This method returns navigation details of given navigation property from given entitySet
		 * @param:  {object} oMetaModel -  Meta Model
		 * @param:  {string} sEntitySet -  Entity set name
		 * @param:  {string} sNavigationProperty - Navigation property name
		 * @return: {object} navigation details represented by sNavigationProperty
		 */
		getNavigationPropertyRelationship: function(oMetaModel, sEntitySet, sNavigationProperty) {
			var	oEntityType = oMetaModel.getODataEntityType(oMetaModel.getODataEntitySet(sEntitySet).entityType);
			return oEntityType.navigationProperty.find(function(oNavProp) {
				return oNavProp.name === sNavigationProperty;
			}); 
		},

		/**
		 * To get the field's side effect type i.e., whether the field is used a single source property or used in combination with
		 * other field(s)
		 * @param {string} sInputPropertyPath 
		 * @param {object} oMetaModel 
		 * @param {string} sEntityType 
		 * @returns either of the following
		 * - SingleAndMultipleSource: represents the field is used as a single source property in one side effect and also used in 
		 * 			combination with other field(s) in other side effect(s) annotation.
		 * - OnlySingleSource: represents the field is being used only a single source property in the corresponding side effect.
		 * - "" (empty string): for all other irrelevant scenarios.
		 */
		getFieldSourcePropertiesType: function (sInputPropertyPath, oMetaModel, sEntityType) {
			var oEntityType = oMetaModel.getODataEntityType(sEntityType);
			var oSideEffect, bSingleSourcePropertyExists = false, bMultipleSourcePropertiesExist = false;
			for (var sEntityAttributeKey in oEntityType) {
				if (sEntityAttributeKey.startsWith("com.sap.vocabularies.Common.v1.SideEffects")) {
					oSideEffect = oEntityType[sEntityAttributeKey];
					if (oSideEffect.SourceProperties) {
						if (!bSingleSourcePropertyExists && oSideEffect.SourceProperties.length === 1) {
							bSingleSourcePropertyExists = oSideEffect.SourceProperties[0].PropertyPath === sInputPropertyPath;
						} else if (!bMultipleSourcePropertiesExist && oSideEffect.SourceProperties.length > 1) {
							bMultipleSourcePropertiesExist = !!hasPropertyInSideEffect(oSideEffect, sInputPropertyPath);
						}
					}
				}
			}

			if (bSingleSourcePropertyExists) {
				return bMultipleSourcePropertiesExist ? "SingleAndMultipleSource" : "OnlySingleSource";
			}
			return "";
		},

		/**
		 * check for parameterised analytical entity set
		 * @param: {object} Instance of model which we can be used to derive the metamodel.
		 * @param: {string} Name of the EntitySet which has Parameter Entityset in association.
		 *
		 * @return: whether the entity set is parameterised or not.
		 */
		 checkAnalyticalParameterisedEntitySet: function(oModel, sEntitySet) {
			if (!oModel || !oModel.getMetaModel) {
				throw new Error("OData Model needs to be passed as an argument");
			}
			var oMetaModel = oModel.getMetaModel();
			var oEntitySet = oMetaModel.getODataEntitySet(sEntitySet);
			if (oEntitySet && oEntitySet.entityType) {
				var oEntityType = oMetaModel.getODataEntityType(oEntitySet.entityType);
				if (oEntityType['sap:semantics'] && oEntityType['sap:semantics'] === 'aggregate') {
					return true;
				}
			}
			return false;
		},

		hasPropertyInSideEffect: hasPropertyInSideEffect
	};

});
