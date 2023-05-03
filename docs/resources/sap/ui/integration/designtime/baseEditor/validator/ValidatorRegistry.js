/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/base/util/includes","sap/base/util/values","sap/base/util/restricted/_CancelablePromise"],function(e,t,i){"use strict";var r={};var n={};var a={};r.registerValidators=function(e){Object.keys(e).forEach(function(t){if(!this.hasValidator(t)){a[t]=new i(function(i,r,n){n(function(){delete a[t]});n.shouldReject=false;sap.ui.require([e[t]],i,r)});a[t].then(function(e){n[t]=e;delete a[t]})}}.bind(this))};r.ready=function(){return Promise.all(t(a))};r.deregisterValidator=function(e){if(n[e]){delete n[e]}if(a[e]){a[e].cancel()}};r.deregisterAllValidators=function(){Object.keys(a).forEach(function(e){this.deregisterValidator(e)}.bind(this));n={}};r.getValidator=function(e){var t=n[e];if(!t){throw new Error("Validator "+e+" was not registered.")}return t};r.hasValidator=function(t){return e(Object.keys(n),t)};r.isRegistered=function(t){return e(Object.keys(a),t)};return r});
//# sourceMappingURL=ValidatorRegistry.js.map