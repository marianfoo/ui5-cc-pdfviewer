/*! 
 * SAPUI5

		(c) Copyright 2009-2021 SAP SE. All rights reserved
	 
 */
(function(){sap.ui.define([],function(){function r(r,n,e){if(e){return n?n(r):r}if(!r||!r.then){r=Promise.resolve(r)}return n?r.then(n):r}function n(r,n){var e=r();if(e&&e.then){return e.then(n)}return n(e)}function e(r){return function(){for(var n=[],e=0;e<arguments.length;e++){n[e]=arguments[e]}try{return Promise.resolve(r.apply(this,n))}catch(r){return Promise.reject(r)}}}var t=e(function(e){var i=false;return n(function(){if(typeof e==="string"){e=e.trim();return n(function(){if(e.indexOf("/")>=0&&e.indexOf("Provider")<0&&e[0]!=="{"){e=require(e);return r(t(e),function(r){i=true;return r})}},function(r){if(i)return r;if(e[0]!=="{"){e='{ "provider" : "'+e+'"}'}e=JSON.parse(e)})}},function(r){return i?r:e})});var i;(function(r){r["ABAP_ODATA"]="abap_odata";r["HANA_ODATA"]="hana_odata";r["INAV2"]="inav2";r["MULTI"]="multi";r["SAMPLE"]="sample";r["DUMMY"]="dummy"})(i||(i={}));var u={__esModule:true};u._normalizeConfiguration=t;u.AvailableProviders=i;return u})})();
//# sourceMappingURL=SinaConfiguration.js.map