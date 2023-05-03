/*! 
 * SAPUI5

		(c) Copyright 2009-2021 SAP SE. All rights reserved
	 
 */
(function(){sap.ui.define(["./Formatter","../../configurationEngine/configuratorFactory"],function(t,e){function r(t,e){if(!(t instanceof e)){throw new TypeError("Cannot call a class as a function")}}function n(t,e){for(var r=0;r<e.length;r++){var n=e[r];n.enumerable=n.enumerable||false;n.configurable=true;if("value"in n)n.writable=true;Object.defineProperty(t,n.key,n)}}function o(t,e,r){if(e)n(t.prototype,e);if(r)n(t,r);Object.defineProperty(t,"prototype",{writable:false});return t}function i(t,e){if(typeof e!=="function"&&e!==null){throw new TypeError("Super expression must either be null or a function")}t.prototype=Object.create(e&&e.prototype,{constructor:{value:t,writable:true,configurable:true}});Object.defineProperty(t,"prototype",{writable:false});if(e)u(t,e)}function u(t,e){u=Object.setPrototypeOf||function t(e,r){e.__proto__=r;return e};return u(t,e)}function f(t){var e=s();return function r(){var n=l(t),o;if(e){var i=l(this).constructor;o=Reflect.construct(n,arguments,i)}else{o=n.apply(this,arguments)}return c(this,o)}}function c(t,e){if(e&&(typeof e==="object"||typeof e==="function")){return e}else if(e!==void 0){throw new TypeError("Derived constructors may only return object or undefined")}return a(t)}function a(t){if(t===void 0){throw new ReferenceError("this hasn't been initialised - super() hasn't been called")}return t}function s(){if(typeof Reflect==="undefined"||!Reflect.construct)return false;if(Reflect.construct.sham)return false;if(typeof Proxy==="function")return true;try{Boolean.prototype.valueOf.call(Reflect.construct(Boolean,[],function(){}));return true}catch(t){return false}}function l(t){l=Object.setPrototypeOf?Object.getPrototypeOf:function t(e){return e.__proto__||Object.getPrototypeOf(e)};return l(t)}
/*!
   * SAPUI5

		(c) Copyright 2009-2021 SAP SE. All rights reserved
	
   */var p=t["Formatter"];var y=function(t){i(u,t);var n=f(u);function u(t,e){var o;r(this,u);o=n.call(this);o.type=t;o.configuration=e;return o}o(u,[{key:"initAsync",value:function t(){return e.createConfiguratorAsync({type:this.type,configuration:this.configuration}).then(function(t){this.configurator=t}.bind(this))}},{key:"formatAsync",value:function t(e){return this.configurator.configureAsync(e)}},{key:"format",value:function t(e){return this.configurator.configure(e)}}]);return u}(p);var h={__esModule:true};h.ConfigFormatter=y;return h})})();
//# sourceMappingURL=ConfigFormatter.js.map