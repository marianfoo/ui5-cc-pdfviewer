/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */
sap.ui.define(["./Element"],function(t){"use strict";var i=function(i){i=i||{};t.call(this,i);this.type="Rectangle";this.x=i.x||0;this.y=i.y||0;this.width=i.width||0;this.height=i.height||i.length||0;this.rx=i.rx||i.radius||0;this.ry=i.ry||i.radius||0;this.setMaterial(i.material)};i.prototype=Object.assign(Object.create(t.prototype),{constructor:i});i.prototype.tagName=function(){return"rect"};i.prototype._expandBoundingBox=function(t,i){var h=isNaN(this.strokeWidth)?0:this.strokeWidth*.5;var e=this.width*.5;var r=this.height*.5;this._expandBoundingBoxCE(t,i,this.x+e,this.y+r,e+h,r+h)};i.prototype._setSpecificAttributes=function(t){if(this.x){t("x",this.x)}if(this.y){t("y",this.y)}t("width",this.width);t("height",this.height);if(this.rx){t("rx",this.rx)}if(this.ry){t("ry",this.ry)}};i.prototype._getParametricShape=function(i,h,e){var r=t.prototype._getParametricShape.call(this,i,h,e);r.type="rectangle";r.width=this.width;r.length=this.height;r.radius=Math.min(this.rx,this.ry);return r};i.prototype.copy=function(i,h){t.prototype.copy.call(this,i,h);this.x=i.x;this.y=i.y;this.width=i.width;this.height=i.height;this.rx=i.rx;this.ry=i.ry;return this};return i});
//# sourceMappingURL=Rectangle.js.map