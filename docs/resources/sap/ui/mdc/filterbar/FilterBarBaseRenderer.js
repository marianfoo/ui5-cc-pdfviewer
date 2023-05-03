/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define([],function(){"use strict";var e={apiVersion:2};e.CSS_CLASS="sapUiMdcFilterBarBase";e.render=function(n,r){n.openStart("div",r);n.class(e.CSS_CLASS);n.openEnd();var t=r.getAggregation("layout")?r.getAggregation("layout").getInner():null;n.renderControl(t);n.close("div")};return e},true);
//# sourceMappingURL=FilterBarBaseRenderer.js.map