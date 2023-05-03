/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */
sap.ui.define(["./Messages","./ContentManager","./getResourceBundle"],function(e,t,n){"use strict";var i=t.extend("sap.ui.vk.ImageContentManager",{metadata:{library:"sap.ui.vk"}});var s=i.getMetadata().getParent().getClass().prototype;i.prototype.init=function(){if(s.init){s.init.call(this)}this._handleLoadSucceededProxy=this._handleLoadSucceeded.bind(this);this._handleLoadFailedProxy=this._handleLoadFailed.bind(this)};i.prototype.exit=function(){if(s.exit){s.exit.call(this)}};i.prototype.loadContent=function(e,t){if(t.length!==1){setTimeout(function(){this.fireContentChangesStarted();this.fireContentChangesFinished({content:null,failureReason:{errorMessage:n().getText("IMAGECONTENTMANAGER_ONLY_LOAD_SINGLE_IMAGE")}})}.bind(this),0)}else if(t[0].getContentResources().length>0){setTimeout(function(){this.fireContentChangesStarted();this.fireContentChangesFinished({content:null,failureReason:{errorMessage:n().getText("IMAGECONTENTMANAGER_CANNOT_LOAD_IMAGE_HIERARCHY")}})}.bind(this),0)}else{var i=t[0],s=i.getSource(),o=i.getSourceType(),r=null;if(i._contentManagerResolver&&i._contentManagerResolver.settings&&i._contentManagerResolver.settings.loader){r=i._contentManagerResolver.settings.loader}if(s instanceof File){var a=new FileReader;a.onload=function(t){this._loadImageFromUrl(e,a.result,o,r)}.bind(this);a.readAsDataURL(s)}else{var d=new sap.m.Image({src:s});s=d.getSrc();d.destroy();this._loadImageFromUrl(e,s,o,r)}}};i.prototype._addEventListeners=function(e){e.addEventListener("load",this._handleLoadSucceededProxy);e.addEventListener("error",this._handleLoadFailedProxy)};i.prototype._removeEventListeners=function(e){e.removeEventListener("error",this._handleLoadFailedProxy);e.removeEventListener("load",this._handleLoadSucceededProxy)};i.prototype._addSvgQuirks=function(e){e.style.setProperty("visibility","collapse");e.style.setProperty("width","0");e.style.setProperty("height","0");e.style.setProperty("position","absolute");document.body.appendChild(e);return this};i.prototype._removeSvgQuirks=function(e){e.parentElement.removeChild(e);e.style.removeProperty("visibility");e.style.removeProperty("width");e.style.removeProperty("height");e.style.removeProperty("position");return this};i.prototype._loadImageFromUrl=function(e,t,i,s){this.fireContentChangesStarted();switch(i.toLowerCase()){case"svg":var o=document.createElement("object");this._addEventListeners(o);o.type="image/svg+xml";o.data=t;o.className="SVGImage";this._addSvgQuirks(o);break;case"jpg":case"jpeg":case"png":case"gif":case"bmp":case"tif":case"tiff":var r=document.createElement("img");this._addEventListeners(r);if(s){var a=this;s(t).then(function(e){r.src=e},function(e){a.fireContentChangesFinished({content:null,failureReason:{errorMessage:e}})})}else{r.src=t}break;default:setTimeout(function(){this.fireContentChangesFinished({content:null,failureReason:{errorMessage:n().getText("IMAGECONTENTMANAGER_UNSUPPORTED_IMAGE_TYPE"),sourcesFailedToDownload:[{source:t}]}})}.bind(this),0);break}};i.prototype._handleLoadSucceeded=function(e){var t=e.target;this._removeEventListeners(t);if(t instanceof HTMLObjectElement){this._removeSvgQuirks(t)}this.fireContentChangesFinished({content:t})};i.prototype._handleLoadFailed=function(e){var t=e.target;this._removeEventListeners(t);if(t instanceof HTMLObjectElement){this._removeSvgQuirks(t)}this.fireContentChangesFinished({content:null,failureReason:{errorMessage:n().getText("IMAGECONTENTMANAGER_IMAGE_LOAD_FAILED"),sourcesFailedToDownload:[{source:t instanceof HTMLImageElement?t.src:t.data}]}})};return i});
//# sourceMappingURL=ImageContentManager.js.map