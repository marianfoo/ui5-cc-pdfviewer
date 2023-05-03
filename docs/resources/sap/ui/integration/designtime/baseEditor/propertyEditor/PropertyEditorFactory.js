/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/base/util/includes","sap/base/util/values"],function(e,t){"use strict";var n={};var r={};var i={};n.registerTypes=function(e){Object.keys(e).forEach(function(t){if(!r[t]){r[t]=new Promise(function(n,r){sap.ui.require([e[t]],n,r)}).then(function(e){i[e.getMetadata().getName()]=e;return e})}});return Promise.all(t(r)).then(function(){return i})};n.deregisterType=function(e){if(r[e]){delete r[e]}};n.deregisterAllTypes=function(){r={}};n.create=function(e){return new Promise(function(t,n){if(!e){n("No editor type was specified in the property configuration.");return}if(!r[e]){n("Editor type was not registered");return}r[e].then(function(e){return t(new e)}).catch(function(e){return n(e)})})};n.getByClassName=function(e){return i[e]};n.getTypes=function(){return Object.assign({},r)};n.hasType=function(t){return e(Object.keys(n.getTypes()),t)};return n});
//# sourceMappingURL=PropertyEditorFactory.js.map