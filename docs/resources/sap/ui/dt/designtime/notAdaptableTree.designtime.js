/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define([],function(){"use strict";return function(t){var a="not-adaptable";var e={aggregations:{},actions:a};var n={propagateMetadata:function(){return{actions:a}},actions:a};var r=t.getMetadata().getAllAggregations();Object.keys(r).reduce(function(t,a){t.aggregations[a]=n;return t},e);return e}});
//# sourceMappingURL=notAdaptableTree.designtime.js.map