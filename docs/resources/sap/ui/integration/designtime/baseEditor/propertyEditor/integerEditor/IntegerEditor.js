/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/integration/designtime/baseEditor/propertyEditor/BasePropertyEditor","sap/ui/integration/designtime/baseEditor/propertyEditor/numberEditor/NumberEditor","sap/ui/core/format/NumberFormat"],function(t,e,r){"use strict";var i=e.extend("sap.ui.integration.designtime.baseEditor.propertyEditor.integerEditor.IntegerEditor",{invalidInputError:"BASE_EDITOR.INTEGER.INVALID_BINDING_OR_INTEGER",metadata:{library:"sap.ui.integration"},renderer:t.getMetadata().getRenderer().render});i.prototype.getDefaultValidators=function(){return Object.assign({},t.prototype.getDefaultValidators.call(this),{isInteger:{type:"isInteger"}})};i.configMetadata=Object.assign({},e.configMetadata,{typeLabel:{defaultValue:"BASE_EDITOR.TYPES.INTEGER"}});i.prototype.validateNumber=function(t){return e.prototype.validateNumber.call(this,t)&&Number.isInteger(t)};i.prototype.getFormatterInstance=function(){return r.getIntegerInstance()};return i});
//# sourceMappingURL=IntegerEditor.js.map