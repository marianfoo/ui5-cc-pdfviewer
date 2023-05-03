/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/fl/Utils"],function(e){"use strict";return function(t,r,n){var a=n.modifier;var i=t.getContent();var o=i.targetAggregation;var u=n.view||e.getViewForControl(r);var v=n.appComponent;var c=t.getRevertData()||[];var f=c.map(function(e){var t;if(typeof e==="string"){t=e}else{t=e.id;o=o||e.aggregationName}return a.bySelector(t,v,u)||u&&u.createId&&a.bySelector(u.createId(t))});var g=[];f.forEach(function(e){var t=function(){return Promise.resolve().then(a.removeAggregation.bind(a,r,o,e)).then(function(){if(e.destroy){e.destroy()}})};g.push(t)});return e.execPromiseQueueSequentially(g,true,true).then(function(){t.resetRevertData();return true})}});
//# sourceMappingURL=revertAddedControls.js.map