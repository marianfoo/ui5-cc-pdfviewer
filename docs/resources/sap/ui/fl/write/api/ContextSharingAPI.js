/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/fl/variants/context/Component","sap/ui/core/ComponentContainer","sap/ui/fl/Layer","sap/ui/fl/registry/Settings"],function(n,e,t,r){"use strict";var o;var i={createComponent:function(i){if(i.layer!==t.CUSTOMER){return Promise.resolve()}return r.getInstance().then(function(n){return i.isComp?n.isContextSharingEnabledForComp():n.isContextSharingEnabled()}).then(function(t){if(t){if(!o||o.bIsDestroyed){var r=new n("contextSharing");r.setSelectedContexts({role:[]});o=new e("contextSharingContainer",{component:r})}return o}})}};return i});
//# sourceMappingURL=ContextSharingAPI.js.map