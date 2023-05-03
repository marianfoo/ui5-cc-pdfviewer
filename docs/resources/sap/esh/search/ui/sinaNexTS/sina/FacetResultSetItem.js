/*! 
 * SAPUI5

		(c) Copyright 2009-2021 SAP SE. All rights reserved
	 
 */
(function(){sap.ui.define(["./ResultSetItem"],function(e){function t(e,t){if(!(e instanceof t)){throw new TypeError("Cannot call a class as a function")}}function r(e,t){for(var r=0;r<t.length;r++){var n=t[r];n.enumerable=n.enumerable||false;n.configurable=true;if("value"in n)n.writable=true;Object.defineProperty(e,n.key,n)}}function n(e,t,n){if(t)r(e.prototype,t);if(n)r(e,n);Object.defineProperty(e,"prototype",{writable:false});return e}function o(e,t){if(typeof t!=="function"&&t!==null){throw new TypeError("Super expression must either be null or a function")}e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,writable:true,configurable:true}});Object.defineProperty(e,"prototype",{writable:false});if(t)u(e,t)}function u(e,t){u=Object.setPrototypeOf||function e(t,r){t.__proto__=r;return t};return u(e,t)}function i(e){var t=c();return function r(){var n=l(e),o;if(t){var u=l(this).constructor;o=Reflect.construct(n,arguments,u)}else{o=n.apply(this,arguments)}return a(this,o)}}function a(e,t){if(t&&(typeof t==="object"||typeof t==="function")){return t}else if(t!==void 0){throw new TypeError("Derived constructors may only return object or undefined")}return f(e)}function f(e){if(e===void 0){throw new ReferenceError("this hasn't been initialised - super() hasn't been called")}return e}function c(){if(typeof Reflect==="undefined"||!Reflect.construct)return false;if(Reflect.construct.sham)return false;if(typeof Proxy==="function")return true;try{Boolean.prototype.valueOf.call(Reflect.construct(Boolean,[],function(){}));return true}catch(e){return false}}function l(e){l=Object.setPrototypeOf?Object.getPrototypeOf:function e(t){return t.__proto__||Object.getPrototypeOf(t)};return l(e)}
/*!
   * SAPUI5

		(c) Copyright 2009-2021 SAP SE. All rights reserved
	
   */var s=e["ResultSetItem"];var p=function(e){o(u,e);var r=i(u);function u(e){var n,o,i;var a;t(this,u);a=r.call(this,e);a.dimensionValueFormatted=(n=e.dimensionValueFormatted)!==null&&n!==void 0?n:a.dimensionValueFormatted;a.measureValue=(o=e.measureValue)!==null&&o!==void 0?o:a.measureValue;a.measureValueFormatted=(i=e.measureValueFormatted)!==null&&i!==void 0?i:a.measureValueFormatted;return a}n(u,[{key:"toString",value:function e(){return this.dimensionValueFormatted+":"+this.measureValueFormatted}}]);return u}(s);var d={__esModule:true};d.FacetResultSetItem=p;return d})})();
//# sourceMappingURL=FacetResultSetItem.js.map