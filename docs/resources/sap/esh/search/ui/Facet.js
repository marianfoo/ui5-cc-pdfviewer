/*! 
 * SAPUI5

		(c) Copyright 2009-2021 SAP SE. All rights reserved
	 
 */
(function(){sap.ui.define([],function(){function t(t,e){if(!(t instanceof e)){throw new TypeError("Cannot call a class as a function")}}function e(t,e){for(var i=0;i<e.length;i++){var n=e[i];n.enumerable=n.enumerable||false;n.configurable=true;if("value"in n)n.writable=true;Object.defineProperty(t,n.key,n)}}function i(t,i,n){if(i)e(t.prototype,i);if(n)e(t,n);Object.defineProperty(t,"prototype",{writable:false});return t}var n=function(){function e(i){t(this,e);this.title=i.title;this.facetType=i.facetType;this.dimension=i.dimension;this.dataType=i.dataType;this.matchingStrategy=i.matchingStrategy;this.items=i.items||[];this.totalCount=i.totalCount;this.visible=i.visible||true}i(e,[{key:"hasFilterCondition",value:function t(e){for(var i=0,n=this.items.length;i<n;i++){var r=this.items[i].filterCondition;if(r.equals&&r.equals(e)){return true}}return false}},{key:"hasFilterConditions",value:function t(){for(var e=0,i=this.items.length;e<i;e++){if(this.items[e].filterCondition){return true}}return false}},{key:"removeItem",value:function t(e){for(var i=0,n=this.items.length;i<n;i++){var r=this.items[i].filterCondition;if(r.equals&&e.filterCondition&&r.equals(e.filterCondition)){return this.items.splice(i,1)}}}}]);return e}();return n})})();
//# sourceMappingURL=Facet.js.map