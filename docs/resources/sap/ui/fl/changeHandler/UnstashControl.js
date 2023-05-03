/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/fl/changeHandler/condenser/Classification"],function(e){"use strict";var n={};n.applyChange=function(e,n,t){var r=e.getContent();var a=t.modifier;var i=false;var o;return Promise.resolve().then(a.getStashed.bind(a,n)).then(function(s){e.setRevertData({originalValue:s});o=a.setStashed(n,i,t.appComponent)||n;if(r.parentAggregationName){var g=r.parentAggregationName;var u=a.getParent(o);return Promise.resolve().then(a.removeAggregation.bind(a,u,g,o)).then(a.insertAggregation.bind(a,u,g,o,r.index,t.view))}return undefined}).then(function(){return o})};n.revertChange=function(e,n,t){var r=e.getRevertData();t.modifier.setStashed(n,r.originalValue);e.resetRevertData()};n.completeChangeContent=function(e,n){if(n.content){e.setContent(n.content)}};n.getCondenserInfo=function(n){return{affectedControl:n.getSelector(),classification:e.Reverse,uniqueKey:"stashed"}};return n});
//# sourceMappingURL=UnstashControl.js.map