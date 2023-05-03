/*! 
 * SAPUI5

		(c) Copyright 2009-2021 SAP SE. All rights reserved
	 
 */

(function(){
sap.ui.define(["sap/ui/core/InvisibleText", "sap/m/Button", "sap/m/library", "sap/m/Menu", "sap/m/MenuItem", "sap/m/FlexBox", "sap/m/FlexItemData", "sap/esh/search/ui/controls/SearchInput", "sap/esh/search/ui/controls/SearchButton", "sap/ui/core/Control", "./SearchSelect", "./SearchSelectQuickSelectDataSource", "sap/ui/core/IconPool", "sap/m/MessagePopover", "sap/ui/model/BindingMode", "sap/m/MessageItem", "sap/m/OverflowToolbarLayoutData", "../i18n"], function (InvisibleText, Button, sap_m_library, Menu, MenuItem, FlexBox, FlexItemData, SearchInput, SearchButton, Control, __SearchSelect, __SearchSelectQuickSelectDataSource, IconPool, MessagePopover, BindingMode, MessageItem, OverflowToolbarLayoutData, __i18n) {
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule && typeof obj.default !== "undefined" ? obj.default : obj;
  }

  function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function () {}; return { s: F, n: function () { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function (e) { throw e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function () { it = it.call(o); }, n: function () { var step = it.next(); normalCompletion = step.done; return step; }, e: function (e) { didErr = true; err = e; }, f: function () { try { if (!normalCompletion && it.return != null) it.return(); } finally { if (didErr) throw err; } } }; }

  function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

  function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

  var ButtonType = sap_m_library["ButtonType"];
  var FlexAlignItems = sap_m_library["FlexAlignItems"];

  var SearchSelect = _interopRequireDefault(__SearchSelect);

  var SearchSelectQuickSelectDataSource = _interopRequireDefault(__SearchSelectQuickSelectDataSource);

  var PlacementType = sap_m_library["PlacementType"];
  var OverflowToolbarPriority = sap_m_library["OverflowToolbarPriority"];

  var i18n = _interopRequireDefault(__i18n);
  /**
   * @namespace sap.esh.search.ui.controls
   */


  var SearchFieldGroup = Control.extend("sap.esh.search.ui.controls.SearchFieldGroup", {
    renderer: {
      apiVersion: 2,
      render: function render(oRm, oControl) {
        oRm.openStart("div", oControl);
        oRm["class"]("SearchFieldGroup");
        oRm.openEnd();
        oRm.renderControl(oControl.getAggregation("_topFlexBox"));
        oRm.renderControl(oControl.getAggregation("_flexBox"));
        oRm.renderControl(oControl.getAggregation("_buttonAriaText"));
        oRm.close("div");
      }
    },
    metadata: {
      properties: {
        selectActive: {
          defaultValue: true,
          type: "boolean"
        },
        selectQsDsActive: {
          defaultValue: false,
          type: "boolean"
        },
        inputActive: {
          defaultValue: true,
          type: "boolean"
        },
        buttonActive: {
          defaultValue: true,
          type: "boolean"
        },
        cancelButtonActive: {
          defaultValue: true,
          type: "boolean"
        },
        messagesButtonActive: {
          defaultValue: false,
          type: "boolean"
        },
        actionsMenuButtonActive: {
          defaultValue: false,
          type: "boolean"
        }
      },
      aggregations: {
        _topFlexBox: {
          type: "sap.m.FlexBox",
          multiple: false,
          visibility: "hidden"
        },
        _flexBox: {
          type: "sap.m.FlexBox",
          multiple: false,
          visibility: "hidden"
        },
        _buttonAriaText: {
          type: "sap.ui.core.InvisibleText",
          multiple: false,
          visibility: "hidden"
        }
      }
    },
    constructor: function _constructor(sId, options) {
      Control.prototype.constructor.call(this, sId, options);
      this.initSelect();
      this.initSelectQsDs();
      this.initInput();
      this.initButton();
      this.initCancelButton();
      this.initMessagesButton();
      this.initActionsMenuButton();
      this.initFlexBox();
    },
    setCancelButtonActive: function _setCancelButtonActive(active) {
      if (active === this.getProperty("cancelButtonActive")) {
        return;
      }

      this.setProperty("cancelButtonActive", active);
      this.initFlexBox();
    },
    setMessagesButtonActive: function _setMessagesButtonActive(active) {
      if (active === this.getProperty("messagesButtonActive")) {
        return;
      }

      this.setProperty("messagesButtonActive", active);
      this.initFlexBox();
    },
    setActionsMenuButtonActive: function _setActionsMenuButtonActive(active) {
      if (active === this.getProperty("actionsMenuButtonActive")) {
        return;
      }

      this.setProperty("actionsMenuButtonActive", active);
      this.initFlexBox();
    },
    setSelectQsDsActive: function _setSelectQsDsActive(active) {
      if (active === this.getProperty("selectQsDsActive")) {
        return;
      }

      this.setProperty("selectQsDsActive", active);
      this.initFlexBox();
    },
    initFlexBox: function _initFlexBox() {
      if (!this.select) {
        return;
      }

      if (!this.selectQsDs) {
        return;
      }

      var topItems = [];
      var items = [];

      if (this.getProperty("selectActive")) {
        this.select.setLayoutData(new FlexItemData("", {
          growFactor: 0
        }));
        items.push(this.select);
      }

      if (this.getProperty("selectQsDsActive")) {
        this.selectQsDs.setLayoutData(new FlexItemData("", {
          growFactor: 1
        }));
        topItems.push(this.selectQsDs);
      }

      if (this.getProperty("inputActive")) {
        this.input.setLayoutData(new FlexItemData("", {
          growFactor: 1
        }));
        items.push(this.input);
      }

      if (this.getProperty("buttonActive")) {
        this.button.setLayoutData(new FlexItemData("", {
          growFactor: 0
        }));
        items.push(this.button);
      }

      if (this.getProperty("cancelButtonActive")) {
        this.cancelButton.setLayoutData(new FlexItemData("", {
          growFactor: 0
        }));
        items.push(this.cancelButton);
      }

      if (this.getProperty("actionsMenuButtonActive")) {
        this.actionsMenuButton.setLayoutData(new FlexItemData("", {
          growFactor: 0
        }));
        items.push(this.actionsMenuButton);
      }

      if (this.getProperty("messagesButtonActive")) {
        this.messagesButton.setLayoutData(new FlexItemData("", {
          growFactor: 0
        }));
        items.push(this.messagesButton);
      }

      if (this.getProperty("selectQsDsActive")) {
        var topFlexBox = this.getAggregation("_topFlexBox");

        if (!topFlexBox) {
          topFlexBox = new FlexBox("", {
            items: topItems
          });
          this.setAggregation("_topFlexBox", topFlexBox);
        } else {
          topFlexBox.removeAllAggregation("items");

          var _iterator = _createForOfIteratorHelper(topItems),
              _step;

          try {
            for (_iterator.s(); !(_step = _iterator.n()).done;) {
              var topItem = _step.value;
              topFlexBox.addItem(topItem);
            }
          } catch (err) {
            _iterator.e(err);
          } finally {
            _iterator.f();
          }
        }
      }

      var flexBox = this.getAggregation("_flexBox");

      if (!flexBox) {
        flexBox = new FlexBox("", {
          alignItems: FlexAlignItems.Start,
          items: items
        });
        this.setAggregation("_flexBox", flexBox);
      } else {
        flexBox.removeAllAggregation("items");

        var _iterator2 = _createForOfIteratorHelper(items),
            _step2;

        try {
          for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
            var item = _step2.value;
            flexBox.addItem(item);
          }
        } catch (err) {
          _iterator2.e(err);
        } finally {
          _iterator2.f();
        }
      }
    },
    initSelect: function _initSelect() {
      this.select = new SearchSelect(this.getId() + "-select", {});
      this.select.attachChange(function () {
        if (this.getAggregation("input")) {
          var input = this.getAggregation("input");
          input.destroySuggestionRows();
        }
      });
    },
    initSelectQsDs: function _initSelectQsDs() {
      this.selectQsDs = new SearchSelectQuickSelectDataSource(this.getId() + "-selectQsDs", {});
      this.selectQsDs.attachChange(function () {
        if (this.getAggregation("input")) {
          var input = this.getAggregation("input");
          input.destroySuggestionRows();
        }
      });
    },
    initInput: function _initInput() {
      this.input = new SearchInput(this.getId() + "-input");
    },
    initButton: function _initButton() {
      var _this = this;

      this.button = new SearchButton(this.getId() + "-button", {
        tooltip: {
          parts: [{
            path: "/searchButtonStatus"
          }],
          formatter: function formatter(searchButtonStatus) {
            return i18n.getText("searchButtonStatus_" + searchButtonStatus);
          }
        },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        press: function press(event) {
          // searchterm is empty and datasource==all
          // do not trigger search instead close search field
          var model = _this.button.getModel();

          if (!model.config.odataProvider && model.config.isUshell) {
            if (_this.input.getValue() === "" && model.getDataSource() === model.getDefaultDataSource()) {
              return;
            }
          } // trigger search


          model.invalidateQuery();

          _this.input.destroySuggestionRows();

          _this.input.triggerSearch();
        }
      });
      var oInvisibleText = new InvisibleText(this.getId() + "-buttonAriaText", {
        text: {
          parts: [{
            path: "/searchButtonStatus"
          }],
          formatter: function formatter(searchButtonStatus) {
            return i18n.getText("searchButtonStatus_" + searchButtonStatus);
          }
        }
      });
      this.setAggregation("_buttonAriaText", oInvisibleText);
      this.button.addAriaLabelledBy(this.getAggregation("_buttonAriaText"));
    },
    initCancelButton: function _initCancelButton() {
      this.cancelButton = new Button(this.getId() + "-buttonCancel", {
        text: "{i18n>cancelBtn}"
      });
      this.cancelButton.addStyleClass("sapUshellSearchCancelButton");
    },
    initMessagesButton: function _initMessagesButton() {
      var _this2 = this;

      // create error message popover
      this.errorPopover = new MessagePopover(this.getId() + "-searchMessagePopover", {
        placement: PlacementType.Bottom
      });
      this.errorPopover.bindAggregation("items", {
        path: "/errors",
        factory: function factory() {
          var item = new MessageItem("", {
            title: "{title}",
            description: "{description}"
          });
          return item;
        }
      }); // create status button for error message popover

      this.messagesButton = new Button(this.getId() + "-searchErrorButton", {
        icon: IconPool.getIconURI("alert"),
        text: {
          parts: [{
            path: "/errors/length"
          }],
          formatter: function formatter(length) {
            return length;
          }
        },
        visible: {
          parts: [{
            path: "/errors/length"
          }],
          formatter: function formatter(length) {
            return length > 0;
          },
          mode: BindingMode.OneWay
        },
        type: ButtonType.Emphasized,
        tooltip: "{i18n>errorBtn}",
        press: function press() {
          if (!_this2.errorPopover.getModel()) {
            // ToDo, not everyone calls setModel() after creating a SearchFieldGroup instance
            _this2.errorPopover.setModel(_this2.getModel());
          }

          if (_this2.errorPopover.isOpen()) {
            _this2.errorPopover.close();
          } else {
            _this2.errorPopover.setVisible(true);

            _this2.errorPopover.openBy(_this2.messagesButton);
          }
        }
      });
      this.messagesButton.addStyleClass("sapUiTinyMarginBegin");
      this.messagesButton["addDelegate"]({
        onAfterRendering: function onAfterRendering() {
          var oModel = _this2.getModel();

          oModel.setProperty("/messagePopoverControlId", _this2.errorPopover.getId());

          if (!oModel.getProperty("/isErrorPopovered")) {
            // automatically open the error popup (only after first rendering of button)
            _this2.messagesButton.firePress();

            oModel.setProperty("/isErrorPopovered", true);
          }
        }
      });
      this.messagesButton.setLayoutData(new OverflowToolbarLayoutData("", {
        priority: OverflowToolbarPriority.NeverOverflow
      }));
      this.messagesButton.addStyleClass("sapUshellSearchMessagesButton");
    },
    initActionsMenuButton: function _initActionsMenuButton() {
      var _this3 = this;

      this.actionsMenuButton = new Button(this.getId() + "-actionsMenuButton", {
        icon: "sap-icon://overflow",
        type: ButtonType.Emphasized,
        press: function press() {
          var menuItems = []; // sort

          var menuItemSort = new MenuItem({
            text: "{i18n>actionsMenuSort}",
            icon: "sap-icon://sort",
            press: function press() {
              var sortBtn = document.querySelectorAll(".sapUshellSearchTableSortButton")[0];
              var sortBtnUi5 = sap.ui.getCore().byId(sortBtn.id); // sap.m.Button

              sortBtnUi5.firePress();
            }
          });
          menuItems.push(menuItemSort); // filter

          var menuItemFilter = new MenuItem({
            text: "{i18n>actionsMenuFilter}",
            icon: "sap-icon://filter",
            press: function press() {
              var firstFilterBtn = document.querySelectorAll(".sapUshellSearchFacetShowMoreLink")[0];
              firstFilterBtn.focus();
              firstFilterBtn.click();
              /* const showAllFilterBtn = document.querySelector(
              ".sapUshellSearchFacetFilterShowAllFilterBtn"
              )[0] as any;
              showAllFilterBtn.click(); */
            }
          });
          menuItems.push(menuItemFilter);
          _this3.actionsMenu = new Menu({
            items: menuItems
          });

          _this3.actionsMenu.setModel(_this3.getModel("i18n"), "i18n");

          _this3.actionsMenu.openBy(_this3.actionsMenuButton, true);
        },
        visible: {
          // sort/filter dialog only available if exactly one data source is active
          parts: [{
            path: "/facets"
          }, {
            path: "/facetVisibility"
          }],
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          formatter: function formatter(facets, facetVisibility) {
            if ((facets === null || facets === void 0 ? void 0 : facets.length) > 0 && facets.filter(function (facet) {
              return facet.facetType === "attribute" || facet.facetType === "hierarchy" || facet.facetType === "hierarchyStatic";
            }).length > 0 && facetVisibility) {
              return true;
            } else {
              return false;
            }
          }
        }
      });
      this.actionsMenuButton.addStyleClass("sapUiTinyMarginBegin"); // this.actionsMenuButton.addStyleClass("sapUshellSearchActionsMenuButton");
    },
    setModel: function _setModel(oModel, sName) {
      this.select.setModel(oModel, sName);
      this.input.setModel(oModel, sName); // ToDo

      this.button.setModel(oModel, sName);
      this.cancelButton.setModel(oModel, sName);
      this.messagesButton.setModel(oModel, sName);
      this.errorPopover.setModel(oModel, sName);
      this.actionsMenuButton.setModel(oModel, sName);
      this.getAggregation("_buttonAriaText").setModel(oModel, sName);
      return this;
    },
    destroy: function _destroy() {
      Control.prototype.destroy.call(this);

      if (this.select) {
        this.select.destroy();
      }

      if (this.selectQsDs) {
        this.selectQsDs.destroy();
      }

      if (this.cancelButton) {
        this.cancelButton.destroy();
      }

      if (this.messagesButton) {
        this.messagesButton.destroy();
      }

      if (this.errorPopover) {
        this.errorPopover.destroy();
      }

      if (this.actionsMenuButton) {
        this.actionsMenuButton.destroy();
      }

      if (this.actionsMenu) {
        this.actionsMenu.destroy();
      }
    }
  });
  return SearchFieldGroup;
});
})();