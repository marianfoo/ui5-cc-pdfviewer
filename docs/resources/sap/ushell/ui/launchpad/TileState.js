// Copyright (c) 2009-2022 SAP SE, All Rights Reserved
sap.ui.define(["sap/ui/core/Control","sap/ui/core/Icon","sap/ushell/resources","sap/ui/core/HTML","sap/ushell/library","./TileStateRenderer"],function(t,e,i,s){"use strict";var n=t.extend("sap.ushell.ui.launchpad.TileState",{metadata:{library:"sap.ushell",properties:{state:{type:"string",group:"Misc",defaultValue:"Loaded"}},events:{press:{}}}});n.prototype.init=function(){this._rb=i.i18n;this._sFailedToLoad=this._rb.getText("cannotLoadTile");this._oWarningIcon=new e(this.getId()+"-warn-icon",{src:"sap-icon://notification",size:"1.37rem"}).addStyleClass("sapSuiteGTFtrFldIcnMrk");this.attachPress(this._onPress)};n.prototype.onclick=function(){this.firePress()};n.prototype._onPress=function(t){if(this.getState()!=="Failed"){return}if(!this.FailedTileDialog){sap.ui.require(["sap/ushell/ui/launchpad/FailedTileDialog"],function(e){this.FailedTileDialog=new e;this._onPress(t)}.bind(this))}else{this.FailedTileDialog.openFor(this)}};n.prototype._getBusyContainer=function(){if(!this._oBusyContainer){this._oBusyContainer=new s({content:"<div class='sapUshellTileStateLoading'><div>"});this._oBusyContainer.setBusyIndicatorDelay(0);this._oBusyContainer.setBusy(true)}return this._oBusyContainer};n.prototype.exit=function(){this._oWarningIcon.destroy();if(this._oBusyContainer){this._oBusyContainer.destroy()}};n.prototype.setState=function(t,e){this.setProperty("state",t,e);return this};return n});
//# sourceMappingURL=TileState.js.map