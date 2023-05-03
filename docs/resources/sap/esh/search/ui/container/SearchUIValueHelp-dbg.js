/*! 
 * SAPUI5

		(c) Copyright 2009-2021 SAP SE. All rights reserved
	 
 */

(function(){
window.onload = function () {
  sap.ui.loader.config({
    baseUrl: "../../../../../../resources/",
    paths: {
      "sap/esh/search/ui": "/resources/sap/esh/search/ui"
    }
  });

  sap.ui.require(["sap/esh/search/ui/SearchCompositeControl"], function (SearchCompositeControl) {
    var globalConfig = sap.esh.search.ui.config || {};
    var localConfig = {
      // see SearchCompositeControl.ts and SearchConfiguration.ts for available options
      FF_optimizeForValueHelp: true,
      FF_errorMessagesAsButton: true,
      facetPanelWidthInPercent: 0,
      facetVisibility: true,
      pageSize: 15,
      combinedResultviewToolbar: false,
      updateUrl: false,
      sinaConfiguration: {
        provider: "sample"
      }
    };
    var options = Object.assign(localConfig, globalConfig);
    var control = new SearchCompositeControl(options);
    window.addEventListener("hashchange", function () {
      control.getModel().parseURL();
    }, false);
    control.attachSearchFinished(function () {
      control.setResultViewTypes(["searchResultList"]);
      control.setResultViewType("searchResultList");
    });
    control.placeAt("panelLeft");
  });

  jQuery("html").css("overflow-y", "auto");
  jQuery("html").css("height", "100%");
};
})();