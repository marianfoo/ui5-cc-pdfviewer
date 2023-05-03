/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/fl/Change"],function(e){"use strict";var t=e.extend("sap.ui.fl.apply._internal.flexObjects.UpdatableChange",{metadata:{aggregations:{revertInfo:{type:"sap.ui.fl.apply._internal.flexObjects.RevertData",multiple:true,singularName:"revertInfo",defaultValue:[]}}}});t.prototype.popLatestRevertInfo=function(){var e=this.getRevertInfo().pop();this.removeRevertInfo(e);return e};return t});
//# sourceMappingURL=UpdatableChange.js.map