/*!
 * Copyright (c) 2009-2022 SAP SE, All Rights Reserved
 */
sap.ui.define(["sap/base/Log","sap/ui/core/Control","sap/ui/Device","sap/ui/thirdparty/jquery","sap/ui/util/Storage","sap/ushell/Config","sap/ushell/library","sap/ushell/ui/shell/ToolArea","sap/ushell/ui/shell/ShellLayoutRenderer"],function(e,t,a,jQuery,i,o){"use strict";var l=t.extend("sap.ushell.ui.shell.ShellLayout",{metadata:{library:"sap.ushell",properties:{headerHiding:{type:"boolean",group:"Appearance",defaultValue:false,deprecated:true},headerVisible:{type:"boolean",group:"Appearance",defaultValue:true},toolAreaVisible:{type:"boolean",group:"Appearance",defaultValue:false},floatingContainerVisible:{type:"boolean",group:"Appearance",defaultValue:false},backgroundColorForce:{type:"boolean",group:"Appearance",defaultValue:true,deprecated:true},showBrandLine:{type:"boolean",group:"Appearance",defaultValue:true,deprecated:true},showAnimation:{type:"boolean",group:"Appearance",defaultValue:true,deprecated:true},enableCanvasShapes:{type:"boolean",group:"Appearance",defaultValue:false}},aggregations:{toolArea:{type:"sap.ushell.ui.shell.ToolArea",multiple:false},rightFloatingContainer:{type:"sap.ushell.ui.shell.RightFloatingContainer",multiple:false},canvasSplitContainer:{type:"sap.ushell.ui.shell.SplitContainer",multiple:false},floatingActionsContainer:{type:"sap.ushell.ui.shell.ShellFloatingActions",multiple:false},footer:{type:"sap.ui.core.Control",multiple:false}},associations:{header:{type:"sap.ushell.ui.shell.ShellHeader",multiple:false},floatingContainer:{type:"sap.ushell.ui.shell.FloatingContainer",multiple:false}}}});l._SIDEPANE_WIDTH_PHONE=13;l._SIDEPANE_WIDTH_TABLET=13;l._SIDEPANE_WIDTH_DESKTOP=15;l.prototype.getHeader=function(){return sap.ui.getCore().byId(this.getAssociation("header"))};l.prototype.init=function(){this._rtl=sap.ui.getCore().getConfiguration().getRTL();this._showHeader=true;this._useStrongBG=false;a.media.attachHandler(this._handleMediaChange,this,a.media.RANGESETS.SAP_STANDARD);this._oDoable=o.on("/core/shellHeader/headerVisible").do(this.setHeaderVisible.bind(this));this._oStorage=new i(i.Type.local,"com.sap.ushell.adapters.local.FloatingContainer")};l.prototype.destroy=function(){a.media.detachHandler(this._handleMediaChange,this,a.media.RANGESETS.SAP_STANDARD);if(this._oDoable){this._oDoable.off();this._oDoable=null}if(this._oRm){this._oRm.destroy();this._oRm=null}t.prototype.destroy.apply(this,arguments)};l.prototype.onAfterRendering=function(){this._setSidePaneWidth();if(this.getEnableCanvasShapes()){sap.ui.require(["sap/ushell/CanvasShapesManager"],function(e){if(sap.ui.getCore().isThemeApplied()){e.drawShapes()}})}};l.prototype.renderFloatingContainerWrapper=function(){this._oFloatingContainerWrapper=document.getElementById("sapUshellFloatingContainerWrapper");if(!this._oFloatingContainerWrapper){this._oFloatingContainerWrapper=document.createElement("DIV");this._oFloatingContainerWrapper.setAttribute("id","sapUshellFloatingContainerWrapper");this._oFloatingContainerWrapper.classList.add("sapUshellShellFloatingContainerWrapper");this._oFloatingContainerWrapper.classList.add("sapUshellShellHidden");window.document.body.appendChild(this._oFloatingContainerWrapper)}if(this._oStorage&&this._oStorage.get("floatingContainerStyle")){this._oFloatingContainerWrapper.style.cssText=this._oStorage.get("floatingContainerStyle")}};l.prototype.renderFloatingContainer=function(e){this.renderFloatingContainerWrapper();if(e&&!e.getDomRef()){if(!this._oFloatingContainerWrapper.classList.contains("sapUshellShellHidden")){this._oFloatingContainerWrapper.classList.add("sapUshellShellHidden")}e.placeAt("sapUshellFloatingContainerWrapper")}};l.prototype.onThemeChanged=function(){return!!this.getDomRef()};l.prototype.setToolAreaVisible=function(t){this.setProperty("toolAreaVisible",!!t,true);if(this.getToolArea()){this.getToolArea().toggleStyleClass("sapUshellShellHidden",!t);this.applySplitContainerSecondaryContentSize();return this}if(t){sap.ui.require(["sap/ushell/EventHub"],function(e){e.emit("CreateToolArea")});return this}e.debug("Tool area not created but visibility updated",null,"sap.ushell.ShellLayout");return this};l.prototype.getToolAreaSize=function(){if(this.getToolAreaVisible()){if(this.getToolArea().hasItemsWithText()){return"15rem"}return"3.0625rem"}return"0"};l.prototype.setFooter=function(e){this.setAggregation("footer",e,true);this._renderFooter(e)};l.prototype.applySplitContainerSecondaryContentSize=function(){var e=this.getToolAreaSize();this.getCanvasSplitContainer().applySecondaryContentSize(e)};l.prototype.setFloatingContainer=function(e){this.setAssociation("floatingContainer",e,true);this.renderFloatingContainer(e)};l.prototype.setFloatingContainerVisible=function(e){this.setProperty("floatingContainerVisible",!!e,true);if(this.getDomRef()){var t=window.document.getElementById("sapUshellFloatingContainerWrapper");if(e&&this._oStorage&&!this._oStorage.get("floatingContainerStyle")){var a=jQuery(".sapUshellShellHeadItm").position()?jQuery(".sapUshellShellHeadItm").position().left:0;var i=(jQuery(window).width()-jQuery("#shell-floatingContainer").width()-a)*100/jQuery(window).width();var o=jQuery(".sapUshellShellHeader").height()*100/jQuery(window).height();t.style.left=i+"%";t.style.top=o+"%";t.style.position="absolute";this._oStorage.put("floatingContainerStyle",t.style.cssText)}var l=window.document.querySelector(".sapUshellShellFloatingContainerWrapper");if(l&&e===l.classList.contains("sapUshellShellHidden")){l.classList.toggle("sapUshellShellHidden")}}return this};l.prototype.setFloatingActionsContainer=function(e){this.setAggregation("floatingActionsContainer",e,true)};l.prototype.setHeaderVisible=function(e){this.setProperty("headerVisible",e,true);var t=this.getDomRef();if(t){if(e===true){t.classList.remove("sapUshellShellNoHead")}else{t.classList.add("sapUshellShellNoHead")}}};l.prototype._setSidePaneWidth=function(e){var t=this.getCanvasSplitContainer();if(t){if(!e){e=a.media.getCurrentRange(a.media.RANGESETS.SAP_STANDARD).name}var i=l["_SIDEPANE_WIDTH_"+e.toUpperCase()]+"rem";t.setSecondaryContentSize(i)}};l.prototype._hideFooter=function(e,t){e.classList.remove("sapUshellShellFooterVisible");t.classList.add("sapUiHidden")};l.prototype._showFooter=function(e,t,a){if(a._applyContextClassFor){a._applyContextClassFor("footer")}this._oRm=this._oRm||sap.ui.getCore().createRenderManager();e.classList.add("sapUshellShellFooterVisible");t.classList.remove("sapUiHidden");this._oRm.render(a,t)};l.prototype._renderFooter=function(e){var t=this.getDomRef();if(!t){return}var a=t.querySelector("#"+this.getId()+"-footer");a.innerHTML="";if(!e){this._hideFooter(t,a);return}this._showFooter(t,a,e)};l.prototype._handleMediaChange=function(e){if(!this.getDomRef()){return}this._setSidePaneWidth(e.name)};return l},true);
//# sourceMappingURL=ShellLayout.js.map