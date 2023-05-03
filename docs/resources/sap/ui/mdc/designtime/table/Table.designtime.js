/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/mdc/p13n/Engine","sap/ui/mdc/Table","../Util"],function(t,e,n){"use strict";var i={name:"{name}",description:"{description}",actions:{settings:function(){return{handler:function(e,n){return t.getInstance().getRTASettingsActionHandler(e,n,e.getActiveP13nModes())}}}},properties:{},aggregations:{_content:{propagateMetadata:function(t){if(t.isA("sap.ui.fl.variants.VariantManagement")||t.isA("sap.ui.mdc.ActionToolbar")||t.isA("sap.ui.mdc.actiontoolbar.ActionToolbarAction")||t.isA("sap.ui.mdc.Field")||t.getParent()&&(t.getParent().isA("sap.ui.mdc.actiontoolbar.ActionToolbarAction")||t.getParent().isA("sap.ui.mdc.Field"))){return null}return{actions:"not-adaptable"}}}}};var a=["width","height","headerLevel","header","headerVisible","showRowCount","threshold","noDataText","enableExport","busyIndicatorDelay","enableColumnResize","showPasteButton","multiSelectMode"],o=["_content"];return n.getDesignTime(e,a,o,i)});
//# sourceMappingURL=Table.designtime.js.map