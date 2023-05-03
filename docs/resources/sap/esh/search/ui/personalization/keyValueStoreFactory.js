/*! 
 * SAPUI5

		(c) Copyright 2009-2021 SAP SE. All rights reserved
	 
 */
(function(){sap.ui.define(["./BrowserPersonalizationStorage","./FLPPersonalizationStorage","./MemoryPersonalizationStorage"],function(e,r,t){function o(e){return e&&e.__esModule&&typeof e.default!=="undefined"?e.default:e}function n(e){"@babel/helpers - typeof";return n="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},n(e)}var a=o(e);var u=o(r);var i=o(t);function c(e){return function(){for(var r=[],t=0;t<arguments.length;t++){r[t]=arguments[t]}try{return Promise.resolve(e.apply(this,r))}catch(e){return Promise.reject(e)}}}var f=c(function(e,r,t){if(n(e)==="object"){return e}switch(e){case"auto":if(r){return u.create()}else{return a.create(t)}case"browser":return a.create(t);case"flp":return u.create();case"memory":return i.create();default:return Promise.reject(new Error("Unknown Personalization Storage: "+e))}});var s={create:f};return s})})();
//# sourceMappingURL=keyValueStoreFactory.js.map