/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/core/CalendarType","sap/ui/core/Locale","sap/ui/core/LocaleData","sap/ui/core/date/UniversalDate","sap/ui/core/date/CalendarUtils","sap/ui/core/date/CalendarWeekNumbering","sap/ui/core/format/TimezoneUtil","sap/base/util/deepEqual","sap/base/strings/formatMessage","sap/base/Log","sap/base/util/extend","sap/ui/core/Configuration"],function(e,t,a,r,n,i,o,s,l,u,f,c){"use strict";var d=function(){throw new Error};var h={DATE:"date",TIME:"time",DATETIME:"datetime",DATETIME_WITH_TIMEZONE:"datetimeWithTimezone"};var m={};var g=function(e){if(typeof e!=="string"&&!(e instanceof String)&&e!=null){throw new TypeError("The given timezone must be a string.")}};d.oDateInfo={type:h.DATE,oDefaultFormatOptions:{style:"medium",relativeScale:"day",relativeStyle:"wide"},aFallbackFormatOptions:[{style:"short"},{style:"medium"},{pattern:"yyyy-MM-dd"},{pattern:"yyyyMMdd",strictParsing:true}],bShortFallbackFormatOptions:true,bPatternFallbackWithoutDelimiter:true,getPattern:function(e,t,a){return e.getDatePattern(t,a)},oRequiredParts:{text:true,year:true,weekYear:true,month:true,day:true},aRelativeScales:["year","month","week","day"],aRelativeParseScales:["year","quarter","month","week","day","hour","minute","second"],aIntervalCompareFields:["Era","FullYear","Quarter","Month","Week","Date"]};d.oDateTimeInfo={type:h.DATETIME,oDefaultFormatOptions:{style:"medium",relativeScale:"auto",relativeStyle:"wide"},aFallbackFormatOptions:[{style:"short"},{style:"medium"},{pattern:"yyyy-MM-dd'T'HH:mm:ss"},{pattern:"yyyyMMdd HHmmss"}],getPattern:function(e,t,a){var r=t.indexOf("/");if(r>0){return e.getCombinedDateTimePattern(t.substr(0,r),t.substr(r+1),a)}else{return e.getCombinedDateTimePattern(t,t,a)}},oRequiredParts:{text:true,year:true,weekYear:true,month:true,day:true,hour0_23:true,hour1_24:true,hour0_11:true,hour1_12:true},aRelativeScales:["year","month","week","day","hour","minute","second"],aRelativeParseScales:["year","quarter","month","week","day","hour","minute","second"],aIntervalCompareFields:["Era","FullYear","Quarter","Month","Week","Date","DayPeriod","Hours","Minutes","Seconds"]};d._getDateTimeWithTimezoneInfo=function(e){var t=e.showDate===undefined||e.showDate;var a=e.showTime===undefined||e.showTime;var r=e.showTimezone===undefined||e.showTimezone;var n=d.oDateTimeInfo;if(t&&!a){n=d.oDateInfo}else if(!t&&a){n=d.oTimeInfo}return Object.assign({},n,{type:h.DATETIME_WITH_TIMEZONE,getTimezonePattern:function(e){if(!t&&!a&&r){return"VV"}else if(!r){return e}else{return e+" VV"}},getPattern:function(e,i,o){if(!t&&!a&&r){return"VV"}if(!r){return n.getPattern(e,i,o)}var s=n.getPattern(e,i,o);return e.applyTimezonePattern(s)}})};d.oTimeInfo={type:h.TIME,oDefaultFormatOptions:{style:"medium",relativeScale:"auto",relativeStyle:"wide"},aFallbackFormatOptions:[{style:"short"},{style:"medium"},{pattern:"HH:mm:ss"},{pattern:"HHmmss"}],getPattern:function(e,t,a){return e.getTimePattern(t,a)},oRequiredParts:{text:true,hour0_23:true,hour1_24:true,hour0_11:true,hour1_12:true},aRelativeScales:["hour","minute","second"],aRelativeParseScales:["year","quarter","month","week","day","hour","minute","second"],aIntervalCompareFields:["DayPeriod","Hours","Minutes","Seconds"]};d.getInstance=function(e,t){return this.getDateInstance(e,t)};d.getDateInstance=function(e,t){return this.createInstance(e,t,this.oDateInfo)};d.getDateTimeInstance=function(e,t){return this.createInstance(e,t,this.oDateTimeInfo)};d.getDateTimeWithTimezoneInstance=function(e,a){if(e&&!(e instanceof t)){e=Object.assign({},e);if(typeof e.showTimezone==="string"){var r=e.showTimezone;if(e.showDate===undefined&&e.showTime===undefined){if(r==="Hide"){e.showTimezone=false}else if(r==="Only"){e.showDate=false;e.showTime=false}}e.showTimezone=r!=="Hide"}if(e.showDate===false&&e.showTime===false&&e.showTimezone===false){throw new TypeError("Invalid Configuration. One of the following format options must be true: showDate, showTime or showTimezone.")}}return this.createInstance(e,a,d._getDateTimeWithTimezoneInfo(e||{}))};d.getTimeInstance=function(e,t){return this.createInstance(e,t,this.oTimeInfo)};function p(e){var t=e.oLocaleData.getIntervalPattern("",e.oFormatOptions.calendarType);t=t.replace(/[^\{\}01 ]/,"-");return t.replace(/\{(0|1)\}/g,e.oFormatOptions.pattern)}d.createInstance=function(e,r,n){var o=Object.create(this.prototype);if(e instanceof t){r=e;e=undefined}if(!r){r=c.getFormatSettings().getFormatLocale()}o.oLocale=r;o.oLocaleData=a.getInstance(r);o.oFormatOptions=f({},n.oDefaultFormatOptions,e);if(n.type===h.DATETIME_WITH_TIMEZONE){o.oFormatOptions.interval=false;o.oFormatOptions.singleIntervalValue=false;o.oFormatOptions.UTC=false}else{o.oFormatOptions.showTimezone=undefined;o.oFormatOptions.showDate=undefined;o.oFormatOptions.showTime=undefined}o.type=n.type;if(!o.oFormatOptions.calendarType){o.oFormatOptions.calendarType=c.getCalendarType()}if(o.oFormatOptions.firstDayOfWeek===undefined&&o.oFormatOptions.minimalDaysInFirstWeek!==undefined||o.oFormatOptions.firstDayOfWeek!==undefined&&o.oFormatOptions.minimalDaysInFirstWeek===undefined){throw new TypeError("Format options firstDayOfWeek and minimalDaysInFirstWeek need both to be set, but only one was provided.")}if(o.oFormatOptions.calendarWeekNumbering&&!Object.values(i).includes(o.oFormatOptions.calendarWeekNumbering)){throw new TypeError("Illegal format option calendarWeekNumbering: '"+o.oFormatOptions.calendarWeekNumbering+"'")}if(!o.oFormatOptions.pattern){if(o.oFormatOptions.format){o.oFormatOptions.pattern=o.oLocaleData.getCustomDateTimePattern(o.oFormatOptions.format,o.oFormatOptions.calendarType)}else{o.oFormatOptions.pattern=n.getPattern(o.oLocaleData,o.oFormatOptions.style,o.oFormatOptions.calendarType)}}if(o.oFormatOptions.interval){if(o.oFormatOptions.format){o.intervalPatterns=o.oLocaleData.getCustomIntervalPattern(o.oFormatOptions.format,null,o.oFormatOptions.calendarType);if(typeof o.intervalPatterns==="string"){o.intervalPatterns=[o.intervalPatterns]}o.intervalPatterns.push(o.oLocaleData.getCustomDateTimePattern(o.oFormatOptions.format,o.oFormatOptions.calendarType))}else{o.intervalPatterns=[o.oLocaleData.getCombinedIntervalPattern(o.oFormatOptions.pattern,o.oFormatOptions.calendarType),o.oFormatOptions.pattern]}var s=p(o);o.intervalPatterns.push(s)}if(!o.oFormatOptions.fallback){if(!n.oFallbackFormats){n.oFallbackFormats={}}var l=r.toString(),u=o.oFormatOptions.calendarType,m=l+"-"+u,g,v;if(o.oFormatOptions.pattern&&n.bPatternFallbackWithoutDelimiter){m=m+"-"+o.oFormatOptions.pattern}if(o.oFormatOptions.interval){m=m+"-"+"interval"}var y=n.oFallbackFormats[m]?Object.assign({},n.oFallbackFormats[m]):undefined;if(!y){v=n.aFallbackFormatOptions;if(n.bShortFallbackFormatOptions){g=n.getPattern(o.oLocaleData,"short");v=v.concat(d._createFallbackOptionsWithoutDelimiter(g))}if(o.oFormatOptions.pattern&&n.bPatternFallbackWithoutDelimiter){v=d._createFallbackOptionsWithoutDelimiter(o.oFormatOptions.pattern).concat(v)}y=d._createFallbackFormat(v,u,r,n,o.oFormatOptions)}o.aFallbackFormats=y}o.oRequiredParts=n.oRequiredParts;o.aRelativeScales=n.aRelativeScales;o.aRelativeParseScales=n.aRelativeParseScales;o.aIntervalCompareFields=n.aIntervalCompareFields;o.init();return o};d.prototype.init=function(){var e=this.oFormatOptions.calendarType;this.aMonthsAbbrev=this.oLocaleData.getMonths("abbreviated",e);this.aMonthsWide=this.oLocaleData.getMonths("wide",e);this.aMonthsNarrow=this.oLocaleData.getMonths("narrow",e);this.aMonthsAbbrevSt=this.oLocaleData.getMonthsStandAlone("abbreviated",e);this.aMonthsWideSt=this.oLocaleData.getMonthsStandAlone("wide",e);this.aMonthsNarrowSt=this.oLocaleData.getMonthsStandAlone("narrow",e);this.aDaysAbbrev=this.oLocaleData.getDays("abbreviated",e);this.aDaysWide=this.oLocaleData.getDays("wide",e);this.aDaysNarrow=this.oLocaleData.getDays("narrow",e);this.aDaysShort=this.oLocaleData.getDays("short",e);this.aDaysAbbrevSt=this.oLocaleData.getDaysStandAlone("abbreviated",e);this.aDaysWideSt=this.oLocaleData.getDaysStandAlone("wide",e);this.aDaysNarrowSt=this.oLocaleData.getDaysStandAlone("narrow",e);this.aDaysShortSt=this.oLocaleData.getDaysStandAlone("short",e);this.aQuartersAbbrev=this.oLocaleData.getQuarters("abbreviated",e);this.aQuartersWide=this.oLocaleData.getQuarters("wide",e);this.aQuartersNarrow=this.oLocaleData.getQuarters("narrow",e);this.aQuartersAbbrevSt=this.oLocaleData.getQuartersStandAlone("abbreviated",e);this.aQuartersWideSt=this.oLocaleData.getQuartersStandAlone("wide",e);this.aQuartersNarrowSt=this.oLocaleData.getQuartersStandAlone("narrow",e);this.aErasNarrow=this.oLocaleData.getEras("narrow",e);this.aErasAbbrev=this.oLocaleData.getEras("abbreviated",e);this.aErasWide=this.oLocaleData.getEras("wide",e);this.aDayPeriodsAbbrev=this.oLocaleData.getDayPeriods("abbreviated",e);this.aDayPeriodsNarrow=this.oLocaleData.getDayPeriods("narrow",e);this.aDayPeriodsWide=this.oLocaleData.getDayPeriods("wide",e);this.aFormatArray=this.parseCldrDatePattern(this.oFormatOptions.pattern);this.sAllowedCharacters=this.getAllowedCharacters(this.aFormatArray)};d._createFallbackFormat=function(e,t,a,r,n){return e.map(function(e){var i=Object.assign({},e);i.showDate=n.showDate;i.showTime=n.showTime;i.showTimezone=n.showTimezone;if(typeof r.getTimezonePattern==="function"&&i.pattern){i.pattern=r.getTimezonePattern(i.pattern)}if(n.interval){i.interval=true}i.calendarType=t;i.fallback=true;var o=d.createInstance(i,a,r);o.bIsFallback=true;return o})};d._createFallbackOptionsWithoutDelimiter=function(e){var t=/[^dMyGU]/g,a={regex:/d+/g,replace:"dd"},r={regex:/M+/g,replace:"MM"},n={regex:/[yU]+/g,replace:["yyyy","yy"]};e=e.replace(t,"");e=e.replace(a.regex,a.replace);e=e.replace(r.regex,r.replace);return n.replace.map(function(t){return{pattern:e.replace(n.regex,t),strictParsing:true}})};var v={isNumber:function(e){return e>=48&&e<=57},findNumbers:function(e,t){var a=0;while(a<t&&this.isNumber(e.charCodeAt(a))){a++}if(typeof e!=="string"){e=e.toString()}return e.substr(0,a)},startsWithIgnoreCase:function(e,t,a){if(e.startsWith(t)){return true}try{var r=t.toLocaleUpperCase(a);var n=e.toLocaleUpperCase(a);if(r.length!==t.length||n.length!==e.length){return false}return n.startsWith(r)}catch(e){return false}},findEntry:function(e,t,a){var r=-1,n=0;for(var i=0;i<t.length;i++){if(t[i]&&t[i].length>n&&this.startsWithIgnoreCase(e,t[i],a)){r=i;n=t[i].length}}return{index:r,length:n}},parseTZ:function(e,t){var a=0;var r=e.charAt(0)=="+"?-1:1;var n;a++;n=this.findNumbers(e.substr(a),2);var i=parseInt(n);a+=2;if(t){a++}n=this.findNumbers(e.substr(a),2);var o=0;if(n){a+=2;o=parseInt(n)}return{length:a,tzDiff:(o+60*i)*60*r}},checkValid:function(e,t,a){if(e in a.oRequiredParts&&t){return false}}};d._createPatternSymbol=function(e){var t=typeof e.isNumeric==="function"&&e.isNumeric||function(){return e.isNumeric||false};return{name:e.name,format:e.format||function(){return""},parse:e.parse||function(){return{}},isNumeric:t}};d.prototype.oSymbols={"":d._createPatternSymbol({name:"text",format:function(e,t){return e.value},parse:function(e,t,a,r){var n;var i=true;var o=0;var s=0;var l="-~‐‑‒–—﹘﹣－～";for(;s<t.value.length;s++){n=t.value.charAt(s);if(n===" "){while(e.charAt(o)===" "){o++}}else if(l.includes(n)){if(!l.includes(e.charAt(o))){i=false}o++}else{if(e.charAt(o)!==n){i=false}o++}if(!i){break}}if(i){return{length:o}}else{var u=false;if(r.index<r.formatArray.length-1){u=r.formatArray[r.index+1].type in a.oRequiredParts}return{valid:v.checkValid(t.type,u,a)}}}}),G:d._createPatternSymbol({name:"era",format:function(e,t,a,r){var n=t.getUTCEra();if(e.digits<=3){return r.aErasAbbrev[n]}else if(e.digits===4){return r.aErasWide[n]}else{return r.aErasNarrow[n]}},parse:function(e,t,a,r){var n=[a.aErasWide,a.aErasAbbrev,a.aErasNarrow];for(var i=0;i<n.length;i++){var o=n[i];var s=v.findEntry(e,o,a.oLocaleData.sCLDRLocaleId);if(s.index!==-1){return{era:s.index,length:s.length}}}return{era:a.aErasWide.length-1,valid:v.checkValid(t.type,true,a)}}}),y:d._createPatternSymbol({name:"year",format:function(t,a,r,n){var i=a.getUTCFullYear();var o=String(i);var s=n.oFormatOptions.calendarType;if(t.digits==2&&o.length>2){o=o.substr(o.length-2)}if(s!=e.Japanese&&t.digits==1&&i<100){o=o.padStart(4,"0")}return o.padStart(t.digits,"0")},parse:function(t,a,n,i){var o,s,l,u=n.oFormatOptions.calendarType;if(a.digits==1){o=4}else if(a.digits==2){o=2}else{o=a.digits}s=v.findNumbers(t,o);l=s===""||i.exactLength&&s.length!==o;var f=parseInt(s);if(u!=e.Japanese&&s.length<=2){var c=r.getInstance(new Date,u),d=c.getUTCFullYear(),h=Math.floor(d/100),m=h*100+f-d;if(m<-70){f+=(h+1)*100}else if(m<30){f+=h*100}else{f+=(h-1)*100}}return{length:s.length,valid:v.checkValid(a.type,l,n),year:f}},isNumeric:true}),Y:d._createPatternSymbol({name:"weekYear",format:function(t,a,r,n){var i=a.getUTCWeek(n.oLocale,T(n.oFormatOptions));var o=i.year;var s=String(o);var l=n.oFormatOptions.calendarType;if(t.digits==2&&s.length>2){s=s.substr(s.length-2)}if(l!=e.Japanese&&t.digits==1&&o<100){s=s.padStart(4,"0")}return s.padStart(t.digits,"0")},parse:function(t,a,n,i){var o,s,l,u=n.oFormatOptions.calendarType;if(a.digits==1){o=4}else if(a.digits==2){o=2}else{o=a.digits}s=v.findNumbers(t,o);l=s===""||i.exactLength&&s.length!==o;var f=parseInt(s);var c=f;if(u!=e.Japanese&&s.length<=2){var d=r.getInstance(new Date,u),h=d.getUTCFullYear(),m=Math.floor(h/100),g=m*100+c-h;if(g<-70){c+=(m+1)*100}else if(g<30){c+=m*100}else{c+=(m-1)*100}}return{length:s.length,valid:v.checkValid(a.type,l,n),year:f,weekYear:c}},isNumeric:true}),M:d._createPatternSymbol({name:"month",format:function(e,t,a,r){var n=t.getUTCMonth();if(e.digits==3){return r.aMonthsAbbrev[n]}else if(e.digits==4){return r.aMonthsWide[n]}else if(e.digits>4){return r.aMonthsNarrow[n]}else{return String(n+1).padStart(e.digits,"0")}},parse:function(e,t,a,r){var n,i,o,s,l=[a.aMonthsWide,a.aMonthsWideSt,a.aMonthsAbbrev,a.aMonthsAbbrevSt,a.aMonthsNarrow,a.aMonthsNarrowSt];if(t.digits<3){i=v.findNumbers(e,Math.max(t.digits,2));o=i===""||r.exactLength&&i.length<2;s=v.checkValid(t.type,o,a);n=parseInt(i)-1;if(r.strict&&(n>11||n<0)){s=false}}else{for(var u=0;u<l.length;u++){var f=l[u];var c=v.findEntry(e,f,a.oLocaleData.sCLDRLocaleId);if(c.index!==-1){return{month:c.index,length:c.length}}}s=v.checkValid(t.type,true,a)}return{month:n,length:i?i.length:0,valid:s}},isNumeric:function(e){return e<3}}),L:d._createPatternSymbol({name:"monthStandalone",format:function(e,t,a,r){var n=t.getUTCMonth();if(e.digits==3){return r.aMonthsAbbrevSt[n]}else if(e.digits==4){return r.aMonthsWideSt[n]}else if(e.digits>4){return r.aMonthsNarrowSt[n]}else{return String(n+1).padStart(e.digits,"0")}},parse:function(e,t,a,r){var n,i,o,s,l=[a.aMonthsWide,a.aMonthsWideSt,a.aMonthsAbbrev,a.aMonthsAbbrevSt,a.aMonthsNarrow,a.aMonthsNarrowSt];if(t.digits<3){i=v.findNumbers(e,Math.max(t.digits,2));o=i===""||r.exactLength&&i.length<2;s=v.checkValid(t.type,o,a);n=parseInt(i)-1;if(r.strict&&(n>11||n<0)){s=false}}else{for(var u=0;u<l.length;u++){var f=l[u];var c=v.findEntry(e,f,a.oLocaleData.sCLDRLocaleId);if(c.index!==-1){return{month:c.index,length:c.length}}}s=v.checkValid(t.type,true,a)}return{month:n,length:i?i.length:0,valid:s}},isNumeric:function(e){return e<3}}),w:d._createPatternSymbol({name:"weekInYear",format:function(e,t,a,r){var n=t.getUTCWeek(r.oLocale,T(r.oFormatOptions));var i=n.week;var o=String(i+1);if(e.digits<3){o=o.padStart(e.digits,"0")}else{o=r.oLocaleData.getCalendarWeek(e.digits===3?"narrow":"wide",o.padStart(2,"0"))}return o},parse:function(e,t,a,r){var n,i,o,s,l=0;if(t.digits<3){n=v.findNumbers(e,2);l=n.length;s=parseInt(n)-1;i=!n||r.exactLength&&l<2;o=v.checkValid(t.type,i,a)}else{n=a.oLocaleData.getCalendarWeek(t.digits===3?"narrow":"wide");n=n.replace("{0}","([0-9]+)");var u=new RegExp(n),f=u.exec(e);if(f){l=f[0].length;s=parseInt(f[f.length-1])-1}else{o=v.checkValid(t.type,true,a)}}return{length:l,valid:o,week:s}},isNumeric:function(e){return e<3}}),W:d._createPatternSymbol({name:"weekInMonth"}),D:d._createPatternSymbol({name:"dayInYear"}),d:d._createPatternSymbol({name:"day",format:function(e,t){var a=t.getUTCDate();return String(a).padStart(e.digits,"0")},parse:function(e,t,a,r){var n=v.findNumbers(e,Math.max(t.digits,2)),i=n===""||r.exactLength&&n.length<2,o=v.checkValid(t.type,i,a),s=parseInt(n);if(r.strict&&(s>31||s<1)){o=false}return{day:s,length:n.length,valid:o}},isNumeric:true}),Q:d._createPatternSymbol({name:"quarter",format:function(e,t,a,r){var n=t.getUTCQuarter();if(e.digits==3){return r.aQuartersAbbrev[n]}else if(e.digits==4){return r.aQuartersWide[n]}else if(e.digits>4){return r.aQuartersNarrow[n]}else{return String(n+1).padStart(e.digits,"0")}},parse:function(e,t,a,r){var n,i,o,s;var l=[a.aQuartersWide,a.aQuartersWideSt,a.aQuartersAbbrev,a.aQuartersAbbrevSt,a.aQuartersNarrow,a.aQuartersNarrowSt];if(t.digits<3){n=v.findNumbers(e,Math.max(t.digits,2));i=n===""||r.exactLength&&n.length<2;s=v.checkValid(t.type,i,a);o=parseInt(n)-1;if(r.strict&&o>3){s=false}}else{for(var u=0;u<l.length;u++){var f=l[u];var c=v.findEntry(e,f,a.oLocaleData.sCLDRLocaleId);if(c.index!==-1){return{quarter:c.index,length:c.length}}}s=v.checkValid(t.type,true,a)}return{length:n?n.length:0,quarter:o,valid:s}},isNumeric:function(e){return e<3}}),q:d._createPatternSymbol({name:"quarterStandalone",format:function(e,t,a,r){var n=t.getUTCQuarter();if(e.digits==3){return r.aQuartersAbbrevSt[n]}else if(e.digits==4){return r.aQuartersWideSt[n]}else if(e.digits>4){return r.aQuartersNarrowSt[n]}else{return String(n+1).padStart(e.digits,"0")}},parse:function(e,t,a,r){var n,i,o,s;var l=[a.aQuartersWide,a.aQuartersWideSt,a.aQuartersAbbrev,a.aQuartersAbbrevSt,a.aQuartersNarrow,a.aQuartersNarrowSt];if(t.digits<3){n=v.findNumbers(e,Math.max(t.digits,2));i=n===""||r.exactLength&&n.length<2;s=v.checkValid(t.type,i,a);o=parseInt(n)-1;if(r.strict&&o>3){s=false}}else{for(var u=0;u<l.length;u++){var f=l[u];var c=v.findEntry(e,f,a.oLocaleData.sCLDRLocaleId);if(c.index!==-1){return{quarter:c.index,length:c.length}}}s=v.checkValid(t.type,true,a)}return{length:n?n.length:0,quarter:o,valid:s}},isNumeric:function(e){return e<3}}),F:d._createPatternSymbol({name:"dayOfWeekInMonth"}),E:d._createPatternSymbol({name:"dayNameInWeek",format:function(e,t,a,r){var n=t.getUTCDay();if(e.digits<4){return r.aDaysAbbrev[n]}else if(e.digits==4){return r.aDaysWide[n]}else if(e.digits==5){return r.aDaysNarrow[n]}else{return r.aDaysShort[n]}},parse:function(e,t,a,r){var n=[a.aDaysWide,a.aDaysWideSt,a.aDaysAbbrev,a.aDaysAbbrevSt,a.aDaysShort,a.aDaysShortSt,a.aDaysNarrow,a.aDaysNarrowSt];for(var i=0;i<n.length;i++){var o=n[i];var s=v.findEntry(e,o,a.oLocaleData.sCLDRLocaleId);if(s.index!==-1){return{dayOfWeek:s.index,length:s.length}}}}}),c:d._createPatternSymbol({name:"dayNameInWeekStandalone",format:function(e,t,a,r){var n=t.getUTCDay();if(e.digits<4){return r.aDaysAbbrevSt[n]}else if(e.digits==4){return r.aDaysWideSt[n]}else if(e.digits==5){return r.aDaysNarrowSt[n]}else{return r.aDaysShortSt[n]}},parse:function(e,t,a,r){var n=[a.aDaysWide,a.aDaysWideSt,a.aDaysAbbrev,a.aDaysAbbrevSt,a.aDaysShort,a.aDaysShortSt,a.aDaysNarrow,a.aDaysNarrowSt];for(var i=0;i<n.length;i++){var o=n[i];var s=v.findEntry(e,o,a.oLocaleData.sCLDRLocaleId);if(s.index!==-1){return{day:s.index,length:s.length}}}}}),u:d._createPatternSymbol({name:"dayNumberOfWeek",format:function(e,t,a,r){var n=t.getUTCDay();return r._adaptDayOfWeek(n)},parse:function(e,t,a,r){var n=v.findNumbers(e,t.digits),i=r.exactLength&&n.length!==t.digits;return{dayNumberOfWeek:parseInt(n),length:n.length,valid:v.checkValid(t.type,i,a)}},isNumeric:true}),a:d._createPatternSymbol({name:"amPmMarker",format:function(e,t,a,r){var n=t.getUTCDayPeriod();if(e.digits<=3){return r.aDayPeriodsAbbrev[n]}else if(e.digits===4){return r.aDayPeriodsWide[n]}else{return r.aDayPeriodsNarrow[n]}},parse:function(e,t,a,r,n){var i,o,s,l,u,f,c,d=[a.aDayPeriodsWide,a.aDayPeriodsAbbrev,a.aDayPeriodsNarrow];i=/[aApP](?:\.)?[\x20\xA0]?[mM](?:\.)?/;u=e.match(i);o=u&&u.index===0;function f(e){return e.replace(/[\x20\xA0]/g,"").replace(/\./g,"")}if(o){e=f(e)}for(l=0;l<d.length;l+=1){c=d[l];if(o){c=c.map(f)}s=v.findEntry(e,c,a.oLocaleData.sCLDRLocaleId);if(s.index!==-1){return{pm:s.index===1,length:o?u[0].length:s.length}}}return{valid:false}}}),H:d._createPatternSymbol({name:"hour0_23",format:function(e,t){var a=t.getUTCHours();return String(a).padStart(e.digits,"0")},parse:function(e,t,a,r){var n=v.findNumbers(e,Math.max(t.digits,2)),i=parseInt(n),o=n===""||r.exactLength&&n.length<2,s=v.checkValid(t.type,o,a);if(r.strict&&i>23){s=false}return{hour:i,length:n.length,valid:s}},isNumeric:true}),k:d._createPatternSymbol({name:"hour1_24",format:function(e,t){var a=t.getUTCHours();var r=a===0?"24":String(a);return r.padStart(e.digits,"0")},parse:function(e,t,a,r){var n=v.findNumbers(e,Math.max(t.digits,2)),i=parseInt(n),o=n===""||r.exactLength&&n.length<2,s=v.checkValid(t.type,o,a);if(i==24){i=0}if(r.strict&&i>23){s=false}return{hour:i,length:n.length,valid:s}},isNumeric:true}),K:d._createPatternSymbol({name:"hour0_11",format:function(e,t){var a=t.getUTCHours();var r=String(a>11?a-12:a);return r.padStart(e.digits,"0")},parse:function(e,t,a,r){var n=v.findNumbers(e,Math.max(t.digits,2)),i=parseInt(n),o=n===""||r.exactLength&&n.length<2,s=v.checkValid(t.type,o,a);if(r.strict&&i>11){s=false}return{hour:i,length:n.length,valid:s}},isNumeric:true}),h:d._createPatternSymbol({name:"hour1_12",format:function(e,t){var a=t.getUTCHours();var r;if(a>12){r=String(a-12)}else if(a==0){r="12"}else{r=String(a)}return r.padStart(e.digits,"0")},parse:function(e,t,a,r){var n=r.dateValue.pm,i=v.findNumbers(e,Math.max(t.digits,2)),o=parseInt(i),s=i===""||r.exactLength&&i.length<2,l=v.checkValid(t.type,s,a);if(o==12){o=0;n=n===undefined?true:n}if(r.strict&&o>11){l=false}return{hour:o,length:i.length,pm:n,valid:l}},isNumeric:true}),m:d._createPatternSymbol({name:"minute",format:function(e,t){var a=t.getUTCMinutes();return String(a).padStart(e.digits,"0")},parse:function(e,t,a,r){var n=v.findNumbers(e,Math.max(t.digits,2)),i=parseInt(n),o=n===""||r.exactLength&&n.length<2,s=v.checkValid(t.type,o,a);if(r.strict&&i>59){s=false}return{length:n.length,minute:i,valid:s}},isNumeric:true}),s:d._createPatternSymbol({name:"second",format:function(e,t){var a=t.getUTCSeconds();return String(a).padStart(e.digits,"0")},parse:function(e,t,a,r){var n=Math.max(t.digits,2),i=v.findNumbers(e,n),o=i===""||r.exactLength&&i.length<n,s=parseInt(i),l=v.checkValid(t.type,o,a);if(r.strict&&s>59){l=false}return{length:i.length,second:s,valid:l}},isNumeric:true}),S:d._createPatternSymbol({name:"fractionalsecond",format:function(e,t){var a=t.getUTCMilliseconds();var r=String(a);var n=r.padStart(3,"0");n=n.substr(0,e.digits);n=n.padEnd(e.digits,"0");return n},parse:function(e,t,a,r){var n=v.findNumbers(e,t.digits),i=n.length,o=r.exactLength&&i<t.digits;n=n.substr(0,3);n=n.padEnd(3,"0");var s=parseInt(n);return{length:i,millisecond:s,valid:v.checkValid(t.type,o,a)}},isNumeric:true}),z:d._createPatternSymbol({name:"timezoneGeneral",format:function(e,t,a,r,n){if(e.digits>3&&t.getTimezoneLong&&t.getTimezoneLong()){return t.getTimezoneLong()}else if(t.getTimezoneShort&&t.getTimezoneShort()){return t.getTimezoneShort()}var i=o.calculateOffset(t,n);var s="GMT";var l=Math.abs(i/60);var u=i>0;var f=Math.floor(l/60);var c=Math.floor(l%60);if(!a&&l!=0){s+=u?"-":"+";s+=String(f).padStart(2,"0");s+=":";s+=String(c).padStart(2,"0")}else{s+="Z"}return s},parse:function(e,t,a,r){var n=0;var i;var o=e.substring(0,3);if(o==="GMT"||o==="UTC"){n=3}else if(e.substring(0,2)==="UT"){n=2}else if(e.charAt(0)==="Z"){n=1;i=0}else{return{error:"cannot be parsed correctly by sap.ui.core.format.DateFormat: The given timezone is not supported!"}}if(e.charAt(0)!=="Z"){var s=v.parseTZ(e.substr(n),true);n+=s.length;i=s.tzDiff}return{length:n,tzDiff:i}}}),Z:d._createPatternSymbol({name:"timezoneRFC822",format:function(e,t,a,r,n){var i=o.calculateOffset(t,n);var s=Math.abs(i/60);var l=i>0;var u=Math.floor(s/60);var f=Math.floor(s%60);var c="";if(!a){c+=l?"-":"+";c+=String(u).padStart(2,"0");c+=String(f).padStart(2,"0")}return c},parse:function(e,t,a,r){return v.parseTZ(e,false)}}),X:d._createPatternSymbol({name:"timezoneISO8601",format:function(e,t,a,r,n){var i=o.calculateOffset(t,n);var s=Math.abs(i/60);var l=i>0;var u=Math.floor(s/60);var f=Math.floor(s%60);var c="";if(!a&&s!=0){c+=l?"-":"+";c+=String(u).padStart(2,"0");if(e.digits>1||f>0){if(e.digits===3||e.digits===5){c+=":"}c+=String(f).padStart(2,"0")}}else{c+="Z"}return c},parse:function(e,t,a,r){if(e.charAt(0)==="Z"){return{length:1,tzDiff:0}}else{return v.parseTZ(e,t.digits===3||t.digits===5)}}}),V:d._createPatternSymbol({name:"timezoneID",format:function(e,t,a,r,n){if(!a&&e.digits===2){return r.oLocaleData.getTimezoneTranslations()[n]||n}return""},parse:function(e,t,a,r,n){var i={timezone:"",length:0};if(t.digits===2){var s=a.oLocaleData.getTimezoneTranslations();if(e===s[n]){return{timezone:n,length:e.length}}var l=Object.values(s);var u=v.findEntry(e,l,a.oLocaleData.sCLDRLocaleId);if(u.index!==-1){return{timezone:Object.keys(s)[u.index],length:u.length}}var f="";for(var c=0;c<e.length;c++){f+=e[c];if(o.isValidTimezone(f)){i.timezone=f;i.length=f.length}}}return i}})};d.prototype._format=function(e,t,a){if(this.oFormatOptions.relative){var n=this.formatRelative(e,t,this.oFormatOptions.relativeRange,a);if(n){return n}}var i=this.oFormatOptions.calendarType;var o=r.getInstance(e,i);var s=[],l,u,f;for(var d=0;d<this.aFormatArray.length;d++){l=this.aFormatArray[d];f=l.symbol||"";s.push(this.oSymbols[f].format(l,o,t,this,a))}u=s.join("");if(c.getOriginInfo()){u=new String(u);u.originInfo={source:"Common Locale Data Repository",locale:this.oLocale.toString(),style:this.oFormatOptions.style,pattern:this.oFormatOptions.pattern}}return u};d.prototype.format=function(t,a){var r;if(this.type===h.DATETIME_WITH_TIMEZONE){r=a;a=false;g(r);if(r&&!o.isValidTimezone(r)){u.error("The given timezone isn't valid.");return""}}var n=this.oFormatOptions.calendarType,i;if(a===undefined){a=this.oFormatOptions.UTC}r=r||c.getTimezone();if(Array.isArray(t)){if(!this.oFormatOptions.interval){u.error("Non-interval DateFormat can't format more than one date instance.");return""}if(t.length!==2){u.error("Interval DateFormat can only format with 2 date instances but "+t.length+" is given.");return""}t=t.map(function(e){return D(e,r,a)});if(this.oFormatOptions.singleIntervalValue){if(t[0]===null){u.error("First date instance which is passed to the interval DateFormat shouldn't be null.");return""}if(t[1]===null){i=this._format(t[0],a,r)}}if(i===undefined){if(!t.every(w)){u.error("At least one date instance which is passed to the interval DateFormat isn't valid.");return""}i=this._formatInterval(t,a)}}else{if(!w(t)){if(this.type===h.DATETIME_WITH_TIMEZONE&&this.oFormatOptions.pattern.includes("VV")){return this.oLocaleData.getTimezoneTranslations()[r]||r}u.error("The given date instance isn't valid.");return""}if(this.oFormatOptions.interval){u.error("Interval DateFormat expects an array with two dates for the first argument but only one date is given.");return""}t=D(t,r,a);i=this._format(t,a,r)}if(n==e.Japanese&&this.oLocale.getLanguage()==="ja"){i=i.replace(/(^|[^\d])1年/g,"$1元年")}return i};d.prototype._formatInterval=function(e,t){var a=this.oFormatOptions.calendarType;var n=r.getInstance(e[0],a);var i=r.getInstance(e[1],a);var o;var s;var l;var u=[];var f;var c=[];var d=this._getGreatestDiffField([n,i]);if(!d){return this._format(e[0],t)}if(this.oFormatOptions.format){f=this.oLocaleData.getCustomIntervalPattern(this.oFormatOptions.format,d,a)}else{f=this.oLocaleData.getCombinedIntervalPattern(this.oFormatOptions.pattern,a)}c=this.parseCldrDatePattern(f);o=n;for(var h=0;h<c.length;h++){s=c[h];l=s.symbol||"";if(s.repeat){o=i}u.push(this.oSymbols[l].format(s,o,t,this))}return u.join("")};var y={Era:"Era",FullYear:"Year",Quarter:"Quarter",Month:"Month",Week:"Week",Date:"Day",DayPeriod:"DayPeriod",Hours:"Hour",Minutes:"Minute",Seconds:"Second"};d.prototype._getGreatestDiffField=function(e){var t=false,a={};this.aIntervalCompareFields.forEach(function(r){var n="getUTC",i=n+r,o=y[r],l=e[0][i].apply(e[0]),u=e[1][i].apply(e[1]);if(!s(l,u)){t=true;a[o]=true}});if(t){return a}return null};d.prototype._parse=function(e,t,a,r,n){var i,o,s,l,u,c={valid:true,lastTimezonePatternSymbol:""},d=0,h={formatArray:t,dateValue:c,strict:r},m=this;function g(e){return m.oSymbols[e.symbol||""]}function p(e){return!!e&&g(e).isNumeric(e.digits)}for(var v=0;v<t.length;v++){u=e.substr(d);o=t[v];s=t[v-1];i=t[v+1];h.index=v;h.exactLength=p(o)&&(p(s)||p(i));l=g(o).parse(u,o,this,h,n)||{};if(l.tzDiff!==undefined||l.timezone){l.lastTimezonePatternSymbol=o.symbol}c=f(c,l);if(l.valid===false){break}d+=l.length||0}c.index=d;if(c.pm){c.hour+=12}if(c.dayNumberOfWeek===undefined&&c.dayOfWeek!==undefined){c.dayNumberOfWeek=this._adaptDayOfWeek(c.dayOfWeek)}if(c.quarter!==undefined&&c.month===undefined&&c.day===undefined){c.month=3*c.quarter;c.day=1}return c};d.prototype._parseInterval=function(e,t,a,r,n){var i,o,s;this.intervalPatterns.some(function(t){var l=this.parseCldrDatePattern(t);o=undefined;for(var u=0;u<l.length;u++){if(l[u].repeat){o=u;break}}if(o===undefined){s=this._parse(e,l,a,r,n);if(s.index===0||s.index<e.length){s.valid=false}if(s.valid===false){return}i=[s,s];return true}else{i=[];s=this._parse(e,l.slice(0,o),a,r,n);if(s.valid===false){return}i.push(s);var f=s.index;s=this._parse(e.substring(f),l.slice(o),a,r,n);if(s.index===0||s.index+f<e.length){s.valid=false}if(s.valid===false){return}i.push(s);return true}}.bind(this));return i};function T(e){if(e.calendarWeekNumbering){return e.calendarWeekNumbering}else if(e.firstDayOfWeek!==undefined&&e.minimalDaysInFirstWeek!==undefined){return{firstDayOfWeek:e.firstDayOfWeek,minimalDaysInFirstWeek:e.minimalDaysInFirstWeek}}return undefined}var D=function(e,t,a){if(!a&&w(e)){return o.convertToTimezone(e,t)}return e};var b=function(e,t,a,n,i,s,l){if(!e.valid){return null}var u,f=typeof e.year==="number"?e.year:1970;u=r.getInstance(new Date(0),t);u.setUTCEra(e.era||r.getCurrentEra(t));u.setUTCFullYear(f);u.setUTCMonth(e.month||0);u.setUTCDate(e.day||1);u.setUTCHours(e.hour||0);u.setUTCMinutes(e.minute||0);u.setUTCSeconds(e.second||0);u.setUTCMilliseconds(e.millisecond||0);if(n&&(e.day||1)!==u.getUTCDate()){return null}if(e.week!==undefined&&(e.month===undefined||e.day===undefined)){u.setUTCWeek({year:e.weekYear||e.year,week:e.week},l,T(s));if(e.dayNumberOfWeek!==undefined){u.setUTCDate(u.getUTCDate()+e.dayNumberOfWeek-1)}}u=u.getJSDate();if(!a&&(e.lastTimezonePatternSymbol==="V"&&e.timezone||e.tzDiff===undefined)){if(e.timezone){i=e.timezone}if(i){e.tzDiff=o.calculateOffset(u,i)}}if(e.tzDiff){u.setUTCSeconds(u.getUTCSeconds()+e.tzDiff)}return u};function S(e,t){if(e===t){return e}var a={};Object.keys(e).forEach(function(t){a[t]=e[t]});Object.keys(t).forEach(function(e){if(!a.hasOwnProperty(e)){a[e]=t[e]}});return a}function F(e,t){if(e.getTime()>t.getTime()){return false}return true}function w(e){return e&&typeof e.getTime==="function"&&!isNaN(e.getTime())}d.prototype.parse=function(t,a,r){var n=this.oFormatOptions.showDate===undefined||this.oFormatOptions.showDate;var i=this.oFormatOptions.showTime===undefined||this.oFormatOptions.showTime;if(this.type===h.DATETIME_WITH_TIMEZONE&&(n&&!i||!n&&i)){throw new TypeError("The input can only be parsed back to date if both date and time are supplied.")}var s;if(a===undefined&&this.type!==h.DATETIME_WITH_TIMEZONE){a=this.oFormatOptions.UTC}var l=a;if(this.type===h.DATETIME_WITH_TIMEZONE){s=a;a=false;g(s);if(s&&!o.isValidTimezone(s)){u.error("The given timezone isn't valid.");return null}}t=t==null?"":String(t).trim();var f;var d=this.oFormatOptions.calendarType;s=s||c.getTimezone();if(r===undefined){r=this.oFormatOptions.strictParsing}if(d==e.Japanese&&this.oLocale.getLanguage()==="ja"){t=t.replace(/元年/g,"1年")}if(!this.oFormatOptions.interval){var m=this.parseRelative(t,a);if(m){return m}f=this._parse(t,this.aFormatArray,a,r,s);if(f.index===0||f.index<t.length){f.valid=false}m=b(f,d,a,r,s,this.oFormatOptions,this.oLocale);if(m){if(this.type===h.DATETIME_WITH_TIMEZONE){var p=this.oFormatOptions.showTimezone===undefined||this.oFormatOptions.showTimezone;if(!p&&n&&i){return[m,undefined]}else if(p&&!n&&!i){return[undefined,f.timezone]}return[m,f.timezone||undefined]}return m}}else{var v=this._parseInterval(t,d,a,r,s);var y,T;if(v&&v.length==2){var D=S(v[0],v[1]);var w=S(v[1],v[0]);y=b(D,d,a,r,s,this.oFormatOptions,this.oLocale);T=b(w,d,a,r,s,this.oFormatOptions,this.oLocale);if(y&&T){if(this.oFormatOptions.singleIntervalValue&&y.getTime()===T.getTime()){return[y,null]}var O=F(y,T);if(r&&!O){u.error("StrictParsing: Invalid date range. The given end date is before the start date.");return[null,null]}return[y,T]}}}if(!this.bIsFallback){var k;this.aFallbackFormats.every(function(e){k=e.parse(t,l,r);if(Array.isArray(k)){if(e.type===h.DATETIME_WITH_TIMEZONE){return false}return!(k[0]&&k[1])}else{return!k}});return k}if(!this.oFormatOptions.interval){return null}else{return[null,null]}};d.prototype.parseCldrDatePattern=function(e){if(m[e]){return m[e]}var t=[],a,r=false,n=null,i="",o="",s={},l=false;for(a=0;a<e.length;a++){var u=e.charAt(a),f,c,d;if(r){if(u=="'"){c=e.charAt(a-1);d=e.charAt(a-2);f=e.charAt(a+1);if(c=="'"&&d!="'"){r=false}else if(f=="'"){a+=1}else{r=false;continue}}if(i=="text"){n.value+=u}else{n={type:"text",value:u};t.push(n);i="text"}}else{if(u=="'"){r=true}else if(this.oSymbols[u]){o=this.oSymbols[u].name;if(i==o){n.digits++}else{n={type:o,symbol:u,digits:1};t.push(n);i=o;if(!l){if(s[o]){n.repeat=true;l=true}else{s[o]=true}}}}else{if(i=="text"){n.value+=u}else{n={type:"text",value:u};t.push(n);i="text"}}}}m[e]=t;return t};d.prototype.parseRelative=function(e,t){var a,r,n,i,o;if(!e){return null}a=this.oLocaleData.getRelativePatterns(this.aRelativeParseScales,this.oFormatOptions.relativeStyle);for(var s=0;s<a.length;s++){r=a[s];n=new RegExp("^\\s*"+r.pattern.replace(/\{0\}/,"(\\d+)")+"\\s*$","i");i=n.exec(e);if(i){if(r.value!==undefined){return l(r.value,r.scale)}else{o=parseInt(i[1]);return l(o*r.sign,r.scale)}}}function l(e,a){var r,n=new Date,i;if(t){r=n.getTime()}else{r=Date.UTC(n.getFullYear(),n.getMonth(),n.getDate(),n.getHours(),n.getMinutes(),n.getSeconds(),n.getMilliseconds())}i=new Date(r);switch(a){case"second":i.setUTCSeconds(i.getUTCSeconds()+e);break;case"minute":i.setUTCMinutes(i.getUTCMinutes()+e);break;case"hour":i.setUTCHours(i.getUTCHours()+e);break;case"day":i.setUTCDate(i.getUTCDate()+e);break;case"week":i.setUTCDate(i.getUTCDate()+e*7);break;case"month":i.setUTCMonth(i.getUTCMonth()+e);break;case"quarter":i.setUTCMonth(i.getUTCMonth()+e*3);break;case"year":i.setUTCFullYear(i.getUTCFullYear()+e);break}if(t){return i}else{return new Date(i.getUTCFullYear(),i.getUTCMonth(),i.getUTCDate(),i.getUTCHours(),i.getUTCMinutes(),i.getUTCSeconds(),i.getUTCMilliseconds())}}};d.prototype.formatRelative=function(e,t,a,r){var n=D(new Date,r),i,o=this.oFormatOptions.relativeScale||"day",s,u,f;f=(e.getTime()-n.getTime())/1e3;if(this.oFormatOptions.relativeScale=="auto"){o=this._getScale(f,this.aRelativeScales);o=O(e,n,o,f)}if(!a){a=this._mRanges[o]}if(o=="year"||o=="month"||o=="day"){n=new Date(Date.UTC(n.getUTCFullYear(),n.getUTCMonth(),n.getUTCDate()));i=new Date(0);i.setUTCFullYear(e.getUTCFullYear(),e.getUTCMonth(),e.getUTCDate());e=i}s=this._getDifference(o,[n,e]);if(this.oFormatOptions.relativeScale!="auto"&&(s<a[0]||s>a[1])){return null}u=this.oLocaleData.getRelativePattern(o,s,f>0,this.oFormatOptions.relativeStyle);return l(u,[Math.abs(s)])};d.prototype._mRanges={second:[-60,60],minute:[-60,60],hour:[-24,24],day:[-6,6],week:[-4,4],month:[-12,12],year:[-10,10]};d.prototype._mScales={second:1,minute:60,hour:3600,day:86400,week:604800,month:2592e3,quarter:7776e3,year:31536e3};d.prototype._getScale=function(e,t){var a,r;e=Math.abs(e);for(var n=0;n<t.length;n++){r=t[n];if(e>=this._mScales[r]){a=r;break}}if(!a){a=t[t.length-1]}return a};function O(e,t,a,r){var n=Math.abs(e.getUTCMonth()-t.getUTCMonth());if(a==="week"&&n===2){return"month"}else if(a==="week"&&n===1){if(e.getUTCDate()===t.getUTCDate()||r<0&&e.getUTCDate()<t.getUTCDate()||r>0&&e.getUTCDate()>t.getUTCDate()){return"month"}}else if(a==="month"&&n===1){if(r>0&&e.getUTCDate()<t.getUTCDate()||r<0&&e.getUTCDate()>t.getUTCDate()){return"week"}}return a}function k(e,t){var a=["FullYear","Month","Date","Hours","Minutes","Seconds","Milliseconds"],r;var n=new Date(e.getTime());for(var i=t;i<a.length;i++){r="setUTC"+a[t];n[r].apply(n,[0])}return n}var C={year:function(e,t){return t.getUTCFullYear()-e.getUTCFullYear()},month:function(e,t){return t.getUTCMonth()-e.getUTCMonth()+this.year(e,t)*12},week:function(e,t,a){var r=a._adaptDayOfWeek(e.getUTCDay());var n=a._adaptDayOfWeek(t.getUTCDay());e=k(e,3);t=k(t,3);return(t.getTime()-e.getTime()-(n-r)*a._mScales.day*1e3)/(a._mScales.week*1e3)},day:function(e,t,a){e=k(e,3);t=k(t,3);return(t.getTime()-e.getTime())/(a._mScales.day*1e3)},hour:function(e,t,a){e=k(e,4);t=k(t,4);return(t.getTime()-e.getTime())/(a._mScales.hour*1e3)},minute:function(e,t,a){e=k(e,5);t=k(t,5);return(t.getTime()-e.getTime())/(a._mScales.minute*1e3)},second:function(e,t,a){e=k(e,6);t=k(t,6);return(t.getTime()-e.getTime())/(a._mScales.second*1e3)}};d.prototype._adaptDayOfWeek=function(e){var t=T(this.oFormatOptions),a;if(typeof t==="object"){a=t.firstDayOfWeek}else{a=n.getWeekConfigurationValues(t,this.oLocale).firstDayOfWeek}var r=e-(a-1);if(r<=0){r+=7}return r};d.prototype._getDifference=function(e,t){var a=t[0];var r=t[1];return Math.round(C[e](a,r,this))};d.prototype.getAllowedCharacters=function(e){if(this.oFormatOptions.relative){return""}var t="";var a=false;var r=false;var n;for(var i=0;i<e.length;i++){n=e[i];switch(n.type){case"text":if(t.indexOf(n.value)<0){t+=n.value}break;case"day":case"year":case"weekYear":case"dayNumberOfWeek":case"weekInYear":case"hour0_23":case"hour1_24":case"hour0_11":case"hour1_12":case"minute":case"second":case"fractionalsecond":if(!a){t+="0123456789";a=true}break;case"month":case"monthStandalone":if(n.digits<3){if(!a){t+="0123456789";a=true}}else{r=true}break;default:r=true;break}}if(r){t=""}return t};return d},true);
//# sourceMappingURL=DateFormat.js.map