/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/rta/command/FlexCommand"],function(t){"use strict";var e=t.extend("sap.ui.rta.command.Settings",{metadata:{library:"sap.ui.rta",properties:{content:{type:"any",group:"content"}},associations:{},events:{}}});e.prototype.execute=function(){if(this.getElement()){return t.prototype.execute.apply(this,arguments)}return Promise.resolve()};e.prototype.undo=function(){if(this.getElement()){return t.prototype.undo.apply(this,arguments)}return Promise.resolve()};return e});
//# sourceMappingURL=Settings.js.map