/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/thirdparty/jquery"],function(jQuery){"use strict";return{domRef:function(e){var n=jQuery.find(".mdcbaseinfoPanelListItem");var t=n.filter(function(n){return jQuery(n).control(0).getParent().getKey()===e.getId()});return t[0]},name:{singular:"p13nDialog.PANEL_ITEM_NAME",plural:"p13nDialog.PANEL_ITEM_NAME_PLURAL"},actions:{remove:function(){return{changeType:"hideItem"}},reveal:function(){return{changeType:"revealItem"}}},isVisible:function(e){return e.getVisible()}}});
//# sourceMappingURL=PanelItem.designtime.js.map