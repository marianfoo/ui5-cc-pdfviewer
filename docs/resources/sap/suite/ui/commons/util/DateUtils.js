/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define(["sap/base/Log"],function(e){"use strict";var t=function(){throw new Error};t.resetDateToStartOfDay=function(e){if(t.isValidDate(e)){e.setHours(0);e.setMinutes(0);e.setSeconds(0);e.setMilliseconds(0)}};t.resetDateToEndOfDay=function(e){if(t.isValidDate(e)){e.setHours(23);e.setMinutes(59);e.setSeconds(59);e.setMilliseconds(999)}};t.resetDateToStartOfMonth=function(e){if(t.isValidDate(e)){e.setDate(1);t.resetDateToStartOfDay(e)}};t.resetDateToEndOfMonth=function(e){if(t.isValidDate(e)){e.setDate(1);e.setMonth(e.getMonth()+1);e.setDate(0);t.resetDateToEndOfDay(e)}};t.resetDateToStartOfYear=function(e){if(t.isValidDate(e)){e.setMonth(0);t.resetDateToStartOfMonth(e)}};t.resetDateToEndOfYear=function(e){if(t.isValidDate(e)){e.setMonth(11);t.resetDateToEndOfMonth(e)}};t.resetDateToStartOfWeek=function(a,n){if(t.isValidDate(a)){if(n===undefined){n=1}else if(isNaN(n)||!isFinite(n)){e.error("DateUtils iFirstDayOfWeek value ='"+n+"' is invalid.");return}a.setDate(a.getDate()-(a.getDay()-n+7)%7);t.resetDateToStartOfDay(a)}};t.resetDateToEndOfWeek=function(a,n){if(t.isValidDate(a)){var i;if(n&&!(n instanceof Object)){e.error("DateUtils oSettings is not an object.");return}if(!n){n={}}if(n.iDuration===undefined){i=7}else{i=n.iDuration;if(isNaN(i)||!isFinite(i)){e.error("DateUtils duration value ='"+i+"' is invalid.");return}}t.resetDateToStartOfWeek(a,n.iFirstDayOfWeek);a.setDate(a.getDate()+i-1);t.resetDateToEndOfDay(a)}};t.isValidDate=function(t){if(Object.prototype.toString.call(t)!=="[object Date]"||isNaN(t.getTime())){e.error("DateUtils invalid date="+t);return false}return true};t.dateDaysEqual=function(e,a){if(t.isValidDate(e)&&t.isValidDate(a)){return e.getFullYear()===a.getFullYear()&&e.getMonth()===a.getMonth()&&e.getDate()===a.getDate()}return false};t.dateMonthsEqual=function(e,a){if(t.isValidDate(e)&&t.isValidDate(a)){return e.getFullYear()===a.getFullYear()&&e.getMonth()===a.getMonth()}return false};t.incrementDateByIndex=function(e,a){var n=null;if(t.isValidDate(e)&&isFinite(a)){n=new Date(e);n.setDate(e.getDate()+parseInt(a,10))}return n};t.incrementMonthByIndex=function(e,a){var n=null;if(t.isValidDate(e)&&isFinite(a)){n=new Date(e);t.resetDateToStartOfMonth(n);n.setMonth(e.getMonth()+parseInt(a,10))}return n};t.numberOfMonthsApart=function(e,a){e=new Date(e);a=new Date(a);t.resetDateToStartOfMonth(e);t.resetDateToStartOfMonth(a);var n=e.getTime()<=a.getTime();var i=0,r=0,s=0;for(i=0,r=0;!(e.getDate()===a.getDate()&&e.getMonth()===a.getMonth()&&e.getFullYear()===a.getFullYear());i++,r--){if(n){e.setMonth(e.getMonth()+1)}else{e.setMonth(e.getMonth()-1)}}if(n){s=i}else{s=r}return s};t.numberOfDaysApart=function(e,a){e=new Date(e);a=new Date(a);t.resetDateToStartOfDay(e);t.resetDateToStartOfDay(a);var n=24*60*60*1e3;var i=Math.round(Math.abs((e.getTime()-a.getTime())/n));if(e.getTime()>a.getTime()){return-i}else{return i}};t.parseDate=function(e,t){if(e instanceof Date||e===null){return e}t=t!==false;if(typeof e==="string"){var a=/Date\((-*\d+)\)/.exec(e);if(a===null){if(t){var n=Date.parse(e);if(!isNaN(n)){e=new Date(n)}else if(!isNaN(e)){e=new Date(parseInt(e,10))}}}else{e=new Date(parseInt(a[1],10))}}else{e=new Date(parseInt(e,10))}return e};return t},true);
//# sourceMappingURL=DateUtils.js.map