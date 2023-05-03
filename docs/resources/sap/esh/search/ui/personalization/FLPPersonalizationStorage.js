/*! 
 * SAPUI5

		(c) Copyright 2009-2021 SAP SE. All rights reserved
	 
 */
(function(){sap.ui.define(["../SearchHelper"],function(e){function t(e,t){if(!(e instanceof t)){throw new TypeError("Cannot call a class as a function")}}function n(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||false;r.configurable=true;if("value"in r)r.writable=true;Object.defineProperty(e,r.key,r)}}function r(e,t,r){if(t)n(e.prototype,t);if(r)n(e,r);Object.defineProperty(e,"prototype",{writable:false});return e}function i(e,t,n){if(t in e){Object.defineProperty(e,t,{value:n,enumerable:true,configurable:true,writable:true})}else{e[t]=n}return e}
/*!
   * SAPUI5

		(c) Copyright 2009-2021 SAP SE. All rights reserved
	
   */var a=e["convertJQueryDeferredToPromise"];function o(e,t,n){if(n){return t?t(e):e}if(!e||!e.then){e=Promise.resolve(e)}return t?e.then(t):e}function u(e,t,n){if(n){return t?t(e()):e()}try{var r=Promise.resolve(e());return t?r.then(t):r}catch(e){return Promise.reject(e)}}var l=function(){function e(n){t(this,e);i(this,"eshIsStorageOfPersonalDataAllowedKey","ESH-IsStorageOfPersonalDataAllowed");this.container=n}r(e,[{key:"deletePersonalData",value:function e(){return o()}},{key:"setIsStorageOfPersonalDataAllowed",value:function e(t){this.setItem(this.eshIsStorageOfPersonalDataAllowedKey,t)}},{key:"isStorageOfPersonalDataAllowed",value:function e(){var t=this.getItem(this.eshIsStorageOfPersonalDataAllowedKey);if(typeof t==="boolean"){return t}return true}},{key:"save",value:function e(){var t=this.container.save();return a(t)}},{key:"getItem",value:function e(t){t=this.limitLength(t);return this.container.getItemValue(t)}},{key:"setItem",value:function e(t,n){t=this.limitLength(t);var r=this.getItem(t);if(JSON.stringify(r)===JSON.stringify(n)){return true}this.container.setItemValue(t,n);this.save();return true}},{key:"deleteItem",value:function e(t){this.container.delItem(t)}},{key:"limitLength",value:function e(t){return t.slice(-40)}}],[{key:"create",value:function t(){return u(function(){var t=sap.ushell.Container.getServiceAsync("Personalization").then(function(e){return e.getContainer("ushellSearchPersoServiceContainer")}).then(function(t){return new e(t)});return o(t)})}}]);return e}();return l})})();
//# sourceMappingURL=FLPPersonalizationStorage.js.map