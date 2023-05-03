/*! 
 * SAPUI5

		(c) Copyright 2009-2021 SAP SE. All rights reserved
	 
 */
(function(){window.onload=function(){sap.ui.loader.config({baseUrl:"../../../../../../resources/",paths:{"sap/esh/search/ui":"/resources/sap/esh/search/ui"}});sap.ui.getCore().attachInit(function(){sap.ui.require(["sap/esh/search/ui/SearchCompositeControl"],function(e){var s=sap.esh.search.ui.config||{};var a={sinaConfiguration:{provider:"sample"}};var n=Object.assign(a,s);var o=new e(n);window.addEventListener("hashchange",function(){o.getModel().parseURL()},false);o.placeAt("content")});jQuery("html").css("overflow-y","auto");jQuery("html").css("height","100%")})}})();
//# sourceMappingURL=SearchUI.js.map