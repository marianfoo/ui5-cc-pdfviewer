/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */
sap.ui.define(["./library","sap/ui/core/Control","./Loco","./RedlineGesturesHandler","./RedlineSurfaceRenderer","./Redline","sap/base/Log"],function(e,t,i,n,a,r,l){"use strict";var o=t.extend("sap.ui.vk.RedlineSurface",{metadata:{library:"sap.ui.vk",aggregations:{redlineElements:{type:"sap.ui.vk.RedlineElement"}},properties:{virtualLeft:{type:"float"},virtualTop:{type:"float"},virtualSideLength:{type:"float"},panningRatio:{type:"float",defaultValue:1}},events:{pan:{parameters:{deltaX:"float",deltaY:"float"}},zoom:{parameters:{originX:"float",originY:"float",zoomFactor:"float"}}}}});o.prototype.init=function(){};o.prototype.onAfterRendering=function(){};o.prototype.exportJSON=function(){return this.getRedlineElements().map(function(e){return e.exportJSON()})};o.prototype.importJSON=function(e){if(!jQuery.isArray(e)){e=[e]}e.forEach(function(e){var t;switch(e.type){case r.ElementType.Rectangle:t=sap.ui.vk.RedlineElementRectangle;break;case r.ElementType.Ellipse:t=sap.ui.vk.RedlineElementEllipse;break;case r.ElementType.Freehand:t=sap.ui.vk.RedlineElementFreehand;break;case r.ElementType.Line:t=sap.ui.vk.RedlineElementLine;break;case r.ElementType.Text:t=sap.ui.vk.RedlineElementText;break;default:l.warning("Unsupported JSON element type "+e.type)}if(t!=null){this.addRedlineElement((new t).importJSON(e))}}.bind(this));return this};o.prototype._toVirtualSpace=function(e,t){if(arguments.length===1){return e/this.getVirtualSideLength()}else{return{x:(e-this.getVirtualLeft())/this.getVirtualSideLength(),y:(t-this.getVirtualTop())/this.getVirtualSideLength()}}};o.prototype._toPixelSpace=function(e,t){if(arguments.length===1){return e*this.getVirtualSideLength()}else{return{x:e*this.getVirtualSideLength()+this.getVirtualLeft(),y:t*this.getVirtualSideLength()+this.getVirtualTop()}}};o.prototype.setPanningRatio=function(e){this.setProperty("panningRatio",e,true)};o.prototype.updatePanningRatio=function(){var e=this.getVirtualLeft(),t=this.getVirtualTop(),i=this.getDomRef(),n=i.getBoundingClientRect(),a=n.height,r=n.width,l;if(e===0&&(a<r&&t<0||a>r&&t>0)){l=a/r}else{l=1}this.setPanningRatio(l);return this};o.prototype.exportSVG=function(){var e=document.createElementNS(r.svgNamespace,"svg");this.getRedlineElements().map(function(t){e.appendChild(t.exportSVG())});return e};o.prototype.importSVG=function(e){e.childNodes.forEach(function(e){if(e.getAttribute){var t;switch(e.tagName){case"rect":t=sap.ui.vk.RedlineElementRectangle;break;case"ellipse":t=sap.ui.vk.RedlineElementEllipse;break;case"path":t=sap.ui.vk.RedlineElementFreehand;break;case"line":t=sap.ui.vk.RedlineElementLine;break;case"text":t=sap.ui.vk.RedlineElementText;break;default:l.warning("Unsupported SVG element type "+t)}if(t){this.addRedlineElement((new t).importSVG(e))}}}.bind(this));return this};return o});
//# sourceMappingURL=RedlineSurface.js.map