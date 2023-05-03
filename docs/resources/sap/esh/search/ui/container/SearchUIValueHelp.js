/*! 
 * SAPUI5

		(c) Copyright 2009-2021 SAP SE. All rights reserved
	 
 */
(function(){window.onload=function(){sap.ui.loader.config({baseUrl:"../../../../../../resources/",paths:{"sap/esh/search/ui":"/resources/sap/esh/search/ui"}});sap.ui.require(["sap/esh/search/ui/SearchCompositeControl"],function(e){var s=sap.esh.search.ui.config||{};var a={FF_optimizeForValueHelp:true,FF_errorMessagesAsButton:true,facetPanelWidthInPercent:0,facetVisibility:true,pageSize:15,combinedResultviewToolbar:false,updateUrl:false,sinaConfiguration:{provider:"sample"}};var t=Object.assign(a,s);var i=new e(t);window.addEventListener("hashchange",function(){i.getModel().parseURL()},false);i.attachSearchFinished(function(){i.setResultViewTypes(["searchResultList"]);i.setResultViewType("searchResultList")});i.placeAt("panelLeft")});jQuery("html").css("overflow-y","auto");jQuery("html").css("height","100%")}})();
//# sourceMappingURL=SearchUIValueHelp.js.map