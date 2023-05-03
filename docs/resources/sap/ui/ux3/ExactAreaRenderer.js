/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/commons/ToolbarRenderer","sap/base/security/encodeXML"],function(e,a){"use strict";var r={};r.render=function(r,i){r.write("<div");r.writeControlData(i);r.addClass("sapUiUx3ExactArea");r.writeClasses();r.write(">");if(i.getToolbarVisible()){r.write('<div id="'+i.getId()+'-tb" class="sapUiTb sapUiTbDesignFlat sapUiTbStandalone" role="toolbar">');r.write('<div class="sapUiTbCont"><div class="sapUiTbInner">');var t=i.getToolbarItems();for(var s=0;s<t.length;s++){var o=t[s];if(o instanceof sap.ui.commons.ToolbarSeparator){e.renderSeparator(r,o)}else if(o instanceof sap.ui.ux3.ExactAreaToolbarTitle){r.write('<div class="sapUiUx3ExactAreaTbTitle">'+a(o.getText())+"</div>")}else{r.renderControl(o)}}r.write("</div></div></div>")}r.write('<div id="'+i.getId()+'-ct" class="sapUiUx3ExactAreaCont">');var n=i.getContent();for(var s=0;s<n.length;s++){r.renderControl(n[s])}r.write("</div>");r.write("</div>")};return r},true);
//# sourceMappingURL=ExactAreaRenderer.js.map