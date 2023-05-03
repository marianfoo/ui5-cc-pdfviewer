/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/core/UIComponent"],function(e){"use strict";var t;var i;var r;return e.extend("sap.ui.rta.appVariant.manageApps.webapp.Component",{metadata:{manifest:"json",library:"sap.ui.rta",version:"0.9",properties:{idRunningApp:"string",isOverviewForKeyUser:{type:"boolean"},layer:"string"}},constructor:function(){t=arguments[1].idRunningApp;i=arguments[1].isOverviewForKeyUser;r=arguments[1].layer;e.prototype.constructor.apply(this,arguments)},init:function(){this.setIdRunningApp(t);this.setIsOverviewForKeyUser(i);this.setLayer(r);e.prototype.init.apply(this,arguments)}})});
//# sourceMappingURL=Component.js.map