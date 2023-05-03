/*!
 * Copyright (c) 2009-2022 SAP SE, All Rights Reserved
 */
sap.ui.define(["sap/ui/core/Control"],function(e){"use strict";var r=e.extend("sap.ushell.components.workPageBuilder.controls.WorkPageCell",{metadata:{library:"sap.ushell",aggregations:{widgetContainers:{type:"sap.ushell.components.workPageBuilder.controls.WorkPageWidgetContainer",multiple:true,singularName:"widgetContainer"}}},renderer:{apiVersion:2,render:function(e,r){var n=r.getWidgetContainers();e.openStart("div",r);e.class("sapCepWorkPageCell");if(!n.length){e.class("sapCepWorkPageCellEmpty")}e.openEnd();n.forEach(function(r){e.renderControl(r)});e.close("div")}}});return r});
//# sourceMappingURL=WorkPageCell.js.map