/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/dt/ManagedObjectObserver"],function(e){"use strict";var t=e.extend("sap.ui.dt.ControlObserver",{metadata:{library:"sap.ui.dt",properties:{},associations:{target:{type:"sap.ui.core.Control"}}}});t.prototype.init=function(){e.prototype.init.apply(this,arguments);this._oControlDelegate={onAfterRendering:this._onAfterRendering}};t.prototype.observe=function(t){e.prototype.observe.apply(this,arguments);t.addEventDelegate(this._oControlDelegate,this)};t.prototype.unobserve=function(){var t=this.getTargetInstance();if(t){t.removeDelegate(this._oControlDelegate,this)}e.prototype.unobserve.apply(this,arguments)};t.prototype._onAfterRendering=function(){this.fireModified({type:"afterRendering"})};return t});
//# sourceMappingURL=ControlObserver.js.map