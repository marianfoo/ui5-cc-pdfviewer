/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["./BaseController","sap/ui/mdc/p13n/P13nBuilder","sap/base/util/merge"],function(t,e,r){"use strict";var a=t.extend("sap.ui.mdc.p13n.subcontroller.AggregateController");a.prototype.getStateKey=function(){return"aggregations"};a.prototype.sanityCheck=function(t){var e=[];Object.keys(t).forEach(function(r){var a={name:r};if(t[r].hasOwnProperty("aggregated")){a["aggregated"]=t[r].aggregated}e.push(a)});return e};a.prototype.getDelta=function(e){e.existingState=this.sanityCheck(e.existingState);return t.prototype.getDelta.apply(this,arguments)};a.prototype.getAdaptationUI=function(t){return null};a.prototype.getChangeOperations=function(){return{add:"addAggregate",remove:"removeAggregate"}};a.prototype._getPresenceAttribute=function(){return"aggregated"};a.prototype.mixInfoAndState=function(t){var r=this.getCurrentState();var a=e.prepareAdaptationData(t,function(t,e){var a=r[e.name];t.aggregated=!!a;return e.aggregatable});return a};return a});
//# sourceMappingURL=AggregateController.js.map