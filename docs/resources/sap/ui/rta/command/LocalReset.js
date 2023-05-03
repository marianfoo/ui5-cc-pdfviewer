/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/rta/command/BaseCommand","sap/ui/fl/Utils","sap/ui/fl/write/api/LocalResetAPI"],function(e,t,n){"use strict";var r=e.extend("sap.ui.rta.command.LocalReset",{metadata:{library:"sap.ui.rta",properties:{currentVariant:{type:"string"},changeType:{type:"string"},jsOnly:{type:"boolean"}},associations:{},events:{}}});r.prototype.prepare=function(e){var r=this.getElement();this._oAppComponent=t.getAppComponentForControl(r);this._aAffectedChanges=n.getNestedUIChangesForControl(r,{layer:e.layer,currentVariant:this.getCurrentVariant()});return Promise.resolve(true)};r.prototype.execute=function(){return n.resetChanges(this._aAffectedChanges,this._oAppComponent)};r.prototype.undo=function(){return n.restoreChanges(this._aAffectedChanges,this._oAppComponent)};return r});
//# sourceMappingURL=LocalReset.js.map