/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define(["./library","./util/DateUtils","sap/ui/core/Control","sap/suite/ui/commons/DateRangeSliderInternal","sap/base/Log","./DateRangeSliderRenderer"],function(e,t,a,r,n,i){"use strict";var l=a.extend("sap.suite.ui.commons.DateRangeSlider",{metadata:{deprecated:true,library:"sap.suite.ui.commons",properties:{width:{type:"sap.ui.core.CSSSize",group:"Dimension",defaultValue:"100%"},enabled:{type:"boolean",group:"Appearance",defaultValue:true},editable:{type:"boolean",group:"Behavior",defaultValue:true},visible:{type:"boolean",group:"Misc",defaultValue:true},showBubbles:{type:"boolean",group:"Misc",defaultValue:true},smallStepWidth:{type:"float",group:"Appearance",defaultValue:null},totalUnits:{type:"int",group:"Appearance",defaultValue:null},stepLabels:{type:"boolean",group:"Misc",defaultValue:false},labels:{type:"string[]",group:"Misc",defaultValue:null},min:{type:"object",group:"Behavior",defaultValue:null},max:{type:"object",group:"Behavior",defaultValue:null},value:{type:"object",group:"Behavior",defaultValue:null},value2:{type:"object",group:"Behavior",defaultValue:null},pinGrip:{type:"boolean",group:"Misc",defaultValue:false},pinGrip2:{type:"boolean",group:"Misc",defaultValue:false}},events:{change:{},liveChange:{}}}});var s="d";var o="m";l.prototype.init=function(){this._oDateRangeSliderInternal=new r({id:this.getId()+"-dateRangeSliderInternal"});l.setPropertiesBasedOnSliderInternal(this);this._oDateRangeSliderInternal.attachChange(function(e){this.handleChange(e)},this);this._oDateRangeSliderInternal.attachLiveChange(function(e){this.handleLiveChange(e)},this)};l.areDaysSameBasedOnGranularity=function(e,a,r){var n;switch(r){case s:n=t.dateDaysEqual(e,a);break;case o:n=t.dateMonthsEqual(e,a);break;default:n=false}return n};l.isMinBeforeMax=function(e,t,a){var r=false;if(e.getFullYear()<t.getFullYear()){r=true}else if(e.getFullYear()===t.getFullYear()){if(e.getMonth()<t.getMonth()){r=true}else if(e.getMonth()===t.getMonth()&&a===s){if(e.getDate()<t.getDate()){r=true}}}if(!r){n.error("DateRangeSlider: Min Date = "+e+" should be before Max Date = "+t)}return r};l.isValueEqualOrAfterMin=function(e,t,a){var r=false;if(e.getFullYear()<t.getFullYear()){r=true}else if(e.getFullYear()===t.getFullYear()){if(e.getMonth()<t.getMonth()){r=true}else if(e.getMonth()===t.getMonth()&&a===o){r=true}else if(e.getMonth()===t.getMonth()&&a===s){if(e.getDate()<=t.getDate()){r=true}}}if(!r){n.error("DateRangeSlider: Value Date = "+t+" should be after or equal to Min Date = "+e)}return r};l.isValue2EqualOrBeforeMax=function(e,t,a){var r=false;if(e.getFullYear()<t.getFullYear()){r=true}else if(e.getFullYear()===t.getFullYear()){if(e.getMonth()<t.getMonth()){r=true}else if(e.getMonth()===t.getMonth()&&a===o){r=true}else if(e.getMonth()===t.getMonth()&&a===s){if(e.getDate()<=t.getDate()){r=true}}}if(!r){n.error("DateRangeSlider: Value2 Date = "+e+" should be before or equal to Max Date = "+t)}return r};l.isValueBeforeOrEqualValue2=function(e,t,a){var r=false;if(e.getFullYear()<t.getFullYear()){r=true}else if(e.getFullYear()===t.getFullYear()){if(e.getMonth()<t.getMonth()){r=true}else if(e.getMonth()===t.getMonth()&&a===o){r=true}else if(e.getMonth()===t.getMonth()&&a===s){if(e.getDate()<=t.getDate()){r=true}}}if(!r){n.error("DateRangeSlider: Value Date = "+e+" should be before or equal to Value2 Date = "+t)}return r};l.prototype.setMin=function(e){if(t.isValidDate(e)&&l.isMinBeforeMax(e,new Date(this.getMax()),this._sGranularity)&&!l.areDaysSameBasedOnGranularity(new Date(this.getMin()),e,this._sGranularity)){t.resetDateToStartOfDay(e);this._oDateRangeSliderInternal.setMinDate(e);l.setPropertiesBasedOnSliderInternal(this)}return this};l.prototype.setMax=function(e){if(t.isValidDate(e)&&l.isMinBeforeMax(new Date(this.getMin()),e,this._sGranularity)&&!l.areDaysSameBasedOnGranularity(new Date(this.getMax()),e,this._sGranularity)){t.resetDateToEndOfDay(e);this._oDateRangeSliderInternal.setMaxDate(e);l.setPropertiesBasedOnSliderInternal(this)}return this};l.prototype.setValue=function(e){if(t.isValidDate(e)&&l.isValueBeforeOrEqualValue2(e,new Date(this.getValue2()),this._sGranularity)&&l.isValueEqualOrAfterMin(new Date(this.getMin()),e,this._sGranularity)&&!l.areDaysSameBasedOnGranularity(new Date(this.getValue()),e,this._sGranularity)){t.resetDateToStartOfDay(e);this._oDateRangeSliderInternal.setValueDate(e);l.setPropertiesBasedOnSliderInternal(this)}return this};l.prototype.getValue=function(){var e=this._oDateRangeSliderInternal.getValueDate();return e};l.prototype.setValue2=function(e){if(t.isValidDate(e)&&l.isValueBeforeOrEqualValue2(new Date(this.getValue()),e,this._sGranularity)&&!l.areDaysSameBasedOnGranularity(new Date(this.getValue2()),e,this._sGranularity)&&l.isValue2EqualOrBeforeMax(e,new Date(this.getMax()),this._sGranularity)){t.resetDateToStartOfDay(e);this._oDateRangeSliderInternal.setValue2Date(e);l.setPropertiesBasedOnSliderInternal(this)}return this};l.prototype.getValue2=function(){var e=this._oDateRangeSliderInternal.getValue2Date();return e};l.prototype.setVisible=function(e){this._oDateRangeSliderInternal.setVisible(e);this.setProperty("visible",e);return this};l.prototype.setEnabled=function(e){this._oDateRangeSliderInternal.setEnabled(e);this.setProperty("enabled",e);return this};l.prototype.setLabels=function(e){this._oDateRangeSliderInternal.setLabels(e);this.setProperty("labels",e);return this};l.prototype.setStepLabels=function(e){this._oDateRangeSliderInternal.setStepLabels(e);this.setProperty("stepLabels",e);return this};l.prototype.setEditable=function(e){this._oDateRangeSliderInternal.setEditable(e);this.setProperty("editable",e);return this};l.prototype.setWidth=function(e){this._oDateRangeSliderInternal.setWidth(e);this.setProperty("width",e);return this};l.prototype.setShowBubbles=function(e){this._oDateRangeSliderInternal.setShowBubbles(e);this.setProperty("showBubbles",e);return this};l.prototype.setSmallStepWidth=function(e){this._oDateRangeSliderInternal.setSmallStepWidth(e);this.setProperty("smallStepWidth",e);return this};l.prototype.setTotalUnits=function(e){this._oDateRangeSliderInternal.setTotalUnits(e);this.setProperty("totalUnits",e);return this};l.setPropertiesBasedOnSliderInternal=function(e){e.setProperty("min",e._oDateRangeSliderInternal.getMinDate());e.setProperty("max",e._oDateRangeSliderInternal.getMaxDate());e.setProperty("value",e._oDateRangeSliderInternal.getValueDate());e.setProperty("value2",e._oDateRangeSliderInternal.getValue2Date());e._sGranularity=e._oDateRangeSliderInternal._sGranularity;return this};l.prototype.setDayGranularity=function(){this._oDateRangeSliderInternal.setDayGranularity();if(this._oDateRangeSliderInternal.isActive()){this._oDateRangeSliderInternal.rerender()}l.setPropertiesBasedOnSliderInternal(this);return this};l.prototype.setMonthGranularity=function(){var e=t.numberOfMonthsApart(this.getMin(),this.getMax());if(e>=1){this._oDateRangeSliderInternal.setMonthGranularity();if(this._oDateRangeSliderInternal.isActive()){this._oDateRangeSliderInternal.rerender()}l.setPropertiesBasedOnSliderInternal(this)}else{n.error("DateRangeSlider.setMonthGranularity(): Max Date should be 1 month after Min Date.")}return this};l.prototype.setDateFormat=function(e){this._oDateRangeSliderInternal.setDateFormat(e);if(this._oDateRangeSliderInternal.isActive()){this._oDateRangeSliderInternal.rerender()}return this};l.prototype.setPinGrip=function(e){this._oDateRangeSliderInternal.setPinGrip(e);this.setProperty("pinGrip",e);return this};l.prototype.setPinGrip2=function(e){this._oDateRangeSliderInternal.setPinGrip2(e);this.setProperty("pinGrip2",e);return this};l.prototype.exit=function(){this._oDateRangeSliderInternal.destroy();this._oDateRangeSliderInternal=null};l.prototype.handleChange=function(e){var t=e.getParameter("value");var a=e.getParameter("value2");this.fireChange({value:t,value2:a})};l.prototype.handleLiveChange=function(e){var t=e.getParameter("value");var a=e.getParameter("value2");this.fireLiveChange({value:t,value2:a})};return l});
//# sourceMappingURL=DateRangeSlider.js.map