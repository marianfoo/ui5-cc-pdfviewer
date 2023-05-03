/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/rta/command/FlexCommand"],function(e){"use strict";var t=e.extend("sap.ui.rta.command.Combine",{metadata:{library:"sap.ui.rta",properties:{newElementId:{type:"string"},source:{type:"any"},combineElements:{type:"any[]"}},associations:{},events:{}}});t.prototype._getChangeSpecificData=function(){var e=[];this.getCombineElements().forEach(function(t){e.push(t.getId())});var t={newElementId:this.getNewElementId(),changeType:this.getChangeType(),sourceControlId:this.getSource().getId(),combineElementIds:e};return t};return t});
//# sourceMappingURL=Combine.js.map