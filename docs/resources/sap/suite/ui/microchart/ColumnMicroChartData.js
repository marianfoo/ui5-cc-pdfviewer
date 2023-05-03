/*!
 * SAPUI5
 * (c) Copyright 2009-2022 SAP SE. All rights reserved.
 */
sap.ui.define(["./library","sap/ui/core/Element"],function(t,e){"use strict";var r=e.extend("sap.suite.ui.microchart.ColumnMicroChartData",{metadata:{library:"sap.suite.ui.microchart",properties:{color:{group:"Misc",type:"sap.m.ValueCSSColor",defaultValue:"Neutral"},label:{type:"string",group:"Misc",defaultValue:""},displayValue:{type:"string",group:"Appearance"},value:{type:"float",group:"Misc"}},events:{press:{}}}});r.prototype.init=function(){this.setAggregation("tooltip","((AltText))",true)};r.prototype.attachEvent=function(t,r,a,s){e.prototype.attachEvent.call(this,t,r,a,s);if(this.getParent()&&t==="press"){this.getParent().setBarPressable(this,true)}return this};r.prototype.detachEvent=function(t,r,a){e.prototype.detachEvent.call(this,t,r,a);if(this.getParent()&&t==="press"){this.getParent().setBarPressable(this,false)}return this};return r});
//# sourceMappingURL=ColumnMicroChartData.js.map