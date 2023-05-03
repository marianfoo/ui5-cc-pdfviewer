/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/mdc/field/content/DefaultContent"],function(e){"use strict";var t=Object.assign({},e,{getDisplay:function(){return["sap/m/Link"]},getDisplayMultiValue:function(){return[null]},getDisplayMultiLine:function(){return["sap/m/Link"]},getUseDefaultFieldHelp:function(){return false},createDisplay:function(e,t,i){var n=t[0];var l=e.getConditionsType();var a=new n(i,{text:{path:"$field>/conditions",type:l},textAlign:"{$field>/textAlign}",textDirection:"{$field>/textDirection}",tooltip:"{$field>/tooltip}",press:e.getHandleContentPress(),wrapping:"{$field>/multipleLines}"});var r=e.getField().getFieldInfo();if(r){r.getDirectLinkHrefAndTarget().then(function(t){e.getMetadata()._oClass._updateLink(a,t)})}e.setAriaLabelledBy(a);e.setBoundProperty("text");return[a]},createDisplayMultiValue:function(){throw new Error("sap.ui.mdc.field.content.LinkContent - createDisplayMultiValue not defined!")},createDisplayMultiLine:function(e,i,n){return t.createDisplay(e,i,n)}});return t});
//# sourceMappingURL=LinkContent.js.map