/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/base/ManagedObject"],function(e){"use strict";var t=e.extend("sap.ui.rta.command.BaseCommand",{metadata:{library:"sap.ui.rta",properties:{name:{type:"string"},runtimeOnly:{type:"boolean"}},associations:{element:{type:"sap.ui.core.Element"}},events:{}}});t.prototype.getElement=function(){var e=this.getAssociation("element");return sap.ui.getCore().byId(e)};t.prototype.prepare=function(){return true};t.prototype.execute=function(){return Promise.resolve()};t.prototype.getVariantChange=function(){return this._oVariantChange};t.prototype.undo=function(){return Promise.resolve()};t.prototype.isEnabled=function(){return true};return t});
//# sourceMappingURL=BaseCommand.js.map