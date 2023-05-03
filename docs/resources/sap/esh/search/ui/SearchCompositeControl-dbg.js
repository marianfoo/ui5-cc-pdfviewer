/*! 
 * SAPUI5

		(c) Copyright 2009-2021 SAP SE. All rights reserved
	 
 */

(function(){
sap.ui.define(["./error/ErrorHandler", "./i18n", "sap/ui/model/resource/ResourceModel", "sap/esh/search/ui/controls/SearchFieldGroup", "sap/esh/search/ui/SearchModel", "sap/esh/search/ui/controls/SearchLayoutResponsive", "sap/esh/search/ui/controls/SearchResultListContainer", "sap/esh/search/ui/controls/SearchResultList", "sap/esh/search/ui/controls/SearchResultTable", "sap/esh/search/ui/controls/SearchResultGrid", "sap/esh/search/ui/controls/SearchSpreadsheet", "sap/esh/search/ui/controls/SearchNoResultScreen", "sap/esh/search/ui/controls/SearchText", "sap/esh/search/ui/controls/SearchLink", "sap/esh/search/ui/controls/SearchCountBreadcrumbs", "sap/esh/search/ui/controls/SearchResultListItem", "sap/esh/search/ui/controls/CustomSearchResultListItem", "sap/esh/search/ui/controls/SearchTileHighlighter", "sap/esh/search/ui/controls/SearchFilterBar", "sap/esh/search/ui/controls/SearchFacetFilter", "sap/esh/search/ui/SearchHelper", "sap/ui/core/Control", "sap/ui/core/InvisibleText", "sap/ui/core/Icon", "sap/ui/core/IconPool", "sap/ui/layout/VerticalLayout", "sap/ui/model/BindingMode", "sap/m/Button", "sap/m/library", "sap/m/SegmentedButton", "sap/m/SegmentedButtonItem", "sap/m/ToggleButton", "sap/m/Bar", "sap/m/IconTabBar", "sap/m/IconTabFilter", "sap/m/OverflowToolbarLayoutData", "sap/m/OverflowToolbar", "sap/m/ToolbarSeparator", "sap/m/Label", "sap/m/Text", "sap/m/Column", "sap/m/ColumnListItem", "sap/m/CustomListItem", "sap/m/ActionSheet", "sap/m/FlexBox", "sap/m/GenericTile", "sap/m/TileContent", "sap/m/ViewSettingsDialog", "sap/m/ViewSettingsItem", "sap/m/MessagePopover", "sap/m/MessageItem", "sap/m/HBox", "sap/m/VBox", "sap/f/GridContainer", "sap/f/GridContainerSettings", "sap/f/GridContainerItemLayoutData", "sap/m/TablePersoController", "./error/errors", "./sinaNexTS/providers/abap_odata/UserEventLogger", "sap/base/Log"], function (__ErrorHandler, __i18n, ResourceModel, SearchFieldGroup, SearchModel, SearchLayoutResponsive, SearchResultListContainer, SearchResultList, SearchResultTable, SearchResultGrid, SearchSpreadsheet, SearchNoResultScreen, SearchText, SearchLink, SearchCountBreadcrumbs, SearchResultListItem, CustomSearchResultListItem, sap_esh_search_ui_controls_SearchTileHighlighter, SearchFilterBar, SearchFacetFilter, SearchHelper, Control, InvisibleText, Icon, IconPool, VerticalLayout, BindingMode, Button, sap_m_library, SegmentedButton, SegmentedButtonItem, ToggleButton, Bar, IconTabBar, IconTabFilter, OverflowToolbarLayoutData, OverflowToolbar, ToolbarSeparator, Label, Text, Column, ColumnListItem, CustomListItem, ActionSheet, FlexBox, GenericTile, TileContent, ViewSettingsDialog, ViewSettingsItem, MessagePopover, MessageItem, HBox, VBox, GridContainer, GridContainerSettings, GridContainerItemLayoutData, TablePersoController, __errors, ___sinaNexTS_providers_abap_odata_UserEventLogger, Log) {
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule && typeof obj.default !== "undefined" ? obj.default : obj;
  }

  function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function () {}; return { s: F, n: function () { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function (e) { throw e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function () { it = it.call(o); }, n: function () { var step = it.next(); normalCompletion = step.done; return step; }, e: function (e) { didErr = true; err = e; }, f: function () { try { if (!normalCompletion && it.return != null) it.return(); } finally { if (didErr) throw err; } } }; }

  function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

  function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

  var ErrorHandler = _interopRequireDefault(__ErrorHandler);

  var i18n = _interopRequireDefault(__i18n);

  var Highlighter = sap_esh_search_ui_controls_SearchTileHighlighter["Highlighter"];
  var ButtonType = sap_m_library["ButtonType"];
  var PlacementType = sap_m_library["PlacementType"];
  var OverflowToolbarPriority = sap_m_library["OverflowToolbarPriority"];
  var ListMode = sap_m_library["ListMode"];
  var ListType = sap_m_library["ListType"];
  var PopinDisplay = sap_m_library["PopinDisplay"];
  var FlexJustifyContent = sap_m_library["FlexJustifyContent"];
  var PopinLayout = sap_m_library["PopinLayout"];

  var errors = _interopRequireDefault(__errors);

  var ProgramError = __errors["ProgramError"];
  var UserEventType = ___sinaNexTS_providers_abap_odata_UserEventLogger["UserEventType"];

  /**
   * Search control (input for search terms, suggestions, facets, result list views "list", "table", "grid")
   *
   */

  /**
   * Constructs a new <code>SearchCompositeControl</code> to interact with SAP Enterprise Search Services.
   *
   * @param {string} [sId] ID for the new control, generated automatically if no ID is given
   * @param {object} [mSettings] Initial settings for the new control
   *
   * @class
   *
   * This is the SAPUI5 composite control by the Enterprise Search Team which helps to make full use of the Enterprise Search Engine
   * features built into ABAP and HANA.
   * It includes a search input box including a suggestion dropdown, a result list which can have different styles including tiles and table, result facets and more.
   * This control is ready to use with an enterprise search backend service but also allows deep modifications to match requirements of adopting applications.
   *
   * @extends sap.ui.core.Control
   *
   * @author SAP SE
   * @version 1.108.1
   *
   * @see https://help.sap.com/viewer/691cb949c1034198800afde3e5be6570/2.0.05/en-US/ce86ef2fd97610149eaaaa0244ca4d36.html
   * @see https://help.sap.com/viewer/6522d0462aeb4909a79c3462b090ec51/1709%20002/en-US
   *
   *
   * @constructor
   * @public
   * @alias sap.esh.search.ui.SearchCompositeControl
   * @since 1.93.0
   * @name sap.esh.search.ui.SearchCompositeControl
   *
   */

  /**
   * @namespace sap.esh.search.ui
   */
  var SearchCompositeControl = Control.extend("sap.esh.search.ui.SearchCompositeControl", {
    renderer: {
      apiVersion: 2,
      render: function render(oRm, oControl) {
        oRm.openStart("div", oControl);
        oRm.style("height", "100%");
        oRm.style("width", "100%");
        oRm.openEnd();
        var aChildren = oControl.getAggregation("content");

        if (aChildren) {
          for (var i = 0; i < aChildren.length; i++) {
            oRm.renderControl(aChildren[i]);
          }
        }

        oRm.close("div");
      }
    },
    metadata: {
      library: "sap.esh.search.ui",
      properties: {
        /**
         * An additional CSS class to add to this control
         * @since 1.93.0
         */
        cssClass: {
          type: "string"
        },

        /**
         * Defines the initial search term for the search input.
         * @since 1.93.0
         */
        searchTerm: {
          type: "string",
          group: "Misc",
          defaultValue: ""
        },

        /**
         * Defines if the search control will search for the given term right on control instantiation.
         * @since 1.93.0
         */
        searchOnStart: {
          type: "boolean",
          group: "Behavior",
          defaultValue: true
        },

        /**
                 * Defines the filter root condition of a filter tree which shall be applied to the search request.
                 * This control only allows filter trees which have a the following structure:
                 * complex condition (root level)
                 *      \
                 *  complex condition (attribute level)
                 *        \
                 *      simple condition (attribute value level)
                 * Filter root conditions which do not follow this structure won't be accepted and an error will be thrown.
                 * Please see the below for a more in-depth example.
                 * 
                 * @since 1.98.0
                 * @example
                 * sap.ui.require(
                       [
                            // Adjust the path to the .js files accordingly!
                            "sap/esh/search/ui/sinaNexTS/sina/LogicalOperator",
                            "sap/esh/search/ui/sinaNexTS/sina/ComparisonOperator",
                            "sap/esh/search/ui/sinaNexTS/sina/ComplexCondition",
                            "sap/esh/search/ui/sinaNexTS/sina/SimpleCondition",
                       ], function (
                            LogicalOperatorModule,
                            ComparisonOperatorModule,
                            ComplexConditionModule,
                            SimpleConditionModule
                       ) {
                            ("use strict");
                                // Root condition must always be of type ComplexCondition!
                            const rootCondition = new ComplexConditionModule.ComplexCondition({
                                operator: LogicalOperatorModule.LogicalOperator.And,
                            });
                             // Conditions of root condition must always be of type ComplexCondition!
                            // Create one of those for each attribute.
                            // This condition will hold all values for attribute 'FOLKLORIST':
                            const complexChildCondition = new ComplexConditionModule.ComplexCondition({
                                operator: LogicalOperatorModule.LogicalOperator.Or,
                            });
                             // Conditions of complexChildCondition have to be simple conditions!
                            // This filter specfies the value of the attributes.
                            // The result is an attribute filter like 'FOLKLORIST' = 'Douglas Milford':
                            const simpleGrandChildCondition = new SimpleConditionModule.SimpleCondition({
                                operator: ComparisonOperatorModule.ComparisonOperator.Eq, // results should be equal to the filter value
                                attribute: "FOLKLORIST", // example: name of the attribute
                                value: "Douglas Milford", // example: value of the filter
                            });
                            complexChildCondition.addCondition(simpleGrandChildCondition); // Add the conditions to the condition tree
                            rootCondition.addCondition(complexChildCondition);
                                // The filter tree now looks like this:
                            //                                   rootCondition
                            //                                  /      And    \
                            //                   complexChildCondition       
                            //                   /        Or
                            //        simpleGrandChildCondition ('FOLKLORIST' Eq 'Douglas Milford')
                            // Additional complex child conditions would be linked by an "And" operator, additional simple attribute
                            // filter conditions will be linked by an "Or":
                             // If you would like to apply an additional filter to the 'FOLKLORIST' attribute you can do that, too:
                            const simpleGrandChildCondition2 = new SimpleConditionModule.SimpleCondition({
                                operator: ComparisonOperatorModule.ComparisonOperator.Eq, // results should be equal to the filter value
                                attribute: "FOLKLORIST", // example: name of the attribute
                                value: "Cynthia MacDonald", // example: value of the filter
                            });
                                complexChildCondition.addCondition(simpleGrandChildCondition2);
                             // The filter tree now looks like this:
                            //                                   rootCondition
                            //                                  /      And    
                            //                          complexChildCondition       
                            //                         /         Or          \
                            // simpleGrandChildCondition               simpleGrandChildCondition2
                             // create a new search ui:
                            const searchUI = new SearchCompositeControl({
                                filterRootCondition: rootCondition,
                            });
                             // or if it already exists:
                            // const searchUI = window.sap.ui.getCore().byId("eshCompGenId_0");
                            // searchUI.setFilterRootCondition(rootCondition);
                   });
                */
        filterRootCondition: {
          type: "object",
          group: "Misc"
        },

        /**
         * Configuration for the Enterprise Search Client API.
         * @since 1.93.0
         */
        sinaConfiguration: {
          type: "object",
          group: "Misc"
        },

        /**
         * The id of the data source in which it will search right after initialization.
         * @since 1.98.0
         */
        dataSource: {
          type: "string",
          group: "Misc"
        },

        /**
         * Defines selectable search result view types.
         * The value can be set/get in attach event "searchFinished".
         * Case 1: Search in Apps: result is displayed in a mandatory view type <code>["appSearchResult"]</code>, and it is not switchable.
         * Case 2: Search in All or other Category: result is switchable between different view types.
         * Possible values for the array items are <code>"searchResultList"</code> and <code>"searchResultGrid"</code>.
         * Case 3, Search in Business Object: result is switchable between different view types.
         * Possible values for the array items are <code>"searchResultList"</code>, <code>"searchResultTable"</code> and <code>"searchResultGrid"</code>.
         * Note: The value of <code>resultViewTypes</code> and <code>resultViewType</code> must be compatible to each other.
         *
         * @since 1.98.0
         */
        resultViewTypes: {
          type: "string[]",
          group: "Misc",
          defaultValue: ["searchResultList", "searchResultTable"] //  Case 2.1, Search in All or other Category (configuration.isUshell !== true): result is switchable between different view types.
          //  Possible values for the array items are <code>"searchResultList"</code> and <code>"searchResultGrid"</code>.
          //  Case 2.2, Search in All or other Category (configuration.isUshell === true): result is displayed in a mandatory view type <code>["searchResultList"]</code>.

        },

        /**
         * Defines active search result view type.
         * The value can be set/get in attach event "searchFinished", and it must be contained in resultViewTypes.
         * Case 1, Search in Apps: result is displayed in a mandatory view type <code>"appSearchResult"</code>.
         * Case 2.1, Search in All or other Category (configuration.isUshell !== true): result is switchable between different view types.
         * Possible value is <code>"searchResultList"</code>, or <code>"searchResultGrid"</code>.
         * Case 2.2, Search in All or other Category (configuration.isUshell === true): result is displayed in a mandatory view type <code>"searchResultList"</code>.
         * Case 3, Search in Business Object: result is switchable between different view types.
         * Possible value is <code>"searchResultList"</code>, <code>"searchResultTable"</code> or <code>"searchResultGrid"</code>.
         * Note: The value of <code>resultViewTypes</code> and <code>resultViewType</code> must be compatible to each other.
         *
         * @since 1.98.0
         */
        resultViewType: {
          type: "string",
          group: "Misc",
          defaultValue: "searchResultList"
        },

        /**
         * Defines a pair of search result view settings.
         * The value is an object of properties <code>resultViewTypes</code> and <code>resultViewType</code>.
         * An example: <code>{resultViewTypes: ["searchResultList", "searchResultTable"], resultViewType: "searchResultList"}</code>
         * Find more detail in the definition of each child property.
         * The value can be set/get in attached event "searchFinished".
         * Function <code>setResultViewSettings</code> prevents incompatibility of sequential execution of functions <code>setResultViewTypes</code> and <code>setResultViewType</code>.
         * Note: The value of <code>resultViewTypes</code> and <code>resultViewType</code> must be compatible to each other.
         *
         * @since 1.100.0
         */
        resultViewSettings: {
          settings: {
            resultViewTypes: "string[]",
            resultViewType: "string"
          },
          group: "Misc",
          defaultValue: {
            resultViewTypes: ["searchResultList", "searchResultTable"],
            resultViewType: "searchResultList"
          }
        },

        /**
         * Function callback for formatting the datasource tabstrips in the top toolbar.
         * To the callback function a list of datasources is passed. The callback functions return a modified list of datasources
         * to be displayed in the tabstrips.
         *
         * @since 1.103.0
         */
        tabStripsFormatter: {
          type: "function",
          group: "Misc"
        },

        /**
         * Function callback for assembling the search count breadcumbs.
         * The function callback shall return a control which is displayed on the top of the result list.
         * Typically this is used for displaying the total count.
         *
         * @since 1.103.0
         */
        assembleSearchCountBreadcrumbs: {
          type: "function",
          group: "Misc"
        },

        /**
         * Activates the folder mode. Precondition for folder mode is
         * 1) Search model:
         * In the search model for the current datasource a hierarchy attribute (representing the folders) is defined
         * 1.1) the hierarchy attribute is annotated with displayType=TREE and for the hierarchy there is a helper
         * connector representing the hierarchy or
         * 1.2) the current datasource is the helper datasource representing the folder hierarchy. The hierarchy attribute
         * is annotated with displayType=FLAT
         * 2) Search query:
         * The folder mode is only active in case the search query has an empty search term and no filter conditions
         * (except the hierarchy attribute) are set.
         *
         * In folder mode and in case a folder filter is set the result view only shows direct children of a folder.
         * In contrast the counts in the facets are calculated by counting direct and not direct children.
         * In case the folder mode is not active the UI uses the search mode: The result list shows direct and
         * not direct children of a folder.
         * * @since 1.106.0
         */
        folderMode: {
          type: "boolean",
          group: "Misc",
          defaultValue: false
        },

        /**
         * In case folder mode is active:
         * Automatically switch result view type to list in search mode and to table in folder mode.
         * @since 1.106.0
         */
        autoAdjustResultViewTypeInFolderMode: {
          type: "boolean",
          group: "Misc",
          defaultValue: false
        },

        /**
         * Enables the query language for the hana_odata provider.
         * With query language it is possible for the end user to enter complex search
         * queries with logical operators.
         * @since 1.107.0
         */
        enableQueryLanguage: {
          type: "boolean",
          group: "Misc",
          defaultValue: false
        }
      },
      aggregations: {
        /**
         * Control instances which are part of this composite control.
         * @private
         */
        content: {
          singularName: "content",
          multiple: true
        }
      },
      events: {
        /**
         * Event is fired when search is started.
         */
        searchStarted: {},

        /**
         * Event is fired when search is finished.
         */
        searchFinished: {}
      }
    },
    constructor: function _constructor(sId, settings) {
      var _this = this;

      // shift arguments in case sId was missing, but mSettings was given
      if (typeof sId !== "string" && sId !== undefined && settings === undefined) {
        settings = sId;
        sId = settings && settings.id;
      } else if (typeof settings === "undefined") {
        settings = {};
      } // add sId to mSettings


      if (typeof sId === "string" && sId.length > 0) {
        settings.id = sId;
      } // no id -> create one


      if (!sId || sId.length === 0) {
        sId = "eshComp" + "GenId_" + SearchCompositeControl.eshCompCounter++;
        settings.id = sId;
      }

      var initialErrorHandler = new ErrorHandler({
        model: null
      });

      try {
        // check sId === mSettings.id
        if (typeof sId === "string" && sId.length > 0 && typeof settings.id !== "undefined") {
          if (sId !== settings.id) {
            var error = new Error("Constructor of component 'sap.esh.search.ui.SearchCompositeControl' has failed\n\n" + "sId and mSettings.id are not the same. It is sufficient to set either 'id' (sId) or 'settings.id' (mSettings.id).");
            var err = new errors.ESHUIConstructionError(error);
            initialErrorHandler.onError(err);
          }
        }

        var settingsKnownToUI5 = {}; // this is a subset of settings which contain only parameters which are also in this controls metadata

        var metadataProperties = SearchCompositeControl.getMetadata().getProperties();
        var metadataPropertyDefaults = SearchCompositeControl.getMetadata().getPropertyDefaults();

        for (var metadataProperty in metadataProperties) {
          if (typeof settings[metadataProperty] === "undefined") {
            settings[metadataProperty] = metadataPropertyDefaults[metadataProperty];
          }

          if (Object.keys(metadataProperties).includes(metadataProperty)) {
            // avoid UI5 assertion errors by only passing known parameters to the super constructor:
            settingsKnownToUI5[metadataProperty] = settings[metadataProperty];
          }
        }

        Control.prototype.constructor.call(this, sId, settingsKnownToUI5);
        this._oLogger = Log.getLogger("sap.esh.search.ui.SearchCompositeControl");
        this.addStyleClass("sapUshellSearchInputHelpPage"); // init search focus handler

        this.oFocusHandler = new SearchHelper.SearchFocusHandler(this);

        try {
          var searchModel = settings["model"] || // ToDo, adjust flp/cflp, user 'searchModel' instead of 'model' (renamed because of syntax check errors with type of existing property 'model')
          settings.searchModel || this.getModel("searchModel");

          if (!searchModel) {
            searchModel = new SearchModel({
              configuration: settings
            });
            this.setModel(searchModel, "searchModel");
          }

          searchModel.isSearchCompositeControl = true;

          if (searchModel.config.FF_optimizeForValueHelp) {
            this.addStyleClass("sapUshellSearchInputHelpPageValueHelp");
          }

          searchModel.focusHandler = this.oFocusHandler;
          initialErrorHandler.setSearchModel(searchModel);
          this.setModel(searchModel);
          this.setModel(new ResourceModel({
            bundle: i18n
          }), "i18n");
          searchModel.config.performanceLogger.enterMethod({
            name: "createContent"
          }, {
            isSearch: true
          });
          this.createContent();
          searchModel.config.performanceLogger.leaveMethod({
            name: "createContent"
          });
        } catch (error) {
          var _oModel = this.getModel();

          if (_oModel) {
            _oModel.config.performanceLogger.leaveMethod({
              name: "createContent"
            });
          }

          var _err = new errors.ESHUIConstructionError(error);

          initialErrorHandler.onError(_err);
        }

        var oModel = this.getModel(); // add getLanguage implementation (default)

        if (settings.sinaConfiguration) {
          var _settings, _settings$sinaConfigu;

          // example: isUshell === true -> no sina configuration
          if (typeof ((_settings = settings) === null || _settings === void 0 ? void 0 : (_settings$sinaConfigu = _settings.sinaConfiguration) === null || _settings$sinaConfigu === void 0 ? void 0 : _settings$sinaConfigu.getLanguage) !== "function") {
            var getLanguageFunction = function getLanguageFunction() {
              return sap.ui.getCore().getConfiguration().getLanguage();
            };

            settings.sinaConfiguration["getLanguage"] = getLanguageFunction;
          }
        }

        oModel.config.performanceLogger.enterMethod({
          name: "init search"
        }, {
          isSearch: true
        });
        oModel.searchUrlParser.parse().then(function () {
          _this.getModel().initAsync().then(function () {
            var oModel = _this.getModel();

            if (_this.getProperty("searchOnStart") && !oModel.config.isUshell) {
              oModel._firePerspectiveQuery();
            }

            if (oModel) {
              oModel.config.performanceLogger.leaveMethod({
                name: "init search"
              });
            }
          });
        });
      } catch (error) {
        initialErrorHandler.onError(error);
      }
    },
    exit: function _exit() {
      if (this.oErrorPopover) {
        this.oErrorPopover.destroy();
      } // in case a custom result screen is used, we need to explicitely destroy the default no result screen
      // in the shadow dom of UI5. Otherwise a duplicate id exception will be thrown if search composite control
      // is instantiated next time.


      this.noResultScreen.destroy(); // avoid to create same-id-TablePersoDialog by oTablePersoController.activate()
      // destroy TablePersoDialog when exit search app

      if (this.oTablePersoController && this.oTablePersoController.getTablePersoDialog()) {
        this.oTablePersoController.getTablePersoDialog().destroy();
      } // oFacetDialog doesn't have id
      // destroy oFacetDialog when exit search app anyway


      if (this !== null && this !== void 0 && this.oSearchPage["oFacetDialog"]) {
        // ToDo
        this.oSearchPage["oFacetDialog"].destroy(); // ToDo
      }

      var oModel = this.getModel();
      oModel.unsubscribe("ESHSearchStarted", this.onAllSearchStarted, this);
      oModel.unsubscribe("ESHSearchFinished", this.onAllSearchFinished, this);
    },
    createContent: function _createContent() {
      var _this2 = this;

      this.oSearchFieldGroup = new SearchFieldGroup(this.getId() + "-searchInputHelpPageSearchFieldGroup");
      this.oSearchFieldGroup.setCancelButtonActive(false);
      this.oSearchFieldGroup.addStyleClass("sapUshellSearchInputHelpPageSearchFieldGroup");
      this.oSearchFieldGroup.input.setShowValueHelp(false);
      var oModel = this.getModel();
      oModel.setProperty("/inputHelp", this.oSearchFieldGroup.input);

      if (oModel.config.FF_optimizeForValueHelp) {
        this.oSearchFieldGroup.setActionsMenuButtonActive(true);
        this.oSearchFieldGroup.setSelectQsDsActive(true);
      }

      if (oModel.config.FF_errorMessagesAsButton) {
        this.oSearchFieldGroup.setMessagesButtonActive(true);
      }

      if (oModel !== null && oModel !== void 0 && oModel.subscribe) {
        if (!this.subscribeDone_SearchStarted) {
          oModel.subscribe("ESHSearchStarted", this.onAllSearchStarted, this);
          this.subscribeDone_SearchStarted = true;
        }

        if (!this.subscribeDone_SearchFinished) {
          oModel.subscribe("ESHSearchFinished", this.onAllSearchFinished, this);
          this.subscribeDone_SearchFinished = true;
        }
      }

      if (oModel) {
        oModel.subscribe("ESHSearchFinished", function () {
          _this2.oSearchFieldGroup.input.setValue(oModel.getSearchBoxTerm());
        }, this);
      }

      this.oSearchBar = new Bar(this.getId() + "-searchBar", {
        visible: {
          parts: [{
            path: "/count"
          }, {
            path: "/facetVisibility"
          }],
          formatter: function formatter(count, facetVisibility) {
            var _oModel$config2;

            if (facetVisibility) {
              var _oModel$config;

              return count !== 0 || (oModel === null || oModel === void 0 ? void 0 : (_oModel$config = oModel.config) === null || _oModel$config === void 0 ? void 0 : _oModel$config.searchBarDoNotHideForNoResults);
            }

            return count !== 0 || (oModel === null || oModel === void 0 ? void 0 : (_oModel$config2 = oModel.config) === null || _oModel$config2 === void 0 ? void 0 : _oModel$config2.searchBarDoNotHideForNoResults);
          }
        },
        contentLeft: [this.assembleFilterButton(), this.assembleDataSourceTabBar()],
        contentRight: this.assembleResultViewButtonToolbar()
      });
      this.oSearchBar.addStyleClass("sapUshellSearchBar");

      if (oModel.config.FF_optimizeForValueHelp) {
        this.oSearchBar.addStyleClass("sapUshellSearchBarValueHelp");
      }

      this.oFilterBar = new SearchFilterBar();
      this.oSearchPage = this.createSearchPage(this.getId());
      this["addContent"](this.oSearchFieldGroup); // ToDo
      // this["addContent"](this.oSearchPage); // ToDo

      var _iterator = _createForOfIteratorHelper(this.oSearchPage),
          _step;

      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var searchPageContent = _step.value;
          this["addContent"](searchPageContent); // ToDo
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
    },
    onAfterRendering: function _onAfterRendering() {
      var oModel = this === null || this === void 0 ? void 0 : this.getModel();

      if (oModel !== null && oModel !== void 0 && oModel.subscribe) {
        if (!this.subscribeDone_SearchStarted) {
          oModel.subscribe("ESHSearchStarted", this.onAllSearchStarted, this);
          this.subscribeDone_SearchStarted = true;
        }

        if (!this.subscribeDone_SearchFinished) {
          oModel.subscribe("ESHSearchFinished", this.onAllSearchFinished, this);
          this.subscribeDone_SearchFinished = true;
        }
      }
    },
    assembleFilterButton: function _assembleFilterButton() {
      var _this3 = this;

      var oModel = this.getModel();
      var filterBtn = new ToggleButton(this.getId() + "-searchBarFilterButton", {
        icon: IconPool.getIconURI("filter"),
        tooltip: {
          parts: [{
            path: "/facetVisibility"
          }],
          formatter: function formatter(facetVisibility) {
            return facetVisibility ? i18n.getText("hideFacetBtn_tooltip") : i18n.getText("showFacetBtn_tooltip");
          }
        },
        pressed: {
          path: "/facetVisibility"
        },
        press: function press(oEvent) {
          var oModel = _this3.getModel(); // open/close facet panel


          _this3.searchLayout.setProperty("animateFacetTransition", true);

          oModel.setFacetVisibility(oEvent.getParameter("pressed"));

          _this3.searchLayout.setProperty("animateFacetTransition", false);
        },
        visible: {
          parts: [{
            path: "/businessObjSearchEnabled"
          }, {
            path: "/count"
          }],
          formatter: function formatter(businessObjSearchEnabled, count) {
            if (count === 0) {
              return false;
            }

            return (// do not show button on phones
              // do not show in value-help mode
              // only show, if business obj. search is active
              !sap.ui.Device.system.phone && !oModel.config.FF_optimizeForValueHelp && businessObjSearchEnabled
            );
          }
        }
      });
      filterBtn.addStyleClass("searchBarFilterButton");
      return filterBtn;
    },
    assembleSearchCountBreadcrumbs: function _assembleSearchCountBreadcrumbs() {
      var _oModel$config3, _oModel$config4;

      var oModel = this.getModel();
      var searchCountBreadcrumbs;
      var count = oModel.getProperty("/count");

      if (oModel !== null && oModel !== void 0 && (_oModel$config3 = oModel.config) !== null && _oModel$config3 !== void 0 && _oModel$config3.assembleSearchCountBreadcrumbs) {
        searchCountBreadcrumbs = oModel.config.assembleSearchCountBreadcrumbs(oModel.getDataSource(), count);
      } else {
        searchCountBreadcrumbs = new SearchCountBreadcrumbs("");
      }

      if (oModel !== null && oModel !== void 0 && (_oModel$config4 = oModel.config) !== null && _oModel$config4 !== void 0 && _oModel$config4.combinedResultviewToolbar) {
        this.oSearchBar.addContentLeft(searchCountBreadcrumbs); // show (top-level) search bar + filter bar on top of result view (merged visualization)

        var combinedResultviewToolbarContent = new VBox("", {
          items: [this.oSearchBar, this.oFilterBar]
        }).addStyleClass("sapElisaCombinedResultViewToolbar");
        combinedResultviewToolbarContent.addStyleClass("sapUiNoMarginBegin");
        combinedResultviewToolbarContent.addStyleClass("sapUiNoMarginEnd");
        return combinedResultviewToolbarContent;
      } else {
        // show (top-level) search bar + filter bar on top of the page, show the counter/breadcrumb on top of result view
        return searchCountBreadcrumbs;
      }
    },
    assembleCountBreadcrumbsHiddenElement: function _assembleCountBreadcrumbsHiddenElement() {
      var countBreadcrumbsHiddenElement = new InvisibleText("", {
        text: {
          parts: [{
            path: "/count"
          }, {
            path: "/nlqSuccess"
          }, {
            path: "/nlqDescription"
          }],
          formatter: function formatter(count, nlqSuccess, nlqDescription) {
            if (nlqSuccess) {
              return nlqDescription;
            }

            if (typeof count !== "number") {
              return "";
            }

            return i18n.getText("results_count_for_screenreaders", [count.toString()]);
          }
        }
      });
      return countBreadcrumbsHiddenElement;
    },
    assembleResultViewButtonToolbar: function _assembleResultViewButtonToolbar() {
      var _this4 = this,
          _oModel$config5,
          _oModel$config6;

      // table data export button
      var dataExportButton = new Button((this.getId() ? this.getId() + "-" : "") + "dataExportButton", {
        icon: "sap-icon://download",
        tooltip: "{i18n>exportData}",
        type: ButtonType.Transparent,
        visible: {
          parts: [{
            path: "/count"
          }, {
            path: "/tableColumns"
          }],
          formatter: function formatter(count, columns) {
            var oModel = _this4.getModel();

            if (oModel && oModel.isHomogenousResult() && count > 0 && columns.length > 0) {
              return true;
            } else {
              return false;
            }
          }
        },
        press: function press() {
          if (_this4.searchSpreadsheet === undefined) {
            _this4.searchSpreadsheet = new SearchSpreadsheet("ushell-search-spreadsheet");
          }

          _this4.searchSpreadsheet.onExport();
        }
      }).addStyleClass("sapUshellSearchTableDataExportButton"); // display-switch tap strips

      this.assembleResultViewSwitch(); // sort button

      var sortButton = new Button("", {
        icon: "sap-icon://sort",
        tooltip: "{i18n>sortTable}",
        type: ButtonType.Transparent,
        visible: {
          parts: [{
            path: "/count"
          }, {
            path: "/sortableAttributes"
          }],
          formatter: function formatter(count, sortAttributes) {
            var oModel = _this4.getModel();

            if (oModel && oModel.isHomogenousResult() && count > 0 && sortAttributes.length > 0) {
              return true;
            } else {
              return false;
            }
          }
        },
        press: function press() {
          // issue: selection information is lost by clicking cancel, multiple reset selection in UI5
          // workaround: rebind sort items by opening dialog
          _this4.sortDialog.unbindAggregation("sortItems", false);

          _this4.sortDialog.bindAggregation("sortItems", {
            path: "/sortableAttributes",
            factory: function factory() {
              return new ViewSettingsItem("", {
                key: {
                  path: "key"
                },
                text: {
                  path: "name"
                },
                selected: {
                  path: "selected"
                }
              });
            }
          });

          _this4.sortDialog.open();
        }
      });
      sortButton.addStyleClass("sapUshellSearchTableSortButton");
      this.resultViewSwitch.addStyleClass("sapUshellSearchResultDisplaySwitch");
      var toolbarSeparator1 = new ToolbarSeparator("", {
        visible: {
          parts: [{
            path: "/resultViewSwitchVisibility"
          }, {
            path: "/count"
          }],
          formatter: function formatter(resultViewSwitchVisibility, count) {
            if (resultViewSwitchVisibility === false || count === 0) {
              return false;
            } else {
              return true;
            }
          }
        }
      }); // table personalize button

      var tablePersonalizeButton = new Button((this.getId() ? this.getId() + "-" : "") + "tablePersonalizeButton", {
        icon: "sap-icon://action-settings",
        tooltip: "{i18n>personalizeTable}",
        type: ButtonType.Transparent,
        enabled: {
          parts: [{
            path: "/resultViewType"
          }],
          formatter: function formatter(resultViewType) {
            return resultViewType === "searchResultTable";
          }
        },
        visible: {
          parts: [{
            path: "/count"
          }, {
            path: "/tableColumns"
          }],
          formatter: function formatter(count, columns) {
            var oModel = _this4.getModel();

            if (oModel && oModel.isHomogenousResult() && count > 0 && columns.length > 0) {
              return true;
            } else {
              return false;
            }
          }
        },
        press: function press() {
          var oModel = _this4.getModel();

          var serviceId = "search-result-table-state-" + oModel.getDataSource().id;
          var oTablePersoController = _this4.oTablePersoController;
          oTablePersoController.getPersoService(serviceId).getPersData().then(function (persData) {
            var _persData$aColumns$;

            if (typeof persData === "undefined" || persData === null) {
              oTablePersoController.openDialog();
              return;
            } // step 1: generate initial columns


            var initialColumns = [];
            var persColumnId = persData === null || persData === void 0 ? void 0 : (_persData$aColumns$ = persData.aColumns[0]) === null || _persData$aColumns$ === void 0 ? void 0 : _persData$aColumns$.id;
            var idPrefix = persColumnId.substring(0, persColumnId.indexOf("TABLE_COLUMN_")); // first persColumn is not TABLE_COLUMN_0 after ordering

            var modelColumns = oModel.getProperty("/tableColumns"); // initial column visibility = column binding visibility (resultTable.bindAggregation("columns",{...}))

            if (oModel.config.extendTableColumn) {
              // has extend column
              modelColumns.forEach(function (column) {
                var _oModel$config$extend;

                initialColumns.push({
                  text: column.name,
                  order: column.index,
                  visible: column.index < 7 || column.attributeId === ((_oModel$config$extend = oModel.config.extendTableColumn.column) === null || _oModel$config$extend === void 0 ? void 0 : _oModel$config$extend.attributeId),
                  id: idPrefix + column.key,
                  group: null
                });
              });
            } else {
              // doesn't have extend column
              modelColumns.forEach(function (column) {
                initialColumns.push({
                  text: column.name,
                  order: column.index,
                  visible: column.index < 6,
                  id: idPrefix + column.key,
                  group: null
                });
              });
            } // step 2: set initial columns to dialog


            oTablePersoController.getTablePersoDialog().setInitialColumnState(initialColumns); // step 3: open dialog

            oTablePersoController.openDialog();
          });
        }
      });
      tablePersonalizeButton.addStyleClass("sapUshellSearchTablePersonalizeButton");
      var oModel = this.getModel();
      var toolbar = [];
      var bWithShareButton = oModel === null || oModel === void 0 ? void 0 : (_oModel$config5 = oModel.config) === null || _oModel$config5 === void 0 ? void 0 : _oModel$config5.isUshell;

      if (bWithShareButton) {
        var shareButton = this.assembleShareButton();
        toolbar = [dataExportButton, sortButton, tablePersonalizeButton, shareButton, toolbarSeparator1, this.resultViewSwitch];
      } else {
        toolbar = [dataExportButton, sortButton, tablePersonalizeButton, toolbarSeparator1, this.resultViewSwitch];
      }

      var customToolbar = oModel === null || oModel === void 0 ? void 0 : (_oModel$config6 = oModel.config) === null || _oModel$config6 === void 0 ? void 0 : _oModel$config6.getCustomToolbar();

      if ((customToolbar === null || customToolbar === void 0 ? void 0 : customToolbar.length) > 0) {
        customToolbar.push(new ToolbarSeparator("", {
          visible: {
            parts: [{
              path: "/resultViewSwitchVisibility"
            }, {
              path: "/count"
            }],
            formatter: function formatter(resultViewSwitchVisibility, count) {
              return resultViewSwitchVisibility && count !== 0;
            }
          }
        }));
      }

      toolbar = customToolbar.concat(toolbar);
      return toolbar;
    },
    assembleShareButton: function _assembleShareButton() {
      var oModel = this.getModel(); // bookmark button (entry in action sheet)

      var oBookmarkButton = new sap.ushell.ui["footerbar"].AddBookmarkButton( // ToDo
      (this.getId() ? this.getId() + "-" : "") + "bookmarkButton", {
        width: "auto",
        beforePressHandler: function beforePressHandler() {
          var oAppData = {
            url: document.URL,
            title: oModel.getDocumentTitle(),
            icon: IconPool.getIconURI("search")
          };
          oBookmarkButton.setAppData(oAppData);
        }
      }); // email button

      var oEmailButton = new Button((this.getId() ? this.getId() + "-" : "") + "emailButton", {
        icon: "sap-icon://email",
        text: i18n.getText("eMailFld"),
        width: "auto",
        press: function press() {
          sap.m.URLHelper.triggerEmail(null, oModel.getDocumentTitle(), document.URL);
        }
      }); // create action sheet

      var oActionSheet = new ActionSheet((this.getId() ? this.getId() + "-" : "") + "shareActionSheet", {
        placement: PlacementType.Bottom,
        buttons: [oBookmarkButton, oEmailButton]
      });
      this.addDependent(oActionSheet); // -> destroys action sheet if SearchCompositeControl gets destroyed
      // button which opens action sheet

      var oShareButton = new Button((this.getId() ? this.getId() + "-" : "") + "shareButton", {
        icon: "sap-icon://action",
        tooltip: i18n.getText("shareBtn"),
        press: function press() {
          oActionSheet.openBy(oShareButton);
        } //  ariaHasPopup: true,

      });
      return oShareButton;
    },
    assembleDataSourceTabBar: function _assembleDataSourceTabBar() {
      var _this5 = this;

      var tabBar = new IconTabBar((this.getId() ? this.getId() + "-" : "") + "dataSourceTabBar", {
        // tabDensityMode: "Compact",  // not working, we have IconTabBar in left container of another bar -> see search.less
        // headerMode: "Inline",   // do not use, confuses css when used on sap.m.Bar
        expandable: false,
        stretchContentHeight: false,
        // selectedKey: "{/tabStrips/strips/selected/id}", // id of selected data source -> does not work, special logic see below, addEventDelegate -> onBeforeRendering
        // backgroundDesign: BackgroundDesign.Transparent  // not relevant, we do not show/use content container
        // content: -> not needed, we only need the 'switcher' for data source change (triggers new search to update search container)
        visible: {
          parts: [{
            path: "/facetVisibility"
          }, {
            path: "/count"
          }, {
            path: "/businessObjSearchEnabled"
          }],
          formatter: function formatter(facetVisibility, count, bussinesObjSearchEnabled) {
            return !facetVisibility && count > 0 && bussinesObjSearchEnabled;
          }
        },
        select: function select(oEvent) {
          var oModel = _this5.getModel();

          if (oModel.getDataSource() !== oEvent.getParameter("item").getBindingContext().getObject()) {
            // selection has changed
            oModel.setDataSource(oEvent.getParameter("item").getBindingContext().getObject());
          } else {
            // selection has NOT changed, but tab lost its arrow/underline (see class sapMITBContentArrow)
            if (tabBar["selectFired"]) {
              tabBar["selectFired"] = false;
            } else {
              tabBar["selectFired"] = true;
              tabBar.fireSelect({
                item: oEvent.getParameter("item")
              }); // make sure the blue line does not vanish (permanently) when clicking active tab (class sapMITBContentArrow, sapMITBSelected). With this logic, it will be at least displayed at mouse-out
            }
          }
        }
      });
      this.tabBar = tabBar; // define group for F6 handling

      tabBar.data("sap-ui-fastnavgroup", "false", true
      /* write into DOM */
      );
      tabBar.addStyleClass("searchTabStripBar");
      tabBar.addStyleClass("searchTabStrips"); // css commented, keep class to prevent breaking existing tests

      tabBar.addStyleClass("sapUiSmallMarginBegin");
      tabBar.addStyleClass("sapUiNoMarginRight");
      tabBar.setAriaTexts({
        headerLabel: i18n.getText("dataSources"),
        headerDescription: i18n.getText("dataSources")
      });
      tabBar.bindAggregation("items", {
        path: "/tabStrips/strips",
        template: new IconTabFilter("", {
          key: "{id}",
          // data source id, only needed for indicator (bottom). We use bindingContext().getObject to switch search container content
          text: "{labelPlural}"
        })
      });
      tabBar.addEventDelegate({
        // special logic, selectedKey not working via binding
        onBeforeRendering: function onBeforeRendering() {
          if (_this5.getModel().getProperty("/tabStrips")) {
            if (tabBar.getSelectedKey() !== _this5.getModel().getProperty("/tabStrips/selected").id) {
              tabBar.setSelectedKey(_this5.getModel().getProperty("/tabStrips/selected").id);
            }
          }
        }
      });
      return tabBar;
    },
    assembleResultViewSwitch: function _assembleResultViewSwitch() {
      var _this6 = this;

      if (this.resultViewSwitch !== undefined) {
        return;
      }

      this.resultViewSwitch = new SegmentedButton(this.getId() + "-ResultViewType", {
        selectedKey: "{/resultViewType}",
        visible: {
          parts: [{
            path: "/resultViewSwitchVisibility"
          }, {
            path: "/count"
          }],
          formatter: function formatter(resultViewSwitchVisibility, count) {
            return resultViewSwitchVisibility && count !== 0;
          }
        },
        selectionChange: function selectionChange(oEvent) {
          var key = oEvent.getParameter("item").getKey();

          _this6.setResultViewType(key);
        }
      });
      this.resultViewSwitch.bindAggregation("items", {
        path: "/resultViewTypes",
        factory: function factory(id, context) {
          var oButton = new SegmentedButtonItem("", {
            visible: true
          });

          switch (context.getObject()) {
            case "searchResultList":
              oButton.setIcon("sap-icon://list");
              oButton.setTooltip(i18n.getText("displayList"));
              oButton.setKey("searchResultList");
              break;

            case "searchResultTable":
              oButton.setIcon("sap-icon://table-view");
              oButton.setTooltip(i18n.getText("displayTable"));
              oButton.setKey("searchResultTable");
              break;

            case "searchResultGrid":
              oButton.setIcon("sap-icon://grid");
              oButton.setTooltip(i18n.getText("displayGrid"));
              oButton.setKey("searchResultGrid");
              break;
            // // deactivate map view due to CSP violation
            // case "searchResultMap":
            // oButton.setIcon("sap-icon://map");
            // oButton.setTooltip(i18n.getText("displayMap"));
            // oButton.setKey("searchResultMap");
            // break;

            default:
              oButton.setVisible(false);
          }

          return oButton;
        }
      });
      this.resultViewSwitch.addStyleClass("sapUshellSearchresultViewSwitch");
    },
    isShowMoreFooterVisible: function _isShowMoreFooterVisible() {
      var oModel = this.getModel();
      return oModel.getProperty("/boCount") > oModel.getProperty("/boResults").length;
    },
    assembleCenterArea: function _assembleCenterArea(idPrefix) {
      var _this7 = this;

      // sort dialog
      this.sortDialog = this.assembleSearchResultSortDialog(); // list

      this.searchResultList = this.assembleSearchResultList(); // table

      this.searchResultTable = this.assembleSearchResultTable(idPrefix);
      this.searchResultTable["addDelegate"]({
        // ToDo
        onBeforeRendering: function onBeforeRendering() {
          _this7.updateTableLayout();
        },
        onAfterRendering: function onAfterRendering() {
          var $tableTitleRow = $(_this7.searchResultTable.getDomRef()).find("table > thead > tr:first");

          if ($tableTitleRow) {
            $tableTitleRow.attr("aria-labelledby", _this7.countBreadcrumbsHiddenElement.getId());
          }
        }
      }); // grid

      this.searchResultGrid = this.assembleSearchResultGrid(); // map (CSP violation)
      // that.searchResultMap = that.assembleSearchResultMap();
      // that.searchResultMap.setVisible(false);
      // app search result

      this.appSearchResult = this.assembleAppSearch(); // show more footer

      this.showMoreFooter = this.assembleShowMoreFooter();
      var centerArea = [this.sortDialog, this.searchResultList, this.searchResultTable, this.searchResultGrid, // this.searchResultMap, // CSP violation
      this.appSearchResult, this.showMoreFooter, this.countBreadcrumbsHiddenElement];
      return centerArea;
    },
    assembleSearchResultSortDialog: function _assembleSearchResultSortDialog() {
      var _this8 = this;

      var sortDialog = new ViewSettingsDialog("", {
        sortDescending: {
          parts: [{
            path: "/orderBy"
          }],
          formatter: function formatter(orderBy) {
            return jQuery.isEmptyObject(orderBy) || orderBy.sortOrder === "DESC";
          }
        },
        confirm: function confirm(oEvent) {
          var paramsSortItem = oEvent.getParameter("sortItem");
          var paramsSortDescending = oEvent.getParameter("sortDescending");

          var oModel = _this8.getModel();

          if (typeof paramsSortItem === "undefined" || paramsSortItem.getBindingContext().getObject().attributeId === "DEFAULT_SORT_ATTRIBUTE") {
            sortDialog.setSortDescending(true);
            oModel.resetOrderBy(true);
          } else {
            oModel.setOrderBy({
              orderBy: paramsSortItem.getBindingContext().getObject().attributeId,
              sortOrder: paramsSortDescending === true ? "DESC" : "ASC"
            }, true);
          } // sortDialog.unbindAggregation("sortItems", true);

        },
        cancel: function cancel() {// sortDialog.unbindAggregation("sortItems", true);
        },
        resetFilters: function resetFilters() {
          // issue: default sort item can't be set, multiple reset selection in UI5
          // workaround: set sort item after time delay
          setTimeout(function () {
            sortDialog.setSortDescending(true);
            sortDialog.setSelectedSortItem("searchSortAttributeKeyDefault");
          }, 500);
        }
      }); // // move before open dialog
      // sortDialog.bindAggregation("sortItems"...);

      return sortDialog;
    },
    assembleSearchResultGrid: function _assembleSearchResultGrid() {
      var oModel = this.getModel();
      var resultGrid;

      if (typeof oModel.config.customGridView === "function") {
        resultGrid = oModel.config.customGridView();
      } else {
        var l = new GridContainerSettings("", {
          rowSize: "11rem",
          columnSize: "11rem",
          gap: "0.5rem"
        });
        resultGrid = new SearchResultGrid(this.getId() + "-ushell-search-result-grid", {
          layout: l,
          snapToRow: true
        });
      }

      if (!oModel.config.eshUseExtendedChangeDetection) {
        resultGrid.bUseExtendedChangeDetection = false; // workaround to avoid circular structure issue for data binding
      }

      resultGrid.bindProperty("visible", {
        parts: ["/resultViewType", "/count"],
        formatter: function formatter(resultViewType, count) {
          return resultViewType === "searchResultGrid" && count !== 0;
        }
      });
      resultGrid.addStyleClass("sapUshellSearchGrid");
      return resultGrid;
    },
    assembleSearchResultTable: function _assembleSearchResultTable(idPrefix) {
      var _this9 = this;

      // eslint-disable-next-line @typescript-eslint/no-this-alias
      var that = this;
      var resultTable = new SearchResultTable(idPrefix + "-ushell-search-result-table", {
        mode: {
          parts: [{
            path: "/multiSelectionEnabled"
          }],
          formatter: function formatter(multiSelectionEnabled) {
            return multiSelectionEnabled === true ? ListMode.MultiSelect : ListMode.None;
          }
        },
        noDataText: "{i18n>noCloumnsSelected}",
        visible: {
          parts: [{
            path: "/resultViewType"
          }, {
            path: "/count"
          }],
          formatter: function formatter(resultViewType, count) {
            return resultViewType === "searchResultTable" && count !== 0;
          }
        },
        popinLayout: PopinLayout.GridLarge,
        rememberSelections: false,
        selectionChange: function selectionChange() {
          var oModel = _this9.getModel();

          oModel.updateMultiSelectionSelected();
        }
      });
      resultTable.bindAggregation("columns", {
        path: "/tableColumns",
        factory: function factory(path, bData) {
          var tableColumn = bData.getObject();
          var column = new Column(idPrefix + "-" + tableColumn.key, {
            header: new Label("", {
              text: "{name}" // tooltip: "{name}",

            }),
            visible: {
              parts: [{
                path: "index"
              }, {
                path: "attributeId"
              }],
              formatter: function formatter(index, attributeId) {
                var oModel = that.getModel();

                if (oModel.config.extendTableColumn) {
                  // extend table column should be default shown
                  return index < 7 || attributeId === oModel.config.extendTableColumn.column.attributeId;
                }

                return index < 6; // first 6 attributes are visible, including title and title description
              }
            },
            width: "{width}"
          });
          return column;
        }
      });
      resultTable.bindItems({
        path: "/tableRows",
        factory: function factory(path, bData) {
          return that.assembleTableItems(bData);
        }
      });
      resultTable.addEventDelegate({
        onAfterRendering: function onAfterRendering() {
          _this9.updatePersoServiceAndController();

          var $control = $(_this9.getDomRef());
          $control.find("table tbody tr").each(function () {
            var $this = $(this);
            var tableRow = sap.ui.getCore().byId($this.attr("id"));

            if (tableRow) {
              var currentAriaLabelledBy = tableRow.getAriaLabelledBy();

              if ($.inArray(that.countBreadcrumbsHiddenElement.getId(), currentAriaLabelledBy) === -1) {
                tableRow.addAriaLabelledBy(that.countBreadcrumbsHiddenElement);
              }
            }

            return false; // stop after first line for now
          });
          $control.find(".sapMListTblCell").each(function () {
            // normal table cell
            var $cell = $(this)[0];
            SearchHelper.attachEventHandlersForTooltip($cell);
          });
          $control.find(".sapMListTblSubCntVal").each(function () {
            // pop-in table cell
            var $cell = $(this)[0];
            SearchHelper.attachEventHandlersForTooltip($cell);
          });
        }
      });
      return resultTable;
    },
    assembleTableItems: function _assembleTableItems(bData) {
      var oData = bData.getObject();

      if (oData.type === "footer") {
        return new CustomListItem("", {
          visible: false
        });
      }

      return this.assembleTableMainItems(oData, bData.getPath());
    },
    assembleTableMainItems: function _assembleTableMainItems(oData, path) {
      var _this10 = this;

      var subPath = path + "/cells";
      var columnListItem = new ColumnListItem("", {
        selected: {
          path: "selected"
        }
      }).addStyleClass("sapUshellSearchTable");
      columnListItem.bindAggregation("cells", {
        path: subPath,
        factory: function factory(subPath, bData) {
          if (bData.getObject().isTitle) {
            // build title cell
            var titleUrl = "";
            var target;
            var titleNavigation = bData.getObject().titleNavigation;

            if (titleNavigation) {
              titleUrl = titleNavigation.getHref();
              target = titleNavigation.getTarget();
            }

            var enabled = !!(titleUrl && titleUrl.length > 0);
            var titleLink = new SearchLink("", {
              text: {
                path: "value"
              },
              // tooltip: { path: "tooltip" },
              enabled: enabled,
              press: function press() {
                var titleNavigation = bData.getObject().titleNavigation;

                if (titleNavigation) {
                  titleNavigation.performNavigation({
                    trackingOnly: true
                  });
                }
              }
            });
            titleLink.setHref(titleUrl); // titleLink.setTooltip(titleLink.getText());

            var titleIconUrl = bData.getObject().titleIconUrl;

            if (titleIconUrl) {
              var oIcon = new Icon("", {
                src: titleIconUrl
              });
              titleLink.setAggregation("icon", oIcon);
            } // for tooltip handling
            // see in SearchResultTable.onAfterRendering for event handlers


            titleLink.addStyleClass("sapUshellSearchResultListItem-MightOverflow");
            titleLink.addStyleClass("sapUshellSearchTableTitleLink");

            if (target) {
              titleLink.setTarget(target);
            }

            var returnObject = titleLink;
            var titleInfoIconUrl = bData.getObject().titleInfoIconUrl;

            if (titleInfoIconUrl) {
              var titleInfoIcon = new Icon("", {
                src: titleInfoIconUrl,
                tooltip: i18n.getText("collectionShared")
              }).addStyleClass("sapUshellSearchTableTitleInfoIcon");

              if (!enabled) {
                titleInfoIcon.addStyleClass("sapUshellSearchTableTitleInfoIconDisabled");
              }

              returnObject = new HBox("", {
                items: [titleLink, titleInfoIcon]
              });
            }

            return returnObject;
          }

          if (bData.getObject().isRelatedApps) {
            // build related objects aka navigation objects cell
            var navigationObjects = bData.getObject().navigationObjects;
            var navigationButtons = [];
            var navigationButton;

            var pressButton = function pressButton(event, navigationObject) {
              navigationObject.performNavigation();
            };

            for (var i = 0; i < navigationObjects.length; i++) {
              var navigationObject = navigationObjects[i];
              navigationButton = new Button("", {
                text: navigationObject.getText(),
                tooltip: navigationObject.getText()
              });
              navigationButton.attachPress(navigationObject, pressButton);
              navigationButtons.push(navigationButton);
            }

            var relatedAppsButton = new Button("", {
              icon: "sap-icon://action",
              press: function press() {
                var actionSheet = new ActionSheet("", {
                  buttons: navigationButtons,
                  placement: PlacementType.Auto
                });
                actionSheet.openBy(relatedAppsButton);
              }
            });
            relatedAppsButton.addStyleClass("sapElisaSearchTableRelatedAppsButton"); // for test purposes

            return relatedAppsButton;
          }

          if (bData.getObject().isExtendTableColumnCell) {
            var oModel = _this10.getModel();

            return oModel.config.extendTableColumn.bindingFunction(bData.getObject()); // ToDo
          } // build other cells


          var cell = new SearchText("", {
            text: {
              path: "value"
            },
            // tooltip: { path: "tooltip" },
            isForwardEllipsis4Whyfound: true
          }).addStyleClass("sapUshellSearchResultListItem-MightOverflow");

          if (bData.getObject().icon) {
            var cellIcon = new Icon("", {
              src: bData.getObject().icon
            });
            cell.setAggregation("icon", cellIcon);
          }

          return cell;
        }
      });
      return columnListItem;
    },
    assembleShowMoreFooter: function _assembleShowMoreFooter() {
      var _this11 = this;

      var button = new Button("", {
        text: "{i18n>showMore}",
        type: ButtonType.Transparent,
        press: function press() {
          var oCurrentModel = _this11.getModel();

          oCurrentModel.setProperty("/focusIndex", oCurrentModel.getTop());
          var newTop = oCurrentModel.getTop() + oCurrentModel.pageSize;
          oCurrentModel.setTop(newTop);
          oCurrentModel.eventLogger.logEvent({
            type: UserEventType.SHOW_MORE
          });
        }
      });
      button.addStyleClass("sapUshellResultListMoreFooter");
      var container = new FlexBox("", {
        visible: {
          parts: [{
            path: "/boCount"
          }, {
            path: "/boResults"
          }],
          formatter: function formatter(boCount, boResults) {
            return boResults.length < boCount;
          }
        },
        justifyContent: FlexJustifyContent.Center
      });
      container.addStyleClass("sapUshellResultListMoreFooterContainer");
      container.addItem(button);
      return container;
    },
    assembleSearchResultList: function _assembleSearchResultList() {
      var _this12 = this;

      var resultList = new SearchResultList("", {
        mode: ListMode.None,
        width: "auto",
        showNoData: false,
        visible: {
          parts: [{
            path: "/resultViewType"
          }, {
            path: "/count"
          }],
          formatter: function formatter(resultViewType, count) {
            return resultViewType === "searchResultList" && count !== 0;
          }
        }
      });
      resultList.bindItems({
        path: "/results",
        factory: function factory(path, oContext) {
          return _this12.assembleListItem(oContext);
        }
      });
      return resultList;
    },
    assembleAppSearch: function _assembleAppSearch() {
      var _this13 = this;

      var l1 = new GridContainerSettings("", {
        rowSize: "5.5rem",
        columnSize: "5.5rem",
        gap: "0.25rem"
      });
      var gridContainer = new GridContainer("", {
        layout: l1,
        snapToRow: true,
        visible: {
          parts: [{
            path: "/count"
          }],
          formatter: function formatter(count) {
            var oModel = _this13.getModel();

            return (oModel.isAppCategory() || oModel.isUserCategoryAppSearchOnlyWithoutBOs()) && count !== 0;
          }
        },
        items: {
          path: "/appResults",
          factory: function factory(id, context) {
            var oModel = _this13.getModel();

            if (oModel.isAppCategory() || oModel.isUserCategoryAppSearchOnlyWithoutBOs()) {
              var item = context.getObject();
              var visualization = item.visualization;
              var visualizationService = oModel.uShellVisualizationInstantiationService;
              var visualizationControl = visualizationService.instantiateVisualization(visualization);
              visualizationControl.attachPress(function () {
                oModel.eventLogger.logEvent({
                  type: UserEventType.TILE_NAVIGATE,
                  tileTitle: visualization.title,
                  targetUrl: visualization.targetURL
                });
              });
              visualizationControl.addEventDelegate({
                onAfterRendering: _this13.highlightTile
              });
              visualizationControl.setActive(false, true);
              visualizationControl.setLayoutData(new GridContainerItemLayoutData(visualizationControl.getLayout()));
              return visualizationControl;
            } // bind dummy view, prevent douplicated binding


            return new Text("", {
              text: ""
            });
          }
        }
      });
      gridContainer.addStyleClass("sapUshellSearchGridContainer");
      var button = new Button("", {
        text: "{i18n>showMore}",
        type: ButtonType.Transparent,
        visible: {
          parts: [{
            path: "/appCount"
          }, {
            path: "/appResults"
          }],
          formatter: function formatter(appCount, appResults) {
            var oModel = _this13.getModel();

            return (oModel.isAppCategory() || oModel.isUserCategoryAppSearchOnlyWithoutBOs()) && appResults.length < appCount;
          }
        },
        press: function press() {
          var oModel = _this13.getModel();

          var newTop = oModel.getTop() + oModel.pageSize;
          oModel.setProperty("/focusIndex", oModel.getTop());
          oModel.setTop(newTop);
          oModel.eventLogger.logEvent({
            type: UserEventType.SHOW_MORE
          });
        }
      });
      button.addStyleClass("sapUshellResultListMoreFooter");
      var verticalLayout = new VerticalLayout("", {
        width: "100%",
        visible: {
          parts: [{
            path: "/count"
          }],
          formatter: function formatter(count) {
            var oModel = _this13.getModel();

            return (oModel.isAppCategory() || oModel.isUserCategoryAppSearchOnlyWithoutBOs()) && count !== 0;
          }
        },
        content: [gridContainer, button]
      });
      verticalLayout.addStyleClass("sapUshellResultApps");
      return verticalLayout;
    },
    highlightTile: function _highlightTile(oEvent) {
      var _oEvent$srcControl;

      var oInnerControl = (_oEvent$srcControl = oEvent["srcControl"]) === null || _oEvent$srcControl === void 0 ? void 0 : _oEvent$srcControl.getAggregation("content"); // ToDo

      if (oInnerControl) {
        var aControls = oInnerControl.findAggregatedObjects(true, function (oControl) {
          return oControl.isA("sap.m.GenericTile") || oControl.isA("sap.f.Card");
        });

        if (aControls.length === 0 && oInnerControl.getComponentInstance) {
          aControls = oInnerControl.getComponentInstance().findAggregatedObjects(true, function (oControl) {
            return oControl.isA("sap.m.GenericTile") || oControl.isA("sap.f.Card");
          });
        }

        if (aControls.length > 0) {
          var _oEvent$srcControl2;

          var tile = aControls[0];
          var tileHighlighter = new Highlighter();
          tileHighlighter.setHighlightTerms((_oEvent$srcControl2 = oEvent["srcControl"]) === null || _oEvent$srcControl2 === void 0 ? void 0 : _oEvent$srcControl2.getModel().getProperty("/uiFilter/searchTerm"));
          tileHighlighter.highlight(tile);
        }
      }
    },
    assembleAppContainerResultListItem: function _assembleAppContainerResultListItem() {
      var _this14 = this;

      // eslint-disable-next-line @typescript-eslint/no-this-alias
      var that = this;
      var l = new GridContainerSettings("", {
        rowSize: "5.5rem",
        columnSize: "5.5rem",
        gap: "0.25rem"
      });
      var container = new GridContainer("", {
        layout: l,
        snapToRow: true,
        items: {
          path: "/appResults",
          factory: function factory(id, context) {
            var oModel = _this14.getModel();

            if (!oModel.isAppCategory()) {
              var item = context.getObject();
              var visualization = item.visualization;
              var visualizationService = oModel.uShellVisualizationInstantiationService;
              var visualizationControl = visualizationService.instantiateVisualization(visualization);
              visualizationControl.attachPress(function () {
                var oModel = _this14.getModel();

                oModel.eventLogger.logEvent({
                  type: UserEventType.TILE_NAVIGATE,
                  tileTitle: visualization.title,
                  targetUrl: visualization.targetURL
                });
              });
              visualizationControl.addEventDelegate({
                onAfterRendering: _this14.highlightTile
              });
              visualizationControl.setActive(false, true);
              visualizationControl.setLayoutData(new GridContainerItemLayoutData(visualizationControl.getLayout()));
              return visualizationControl;
            } // bind dummy view, prevent douplicated binding
            // tile can handel only one view


            return new Text(id, {
              text: ""
            });
          }
        }
      });
      container.addStyleClass("sapUshellSearchGridContainer");
      container.addEventDelegate({
        onAfterRendering: function onAfterRendering() {
          var _this15 = this;

          var oModel = that.getModel(); // calculate the suitable items for container

          if (this.getDomRef().clientWidth === 0) {
            return;
          }

          var maxWidth = this.getDomRef().clientWidth - 176; // container width - last show more tile width

          var maxItems = Math.floor(maxWidth / 184);
          var fullItems = this.getItems();
          var appCount = oModel.getProperty("/appCount");
          var boCount = oModel.getProperty("/boCount");

          if (fullItems.length > maxItems + 1) {
            // items greater than maxItems+showMore, must be cut
            var width = 0,
                i = 0;

            for (; i < fullItems.length; i++) {
              width = width + fullItems[i].getDomRef().clientWidth + 8; // tile width + margin

              if (width > maxWidth) {
                break;
              }
            }

            var appResults = oModel.getProperty("/appResults");
            oModel.setProperty("/appResults", appResults.slice(0, i));
          } else {
            var lastItem = fullItems[fullItems.length - 1]; // appCount greater than maxItems, add showMore tile

            if (appCount > maxItems && !lastItem.hasStyleClass("sapUshellSearchResultListItemAppsShowMore")) {
              var showMoreTile = new GenericTile("", {
                tileContent: new TileContent("", {
                  content: new Text("", {
                    text: i18n.getText("showMoreApps")
                  })
                }),
                press: function press() {
                  var oModel = _this15.getModel();

                  oModel.setDataSource(oModel.appDataSource);
                }
              });
              showMoreTile.addStyleClass("sapUshellSearchResultListItemAppsShowMore");
              this.addItem(showMoreTile); // force update showMore button to avoid outdated binding

              oModel.setProperty("/resultViewType", "appSearchResult");
              oModel.setProperty("/resultViewType", "searchResultList");
              oModel.setProperty("/boCount", 0);
              oModel.setProperty("/boCount", boCount);
            }
          }
        }
      }, container);
      var listItem = new CustomListItem("", {
        content: container
      });
      listItem.addStyleClass("sapUshellSearchResultListItem");
      listItem.addStyleClass("sapUshellSearchResultListItemApps");
      listItem.addEventDelegate({
        onAfterRendering: function onAfterRendering() {
          var $listItem = $(listItem.getDomRef());
          $listItem.removeAttr("tabindex");
          $listItem.removeAttr("role");
          $listItem.attr("aria-hidden", "true");
        }
      }, listItem);
      return listItem;
    },
    assembleResultListItem: function _assembleResultListItem(oData) {
      var oModel = this.getModel();
      var dataSourceConfig = oModel.config.getDataSourceConfig(oData.dataSource);
      var searchResultListItemSettings = {
        dataSource: oData.dataSource,
        title: "{title}",
        titleDescription: "{titleDescription}",
        titleNavigation: "{titleNavigation}",
        type: "{dataSourceName}",
        imageUrl: "{imageUrl}",
        imageFormat: "{imageFormat}",
        imageNavigation: "{imageNavigation}",
        geoJson: "{geoJson}",
        attributes: {
          path: "itemattributes"
        },
        navigationObjects: {
          path: "navigationObjects"
        },
        selected: {
          path: "selected"
        },
        expanded: {
          path: "expanded"
        },
        positionInList: {
          path: "positionInList"
        },
        resultSetId: {
          path: "resultSetId"
        },
        layoutCache: {
          path: "layoutCache"
        },
        titleIconUrl: {
          path: "titleIconUrl"
        },
        titleInfoIconUrl: {
          path: "titleInfoIconUrl"
        }
      };
      var item;

      if (dataSourceConfig.searchResultListItemControl) {
        item = new dataSourceConfig.searchResultListItemControl(searchResultListItemSettings);
      } else if (dataSourceConfig.searchResultListItemContentControl) {
        searchResultListItemSettings["content"] = // ToDo
        new dataSourceConfig.searchResultListItemContentControl();
        item = new CustomSearchResultListItem(searchResultListItemSettings);
      } else {
        item = new SearchResultListItem(searchResultListItemSettings); // ToDo
      }

      if (item.setCountBreadcrumbsHiddenElement) {
        item.setCountBreadcrumbsHiddenElement(this.countBreadcrumbsHiddenElement);
      }

      var listItem = new CustomListItem("", {
        content: item,
        type: ListType.Inactive
      });
      listItem.addStyleClass("sapUshellSearchResultListItem");

      if (item.setParentListItem) {
        item.setParentListItem(listItem);
      }

      return listItem;
    },
    assembleListItem: function _assembleListItem(oContext) {
      var oData = oContext.getObject(); // ToDo

      /* if (oData.type === "title") {    // assembleTitleItem does not exits ?!?
                  return this.assembleTitleItem(oData);
              } else */

      if (oData.type === "footer") {
        return new CustomListItem(); // return empty list item
      } else if (oData.type === "appcontainer") {
        return this.assembleAppContainerResultListItem();
      }

      return this.assembleResultListItem(oData);
    },
    onAllSearchStarted: function _onAllSearchStarted() {
      // this.fireSearchStarted();
      this.fireEvent("searchStarted");
    },
    onAllSearchFinished: function _onAllSearchFinished() {
      var oModel = this.getModel();

      if (oModel.getProperty("/count") > 0) {
        var _oModel$config7;

        if (oModel !== null && oModel !== void 0 && (_oModel$config7 = oModel.config) !== null && _oModel$config7 !== void 0 && _oModel$config7.assembleSearchCountBreadcrumbs) {
          var _oModel$config8;

          if (oModel !== null && oModel !== void 0 && (_oModel$config8 = oModel.config) !== null && _oModel$config8 !== void 0 && _oModel$config8.combinedResultviewToolbar) {
            this.oSearchBar.removeContentLeft(2); // 2 = index of breadcrumb controls

            this.oSearchBar.addContentLeft(oModel.config.assembleSearchCountBreadcrumbs(oModel.getDataSource(), oModel.getProperty("/count")));
          } else {
            this.oSearchResultListContainer.setCountBreadcrumbs(oModel.config.assembleSearchCountBreadcrumbs(oModel.getDataSource(), oModel.getProperty("/count")));
          }
        }
      }

      this.reorgTabBarSequence();
      this.chooseNoResultScreen(); // there can be custom no-result-screems, depending on data source

      this.oFocusHandler.setFocus();
      var viewPortContainer = sap.ui.getCore().byId("viewPortContainer"); // sap.m.NavContainer

      if (viewPortContainer !== null && viewPortContainer !== void 0 && viewPortContainer.switchState) {
        viewPortContainer.switchState("Center");
      } // this.fireSearchFinished();


      this.fireEvent("searchFinished");
    },
    updatePersoServiceAndController: function _updatePersoServiceAndController() {
      var oModel = this.getModel();
      var dsKey = oModel.getDataSource().id;
      var serviceId = "search-result-table-state-" + dsKey;
      var tableId = "".concat(this.getId(), "-ushell-search-result-table");
      var table = sap.ui.getCore().byId(tableId);

      if (table instanceof SearchResultTable) {
        if (!this.oTablePersoController) {
          var personalizationStorageInstance = oModel.getPersonalizationStorageInstance();
          var componentName = oModel.config.isUshell ? "sap.ushell.renderers.fiori2.search.container" : "";
          this.oTablePersoController = new TablePersoController("", {
            table: table,
            persoService: personalizationStorageInstance.getPersonalizer(serviceId),
            componentName: componentName
          }).activate();
          this.oTablePersoController.refresh();
        }

        if (this.oTablePersoController && this.oTablePersoController.getPersoService().getKey() !== serviceId || // ToDo
        this.resultTableMode != table.getMode()) {
          // bug fix for table with multiselection, which has one more afterRendering
          this.oTablePersoController.setPersoService(oModel.getPersonalizationStorageInstance().getPersonalizer(serviceId));
          this.oTablePersoController.refresh();
          this.resultTableMode = table.getMode();
        }
      }
    },
    updateTableLayout: function _updateTableLayout() {
      var _this16 = this;

      // set layout after persoConroller and persData initialized
      // then get columns which is personaized as visible
      if (this.searchResultTable && this.oTablePersoController) {
        var oModel = this.getModel();
        var dsKey = oModel.getDataSource().id;
        var serviceId = "search-result-table-state-".concat(dsKey);
        this.oTablePersoController // ToDo
        .getPersoService(serviceId).getPersData().then(function (persData) {
          if (persData && persData.aColumns) {
            var psersColumns = persData.aColumns;
            var visibleCloumns = 0;

            for (var i = 0; i < psersColumns.length; i++) {
              if (psersColumns[i].id === undefined) {
                break; // special logic for for the case persColumn doesn't have id
              }

              var index = psersColumns[i].id.split("table-TABLE_COLUMN_").pop();

              var ui5Column = _this16._getUI5TableColumn("TABLE_COLUMN_" + index);

              if (ui5Column) {
                ui5Column.setDemandPopin(false);

                if (psersColumns[i].visible) {
                  visibleCloumns++;
                  ui5Column.setDemandPopin(true);
                  ui5Column.setPopinDisplay(PopinDisplay.Inline);
                  var minScreenWidth = 12 * visibleCloumns;
                  ui5Column.setMinScreenWidth(minScreenWidth + "rem");
                }
              }
            }

            if (visibleCloumns <= 3) {
              _this16.searchResultTable.setFixedLayout(false);
            } else {
              _this16.searchResultTable.setFixedLayout(true);
            }
          }
        });
      }
    },
    _getUI5TableColumn: function _getUI5TableColumn(key) {
      var columns = this.searchResultTable.getColumns();

      if (!Array.isArray(columns) || columns.length === 0) {
        return undefined;
      }

      for (var i = 0; i < columns.length; i++) {
        var columnData = columns[i].getBindingContext().getObject();

        if (columnData["key"] === key) {
          return columns[i];
        }
      }

      return undefined;
    },
    createSearchPage: function _createSearchPage(idPrefix) {
      var oModel = this.getModel();
      this.oFilterBar.bindProperty("visible", {
        parts: [{
          path: "/facetVisibility"
        }, {
          path: "/uiFilter/rootCondition"
        }],
        formatter: function formatter(facetVisibility, rootCondition) {
          var filterBarVisible = false;

          if (!facetVisibility && rootCondition && rootCondition.hasFilters()) {
            filterBarVisible = true;
          }

          if (rootCondition && oModel.filterWithoutFilterByConditions()) {
            filterBarVisible = false;
          } // DWC exit


          if (rootCondition && typeof oModel.config.hasSpaceFiltersOnly === "function") {
            if (oModel.config.hasSpaceFiltersOnly(rootCondition) === true) {
              filterBarVisible = false;
            }
          }
          /* const footerVisible = oModel.getProperty("/errors/length") > 0;
          // set current style classes
          this.adjustSearchContainerStyleClasses(
              filterBarVisible,
              footerVisible,
              oModel.config.combinedResultviewToolbar
          ); */


          return filterBarVisible;
        }
      });
      var footer;

      if (oModel.config.FF_errorMessagesAsButton) {// nothing to do here, see SearchFieldGroup 'messagesButton'
      } else {
        footer = this.createFooter(this.getId()); // not available for device type 'phone'

        if (footer) {
          footer.bindProperty("visible", {
            parts: [{
              path: "/errors/length"
            }],
            formatter: function formatter(numberErrors) {
              /* const oModel = this.getModel() as SearchModel;
              let filterBarVisible = false;
              if (
              (!oModel.getFacetVisibility()) &&
              oModel.getFilterRootCondition() &&
              oModel.getFilterRootCondition().hasFilters()
              ) {
              filterBarVisible = true;
              } */
              var footerVisible = numberErrors > 0 ? true : false; // set current style classes

              /* this.adjustSearchContainerStyleClasses(
              filterBarVisible,
              footerVisible,
              oModel.config.combinedResultviewToolbar
              ); */

              return footerVisible;
            }
          });
        }
      }

      var searchPageContent;

      if (oModel.config.combinedResultviewToolbar) {
        searchPageContent = [// search container
        this.createSearchContainer(idPrefix)];
      } else {
        searchPageContent = [// header
        this.oSearchBar, // filter bar
        this.oFilterBar, // search container
        this.createSearchContainer(idPrefix)];
      }

      if (footer) {
        // not available for device type 'phone'
        searchPageContent.push(footer);
      }

      return searchPageContent;
    },
    createNoResultScreen: function _createNoResultScreen(idPrefix) {
      var _this17 = this;

      this.noResultScreen = new SearchNoResultScreen("".concat(idPrefix, "-searchContainerResultsView-noResultScreen"), {
        isUshell: {
          path: "/config/isUshell"
        },
        dataSource: {
          path: "/uiFilter/dataSource"
        },
        appSearchDataSource: {
          path: "/appSearchDataSource"
        },
        searchBoxTerm: {
          parts: [{
            path: "/queryFilter/searchTerm"
          }],
          formatter: function formatter(searchTerms) {
            return searchTerms;
          }
        },
        visible: {
          parts: [{
            path: "/count"
          }, {
            path: "/isBusy"
          }, {
            path: "/firstSearchWasExecuted"
          }],
          formatter: function formatter(count, isBusy, firstSearchWasExecuted) {
            var visible = count === 0 && !isBusy && firstSearchWasExecuted;

            _this17._oLogger.debug("No result screen is visible: \" ".concat(visible, ". count: ").concat(count, ", isBusy: ").concat(isBusy, ", firstSearchWasExecuted: ").concat(firstSearchWasExecuted));

            return visible;
          }
        },
        toolbar: [new Button({
          text: i18n.getText("noResultsPageBackButton"),
          visible: {
            path: "/config/displayNoResultsPageBackButton"
          },
          press: function press() {
            window.history.back();
          }
        }).addStyleClass("sapUiTinyMarginEnd"), new Button({
          text: i18n.getText("noResultsPageSearchAllButton"),
          visible: {
            path: "/config/displayNoResultsPageSearchAllButton"
          },
          press: function press() {
            var oModel = _this17.getModel();

            oModel.resetTop();
            oModel.setSearchBoxTerm("", false); // search for all

            oModel.resetDataSource(false);
            oModel.resetAllFilterConditions(true); // true => fire query
          }
        })]
      });
      return this.noResultScreen;
    },
    createSearchContainer: function _createSearchContainer(idPrefix) {
      // total count hidden element for ARIA purposes
      this.countBreadcrumbsHiddenElement = this.assembleCountBreadcrumbsHiddenElement(); // center area

      this.centerArea = this.assembleCenterArea(idPrefix); // main result list

      this.oSearchResultListContainer = new SearchResultListContainer("".concat(idPrefix, "-searchContainerResultsView"), {
        centerArea: this.centerArea,
        countBreadcrumbs: this.assembleSearchCountBreadcrumbs(),
        noResultScreen: this.createNoResultScreen(idPrefix),
        countBreadcrumbsHiddenElement: this.countBreadcrumbsHiddenElement
      }); // container for normal search result list + facets

      var oModel = this.getModel();
      var searchLayoutResponsiveSettings = {
        resultListContainer: this.oSearchResultListContainer,
        searchIsBusy: {
          path: "/isBusy"
        },
        busyDelay: {
          path: "/busyDelay"
        },
        showFacets: {
          parts: [{
            path: "/count"
          }, {
            path: "/facetVisibility"
          }, {
            path: "/uiFilter/rootCondition"
          }, {
            path: "/isBusy"
          }, {
            path: "/config"
          }],
          formatter: function formatter(count, facetVisibility, filterConditions, isBusy, config) {
            var facetVisible = true;

            if (!facetVisibility) {
              facetVisible = false;
            }

            var filterExists = filterConditions && filterConditions.conditions && filterConditions.conditions.length > 0;

            if (count === 0 && !config.displayFacetPanelInCaseOfNoResults && !filterExists && !isBusy) {
              facetVisible = false;
            }

            return facetVisible;
          }
        },
        facetPaneResizable: oModel.config.layoutUseResponsiveSplitter,
        facetPanelWidthInPercent: oModel.config.facetPanelWidthInPercent,
        facets: new SearchFacetFilter("".concat(this.getId(), "-SearchFacetFilter")),
        combinedResultviewToolbar: oModel.config.combinedResultviewToolbar
      };
      this.searchLayout = new SearchLayoutResponsive("".concat(this.getId(), "-searchLayout"), searchLayoutResponsiveSettings).addStyleClass("sapUshellSearchLayout");
      this.searchContainer = this.searchLayout;
      return this.searchContainer;
    },
    createFooter: function _createFooter(idPrefix) {
      var _this18 = this;

      var oModel = this.getModel(); // create error message popover

      this.oErrorPopover = new MessagePopover(idPrefix + "-searchMessagePopover", {
        placement: PlacementType.Top
      });
      this.oErrorPopover.setModel(oModel);
      oModel.setProperty("/messagePopoverControlId", this.oErrorPopover.getId());
      this.oErrorPopover.bindAggregation("items", {
        path: "/errors",
        factory: function factory() {
          var item = new MessageItem("", {
            title: "{title}",
            description: "{description}"
          });
          return item;
        }
      }); // create error message popover button

      var oErrorButton = new Button(this.getId() + "-searchErrorButton", {
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
        tooltip: i18n.getText("errorBtn"),
        press: function press() {
          if (_this18.oErrorPopover.isOpen()) {
            _this18.oErrorPopover.close();
          } else {
            _this18.oErrorPopover.setVisible(true);

            _this18.oErrorPopover.openBy(oErrorButton);
          }
        }
      });
      oErrorButton["addDelegate"]({
        // ToDo
        onAfterRendering: function onAfterRendering() {
          var oModel = _this18.getModel();

          if (!oModel.getProperty("/isErrorPopovered")) {
            // automatically open the error popup (only after first rendering of button)
            oErrorButton.firePress();
            oModel.setProperty("/isErrorPopovered", true);
          }
        }
      });
      oErrorButton.setLayoutData(new OverflowToolbarLayoutData("", {
        priority: OverflowToolbarPriority.NeverOverflow
      })); // create footer bar

      var footer = new OverflowToolbar(this.getId() + "-searchFooter", {
        content: [oErrorButton]
      });
      return footer;
    },
    chooseNoResultScreen: function _chooseNoResultScreen() {
      var _oModel$config9;

      // update "no result screen"
      var oModel = this.getModel();
      var noResultScreen;

      if (typeof (oModel === null || oModel === void 0 ? void 0 : (_oModel$config9 = oModel.config) === null || _oModel$config9 === void 0 ? void 0 : _oModel$config9.getCustomNoResultScreen) === "function") {
        noResultScreen = oModel.config.getCustomNoResultScreen(oModel.getDataSource(), oModel);
      }

      if (!noResultScreen) {
        noResultScreen = this.oSearchResultListContainer.getAggregation("noResultScreen");
      }

      this.oSearchResultListContainer.setNoResultScreen(noResultScreen);
    },
    reorgTabBarSequence: function _reorgTabBarSequence() {
      if (!this.tabBar) {
        return;
      }

      var highLayout = new OverflowToolbarLayoutData("", {
        priority: OverflowToolbarPriority.High
      });
      var neverOverflowLayout = new OverflowToolbarLayoutData("", {
        priority: OverflowToolbarPriority.NeverOverflow
      });
      var aButtons = this.tabBar.getContent();

      for (var i = 0; i < aButtons.length; i++) {
        if (this.getModel().getProperty("/tabStrips/selected") === aButtons[i].getBindingContext().getObject()) {
          aButtons[i].setLayoutData(neverOverflowLayout);
        } else {
          aButtons[i].setLayoutData(highLayout);
        }
      }
    },
    getResultViewTypes: function _getResultViewTypes() {
      var oModel = this.getModel();
      return oModel === null || oModel === void 0 ? void 0 : oModel.getResultViewTypes(); // if search model hasn't been instantiated yet (see constructor of SearchCompositeControl)
      // -> do nothing!
    },
    setResultViewTypes: function _setResultViewTypes(resultViewTypes) {
      var oModel = this.getModel();

      if (typeof resultViewTypes === "undefined") {
        throw Error("Search Result View Type Error In SearchCompositeControl:\n\n" + "The function parameter 'resultViewTypes' is mandatory.\n" + 'Valid example: setResultViewTypes(["searchResultList"])');
      } else if (typeof oModel === "undefined" || typeof oModel.config === "undefined") {
        // if search model hasn't been instantiated yet (see constructor of SearchCompositeControl)
        // -> do nothing!
        return this;
      }

      this.setResultViewSettings({
        resultViewTypes: resultViewTypes,
        resultViewType: oModel.getResultViewType()
      });
      return this;
    },
    getResultViewType: function _getResultViewType() {
      var oModel = this.getModel();
      return oModel === null || oModel === void 0 ? void 0 : oModel.getResultViewType();
    },
    setResultViewType: function _setResultViewType(resultViewType) {
      var oModel = this.getModel();

      if (typeof resultViewType === "undefined") {
        throw Error("Search Result View Type Error In SearchCompositeControl:\n\n" + "The function parameter 'resultlViewType' is mandatory.\n" + 'Valid example: setResultViewType("searchResultList")');
      } else if (typeof oModel === "undefined" || typeof oModel.config === "undefined") {
        // if search model hasn't been instantiated yet (see constructor of SearchCompositeControl)
        // -> do nothing!
        return this;
      }

      this.setResultViewSettings({
        resultViewTypes: oModel.getResultViewTypes(),
        resultViewType: resultViewType
      });
      return this; // if search model hasn't been instantiated yet (see constructor of SearchCompositeControl)
      // -> do nothing!
    },
    getResultViewSettings: function _getResultViewSettings() {
      var oModel = this.getModel();

      if (oModel) {
        return {
          resultViewTypes: oModel.getResultViewTypes(),
          resultViewType: oModel.getResultViewType()
        };
      } // if search model hasn't been instantiated yet (see constructor of SearchCompositeControl)
      // -> do nothing!

    },
    setResultViewSettings: function _setResultViewSettings(resultlViewSettings) {
      var oModel = this.getModel();

      if (typeof resultlViewSettings === "undefined") {
        throw Error("Search Result View Type Error In SearchCompositeControl:\n\n" + "The function parameter 'resultlViewSettings' is mandatory.\n" + 'Valid example: setResultViewSettings({resultViewTypes: ["searchResultList", "searchResultTable"], resultViewType: "searchResultList"})');
      } else if (typeof oModel === "undefined" || typeof oModel.config === "undefined") {
        // if search model hasn't been instantiated yet (see constructor of SearchCompositeControl)
        // -> do nothing!
        return this;
      }

      if (typeof resultlViewSettings.resultViewTypes === "undefined" || typeof resultlViewSettings.resultViewType === "undefined") {
        throw Error("Search Result View Type Error In SearchCompositeControl:\n\n" + "One of properties of function parameter is undefined.\n" + 'Valid example: setResultViewSettings({resultViewTypes: ["searchResultList", "searchResultTable"], resultViewType: "searchResultList"})');
      }

      oModel.calculateResultViewSwitchVisibility({
        resultViewTypes: resultlViewSettings.resultViewTypes,
        resultViewType: resultlViewSettings.resultViewType
      });
      this.showMoreFooter.setVisible(this.isShowMoreFooterVisible());
      oModel.enableOrDisableMultiSelection();

      oModel._firePerspectiveQuery(); // search will not be retriggered if model /isQueryInvalidated


      return this;
    },
    getControllerName: function _getControllerName() {
      return "sap.esh.search.ui.container.Search";
    },
    getCssClass: function _getCssClass() {
      return this._cssClass;
    },
    setCssClass: function _setCssClass(cssClass) {
      if (cssClass && !this.hasStyleClass(cssClass)) {
        this._cssClass = cssClass;
        this.addStyleClass(cssClass);
      }

      return this;
    },
    getDataSource: function _getDataSource() {
      if (typeof this.getModel() !== "undefined") {
        var oModel = this.getModel();
        var ds = oModel.getDataSource();
        return ds.id;
      }
    },
    setDataSource: function _setDataSource(dataSourceId, fireQuery, resetTop) {
      if (typeof this.getModel() !== "undefined") {
        var oModel = this.getModel();
        oModel.setDataSourceById(dataSourceId, fireQuery, resetTop);
      }

      return this;
    },
    getSearchTerm: function _getSearchTerm() {
      if (typeof this.getModel() !== "undefined") {
        var oModel = this.getModel();
        return oModel.getSearchBoxTerm();
      }

      return SearchCompositeControl.getMetadata().getPropertyDefaults()["searchTerm"];
    },
    setSearchTerm: function _setSearchTerm(searchTerm, fireQuery) {
      if (typeof this.getModel() !== "undefined") {
        var oModel = this.getModel();
        oModel.setSearchBoxTerm(searchTerm, fireQuery);
      }

      return this;
    },
    getFilterRootCondition: function _getFilterRootCondition() {
      if (this.getModel()) {
        var oModel = this.getModel();
        return oModel.getFilterRootCondition();
      }

      return SearchCompositeControl.getMetadata().getPropertyDefaults()["filterRootCondition"];
    },
    setFilterRootCondition: function _setFilterRootCondition(filterRootCondition, fireQuery) {
      if (this.getModel()) {
        var oModel = this.getModel();
        oModel.setFilterRootCondition(filterRootCondition, fireQuery);
      }

      return this;
    },
    renderSearchUrlFromParameters: function _renderSearchUrlFromParameters(top, filter, encodeFilter) {
      var model = this.getModel();

      if (!model) {
        throw new ProgramError(null, "cannot construct URL because model is undefined");
      }

      return model.searchUrlParser.renderFromParameters(top, filter, encodeFilter);
    }
  });
  SearchCompositeControl.eshCompCounter = 0;
  return SearchCompositeControl;
});
})();