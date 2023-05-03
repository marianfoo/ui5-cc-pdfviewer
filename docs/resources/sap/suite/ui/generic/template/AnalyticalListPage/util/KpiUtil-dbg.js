sap.ui.define([
	"sap/ui/base/Object",
	"sap/suite/ui/generic/template/AnalyticalListPage/util/V4Terms",
	"sap/ui/core/Locale",
	"sap/ui/core/format/NumberFormat",
	"sap/ui/model/FilterOperator",
	"sap/suite/ui/generic/template/genericUtilities/FeLogger"
], function(BaseObject, V4Terms, Locale, NumberFormat, FilterOperator, FeLogger) {
		"use strict";
	    var oLogger = new FeLogger("AnalyticalListPage.util.KpiUtil").getLogger();
		var KpiUtil = BaseObject.extend("sap.suite.ui.generic.template.AnalyticalListPage.util.KpiUtil");

		/**
		 * [getNumberValue parses the oValue into the number value based on the type ]
		 * @param  {object} oValue [value]
		 * @return {number}        [returns the value in the number format  ]
		 */
		KpiUtil.getNumberValue = function (oValue) {
		//Here the oValue obj always returns one key which is either of value present in the array.
			if (oValue) {
				var val = Object.keys(oValue)[0];
				return (oValue && val && ["String","Int","Decimal","Double","Single"].indexOf(val) !== -1 ) ? Number(oValue[val]) : undefined;
			}
		};
		/**
		 * [getBooleanValue  get the boolean value ]
		 * @param  {object} oValue   [Value]
		 * @param  {boolean} bDefault [default value ]
		 * @return {boolean}          [returns true/false based on the value]
		 */
		KpiUtil.getBooleanValue = function(oValue, bDefault){
			if (oValue && oValue.Bool) {
				if (oValue.Bool.toLowerCase() === "true") {
					return true;
				} else if (oValue.Bool.toLowerCase() === "false") {
					return false;
				}
			}
			return bDefault;
		};


		/**
		 * [getPrimitiveValue returns the value with respective type]
		 * @param  {object} oValue [description]
		 * @return {*}        [returns the primitive type]
		 */
		KpiUtil.getPrimitiveValue = function (oValue) {
			var value;

			if (oValue) {
				if (oValue.String !== undefined) {
					value = oValue.String;
					//in case of i18n strings, value = "{@i18n>DATAPOINT_TITLE}" this does not resolve to a string value in formatter
					//so return only datapoint title
					value = (value.indexOf(">") > 0) ? value.split("{")[1].split("}")[0] : value;
					//value = value.split("")
				} else if (oValue.Bool) {
					value = KpiUtil.getBooleanValue(oValue);
				} else if (oValue.EnumMember){
					value = oValue.EnumMember.split("/")[1];
				} else {
					value = KpiUtil.getNumberValue(oValue);
				}
			}
			return value;
		};

		/**
		 * [getPathOrPrimitiveValue returns the path of the oItem ]
		 * @param  {object} oModel [model name against which path to be verified]
		 * @param  {object} oItem     [oItem]
		 * @return {*}           [returns the path or its primitive Value]
		 */
		KpiUtil.getPathOrPrimitiveValue = function (oItem) {
			if (oItem) {
				return (oItem.Path) ? "{path:'" + oItem.Path + "'}" : KpiUtil.getPrimitiveValue(oItem);
			} else {
				return "";
			}
		};
	/**
	 * [isBindingValue  ]
	 * @param  {object}  oValue [value]
	 * @return {Boolean}        [returns true or false]
	 */
	KpiUtil.isBindingValue = function(oValue) {
		return (typeof oValue === "string") && oValue.charAt(0) === "{";
	};

	KpiUtil.getNumberFormatter = function(showMeasure, scale, maxFractionDigits) {
		var fixedInteger = NumberFormat.getIntegerInstance({
			style: "short",
			minFractionDigits: 0,
			maxFractionDigits: maxFractionDigits,
			showScale: showMeasure,
			shortRefNumber: scale
		});
		return fixedInteger;
	};

	KpiUtil.determineThousandsRefNumber = function(scaleFactor) {
		var shiftedFactor = scaleFactor;

		if (scaleFactor >= 1000) {
			var thousandsCount = 0;
			while (shiftedFactor >= 1000) {
				shiftedFactor /= 1000;
				thousandsCount++;
			}
			return thousandsCount == 0 ? undefined : thousandsCount * 1000;
		} else {
			return undefined;
		}
	};

	/**
	 * [formatNumberForPresentation formats the absolute number value]
	 * @param  {object} oValue                   [value to be formatted]
	 * @param  {boolean} bIsPercent               [if the value is % based wont allow NumberFormat to scale ]
	 * @param  {number} nNumberOfFractionalDigits [numberOfFractionalDigits from the datapoint annotation for the enityset]
	 * @return {sap.ui.core.format.NumberFormat}	[returns the float instance of the NumberFormat]
    */
	KpiUtil.formatNumberForPresentation = function(oValue, nNumberOfFractionalDigits, bIsPercent) {
		var num = Number(oValue);
		var sCurrentLocale = sap.ui.getCore().getConfiguration().getLanguage();
		var oCurrentLocale = new Locale(sCurrentLocale);
		var oNumberFormat = NumberFormat.getFloatInstance({
			style: bIsPercent ? undefined : "short",
			showScale: bIsPercent ? undefined : true,
			minFractionDigits: 0,
			maxFractionDigits: 1,
			decimals: nNumberOfFractionalDigits
		}, oCurrentLocale).format(num) ;
		return oNumberFormat;
	};

	/**
	 * [getUnitofMeasure checks for unit of measure]
	 * @param  {object} oModel [Context   current context]
	 * @param  {object} oEntityTypeProperty [enity property for the respective entity type and enity set]
	 * @return {string}      [returns the Unit of Measure]
	 */
	KpiUtil.getUnitofMeasure = function(oModel, oEntityTypeProperty) {
		return (oEntityTypeProperty && (oEntityTypeProperty["Org.OData.Measures.V1.ISOCurrency"] || oEntityTypeProperty["Org.OData.Measures.V1.Unit"])) ? oEntityTypeProperty["Org.OData.Measures.V1.ISOCurrency"] || oEntityTypeProperty["Org.OData.Measures.V1.Unit"] : "";
	};


	/**
	 * [isRelative checks if the passed datapoint is relative]
	 * @param  {object}  oDataPoint [data point annotation]
	 * @return {Boolean}            [returns true/false]
	 */
	KpiUtil.isRelative = function(oDataPoint) {
		var trendCalc = oDataPoint.TrendCalculation;
		var relative = false;
		if (trendCalc) {
			var defaultVal = trendCalc.IsRelativeDifference.DefaultValue;
			relative = KpiUtil.getBooleanValue(trendCalc.IsRelativeDifference, defaultVal ? ({
				"true": true,
				"false": false
			})[defaultVal.toLowerCase()] : false);
		}
		return relative;
	};

	/**
	 * [getFilter creates a filter object out of select options ranges ]
	 * @param  {object}  oRange [Range object of Ranges]
	 * @return {object}  [filter object as jsobject]
	 */
	KpiUtil.getFilter = function(oRange, oSelectOption, sPropertyName) {
		//create the filter. the Low value is mandatory
		var oFilter;
		if (!sPropertyName) {
			oFilter = {
				path: oSelectOption.PropertyName.PropertyPath,
				operator: oRange.Option.EnumMember.split("/")[1],
				value1: oRange.Low.String,
				value2: oRange.High ? oRange.High.String : "",
				sign: oRange.Sign.EnumMember === V4Terms.SelectionRangeSignType + "/I" ? "I" : "E"
			};
		} else {
			oFilter = {
				path: sPropertyName,
				operator: oRange.Option,
				value1: oRange.Low,
				value2: oRange.High,
				sign: oRange.Sign
			};
		}
		// exclude sign is supported only with EQ operator
		if (oFilter.sign === "E" && oFilter.operator !== FilterOperator.EQ) {
			oLogger.error("Exclude sign is supported only with EQ operator");
			return;
		} else {
			// aFilters will be used later in the flow to create filter object. (sap.ui.model.Filter),
			// that does not support sign property, so the sign property will be ignored later in the flow.

			if (oFilter.sign === "E" && oFilter.operator === FilterOperator.EQ) {
				oFilter.operator = FilterOperator.NE;
				oFilter.sign = "I";
			}
		}

		if (oFilter.operator === "CP" && !oSelectOption) {
			var sInternalOperation = FilterOperator.Contains;
			var sValue = oFilter.value1;
			if (sValue) {
				var nIndexOf = sValue.indexOf('*');
				var nLastIndex = sValue.lastIndexOf('*');

				// only when there are '*' at all
				if (nIndexOf > -1) {
					if ((nIndexOf === 0) && (nLastIndex !== (sValue.length - 1))) {
						sInternalOperation = FilterOperator.EndsWith;
						sValue = sValue.substring(1, sValue.length);
					} else if ((nIndexOf !== 0) && (nLastIndex === (sValue.length - 1))) {
						sInternalOperation = FilterOperator.StartsWith;
						sValue = sValue.substring(0, sValue.length - 1);
					} else {
						sValue = sValue.substring(1, sValue.length - 1);
					}
				}
			}
			oFilter.operator = sInternalOperation;
			oFilter.value1 = sValue;
		}

		return oFilter;
	};

	/**
	 * Function to update the processing status of supplied KPI in the global Kpi list
	 * @param oKpi
	 * @param bProcessed
	 */
	KpiUtil.updateKpiList = function (oKpi, bProcessed) {
		try {
			//Fetch list at KPI level
			var oList = this.getKpiList(oKpi.getModelName(), oKpi.getGroupId(), oKpi.getId());
			oList.bProcessed = bProcessed;
		} catch (oError) {
			oLogger.error("KPI processing failed: " + oKpi.getId() + " : " + oError);
		}
	};

	/**
	 * Function to add the supplied kpi to the global kpi list
	 * Second parameter oKpi is required to fetch any default values in case
	 * mSettings are not provided (from manifest)
	 * @param mSettings
	 * @param oKpi
	 * @private
	 */
	KpiUtil.addToKpiList = function (mSettings, oKpi) {
		try {
			var sGroupId, sModel, sKpiId;
			sModel = mSettings.modelName;
			sGroupId = mSettings.groupId || oKpi.getGroupId();
			sKpiId = mSettings.id;

			//Create a map for models, groups under a model and Kpi under a group
			this.oKpiList = this.oKpiList || {};
			var oKpiListModel = this.oKpiList[sModel] = this.oKpiList[sModel] || {};
			oKpiListModel[sGroupId] = oKpiListModel[sGroupId] || {};
			oKpiListModel[sGroupId][sKpiId] = {
				bProcessed: false
			};
		} catch (oError) {
			oLogger.error("KPI processing failed: " + sKpiId + " : " + oError);
		}
	};

	/**
	 * Function to return the global koi list, level of returned list will depend on
	 * supplied arguments
	 * @param sModelName
	 * @param sGroupId
	 * @param sKpiId
	 * @returns {*|{}}
	 */
	KpiUtil.getKpiList = function (sModelName, sGroupId, sKpiId) {
		var oList = this.oKpiList;
		if (sModelName || sModelName === "") {
			oList = oList[sModelName];
			if (sGroupId) {
				oList = oList[sGroupId];
				if (sKpiId) {
					oList = oList[sKpiId];
				}
			}
		}
		return oList;
	};
	return KpiUtil;
}, true);
