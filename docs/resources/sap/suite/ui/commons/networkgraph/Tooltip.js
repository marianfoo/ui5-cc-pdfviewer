/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define(["sap/ui/thirdparty/jquery","./SvgBase","./Line","./Node","./Group","sap/m/ResponsivePopover","sap/m/Popover","sap/m/List","sap/m/OverflowToolbar","sap/m/Button","sap/m/CustomListItem","sap/m/FlexBox","sap/m/HBox","sap/m/IconTabBar","sap/m/IconTabFilter","sap/m/Panel","sap/m/StandardListItem","sap/m/Text","sap/m/ToolbarSpacer","sap/ui/core/Icon","sap/m/FlexItemData","sap/ui/core/library","sap/m/library","sap/ui/Device"],function(jQuery,t,e,o,i,n,s,p,r,a,l,d,h,c,u,_,m,f,T,g,w,C,v,y){"use strict";var P=v.PlacementType;var S=sap.ui.getCore().getLibraryResourceBundle("sap.suite.ui.commons");var b=t.extend("sap.suite.ui.commons.networkgraph.Tooltip",{metadata:{library:"sap.suite.ui.commons",events:{afterOpen:{},afterClose:{}}}});b.prototype.init=function(){this._oPopover=null;this._oElement=null};b.prototype.create=function(t){var e;this._oPopover=new n(this.getId()+"-tooltip",{showHeader:false,placement:this.getParent()._bIsRtl?P.PreferredLeftOrFlip:P.PreferredRightOrFlip,afterOpen:function(){this.fireAfterOpen()}.bind(this),afterClose:function(){this.fireAfterClose()}.bind(this),beforeOpen:function(){this._fnCreate()}.bind(this),contentWidth:"350px"}).addStyleClass("sapSuiteUiCommonsNetworkTooltip");this._oSimpleTooltip=new s({contentMinWidth:"350px",showHeader:false});this.addDependent(this._oPopover);e=this._oPopover.getAggregation("_popup");if(e){e._afterAdjustPositionAndArrowHook=function(){var t=this.$("arrow"),e=this.$().position().top,o=t.position().top,i=15,n=jQuery(window).height(),s=e+o-i;if(n>s+this.$().height()){t.css("top",i+"px");this.$().css("top",s+"px")}}}};b.prototype.instantClose=function(){var t=this._oPopover.getAggregation("_popup");if(t&&t.oPopup&&t.oPopup.close){t.oPopup.close(0)}if(this._oSimpleTooltip.oPopup&&this._oSimpleTooltip.oPopup.close){this._oSimpleTooltip.oPopup.close(0)}};b.prototype.close=function(){this._oPopover.close()};b.prototype.openDetail=function(t){var e=t.opener||this._getOpener(t.item,t.point);if(t.item instanceof o&&!t.item._hasDetailData()){this._oSimpleTooltip.removeAllContent();this._appendHeader(t.item.getTitle(),this._oSimpleTooltip);this._oSimpleTooltip.openBy(e);return}this._fnCreate=this._createDetail;this._oElement=t.item;this._oPopover.openBy(e)};b.prototype._createDetail=function(){var t=this._getTooltipCreateFunction(this._oElement);this._oPopover.removeAllContent();this._appendFooter();t(this._oElement)};b.prototype.openLink=function(t){this._oElement=t.item;this._fnCreate=this._createLink;this._oPopover.openBy(t.opener)};b.prototype._createLink=function(t){var e=new p,o=this._oElement;this._oPopover.removeAllContent();this._appendHeader(S.getText("NETWORK_GRAPH_TOOLTIP_EXTERNAL_LINKS"));o.getActionLinks().forEach(function(t){e.addItem(new l({content:[new h({renderType:"Bare",items:t.clone(null,null,{cloneChildren:true,cloneBindings:false}).addStyleClass("sapUiTinyMargin")})]}))});this._oPopover.addContent(e);this._appendFooter()};b.prototype._getOpener=function(t,o){if(t instanceof e&&o){if(this._oElement===t&&this._tooltipRect){var i=parseInt(this._tooltipRect.getAttribute("x"),10),n=parseInt(this._tooltipRect.getAttribute("y"),10),s=10;if(Math.abs(i-o.x)<s&&Math.abs(n-o.y)<s){return this._tooltipRect}}this._cleanUpLineTooltip();this._tooltipRect=this._createElement("rect",{x:o.x,y:o.y,width:y.browser.firefox?.01:0,height:y.browser.firefox?.01:0});this.getParent().$svg.append(this._tooltipRect);return this._tooltipRect}return t};b.prototype._getTooltipCreateFunction=function(t){if(t instanceof o){return this._createNodeTooltip.bind(this)}if(t instanceof e){return this._createLineTooltip.bind(this)}if(t instanceof i){return this._createGroupTooltip.bind(this)}return null};b.prototype._cleanUpLineTooltip=function(){if(this._tooltipRect){jQuery(this._tooltipRect).remove()}};b.prototype._appendDescription=function(t,e){if(t.getDescription()){e=e||this._oPopover;e.addContent(new _({content:new f({textAlign:"Initial",text:t.getDescription()}).addStyleClass("sapSuiteUiCommonsNetworkTooltipDescription")}).addStyleClass("sapSuiteUiCommonsNetworkTooltipArea"))}};b.prototype._appendAttributes=function(t,e){var o=new p,i=e||this._oPopover;if(t.length>0){t.forEach(function(t){o.addItem(new l({content:[new h({items:[new f({layoutData:[new w({baseSize:"50%"})],text:t.getLabel()}),new f({layoutData:[new w({baseSize:"50%"})],text:t.getValue(),width:"100%",textAlign:C.TextAlign.End})]}).addStyleClass("sapSuiteUiCommonsNetworkTooltipLine")]}));i.addContent(o)})}};b.prototype._appendNodesList=function(t,e){var o=new p;t.aNodes.forEach(function(t){if(t.getTitle()){o.addItem(new m({title:t.getTitle(),icon:t.getIcon()}))}});e.addContent(o)};b.prototype._appendFooter=function(){var t=this;this.oCloseButton=new a({text:S.getText("NETWORK_GRAPH_CLOSE"),press:function(){t._oPopover.close()}});this._oPopover.setEndButton(this.oCloseButton);this._oPopover.setInitialFocus(this.oCloseButton)};b.prototype._appendHeader=function(t,e){e=e||this._oPopover;if(t){var o=new f({width:"100%",textAlign:C.TextAlign.Center,text:t});e.insertContent(new _({width:"100%",content:[o]}).addStyleClass("sapSuiteUiCommonsNetworkTooltipArea"),0);e.addAriaLabelledBy(o)}};b.prototype._createGroupTooltip=function(t){var e=function(){return t.getAttributes().length>0||t.getDescription()};var o,i;this._appendHeader(t.getTitle());if(e()){i=new u({text:S.getText("NETWORK_GRAPH_TOOLTIP_LIST_OF_NODES")});o=new u({text:S.getText("NETWORK_GRAPH_TOOLTIP_INFORMATION")});this._oPopover.addContent(new c({items:[o,i]}));this._oPopover.addStyleClass("sapSuiteUiCommonsNetworkGroupTooltipTabBar");this._appendDescription(t,o);this._appendAttributes(t.getAttributes(),o);this._appendNodesList(t,i)}else{this._appendNodesList(t,this._oPopover)}};b.prototype._createNodeTooltip=function(t){this._appendDescription(t);this._appendAttributes(t.getAttributes());this._appendHeader(t.getTitle())};b.prototype._createLineTooltip=function(t,e){var o=function(){var e=new f({width:"50%",text:t.getFromNode().getTitle()}).addStyleClass("sapSuiteUiCommonsNetworkGraphNoPointerEvents sapSuiteUiCommonsNetworkLineTooltipLabel"),o=new g({src:"sap-icon://arrow-right"}).addStyleClass("sapUiTinyMarginEnd sapSuiteUiCommonsNetworkGraphNoPointerEvents sapSuiteUiCommonsNetworkLineTooltipFromToIcon"),i=new g({src:"sap-icon://arrow-left"}).addStyleClass("sapUiTinyMarginBegin sapSuiteUiCommonsNetworkGraphNoPointerEvents sapSuiteUiCommonsNetworkLineTooltipFromToIcon"),n=new f({textAlign:C.TextAlign.End,width:"50%",text:t.getToNode().getTitle()}).addStyleClass("sapSuiteUiCommonsNetworkGraphNoPointerEvents sapSuiteUiCommonsNetworkLineTooltipLabel"),s=new d({renderType:"Bare",width:"100%",justifyContent:"Center",items:[e]}).addStyleClass("sapSuiteUiCommonsNetworkLineTooltipFromTo");t._isBothArrow()?s.addItem(i):o.addStyleClass("sapUiTinyMarginBegin");s.addItem(o);s.addItem(n);return s},i=function(){var e=t.getTitle();this._oPopover.addContent(o());if(e){this._appendHeader(e)}this._appendDescription(t);this._appendAttributes(t.getAttributes())}.bind(this);i(t)};return b});
//# sourceMappingURL=Tooltip.js.map