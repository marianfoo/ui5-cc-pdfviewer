sap.ui.define([
	"sap/ui/core/Control",
	"sap/ui/model/Sorter",
	"sap/ui/model/analytics/odata4analytics",
	"sap/suite/ui/generic/template/AnalyticalListPage/util/FilterUtil",
	"sap/ui/core/format/NumberFormat",
	"sap/suite/ui/generic/template/AnalyticalListPage/util/V4Terms",
	"sap/ui/core/format/DateFormat",
	"sap/suite/ui/generic/template/genericUtilities/FeLogger",
	"sap/suite/ui/generic/template/AnalyticalListPage/util/CriticalityUtil",
	"sap/suite/ui/generic/template/listTemplates/listUtils",
	"sap/base/util/extend",
	"sap/base/util/deepExtend"
], function(Control, Sorter, oData4Analytics, FilterUtil, NumberFormat, v4Terms, DateFormat, FeLogger, CriticalityUtil, ListUtils, extend, deepExtend) {
	"use strict";

	var oLogger = new FeLogger("AnalyticalListPage.control.visualfilterbar.FilterItemMicroChart").getLogger();
	var CHART_TYPE_DONUT = "Donut";
	var CHART_TYPE_LINE = "Line";
	var CHART_TYPE_BAR = "Bar";
	var IS_OTHERS = "__IS_OTHER__";

	var FilterItemChart = Control.extend("sap.suite.ui.generic.template.AnalyticalListPage.control.visualfilterbar.FilterItemMicroChart", {
		metadata: {
			properties: {
				selectFilters: { type: "any", group: "Misc", defaultValue: null },
				filterRestriction : { type: "string", group: "Misc", defaultValue: null },
				entitySet: { type: "string", group: "Misc", defaultValue: null },
				lazyLoadVisualFilter: { type: "boolean", group: "Misc", defaultValue: true },
				dimensionField: { type: "string", group: "Misc", defaultValue: null },
				dimensionFieldIsDateTime: { type: "boolean", group: "Misc", defaultValue: false },
				dimensionFieldIsDateTimeOffset: { type: "boolean", group: "Misc", defaultValue: false },
				dimensionFieldDisplay: { type: "string", group: "Misc", defaultValue: null },
				dimensionFilter: { type: "any", group: "Misc", defaultValue: null },
				dimensionFilterExternal: { type: "sap.ui.model.Filter", group: "Misc", defaultValue: null },
				measureField: { type: "string", group: "Misc", defaultValue: null },
				unitField: { type: "string", group: "Misc", defaultValue: null },
				isCurrency: { type: "boolean", group: "Misc", defaultValue: false },
				isMandatory: { type: "boolean", group: "Misc", defaultValue: false },
				isDropDown: { type: "boolean", group: "Misc", defaultValue: false },
				width: {type: "sap.ui.core.CSSSize", group: "Dimension", defaultValue : null},
				height: {type: "sap.ui.core.CSSSize", group: "Dimension", defaultValue : null},
				title: { type: "string", group: "Misc", defaultValue: "" },
				outParameter: { type: "string", group: "Misc", defaultValue: null },
				inParameters: { type: "object[]", group: "Misc", defaultValue: null},
				parentProperty: { type: "string", group: "Misc", defaultValue: null },
				sortOrder: { type: "object[]", group: "Misc", defaultValue: null},
				scaleFactor : {type: "string", group: "Misc", defaultValue: null},
				numberOfFractionalDigits: {type: "string", group: "Misc", defaultValue: null},
				textArrangement: {type: "string", group: "Misc", defaultValue: sap.ui.comp.smartfilterbar.DisplayBehaviour.descriptionAndId},
				chartQualifier: {type: "string", group: "Misc", defaultValue: null},
				smartFilterId: { type: "string", group: "Misc", defaultValue: null},
				isParameter: { type: "boolean", group: "Misc", defaultValue: false },
				stringdate: { type: "string", group: "Misc", defaultValue: "" } //dummy property
			},
			aggregations: {
				control: {type: "sap.ui5.controls.microchart", multiple: false}
			},
			events: {
				filterChange: {},
				titleChange: {},
				beforeRebindVisualFilter: {}
			}
		},

		renderer: {
			apiVersion: 2,
			render: function(oRm, oControl) {
				oRm.openStart("div", oControl);
				oRm.style("width", "100%");
				document.body.classList.contains("sapUiSizeCozy") ? oRm.style("height", "9.9rem") : oRm.style("height", "7.9rem");// Increasing the height of the visual filter chart to make it interactive in cozy formfactor
				oRm.openEnd();
				oRm.renderControl(oControl.getAggregation("control"));
				oRm.close("div");
			}
		}
	});

	FilterItemChart.prototype._formattingId = "__UI5__ShortIntegerMaxFraction2";
	FilterItemChart.prototype._maxFractionalDigits = 2;
	FilterItemChart.prototype._maxFractionalDigitsValsLessThanZero = 7; // limit to 7 decimal places, e.g. if scale is B and value is 700 will show 0.0000007, if value is 70, the shortened value will be 0.
	FilterItemChart.prototype._minFractionalDigits = 0;
	//FilterItemChart.prototype._shortRefNumber;
	FilterItemChart.prototype._isTriggeredBySync = false;
	FilterItemChart.prototype._multiUnit = false;
	FilterItemChart.prototype.technicalIssueMessage = "M_VISUAL_FILTERS_ERROR_DATA_TEXT";
	FilterItemChart.prototype.noDataIssueMessage = "NO_DATA_FOUND_OVERLAY_MESSAGE";
	// FilterItemChart.prototype.requiredFilterMessage = "REQUIRED_FIELDS_OVERLAY_MESSAGE";
	FilterItemChart.prototype.multipleCurrencyMessage = "M_VISUAL_FILTERS_MULTIPLE_CURRENCY";
	FilterItemChart.prototype.multipleUnitMessage = "M_VISUAL_FILTERS_MULTIPLE_UNIT";
	FilterItemChart.prototype.hiddenMeasureMessage = "M_VISUAL_FILTER_HIDDEN_MEASURE";
	FilterItemChart.prototype.invalidMeasureForDonutMessage = "INVALID_MEASURE_DONUT_MESSAGE";
	FilterItemChart.prototype.valuehelpAllMandatoryFilters = {};
	FilterItemChart.prototype.oDataQueryOptions = ["$select", "$top", "$expand", "$inlinecount", "$orderby", "$filter", "$skip", "$format"];
	FilterItemChart.prototype.missingMandatoryField = "M_VISUAL_FILTERS_PROVIDE_FILTER_VAL_SINGLEVF";
	FilterItemChart.prototype.missingMultipleMandatoryFields = "M_VISUAL_FILTERS_PROVIDE_FILTER_VAL_MULTIPLEVF";

	FilterItemChart.prototype.init = function() {
		this._bAllowBindingUpdateOnPropertyChange = false;
		this._attachChartEvents();
	};

	FilterItemChart.prototype._attachChartEvents = function() {
		var me = this;
		this._chart.addEventDelegate({
			onAfterRendering : function () {
				if (me._getChartAggregations().length) {
					// if multi unit show overlay
					if (me._multiUnit) {
						var dimLabel = FilterUtil.getPropertyNameDisplay(me.getModel(), me.getEntitySet(), me.getDimensionField(), me.getModel("@i18n"));
						me.applyOverlay((me.getIsCurrency() ? me.multipleCurrencyMessage : me.multipleUnitMessage), dimLabel);
						if (me.data("isDialogFilterItem") === "true") {
							FilterUtil._updateVisualFilterAria(me.getParent().getParent());
						}
					}
				}
			}
		});

		this._chart.attachSelectionChanged(this._onSelectionChanged, this);
	};

	FilterItemChart.prototype._getCurrentSelectedChart = function(bReturnChartType) {
		if (this._chart.getPoints) {
			return bReturnChartType ? CHART_TYPE_LINE : "point";
		} else if (this._chart.getSegments) {
			return bReturnChartType ? CHART_TYPE_DONUT : "segment";
		} else if (this._chart.getBars) {
			return bReturnChartType ? CHART_TYPE_BAR : "bar";
		}
	};

	FilterItemChart.prototype._getCustomData = function(ev) {
		var sCurrentSelectedChartType = this._getCurrentSelectedChart();
		var aCurrentItem = (sCurrentSelectedChartType) ? ev.getParameter(sCurrentSelectedChartType) : undefined;
		if (sCurrentSelectedChartType && aCurrentItem) {
			var aCustomData = aCurrentItem.getCustomData(),
				oValue = aCustomData[0].getValue(),
				sDimField;
			if (oValue instanceof Date) {
				oValue = (this.getDimensionFieldIsDateTimeOffset()) ? oValue : FilterUtil.convertLocalDatetoUTCDate(oValue);
			} else if (this.getDimensionFieldIsDateTime() && this._isStringDateType() == "yearmonth") {
				sDimField = oValue;
			} else if (aCurrentItem.getLabel() === this._getI18nText("NOT_ASSIGNED")) {
				sDimField = "";
			} else {
				sDimField = aCurrentItem && aCurrentItem.getLabel();
			}
			var data = {
				dimValue: oValue,
				dimValueDisplay: sDimField
			};
			return data;
		}
	};

	FilterItemChart.prototype._getEntityParameters = function(oModel, entitySet) {
		var allParams = {};
		if (this.getSmartFilterId()) { //if it has referance to smart filter bar
			var oSmartFilterBar = sap.ui.getCore().byId(this.getSmartFilterId());
			var aSVParameters =  ListUtils.getSelectionVariantParameterNamesWithoutNavigation(this.getSelectFilters() && this.getSelectFilters().Parameters);
			var oSFBParams = oSmartFilterBar.getEntitySet() === entitySet ? oSmartFilterBar.getAnalyticalParameters() : [];
			var aSVSelectOptions = this.getSelectFilters() && this.getSelectFilters().SelectOptions;
			var bSearchable = this.checkSearchable(oModel, entitySet, oSmartFilterBar, aSVParameters, aSVSelectOptions);
			if (bSearchable.aMandatoryFilter.length === 1) {
				this.applyOverlay(this.missingMandatoryField, bSearchable.aMandatoryFilter[0]);
				return;
			}
			if (!bSearchable.bIsMandatoryFilter) {
				this.applyOverlay(this.missingMultipleMandatoryFields);
				return;
			}
			if (aSVParameters) {
				aSVParameters.forEach(function(oParam) {
					allParams[oParam.PropertyName.PropertyPath] = oParam.PropertyValue.String;
				});
			}
			if (oSFBParams) {
				var oSelectionVariantParameters = oSmartFilterBar.getUiState().getSelectionVariant().Parameters;
				var oParamData = {};
				oSelectionVariantParameters && oSelectionVariantParameters.map(function (oElement) {
				    oParamData[oElement.PropertyName] = oElement.PropertyValue;
				});
				var oDateFormatSettings = JSON.parse(oSmartFilterBar.data('dateFormatSettings'));
				oSFBParams.forEach(function(param) {
					var sValue = oParamData[param.name];
					if (sValue) {
						if (param.type === "Edm.Time" && sValue instanceof Date) {
							if (oDateFormatSettings && !oDateFormatSettings.UTC) {
								sValue = new Date(sValue.valueOf() + sValue.getTimezoneOffset() * 60 * 1000);
							}
							sValue = {
								__edmType: "Edm.Time",
								ms: (((sValue.getHours() * 60) + sValue.getMinutes()) * 60 + sValue.getSeconds()) * 1000 + sValue.getMilliseconds()
							};
						} else if (oDateFormatSettings && oDateFormatSettings.UTC && sValue instanceof Date) {
							sValue = this._getDateInUTCOffset(sValue);
						} else if (isNaN(sValue) && !isNaN(Date.parse(sValue)) && sValue.indexOf("Z") !== (sValue.length - 1)) {
							sValue = sValue.split('T')[0] + "T00:00:00Z";
						}
						//values set for parameters in SFB; allowed to override values from SV for a given parameter
						allParams[param.name] = sValue;
					} else if (param.type === 'Edm.String' && param["sap:parameter"] === "optional") {
						allParams[param.name] = "";
					}
				}.bind(this));
			}
			return allParams;
		}
		return;
	};

	//this method prepares the data that is to be passed to visual filter rebind extension method and then triggers it.
	FilterItemChart.prototype._executeRebindVisualFilterExtension = function(entityName, dimField, measureField, filterList, oEntityParameters) {
		var oEvt = {
			sEntityType: entityName,
			sDimension: dimField,
			sMeasure: measureField,
			oContext: {
				filters: filterList,
				queryParameters:{},
				sorters: this._sorters,
				entityParameters: oEntityParameters,
				groupId: undefined
			}
		};

		this.fireBeforeRebindVisualFilter(oEvt);
		return oEvt.oContext;
	};

	FilterItemChart.prototype._onSelectionChanged = function(ev) {
		var oEventVisualFilterData = ev.getSource().getParent().getBindingContext('_visualFilterDialogModel');
		if (oEventVisualFilterData) {
			var oEventProps = oEventVisualFilterData.getObject('component');
			oEventProps.properties.activeVisualFilters = ev.getParameter("selected");
		}
		var sFilterRestriction = this.getFilterRestriction(),
		oCustomData = this._getCustomData(ev),
		bSelected = ev.getParameter("selected"),
		bClearOtherSelection = (sFilterRestriction === "single" && oCustomData.dimValue === IS_OTHERS && bSelected);
		if (oCustomData.dimValue === IS_OTHERS && bSelected && this.getIsDropDown()) {
			ev.getParameter("segment").setSelected(false);
			return;
		}
		if (bClearOtherSelection) {
			ev.getParameter("segment").setSelected(false);
		}
		if (bSelected && oCustomData.dimValue === IS_OTHERS && sFilterRestriction === "multiple" || (bSelected && oCustomData.dimValue !== IS_OTHERS )) {
			this._onChartSelectData(ev);
		} else if (!bSelected) {
			this._onChartDeselectData(ev);
		}
	};

	/**
	 * Triggered on selection of chart data point also triggers change to content area on chart selection
	 *
	 * @param {event} ev - event triggered by selecting data point
	 * @returns {void}
	 *
	 * @private
	 */
	FilterItemChart.prototype._onChartSelectData = function(ev) {
		var oDimensionFilter,
		sFilterRestriction = this.getFilterRestriction();

		if (sFilterRestriction === "multiple") {
			oDimensionFilter = deepExtend({items: [], ranges: [], value: null}, this.getDimensionFilter());
			var oData = this._getCustomData(ev),
			sChartType = this._getCurrentSelectedChart(true);
			// if chart type is donut
			if (sChartType === CHART_TYPE_DONUT) {
				oDimensionFilter = this._applyDonutChartSelections(oData, oDimensionFilter);
			} else if (oData.dimValue instanceof Date) {
				oDimensionFilter.ranges.push({
					exclude: false,
					keyField: this.getDimensionField(),
					operation: "EQ",
					value1:  oData.dimValue,
					value2: null
				});
			} else if (oData.dimValue === "") {
				oDimensionFilter.ranges.push({
					exclude: false,
					keyField: this.getDimensionField(),
					operation: "Empty",
					value1: oData.dimValue,
					value2: null
				});
			} else {
				oDimensionFilter.items.push({
					key: oData.dimValue,
					text: oData.dimValueDisplay // oData.dimValueDisplay comes with TextArrangement from custome data so applying directly.
				});
			}
		} else {
			oDimensionFilter = this.getDimensionFilter();
			// single-value
			if (oDimensionFilter) {
				// if there is a filter, remove it and add the new filter for filter restriction single value
				oDimensionFilter = null;

				var aSelectedChartAggregation = ev.getParameter("bar") || ev.getParameter("point") || ev.getParameter("segment");
				this._setSelectedAggregation(aSelectedChartAggregation);
				aSelectedChartAggregation.setSelected(true);
			}
			//var oData = aDataList[0].data;
			var oData = this._getCustomData(ev);
			if (this.getDimensionFieldIsDateTime() && this.getDimensionFilter() instanceof Object) { //incase of DDR control SFB expect the below format
				oDimensionFilter = deepExtend({}, this.getDimensionFilter());
				oDimensionFilter.conditionTypeInfo.data.operation = "DATE";
				if (this._isStringDateType() == "yearmonthday") {
					oDimensionFilter.conditionTypeInfo.data["value1"] = FilterUtil.formatStringDate(oData.dimValue);
				} else {
					oDimensionFilter.conditionTypeInfo.data["value1"] = oData.dimValue;
				}
				oDimensionFilter.ranges = [];
			} else {
				oDimensionFilter = oData.dimValue;
			}
		}

		this.setDimensionFilter(oDimensionFilter); // set without calling setDimensionFilter so that the selected points don't get reapplied
		// Fire filter change of filter item
		// handle in _onFilterChange in SmartVisualFilterBar.js
		this.fireFilterChange();
	};

	FilterItemChart.prototype._setSelectedAggregation = function (aSelectedChartAggregation) {
		var setSelectedAggregation = this._chart.setSelectedBars || this._chart.setSelectedPoints || this._chart.setSelectedSegments;
		setSelectedAggregation.call(this._chart, aSelectedChartAggregation);
	};

	FilterItemChart.prototype._getChartAggregations = function () {
		// determine aggregation function and call it to get all chart aggregations
		var getChartAggregations = this._chart.getPoints || this._chart.getSegments || this._chart.getBars;
		return getChartAggregations.call(this._chart);
	};

	FilterItemChart.prototype._onChartDeselectData = function(ev) {
		var me = this;
		//var sDimensionFieldDisplay = this.getDimensionFieldDisplay(),
		var oDimensionFilter,
		sFilterRestriction = this.getFilterRestriction(),
		//aDataList = ev.getParameter('data'),
		//oData = aDataList[0].data,
		oData = this._getCustomData(ev),
		aUpdatedDimensionFilterItems = [],
		aUpdatedDimensionFilterRanges = [];
		if (sFilterRestriction === "single") {
			// set to null
			oDimensionFilter = null;
		} else {
			oDimensionFilter = deepExtend({}, this.getDimensionFilter());
			var aDimensionFilterItems = (oDimensionFilter && oDimensionFilter.items) ? oDimensionFilter.items : undefined,
			aDimensionFilterRanges = (oDimensionFilter && oDimensionFilter.ranges) ? oDimensionFilter.ranges : undefined,
			sDimensionFilterValue = (oDimensionFilter && oDimensionFilter.value) ? oDimensionFilter.value : null;
			// consider items
			if (aDimensionFilterItems) {
				aDimensionFilterItems.forEach(function(element) {
					var sElementKey = FilterUtil.getResolvedDimensionValue(element.key),
						sDimValue = FilterUtil.getResolvedDimensionValue(oData.dimValue);
					if (sElementKey !== sDimValue) {
						aUpdatedDimensionFilterItems.push(element);
					}
				});
			}
			oDimensionFilter.items = aUpdatedDimensionFilterItems;
			// consider value
			if (sDimensionFilterValue) {
				if (oData.dimValue === sDimensionFilterValue) {
					oDimensionFilter.value = null;
				}
			}
			// consider ranges EQ
			if (aDimensionFilterRanges) {
				aDimensionFilterRanges.forEach(function(element) {
					if (element.operation === "EQ" && oData.dimValue !== IS_OTHERS && element.exclude) {
						aUpdatedDimensionFilterRanges.push(element);
					} else if (element.operation === "EQ" && !element.exclude) {
						//To-Do : Suggestion, @jitin we could try to make a another util to compare two Dates.
						//More general which take the med or large as parameter.
						//we could remove this if provided its handled with undefined case. Hence, keeping it time being
						//Please recheck if this change works properly for you BLI.
						//Had to do it and your changes were breaking Donut deselection scenario.
						if (element.value1 instanceof Date && oData.dimValue instanceof Date) {
							if (me.getDimensionFieldIsDateTimeOffset()) {
								if (FilterUtil.getDateTimeInMedium(element.value1) !== FilterUtil.getDateTimeInMedium(oData.dimValue)) {
									aUpdatedDimensionFilterRanges.push(element);
								}
							} else if (FilterUtil.getDateInMedium(element.value1) !== FilterUtil.getDateInMedium(oData.dimValue)) {
								aUpdatedDimensionFilterRanges.push(element);
							}
						} else if (typeof element.value1 === "string" && oData.dimValue instanceof Date) {
							if (FilterUtil.getDateTimeInMedium(new Date(element.value1)) !== FilterUtil.getDateTimeInMedium(oData.dimValue)) {
								aUpdatedDimensionFilterRanges.push(element);
							}
						} else if (element.value1 !== oData.dimValue) {
							aUpdatedDimensionFilterRanges.push(element);
						}
					} else if (element.operation !== "EQ" && !element.exclude && element.value1 !== oData.dimValue) {
						aUpdatedDimensionFilterRanges.push(element);
					}
				});
			}
			oDimensionFilter.ranges = aUpdatedDimensionFilterRanges;
		}
		this.setDimensionFilter(oDimensionFilter); // set without calling setDimensionFilter so that the selected points don't get reapplied
		// Fire filter change of filter item
		// handle in _onFilterChange in SmartVisualFilterBar.js
		this.fireFilterChange();
	};

	FilterItemChart.prototype._updateBinding = function() {
		if (FilterUtil.isVisualFilterLazyLoaded(this)) {
			return;
		}
		this.applyOverlay();
		// Set Chart to busy before rebinding
		this._chart.setBusy(true);
		var sChartType = this._getCurrentSelectedChart(true);
		var bIsChartDonut = sChartType === CHART_TYPE_DONUT;
		//calling the unding event based on chart type
		if (sChartType === CHART_TYPE_LINE) {
			this._chart.unbindPoints();
		} else if (sChartType === CHART_TYPE_BAR) {
			this._chart.unbindBars();
		} else if (bIsChartDonut) {
			this._chart.unbindSegments();
		}

		// Make sure all binding are available
		var entityName = this.getEntitySet(),
		dimField = this.getDimensionField(),
		dimFieldDisplay = this.getDimensionFieldDisplay(),
		measureField = this.getMeasureField(),
		unitField = this.getUnitField(),
		filter = this.getDimensionFilterExternal(),
		aSortFields = [],
		aSortOrder = this.getSortOrder(),
		oModel = this.getModel(),
		oMetaModel = oModel.getMetaModel(),
		oSortObject = this._getSorter(aSortOrder);
		this._sorters = oSortObject.sorter;
		aSortFields = oSortObject.sortFields;
		if (!entityName || !measureField || !dimField || !dimFieldDisplay) {// All fields must be present
			return;
		}
		if (this._determineHiddenVisualFilter(oMetaModel, entityName, measureField)) {
			var measureLabel = FilterUtil.getPropertyNameDisplay(oModel, entityName, measureField, this.getModel("@i18n"));
			this.applyOverlay(this.hiddenMeasureMessage, measureLabel);
			return;
		}
		if (unitField) {
			var unitFieldText = FilterUtil.getUnitFieldText(this.getModel(), entityName, unitField);
			if (unitFieldText && FilterUtil.IsNavigationProperty(this.getModel(), entityName, unitFieldText)) {
				var navPropertyForUnitField = unitFieldText.split("/")[0];
			}
		}
		//Non Accumulative measure will not be supported for Donut chart. Bringing up the overlay in this case
		if (bIsChartDonut) {
			if (this._determineIfInvalidMeasure(oMetaModel, entityName, measureField)) {
				this.applyOverlay(this.invalidMeasureForDonutMessage);
				return;
			}
		}
		var selectFields = [measureField, dimField],
		navProperty = FilterUtil.IsNavigationProperty(this.getModel(), entityName, dimFieldDisplay) ? dimFieldDisplay.split("/")[0] : null,
		aNavigationPropertyKeys = FilterUtil.getKeysForNavigationEntitySet(oMetaModel, this.getEntitySet(), navProperty),
		selectFields = FilterUtil.getVisualFilterSelectFields(measureField, dimField, dimFieldDisplay, unitField, aSortFields, aNavigationPropertyKeys,  unitFieldText);
		//filter defined for donut chart total read call
		var filtersForTotal = (bIsChartDonut && this._inParameterFilterList && this._inParameterFilterList.aFilters && this._inParameterFilterList.aFilters.length) ? [this._inParameterFilterList] : [];
		var filterList = [];
		if (filter && filter.aFilters && filter.aFilters.length > 0) {
			filterList = [filter];
		}

		var me = this;
		var count = (!bIsChartDonut) && this.getFixedCount();

		var oModel = this.getModel(),
		oVisualFilterModel = this.getModel("visualFilter") || oModel;
		//this method gets all the entity parameters. Also checks if the visual filter is searchable or not.
		var oEntityParameters = this._getEntityParameters(oModel, entityName);

		//checks if the visual filter is searchable or not
		//if the visual filter is not searchable then oEntityParameters is returned as undefined otherwise as an object
		if (!(oEntityParameters instanceof Object)) {
			return;
		}

		//this method prepares the data for passing to the visual filter extension and fires the visual filter event
		var oExtensionContext = this._executeRebindVisualFilterExtension(entityName, dimField, measureField, filterList, oEntityParameters),
			sGroupID = oExtensionContext.groupId,
			sBindingPath = "/" + entityName;
		// odata call to get top 4 data
		if (oModel) {
			var oDatapoint = CriticalityUtil.getDataPoint(oModel, this);
			this.setNumberOfFractionalDigits(null);
			if (oDatapoint) {
				(oDatapoint.ValueFormat && oDatapoint.ValueFormat.ScaleFactor) ? this.setScaleFactor(FilterUtil.getPrimitiveValue(oDatapoint.ValueFormat.ScaleFactor)) : this.setScaleFactor(null);
				(oDatapoint.ValueFormat && oDatapoint.ValueFormat.NumberOfFractionalDigits) ? this.setNumberOfFractionalDigits(FilterUtil.getPrimitiveValue(oDatapoint.ValueFormat.NumberOfFractionalDigits)) : this.setNumberOfFractionalDigits(null);
				var aRelativeToProperties = CriticalityUtil.getCriticalityRefProperties(oDatapoint);
			}
			//this method is used to create binding path for the visual filter
			sBindingPath = this._getBindingPathforVisualFilter(oModel, entityName, oEntityParameters);
			if (!sBindingPath) {
				return;
			}
			//To abort the previous read requests before calling read() again for Line and bar chart calls
			if (this._oObject) {
				this._oObject.abort();
			}

			//To abort the previous read requests before calling read() again for donut chart top 4 read call
			if (this._oTop4ReadObject) {
			    this._oTop4ReadObject.abort();
			}
			//To abort the previous read requests before calling read() again for donut chart total read call
			if (this._oTotalReadObject) {
			    this._oTotalReadObject.abort();
			}
			//To check is the property type is integer to set number of fractional digits to Zero
			if (this._determineInteger(oMetaModel, entityName, measureField)){
				this.setNumberOfFractionalDigits(0);
			}
			var oUrlParameters = {};
			//common odata binding info object
			var oDataBindingInfo = {
				async: true,
				filters: filterList,
				urlParameters: oUrlParameters
			};
			if (sGroupID) {
				oDataBindingInfo.groupId = sGroupID;
			}
			if (!bIsChartDonut) { //for line and bar chart
				extend(oDataBindingInfo, {
					sorters: this._sorters,
					success: function(data, response) {
						me._oObject = null;
						if (oDatapoint && (oDatapoint.Criticality || oDatapoint.CriticalityCalculation)) {
							data = CriticalityUtil.CalculateCriticality(oDatapoint, data, me.getMeasureField());
						} else {
							data = CriticalityUtil.CalculateDimensionCriticality(oModel, me.getDimensionField(), me.getEntitySet(), data);
						}
						me._onDataReceived(data);
					},
					error: function(oError) {
						oLogger.error("Error reading URL:" + oError.message);
						if (oError && oError.statusCode !== 0 && oError.statusText !== "abort") {
							me.applyOverlay(me.technicalIssueMessage);
							me._oObject = null;
						}
					}
				});
				this._updateBindingInfo(oDataBindingInfo, selectFields, aRelativeToProperties, count, oExtensionContext, navProperty, navPropertyForUnitField, bIsChartDonut);

				this._fetchData(oVisualFilterModel, sBindingPath, oDataBindingInfo, bIsChartDonut);
			} else { //for donut chart
				//update binding info for total data call
				this._updateBindingInfo(oDataBindingInfo, [measureField], aRelativeToProperties, 1, oExtensionContext, navProperty, navPropertyForUnitField, bIsChartDonut, true, filtersForTotal);
				var oTotalDataPromise = this._fetchData(oVisualFilterModel, sBindingPath, oDataBindingInfo, bIsChartDonut, true, oDatapoint);

				//setting filters of binding info to filter list as update binding info will change the object while updating fot total data read call
				oDataBindingInfo.filters = filterList;

				//updating binding info for top4 data call
				this._updateBindingInfo(oDataBindingInfo, selectFields, aRelativeToProperties, 4, oExtensionContext, navProperty, navPropertyForUnitField, bIsChartDonut, false);
				var oTop4DataPromise = this._fetchData(oVisualFilterModel, sBindingPath, oDataBindingInfo, bIsChartDonut, false, oDatapoint);

				// jQuery.when either waits for all promises to be resolved before executing handler, or
				// it executes the handler as soon as any promise is rejected,i.e., results in an error
				// For the sake of performance and code simplicity, even if one query fails we show technical issue overlay, and
				// we are not covering the scenario where total query might fail and top4 query will result in <=3 data
				/*eslint-disable */
				Promise.all([oTop4DataPromise, oTotalDataPromise]).then(function(data) {
				/*eslint-enable */
					// all promsises are resolved
					// promise resolution is received as an array, index 0 is data and 1 is length
					var aTop4Data = data[0].data;
					var aTop4DataLength = data[0].iDataLength;
					var aTotalData = data[1].data;
					var aTotalDataLength = data[1].iDataLength;
					if (!aTop4DataLength) {
						// No Data overlay should show if top4data length === 0
						me.applyOverlay(me.noDataIssueMessage);
					} else if (aTop4DataLength <= 3) {
						// chart should show if top4 data length <3
						me._onDataReceived(aTop4Data);
					} else if (aTop4DataLength > 3) {
						// chart should show if top4 data length > 3 and total data length > 0
						if (aTotalDataLength) {
							// show chart
							me._onDataReceived(aTop4Data, aTotalData);
						} else {
							// show no data overlay
							me.applyOverlay(me.noDataIssueMessage);
						}
					}
				}, function(errorData){
					var oError = errorData.error;
					var bToFetchTotalData = errorData.bToFetchTotalData;
					if (!oError || (oError.statusCode !== 0 && oError.statusText !== "abort")) {
						if (bToFetchTotalData === true) {
							me._oTotalReadObject = null;
						} else {
							me._oTop4ReadObject = null;
						}
						// any one promise is rejected
						// show technical overlay in case of failure
						me.applyOverlay(me.technicalIssueMessage);
					}
				});
			}
		}
	};

	//this function updates the Odata Binding info based on the chart type and return the updated object
	FilterItemChart.prototype._updateBindingInfo = function(oDataBindingInfo, selectFields, aRelativeToProperties, count, oExtensionContext, navProperty, navPropertyForUnitField, bIsChartDonut, bToFetchTotalData, filtersForTotal) {
		oDataBindingInfo.urlParameters = {
			"$select":  aRelativeToProperties ? [aRelativeToProperties].concat(selectFields).join(",") : selectFields.join(","),
			"$top": count
		};

		//adding query parameters to urlParameters that are added in onBeforeRebindVisualFilterExtension
		if (Object.keys(oExtensionContext.queryParameters).length > 0) {
			Object.keys(oExtensionContext.queryParameters).forEach(function(sKey) {
				//check - key should not be $select, $top, $expand, $inlinecount, $orderby, $filter, $skip
				if (this.oDataQueryOptions.indexOf(sKey) < 0) {
					oDataBindingInfo.urlParameters[sKey] = oExtensionContext.queryParameters[sKey];
				}
			}.bind(this));
		}

		if (bIsChartDonut ? (navProperty && !bToFetchTotalData) : navProperty) {
			extend(oDataBindingInfo.urlParameters, {"$expand": navProperty});
		}

		if (bIsChartDonut ? (navPropertyForUnitField && !bToFetchTotalData) : navPropertyForUnitField) {
			extend(oDataBindingInfo.urlParameters, {"$expand": navPropertyForUnitField});
		}

		if (bIsChartDonut && (!bToFetchTotalData)) {
			//Only set if its a top4Data call
			oDataBindingInfo.sorters = this._sorters;
		} else if (bIsChartDonut && bToFetchTotalData) {
			oDataBindingInfo.filters = filtersForTotal;
		}

	};

	//this function make read calls for chart. If the chart type is donut then returns a promise
	FilterItemChart.prototype._fetchData = function(oVisualFilterModel, sBindingPath, oDataBindingInfo, bIsChartDonut, bToFetchTotalData, oDatapoint) {
		var me  = this;

		if (bIsChartDonut) {
			return new Promise(function (fnresolve, fnreject) {
				if (!oVisualFilterModel) {
					// set rejected
					fnreject({error: null, bToFetchTotalData: bToFetchTotalData});
				}

				oDataBindingInfo.success = function(data, response) {
					if (bToFetchTotalData === true) {
						me._oTotalReadObject = null;
					} else {
						me._oTop4ReadObject = null;
					}
					//set resolved
					if (oDatapoint && (oDatapoint.Criticality || oDatapoint.CriticalityCalculation)) {
						data = CriticalityUtil.CalculateCriticality(oDatapoint, data, me.getMeasureField());
					} else if (!bToFetchTotalData) {
						data = CriticalityUtil.CalculateDimensionCriticality(me.getModel(), me.getDimensionField(), me.getEntitySet(), data);
					}
					var iDataLength = (data && data.results && data.results.length) ? data.results.length : 0;
					fnresolve({data: data, iDataLength:iDataLength});
				};
				oDataBindingInfo.error = function(error, bToFetchTotalData) {
					// set rejected
					fnreject({error: error, bToFetchTotalData: bToFetchTotalData});
				};

				if (bToFetchTotalData) {
					me._oTotalReadObject = oVisualFilterModel.read(sBindingPath, oDataBindingInfo);
				} else {
					me._oTop4ReadObject = oVisualFilterModel.read(sBindingPath, oDataBindingInfo);
				}
			});

		}

		//read call for line and bar chart
		this._oObject = oVisualFilterModel.read(sBindingPath, oDataBindingInfo);

	};

	/**
	*Function returns two arrays, an array of contructors for sorting and an array of sort order properties
	*params {[objects]} aSortOrder array of sortOrder property from annotations
	*return {object} oSorters Object that consists of array of construcotrs for sortig and array of sort order properties
	*/
	FilterItemChart.prototype._getSorter = function(aSortOrder) {
		var aSortFields = [], aSortDescending = [], aSorters = [];
		//For each type of sortOrder, we save the sortOrder Type and Ascending/descending values into  two arrays. Elements of these arrays are then passed into Sorter()
		for (var i = 0; i < aSortOrder.length; i++) {
			aSortFields[i] = aSortOrder[i].Field.String;
			aSortDescending[i] = aSortOrder[i].Descending.Boolean;
			aSorters.push(new Sorter(aSortFields[i], aSortDescending[i]));
		}
		var oSorter = {sorter : aSorters, sortFields: aSortFields};
		return oSorter;
	};

	FilterItemChart.prototype._getNumberFormatter = function(iShortRefNumber) {
		var fixedInteger = NumberFormat.getIntegerInstance({
			style: "short",
			showScale: false,
			shortRefNumber: iShortRefNumber
		});

		return fixedInteger;
	};

	FilterItemChart.prototype.setWidth = function(width) {
		this.setProperty("width", width);
	};

	FilterItemChart.prototype.setHeight = function(height) {
		this.setProperty("height", height);
	};

	FilterItemChart.prototype.setEntitySet = function(sEntitySetName) {
		this.setProperty("entitySet", sEntitySetName);
	};

	FilterItemChart.prototype.setDimensionField = function(dimensionField) {
		this.setProperty("dimensionField", dimensionField);
	};

	FilterItemChart.prototype.setDimensionFieldIsDateTime = function(dimensionFieldIsDateTime) {
		this.setProperty("dimensionFieldIsDateTime", dimensionFieldIsDateTime);
	};

	FilterItemChart.prototype.setDimensionFieldDisplay = function(dimensionFieldDisplay) {
		this.setProperty("dimensionFieldDisplay", dimensionFieldDisplay);
	};

	FilterItemChart.prototype.setMeasureField = function(measureField) {
		if (measureField && measureField.constructor === Object) {
			if (measureField.value) {
				this.setProperty("measureField", measureField.value);
			}
			if (measureField.bUpdateBinding) {
				this._updateBinding();
			}
		} else if (measureField && measureField.constructor === Array) {
			this.setProperty("measureField", measureField);
		} else {
			this.setProperty("measureField", measureField);
		}
	};

	FilterItemChart.prototype.setUnitField = function(unitField) {
		this.setProperty("unitField", unitField);
	};
	/**
	*Set Sortorder property so that chart data can be sorted
	*@param{array} sortOrder - Array of sortOrder Property objects from annotations
	*@return{void}
	*/
	FilterItemChart.prototype.setSortOrder = function(sortOrder) {
		if (sortOrder && sortOrder.constructor === Object) {
			if (sortOrder.value) {
				this.setProperty("sortOrder", sortOrder.value);
			}
			if (sortOrder.bUpdateBinding) {
				this._updateBinding();
			}
		} else if (sortOrder && sortOrder.constructor === Array) {
			this.setProperty("sortOrder", sortOrder);
		} else {
			this.setProperty("sortOrder", sortOrder);
		}
	};
	/**
	 * Set external dimension Filters so that the filter item can be rendered
	 *
	 * @param {array} filter - array of filters
	 * @param {boolean} bIsTriggeredBySync - whether filter was triggered by sync or not
	 * @returns {void}
	 */
	FilterItemChart.prototype.setDimensionFilterExternal = function(filter) {
		this.setProperty("dimensionFilterExternal", filter);
		if (this._bAllowBindingUpdateOnPropertyChange) {
			this._updateBinding();
		}
	};

	/**
	*Function returns config object with all the below mentioned properties.
	*return {object} Config object is returned by the object.
	*/
	FilterItemChart.prototype.getP13NConfig = function() {
		var aPropList = [
			"width", "height","filterRestriction", "isDropDown","sortOrder", "measureField", "scaleFactor", "numberOfFractionalDigits", "chartQualifier",
			"entitySet", "dimensionField", "dimensionFieldDisplay", "dimensionFieldIsDateTime", "dimensionFilter", "unitField", "isCurrency", "isMandatory", "outParameter", "inParameters", "parentProperty"
		];

		// simple properties
		var oConfig = {};
		for (var i = 0; i < aPropList.length; i++) {
			var name = aPropList[i];
			oConfig[name] = this.getProperty(name);
			if ((name == "outParameter" || name == "inParameters") && oConfig[name] == "") {
				oConfig[name] = undefined;
			}
		}

		return oConfig;
	};

	FilterItemChart.prototype.setDimensionFilter = function(dimFilter, bIsChartInteraction) {
		this.setProperty("dimensionFilter", dimFilter, true);
	};

	FilterItemChart.prototype._onDataReceived = function(data) {
		if (!data) {
			return;
		}
		this.data("sOverlay", "none"); //for visual filter bar aria handled by onTitleChange() only
		if (!this.getParent()) {
			this.data("needsToUpdateAria", "true"); //for visual filter dialog filter item
		} else {
			this.data("needsToUpdateAria", "false"); //not needed for visual filter bar
			if (this.data("isDialogFilterItem") === "true") {
				FilterUtil._updateVisualFilterAria(this.getParent().getParent());
			}
		}
		this._determineUnit(data);
		this._getShortRefNumber(data.slice(0));
	};

	/**
	* @private
	* This function determine unit and set it.
	*	@param{array} data list from which unit determination to be done
	* @return{void}
	*/
	FilterItemChart.prototype._determineUnit = function (data){
		this._multiUnit = false;
		var unitField = this.getUnitField();
		if (unitField) {
			var prevUnit = data[0][unitField];
			for (var i = 1; i < data.length; i++) {
				//Others category in donut chart is not considered for unit determination
				if (data[i].dimensionValue !== IS_OTHERS){
					var unit = data[i][unitField];
				}
				if (unit != prevUnit) {
					if (data.length > 1){
						this._multiUnit = true;
					}
					break;
				}
				prevUnit = unit;
			}
			var unitFieldText = FilterUtil.getUnitFieldText(this.getModel(), this.getEntitySet(), unitField);
			if (unitFieldText && FilterUtil.IsNavigationProperty(this.getModel(), this.getEntitySet(), unitFieldText)) {
				var sUnitFieldText1 = unitFieldText.split("/")[0],
					sUnitFieldText2 = unitFieldText.split("/")[1];
				this._applyUnitValue(this._multiUnit ? "" : prevUnit + " (" + data[0][sUnitFieldText1][sUnitFieldText2] + ")");
				return;
			}
			if (unitFieldText) {
				unitFieldText = data[0][unitFieldText];
				this._applyUnitValue(this._multiUnit ? "" : prevUnit + " (" + unitFieldText + ")");
			} else {
				//Get the unit text from ValueHelp
				this._getUnitTextFromValueList(unitField, prevUnit);
			}
		} else {
			// no unit field, so no unit displayed in title
			this._applyUnitValue("");
		}
	};
	FilterItemChart.prototype._getUnitTextFromValueList = function(unitField, prevUnit) {
		var me = this;
		var oMetaModel = this.getModel().getMetaModel();
		var entitySet = oMetaModel.getODataEntitySet(this.getEntitySet());
		var entityType = oMetaModel.getODataEntityType(entitySet.entityType);
		var propInfo = oMetaModel.getODataProperty(entityType, unitField);
		if (propInfo["com.sap.vocabularies.Common.v1.ValueList"]) {
			var valueListEntitySet = propInfo["com.sap.vocabularies.Common.v1.ValueList"].CollectionPath ? propInfo["com.sap.vocabularies.Common.v1.ValueList"].CollectionPath.String : "";
			var valueListProperty = propInfo["com.sap.vocabularies.Common.v1.ValueList"].Parameters && propInfo["com.sap.vocabularies.Common.v1.ValueList"].Parameters[0].ValueListProperty ? propInfo["com.sap.vocabularies.Common.v1.ValueList"].Parameters[0].ValueListProperty.String : "";
		}
		if (valueListEntitySet && valueListProperty) {
			var valueListUnitFieldText = FilterUtil.getUnitFieldText(this.getModel(), valueListEntitySet, valueListProperty);
			if (valueListUnitFieldText) {
				var sBindingPath = "/" + valueListEntitySet;
				var oFilter = new sap.ui.model.Filter({
					path: valueListProperty,
					operator: "EQ",
					value1: prevUnit
				});
				var aFilters = [];
				aFilters.push(oFilter);
				this.aSelectFields = [];
				this.aSelectFields.push(valueListProperty);
				this.aSelectFields.push(valueListUnitFieldText);
				this.prevUnit = prevUnit;
				var oUrlParameters = {
					"$select":this.aSelectFields
				};
				var oDataBindingInfo = {
					async: true,
					filters: aFilters,
					urlParameters: oUrlParameters
				};
				extend(oDataBindingInfo, {
					success: function(data, response) {
						me._oObject = null;
						me._onValueListUnitDataReceived(data);
					},
					error: function(oError) {
						oLogger.error("Error reading URL:" + oError);
						if (oError && oError.statusCode !== 0 && oError.statusText !== "abort") {
							me.applyOverlay(me.technicalIssueMessage);
							me._oObject = null;
						}
					}
				});
				this._oObject = this.getModel().read(sBindingPath, oDataBindingInfo);
			}
		} else {
			this._applyUnitValue(this._multiUnit ? "" : prevUnit);
		}
	};
	FilterItemChart.prototype._onValueListUnitDataReceived = function(data) {
		var results = data.results[0];
		if (results[this.aSelectFields[0]] == this.prevUnit) {
			var unitFieldText = results[this.aSelectFields[1]];
		}
		this._applyUnitValue(this.prevUnit + " (" + unitFieldText + ")");
	};

	FilterItemChart.prototype._applyUnitValue = function(val) {
		if (this._lastUnitValue != val) {
			this._lastUnitValue = val;
			this.fireTitleChange();
		}
	};

	/**
	 * Determines the scale factor and the scale to be used for the visual filter item
	 * Initially checks for scale factor from the annotation. If annotation does not have
	 * any scale factor then it is calculated on the basis of median deduced from the data received from the backend.
	 *
	 * @param {object} oData - Data received from the backend call
	 * @returns {void}
	 *
	 * @private
	 */
	FilterItemChart.prototype._getShortRefNumber = function(oData) {
		this._scaleValue = "";
		this._shortRefNumber = undefined; // reset
		// Determine the scale, to get scaleFactor from annotations or from locally defined values
		var iShortRefNumber = this.getScaleFactor(),
		scale;
		if (!iShortRefNumber) {
			// if annotation does not have scale factor
			var scaleFactor = this._getScaleFactorFromMedian(oData);
			iShortRefNumber = scaleFactor.iShortRefNumber;
			scale = scaleFactor.scale;
		} else {
			// if annotation has scale factor
			var fixedInteger = this._getNumberFormatter(iShortRefNumber);
			scale = fixedInteger.getScale() ? fixedInteger.getScale() : "";
		}

		this._shortRefNumber = iShortRefNumber;
		this._scaleValue = scale;
		this.fireTitleChange();
	};

	/**
	 * Determines the scale factor and the scale to be used for the Visual Filter Item
	 * on the basis of median deduced from the data received from the backend
	 *
	 * @param {event} ev - event triggered by selecting data point
	 * @returns {void}
	 *
	 * @private
	 */
	FilterItemChart.prototype._getScaleFactorFromMedian = function(oData) {
		var sMeasureField = this.getMeasureField();
		// sort data
		oData.sort(function(a,b) {
			if (Number(a[sMeasureField]) < Number(b[sMeasureField])) {
				return -1;
			}
			if (Number(a[sMeasureField]) > Number(b[sMeasureField])) {
				return 1;
			}
			return 0;
		});
		// get median index
		var iMid = oData.length / 2, // get mid of array
		// if iMid is whole number, array length is even, calculate median
		// if iMid is not whole number, array length is odd, take median as iMid - 1
		iMedian = iMid % 1 === 0 ? (parseFloat(oData[iMid - 1][sMeasureField]) + parseFloat(oData[iMid][sMeasureField])) / 2 : parseFloat(oData[Math.floor(iMid)][sMeasureField]),
		// get scale factor on median
		val = iMedian,
		scaleFactor;
		for (var i = 0; i < 14; i++) {
			scaleFactor = Math.pow(10, i);
			if (Math.round(Math.abs(val) / scaleFactor) < 10) {
				break;
			}
		}

		var fixedInteger = this._getNumberFormatter(scaleFactor);

		// apply scale factor to other values and check
		for (var i = 0; i < oData.length; i++) {
			var aData = oData[i],
			sScaledValue = fixedInteger.format(aData[sMeasureField]),
			aScaledValueParts = sScaledValue.split(".");
			// if scaled value has only 0 before decimal or 0 after decimal (example: 0.02)
			// then ignore this scale factor else proceed with this scale factor
			// if scaled value divided by 1000 is >= 1000 then also ignore scale factor
			if ((!aScaledValueParts[1] && parseInt(aScaledValueParts[0], 10) === 0) || (aScaledValueParts[1] && parseInt(aScaledValueParts[0], 10) === 0 && aScaledValueParts[1].indexOf('0') === 0) || (sScaledValue / 1000) >= 1000) {
				scaleFactor = undefined;
				break;
			}
		}
		return {
			iShortRefNumber: scaleFactor,
			scale: scaleFactor ? fixedInteger.getScale() : ""
		};
	};
	FilterItemChart.prototype._getScaleFactor = function(val) {
		var val = parseFloat(val);
		var precision = this._minFractionalDigits;
		for (var i = 0; i < 14; i++) {
			var scaleFactor = Math.pow(10, i);
			if (Math.round(Math.abs(val) / scaleFactor, precision - 1) < 10) {
				return scaleFactor;
			}
		}

		return undefined;
	};
	FilterItemChart.prototype.getTitle = function(oAppI18nModel) {
		var model = this.getModel();

		if (!model) {
			return "";
		}
		var measureLabel = FilterUtil.getPropertyNameDisplay(model, this.getEntitySet(), this.getMeasureField(), oAppI18nModel);
		var dimLabel = FilterUtil.getPropertyNameDisplay(model, this.getEntitySet(), this.getDimensionField(), oAppI18nModel);

		// Get the Unit
		var unitValue = this._lastUnitValue ? this._lastUnitValue : "";

		// Get the Scale factor
		var scaleValue = this._scaleValue ? this._scaleValue : "";

		var i18nModel = this.getModel("i18n");
		if (!i18nModel) {
			return "";
		}

		var rb = i18nModel.getResourceBundle();
		//First part of the title having measure and dimension
		var titleMD = rb.getText("VIS_FILTER_TITLE_MD", [measureLabel, dimLabel]);
		//Second part of the title showing unit and currency values
		var titleUnitCurr = scaleValue + " " + unitValue;
		titleUnitCurr = titleUnitCurr.trim();
		titleUnitCurr = titleUnitCurr.indexOf("%") > -1 ? "" : titleUnitCurr;
		//support for sap:quickinfo
		var measureQuickInfo = FilterUtil.getPropertyNameDisplay(model, this.getEntitySet(), this.getMeasureField(), oAppI18nModel, true);
		var dimQuickInfo = FilterUtil.getPropertyNameDisplay(model, this.getEntitySet(), this.getDimensionField(), oAppI18nModel, true);
		var titleQuickInfo = rb.getText("VIS_FILTER_TITLE_MD", [measureQuickInfo, dimQuickInfo]);
		var titleObj = {
			titleMD:titleMD,
			titleUnitCurr:titleUnitCurr,
			titleQuickInfo:titleQuickInfo
		};
		return titleObj;
	};

	FilterItemChart.prototype.getFormattedNumber = function(value, bShouldShowScale) {

		var numberOfFractionalDigits = this.getNumberOfFractionalDigits();
		if (numberOfFractionalDigits === "" || numberOfFractionalDigits === undefined) {
			numberOfFractionalDigits = "1";
		} else {
			if (Number(numberOfFractionalDigits) > 1) {
				numberOfFractionalDigits = "1";
			}
		}

		var fixedInteger = NumberFormat.getFloatInstance({
			style: "short",
			decimals: Number(numberOfFractionalDigits),
			showScale: bShouldShowScale,
			shortRefNumber: this._shortRefNumber,
			minFractionDigits: this._minFractionalDigits,
			maxFractionDigits: this._maxFractionalDigits
		});
		// parseFloat(value) is required otherwise -ve value are worngly rounded off
		// Example: "-1.9" rounds off to -1 instead of -2. however -1.9 rounds off to -2
		return fixedInteger.format(parseFloat(value));
	};

	FilterItemChart.prototype._getFormattedNumberWithUoM = function(value, UoM, unitFieldText) {
		UoM = (UoM) ? UoM : "";
		unitFieldText = (unitFieldText) ? " (" + unitFieldText + ")" : "";
		//As per the documentation default locale is taken.
		var oLocale = sap.ui.getCore().getConfiguration().getFormatSettings().getFormatLocale();
		var formattedValue = NumberFormat.getFloatInstance({
			maxFractionDigits: 3,
			groupingEnabled: true
		},
		oLocale
		).format(value);

		return (UoM === "%") ? formattedValue + "%" : formattedValue + " " + UoM + unitFieldText;
	};

	FilterItemChart.prototype._getDisplayedValue =  function(value, sUnitFieldValue) {
		var bShouldShowScale = (this._scaleValue === ""),
		nScaledValue = this.getFormattedNumber(value, bShouldShowScale),
		bIsPercentage = (sUnitFieldValue === "%");
		return (bIsPercentage) ? nScaledValue + "%" : "" + nScaledValue;
	};

	FilterItemChart.prototype._getToolTip = function(dimLabel, dimValue, unitField, unitFieldText, color) {
		var i18nModel = this.getModel("i18n");
		if (!i18nModel) {
			return "";
		}
		var rb = i18nModel.getResourceBundle();
		var nFormattedNumberWithUoM = this._getFormattedNumberWithUoM(dimValue, unitField, unitFieldText);
		var color_translated;
		switch (color) {
			case "Good":
				color_translated = rb.getText("VIS_FILTER_TOOLTIP_STATUS_GOOD");
				break;
			case "Error":
				color_translated = rb.getText("VIS_FILTER_TOOLTIP_STATUS_ERROR");
				break;
			case "Critical":
				color_translated = rb.getText("VIS_FILTER_TOOLTIP_STATUS_CRITICAL");
				break;
			default:
				color_translated = "Neutral";
		}
		if (color_translated === "Neutral") {
			return dimLabel + " " +  nFormattedNumberWithUoM;
		} else {
			return dimLabel + " " +  nFormattedNumberWithUoM + "\n" + color_translated;
		}
	};

	FilterItemChart.prototype._getSelected =  function(oContext, sDimFieldValue) {
		//TO DO : This function can be optimized; we don't have to iterate through all the data if we find a selection (true value).
		var bIsSelected = false,
			sFilterRestriction = this.getFilterRestriction(),
			aExcludeFilterValue = [];
		if (oContext) {
			if (sFilterRestriction === 'multiple') {
				if (oContext.items) {
					oContext.items.forEach(function(item) {
						var sItemKey = FilterUtil.getResolvedDimensionValue(item.key),
							sDimensionFieldValue = FilterUtil.getResolvedDimensionValue(sDimFieldValue);
						if (sItemKey === sDimensionFieldValue)  {
							bIsSelected = true;
						}
					});
				}
				if (oContext.value && oContext.value === sDimFieldValue) {
					bIsSelected = true;
					return bIsSelected;
				}
				// consider ranges EQ
				if (oContext.ranges) {
					var aExcludeFilterValue = oContext.ranges.filter(function(oRange) {
						if (oRange.exclude && (oRange.operation === 'EQ' || oRange.operation === 'Empty')) {
							return oRange;
						}
					});
					for (var i = 0; i < oContext.ranges.length; i++) {
						var oRange = oContext.ranges[i];
						// in ranges only EQ can match to a data point on the chart
						if ((oRange.operation ===  "EQ" || oRange.operation === 'Empty') && (oRange.value1 || oRange.value1 === "") && !oRange.exclude) {
							if (oRange.value1 instanceof Date && sDimFieldValue instanceof Date){
								if (this.getDimensionFieldIsDateTimeOffset()) {
									if (FilterUtil.getDateTimeInMedium(oRange.value1) === FilterUtil.getDateTimeInMedium(sDimFieldValue)) {
										bIsSelected = true;
										break;
									}
								} else if (FilterUtil.getDateInMedium(oRange.value1) === FilterUtil.getDateInMedium(sDimFieldValue)) {
									bIsSelected = true;
									break;
								}
							} else if (oRange.value1 === sDimFieldValue || this._isDateTimeFieldSelected(oRange.value1, sDimFieldValue)) {
								bIsSelected = true;
								break;
							}
							//here Empty operation is added ==> if the range value is "" then the smart filter bar changes the operation to "Empty" in filterprovider.js
						}
					}
					if (bIsSelected) { //if bIsSelected is true then make it false if the value comes up in the exclude filters
						for (var i = 0; i < aExcludeFilterValue.length; i++) {
							if (aExcludeFilterValue[i].value1 === sDimFieldValue && aExcludeFilterValue[i].operation === 'EQ') {
								bIsSelected = false;
								break;
							}
						}
					}
					if (aExcludeFilterValue.length === 2 && sDimFieldValue === IS_OTHERS) {
						// if exclude filter count is 2 the may be other's should be selected
						var iValueMatchedCount = 0,
						aDonutSegments = this._chart.getSegments();
						aDonutSegments.forEach(function (oSegment) {
							var sValue = oSegment.getCustomData()[0].getValue();
							aExcludeFilterValue.forEach(function (oExcludeFilterValue) {
								if (oExcludeFilterValue.value1.indexOf(sValue) > -1) {
									iValueMatchedCount++;
								}
							});
						});
						if (iValueMatchedCount === 2) {
							bIsSelected = true;
						}

					}
				}
			} else if (oContext instanceof Date && sDimFieldValue instanceof Date) {
				if (this.getDimensionFieldIsDateTimeOffset()) {
					if (FilterUtil.getDateTimeInMedium(oContext) === FilterUtil.getDateTimeInMedium(sDimFieldValue)) {
						bIsSelected = true;
					}
				} else if (FilterUtil.getDateInMedium(oContext) === FilterUtil.getDateInMedium(sDimFieldValue)) {
					bIsSelected = true;
				}
			} else if (oContext && oContext === sDimFieldValue) {
				bIsSelected = true;
			} else if (this._isDateTimeFieldSelected(oContext, sDimFieldValue)) {
				bIsSelected = true;
			}
		}
		return bIsSelected;
	};

	FilterItemChart.prototype._isDateTimeFieldSelected = function(oContext, sDimFieldValue) {
		if (this.getDimensionFieldIsDateTime()) {
			if (typeof oContext === "string" && sDimFieldValue instanceof Date) {
				if (FilterUtil.getDateInMedium(new Date(oContext)) === FilterUtil.getDateInMedium(sDimFieldValue)) {
					return true;
				}
			} else if (oContext instanceof Date && typeof sDimFieldValue === "string") {
				var oFormatter = DateFormat.getDateInstance({
					pattern: "yyyyMMdd"
				});
				var oDate = oFormatter.parse(sDimFieldValue);
				if (FilterUtil.getDateInMedium(oDate) === FilterUtil.getDateInMedium(oContext)) {
					return true;
				}
			} else if (oContext instanceof Object && sDimFieldValue instanceof Date) {
				if (oContext.ranges.length && FilterUtil.getDateInMedium(oContext.ranges[0].value1) === FilterUtil.getDateInMedium(sDimFieldValue)) {
						return true;
				}
			} else if (oContext instanceof Object && typeof sDimFieldValue === "string") {
				var oFormatter = DateFormat.getDateInstance({
					pattern: "yyyyMMdd"
				});
				var oDate = oFormatter.parse(sDimFieldValue);
				if (oContext.ranges.length && FilterUtil.getDateInMedium(oContext.ranges[0].value1) === FilterUtil.getDateInMedium(oDate)) {
					return true;
				}
			}
		} else if (this.getDimensionFieldIsDateTimeOffset()) {
			if (typeof oContext === "string" && sDimFieldValue instanceof Date) {
				if (FilterUtil.getDateTimeInMedium(new Date(oContext)) === FilterUtil.getDateTimeInMedium(sDimFieldValue)) {
					return true;
				}
			}
		}
		return false;
	};

	FilterItemChart.prototype._getLabel = function(oDimFieldDisplay, sDimField, bIsSecondaryLabel) {
		if (this.getDimensionFieldIsDateTime()) {
			if (sDimField && sDimField != IS_OTHERS) {
				oDimFieldDisplay = sDimField;
			}
			var bIsChartType = this._getCurrentSelectedChart(true);
			if (oDimFieldDisplay instanceof Date) {
				return FilterUtil.getDateInMedium(FilterUtil.convertLocalDatetoUTCDate(oDimFieldDisplay));
			} else if (this._isStringDateType() == "yearmonthday") {
				return sDimField === IS_OTHERS ? oDimFieldDisplay : FilterUtil.formatStringDate(oDimFieldDisplay, bIsChartType, bIsSecondaryLabel);
			} else if (this._isStringDateType() == "yearmonth") {
				return sDimField === IS_OTHERS ? oDimFieldDisplay : FilterUtil.formatStringDateYearMonth(oDimFieldDisplay, bIsChartType, bIsSecondaryLabel);
			} else if (this._isStringDateType() == "yearweek") {
				return sDimField === IS_OTHERS ? oDimFieldDisplay : FilterUtil.formatStringDateYearWeek(oDimFieldDisplay, bIsChartType, bIsSecondaryLabel);
			} else if (this._isStringDateType() == "yearquarter") {
				return sDimField === IS_OTHERS ? oDimFieldDisplay : FilterUtil.formatStringDateYearQuarter(oDimFieldDisplay, bIsChartType, bIsSecondaryLabel);
			} else if (this._isStringDateType() == "fiscalyearperiod") {
				return sDimField === IS_OTHERS ? oDimFieldDisplay : FilterUtil.formatStringFiscalYearPeriod(oDimFieldDisplay, bIsChartType, bIsSecondaryLabel);
			} else {
				return oDimFieldDisplay;
			}
		} else if (this.getDimensionFieldIsDateTimeOffset()) {
			return FilterUtil.getDateTimeInMedium(oDimFieldDisplay);
		} else {
			var sTextArrangement = this.getTextArrangement();
			return FilterUtil.getTextArrangement(oDimFieldDisplay, sDimField, sTextArrangement);
		}
	};

	FilterItemChart.prototype._getChartAggregationSettings =  function(bIsChartType) {
		var sfb = sap.ui.getCore().byId(this.getSmartFilterId());
		var sDimField = ( bIsChartType === CHART_TYPE_DONUT ) ? 'dimensionValue' : this.getDimensionField(),
			sDimFieldDisplay = this.getDimensionFieldDisplay(),
			sMeasureField = this.getMeasureField(),
			sUnitField = this.getUnitField(),
			sUnitFieldText = sUnitField && FilterUtil.getUnitFieldText(this.getModel(), this.getEntitySet(), sUnitField),
			aLabelParts = ( sDimField === sDimFieldDisplay ) ? [sDimFieldDisplay] : [sDimFieldDisplay, sDimField],
			aToolTipParts = ( sDimField === sDimFieldDisplay ) ? [sDimFieldDisplay, sMeasureField, ""] : [sDimFieldDisplay, sMeasureField, sDimField],
			aUnitFieldToolTipParts = sUnitField ? aToolTipParts.push(sUnitField) : aToolTipParts,
			aUnitFieldToolTipParts = sUnitFieldText ? aToolTipParts.push(sUnitFieldText) : aToolTipParts,
			me = this,
			oSettings = {
				label : {
					parts: aLabelParts,
					formatter: function(oDimFieldDisplay, sDimField) {
						return me._getLabel(oDimFieldDisplay, sDimField, false) || me._getI18nText("NOT_ASSIGNED");
					}
				},
				value: {
					path: sMeasureField,
					formatter: function(value) {
						return parseFloat(value);
					}
				},
				color: "{color}",
				displayedValue: {
					parts: [sMeasureField, sUnitField],
					formatter: function(value, sUnitFieldValue) {
						return me._getDisplayedValue(value, sUnitFieldValue);
					}
				},
				tooltip: {
					parts: aUnitFieldToolTipParts.constructor === Array ? aUnitFieldToolTipParts : aToolTipParts,
					formatter: function(dimLabel, dimValue, sDimField, unitField, unitFieldText) {
						//Convert false equivalent values (like undefined or null or NaN) to ""
						dimLabel = dimLabel || dimLabel === "" || dimLabel === 0 ? dimLabel : "";
						sDimField = sDimField || sDimField === "" || sDimField === 0 ? sDimField : "";

						sDimField = sDimField.constructor === Object ? "" : sDimField;
						dimLabel = me._getLabel(dimLabel, sDimField, false) || me._getI18nText("NOT_ASSIGNED");
						return me._getToolTip(dimLabel, dimValue, unitField, unitFieldText, this.getColor());
					}
				},
				selected: {
					parts: sfb.isDialogOpen() ? ["_dialogFilter>/" + me.getParentProperty(), sDimField] : ["_filter>/" + me.getParentProperty(), sDimField],
					formatter: function(oContext, sDimFieldValue) {
						if (sDimFieldValue instanceof Date) {
							sDimFieldValue = me.getDimensionFieldIsDateTimeOffset() ? sDimFieldValue : FilterUtil.convertLocalDatetoUTCDate(sDimFieldValue);
						}
						return me._getSelected(oContext, sDimFieldValue);
					}
				},
				customData: {
					Type:"sap.ui.core.CustomData",
				    key:sDimField,
				    value:"{" + sDimField + "}" // bind custom data
				}
			};
		if ( bIsChartType === CHART_TYPE_LINE && me._isStringDateType() && me._isStringDateType() !== "year" ) {
			oSettings.secondaryLabel = {
				parts: aLabelParts,
				formatter: function(oDimFieldDisplay, sDimField) {
					return me._getLabel(oDimFieldDisplay, sDimField, true);
				}
			};
		}
		return oSettings;
	};
	/**
	 * This function enables or disables overlay
	 * @param  {string} sI18n  i18n string for overlay message
	 * @return {void}
	**/
	FilterItemChart.prototype.applyOverlay = function(sI18n, sLabel) {
		if (sI18n) {
			this._chart.setShowError(true);
			this._chart.setErrorMessageTitle(this._getI18nText("M_VISUAL_FILTERS_ERROR_MESSAGE_TITLE"));
			this._chart.setErrorMessage(this.getModel("i18n").getResourceBundle().getText(sI18n, sLabel));
			this._chart.setBusy(false);
			this.data("sOverlay", "true");
			if (this.data("isDialogFilterItem") === "true") {
				this.data("needsToUpdateAria", "true");
			}
			this.fireTitleChange();
		} else {
			this._chart.setShowError(false);
			this._chart.setErrorMessageTitle("");
			this._chart.setErrorMessage("");
		}
	};

	/**
	* This function checks if the smartFilterBar has parameters , if then the pattern is updated to parameterSet(params)/resultNavProp
	*@param {string} sBindingPath binding path of the control
	*@param {object} oSmartFilterBar smartFilterBar object
	*@return {string} sBindingPath updated binding path
	**/
	FilterItemChart.prototype.considerAnalyticBinding = function(sBindingPath, oSmartFilterBar) {
		if (oSmartFilterBar && oSmartFilterBar.getAnalyticBindingPath && oSmartFilterBar.getConsiderAnalyticalParameters()) {
			try {
				var sAnalyticalPath = oSmartFilterBar.getAnalyticBindingPath();
				if (sAnalyticalPath) {
					return sAnalyticalPath;
					}
			} catch (e) {
				oLogger.warning("Mandatory parameters have no values");
			}
		}
		return sBindingPath;
	};
	/**
	* This function checks if the VF entity set has parameters , if then the pattern is updated to parameterSet(params)/resultNavProp
	*@param {object} oDataModel model
	*@param {string} oEntitySet entity set name
	*@param {array} aParams parameters from SV
	*@param {object} oSmartFilterBar smartFilterBar object
	*@returns {string} request query path
	**/
	FilterItemChart.prototype._getBindingPathforVisualFilter = function(oDataModel, oEntitySet, oEntityParameters) {
		var path = "";
		var o4a = new oData4Analytics.Model(oData4Analytics.Model.ReferenceByModel(oDataModel));
		var queryResult = o4a.findQueryResultByName(oEntitySet);
		var queryResultRequest = new oData4Analytics.QueryResultRequest(queryResult);
		var parameterization = queryResult && queryResult.getParameterization();
		//if the collection path of the VF is a parameterized entity set
		if (parameterization) {
			queryResultRequest.setParameterizationRequest(new oData4Analytics.ParameterizationRequest(parameterization));

			if (oEntityParameters) {
				Object.keys(oEntityParameters).forEach(function(sKey) {
					queryResultRequest.getParameterizationRequest().setParameterValue(sKey, oEntityParameters[sKey]);
				});
			}
		}
		try {
			path = queryResultRequest.getURIToQueryResultEntitySet();
		} catch (exception) {
			queryResult = queryResultRequest.getQueryResult();
			path = "/" + queryResult.getEntitySet().getQName();
			oLogger.error("getEntitySetPathWithParameters", "binding path with parameters failed - " + exception || exception.message);
		}
		return path;
	};
	/**
	* This function checks if the visual filter bar is searchable after considering parameters from SV, filters from SV and SFB
	*@param {object} oDataModel model
	*@param {string} oEntitySet entity set name
	*@param {object} oSmartFilterBar smartFilterBar object
	*@param {array} aParameters parameters from SV
	*@param {array} aSVOptions select options from SV
	*@returns {boolean} bSearchable true if VFB is searchable, else false
	**/
	FilterItemChart.prototype.checkSearchable = function(oDataModel, oEntitySet, oSmartFilterBar, aParameters, aSVOptions) {
		var o4a = new oData4Analytics.Model(oData4Analytics.Model.ReferenceByModel(oDataModel));
		var queryResult = o4a.findQueryResultByName(oEntitySet);
		var parameterization = queryResult && queryResult.getParameterization(), allParamsList = [], bSearchable = { bIsMandatoryFilter: true };
		bSearchable = FilterUtil.checkManditoryFieldsFilled(oSmartFilterBar);
		if (bSearchable.aMandatoryFilter.length === 1) {
			FilterItemChart.prototype.missingMandatoryField = "M_VISUAL_FILTERS_PROVIDE_FILTER_VAL_SINGLEVF";
			return bSearchable;
		}
		if (!bSearchable.bIsMandatoryFilter) {
			FilterItemChart.prototype.missingMultipleMandatoryFields = "M_VISUAL_FILTERS_PROVIDE_FILTER_VAL_MULTIPLEVF";
			return bSearchable;
		}
		//if the collection path of the VF is a parameterized entity set
		if (parameterization) {
			//all parameters required to obtain the result entity set
			var allMandatoryParameters = [];
			var allParameters = parameterization.getAllParameters();
			for (var key in allParameters) {
				if (!allParameters[key].isOptional()) {
					allMandatoryParameters.push(allParameters[key].getName());
				}
			}
			allMandatoryParameters.forEach(function(mParam) {
				//if given by the developer as part of SV, then consider it
				aParameters && aParameters.forEach(function(param) {
					if (param.PropertyName.PropertyPath === mParam && param.PropertyValue.String) {
						//to align with returned params by smartfilterbar APIs
						allParamsList.push("$Parameter." + param.PropertyName.PropertyPath);
					}
				});
			});
			//required in case the last visual filter had overlay message of the main entity set
			FilterItemChart.prototype.missingMultipleMandatoryFields = "REQUIRED_VH_FIELDS_OVERLAY_MESSAGE";
			if (oSmartFilterBar.getEntitySet() === oEntitySet) {
				FilterItemChart.prototype.missingMultipleMandatoryFields = "M_VISUAL_FILTERS_PROVIDE_FILTER_VAL_MULTIPLEVF";
				var oAllFilterData = oSmartFilterBar.getFilterData(true);
				//if collection path is the same as main entity set, then consider the param values set in SFB
				allMandatoryParameters.forEach(function(mParam) {
					if (oAllFilterData["$Parameter." + mParam] && allParamsList.indexOf("$Parameter." + mParam) < 0) {
						allParamsList.push("$Parameter." + mParam);
					}
				});
			}
			//only if all parameters have values filled then the app is searchable
			if (allMandatoryParameters.length !== allParamsList.length) {
				bSearchable.bIsMandatoryFilter = false;
				return bSearchable;
			}
		}
		// there could be mandatory filters (sap:required-in-filter = true) which have to b considered for the searchable state
		if (oSmartFilterBar.getEntitySet() === oEntitySet) {
			//required in case the last visual filter had overlay message of the valuehelp entity set and the current one is non-parameterized main entity set
			FilterItemChart.prototype.missingMultipleMandatoryFields = "M_VISUAL_FILTERS_PROVIDE_FILTER_VAL_MULTIPLEVF";
			var allMandatoryFilters = oSmartFilterBar.determineMandatoryFilterItems();
			//API determineMandatoryFilters have both mandatory parameters and filters.
			//hence get only the mandatory filters
			var allMandatoryFilters = allMandatoryFilters.filter(function(elem) {
				return !elem._bIsParameter;
			});
			bSearchable.bIsMandatoryFilter = allMandatoryFilters.every(function(mFilter) { //mandatory filters can be set via SV
				return FilterUtil.checkFilterHasValueFromSelectionVariantOrSmartFilterBar(mFilter.getName(), mFilter.getName(), aSVOptions, oSmartFilterBar);
			});
		} else { //different VH entityset
			FilterItemChart.prototype.missingMultipleMandatoryFields = "REQUIRED_VH_FIELDS_OVERLAY_MESSAGE";
			var valuehelpMandatoryFiltersMapped;
			if (!FilterItemChart.prototype.valuehelpAllMandatoryFilters[oEntitySet]) { //first time
				FilterItemChart.prototype.valuehelpAllMandatoryFilters[oEntitySet] = FilterUtil.getAllMandatoryFilters(oDataModel, oEntitySet);
			}
			valuehelpMandatoryFiltersMapped = FilterUtil.getAllMandatoryFiltersMapping(FilterItemChart.prototype.valuehelpAllMandatoryFilters[oEntitySet], this.getInParameters());
			bSearchable.bIsMandatoryFilter = valuehelpMandatoryFiltersMapped.aMappedFilterList.every(function(oFilter) { //mandatory filters can be set via SV or IN param
				return FilterUtil.checkFilterHasValueFromSelectionVariantOrSmartFilterBar(oFilter.valueListProperty, oFilter.localDataProperty, aSVOptions, oSmartFilterBar);
			});
			if (!bSearchable.bIsMandatoryFilter) {
				return bSearchable;
			}
			//now for the IN mapping missing VH mandatory filters only
			bSearchable.bIsMandatoryFilter = valuehelpMandatoryFiltersMapped.aMappingMissingFilterList.every(function(sFilter) { //mandatory filters can be set via SV
				var bHasValue = aSVOptions && FilterUtil.checkFilterHasValueFromSelectionVariant(aSVOptions, sFilter);
				return bHasValue;
			});
		}
		//searchable only if all mandatory filter values are set
		return bSearchable;
	};

	/**
	 * Function that returns a UTC offset date
	 * @param {Object} oDate - The input date object
	 * @returns {Object} The UTC offset date object
	 */
	FilterItemChart.prototype._getDateInUTCOffset = function(oDate) {
		return new Date(oDate.valueOf() - oDate.getTimezoneOffset() * 60 * 1000);
	};
	/**
	 * Function that returns Filter type is Edm.String and sap:semantics="yearmonthday"
	 * @returns {String} returns YearMonthDay if type is Edm.String and sap:semantics="yearmonthday"
						or YearMonth if type is Edm.String and sap:semantics="yearmonth"
						or Year if type is Edm.String and sap:semantics="year"
						or YearWeek if type is Edm.String and sap:semantics="yearweek"
						or YearQuarter if type is Edm.String and sap:semantics="yearquarter"
						or FiscalYear if type is Edm.String and sap:semantics="fiscalyear"
						or FiscalYearPeriod if type is Edm.String and sap:semantics="fiscalyearperiod"
	 */
	FilterItemChart.prototype._isStringDateType = function() {
		var oCustomData = this.getCustomData();
		var sStringDate;
		oCustomData.forEach(function(oData) {
			if (oData.getKey() == 'stringdate') {
				sStringDate = oData.getValue();
			}
		});
		return sStringDate;
	};
	FilterItemChart.prototype._determineHiddenVisualFilter = function(oMetaModel, entitySet, measureField) {
		var oMeasureProperty = this._getMeasureProperty(oMetaModel, entitySet, measureField);
		if (oMeasureProperty[v4Terms.Hidden] && oMeasureProperty[v4Terms.Hidden].Bool === "true") {
			return true;
		}
	};
	FilterItemChart.prototype._determineIfInvalidMeasure = function(oMetaModel, entitySet, measureField) {
		var oMeasureProperty = this._getMeasureProperty(oMetaModel, entitySet, measureField);
		if (oMeasureProperty["com.sap.vocabularies.Analytics.v1.AccumulativeMeasure"] && oMeasureProperty["com.sap.vocabularies.Analytics.v1.AccumulativeMeasure"].Bool === "false") {
			return true;
		}
		return false;
	};
	FilterItemChart.prototype._getMeasureProperty = function(oMetaModel, entitySet, measureField) {
		var oEntityType = oMetaModel.getODataEntityType(oMetaModel.getODataEntitySet(entitySet).entityType);
		var prop = oMetaModel.getODataProperty(oEntityType, measureField);
		return prop;
	};
	FilterItemChart.prototype._determineInteger = function(oMetaModel, entitySet, measureField) {
		var isInteger = false;
		var prop = this._getMeasureProperty(oMetaModel, entitySet, measureField);
		if (prop.type && FilterUtil.isInteger(prop.type)) {
			isInteger = true;
		}
		return isInteger;
	};
	FilterItemChart.prototype._getI18nText = function(sI18nString) {
		var i18nModel = this.getModel("i18n");
		if (!i18nModel) {
			return "";
		}
		var rb = i18nModel.getResourceBundle();
		return rb.getText(sI18nString);
	};
	return FilterItemChart;
}, /* bExport= */true);
