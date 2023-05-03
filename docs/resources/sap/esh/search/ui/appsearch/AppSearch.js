/*! 
 * SAPUI5

		(c) Copyright 2009-2021 SAP SE. All rights reserved
	 
 */
(function(){sap.ui.define(["./CatalogSearch"],function(r){function e(r){return r&&r.__esModule&&typeof r.default!=="undefined"?r.default:r}function t(r){return i(r)||o(r)||a(r)||n()}function n(){throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}function a(r,e){if(!r)return;if(typeof r==="string")return u(r,e);var t=Object.prototype.toString.call(r).slice(8,-1);if(t==="Object"&&r.constructor)t=r.constructor.name;if(t==="Map"||t==="Set")return Array.from(r);if(t==="Arguments"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t))return u(r,e)}function o(r){if(typeof Symbol!=="undefined"&&r[Symbol.iterator]!=null||r["@@iterator"]!=null)return Array.from(r)}function i(r){if(Array.isArray(r))return u(r)}function u(r,e){if(e==null||e>r.length)e=r.length;for(var t=0,n=new Array(e);t<e;t++)n[t]=r[t];return n}function f(r,e){if(!(r instanceof e)){throw new TypeError("Cannot call a class as a function")}}function c(r,e){for(var t=0;t<e.length;t++){var n=e[t];n.enumerable=n.enumerable||false;n.configurable=true;if("value"in n)n.writable=true;Object.defineProperty(r,n.key,n)}}function l(r,e,t){if(e)c(r.prototype,e);if(t)c(r,t);Object.defineProperty(r,"prototype",{writable:false});return r}
/*!
   * SAPUI5

		(c) Copyright 2009-2021 SAP SE. All rights reserved
	
   */var s=e(r);function h(r,e,t){if(t){return e?e(r()):r()}try{var n=Promise.resolve(r());return e?n.then(e):n}catch(r){return Promise.reject(r)}}var v=function(){function r(){f(this,r);this.catalogSearch=new s;this.searchProviders=[this.catalogSearch]}l(r,[{key:"prefetch",value:function r(){for(var e=0;e<this.searchProviders.length;e++){var t=this.searchProviders[e];t.prefetch()}}},{key:"search",value:function r(e){var n=this;return h(function(){var r=[];for(var a=0;a<n.searchProviders.length;a++){var o=n.searchProviders[a];r.push(o.search(e))}return Promise.all(r).then(function(r){var e={totalCount:0,tiles:[]};for(var n=0;n<r.length;n++){var a;var o=r[n];e.totalCount+=o.totalCount;(a=e.tiles).push.apply(a,t(o.tiles))}return e})})}}]);return r}();return v})})();
//# sourceMappingURL=AppSearch.js.map