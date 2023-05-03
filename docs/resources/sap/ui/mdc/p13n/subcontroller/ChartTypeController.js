/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["./BaseController"],function(t){"use strict";var e=t.extend("sap.ui.mdc.p13n.subcontroller.ChartTypeController",{constructor:function(){t.apply(this,arguments);this._bResetEnabled=true}});e.prototype.getCurrentState=function(){return{properties:{chartType:this.getAdaptationControl().getChartType()}}};e.prototype.getStateKey=function(){return"supplementaryConfig"};e.prototype.getDelta=function(t){var e=t.changedState.type?t.changedState.type:t.changedState.properties.chartType;var r=this.getAdaptationControl().getChartType();var n=[];if(e!==r){n=[{selectorElement:t.control,changeSpecificData:{changeType:"setChartType",content:{chartType:e}}}]}return n};return e});
//# sourceMappingURL=ChartTypeController.js.map