/*! 
 * SAPUI5

		(c) Copyright 2009-2021 SAP SE. All rights reserved
	 
 */
(function(){sap.ui.define(["../SearchFacetDialogModel","./SearchFacetDialog","../sinaNexTS/providers/abap_odata/UserEventLogger"],function(e,t,r){function n(e){return e&&e.__esModule&&typeof e.default!=="undefined"?e.default:e}var a=n(e);var o=n(t);var i=r["UserEventType"];function c(e,t,r){if(r){return t?t(e):e}if(!e||!e.then){e=Promise.resolve(e)}return t?e.then(t):e}function u(e){return function(){for(var t=[],r=0;r<arguments.length;r++){t[r]=arguments[r]}try{return Promise.resolve(e.apply(this,t))}catch(e){return Promise.reject(e)}}}var s=u(function(e,t){var r=new a({searchModel:e});return c(r.initAsync(),function(){r.setData(e.getData());r.config=e.config;r.sinaNext=e.sinaNext;r.prepareFacetList();var n=new o("".concat(e.config.id,"-SearchFacetDialog"),{selectedAttribute:t,selectedTabBarIndex:0});n.setModel(r);n.setModel(e,"searchModel");n.open();e.eventLogger.logEvent({type:i.FACET_SHOW_MORE,referencedAttribute:t})})});var f={__esModule:true};f.openShowMoreDialog=s;return f})})();
//# sourceMappingURL=OpenShowMoreDialog.js.map