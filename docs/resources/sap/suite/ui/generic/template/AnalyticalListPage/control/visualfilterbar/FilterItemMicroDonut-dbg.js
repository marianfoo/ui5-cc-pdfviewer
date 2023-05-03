sap.ui.define(["sap/suite/ui/microchart/InteractiveDonutChart",
	"sap/suite/ui/microchart/InteractiveDonutChartSegment",
	"sap/ui/model/json/JSONModel",
	"sap/suite/ui/generic/template/AnalyticalListPage/control/visualfilterbar/FilterItemMicroChart",
	"sap/suite/ui/generic/template/AnalyticalListPage/util/CriticalityUtil",
	"sap/suite/ui/generic/template/AnalyticalListPage/util/FilterUtil",
	"sap/suite/ui/generic/template/js/StableIdHelper",
	"sap/base/util/deepExtend"
],function(InteractiveDonutChart, InteractiveDonutChartSegment, JSONModel, FilterItemMicroChart, CriticalityUtil, FilterUtil, StableIdHelper, deepExtend) {
	"use strict";


	var IS_OTHERS = "__IS_OTHER__";
	/* all visual filters should extend this class */
	var FilterItemMicroDonut = FilterItemMicroChart.extend("sap.suite.ui.generic.template.AnalyticalListPage.control.visualfilterbar.FilterItemMicroDonut", {
		metadata: {
			properties: {
				labelWidthPercent: { type: "float", group: "Misc", defaultValue: 1 / 2 }
			},
			aggregations: {
				control: {type: "sap.suite.ui.microchart.InteractiveDonutChart", multiple: false}
			}
		},
		renderer:{}
	});

	FilterItemMicroDonut.prototype.init = function() {
		var sId = this.getId() + "-innerChart";
		this._chart = new InteractiveDonutChart({
			id: sId,
			selectionEnabled : true,
			segments : []
		});
		this.setControl(this._chart);
		this.setModel(new JSONModel(), '__alp_chartJSONModel');
		this._otherField = "__IS_OTHER__"; // may need to replace if the data contains this
		this._sorters = [];
		FilterItemMicroChart.prototype.init.apply(this, arguments);
	};

	/**
	* Function to apply selections on the Donut
	* @param{object} custom data which has the dimension of the current segment
	* @param{object} Filters already present in this property
	* @return{object} Filters to be applied for this proeprty
	*
	*/
	FilterItemMicroDonut.prototype._applyDonutChartSelections = function (oCustomData, oDimensionFilter) {
		var aSegments = this._chart.getSegments(),
		sParentProperty = this.getParentProperty(),
		aSelectedItems = [],
		sSegmentCustomValue,
		oRange;
		// if others is selected
		if (oCustomData.dimValue === IS_OTHERS) {
			aSegments.forEach(function(oSegment) {
				sSegmentCustomValue = oSegment.getCustomData()[0].getValue();
				// get values of other segments that are selected
				if (sSegmentCustomValue !== IS_OTHERS) {
					if (oSegment.getSelected()) {
						aSelectedItems.push(sSegmentCustomValue);
						// remove selection
						//oSegment.setSelected(false);
					}
					oRange = {"exclude":true,"operation":"EQ"};
					oRange.keyField = sParentProperty;
					oRange.value1 = sSegmentCustomValue;
					oDimensionFilter.ranges.push(oRange);
				}
			});
			// if any segment other than others is selected
			// remove the selection from filter Data
			if (aSelectedItems.length > 0) {
				// remove from filter items
				oDimensionFilter.items = oDimensionFilter.items.filter(function (oItem) {
					return aSelectedItems.indexOf(oItem.key) === -1;
				});

				// remove from ranges
				oDimensionFilter.ranges = oDimensionFilter.ranges.filter(function (oRange) {
					return !(oRange.exclude === false
						&& oRange.operation === "EQ"
						&& oRange.keyField === sParentProperty
						&& aSelectedItems.indexOf(oRange.value1) > -1);
				});
			}
		} else {
			if (oCustomData.dimValue instanceof Date) {
				oDimensionFilter.ranges.push({
					exclude: false,
					keyField: this.getDimensionField(),
					operation: "EQ",
					value1:  oCustomData.dimValue,
					value2: null
				});
			} else {
				// if segment A or B is selected
				oDimensionFilter.items.push({
					key: oCustomData.dimValue,
					text: oCustomData.dimValueDisplay // oData.dimValueDisplay comes with TextArrangement from custome data so applying directly.
				});
			}

			var bIsOthersSelected = false;
			// go through all segments, to check if others is selected
			aSegments.forEach(function(oSegment) {
				sSegmentCustomValue = oSegment.getCustomData()[0].getValue();
				if (sSegmentCustomValue === IS_OTHERS && oSegment.getSelected()) {
					// if others is selected
					bIsOthersSelected = true;
				}
				// get values of other segments that are selected
				if (sSegmentCustomValue !== IS_OTHERS) {
					aSelectedItems.push(sSegmentCustomValue);
				}
			});
			// if others is  already selected
			// remove all filters related to others selection from Dimension Filter
			// which will trigger the binding to remove the highlight
			if (bIsOthersSelected) {
				oDimensionFilter.ranges = oDimensionFilter.ranges.filter(function (oRange) {
					return !(oRange.exclude === true
						&& oRange.operation === "EQ"
						&& oRange.keyField === sParentProperty
						&& aSelectedItems.indexOf(oRange.value1) > -1);
				});
			}
		}
		return oDimensionFilter;
	};

	FilterItemMicroDonut.prototype._onDataReceived = function(oTop4Data, oTotalData) {
		var results = [],
		sDimensionFieldDisplay = this.getDimensionFieldDisplay(),
		sMeasureField = this.getMeasureField(),
		sDimensionField = this.getDimensionField(),
		navProperty = FilterUtil.IsNavigationProperty(this.getModel(), this.getEntitySet(), sDimensionFieldDisplay) ? sDimensionFieldDisplay.split("/") : null;
		if (!oTotalData) {
			oTop4Data.results.forEach(function(data, index) {
				data['dimensionValue'] = data[sDimensionField];
				results.push(data);
			});
		} else {
			var fTotalTwo = 0,
			fOthers = 0;

			oTop4Data.results.forEach(function(data, index) {
				if (index < 2) {
					data['dimensionValue'] = data[sDimensionField];
					results.push(data);
					fTotalTwo += parseFloat(data[sMeasureField]);
				}
			});

			if (oTotalData) {
				oTotalData.results.forEach(function (data) {
					var i18nModel = this.getModel("i18n"),
					oDataObject	= deepExtend({}, data);
					// if dimensionField and dimension field display are the same property
					// then '__IS_OTHER__' becomes 'Other' and there is no proper way to find out
					// which whether other section was clicked or not. Hence storing __IS_OTHER__
					// as dimensionValue
					oDataObject['dimensionValue'] = this._otherField;
					oDataObject[sDimensionField] = this._otherField;
					//setting the unit field for 'Other' segment.
					if (this.getUnitField()) {
						oDataObject[this.getUnitField()] = oTop4Data.results.length > 1 ? oTop4Data.results[0][this.getUnitField()] : "";
					}
					if (navProperty && navProperty.length > 0) {
						oDataObject[navProperty[0]] = {};
						oDataObject[navProperty[0]][navProperty[1]] = i18nModel ? i18nModel.getResourceBundle().getText("VIS_FILTER_DONUT_OTHER") : "";
					} else {
						oDataObject[sDimensionFieldDisplay] = i18nModel ? i18nModel.getResourceBundle().getText("VIS_FILTER_DONUT_OTHER") : "";
					}
					if (fTotalTwo < 0) {
						fOthers = parseFloat(data[sMeasureField]) + fTotalTwo;
					} else {
						fOthers = parseFloat(data[sMeasureField]) - fTotalTwo;
					}
					oDataObject[sMeasureField] = fOthers;
					results.push(oDataObject);
				}.bind(this));
			}
		}

		FilterItemMicroChart.prototype._onDataReceived.call(this, results);
		this.getModel('__alp_chartJSONModel').setData(results);
		this._chart.setModel(this.getModel('__alp_chartJSONModel'));

		var count = 3,
			dataBinding = {
			path: '/',
			template: new InteractiveDonutChartSegment(this._getChartAggregationSettings("Donut")),
			startIndex: 0,
			length: count
		};

		this._chart.bindSegments(dataBinding);
		this._chart.setBusy(false);
	};

	return FilterItemMicroDonut;

}, /* bExport= */ true);
