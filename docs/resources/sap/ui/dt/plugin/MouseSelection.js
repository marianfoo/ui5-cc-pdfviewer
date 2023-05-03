/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/dt/Plugin"],function(t){"use strict";var e=t.extend("sap.ui.dt.plugin.MouseSelection",{metadata:{library:"sap.ui.dt",properties:{},associations:{},events:{}}});e.prototype.init=function(){t.prototype.init.apply(this,arguments)};e.prototype.registerElementOverlay=function(t){t.setSelectable(true);t.attachBrowserEvent("click",this._onClick,t)};e.prototype.deregisterElementOverlay=function(t){t.detachBrowserEvent("click",this._onClick,t)};e.prototype._onClick=function(t){this.setSelected(!this.getSelected());t.preventDefault();t.stopPropagation()};return e});
//# sourceMappingURL=MouseSelection.js.map