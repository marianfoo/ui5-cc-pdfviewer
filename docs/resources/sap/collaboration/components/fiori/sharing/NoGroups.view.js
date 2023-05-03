/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */
sap.ui.define(["sap/ui/core/mvc/JSView","sap/m/VBox","sap/ui/layout/VerticalLayout","sap/ui/core/HTML","sap/m/library","sap/m/Link"],function(t,o,a,e,i,n){"use strict";var r=i.FlexAlignItems;sap.ui.jsview("sap.collaboration.components.fiori.sharing.NoGroups",{getControllerName:function(){return"sap.collaboration.components.fiori.sharing.NoGroups"},createContent:function(t){var a=this.getViewData().controlId;this.oNoGroupsVBox=new o(a+"_NoGroupsVbox");this.oNoGroupsVBox.addItem(this.createNoDataLayout());return this.oNoGroupsVBox},createNoDataLayout:function(t){var i=this.getViewData().controlId;var s=this.getViewData().langBundle;var u=this.getViewData().jamUrl;this.oNoDataLayout=new a(i+"_NoDataLayout",{width:"100%",content:[new e(i+"_NoDataDiv",{content:"<div>"+s.getText("NO_GROUPS_ERROR")+"</div>"}),new o(i+"_LinkVbox",{alignItems:r.End,items:[new n(i+"_JamLink",{text:s.getText("JAM_URL_TEXT"),target:"_blank",href:u})]}).addStyleClass("linkVBox")]});return this.oNoDataLayout}})});
//# sourceMappingURL=NoGroups.view.js.map