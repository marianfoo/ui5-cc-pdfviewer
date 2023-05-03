/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/Device","sap/ui/core/Control","sap/ui/core/Core","sap/ui/core/Icon","sap/ui/core/ResizeHandler","sap/ui/core/delegate/ScrollEnablement","sap/ui/core/delegate/ItemNavigation","sap/ui/dom/containsOrEquals","sap/m/Title","sap/m/Button","sap/m/Menu","sap/m/MenuItem","sap/ui/core/InvisibleMessage","./SidePanelItem","./SidePanelRenderer","sap/ui/core/library","sap/ui/events/F6Navigation","sap/ui/thirdparty/jquery","sap/ui/events/KeyCodes"],function(e,t,i,n,o,s,a,r,l,d,h,p,c,u,g,f,_,jQuery,m){"use strict";var S=sap.ui.getCore().getLibraryResourceBundle("sap.f"),I=f.InvisibleMessageMode;var v=t.extend("sap.f.SidePanel",{metadata:{library:"sap.f",properties:{actionBarExpanded:{type:"boolean",group:"Appearance",defaultValue:false},ariaLabel:{type:"string",group:"Accessibility",defaultValue:"Side Panel"},sidePanelWidth:{type:"sap.ui.core.CSSSize",group:"Appearance",defaultValue:"20rem"},sidePanelMinWidth:{type:"sap.ui.core.CSSSize",group:"Appearance",defaultValue:"10%",visibility:"hidden"},sidePanelMaxWidth:{type:"sap.ui.core.CSSSize",group:"Appearance",defaultValue:"90%",visibility:"hidden"},sideContentExpanded:{type:"boolean",group:"Appearance",defaultValue:false,visibility:"hidden"}},aggregations:{mainContent:{type:"sap.ui.core.Control",multiple:true},items:{type:"sap.f.SidePanelItem",multiple:true,singularName:"item"},_arrowButton:{type:"sap.m.Button",multiple:false,visibility:"hidden"},_closeButton:{type:"sap.m.Button",multiple:false,visibility:"hidden"},_overflowItem:{type:"sap.f.SidePanelItem",multiple:false,visibility:"hidden"},_overflowMenu:{type:"sap.m.Menu",multiple:false,visibility:"hidden"}},associations:{selectedItem:{type:"sap.f.SidePanelItem",multiple:false}},events:{toggle:{allowPreventDefault:true,parameters:{item:{type:"sap.f.SidePanelItem"},expanded:{type:"boolean"}}}}}});v.prototype.init=function(){this.setAggregation("_arrowButton",new d(this.getId()+"-expandCollapseButton",{type:"Transparent",press:this._toggleActionBarExpanded.bind(this)}).addStyleClass("sapFSPExpandCollapse"));this.setAggregation("_overflowItem",new u({icon:"sap-icon://overflow",text:S.getText("SIDEPANEL_MORE_ACTIONS_TEXT")}));if(!e.system.phone){var t=new h({itemSelected:function(e){var t=e.getParameter("item");if(this._mOverflowItemsMap[t.getId()]){this._toggleItemSelection(this._mOverflowItemsMap[t.getId()])}}.bind(this),closed:function(){setTimeout(function(){this._setOverflowItemSelection(false)}.bind(this),100)}.bind(this)}).addStyleClass("sapFSPOverflowMenu");this.setAggregation("_overflowMenu",t)}this._onResizeRef=this._onResize.bind(this);this._onMainScroll=this._handleScroll.bind(this);this._iLastScrollPosition=0;this._iVisibleItems=0;this._bOverflowMenuOpened=false;this._mOverflowItemsMap={};this._oItemNavigation=null};v.prototype.exit=function(){this._detachResizeHandlers();this._detachScrollHandler();this._detachMainFocusOutHandler()};v.prototype.setSelectedItem=function(e){var t=this.getSelectedItem(),n,o;if(typeof e==="string"){n=e;o=i.byId(e)}else if(e&&e.isA("sap.f.SidePanelItem")){n=e.getId();o=e}if(!n){t&&this._toggleItemSelection(i.byId(t))}else if(o&&n!==t&&n!==this.getAggregation("_overflowItem").getId()){this._toggleItemSelection(o);this.setAssociation("selectedItem",o,true)}return this};v.prototype.onBeforeRendering=function(){var e=this.getAggregation("_arrowButton"),t=this.getActionBarExpanded(),i=t?S.getText("SIDEPANEL_COLLAPSE_BUTTON_TEXT"):S.getText("SIDEPANEL_EXPAND_BUTTON_TEXT"),n=t?"right":"left";e.setIcon("sap-icon://navigation-"+n+"-arrow");e.setTooltip(i);this._detachResizeHandlers();this._attachResizeHandlers();this._detachScrollHandler();this._detachMainFocusOutHandler();this._oInvisibleMessage=c.getInstance()};v.prototype.onAfterRendering=function(){var t=this._isSingleItem()&&this.getActionBarExpanded()?this.getAggregation("_closeButton"):this.getAggregation("_arrowButton"),i;if(!e.system.phone){i=t.getDomRef();i&&i.setAttribute("aria-expanded",this.getActionBarExpanded()?"true":"false")}!this._getSideContentExpanded()&&this._attachScrollHandler();this._attachMainFocusOutHandler();if(!e.system.phone){if(!this._isSingleItem()&&this._iVisibleItems>0){this._initItemNavigation()}if(this.getActionBarExpanded()||this._getSideContentExpanded()){this.getItems().length&&this._fixSidePanelWidth()}}else{if(this.getDomRef().querySelector(".sapFSPMain").scrollTop===0){this.setActionBarExpanded(true)}}};v.prototype.onkeydown=function(e){var t=e.target,n=this.$().find(".sapFSPActionBar")[0],o=this._getSideContentExpanded(),s=this.getActionBarExpanded()||o,a=e.ctrlKey||e.metaKey;if(a&&e.which===m.ARROW_LEFT){e.preventDefault();if(o){this._focusSideContent()}}else if(a&&e.which===m.ARROW_RIGHT&&o){if(o){this._contentControlToFocus=i.getCurrentFocusedControlId()}this._oItemNavigation.getFocusedDomRef().focus()}else if(a&&e.shiftKey&&e.which===m.P){e.preventDefault();this._toggleActionBarExpanded();if(!s){this._oItemNavigation.getFocusedDomRef().focus()}else{o&&this.setActionBarExpanded(false);this._closeSideContent();this._focusMain()}}else if(e.which===m.ESCAPE){e.preventDefault();this.setActionBarExpanded(false);this._closeSideContent();this._focusMain()}if(!r(n,t)||t===n){return}switch(e.which){case m.ENTER:e.preventDefault();this._toggleItemSelection(e.srcControl);break;case m.SPACE:e.preventDefault();break}};v.prototype.onkeyup=function(e){var t=e.target,i=this.$().find(".sapFSPActionBar")[0];if(!r(i,t)||t===i){return}if(e.which===m.SPACE){this._toggleItemSelection(e.srcControl)}};v.prototype.ontap=function(e){var t,n=e.target,o=this.$().find(".sapFSPActionBar")[0];if(!r(o,n)||n===o){return}t=n;while(t.tagName!=="LI"){t=t.parentElement}if(!t){return}this._toggleItemSelection(i.byId(t.id))};v.prototype.onsapskipforward=function(e){e.preventDefault();this._handleGroupNavigation(e,false)};v.prototype.onsapskipback=function(e){this._handleGroupNavigation(e,true)};v.prototype._getSideContentExpanded=function(){return this.getProperty("sideContentExpanded")};v.prototype._setSideContentExpanded=function(e){return this.setProperty("sideContentExpanded",e)};v.prototype._getFocusDomRef=function(e){return e.getDomRef()};v.prototype._focusMain=function(){this._oPreviousFocusedMainElement&&this._oPreviousFocusedMainElement.focus()};v.prototype._focusSideContent=function(){var e=this._contentControlToFocus?i.byId(this._contentControlToFocus):this.getAggregation("_closeButton");e&&e.focus()};v.prototype._closeSideContent=function(){var e=i.byId(this.getSelectedItem()),t=true;if(e){t=this._fireToggle({item:e,expanded:false})}if(t){this._setSideContentExpanded(false);this.setAssociation("selectedItem",null);if(this._isSingleItem()){setTimeout(function(){var e=this.getAggregation("_arrowButton");e&&e.focus()}.bind(this),0)}}};v.prototype._toggleActionBarExpanded=function(){var e;if(this._isSingleItem()){e=!this.getActionBarExpanded()?this.getItems()[0]:null;if(e){var t=this._fireToggle({item:e,expanded:!!e});if(!t){return}}this.setAssociation("selectedItem",e);this._setSideContentExpanded(!!e);setTimeout(function(){var e=this.getAggregation("_closeButton");e&&e.focus()}.bind(this),0)}else{this.setActionBarExpanded(!this.getActionBarExpanded())}};v.prototype._fireToggle=function(e){this._contentControlToFocus=undefined;return this.fireToggle(e)};v.prototype._initItemNavigation=function(){var e=this.getItems(),t=[],i=e.length>this._iVisibleItems,n=i?this._iVisibleItems-1:e.length,o=this.getAggregation("_overflowItem"),s=this.getAggregation("_overflowMenu"),r,l,d;if(!e.length||!this._iVisibleItems){return}else{l=e[0].getDomRef().parentElement;s.destroyItems();this._mOverflowItemsMap={}}e.forEach(function(e,i){if(i<n){r=this._getFocusDomRef(e);r.setAttribute("tabindex","-1");t.push(r);e.$().css("display","flex")}else{e.$().css("display","none");d=new p({text:e.getText(),icon:e.getIcon()});s.addItem(d);this._mOverflowItemsMap[d.getId()]=e}}.bind(this));if(i){o.$().css("visibility","visible");r=this._getFocusDomRef(o);r.setAttribute("tabindex","-1");t.push(r)}else{o.$().css("visibility","hidden")}if(!this._oItemNavigation){this._oItemNavigation=(new a).setCycling(false).attachEvent(a.Events.AfterFocus,this._onItemNavigationAfterFocus,this).setDisabledModifiers({sapnext:["alt","meta","ctrl"],sapprevious:["alt","meta","ctrl"]});this.addDelegate(this._oItemNavigation);this._bAnnounceSelected=true}this._oItemNavigation.setRootDomRef(l).setItemDomRefs(t).setPageSize(n);if(this._oItemNavigation.getFocusedIndex()===-1){this._oItemNavigation.setFocusedIndex(0)}};v.prototype._onItemNavigationAfterFocus=function(e){var t=this.getSelectedItem();if(t===this._oItemNavigation.getFocusedDomRef().id&&this._bAnnounceSelected){this._oInvisibleMessage.announce(S.getText("SIDEPANEL_NAV_ITEM_SELECTED"),I.Polite)}this._bAnnounceSelected=true};v.prototype._attachResizeHandlers=function(){this._iResizeHandlerId=o.register(this,this._onResizeRef)};v.prototype._detachResizeHandlers=function(){if(this._iResizeHandlerId){o.deregister(this._iResizeHandlerId);this._iResizeHandlerId=null}};v.prototype._onResize=function(t){if(!this.getItems().length){return}var i=t.size.width,n=this._isSingleItem(),o=window.getComputedStyle(this.$().find(".sapFSPActionBar")[0]),s=parseInt(o.gap),a=parseInt(o.marginBottom),r=parseInt(o.marginTop),l=this.$().find(".sapFSPOverflowItem")[0],d=l&&l.clientHeight,h,i;if(i<1440&&(this._iPreviousWidth===undefined||this._iPreviousWidth>=1440)){this.addStyleClass("sapFSPSizeMedium")}else if(i>=1440&&(this._iPreviousWidth===undefined||this._iPreviousWidth<1440)){this.removeStyleClass("sapFSPSizeMedium")}this._iPreviousWidth=i;if(!e.system.phone){if(!n){h=this.$().find(".sapFSPSideInner")[0].clientHeight-a-r;this._iVisibleItems=parseInt((h+s)/(d+s));this._initItemNavigation()}if(this.getActionBarExpanded()||this._getSideContentExpanded()){this._fixSidePanelWidth()}}};v.prototype._fixSidePanelWidth=function(){var e=this.getDomRef().querySelector(".sapFSPSide"),t=this.getDomRef().querySelector(".sapFSPSideInner"),i=this._getControlWidth(),n=parseInt(window.getComputedStyle(t).width),o=i<n;if(!this.hasStyleClass("sapFSPSizeMedium")){e.style.width=o?i+"px":this._getSidePanelWidth();e.style.minWidth=o?i+"px":this._getSidePanelMinWidth();e.style.maxWidth=this._getSidePanelMaxWidth()}else{e.style.width="";e.style.minWidth="";e.style.maxWidth=""}t.style.width=o?i+"px":this._getSidePanelWidth();t.style.minWidth=o?i+"px":this._getSidePanelMinWidth();t.style.maxWidth=this._getSidePanelMaxWidth()};v.prototype._setOverflowItemSelection=function(e){var t=this.getAggregation("_overflowItem"),i;if(!t||!t.getDomRef()){return}this._bOverflowMenuOpened=e;i=this._getOverflowItemText();t.setText(i,false);t.$().find(".sapFSPItemText").text(i)};v.prototype._getAriaLabelText=function(){var e=this.getAriaLabel();return e?e:S.getText("SIDEPANEL_DEFAULT_ARIA_LABEL")};v.prototype._getOverflowItemText=function(){return this._bOverflowMenuOpened?S.getText("SIDEPANEL_SHOW_LESS_TEXT"):S.getText("SIDEPANEL_MORE_ACTIONS_TEXT")};v.prototype._getSideContentAriaLabel=function(){return S.getText("SIDEPANEL_CONTENT_ARIA_LABEL")};v.prototype._toggleItemSelection=function(t){var n,o=this.getSelectedItem(),s=t.getDomRef(),a=t.getId()!==o,r,l=true;if(s&&s.classList.contains("sapFSPOverflowItem")){this._toggleOverflowMenu(s);return}if(o&&(!r||a)){l=this._fireToggle({item:a?i.byId(o):t,expanded:false})}if(!l){return}n=a?t:null;r=!!n;this.setAssociation("selectedItem",n);if(n){this._bAnnounceSelected=false;l=this._fireToggle({item:n,expanded:true});if(!l){this._setSideContentExpanded(false);return}}!e.system.phone&&this.getActionBarExpanded()&&this.setActionBarExpanded(false);this._setSideContentExpanded(r)};v.prototype._toggleOverflowMenu=function(e){var t=this.getAggregation("_overflowMenu"),i={onkeydown:this._overflowMenuOnkeydown.bind(this)};if(!e){if(this._bOverflowMenuOpened){this._bOverflowMenuOpened=false}return}if(this._bOverflowMenuOpened){this._setOverflowItemSelection(false);t.close()}else{this._setOverflowItemSelection(true);setTimeout(function(){var n=!t.getAggregation("_menu");t.openBy(e,false,sap.ui.core.Popup.Dock.BeginBottom,sap.ui.core.Popup.Dock.EndBottom,"3 0");t._getMenu().getPopup().setExtraContent([this.getAggregation("_overflowItem")]);n&&t.getAggregation("_menu").addEventDelegate(i)}.bind(this),0)}};v.prototype._overflowMenuOnkeydown=function(e){var t=this.getAggregation("_overflowItem");e.preventDefault();if(e.which===m.ARROW_RIGHT){this._closeOverflowMenu();t&&t.focus()}else if(e.which===m.ARROW_LEFT&&!(e.ctrlKey||e.metaKey)){this._closeOverflowMenu();this.setActionBarExpanded(false);this._focusMain()}};v.prototype._isSideContentExpanded=function(){return(e.system.phone||(!this.getActionBarExpanded()||this._isSingleItem()))&&this._getSideContentExpanded()};v.prototype._getSelectedItem=function(){return i.byId(this.getSelectedItem())};v.prototype._getSideContentHeaderTitle=function(){var e=this._getSelectedItem();if(!this._contentHeaderTitle){this._contentHeaderTitle=new l}e&&this._contentHeaderTitle.setText(e.getText())&&this._contentHeaderTitle.setTooltip(e.getText());return this._contentHeaderTitle};v.prototype._getSideContentHeaderIcon=function(){var e=this._getSelectedItem();if(!this._contentHeaderIcon){this._contentHeaderIcon=new n}e&&this._contentHeaderIcon.setSrc(e.getIcon());return this._contentHeaderIcon};v.prototype._getSideContentHeaderCloseBtn=function(){var t,i=this.getAggregation("_closeButton");if(!i){if(this._isSingleItem()){t=e.system.phone?"sap-icon://navigation-down-arrow":"sap-icon://navigation-right-arrow"}else{t="sap-icon://decline"}i=new d(this.getId()+"-closeButton",{type:"Transparent",tooltip:S.getText("SIDEPANEL_CLOSE_BUTTON_TEXT"),icon:t,press:function(){var e=this._getSelectedItem(),t=this.getAggregation("_overflowItem");this._bAnnounceSelected=false;if(this.$().find("#"+e.getId()).css("display")==="none"){t&&t.focus()}else{e&&e.focus()}this._closeSideContent()}.bind(this)});this.setAggregation("_closeButton",i)}return i};v.prototype._attachScrollHandler=function(){if(!e.system.phone||!this.getDomRef()){return}this.$().find(".sapFSPMain")[0].addEventListener("scroll",this._onMainScroll)};v.prototype._detachScrollHandler=function(){if(!e.system.phone||!this.getDomRef()){return}this.$().find(".sapFSPMain")[0].removeEventListener("scroll",this._onMainScroll)};v.prototype._closeOverflowMenu=function(){if(this._bOverflowMenuOpened){this._setOverflowItemSelection(false);this.getAggregation("_overflowMenu").close()}};v.prototype._attachMainFocusOutHandler=function(){if(!e.system.phone){var t=this.getDomRef();t&&t.querySelector(".sapFSPMain").addEventListener("focusout",this._onMainFocusOut.bind(this),false)}};v.prototype._detachMainFocusOutHandler=function(){if(!e.system.phone){var t=this.getDomRef();t&&t.querySelector(".sapFSPMain").removeEventListener("focusout",this._onMainFocusOut.bind(this),false)}};v.prototype._onMainFocusOut=function(e){this._oPreviousFocusedMainElement=e.target};v.prototype._handleScroll=function(e){var t,i,n;if(!this.bScrolling){this.bScrolling=true;t=parseInt(e.target.scrollTop);setTimeout(function(){i=t>this._iLastScrollPosition;n=t<this._iLastScrollPosition;this.setActionBarExpanded(!i||n);this._iLastScrollPosition=t;this.bScrolling=false}.bind(this),100)}};v.prototype._handleGroupNavigation=function(e,t){var i=jQuery.Event("keydown");this.$().trigger("focus");i.target=e.target;i.key="F6";i.shiftKey=t;_.handleF6GroupNavigation(i)};v.prototype._isSingleItem=function(){return this.getItems().length===1};v.prototype._calculatePixelWidth=function(e){e=e.replace(/\s/g,"");if(e.slice(-1)==="%"){e=parseInt(this._getControlWidth()*parseFloat(e)/100)+"px"}return e};v.prototype._getControlWidth=function(){return parseInt(this.$().css("width"))};v.prototype._getSidePanelWidth=function(){return this._calculatePixelWidth(this.getSidePanelWidth())};v.prototype._getSidePanelMinWidth=function(){return this._calculatePixelWidth(this.getProperty("sidePanelMinWidth"))};v.prototype._getSidePanelMaxWidth=function(){return this._calculatePixelWidth(this.getProperty("sidePanelMaxWidth"))};return v});
//# sourceMappingURL=SidePanel.js.map