/*! 
 * SAPUI5

		(c) Copyright 2009-2021 SAP SE. All rights reserved
	 
 */
(function(){sap.ui.define(["../i18n","sap/m/Select","sap/m/library","sap/ui/core/Item","sap/ui/model/BindingMode","../sinaNexTS/providers/abap_odata/UserEventLogger"],function(e,t,a,r,i,s){function n(e){return e&&e.__esModule&&typeof e.default!=="undefined"?e.default:e}var o=n(e);var l=a["SelectType"];var c=s["UserEventType"];var d=t.extend("sap.esh.search.ui.controls.SearchSelect",{renderer:{apiVersion:2},constructor:function e(a,s){var n=this;t.prototype.constructor.call(this,a,s);this.bindProperty("visible",{path:"/businessObjSearchEnabled"});this.setAutoAdjustWidth(true);this.bindItems({path:"/dataSources",template:new r("",{key:"{id}",text:"{labelPlural}"})});this.bindProperty("selectedKey",{path:"/uiFilter/dataSource/id",mode:i.OneWay});this.setTooltip(o.getText("searchIn")+" {/uiFilter/dataSource/labelPlural}");this.attachChange(function(){var e=n.getSelectedItem();var t=e.getBindingContext();var a=t.getObject();var r=n.getModel();r.setDataSource(a,false);r.abortSuggestions();r.eventLogger.logEvent({type:c.DROPDOWN_SELECT_DS,dataSourceId:a.id})});this.bindProperty("enabled",{parts:[{path:"/initializingObjSearch"}],formatter:function e(t){return!t}});this.addStyleClass("searchSelect")},setDisplayMode:function e(t){switch(t){case"icon":this.setType(l.IconOnly);this.setIcon("sap-icon://slim-arrow-down");break;case"default":this.setType(l.Default);break;default:break}}});return d})})();
//# sourceMappingURL=SearchSelect.js.map