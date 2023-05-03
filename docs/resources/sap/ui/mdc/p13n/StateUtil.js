/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/mdc/p13n/Engine"],function(e){"use strict";var t={applyExternalState:function(t,n){var a=e.getInstance().internalizeKeys(t,n);return e.getInstance().applyState(t,a,false)},retrieveExternalState:function(t){return e.getInstance().retrieveState(t).then(function(n){return e.getInstance().externalizeKeys(t,n)})},diffState:function(t,n,a){return e.getInstance().diffState(t,e.getInstance().internalizeKeys(t,n),e.getInstance().internalizeKeys(t,a)).then(function(n){return e.getInstance().externalizeKeys(t,n)})},attachStateChange:function(t){e.getInstance().stateHandlerRegistry.attachChange(t)},detachStateChange:function(t){e.getInstance().stateHandlerRegistry.detachChange(t)}};return t});
//# sourceMappingURL=StateUtil.js.map