/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/m/OverflowToolbarButton","sap/m/ButtonRenderer","sap/m/Button"],function(t,e,o){"use strict";var r=t.extend("sap.ui.rta.toolbar.OverflowToolbarButton",{metadata:{library:"sap.ui.rta",interfaces:["sap.m.IOverflowToolbarContent"],properties:{visibleIcon:{type:"string",defaultValue:""}}},renderer:e});r.prototype._onBeforeEnterOverflow=function(){t.prototype._onBeforeEnterOverflow.apply(this,arguments);this.setVisibleIcon(this.getIcon());this.setIcon("")};r.prototype._onAfterExitOverflow=function(){t.prototype._onAfterExitOverflow.apply(this,arguments);this.setIcon(this.getVisibleIcon())};r.prototype._getText=function(){if(this.getIcon()===""&&this.getVisibleIcon()===""||this._bInOverflow){return o.prototype._getText.call(this)}return""};r.prototype.getOverflowToolbarConfig=function(){return{canOverflow:true,onBeforeEnterOverflow:this._onBeforeEnterOverflow.bind(this),onAfterExitOverflow:this._onAfterExitOverflow.bind(this)}};return r});
//# sourceMappingURL=OverflowToolbarButton.js.map