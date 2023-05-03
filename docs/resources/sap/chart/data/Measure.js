/*!
 * SAPUI5
 * (c) Copyright 2009-2022 SAP SE. All rights reserved.
 */
sap.ui.define(["sap/ui/core/Element","sap/chart/utils/ChartUtils","sap/chart/data/MeasureSemantics","sap/ui/thirdparty/jquery"],function(e,t,a,jQuery){"use strict";var r={axis1:true,axis2:true,axis3:true,axis4:true};var i=e.extend("sap.chart.data.Measure",{metadata:{library:"sap.chart",properties:{name:{type:"string"},label:{type:"string"},unitBinding:{type:"string"},valueFormat:{type:"string",defaultValue:null},role:{type:"string",defaultValue:"axis1"},semantics:{type:"sap.chart.data.MeasureSemantics",defaultValue:a.Actual},semanticallyRelatedMeasures:{type:"object",defaultValue:null},analyticalInfo:{type:"object",defaultValue:null}}}});i.prototype.setLabel=t.makeNotifyParentProperty("label");var s=t.makeNotifyParentProperty("role");i.prototype.setRole=function(e,t){if(!r[e]){throw new TypeError("Invalide Measure role: "+e)}return s.apply(this,arguments)};i.prototype.setUnitBinding=t.makeNotifyParentProperty("unitBinding");i.prototype.setValueFormat=t.makeNotifyParentProperty("valueFormat");i.prototype.setSemantics=t.makeNotifyParentProperty("semantics");i.prototype.setSemanticallyRelatedMeasures=t.makeNotifyParentProperty("semanticallyRelatedMeasures");i.prototype._getFixedRole=function(){return this._sFixedRole||this.getRole()};return i});
//# sourceMappingURL=Measure.js.map