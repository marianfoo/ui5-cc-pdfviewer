/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/base/util/uid","sap/ui/fl/apply/_internal/flexState/ManifestUtils","sap/ui/fl/Utils","sap/ui/fl/write/_internal/Storage","sap/ui/fl/write/_internal/Versions"],function(e,r,t,a,n){"use strict";var i={};function l(e){var a=r.getFlexReferenceForControl(e);if(!a){throw Error("The application ID could not be determined")}return t.normalizeReference(a)}i.create=function(r){r.parameters.id=e();r.parameters.reference=l(r.control);return a.contextBasedAdaptation.create({layer:r.layer,flexObject:r.parameters,reference:r.reference,parentVersion:n.getVersionsModel({layer:r.layer,reference:r.parameters.reference}).getProperty("/displayedVersion")})};return i});
//# sourceMappingURL=ContextBasedAdaptationsAPI.js.map