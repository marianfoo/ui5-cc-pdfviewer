/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/base/Log","sap/ui/core/Element","sap/ui/core/util/reflection/JsControlTreeModifier","sap/ui/fl/apply/_internal/changes/FlexCustomData","sap/ui/fl/apply/_internal/changes/Utils","sap/ui/fl/apply/_internal/flexState/changes/DependencyHandler","sap/ui/fl/Utils"],function(e,n,r,t,a,o,i){"use strict";var s=new i.FakePromise;function l(e,n){var r=e.getSelector&&e.getSelector();if(!r||!r.id&&!r.name){return Promise.reject(Error("No selector in change found or no selector ID."))}function t(e){if(i.indexOfObject(n.failedSelectors,e)>-1){throw Error("A change depending on that control already failed, so the current change is skipped")}}return n.modifier.bySelectorTypeIndependent(r,n.appComponent,n.view).then(function(a){if(!a){throw Error("A flexibility change tries to change a nonexistent control.")}t(r);var o=e.getDependentControlSelectorList();o.forEach(function(e){var r=n.modifier.bySelector(e,n.appComponent,n.view);if(!r){throw new Error("A dependent selector control of the flexibility change is not available.")}t(e)});return a})}function c(e,n,r,o,i){var s=a.getControlIfTemplateAffected(n,e,i);var l=i.modifier;var c=!!t.sync.getAppliedCustomDataValue(s.control,n);var u=c||t.sync.hasChangeApplyFinishedCustomData(s.control,n);var f=n.isApplyProcessFinished();if(f&&!u){var d=a.checkIfDependencyIsStillValidSync.bind(null,i.appComponent,l,r);o._oChangePersistence.copyDependenciesFromInitialChangesMapSync(n,d,i.appComponent);n.setInitialApplyState()}else if(!f&&u){if(c){n.setRevertData(t.sync.getParsedRevertDataFromCustomData(s.control,n));n.markSuccessful()}else{n.markFailed()}}}function u(e){return e.modifier.targets==="xmlTree"}function f(e,n,r,o,s){var l=u(s);var c=a.getControlIfTemplateAffected(n,e,s);var f=s.modifier;return t.getAppliedCustomDataValue(c.control,n,f).then(function(e){var r=!!e;return Promise.all([r,r||t.hasChangeApplyFinishedCustomData(c.control,n,f)])}).then(function(c){var u=c[0];var f=c[1];var d=n.isApplyProcessFinished();var p=s.modifier;var g=s.appComponent;if(d&&!f){var h=new i.FakePromise;if(!l){var m=a.checkIfDependencyIsStillValid.bind(null,g,p,r);h=h.then(function(){return o._oChangePersistence.copyDependenciesFromInitialChangesMap(n,m,g)})}return h.then(n.setInitialApplyState.bind(n))}else if(!d&&f){if(u){return t.getParsedRevertDataFromCustomData(e,n,p).then(function(e){n.setRevertData(e);n.markSuccessful()})}n.markFailed();return undefined}else if(d&&f){n.markSuccessful()}return undefined})}function d(e,n){var r;if(u(n)&&e.getJsOnly()){r="Change cannot be applied in XML. Retrying in JS."}if(r){e.setInitialApplyState();throw Error(r)}}function p(e,r,a,o){return Promise.resolve().then(function(){if(a instanceof n){r.control=a}if(r.control){return o.modifier.updateAggregation(r.originalControl,e.getContent().boundAggregation)}return undefined}).then(function(){return t.addAppliedCustomData(r.control,e,o,u(o))}).then(function(){var n={success:true};e.markSuccessful(n);return n})}function g(e,n,r,a){var o=u(a);var s={success:false,error:e};var l=n.getId();var c="Change ''{0}'' could not be applied.";var f=e instanceof Error;var d=t.getCustomDataIdentifier(false,f,o);switch(d){case t.notApplicableChangesCustomDataKey:i.formatAndLogMessage("info",[c,e.message],[l]);break;case t.failedChangesCustomDataKeyXml:i.formatAndLogMessage("warning",[c,"Merge error detected while processing the XML tree."],[l],e.stack);break;case t.failedChangesCustomDataKeyJs:i.formatAndLogMessage("error",[c,"Merge error detected while processing the JS control tree."],[l],e.stack);break}return t.addFailedCustomData(r.control,n,a,d).then(function(){if(o){n.setInitialApplyState()}else{n.markFailed(s)}return s})}function h(n,r){var t=r.getChangeType();var a=r.getSelector().id;var o=r.getNamespace()+r.getId()+"."+r.getFileType();var i="A flexibility change could not be applied.";i+="\nThe displayed UI might not be displayed as intedend.";if(n.message){i+="\n   occurred error message: '"+n.message+"'"}i+="\n   type of change: '"+t+"'";i+="\n   LRep location of the change: "+o;i+="\n   id of targeted control: '"+a+"'.";e.warning(i,undefined,"sap.ui.fl.apply._internal.changes.Applier")}function m(e,n,t){var a={appComponent:t,modifier:r};var o=r.bySelector(e.originalSelectorToBeAdjusted,t);var i=n.getBindingInfo(e.getContent().boundAggregation).template;if(o.getParent()){var s=[];var l=o;do{s.push({aggregation:l.sParentAggregationName,index:l.getParent().getAggregation(l.sParentAggregationName).indexOf(l)});l=l.getParent()}while(l.getParent());s.reverse();s.forEach(function(e){i=i.getAggregation(e.aggregation)[e.index]})}e.addDependentControl(i,"originalSelector",a)}function v(e,n,r){var t=e.findIndex(function(e){return e.handler===n});if(t<0){t=e.length;e.push({handler:n,controls:[]})}if(!e[t].controls.includes(r)){e[t].controls.push(r)}}var C={addPreConditionForInitialChangeApplying:function(e){s=s.then(function(){return e})},applyChangeOnControl:function(e,n,r){var t=a.getControlIfTemplateAffected(e,n,r);var o=r.changeHandler?Promise.resolve(r.changeHandler):a.getChangeHandler(e,t,r);return o.then(function(n){d(e,r);return n}).then(function(n){if(e.hasApplyProcessStarted()){return e.addPromiseForApplyProcessing().then(function(n){e.markSuccessful();return n})}else if(!e.isApplyProcessFinished()){return(new i.FakePromise).then(function(){e.startApplying();return n.applyChange(e,t.control,r)}).then(function(n){return p(e,t,n,r)}).catch(function(n){return g(n,e,t,r)})}var a={success:true};e.markSuccessful(a);return a}).catch(function(e){return{success:false,error:e}})},applyAllChangesForControl:function(e,n,t,a){var l=e();var u=a.getId();var f=l.mChanges[u]||[];var d={modifier:r,appComponent:n,view:i.getViewForControl(a)};f.forEach(function(e){c(a,e,l,t,d);if(!e.isApplyProcessFinished()&&!e._ignoreOnce){e.setQueuedForApply()}});s=s.then(function(e,r){var t=[];var a=e.getId();var s=l.mChanges[a]||[];var c;if(l.mControlsWithDependencies[a]){o.removeControlsDependencies(l,a);c=true}s.forEach(function(i){if(i.originalSelectorToBeAdjusted){m(i,e,n);delete i.originalSelectorToBeAdjusted}if(i._ignoreOnce){delete i._ignoreOnce}else if(i.isApplyProcessFinished()){o.resolveDependenciesForChange(l,i.getId(),a)}else if(!l.mDependencies[i.getId()]){t.push(function(){return C.applyChangeOnControl(i,e,r).then(function(){o.resolveDependenciesForChange(l,i.getId(),a)})})}else{var s=C.applyChangeOnControl.bind(C,i,e,r);o.addChangeApplyCallbackToDependency(l,i.getId(),s)}});if(s.length||c){return i.execPromiseQueueSequentially(t).then(function(){return o.processDependentQueue(l,n,a)})}return undefined}.bind(null,a,d));return s},applyAllChangesForXMLView:function(n,r){if(!Array.isArray(r)){var t="No list of changes was passed for processing the flexibility on view: "+n.view+".";e.error(t,undefined,"sap.ui.fl.apply._internal.changes.Applier");r=[]}var o=[];n.failedSelectors=[];return r.reduce(function(e,r){var t;return e.then(l.bind(null,r,n)).then(function(e){t=e;var o=a.getControlIfTemplateAffected(r,t,n);return a.getChangeHandler(r,o,n)}).then(function(e){n.changeHandler=e;r.setQueuedForApply();return f(t,r,undefined,undefined,n)}).then(function(){if(!r.isApplyProcessFinished()){if(typeof n.changeHandler.onAfterXMLChangeProcessing==="function"){v(o,n.changeHandler,t)}return C.applyChangeOnControl(r,t,n)}return{success:true}}).then(function(e){if(!e.success){throw Error(e.error)}}).catch(function(e){r.getDependentSelectorList().forEach(function(e){if(i.indexOfObject(n.failedSelectors,e)===-1){n.failedSelectors.push(e)}});h(e,r)})},new i.FakePromise).then(function(){delete n.failedSelectors;o.forEach(function(r){r.controls.forEach(function(t){try{r.handler.onAfterXMLChangeProcessing(t,n)}catch(n){e.error("Error during onAfterXMLChangeProcessing",n)}})});return n.view})}};return C});
//# sourceMappingURL=Applier.js.map