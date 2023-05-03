/*!
 * Copyright (c) 2009-2022 SAP SE, All Rights Reserved
 */
sap.ui.define(["sap/ui/core/Control","sap/m/Button"],function(e,t){"use strict";var o=e.extend("sap.ushell.components.workPageBuilder.controls.WorkPageWidgetContainer",{metadata:{library:"sap.ushell",properties:{editMode:{type:"boolean",defaultValue:false},openWidgetSettingsTooltip:{type:"string",defaultValue:""},deleteWidgetTooltip:{type:"string",defaultValue:""}},aggregations:{widget:{type:"sap.ui.core.Control",multiple:false},_deleteButton:{type:"sap.m.Button",multiple:false,visibility:"hidden"}},events:{deleteWidget:{}}},renderer:{apiVersion:2,render:function(e,t){e.openStart("div",t);e.class("sapCepWorkPageWidgetContainer");e.openEnd();e.openStart("div");e.class("sapCepWorkPageWidgetContainerInner");e.openEnd();e.renderControl(t.getWidget());e.close("div");if(t.getEditMode()){e.openStart("div");e.class("sapCepWidgetToolbar");e.openEnd();e.renderControl(t.getDeleteButton());e.close("div")}e.close("div")}}});o.prototype.getDeleteButton=function(){if(!this.getAggregation("_deleteButton")){this.setAggregation("_deleteButton",new t({icon:"sap-icon://delete",tooltip:this.getDeleteWidgetTooltip(),press:function(){this.fireEvent("deleteWidget")}.bind(this)}))}return this.getAggregation("_deleteButton")};return o});
//# sourceMappingURL=WorkPageWidgetContainer.js.map