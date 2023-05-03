/*! 
 * SAPUI5

		(c) Copyright 2009-2021 SAP SE. All rights reserved
	 
 */
(function(){sap.ui.define(["sap/ui/core/Control","../i18n","sap/m/ToggleButton","sap/ui/model/BindingMode"],function(e,t,o,n){function r(e){return e&&e.__esModule&&typeof e.default!=="undefined"?e.default:e}var i=r(t);var l=e.extend("sap.esh.search.ui.controls.SearchMultiSelectionControl",{renderer:{apiVersion:2,render:function e(t,o){t.openStart("div",o);t["class"]("sapUshellSearchResultList-MultiSelectionControl");t.openEnd();t.renderControl(o);t.close("div")}},metadata:{properties:{resultList:"object"},aggregations:{actions:"object"}},_renderer:function e(t){var r=this.getModel();var l=new o({icon:"sap-icon://multi-select",tooltip:i.getText("toggleSelectionModeBtn"),press:function e(){if(this.getPressed()){this.getProperty("resultList").enableSelectionMode();r.setProperty("/multiSelectionEnabled",true)}else{this.getProperty("resultList").disableSelectionMode();r.setProperty("/multiSelectionEnabled",false)}},visible:false,pressed:{parts:[{path:"/multiSelectionEnabled"}],formatter:function e(t){return t>0},mode:n.OneWay}});l.setModel(r);l.addStyleClass("sapUshellSearchResultList-toggleMultiSelectionButton");t.renderControl(l)}});return l})})();
//# sourceMappingURL=SearchMultiSelectionControl.js.map