/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define([],function(){"use strict";var t={};t.render=function(t,e){t.write("<img");t.writeControlData(e);t.writeAttributeEscaped("src",e.getSrc()||sap.ui.require.toUrl("sap/ui/commons/img/1x1.gif"));t.addClass("sapUiImg");if(e.hasListeners("press")){t.addClass("sapUiImgWithHandler")}if(!e.getSrc()){t.addClass("sapUiImgNoSource")}t.writeClasses();var i=e.getTooltip_AsString();if(i){t.writeAttributeEscaped("title",i)}var r=e.getUseMap();if(r){if(!r.startsWith("#")){r="#"+r}t.writeAttributeEscaped("usemap",r)}var s=0;if(e.getDecorative()&&!r){s=-1;t.writeAttribute("role","presentation");t.write(" alt=''")}else{if(e.getAlt()){t.writeAttributeEscaped("alt",e.getAlt()||i)}else if(i){t.writeAttributeEscaped("alt",i)}}t.writeAttribute("tabindex",s);var a="";if(e.getWidth()&&e.getWidth()!=""){a+="width:"+e.getWidth()+";"}if(e.getHeight()&&e.getHeight()!=""){a+="height:"+e.getHeight()+";"}if(a!=""){t.writeAttribute("style",a)}t.write(">")};return t},true);
//# sourceMappingURL=ImageRenderer.js.map