/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/integration/widgets/Card","sap/ui/integration/util/ManifestResolver"],function(t,e){"use strict";var r=t.extend("sap.ui.integration.util.SkeletonCard",{metadata:{library:"sap.ui.integration"}});r.prototype.resolveManifest=function(){return e.resolveCard(this)};r.prototype.isSkeleton=function(){return true};r.prototype._createCard=function(t){return new r(t)};return r});
//# sourceMappingURL=SkeletonCard.js.map