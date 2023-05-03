/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define(["sap/ui/base/Object","sap/ui/thirdparty/jquery"],function(e,jQuery){"use strict";var t={};var a=e.extend("sap.suite.ui.commons.statusindicator.shapes.ShapeFactory");a.prototype.getShapeById=function(e){var t=this._getLoadedShapes(),a=t[e]||null;if(!a){return new Promise(function(a,o){jQuery.ajax({url:sap.ui.require.toUrl("sap/suite/ui/commons/statusindicator")+"/shapes/"+e+".svg",dataType:"text"}).done(function(o){t[e]=o;a(o)}).fail(function(e){o(e)})})}return Promise.resolve(a)};a.prototype._getLoadedShapes=function(){return t};a.prototype._removeAllLoadedShapes=function(){t={}};return a});
//# sourceMappingURL=ShapeFactory.js.map