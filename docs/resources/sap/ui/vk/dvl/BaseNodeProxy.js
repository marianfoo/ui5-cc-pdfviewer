/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */
sap.ui.define(["../BaseNodeProxy","./getJSONObject"],function(e,t){"use strict";var d=e.extend("sap.ui.vk.dvl.BaseNodeProxy",{metadata:{library:"sap.ui.vk"}});d.prototype.init=function(e,t){this._dvl=e?e.getGraphicsCore()._getDvl():null;this._dvlSceneRef=e?e.getSceneRef():null;this._dvlNodeRef=t};d.prototype.reset=function(){this._dvlNodeRef=null;this._dvlSceneRef=null;this._dvl=null};d.prototype.getNodeRef=function(){return this._dvlNodeRef};d.prototype.getNodeId=function(){return this._dvlNodeRef};d.prototype.getName=function(){return t(this._dvl.Scene.RetrieveNodeInfo(this._dvlSceneRef,this._dvlNodeRef,sap.ve.dvl.DVLNODEINFO.DVLNODEINFO_NAME)).NodeName};d.prototype.getNodeMetadata=function(){return t(this._dvl.Scene.RetrieveMetadata(this._dvlSceneRef,this._dvlNodeRef)).metadata};d.prototype.getHasChildren=function(){return(t(this._dvl.Scene.RetrieveNodeInfo(this._dvlSceneRef,this._dvlNodeRef,sap.ve.dvl.DVLNODEINFO.DVLNODEINFO_FLAGS)).Flags&(sap.ve.dvl.DVLNODEFLAG.DVLNODEFLAG_MAPPED_HASCHILDREN|sap.ve.dvl.DVLNODEFLAG.DVLNODEFLAG_CLOSED))===sap.ve.dvl.DVLNODEFLAG.DVLNODEFLAG_MAPPED_HASCHILDREN};d.prototype.getSceneRef=function(){return this._dvlNodeRef};return d});
//# sourceMappingURL=BaseNodeProxy.js.map