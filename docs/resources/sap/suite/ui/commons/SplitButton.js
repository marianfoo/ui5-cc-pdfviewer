/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define(["sap/ui/commons/library","sap/ui/commons/Button","sap/ui/commons/MenuButton","sap/ui/commons/MenuItem","sap/ui/core/Control","./SplitButtonRenderer"],function(t,e,n,o,u,i){"use strict";var s=u.extend("sap.suite.ui.commons.SplitButton",{metadata:{deprecated:true,library:"sap.suite.ui.commons",properties:{visible:{type:"boolean",group:"Misc",defaultValue:true},enabled:{type:"boolean",group:"Behavior",defaultValue:true},lite:{type:"boolean",group:"Appearance",defaultValue:false},style:{type:"sap.ui.commons.ButtonStyle",group:"Appearance",defaultValue:"Default"},styled:{type:"boolean",group:"Appearance",defaultValue:true},iconFirst:{type:"boolean",group:"Appearance",defaultValue:true},text:{type:"string",group:"Appearance",defaultValue:""},icon:{type:"sap.ui.core.URI",group:"Appearance",defaultValue:""}},aggregations:{menu:{type:"sap.ui.commons.Menu",multiple:false}}}});function r(t,e){if(!e||!t||t.getItems().length===0){return false}if(t.indexOfItem(e)>=0){return true}var n=t.getItems();var o=null;for(var u=0;u<n.length;u++){o=n[u].getSubmenu();if(r(o,e)){return true}}return false}function l(t){return function(){o.prototype.setVisible.apply(t._oMenuItem,arguments);if(!t._oMenuItem.getVisible()){t.setMenu(t._oMenuButton.getMenu())}return t._oMenuItem}}function a(t){return function(){o.prototype.setIcon.apply(t._oMenuItem,arguments);if(!t.getIcon()){t._oDefaultActionButton.setIcon(t._oMenuItem.getIcon())}return t._oMenuItem}}function p(t){return function(){o.prototype.setTooltip.apply(t._oMenuItem,arguments);t._oDefaultActionButton.setTooltip(t._oMenuItem.getTooltip());return t._oMenuItem}}var c=function(t){return function(){o.prototype.setText.apply(t._oMenuItem,arguments);if(!t.getText()){t._oDefaultActionButton.setText(t._oMenuItem.getText())}return t._oMenuItem}};var f=function(t){return function(){o.prototype.setEnabled.apply(t._oMenuItem,arguments);if(t.getEnabled()){t._oDefaultActionButton.setEnabled(t._oMenuItem.getEnabled())}return t._oMenuItem}};s.prototype.init=function(){this._oDefaultActionButton=new e(this.getId()+"-defaultActionButton");this._oDefaultActionButton.attachPress(function(){if(this._oMenuItem){this._oMenuItem.fireSelect()}},this);this._oMenuButton=new n(this.getId()+"-menuButton");this._oMenuButton.addStyleClass("sapSuiteUiCommonsSplitButton-menuButton");if(this.getMenu()){this._oMenuButton.setMenu(this.getMenu())}};s.prototype.exit=function(){this.destroyAggregation("menu",true);this._oDefaultActionButton.destroy();this._oDefaultActionButton=null;this._oMenuButton.destroy();this._oMenuButton=null};s.prototype.setMenu=function(t,e){this._oMenuButton.setMenu(t);if(r(t,e)&&e.getVisible()){this._oMenuItem=e}else if(t&&t.getItems()){var n=t.getItems()[0];if(n&&n.getVisible()){this._oMenuItem=n}else{this._oMenuItem=null}}if(this._oMenuItem){if(!this.getText()){this._oDefaultActionButton.setText(this._oMenuItem.getText()||null)}if(!this.getIcon()){this._oDefaultActionButton.setIcon(this._oMenuItem.getIcon()||null)}if(this.getEnabled()){this._oDefaultActionButton.setEnabled(this._oMenuItem.getEnabled())}this._oDefaultActionButton.setTooltip(this._oMenuItem.getTooltip()||null);this._oMenuItem.setTooltip=p(this);this._oMenuItem.setText=c(this);this._oMenuItem.setIcon=a(this);this._oMenuItem.setEnabled=f(this);this._oMenuItem.setVisible=l(this)}return this};s.prototype.getMenu=function(){return this._oMenuButton.getMenu()};s.prototype.destroyMenu=function(){this._oMenuButton.destroyMenu();return this};s.prototype.setEnabled=function(t){this._oDefaultActionButton.setEnabled(t);this._oMenuButton.setEnabled(t);this.setProperty("enabled",t);return this};s.prototype.setLite=function(t){this._oDefaultActionButton.setLite(t);this._oMenuButton.setLite(t);this.setProperty("lite",t);return this};s.prototype.setStyle=function(t){this._oDefaultActionButton.setStyle(t);this._oMenuButton.setStyle(t);this.setProperty("style",t);return this};s.prototype.setStyled=function(t){this._oDefaultActionButton.setStyled(t);this._oMenuButton.setStyled(t);this.setProperty("styled",t);return this};s.prototype.setIconFirst=function(t){this._oDefaultActionButton.setIconFirst(t);this.setProperty("iconFirst",t);return this};s.prototype.setIcon=function(t){this._oDefaultActionButton.setIcon(t);this.setProperty("icon",t);return this};s.prototype.setText=function(t){this._oDefaultActionButton.setText(t);this.setProperty("text",t);return this};return s});
//# sourceMappingURL=SplitButton.js.map