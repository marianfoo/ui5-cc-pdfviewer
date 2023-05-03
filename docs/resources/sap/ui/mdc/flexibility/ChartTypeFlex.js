/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/mdc/flexibility/Util"],function(e){"use strict";var t={};var r=function(e,t,r){var a=r.modifier;return Promise.resolve().then(a.getProperty.bind(a,t,"chartType")).then(function(r){e.setRevertData(r);a.setProperty(t,"chartType",e.getContent().chartType)})};var a=function(e,t,r){r.modifier.setProperty(t,"chartType",e.getRevertData());e.resetRevertData()};t.setChartType=e.createChangeHandler({apply:r,revert:a});return t});
//# sourceMappingURL=ChartTypeFlex.js.map