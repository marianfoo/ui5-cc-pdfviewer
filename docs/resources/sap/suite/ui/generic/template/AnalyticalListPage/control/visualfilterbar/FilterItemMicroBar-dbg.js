sap.ui.define(["sap/suite/ui/microchart/InteractiveBarChart",
	"sap/suite/ui/microchart/InteractiveBarChartBar",
	"sap/ui/model/json/JSONModel",
	"sap/suite/ui/generic/template/AnalyticalListPage/control/visualfilterbar/FilterItemMicroChart",
	"sap/suite/ui/generic/template/AnalyticalListPage/util/CriticalityUtil",
	"sap/suite/ui/generic/template/AnalyticalListPage/util/FilterUtil",
	"sap/suite/ui/generic/template/js/StableIdHelper"
], function(InteractiveBarChart, InteractiveBarChartBar, JSONModel, FilterItemMicroChart, CriticalityUtil, FilterUtil, StableIdHelper) {
	"use strict";

	/* all visual filters should extend this class */
	var FilterItemMicroBar = FilterItemMicroChart.extend("sap.suite.ui.generic.template.AnalyticalListPage.control.visualfilterbar.FilterItemMicroBar", {
		metadata: {
			properties: {
				fixedCount: {type: "int", defaultValue: 3},
				labelWidthPercent: { type: "float", group: "Misc", defaultValue: 1 / 3 }
			},
			aggregations: {
				control: {type: "sap.suite.ui.microchart.InteractiveBarChart", multiple: false}
			}
		},
		renderer:{}
	});

	FilterItemMicroBar.prototype.init = function() {
		var sId = this.getId() + "-innerChart";
		this._chart = new InteractiveBarChart({
			id: sId,
			selectionEnabled : true,
			bars : []
		});
		this.setControl(this._chart);
		this.setModel(new JSONModel(), '__alp_chartJSONModel');
		this._sorters = [];
		FilterItemMicroChart.prototype.init.apply(this, arguments);
	};

	FilterItemMicroBar.prototype._onDataReceived = function(data) {
		if (!data || !data.results || !data.results.length) {
			this.applyOverlay(this.noDataIssueMessage);
			return;
		}

		FilterItemMicroChart.prototype._onDataReceived.call(this, data.results);
		this.getModel('__alp_chartJSONModel').setData(data.results);
		this._chart.setModel(this.getModel('__alp_chartJSONModel'));

		var count = this.getFixedCount(),
			dataBinding = {
			path: '/',
			template: new InteractiveBarChartBar(this._getChartAggregationSettings("Bar")),
			startIndex: 0,
			length: count
		};

		this._chart.bindBars(dataBinding);
		this._chart.setBusy(false);
	};
	return FilterItemMicroBar;

}, /* bExport= */ true);
