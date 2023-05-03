/*! 
 * SAPUI5

		(c) Copyright 2009-2021 SAP SE. All rights reserved
	 
 */
(function(){sap.ui.define(["./ResultSet"],function(e){function t(e,t){if(!(e instanceof t)){throw new TypeError("Cannot call a class as a function")}}function r(e,t){for(var r=0;r<t.length;r++){var n=t[r];n.enumerable=n.enumerable||false;n.configurable=true;if("value"in n)n.writable=true;Object.defineProperty(e,n.key,n)}}function n(e,t,n){if(t)r(e.prototype,t);if(n)r(e,n);Object.defineProperty(e,"prototype",{writable:false});return e}function o(){if(typeof Reflect!=="undefined"&&Reflect.get){o=Reflect.get}else{o=function e(t,r,n){var o=u(t,r);if(!o)return;var i=Object.getOwnPropertyDescriptor(o,r);if(i.get){return i.get.call(arguments.length<3?t:n)}return i.value}}return o.apply(this,arguments)}function u(e,t){while(!Object.prototype.hasOwnProperty.call(e,t)){e=p(e);if(e===null)break}return e}function i(e,t){if(typeof t!=="function"&&t!==null){throw new TypeError("Super expression must either be null or a function")}e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,writable:true,configurable:true}});Object.defineProperty(e,"prototype",{writable:false});if(t)f(e,t)}function f(e,t){f=Object.setPrototypeOf||function e(t,r){t.__proto__=r;return t};return f(e,t)}function c(e){var t=s();return function r(){var n=p(e),o;if(t){var u=p(this).constructor;o=Reflect.construct(n,arguments,u)}else{o=n.apply(this,arguments)}return l(this,o)}}function l(e,t){if(t&&(typeof t==="object"||typeof t==="function")){return t}else if(t!==void 0){throw new TypeError("Derived constructors may only return object or undefined")}return a(e)}function a(e){if(e===void 0){throw new ReferenceError("this hasn't been initialised - super() hasn't been called")}return e}function s(){if(typeof Reflect==="undefined"||!Reflect.construct)return false;if(Reflect.construct.sham)return false;if(typeof Proxy==="function")return true;try{Boolean.prototype.valueOf.call(Reflect.construct(Boolean,[],function(){}));return true}catch(e){return false}}function p(e){p=Object.setPrototypeOf?Object.getPrototypeOf:function e(t){return t.__proto__||Object.getPrototypeOf(t)};return p(e)}
/*!
   * SAPUI5

		(c) Copyright 2009-2021 SAP SE. All rights reserved
	
   */var y=e["ResultSet"];var b=function(e){i(u,e);var r=c(u);function u(e){t(this,u);return r.call(this,e)}n(u,[{key:"toString",value:function e(){var t=[];t.push("--Facet");t.push(o(p(u.prototype),"toString",this).call(this));return t.join("\n")}}]);return u}(y);var h={__esModule:true};h.FacetResultSet=b;return h})})();
//# sourceMappingURL=FacetResultSet.js.map