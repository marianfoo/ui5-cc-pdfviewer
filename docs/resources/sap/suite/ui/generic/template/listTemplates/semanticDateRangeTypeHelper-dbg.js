/**
 * This helper class contains some methods used during the time of component creation (before the actual view is created)
 * and some methods used at runtime.
 * This is only so that all methods pertaining to the support of dateSettings be in one place.
 */
sap.ui.define(["sap/suite/ui/generic/template/genericUtilities/FeError", "sap/base/util/deepExtend", "sap/base/util/extend", "sap/base/util/isEmptyObject","sap/m/DynamicDateUtil","sap/suite/ui/generic/template/genericUtilities/metadataAnalyser"], function (FeError, deepExtend, extend, isEmptyObject,DynamicDateUtil,metadataAnalyser) {
	"use strict";
	var	sClassName = "listTemplates.semanticDateRangeTypeHelper";
	/**
	 * This function returns the metadata for dateSettings defined inside filterSettings in Manifest
	 * @returns {object} dateSettings metadata
	 */
	function getDateSettingsMetadata() {
		// Some property definitions are actually inherited from SFB/controlConfiguration. Ideally, we would just point to them, but unfortunately, exhaustive description from SFB seems to be missing, only some examples in API reference are provided.
		// Therefore, properties are described here according to current knowledge
		var oFieldProperties = {
				useDateRange: {
					type: "boolean",
					defaultValue: false
				},
				selectedValues: { // Should be described by SFB. Apparently comma separated list of possible (semantic) values, examples from SFB show only single value. Apparently, SFB translates a filter 'contains "a,b"' to 'contains "a" or contains "b"'.
					type: "string",
					defaultValue: ""
				},
				exclude: { // Should be described by SFB.
					type: "boolean",
					defaultValue: true
				},
				customDateRangeImplementation: { // Should be described by SFB.
					type: "string",
					defaultValue: ""
				},
				defaultValue: { // Should be described by SFB.
					type: "object",
					properties: {
						operation: {
							type: "string"
						}
					}
				},
				filter: { // Should be described by SFB.
					type: "array",
					arrayEntries: {
						type: "object",
						properties: {
							path: {
								type: "string"
							},
							equals: {
								type: "string"
							},
							contains: {
								type: "string"
							},
							exclude: {
								type: "boolean",
								defaultValue: false
							}
						}
					}
				}
		};
		// all properties defined on field level can also be defined on generic level (used as default for fields not explicitly mentioned)
		var oGenericProperties = extend({
			fields: { // Map - keys are property names (of EntitySet used for SFB)
				type: "object",
				mapEntryProperties: oFieldProperties
			}
		}, oFieldProperties);
		return {
			type: "object",
			properties: oGenericProperties
		};
	}

	/**
	 * METHODS USED FOR SETTING TEMPLATE SPECIFIC PARAMETERS WHILE COMPONENT IS CREATED STARTS HERE
	 */

	/**
	 * This function checks if a give property is eligible to be treated as a semantic date range.
	 * @param {object} oProperty indicates whether the property should be part of filter bar or not
	 * @param {object} oDateSettings dateSettings from manifest
	 * @param {array} aFilterExpressionRestrictionsProperties an array of all the fileds defined in the FilterExpressionRestrictions annotation with SingleRange as the AllowedExpressions
	 * @return {boolean} Indicates if a given property is eligible to be treated as a semantic date range
	 */
	function isDateRange(oProperty, oDateSettings, aFilterExpressionRestrictionsProperties) {
		var isDateField = (oProperty.type === "Edm.DateTime" && oProperty["sap:display-format"] === "Date") || oProperty.type === "Edm.DateTimeOffset";
		var isCalenderDateField = oProperty.type === "Edm.String" && oProperty["com.sap.vocabularies.Common.v1.IsCalendarDate"] && oProperty["com.sap.vocabularies.Common.v1.IsCalendarDate"].Bool === "true";
		if (isDateField || isCalenderDateField) {
			if (oProperty.isParam){// parameter fields are single values fields and do not require addtional validation
				return true;
			}
			// Single value fields are supported only for DateTime field
			// Single value fields are not supported for DateTimeOffset field in List Report and AnalyticalListPage
			if (oProperty["sap:filter-restriction"] === "interval" || aFilterExpressionRestrictionsProperties.includes(oProperty.name) || 
				(oProperty["sap:filter-restriction"] === "single-value" && !(oProperty.type === "Edm.DateTimeOffset"))) {
				return true;
			}
		}
		return false;
	}
	/**
	 * This function returns the condition types for date properties
	 * @param {object} oDateRangeTypeConfiguration The manifest configuration for each date property
	 * @return {string} Group ID value
	 */
	function constructConditionTypeForDateProperties(oDateRangeTypeConfiguration) {
		var sConditionType;

		if (oDateRangeTypeConfiguration.customDateRangeImplementation) {
			sConditionType = oDateRangeTypeConfiguration.customDateRangeImplementation;
		} else if (oDateRangeTypeConfiguration.filter) {
			sConditionType = JSON.stringify({
				module: "sap.ui.comp.config.condition.DateRangeType",
				operations: {
					filter: oDateRangeTypeConfiguration.filter
				}
			});
		} else if (oDateRangeTypeConfiguration.selectedValues) {
			var oFilter = {
				path: "key",
				contains : oDateRangeTypeConfiguration.selectedValues,
				exclude: oDateRangeTypeConfiguration.exclude === undefined || oDateRangeTypeConfiguration.exclude
			};
			sConditionType = JSON.stringify({
				module: "sap.ui.comp.config.condition.DateRangeType",
				operations: {
					filter: [oFilter]
				}
			});
		} else if (oDateRangeTypeConfiguration.defaultValue) {
			sConditionType = JSON.stringify({
				module: "sap.ui.comp.config.condition.DateRangeType"
			});
		} else {
			throw new FeError(sClassName, "Wrong Date Range configuration set in manifest");
		}
		return sConditionType;
	}

	/**
	 * This function checks if a give property should be treated as a semantic date range.
	 * While isDateRange only checks from metadat/annotation perspective, here also manifest settings are checked
	 * @param {object} oDateSettings dateSettings from manifest
	 * @param {object} oProperty property to be checked
	 * @param {array} aRelevantFilterExpressionRestrictionsProperties an array of all the fileds defined in the FilterExpressionRestrictions annotation with SingleRange as the AllowedExpressions
	 * @return {boolean} property should be treated as a semantic date range
	 */
	function isSemanticDateRange(oDateSettings, aRelevantFilterExpressionRestrictionsProperties, oProperty){
		// Copy relevant settings to be able to delete fields. If other fields are defined, but not the given one, and no default settings are provided, the given field must not be treated as semantic date range
		var oRelevantSettings = extend({}, oDateSettings.fields && oDateSettings.fields[oProperty.name] || oDateSettings);
		delete oRelevantSettings.fields;
		delete oRelevantSettings.useDateRange;
		// if none of the relevant properties is provided, but some unknown property, we would treat the field as semantic date range here, but constructConditionTypeForDateProperties would fail
		return isDateRange(oProperty, oDateSettings, aRelevantFilterExpressionRestrictionsProperties) && !isEmptyObject(oRelevantSettings);
	}

	function getParameterDateFields(oModel,oEntitySet) {
		var oParameterInfo = metadataAnalyser.getParametersByEntitySet(oModel, oEntitySet.name);
		var aParameters;
		if (oParameterInfo.entitySetName){
			aParameters = metadataAnalyser.getPropertyOfEntitySet(oModel, oParameterInfo.entitySetName);
			if (!aParameters){
				return [];
			}
		} else {
			return [];
		}
		var aParameterDateFields = [];
		aParameters.forEach(function(param) {
			param.isParam = true;
			if (isDateRange(param)){
				aParameterDateFields.push(param);
			}
		});
		return aParameterDateFields;
	}

	function getSettingsForDateProperties(oPageSettings, oLeadingEntityType, oLeadingEntitySet, oModel) {
		if (!oPageSettings.filterSettings || !oPageSettings.filterSettings.dateSettings) {
			return;
		} else if (oPageSettings.filterSettings.dateSettings.useDateRange && oPageSettings.filterSettings.dateSettings.fields) {
			/* 	handled the case where useDateRange is true and dateSettings are present. In this scenario we disable useDateRange
				and apply dateSettings for the fields defined in the manifest and for rest of the properties we apply all option keys of dynamic Date picker  */
			oPageSettings.filterSettings.dateSettings.useDateRange = false;
			var aDateProperties = oLeadingEntityType.property.filter(isDateRange, oPageSettings.filterSettings.dateSettings, []);
			var oDatePropertiesSettings = oPageSettings.filterSettings.dateSettings.fields;
			aDateProperties.forEach(function (oDateProperty) {
				if (!oDatePropertiesSettings.hasOwnProperty(oDateProperty["name"]) || !oDatePropertiesSettings[oDateProperty["name"]]) {
					var sPath = oDateProperty["name"];
					oDatePropertiesSettings[sPath] = { "selectedValues": DynamicDateUtil.getAllOptionKeys().toString(), "exclude": false };
				}
			});
			return oDatePropertiesSettings;
		}
	}

	function getDateRangeFieldSettings(oPageSettings, oLeadingEntityType, oLeadingEntitySet, oModel){
		if (!oPageSettings.filterSettings || !oPageSettings.filterSettings.dateSettings) {
			return [];
		}
		var aParameterDateFields = [];
		if (oModel && oLeadingEntitySet) {
			aParameterDateFields = getParameterDateFields(oModel,oLeadingEntitySet);
		}
		if (oPageSettings.filterSettings.dateSettings.useDateRange && oPageSettings.filterSettings.dateSettings.fields) {
			/* 	handled the case where useDateRange is true and dateSettings are present. In this scenario we disable useDateRange
				and apply dateSettings for the fields defined in the manifest and for rest of the properties we apply all option keys of dynamic Date picker  */
			oPageSettings.filterSettings.dateSettings.useDateRange = false;
			var aDateProperties = oLeadingEntityType.property.filter(isDateRange, oPageSettings.filterSettings.dateSettings, []);
			var oDatePropertiesSettings = oPageSettings.filterSettings.dateSettings.fields;
			aDateProperties.forEach(function (oDateProperty) {
				if (!oDatePropertiesSettings.hasOwnProperty(oDateProperty["name"]) || !oDatePropertiesSettings[oDateProperty["name"]]) {
					var sPath = oDateProperty["name"];
					oDatePropertiesSettings[sPath] = { "selectedValues": DynamicDateUtil.getAllOptionKeys().toString(), "exclude": false };
				}
			});
		}
		// get all the properties defined under FilterExpressionRestriction with SingleRange as the AllowedExpressions
		var aRelevantFilterExpressionRestrictionsProperties = oLeadingEntitySet["Org.OData.Capabilities.V1.FilterRestrictions"] && oLeadingEntitySet["Org.OData.Capabilities.V1.FilterRestrictions"].FilterExpressionRestrictions ? 
			oLeadingEntitySet['Org.OData.Capabilities.V1.FilterRestrictions'].FilterExpressionRestrictions.filter(function(oFilterExpressionRestriction) {
				return oFilterExpressionRestriction.AllowedExpressions && oFilterExpressionRestriction.AllowedExpressions.String === "SingleRange";
			}).map(function(oFilterExpressionRestriction) {
				return oFilterExpressionRestriction.Property && oFilterExpressionRestriction.Property.PropertyPath;
			}) : [];
		
		var aCombinedProperties = oLeadingEntityType.property.concat(aParameterDateFields);
		return aCombinedProperties.filter(isSemanticDateRange.bind(null, oPageSettings.filterSettings.dateSettings, aRelevantFilterExpressionRestrictionsProperties)).map(function (oProperty) {
			return {
				key: oProperty.name,
				conditionType: constructConditionTypeForDateProperties(oPageSettings.filterSettings.dateSettings.fields && oPageSettings.filterSettings.dateSettings.fields[oProperty.name] || oPageSettings.filterSettings.dateSettings, oProperty)
			};
		});
	}

	/**
	 * adds all the default semantic date field once the smartfilterbar is initialized
	 * @param {Object} oPageSettings - Listreport page settings from manifest
	 * @param {Object} oFilterBar - SmartFilter bar of ListReport
	 * @param {Object} oSemanticDates - SemanticDates in AppState
	 * @param {Object} oURLParameters URL parameters of the application
	 * @returns {object} semanticDates default values
	 */
	function fnAddSemanticDateRangeDefaultValue(oPageSettings, oFilterBar, oSemanticDates, oURLParameters) {
		var oFilterFieldDate = {};
		var aSemanticDateFilters = [], oDateFields;
		if (oPageSettings.filterSettings &&
			oPageSettings.filterSettings.dateSettings &&
			oPageSettings.filterSettings.dateSettings.fields) {
			oDateFields = oPageSettings.filterSettings.dateSettings.fields;
			Object.entries(oDateFields).forEach(function(oDate) {
				var nSemanticDateIndex = -1;
				if (oSemanticDates && oSemanticDates.Dates) {
					nSemanticDateIndex = oSemanticDates.Dates.findIndex(function(oSemanticDate){
						return oSemanticDate.PropertyName === oDate[0];
					});
				}
				if (nSemanticDateIndex === -1 && Object.keys(oURLParameters).indexOf(oDate[0]) === -1 && oDate[1].defaultValue) {
					// For Parameter date fields the getConditionTypeKey API returns undefined and hence the below code is modified.
					// Code should be back to previous state when the API handles parameter fields
					oFilterBar.getConditionTypeByKey(oDate[0]) && oFilterBar.getConditionTypeByKey(oDate[0]).setOperation(oDate[1].defaultValue.operation);
					oFilterFieldDate = oFilterBar.getConditionTypeByKey(oDate[0]) && oFilterBar.getConditionTypeByKey(oDate[0]).getCondition();
					oFilterFieldDate && aSemanticDateFilters.push({PropertyName:oFilterFieldDate.key, Data: oFilterFieldDate});
				}
			});

		}
		// apps may use useDateRange true and doesnt have specific date fields and has extension for semanticdate
		if (!oDateFields){
			if (oSemanticDates && oSemanticDates.Dates) {
				var nSemanticDateIndex = oSemanticDates.Dates.findIndex(function(oSemanticDate){
					return Object.keys(oURLParameters).includes(oSemanticDate.PropertyName);
				});	
				// not part of url parameter
				if (nSemanticDateIndex === -1) {
					aSemanticDateFilters = oSemanticDates.Dates;
				}
			}
		}
		return {Dates: aSemanticDateFilters};
	}

	return {
		getDateSettingsMetadata: getDateSettingsMetadata,
		getDateRangeFieldSettings: getDateRangeFieldSettings,
		addSemanticDateRangeDefaultValue: fnAddSemanticDateRangeDefaultValue,
		getSettingsForDateProperties: getSettingsForDateProperties
	};
});
