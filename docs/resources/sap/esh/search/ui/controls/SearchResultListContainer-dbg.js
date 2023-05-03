/*! 
 * SAPUI5

		(c) Copyright 2009-2021 SAP SE. All rights reserved
	 
 */

(function(){
sap.ui.define(["sap/esh/search/ui/SearchModel", "sap/ui/core/Control", "./TypeGuardForControls"], function (SearchModel, Control, ___TypeGuardForControls) {
  var typesafeRender = ___TypeGuardForControls["typesafeRender"];
  /**
   * @namespace sap.esh.search.ui.controls
   */

  var SearchResultListContainer = Control.extend("sap.esh.search.ui.controls.SearchResultListContainer", {
    renderer: {
      apiVersion: 2,
      render: function render(oRm, oControl) {
        var oSearchModel = oControl.getModel(); // inner div for results

        oRm.openStart("div", oControl);
        oRm["class"]("sapUshellSearchResultListsContainer");

        if (oSearchModel instanceof SearchModel) {
          var _oSearchModel$config;

          if (oSearchModel !== null && oSearchModel !== void 0 && (_oSearchModel$config = oSearchModel.config) !== null && _oSearchModel$config !== void 0 && _oSearchModel$config.FF_optimizeForValueHelp) {
            oRm["class"]("sapUshellSearchResultListsContainerValueHelp");
          }
        }

        oRm.openEnd(); // render main header

        var noResultScreenControl = oControl === null || oControl === void 0 ? void 0 : oControl.getNoResultScreen();
        typesafeRender(noResultScreenControl, oRm); // render total count bar

        if (oSearchModel instanceof SearchModel) {
          var _oSearchModel$config2, _oSearchModel$config3;

          if (oSearchModel !== null && oSearchModel !== void 0 && (_oSearchModel$config2 = oSearchModel.config) !== null && _oSearchModel$config2 !== void 0 && _oSearchModel$config2.combinedResultviewToolbar) {// nothing to do here ('countBreadcrumbs' will be rendered by SearchLayoutResponsive)
          } else {
            // open inner div level 2
            oRm.openStart("div", oControl.getId() + "-breadcrumbs-bar");
            oRm["class"]("sapUshellSearchTotalCountBar");
            oRm["class"]("sapElisaSearchContainerCountBreadcrumbs");

            if (oSearchModel.config.FF_optimizeForValueHelp) {
              oRm["class"]("sapElisaSearchContainerCountBreadcrumbsValueHelp");
            }

            oRm.openEnd();
            var countBreadcrumbs = oControl.getCountBreadcrumbs();
            typesafeRender(countBreadcrumbs, oRm); // close level 2

            oRm.close("div");
          } // render center area


          var centerAreaControl = oControl.getCenterArea();
          typesafeRender(centerAreaControl, oRm);

          if (oSearchModel !== null && oSearchModel !== void 0 && (_oSearchModel$config3 = oSearchModel.config) !== null && _oSearchModel$config3 !== void 0 && _oSearchModel$config3.combinedResultviewToolbar) {// nothing to do here ('countBreadcrumbsHiddenElement' will be rendered by SearchLayoutResponsive)
          } else {
            var countBreadcrumbsHiddenElement = oControl.getCountBreadcrumbsHiddenElement();
            typesafeRender(countBreadcrumbsHiddenElement, oRm);
          } // close inner div for results


          oRm.close("div");
        }
      }
    },
    metadata: {
      properties: {
        countBreadcrumbsHiddenElement: {
          // to be used for aria-describedby of search result list items
          type: "sap.ui.core.InvisibleText"
        }
      },
      aggregations: {
        centerArea: {
          type: "sap.ui.core.Control",
          singularName: "content",
          multiple: true
        },
        countBreadcrumbs: {
          type: "sap.ui.core.Control",
          multiple: false
        },
        noResultScreen: {
          type: "sap.ui.core.Control",
          multiple: false
        }
      }
    },
    constructor: function _constructor(sId, settings) {
      Control.prototype.constructor.call(this, sId, settings); // define group for F6 handling

      this.data("sap-ui-fastnavgroup", "true", true
      /* write  into DOM */
      );
    },
    getNoResultScreen: function _getNoResultScreen() {
      return this.getAggregation("noResultScreen");
    },
    setNoResultScreen: function _setNoResultScreen(object) {
      this.setAggregation("noResultScreen", object);
    },
    getCountBreadcrumbs: function _getCountBreadcrumbs() {
      return this.getAggregation("countBreadcrumbs");
    },
    setCountBreadcrumbs: function _setCountBreadcrumbs(object) {
      this.setAggregation("countBreadcrumbs", object);
    },
    getCenterArea: function _getCenterArea() {
      return this.getAggregation("centerArea");
    },
    getCountBreadcrumbsHiddenElement: function _getCountBreadcrumbsHiddenElement() {
      return this.getAggregation("countBreadcrumbsHiddenElement");
    }
  });
  return SearchResultListContainer;
});
})();