/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["./TextFieldRenderer","sap/ui/core/Renderer","sap/ui/Device"],function(e,t,a){"use strict";var r=t.extend(e);r.renderInnerAttributes=function(e,t){if(a.support.input.placeholder||t.getValue()||!t.getPlaceholder()){e.writeAttribute("type","password")}};r.renderTextFieldEnabled=function(e,t){if(!t.getEnabled()&&!t.getEditable()){e.writeAttribute("readonly","readonly");e.writeAttribute("tabindex","-1")}else{e.writeAttribute("tabindex","0")}};r.setEnabled=function(e,t){var a=e.$();if(t){if(e.getEditable()){a.removeClass("sapUiTfDsbl").addClass("sapUiTfStd");a.removeAttr("readonly").attr("tabindex","0")}else{a.removeClass("sapUiTfDsbl").addClass("sapUiTfRo");a.attr("tabindex","0")}}else{if(e.getEditable()){a.removeClass("sapUiTfStd").addClass("sapUiTfDsbl");a.attr("readonly","readonly").attr("tabindex","-1")}else{a.removeClass("sapUiTfRo").addClass("sapUiTfDsbl");a.attr("tabindex","-1")}}};return r},true);
//# sourceMappingURL=PasswordFieldRenderer.js.map