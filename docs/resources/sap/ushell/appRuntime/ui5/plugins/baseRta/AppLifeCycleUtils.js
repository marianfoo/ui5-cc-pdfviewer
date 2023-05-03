/*!
 * Copyright (c) 2009-2022 SAP SE, All Rights Reserved
 */
sap.ui.define(["sap/base/util/ObjectPath"],function(e){"use strict";var t={getAppLifeCycleService:function(){var e=t.getContainer();return e.getServiceAsync("AppLifeCycle").catch(function(e){var t="Error getting AppLifeCycle service from ushell container: "+e;throw new Error(t)})},getContainer:function(){var t=e.get("sap.ushell.Container");if(!t){throw new Error("Illegal state: shell container not available; this component must be executed in a unified shell runtime context.")}return t},getCurrentRunningApplication:function(){return t.getAppLifeCycleService().then(function(e){return e.getCurrentApplication()})}};return t});
//# sourceMappingURL=AppLifeCycleUtils.js.map