/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define([],function(){"use strict";var e={apiVersion:2};e.render=function(e,t){var i=t.getAction();var n={role:i&&i.getAccessibilityInfo?i.getAccessibilityInfo().role:"button"};e.openStart("div",t);e.accessibilityState(t,n);e.openEnd();e.renderControl(i);e.close("div")};return e},true);
//# sourceMappingURL=ActionToolbarActionRenderer.js.map