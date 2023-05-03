/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["./Overlay","./library","./OverlayContainerRenderer","sap/ui/dom/jquery/Focusable"],function(e,t,o){"use strict";var s=e.extend("sap.ui.ux3.OverlayContainer",{metadata:{deprecated:true,library:"sap.ui.ux3",defaultAggregation:"content",aggregations:{content:{type:"sap.ui.core.Control",multiple:true,singularName:"content"}}}});s.prototype._setFocusLast=function(){var e=this.$("content").lastFocusableDomRef();if(!e&&this.getCloseButtonVisible()){e=this.getDomRef("close")}else if(!e&&this.getOpenButtonVisible()){e=this.getDomRef("openNew")}if(e){e.focus()}};s.prototype._setFocusFirst=function(){if(this.getOpenButtonVisible()){if(this.getDomRef("openNew")){this.getDomRef("openNew").focus()}}else if(this.getCloseButtonVisible()){if(this.getDomRef("close")){this.getDomRef("close").focus()}}else{if(this.$("content").firstFocusableDomRef()){this.$("content").firstFocusableDomRef().focus()}}};return s});
//# sourceMappingURL=OverlayContainer.js.map