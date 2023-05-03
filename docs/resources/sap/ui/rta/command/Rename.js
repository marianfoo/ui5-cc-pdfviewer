/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/rta/command/FlexCommand"],function(e){"use strict";var t=e.extend("sap.ui.rta.command.Rename",{metadata:{library:"sap.ui.rta",properties:{renamedElement:{type:"object"},newValue:{type:"string",defaultValue:"new text"}},associations:{},events:{}}});t.prototype._getChangeSpecificData=function(){var e={changeType:this.getChangeType(),renamedElement:{id:this.getRenamedElement().getId()},value:this.getNewValue()};return e};return t});
//# sourceMappingURL=Rename.js.map