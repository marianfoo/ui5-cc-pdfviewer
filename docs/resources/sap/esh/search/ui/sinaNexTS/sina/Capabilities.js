/*! 
 * SAPUI5

		(c) Copyright 2009-2021 SAP SE. All rights reserved
	 
 */
(function(){sap.ui.define(["./SinaObject"],function(e){function t(e,t){for(var r=0;r<t.length;r++){var n=t[r];n.enumerable=n.enumerable||false;n.configurable=true;if("value"in n)n.writable=true;Object.defineProperty(e,n.key,n)}}function r(e,r,n){if(r)t(e.prototype,r);if(n)t(e,n);Object.defineProperty(e,"prototype",{writable:false});return e}function n(e,t){if(!(e instanceof t)){throw new TypeError("Cannot call a class as a function")}}function o(e,t){if(typeof t!=="function"&&t!==null){throw new TypeError("Super expression must either be null or a function")}e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,writable:true,configurable:true}});Object.defineProperty(e,"prototype",{writable:false});if(t)u(e,t)}function u(e,t){u=Object.setPrototypeOf||function e(t,r){t.__proto__=r;return t};return u(e,t)}function i(e){var t=a();return function r(){var n=l(e),o;if(t){var u=l(this).constructor;o=Reflect.construct(n,arguments,u)}else{o=n.apply(this,arguments)}return f(this,o)}}function f(e,t){if(t&&(typeof t==="object"||typeof t==="function")){return t}else if(t!==void 0){throw new TypeError("Derived constructors may only return object or undefined")}return c(e)}function c(e){if(e===void 0){throw new ReferenceError("this hasn't been initialised - super() hasn't been called")}return e}function a(){if(typeof Reflect==="undefined"||!Reflect.construct)return false;if(Reflect.construct.sham)return false;if(typeof Proxy==="function")return true;try{Boolean.prototype.valueOf.call(Reflect.construct(Boolean,[],function(){}));return true}catch(e){return false}}function l(e){l=Object.setPrototypeOf?Object.getPrototypeOf:function e(t){return t.__proto__||Object.getPrototypeOf(t)};return l(e)}function s(e,t,r){if(t in e){Object.defineProperty(e,t,{value:r,enumerable:true,configurable:true,writable:true})}else{e[t]=r}return e}
/*!
   * SAPUI5

		(c) Copyright 2009-2021 SAP SE. All rights reserved
	
   */var p=e["SinaObject"];var y=function(e){o(u,e);var t=i(u);function u(e){var r;var o;n(this,u);o=t.call(this,e);s(c(o),"fuzzy",false);o.fuzzy=(r=e.fuzzy)!==null&&r!==void 0?r:false;return o}return r(u)}(p);var b={__esModule:true};b.Capabilities=y;return b})})();
//# sourceMappingURL=Capabilities.js.map