/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["./QuickActionItem","./QuickAction","sap/m/ToggleButton","sap/m/library","sap/ui/core/library"],function(e,t,r,n,i){"use strict";var s=i.SortOrder;var o=e.extend("sap.m.table.columnmenu.QuickSortItem",{metadata:{library:"sap.m",properties:{sortOrder:{type:"sap.ui.core.SortOrder",defaultValue:i.SortOrder.None}},aggregations:{quickAction:{type:"sap.m.table.columnmenu.QuickAction",multiple:false,visibility:"hidden"}}}});o.prototype._getAction=function(){var e=this.getAggregation("quickAction");var r=this._getLabel();if(e){e.setLabel(r)}else{e=new t({label:r,content:[this._createContent()],category:n.table.columnmenu.Category.Sort})}this.setAggregation("quickAction",e,true);return e};o.prototype._getLabel=function(){var e=sap.ui.getCore().getLibraryResourceBundle("sap.m");return e.getText("table.COLUMNMENU_QUICK_SORT",this.getLabel())};o.prototype._createContent=function(){var e=sap.ui.getCore().getLibraryResourceBundle("sap.m");return[new r({text:e.getText("table.COLUMNMENU_SORT_ASCENDING"),pressed:this.getSortOrder()===s.Ascending,press:[{item:this,sortOrder:s.Ascending},this._onSortChange,this]}),new r({text:e.getText("table.COLUMNMENU_SORT_DESCENDING"),pressed:this.getSortOrder()===s.Descending,press:[{item:this,sortOrder:s.Descending},this._onSortChange,this]})]};o.prototype._onSortChange=function(e,t){this.setSortOrder(e.getParameters().pressed?t.sortOrder:s.None,true);this.getParent().onChange(t.item)};o.prototype.setSortOrder=function(e){this.setProperty("sortOrder",e);var t=this.getAggregation("quickAction");if(t){var r=t.getContent();r[0].setPressed(e===s.Ascending);r[1].setPressed(e===s.Descending)}};return o});
//# sourceMappingURL=QuickSortItem.js.map