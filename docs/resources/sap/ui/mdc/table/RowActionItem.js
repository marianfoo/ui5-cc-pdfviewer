/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/core/Element","../library","sap/ui/core/IconPool","sap/ui/core/Core"],function(e,t,i,o){"use strict";var a=t.RowAction;var n=e.extend("sap.ui.mdc.table.RowActionItem",{metadata:{library:"sap.ui.mdc",properties:{type:{type:"sap.ui.mdc.RowAction"},text:{type:"string"},icon:{type:"sap.ui.core.URI"},visible:{type:"boolean",defaultValue:true}},events:{press:{parameters:{bindingContext:{type:"sap.ui.model.Context"}}}}}});var r={navigationIcon:"navigation-right-arrow"};n.prototype._getText=function(){var e;if(this.getText()){e=this.getText()}else{var t=o.getLibraryResourceBundle("sap.ui.mdc");if(this.getType()===a.Navigation){e=t.getText("table.ROW_ACTION_ITEM_NAVIGATE")}}return e};n.prototype._getIcon=function(){var e;if(this.getIcon()){e=this.getIcon()}else if(this.getType()===a.Navigation){e=i.getIconURI(r["navigationIcon"])}return e};return n});
//# sourceMappingURL=RowActionItem.js.map