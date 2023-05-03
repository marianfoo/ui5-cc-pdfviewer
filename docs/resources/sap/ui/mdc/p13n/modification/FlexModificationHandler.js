/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["./ModificationHandler","sap/ui/mdc/p13n/FlexUtil","sap/ui/fl/apply/api/FlexRuntimeInfoAPI","sap/ui/mdc/enum/PersistenceMode"],function(e,t,n,a){"use strict";var r;var i=e.extend("sap.ui.mdc.p13n.modification.FlexModificationHandler");i.prototype.processChanges=function(e,n){var r=e&&e[0]?e[0].selectorElement:undefined;var i=n.mode;var o=i===a.Auto;if(o){i=n.hasVM?"Standard":a.Global}var s=i===a.Global;var l=i===a.Transient;var p=t.handleChanges.call(this,e,s,l);return s?p.then(function(e){return t.saveChanges.call(this,r,e)}):p};i.prototype.waitForChanges=function(e,t){return n.waitForChanges.apply(this,arguments)};i.prototype.reset=function(e,n){var r=n.mode;var i=r===a.Global;var o=!n.hasVM&&n.hasPP&&r===a.Auto;return i||o?t.reset.call(this,e):t.restore.call(this,e)};i.prototype.isModificationSupported=function(e,t){return n.isFlexSupported.apply(this,arguments)};i.getInstance=function(){if(!r){r=new i}return r};return i});
//# sourceMappingURL=FlexModificationHandler.js.map