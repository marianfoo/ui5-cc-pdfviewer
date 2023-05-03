/*! 
 * SAPUI5

		(c) Copyright 2009-2021 SAP SE. All rights reserved
	 
 */

(function(){
sap.ui.define(["sap/ui/core/Control", "../i18n", "sap/m/ToggleButton", "sap/ui/model/BindingMode"], function (Control, __i18n, ToggleButton, BindingMode) {
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule && typeof obj.default !== "undefined" ? obj.default : obj;
  }

  var i18n = _interopRequireDefault(__i18n);

  /**
   * @namespace sap.esh.search.ui.controls
   */
  var SearchMultiSelectionControl = Control.extend("sap.esh.search.ui.controls.SearchMultiSelectionControl", {
    renderer: {
      apiVersion: 2,
      render: function render(oRm, oControl) {
        oRm.openStart("div", oControl);
        oRm["class"]("sapUshellSearchResultList-MultiSelectionControl");
        oRm.openEnd();
        oRm.renderControl(oControl);
        oRm.close("div");
      }
    },
    metadata: {
      properties: {
        resultList: "object"
      },
      aggregations: {
        actions: "object"
      }
    },
    _renderer: function _renderer(oRm) {
      var oSearchModel = this.getModel();
      var editButton = new ToggleButton({
        icon: "sap-icon://multi-select",
        tooltip: i18n.getText("toggleSelectionModeBtn"),
        press: function press() {
          if (this.getPressed()) {
            this.getProperty("resultList").enableSelectionMode();
            oSearchModel.setProperty("/multiSelectionEnabled", true);
          } else {
            this.getProperty("resultList").disableSelectionMode();
            oSearchModel.setProperty("/multiSelectionEnabled", false);
          }
        },
        visible: false,
        pressed: {
          parts: [{
            path: "/multiSelectionEnabled"
          }],
          formatter: function formatter(length) {
            return length > 0;
          },
          mode: BindingMode.OneWay
        }
      });
      editButton.setModel(oSearchModel);
      editButton.addStyleClass("sapUshellSearchResultList-toggleMultiSelectionButton");
      oRm.renderControl(editButton);
    }
  });
  return SearchMultiSelectionControl;
});
})();