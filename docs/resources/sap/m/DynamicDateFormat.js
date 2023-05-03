/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/core/format/DateFormat","sap/ui/core/format/NumberFormat","sap/ui/core/Locale","sap/ui/core/LocaleData","sap/base/util/deepExtend","sap/ui/unified/calendar/CalendarUtils","./library","sap/ui/core/Configuration"],function(t,e,a,r,i,n,o,s){"use strict";var m=function(){throw new Error};var u=sap.ui.getCore().getLibraryResourceBundle("sap.m");var l={};var c={};var f={DATE:["date"],DATETIME:["datetime"],DATERANGE:["date","date"],DATETIMERANGE:["datetime","datetime"],LASTDAYS:["int"],LASTWEEKS:["int"],LASTMONTHS:["int"],LASTQUARTERS:["int"],LASTYEARS:["int"],NEXTDAYS:["int"],NEXTWEEKS:["int"],NEXTMONTHS:["int"],NEXTQUARTERS:["int"],NEXTYEARS:["int"],FROM:["date"],TO:["date"],FROMDATETIME:["datetime"],TODATETIME:["datetime"],SPECIFICMONTH:["month"],SPECIFICMONTHINYEAR:["month","int"],TODAYFROMTO:["int","int"]};var T=Object.keys(o.StandardDynamicDateRangeKeys);for(var p=0;p<T.length;p++){var F=T[p];var O=u.getText("DYNAMIC_DATE_"+F.toUpperCase()+"_FORMAT");var E=O.split("{").map(function(t){var e=t.indexOf("}");if(e!==-1){return t.slice(e+1)}return t});l[F]=E;var d=[];var h=O.indexOf("{");var D=-1;var A=-1;while(h!==-1){D=O.indexOf("}");A=parseInt(O.slice(h+1,D-D-1));d.push(A);O=O.slice(D+1);h=O.indexOf("{")}c[F]=d}m.getInstance=function(t,e){return this.createInstance(t,e)};m.oDefaultDynamicDateFormat={date:{},datetime:{},month:{pattern:"MMMM"},year:{pattern:"yyyy"},int:{}};m.createInstance=function(n,o){var u=Object.create(this.prototype);if(n instanceof a){o=n;n=undefined}if(!o){o=s.getFormatSettings().getFormatLocale()}u.oLocale=o;u.oLocaleData=r.getInstance(o);u.oOriginalFormatOptions=i({},m.oDefaultDynamicDateFormat,n);u._dateFormatter=t.getInstance(u.oOriginalFormatOptions["date"]);u._dateTimeFormatter=t.getDateTimeInstance(u.oOriginalFormatOptions["datetime"]);[u._dateFormatter].concat(u._dateFormatter.aFallbackFormats).forEach(function(t){t.parseRelative=function(){return null}});[u._dateTimeFormatter].concat(u._dateTimeFormatter.aFallbackFormats).forEach(function(t){t.parseRelative=function(){return null}});u._monthFormatter=t.getInstance(u.oOriginalFormatOptions["month"]);u._yearFormatter=t.getInstance(u.oOriginalFormatOptions["year"]);u._numberFormatter=e.getInstance(u.oOriginalFormatOptions["int"]);u._resourceBundle=sap.ui.getCore().getLibraryResourceBundle("sap.m");return u};m.prototype.format=function(t,e){var a=t.operator,r=t.values.slice(0);if(a==="SPECIFICMONTH"){var i=new Date;i.setMonth(r[0]);r[0]=this._monthFormatter.format(i)}else if(a==="SPECIFICMONTHINYEAR"){var i=new Date;i.setMonth(r[0]);i.setYear(r[1]);r[0]=this._monthFormatter.format(i);r[1]=this._yearFormatter.format(i)}else if(a==="LASTDAYS"&&r[0]===1&&!e){a="YESTERDAY";r=[]}else if(a==="NEXTDAYS"&&r[0]===1&&!e){a="TOMORROW";r=[]}else if((a==="LASTDAYS"||a==="NEXTDAYS")&&r[0]===0){a="TODAY";r=[]}else if(a==="DATETIME"){r[0]=this._dateTimeFormatter.format(t.values[0])}else if(a==="TODAYFROMTO"){r[0]=-r[0];if(r[0]>r[1]){r=[r[1],r[0]]}}var n=r.map(function(t){if(t instanceof Date){if(a==="DATETIMERANGE"||a==="FROMDATETIME"||a==="TODATETIME"){return this._dateTimeFormatter.format(t)}return this._dateFormatter.format(t)}if(typeof t==="number"){return this._numberFormatter.format(t)}else{return t.toString()}},this);if(a==="TODAYFROMTO"){n.forEach(function(t,e,a){if(t==="0"){a[e]=(e===0?this.oLocaleData.getNumberSymbol("minusSign"):this.oLocaleData.getNumberSymbol("plusSign"))+t}else{a[e]=r[e]<0?t.toString():this.oLocaleData.getNumberSymbol("plusSign")+t}},this)}return this._resourceBundle.getText("DYNAMIC_DATE_"+a.toUpperCase()+"_FORMAT",n)};m.prototype.parse=function(t,e){var a,r=l[e],i="^"+r.join("(.*)")+"$",o=new RegExp(i,"i"),s=t.match(o);if(s){a={};a.values=[];for(var m=0;m<c[e].length;m++){var u=c[e][m];var T=f[e][u];var p;var F=s[m+1];switch(T){case"date":p=this._dateFormatter.parse(F);break;case"datetime":p=this._dateTimeFormatter.parse(F);break;case"month":var O=[0,1,2,3,4,5,6,7,8,9,10,11].map(function(t){var e=new Date;e.setMonth(t);return this._monthFormatter.format(e)},this);var E=O.indexOf(F);p=E!==-1?E:null;break;case"int":p=this._numberFormatter.parse(F);break;case"string":p=F;break;default:break}if(p&&(T==="date"||T==="datetime")){try{n._checkYearInValidRange(p.getFullYear())}catch(t){p=null}}if(!p&&p!==0){a=null;break}a.values[u]=p}if(e==="TODAYFROMTO"&&a){if(a.values[0]>a.values[1]){a.values=[a.values[1],a.values[0]]}a.values[0]=-a.values[0]}if(a){a.operator=e;return a}}};m.prototype._checkFormatterUTCTimezone=function(t){var e="";if(f[t]){e=f[t][0]}if(e===""||e[0]==="int"){e="date"}if(this.oOriginalFormatOptions[e]){return this.oOriginalFormatOptions[e].UTC}return false};return m});
//# sourceMappingURL=DynamicDateFormat.js.map