/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define([],function(){"use strict";var e={};e.render=function(e,t){e.write("<div");e.writeControlData(t);e.addClass("sapUiUx3DSSV");if(t.getFloating()){if(t.getResponsive()){e.addClass("sapUiUx3DSSVResponsive")}else{e.addClass("sapUiUx3DSSVFloating")}}else{e.addClass("sapUiUx3DSSVSingleRow")}if(t.getHeight()){e.addStyle("height",t.getHeight());e.addClass("sapUiUx3DSSVSA")}e.writeClasses();e.writeStyles();e.write(">");if(t.items){for(var i=0;i<t.items.length;i++){this.renderItem(e,t,t.items[i])}}e.write("</div>")};e.renderItem=function(e,t,i){e.write("<div");e.addClass("sapUiUx3DSSVItem");if(t.getFloating()){e.addClass("sapUiUx3DSSVFlow");if(t.getItemMinWidth()>0){e.writeAttribute("style","min-width:"+t.getItemMinWidth()+"px")}}if(t.isItemSelected(i)){e.addClass("sapUiUx3DSSVSelected")}e.writeClasses();e.writeElementData(i);e.write(">");e.renderControl(i.getAggregation("_template"));e.write("</div>")};return e},true);
//# sourceMappingURL=DataSetSimpleViewRenderer.js.map