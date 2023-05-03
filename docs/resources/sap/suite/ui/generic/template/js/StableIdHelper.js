sap.ui.define(["sap/suite/ui/generic/template/lib/StableIdDefinition","sap/suite/ui/generic/template/genericUtilities/FeLogger"],function(e,t){"use strict";var r=new t("js.StableIdHelper").getLogger();function a(e){r.error("Error determining stable id: "+e);return undefined}function p(e){var t=e.getProperty("/stableId/aParameter");var r={buildStableId:function(e){r.id=s(e)}};t.push(r);return"/stableId/aParameter/"+(t.length-1)}function n(e){return e&&e.replace(/@/g,"").replace(/[\/#]/g,"::")}function u(t){if(typeof e.types[t.type][t.subType].value!=="function"){return e.types[t.type][t.subType].value}else{var r=e.types[t.type][t.subType].parameters||[];var a=e.types[t.type][t.subType].optionalParameters||[];var p=r.concat(a);var u={};e.parameters.forEach(function(e){if(p.indexOf(e)>-1){u[e]=t[e]}});return n(e.types[t.type][t.subType].value(u))}}function i(e){return e.replace(/[^A-Za-z0-9_.-]/g,function(e){var t=e.charCodeAt(0).toString(16);return":"+(t.length===1?"0":"")+t})}function s(t){if(!t.type){return a("No type provided")}if(!t.subType){return a("No subType provided")}if(!e.types[t.type]){return a("Invalid type provided")}if(!e.types[t.type][t.subType]){return a("Invalid subType provided")}if((e.types[t.type][t.subType].parameters||[]).some(function(e){return!t[e]&&!a("No value for parameter "+e+" provided (mandatory for type "+t.type+"/Subtype "+t.subType+")")})){return undefined}if(e.types[t.type][t.subType].value){try{var r=u(t);if(r){return r}}catch(e){return undefined}}var p="template:::"+t.type+":::"+t.subType;var n=e.types[t.type][t.subType].parameters||[];var s=e.types[t.type][t.subType].optionalParameters||[];var y=n.concat(s);e.parameters.forEach(function(e){if(y.indexOf(e)>-1&&t[e]){p+=":::"+e+"::"+i(t[e])}});return p}return{preparePathForStableId:p,getStableId:s}},true);
//# sourceMappingURL=StableIdHelper.js.map