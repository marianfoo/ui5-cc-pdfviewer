/*! 
 * SAPUI5

		(c) Copyright 2009-2021 SAP SE. All rights reserved
	 
 */

(function(){
sap.ui.define(["sap/base/Log", "./performancelogging/PerformanceLogger", "sap/esh/search/ui/controls/SearchResultListSelectionHandler", "./controls/SearchResultListItemNote"], function (Log, __PerformanceLogger, SearchResultListSelectionHandler, __SearchResultListItemNote) {
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule && typeof obj.default !== "undefined" ? obj.default : obj;
  }

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

  function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

  function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

  var PerformanceLogger = _interopRequireDefault(__PerformanceLogger);

  // import SearchFacet from "sap/esh/search/ui/controls/SearchFacet";  // ToDo, does not work, wait for TS conversion
  var SearchResultListItemNote = _interopRequireDefault(__SearchResultListItemNote);

  function _call(body, then, direct) {
    if (direct) {
      return then ? then(body()) : body();
    }

    try {
      var result = Promise.resolve(body());
      return then ? result.then(then) : result;
    } catch (e) {
      return Promise.reject(e);
    }
  }

  var SearchConfiguration = /*#__PURE__*/function () {
    // id of searchCompositeControl
    // this is only used in DWC to add one additional column which currently is favorites:
    // obsolete
    // changing from one data source to another resets the search term (quick search DS included)
    // search input placeholder hard-coded to i18n resource ("Search")
    // search input placeholder based on Quick-Select Data Sources
    // motivated by DWC story DW00-6838
    // undefined not possible, see 'extends' -> uses value from personalization
    // undefined not possible, see 'extends' -> uses first datasource after, see selectDataSource in SearchInputHelpPage
    // eslint-disable-line camelcase
    // needs property 'logCustomEvent', type function(what, where, eventList)
    // properties 'enterMethod', type function({ name: "..." },...}, 'leaveMethod', type function({ name: "..." })
    // show (top-level) search bar + filter bar on top of result view (merged visualization)
    // =======================================================================
    // url parameter meta data
    // =======================================================================

    /**
     * @this SearchConfiguration
     * @constructor
     */
    function SearchConfiguration(configuration) {
      _classCallCheck(this, SearchConfiguration);

      _defineProperty(this, "log", Log.getLogger("sap.esh.search.ui.SearchConfiguration"));

      _defineProperty(this, "urlParameterMetaData", {
        esDevConfig: {
          type: "object"
        },
        multiSelect: {
          type: "bool"
        },
        sinaProvider: {
          type: "string"
        },
        odataProvider: {
          type: "bool"
        },
        searchBusinessObjects: {
          type: "bool"
        },
        charts: {
          type: "bool"
        },
        maps: {
          type: "bool"
        },
        mapProvider: {
          type: "object"
        },
        newpie: {
          type: "bool"
        },
        personalizationStorage: {
          type: "string"
        },
        boSuggestions: {
          type: "bool"
        },
        _eshClickableObjectType: {
          type: "bool"
        },
        defaultSearchScopeApps: {
          type: "bool"
        },
        searchScopeWithoutAll: {
          type: "bool"
        },
        suggestionKeyboardRelaxationTime: {
          type: "int"
        },
        suggestionStartingCharacters: {
          type: "int"
        },
        resultViewTypes: {
          type: "string[]"
        },
        fallbackResultViewType: {
          type: "string"
        },
        enableMultiSelectionResultItems: {
          type: "bool"
        },
        updateUrl: {
          type: "bool"
        },
        renderSearchUrl: {
          type: "function",
          isSinaParameter: true
        },
        isSearchUrl: {
          type: "function"
        },
        beforeNavigation: {
          type: "function"
        },
        getCustomToolbar: {
          type: "function"
        },
        quickSelectDataSources: {
          type: "object"
        },
        initAsync: {
          type: "function"
        },
        layoutUseResponsiveSplitter: {
          type: "bool"
        },
        facetPanelWidthInPercent: {
          type: "int"
        },
        FF_facetPanelUnifiedHeaderStyling: {
          type: "bool"
        },
        FF_hierarchyBreadcrumbs: {
          type: "bool",
          isSinaParameter: true
        },
        FF_dynamicHierarchyFacetsInShowMore: {
          type: "bool"
        },
        searchBarDoNotHideForNoResults: {
          type: "bool"
        },
        pageSize: {
          type: "int"
        },
        // obsolete
        FF_layoutWithoutPage: {
          type: "bool"
        },
        titleColumnName: {
          type: "string"
        },
        titleColumnWidth: {
          type: "string"
        },
        extendTableColumn: {
          // see SearchResultTableExtend.extendTableColumn
          type: "object"
        },
        searchInAttibuteFacetPostion: {
          type: "object"
        },
        cleanUpSpaceFilters: {
          type: "function"
        },
        setSearchInLabelIconBindings: {
          type: "function"
        },
        getSearchInFacetListMode: {
          type: "function"
        },
        checkAndSetSpaceIcon: {
          type: "function"
        },
        hasSpaceFiltersOnly: {
          type: "function"
        },
        showSpaceFacetInShowMoreDialog: {
          type: "function"
        },
        getSpaceFacetId: {
          type: "function"
        },
        bRecentSearches: {
          type: "bool"
        },
        bNoAppSearch: {
          type: "bool"
        },
        bResetSearchTermOnQuickSelectDataSourceItemPress: {
          type: "bool"
        },
        bPlaceHolderFixedValue: {
          type: "bool"
        },
        FF_bOptimizedQuickSelectDataSourceLabels: {
          type: "bool"
        },
        FF_optimizeForValueHelp: {
          type: "bool"
        },
        FF_errorMessagesAsButton: {
          type: "bool"
        },
        combinedResultviewToolbar: {
          // show (top-level) search bar + filter bar on top of result view (merged visualization)
          type: "bool"
        },
        selectionChange: {
          type: "function"
        },
        metaDataJsonType: {
          type: "bool"
        },
        facetVisibility: {
          type: "bool"
        },
        // The data source which is selected if in ushell the search bar gets visible:
        defaultDataSource: {
          type: "string"
        },
        displayNoResultsPageBackButton: {
          type: "bool"
        },
        displayNoResultsPageSearchAllButton: {
          type: "bool"
        },
        displayFacetPanelInCaseOfNoResults: {
          type: "bool"
        },
        browserTitleOverwritten: {
          type: "bool"
        },
        isUshell: {
          type: "bool"
        },
        userDefinedDatasourcesMulti: {
          type: "bool"
        },
        FF_staticHierarchyFacets: {
          type: "bool"
        },
        FF_dynamicHierarchyFacets: {
          type: "bool"
        },
        usageCollectionService: {
          type: "object"
        },
        performanceLogger: {
          type: "object"
        },
        eshUseExtendedChangeDetection: {
          type: "bool"
        },
        tabStripsFormatter: {
          type: "function"
        },
        assembleSearchCountBreadcrumbs: {
          type: "function"
        },
        folderMode: {
          type: "bool",
          isSinaParameter: true
        },
        autoAdjustResultViewTypeInFolderMode: {
          type: "bool"
        },
        enableQueryLanguage: {
          type: "bool",
          isSinaParameter: true
        }
      });

      if (configuration && Object.keys(configuration).length > 0 && !configuration.isUshell) {
        // use configuration passed from caller
        jQuery.extend(this, configuration);
      } else {
        // use global ushell configuration
        this.readUshellConfiguration();
        this.readOutdatedUshellConfiguration();
      }

      if (configuration !== null && configuration !== void 0 && configuration.isUshell) {
        this.isUshell = true;
      } else {
        // standalone ui doesn't call getModelSingleton in SearchModel.js
        // set default false
        this.isUshell = false;
      } // for parameters without values set the defaults


      this.setDefaults(); // update config from URL parameters (demoMode, esDevConfig, ...)

      this.updateConfigFromUrlParameters(); // validate resultViewTypes and fallbackResultViewType of SearchConfiguration
      // move -> NormalSearch Resolve of SearchModel
      // this.validateResultViewConfigurations();
      // set module load paths

      this.setModulePaths(); // create default config for data sources

      this.createDefaultDataSourceConfig();
    }

    _createClass(SearchConfiguration, [{
      key: "setModulePaths",
      value: function setModulePaths() {
        if (!this.modulePaths) {
          return;
        }

        for (var i = 0; i < this.modulePaths.length; ++i) {
          var modulePath = this.modulePaths[i];
          var urlPrefix = modulePath.urlPrefix.replace("${host}", window.location.protocol + "//" + window.location.host);
          jQuery.sap.registerModulePath(modulePath.moduleName, urlPrefix);
        }
      }
    }, {
      key: "readUshellConfiguration",
      value: function readUshellConfiguration() {
        // read global config
        try {
          var config = window["sap-ushell-config"].renderers.fiori2.componentData.config.esearch;
          jQuery.extend(true, this, config);
        } catch (e) {
          this.log.warning("Error while reading global ushell config: " + e.stack);
        }
      }
    }, {
      key: "readOutdatedUshellConfiguration",
      value: function readOutdatedUshellConfiguration() {
        try {
          // get config
          var config = window["sap-ushell-config"].renderers.fiori2.componentData.config; // due to historical reasons the config parameter searchBusinessObjects is not in esearch but in parent object
          // copy this parameter to config object

          if (typeof config.searchBusinessObjects !== "undefined" && typeof this.searchBusinessObjects === "undefined") {
            if (config.searchBusinessObjects === "hidden" || config.searchBusinessObjects === false) {
              this.searchBusinessObjects = false;
            } else {
              this.searchBusinessObjects = true;
            }
          } // copy shell configuration parameter enableSearch to config object


          if (typeof config.enableSearch !== "undefined" && typeof this.enableSearch === "undefined") {
            this.enableSearch = config.enableSearch;
          }
        } catch (e) {
          /* nothing to do.. */
        }
      }
    }, {
      key: "setDefaults",
      value: function setDefaults() {
        if (typeof this.searchBusinessObjects === "undefined") {
          this.searchBusinessObjects = true;
        }

        if (typeof this.odataProvider === "undefined") {
          this.odataProvider = false;
        }

        if (typeof this.multiSelect === "undefined") {
          this.multiSelect = true;
        }

        if (typeof this.charts === "undefined") {
          this.charts = true;
        }

        if (typeof this.maps === "undefined") {
          this.maps = undefined;
        }

        if (typeof this.mapProvider === "undefined") {
          this.mapProvider = undefined;
        }

        if (typeof this.newpie === "undefined") {
          this.newpie = false;
        }

        if (typeof this.dataSources === "undefined") {
          this.dataSources = [];
        }

        if (typeof this.enableSearch === "undefined") {
          this.enableSearch = true;
        }

        if (typeof this.personalizationStorage === "undefined") {
          this.personalizationStorage = "auto";
        }

        if (typeof this.boSuggestions === "undefined") {
          this.boSuggestions = false;
        }

        if (typeof this._eshClickableObjectType === "undefined") {
          this._eshClickableObjectType = true;
        }

        if (typeof this.defaultSearchScopeApps === "undefined") {
          this.defaultSearchScopeApps = false;
        }

        if (typeof this.searchScopeWithoutAll === "undefined") {
          this.searchScopeWithoutAll = false;
        }

        if (typeof this.suggestionKeyboardRelaxationTime === "undefined") {
          this.suggestionKeyboardRelaxationTime = 400;
        }

        if (typeof this.suggestionStartingCharacters === "undefined") {
          this.suggestionStartingCharacters = 3;
        }

        if (typeof this.resultViewTypes === "undefined") {
          this.resultViewTypes = ["searchResultList", "searchResultTable"];
        }

        if (typeof this.enableMultiSelectionResultItems === "undefined") {
          this.enableMultiSelectionResultItems = false;
        }

        if (typeof this.updateUrl === "undefined") {
          this.updateUrl = true;
        }

        if (typeof this.isSearchUrl === "undefined") {
          this.isSearchUrl = this.isSearchUrl; // eslint-disable-line no-self-assign
        }

        if (typeof this.beforeNavigation === "undefined") {
          this.beforeNavigation = this.beforeNavigation; // eslint-disable-line no-self-assign
        }

        if (typeof this.getCustomToolbar === "undefined") {
          this.getCustomToolbar = this.getCustomToolbar; // eslint-disable-line no-self-assign
        }

        if (typeof this.getCustomNoResultScreen === "undefined") {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          this.getCustomNoResultScreen = function (datasource, model) {
            return null;
          };
        }

        if (typeof this.quickSelectDataSources === "undefined") {
          this.quickSelectDataSources = [];
        }

        if (typeof this.initAsync === "undefined") {
          this.initAsync = this.initAsync; // eslint-disable-line no-self-assign
        }

        if (typeof this.pageSize === "undefined") {
          this.pageSize = 10;
        }

        if (typeof this.layoutUseResponsiveSplitter === "undefined") {
          this.layoutUseResponsiveSplitter = false;
        }

        if (typeof this.facetPanelWidthInPercent === "undefined") {
          this.facetPanelWidthInPercent = 25;
        }

        if (typeof this.FF_facetPanelUnifiedHeaderStyling === "undefined") {
          this.FF_facetPanelUnifiedHeaderStyling = false;
        }

        if (typeof this.FF_hierarchyBreadcrumbs === "undefined") {
          this.FF_hierarchyBreadcrumbs = false;
        }

        if (typeof this.FF_dynamicHierarchyFacetsInShowMore === "undefined") {
          this.FF_dynamicHierarchyFacetsInShowMore = false;
        }

        if (typeof this.FF_DWCO_REPOSITORY_EXPLORER_FOLDER === "undefined") {
          this.FF_DWCO_REPOSITORY_EXPLORER_FOLDER = false;
        }

        if (typeof this.searchBarDoNotHideForNoResults === "undefined") {
          this.searchBarDoNotHideForNoResults = false;
        }

        if (typeof this.FF_layoutWithoutPage === "undefined") {
          // obsolete
          this.FF_layoutWithoutPage = true;
        }

        if (typeof this.searchInAttibuteFacetPostion === "undefined") {
          this.searchInAttibuteFacetPostion = {};
        }

        if (typeof this.extendTableColumn === "undefined") {
          this.extendTableColumn = undefined;
        }

        if (typeof this.cleanUpSpaceFilters === "undefined") {
          this.cleanUpSpaceFilters = this.cleanUpSpaceFilters; // eslint-disable-line no-self-assign
        }

        if (typeof this.setSearchInLabelIconBindings === "undefined") {
          this.setSearchInLabelIconBindings = this.setSearchInLabelIconBindings; // eslint-disable-line no-self-assign
        }

        if (typeof this.getSearchInFacetListMode === "undefined") {
          this.getSearchInFacetListMode = this.getSearchInFacetListMode; // eslint-disable-line no-self-assign
        }

        if (typeof this.checkAndSetSpaceIcon === "undefined") {
          this.checkAndSetSpaceIcon = this.checkAndSetSpaceIcon; // eslint-disable-line no-self-assign
        }

        if (typeof this.hasSpaceFiltersOnly === "undefined") {
          this.hasSpaceFiltersOnly = this.hasSpaceFiltersOnly; // eslint-disable-line no-self-assign
        }

        if (typeof this.showSpaceFacetInShowMoreDialog === "undefined") {
          this.showSpaceFacetInShowMoreDialog = this.showSpaceFacetInShowMoreDialog; // eslint-disable-line no-self-assign
        }

        if (typeof this.getSpaceFacetId === "undefined") {
          this.getSpaceFacetId = this.getSpaceFacetId; // eslint-disable-line no-self-assign
        }

        if (typeof this.bRecentSearches === "undefined") {
          this.bRecentSearches = false;
        }

        if (typeof this.bNoAppSearch === "undefined") {
          this.bNoAppSearch = false;
        }

        if (typeof this.bResetSearchTermOnQuickSelectDataSourceItemPress === "undefined") {
          this.bResetSearchTermOnQuickSelectDataSourceItemPress = false;
        }

        if (typeof this.bPlaceHolderFixedValue === "undefined") {
          this.bPlaceHolderFixedValue = false;
        }

        if (typeof this.FF_bOptimizedQuickSelectDataSourceLabels === "undefined") {
          this.FF_bOptimizedQuickSelectDataSourceLabels = false;
        }

        if (typeof this.FF_optimizeForValueHelp === "undefined") {
          this.FF_optimizeForValueHelp = false;
        }

        if (typeof this.FF_errorMessagesAsButton === "undefined") {
          this.FF_errorMessagesAsButton = false;
        }

        if (typeof this.combinedResultviewToolbar === "undefined") {
          this.combinedResultviewToolbar = false;
        }

        if (typeof this.selectionChange === "undefined") {
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          this.selectionChange = function () {}; // dummy function

        }

        if (typeof this.metaDataJsonType === "undefined") {
          this.metaDataJsonType = false;
        }

        if (typeof this.facetVisibility === "undefined") {
          this.facetVisibility = undefined; // undefined -> uses value from personalization
        }

        if (typeof this.defaultDataSource === "undefined") {
          this.defaultDataSource = undefined; // undefined -> uses first datasource after, see selectDataSource in SearchInputHelpPage
        }

        if (typeof this.displayNoResultsPageBackButton === "undefined") {
          this.displayNoResultsPageBackButton = false;
        }

        if (typeof this.displayNoResultsPageSearchAllButton === "undefined") {
          this.displayNoResultsPageSearchAllButton = false;
        }

        if (typeof this.displayFacetPanelInCaseOfNoResults === "undefined") {
          this.displayFacetPanelInCaseOfNoResults = false;
        }

        if (typeof this.browserTitleOverwritten === "undefined") {
          this.browserTitleOverwritten = true;
        }

        if (typeof this.userDefinedDatasourcesMulti === "undefined") {
          this.userDefinedDatasourcesMulti = false;
        }

        if (typeof this.FF_staticHierarchyFacets === "undefined") {
          this.FF_staticHierarchyFacets = false;
        }

        if (typeof this.FF_dynamicHierarchyFacets === "undefined") {
          this.FF_dynamicHierarchyFacets = true;
        }

        if (typeof this.usageCollectionService === "undefined") {
          this.usageCollectionService = undefined; // needs property 'logCustomEvent', type function(what, where, eventList)
        }

        if (typeof this.performanceLogger === "undefined") {
          this.performanceLogger = new PerformanceLogger();
        }

        if (typeof this.tabStripsFormatter === "undefined") {
          this.tabStripsFormatter = function (tabStrips) {
            return tabStrips;
          };
        }

        if (typeof this.assembleSearchCountBreadcrumbs === "undefined") {
          this.assembleSearchCountBreadcrumbs = undefined;
        }

        if (typeof this.folderMode === "undefined") {
          this.folderMode = false;
        }

        if (typeof this.autoAdjustResultViewTypeInFolderMode === "undefined") {
          this.autoAdjustResultViewTypeInFolderMode = false;
        }

        if (typeof this.enableQueryLanguage === "undefined") {
          this.enableQueryLanguage = false;
        } // Prepare caching map for custom datasource configurations


        this.dataSourceConfigurations = {};
        this.dataSourceConfigurations_Regexes = []; // eslint-disable-line camelcase

        if (this.dataSources) {
          for (var i = 0; i < this.dataSources.length; i++) {
            var dataSourceConfig = this.dataSources[i];

            if (dataSourceConfig.id) {
              this.dataSourceConfigurations[dataSourceConfig.id] = dataSourceConfig;
            } else if (dataSourceConfig.regex) {
              var flags = dataSourceConfig.regexFlags || undefined;
              var regex = new RegExp(dataSourceConfig.regex, flags);

              if (regex) {
                dataSourceConfig.regex = regex;
                this.dataSourceConfigurations_Regexes.push(dataSourceConfig);
              }
            } else {
              var message = "Following datasource configuration does neither include a valid id nor a regular expression, therefore it is ignored:\n" + JSON.stringify(dataSourceConfig);
              this.log.warning(message);
            }
          }
        }

        this.dataSources = undefined; // Special logic for Document Result List Item
        // this.dataSourceConfigurations['fileprocessorurl'] = this.dataSourceConfigurations['fileprocessorurl'] || {};
        // this.dataSourceConfigurations['fileprocessorurl'].searchResultListItem = this.dataSourceConfigurations['fileprocessorurl'].searchResultListItem || 'sap.esh.search.ui.controls.SearchResultListItemDocument';

        this.documentDataSource = {
          searchResultListItem: "sap.esh.search.ui.controls.SearchResultListItemDocument"
        }; // Special logic for Note Result List Item
        // TODO: sinaNext does not pass trough the semantic object names any longer, so the following does not work any longer:

        this.dataSourceConfigurations.noteprocessorurl = this.dataSourceConfigurations.noteprocessorurl || {};
        this.dataSourceConfigurations.noteprocessorurl.searchResultListItem = this.dataSourceConfigurations.noteprocessorurl.searchResultListItem || new SearchResultListItemNote();
        this.dataSourceConfigurations.noteprocessorurl.searchResultListSelectionHandler = this.dataSourceConfigurations.noteprocessorurl.searchResultListSelectionHandler || "sap.esh.search.ui.controls.SearchResultListSelectionHandlerNote";
      }
    }, {
      key: "createDefaultDataSourceConfig",
      value: function createDefaultDataSourceConfig() {
        this.defaultDataSourceConfig = {
          searchResultListItem: undefined,
          searchResultListItemControl: undefined,
          searchResultListItemContent: undefined,
          searchResultListItemContentControl: undefined,
          searchResultListSelectionHandler: SearchResultListSelectionHandler["getMetadata"]().getName(),
          // ToDo
          searchResultListSelectionHandlerControl: SearchResultListSelectionHandler
        };
      }
    }, {
      key: "updateConfigFromUrlParameters",
      value: function updateConfigFromUrlParameters() {
        var parameters = this.parseUrlParameters();

        for (var parameter in parameters) {
          if (parameter === "demoMode") {
            this.searchBusinessObjects = true;
            this.enableSearch = true;
            continue;
          }

          if (parameter === "resultViewTypes") {
            var config = parameters[parameter].split(","); // convert to array

            config = config.filter(function (type) {
              return type.length > 0;
            }); // remove empty element

            this.resultViewTypes = config;
            continue;
          }

          var parameterMetaData = this.urlParameterMetaData[parameter];

          if (!parameterMetaData) {
            continue;
          }

          var value = parameters[parameter];

          if (parameter === "esDevConfig") {
            var _config = JSON.parse(value);

            Object.assign(this, _config); // Update SearchCompositeControl using this config because SearchCompositeControl
            // does not read the URL and updates accordingly, we do it here:

            if (this.id) {
              var cc = sap.ui.getCore().byId(this.id);
              var ccProperties = cc["getMetadata"]().getProperties(); // ToDo

              var ccPropertyNames = Object.getOwnPropertyNames(ccProperties);

              for (var index = 0; index < ccPropertyNames.length; index++) {
                var ccPropertyName = ccPropertyNames[index]; // check which properties of this config also exist in the SearchCompositeControl and whose values are not undefined:

                if (typeof _config[ccPropertyName] !== "undefined") {
                  // call the setter of the property in SearchCompositeControl to apply the value from url:
                  // @ts-ignore    // ToDo
                  var setterName = ccProperties[ccPropertyName]._sMutator;
                  cc[setterName].apply(cc, [_config[ccPropertyName]]);
                }
              }
            }

            continue;
          }

          switch (parameterMetaData.type) {
            case "bool":
              value = value === "true" || value === "";
              break;

            default:
          }

          this[parameter] = value;
        }
      }
    }, {
      key: "parseUrlParameters",
      value: function parseUrlParameters() {
        if (!URLSearchParams) {
          return {};
        }

        var urlSearchParams = new URLSearchParams(window.location.search); // @ts-ignore    // ToDo

        return Object.fromEntries(urlSearchParams.entries());
      }
    }, {
      key: "parseSearchUrlParameters",
      value: function parseSearchUrlParameters(oSearchParameters) {
        return oSearchParameters;
      } // use this as an early initialization routine

    }, {
      key: "loadCustomModulesAsync",
      value: function loadCustomModulesAsync() {
        if (this._loadCustomModulesProm) {
          return this._loadCustomModulesProm;
        }

        var dataSourceConfigurationProm;
        var dataSourceConfigurationsProms = [];

        for (var dataSourceId in this.dataSourceConfigurations) {
          dataSourceConfigurationProm = this.loadCustomModulesForDataSourceIdAsync(dataSourceId);
          dataSourceConfigurationsProms.push(dataSourceConfigurationProm);
        }

        this._loadCustomModulesProm = Promise.all(dataSourceConfigurationsProms);
        return this._loadCustomModulesProm;
      }
    }, {
      key: "loadCustomModulesForDataSourcesAsync",
      value: function loadCustomModulesForDataSourcesAsync(dataSources, dataSourcesHints) {
        var _this = this;

        return _call(function () {
          var dataSourcesLoadingProms = [];

          for (var i = 0; i < dataSources.length; i++) {
            var dataSourceHints = Array.isArray(dataSourcesHints) && dataSourcesHints.length > i && dataSourcesHints[i] || {};

            var dataSourceLoadingProm = _this.loadCustomModulesForDataSourceAsync(dataSources[i], dataSourceHints);

            dataSourcesLoadingProms.push(dataSourceLoadingProm);
          }

          return Promise.all(dataSourcesLoadingProms);
        });
      }
    }, {
      key: "loadCustomModulesForDataSourceAsync",
      value: function loadCustomModulesForDataSourceAsync(dataSource) {
        var dataSourceHints = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
        dataSourceHints = dataSourceHints || {};
        return this.loadCustomModulesForDataSourceIdAsync(dataSource.id, dataSourceHints);
      }
    }, {
      key: "loadCustomModulesForDataSourceIdAsync",
      value: function loadCustomModulesForDataSourceIdAsync(dataSourceId, dataSourceHints) {
        if (!dataSourceId) {
          return Promise.resolve();
        }

        this._dataSourceLoadingProms = this._dataSourceLoadingProms || {};
        var dataSourceLoadingProm = this._dataSourceLoadingProms[dataSourceId];

        if (!dataSourceLoadingProm) {
          var customControlAttrNames = [{
            moduleAttrName: "searchResultListItem",
            controlAttrName: "searchResultListItemControl"
          }, {
            moduleAttrName: "searchResultListItemContent",
            controlAttrName: "searchResultListItemContentControl"
          }, {
            moduleAttrName: "searchResultListSelectionHandler",
            controlAttrName: "searchResultListSelectionHandlerControl"
          }];

          var dataSourceConfiguration = this._prepareDataSourceConfigurationForDataSource(dataSourceId, dataSourceHints);

          var customControlProm;
          var customControlProms = [];

          for (var i = 0; i < customControlAttrNames.length; i++) {
            customControlProm = this._doLoadCustomModulesAsync(dataSourceId, dataSourceConfiguration, customControlAttrNames[i].moduleAttrName, customControlAttrNames[i].controlAttrName);
            customControlProms.push(customControlProm);
          }

          dataSourceLoadingProm = Promise.all(customControlProms);
          dataSourceLoadingProm._resolvedOrFailed = false;
          dataSourceLoadingProm.then(function () {
            dataSourceLoadingProm._resolvedOrFailed = true;
          });
          this._dataSourceLoadingProms[dataSourceId] = dataSourceLoadingProm;
        }

        return dataSourceLoadingProm;
      } // Helper function to keep 'dataSourceConfiguration' instance unchanged within
      // its scope while the main function loops over all instances

    }, {
      key: "_doLoadCustomModulesAsync",
      value: function _doLoadCustomModulesAsync(dataSourceId, dataSourceConfiguration, moduleAttrName, controlAttrName, defaultModuleName, defaultControl) {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        var that = this;
        return new Promise(function (resolve) {
          if (dataSourceConfiguration[moduleAttrName] && (!dataSourceConfiguration[controlAttrName] || dataSourceConfiguration[controlAttrName] == that.defaultDataSourceConfig[controlAttrName])) {
            try {
              sap.ui.require([dataSourceConfiguration[moduleAttrName].replace(/[.]/g, "/")], function (customControl) {
                dataSourceConfiguration[controlAttrName] = customControl;
                resolve();
              });
            } catch (e) {
              var message = "Could not load custom module '" + dataSourceConfiguration[moduleAttrName] + "' for data source with id '" + dataSourceId + "'. ";
              message += "Falling back to default data source configuration.";
              that.log.warning(message);
              dataSourceConfiguration[moduleAttrName] = defaultModuleName || that.defaultDataSourceConfig[moduleAttrName];
              dataSourceConfiguration[controlAttrName] = defaultControl || that.defaultDataSourceConfig[controlAttrName];
              resolve();
            }
          } else {
            if (!dataSourceConfiguration[controlAttrName]) {
              dataSourceConfiguration[moduleAttrName] = defaultModuleName || that.defaultDataSourceConfig[moduleAttrName];
              dataSourceConfiguration[controlAttrName] = defaultControl || that.defaultDataSourceConfig[controlAttrName];
            }

            resolve();
          }
        });
      }
    }, {
      key: "getDataSourceConfig",
      value: function getDataSourceConfig(dataSource) {
        if (this._dataSourceLoadingProms && this._dataSourceLoadingProms[dataSource.id] && !this._dataSourceLoadingProms[dataSource.id]._resolvedOrFailed) {
          // Return the default data source if the custom modules
          // for this particular data source aren't loaded yet.
          return this.defaultDataSourceConfig;
        }

        var config = this.dataSourceConfigurations[dataSource.id];

        if (!config) {
          config = this.defaultDataSourceConfig;
          this.dataSourceConfigurations[dataSource.id] = config;
        }

        return config;
      }
    }, {
      key: "_prepareDataSourceConfigurationForDataSource",
      value: function _prepareDataSourceConfigurationForDataSource(dataSourceId, dataSourcesHints) {
        var dataSourceConfiguration = {};

        if (this.dataSourceConfigurations[dataSourceId]) {
          dataSourceConfiguration = this.dataSourceConfigurations[dataSourceId];
        } else {
          for (var i = 0; i < this.dataSourceConfigurations_Regexes.length; i++) {
            if (this.dataSourceConfigurations_Regexes[i].regex.test(dataSourceId)) {
              dataSourceConfiguration = this.dataSourceConfigurations_Regexes[i];
              break;
            }
          }
        } // Use SearchResultListItemDocument control for document-like objects.
        // Can be overriden by another control in ushell configuration.


        if (dataSourcesHints && dataSourcesHints.isDocumentConnector) {
          if (!dataSourceConfiguration.searchResultListItem) {
            dataSourceConfiguration.searchResultListItem = this.documentDataSource.searchResultListItem;
          } else {
            var message = "Will attempt to load '" + dataSourceConfiguration.searchResultListItem + "' instead of '" + this.documentDataSource.searchResultListItem + "' for data source '" + dataSourceId + "'";
            this.log.warning(message);
          }
        }

        this.dataSourceConfigurations[dataSourceId] = dataSourceConfiguration;
        return dataSourceConfiguration;
      }
    }, {
      key: "getSina",
      value: function getSina() {
        return {}; // dummy DO NOT USE
      }
    }, {
      key: "renderSearchUrl",
      value: function renderSearchUrl(properties) {
        return "#Action-search&/top=" + properties.top + "&filter=" + properties.filter;
      }
    }, {
      key: "isSearchUrl",
      value: function isSearchUrl(url) {
        return url.indexOf("#Action-search") === 0;
      }
    }, {
      key: "getCustomToolbar",
      value: function getCustomToolbar() {
        return [];
      } // eslint-disable-next-line @typescript-eslint/no-unused-vars

    }, {
      key: "initAsync",
      value: function initAsync(properties) {
        return;
      } // eslint-disable-next-line @typescript-eslint/no-unused-vars

    }, {
      key: "beforeNavigation",
      value: function beforeNavigation(model) {
        return;
      }
    }]);

    return SearchConfiguration;
  }();

  return SearchConfiguration;
});
})();