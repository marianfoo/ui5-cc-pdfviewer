/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 * This extension is for OVP Analytical cards delivered in 2208.
 */
sap.ui.define(
    [
        "sap/ui/integration/Extension",
        "sap/ui/core/format/NumberFormat",
        "sap/fe/navigation/SelectionVariant",
        "sap/base/Log",
        "sap/ui/core/format/DateFormat",
        "sap/ui/core/ValueState",
        "sap/m/ValueColor",
        "sap/ui/integration/util/Utils",
        "sap/m/DynamicDateUtil",
        "sap/ui/core/Core",
        "sap/fe/navigation/NavError",
        "sap/insights/utils/UrlGenerateHelper"
    ],
    function (Extension, NumberFormat, SelectionVariant, Log, DateFormat, ValueState, ValueColor, IntegrationUtils, DynamicDateUtil, Core, NavError, UrlGenerateHelper) {
        "use strict";

        var criticalityConstants = {
            StateValues: {
                None: "None",
                Negative: "Error",
                Critical: "Warning",
                Positive: "Success"
            },
            ColorValues: {
                None: "Neutral",
                Negative: "Error",
                Critical: "Critical",
                Positive: "Good"
            }
        };
        var oLogger = Log.getLogger("sap.insights.CardExtension");

        var endsWith = function (sString, sSuffix) {
            return sString && sString.indexOf(sSuffix, sString.length - sSuffix.length) !== -1;
        };
        var criticality2state = function (criticality, oCriticalityConfigValues) {
            var sState;
            if (oCriticalityConfigValues) {
                sState = oCriticalityConfigValues.None;
                if (criticality && criticality.EnumMember) {
                    var val = criticality.EnumMember;
                    if (endsWith(val, 'Negative')) {
                        sState = oCriticalityConfigValues.Negative;
                    } else if (endsWith(val, 'Critical')) {
                        sState = oCriticalityConfigValues.Critical;
                    } else if (endsWith(val, 'Positive')) {
                        sState = oCriticalityConfigValues.Positive;
                    }
                }
            }
            return sState;
        };
        var calculateCriticalityState = function (value, sImproveDirection, deviationLow, deviationHigh, toleranceLow, toleranceHigh, oCriticalityConfigValues) {

            var oCriticality = {};
            oCriticality.EnumMember = "None";
            //Consider fallback values for optional threshold values in criticality calculation
            //after considering fallback values if all the values required for calculation are not present then the criticality will be neutral
            /* example - in case of maximizing
            * if deviationLow is mentioned and toleranceLow not mentioned, then toleranceLow = deviationLow
            * if toleranceLow is mentioned and deviationLow not mentioned, then deviationLow = Number.NEGATIVE_INFINITY
            * if both values are not mentioned then there will not be any calculation and criticality will be neutral
            * */
            var nMinValue = Number.NEGATIVE_INFINITY;
            var nMaxValue = Number.POSITIVE_INFINITY;

            if ((!toleranceLow && toleranceLow !== 0) && (deviationLow || deviationLow === 0)) {
                toleranceLow = deviationLow;
            }
            if ((!toleranceHigh && toleranceHigh !== 0) && (deviationHigh || deviationHigh === 0)) {
                toleranceHigh = deviationHigh;
            }
            if (!deviationLow && deviationLow !== 0) {
                deviationLow = nMinValue;
            }
            if (!deviationHigh && deviationHigh !== 0) {
                deviationHigh = nMaxValue;
            }

            // number could be a zero number so check if it is not undefined
            if (value !== undefined) {
                value = Number(value);

                if (endsWith(sImproveDirection, "Minimize") || endsWith(sImproveDirection, "Minimizing")) {
                    if ((toleranceHigh || toleranceHigh === 0) && (deviationHigh || deviationHigh === 0)) {
                        if (value <= parseFloat(toleranceHigh)) {
                            oCriticality.EnumMember = "Positive";
                        } else if (value > parseFloat(deviationHigh)) {
                            oCriticality.EnumMember = "Negative";
                        } else {
                            oCriticality.EnumMember = "Critical";
                        }
                    }
                } else if (endsWith(sImproveDirection, "Maximize") || endsWith(sImproveDirection, "Maximizing")) {
                    if ((toleranceLow || toleranceLow === 0) && (deviationLow || deviationLow === 0)) {
                        if (value >= parseFloat(toleranceLow)) {
                            oCriticality.EnumMember = "Positive";
                        } else if (value < parseFloat(deviationLow)) {
                            oCriticality.EnumMember = "Negative";
                        } else {
                            oCriticality.EnumMember = "Critical";
                        }
                    }
                } else if (endsWith(sImproveDirection, "Target")) {
                    if ((toleranceHigh || toleranceHigh === 0) && (deviationHigh || deviationHigh === 0) && (toleranceLow || toleranceLow === 0) && (deviationLow || deviationLow === 0)) {
                        if (value >= parseFloat(toleranceLow) && value <= parseFloat(toleranceHigh)) {
                            oCriticality.EnumMember = "Positive";
                        } else if (value < parseFloat(deviationLow) || value > parseFloat(deviationHigh)) {
                            oCriticality.EnumMember = "Negative";
                        } else {
                            oCriticality.EnumMember = "Critical";
                        }
                    }
                }
            }
            return criticality2state(oCriticality, oCriticalityConfigValues);
        };
        var calculateTrendDirection = function (aggregateValue, referenceValue, downDifference, upDifference) {
            if (!aggregateValue || !referenceValue) {
                return;
            }
            aggregateValue = Number(aggregateValue);
            if (!upDifference && (aggregateValue - referenceValue >= 0)) {
                return "Up";
            }
            if (!downDifference && (aggregateValue - referenceValue <= 0)) {
                return "Down";
            }
            if (referenceValue && upDifference && (aggregateValue - referenceValue >= upDifference)) {
                return "Up";
            }
            if (referenceValue && downDifference && (aggregateValue - referenceValue <= downDifference)) {
                return "Down";
            }
        };

        var kpiformatter = function (sPath, ovpProperties, bUnit) {
            var oStaticValue = ovpProperties || {},
                kpiValue = sPath;
            var numberFormat = NumberFormat.getFloatInstance({
                minFractionDigits: oStaticValue.NumberOfFractionalDigits,
                maxFractionDigits: oStaticValue.NumberOfFractionalDigits,
                style: "short",
                showScale: true,
                shortRefNumber: kpiValue
            });
            var sNum = numberFormat.format(Number(kpiValue)),
                sNumberScale = numberFormat.getScale() || "";

            if (!bUnit && sNum) {
                var sLastNumber = sNum[sNum.length - 1];
                return sLastNumber === sNumberScale ? sNum.slice(0, sNum.length - 1) : sNum;
            }

            if (bUnit && oStaticValue.percentageAvailable) {
                return sNumberScale + "%";
            }

            if (bUnit && !oStaticValue.percentageAvailable) {
                return sNumberScale;
            }
            return "";
        };

        var formatHeaderUrl = function () {
            var oParams = this.getCard().getCombinedParameters(); // configuration parameters.
            return oParams._headerDataUrl;
        };

        var formatContentUrl = function () {
            var oParams = this.getCard().getCombinedParameters(); // configuration parameters.
            return oParams._contentDataUrl;
        };
        var targetValueFormatter = function (iKpiValue, iTargetValue, oStaticValues) {
            var iValue, iFractionalDigits, iScaleFactor;
            if (isNaN(+iKpiValue)) {
                return "";
            }

            if (iKpiValue == 0) {
                iScaleFactor = iTargetValue;
            } else {
                iScaleFactor = iKpiValue;
            }
            if (oStaticValues.NumberOfFractionalDigits) {
                iFractionalDigits = +(oStaticValues.NumberOfFractionalDigits);
            }
            if (iTargetValue) {
                iValue = iTargetValue;
            } else if (oStaticValues.manifestTarget) {
                iValue = oStaticValues.manifestTarget;
            }

            if (!iFractionalDigits || iFractionalDigits < 0) {
                iFractionalDigits = 0;
            } else if (iFractionalDigits > 2) {
                iFractionalDigits = 2;
            }
            if (iValue) {
                var fnNumberFormat = NumberFormat.getFloatInstance({
                    minFractionDigits: iFractionalDigits,
                    maxFractionDigits: iFractionalDigits,
                    style: "short",
                    showScale: true,
                    shortRefNumber: iScaleFactor
                });
                return fnNumberFormat.format(+(iValue));
            }
        };
        var returnPercentageChange = function (iKpiValue, iTargetValue, oStaticValues) {
            var iFractionalDigits, iReferenceValue;
            if (isNaN(+iKpiValue)) {
                return "";
            }
            iKpiValue = +(iKpiValue);
            if (oStaticValues.NumberOfFractionalDigits) {
                iFractionalDigits = +(oStaticValues.NumberOfFractionalDigits);
            }
            if (iTargetValue) {
                iReferenceValue = +(iTargetValue);
            } else if (oStaticValues.manifestTarget) {
                iReferenceValue = +(oStaticValues.manifestTarget);
            }


            if (!iFractionalDigits || iFractionalDigits < 0) {
                iFractionalDigits = 0;
            } else if (iFractionalDigits > 2) {
                iFractionalDigits = 2;
            }

            if (iReferenceValue) {
                var iPercentNumber = ((iKpiValue - iReferenceValue) / iReferenceValue);
                var fnPercentFormatter = NumberFormat.getPercentInstance({
                    style: 'short',
                    minFractionDigits: iFractionalDigits,
                    maxFractionDigits: iFractionalDigits,
                    showScale: true
                });
                return fnPercentFormatter.format(iPercentNumber);
            }
        };


        var kpiValueCriticality = function (nCriticality) {
            var oCriticality = {};
            oCriticality.EnumMember = "None";
            if (Number(nCriticality) === 1) {
                oCriticality.EnumMember = "Negative";
            } else if (Number(nCriticality) === 2) {
                oCriticality.EnumMember = "Critical";
            } else if (Number(nCriticality) === 3) {
                oCriticality.EnumMember = "Positive";
            }
            return criticality2state(oCriticality, criticalityConstants.ColorValues);
        };
        var formatValueColor = function () {
            var oStaticValues = arguments[arguments.length - 1];
            var index = 1;
            return calculateCriticalityState(
                arguments[0],
                oStaticValues.sImprovementDirection,
                oStaticValues.bIsDeviationLowBinding ? arguments[index++] : oStaticValues.deviationLow,
                oStaticValues.bIsDeviationHighBinding ? arguments[index++] : oStaticValues.deviationHigh,
                oStaticValues.bIsToleranceLowBinding ? arguments[index++] : oStaticValues.toleranceLow,
                oStaticValues.bIsToleranceHighBinding ? arguments[index++] : oStaticValues.toleranceHigh,
                oStaticValues.oCriticalityConfigValues
            );
        };
        var formatTrendIcon = function () {
            var oStaticValues = arguments[arguments.length - 1];
            var index = 1;
            return calculateTrendDirection(
                arguments[0],
                oStaticValues.bIsRefValBinding ? arguments[index++] : oStaticValues.referenceValue,
                oStaticValues.bIsDownDiffBinding ? arguments[index++] : oStaticValues.downDifference,
                oStaticValues.bIsUpDiffBinding ? arguments[index++] : oStaticValues.upDifference
            );
        };

        var formatDateValue = function (sPropertyValue) {
            var result;
            var oStaticValues = arguments[arguments.length - 1],
                sPropertyType = oStaticValues && oStaticValues.propertyType;
            switch (sPropertyType) {
                case "yearmonth":
                    var year = parseInt(sPropertyValue.substr(0, 4), 10),
                        month = sPropertyValue.substr(4),
                        //month attribute in Date constructor is 0-based
                        monthIndex = parseInt(month, 10) - 1;
                    result = new Date(
                        Date.UTC(year, monthIndex)
                    );
                    break;
                case "yearquarter":
                    var year = parseInt(sPropertyValue.substr(0, 4), 10),
                        quarter = sPropertyValue.substr(4),
                        monthFromQuarter = parseInt(quarter, 10) * 3 - 2,
                        //month attribute in Date constructor is 0-based
                        monthIndex = monthFromQuarter - 1;
                    result = new Date(
                        Date.UTC(year, monthIndex)
                    );
                    break;
                case "yearweek":
                    var year = parseInt(sPropertyValue.substr(0, 4), 10),
                        week = sPropertyValue.substr(4),
                        startOfWeekDay = 1 + (parseInt(week, 10) - 1) * 7; // 1st of January + 7 days for each week
                    result = new Date(
                        Date.UTC(year, 0, startOfWeekDay)
                    );
                    break;
                default:
                    break;
            }
            return result;
        };

        var formatDate = function (sDateValue, formatterProperties) {
            if (sDateValue) {
                var oDate = IntegrationUtils.parseJsonDateTime(sDateValue);
                return DateFormat.getInstance(formatterProperties).format(new Date(oDate), formatterProperties.bUTC);
            }
        };

        var formatNumber = function (formatterProperties, textFragments , sValue1, sValue2) {
            var oFormatter;
            if (formatterProperties) {
                formatterProperties.maxFractionDigits = formatterProperties.numberOfFractionalDigits || 0;
                formatterProperties.minFractionDigits = formatterProperties.numberOfFractionalDigits || 0;
                formatterProperties.style = formatterProperties.style || "short"; // default in OVP
                formatterProperties.showScale = formatterProperties.showScale || true;
                formatterProperties.shortRefNumber = formatterProperties.scaleFactor;
                oFormatter = NumberFormat.getFloatInstance(formatterProperties);
            }
            var aParts = [];
            if (!isNaN(parseFloat(sValue1)) && oFormatter) {
                aParts.push(oFormatter.format(sValue1));
            } else {
                aParts.push(sValue1);
            }
            if (!isNaN(parseFloat(sValue2)) && oFormatter) {
                aParts.push(oFormatter.format(sValue2));
            } else {
                aParts.push(sValue2);
            }
            var sFinalValue = "";
            if (textFragments && textFragments.length) {
                textFragments.forEach(function(textFragment) {
                    if (typeof textFragment === 'number') {
                        sFinalValue = sFinalValue + aParts[textFragment];
                    } else {
                        sFinalValue = sFinalValue + textFragment;
                    }
                });
            }
            return sFinalValue;
        };

        var formatCriticality = function (sCriticality, sType) {
            if (sType === "state") {
                switch (String(sCriticality)) {
                    case "1":
                    case "Error":
                        return ValueState.Error;
                    case '2':
                    case "Warning":
                        return ValueState.Warning;
                    case '3':
                    case "Success":
                        return ValueState.Success;
                    case '4':
                    case "Information":
                        return ValueState.Information;
                    default:
                        return ValueState.None;
                }
            }
            if (sType === "color") {
                switch (String(sCriticality)) {
                    case "1":
                    case "Error":
                        return ValueColor.Error;
                    case '2':
                    case "Critical":
                        return ValueColor.Critical;
                    case '3':
                    case "Good":
                        return ValueColor.Good;
                    case '4':
                    case "Neutral":
                        return ValueColor.Neutral;
                    default:
                        return ValueColor.None;
                }
            }
        };

        var getMinMax = function (sPath, sType) {
        // path is kept under 3rd argument to attach watch to trigger this function for every data change
            var aData = this.getCard().getModel().getProperty('/content/d/results') // with batch call
                        || this.getCard().getModel().getProperty('/d/results') // without batch call
                        || [];
            return Math[sType].apply(Math, aData.map(function(o) { return o[sPath];}));
        };

        // Original and properly commented code is here: sap/fe/navigation/NavigationHandler
        var _mixAttributesToSelVariant = function (mSemanticAttributes, oSelVariant, iSuppressionBehavior) {
            var ignoreEmptyString = 1;
            var raiseErrorOnNull = 2;
            var raiseErrorOnUndefined = 4;
            for (var sPropertyName in mSemanticAttributes) {
                if (mSemanticAttributes.hasOwnProperty(sPropertyName)) {
                    var vSemanticAttributeValue = mSemanticAttributes[sPropertyName];
                    if (vSemanticAttributeValue instanceof Date) {
                        vSemanticAttributeValue = vSemanticAttributeValue.toJSON();
                    } else if (Array.isArray(vSemanticAttributeValue) || (vSemanticAttributeValue && typeof vSemanticAttributeValue === "object")) {
                        vSemanticAttributeValue = JSON.stringify(vSemanticAttributeValue);
                    } else if (typeof vSemanticAttributeValue === "number" || typeof vSemanticAttributeValue === "boolean") {
                        vSemanticAttributeValue = vSemanticAttributeValue.toString();
                    }

                    if (vSemanticAttributeValue === "") {
                        if (iSuppressionBehavior & ignoreEmptyString) {
                            oLogger.info("Semantic attribute " + sPropertyName + " is an empty string and due to the chosen Suppression Behiavour is being ignored.");
                            continue;
                        }
                    }

                    if (vSemanticAttributeValue === null) {
                        if (iSuppressionBehavior & raiseErrorOnNull) {
                            throw new oLogger.error("NavigationHandler.INVALID_INPUT");
                        } else {
                            oLogger.warning("Semantic attribute " + sPropertyName + " is null and ignored for mix in to selection variant");
                            continue; // ignore!
                        }
                    }

                    if (vSemanticAttributeValue === undefined) {
                        if (iSuppressionBehavior & raiseErrorOnUndefined) {
                            throw new oLogger.error("NavigationHandler.INVALID_INPUT");
                        } else {
                            oLogger.warning(
                                "Semantic attribute " + sPropertyName + " is undefined and ignored for mix in to selection variant"
                            );
                            continue;
                        }
                    }

                    if (typeof vSemanticAttributeValue === "string" || vSemanticAttributeValue instanceof String) {
                        oSelVariant.addSelectOption(sPropertyName, "I", "EQ", vSemanticAttributeValue);
                    } else {
                        throw new oLogger.error("NavigationHandler.INVALID_INPUT");
                    }
                }
            }
            return oSelVariant;
        };

        // Original and properly commented code is here: sap/fe/navigation/NavigationHandler
        var mixAttributesAndSelectionVariant = function (vSemanticAttributes, sSelectionVariant, iSuppressionBehavior) {
            var oSelectionVariant = new SelectionVariant(sSelectionVariant);
            var oNewSelVariant = new SelectionVariant();

            if (oSelectionVariant.getFilterContextUrl()) {
                oNewSelVariant.setFilterContextUrl(oSelectionVariant.getFilterContextUrl());
            }
            if (oSelectionVariant.getParameterContextUrl()) {
                oNewSelVariant.setParameterContextUrl(oSelectionVariant.getParameterContextUrl());
            }
            if (Array.isArray(vSemanticAttributes)) {
                vSemanticAttributes.forEach(function (mSemanticAttributes) {
                    _mixAttributesToSelVariant(mSemanticAttributes, oNewSelVariant, iSuppressionBehavior);
                });
            } else {
                _mixAttributesToSelVariant(vSemanticAttributes, oNewSelVariant, iSuppressionBehavior);
            }

            var aParameters = oSelectionVariant.getParameterNames();
            var i;
            for (i = 0; i < aParameters.length; i++) {
                if (!oNewSelVariant.getSelectOption(aParameters[i])) {
                    oNewSelVariant.addSelectOption(aParameters[i], "I", "EQ", oSelectionVariant.getParameter(aParameters[i]));
                }
            }

            var aSelOptionNames = oSelectionVariant.getSelectOptionsPropertyNames();
            for (i = 0; i < aSelOptionNames.length; i++) {
                var aSelectOption = oSelectionVariant.getSelectOption(aSelOptionNames[i]);
                if (!oNewSelVariant.getSelectOption(aSelOptionNames[i])) {
                    for (var j = 0; j < aSelectOption.length; j++) {
                        oNewSelVariant.addSelectOption(
                            aSelOptionNames[i],
                            aSelectOption[j].Sign,
                            aSelectOption[j].Option,
                            aSelectOption[j].Low,
                            aSelectOption[j].High
                        );
                    }
                }
            }
            return oNewSelVariant;
        };

        function enhanceVariant(oValue) {
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

        var isJSONData = function (oVariant) {
            try {
                if (JSON.parse(oVariant)) {
                    return true;
                }
            } catch (err) {
                return false;
            }
        };

        var singleAndSimpleFilter = function (aRanges) {
            var bSingleRange = aRanges && aRanges.length === 1,
                oRange = aRanges && aRanges[0];
            return bSingleRange && oRange["Option"] === 'EQ' && !oRange["High"] && oRange["Low"] && oRange["Sign"] === "I";
        };

        /**
         * This is part of scope of W2208 cloud delivery of S4 HANA.
         * This function creates navigation context i.e. navigation parameters, appstate, semantic object and action from
         * card configuration parameters, navigation data (oNavdata received from parameter>state>value) and currentcontext [ in case if content area of card is clicked ].
         *
         * @param {Object} oNavData The navigation data received from parameter>state>value of card manifest
         * @param {Object} oContext The current context in case if content area is clicked
         * @returns {String} The navigation context in stringified format consisting ibnParams [ parameters + app state ] and ibnTarget [ semnatic object + action ] as properties.
         */
        function addPropertyValueToAppState(oNavData, oContext) {
            var oCard = this.getCard().getManifestEntry('sap.card'),
                oCardParams = oCard && oCard.configuration.parameters,
                cardSV = new sap.fe.navigation.SelectionVariant(),
                aFilters = oCardParams._relevantODataFilters.value || [];
            oNavData = oNavData && JSON.parse(oNavData);
            var oSensitiveProps = oNavData && oNavData.sensitiveProps,
                oHeaderIbnParams = oCard && oCard.header.actions[0].parameters.ibnParams,
                oContentIbnParams = oCard && oCard.content.actions[0].parameters.ibnParams;

            aFilters.forEach(function (sFilterName) {
                var bJSONData = isJSONData(oCardParams[sFilterName].value);
                if (bJSONData && !(oSensitiveProps && oSensitiveProps[sFilterName])) {
                    var tempFilterSV = JSON.parse(oCardParams[sFilterName].value);
                    var aRanges = tempFilterSV.SelectOptions.Ranges;
                    if (aRanges && aRanges.length) {
                        var bSingleAndSimpleRange = singleAndSimpleFilter(aRanges);
                        if (oHeaderIbnParams[sFilterName] && oContentIbnParams[sFilterName]) {
                            if (bSingleAndSimpleRange) {
                                oHeaderIbnParams[sFilterName] = aRanges[0].Low;
                                oContentIbnParams[sFilterName] = aRanges[0].Low;
                            } else if (!bSingleAndSimpleRange) {
                                delete oContentIbnParams[sFilterName];
                                delete oHeaderIbnParams[sFilterName];
                                cardSV.massAddSelectOption(sFilterName, aRanges);
                            }
                        } else {
                            cardSV.massAddSelectOption(sFilterName, aRanges);
                        }
                    }
                }
            });
            if (oContext) {
                var aContextKeys = Object.keys(oContext) || [];
                for (var i = 0; i < aContextKeys.length; i++) {
                    if ((oSensitiveProps && oSensitiveProps[aContextKeys[i]]) ||
                        aContextKeys[i] === '__metadata') {
                        delete oContext[aContextKeys[i]];
                    }
                }

                var oSelectionVariant = mixAttributesAndSelectionVariant(oContext, cardSV && cardSV.toJSONObject());
                oSelectionVariant = enhanceVariant(oSelectionVariant.toJSONObject());
                oNavData.selectionVariant = oSelectionVariant;
            }
            if (oNavData && oNavData.sensitiveProps) {
                delete oNavData.sensitiveProps;
            }
            return JSON.stringify(oNavData);
        }

        var formatStringTypeForSemanticDate = function(oValue) {
            var oDateTimeFormat = DateFormat.getDateInstance({
                pattern: "''yyyy-MM-dd'T'HH:mm:ss.SSS'Z'''",
                calendarType: "Gregorian"
            });
            if (oValue) {
                var sValue = oDateTimeFormat.format(oValue, true);
                return String(sValue).replace(/'/g, "");
            }
        };

        var formatDateTimeTypeForSemanticDate = function(oValue) {
            var oDateTimeFormatMs = DateFormat.getDateInstance({
                pattern: "''yyyy-MM-dd'T'HH:mm:ss.SSS''",
                calendarType: "Gregorian"
            });
            var oDate = oValue instanceof Date ? oValue : new Date(oValue);
            var sDateValue = oDateTimeFormatMs.format(oDate);
            return String(sDateValue).replace(/'/g, "");
        };

        var addSelectionOptionForSemanticDate = function(oValue, oCardSV, sParamName) {
            var aRangeValues = [];
            if (oValue.operation === "DATE" && oValue.value1) {
                aRangeValues = DynamicDateUtil.toDates({ values: [oValue.value1], operator : oValue.operation}) || [];
            } else {
                aRangeValues = DynamicDateUtil.toDates({ values: [], operator : oValue.operation}) || [];
            }

            var oValue1 = aRangeValues[0] && aRangeValues[0].oDate;
            var oValue2 = aRangeValues[1] && aRangeValues[1].oDate;
            var sLowValue = "", sHighValue = "";

            if (oValue["sap:filter-restriction"] === "single-value") {
                if (oValue.type === "Edm.DateTime" && oValue1 instanceof Date) {
                    sLowValue = formatDateTimeTypeForSemanticDate(oValue1);
                    if (sLowValue) {
                        oCardSV.massAddSelectOption(sParamName, [{Sign: 'I', Option: oValue.operator, Low: sLowValue, High: null}]);
                    }
                } else if (oValue.type === "Edm.String") {
                    sLowValue = formatStringTypeForSemanticDate(oValue1);
                    if (sLowValue) {
                        oCardSV.massAddSelectOption(sParamName, [{Sign: 'I', Option: oValue.operator, Low: sLowValue, High: null}]);
                    }
                }
            } else if (oValue["sap:filter-restriction"] === "interval") {
                if (oValue.type === "Edm.DateTime") {
                    if (oValue1 instanceof Date) {
                        sLowValue = formatDateTimeTypeForSemanticDate(oValue1);
                    }
                    if (oValue2 instanceof Date) {
                        sHighValue = formatDateTimeTypeForSemanticDate(oValue2);
                    }
                    if (sLowValue && sHighValue) {
                        oCardSV.massAddSelectOption(sParamName, [{Sign: 'I', Option: oValue.operator, Low: sLowValue, High: sHighValue}]);
                    }
                } else if (oValue.type === "Edm.String") {
                    if (oValue1 instanceof Date) {
                        sLowValue = formatStringTypeForSemanticDate(oValue1);
                    }
                    if (oValue2 instanceof Date) {
                        sHighValue = formatStringTypeForSemanticDate(oValue2);
                    }
                    if (sLowValue && sHighValue) {
                        oCardSV.massAddSelectOption(sParamName, [{Sign: 'I', Option: oValue.operator, Low: sLowValue, High: sHighValue}]);
                    }
                }
            }
        };

        function _getURLParametersFromSelectionVariant(vSelectionVariant) {
            var mURLParameters = {};
            var oSelectionVariant;

            if (typeof vSelectionVariant === "string") {
                oSelectionVariant = new SelectionVariant(vSelectionVariant);
            } else if (typeof vSelectionVariant === "object") {
                oSelectionVariant = vSelectionVariant;
            } else {
                throw new NavError("NavigationHandler.INVALID_INPUT");
            }

            // add URLs parameters from SelectionVariant.SelectOptions (if single value)
            var aSelectProperties = oSelectionVariant.getSelectOptionsPropertyNames();
            for (var i = 0; i < aSelectProperties.length; i++) {
                var aSelectOptions = oSelectionVariant.getSelectOption(aSelectProperties[i]);
                if (aSelectOptions.length === 1 && aSelectOptions[0].Sign === "I" && aSelectOptions[0].Option === "EQ") {
                    mURLParameters[aSelectProperties[i]] = aSelectOptions[0].Low;
                }
            }

            // add parameters from SelectionVariant.Parameters
            var aParameterNames = oSelectionVariant.getParameterNames();
            for (var i = 0; i < aParameterNames.length; i++) {
                var sParameterValue = oSelectionVariant.getParameter(aParameterNames[i]);

                mURLParameters[aParameterNames[i]] = sParameterValue;
            }
            return mURLParameters;
        }

        /**
         * This is part of scope of W2302 cloud delivery of S4 HANA.
         * This function creates navigation context i.e. navigation parameters, appstate, semantic object and action from
         * card configuration parameters, navigation data (oNavdata received from parameter>state>value) and currentcontext [ in case if content area of card is clicked ].
         *
         * @param {string} sNavData The navigation data received from parameter>state>value of card manifest
         * @param {Object} oContext The current context in case if content area is clicked
         * @returns {Object} The navigation parameters object consisting ibnParams and ibnTarget as properties in case of IBN navigation.
         */
        function getNavigationContext(sNavData, oContext) {
            var oCard = this.getCard().getManifestEntry('sap.card'),
                oCardParams = oCard && oCard.configuration.parameters,
                oCardSV = new SelectionVariant(),
                aFilters = oCardParams._relevantODataFilters.value || [],
                aMandatoryParams = oCardParams._mandatoryODataParameters.value || [],
                oNavData = sNavData && JSON.parse(sNavData) || {},
                oParameters = oNavData.parameters || {},
                oIbnParams = oParameters.ibnParams || {},
                oSensitiveProps = oIbnParams.sensitiveProps || {};

            var oXAppStateData = {};

            aMandatoryParams.forEach(function(sParamName) {
                var bJSONData = isJSONData(oCardParams[sParamName].value);
                if (bJSONData && !oSensitiveProps[sParamName]) {
                    var oCardMandatoryFilterParamSV = JSON.parse(oCardParams[sParamName].value);
                    if (oCardMandatoryFilterParamSV && oCardMandatoryFilterParamSV.operation) { // Handles Semantic Date Range
                        addSelectionOptionForSemanticDate(oCardMandatoryFilterParamSV, oCardSV, sParamName);
                    }
                }
            });

            aFilters.forEach(function(sFilterName) {
                var bJSONData = isJSONData(oCardParams[sFilterName].value);
                if (bJSONData && !oSensitiveProps[sFilterName]) {
                    var oCardMandatoryFilterParamSV = JSON.parse(oCardParams[sFilterName].value);
                    if (oCardMandatoryFilterParamSV && oCardMandatoryFilterParamSV.operation) { // Handles Semantic Date Range
                        addSelectionOptionForSemanticDate(oCardMandatoryFilterParamSV, oCardSV, sFilterName);
                    } else {
                        var aRanges = oCardMandatoryFilterParamSV.SelectOptions.Ranges || (oCardMandatoryFilterParamSV.SelectOptions && oCardMandatoryFilterParamSV.SelectOptions[0] && oCardMandatoryFilterParamSV.SelectOptions[0].Ranges);
                        if (aRanges && aRanges.length) {
                            var bSingleAndSimpleRange = singleAndSimpleFilter(aRanges);
                            if (bSingleAndSimpleRange) {
                                oIbnParams[sFilterName] = aRanges[0].Low;
                            } else {
                                if (oIbnParams[sFilterName] && !bSingleAndSimpleRange) {
                                    delete oIbnParams[sFilterName];
                                }
                                oCardSV.massAddSelectOption(sFilterName, aRanges);
                            }
                        }
                    }
                }
            });

            var oCurrentContext = oContext || {};
            var aContextKeys = Object.keys(oCurrentContext) || [];
            for (var i = 0; i < aContextKeys.length; i++) {
                if ((oSensitiveProps && oSensitiveProps[aContextKeys[i]]) ||
                    aContextKeys[i] === '__metadata') {
                    delete oCurrentContext[aContextKeys[i]];
                }
            }
            var oSelectionVariant = mixAttributesAndSelectionVariant(oCurrentContext, oCardSV && oCardSV.toJSONObject());
            var mURLParameters = _getURLParametersFromSelectionVariant(oSelectionVariant);
            oSelectionVariant = enhanceVariant(oSelectionVariant.toJSONObject());

            if (oIbnParams.presentationVariant) {
                oXAppStateData["presentationVariant"] = oIbnParams.presentationVariant;
            }

            if (oSelectionVariant.Parameters.length || oSelectionVariant.SelectOptions.length) {
                oXAppStateData["selectionVariant"] = oSelectionVariant;
            }

            if (!oParameters.ibnParams) {
                oParameters.ibnParams = {};
            }

            if (oXAppStateData["selectionVariant"] || oXAppStateData["presentationVariant"]) {
                oParameters.ibnParams["sap-xapp-state-data"] = JSON.stringify(oXAppStateData);
            }

            if (oIbnParams && oIbnParams.sensitiveProps) {
                delete oIbnParams.sensitiveProps;
            }

            for (var key in mURLParameters) {
                oParameters.ibnParams[key] = mURLParameters[key];
            }

            delete oIbnParams.selectionVariant;
            delete oIbnParams.presentationVariant;

            return oNavData.parameters;
        }
        function formatHeaderDataUrlForSemanticDate() {
            var oCard = {"descriptorContent":{}};
            oCard.descriptorContent = this.getCard().getManifestEntry("/");
            var sUrl =  semanticHeaderContentUrl(oCard, "header");
            return sUrl;
        }

        function formatContentDataUrlForSemanticDate() {
            var oCard = {"descriptorContent":{}};
            oCard.descriptorContent = this.getCard().getManifestEntry("/");
            var sUrlPrefix = oCard.descriptorContent["sap.card"]["configuration"]["csrfTokens"]["token1"].data.request.url;
            var sUrl =  semanticHeaderContentUrl(oCard, "content");
            if (oCard.descriptorContent["sap.card"]["data"]["request"] && oCard.descriptorContent["sap.card"]["data"]["request"]["batch"]) {
              return sUrl;
            }
            return sUrlPrefix + "/" + sUrl;
        }

        function semanticHeaderContentUrl (oCard, sType) {
            var oUrl = UrlGenerateHelper.processPrivateParams(oCard, null, true);
            if (sType === "header" && oUrl.header) {
              return  oUrl.header;
            } else if (sType === "content" && oUrl.content) {
              return  oUrl.content;
            }
        }

        return Extension.extend("sap.insights.CardExtension", {
            init: function () {
                Extension.prototype.init.apply(this, arguments);
                this.setFormatters({
                    kpiformatter: kpiformatter,
                    formatHeaderUrl: formatHeaderUrl.bind(this),
                    formatContentUrl: formatContentUrl.bind(this),
                    returnPercentageChange: returnPercentageChange,
                    targetValueFormatter: targetValueFormatter,
                    kpiValueCriticality: kpiValueCriticality,
                    formatValueColor: formatValueColor,
                    formatTrendIcon: formatTrendIcon,
                    formatDateValue: formatDateValue,
                    addPropertyValueToAppState: addPropertyValueToAppState.bind(this),
                    getNavigationContext: getNavigationContext.bind(this),
                    formatDate: formatDate,
                    formatNumber: formatNumber,
                    formatCriticality: formatCriticality,
                    getMinMax: getMinMax.bind(this),
                    formatHeaderDataUrlForSemanticDate: formatHeaderDataUrlForSemanticDate.bind(this),
                    formatContentDataUrlForSemanticDate: formatContentDataUrlForSemanticDate.bind(this)
                });
            },
            loadDependencies: function() {
                var oCard = this.getCard(),
                    sType = oCard.getManifestEntry("/sap.card/type");
                if (sType !== "Analytical") {
                    return Promise.resolve();
                }
                return Core.loadLibrary("sap.viz", { async: true })
                    .then(function () {
                        return new Promise(function (resolve) {
                            sap.ui.require([
                                "sap/insights/OVPChartFormatter"
                            ], function (
                                OVPChartFormatter
                            ) {
                                OVPChartFormatter.registerCustomFormatters();
                                resolve();
                            });
                        });
                    });
            }
        });
    });