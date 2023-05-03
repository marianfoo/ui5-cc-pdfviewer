/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/mdc/BaseDelegate","sap/ui/core/library"],function(e,r){"use strict";var n=Object.assign(e,{fetchProperties:function(e){return Promise.resolve([])},addItem:function(e,r,n){return Promise.resolve()},removeItem:function(e,r,n){return Promise.resolve(true)},validateState:function(e,n){var t=r.MessageType.None;return{validation:t,message:undefined}},onAfterXMLChangeProcessing:function(e,r){}});return n});
//# sourceMappingURL=AggregationBaseDelegate.js.map