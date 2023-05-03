/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define(["sap/base/security/encodeURL", "sap/m/Token", "sap/ui/core/CustomData"], function (encodeURL, Token, CustomData) {
    "use strict";

    /**
     * @param {string} str str
     * @returns {string} Returns Str wrapped with Brackets
     */
    var wrapBrackets = function (str) {
        return "(" + str + ")";
    };

    /**
     * @param {string} existingStr existingStr
     * @param {string} newStr newStr
     * @param {string} sign sign
     * @returns {string} Returns String
     */
    var addLogicalOPerator = function (existingStr, newStr, sign) {
        var sOperator = "or";
        var sTempStr = newStr;
        if (sign === "E") {
            // sTempStr = ["not", wrapBrackets(newStr)].join(" ");
            sOperator = "and";
        }
        if (existingStr === "") {
            return sTempStr;
        }
        return [existingStr, sOperator, sTempStr].join(" ");
    };
    var getTransformedValue = function (value, type) {
        if (type === "number") {
            return value + "m";
        }
        if (!(type === "integer" || type === "boolean" || type === "datetime")) {
            return "'" + value + "'";
        }
        return value;
    };

    /**
     * @param {string} sProperty sProperty
     * @param {Array} aSelctOptions aSelctOptions
     * @param {string} sign sign
     * @param {string} type type
     * @returns {string} Returns String
     */
    var getFilterQueryFromSimpleSelectOptions = function (sProperty, aSelctOptions, sign, type) {
        var sExistingString = "";
        aSelctOptions.forEach(function (oSelectOption) {
            var newString;
            switch (oSelectOption.Option) {
                case "BT":
                    newString = wrapBrackets([sProperty, "ge", getTransformedValue(oSelectOption.Low, type), "and", sProperty, "le", getTransformedValue(oSelectOption.High, type)].join(" "));
                    break;
                case "CP":
                    newString = "substringof(" + getTransformedValue(oSelectOption.Low, type) + "," + sProperty + ")";
                    break;
                default:
                    newString = [sProperty, oSelectOption.Option.toLowerCase(), getTransformedValue(oSelectOption.Low, type)].join(" ");
                    break;
            }
            sExistingString = addLogicalOPerator(sExistingString, newString, sign);
        });
        return sExistingString;
    };

    /**
     * @param {string} sProperty sProperty
     * @param {Array} aSelctOptions aSelctOptions
     * @param {string} type type
     * @returns {string} Returns String
     */
    var getFilterQueryFromSelectOptions = function (sProperty, aSelctOptions, type) {
        var aSimple = [], aNegation = [];
        aSelctOptions.forEach(function (oSelectOption) {
            if (oSelectOption.Sign === "I") {
                if (oSelectOption.Option === "NE") {
                    aNegation.push(oSelectOption);
                } else {
                    aSimple.push(oSelectOption);
                }
            } else {
                if (oSelectOption.Option === "NE") {
                    aSimple.push(oSelectOption);
                } else {
                    aNegation.push(oSelectOption);
                }
            }
        });
        var str1 = getFilterQueryFromSimpleSelectOptions(sProperty, aSimple, "I", type);
        var result = [];
        if (str1) {
            result.push(wrapBrackets(str1));
        }
        var str2 = getFilterQueryFromSimpleSelectOptions(sProperty, aNegation, "E", type);
        if (str2) {
            result.push(wrapBrackets(str2));
        }
        return result.join(" and ");
    };

    /**
     * @param {Object} oSV oSV
     * @param {Object} olookup olookup
     * @returns {string} Returns String
     */
    var getFilterQueryFromSV = function (oSV, olookup) {
        var aFilterStrings = [];
        oSV.getSelectOptionsPropertyNames().forEach(function (sProperty) {
            aFilterStrings.push(getFilterQueryFromSelectOptions(sProperty, oSV.getSelectOption(sProperty), olookup[sProperty]));
        });
        return aFilterStrings.length ? "$filter=" + encodeURL(aFilterStrings.join(" and ")) : null;
    };

    /**
     * @param {Object} oSV oSV
     * @param {Object} olookup olookup
     * @returns {string} Returns String
     */
    var getParameterQueryFromSV = function (oSV, olookup) {
        var str = "";
        oSV.getParameterNames().forEach(function (sParam) {
            if (str !== "") {
                str += ",";
            }
            str += sParam + "=";
            var temp = oSV.getParameter(sParam);

            str += getTransformedValue(temp, olookup[sParam]);
        });
        return str === "" ? null : wrapBrackets(encodeURL(str));
    };

    /**
     * @param {Object} oSelectOption oSelectOption
     * @returns {string} Returns String
     */
    var _getOperationAdaptor = function (oSelectOption) {
        var sOpertator = oSelectOption.Option;
        switch (oSelectOption.Option) {
            case "CP":
                var str = oSelectOption.Low;
                var isStart = str.indexOf("*") === 0;
                var isEnd = str.indexOf("*", 1) === str.length - 1;
                if (isStart && !isEnd) {
                    sOpertator = "StartsWith";
                } else if (!isStart && isEnd) {
                    sOpertator = "EndsWith";
                } else if (isStart && isEnd) {
                    sOpertator = "Contains";
                }
                break;
            case "EQ":
                if (oSelectOption.Low === "") {
                    sOpertator = "Empty";
                }
                break;
        }
        return sOpertator;
    };

    /**
     * @param {Object} oSelectOption oSelectOption
     * @param {string} sPropertyName sPropertyName
     * @returns {sap.ui.core.CustomData} sap.ui.core.CustomData
     */
    var _getCustomDataForToken = function (oSelectOption, sPropertyName) {
        return new CustomData({
            key: "range",
            value: {
                exclude: oSelectOption.Sign === "E",
                keyField: sPropertyName,
                operation: _getOperationAdaptor(oSelectOption),
                value1: oSelectOption.Option === "CP" ? oSelectOption.Low.replace(/\*/g, "") : oSelectOption.Low,
                value2: oSelectOption.High
            }
        });
    };

    /**
     * @param {Array} aSelectOption aSelectOption
     * @param {string} sPropertyName sPropertyName
     * @returns {Array} Returns Array
     */
    var getTokenFromSelectOptions = function (aSelectOption, sPropertyName) {
        var aTokens = [];
        var range = 0;
        aSelectOption.forEach(function (oSelectOption) {
            var text = "";
            var key = "";
            switch (oSelectOption.Option) {
                case "BT":
                    text += oSelectOption.Low + " .. " + oSelectOption.High;
                    key = "range_" + range++;
                    break;
                case "CP":
                    text += oSelectOption.Low;
                    key = "range_" + range++;
                    break;
                case "EQ":
                    if (oSelectOption.Low === "") {
                        text += "<EMPTY>";
                        key = "<EMPTY>";
                    } else {
                        text += oSelectOption.Text ? oSelectOption.Text : oSelectOption.Low;
                        key = oSelectOption.Low;
                    }
                    break;
                case "NE":
                    text += "!" + oSelectOption.Low;
                    key = "range_" + range++;
                    break;
                case "GT":
                    text += ">" + oSelectOption.Low;
                    key = "range_" + range++;
                    break;
                case "GE":
                    text += ">=" + oSelectOption.Low;
                    key = "range_" + range++;
                    break;
                case "LT":
                    text += "<" + oSelectOption.Low;
                    key = "range_" + range++;
                    break;
                case "LE":
                    text += "<=" + oSelectOption.Low;
                    key = "range_" + range++;
                    break;
            }
            if (oSelectOption.Sign === "E") {
                text = "!" + wrapBrackets(text);
            }
            var oToken = new Token({
                key: key,
                text: oSelectOption.Text ? oSelectOption.Text : text
            });
            if (key !== oSelectOption.Low) {
                oToken.addCustomData(_getCustomDataForToken(oSelectOption, sPropertyName));
            }
            oToken.addCustomData(new CustomData({
                key: "selectOption",
                value: oSelectOption
            }));
            aTokens.push(oToken);
        });
        return aTokens;
    };

    /**
     * @returns {string} Returns String
     */
    var getEmptySVStringforProperty = function () {
        var oSV = new sap.fe.navigation.SelectionVariant();
        return oSV.toJSONString();
    };

    /**
     * @returns {string} Returns select option text
     */
    var generateTextDescr = function (oSelectOption) {
        switch (oSelectOption.Option) {
            case "BT":
                oSelectOption.Text += oSelectOption.Low + " .. " + oSelectOption.High;
                break;
            case "EQ":
                if (oSelectOption.Low === ""){
                    oSelectOption.Text += "<EMPTY>";
                } else {
                    oSelectOption.Text += oSelectOption.Low;
                }
                break;
            case "NE":
                oSelectOption.Text +=  "!" + oSelectOption.Low;
                break;
            case "GT":
                oSelectOption.Text += ">" + oSelectOption.Low;
                break;
            case "GE":
                oSelectOption.Text += ">=" + oSelectOption.Low;
                break;
            case "LT":
                oSelectOption.Text += "<" + oSelectOption.Low;
                break;
            case "LE":
                oSelectOption.Text += "<=" + oSelectOption.Low;
                break;
            default:
                oSelectOption.Text +=  oSelectOption.Low;
                break;
        }
        return oSelectOption.Text;
    };


    /**
     * @param {Object} oRange oRange
     * @returns {Object} Returns Object
     */
    var getSelectOptionFromRange = function (oRange, sText) {
        var oSelectOption = {
            "Sign": oRange.exclude ? "E" : "I",
            "Option": oRange.operation,
            "Low": oRange.value1.toString(),
            "High": oRange.value2 ? oRange.value2.toString() : "",
            "Text": sText ? sText : ""
        };
        switch (oRange.operation) {
            case "Contains":
                oSelectOption.Option = "CP";
                if (oRange.value1) {
                    oSelectOption.Low = "*" + oRange.value1 + "*";
                }
                break;
            case "StartsWith":
                oSelectOption.Option = "CP";
                if (oRange.value1) {
                    oSelectOption.Low = oRange.value1 + "*";
                }
                break;
            case "EndsWith":
                oSelectOption.Option = "CP";
                if (oRange.value1) {
                    oSelectOption.Low = "*" + oRange.value1;
                }
                break;
            case "Empty":
                oSelectOption.Option = "EQ";
                oSelectOption.Low = "";
                break;
        }
        if (!oSelectOption.Text) {
            oSelectOption.Text = generateTextDescr(oSelectOption);
        }
        return oSelectOption;
    };

    return {
        getFilterQueryFromSV: getFilterQueryFromSV,
        getParameterQueryFromSV: getParameterQueryFromSV,
        getTokenFromSelectOptions: getTokenFromSelectOptions,
        getEmptySVStringforProperty: getEmptySVStringforProperty,
        getSelectOptionFromRange: getSelectOptionFromRange
    };
});