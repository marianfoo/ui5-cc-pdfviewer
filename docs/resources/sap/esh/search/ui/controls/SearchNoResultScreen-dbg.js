/*! 
 * SAPUI5

		(c) Copyright 2009-2021 SAP SE. All rights reserved
	 
 */

(function(){
sap.ui.define(["sap/esh/search/ui/i18n", "sap/esh/search/ui/SearchShellHelper", "sap/m/Link", "sap/ui/core/Control", "sap/ui/core/IconPool"], function (i18n, SearchShellHelper, Link, Control, IconPool) {
  function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function () {}; return { s: F, n: function () { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function (e) { throw e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function () { it = it.call(o); }, n: function () { var step = it.next(); normalCompletion = step.done; return step; }, e: function (e) { didErr = true; err = e; }, f: function () { try { if (!normalCompletion && it.return != null) it.return(); } finally { if (didErr) throw err; } } }; }

  function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

  function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

  /**
   * @namespace sap.esh.search.ui.controls
   */
  var SearchNoResultScreen = Control.extend("sap.esh.search.ui.controls.SearchNoResultScreen", {
    renderer: {
      apiVersion: 2,
      render: function render(oRm, oControl) {
        var searchInput = SearchShellHelper.getSearchInput();
        var ariaDescriptionIdForNoResults;

        if (searchInput) {
          ariaDescriptionIdForNoResults = searchInput.getAriaDescriptionIdForNoResults();
        }

        var id = oControl.getId(); // open 1

        oRm.openStart("div", oControl);
        oRm["class"]("sapUshellSearch-no-result");
        oRm.openEnd(); // icon

        oRm.openStart("div", id + "no-result-icon");
        oRm["class"]("sapUshellSearch-no-result-icon");
        oRm.openEnd();
        oRm.icon(IconPool.getIconURI("message-popup"));
        oRm.close("div"); // open 2

        oRm.openStart("div", id + "no-result-text");
        oRm["class"]("sapUshellSearch-no-result-text");
        oRm.openEnd(); // open 3

        oRm.openStart("div", ariaDescriptionIdForNoResults || id + "-no-result-info");

        if (ariaDescriptionIdForNoResults) {
          oRm.attr("tabindex", "0");
        }

        oRm["class"]("sapUshellSearch-no-result-info");
        oRm.openEnd();
        var searchTerm = oControl.getProperty("searchBoxTerm");
        oRm.text(i18n.getText("no_results_info_1", [searchTerm]));
        oRm.openStart("br", id + "-no-results-info-2");
        oRm.openEnd();
        oRm.close("br");
        oRm.text(i18n.getText("no_results_info_2")); // close 3

        oRm.close("div"); // deactivated because app finder is not always active
        // and also ushell specific coding is bad
        // oControl.renderAppFinderLink(oRm);
        // open 3

        oRm.openStart("div", id + "-no-result-tips");
        oRm.attr("id", "searchFieldInShell-input-No-Results-Tips");
        oRm["class"]("sapUshellSearch-no-result-tips");
        oRm.attr("tabindex", "0");
        oRm.openEnd();
        oRm.openStart("b", id + "-no-results-tips-title");
        oRm.openEnd();
        oRm.text(i18n.getText("no_results_tips_title"));
        oRm.close("b");
        oRm.openStart("ul", id + "-no-results-tips-list");
        oRm.openEnd();
        oRm.openStart("li", id + "-no-results-tip-1");
        oRm.openEnd();
        oRm.text(i18n.getText("no_results_tip_1"));
        oRm.close("li");
        oRm.openStart("li", id + "-no-results-tip-2");
        oRm.openEnd();
        oRm.text(i18n.getText("no_results_tip_2"));
        oRm.close("li");
        oRm.openStart("li", id + "-no-results-tip-3");
        oRm.openEnd();
        oRm.text(i18n.getText("no_results_tip_3"));
        oRm.close("li");
        oRm.close("ul"); // close 3

        oRm.close("div");
        oControl.renderToolbar(oRm, oControl); // close 2

        oRm.close("div"); // close 1

        oRm.close("div");
      }
    },
    metadata: {
      properties: {
        isUshell: "boolean",
        dataSource: "object",
        appSearchDataSource: "object",
        searchBoxTerm: "string"
      },
      aggregations: {
        toolbar: {
          type: "sap.ui.core.Control",
          multiple: true
        }
      }
    },
    constructor: function _constructor(sId, options) {
      Control.prototype.constructor.call(this, sId, options);
    },
    renderAppFinderLink: function _renderAppFinderLink(oRm) {
      var oCrossAppNavigator;

      if (sap && sap.ushell && sap.ushell.Container && sap.ushell.Container.getServiceAsync) {
        var oContainer = sap.ushell.Container;
        oContainer.getServiceAsync("SmartNavigation").then(function (service) {
          oCrossAppNavigator = service;
        })["catch"](function () {
          oContainer.getServiceAsync("CrossApplicationNavigation").then(function (service) {
            oCrossAppNavigator = service;
          });
        });
      }

      if (!this.getProperty("isUshell")) {
        return;
      }

      if (this.getProperty("dataSource") !== this.getProperty("appSearchDataSource")) {
        return;
      }

      var linkText = i18n.getText("no_results_link_appfinder", ["xxxx"]);
      var index = linkText.indexOf("xxxx");
      var prefix = linkText.slice(0, index);
      var suffix = linkText.slice(index + 4);
      oRm.openStart("div", this.getId() + "-no-results-appfinder-link");
      oRm["class"]("sapUshellSearch-no-result-info");
      oRm.openEnd();
      oRm.text(prefix);
      var link = new Link({
        text: i18n.getText("appFinderTitle"),
        press: function press() {
          if (oCrossAppNavigator) {
            oCrossAppNavigator.toExternal({
              target: {
                shellHash: "#Shell-home&/appFinder/catalog"
              }
            });
          }
        }
      });
      oRm.renderControl(link);
      oRm.text(suffix);
      oRm.close("div");
    },
    renderToolbar: function _renderToolbar(oRm, oControl) {
      var toolbarControls = oControl.getAggregation("toolbar");

      var _iterator = _createForOfIteratorHelper(toolbarControls),
          _step;

      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var toolbarControl = _step.value;
          oRm.renderControl(toolbarControl);
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
    }
  });
  return SearchNoResultScreen;
});
})();