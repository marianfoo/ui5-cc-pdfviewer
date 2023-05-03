sap.ui.define(["sap/suite/ui/microchart/InteractiveLineChart",
	"sap/suite/ui/microchart/InteractiveLineChartPoint",
	"sap/ui/model/json/JSONModel",
	"sap/suite/ui/generic/template/AnalyticalListPage/control/visualfilterbar/FilterItemMicroChart",
	"sap/suite/ui/generic/template/AnalyticalListPage/util/CriticalityUtil",
	"sap/suite/ui/generic/template/AnalyticalListPage/util/FilterUtil",
	"sap/suite/ui/generic/template/js/StableIdHelper"
], function(InteractiveLineChart, InteractiveLineChartPoint, JSONModel, FilterItemMicroChart, CriticalityUtil, FilterUtil, StableIdHelper) {
	"use strict";

	/* all visual filters should extend this class */
	var FilterItemMicroLine = FilterItemMicroChart.extend("sap.suite.ui.generic.template.AnalyticalListPage.control.visualfilterbar.FilterItemMicroLine", {
		metadata: {
			properties: {
				labelWidthPercent: { type: "float", group: "Misc", defaultValue: 1 / 3 },
				fixedCount: {type: "int", defaultValue: 6}
			},
			aggregations: {
				control: {type: "sap.suite.ui.microchart.InteractiveLineChart", multiple : false}
			}
		},
		renderer:{}
	});

	FilterItemMicroLine.prototype.init = function() {
		var sId = this.getId() + "-innerChart";
		this._chart = new InteractiveLineChart({
			id: sId,
			selectionEnabled : true,
			points : []
		});
		this.setControl(this._chart);
		this.setModel(new JSONModel(), '__alp_chartJSONModel');
		this._sorters = [];
		FilterItemMicroChart.prototype.init.apply(this, arguments);
	};

	FilterItemMicroLine.prototype._onDataReceived = function(data) {
		if (!data || !data.results || !data.results.length) {
			this.applyOverlay(this.noDataIssueMessage);
			return;
		}

		var aData = this.getDimensionFieldIsDateTime() ? data.results.slice().reverse() : data.results;
		FilterItemMicroChart.prototype._onDataReceived.call(this, data.results);
		this.getModel('__alp_chartJSONModel').setData(aData);
		this._chart.setModel(this.getModel('__alp_chartJSONModel'));

		var count = this.getFixedCount(),
			dataBinding = {
			path: '/',
			template: new InteractiveLineChartPoint(this._getChartAggregationSettings("Line")),
			startIndex: 0,
			length: count
		};

		this._chart.bindPoints(dataBinding);
		this._chart.setBusy(false);
	};
	return FilterItemMicroLine;

}, /* bExport= */ true);
