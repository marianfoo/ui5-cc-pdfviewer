/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/core/library","./library","sap/ui/core/Core"],function(t,e,a){"use strict";var s=t.TextDirection;var n=e.EmptyIndicatorMode;var i=a.getLibraryResourceBundle("sap.m");var o={apiVersion:2};o.render=function(t,e){t.openStart("div",e);if(e._isEmpty()&&e.getEmptyIndicatorMode()===n.Off){t.style("display","none");t.openEnd()}else{var i=e.getState(),o=e._getStateText(i),r=e.getInverted(),p=e.getTextDirection(),c=a.getConfiguration().getRTL(),d={},l=e.getTooltip_AsString();if(p===s.Inherit){p=c?s.RTL:s.LTR}if(l){t.attr("title",l)}t.class("sapMObjStatus");t.class("sapMObjStatus"+i);if(r){t.class("sapMObjStatusInverted")}if(e._isActive()){t.class("sapMObjStatusActive");t.attr("tabindex","0");d.role="button";d.roledescription=a.getLibraryResourceBundle("sap.m").getText("OBJECT_STATUS_ACTIVE")}var g=l&&e.getAriaDescribedBy().length,u;if(g){u=e.getId()+"-tooltip";d["describedby"]={value:u,append:true}}t.accessibilityState(e,d);t.openEnd();if(g){t.openStart("span",u);t.class("sapUiInvisibleText");t.openEnd();t.text(l);t.close("span")}if(e.getTitle()){t.openStart("span",e.getId()+"-title");t.class("sapMObjStatusTitle");if(p){t.attr("dir",p.toLowerCase())}t.attr("data-colon",a.getLibraryResourceBundle("sap.m").getText("LABEL_COLON"));t.openEnd();t.text(e.getTitle());t.close("span")}if(e._isActive()){t.openStart("span",e.getId()+"-link");t.class("sapMObjStatusLink");t.openEnd()}if(e.getIcon()){t.openStart("span",e.getId()+"-statusIcon");t.class("sapMObjStatusIcon");if(!e.getText()){t.class("sapMObjStatusIconOnly")}t.openEnd();t.renderControl(e._getImageControl());t.close("span")}if(e.getText()){t.openStart("span",e.getId()+"-text");t.class("sapMObjStatusText");if(p){t.attr("dir",p.toLowerCase())}t.openEnd();t.text(e.getText());t.close("span")}else if(e.getEmptyIndicatorMode()!==n.Off&&!e.getText()){this.renderEmptyIndicator(t,e)}if(e._isActive()){t.close("span")}if(o){t.openStart("span",e.getId()+"-state");t.class("sapUiPseudoInvisibleText");t.openEnd();t.text(o);t.close("span")}}t.close("div")};o.renderEmptyIndicator=function(t,e){t.openStart("span");t.class("sapMEmptyIndicator");if(e.getEmptyIndicatorMode()===n.Auto){t.class("sapMEmptyIndicatorAuto")}t.openEnd();t.openStart("span");t.attr("aria-hidden",true);t.openEnd();t.text(i.getText("EMPTY_INDICATOR"));t.close("span");t.openStart("span");t.class("sapUiPseudoInvisibleText");t.openEnd();t.text(i.getText("EMPTY_INDICATOR_TEXT"));t.close("span");t.close("span")};return o},true);
//# sourceMappingURL=ObjectStatusRenderer.js.map