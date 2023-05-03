/*! 
 * SAPUI5

		(c) Copyright 2009-2021 SAP SE. All rights reserved
	 
 */

(function(){
sap.ui.define(["../i18n", "sap/m/IconTabFilter", "sap/m/Button", "sap/m/VBox", "sap/m/GroupHeaderListItem", "./../error/errors", "sap/esh/search/ui/controls/SearchFacetQuickSelectDataSource", "sap/esh/search/ui/controls/SearchFacetHierarchyDynamic", "sap/esh/search/ui/controls/SearchFacetHierarchyStatic", "sap/esh/search/ui/SearchFacetDialogModel", "sap/esh/search/ui/controls/SearchFacet", "sap/esh/search/ui/controls/SearchFacetBarChart", "sap/esh/search/ui/controls/SearchFacetPieChart", "sap/ui/core/Control", "./SearchFacetDialog", "./SearchFacetTabBarRoles", "../sinaNexTS/providers/abap_odata/UserEventLogger", "./OpenShowMoreDialog", "sap/m/Toolbar", "sap/m/List", "sap/m/library", "sap/m/Title", "sap/m/ToolbarSpacer"], function (__i18n, IconTabFilter, Button, VBox, GroupHeaderListItem, __errors, SearchFacetQuickSelectDataSource, SearchFacetHierarchyDynamic, SearchFacetHierarchyStatic, SearchFacetDialogModel, SearchFacet, SearchFacetBarChart, SearchFacetPieChart, Control, __SearchFacetDialog, __SearchFacetTabBarRoles, ___sinaNexTS_providers_abap_odata_UserEventLogger, ___OpenShowMoreDialog, Toolbar, List, sap_m_library, Title, ToolbarSpacer) {
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule && typeof obj.default !== "undefined" ? obj.default : obj;
  }

  var i18n = _interopRequireDefault(__i18n);

  var errors = _interopRequireDefault(__errors);

  var SearchFacetDialog = _interopRequireDefault(__SearchFacetDialog);

  var SearchFacetTabBarRoles = _interopRequireDefault(__SearchFacetTabBarRoles);

  var UserEventType = ___sinaNexTS_providers_abap_odata_UserEventLogger["UserEventType"];
  var openShowMoreDialog = ___OpenShowMoreDialog["openShowMoreDialog"];
  var ListSeparators = sap_m_library["ListSeparators"];

  /**
   * @namespace sap.esh.search.ui.controls
   */
  var SearchFacetFilter = Control.extend("sap.esh.search.ui.controls.SearchFacetFilter", {
    renderer: {
      apiVersion: 2,
      render: function render(oRm, oControl) {
        var _oModel$getDataSource;

        var createOpenFacetDialogFn = function createOpenFacetDialogFn() {
          return function () {
            // since UI5 reuses the showMore link control, we have to traverse the DOM
            // to find our facets dimension:
            var facet = sap.ui // ToDo
            .getCore().byId($($(oControl.getDomRef()).closest(".sapUshellSearchFacet")[0]).attr("id")); // ToDo

            var oFacetDialogModel = new SearchFacetDialogModel({
              searchModel: oControl.getModel()
            });
            oFacetDialogModel.initBusinessObjSearch().then(function () {
              var _facet$getBindingCont;

              var oSearchModel = oControl.getModel();
              oFacetDialogModel.setData(oSearchModel.getData());
              oFacetDialogModel.config = oSearchModel.config;
              oFacetDialogModel.sinaNext = oSearchModel.sinaNext;
              oFacetDialogModel.prepareFacetList();
              var dimension = null;

              if (facet !== null && facet !== void 0 && (_facet$getBindingCont = facet.getBindingContext()) !== null && _facet$getBindingCont !== void 0 && _facet$getBindingCont.getObject()["dimension"]) {
                // ToDo
                dimension = facet.getBindingContext().getObject()["dimension"]; // ToDo
              }

              var oDialog = new SearchFacetDialog("".concat(oSearchModel.config.id, "-SearchFacetDialog"), {
                selectedAttribute: dimension
              });
              oDialog.setModel(oFacetDialogModel);
              oDialog.setModel(oSearchModel, "searchModel");
              oDialog.open(); // referece to page, so that dialog can be destroy in onExit()

              var oPage = oControl.getParent().getParent().getParent().getParent(); // ToDo

              oPage.oFacetDialog = oDialog; // oPage.addDependent(oDialog);

              oSearchModel.eventLogger.logEvent({
                type: UserEventType.FACET_SHOW_MORE
              });
            });
          };
        }; // outer div


        oRm.openStart("div", oControl);
        oRm["class"]("sapUshellSearchFacetFilter");
        oRm.openEnd();
        var isFirstAttributeFacet = true;
        var oModel = oControl.getModel();

        for (var i = 0, len = oControl.getAggregation("facets").length; i < len; i++) {
          // ToDo
          var facet = oControl.getAggregation("facets")[i];
          var facetModel = facet.getBindingContext().getObject();

          switch (facetModel.facetType) {
            case "attribute":
              facet.setEshRole("attribute");
              facet.attachSelectionChange(null, function () {
                // dont show the showAllBtn while the facet pane is empty
                jQuery(oControl._showAllBtn.getDomRef()).hide();
              });

              if (facetModel.position > 999) {
                // Conventional facets without positions in config
                if (isFirstAttributeFacet) {
                  facet.setHeaderText(i18n.getText("filterBy"));
                  isFirstAttributeFacet = false;
                }
              } else {
                // DWC Exit
                facet.setHeaderText(facetModel.title);
                facet.addStyleClass("sapUshellSearchFacetSearchInAttribute");
              }

              oRm.renderControl(facet);
              break;

            case "datasource":
              facet.setEshRole("datasource");
              facet.addStyleClass("sapUshellSearchFacetDataSource");
              oRm.renderControl(facet);
              break;

            case "quickSelectDataSource":
              if (oModel.config && oModel.config.FF_facetPanelUnifiedHeaderStyling) {// header is not visible
              } else {
                facet.setHeaderText(i18n.getText("quickSelectDataSourcesHeader"));
              }

              facet.addStyleClass("sapUshellSearchFacetQuickSelectDataSource");
              oRm.renderControl(facet);
              break;

            case "hierarchy":
              if (facetModel.position > 999) {
                // Conventional facets without positions in config
                if (isFirstAttributeFacet) {
                  // facet.setHeaderText(i18n.getText("filterBy"));
                  facet.setHeaderToolbar(oControl._headToolBar4FirstFacet(oModel));
                  isFirstAttributeFacet = false;
                }
              } else {
                // DWC Exit
                facet.setHeaderText(facetModel.title);
                facet.addStyleClass("sapUshellSearchFacetSearchInAttribute");
              }

              oRm.renderControl(facet);
              break;

            case "hierarchyStatic":
              oRm.renderControl(facet);
              break;

            default:
              throw "program error: unknown facet type :" + facetModel.facetType;
          }
        } // show all filters button


        if (((_oModel$getDataSource = oModel.getDataSource()) === null || _oModel$getDataSource === void 0 ? void 0 : _oModel$getDataSource.type) === "BusinessObject") {
          var hasDialogFacets = oModel.oFacetFormatter.hasDialogFacetsFromMetaData(oControl.getModel());
          var hasResultItems = oControl.getModel().getProperty("/boCount") > 0;

          if (hasDialogFacets && hasResultItems) {
            oRm.openStart("div", oControl.getId() + "-showAllFilters");
            oRm.openEnd();
            oControl._showAllBtn = new Button("", {
              text: "{showAllFilters}",
              press: createOpenFacetDialogFn(),
              visible: true
            });

            oControl._showAllBtn.setModel(oControl.getModel("i18n"));

            oControl._showAllBtn.addStyleClass("sapUshellSearchFacetFilterShowAllFilterBtn");

            oRm.renderControl(oControl._showAllBtn);
            oRm.close("div");
          }
        } // close searchfacetfilter div


        oRm.close("div");
      }
    },
    metadata: {
      properties: {
        title: "string"
      },
      aggregations: {
        facets: {
          multiple: true
        }
      }
    },
    constructor: function _constructor(sId, settings) {
      Control.prototype.constructor.call(this, sId, settings); // define group for F6 handling

      this.data("sap-ui-fastnavgroup", "true", true
      /* write into DOM */
      );
      this.bindAggregation("facets", {
        path: "/facets",
        factory: function factory(id, oContext) {
          var facet = oContext.getObject();
          var oModel = oContext.getModel();
          var config = oModel.config;

          switch (facet.facetType) {
            case "attribute":
              {
                var _sId = "".concat(id, "-attribute_facet"); // DWC exit


                if (typeof (config === null || config === void 0 ? void 0 : config.getSpaceFacetId) === "function") {
                  _sId = config.getSpaceFacetId(facet.dimension, _sId);
                }
                /* if (config?.id) {
                    sId = `${config.id}-${sId}`;
                } */


                var oIconTabBar = new SearchFacetTabBarRoles(_sId, {
                  items: [new IconTabFilter({
                    text: i18n.getText("facetList"),
                    icon: "sap-icon://list",
                    key: "list".concat(id),
                    content: new SearchFacet("list".concat(id), {})
                  }), new IconTabFilter({
                    text: i18n.getText("facetBarChart"),
                    icon: "sap-icon://horizontal-bar-chart",
                    key: "barChart".concat(id),
                    content: new SearchFacetBarChart("barChart".concat(id))
                  }), new IconTabFilter({
                    text: i18n.getText("facetPieChart"),
                    icon: "sap-icon://pie-chart",
                    key: "pieChart".concat(id),
                    content: new SearchFacetPieChart("pieChart".concat(id))
                  })]
                });
                oIconTabBar.addStyleClass("sapUshellSearchFacetIconTabBar");
                return oIconTabBar;
              }

            case "datasource":
              return new SearchFacet((config !== null && config !== void 0 && config.id ? config.id + "-" : "") + "dataSourceFacet");

            case "quickSelectDataSource":
              {
                var quickSelectDataSourceList = new SearchFacetQuickSelectDataSource((config !== null && config !== void 0 && config.id ? config.id + "-" : "") + "sapUshellSearchFacetQuickSelectDataSource", {});

                if (config !== null && config !== void 0 && config.FF_facetPanelUnifiedHeaderStyling) {
                  var oGroupHeaderListItem = new GroupHeaderListItem({
                    title: i18n.getText("quickSelectDataSourcesHeader")
                  });
                  oGroupHeaderListItem.addStyleClass("sapUshellSearchFacetTabBarHeader");
                  oGroupHeaderListItem.addStyleClass("sapElisaSearchFacetTabBarHeaderUl");
                  return new VBox("", {
                    items: [oGroupHeaderListItem, quickSelectDataSourceList]
                  });
                }

                return quickSelectDataSourceList;
              }

            case "hierarchy":
              {
                var hierarchyId = "".concat(id, "-attribute_facet");

                var _facet = new SearchFacetHierarchyDynamic(hierarchyId, {
                  openShowMoreDialogFunction: openShowMoreDialog // inject function because otherwise we have circular dependencies

                });

                return _facet;
              }

            case "hierarchyStatic":
              {
                var hierarchyStaticId = "".concat(id, "-attribute_facet");
                return new SearchFacetHierarchyStatic(hierarchyStaticId, {});
              }

            default:
              {
                var internalError = new Error("program error: unknown facet type " + facet.facetType);
                throw new errors.UnknownFacetType(internalError);
              }
          }
        }
      });
    },
    onAfterRendering: function _onAfterRendering() {
      var $dataSource = $(".searchFacetFilter .searchFacet").first().find("ul"); // ToDo: JQuery

      var $dataSourceItems = $dataSource.find("li");
      $dataSource.attr("role", "tree");
      $dataSourceItems.attr("role", "treeitem");
    },
    _headToolBar4FirstFacet: function _headToolBar4FirstFacet(searchModel) {
      var _this = this;

      // heading
      //FilterBy
      var oHeader = new List("", {});
      oHeader.setShowNoData(false);
      oHeader.setShowSeparators(ListSeparators.None);
      oHeader.data("sap-ui-fastnavgroup", "false", true
      /* write into DOM */
      );
      var oResetButton = new Button("", {
        icon: "sap-icon://clear-filter",
        tooltip: i18n.getText("resetFilterButton_tooltip"),
        type: "Transparent",
        enabled: {
          parts: [{
            path: "/uiFilter/rootCondition"
          }],
          formatter: function formatter(rootCondition) {
            var bFiltersExist = false;

            if (rootCondition.hasFilters()) {
              bFiltersExist = true;

              if (searchModel.filterWithoutFilterByConditions()) {
                bFiltersExist = false;
              } // DWC exit, remove after replacing space facet by folder


              if (typeof searchModel.config.hasSpaceFiltersOnly === "function") {
                if (searchModel.config.hasSpaceFiltersOnly(rootCondition) === true) {
                  bFiltersExist = false;
                }
              }
            } else {
              bFiltersExist = false;
            }

            return bFiltersExist;
          }
        },
        press: function press() {
          var oSearchModel = searchModel;
          oSearchModel.eventLogger.logEvent({
            type: UserEventType.CLEAR_ALL_FILTERS
          });
          searchModel.resetFilterByFilterConditions(true);
        }
      }); // if (oSearchModel?.config?.searchInAttibuteFacetPostion[dimension]) {
      //     oResetButton.addStyleClass("sapUshellSearchFilterByResetButtonHidden");
      // } else {

      oResetButton.addStyleClass("sapUshellSearchFilterByResetButton"); // }

      oResetButton.onAfterRendering = function () {
        $(_this.getDomRef()).attr("aria-label", i18n.getText("resetFilterButton_tooltip"));
      };

      var oLabel = new Title("", {
        text: i18n.getText("filterBy")
      });
      var oSpacer = new ToolbarSpacer();
      var oHeaderToolbar = new Toolbar("", {
        content: [oLabel, oSpacer, oResetButton]
      });
      oHeaderToolbar.data("sap-ui-fastnavgroup", "false", true
      /* write into DOM */
      );
      oHeaderToolbar.addStyleClass("sapUshellSearchFilterByHeaderListToolbarinToolbar");
      oHeader.setHeaderToolbar(oHeaderToolbar); // if (
      //     oSearchModel.config?.FF_facetPanelUnifiedHeaderStyling &&
      //     dimension === oSearchModel.config?.dimensionNameSpace_Description
      // ) {
      //     oHeader.setVisible(false);
      // } else {

      oHeader.addStyleClass("sapUshellSearchFilterByHeaderList"); // }

      oHeader.onAfterRendering = function () {
        $(".sapUshellSearchFilterByHeaderList").find("ul").attr("tabindex", "-1");
        $(".sapUshellSearchFilterByHeaderList").find("div").attr("tabindex", "-1");
      };

      var oFacetHeaderToolbar = new Toolbar("", {
        content: oHeader
      });
      oFacetHeaderToolbar.addStyleClass("sapUshellSearchFilterByHeaderListToolbar");
      return oFacetHeaderToolbar;
    }
  });
  return SearchFacetFilter;
});
})();