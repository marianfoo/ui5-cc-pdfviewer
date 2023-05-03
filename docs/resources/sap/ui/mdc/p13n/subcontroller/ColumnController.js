/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["./BaseController","sap/m/p13n/SelectionPanel"],function(e,t){"use strict";var n=sap.ui.getCore().getLibraryResourceBundle("sap.ui.mdc");var o=e.extend("sap.ui.mdc.p13n.subcontroller.ColumnController",{constructor:function(){e.apply(this,arguments);this._bResetEnabled=true}});o.prototype.getUISettings=function(){return{title:n.getText("table.SETTINGS_COLUMN"),tabText:n.getText("p13nDialog.TAB_Column")}};o.prototype.model2State=function(){var e=[];this._oPanel.getP13nData(true).forEach(function(t){if(t.visible){e.push({name:t.name})}});return e};o.prototype.getAdaptationUI=function(e){var o=new t({enableReorder:true,showHeader:true,enableCount:true,fieldColumn:n.getText("fieldsui.COLUMNS")});var r=this.mixInfoAndState(e);o.setP13nData(r.items);this._oPanel=o;return Promise.resolve(o)};o.prototype.getChangeOperations=function(){return{add:"addColumn",remove:"removeColumn",move:"moveColumn"}};return o});
//# sourceMappingURL=ColumnController.js.map