sap.ui.define([
    "sap/suite/ui/generic/template/genericUtilities/metadataAnalyser",
    "sap/suite/ui/generic/template/lib/CommonUtils",
    "sap/fe/navigation/SelectionVariant",
    "sap/suite/ui/generic/template/lib/multipleViews/MultipleViewsHandler"
], function (MetadataAnalyser, CommonUtils, SelectionVariant, MultipleViewsHandler) {
    "use strict";

    var oSemanticDateRangeConfig = {};
    /**
     * Remove extra information from variant object keep only SelectionOptions and Parameters
     *
     * @param {object} oValue Variant value
     * @returns {object} Updated value of selection variant after removinig the extra info
     */
    function removeExtraInfoVariant(oValue) {
        if (oValue) {
            if (oValue.hasOwnProperty("SelectionVariantID")) {
                delete oValue.SelectionVariantID;
            } else if (oValue.hasOwnProperty("PresentationVariantID")) {
                delete oValue.PresentationVariantID;
            }
            delete oValue.Text;
            delete oValue.ODataFilterExpression;
            delete oValue.Version;
            delete oValue.FilterContextUrl;
            delete oValue.ParameterContextUrl;
            return oValue;
        }
        return oValue;
    }

    /**
     * Updates the multiple Range values of a selection variant
     *
     * @param {Array} aSelectOptions
     * @param {object} oSVValue Selection Variant value
     * @param {string} sKey The filter name act as key for card's config params
     * @returns {}
     */
    function handleMultiRangeVariant(aSelectOptions, oSVValue, sKey) {
        var aRanges;
        aSelectOptions.forEach(function(oSelOption) {
            aRanges = oSelOption && oSelOption.Ranges;
            oSVValue.massAddSelectOption(sKey, aRanges);
        });
    }

    /**
     * Updates the Range values for the selection options of filters under configuration params
     *  - In case if selection option has only single Range, without a LOW value defined in Range set Ranges to [] for that selection variant.
     *  - In case if there are multiple different Ranges for same property combine together to same Ranges array.
     *
     * @param {object} oFilters Configuration parameters
     * @returns {}
     */
    function updateRangeValue(oFilters) {
        var oVariant, oSelectOption, oRange;
        var k = 0;

        for (var sKey in oFilters) {
            var oSVValue = new SelectionVariant();
            if (oFilters.hasOwnProperty(sKey) && oFilters[sKey]) {
                oVariant = oFilters[sKey].value;
                if (oVariant && typeof oVariant === "string" && isJSONData(oVariant)) {
                    oVariant = JSON.parse(oVariant);
                    if (typeof oVariant !== "object") {
                        oFilters[sKey].value = oVariant.toString();
                        continue;
                    }
                    oSelectOption = oVariant.SelectOptions && oVariant.SelectOptions[0];
                    if (oSelectOption && oSelectOption.Ranges && oSelectOption.Ranges.length === 1) {
                        oRange = oSelectOption.Ranges[0] || {};
                        if (oRange.Option === "EQ" && !oRange.Low) {
                            oSelectOption.Ranges = [];
                            oFilters[sKey].value = JSON.stringify(oVariant);
                        }
                    }
                } else if (oVariant && Array.isArray(oVariant)) {

                    var oVariantVal, aSelectOptions;

                    for (k = 0; k < oVariant.length; k++) {
                        oVariantVal = JSON.parse(oVariant[k]);
                        aSelectOptions = oVariantVal && oVariantVal.SelectOptions || [];
                        handleMultiRangeVariant(aSelectOptions, oSVValue, sKey);
                    }
                    oSVValue = removeExtraInfoVariant(oSVValue && oSVValue.toJSONObject());
                    oFilters[sKey].value = JSON.stringify(oSVValue);
                }
            }
        }
    }

    /**
     * Get the parameter value from Smart filter
     *
     * @param {string} sMandatoryProp Parameter path
     * @param {object} oSmartFilterbar
     * @returns {object} The value of mandatory / non-mandatory parameter from smart filter
     */
    function getParameterValue(sMandatoryProp, oSmartFilterbar) {
        var sPropertyName,
            sResult = "";
        oSmartFilterbar &&
            oSmartFilterbar.getAllFiltersWithValues().filter(function (oFilterVal) {
                sPropertyName = oFilterVal.getName();
                if (sPropertyName.includes(sMandatoryProp) || sPropertyName === sMandatoryProp) {
                    sResult = (oSmartFilterbar && oSmartFilterbar.getFilterData() && oSmartFilterbar.getFilterData()[sPropertyName]) || "";
                }
            });
        return sResult;
    }

    /**
     * Get the parameterized entity set properties
     *
     * @param {object} oModel
     * @param {object} oEntitySet
     * @param {string} sProperty
     * @param {object} oCardDefinition
     * @returns {Array} The entity set properties Array
     */
    function getParameterizedEntityProperties(oModel, oEntitySet, sProperty, oCardDefinition) {
        var aProperties = [];
        var bParameterised = MetadataAnalyser.checkAnalyticalParameterisedEntitySet(oModel, oEntitySet.name);
        var oParametersInfo = MetadataAnalyser.getParametersByEntitySet(oModel, oEntitySet.name);

        if (bParameterised) {
            aProperties = MultipleViewsHandler.fnResolveParameterizedEntitySet(oEntitySet, oParametersInfo) || [];
        } else {
             //for transactional parameterised entity seys
             if (oParametersInfo && oParametersInfo.entitySetName) {
                aProperties = MetadataAnalyser.getPropertyOfEntitySet(oModel, oParametersInfo.entitySetName) || [];
            }
        }
        return aProperties.filter(function (oProperty) {
            return oProperty && oProperty.name === sProperty;
        });
    }

    /**
     * Get default value of parameter in smart filter bar or card
     *
     * @param {object} oModel
     * @param {object} oEntityType
     * @param {string} sPropertyName
     * @param {string} oCardDefinition
     * @returns {string} Default Value of the property
     */
    function getParameterDefaultValue(oModel, oEntityType, sPropertyName, oCardDefinition) {
        if (sPropertyName) {
            var aPropertyInfo = getParameterizedEntityProperties(oModel, oEntityType, sPropertyName, oCardDefinition) || [],
                oProperty = aPropertyInfo[0] || {},
                oFilterDefaultvalue = oProperty["com.sap.vocabularies.Common.v1.FilterDefaultValue"] || {},
                aFilterDefaultKeys = Object.keys(oFilterDefaultvalue) || [];

            return oFilterDefaultvalue[aFilterDefaultKeys[0]] || oProperty.defaultValue;
        }
    }

    /**
     * Get Actual value of parameter from smart filter bar
     *
     * @param {string} sProperty
     * @param {object} oSmartFilterbar Smart Filter Model
     * @returns {string} Actual Value of the property or empty string
     */
    function getParameterActualValue(sProperty, oSmartFilterbar) {
        var oFilterData = oSmartFilterbar && oSmartFilterbar.getFilterData();
        var oCustomFilterData = oFilterData._CUSTOM && oFilterData._CUSTOM["sap.suite.ui.generic.template.customData"];
        if (oFilterData && (oFilterData["$Parameter." + sProperty] || oFilterData[sProperty])) {
            return (oFilterData["$Parameter." + sProperty] || oFilterData[sProperty]) || "";
        } else if (oCustomFilterData && (oCustomFilterData["$Parameter." + sProperty] || oCustomFilterData[sProperty])) {
            return (oCustomFilterData["$Parameter." + sProperty] || oCustomFilterData[sProperty]) || "";
        }
    }

    /**
     * Get Deafult value of filter from smart filter bar
     *  - If the filter property is direct property of smart filter's entity type, then process the property from smart filter.
     *  - If the property is associated from card entity Type use card entity type to get the default value.
     *
     *  - Check if property has FilterDefaultValue annotation
     *  - Check if property object direct have a defaultValue property, cominig from metadata
     *
     * @param {string} sProperty
     * @param {object} oEntityType Card Entity Type
     * @returns {string} Default Value of the property
     */
    function getFilterDefaultValue(sProperty, oEntityType) {
        var aPropertyInfo = [];
        if (sProperty) {
            aPropertyInfo = oEntityType &&
                oEntityType.property &&
                oEntityType.property.filter(function (oProperty) {
                return oProperty && oProperty.name === sProperty;
            }) || [];
        }
        var oProperty = aPropertyInfo && aPropertyInfo.length ? aPropertyInfo[0] : {};
        var oFilterDefaultvalue = (oProperty && oProperty["com.sap.vocabularies.Common.v1.FilterDefaultValue"]) || {};
        var aFilterDefaultKeys = Object.keys(oFilterDefaultvalue);
        return oProperty && ((aFilterDefaultKeys && aFilterDefaultKeys.length && oFilterDefaultvalue[aFilterDefaultKeys[0]]) || oProperty.defaultValue);
    }

    /**
     * Enahnces the selection variant value
     *
     * @param {Array | object} oVariantValue selection variant value could be an array or object
     * @returns {Array | object} The Enahnced selection variant value
    */
    function enhanceVariant(oVariantValue) {
        var oValue;
        var aFinalValue = [];
        if (oVariantValue && Array.isArray(oVariantValue)) {
            oVariantValue.forEach(function (oVal) {
                if (oVal) {
                    oValue = removeExtraInfoVariant(JSON.parse(oVal));
                    aFinalValue.push(JSON.stringify(oValue));
                }
            });
            return aFinalValue;
        } else if (oVariantValue && isJSONData(oVariantValue)) {
            oValue = removeExtraInfoVariant(JSON.parse(oVariantValue));
            return JSON.stringify(oValue);
        }
    }

    /**
     * Check and returns the property type using the property object used to create type of configuration params
     *
     * @param {object} oPropertyDetails selection variant value could be an array or object.
     * @returns {*} The type of property could be of type string or null in case if no type is matched.
    */
    function getPropertyType(oPropertyDetails) {
        var sType = "";
        if (!oPropertyDetails) {
            return null;
        }
        if (oPropertyDetails.type) {
            sType = oPropertyDetails.type.startsWith("Edm.")
                ? oPropertyDetails.type.split("Edm.")[1]
                : oPropertyDetails.type;
        }
        var oDataTypeMap = {
            Boolean: "boolean",
            Byte: "integer",
            SByte: "integer",
            Int16: "integer",
            Int32: "integer",
            Int64: "number",
            Single: "number",
            Double: "number",
            Float: "number",
            Decimal: "number",
            Guid: "string",
            String: "string",
            Date: "date",
            DateTime: "datetime",
            DateTimeOffset: "datetime",
            Time: "datetime",
            Binary: "",
            Stream: "",
            TimeOfDay: "",
            Duration: ""
        };
        if (sType && sType === "string") {
            return sType;
        } else if (sType && oDataTypeMap[sType]) {
            return oDataTypeMap[sType];
        } else {
            return "string"; // keep string type as default
        }
    }

    /**
     * Get Request AtLeastFields fields using presentation Variant
     *
     * @param {object} oPresentationVariant
     * @returns {Array} The Request at least properties array.
    */
    function getRequestAtLeastFields(oPresentationVariant) {
        var aRequest = [];
        var aRequestFields = (oPresentationVariant && oPresentationVariant.RequestAtLeast) || undefined;
        if (aRequestFields) {
            for (var i = 0; i < aRequestFields.length; i++) {
                if (aRequestFields[i].PropertyPath) {
                    aRequest.push(aRequestFields[i].PropertyPath);
                }
            }
        }
        return aRequest;
    }

    /**
     * Get The text value specific to the Low value of Range in selection option
     *
     * @param {object} oRange
     * @param {Array} aFilterLabel The Label / token values from smart filter bar
     * @param {object} oSmartFilterbar
     * @param {String} sPropertyName
     * @returns {String} sRangeText The Text which needs to updated to the Range object.
    */
    function getRelatedTextToRange(oRange, aFilterLabel, oSmartFilterbar, sPropertyName) {
        var sRangeText = "";

        if (Array.isArray(aFilterLabel)) {
            aFilterLabel.filter(function(sText) {
                if (sText && sText.includes(oRange.Low)) {
                    sRangeText = sText;
                }
            });
        } else if (typeof aFilterLabel === "string") {
            sRangeText = aFilterLabel;
        }
        if (!sRangeText && oRange.Low && oRange.High) {
            var oFilterData = oSmartFilterbar && oSmartFilterbar.getFilterData() || {},
                oPropertyData = oFilterData[sPropertyName] || {};
            if (oPropertyData.ranges) {
                var aRanges = oPropertyData.ranges || [];
                var aRelativeRange = aRanges.filter(function(oRangeInfo) {
                    return oRangeInfo.value1 === oRange.Low;
                });
                var oRelativeRange = aRelativeRange[0] || {};
                sRangeText = oRelativeRange.tokenText || "";
            }
        }

        return sRangeText;
    }

    /**
     * Adds a filter value to selection variant
     *
     *  - Use the Smart Filter's UI state to get the actual filter value, and add it to selection option.
     *  - In case if the property / filter value does not exist in smart filter's UI state then add a "" (empty string) as a value to Selection Variant.
     *
     * @param {object} oSmartFilterbar
     * @param {string} sPropertyName
     * @param {object} oSelectionVariant
     * @param {Array} aFilterLabel
    */
    function addFiltervalues(oSmartFilterbar, sPropertyName, oSelectionVariant, aFilterLabel) {
        var oUIState = oSmartFilterbar && oSmartFilterbar.getUiState(),
            oSelVariant = oUIState && oUIState.getSelectionVariant(),
            aSelectOptions = oSelVariant && oSelVariant.SelectOptions || [],
            bFilterUpdated = false;
        aSelectOptions.filter(function(oSelOption) {
            return oSelOption && oSelOption["PropertyName"] === sPropertyName;
        }).map(function(oSelOption) {
            bFilterUpdated = true;
            var aRanges = oSelOption && oSelOption.Ranges || [];

            aRanges.forEach(function(oRange) {
                var sText = getRelatedTextToRange(oRange, aFilterLabel, oSmartFilterbar, sPropertyName);
                oSelectionVariant.addSelectOption(sPropertyName, oRange.Sign, oRange.Option, oRange.Low, oRange.High, sText);
            });
        });

        if (!bFilterUpdated) {
            oSelectionVariant.addSelectOption(sPropertyName, "I", "EQ", "");
        }
    }

    /**
     * Get the single filter value
     *
     * @param {object} oFilter
     * @param {string} sFilterPath
     * @returns {*} string value in case of success, error in case of unsupported operator.
    */
    function getSingleFilterValue(oFilter, sFilterPath) {
        var sFilter;
        var rSingleQuote = /'/g;

        switch (oFilter.Option) {
            case "BT":
                sFilter =
                    sFilterPath +
                    " ge " +
                    "'" +
                    oFilter.Low.replace(rSingleQuote, "''") +
                    "'" +
                    " and " +
                    sFilterPath +
                    " le " +
                    "'" +
                    oFilter.High.replace(rSingleQuote, "''") +
                    "'";
                break;
            case "NB":
                sFilter =
                    sFilterPath +
                    " lt " +
                    "'" +
                    oFilter.Low.replace(rSingleQuote, "''") +
                    "'" +
                    " or " +
                    sFilterPath +
                    " gt " +
                    "'" +
                    oFilter.High.replace(rSingleQuote, "''") +
                    "'";
                break;
            case "EQ":
            case "GE":
            case "GT":
            case "LE":
            case "LT":
            case "NE":
                sFilter = sFilterPath + " " + oFilter.Option.toLowerCase() + " " + "'" + oFilter.Low.replace(rSingleQuote, "''") + "'";
                break;
            case "Contains":
            case "EndsWith":
            case "NotContains":
            case "NotEndsWith":
            case "NotStartsWith":
            case "StartsWith":
                sFilter =
                    oFilter.Option.toLowerCase().replace("not", "not ") +
                    "(" +
                    sFilterPath +
                    "," +
                    "'" +
                    oFilter.Low.replace(rSingleQuote, "''") +
                    "'" +
                    ")";
                break;
            default:
                throw new Error("Unsupported operator: " + oFilter.Option);
        }
        return sFilter;
    }

     /**
     * Returns the semantic date range properties
     *
     * @param {object} oCardDefinition Card defination object
     * @returns {Object} aDateProperties The date property keys in object format.
    */
    function getSemanticDateRangeProperties(oCardDefinition) {
        var oTemplatePrivate = oCardDefinition['component'].getModel("_templPriv"),
        oDateProperties = oTemplatePrivate.getProperty("/listReport/datePropertiesSettings");

        if (oDateProperties) {
            return oDateProperties;
        }
    }

    /**
     * Checks if the semantic date range property is valid or not by checking if the property exists in the datePropertiesSettings of ui model or not
     *
     * @param {object} oCardDefinition Card defination object
     * @param {string} sPropertyName
     * @returns {boolean} true if the semantic date range property exists in generated properties false o/w.
    */
    function IsSemanticDateRangeValid(oCardDefinition, oProperty) {
        var oDateProperties = getSemanticDateRangeProperties(oCardDefinition);
        var sPropertyName = oProperty && oProperty.name;
        var aDateProperties = oDateProperties && Object.keys(oDateProperties);
        if (aDateProperties && aDateProperties.length && sPropertyName) {
            return aDateProperties && aDateProperties.indexOf(sPropertyName) > -1;
        } else if (isDate(oProperty)) {
            var oFilterSettings = oCardDefinition['component'].getFilterSettings();
            return oFilterSettings && oFilterSettings.dateSettings && oFilterSettings.dateSettings.useDateRange;
        }
    }

    /**
     * Adds _semanticDateRangeSetting setting under configuration parameters for generated manifest 
     * Add the fields only if there is a property in card's entity type equivalent to the manifest field.
     * Currently Fields which has options "customDateRangeImplementation" will be ignored as for custom date range a
     * JS class reference will be given which might not be available for generated cards.
     * The option of default value will also be ignored as the default value will be set to configuration parameters if exists.
     * In case if user has changed the value that changed value will replace the default value in configuration parameters.
     *
     * @param {object} oCardDefinition Card defination object
     * @returns {object} oSemanticDateRangeConfig The semantic date range configuration.
    */
    function getSemanticDateConfiguration(oCardDefinition) {
        var oDateProperties = getSemanticDateRangeProperties(oCardDefinition);
        var aDateProperties = oDateProperties && Object.keys(oDateProperties);

        if (aDateProperties && aDateProperties.length) {
            aDateProperties.forEach(function(sFieldKey) {
                if (oSemanticDateRangeConfig[sFieldKey]) {
                    var aOperations = oDateProperties[sFieldKey] && Object.keys(oDateProperties[sFieldKey]) || [];
                    aOperations.forEach(function(sOperation) {
                        if (sOperation && sOperation !== "defaultValue" && sOperation !== "customDateRangeImplementation") {
                            oSemanticDateRangeConfig[sFieldKey][sOperation] = oDateProperties[sFieldKey][sOperation];
                        }
                    });
                }
            });
        }

        return oSemanticDateRangeConfig;
    }

    /**
     * Sets filter restriction to oSemanticDateRangeConfig property of filterhelper from the given property.
     *
     * @param {object} oParameter Property defination from entity type for relavant filter / parameters.
     * @param {boolean} bTypeParameter If the type of property is parameter or a filter.
     *
    */
    function setFilterRestrictionToSemanticDateRange(oParameter, bTypeParameter) {
        if (bTypeParameter) {
            oSemanticDateRangeConfig[oParameter.name] = {"sap:filter-restriction" : "single-value"};
        } else {
            oSemanticDateRangeConfig[oParameter.name] = {"sap:filter-restriction" : oParameter["sap:filter-restriction"]};
        }
    }

    /**
     * Checks if the given url has at least one semantic date property present in the url.
     *
     * @param {string} sURL
     * @returns {boolean}
     *
    */
    function IsSemanticDateExistsInUrl(sURL) {
        var aKeys = Object.keys(oSemanticDateRangeConfig) || [];

        if (aKeys.length && sURL) {
            return aKeys.some(function(sKey) {
                return sURL && sURL.indexOf(sKey) > -1;
            });
        }
    }

    /**
     * Returns the default value for given property from the semantic date range configuration of manifest in case if exists.
     *
     * @param {object} oCardDefinition
     * @param {string} sPropertyName The relavant filter property name.
     * @param {string} The default value for relavant property from semantic date range configuration of manifest.
    */
    function getDateRangeDefaultValue(oCardDefinition, sPropertyName) {
        var oDateProperties = getSemanticDateRangeProperties(oCardDefinition);

        if (oDateProperties && oDateProperties[sPropertyName] && oDateProperties[sPropertyName]['defaultValue']) {
            return oDateProperties[sPropertyName]['defaultValue']['operation'];
        } else {
            var oFilterSettings = oCardDefinition['component'].getFilterSettings();
            var oFields = oFilterSettings && oFilterSettings.dateSettings && oFilterSettings.dateSettings.fields;
            return oFields && oFields[sPropertyName] && oFields[sPropertyName]['defaultValue'] && oFields[sPropertyName]['defaultValue']['operation'];
        }
    }

    /**
     * Returns the Range value from smart filter bar which is relavant to given property.
     *
     * @param {object} oSmartFilterbar
     * @param {string} sPropertyName The relavant filter property name.
     * @param {object} The relavant Range value form smart filter bar.
    */
    function getRangeValueFromSmartFilterBar(oSmartFilterbar, sPropertyName) {
        var oUIState = oSmartFilterbar && oSmartFilterbar.getUiState(),
            oSelVariant = oUIState && oUIState.getSelectionVariant(),
            aSelectOptions = oSelVariant && oSelVariant.SelectOptions || [];

        var aRelativeSelectOption = aSelectOptions.filter(function(oSelOption) {
            return oSelOption && oSelOption["PropertyName"] === sPropertyName;
        });

        aRelativeSelectOption = aRelativeSelectOption && aRelativeSelectOption[0] || [];

        var aRanges = aRelativeSelectOption.Ranges || [];

        return aRanges && aRanges[0];
    }

    /**
     * Returns the date range value for both parameters and filters, for parameters the value will be a string for filter the value will be in form of Selection Variant Range.
     *
     * @param {object} oValue Parameter value from smart filter bar.
     * @param {object} oParameter Property defination from entity type for relavant filter / parameters.
     * @param {Boolean} bIsParameter If the given property is a parameter or a filter.
     * @param {object} oSmartFilterbar
     * @param {*} aFilterLabel The labels of current field could be of type Array | String.
     * @returns {*} String in case of parameter, Range object in case of filters.
    */
    function getDateRangeValue(oValue, oParameter, bIsParameter, oSmartFilterbar, aFilterLabel) {

        if (oValue && bIsParameter) {
            var oConditionInfo = oValue.conditionTypeInfo;
            return oConditionInfo && oConditionInfo.data && oConditionInfo.data["operation"];
        }

        if (!bIsParameter) {
            var oDateRangeValue = getParameterActualValue(oParameter.name, oSmartFilterbar);
            var oConditionInfo = oDateRangeValue && oDateRangeValue.conditionTypeInfo;

            var sOperation = oConditionInfo && oConditionInfo.data && oConditionInfo.data["operation"];
            var aRanges = oDateRangeValue && oDateRangeValue["ranges"];
            var oRange = aRanges && aRanges[0];

            if (sOperation) {
                switch (sOperation) {
                    case "DATE":
                    case "DATERANGE":
                    case "SPECIFICMONTH":
                    case "FROM":
                    case "TO":
                        var sText = getRelatedTextToRange({Low : oRange.Low}, aFilterLabel, oSmartFilterbar, oParameter.name);
                        var oDateRange = getRangeValueFromSmartFilterBar(oSmartFilterbar, oParameter.name);
                        if (oDateRange) {
                            oDateRange.Text = sText;
                            return oDateRange;
                        }
                        break;
                    case "LASTDAYS":
                    case "LASTWEEKS":
                    case "LASTMONTHS":
                    case "LASTQUARTERS":
                    case "LASTYEARS":
                    case "NEXTDAYS":
                    case "NEXTWEEKS":
                    case "NEXTMONTHS":
                    case "NEXTQUARTERS":
                    case "NEXTYEARS":
                        var sValue = oConditionInfo && oConditionInfo.data && oConditionInfo.data.value1;
                        var sText = getRelatedTextToRange({Low : sValue}, aFilterLabel, oSmartFilterbar, oParameter.name);
                        return {Low : sOperation, High: sValue.toString(), Option : "BT", Text: sText};
                    case "TODAYFROMTO":
                        var Value1 = oConditionInfo && oConditionInfo.data && oConditionInfo.data.value1;
                        var Value2 = oConditionInfo && oConditionInfo.data && oConditionInfo.data.value2;
                        var sText = getRelatedTextToRange({Low : Value1}, aFilterLabel, oSmartFilterbar, oParameter.name);
                        return {Low : sOperation, High: Value1.toString() + "," + Value2.toString(), Option : "BT", Text: sText};
                    default:
                        var sText = getRelatedTextToRange({Low : sOperation}, aFilterLabel, oSmartFilterbar, oParameter.name) || "";
                        sText = sText.substring(0, sText.indexOf("(") - 1);
                        return {Low : sOperation, High: null, Option : "EQ", Text: sText};
                }
            }
        }
    }

    /**
     * Adds the semantic date range value to the filter property in generated manifest's configuration parameter in form of selection variant.
     *
     * @param {object} oCardDefinition
     * @param {object} oProperty Property defination from entity type for relavant filter.
     * @param {string} sDefaultValue The default value of the current filter.
     * @param {object} oSelectionVariant
     * @param {*} aFilterLabel The labels of current field could be of type Array | String.
    */
    function addDateRangeValueToSV(oCardDefinition, oProperty, sDefaultValue, oSelectionVariant, aFilterLabel) {
        var oSmartFilterbar = oCardDefinition.oSmartFilterbar,
            sSemantiDateRangeDefaultValue = getDateRangeDefaultValue(oCardDefinition, oProperty.name) || sDefaultValue,
            oDateRangeValue = getDateRangeValue(null, oProperty, false, oSmartFilterbar, aFilterLabel);

        if (oDateRangeValue) {
            oSelectionVariant.addSelectOption(oProperty.name, "I", oDateRangeValue.Option, oDateRangeValue.Low, oDateRangeValue.High, oDateRangeValue.Text);
        } else if (sSemantiDateRangeDefaultValue) {
            oSelectionVariant.addSelectOption(oProperty.name, "I", "EQ", sSemantiDateRangeDefaultValue, null, sSemantiDateRangeDefaultValue);
        }
    }

    /**
     * Get the label for given smart filter bar's filter field.
     *
     * @param {string} sParameterName Smart filter bar property name.
     * @param {object} oSmartFilterbar
     * @returns {*} The value of smart filter bar's filter, in case of parameter in a string for filters in Object.
    */
    function getLabelForField(sParameterName, oSmartFilterbar) {
        if (oSmartFilterbar && sParameterName) {
            var aFilterValues = oSmartFilterbar.getFiltersWithValues() || [],
                sFilterName = "",
                aRelatedFilterValue = aFilterValues.filter(function(oFilterVal) {
                    sFilterName = oFilterVal && oFilterVal.getName();
                    return sFilterName === sParameterName || "$Parameter." + sParameterName === sFilterName;
                });
            var oControl = aRelatedFilterValue && aRelatedFilterValue[0] && aRelatedFilterValue[0].getControl();

            if (oControl &&
                oControl.getMetadata() &&
                oControl.getMetadata().getName() === "sap.m.DynamicDateRange") {
                var sIdForLabel = oControl.getIdForLabel() || "";
                sIdForLabel = sIdForLabel.substring(0, sIdForLabel.lastIndexOf("-"));

                if (sIdForLabel) {
                    var sInputControl = sap.ui.getCore().byId(sIdForLabel);
                    return sInputControl && sInputControl.getValue();
                }
            } else if (oControl &&
                oControl.getProperty("value")) {
                return oControl.getProperty("value");
            } else if (oControl &&
                typeof oControl.getTokens === 'function') {
                var aTokens = oControl.getTokens() || [],
                    aTexts = aTokens.map(function(oToken) {
                    return oToken.getText();
                });

                return {type : "filters", value : aTexts};
            }
        }
    }

    /**
     * Get the label property of smartfilterbar control and add to the configuration parameters in generated manifest.
     * Generated i18n key for the property in case of DT scenario.
     *
     * @param {string} sKeyName Smart filter bar property name.
     * @param {object} oSmartFilterbar
     * @param {object} oTarget The target configuration parameter object which needs to be  updated.
     * @param {object} oCardDefinition
     * @param {string} sDefaultValue Default value of parameter
     * @param {boolean} bSemanticDateRange If semantic date range is enabled or not
     * @returns {string} sLabelForField The lablel value for the given smart filter bar control
    */
    function getLabelForConfigParams(sKeyName, oSmartFilterbar, oTarget, oCardDefinition, sDefaultValue, bSemanticDateRange) {
        var sLabelForField = getLabelForField(sKeyName, oSmartFilterbar);

        // Either in RT Mode or In case of DT Mode if it is a mandatory parameter then add label value as despription if present.
        if (sLabelForField && typeof sLabelForField === 'string') {
            if (!oTarget[sKeyName]) {
                oTarget[sKeyName] = {};
            }

            oTarget[sKeyName]["label"] = sLabelForField;
            if (sDefaultValue) {
                sLabelForField = bSemanticDateRange ? sDefaultValue : sLabelForField;
            }
            return sLabelForField;
        } else if (sLabelForField && sLabelForField.value && sLabelForField.type === "filters") {
            return sLabelForField.value;
        }
    }

    /**
     * Checks if given property is of type semantic date range or not
     * => If type is 'Edm.DateTime' and 'sap:display-format' is Date and sap:filter-restriction exists either interval or single-value then returns true
     * => If type is 'Edm.String' and 'IsCalendarDate' annotation is enabled and sap:filter-restriction exists either interval or single-value then returns true false otherwise.
     *
     * @param {object} oProperty Card defination object
     * @returns {boolean} If the given property is of type semantic date then true false otherwise.
    */
    function isDate(oProperty) {
        if (((oProperty["type"] === "Edm.DateTime" && oProperty["sap:display-format"] === "Date") || (oProperty["type"] === "Edm.String" && oProperty["com.sap.vocabularies.Common.v1.IsCalendarDate"] && oProperty["com.sap.vocabularies.Common.v1.IsCalendarDate"].Bool === "true")) && (oProperty["sap:filter-restriction"] === "interval" || oProperty["sap:filter-restriction"] === "single-value" || oProperty["_filterRestriction"] === "single-value")) {
            return true;
        }
        return false;
    }

    /**
     * Checks if the data is in JSON format or not
     *
     * @param {string} sVariant Selection variant value
     * @returns {boolean} Return true if the selection variant is in JSON string format false otherwise
    */
    function isJSONData(sVariant) {
        try {
            if (JSON.parse(sVariant)) {
                return true;
            }
        } catch (err) {
            return false;
        }
    }

    return {
        enhanceVariant: enhanceVariant,
        updateRangeValue: updateRangeValue,
        getPropertyType: getPropertyType,
        getParameterValue: getParameterValue,
        getRequestAtLeastFields: getRequestAtLeastFields,
        getFilterDefaultValue: getFilterDefaultValue,
        getParameterDefaultValue: getParameterDefaultValue,
        addFiltervalues: addFiltervalues,
        getParameterActualValue: getParameterActualValue,
        removeExtraInfoVariant: removeExtraInfoVariant,
        getSingleFilterValue: getSingleFilterValue,
        getSemanticDateConfiguration: getSemanticDateConfiguration,
        IsSemanticDateRangeValid: IsSemanticDateRangeValid,
        getDateRangeValue: getDateRangeValue,
        getLabelForConfigParams: getLabelForConfigParams,
        getRelatedTextToRange: getRelatedTextToRange,
        setFilterRestrictionToSemanticDateRange: setFilterRestrictionToSemanticDateRange,
        addDateRangeValueToSV: addDateRangeValueToSV,
        getDateRangeDefaultValue: getDateRangeDefaultValue,
        IsSemanticDateExistsInUrl: IsSemanticDateExistsInUrl,
        isJSONData: isJSONData,
        isDate: isDate
    };
});
