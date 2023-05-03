/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/mdc/filterbar/IFilterContainer","sap/m/Table","sap/m/Column","sap/m/Text","sap/m/VBox","sap/ui/mdc/p13n/panels/FilterPanel","sap/base/util/UriParameters"],function(t,e,i,r,a,n,o){"use strict";var s=t.extend("sap.ui.mdc.filterbar.p13n.TableContainer");s.prototype.init=function(){t.prototype.init.apply(this,arguments);var a=sap.ui.getCore().getLibraryResourceBundle("sap.ui.mdc");this._oTable=new e({sticky:["ColumnHeaders"],growing:true,columns:[new i({header:new r({text:a.getText("filter.AdaptationFilterBar_FIELD_COLUMN")})}),new i({header:new r({text:a.getText("filter.AdaptationFilterBar_FIELD_VALUE_COLUMN")})})]});this.oLayout=new n({enableReorder:false,itemFactory:function(t){var e=t.name;var i=this.mFilterItems[e];return i}.bind(this)});this.mFilterItems={}};s.prototype.insertFilterField=function(t,e){var i=t._oFilterField.getParent();var r=i._getPropertyByName(t._getFieldPath()).name;this.mFilterItems[r]=t};s.prototype.setP13nData=function(t){this.oLayout.setP13nData(t.items)};s.prototype.removeFilterField=function(t){this._oTable.removeItem(t)};s.prototype.setMessageStrip=function(t){this.oLayout.setMessageStrip(t)};s.prototype.getFilterFields=function(){return this._oTable.getItems()};s.prototype.update=function(t){};s.prototype.exit=function(){this._oTable=null};return s});
//# sourceMappingURL=TableContainer.js.map