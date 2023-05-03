/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/rta/command/FlexCommand"],function(e){"use strict";var t=e.extend("sap.ui.rta.command.BindProperty",{metadata:{library:"sap.ui.rta",properties:{propertyName:{type:"string"},newBinding:{type:"string"},changeType:{type:"string",defaultValue:"propertyBindingChange"}},associations:{},events:{}}});t.prototype.bindProperty=function(t,n){if(t==="newBinding"){return this.setNewBinding(n.bindingString)}return e.prototype.bindProperty.apply(this,arguments)};t.prototype._getChangeSpecificData=function(){var e=this.getElement();var t={changeType:this.getChangeType(),selector:{id:e.getId(),type:e.getMetadata().getName()},content:{property:this.getPropertyName(),newBinding:this.getNewBinding()}};return t};return t});
//# sourceMappingURL=BindProperty.js.map