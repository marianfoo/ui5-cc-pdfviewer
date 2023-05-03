/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/fl/Utils","sap/ui/dt/ElementUtil","sap/base/util/isPlainObject"],function(e,t,a){"use strict";function n(e){var t=e.sParentAggregationName;var a=e.getParent();if(a&&t){var r=a.getBindingInfo(t);if(r){if(r.template&&e instanceof r.template.getMetadata().getClass()){return r.template}return false}return n(a)}return false}return function r(i){if(!i||i._bIsBeingDestroyed){return false}if(typeof i.data("hasStableId")!=="boolean"){var l=i.getDesignTimeMetadata().getStableElements(i);var s=false;if(l.length>0){if(n(i.getElement())){s=l.some(function(n){var r;var i;var l=false;if(a(n)){r=n.id;i=n.appComponent}else{r=n}l=!e.checkControlId(r,i);if(l){var s=t.getElementInstance(r);if(t.getElementInstance(r)){var o=t.getAggregationInformation(s);l=!e.checkControlId(t.extractTemplateId(o),i)}}return l})}else{s=l.some(function(t){var a=t.id||t;return!e.checkControlId(a,t.appComponent)})}}i.data("hasStableId",!s)}return i.data("hasStableId")}});
//# sourceMappingURL=hasStableId.js.map