/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */
sap.ui.define(["./Element"],function(t){"use strict";var i=function(i){i=i||{};t.call(this,i);this.type="LinearGradient";this.x1=i.x1;this.y1=i.y1;this.x2=i.x2;this.y2=i.y2;this.gradient=i.gradient||[];this.gradientUnits="userSpaceOnUse"};i.prototype=Object.assign(Object.create(t.prototype),{constructor:i});i.prototype.tagName=function(){return"linearGradient"};i.prototype._setBaseAttributes=function(t,i){t("id",this.uid)};i.prototype._setSpecificAttributes=function(t){if(this.x1!==undefined){t("x1",this.x1)}if(this.y1!==undefined){t("y1",this.y1)}if(this.x2!==undefined){t("x2",this.x2)}if(this.y2!==undefined){t("y2",this.y2)}if(this.gradientTransform!==undefined){t("gradientTransform","matrix("+this.gradientTransform.join(",")+")")}if(this.gradientUnits!==undefined){t("gradientUnits",this.gradientUnits)}};i.prototype._renderContent=function(t){var i=this.gradient;for(var e=0,n=i.length;e<n;e+=2){t.openStart("stop");t.attr("offset",i[e]);t.attr("stop-color",i[e+1]);t.openEnd();t.close("stop")}};i.prototype._createContent=function(i){var e=this.gradient;for(var n=0,r=e.length;n<r;n+=2){var s=document.createElementNS(t._svgNamespace,"stop");s.setAttribute("offset",e[n]);s.setAttribute("stop-color",e[n+1]);i.append(s)}};i.prototype.copy=function(i,e){t.prototype.copy.call(this,i,e);this.x1=i.x1;this.y1=i.y1;this.x2=i.x2;this.y2=i.y2;this.gradient=i.gradient.slice();if(this.gradientUnits!==undefined){this.gradientUnits=i.gradientUnits}if(i.gradientTransform!==undefined){this.gradientTransform=i.gradientTransform.slice()}return this};return i});
//# sourceMappingURL=LinearGradient.js.map