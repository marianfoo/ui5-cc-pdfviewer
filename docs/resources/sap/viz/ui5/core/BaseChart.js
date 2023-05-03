/*!
 * SAPUI5
 * (c) Copyright 2009-2022 SAP SE. All rights reserved.
 */
sap.ui.define(["sap/ui/core/Control","sap/ui/core/ResizeHandler","sap/ui/core/theming/Parameters","sap/viz/library","sap/viz/libs/sap-viz","./BaseStructuredType","./BaseChartMetadata","sap/ui/thirdparty/jquery","sap/base/util/each","./BaseChartRenderer","jquery.sap.sjax"],function(t,e,i,s,r,a,n,jQuery,o){"use strict";var p=t.extend("sap.viz.ui5.core.BaseChart",{metadata:{abstract:true,library:"sap.viz",properties:{width:{type:"sap.ui.core.CSSSize",group:"Dimension",defaultValue:"640px"},height:{type:"sap.ui.core.CSSSize",group:"Dimension",defaultValue:"480px"},css:{type:"string",group:"Appearance",defaultValue:null}},aggregations:{dataset:{type:"sap.viz.ui5.data.Dataset",multiple:false},noData:{type:"sap.ui.core.Control",multiple:false}},events:{beforeCreateViz:{parameters:{usrOptions:{type:"object"}}}}}},n);p.prototype.getVIZChartType=function(){return this.getMetadata().getVIZChartType()};p.prototype._getSapVizCSS=function(){var t,e,i;var s=window.document.getElementById("sap-ui-theme-sap.viz");if(s){e=s.href;t=jQuery.sap.syncGetText(e+"?",undefined,undefined);if(!t){t=""}}if(this.getCss()){i=t+this.getCss()}return i};p.prototype._getMergedChartOptions=function(){var t=this._getOptions();var e=i.get("sapVizChartAxisGridlineColor");var s=i.get("sapVizChartAxisColor");var r={xAxis:{gridline:{color:e}},yAxis:{gridline:{color:e}}};var a=this.getVIZChartType();switch(a){case"viz/dual_bar":r.yAxis.color=s;break;case"viz/dual_combination":case"viz/dual_line":case"viz/dual_stacked_column":case"viz/100_dual_stacked_column":case"viz/dual_column":r.xAxis.color=s;break;default:r.xAxis.color=s;r.yAxis.color=s;break}return jQuery.extend(true,r,t)};p.prototype._unregisterListener=function(){if(this._sResizeListenerId){e.deregister(this._sResizeListenerId);delete this._sResizeListenerId}};p.prototype._registerListener=function(){this._sResizeListenerId=e.register(this.getDomRef(),jQuery.proxy(this.onresize,this))};p.prototype._renderChart=function(){if(!sap.viz.__svg_support||!this.getDataset()||!this.getDataset().getVIZDataset()){return}if(this._oVIZInstance){this._oVIZInstance.destroy();delete this._oVIZInstance}var t=this._getSapVizCSS();var e=this._getMergedChartOptions();var i={type:this.getVIZChartType(),data:this.getDataset().getVIZDataset(),container:this.getDomRef(),options:e,css:t};this.fireBeforeCreateViz({usrOptions:i});this._oVIZInstance=sap.viz.core.createViz(i);var s=this;o(this._mVIZHandler,function(t,e){s._oVIZInstance.on(t+p.EVENT_SUFFIX,e)})};p.prototype.init=function(){sap.viz._initializeVIZ();this._mVIZHandler={}};p.prototype.exit=function(){this._unregisterListener();if(this._oVIZInstance){this._oVIZInstance.destroy();delete this._oVIZInstance}};p.prototype.onBeforeRendering=function(){this._unregisterListener()};p.prototype.onAfterRendering=function(){this._renderChart();this._registerListener()};p.prototype.onresize=function(t){var e={width:this.$().width(),height:this.$().height()};if(this.getDomRef()&&this._oVIZInstance){this._oVIZInstance.size(e)}};p.prototype.setDefaultSelection=function(t){var e=this.getDataset();if(e){var i=e.getVIZDataset();if(i){i.info({type:"defaultSelection",value:t});if(this._oVIZInstance){this._oVIZInstance.data(i)}}}};p.prototype.onThemeChanged=function(t){if(!this.getDomRef()){return}this._renderChart()};p.prototype.onLocalizationChanged=function(t){if(!this.getDomRef()){return}this._renderChart()};p.prototype.validateAggregation=function(e,i,s){if(e==="interaction"){i=a._convertAggregatedObject.call(this,e,i,s)}return t.prototype.validateAggregation.call(this,e,i,s)};p.EVENT_SUFFIX=".sap.viz.ui5.core";p.prototype._getOrCreate=a.prototype._getOrCreate;p.prototype._getOptions=a.prototype._getOptions;p.prototype._attachVIZEvent=function(e,i,s,r){var a=this;if(!this.hasListeners(e)){this._mVIZHandler[e]=function(t){a.fireEvent(e,t)};if(this._oVIZInstance){this._oVIZInstance.on(e+p.EVENT_SUFFIX,this._mVIZHandler[e])}}t.prototype.attachEvent.apply(this,arguments);return this};p.prototype._detachVIZEvent=function(e,i,s,r){t.prototype.detachEvent.apply(this,arguments);if(!this.hasListeners(e)){if(this._oVIZInstance){this._oVIZInstance.on(e+p.EVENT_SUFFIX,null)}delete this._mVIZHandler[e]}return this};p.prototype.getVIZInstance=function(){return this._oVIZInstance||null};p.prototype.selection=function(t,e){if(this._oVIZInstance){return this._oVIZInstance.selection.apply(this._oVIZInstance,arguments)}};return p});
//# sourceMappingURL=BaseChart.js.map