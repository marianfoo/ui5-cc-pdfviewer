/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */
sap.ui.define(["./Tool","./MeasurementToolHandler","./AngleMeasurementToolGizmo"],function(t,i,e){"use strict";var s=t.extend("sap.ui.vk.tools.AngleMeasurementTool",{metadata:{library:"sap.ui.vk"}});var o=s.getMetadata().getParent().getClass().prototype;s.prototype.init=function(){if(o.init){o.init.call(this)}this._viewport=null;this._handler=new i(this);this.setFootprint(["sap.ui.vk.threejs.Viewport","sap.ui.vk.svg.Viewport"]);this.setGizmo(new e)};s.prototype.exit=function(){o.exit.apply(this,arguments)};s.prototype.setActive=function(t,i,e){o.setActive.call(this,t,i,e);if(this._viewport){if(t){this._gizmo=this.getGizmo();if(this._gizmo){this._gizmo.show(this._viewport,this)}this._addLocoHandler();this._viewport.addStyleClass("sapUiVizKitAngleCursor")}else{this._viewport.removeStyleClass("sapUiVizKitAngleCursor");this._removeLocoHandler();if(this._gizmo){this._gizmo.hide();this._gizmo=null}}}return this};return s});
//# sourceMappingURL=AngleMeasurementTool.js.map