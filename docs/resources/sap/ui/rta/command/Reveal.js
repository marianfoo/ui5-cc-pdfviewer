/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/rta/command/FlexCommand"],function(e){"use strict";var t=e.extend("sap.ui.rta.command.Reveal",{metadata:{library:"sap.ui.rta",properties:{revealedElementId:{type:"string"},directParent:"object"}}});t.prototype._getChangeSpecificData=function(){var e={changeType:this.getChangeType()};if(this.getRevealedElementId()){e.revealedElementId=this.getRevealedElementId()}return e};return t});
//# sourceMappingURL=Reveal.js.map