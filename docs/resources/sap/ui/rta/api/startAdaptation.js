/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/rta/util/adaptationStarter","sap/ui/fl/Layer","sap/ui/fl/LayerUtils","sap/base/util/merge"],function(e,i,t,r){"use strict";function a(e){if(!t.isValidLayer(e)){throw new Error("An invalid layer is passed")}}function s(t,s,n,l,u){var f={flexSettings:{developerMode:false,layer:i.CUSTOMER}};t=r(f,t);return Promise.resolve().then(a.bind(this,t.flexSettings.layer)).then(e.bind(this,t,s,n,l,u))}return s});
//# sourceMappingURL=startAdaptation.js.map