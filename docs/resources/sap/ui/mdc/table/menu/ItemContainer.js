/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/m/table/columnmenu/ItemContainer","sap/ui/mdc/table/menu/Item","sap/ui/core/Core"],function(e,t,i){"use strict";var n=e.extend("sap.ui.mdc.table.menu.ItemContainer",{metadata:{library:"sap.ui.mdc",associations:{table:{type:"sap.ui.mdc.Table"},column:{type:"sap.ui.mdc.table.Column"}}}});n.prototype.initializeItems=function(){var e=this.getTable();this.removeAllItems();if(e.isSortingEnabled()){this.addItem(new t({key:"Sort",icon:"sap-icon://sort"}))}if(e.isFilteringEnabled()){this.addItem(new t({key:"Filter",icon:"sap-icon://filter"}))}if(e.isGroupingEnabled()){this.addItem(new t({key:"Group",icon:"sap-icon://group-2"}))}if(e.getActiveP13nModes().includes("Column")){this.addItem(new t({key:"Column",icon:"sap-icon://table-column"}))}return Promise.all(this.getItems().map(function(e){return e.initializeContent()}))};n.prototype.hasItems=function(){return this.getEffectiveItems().length>0};n.prototype.getTable=function(){return i.byId(this.getAssociation("table"))};return n});
//# sourceMappingURL=ItemContainer.js.map