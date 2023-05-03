/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/base/security/encodeXML"],function(t){"use strict";var e={};e.render=function(e,r){e.write("<div");e.writeControlData(r);e.addClass("sapUiUx3ExactBrwsr");e.writeClasses();e.writeAttribute("role","region");if(r.getShowHeader()){e.writeAttribute("aria-labelledby",r.getId()+"-hdtitle")}if(r.getFollowUpControl()){e.writeAttribute("aria-controls",r.getFollowUpControl())}var i=r.getTooltip_AsString();if(i){e.writeAttributeEscaped("title",i)}e.write(">");if(r.getShowHeader()){e.write('<div class="sapUiUx3ExactBrwsrHd"><h2 id="'+r.getId()+'-hdtitle">');e.write(t(r.getHeaderTitle()));e.write('</h2><div class="sapUiUx3ExactBrwsrHdTool" role="toolbar">');if(r.getEnableSave()){e.renderControl(r._saveButton)}if(r.getEnableReset()){e.renderControl(r._resetButton)}e.write("</div></div>")}e.renderControl(r._rootList);e.write("</div>")};return e},true);
//# sourceMappingURL=ExactBrowserRenderer.js.map