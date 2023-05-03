/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/rta/command/BaseCommand"],function(t){"use strict";var e=t.extend("sap.ui.rta.command.compVariant.CompVariantSwitch",{metadata:{library:"sap.ui.rta",properties:{sourceVariantId:{type:"string"},targetVariantId:{type:"string"}}}});e.prototype.execute=function(){this.getElement().activateVariant(this.getTargetVariantId());return Promise.resolve()};e.prototype.undo=function(){this.getElement().activateVariant(this.getSourceVariantId());return Promise.resolve()};return e});
//# sourceMappingURL=CompVariantSwitch.js.map