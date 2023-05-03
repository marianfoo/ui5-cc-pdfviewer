/*!
 * SAPUI5
 * (c) Copyright 2009-2022 SAP SE. All rights reserved.
 */
sap.ui.define(["sap/ui/thirdparty/jquery","./library","sap/ui/core/Element","sap/m/library"],function(jQuery,a,r,e){"use strict";var t=e.ValueCSSColor;var u=r.extend("sap.suite.ui.microchart.StackedBarMicroChartBar",{metadata:{library:"sap.suite.ui.microchart",properties:{value:{type:"float",group:"Data",defaultValue:"0"},valueColor:{type:"sap.m.ValueCSSColor",group:"Appearance",defaultValue:null},displayValue:{type:"string",group:"Data",defaultValue:null}}}});u.prototype.setValue=function(a,r){var e=jQuery.isNumeric(a);return this.setProperty("value",e?a:NaN,r)};u.prototype.setValueColor=function(a,r){var e=t.isValid(a);return this.setProperty("valueColor",e?a:null,r)};return u});
//# sourceMappingURL=StackedBarMicroChartBar.js.map