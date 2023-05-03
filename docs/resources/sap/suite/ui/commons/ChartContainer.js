/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define(["sap/ui/thirdparty/jquery","./library","sap/m/library","sap/viz/library","sap/ui/base/ManagedObject","sap/m/Button","sap/m/OverflowToolbar","sap/m/OverflowToolbarButton","sap/m/SegmentedButton","sap/m/Title","sap/m/ToolbarSpacer","sap/ui/Device","sap/ui/core/Control","sap/ui/core/CustomData","sap/ui/core/ResizeHandler","sap/ui/core/delegate/ScrollEnablement","sap/m/ToggleButton","sap/m/OverflowToolbarToggleButton","sap/base/util/uid","sap/base/Log","./ChartContainerRenderer","sap/suite/ui/commons/util/FullScreenUtil"],function(jQuery,t,e,o,i,n,s,r,a,l,h,u,g,c,d,p,_,f,m,S,C,b){"use strict";var y=e.ButtonType;var B=g.extend("sap.suite.ui.commons.ChartContainer",{metadata:{library:"sap.suite.ui.commons",properties:{showPersonalization:{type:"boolean",group:"Misc",defaultValue:false},showFullScreen:{type:"boolean",group:"Misc",defaultValue:false},fullScreen:{type:"boolean",group:"Misc",defaultValue:false},showLegend:{type:"boolean",group:"Misc",defaultValue:true},title:{type:"string",group:"Misc",defaultValue:""},selectorGroupLabel:{type:"string",group:"Misc",defaultValue:null,deprecated:true},autoAdjustHeight:{type:"boolean",group:"Misc",defaultValue:false},showZoom:{type:"boolean",group:"Misc",defaultValue:true},showLegendButton:{type:"boolean",group:"Misc",defaultValue:true},showSelectionDetails:{type:"boolean",group:"Behavior",defaultValue:false},wrapLabels:{type:"boolean",group:"Misc",defaultValue:false},enableScroll:{type:"boolean",group:"Misc",defaultValue:true},width:{type:"sap.ui.core.CSSSize",defaultValue:"100%"}},defaultAggregation:"content",aggregations:{dimensionSelectors:{type:"sap.ui.core.Control",multiple:true,singularName:"dimensionSelector"},content:{type:"sap.suite.ui.commons.ChartContainerContent",multiple:true,singularName:"content"},toolbar:{type:"sap.m.OverflowToolbar",multiple:false},customIcons:{type:"sap.ui.core.Icon",multiple:true,singularName:"customIcon"}},events:{personalizationPress:{},contentChange:{parameters:{selectedItemId:{type:"string"}}},customZoomInPress:{},customZoomOutPress:{}}}});B.prototype.init=function(){this._aUsedContentIcons=[];this._aCustomIcons=[];this._oToolBar=null;this._aDimensionSelectors=[];this._bChartContentHasChanged=false;this._bControlNotRendered=true;this._bSegmentedButtonSaveSelectState=false;this._mOriginalVizFrameHeights={};this._oActiveChartButton=null;this._oSelectedContent=null;this._sResizeListenerId=null;this._bHasApplicationToolbar=false;this._iPlaceholderPosition=0;this._oResBundle=sap.ui.getCore().getLibraryResourceBundle("sap.suite.ui.commons");this._oFullScreenButton=new f({icon:"sap-icon://full-screen",type:y.Transparent,text:this._oResBundle.getText("CHARTCONTAINER_FULLSCREEN"),tooltip:this._oResBundle.getText("CHARTCONTAINER_FULLSCREEN"),press:this._onFullScreenButtonPress.bind(this)});this._oShowLegendButton=new _({icon:"sap-icon://legend",type:y.Transparent,tooltip:this._oResBundle.getText("CHARTCONTAINER_LEGEND"),press:this._onShowLegendButtonPress.bind(this)});this._oPersonalizationButton=new r({icon:"sap-icon://action-settings",type:y.Transparent,text:this._oResBundle.getText("CHARTCONTAINER_PERSONALIZE"),tooltip:this._oResBundle.getText("CHARTCONTAINER_PERSONALIZE"),press:this._onPersonalizationButtonPress.bind(this)});this._oZoomInButton=new r({icon:"sap-icon://zoom-in",type:y.Transparent,text:this._oResBundle.getText("CHARTCONTAINER_ZOOMIN"),tooltip:this._oResBundle.getText("CHARTCONTAINER_ZOOMIN"),press:this._zoom.bind(this,true)});this._oZoomOutButton=new r({icon:"sap-icon://zoom-out",type:y.Transparent,text:this._oResBundle.getText("CHARTCONTAINER_ZOOMOUT"),tooltip:this._oResBundle.getText("CHARTCONTAINER_ZOOMOUT"),press:this._zoom.bind(this,false)});this._oChartSegmentedButton=new a({select:this._onChartSegmentButtonSelect.bind(this),width:"auto"});this._oChartTitle=new l};B.prototype.onAfterRendering=function(){this._sResizeListenerId=d.register(this,this._performHeightChanges.bind(this));if(!u.system.desktop){u.resize.attachHandler(this._performHeightChanges,this)}if(this.getAutoAdjustHeight()||this.getFullScreen()){setTimeout(function(){var t=this._performHeightChanges.bind(this);if(typeof t==="string"||t instanceof String){t=this[t]}t.apply(this,[])}.bind(this),500)}var t=this.getSelectedContent(),e=false,o;if(t){o=t.getContent();e=o&&o.getMetadata().getName()==="sap.viz.ui5.controls.VizFrame"}if(this.getEnableScroll()){this._oScrollEnablement=new p(this,this.getId()+"-wrapper",{horizontal:!e,vertical:!e})}this._bControlNotRendered=false;if(this.getTitle()&&(this.getToolbar().getContent().length===2&&this.getToolbar().getContent()[0]instanceof sap.m.Title)){this.getToolbar().setActive(true)}};B.prototype.onBeforeRendering=function(){if(this._sResizeListenerId){d.deregister(this._sResizeListenerId);this._sResizeListenerId=null}if(!u.system.desktop){u.resize.detachHandler(this._performHeightChanges,this)}if(this._bChartContentHasChanged||this._bControlNotRendered){this._chartChange()}var t=this._aCustomIcons;this._aCustomIcons=[];var e=this.getAggregation("customIcons");if(e&&e.length>0){for(var o=0;o<e.length;o++){this._addButtonToCustomIcons(e[o])}}if(this._bControlNotRendered){if(!this.getToolbar()){this.setAggregation("toolbar",new s({design:"Transparent"}))}}this._adjustDisplay();this._destroyButtons(t);var i=this.getSelectedContent();if(i){var n=i.getContent();if(n&&n.attachRenderComplete){n.detachRenderComplete(this._checkZoomIcons,this);n.attachRenderComplete(this._checkZoomIcons,this)}}this._oShowLegendButton.setPressed(this.getShowLegend())};B.prototype.exit=function(){if(this._oFullScreenButton){this._oFullScreenButton.destroy();this._oFullScreenButton=undefined}if(this._oFullScreenUtil){this._oFullScreenUtil.cleanUpFullScreen(this)}if(this._oShowLegendButton){this._oShowLegendButton.destroy();this._oShowLegendButton=undefined}if(this._oPersonalizationButton){this._oPersonalizationButton.destroy();this._oPersonalizationButton=undefined}if(this._oActiveChartButton){this._oActiveChartButton.destroy();this._oActiveChartButton=undefined}if(this._oChartSegmentedButton){this._oChartSegmentedButton.destroy();this._oChartSegmentedButton=undefined}if(this._oSelectedContent){this._oSelectedContent.destroy();this._oSelectedContent=undefined}if(this._oToolBar){this._oToolBar.destroy();this._oToolBar=undefined}if(this._oToolbarSpacer){this._oToolbarSpacer.destroy();this._oToolbarSpacer=undefined}if(this._aDimensionSelectors){for(var t=0;t<this._aDimensionSelectors.length;t++){if(this._aDimensionSelectors[t]){this._aDimensionSelectors[t].destroy()}}this._aDimensionSelectors=undefined}if(this._oScrollEnablement){this._oScrollEnablement.destroy();this._oScrollEnablement=undefined}if(this._sResizeListenerId){d.deregister(this._sResizeListenerId);this._sResizeListenerId=null}if(!u.system.desktop){u.resize.detachHandler(this._performHeightChanges,this)}if(this._oZoomInButton){this._oZoomInButton.destroy();this._oZoomInButton=undefined}if(this._oZoomOutButton){this._oZoomOutButton.destroy();this._oZoomOutButton=undefined}};B.prototype._onButtonIconPress=function(t){var e=t.getSource().getCustomData()[0].getValue();this._switchChart(e)};B.prototype._onFullScreenButtonPress=function(t){if(t.getParameter("pressed")===true){this._oFullScreenButton.setTooltip(this._oResBundle.getText("CHARTCONTAINER_FULLSCREEN_CLOSE"));this._oFullScreenButton.setText(this._oResBundle.getText("CHARTCONTAINER_FULLSCREEN_CLOSE"));this._oFullScreenButton.setIcon("sap-icon://exit-full-screen")}else{this._oFullScreenButton.setTooltip(this._oResBundle.getText("CHARTCONTAINER_FULLSCREEN"));this._oFullScreenButton.setText(this._oResBundle.getText("CHARTCONTAINER_FULLSCREEN"));this._oFullScreenButton.setIcon("sap-icon://full-screen")}this._bSegmentedButtonSaveSelectState=true;this._toggleFullScreen();this._oFullScreenButton.focus()};B.prototype._onShowLegendButtonPress=function(t){this._bSegmentedButtonSaveSelectState=true;this._onLegendButtonPress()};B.prototype._onChartSegmentButtonSelect=function(t){var e=t.getParameter("button").getCustomData()[0].getValue();this._bSegmentedButtonSaveSelectState=true;this._switchChart(e)};B.prototype._onOverflowToolbarButtonPress=function(t,e){e.icon.firePress({controlReference:t.getSource()})};B.prototype._onLegendButtonPress=function(){var t=this.getSelectedContent();if(t){var e=t.getContent();if(jQuery.isFunction(e.getLegendVisible)){var o=e.getLegendVisible();e.setLegendVisible(!o);this.setShowLegend(!o)}else{this.setShowLegend(!this.getShowLegend())}}else{this.setShowLegend(!this.getShowLegend())}};B.prototype._checkZoomIcons=function(t){if(t.getSource()._getZoomInfo){var e=t.getSource()._getZoomInfo();if(e){this._manageZoomIcons(e.currentZoomLevel)}}};B.prototype._onPersonalizationButtonPress=function(){this.firePersonalizationPress()};B.prototype._setSelectedContent=function(t){var e;if(this.getSelectedContent()===t){return this}if(t===null){this._oShowLegendButton.setVisible(false);return this}var o=t.getContent();this._toggleShowLegendButtons(o);e=o&&o.getMetadata&&o.getMetadata().getName()==="sap.viz.ui5.controls.VizFrame";var i=e||jQuery.isFunction(o.setLegendVisible);if(this.getShowLegendButton()){this._oShowLegendButton.setVisible(i)}var n=this.getShowZoom()&&u.system.desktop&&e;this._oZoomInButton.setVisible(n);this._oZoomOutButton.setVisible(n);this._oSelectedContent=t;return this};B.prototype._getSelectionDetails=function(){var t=this.getSelectedContent();return t&&t._getSelectionDetails()};B.prototype._toggleShowLegendButtons=function(t){var e=t.getId();var o=null;for(var i=0;!o&&i<this._aUsedContentIcons.length;i++){if(this._aUsedContentIcons[i].getCustomData()[0].getValue()===e&&t.getVisible()===true){o=this._aUsedContentIcons[i];this._oChartSegmentedButton.setSelectedButton(o);break}}};B.prototype._setDefaultOnSegmentedButton=function(){if(!this._bSegmentedButtonSaveSelectState){this._oChartSegmentedButton.setSelectedButton(null)}this._bSegmentedButtonSaveSelectState=false};B.prototype._toggleFullScreen=function(){var t=this.getProperty("fullScreen");var e=function(t,e,o){this._oFullScreenButton.setIcon(t);this._oFullScreenButton.setText(e);this._oFullScreenButton.setTooltip(e);this._oFullScreenButton.setPressed(o)}.bind(this);var o;var i=this.getAggregation("content");if(t){this.setProperty("fullScreen",false,true);e("sap-icon://full-screen",this._oResBundle.getText("CHARTCONTAINER_FULLSCREEN"),false);for(var n=0;n<i.length;n++){o=i[n].getContent();o.setWidth("100%");if(typeof o.getHeight!=="undefined"){o.setHeight(this._sChartOriginalHeight)}}this.invalidate()}else{this.setProperty("fullScreen",true,true);e("sap-icon://exit-full-screen",this._oResBundle.getText("CHARTCONTAINER_FULLSCREEN_CLOSE"),true);for(var n=0;n<i.length;n++){o=i[n].getContent();o.setWidth("100%");if(typeof o.getHeight!=="undefined"){this._sChartOriginalHeight=o.getHeight()}}}t=!t;if(!this._oFullScreenUtil){this._oFullScreenUtil=b}this._oFullScreenUtil.toggleFullScreen(this,t,this._oFullScreenButton,this._toggleFullScreen)};B.prototype._performHeightChanges=function(){var t,e;if(this.getAutoAdjustHeight()||this.getFullScreen()){var o=this.$(),i,n,s;t=o.find(".sapSuiteUiCommonsChartContainerToolBarArea :first");e=o.find(".sapSuiteUiCommonsChartContainerChartArea :first");i=this.getSelectedContent();if(t[0]&&e[0]&&i){var r=o.height();var a=t.height();var l=Math.round(parseFloat(t.css("borderBottomWidth")));var h=r-a-l;var u=e.height();n=i.getContent();if(n){s=n.getMetadata().getName();if(s==="sap.viz.ui5.controls.VizFrame"||s==="sap.chart.Chart"){if(h>0&&h!==u){this._rememberOriginalHeight(n);n.setHeight(h+"px")}}else if(this.$("chartArea").innerWidth()&&n.$().innerWidth()!==this.$("chartArea").innerWidth()){this.rerender()}}}}};B.prototype._rememberOriginalHeight=function(t){var e;if(jQuery.isFunction(t.getHeight)){e=t.getHeight()}else{e=0}this._mOriginalVizFrameHeights[t.getId()]=e};B.prototype._switchChart=function(t){var e=this._findChartById(t);this._setSelectedContent(e);this.fireContentChange({selectedItemId:t});this.rerender()};B.prototype._chartChange=function(){var t=this.getContent();this._destroyButtons(this._aUsedContentIcons);this._aUsedContentIcons=[];if(this.getContent().length===0){this._oChartSegmentedButton.removeAllButtons();this._setDefaultOnSegmentedButton();this.switchChart(null)}if(t){var e=this.getShowLegend();var o;var i;for(var s=0;s<t.length;s++){if(!t[s].getVisible()){continue}o=t[s].getContent();if(jQuery.isFunction(o.setVizProperties)){o.setVizProperties({legend:{visible:e},sizeLegend:{visible:e}})}if(jQuery.isFunction(o.setWidth)){o.setWidth("100%")}if(jQuery.isFunction(o.setHeight)&&this._mOriginalVizFrameHeights[o.getId()]){o.setHeight(this._mOriginalVizFrameHeights[o.getId()])}i=new n({icon:t[s].getIcon(),type:y.Transparent,tooltip:t[s].getTitle(),customData:[new c({key:"chartId",value:o.getId()})],press:this._onButtonIconPress.bind(this)});this._aUsedContentIcons.push(i);if(s===0){this._setSelectedContent(t[s]);this._oActiveChartButton=i}}}this._bChartContentHasChanged=false};B.prototype._findChartById=function(t){var e=this.getAggregation("content");if(e){for(var o=0;o<e.length;o++){if(e[o].getContent().getId()===t){return e[o]}}}return null};B.prototype._getToolbarPlaceHolderPosition=function(t){var e;for(var o=0;o<t.getContent().length;o++){e=t.getContent()[o];if(e.getMetadata&&e.getMetadata().getName()==="sap.suite.ui.commons.ChartContainerToolbarPlaceholder"){return o}}return-1};B.prototype._addContentToolbar=function(t,e){if(!this._bHasApplicationToolbar){if(!e){this._oToolBar.addContent(t)}else{this._oToolBar.insertContent(t,e)}}else{if(t instanceof h){this._iPlaceholderPosition=this._getToolbarPlaceHolderPosition(this._oToolBar);return}if(e){this._iPlaceholderPosition=this._iPlaceholderPosition+e}this._oToolBar.insertContent(t,this._iPlaceholderPosition);this._iPlaceholderPosition=this._iPlaceholderPosition+1}};B.prototype._rearrangeToolbar=function(){var t=this._aToolbarContent.length;for(var e=0;e<t;e++){this._oToolBar.insertContent(this._aToolbarContent[e],e)}};B.prototype._adjustIconsDisplay=function(){if(this.getShowSelectionDetails()){this._addContentToolbar(this._getSelectionDetails())}if(this.getShowLegendButton()){this._addContentToolbar(this._oShowLegendButton)}if(this.getShowZoom()&&u.system.desktop){this._addContentToolbar(this._oZoomInButton);this._addContentToolbar(this._oZoomOutButton)}if(this.getShowPersonalization()){this._addContentToolbar(this._oPersonalizationButton)}if(this.getShowFullScreen()){this._addContentToolbar(this._oFullScreenButton)}var t=0;for(t;t<this._aCustomIcons.length;t++){this._addContentToolbar(this._aCustomIcons[t])}if(!this._bControlNotRendered){this._oChartSegmentedButton.removeAllButtons()}var e=this._aUsedContentIcons.length;if(e>1){for(t=0;t<e;t++){this._oChartSegmentedButton.addButton(this._aUsedContentIcons[t])}this._addContentToolbar(this._oChartSegmentedButton)}};B.prototype._adjustSelectorDisplay=function(){if(this._aDimensionSelectors.length===0){this._oChartTitle.setVisible(true);this._addContentToolbar(this._oChartTitle);return}for(var t=0;t<this._aDimensionSelectors.length;t++){if(jQuery.isFunction(this._aDimensionSelectors[t].setAutoAdjustWidth)){this._aDimensionSelectors[t].setAutoAdjustWidth(true)}this._addContentToolbar(this._aDimensionSelectors[t])}};B.prototype._adjustDisplay=function(){this._oToolBar=this.getToolbar();if(this._oToolbarSpacer){this._oToolBar.removeContent(this._oToolbarSpacer);this._oToolbarSpacer.destroy()}this._oToolBar.removeAllContent();this._oToolBar.setProperty("height","3rem",true);if(this._bHasApplicationToolbar){this._rearrangeToolbar();this._iPlaceholderPosition=0}this._adjustSelectorDisplay();this._oToolbarSpacer=new h;this._addContentToolbar(this._oToolbarSpacer);this._adjustIconsDisplay()};B.prototype._addButtonToCustomIcons=function(t){var e=t;var o=e.getTooltip();var i=new r({icon:e.getSrc(),text:o,tooltip:o,type:y.Transparent,visible:e.getVisible(),press:[{icon:e},this._onOverflowToolbarButtonPress.bind(this)]});this._aCustomIcons.push(i)};B.prototype._zoom=function(t){var e=this.getSelectedContent().getContent();if(e.getMetadata().getName()==="sap.viz.ui5.controls.VizFrame"){if(t){e.zoom({direction:"in"})}else{e.zoom({direction:"out"})}}if(t){this.fireCustomZoomInPress()}else{this.fireCustomZoomOutPress()}this._manageZoomIcons(e._getZoomInfo().currentZoomLevel)};B.prototype._manageZoomIcons=function(t){if(t===undefined){return}else if(t===null){this._oZoomOutButton.setEnabled(false);this._oZoomInButton.setEnabled(false)}else if(t===0){this._oZoomOutButton.setEnabled(false);this._oZoomInButton.setEnabled(true)}else if(t===1){this._oZoomInButton.setEnabled(false);this._oZoomOutButton.setEnabled(true)}else{if(this._oZoomOutButton.getEnabled()==false){this._oZoomOutButton.setEnabled(true)}if(this._oZoomInButton.getEnabled()==false){this._oZoomInButton.setEnabled(true)}}};B.prototype._destroyButtons=function(t){for(var e=0;e<t.length;e++){t[e].destroy()}};B.prototype._setShowLegendForAllCharts=function(t){var e=this.getContent();var o;for(var i=0;i<e.length;i++){o=e[i].getContent();if(jQuery.isFunction(o.setLegendVisible)){o.setLegendVisible(t)}else{S.info("ChartContainer: chart with id "+o.getId()+" is missing the setVizProperties property")}}};B.prototype.setFullScreen=function(t){if(this._bControlNotRendered){return this}if(this.getFullScreen()===t){return this}if(this.getProperty("fullScreen")!==t){this._toggleFullScreen()}return this};B.prototype.setTitle=function(t){if(this.getTitle()===t){return this}this._oChartTitle.setText(t);this.setProperty("title",t,true);return this};B.prototype.setShowLegendButton=function(t){if(this.getShowLegendButton()===t){return this}this.setProperty("showLegendButton",t,true);if(!this.getShowLegendButton()){this.setShowLegend(false)}return this};B.prototype.setSelectorGroupLabel=function(t){if(this.getSelectorGroupLabel()===t){return this}this.setProperty("selectorGroupLabel",t,true);return this};B.prototype.setShowLegend=function(t){if(this.getShowLegend()===t){return this}this.setProperty("showLegend",t,true);this._setShowLegendForAllCharts(t);return this};B.prototype.setWrapLabels=function(t){var e;if(this.getWrapLabels()!==t){this.setProperty("wrapLabels",t);e=this._getSelectionDetails();if(e){e.setWrapLabels(t)}}return this};B.prototype.setToolbar=function(t){if(!t||this._getToolbarPlaceHolderPosition(t)===-1){S.info("A placeholder of type 'sap.suite.ui.commons.ChartContainerToolbarPlaceholder' needs to be provided. Otherwise, the toolbar will be ignored");return this}if(this.getToolbar()!==t){this.setAggregation("toolbar",t)}if(this.getToolbar()){this._aToolbarContent=this.getToolbar().getContent();this._bHasApplicationToolbar=true}else{this._aToolbarContent=null;this._bHasApplicationToolbar=false}this.invalidate();return this};B.prototype.getDimensionSelectors=function(){return this._aDimensionSelectors};B.prototype.indexOfDimensionSelector=function(t){for(var e=0;e<this._aDimensionSelectors.length;e++){if(this._aDimensionSelectors[e]===t){return e}}return-1};B.prototype.addDimensionSelector=function(t){this._aDimensionSelectors.push(t);return this};B.prototype.insertDimensionSelector=function(t,e){if(!t){return this}var o;if(e<0){o=0}else if(e>this._aDimensionSelectors.length){o=this._aDimensionSelectors.length}else{o=e}if(o!==e){S.warning("ManagedObject.insertAggregation: index '"+e+"' out of range [0,"+this._aDimensionSelectors.length+"], forced to "+o)}this._aDimensionSelectors.splice(o,0,t);return this};B.prototype.destroyDimensionSelectors=function(){if(this._oToolBar){for(var t=0;t<this._aDimensionSelectors.length;t++){if(this._aDimensionSelectors[t]){this._oToolBar.removeContent(this._aDimensionSelectors[t]);this._aDimensionSelectors[t].destroy()}}}this._aDimensionSelectors=[];return this};B.prototype.removeDimensionSelector=function(t){if(!t){return null}if(this._oToolBar){this._oToolBar.removeContent(t)}var e=this.indexOfDimensionSelector(t);if(e===-1){return null}else{return this._aDimensionSelectors.splice(e,1)[0]}};B.prototype.removeAllDimensionSelectors=function(){var t=this._aDimensionSelectors.slice();if(this._oToolBar){for(var e=0;e<this._aDimensionSelectors.length;e++){if(this._aDimensionSelectors[e]){this._oToolBar.removeContent(this._aDimensionSelectors[e])}}}this._aDimensionSelectors=[];return t};B.prototype.addContent=function(t){this.addAggregation("content",t);this._bChartContentHasChanged=true;return this};B.prototype.insertContent=function(t,e){this.insertAggregation("content",t,e);this._bChartContentHasChanged=true;return this};B.prototype.updateContent=function(){this.updateAggregation("content");this._bChartContentHasChanged=true};B.prototype.addAggregation=function(t,e,o){if(t==="dimensionSelectors"){return this.addDimensionSelector(e)}else{return i.prototype.addAggregation.apply(this,arguments)}};B.prototype.getAggregation=function(t,e){if(t==="dimensionSelectors"){return this.getDimensionSelectors()}else{return i.prototype.getAggregation.apply(this,arguments)}};B.prototype.indexOfAggregation=function(t,e){if(t==="dimensionSelectors"){return this.indexOfDimensionSelector(e)}else{return i.prototype.indexOfAggregation.apply(this,arguments)}};B.prototype.insertAggregation=function(t,e,o,n){if(t==="dimensionSelectors"){return this.insertDimensionSelector(e,o)}else{return i.prototype.insertAggregation.apply(this,arguments)}};B.prototype.destroyAggregation=function(t,e){if(t==="dimensionSelectors"){return this.destroyDimensionSelectors()}else{return i.prototype.destroyAggregation.apply(this,arguments)}};B.prototype.removeAggregation=function(t,e,o){if(t==="dimensionSelectors"){return this.removeDimensionSelector(e)}else{return i.prototype.removeAggregation.apply(this,arguments)}};B.prototype.removeAllAggregation=function(t,e){if(t==="dimensionSelectors"){return this.removeAllDimensionSelectors()}else{return i.prototype.removeAllAggregation.apply(this,arguments)}};B.prototype.getSelectedContent=function(){return this._oSelectedContent};B.prototype.getScrollDelegate=function(){return this._oScrollEnablement};B.prototype.switchChart=function(t){this._setSelectedContent(t);this.rerender()};B.prototype.updateChartContainer=function(){this._bChartContentHasChanged=true;this.rerender();return this};B.prototype.setWidth=function(t){this.setProperty("width",t,true);this.$().css("width",this.getWidth());return this};return B});
//# sourceMappingURL=ChartContainer.js.map