/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["./library"],function(e){"use strict";var r={apiVersion:2};r.CSS_CLASS="sapUiMDCChart";r.render=function(e,t){e.openStart("div",t);e.attr("id",t.getId());e.class(r.CSS_CLASS);e.style("height",t.getHeight());e.style("width",t.getWidth());e.style("min-height",t.getMinHeight());e.style("min-width",t.getMinWidth());e.openEnd();this.renderToolbar(e,t.getAggregation("_toolbar"));this.renderBreadcrumbs(e,t.getAggregation("_breadcrumbs"));this.renderInnerStructure(e,t.getAggregation("_innerChart"));e.close("div")};r.renderNoDataStruct=function(e,r){if(r){}};r.renderToolbar=function(e,r){if(r){e.openStart("div");e.openEnd();e.renderControl(r);e.close("div")}};r.renderBreadcrumbs=function(e,r){if(r){e.renderControl(r)}};r.renderInnerChart=function(e,r){if(r){e.renderControl(r)}};r.renderInnerStructure=function(e,r){e.renderControl(r)};return r},true);
//# sourceMappingURL=ChartRenderer.js.map