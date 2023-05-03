/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/core/EventBus"],function(e){"use strict";var t=e.extend("sap.ui.rta.util.ServiceEventBus");t.prototype._callListener=function(e,t,n,i,r){e.call(t,r)};t.prototype.getChannel=function(e){return this._mChannels[e]};return t});
//# sourceMappingURL=ServiceEventBus.js.map