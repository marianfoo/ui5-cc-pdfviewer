/*!
 * SAPUI5
 * (c) Copyright 2009-2022 SAP SE. All rights reserved.
 */
sap.ui.define([],function(){"use strict";var e={apiVersion:2,extendMicroChartRenderer:function(e){e._renderNoData=function(e,t){if(!t.getHideOnNoData()){e.openStart("div",t);this._writeMainProperties(e,t);e.openEnd();e.openStart("div");e.class("sapSuiteUiMicroChartNoData");e.openEnd();e.openStart("div");e.class("sapSuiteUiMicroChartNoDataTextWrapper");e.openEnd();var r=sap.ui.getCore().getLibraryResourceBundle("sap.suite.ui.microchart");var i=r.getText("NO_DATA");e.openStart("span").openEnd();e.text(i);e.close("span");e.close("div");e.close("div");e.close("div")}};e._renderActiveProperties=function(e,t){var r=t.hasListeners("press");if(r){if(t._hasData()){e.class("sapSuiteUiMicroChartPointer")}e.attr("tabindex","0")}}}};return e},true);
//# sourceMappingURL=MicroChartRenderUtils.js.map