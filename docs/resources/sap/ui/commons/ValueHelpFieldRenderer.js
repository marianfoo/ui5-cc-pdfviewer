/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["./TextFieldRenderer","sap/ui/core/Renderer","sap/ui/core/IconPool"],function(e,n,t){"use strict";var r=n.extend(e);r.renderOuterAttributes=function(e,n){e.addClass("sapUiTfCombo");e.writeAttribute("aria-owns",n.getId()+"-input "+n.getId()+"-icon")};r.renderOuterContent=function(e,n){var r=n.getIconURL();var o=[];var i={};i["id"]=n.getId()+"-icon";i["role"]="button";o.push("sapUiTfValueHelpIcon");if(r&&t.isIconURI(r)){n.bIsIconURI=true;i.title=n.getTooltip_AsString()}else{n.bIsIconURI=false;if(n.getEnabled()&&n.getEditable()){o.push("sapUiTfValueHelpRegularIcon")}r=this.renderIcon(e,n,o)}e.writeIcon(r,o,i)};r.renderIcon=function(e,n,t){var r="";if(!n.getEnabled()){if(n.getIconDisabledURL()){n.sIconDsblUrl=n.getIconDisabledURL()}else if(n.getIconURL()){n.sIconDsblUrl=n.getIconURL();t.push("sapUiTfValueHelpDsblIcon")}r=n.sIconDsblUrl}else{if(n.getIconURL()){n.sIconRegularUrl=n.getIconURL()}r=n.sIconRegularUrl}return r};return r},true);
//# sourceMappingURL=ValueHelpFieldRenderer.js.map