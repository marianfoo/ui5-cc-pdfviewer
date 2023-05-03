/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/fl/util/IFrame"],function(){"use strict";return function(t,e,r){var n=e.modifier;var i=t.getContent();var a=e.view;var u=e.appComponent;var o={_settings:{}};["url","width","height"].forEach(function(t){var e=i[t];o[t]=e;o._settings[t]=e});return Promise.resolve().then(function(){return n.createControl("sap.ui.fl.util.IFrame",u,a,r,o,false)})}});
//# sourceMappingURL=createIFrame.js.map