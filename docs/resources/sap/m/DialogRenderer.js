/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/m/library","sap/ui/Device","sap/ui/core/library","sap/ui/core/Core"],function(e,a,s,o){"use strict";var t=e.DialogType;var i=e.DialogRoleType;var l=s.ValueState;var r={apiVersion:2};r._mStateClasses={};r._mStateClasses[l.None]="";r._mStateClasses[l.Success]="sapMDialogSuccess";r._mStateClasses[l.Warning]="sapMDialogWarning";r._mStateClasses[l.Error]="sapMDialogError";r._mStateClasses[l.Information]="sapMDialogInformation";r.render=function(s,n){var p=n.getId(),g=n._getAnyHeader(),c=n.getSubHeader(),d=n.getBeginButton(),D=n.getEndButton(),S=n.getState(),b=n.getStretch(),f=n.getStretchOnPhone()&&a.system.phone,C=n.getAggregation("_valueState");s.openStart("div",n).style("width",n.getContentWidth()).style("height",n.getContentHeight()).class("sapMDialog").class("sapMDialog-CTX").class("sapMPopup-CTX");if(n.isOpen()){s.class("sapMDialogOpen")}if(window.devicePixelRatio>1){s.class("sapMDialogHighPixelDensity")}if(n._bDisableRepositioning){s.class("sapMDialogTouched")}if(b||f){s.class("sapMDialogStretched")}s.class(r._mStateClasses[S]);var M=!n._oToolbar&&!d&&!D;var u=n._oToolbar&&n._isToolbarEmpty()&&!d&&!D;var _=n._oToolbar&&!n._oToolbar.getVisible();if(M||u||_){s.class("sapMDialog-NoFooter")}if(!g){s.class("sapMDialog-NoHeader")}var v=n.getProperty("role");if(S===l.Error||S===l.Warning){v=i.AlertDialog}s.accessibilityState(n,{role:v,modal:true});if(c&&c.getVisible()){s.class("sapMDialogWithSubHeader");if(c.getDesign()==e.ToolbarDesign.Info){s.class("sapMDialogSubHeaderInfoBar")}}if(n.getType()===t.Message){s.class("sapMMessageDialog")}if(!n.getVerticalScrolling()){s.class("sapMDialogVerScrollDisabled")}if(!n.getHorizontalScrolling()){s.class("sapMDialogHorScrollDisabled")}if(a.system.phone){s.class("sapMDialogPhone")}if(n.getDraggable()&&!b){s.class("sapMDialogDraggable")}if(e._bSizeCompact){s.class("sapUiSizeCompact")}var y=n.getTooltip_AsString();if(y){s.attr("title",y)}s.attr("tabindex","-1");s.openEnd();if(a.system.desktop){if(n.getResizable()&&!b){s.icon("sap-icon://resize-corner",["sapMDialogResizeHandler"],{title:"","aria-label":""})}s.openStart("span",p+"-firstfe").class("sapMDialogFirstFE").attr("role","none").attr("tabindex","0").openEnd().close("span")}if(g||c){s.openStart("header").openEnd();if(g){g._applyContextClassFor("header");s.openStart("div").class("sapMDialogTitleGroup");if(n._isDraggableOrResizable()){s.attr("tabindex",0).accessibilityState(g,{role:"group",roledescription:o.getLibraryResourceBundle("sap.m").getText("DIALOG_HEADER_ARIA_ROLE_DESCRIPTION"),describedby:{value:n.getId()+"-ariaDescribedbyText",append:true}})}s.openEnd().renderControl(g).renderControl(n._oAriaDescribedbyText).close("div")}if(c&&c.getVisible()){c._applyContextClassFor("subheader");s.openStart("div").class("sapMDialogSubHeader").openEnd().renderControl(c).close("div")}s.close("header")}if(C){s.renderControl(C)}s.openStart("section",p+"-cont").class("sapMDialogSection").openEnd();s.openStart("div",p+"-scroll").class("sapMDialogScroll").openEnd();s.openStart("div",p+"-scrollCont").class("sapMDialogScrollCont");if(n.getStretch()||n.getContentHeight()){s.class("sapMDialogStretchContent")}s.openEnd();n.getContent().forEach(s.renderControl,s);s.close("div").close("div").close("section");if(!M&&!u&&!_){n._oToolbar._applyContextClassFor("footer");s.openStart("footer").class("sapMDialogFooter").openEnd().renderControl(n._oToolbar).close("footer")}if(a.system.desktop){s.openStart("span",p+"-lastfe").class("sapMDialogLastFE").attr("role","none").attr("tabindex","0").openEnd().close("span")}s.close("div")};return r},true);
//# sourceMappingURL=DialogRenderer.js.map