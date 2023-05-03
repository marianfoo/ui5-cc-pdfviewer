/*!
 * SAPUI5
 * (c) Copyright 2009-2022 SAP SE. All rights reserved.
 */
sap.ui.define(["sap/ui/Device","sap/m/library","./library","sap/base/Log","sap/suite/ui/microchart/MicroChartRenderUtils","sap/ui/core/theming/Parameters"],function(e,t,r,i,a,n){"use strict";var s=t.ValueColor;var _={apiVersion:2};_.FORM_RATIO=100;_.BACKGROUND_CIRCLE_BORDER_WIDTH=1;_.BACKGROUND_CIRCLE_RADIUS=_.FORM_RATIO/2-_.BACKGROUND_CIRCLE_BORDER_WIDTH/2;_.RING_WIDTH=8.75;_.RING_CORE_RADIUS=_.BACKGROUND_CIRCLE_RADIUS-_.RING_WIDTH/2-_.BACKGROUND_CIRCLE_BORDER_WIDTH;_.SVG_VIEWBOX_CENTER_FACTOR="50%";_.X_ROTATION=0;_.SWEEP_FLAG=1;_.PADDING_WIDTH=.22;_.NUMBER_FONT_SIZE=23.5;_.EDGE_CASE_SIZE_USE_SMALL_FONT=54;_.EDGE_CASE_SIZE_SHOW_TEXT=46;_.EDGE_CASE_SIZE_MICRO_CHART=24;_.render=function(e,t){if(!t._bThemeApplied){return}if(t._hasData()){this._writeDivStartElement(t,e);this._writeOuterContainerElement(t,e);e.close("div")}else{this._renderNoData(e,t)}};_._writeOuterContainerElement=function(e,t){this._writeDivVerticalContainerElement(e,t);this._writeDivInnerContainerElement(e,t);if(this._renderingOfInnerContentIsRequired(e)){this._writeLabelInside(e,t)}this._writeSVGStartElement(e,t);this._writeBackground(t);if(this._renderingOfInnerContentIsRequired(e)){this._writeBorders(t);if(this._innerCircleRequired(e)){this._writeCircle(e,t)}else{this._writeCircleWithPathElements(e,t)}}t.close("svg");t.close("div");if(this._renderingOfInnerContentIsRequired(e)){this._writeLabelOutside(e,t)}t.close("div")};_._writeMainProperties=function(e,t){var r=t.hasListeners("press");this._renderActiveProperties(e,t);var i=t.getTooltip_AsString(r);e.attr("role","figure");if(t.getAriaLabelledBy().length){e.accessibilityState(t)}else{e.attr("aria-label",i)}e.class("sapSuiteRMC");e.class("sapSuiteRMCSize"+t.getSize());e.style("width",t.getWidth());e.style("height",t.getHeight())};_._writeDivStartElement=function(e,t){t.openStart("div",e);this._writeMainProperties(t,e);t.openEnd()};_._writeDivVerticalContainerElement=function(e,t){t.openStart("div");t.class("sapSuiteRMCVerticalAlignmentContainer");t.class("sapSuiteRMCAlign"+e.getAlignContent());t.openEnd()};_._writeDivInnerContainerElement=function(e,t){t.openStart("div");t.class("sapSuiteRMCInnerContainer");t.openEnd()};_._writeSVGStartElement=function(e,t){t.openStart("svg");t.class("sapSuiteRMCSvg");t.attr("focusable",false);t.attr("viewBox","0 0 "+_.FORM_RATIO+" "+_.FORM_RATIO);t.attr("version","1.1");t.attr("xmlns","http://www.w3.org/2000/svg");t.openEnd()};_._writeBackground=function(e){e.openStart("circle");e.class("sapSuiteRMCCircleBackground");e.attr("cx",_.SVG_VIEWBOX_CENTER_FACTOR);e.attr("cy",_.SVG_VIEWBOX_CENTER_FACTOR);e.attr("r",_.BACKGROUND_CIRCLE_RADIUS);e.attr("stroke-width",this.BACKGROUND_CIRCLE_BORDER_WIDTH);e.openEnd().close("circle")};_._writeBorders=function(e){var t=_.RING_CORE_RADIUS+_.RING_WIDTH/2-_.BACKGROUND_CIRCLE_BORDER_WIDTH/2,r=_.RING_CORE_RADIUS-_.RING_WIDTH/2+_.BACKGROUND_CIRCLE_BORDER_WIDTH/2;e.openStart("circle");e.class("sapSuiteRMCRing");e.attr("cx",_.SVG_VIEWBOX_CENTER_FACTOR);e.attr("cy",_.SVG_VIEWBOX_CENTER_FACTOR);e.attr("r",t);e.attr("stroke-width",_.BACKGROUND_CIRCLE_BORDER_WIDTH);e.openEnd().close("circle");e.openStart("circle");e.class("sapSuiteRMCRing");e.attr("cx",_.SVG_VIEWBOX_CENTER_FACTOR);e.attr("cy",_.SVG_VIEWBOX_CENTER_FACTOR);e.attr("r",r);e.attr("stroke-width",_.BACKGROUND_CIRCLE_BORDER_WIDTH);e.openEnd().close("circle")};_._writeCircle=function(e,t){var r=this._getFullCircleColor(e);t.openStart("circle");if(e._isValueColorValid()||r==="sapSuiteRMCRemainingCircle"){t.class(r)}else{t.attr("stroke",n.get(r)||r)}t.attr("cx",_.SVG_VIEWBOX_CENTER_FACTOR);t.attr("cy",_.SVG_VIEWBOX_CENTER_FACTOR);t.attr("r",_.RING_CORE_RADIUS);t.attr("fill","transparent");t.attr("stroke-width",_.RING_WIDTH+"px");t.openEnd().close("circle")};_._writeCircleWithPathElements=function(e,t){var r=e.getPercentage()>50?1:0;var i=this._getPercentageForCircleRendering(e)-_.PADDING_WIDTH;var a=this._calculatePathCoordinates(e,i,false);this._writePath1(r,a,e,t);i=this._getPercentageForCircleRendering(e)+_.PADDING_WIDTH;a=this._calculatePathCoordinates(e,i,true);this._writePath2(r,a,e,t)};_._writePath1=function(e,t,r,i){var a="M"+t[0]+" "+t[1]+" A "+_.RING_CORE_RADIUS+" "+_.RING_CORE_RADIUS+", "+_.X_ROTATION+", "+e+", "+_.SWEEP_FLAG+", "+t[2]+" "+t[3];var s=this._getPathColor(r);i.openStart("path");i.class("sapSuiteRMCPath");if(r._isValueColorValid()||s==="sapSuiteRMCRemainingCircle"){i.class(s)}else{i.attr("stroke",n.get(s)||s)}i.attr("d",a);i.attr("fill","transparent");i.attr("stroke-width",_.RING_WIDTH+"px");i.openEnd().close("path")};_._writePath2=function(e,t,r,i){var a="M"+t[2]+" "+t[3]+" A "+_.RING_CORE_RADIUS+" "+_.RING_CORE_RADIUS+", "+_.X_ROTATION+", "+(1-e)+", "+_.SWEEP_FLAG+", "+t[0]+" "+t[1];i.openStart("path");i.class("sapSuiteRMCPath");i.class("sapSuiteRMCRemainingCircle");i.attr("d",a);i.attr("fill","transparent");i.attr("stroke-width",_.RING_WIDTH+"px");i.openEnd().close("path")};_._writeLabelInside=function(e,t){t.openStart("div");t.class("sapSuiteRMCInsideLabel");t.class("sapSuiteRMCFont");t.class(this._getTextColorClass(e));t.openEnd();t.unsafeHtml(this._generateTextContent(e));t.close("div")};_._writeLabelOutside=function(e,t){t.openStart("div");t.class("sapSuiteRMCOutsideLabel");t.class("sapSuiteRMCFont");t.class("sapSuiteRMCLabelHide");t.class(this._getTextColorClass(e));t.openEnd();t.unsafeHtml(this._generateTextContent(e));t.close("div")};_._renderingOfInnerContentIsRequired=function(e){return e._hasData()};_._getVerticalViewboxCenterFactorForText=function(){if(e.browser.msie||e.browser.mozilla||e.browser.edge){return"57%"}else{return"51%"}};_._innerCircleRequired=function(e){return e.getPercentage()>=100||e.getPercentage()<=0};_._calculatePathCoordinates=function(e,t,r){var i=[];var a=0;var n=_.FORM_RATIO/2;if(r){a=2*_.PADDING_WIDTH/100*2*Math.PI}i.push(n+_.RING_CORE_RADIUS*Math.cos(-Math.PI/2-a));i.push(n+_.RING_CORE_RADIUS*Math.sin(-Math.PI/2-a));i.push(n+_.RING_CORE_RADIUS*Math.cos(-Math.PI/2+t/100*2*Math.PI));i.push(n+_.RING_CORE_RADIUS*Math.sin(-Math.PI/2+t/100*2*Math.PI));return i};_._getPercentageForCircleRendering=function(e){var t=e.getPercentage();var r=t;if(t>99-_.PADDING_WIDTH){r=99-_.PADDING_WIDTH}if(t<1+_.PADDING_WIDTH){r=1+_.PADDING_WIDTH}return r};_._getTextColorClass=function(e){switch(e.getValueColor()){case s.Good:return"sapSuiteRMCGoodTextColor";case s.Error:return"sapSuiteRMCErrorTextColor";case s.Critical:return"sapSuiteRMCCriticalTextColor";default:return"sapSuiteRMCNeutralTextColor"}};_._getFullCircleColor=function(e){if(e.getPercentage()>=100){return this._getPathColor(e)}if(e.getPercentage()<=0){return"sapSuiteRMCRemainingCircle"}};_._getPathColor=function(e){var t=e.getValueColor();if(e._isValueColorValid()){switch(t){case s.Good:return"sapSuiteRMCPathGood";case s.Error:return"sapSuiteRMCPathError";case s.Critical:return"sapSuiteRMCPathCritical";default:return"sapSuiteRMCPathNeutral"}}else{return t}};_._generateTextContent=function(e){if(e.getPercentage()===100){return e._oRb.getText("RADIALMICROCHART_PERCENTAGE_TEXT",[100])}if(e.getPercentage()===0){return e._oRb.getText("RADIALMICROCHART_PERCENTAGE_TEXT",[0])}if(e.getPercentage()>=100){i.error("Values over 100%("+e.getPercentage()+"%) are not supported");return e._oRb.getText("RADIALMICROCHART_PERCENTAGE_TEXT",[100])}if(e.getPercentage()<=0){i.error("Values below 0%("+e.getPercentage()+"%) are not supported");return e._oRb.getText("RADIALMICROCHART_PERCENTAGE_TEXT",[0])}return e._oRb.getText("RADIALMICROCHART_PERCENTAGE_TEXT",[e.getPercentage()])};a.extendMicroChartRenderer(_);return _},true);
//# sourceMappingURL=RadialMicroChartRenderer.js.map