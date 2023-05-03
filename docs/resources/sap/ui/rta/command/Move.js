/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/rta/command/FlexCommand"],function(e){"use strict";var t=e.extend("sap.ui.rta.command.Move",{metadata:{library:"sap.ui.rta",properties:{movedElements:{type:"any[]"},target:{type:"any"},source:{type:"any"}},associations:{},events:{}}});t.prototype._getChangeSpecificData=function(){var e=this.getSource();var t=this.getTarget();if(e.parent){e.id=e.parent.getId();delete e.parent}if(t.parent){t.id=t.parent.getId();delete t.parent}var a={changeType:this.getChangeType(),source:e,target:t,movedElements:[]};this.getMovedElements().forEach(function(e){a.movedElements.push({id:e.id||e.element&&e.element.getId(),sourceIndex:e.sourceIndex,targetIndex:e.targetIndex})});return a};return t});
//# sourceMappingURL=Move.js.map