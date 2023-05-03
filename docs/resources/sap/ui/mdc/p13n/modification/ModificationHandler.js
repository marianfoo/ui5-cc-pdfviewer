/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/base/Object","sap/base/util/merge","sap/ui/core/util/reflection/JsControlTreeModifier"],function(e,r,t){"use strict";var o;var i=e.extend("sap.ui.mdc.p13n.modification.ModificationHandler");i.prototype.processChanges=function(e,r){return Promise.resolve()};i.prototype.waitForChanges=function(e,r){return Promise.resolve()};i.prototype.reset=function(e,r){return Promise.resolve()};i.prototype.isModificationSupported=function(e,r){return false};i.getInstance=function(){if(!o){o=new i}return o};return i});
//# sourceMappingURL=ModificationHandler.js.map