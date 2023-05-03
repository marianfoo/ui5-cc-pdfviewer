/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/integration/designtime/baseEditor/propertyEditor/BasePropertyEditor","sap/base/util/restricted/_isNil"],function(t,e){"use strict";var i=t.extend("sap.ui.integration.designtime.baseEditor.propertyEditor.groupEditor.GroupEditor",{xmlFragment:"sap.ui.integration.designtime.baseEditor.propertyEditor.groupEditor.GroupEditor",metadata:{library:"sap.ui.integration"},renderer:t.getMetadata().getRenderer().render});i.configMetadata=Object.assign({},t.configMetadata,{allowBindings:{defaultValue:true,mergeStrategy:"mostRestrictiveWins"},typeLabel:{defaultValue:"BASE_EDITOR.TYPES.GROUP"}});i.prototype.getDefaultValidators=function(){var e=this.getConfig();return Object.assign({},t.prototype.getDefaultValidators.call(this),{isValidBinding:{type:"isValidBinding",isEnabled:e.allowBindings},notABinding:{type:"notABinding",isEnabled:!e.allowBindings},maxLength:{type:"maxLength",isEnabled:typeof e.maxLength==="number",config:{maxLength:e.maxLength}}})};return i});
//# sourceMappingURL=GroupEditor.js.map