/*! 
 * SAPUI5

		(c) Copyright 2009-2021 SAP SE. All rights reserved
	 
 */
(function(){sap.ui.define(["./SinaObject","../providers/abap_odata/Provider","../providers/inav2/Provider"],function(e,r,t){function n(e,r){if(!(e instanceof r)){throw new TypeError("Cannot call a class as a function")}}function o(e,r){for(var t=0;t<r.length;t++){var n=r[t];n.enumerable=n.enumerable||false;n.configurable=true;if("value"in n)n.writable=true;Object.defineProperty(e,n.key,n)}}function i(e,r,t){if(r)o(e.prototype,r);if(t)o(e,t);Object.defineProperty(e,"prototype",{writable:false});return e}function a(e,r){if(typeof r!=="function"&&r!==null){throw new TypeError("Super expression must either be null or a function")}e.prototype=Object.create(r&&r.prototype,{constructor:{value:e,writable:true,configurable:true}});Object.defineProperty(e,"prototype",{writable:false});if(r)u(e,r)}function u(e,r){u=Object.setPrototypeOf||function e(r,t){r.__proto__=t;return r};return u(e,r)}function c(e){var r=l();return function t(){var n=p(e),o;if(r){var i=p(this).constructor;o=Reflect.construct(n,arguments,i)}else{o=n.apply(this,arguments)}return f(this,o)}}function f(e,r){if(r&&(typeof r==="object"||typeof r==="function")){return r}else if(r!==void 0){throw new TypeError("Derived constructors may only return object or undefined")}return s(e)}function s(e){if(e===void 0){throw new ReferenceError("this hasn't been initialised - super() hasn't been called")}return e}function l(){if(typeof Reflect==="undefined"||!Reflect.construct)return false;if(Reflect.construct.sham)return false;if(typeof Proxy==="function")return true;try{Boolean.prototype.valueOf.call(Reflect.construct(Boolean,[],function(){}));return true}catch(e){return false}}function p(e){p=Object.setPrototypeOf?Object.getPrototypeOf:function e(r){return r.__proto__||Object.getPrototypeOf(r)};return p(e)}
/*!
   * SAPUI5

		(c) Copyright 2009-2021 SAP SE. All rights reserved
	
   */var v=e["SinaObject"];var d=r["Provider"];var y=t["Provider"];function h(e,r,t){if(t){return r?r(e):e}if(!e||!e.then){e=Promise.resolve(e)}return r?e.then(r):e}function b(e,r,t){if(t){return r?r(e()):e()}try{var n=Promise.resolve(e());return r?n.then(r):n}catch(e){return Promise.reject(e)}}var P=function(e){a(t,e);var r=c(t);function t(e){var o,i;var a;n(this,t);a=r.call(this,e);a.personalizedSearch=(o=e.personalizedSearch)!==null&&o!==void 0?o:a.personalizedSearch;a.isPersonalizedSearchEditable=(i=e.isPersonalizedSearchEditable)!==null&&i!==void 0?i:a.isPersonalizedSearchEditable;return a}i(t,[{key:"setPersonalizedSearch",value:function e(r){this.personalizedSearch=r}},{key:"resetPersonalizedSearchDataAsync",value:function e(){var r=this;return b(function(){return r.sina.provider instanceof y||r.sina.provider instanceof d?h(r.sina.provider.resetPersonalizedSearchDataAsync()):h()})}},{key:"saveAsync",value:function e(){var r=this;return b(function(){return r.sina.provider instanceof y||r.sina.provider instanceof d?h(r.sina.provider.saveConfigurationAsync(r)):h()})}}]);return t}(v);var O={__esModule:true};O.Configuration=P;return O})})();
//# sourceMappingURL=Configuration.js.map