/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */
sap.ui.define(["sap/ui/base/EventProvider","sap/m/Menu","sap/m/MenuItem","../getResourceBundle","../thirdparty/three","./CoordinateSystem"],function(t,e,i,s,n,r){"use strict";var o=t.extend("sap.ui.vk.tools.MoveToolHandler",{metadata:{library:"sap.ui.vk"},constructor:function(t){this._priority=13;this._tool=t;this._gizmo=t.getGizmo();this._rect=null;this._rayCaster=new THREE.Raycaster;this._handleIndex=-1;this._gizmoIndex=-1;this._handleAxis=new THREE.Vector3;this._gizmoOrigin=new THREE.Vector3;this._gizmoScale=1;this._objectSpace=new THREE.Matrix4;this._mouse=new THREE.Vector2}});o.prototype._updateMouse=function(t){var e=this.getViewport().getRenderer().getSize(new THREE.Vector2);this._mouse.x=(t.x-this._rect.x)/e.width*2-1;this._mouse.y=(t.y-this._rect.y)/e.height*-2+1;this._rayCaster.setFromCamera(this._mouse,this.getViewport().getCamera().getCameraRef())};o.prototype._updateHandles=function(t,e){var i=this._handleIndex;this._handleIndex=-1;if(t.n===1||t.event&&t.event.type==="contextmenu"){for(var s=0,n=this._gizmo.getGizmoCount();s<n;s++){var o=this._gizmo.getTouchObject(s);var h=this._rayCaster.intersectObject(o,true);if(h.length>0){this._handleIndex=o.children.indexOf(h[0].object);if(this._handleIndex>=0){this._gizmoIndex=s;this._gizmoOrigin.setFromMatrixPosition(o.matrixWorld);this._gizmoScale=o.scale.x;this._objectSpace.extractRotation(o.matrixWorld);if(this._gizmo._coordinateSystem!==r.World){this._objectSpace.copyPosition(o.matrixWorld)}if(this._handleIndex<3){this._handleAxis.setFromMatrixColumn(o.matrixWorld,this._handleIndex).normalize()}else if(this._handleIndex<6){this._handleAxis.setFromMatrixColumn(o.matrixWorld,this._handleIndex-3).normalize()}}}}}this._gizmo.highlightHandle(this._handleIndex,e||this._handleIndex===-1);if(i!==this._handleIndex){this.getViewport().setShouldRenderFrame()}};o.prototype.hover=function(t){if(this._inside(t)&&!this._gesture){this._updateMouse(t);this._updateHandles(t,true);t.handled|=this._handleIndex>=0}};o.prototype.click=function(t){if(this._inside(t)&&!this._gesture){this._updateMouse(t);this._updateHandles(t,true);this._gizmo.selectHandle(this._handleIndex,this._gizmoIndex);t.handled|=this._handleIndex>=0}};var h=new THREE.Vector3;o.prototype._getAxisOffset=function(){var t=this._rayCaster.ray;var e=this._handleAxis.clone().cross(t.direction).cross(t.direction).normalize();h.copy(t.origin).sub(this._gizmoOrigin);return e.dot(h)/e.dot(this._handleAxis)};o.prototype._getPlaneOffset=function(){var t=this._rayCaster.ray;h.copy(this._gizmoOrigin).sub(t.origin);var e=this._handleAxis.dot(h)/this._handleAxis.dot(t.direction);return t.direction.clone().multiplyScalar(e).sub(h)};o.prototype.beginGesture=function(t){if(this._inside(t)&&!this._gesture){this._updateMouse(t);this._updateHandles(t,false);if(this._handleIndex>=0){this._gesture=true;t.handled=true;this._gizmo.selectHandle(this._handleIndex,this._gizmoIndex);this._gizmo.beginGesture();if(this._handleIndex<3){this._dragOrigin=this._getAxisOffset()}else if(this._handleIndex<6){this._dragOrigin=this._getPlaneOffset()}}}};o.prototype._setOffset=function(t){if(this._tool.getEnableStepping()){var e=Math.pow(10,Math.round(Math.log10(this._gizmoScale)))*.1;var i=(new THREE.Matrix4).getInverse(this._objectSpace);var s=this._gizmoOrigin.clone().applyMatrix4(i);var n=this._gizmoOrigin.clone().add(t).applyMatrix4(i);for(var r=0;r<3;r++){var o=n.getComponent(r);if(Math.abs(o-s.getComponent(r))>e*1e-5){var a=Math.round(o/e)*e;h.setFromMatrixColumn(this._objectSpace,r).multiplyScalar(a-o);t.add(h)}}}if(isFinite(t.x)&&isFinite(t.y)&&isFinite(t.z)){this._gizmo._setOffset(t,this._gizmoIndex)}};o.prototype.move=function(t){if(this._gesture){if(this._tool.getEnableSnapping()){this._tool.getDetector().detect({viewport:this._tool._viewport,gizmo:this._gizmo,detectType:"move"})}t.handled=true;this._updateMouse(t);if(this._handleIndex<3){if(isFinite(this._dragOrigin)){this._setOffset(this._handleAxis.clone().multiplyScalar(this._getAxisOffset()-this._dragOrigin))}}else if(this._handleIndex<6){if(isFinite(this._dragOrigin.x)&&isFinite(this._dragOrigin.y)&&isFinite(this._dragOrigin.z)){this._setOffset(this._getPlaneOffset().sub(this._dragOrigin))}}}};o.prototype.endGesture=function(t){if(this._gesture){this._gesture=false;t.handled=true;this._updateMouse(t);this._gizmo.endGesture();this._dragOrigin=undefined;this._updateHandles(t,true);this.getViewport().setShouldRenderFrame()}};o.prototype.contextMenu=function(t){if(!this._tool.getAllowContextMenu()){return}if(this._inside(t)){this._updateMouse(t);this._updateHandles(t,true);if(this._handleIndex>=0){t.handled=true;var n=new e({items:[new i({text:s().getText("TOOL_COORDINATE_SYSTEM_WORLD"),key:r.World}),new i({text:s().getText("TOOL_COORDINATE_SYSTEM_LOCAL"),key:r.Local}),new i({text:s().getText("TOOL_COORDINATE_SYSTEM_PARENT"),key:r.Parent}),new i({text:s().getText("TOOL_COORDINATE_SYSTEM_SCREEN"),key:r.Screen}),new i({text:s().getText("TOOL_COORDINATE_SYSTEM_CUSTOM"),key:r.Custom})],itemSelected:function(t){var e=t.getParameters("item").item;this._tool.setCoordinateSystem(e.getKey())}.bind(this)});n.openAsContextMenu(t.event,this.getViewport())}}};o.prototype.getViewport=function(){return this._tool._viewport};o.prototype._getOffset=function(t){var e=t.getBoundingClientRect();var i={x:e.left+window.pageXOffset,y:e.top+window.pageYOffset};return i};o.prototype._inside=function(t){if(this._rect===null||true){var e=this._tool._viewport.getIdForLabel();var i=document.getElementById(e);if(i===null){return false}var s=this._getOffset(i);this._rect={x:s.x,y:s.y,w:i.offsetWidth,h:i.offsetHeight}}return t.x>=this._rect.x&&t.x<=this._rect.x+this._rect.w&&t.y>=this._rect.y&&t.y<=this._rect.y+this._rect.h};return o});
//# sourceMappingURL=MoveToolHandler.js.map