/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/rta/command/FlexCommand"],function(e){"use strict";var t=e.extend("sap.ui.rta.command.Split",{metadata:{library:"sap.ui.rta",properties:{newElementIds:{type:"string[]"},source:{type:"any"},parentElement:{type:"any"}},associations:{},events:{}}});t.prototype._getChangeSpecificData=function(){var e={newElementIds:this.getNewElementIds(),sourceControlId:this.getSource().getId(),changeType:this.getChangeType(),parentId:this.getParentElement().getId()};return e};return t});
//# sourceMappingURL=Split.js.map