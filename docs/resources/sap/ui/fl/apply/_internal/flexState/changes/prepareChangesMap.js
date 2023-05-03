/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/fl/Change"],function(n){"use strict";return function(e){var a=e.storageResponse.changes.changes;var r=a.map(function(e){return new n(e)});return{changes:r}}});
//# sourceMappingURL=prepareChangesMap.js.map