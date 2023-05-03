/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define(
    [
        '../utils/SelectionVariantHelper',
        "sap/fe/navigation/SelectionVariant",
        "sap/m/DynamicDateUtil",
        "sap/ui/comp/util/DateTimeUtil",
        "sap/ui/core/format/DateFormat",
        "../utils/AppConstants",
        "sap/ui/model/odata/v2/ODataModel"
    ],
    function (
        SelectionVariantHelper,
        SelectionVariant,
        DynamicDateUtil,
        DateTimeUtil,
        DateFormat,
        AppConstants,
        oDataModel
    ) {
        function processPrivateParams(oCard, oParams, bCardExtension) {
            var oCardParams = oCard.descriptorContent["sap.card"].configuration.parameters;
            var oCardDataRequest =  oCard.descriptorContent["sap.card"]["data"]["request"];
            var hasBatch = false, oHeaderRequest = {}, oContentRequest = {};
            if (oCardDataRequest && oCardDataRequest.batch) {
              hasBatch = true;
              oHeaderRequest = oCardDataRequest.batch.header || {};
              oContentRequest = oCardDataRequest.batch.content || {};
            }
            var oHeaderDataUrl = oCard && oCardParams._headerDataUrl,
            oContentDataUrl = oCard && oCardParams._contentDataUrl;
            var oCardSV = new SelectionVariant();
            var aFilters = oCardParams._relevantODataFilters.value;
            var aParams = oCardParams._relevantODataParameters.value;
            var  oSemanticDateSetting = oCardParams._semanticDateRangeSetting, aSemanticDateFields = [];
            if (oSemanticDateSetting) {
              oSemanticDateSetting = JSON.parse(oSemanticDateSetting.value);
              aSemanticDateFields = Object.keys(oSemanticDateSetting) || [];
            }
            aFilters.forEach(function (sFilterName) {
              var tempFilterSV = new SelectionVariant(oCardParams[sFilterName].value);
              var aSelectOptions = tempFilterSV.getSelectOption(sFilterName);
              var aTest = [];
              if (aSelectOptions && aSelectOptions.length) {
                  if (aSemanticDateFields.includes(sFilterName)) {
                    aTest = formatSemanticDateTime(aSelectOptions[0], "Filter");
                    if (aTest.length) {
                      aSelectOptions[0].Low = aTest[0];
                      aSelectOptions[0].High = aTest[1] ?  aTest[1] : null;
                      if (aSelectOptions[0].Low && aSelectOptions[0].High && aSelectOptions[0].Option !== "BT") {
                        aSelectOptions[0].Option = "BT";
                      }
                      oCardSV.massAddSelectOption(sFilterName, aSelectOptions);
                    } else if (oDataModel && oDataModel.prototype.formatValue && aSelectOptions[0]) {
                      aSelectOptions[0].Low = oDataModel.prototype.formatValue(aSelectOptions[0].Low , "Edm.DateTime");
                      if (aSelectOptions[0].High) {
                        aSelectOptions[0].High = oDataModel.prototype.formatValue(aSelectOptions[0].High , "Edm.DateTime");
                      }
                      oCardSV.massAddSelectOption(sFilterName, aSelectOptions);
                    }
                  } else {
                      if (oDataModel && oDataModel.prototype.formatValue && aSelectOptions[0] && oCardParams[sFilterName].type === "datetime") {
                        aSelectOptions[0].Low = oDataModel.prototype.formatValue(aSelectOptions[0].Low , "Edm.DateTime");
                        if (aSelectOptions[0].High) {
                          aSelectOptions[0].High = oDataModel.prototype.formatValue(aSelectOptions[0].High , "Edm.DateTime");
                        }
                        oCardSV.massAddSelectOption(sFilterName, aSelectOptions);
                      }
                      oCardSV.massAddSelectOption(sFilterName, aSelectOptions);
                  }
              }
            });
            aParams.forEach(function (sParamName) {
              var paramVal = "";
              if (oCardParams[sParamName].value && typeof (oCardParams[sParamName].value) === 'string') {
                paramVal = oCardParams[sParamName].value.toString();
              } else if (oCardParams[sParamName].value.value) {
                paramVal = oCardParams[sParamName].value.value.toString();
              } else if (oCardParams[sParamName].value && oCardParams[sParamName].value instanceof Date) {
                paramVal = oCardParams[sParamName].value;
              }
              if (oCardParams[sParamName].type === "datetime" && !aSemanticDateFields.includes(sParamName) && !paramVal.includes("datetime")){
                if (oDataModel && oDataModel.prototype.formatValue) {
                  paramVal = oDataModel.prototype.formatValue(paramVal, "Edm.DateTime");
                  oCardSV.addParameter(sParamName, paramVal);
                }
              } else if ( oCardParams[sParamName].type === "datetime" && aSemanticDateFields.includes(sParamName)) {
                  paramVal = formatSemanticDateTime(paramVal, "Parameter");
                  oCardSV.addParameter(sParamName, paramVal[0]);
              } else {
                  oCardSV.addParameter(sParamName, paramVal);
              }
            });

            var sEntitySet = oCardParams._entitySet.value;
            var sCommonURL = sEntitySet;

            if (aParams.length) {
              var oCardParamLookup = {};
              aParams.forEach(function (sParamName) {
                oCardParamLookup[sParamName] = oCardParams[sParamName].type;
              });
              sCommonURL += SelectionVariantHelper.getParameterQueryFromSV(oCardSV, oCardParamLookup);
              //in case if Parameters of type datetime are there , the url should be formatted
              var sMatchDateString = sCommonURL;
              if (
                sMatchDateString && Array.isArray(sMatchDateString.match(/%27datetime[a-zA-Z0-9%-:]*[,)%2c]/gm)) &&
                sMatchDateString.match(/%27datetime[a-zA-Z0-9%-:]*[,)%2c]/gm).length
              ) {
                sCommonURL = _formatDateTimeMethod(sMatchDateString);
              }
            }
            if (oCardParams._urlSuffix.value) {
              sCommonURL += oCardParams._urlSuffix.value;
            }

            var oCardFilterLookup = {};
            aFilters.forEach(function (sFilterName) {
              oCardFilterLookup[sFilterName] = oCardParams[sFilterName].type;
            });

            var sFilterQuery = SelectionVariantHelper.getFilterQueryFromSV(oCardSV, oCardFilterLookup);
            var sDateString = sFilterQuery;
            if (
              sDateString && Array.isArray(sDateString.match(/%27datetime[a-zA-Z0-9%-:]*[,)%2c]/gm)) &&
              sDateString.match(/%27datetime[a-zA-Z0-9%-:]*[,)%2c]/gm).length
            ) {
              sFilterQuery = _formatDateTimeMethod(sDateString);
            }

            // card header is optional for a card
            var headerURLparams = "", headerURL = "", contentURLparams = "", contentURL = "", oUrlVal = {"header": "", "content": ""};
            if (hasBatch) {
              headerURLparams = _processURL(oCardParams, "_header", sFilterQuery, oCard.descriptorContent["sap.card"].type);
              headerURL = headerURLparams ? sCommonURL + "?" + headerURLparams : sCommonURL;
              if (oHeaderDataUrl && oHeaderDataUrl.value) {
                var bHasSemanticKeyHeader = bSemanticDateExistsInUrl(aSemanticDateFields, headerURL);
                if (bHasSemanticKeyHeader) {
                  oHeaderRequest.url = "{= extension.formatters.formatHeaderDataUrlForSemanticDate() }";
                  oHeaderDataUrl.value = "";
                } else {
                  oHeaderDataUrl.value = headerURL;
                  if (oParams) {
                    oParams._headerDataUrl = oHeaderDataUrl.value;
                  }
                }
              } else if (oHeaderDataUrl) {
                oUrlVal.header = headerURL;
              }
            }
            if (oCardParams._contentDataUrl) {
              contentURLparams = _processURL(oCardParams, "_content", sFilterQuery, oCard.descriptorContent["sap.card"].type);
              contentURL = contentURLparams ? sCommonURL + "?" + contentURLparams : sCommonURL;
              if (oCardParams._contentDataUrl.value) {
                var bHasSemanticKeyContent = bSemanticDateExistsInUrl(aSemanticDateFields, contentURL);
                if (bHasSemanticKeyContent) {
                  if (hasBatch) {
                    oContentRequest.url = "{= extension.formatters.formatContentDataUrlForSemanticDate() }";
                  } else {
                    oCardDataRequest.url = "{= extension.formatters.formatContentDataUrlForSemanticDate() }";
                  }
                  oContentDataUrl.value = "";
                } else {
                  oContentDataUrl.value = contentURL;
                  if (oParams) {
                    oParams._contentDataUrl = oContentDataUrl.value;
                  }
                }
              } else {
                oUrlVal.content = contentURL;
                return oUrlVal;
              }
              if (bCardExtension) {
                oUrlVal.header = headerURL;
                oUrlVal.content = contentURL;
                return oUrlVal;
              }
            }
        }

        function bSemanticDateExistsInUrl(aSemanticDateFields, sURL) {
          var aKeys = aSemanticDateFields.length ? aSemanticDateFields : [];
          if (aKeys.length && sURL) {
              return aKeys.some(function(sKey) {
                  return sURL && sURL.indexOf(sKey) > -1;
              });
          }
        }

        function _processURL(oCardParams, type, sFilterQuery, sCardType) {
            var aTemp = [];
            if (sFilterQuery) {
              aTemp.push(sFilterQuery);
            }
            if (oCardParams[type + "SelectQuery"] && oCardParams[type + "SelectQuery"].value) {
              aTemp.push(oCardParams[type + "SelectQuery"].value);
            }
            if (oCardParams[type + "ExpandQuery"] && oCardParams[type + "ExpandQuery"].value) {
              aTemp.push(oCardParams[type + "ExpandQuery"].value);
            }
            if (oCardParams[type + "SortQuery"] && oCardParams[type + "SortQuery"].value) {
              var manifestSortQuery = oCardParams[type + "SortQuery"].value;
              aTemp.push(
                decodeURI(manifestSortQuery) === manifestSortQuery
                  ? encodeURI(manifestSortQuery)
                  : manifestSortQuery
              );
            }
            if (sCardType === "Table" || sCardType === "List") {
              aTemp.push("$inlinecount=allpages");
              aTemp.push("$skip=0&$top=13"); // always load 13 for list and table
            } else {
                if (oCardParams[type + "TopQuery"] && oCardParams[type + "TopQuery"].value) {
                    aTemp.push(oCardParams[type + "TopQuery"].value);
                }
                if (oCardParams[type + "SkipQuery"] && oCardParams[type + "SkipQuery"].value) {
                    aTemp.push(oCardParams[type + "SkipQuery"].value);
                }
            }
            return aTemp.length ? aTemp.join("&") : null;
        }

        function _formatDateTimeMethod(sUrl) {
            var iLen = sUrl.match(/%27datetime[a-zA-Z0-9%-:]*[,)%2c]/gm).length;
            var tempFn = function () {
              var sMatchString = sUrl.match(/%27datetime[a-zA-Z0-9%-:]*[,)%2c]/gm)[0];
              var sReplacedString = sMatchString;
              sReplacedString = sReplacedString.replace("%27", "");
              var iLastIndex = sReplacedString.lastIndexOf("%27");
              var sFinalValue =
                sReplacedString.substr(0, iLastIndex) +
                sReplacedString.substr(iLastIndex + 3, sReplacedString.length - 1);
              return sFinalValue;
            };
            for (var i = 0; i < iLen; i++) {
              sUrl = sUrl.replace(sUrl.match(/%27datetime[a-zA-Z0-9%-:]*[,)%2c]/gm)[0], tempFn);
            }
            return sUrl;
        }

        function formatSemanticDateTime(sActualValue, sType) {
          var sOperation, aValues = [], aActualValue = [];
          if (sType === "Parameter") {
              sOperation = sActualValue;
          } else if (sType === "Filter"){
              sActualValue = typeof (sActualValue) === 'string' ? JSON.parse(sActualValue) : sActualValue;
              sOperation = sActualValue.Low;
              if (AppConstants.DATE_OPTIONS.SPECIAL_RANGE.includes(sOperation)) {
                  aValues = sActualValue.High.split(',');
              }
          }
          var aDates;
          if (AppConstants.DATE_OPTIONS.RANGE_OPTIONS.includes(sOperation) || AppConstants.DATE_OPTIONS.SINGLE_OPTIONS.includes(sOperation)) {
            if (sType === "Filter") {
              aDates = DynamicDateUtil.toDates({ values: aValues, operator : sOperation});
              aActualValue.push(aDates[0].oDate);
              aActualValue.push(aDates[1].oDate);
            } else {
              aDates = DynamicDateUtil.toDates({ values: aValues, operator : sOperation});
              aActualValue.push(aDates[0].oDate);
            }
          }
          if (aActualValue.length) {
            aActualValue = convertToDateFormat(aActualValue, true);
            return aActualValue;
          } else if (Date(sActualValue) instanceof Date || sActualValue instanceof Date || Date.parse(sActualValue)) {
            return convertToDateFormat([sActualValue], true); // dont remove
            // return [oDataModel.prototype.formatValue(sActualValue , "Edm.DateTime")];
          }
          return [];
        }

        function convertToDateFormat (aActualValue, bWithPrefix) {
          var oDateTimeFormat;
          aActualValue.forEach(function(oValue, idx) {
            if (oValue.match) {
              if (oValue.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3})Z?$/gm) && oValue.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3})Z?$/gm).length) {
                oValue = new Date(oValue);
              }
            }
            oValue = DateTimeUtil.localToUtc(oValue);
            oValue = DateTimeUtil.normalizeDate(oValue, true);
            if (bWithPrefix) {
              oDateTimeFormat = DateFormat.getDateInstance({
                pattern: "'datetime'''yyyy-MM-dd'T'HH:mm:ss''",
                calendarType: "Gregorian"
              });
              aActualValue[idx] = oDateTimeFormat.format(oValue, true);
            } else {
              var oDateTimeFormatMs = DateFormat.getDateInstance({
                pattern: "''yyyy-MM-dd'T'HH:mm:ss.SSS''",
                calendarType: "Gregorian"
               });
              var oDate = oValue instanceof Date ? oValue : new Date(oValue);
              var sDateValue = oDateTimeFormatMs.format(oDate);
              aActualValue[idx] =  String(sDateValue).replace(/'/g, "");
            }
          });
          return aActualValue;
        }

        function getDateRangeValue(oValue, bIsParameter, sLabel) {
          var aFilterLabel = sLabel;

          if (oValue && bIsParameter) {
            var oConditionInfo = oValue.operator;
            if (oConditionInfo !== "DATE") {
              return oConditionInfo;
            } else {
              return oValue.values[0];
            }
          }

          if (!bIsParameter) {
            var sOperation = oValue.operator;
            var aRanges = oValue.values;
            var sText = "";
            if (sOperation) {
              switch (sOperation) {
                case "DATE":
                case "DATERANGE":
                case "SPECIFICMONTH":
                case "DATETIMERANGE":
                  sText = "";
                  if (typeof aFilterLabel === "string") {
                    sText = aFilterLabel;
                  }
                  var aDates = DynamicDateUtil.toDates(oValue);
                  aRanges = aDates;
                  var aVal = convertToDateFormat(aRanges, false);
                  if (!aVal[1]) {
                    aVal[1] = "";
                  }
                  var oDateRange = {Low: aVal[0], High: aVal[1], Option: "BT", Text: sText};
                  if (oDateRange) {
                      oDateRange.Text = sText;
                      return oDateRange;
                  }
                  break;
                case "FROM":
                case "TO":
                case "FROMDATETIME":
                case "TODATETIME":
                    sText = "";
                    if (typeof aFilterLabel === "string") {
                      sText = aFilterLabel;
                    }
                    var aFTVal = convertToDateFormat(aRanges, false), sOption;
                    sOption = sOperation === "FROM" || sOperation === "FROMDATETIME" ? "GE" : "LE";
                    var oFTDateRange = {Low: aFTVal[0], High: "", Option: sOption, Text: sText};
                    if (oFTDateRange) {
                      oFTDateRange.Text = sText;
                        return oFTDateRange;
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
                  sText = "";
                  if (typeof aFilterLabel === "string") {
                      sText = aFilterLabel;
                  }
                  return {Low: sOperation, High: aRanges[0].toString(), Option : "BT", Text: sText};
                case "TODAYFROMTO":
                  sText = "";
                  if (typeof aFilterLabel === "string") {
                      sText = aFilterLabel;
                  }
                  var Value1 = aRanges && aRanges[0];
                  var Value2 =  aRanges && aRanges[1];
                  return { Low: sOperation, High: Value1.toString() + "," + Value2.toString(), Option: "BT", Text: sText };
                default:
                  sText = "";
                  if (typeof aFilterLabel === "string") {
                    sText = aFilterLabel.substring(0, aFilterLabel.indexOf("(") - 1);
                  }
                  return { Low: sOperation, High: null, Option: "EQ", Text: sText };
              }
            }
          }
        }

        return {
            processPrivateParams: processPrivateParams,
            formatSemanticDateTime: formatSemanticDateTime,
            getDateRangeValue: getDateRangeValue
        };
    });
