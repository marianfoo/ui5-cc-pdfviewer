/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/dt/enablement/report/QUnitReport","sap/ui/dt/enablement/ElementEnablementTest"],function(e,n){"use strict";var t=function(t){var r=new n(t);return r.run().then(function(n){var t=new e({data:n});r.destroy();t.destroy()})};return t});
//# sourceMappingURL=elementDesigntimeTest.js.map