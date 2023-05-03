sap.ui.define(["sap/suite/ui/generic/template/genericUtilities/FeError","sap/base/util/deepExtend","sap/base/util/extend","sap/base/util/isEmptyObject","sap/m/DynamicDateUtil","sap/suite/ui/generic/template/genericUtilities/metadataAnalyser"],function(e,t,i,n,a,r){"use strict";var s="listTemplates.semanticDateRangeTypeHelper";function l(){var e={useDateRange:{type:"boolean",defaultValue:false},selectedValues:{type:"string",defaultValue:""},exclude:{type:"boolean",defaultValue:true},customDateRangeImplementation:{type:"string",defaultValue:""},defaultValue:{type:"object",properties:{operation:{type:"string"}}},filter:{type:"array",arrayEntries:{type:"object",properties:{path:{type:"string"},equals:{type:"string"},contains:{type:"string"},exclude:{type:"boolean",defaultValue:false}}}}};var t=i({fields:{type:"object",mapEntryProperties:e}},e);return{type:"object",properties:t}}function o(e,t,i){var n=e.type==="Edm.DateTime"&&e["sap:display-format"]==="Date"||e.type==="Edm.DateTimeOffset";var a=e.type==="Edm.String"&&e["com.sap.vocabularies.Common.v1.IsCalendarDate"]&&e["com.sap.vocabularies.Common.v1.IsCalendarDate"].Bool==="true";if(n||a){if(e.isParam){return true}if(e["sap:filter-restriction"]==="interval"||i.includes(e.name)||e["sap:filter-restriction"]==="single-value"&&!(e.type==="Edm.DateTimeOffset")){return true}}return false}function f(t){var i;if(t.customDateRangeImplementation){i=t.customDateRangeImplementation}else if(t.filter){i=JSON.stringify({module:"sap.ui.comp.config.condition.DateRangeType",operations:{filter:t.filter}})}else if(t.selectedValues){var n={path:"key",contains:t.selectedValues,exclude:t.exclude===undefined||t.exclude};i=JSON.stringify({module:"sap.ui.comp.config.condition.DateRangeType",operations:{filter:[n]}})}else if(t.defaultValue){i=JSON.stringify({module:"sap.ui.comp.config.condition.DateRangeType"})}else{throw new e(s,"Wrong Date Range configuration set in manifest")}return i}function u(e,t,a){var r=i({},e.fields&&e.fields[a.name]||e);delete r.fields;delete r.useDateRange;return o(a,e,t)&&!n(r)}function g(e,t){var i=r.getParametersByEntitySet(e,t.name);var n;if(i.entitySetName){n=r.getPropertyOfEntitySet(e,i.entitySetName);if(!n){return[]}}else{return[]}var a=[];n.forEach(function(e){e.isParam=true;if(o(e)){a.push(e)}});return a}function p(e,t,i,n){if(!e.filterSettings||!e.filterSettings.dateSettings){return}else if(e.filterSettings.dateSettings.useDateRange&&e.filterSettings.dateSettings.fields){e.filterSettings.dateSettings.useDateRange=false;var r=t.property.filter(o,e.filterSettings.dateSettings,[]);var s=e.filterSettings.dateSettings.fields;r.forEach(function(e){if(!s.hasOwnProperty(e["name"])||!s[e["name"]]){var t=e["name"];s[t]={selectedValues:a.getAllOptionKeys().toString(),exclude:false}}});return s}}function d(e,t,i,n){if(!e.filterSettings||!e.filterSettings.dateSettings){return[]}var r=[];if(n&&i){r=g(n,i)}if(e.filterSettings.dateSettings.useDateRange&&e.filterSettings.dateSettings.fields){e.filterSettings.dateSettings.useDateRange=false;var s=t.property.filter(o,e.filterSettings.dateSettings,[]);var l=e.filterSettings.dateSettings.fields;s.forEach(function(e){if(!l.hasOwnProperty(e["name"])||!l[e["name"]]){var t=e["name"];l[t]={selectedValues:a.getAllOptionKeys().toString(),exclude:false}}})}var p=i["Org.OData.Capabilities.V1.FilterRestrictions"]&&i["Org.OData.Capabilities.V1.FilterRestrictions"].FilterExpressionRestrictions?i["Org.OData.Capabilities.V1.FilterRestrictions"].FilterExpressionRestrictions.filter(function(e){return e.AllowedExpressions&&e.AllowedExpressions.String==="SingleRange"}).map(function(e){return e.Property&&e.Property.PropertyPath}):[];var d=t.property.concat(r);return d.filter(u.bind(null,e.filterSettings.dateSettings,p)).map(function(t){return{key:t.name,conditionType:f(e.filterSettings.dateSettings.fields&&e.filterSettings.dateSettings.fields[t.name]||e.filterSettings.dateSettings,t)}})}function c(e,t,i,n){var a={};var r=[],s;if(e.filterSettings&&e.filterSettings.dateSettings&&e.filterSettings.dateSettings.fields){s=e.filterSettings.dateSettings.fields;Object.entries(s).forEach(function(e){var s=-1;if(i&&i.Dates){s=i.Dates.findIndex(function(t){return t.PropertyName===e[0]})}if(s===-1&&Object.keys(n).indexOf(e[0])===-1&&e[1].defaultValue){t.getConditionTypeByKey(e[0])&&t.getConditionTypeByKey(e[0]).setOperation(e[1].defaultValue.operation);a=t.getConditionTypeByKey(e[0])&&t.getConditionTypeByKey(e[0]).getCondition();a&&r.push({PropertyName:a.key,Data:a})}})}if(!s){if(i&&i.Dates){var l=i.Dates.findIndex(function(e){return Object.keys(n).includes(e.PropertyName)});if(l===-1){r=i.Dates}}}return{Dates:r}}return{getDateSettingsMetadata:l,getDateRangeFieldSettings:d,addSemanticDateRangeDefaultValue:c,getSettingsForDateProperties:p}});
//# sourceMappingURL=semanticDateRangeTypeHelper.js.map