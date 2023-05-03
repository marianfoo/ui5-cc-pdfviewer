/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */
sap.ui.define(["sap/base/Log","../library","./Tool","./DuplicateSvgElementToolHandler","./DuplicateSvgElementToolGizmo"],function(t,i,e,o,s){"use strict";var n=e.extend("sap.ui.vk.tools.DuplicateSvgElementTool",{metadata:{library:"sap.ui.vk",properties:{parentNode:{type:"any",defaultValue:null},nodeList:{type:"any[]",defaultValue:[]}},events:{nodesCreated:{parameters:{x:"float",y:"float",nodes:"any[]",request:"object"}}}},constructor:function(t,i){if(n._instance){return n._instance}e.apply(this,arguments);this._viewport=null;this._handler=new o(this);n._instance=this}});n.prototype.init=function(){if(e.prototype.init){e.prototype.init.call(this)}this.setFootprint(["sap.ui.vk.svg.Viewport"]);this.setAggregation("gizmo",new s)};n.prototype.setActive=function(t,i,o){e.prototype.setActive.call(this,t,i,o);var s=this._viewport;if(s){if(t){this._gizmo=this.getGizmo();if(this._gizmo){this._gizmo.show(s,this)}this._addLocoHandler()}else{this._removeLocoHandler();if(this._gizmo){this._gizmo.hide();this._gizmo=null}}}return this};n.prototype.queueCommand=function(t){if(this._addLocoHandler()){if(this.isViewportType("sap.ui.vk.svg.Viewport")){t()}}return this};return n});
//# sourceMappingURL=DuplicateSvgElementTool.js.map