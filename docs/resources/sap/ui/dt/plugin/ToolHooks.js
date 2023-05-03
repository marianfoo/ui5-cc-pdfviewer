/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/dt/Plugin"],function(e){"use strict";var t=e.extend("sap.ui.dt.plugin.ToolHooks",{metadata:{library:"sap.ui.dt",properties:{},associations:{},events:{}}});t.prototype.registerElementOverlay=function(e){e.getDesignTimeMetadata().getToolHooks().start(e.getElement())};t.prototype.deregisterElementOverlay=function(e){e.getDesignTimeMetadata().getToolHooks().stop(e.getElement())};return t});
//# sourceMappingURL=ToolHooks.js.map