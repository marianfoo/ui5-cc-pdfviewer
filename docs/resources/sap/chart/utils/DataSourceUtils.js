/*
 * SAPUI5
 * (c) Copyright 2009-2022 SAP SE. All rights reserved.
 */
sap.ui.define(["sap/chart/data/Dimension","sap/chart/data/TimeDimension","sap/chart/data/HierarchyDimension","sap/chart/data/Measure","sap/chart/TimeUnitType","sap/ui/thirdparty/jquery"],function(e,t,a,n,r,jQuery){"use strict";function i(e,t){var a=t.path;var n=(t.parameters||{}).entitySet;if(!n){n=a.split("/")[1];if(n.indexOf("(")!=-1){n=n.split("(")[0]+(e?"Results":"Set")}}return n}function o(e,t,a){return"{/#"+e+"/"+t+"/@sap:"+a+"}"}var s={"com.sap.vocabularies.Common.v1.IsCalendarDate":"yearmonthday","com.sap.vocabularies.Common.v1.IsCalendarYearQuarter":"yearquarter","com.sap.vocabularies.Common.v1.IsCalendarYearMonth":"yearmonth","com.sap.vocabularies.Common.v1.IsCalendarYearWeek":"yearweek","com.sap.vocabularies.Common.v1.IsFiscalYear":"fiscalyear","com.sap.vocabularies.Common.v1.IsFiscalYearPeriod":"fiscalyearperiod"};function u(n,i){var o=e;if(n.type==="Edm.DateTime"&&n["sap:display-format"]==="Date"){o=t;i.timeUnit=r.Date}else if(n["sap:hierarchy-node-for"]){o=a}else if(n.type==="Edm.String"){var u=Object.keys(s);for(var l=0;l<u.length;l++){var m=u[l];if(n[m]&&n[m].Bool){var c=s[m];if(r[c]){o=t;i.timeUnit=c}break}}}return o}var l={getEntitySet:i.bind(null,true),deriveColumns:function(e,t){var a=e.getAnalyticalExtensions().findQueryResultByName(l.getEntitySet(t));if(!a){throw new Error('value of the "isAnalytical" property does not match the Data Service in use')}var n=a.getEntityType().getQName();n=n.slice(n.lastIndexOf(".")+1);var r=a.getEntityType().getSchema().namespace;var i=l.makeDimension.bind(this,n,r,a);var o=l.makeMeasure.bind(this,n);var s=a.getEntityType().getAllHierarchyPropertyNames().map(function(e){return a.findDimensionByPropertyName(e).getHierarchy().getNodeIDProperty().name});var u=a.getAllDimensionNames().concat(s);return{dimensions:jQuery.map(u,i),measures:jQuery.map(a.getAllMeasures(),o)}},makeDimension:function(e,t,a,n){var r={name:n,label:o(e,n,"label"),textProperty:o(e,n,"text")};var i=l.ANNOTATION_ACCESS_TEMPLATE.replace(/%SCHEMANS/,t).replace(/%RESULTTYPE/,e).replace(/%DIMENSION/,n);var s=a.getModel().getODataModel().getMetaModel().getProperty(i);var m=u(s,r);return new m(r)},makeMeasure:function(e,t){return new n({name:t.getName(),label:o(e,t.getName(),"label")})},updateModel:function(e){function t(e,t,a,n){var r=[];var i={name:e.getName(),grouped:false,inResult:!!a,visible:!n};if(t!=null){i.level=t}r.push(i);var o=e.getTextProperty();if(e.getDisplayText()&&o){i={name:o,grouped:false,inResult:!!a,visible:!n};r.push(i)}return r}function n(t,a){var n=t.getUnitBinding(),r=e._isEnablePaging(),i=t.getAnalyticalInfo(),o=[];if(i){o.push({name:i.propertyPath,with:i.with,as:t.getName(),total:false})}else{o.push({name:t.getName(),total:false,inResult:false,visible:true})}var s=sap.ui.require("sap/ui/model/odata/v4/ODataModel");if(r&&s&&e.getModel()instanceof s){o[0].min=true;o[0].max=true}if(n&&a.indexOf(n)===-1){o.push({name:n,inResult:false,visible:true})}return o}var r=e.getBinding("data");if(!r){return}var i=e._getVisibleDimensions(true);var o=e._getVisibleMeasures(true);var s=e._normalizeDorM(e.getInResultDimensions(),true);var u=e._getDrillStateTop().hierarchylevel;var l=i.map(function(e){return e.getName()}).concat(s.map(function(e){return e.getName()})).concat(o.map(function(e){return e.getName()}));var m=i.reduce(function(e,a){return e.concat(t(a,u[a.getName()]))},[]).concat(s.reduce(function(e,n){var r=n instanceof a?n.getLevel():null;return e.concat(t(n,r,true,true))},[])).concat(o.reduce(function(e,t){return e.concat(n(t,l))},[]));var c=e._getCandidateColoringSetting();var d=c.additionalMeasures||[];var g=c.additionalDimensions||[];if(d.length){m=m.concat(e._normalizeDorM(d).reduce(function(e,t){return e.concat(n(t))},[]))}if(g.length){m=m.concat(e._normalizeDorM(g,true).reduce(function(e,a){return e.concat(t(a,u[a.getName()]))},[]))}var p=r.updateAnalyticalInfo(m);return p&&p.measureRangePromise},ANNOTATION_ACCESS_TEMPLATE:"/dataServices/schema/[${"+"namespace"+"}==='%SCHEMANS']/entityType/[${"+"name"+"}==='%RESULTTYPE']/property/[${"+"name"+"}==='%DIMENSION']/"};var m={getEntitySet:i.bind(null,false),deriveColumns:function(e,t){var a=e.getMetaModel(),r={dimensions:[],measures:[]};if(a){var i=a.getODataEntitySet(m.getEntitySet(t)).entityType;var o=a.getODataEntityType(i);jQuery.each(o.property,function(e,t){var a=m.CLAZZ[t.type];if(!a){throw new Error("Unsupported type: "+t.type)}var i={name:t.name};if(t.hasOwnProperty("com.sap.vocabularies.Common.v1.Label")){i.label=t["com.sap.vocabularies.Common.v1.Label"].String}if(a===n){r.measures.push(new a(i))}else{if(t.hasOwnProperty("com.sap.vocabularies.Common.v1.Text")){i.textProperty=t["com.sap.vocabularies.Common.v1.Text"].Path}a=u(t,i);r.dimensions.push(new a(i))}})}return r},CLAZZ:{Null:e,"Edm.Binary":e,"Edm.Boolean":e,"Edm.Byte":n,"Edm.DateTime":e,"Edm.Decimal":n,"Edm.Double":n,"Edm.Single":n,"Edm.Guid":e,"Edm.Int16":n,"Edm.Int32":n,"Edm.Int64":n,"Edm.SByte":n,"Edm.String":e,"Edm.Time":e,"Edm.DateTimeOffset":e},updateModel:function(e,t,a){var n=sap.ui.require("sap/ui/model/odata/ODataModel");if(n&&e.getModel()instanceof n){var r=t.reduce(function(e,t){if(t.getTextProperty()){return e.concat(t.getName(),t.getTextProperty())}else{return e.concat(t.getName())}},[]);var i=a.reduce(function(e,t){if(t.getUnitBinding()){return e.concat(t.getName(),t.getUnitBinding())}else{return e.concat(t.getName())}},[]);e._oBindingInfo.parameters=e._oBindingInfo.parameters||{};e._oBindingInfo.parameters.entitySet=m.getEntitySet(e._oBindingInfo);e._oBindingInfo.parameters.select=r.concat(i).join(",");e.bindData(e._oBindingInfo);if(e._isEnablePaging()&&e._getPagingController().getPagingSorters()){e.getBinding("data").sort(e._getPagingController().getPagingSorters())}}else{return}}};function c(e){return function(t){var a=t?l:m;return a[e]}}return{deriveColumns:c("deriveColumns"),updateModel:c("updateModel"),getEntitySet:c("getEntitySet")}});
//# sourceMappingURL=DataSourceUtils.js.map