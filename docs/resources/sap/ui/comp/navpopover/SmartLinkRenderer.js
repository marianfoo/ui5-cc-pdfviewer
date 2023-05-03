/*!
 * SAPUI5
 * (c) Copyright 2009-2022 SAP SE. All rights reserved.
 */
sap.ui.define(["sap/ui/core/Renderer","sap/m/LinkRenderer","sap/base/strings/whitespaceReplacer"],function(e,t,n){"use strict";var r=e.extend(t);r.apiVersion=2;r.render=function(e,n){var r=true;if(n.getIgnoreLinkRendering()){var a=n._getInnerControl();if(a){e.openStart("div",n);e.openEnd();e.renderControl(a);e.close("div");r=false}}if(r){if(!n.getAriaLabelledBy()||Array.isArray(n.getAriaLabelledBy())&&n.getAriaLabelledBy().length==0){n.addAriaLabelledBy(n)}t.render.apply(this,arguments)}};r.writeText=function(e,t){var r=n(t.getText());if(!t.getUom()){e.text(r);return}e.openStart("span");e.openEnd();e.text(r);e.close("span");e.openStart("span");e.style("display","inline-block");e.style("min-width","2.5em");e.style("width","3.0em");e.style("text-align","start");e.openEnd();e.text(t.getUom());e.close("span")};return r},true);
//# sourceMappingURL=SmartLinkRenderer.js.map