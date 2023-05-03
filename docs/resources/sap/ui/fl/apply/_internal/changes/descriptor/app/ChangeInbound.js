/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/fl/util/changePropertyValueByPath","sap/ui/fl/util/DescriptorChangeCheck"],function(n,t){"use strict";var e=["UPDATE","UPSERT"];var i=["title","subTitle","icon"];var o={applyChange:function(o,a){var r=o["sap.app"].crossNavigation;var s=a.getContent();t.checkEntityPropertyChange(s,i,e);if(r&&r.inbounds){var u=r.inbounds[s.inboundId];if(u){n(s.entityPropertyChange,u)}else{throw new Error('Nothing to update. Inbound with ID "'+s.inboundId+'" does not exist.')}}else{throw new Error("sap.app/crossNavigation or sap.app/crossNavigation/inbounds sections have not been found in manifest.json")}return o}};return o});
//# sourceMappingURL=ChangeInbound.js.map