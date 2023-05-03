/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/fl/FlexControllerFactory","sap/ui/fl/Utils"],function(t,e){"use strict";var r={getFlexControllerInstance:function(e){if(typeof e==="string"){return t.create(e)}var r=e.appComponent||e;return t.createForControl(r)},getDescriptorFlexControllerInstance:function(r){if(typeof r.appId==="string"){return t.create(r.appId)}var n=r.appComponent||r;var o=e.getAppDescriptorComponentObjectForControl(n);return t.create(o.name)},getAppComponentForSelector:function(t){if(typeof t.appId==="string"){return t}return t.appComponent||e.getAppComponentForControl(t)}};return r});
//# sourceMappingURL=ChangesController.js.map