/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["./ComboBoxRenderer","sap/ui/core/Renderer","sap/ui/core/library"],function(e,t,r){"use strict";var i=r.ValueState;var n=t.extend(e);n.renderExpander=function(e,t){if(!t.__sARIATXT){var r=sap.ui.getCore().getLibraryResourceBundle("sap.ui.commons");t.__sARIATXT=r.getText("AUTOCOMPLETE_ARIA_SUGGEST")}e.write('<span id="',t.getId(),'-ariaLbl" style="display:none;">',t.__sARIATXT,"</span>")};n.renderOuterAttributes=function(t,r){t.addClass("sapUiTfAutoComp");e.renderOuterAttributes.apply(this,arguments)};n.renderComboARIAInfo=function(e,t){var r={role:"textbox",owns:t.getId()+"-input "+t._getListBox().getId()};if(!t.getEnabled()){r["disabled"]=true}e.writeAccessibilityState(null,r)};n.renderARIAInfo=function(e,t){var r={autocomplete:"list",live:"polite",relevant:"all",setsize:t._getListBox().getItems().length};if(t.getValueState()==i.Error){r["invalid"]=true}e.writeAccessibilityState(t,r)};return n},true);
//# sourceMappingURL=AutoCompleteRenderer.js.map