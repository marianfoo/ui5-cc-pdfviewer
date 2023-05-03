/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5) (c) Copyright 2009-2012 SAP AG. All rights reserved
 */
sap.ui.define(["sap/ui/core/Element","./library"],function(e,t){"use strict";var n=e.extend("sap.ui.vbm.Feature",{metadata:{library:"sap.ui.vbm",properties:{color:{type:"sap.ui.core.CSSColor",group:"Appearance",defaultValue:null},featureId:{type:"string",group:"Misc",defaultValue:null}},events:{click:{},contextMenu:{parameters:{menu:{type:"sap.ui.unified.Menu"}}}}}});n.prototype.openDetailWindow=function(e,t,n){this.oParent.openDetailWindow(this,{caption:e,offsetX:t,offsetY:n})};n.prototype.openContextMenu=function(e){this.oParent.openContextMenu(this,e)};n.prototype.handleChangedData=function(e){};return n});
//# sourceMappingURL=Feature.js.map