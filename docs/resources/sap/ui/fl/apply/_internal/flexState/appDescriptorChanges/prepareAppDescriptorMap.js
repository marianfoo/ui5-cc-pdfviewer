/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/fl/Change"],function(e){"use strict";return function(n){var r=n.storageResponse.changes.appDescriptorChanges||[];var a=r.map(function(n){return new e(n)});return{appDescriptorChanges:a}}});
//# sourceMappingURL=prepareAppDescriptorMap.js.map