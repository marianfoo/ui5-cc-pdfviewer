/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/dt/plugin/ControlDragDrop","sap/ui/dt/Util","sap/ui/dt/OverlayRegistry","sap/ui/rta/plugin/RTAElementMover","sap/ui/rta/plugin/Plugin","sap/ui/rta/Utils"],function(t,e,r,a,o,n){"use strict";var i=t.extend("sap.ui.rta.plugin.DragDrop",{metadata:{library:"sap.ui.rta",properties:{commandFactory:{type:"object",multiple:false}},events:{dragStarted:{},elementModified:{command:{type:"sap.ui.rta.command.BaseCommand"}}}}});n.extendWith(i.prototype,o.prototype,function(t,e,r){return r!=="getMetadata"});i.prototype.init=function(){t.prototype.init.apply(this,arguments);this.setElementMover(new a({commandFactory:this.getCommandFactory()}))};i.prototype.setCommandFactory=function(t){this.setProperty("commandFactory",t);this.getElementMover().setCommandFactory(t)};i.prototype._isEditable=function(t,e){return this.getElementMover().isEditable(t,e.onRegistration)};i.prototype.registerElementOverlay=function(){t.prototype.registerElementOverlay.apply(this,arguments);o.prototype.registerElementOverlay.apply(this,arguments)};i.prototype.deregisterElementOverlay=function(){t.prototype.deregisterElementOverlay.apply(this,arguments);o.prototype.removeFromPluginsList.apply(this,arguments)};i.prototype.onDragStart=function(e){this.fireDragStarted();t.prototype.onDragStart.apply(this,arguments);this.getSelectedOverlays().forEach(function(t){t.setSelected(false)});e.$().addClass("sapUiRtaOverlayPlaceholder")};i.prototype.onDragEnd=function(r){this.getElementMover().buildMoveCommand().then(function(e){this.fireElementModified({command:e});r.$().removeClass("sapUiRtaOverlayPlaceholder");r.setSelected(true);r.focus();t.prototype.onDragEnd.apply(this,arguments);this._updateRelevantOverlays()}.bind(this)).catch(function(t){throw e.propagateError(t,"DragDrop#onDragEnd","Error accured during onDragEnd execution","sap.ui.rta.plugin")})};i.prototype.onMovableChange=function(){t.prototype.onMovableChange.apply(this,arguments)};i.prototype._updateRelevantOverlays=function(){var t=this.getElementMover().getSourceAndTargetParentInformation();var e=t.sourceParentInformation.parent;var a=t.targetParentInformation.parent;var o=t.sourceParentInformation.aggregation;var n=t.targetParentInformation.aggregation;var i=e&&e.getAggregation(o);var p=[];if(i&&i.length>0){var l=r.getOverlay(i[0]);p=this._getRelevantOverlays(l,o)}if(a&&(a!==e||a===e&&o!==n)){var s=a&&a.getAggregation(n);if(s&&s.length>1){var g=t.targetParentInformation.index;var y=s[g+1]||s[g-1];var d=r.getOverlay(y);var u=this._getRelevantOverlays(d,n);p=p.concat(u)}}if(p.length>0){p=p.filter(function(t,e,r){return e===r.indexOf(t)});this.evaluateEditable(p,{onRegistration:false})}};return i});
//# sourceMappingURL=DragDrop.js.map