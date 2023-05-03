/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/base/ManagedObject"],function(e){"use strict";var t=e.extend("sap.ui.dt.enablement.report.QUnitReport",{metadata:{library:"sap.ui.dt",properties:{data:{type:"object"}}},init:function(){if(!QUnit){throw new Error("QUnit is required for this report.")}},setData:function(e){if(e){var t=e.children;t.forEach(function(e){this._createModule(e)},this)}this.setProperty("data",e)},_createModule:function(e){QUnit.module(e.message);e.children.forEach(function(e){this._createTest(e)},this)},_createTest:function(e){QUnit.test(e.name+": "+e.message,function(t){e.children.forEach(function(e){this._createAssertion(t,e)},this)}.bind(this))},_createAssertion:function(e,t){if(t.children.length>0){t.children.forEach(function(i){e.ok(i.result,t.name+": "+i.message)})}else{e.ok(true,t.name+": "+t.message)}}});return t});
//# sourceMappingURL=QUnitReport.js.map