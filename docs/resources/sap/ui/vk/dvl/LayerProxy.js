/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */
sap.ui.define(["../LayerProxy","./getJSONObject"],function(e,t){"use strict";var r=e.extend("sap.ui.vk.dvl.LayerProxy",{metadata:{library:"sap.ui.vk",publicMethods:["getDescription","getLayerId","getLayerMetadata","getName","getNodes","getVeIds"]},constructor:function(t,r){e.call(this);this._dvl=t?t.getGraphicsCore()._getDvl():null;this._dvlSceneRef=t?t.getSceneRef():null;this._dvlLayerId=r}});r.prototype.destroy=function(){this._dvlLayerId=null;this._dvlSceneRef=null;this._dvl=null;e.prototype.destroy.call(this)};r.prototype.getLayerId=function(){return this._dvlLayerId};r.prototype.getVeIds=function(){return t(this._dvl.Scene.RetrieveVEIDs(this._dvlSceneRef,this._dvlLayerId))};r.prototype.getName=function(){return t(this._dvl.Scene.RetrieveLayerInfo(this._dvlSceneRef,this._dvlLayerId)).name};r.prototype.getDescription=function(){return t(this._dvl.Scene.RetrieveLayerInfo(this._dvlSceneRef,this._dvlLayerId)).description};r.prototype.getLayerMetadata=function(){return t(this._dvl.Scene.RetrieveMetadata(this._dvlSceneRef,this._dvlLayerId)).metadata};r.prototype.getNodes=function(){return t(this._dvl.Scene.RetrieveLayerInfo(this._dvlSceneRef,this._dvlLayerId)).nodes};return r});
//# sourceMappingURL=LayerProxy.js.map