/*! 
 * SAPUI5

		(c) Copyright 2009-2021 SAP SE. All rights reserved
	 
 */
(function(){sap.ui.define(["./SuggestionType"],function(e){function r(e,r){if(!(e instanceof r)){throw new TypeError("Cannot call a class as a function")}}function t(e,r){for(var t=0;t<r.length;t++){var n=r[t];n.enumerable=n.enumerable||false;n.configurable=true;if("value"in n)n.writable=true;Object.defineProperty(e,n.key,n)}}function n(e,r,n){if(r)t(e.prototype,r);if(n)t(e,n);Object.defineProperty(e,"prototype",{writable:false});return e}var i=e["Type"];function o(e,r,t){if(t){return r?r(e()):e()}try{var n=Promise.resolve(e());return r?n.then(r):n}catch(e){return Promise.reject(e)}}var u=function(){function e(t){r(this,e);this.model=t.model;this.suggestionHandler=t.suggestionHandler}n(e,[{key:"abortSuggestions",value:function e(){return}},{key:"getSuggestions",value:function e(){var r=this;return o(function(){if(r.model.getSearchBoxTerm().length>0){return Promise.resolve([])}var e=JSON.parse(JSON.stringify(r.model.recentlyUsedStorage.getItems()));var t=r.suggestionHandler.getSuggestionLimit(i.Recent);e=e.slice(0,t);return Promise.resolve(e)})}}]);return e}();return u})})();
//# sourceMappingURL=RecentlyUsedSuggestionProvider.js.map