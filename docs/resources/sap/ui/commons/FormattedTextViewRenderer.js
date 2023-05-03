/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/base/Log"],function(e){"use strict";var t={};t.render=function(t,r){var n=/<embed\s+data-index="([0-9]+)"\s*\/?>/gim;var i=r.getHtmlText();var a=r.getControls().slice();var l=a.length;var s=0;var o=[];t.write("<span");t.writeControlData(r);t.addClass("sapUiFTV");t.writeClasses();if(r.getTooltip_AsString()){t.writeAttributeEscaped("title",r.getTooltip_AsString())}t.write(">");while((o=n.exec(i))!==null){t.write(i.slice(s,o.index));if(this._renderReplacement(t,o[1],a)){l--}else{e.warning("Could not find matching control to placeholder #"+o[1])}s=n.lastIndex}t.write(i.slice(s,i.length));if(l>0){e.warning("There are leftover controls in the aggregation that have not been used in the formatted text",r)}t.write("</span>")};t._renderReplacement=function(e,t,r){if(r[t]){e.renderControl(r[t]);r[t]=null;return true}else{return false}};return t},true);
//# sourceMappingURL=FormattedTextViewRenderer.js.map