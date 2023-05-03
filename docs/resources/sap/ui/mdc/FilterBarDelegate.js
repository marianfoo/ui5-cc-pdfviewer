/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/mdc/AggregationBaseDelegate"],function(e){"use strict";var r=Object.assign({},e);r.addItem=function(r,t,n){return e.addItem(r,t,n)};r.removeItem=function(r,t,n){return e.removeItem(r,t,n)};r.addCondition=function(e,r,t){return Promise.resolve()};r.removeCondition=function(e,r,t){return Promise.resolve()};r.fetchProperties=function(r){return e.fetchProperties(r)};r.clearFilters=function(e){return Promise.resolve()};return r});
//# sourceMappingURL=FilterBarDelegate.js.map