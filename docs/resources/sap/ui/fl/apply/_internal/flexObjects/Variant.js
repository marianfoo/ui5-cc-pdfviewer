/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/fl/apply/_internal/flexObjects/FlexObject"],function(t){"use strict";var e=t.extend("sap.ui.fl.apply._internal.flexObjects.Variant",{metadata:{properties:{favorite:{type:"boolean",defaultValue:false},executeOnSelection:{type:"boolean",defaultValue:false},standardVariant:{type:"boolean",defaultValue:false},contexts:{type:"object",defaultValue:{}},variantId:{type:"string"}}},constructor:function(){t.apply(this,arguments);if(!this.getVariantId()){this.setVariantId(this.getId())}}});e.getMappingInfo=function(){return Object.assign(t.getMappingInfo(),{favorite:"favorite",executeOnSelection:"executeOnSelection",standardVariant:"standardVariant",contexts:"contexts"})};e.prototype.getMappingInfo=function(){return e.getMappingInfo()};e.prototype.getName=function(){return this.getText("variantName")};e.prototype.setName=function(t,e){this.setText("variantName",t,"XFLD",e)};return e});
//# sourceMappingURL=Variant.js.map