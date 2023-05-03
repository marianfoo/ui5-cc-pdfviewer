/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/core/Renderer","sap/m/HBoxRenderer"],function(e,r){"use strict";var a=e.extend.call(r,"sap.ui.rta.toolbar.BaseRenderer");a.apiVersion=1;a.render=function(e,a){e.class("sapUiRtaToolbar");e.class("color_"+a.getColor());a.type&&e.class("type_"+a.type);var s=a.getZIndex();s&&e.style("z-index",s);r.render(e,a)};return a});
//# sourceMappingURL=BaseRenderer.js.map