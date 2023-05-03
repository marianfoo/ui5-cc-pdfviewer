/*! 
 * SAPUI5

		(c) Copyright 2009-2021 SAP SE. All rights reserved
	 
 */
(function(){sap.ui.define(["sap/m/MessageBox","./error/errors","./i18n"],function(e,t,r){function a(e){return e&&e.__esModule&&typeof e.default!=="undefined"?e.default:e}function o(e,t){if(!(e instanceof t)){throw new TypeError("Cannot call a class as a function")}}function n(e,t){for(var r=0;r<t.length;r++){var a=t[r];a.enumerable=a.enumerable||false;a.configurable=true;if("value"in a)a.writable=true;Object.defineProperty(e,a.key,a)}}function i(e,t,r){if(t)n(e.prototype,t);if(r)n(e,r);Object.defineProperty(e,"prototype",{writable:false});return e}var s=e["Icon"];var l=a(t);var u=a(r);function c(e,t,r){if(r){return t?t(e):e}if(!e||!e.then){e=Promise.resolve(e)}return t?e.then(t):e}function p(e,t,r){if(r){return t?t(e()):e()}try{var a=Promise.resolve(e());return t?a.then(t):a}catch(e){return Promise.reject(e)}}function d(e){if(e&&e.conditions){return true}return false}var f=function(){function t(e){o(this,t);this.model=e.model}i(t,[{key:"parseUrlParameters",value:function t(r){var a=this;return p(function(){if(r.top){var t=parseInt(r.top,10);a.model.setTop(t,false)}var o=a.model.sinaNext.allDataSource;if(r.datasource){var n=JSON.parse(r.datasource);var i=n.ObjectName.value;switch(n.Type){case"Category":if(i==="$$ALL$$"){o=a.model.sinaNext.allDataSource}else{o=a.model.sinaNext.getDataSource(i);if(!o){o=a.model.sinaNext.createDataSource({type:a.model.sinaNext.DataSourceType.Category,id:i,label:n.label,labelPlural:n.labelPlural})}}break;case"BusinessObject":o=a.model.sinaNext.getDataSource(i);if(!o){o=a.model.sinaNext.allDataSource;delete r.filter;e.show(u.getText("searchUrlParsingErrorLong")+"\n(Unknow datasource "+i+")",{icon:s.ERROR,title:u.getText("searchUrlParsingError"),actions:["OK"]})}break;default:{var p=new Error("Unknown datasource type "+n.Type);throw new l.UnknownDataSourceType(p)}}}return c(a.model.sinaNext.loadMetadata(o),function(){var e={dataSource:o};var t;if(r.filter){var n=JSON.parse(r.filter);t=a.parseCondition(e,n)}else{t=a.model.sinaNext.createComplexCondition()}var i=a.model.sinaNext.createFilter({dataSource:o,searchTerm:r.searchterm,rootCondition:t});a.model.setProperty("/uiFilter",i);a.model.setDataSource(i.dataSource,false)})})}},{key:"parseCondition",value:function e(t,r){if(d(r)){return this.parseComplexCondition(t,r)}return this.parseSimpleCondition(t,r)}},{key:"parseComplexCondition",value:function e(t,r){var a=[];for(var o=0;o<r.conditions.length;++o){var n=r.conditions[o];a.push(this.parseCondition(t,n))}return this.model.sinaNext.createComplexCondition({operator:r.operator,conditions:a,valueLabel:r.label})}},{key:"parseSimpleCondition",value:function e(t,r){t.attribute=r.attribute;return this.model.sinaNext.createSimpleCondition({attribute:r.attribute,attributeLabel:r.attributeLabel,value:this.parseValue(t,r.value),valueLabel:r.valueLabel||r.label,operator:this.parseOperator(t,r.operator)})}},{key:"parseValue",value:function e(t,r){var a=t.dataSource.getAttributeMetadata(t.attribute);return this.model.sinaNext.inav2TypeConverter.ina2Sina(a.type,r)}},{key:"parseOperator",value:function e(t,r){switch(r){case"=":return this.model.sinaNext.ComparisonOperator.Eq;case">":return this.model.sinaNext.ComparisonOperator.Gt;case">=":return this.model.sinaNext.ComparisonOperator.Ge;case"<":return this.model.sinaNext.ComparisonOperator.Lt;case"<=":return this.model.sinaNext.ComparisonOperator.Le;default:throw"Unknown operator "+r}}}]);return t}();return f})})();
//# sourceMappingURL=SearchUrlParserInav2.js.map