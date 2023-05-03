/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/base/Log","sap/ui/fl/changeHandler/condenser/Classification","sap/ui/fl/changeHandler/JsControlTreeModifier"],function(e,t,n){"use strict";var r="visible";var i={};i.applyChange=function(e,t,n){var r=n.modifier;return Promise.resolve().then(r.getVisible.bind(r,t)).then(function(n){e.setRevertData({originalValue:n});r.setVisible(t,false)})};i.revertChange=function(t,n,r){var i=t.getRevertData();return Promise.resolve().then(function(){if(i){r.modifier.setVisible(n,i.originalValue);t.resetRevertData()}else{e.error("Attempt to revert an unapplied change.")}})};i.completeChangeContent=function(){};i.getCondenserInfo=function(e){return{affectedControl:e.getSelector(),classification:t.Reverse,uniqueKey:r}};i.getChangeVisualizationInfo=function(e,t){var r=e.getSelector();var i=n.bySelector(r,t);return{affectedControls:[r],displayControls:[i.getParent().getId()]}};return i},true);
//# sourceMappingURL=HideControl.js.map