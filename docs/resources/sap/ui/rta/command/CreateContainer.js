/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/rta/command/FlexCommand"],function(t){"use strict";var e=t.extend("sap.ui.rta.command.CreateContainer",{metadata:{library:"sap.ui.rta",properties:{index:{type:"int",group:"content"},newControlId:{type:"string",group:"content"},label:{type:"string"},parentId:{type:"string",group:"content"}},associations:{},events:{}}});e.prototype._getChangeSpecificData=function(){var e=t.prototype._getChangeSpecificData.apply(this);e.newLabel=this.getLabel();return e};return e});
//# sourceMappingURL=CreateContainer.js.map