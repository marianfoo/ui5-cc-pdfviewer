/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/m/VariantManagement"],function(t){"use strict";var e=t.extend("sap.ui.mdc.filterbar.vh.CollectiveSearchSelect",{metadata:{library:"sap.ui.mdc",properties:{title:{type:"string",group:"Misc",defaultValue:null},selectedItemKey:{type:"string",group:"Misc",defaultValue:null}}},renderer:{renderer:function(e,i){t.getMetadata().getRenderer().render(e,i)}}});e.prototype.init=function(){t.prototype.init.apply(this);this.oRb=sap.ui.getCore().getLibraryResourceBundle("sap.ui.mdc")};e.prototype.applySettings=function(e,i){t.prototype.applySettings.apply(this,arguments);this.setShowFooter(false);this.setProperty("_selectStategyForSameItem",false);this.oVariantPopoverTrigger.setTooltip(this.oRb.getText("COL_SEARCH_TRIGGER_TT"))};e.prototype.setTitle=function(t){this.setProperty("title",t);this.setPopoverTitle(t);return this};e.prototype.getTitle=function(){return this.getProperty("title")};e.prototype.getCurrentText=function(){return t.prototype.getTitle.apply(this,arguments).getText()};e.prototype.setSelectedItemKey=function(t){this.setProperty("selectedItemKey",t);this.setSelectedKey(t);return this};e.prototype.getSelectedItemKey=function(){return this.getSelectedKey()};e.prototype._setInvisibleText=function(t){this.oVariantInvisibleText.setText(this.oRb.getText("COL_SEARCH_SEL_INVISIBLETXT",[t]))};e.prototype.exit=function(){t.prototype.exit.apply(this);this.oRb=undefined};return e});
//# sourceMappingURL=CollectiveSearchSelect.js.map