/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define(["./library","sap/ui/commons/library","./util/DateUtils","sap/ui/commons/Label","sap/ui/core/Control","sap/ui/core/format/DateFormat","sap/base/Log","./DateRangeScrollerRenderer"],function(e,t,a,n,s,i,o,r){"use strict";var D=s.extend("sap.suite.ui.commons.DateRangeScroller",{metadata:{deprecated:true,library:"sap.suite.ui.commons",associations:{ariaDescribedBy:{type:"sap.ui.core.Control",multiple:true,singularName:"ariaDescribedBy"},ariaLabelledBy:{type:"sap.ui.core.Control",multiple:true,singularName:"ariaLabelledBy"}},events:{change:{parameters:{dateRange:{type:"any"}}}}}});var g="d";var h="w";var R="m";var u="y";var l="c";var d=7;D.getFormattedDate=function(e,t,a){var n;var s;switch(e){case g:n=a||i.getDateInstance({pattern:"MMMM d, YYYY"});s=n.format(t.startDate,false);break;case h:case l:var o=a||i.getDateInstance({pattern:"MMMM d"});var r=a||i.getDateInstance({pattern:"MMMM d, YYYY"});if(t.startDate.getYear()!==t.endDate.getYear()){o=r}else if(t.startDate.getMonth()===t.endDate.getMonth()){r=a||i.getDateInstance({pattern:"d, YYYY"})}var D=o.format(t.startDate,false);var d=r.format(t.endDate,false);s=D+" - "+d;break;case R:n=a||i.getDateInstance({pattern:"MMMM YYYY"});s=n.format(t.startDate,false);break;case u:n=a||i.getDateInstance({pattern:"YYYY"});s=n.format(t.startDate,false);break;default:s=t.startDate+" - "+t.endDate;break}return s};D.updateDateRangeValue=function(e,t,a,n){a.setText(D.getFormattedDate(e,t,n));if(a.isActive()){a.rerender()}};D.adjustDateByStep=function(e,t){if(t===0){return}e.setDate(e.getDate()+t)};D.adjustRangeByStep=function(e,t){var a=e.startDate;var n=e.endDate;a.setDate(a.getDate()+t);n.setDate(n.getDate()+t)};D.isValidDuration=function(e,t){var a=false;if(e===undefined){a=true}else if(!isNaN(e)&&isFinite(e)){if(e>=1&&(!t||e<=t)){a=true}}if(!a){o.error("DateRangeScroller duration value ='"+e+"' is invalid.")}return a};D.prototype.init=function(){this._sRangeType=g;this._iCustomDuration=1;this._oDateFormat=null;this._oDateRangeLabel=new n(this.getId()+"-dateRangeLabel",{labelFor:this.getId()});this._oDateRangeLabel.addStyleClass("sapSuiteUiCommonsDateRangeScrollerLabel");var e=new Date;a.resetDateToStartOfDay(e);var t=new Date;a.resetDateToEndOfDay(t);this._oDateRange={startDate:e,endDate:t};D.updateDateRangeValue(g,this._oDateRange,this._oDateRangeLabel,this._oDateFormat)};D.prototype.setDateRangeDay=function(e){if(a.isValidDate(e)){this._oDateRange.startDate.setTime(e.getTime());this._oDateRange.endDate.setTime(e.getTime());a.resetDateToStartOfDay(this._oDateRange.startDate);a.resetDateToEndOfDay(this._oDateRange.endDate);D.updateDateRangeValue(g,this._oDateRange,this._oDateRangeLabel,this._oDateFormat);this._sRangeType=g}return this};D.prototype.setDateRangeWeek=function(e,t){var n=d;var s=1;if(t){n=t.duration;s=t.firstDayOfWeek}if(n===undefined){n=d}else if(n&&!isNaN(n)){n=parseInt(n,10)}if(s===undefined){s=1}else if(s&&!isNaN(s)){s=parseInt(s,10)}if(s===null||s===""||isNaN(s)||s<0||s>6){o.error("DateRangeScroller oSettings.firstDayOfWeek value ='"+t.firstDayOfWeek+"' is invalid.")}else if(a.isValidDate(e)&&D.isValidDuration(n,d)){this._oDateRange.startDate.setTime(e.getTime());this._oDateRange.endDate.setTime(e.getTime());var i=n;var r=s;a.resetDateToStartOfWeek(this._oDateRange.startDate,s);a.resetDateToEndOfWeek(this._oDateRange.endDate,{iDuration:i,iFirstDayOfWeek:r});D.updateDateRangeValue(h,this._oDateRange,this._oDateRangeLabel,this._oDateFormat);this._sRangeType=h}return this};D.prototype.setDateRangeMonth=function(e){if(a.isValidDate(e)){this._oDateRange.startDate.setTime(e.getTime());this._oDateRange.endDate.setTime(e.getTime());a.resetDateToStartOfMonth(this._oDateRange.startDate);a.resetDateToEndOfMonth(this._oDateRange.endDate);D.updateDateRangeValue(R,this._oDateRange,this._oDateRangeLabel,this._oDateFormat);this._sRangeType=R}return this};D.prototype.setDateRangeYear=function(e){if(a.isValidDate(e)){this._oDateRange.startDate.setTime(e.getTime());this._oDateRange.endDate.setTime(e.getTime());a.resetDateToStartOfYear(this._oDateRange.startDate);a.resetDateToEndOfYear(this._oDateRange.endDate);D.updateDateRangeValue(u,this._oDateRange,this._oDateRangeLabel,this._oDateFormat);this._sRangeType=u}return this};D.prototype.setDateRangeCustom=function(e,t){if(t===undefined){t=this._iCustomDuration}else if(t&&!isNaN(t)){t=parseInt(t,10)}if(a.isValidDate(e)&&D.isValidDuration(t)){this._oDateRange.startDate.setTime(e.getTime());this._oDateRange.endDate.setTime(e.getTime());a.resetDateToStartOfDay(this._oDateRange.startDate);D.adjustDateByStep(this._oDateRange.endDate,t-1);a.resetDateToEndOfDay(this._oDateRange.endDate);D.updateDateRangeValue(l,this._oDateRange,this._oDateRangeLabel,this._oDateFormat);this._sRangeType=l;this._iCustomDuration=t}return this};D.prototype.incrementDateRange=function(){switch(this._sRangeType){case g:D.adjustRangeByStep(this._oDateRange,1);D.updateDateRangeValue(g,this._oDateRange,this._oDateRangeLabel,this._oDateFormat);break;case h:D.adjustRangeByStep(this._oDateRange,d);D.updateDateRangeValue(h,this._oDateRange,this._oDateRangeLabel,this._oDateFormat);break;case l:D.adjustRangeByStep(this._oDateRange,this._iCustomDuration);D.updateDateRangeValue(l,this._oDateRange,this._oDateRangeLabel,this._oDateFormat);break;case R:var e=this._oDateRange.startDate.getMonth()+1;this._oDateRange.startDate.setMonth(e);this._oDateRange.endDate.setTime(this._oDateRange.startDate.getTime());a.resetDateToEndOfMonth(this._oDateRange.endDate);D.updateDateRangeValue(R,this._oDateRange,this._oDateRangeLabel,this._oDateFormat);break;case u:e=this._oDateRange.startDate.getFullYear()+1;this._oDateRange.startDate.setFullYear(e);this._oDateRange.endDate.setTime(this._oDateRange.startDate.getTime());a.resetDateToEndOfYear(this._oDateRange.endDate);D.updateDateRangeValue(u,this._oDateRange,this._oDateRangeLabel,this._oDateFormat);break;default:return this}var t=this.getDateRange();this.fireChange({dateRange:t});return this};D.prototype.decrementDateRange=function(){switch(this._sRangeType){case g:D.adjustRangeByStep(this._oDateRange,-1);D.updateDateRangeValue(g,this._oDateRange,this._oDateRangeLabel,this._oDateFormat);break;case h:D.adjustRangeByStep(this._oDateRange,-d);D.updateDateRangeValue(h,this._oDateRange,this._oDateRangeLabel,this._oDateFormat);break;case l:D.adjustRangeByStep(this._oDateRange,-this._iCustomDuration);D.updateDateRangeValue(l,this._oDateRange,this._oDateRangeLabel,this._oDateFormat);break;case R:var e=this._oDateRange.startDate.getMonth()-1;this._oDateRange.startDate.setMonth(e);this._oDateRange.endDate.setTime(this._oDateRange.startDate.getTime());a.resetDateToEndOfMonth(this._oDateRange.endDate);D.updateDateRangeValue(R,this._oDateRange,this._oDateRangeLabel,this._oDateFormat);break;case u:e=this._oDateRange.startDate.getFullYear()-1;this._oDateRange.startDate.setFullYear(e);this._oDateRange.endDate.setTime(this._oDateRange.startDate.getTime());a.resetDateToEndOfYear(this._oDateRange.endDate);D.updateDateRangeValue(u,this._oDateRange,this._oDateRangeLabel,this._oDateFormat);break;default:return this}var t=this.getDateRange();this.fireChange({dateRange:t});return this};D.prototype.getDateRange=function(){var e={startDate:new Date(this._oDateRange.startDate.getTime()),endDate:new Date(this._oDateRange.endDate.getTime())};return e};D.prototype.setDateFormat=function(e){if(e&&e instanceof i){this._oDateFormat=e}else{this._oDateFormat=null}D.updateDateRangeValue(this._sRangeType,this._oDateRange,this._oDateRangeLabel,this._oDateFormat)};D.prototype.onclick=function(e){switch(e.target){case this.$("decrementScrollButton")[0]:this.decrementDateRange();break;case this.$("incrementScrollButton")[0]:this.incrementDateRange();break;default:break}this.$("labelarea").focus()};D.prototype.onsapright=function(e){this.incrementDateRange();e.preventDefault();e.stopPropagation()};D.prototype.onsapleft=function(e){this.decrementDateRange();e.preventDefault();e.stopPropagation()};D.prototype.onsapup=function(e){this.incrementDateRange();e.preventDefault();e.stopPropagation()};D.prototype.onsapdown=function(e){this.decrementDateRange();e.preventDefault();e.stopPropagation()};return D});
//# sourceMappingURL=DateRangeScroller.js.map