/*! 
 * SAPUI5

		(c) Copyright 2009-2021 SAP SE. All rights reserved
	 
 */

(function(){
sap.ui.define(["sap/ui/layout/ResponsiveSplitter", "sap/ui/layout/SplitterLayoutData", "sap/m/ScrollContainer", "sap/m/VBox", "sap/m/BusyDialog", "sap/ui/layout/SplitPane", "sap/ui/layout/PaneContainer", "sap/ui/core/library", "sap/m/Text", "../UIEvents"], function (ResponsiveSplitter, SplitterLayoutData, ScrollContainer, VBox, BusyDialog, SplitPane, PaneContainer, sap_ui_core_library, Text, __UIEvents) {
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule && typeof obj.default !== "undefined" ? obj.default : obj;
  }

  var Orientation = sap_ui_core_library["Orientation"];

  var UIEvents = _interopRequireDefault(__UIEvents);
  /**
   * @namespace sap.esh.search.ui.controls
   */


  var SearchLayoutResponsive = ResponsiveSplitter.extend("sap.esh.search.ui.controls.SearchLayoutResponsive", {
    renderer: {
      apiVersion: 2
    },
    metadata: {
      properties: {
        searchIsBusy: {
          type: "boolean"
        },
        busyDelay: {
          type: "int"
        },
        combinedResultviewToolbar: {
          type: "boolean",
          defaultValue: false
        },
        showFacets: {
          type: "boolean"
        },
        facetPaneResizable: {
          type: "boolean",
          defaultValue: false
        },
        facetPanelWidthInPercent: {
          type: "int",
          defaultValue: "25"
        },
        animateFacetTransition: {
          type: "boolean",
          defaultValue: false
        },
        resultListContainer: {
          // container for table, grid, list (, map)
          type: "sap.ui.core.Control",
          multiple: false
        }
      },
      aggregations: {
        facets: {
          type: "sap.ui.core.Control",
          // ToDo
          multiple: false
        }
      }
    },
    constructor: function _constructor(sId, options) {
      ResponsiveSplitter.prototype.constructor.call(this, sId, options); // facets

      var facetsDummyContainer = new VBox("", {
        items: [new Text()] // dummy for initialization

      });
      this._paneLeftContent = new SplitPane({
        requiredParentWidth: 10,
        // use minimal width -> single pane mode disabled
        content: facetsDummyContainer
      });
      this._paneLeftContainer = new PaneContainer({
        orientation: Orientation.Vertical,
        panes: [this._paneLeftContent]
      }); // result list

      var resListScrollContainer = new ScrollContainer("", {
        height: "100%",
        vertical: true
      }); // pane right, content

      var resListContainer = new VBox("", {
        items: [resListScrollContainer]
      });
      this._paneRightContent = new SplitPane({
        requiredParentWidth: 10,
        // use minimal width -> single pane mode disabled
        content: resListContainer
      }); // pane right, container: header + content

      var combinedToolbar = new VBox();
      combinedToolbar.addStyleClass("sapUiNoMarginBottom");
      this._paneRightHeader = new SplitPane({
        requiredParentWidth: 10,
        // use minimal width -> single pane mode disabled
        content: combinedToolbar
      });
      this._paneRightContainer = new PaneContainer({
        orientation: Orientation.Vertical,
        panes: [this._paneRightHeader, this._paneRightContent]
      }); // facet panel "hidden"

      this._paneLeftContainer.setLayoutData(new SplitterLayoutData({
        size: "0%" // width

      }));
      /* this._paneLeftContent.setLayoutData(
          new SplitterLayoutData({
              size: "0%", // height
              resizable: false,
          })
      ); */
      // vertical


      this._paneRightHeader.setLayoutData(new SplitterLayoutData({
        size: "0%",
        // height
        resizable: false
      }));

      this._paneRightContainer.setLayoutData(new SplitterLayoutData({
        size: "100%" // height

      })); // panes


      var paneContainer = new PaneContainer({
        orientation: Orientation.Horizontal,
        panes: [this._paneLeftContainer, this._paneRightContainer]
      });
      this.setRootPaneContainer(paneContainer);
      this.setDefaultPane(this._paneRightContent);
    },
    getFacets: function _getFacets() {
      var facetContainer = this._paneLeftContent;

      if (facetContainer !== null && facetContainer !== void 0 && facetContainer.getContent()) {
        return facetContainer.getContent();
      }

      return undefined;
    },
    setFacets: function _setFacets(oControl) {
      this._facets = oControl; // this.setAggregation("facets", oControl, true);

      var facetContainer = this._paneLeftContent;

      if (facetContainer) {
        this._paneLeftContainer.removeAllPanes();

        facetContainer.setContent(oControl);

        this._paneLeftContainer.addPane(facetContainer);
      }
    },
    getResultListContainer: function _getResultListContainer() {
      var resultListScrollContainer = this._paneRightContent.getContent();

      if (resultListScrollContainer) {
        return resultListScrollContainer;
      }

      return undefined;
    },
    setResultListContainer: function _setResultListContainer(oControl) {
      this._resultListContainer = oControl; // update result list

      if (this._paneRightContent) {
        this._paneRightContainer.removeAllPanes();

        this._paneRightContent.setContent(oControl);

        this._paneRightContainer.addPane(this._paneRightHeader);

        this._paneRightContainer.addPane(this._paneRightContent);
      } // this.setProperty("resultListContainer", oControl, true);

    },
    setSearchIsBusy: function _setSearchIsBusy(isBusy) {
      var _this = this;

      if (isBusy) {
        if (this._busyFlag) {
          return;
        }

        if (this._busyTimeout) {
          return;
        }

        this._busyTimeout = setTimeout(function () {
          _this._busyTimeout = null;

          _this._setIsBusy(isBusy);
        }, this.getProperty("busyDelay"));
      } else {
        if (this._busyFlag) {
          this._setIsBusy(isBusy);

          return;
        }

        if (this._busyTimeout) {
          clearTimeout(this._busyTimeout);
          this._busyTimeout = null;
          return;
        }
      }
    },
    _setIsBusy: function _setIsBusy(isBusy) {
      var oModel = this.getModel();

      if (isBusy) {
        if (oModel.config.isUshell) {
          if (!this._busyIndicatorModal) {
            this._busyIndicatorModal = new BusyDialog();
          }

          this._busyIndicatorModal.open();
        } else {
          this.setBusy(true);
        }

        this._busyFlag = true;
      } else if (this._busyFlag) {
        if (oModel.config.isUshell) {
          if (this._busyIndicatorModal) {
            this._busyIndicatorModal.close();
          }
        } else {
          this.setBusy(false);
        }

        this._busyFlag = false;
      }

      this.setProperty("searchIsBusy", isBusy, true);
    },
    setCombinedResultviewToolbar: function _setCombinedResultviewToolbar(hasCombinedResultviewToolbar) {
      // the 3rd parameter supresses rerendering
      this.setProperty("combinedResultviewToolbar", hasCombinedResultviewToolbar, true); // this validates and stores the new value

      return this; // return "this" to allow method chaining
    },
    setShowFacets: function _setShowFacets(showFacets) {
      var oModel = this.getModel();

      if (!this._paneRightContainer) {
        return;
      }

      if (!this.getResultListContainer()) {
        return;
      }

      if (this.getProperty("combinedResultviewToolbar")) {
        var headerContent = this._paneRightHeader.getContent();

        if (headerContent.getItems().length === 0) {
          var CountBreadcrumbs = this._resultListContainer.getAggregation("countBreadcrumbs");

          CountBreadcrumbs.addStyleClass("sapElisaSearchContainerCountBreadcrumbs");

          if (oModel.config.FF_optimizeForValueHelp) {
            CountBreadcrumbs.addStyleClass("sapElisaSearchContainerCountBreadcrumbsValueHelp");
          }

          CountBreadcrumbs.addItem(this._resultListContainer.getProperty("countBreadcrumbsHiddenElement"));

          this._paneRightContainer.removeAllPanes();

          this._paneRightHeader.setContent(CountBreadcrumbs);

          this._paneRightContainer.addPane(this._paneRightHeader);

          this._paneRightContainer.addPane(this._paneRightContent);
        }
      } else {
        var _headerContent = this._paneRightHeader.getContent();

        if (_headerContent) {
          this._paneRightHeader.setLayoutData(new SplitterLayoutData({
            size: "0%",
            resizable: false
          }));
        }
      }

      this.updateLayout(showFacets, this.getProperty("combinedResultviewToolbar")); // the 3rd parameter supresses rerendering
      // this.setProperty("showFacets", showFacets, true); // this validates and stores the new value

      return this; // return "this" to allow method chaining
    },
    setFacetPanelWidthInPercent: function _setFacetPanelWidthInPercent(facetPanelWidthInPercentValue) {
      // the 3rd parameter supresses rerendering
      this.setProperty("facetPanelWidthInPercent", facetPanelWidthInPercentValue, true); // this validates and stores the new value

      this._facetPanelWidthSizeIsOutdated = true;
      return this; // return "this" to allow method chaining
    },
    updateLayout: function _updateLayout(facetsAreVisible, hasCombinedResultviewToolbar) {
      var _this$_paneRightConte,
          _this$_paneLeftConten,
          _this2 = this;

      // update facets
      // adjust the facet content
      var facetContainer = this._paneLeftContent;

      if ((facetContainer === null || facetContainer === void 0 ? void 0 : facetContainer.getContent()) instanceof VBox) {
        var vBoxItems = facetContainer.getContent().getItems();

        if ((vBoxItems === null || vBoxItems === void 0 ? void 0 : vBoxItems.length) > 0 && vBoxItems[0] instanceof Text) {
          this._paneLeftContainer.removeAllPanes();

          facetContainer.setContent(this._facets);

          this._paneLeftContainer.addPane(facetContainer);
        }
      } // update result list
      // adjust the container


      if (((_this$_paneRightConte = this._paneRightContent) === null || _this$_paneRightConte === void 0 ? void 0 : _this$_paneRightConte.getContent()) instanceof VBox) {
        var _vBoxItems = this._paneRightContent.getContent().getItems();

        if ((_vBoxItems === null || _vBoxItems === void 0 ? void 0 : _vBoxItems.length) > 0 && _vBoxItems[0] instanceof ScrollContainer) {
          if (_vBoxItems[0].getContent().length === 0) {
            this._paneRightContainer.removeAllPanes();

            this._paneRightContent.setContent(this._resultListContainer);

            this._paneRightContainer.addPane(this._paneRightHeader);

            this._paneRightContainer.addPane(this._paneRightContent);
          }
        }
      } // robustness when triggered by constructor


      if (this._facets) {
        if (this.getProperty("animateFacetTransition")) {
          this._facets.addStyleClass("sapUshellSearchFacetAnimation");
        } else {
          this._facets.removeStyleClass("sapUshellSearchFacetAnimation");
        }
      } // splitter position (header)


      var splitterRightHeaderVerticalSize = 2;

      if (hasCombinedResultviewToolbar) {
        var filterBar = this._paneRightHeader.getContent().getItems()[1];

        if (filterBar !== null && filterBar !== void 0 && filterBar.getVisible()) {
          splitterRightHeaderVerticalSize = 4;
        } else {
          splitterRightHeaderVerticalSize = 2;
        }

        this._paneRightHeader.setLayoutData(new SplitterLayoutData({
          size: "".concat(splitterRightHeaderVerticalSize, "rem"),
          resizable: false
        }));
      } else {
        // splitterRightHeaderVerticalSize = "0%";  -> does not work, header will still block some empty space!!!
        this._paneRightHeader.destroy();
      } // splitter position (facets)


      if (this !== null && this !== void 0 && (_this$_paneLeftConten = this._paneLeftContent) !== null && _this$_paneLeftConten !== void 0 && _this$_paneLeftConten.getContent()) {
        var currentFacetPanelWidthSize;
        var paneLeftContainerLayoutData = this === null || this === void 0 ? void 0 : this._paneLeftContainer.getLayoutData(); // console.log(`facetsAreVisible: ${facetsAreVisible}: ${new Date().toTimeString()}`);

        if (!facetsAreVisible) {
          this._paneLeftContainer.setLayoutData(new SplitterLayoutData({
            size: "0%",
            // width
            resizable: this.getProperty("facetPaneResizable")
          }));
          /* this._paneLeftContent.setLayoutData(
              new SplitterLayoutData({
                  size: "0%", // height
                  resizable: this.getProperty("facetPaneResizable"),
              })
          ); */


          if (this._paneRightContainer) {
            this._paneRightContainer.setLayoutData(new SplitterLayoutData({
              size: "100%" // width

            }));
          }
        } else {
          if (this._facetPanelWidthSizeIsOutdated) {
            currentFacetPanelWidthSize = this.getProperty("facetPanelWidthInPercent");
            this._facetPanelWidthSizeIsOutdated = false;
          } else {
            currentFacetPanelWidthSize = parseInt(paneLeftContainerLayoutData.getProperty("size").replace("%", ""));

            if (currentFacetPanelWidthSize < 1) {
              if (this._previousFacetPanelWidthSize) {
                currentFacetPanelWidthSize = this._previousFacetPanelWidthSize;
              } else {
                currentFacetPanelWidthSize = this.getProperty("facetPanelWidthInPercent");
              }
            }
          }

          this._paneLeftContainer.setLayoutData(new SplitterLayoutData({
            size: currentFacetPanelWidthSize + "%",
            resizable: this.getProperty("facetPaneResizable")
          }));
          /* this._paneLeftContent.setLayoutData(
              new SplitterLayoutData({
                  size: currentFacetPanelWidthSize + "%",
                  resizable: this.getProperty("facetPaneResizable"),
              })
          ); */


          this._previousFacetPanelWidthSize = currentFacetPanelWidthSize; // remember width to restore when showing facets (after having closed them before)

          var resultListPaneWidthInPercent = 100 - currentFacetPanelWidthSize + "%";

          if (hasCombinedResultviewToolbar) {
            this._paneRightContainer.setLayoutData(new SplitterLayoutData({
              size: resultListPaneWidthInPercent
            }));
          } else {
            this._paneRightContainer.setLayoutData(new SplitterLayoutData({
              size: resultListPaneWidthInPercent
            }));
          }
        }
      }

      var handleAnimationEnd = function handleAnimationEnd() {
        _this2.getModel().notifySubscribers(UIEvents.ESHSearchLayoutChanged);
      };

      var $searchFacets = jQuery(".sapUiFixFlexFixed"); // TODO: JQuery

      $searchFacets.one("transitionend", handleAnimationEnd); //  TODO: JQuery
    }
  });
  return SearchLayoutResponsive;
});
})();