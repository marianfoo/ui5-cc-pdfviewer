/*! 
 * SAPUI5

		(c) Copyright 2009-2021 SAP SE. All rights reserved
	 
 */

(function(){
sap.ui.define(["./i18n", "sap/base/Log", "./error/ErrorHandler", "sap/esh/search/ui/SearchHelper", "sap/ui/model/json/JSONModel", "sap/esh/search/ui/SearchResultListFormatter", "sap/esh/search/ui/SearchTabStripsFormatter", "sap/esh/search/ui/SearchResultTableFormatter", "sap/esh/search/ui/SearchFacetsFormatter", "sap/esh/search/ui/BreadcrumbsFormatter", "sap/esh/search/ui/suggestions/SuggestionHandler", "sap/esh/search/ui/SearchConfiguration", "sap/esh/search/ui/personalization/PersonalizationStorage", "sap/esh/search/ui/personalization/keyValueStoreFactory", "sap/esh/search/ui/sinaNexTS/providers/abap_odata/UserEventLogger", "sap/esh/search/ui/eventlogging/EventLogger", "sap/esh/search/ui/SearchUrlParser", "sap/esh/search/ui/cFLPUtil", "sap/esh/search/ui/usercategories/UserCategoryManager", "sap/esh/search/ui/error/errors", "sap/esh/search/ui/RecentlyUsedStorage", "./sinaNexTS/sina/SinaConfiguration", "./sinaNexTS/sina/sinaFactory", "./sinaNexTS/core/Log", "./SearchResultItemMemory", "./FolderModeUtils", "sap/ui/core/library", "./sinaNexTS/sina/HierarchyDisplayType", "./UIEvents", "./SearchShellHelperHorizonTheme"], function (__i18n, Log, __ErrorHandler, SearchHelper, JSONModel, SearchResultListFormatter, sap_esh_search_ui_SearchTabStripsFormatter, SearchResultTableFormatter, SearchFacetsFormatter, BreadcrumbsFormatter, SuggestionHandler, SearchConfiguration, PersonalizationStorage, keyValueStoreFactory, UserEventLogger, EventLogger, SearchUrlParser, cFLPUtil, UserCategoryManager, errors, RecentlyUsedStorage, ___sinaNexTS_sina_SinaConfiguration, sinaFactory, ___sinaNexTS_core_Log, __SearchResultSetItemMemory, ___FolderModeUtils, sap_ui_core_library, ___sinaNexTS_sina_HierarchyDisplayType, __UIEvents, __SearchShellHelperHorizonTheme) {
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule && typeof obj.default !== "undefined" ? obj.default : obj;
  }

  function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

  function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

  function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }

  function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

  function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function () {}; return { s: F, n: function () { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function (e) { throw e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function () { it = it.call(o); }, n: function () { var step = it.next(); normalCompletion = step.done; return step; }, e: function (e) { didErr = true; err = e; }, f: function () { try { if (!normalCompletion && it.return != null) it.return(); } finally { if (didErr) throw err; } } }; }

  function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

  function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

  function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

  function _get() { if (typeof Reflect !== "undefined" && Reflect.get) { _get = Reflect.get; } else { _get = function _get(target, property, receiver) { var base = _superPropBase(target, property); if (!base) return; var desc = Object.getOwnPropertyDescriptor(base, property); if (desc.get) { return desc.get.call(arguments.length < 3 ? target : receiver); } return desc.value; }; } return _get.apply(this, arguments); }

  function _superPropBase(object, property) { while (!Object.prototype.hasOwnProperty.call(object, property)) { object = _getPrototypeOf(object); if (object === null) break; } return object; }

  function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); Object.defineProperty(subClass, "prototype", { writable: false }); if (superClass) _setPrototypeOf(subClass, superClass); }

  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

  function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

  function _possibleConstructorReturn(self, call) { if (call && (typeof call === "object" || typeof call === "function")) { return call; } else if (call !== void 0) { throw new TypeError("Derived constructors may only return object or undefined"); } return _assertThisInitialized(self); }

  function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

  function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

  function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

  function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

  var i18n = _interopRequireDefault(__i18n);

  var Level = Log["Level"];

  var ErrorHandler = _interopRequireDefault(__ErrorHandler);

  var SearchTabStripsFormatter = sap_esh_search_ui_SearchTabStripsFormatter["Formatter"];
  // import TransactionsHandler from "sap/esh/search/ui/searchtermhandler/TransactionsHandler";
  var UserEventType = UserEventLogger["UserEventType"];
  var AvailableProviders = ___sinaNexTS_sina_SinaConfiguration["AvailableProviders"];
  var Severity = ___sinaNexTS_core_Log["Severity"];

  var SearchResultSetItemMemory = _interopRequireDefault(__SearchResultSetItemMemory);

  var FolderModeResultViewTypeCalculator = ___FolderModeUtils["FolderModeResultViewTypeCalculator"];
  var MessageType = sap_ui_core_library["MessageType"];
  var HierarchyDisplayType = ___sinaNexTS_sina_HierarchyDisplayType["HierarchyDisplayType"];

  var UIEvents = _interopRequireDefault(__UIEvents);

  var SearchShellHelperHorizonTheme = _interopRequireDefault(__SearchShellHelperHorizonTheme);
  /**
   * @namespace sap.esh.search.ui
   */


  function _await(value, then, direct) {
    if (direct) {
      return then ? then(value) : value;
    }

    if (!value || !value.then) {
      value = Promise.resolve(value);
    }

    return then ? value.then(then) : value;
  }

  function _empty() {}

  function _awaitIgnored(value, direct) {
    if (!direct) {
      return value && value.then ? value.then(_empty) : Promise.resolve();
    }
  }

  function _catch(body, recover) {
    try {
      var result = body();
    } catch (e) {
      return recover(e);
    }

    if (result && result.then) {
      return result.then(void 0, recover);
    }

    return result;
  }

  function _invokeIgnored(body) {
    var result = body();

    if (result && result.then) {
      return result.then(_empty);
    }
  }

  function _continue(value, then) {
    return value && value.then ? value.then(then) : then(value);
  }

  function _invoke(body, then) {
    var result = body();

    if (result && result.then) {
      return result.then(then);
    }

    return then(result);
  }

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

  var SearchModel = /*#__PURE__*/function (_JSONModel) {
    _inherits(SearchModel, _JSONModel);

    var _super = _createSuper(SearchModel);

    function SearchModel(settings) {
      var _oSettings$searchMode;

      var _this6;

      _classCallCheck(this, SearchModel);

      _this6 = _super.call(this, []);

      _defineProperty(_assertThisInitialized(_this6), "searchTermHandlers", []);

      _defineProperty(_assertThisInitialized(_this6), "logger", Log.getLogger("sap.esh.search.ui.SearchModel"));

      var oSettings = settings || {}; // get search configuration

      _this6.config = new SearchConfiguration(oSettings === null || oSettings === void 0 ? void 0 : oSettings.configuration); // memory for result set items storing for instance expansion state of item

      _this6.searchResultSetItemMemory = new SearchResultSetItemMemory(); // set size limit in order to allow drop down list boxes with more than 100 entries

      _this6.setSizeLimit(1000); // create suggestions handler


      _this6._suggestionHandler = new SuggestionHandler({
        model: _assertThisInitialized(_this6)
      }); // result view type calculator for folder mode

      _this6.folderModeResultViewTypeCalculator = new FolderModeResultViewTypeCalculator(_assertThisInitialized(_this6));
      _this6._performanceLoggerSearchMethods = []; // performance logging: Remember all method names of (open) search calls (only needed if search calls are running in parallel)

      _this6._errorHandler = new ErrorHandler({
        model: _assertThisInitialized(_this6)
      }); // decorate search methods (decorator prevents request overtaking)

      _this6._searchApplicationsRefuseOutdatedReq = SearchHelper.refuseOutdatedRequests(_this6.searchApplications.bind(_assertThisInitialized(_this6)), "search"); // app search
      // initial values for boTop and appTop

      _this6.pageSize = _this6.config.pageSize || 10;
      _this6.appTopDefault = 20;
      _this6.boTopDefault = _this6.pageSize;
      _this6.filterChanged = false; // init the properties
      // TODO: always use main result list (also for pure app results)

      _this6.setProperty("/isQueryInvalidated", true); // force request if query did not change


      _this6.setProperty("/isBusy", false); //show a busy indicator?


      _this6.setProperty("/busyDelay", 0); //delay before showing busy indicator, initalize with 0 for intial app loading


      _this6.setProperty("/tableColumns", []); // columns of table view


      _this6.setProperty("/sortableAttributes", []); // sort items of result


      _this6.setProperty("/tableRows", []); // results suitable for table view


      _this6.setProperty("/results", []); // combined result list: apps + BOs


      _this6.setProperty("/appResults", []); // applications result list


      _this6.setProperty("/boResults", []); // business object result list


      _this6.setProperty("/breadcrumbsHierarchyNodePaths", []);

      _this6.setProperty("/breadcrumbsHierarchyAttribute", "");

      _this6.setProperty("/hierarchyNodePaths", []);

      _this6.setProperty("/origBoResults", []); // business object result list


      _this6.setProperty("/count", 0);

      _this6.setProperty("/countText", "");

      _this6.setProperty("/boCount", 0);

      _this6.setProperty("/appCount", 0);

      _this6.setProperty("/facets", []);

      _this6.setProperty("/dataSources", [_this6.allDataSource, _this6.appDataSource]);

      _this6.setProperty("/appSearchDataSource", null);

      _this6.setProperty("/currentPersoServiceProvider", null); // current persoServiceProvider of table


      _this6.setProperty("/businessObjSearchEnabled", true);

      _this6.setProperty("/initializingObjSearch", false);

      _this6.setProperty("/suggestions", []);

      _this6.setProperty("/resultViewTypes", []); // selectable result view types


      _this6.setProperty("/resultViewType", ""); // active result view type, default value set in calculateResultViewSwitchVisibility() in initBusinessObjSearch


      _this6.setProperty("/resultViewSwitchVisibility", false); // visibility of display switch tap strip


      _this6.setProperty("/documentTitle", "Search");

      _this6.setProperty("/top", _this6.boTopDefault);

      _this6.setProperty("/orderBy", {});

      _this6.setProperty("/facetVisibility", false); // visibility of facet panel


      _this6.setProperty("/focusIndex", 0);

      _this6.setProperty("/errors", []);

      _this6.setProperty("/isErrorPopovered", false);

      _this6.setProperty("/nlqSuccess", false);

      _this6.setProperty("/nlqDescription", "");

      _this6.setProperty("/firstSearchWasExecuted", false);

      _this6.setProperty("/multiSelectionAvailable", false); //


      _this6.setProperty("/multiSelectionEnabled", false); //


      _this6.setProperty("/multiSelection/actions", []); //


      _this6.setProperty("/multiSelectionSelected", false);

      _this6.setProperty("/multiSelectionObjects", []);

      _this6.setProperty("/singleSelectionSelected", false);

      _this6.setProperty("/inputHelpSelectedItems", null);

      _this6.setProperty("/inputHelp", null);

      _this6.setProperty("/config", _this6.config);

      _this6.setProperty("/searchInLabel", "");

      _this6.setProperty("/searchInIcon", "sap-icon://none"); // prevent assert: Property 'src' (value: '') should be a valid Icon ...'


      _this6._subscribers = [];
      _this6.searchUrlParser = new SearchUrlParser({
        model: _assertThisInitialized(_this6)
      });
      _this6._userCategoryManagerPromise = null;
      _this6._tempDataSources = []; // used for SearchFacetDialogModel: SearchFacetDialogModel is constructed with reference to original searchModel
      // the _initBusinessObjSearchProm is reused from original searchModel in order to avoid double initialization
      // in initBusinessObjSearch

      if (oSettings !== null && oSettings !== void 0 && (_oSettings$searchMode = oSettings.searchModel) !== null && _oSettings$searchMode !== void 0 && _oSettings$searchMode.initAsyncPromise) {
        _this6.initAsyncPromise = oSettings.searchModel.initAsyncPromise;
        _this6.oFacetFormatter = new SearchFacetsFormatter(_assertThisInitialized(_this6));
      } // Rest of the initialization is done asynchronously:
      // this.initBusinessObjSearch();


      _this6.initAsyncPromise = _this6.initAsync();
      return _this6;
    } // ################################################################################
    // Initialization:
    // ################################################################################


    _createClass(SearchModel, [{
      key: "initAsync",
      value: function initAsync() {
        var _this = this;

        return _call(function () {
          var _exit = false; // check cached promise

          if (_this.initAsyncPromise) {
            return _await(_this.initAsyncPromise);
          } // set dummy datasource indicating the loading phase


          _this.setProperty("/initializingObjSearch", true);

          _this.setProperty("/isBusy", true);

          var dummyDataSourceForLoadingPhase = {
            label: i18n.getText("genericLoading"),
            labelPlural: i18n.getText("genericLoading"),
            enabled: false,
            id: "$$Loading$$"
          };

          _this.setProperty("/dataSource", dummyDataSourceForLoadingPhase);

          _this.setProperty("/dataSources", [dummyDataSourceForLoadingPhase]);

          return _await(_continue(_catch(function () {
            return _await(keyValueStoreFactory.create(_this.config.personalizationStorage, _this.config.isUshell, _this.config.id), function (keyValueStore) {
              _this._personalizationStorage = new PersonalizationStorage(keyValueStore, _this);

              if (_this.config.bRecentSearches) {
                _this.recentlyUsedStorage = new RecentlyUsedStorage({
                  personalizationStorage: _this._personalizationStorage,
                  searchModel: _this
                });
              }

              _this.initFacetVisibility(); // console.log(`initFacetVisibility: ${new Date().toTimeString()}`);
              // sina and datasources:


              return _await(_this.createSina(), function (_this$createSina) {
                _this.sinaNext = _this$createSina;

                _this.createAllAndAppDataSource(); // my favorites:


                return _invoke(function () {
                  if (_this.isMyFavoritesAvailable()) {
                    return _await(UserCategoryManager.create({
                      sina: _this.sinaNext,
                      personalizationStorage: _this._personalizationStorage
                    }), function (_UserCategoryManager$) {
                      _this.userCategoryManager = _UserCategoryManager$;
                    });
                  }
                }, function () {
                  // usage tracking:
                  var loggerProperties = {
                    sinaNext: _this.sinaNext
                  };

                  if (typeof _this.config.usageCollectionService !== "undefined") {
                    loggerProperties["usageCollectionService"] = _this.config.usageCollectionService;
                  }

                  _this.eventLogger = new EventLogger(loggerProperties);
                  Object.assign(_this.eventLogger, UserEventLogger.UserEventType); // ToDo: remove this line and adjust all "... .eventLogger." statements of ELISA

                  var userEventSessionStart = {
                    type: _this.eventLogger["SESSION_START"] // ToDo

                  };

                  _this.eventLogger.logEvent(userEventSessionStart); // set default DataSource


                  _this.setProperty("/defaultDataSource", _this.calculateDefaultDataSource());

                  if (_this.sinaNext.provider.id === "dummy") {
                    _this.setProperty("/defaultDataSource", _this.appDataSource);

                    _this.setProperty("/businessObjSearchEnabled", false);

                    _this.config.searchBusinessObjects = false;

                    _this.setFacetVisibility(false, false);
                  }

                  if (_this.sinaNext.provider.id === "inav2" && _this.config.isUshell) {
                    // register enterprise search system
                    // this triggers a logoff request to the enteprise search backend in case of logoff from flp
                    // (this is not necessary for abap_odata because frontendserver system is registered by flp)
                    // load ushell deps lazy only in case of FLP
                    sap.ui.require(["sap/ushell/System"], function (System) {
                      sap.ushell.Container.addRemoteSystem(new System({
                        alias: "ENTERPRISE_SEARCH",
                        platform: "abap",
                        baseUrl: "/ENTERPRISE_SEARCH"
                      }));
                    });
                  }

                  _this.setProperty("/uiFilter", _this.sinaNext.createFilter());

                  _this.loadDataSources();

                  _this.resetDataSource(false);

                  _this.resetAllFilterConditions(false); // this.config.loadCustomModulesAsync();


                  _this.query = _this.sinaNext.createSearchQuery();

                  if (_this.config.multiSelect) {
                    _this.query.setMultiSelectFacets(true);
                  }

                  _this.oFacetFormatter = new SearchFacetsFormatter(_this);
                  _this._tabStripFormatter = new SearchTabStripsFormatter(_this.allDataSource, _this);
                  _this._breadcrumbsFormatter = new BreadcrumbsFormatter.Formatter(_this);
                  _this.dataSourceTree = _this._tabStripFormatter.tree; // Set through the API of SearchCompositeControl:

                  _this.setSearchBoxTerm(_this.config.searchTerm, false);

                  if (_this.config.dataSource) {
                    _this.setDataSourceById(_this.config.dataSource, false, false);
                  }

                  if (_this.config.filterRootCondition) {
                    _this.setFilterRootCondition(_this.config.filterRootCondition);
                  }

                  _this.setProperty("/initializingObjSearch", false);

                  _this.setProperty("/isBusy", false);

                  return _continue(_catch(function () {
                    return _awaitIgnored(_this.config.initAsync(_this));
                  }, function (e) {
                    _this.logger.warning("initAsync() which was passed to SearchConfiguration threw an error: " + e);
                  }), function () {
                    return _invokeIgnored(function () {
                      var _sap, _sap$ushell;

                      if ((_sap = sap) !== null && _sap !== void 0 && (_sap$ushell = _sap.ushell) !== null && _sap$ushell !== void 0 && _sap$ushell.Container) {
                        return _await(sap.ushell.Container.getServiceAsync("VisualizationInstantiation"), function (_sap$ushell$Container) {
                          _this.uShellVisualizationInstantiationService = _sap$ushell$Container;
                        });
                      }
                    }); // if (this.config.isUshell) {
                    //     // handle transactions only in ushell:
                    //     this.searchTermHandlers.push(new TransactionsHandler(this));
                    // }
                  });
                });
              });
            });
          }, function (error) {
            _this._errorHandler.onError(error);

            var _Promise$reject = Promise.reject(error);

            _exit = true;
            return _Promise$reject;
          }), function (_result) {
            return _exit ? _result : Promise.resolve();
          }));
        });
      }
    }, {
      key: "createSina",
      value: function createSina() {
        var _this2 = this;

        return _call(function () {
          // no enterprise search configured -> return dummy sina
          if (!_this2.config.searchBusinessObjects) {
            return _await(sinaFactory.createAsync("dummy"));
          } // use url parameter
          // sinaConfiguration={"provider":"multi","subProviders":["abap_odata","inav2","sample"],"federationType":"round_robin"}
          // to active the multi provider


          var trials = [];

          if (window.location.href.indexOf("demo/FioriLaunchpad.") !== -1) {
            trials = [AvailableProviders.SAMPLE];
          } else {
            trials = [// {provider: 'multi', subProviders: ['abap_odata', 'inav2', 'sample'], federationType: 'round_robin'},
            // {provider: "multi", subProviders: [{ provider: "abap_odata", label: "a1", url: "/unvalid" }, { provider: "abap_odata", label: "a2", url: "/unvalid" }]},
            AvailableProviders.ABAP_ODATA, AvailableProviders.INAV2, AvailableProviders.DUMMY];
          } // cFlp


          return _await(cFLPUtil.readCFlpConfiguration(trials), function (_cFLPUtil$readCFlpCon) {
            trials = _cFLPUtil$readCFlpCon; // sina configuration from flp overwrites

            if (_this2.config.sinaConfiguration) {
              trials = [_this2.config.sinaConfiguration];
            } // mix search configuration into sina configuration


            trials = _this2.mixinSearchConfigurationIntoSinaConfiguration(trials); // try to create a sina by trying providers, first succesful provider wins

            return sinaFactory.createByTrialAsync(trials);
          });
        });
      }
    }, {
      key: "mixinSearchConfigurationIntoSinaConfiguration",
      value: function mixinSearchConfigurationIntoSinaConfiguration(sinaConfigurations) {
        var resultSinaConfigurations = [];

        for (var i = 0; i < sinaConfigurations.length; ++i) {
          var sinaConfiguration = sinaConfigurations[i];

          if (typeof sinaConfiguration === "string") {
            sinaConfiguration = {
              provider: sinaConfiguration,
              url: ""
            };
          }

          for (var parameterName in this.config.urlParameterMetaData) {
            var parameterMetaData = this.config.urlParameterMetaData[parameterName];

            if (!parameterMetaData.isSinaParameter) {
              continue;
            }

            if (!sinaConfiguration[parameterName]) {
              sinaConfiguration[parameterName] = this.config[parameterName];
            }
          }

          var sinaUI5Log = Log.getLogger("sap.esh.search.ui.eshclient");
          sinaConfiguration.logTarget = {
            debug: sinaUI5Log.debug,
            info: sinaUI5Log.info,
            warn: sinaUI5Log.warning,
            error: sinaUI5Log.error
          };
          var sinaLogLevel = Severity.ERROR; // map UI5 loglevel to Sina loglevel:

          switch (sinaUI5Log.getLevel()) {
            case Level.ALL:
            case Level.TRACE:
            case Level.DEBUG:
              sinaLogLevel = Severity.DEBUG;
              break;

            case Level.INFO:
              sinaLogLevel = Severity.INFO;
              break;

            case Level.WARNING:
              sinaLogLevel = Severity.WARN;
              break;
          }

          sinaConfiguration.logLevel = sinaLogLevel;
          resultSinaConfigurations.push(sinaConfiguration);
        }

        return resultSinaConfigurations;
      }
      /**
       *
       * @deprecated use initAsync() instead
       */

    }, {
      key: "initBusinessObjSearch",
      value: function initBusinessObjSearch() {
        var _this3 = this;

        return _call(function () {
          return _await(_this3.initAsync());
        });
      }
    }, {
      key: "calculateDefaultDataSource",
      value: function calculateDefaultDataSource() {
        var defaultDataSource = this.allDataSource;

        if (this.config.defaultSearchScopeApps) {
          // according config parameter, Apps as default
          defaultDataSource = this.appDataSource;
        }

        if (this.config.defaultDataSource) {
          // according config parameter, default dataSource id
          defaultDataSource = this.sinaNext.getDataSource(this.config.defaultDataSource);
        }

        if (this.userCategoryManager && this.userCategoryManager.isFavActive()) {
          // set user definded dataSource as default
          defaultDataSource = this.userCategoryManager.getCategory("MyFavorites");
        }

        return defaultDataSource;
      }
    }, {
      key: "initFacetVisibility",
      value: function initFacetVisibility() {
        // check configuration
        if (typeof this.config.facetVisibility !== "undefined") {
          this.setFacetVisibility(this.config.facetVisibility, false);
          return;
        } // check personalization


        var facetsVisible = false;

        try {
          facetsVisible = this._personalizationStorage.getItem("search-facet-panel-button-state"); // ToDo
        } catch (e) {//
        }

        this.setFacetVisibility(facetsVisible, false);
      } // ################################################################################
      // Get the state of things:
      // ################################################################################

    }, {
      key: "isBusinessObjSearchConfigured",
      value: function isBusinessObjSearchConfigured() {
        try {
          var config = window["sap-ushell-config"].renderers.fiori2.componentData.config;
          return config.searchBusinessObjects !== "hidden";
        } catch (e) {
          return true;
        }
      }
    }, {
      key: "isBusinessObjSearchEnabled",
      value: function isBusinessObjSearchEnabled() {
        // TODO: how does this differ from isBusinessObjSearchConfigured() above?
        return this.getProperty("/businessObjSearchEnabled");
      } // ################################################################################
      // Getter/Setter:
      // ################################################################################

    }, {
      key: "setProperty",
      value: function setProperty(sPath, oValue, oContext, bAsyncUpdate) {
        try {
          var res = _get(_getPrototypeOf(SearchModel.prototype), "setProperty", this).call(this, sPath, oValue, oContext, bAsyncUpdate);

          switch (sPath) {
            case "/boResults":
            case "/appResults":
              this.calculateResultList();
              break;

            case "/appCount":
            case "/boCount":
              res = this.setProperty("/count", this.getProperty("/appCount") + this.getProperty("/boCount"));
              break;

            case "/count":
              res = this.setProperty("/countText", this._calculateCountText());
              break;

            case "expanded":
              if (oContext && oContext.getPath().startsWith("/results/")) {
                var object = oContext.getObject();

                if (object.key && typeof oValue === "boolean") {
                  var searchResultSetItem = object;
                  this.searchResultSetItemMemory.setExpanded(searchResultSetItem.key, oValue);
                }
              }

              break;

            default:
              break;
          }

          return res;
        } catch (error) {
          this._errorHandler.onError(error);
        }
      }
    }, {
      key: "_calculateCountText",
      value: function _calculateCountText() {
        var count = this.getProperty("/count");

        if (count > 0) {
          if (this.getProperty("/nlqSuccess")) {
            return this.getProperty("/nlqDescription");
          }

          if (typeof count !== "number") {
            return "";
          }

          var countAsStr = SearchHelper.formatInteger(count); // DWC exit

          if (this.getProperty("/searchInLabel")) {
            return (this.getProperty("/searchInLabel") || i18n.getText("results")) + " (" + countAsStr + ")";
          }

          return i18n.getText("results") + " (" + countAsStr + ")";
        }

        return "";
      }
    }, {
      key: "getPersonalizationStorageInstance",
      value: function getPersonalizationStorageInstance() {
        return this._personalizationStorage;
      } // TODO: move to datasource

    }, {
      key: "getSearchBoxTerm",
      value: function getSearchBoxTerm() {
        return this.getProperty("/uiFilter/searchTerm") || "";
      }
    }, {
      key: "setSearchBoxTerm",
      value: function setSearchBoxTerm(searchTerm, fireQuery) {
        searchTerm = searchTerm || "";
        var searchTermTrimLeft = searchTerm.replace(/^\s+/, ""); // TODO: rtl

        this.setProperty("/uiFilter/searchTerm", searchTermTrimLeft);
        this.calculateSearchButtonStatus();

        if (fireQuery || typeof fireQuery === "undefined") {
          this._firePerspectiveQuery();
        }
      }
    }, {
      key: "getLastSearchTerm",
      value: function getLastSearchTerm() {
        return this.query.getSearchTerm();
      }
    }, {
      key: "setFacetVisibility",
      value: function setFacetVisibility(visibility, fireQuery) {
        if (sap.ui.Device.system.phone) {
          visibility = false;
        } // set new value


        this.setProperty("/facetVisibility", visibility); // set button status in sap storage

        try {
          this._personalizationStorage.setItem("search-facet-panel-button-state", visibility);
        } catch (e) {//
        }

        if (fireQuery || typeof fireQuery === "undefined") {
          this._firePerspectiveQuery({
            preserveFormerResults: true
          });
        }
      }
    }, {
      key: "getFacetVisibility",
      value: function getFacetVisibility() {
        return this.getProperty("/facetVisibility");
      }
    }, {
      key: "getTop",
      value: function getTop() {
        return this.getProperty("/top");
      }
    }, {
      key: "setTop",
      value: function setTop(top, fireQuery) {
        this.setProperty("/top", top);

        if (fireQuery || typeof fireQuery === "undefined") {
          this._firePerspectiveQuery({
            preserveFormerResults: true
          });
        }
      }
    }, {
      key: "resetTop",
      value: function resetTop() {
        this.setProperty("/focusIndex", 0);

        if (this.isAppCategory() || this.isUserCategory() && this.userCategoryManager && this.userCategoryManager.getCategory("MyFavorites").subDataSources.length === 0) {
          this.setTop(this.appTopDefault, false);
        } else {
          this.setTop(this.boTopDefault, false);
        }
      }
    }, {
      key: "getOrderBy",
      value: function getOrderBy() {
        return this.getProperty("/orderBy");
      }
    }, {
      key: "setOrderBy",
      value: function setOrderBy(orderBy, fireQuery) {
        this.setProperty("/orderBy", orderBy);
        this.updateSortableAttributesSelection(orderBy.orderBy);

        if (fireQuery || typeof fireQuery === "undefined") {
          this._firePerspectiveQuery({
            preserveFormerResults: true
          });
        }
      }
    }, {
      key: "resetOrderBy",
      value: function resetOrderBy(fireQuery) {
        this.setProperty("/orderBy", {});
        this.updateSortableAttributesSelection();

        if (fireQuery || typeof fireQuery === "undefined") {
          this._firePerspectiveQuery({
            preserveFormerResults: true
          });
        }
      }
    }, {
      key: "updateSortableAttributesSelection",
      value: function updateSortableAttributesSelection(orderBy) {
        var sortableAttributes = this.getProperty("/sortableAttributes");

        if (sortableAttributes.length === 0) {
          return;
        } // unselect all attributes


        for (var i = 0; i < sortableAttributes.length; i++) {
          sortableAttributes[i].selected = false;
        } // select one attribute


        var orderById = orderBy === undefined ? "DEFAULT_SORT_ATTRIBUTE" : orderBy;

        for (var _i = 0; _i < sortableAttributes.length; _i++) {
          if (sortableAttributes[_i].attributeId === orderById) {
            sortableAttributes[_i].selected = true;
          }
        }

        this.setProperty("/sortableAttributes", sortableAttributes);
      }
    }, {
      key: "isEqualOrderBy",
      value: function isEqualOrderBy(modelOrderBy, queryOrderBy) {
        // 1) no sort order given
        if (!modelOrderBy.orderBy) {
          return queryOrderBy.length === 0;
        } // 2) sort order given


        if (queryOrderBy.length !== 1) {
          return false;
        }

        var queryOrderByElement = queryOrderBy[0];

        if (queryOrderByElement.id !== modelOrderBy.orderBy) {
          return false;
        }

        if (modelOrderBy.sortOrder === "ASC") {
          return queryOrderByElement.order === this.sinaNext.SortOrder.Ascending;
        }

        return queryOrderByElement.order === this.sinaNext.SortOrder.Descending;
      }
    }, {
      key: "isMyFavoritesAvailable",
      value: function isMyFavoritesAvailable() {
        var isAvailable = false;

        if (this.sinaNext.provider.id === "abap_odata") {
          isAvailable = true;
        }

        if (this.sinaNext.provider.id === "multi" && this.config.userDefinedDatasourcesMulti) {
          isAvailable = true;
        }

        return isAvailable;
      }
    }, {
      key: "getDocumentTitle",
      value: function getDocumentTitle() {
        var searchTerm = this.getSearchBoxTerm();
        var dataSourceLabel = this.getDataSource().labelPlural || this.getDataSource().label;
        var title;

        if (this.getDataSource() === this.allDataSource) {
          title = i18n.getText("searchTileTitleProposalAll", [searchTerm]);
        } else {
          title = i18n.getText("searchTileTitleProposal", [searchTerm, dataSourceLabel]);
        }

        return title;
      }
    }, {
      key: "resetQuery",
      value: function resetQuery() {
        // This resets the UI search model but not sina.
        // Deserializing a URL may NOT trigger a real ajax search request because also sina buffers the search results.
        // This is used for for back navigation from an object page to the search UI without triggering a new search request.
        if (this.getProperty("/initializingObjSearch")) {
          return;
        }

        SearchHelper.hasher.reset();
        this.resetTop();
        this.setSearchBoxTerm("", false);
        this.resetDataSource(false);
        this.resetAllFilterConditions(false);
        this.query.resetConditions();
        this.query.setSearchTerm("random-jgfhfdskjghrtekjhg");
        this.setProperty("/facets", []);
        this.setProperty("/results", []);
        this.setProperty("/appResults", []);
        this.setProperty("/boResults", []);
        this.setProperty("/breadcrumbsHierarchyNodePaths", []);
        this.setProperty("/breadcrumbsHierarchyAttribute", "");
        this.setProperty("/hierarchyNodePaths", []);
        this.setProperty("/origBoResults", []);
        this.setProperty("/count", 0);
        this.setProperty("/boCount", 0);
        this.setProperty("/appCount", 0);
      }
    }, {
      key: "resetSearchResultItemMemory",
      value: function resetSearchResultItemMemory() {
        this.searchResultSetItemMemory.reset();
      } // ################################################################################
      // Everything Datasource:
      // ################################################################################

    }, {
      key: "createAllAndAppDataSource",
      value: function createAllAndAppDataSource() {
        // all data source
        this.allDataSource = this.sinaNext.getAllDataSource();
        this.allDataSource.label = i18n.getText("label_all");
        this.allDataSource.labelPlural = i18n.getText("label_all"); // app datasource

        this.appDataSource = this.sinaNext._createDataSource({
          id: "$$APPS$$",
          label: i18n.getText("label_apps"),
          labelPlural: i18n.getText("label_apps"),
          type: this.sinaNext.DataSourceType.Category
        });
        this.setProperty("/appSearchDataSource", this.appDataSource);
      }
    }, {
      key: "getUserCategoryManager",
      value: function getUserCategoryManager() {
        var _this4 = this;

        return _call(function () {
          // caching
          if (_this4._userCategoryManagerPromise) {
            return _await(_this4._userCategoryManagerPromise);
          } // create


          _this4._userCategoryManagerPromise = _this4.initAsync().then(function () {
            return _this4.userCategoryManager;
          });
          return _await(_this4._userCategoryManagerPromise);
        });
      }
    }, {
      key: "loadDataSources",
      value: function loadDataSources() {
        // get all datasources from sina
        var dataSources = this.sinaNext.getBusinessObjectDataSources();
        dataSources = dataSources.slice(); // exclude app search datasource (here: app search datasource = connector with transactions)

        var dataSourcesWithOutAppSearch = [];
        dataSources.forEach(function (dataSource) {
          if (!dataSource.usage.appSearch) {
            dataSourcesWithOutAppSearch.push(dataSource);
          }
        }); // check "Use Personalized Search Scope" is active

        if (this.userCategoryManager && this.userCategoryManager.isFavActive()) {
          dataSourcesWithOutAppSearch.splice(0, 0, this.userCategoryManager.getCategory("MyFavorites"));
          this.favDataSource = this.userCategoryManager.getCategory("MyFavorites");
        } // add app and all datasource


        if (!this.config.odataProvider && this.config.isUshell) {
          dataSourcesWithOutAppSearch.splice(0, 0, this.appDataSource);
        }

        if (!this.config.searchScopeWithoutAll) {
          dataSourcesWithOutAppSearch.splice(0, 0, this.allDataSource);
        } else {
          if (!this.config.defaultDataSource && (!this.userCategoryManager || this.userCategoryManager && !this.userCategoryManager.isFavActive())) {
            // without all dataSource and no default dataSource, set the first item as default
            this.setProperty("/defaultDataSource", dataSourcesWithOutAppSearch[0]);
          }
        } // set property


        this.setProperty("/dataSources", dataSourcesWithOutAppSearch);
        this.setProperty("/searchTermPlaceholder", this.calculatePlaceholder());
      }
    }, {
      key: "resetDataSource",
      value: function resetDataSource(fireQuery) {
        this.setDataSource(this.getDefaultDataSource(), fireQuery);
      }
    }, {
      key: "isAllCategory",
      value: function isAllCategory() {
        var ds = this.getProperty("/uiFilter/dataSource");
        return ds === this.allDataSource;
      }
    }, {
      key: "isOtherCategory",
      value: function isOtherCategory() {
        var ds = this.getProperty("/uiFilter/dataSource");
        return (ds.type === this.sinaNext.DataSourceType.Category || ds.type === this.sinaNext.DataSourceType.UserCategory) && !this.isAllCategory();
      }
    }, {
      key: "isAppCategory",
      value: function isAppCategory() {
        var ds = this.getProperty("/uiFilter/dataSource");
        return ds === this.appDataSource;
      }
    }, {
      key: "isUserCategory",
      value: function isUserCategory() {
        var ds = this.getProperty("/uiFilter/dataSource");
        return ds.type === this.sinaNext.DataSourceType.UserCategory;
      }
    }, {
      key: "isBusinessObject",
      value: function isBusinessObject() {
        return this.getProperty("/uiFilter/dataSource").type === this.sinaNext.DataSourceType.BusinessObject;
      }
    }, {
      key: "isUserCategoryAppSearchOnlyWithoutBOs",
      value: function isUserCategoryAppSearchOnlyWithoutBOs() {
        return this.isUserCategory() && this.userCategoryManager && this.userCategoryManager.getCategory("MyFavorites").subDataSources.length === 0;
      }
    }, {
      key: "getDataSource",
      value: function getDataSource() {
        return this.getProperty("/uiFilter/dataSource");
      }
    }, {
      key: "getDefaultDataSource",
      value: function getDefaultDataSource() {
        return this.getProperty("/defaultDataSource");
      }
      /**
       * @this sap.esh.search.ui.SearchModel
       * @param {string} dataSourceId
       * @param {boolean} [fireQuery]
       * @param {boolean} [resetTop]
       */

    }, {
      key: "setDataSourceById",
      value: function setDataSourceById(dataSourceId, fireQuery, resetTop) {
        var ds = this.sinaNext.getDataSource(dataSourceId);

        if (ds && ds.id && ds.id === dataSourceId) {
          this.setDataSource(ds, fireQuery, resetTop);
          return;
        }

        throw "Could not set data source with id " + dataSourceId + " because it was not in the list of loaded data sources";
      }
    }, {
      key: "setDataSource",
      value: function setDataSource(dataSource, fireQuery, resetTop) {
        if (this.getDataSource() !== dataSource) {
          var userEventDatasourceChange = {
            type: this.eventLogger["DATASOURCE_CHANGE"],
            // ToDo
            dataSourceId: dataSource.id
          };
          this.eventLogger.logEvent(userEventDatasourceChange);
        }

        this.updateDataSourceList(dataSource);
        this.getProperty("/uiFilter").setDataSource(dataSource);

        if (resetTop || resetTop === undefined) {
          this.resetTop();
        }

        this.setProperty("/searchTermPlaceholder", this.calculatePlaceholder());
        this.calculateSearchButtonStatus();

        if (fireQuery || fireQuery === undefined) {
          this._firePerspectiveQuery();
        }
      } // getServerDataSources: function () {
      //     var that = this;
      //     if (that.getDataSourcesDeffered) {
      //         return that.getDataSourcesDeffered;
      //     }
      //     that.getDataSourcesDeffered = that.sina
      //         .getDataSources()
      //         .then(function (dataSources) {
      //             // filter out categories
      //             return jQuery.grep(
      //                 dataSources,
      //                 function (dataSource) {
      //                     return (
      //                         dataSource.getType() !== "Category"
      //                     );
      //                 }
      //             );
      //         });
      //     return that.getDataSourcesDeffered;
      // },
      // ################################################################################
      // Filter conditions:
      // ################################################################################

    }, {
      key: "notifyFilterChanged",
      value: function notifyFilterChanged() {
        // notify ui about changed filter, data binding does not react on changes below
        // conditions, so this is done manually
        jQuery.each(this["aBindings"], function (index, binding) {
          // ToDo
          if (binding.sPath === "/uiFilter/rootCondition") {
            binding.checkUpdate(true);
          }
        });
      }
    }, {
      key: "getFilterRootCondition",
      value: function getFilterRootCondition() {
        var rootCondition;

        if (this.getProperty("/uiFilter")) {
          rootCondition = this.getProperty("/uiFilter").rootCondition;
        }

        return rootCondition;
      }
    }, {
      key: "setFilterRootCondition",
      value: function setFilterRootCondition(rootCondition, fireQuery) {
        if (rootCondition.type !== "Complex") {
          throw new Error("filter root condition must be of type ComplexCondition");
        }

        for (var index = 0; index < rootCondition.conditions.length; index++) {
          var complexChildCondition = rootCondition.conditions[index];

          if (complexChildCondition.type !== "Complex") {
            throw new Error("filters of root condition must be of type ComplexCondition");
          }

          for (var _index = 0; _index < complexChildCondition.conditions.length; _index++) {
            var simpleGrandChildCondition = complexChildCondition.conditions[_index];

            if (simpleGrandChildCondition.type !== "Simple") {
              throw new Error("filters of the lowest level must be of type SimpleCondition");
            }
          }
        }

        this.getProperty("/uiFilter").setRootCondition(rootCondition);

        if (fireQuery || typeof fireQuery === "undefined") {
          this._firePerspectiveQuery({
            preserveFormerResults: false
          });
        }

        this.notifyFilterChanged();
      }
    }, {
      key: "addFilterCondition",
      value: function addFilterCondition(filterCondition, fireQuery) {
        try {
          var uiFilter = this.getProperty("/uiFilter"); //DWC exit for handling SearchIn facets

          if (typeof this.config.cleanUpSpaceFilters === "function") {
            this.config.cleanUpSpaceFilters(this, filterCondition);
          }

          if (filterCondition.attribute || filterCondition.conditions) {
            uiFilter.autoInsertCondition(filterCondition);
          } else {
            // or a datasource?
            this.setDataSource(filterCondition, false);
          }

          if (fireQuery || typeof fireQuery === "undefined") {
            this._firePerspectiveQuery({
              preserveFormerResults: false
            });
          }

          this.notifyFilterChanged();
        } catch (error) {
          this._errorHandler.onError(error);
        }
      }
    }, {
      key: "removeFilterCondition",
      value: function removeFilterCondition(filterCondition, fireQuery) {
        if (filterCondition.attribute || filterCondition.conditions) {
          this.getProperty("/uiFilter").autoRemoveCondition(filterCondition);
        } else {
          this.setDataSource(filterCondition, false);
        }

        if (fireQuery || typeof fireQuery === "undefined") {
          this._firePerspectiveQuery({
            preserveFormerResults: true
          });
        }

        this.notifyFilterChanged();
      }
    }, {
      key: "resetAllFilterConditions",
      value: function resetAllFilterConditions(fireQuery) {
        this.getProperty("/uiFilter").resetConditions();

        if (fireQuery || typeof fireQuery === "undefined") {
          this._firePerspectiveQuery();
        }

        this.notifyFilterChanged();
      }
    }, {
      key: "resetFilterByFilterConditions",
      value: function resetFilterByFilterConditions(fireQuery) {
        // 1. collect static hierarchy facet filter conditions
        var nonFilterByConditioins = this._getNonFilterByFilterConditions(); // 1.1 DWC exit, should be removed after replacement of space by folder


        var searchInConditions = [];
        var searchInAttrPosistions = this.config.searchInAttibuteFacetPostion;

        if (searchInAttrPosistions) {
          for (var searchInAttribute in searchInAttrPosistions) {
            var searchInCondition = this.getProperty("/uiFilter").rootCondition.getAttributeConditions(searchInAttribute);

            for (var j = 0; j < searchInCondition.length; j++) {
              searchInConditions.push(searchInCondition[j]);
            }
          }
        } //// end of 1.1 DWC exit
        // 2. reset all filter conditions


        this.getProperty("/uiFilter").resetConditions(); // 3. add static hierarchy facet filter conditions

        if (nonFilterByConditioins.length > 0) {
          var _iterator = _createForOfIteratorHelper(nonFilterByConditioins),
              _step;

          try {
            for (_iterator.s(); !(_step = _iterator.n()).done;) {
              var nonFilterByCondition = _step.value;
              this.getProperty("/uiFilter").autoInsertCondition(nonFilterByCondition);
            }
          } catch (err) {
            _iterator.e(err);
          } finally {
            _iterator.f();
          }
        } // 3.1 DWC exit, should be removed after replacement of space by folder


        if (searchInConditions.length > 0) {
          for (var i = 0; i < searchInConditions.length; i++) {
            var filterCondition = searchInConditions[i];
            this.getProperty("/uiFilter").autoInsertCondition(filterCondition);
          }
        } //// end of 3.1 DWC exit
        // 4. notify filter changed


        if (fireQuery || typeof fireQuery === "undefined") {
          this._firePerspectiveQuery();
        }

        this.notifyFilterChanged();
      }
    }, {
      key: "setFilter",
      value: function setFilter(filter) {
        this.setDataSource(filter.dataSource, false);
        this.setSearchBoxTerm(filter.searchTerm, false);
        var uiFilter = this.getProperty("/uiFilter");
        uiFilter.setRootCondition(filter.rootCondition);

        this._firePerspectiveQuery();
      }
    }, {
      key: "filterWithoutFilterByConditions",
      value: function filterWithoutFilterByConditions() {
        var nonFilterByConditioins = this._getNonFilterByFilterConditions();

        return nonFilterByConditioins.length > 0 && nonFilterByConditioins.length === this.getProperty("/uiFilter").rootCondition.conditions.length;
      }
    }, {
      key: "_getNonFilterByFilterConditions",
      value: function _getNonFilterByFilterConditions() {
        var nonFilterByConditioins = [];

        var _iterator2 = _createForOfIteratorHelper(this.getProperty("/uiFilter").rootCondition.getAttributes()),
            _step2;

        try {
          for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
            var attribute = _step2.value;
            var attributeMetadata = this.getProperty("/uiFilter").dataSource.attributeMetadataMap[attribute];

            if (attributeMetadata && attributeMetadata.isHierarchy === true && attributeMetadata.hierarchyDisplayType === HierarchyDisplayType.StaticHierarchyFacet) {
              var _iterator3 = _createForOfIteratorHelper(this.getProperty("/uiFilter").rootCondition.getAttributeConditions(attribute)),
                  _step3;

              try {
                for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
                  var nonFilterByCondition = _step3.value;
                  nonFilterByConditioins.push(nonFilterByCondition);
                }
              } catch (err) {
                _iterator3.e(err);
              } finally {
                _iterator3.f();
              }
            }
          }
        } catch (err) {
          _iterator2.e(err);
        } finally {
          _iterator2.f();
        }

        return nonFilterByConditioins;
      } // ################################################################################
      // Suggestions:
      // ################################################################################

    }, {
      key: "doSuggestion",
      value: function doSuggestion() {
        this._suggestionHandler.doSuggestion(this.getProperty("/uiFilter").clone());
      }
    }, {
      key: "abortSuggestions",
      value: function abortSuggestions() {
        this._suggestionHandler.abortSuggestions();
      } // ################################################################################
      // Perspective and App Search:
      // ################################################################################

    }, {
      key: "_firePerspectiveQuery",
      value: function _firePerspectiveQuery(deserializationIn, preserveFormerResultsIn) {
        var _this5 = this;

        return _call(function () {
          return _await(_this5.initAsync(), function () {
            return _this5._doFirePerspectiveQuery(deserializationIn, preserveFormerResultsIn);
          });
        });
      }
    }, {
      key: "_doFirePerspectiveQuery",
      value: function _doFirePerspectiveQuery(deserializationIn, preserveFormerResultsIn) {
        var _this7 = this;

        var deserialization, preserveFormerResults;

        if (jQuery.isPlainObject(deserializationIn)) {
          deserialization = deserializationIn.deserialization;
          preserveFormerResults = deserializationIn.preserveFormerResults;
        } else {
          deserialization = deserializationIn || undefined;
          preserveFormerResults = preserveFormerResultsIn || undefined;
        } // decide whether to fire the query


        var uiFilter = this.getProperty("/uiFilter");

        if (uiFilter.equals(this.query.filter) && this.getTop() === this.query.top && this.isEqualOrderBy(this.getOrderBy(), this.query.sortOrder) && this.getCalculateFacetsFlag() === this.query.calculateFacets && !this.getProperty("/isQueryInvalidated")) {
          return Promise.resolve();
        } // set natural language query flag (nlq)


        if (SearchHelper.getUrlParameter("nlq") === "true") {
          this.query.setNlq(true);
        } // reset orderby if search term changes or datasource


        if (this.query.filter.dataSource && uiFilter.dataSource !== this.query.filter.dataSource || this.query.filter.searchTerm && uiFilter.searchTerm !== this.query.filter.searchTerm) {
          this.resetOrderBy(false);
        } // notify facets formatter about datasource change


        if (this.query.filter.dataSource && uiFilter.dataSource !== this.query.filter.dataSource) {
          this.oFacetFormatter.handleDataSourceChanged();
        } // reset top if search term changes or filter condition or datasource


        if (!deserialization && !preserveFormerResults) {
          if (!uiFilter.equals(this.query.filter)) {
            this.resetTop();
          }
        } // reset tabstrip formatter if search term changes or filter condition
        // UserCategory (My Favorites) is used and search for one connector


        if (uiFilter.searchTerm !== this.query.filter.searchTerm || !uiFilter.rootCondition.equals(this.query.filter.rootCondition)) {
          this._tabStripFormatter.invalidate(this.getDataSource());
        } // query invalidated by UI -> force to fire query by reseting result set


        if (this.getProperty("/isQueryInvalidated") === true) {
          this.query.resetResultSet();
          this.setProperty("/isQueryInvalidated", false);
        } // update query (app search also uses this.query despite search regest is not controlled by sina)


        this.query.setFilter(this.getProperty("/uiFilter").clone());
        this.query.setTop(this.getTop());
        this.query.setSortOrder(this.assembleSortOrder());
        this.query.setCalculateFacets(this.getCalculateFacetsFlag());
        this.setProperty("/queryFilter", this.query.filter); // notify subscribers

        this.notifySubscribers(UIEvents.ESHSearchStarted);
        sap.ui.getCore().getEventBus().publish(UIEvents.ESHSearchStarted); // enable busy indicator

        if (deserialization) {
          // no delay: avoid flickering when starting seach ui from shell header
          this.setProperty("/busyDelay", 0);
        } else {
          this.setProperty("/busyDelay", 600);
        }

        this.setProperty("/isBusy", true); // abort suggestions

        this.abortSuggestions(); // update url silently

        this.updateSearchURLSilently(deserialization); // for each new search the memory is reseted except in case of deserilization:
        // when navigating back from factsheet (object page) / other applications
        // the expand status of search result set items shall be restored -> do not clear memory

        if (!deserialization) {
          this.resetSearchResultItemMemory();
        } // log search request


        var userEventSearchRequest = {
          type: this.eventLogger[UserEventType.SEARCH_REQUEST],
          searchTerm: this.getProperty("/uiFilter/searchTerm"),
          dataSourceKey: this.getProperty("/uiFilter/dataSource").id
        };
        this.eventLogger.logEvent(userEventSearchRequest);
        var method = "Search for '".concat(this.getSearchBoxTerm(), "' (logId:").concat(this.config.performanceLogger.getUniqueId(), ")");

        this._performanceLoggerSearchMethods.push(method);

        this.config.performanceLogger.enterMethod({
          name: method
        }, {
          isSearch: true,
          comments: "Top: ".concat(this.getTop(), ", searchbox term: ").concat(this.getSearchBoxTerm())
        }); // wait for all subsearch queries

        return Promise.all([this.normalSearch(preserveFormerResults), this.appSearch()]).then(function () {
          var _this7$_perspective;

          _this7.calculateResultViewSwitchVisibility();

          _this7.setProperty("/tabStrips", _this7._tabStripFormatter.format(_this7.getDataSource(), _this7._perspective, _this7));

          _this7.setProperty("/breadcrumbsHierarchyNodePaths", _this7._breadcrumbsFormatter.formatNodePaths(_this7._perspective));

          _this7.setProperty("/breadcrumbsHierarchyAttribute", _this7._breadcrumbsFormatter.formatHierarchyAttribute(_this7._perspective));

          _this7.setProperty("/hierarchyNodePaths", (_this7$_perspective = _this7._perspective) === null || _this7$_perspective === void 0 ? void 0 : _this7$_perspective.hierarchyNodePaths);

          if (_this7.config.bRecentSearches && _this7.recentlyUsedStorage) {
            _this7.recentlyUsedStorage.addItem();
          }

          return _this7.oFacetFormatter.getFacets(_this7.getDataSource(), _this7._perspective, _this7)["catch"](function (error) {
            var _iterator4 = _createForOfIteratorHelper(_this7._performanceLoggerSearchMethods),
                _step4;

            try {
              for (_iterator4.s(); !(_step4 = _iterator4.n()).done;) {
                var _method = _step4.value;

                _this7.config.performanceLogger.leaveMethod({
                  name: _method
                });
              }
            } catch (err) {
              _iterator4.e(err);
            } finally {
              _iterator4.f();
            }

            _this7._performanceLoggerSearchMethods = [];
            return _this7._errorHandler.onErrorDeferred(error);
          }).then(function (facets) {
            /* return this._errorHandler.onErrorDeferred(
                new Error("Dummy error to test error toolbar/popup")
            ); */
            if ((facets === null || facets === void 0 ? void 0 : facets.length) > 0) {
              facets[0].change = jQuery["sap"].now(); // workaround to prevent earlier force update facet tree

              _this7.setProperty("/facets", facets);

              facets.forEach(function (facet) {
                return facet.handleModelUpdate && facet.handleModelUpdate();
              });
            }
          });
        })["catch"](function (error) {
          var _iterator5 = _createForOfIteratorHelper(_this7._performanceLoggerSearchMethods),
              _step5;

          try {
            for (_iterator5.s(); !(_step5 = _iterator5.n()).done;) {
              var _method2 = _step5.value;

              _this7.config.performanceLogger.leaveMethod({
                name: _method2
              });
            }
          } catch (err) {
            _iterator5.e(err);
          } finally {
            _iterator5.f();
          }

          _this7._performanceLoggerSearchMethods = [];
          return _this7._errorHandler.onErrorDeferred(error);
        }) // .always(() => { }
        ["finally"](function () {
          if (_this7.config && _this7.config.browserTitleOverwritten === true) {
            document.title = _this7.getDocumentTitle();
          }

          var _iterator6 = _createForOfIteratorHelper(_this7._performanceLoggerSearchMethods),
              _step6;

          try {
            for (_iterator6.s(); !(_step6 = _iterator6.n()).done;) {
              var _method3 = _step6.value;

              _this7.config.performanceLogger.leaveMethod({
                name: _method3
              });
            }
          } catch (err) {
            _iterator6.e(err);
          } finally {
            _iterator6.f();
          }

          _this7._performanceLoggerSearchMethods = [];

          _this7.notifySubscribers(UIEvents.ESHSearchFinished);

          sap.ui.getCore().getEventBus().publish(UIEvents.ESHSearchFinished);

          _this7.setProperty("/isBusy", false);

          _this7.setProperty("/firstSearchWasExecuted", true);

          _this7.notifyFilterChanged();

          _this7.updateMultiSelectionSelected();
        });
      }
    }, {
      key: "assembleSortOrder",
      value: function assembleSortOrder() {
        var orderBy = this.getOrderBy();

        if (!orderBy.orderBy) {
          return [];
        }

        var order = this.sinaNext.SortOrder.Ascending;

        if (orderBy.sortOrder === "DESC") {
          order = this.sinaNext.SortOrder.Descending;
        }

        return [{
          id: orderBy.orderBy,
          order: order
        }];
      }
    }, {
      key: "getCalculateFacetsFlag",
      value: function getCalculateFacetsFlag() {
        if (this.getDataSource().type === this.sinaNext.DataSourceType.Category || this.getFacetVisibility()) {
          // tab strip needs data from data source facet if a category is selected because
          // then the tab strips show also siblings. If connector is selected, the tab strip
          // only shows All and the connector.
          return true;
        }

        return false;
      }
    }, {
      key: "appSearch",
      value: function appSearch() {
        var _this8 = this;

        // DWC exit, skip app search
        if (this.config.bNoAppSearch === true) {
          return Promise.resolve(true);
        }

        this.setProperty("/appResults", []);
        this.setProperty("/appCount", 0);

        if (this.isBusinessObject() || this.isOtherCategory() && !this.isAppCategory() && !this.isUserCategory() || this.isUserCategory() && this.userCategoryManager && !this.userCategoryManager.getCategory("MyFavorites").includeApps) {
          // 1. do not search
          return Promise.resolve(true);
        } // calculate top


        var top = this.query.filter.dataSource === this.allDataSource ? this.appTopDefault : this.query.top; // 2. search

        return this._searchApplicationsRefuseOutdatedReq(this.query.filter.searchTerm, top, 0).then(function (oResult) {
          // 1.1 search call succeeded
          _this8.setProperty("/appCount", oResult.totalResults);

          _this8.setProperty("/appResults", oResult.getElements());
        }, function (error) {
          // 1.2 search call failed
          return _this8._errorHandler.onErrorDeferred(error);
        });
      }
    }, {
      key: "searchApplications",
      value: function searchApplications(searchTerm, top, skip) {
        if (this.config.isUshell) {
          return sap.ushell.Container.getServiceAsync("Search").then(function (service) {
            return service.queryApplications({
              searchTerm: searchTerm,
              top: top,
              skip: skip
            });
          });
        } else {
          return Promise.resolve({
            totalResults: 0,
            searchTerm: searchTerm,
            getElements: function getElements() {
              return [];
            }
          });
        }
      }
    }, {
      key: "normalSearch",
      value: function normalSearch(preserveFormerResults) {
        var _this9 = this;

        if (!preserveFormerResults) {
          this.resetAndDisableMultiSelection();
        }

        if (!this.isBusinessObjSearchEnabled() || this.isAppCategory() || this.isUserCategory() && this.userCategoryManager && this.userCategoryManager.getCategory("MyFavorites").subDataSources.length === 0) {
          this.setProperty("/boResults", []);
          this.setProperty("/breadcrumbsHierarchyNodePaths", []);
          this.setProperty("/breadcrumbsHierarchyAttribute", "");
          this.setProperty("/hierarchyNodePaths", []);
          this.setProperty("/origBoResults", []);
          this.setProperty("/boCount", 0);
          this.setProperty("/nlqSuccess", false);
          this.setProperty("/nlqDescription", "");
          this._perspective = null;
          return Promise.resolve(true);
        }

        var successHandler = function successHandler(searchResultSet) {
          _this9._perspective = searchResultSet; // TODO: sinaNext: rename perspective to resultSet

          _this9.setProperty("/nlqSuccess", false);

          if (searchResultSet.nlqSuccess) {
            _this9.setProperty("/nlqSuccess", true);

            _this9.setProperty("/nlqDescription", searchResultSet.title);
          }

          return _this9._afterSearchPrepareResultList(_this9._perspective);
        };

        this.setDataSource(this.getDataSource(), false, false);
        this.query.setCalculateFacets(this.getCalculateFacetsFlag());
        return this.query.getResultSetAsync().then(function (resultSet) {
          var searchResultSet = resultSet;
          return successHandler(searchResultSet);
        }, function (error) {
          return _this9._errorHandler.onErrorDeferred(error);
        });
      }
    }, {
      key: "_afterSearchPrepareResultList",
      value: function _afterSearchPrepareResultList(searchResultSet) {
        var _this10 = this;

        // this.setProperty("/boCount", searchResultSet.totalCount);
        // var formerResults = [];
        // if (false && preserveFormerResults) { // TODO: sinaNext Holger
        //     var _formerResults = that.getProperty("/boResults");
        //     for (i = 0; i < _formerResults.length; i++) {
        //         if (_formerResults[i].expanded || _formerResults[i].selected) {
        //             formerResults.push(_formerResults[i]);
        //         }
        //     }
        // }
        this.setProperty("/boResults", []);
        this.setProperty("/breadcrumbsHierarchyNodePaths", []);
        this.setProperty("/breadcrumbsHierarchyAttribute", "");
        this.setProperty("/hierarchyNodePaths", []);
        this.setProperty("/origBoResults", searchResultSet.items);
        this.setProperty("/boCount", 0);
        var formatter = new SearchResultListFormatter(this);
        var newResults = formatter.format(searchResultSet, this.query.filter.searchTerm);
        this.setProperty("/sortableAttributes", formatter.formatSortAttributes()); // move this.isHomogenousResult() && searchResultSet.totalCount > 0 to formatter

        if (this.isHomogenousResult() && searchResultSet.totalCount > 0) {
          // TODO: move this.isHomogenousResult() && searchResultSet.totalCount > 0 to formatter
          var tableFormatter = new SearchResultTableFormatter(this);
          this.setProperty("/tableColumns", tableFormatter.formatColumns(newResults)); // this.setProperty("/tableRows", tableFormatter.formatRows(newResults) as Array<Row>);
          // workaround of databinding of table view:
          // 1. merge table rows data (cells) with formatted list results data (list data and sina output)
          // 2. set formatted list results to /tableRows
          // 3. consume two data sets by data binding

          var rows = tableFormatter.formatRows(newResults);

          for (var i = 0; i < rows.length; i++) {
            newResults[i].cells = rows[i].cells;
          }

          this.setProperty("/tableRows", newResults);
        }

        this.restoreResultSetItemExpansion(newResults);
        var newResult;
        var dataSources = [];
        var dataSourcesHints = [];

        for (var _i2 = 0; _i2 < newResults.length; _i2++) {
          newResult = newResults[_i2]; // collect data sources to initiate loading of custom modules

          dataSources.push(newResult.dataSource);
          dataSourcesHints.push({
            isDocumentConnector: newResult.isDocumentConnector
          });
        }

        var loadCustomModulesProm = this.config.loadCustomModulesForDataSourcesAsync(dataSources, dataSourcesHints);
        var thisPromise = Promise.all([Promise.resolve(searchResultSet), loadCustomModulesProm]).then(function (params) {
          // TODO: error handling
          var searchResultSet = params[0]; // DWC exit

          if (_this10.config && typeof _this10.config.setSearchInLabelIconBindings === "function") {
            _this10.config.setSearchInLabelIconBindings(_this10, searchResultSet.facets);
          }

          _this10.setProperty("/boCount", searchResultSet.totalCount);

          _this10.setProperty("/boResults", newResults);

          _this10.enableOrDisableMultiSelection();

          return Promise.resolve();
        });
        return thisPromise;
      }
    }, {
      key: "restoreResultSetItemExpansion",
      value: function restoreResultSetItemExpansion(items) {
        var _iterator7 = _createForOfIteratorHelper(items),
            _step7;

        try {
          for (_iterator7.s(); !(_step7 = _iterator7.n()).done;) {
            var item = _step7.value;
            var expanded = this.searchResultSetItemMemory.getExpanded(item.key);

            if (typeof expanded !== "undefined") {
              item.expanded = expanded;
            }
          }
        } catch (err) {
          _iterator7.e(err);
        } finally {
          _iterator7.f();
        }
      } // ################################################################################
      // Helper functions:
      // ################################################################################
      // handle multi-selection availability
      // ===================================================================

    }, {
      key: "resetAndDisableMultiSelection",
      value: function resetAndDisableMultiSelection() {
        this.setProperty("/multiSelectionAvailable", false);
        this.setProperty("/multiSelectionEnabled", false);
        this.setProperty("/multiSelectionSelected", false);
        this.setProperty("/singleSelectionSelected", false);
      } // handle multi-selection availability
      // ===================================================================

    }, {
      key: "enableOrDisableMultiSelection",
      value: function enableOrDisableMultiSelection() {
        if (this.config.enableMultiSelectionResultItems) {
          this.setProperty("/multiSelectionAvailable", true);
          this.setProperty("/multiSelectionEnabled", true);
          return;
        }

        var dataSource = this.getDataSource();
        var dataSourceConfig = this.config.getDataSourceConfig(dataSource);
        var selectionHandler = new dataSourceConfig.searchResultListSelectionHandlerControl();

        if (selectionHandler) {
          this.setProperty("/multiSelectionAvailable", selectionHandler.isMultiSelectionAvailable());
        } else {
          this.setProperty("/multiSelectionAvailable", false);
        }
      }
    }, {
      key: "updateMultiSelectionSelected",
      value: function updateMultiSelectionSelected() {
        var results;

        if (this.getResultViewType() === "searchResultTable") {
          // UI in table view
          results = this.getProperty("/tableRows");
        } else {
          // UI in list or grid view
          results = this.getProperty("/results");
        }

        var count = 0;
        var multiSelectionObjects = [];

        for (var i = 0; i < results.length; i++) {
          if (results[i].selected) {
            count++;
            multiSelectionObjects.push(results[i]);
          }
        }

        if (count > 0) {
          this.setProperty("/multiSelectionSelected", true);
          this.setProperty("/multiSelectionObjects", multiSelectionObjects);
        } else {
          this.setProperty("/multiSelectionSelected", false);
          this.setProperty("/multiSelectionObjects", []);
        }

        if (count === 1) {
          this.setProperty("/singleSelectionSelected", true);
        } else {
          this.setProperty("/singleSelectionSelected", false);
        }

        this.config.selectionChange(this);
      }
    }, {
      key: "_endWith",
      value: function _endWith(str, suffix) {
        return str.indexOf(suffix, str.length - suffix.length) !== -1;
      }
    }, {
      key: "calculatePlaceholder",
      value: function calculatePlaceholder() {
        var dataSourceLabel = this.getDataSource().labelPlural; // default label

        if (this.config.FF_bOptimizedQuickSelectDataSourceLabels === true) {
          // ignore bPlaceHolderFixedValue / that.isAllCategory()
          var isSpaceLabel; // for DWC space facet, use space-label

          if (typeof this.config.getFirstSpaceCondition === "function") {
            // currently there can be only one space selected at the same time
            var firstSpaceCondition = this.config.getFirstSpaceCondition(this.getProperty("/uiFilter"));

            if (firstSpaceCondition && firstSpaceCondition.attributeLabel) {
              isSpaceLabel = true;
              dataSourceLabel = firstSpaceCondition.valueLabel || firstSpaceCondition.value; // users know, it's a space
            }
          } // DWC Specific logic
          // Datasource has to be limited to SEARCH_DESIGN otherwise it influence other Collection entries like shared, my objects, recent.


          if (!isSpaceLabel && this.getDataSource().id === "SEARCH_DESIGN" && typeof this.config.getPlaceholderLabelForDatasourceAll === "function") {
            // use special label for 'All' (example DWC: 'Object')
            dataSourceLabel = this.config.getPlaceholderLabelForDatasourceAll();
          }
        } else if (this.isAllCategory() || this.config.bPlaceHolderFixedValue === true) {
          return i18n.getText("search");
        } else if ( // DWC Specific logic
        // Datasource has to be limited to SEARCH_DESIGN otherwise it influence other Collection entries like shared, my objects, recent.
        this.getDataSource().id === "SEARCH_DESIGN" && typeof this.config.getPlaceholderLabelForDatasourceAll === "function") {
          // use special label for 'All' (example DWC: 'Object')
          dataSourceLabel = this.config.getPlaceholderLabelForDatasourceAll();
        }

        return i18n.getText("searchInPlaceholder", [dataSourceLabel]);
      }
    }, {
      key: "updateDataSourceList",
      value: function updateDataSourceList(newDataSource) {
        var dataSources = this.getProperty("/dataSources"); // delete old categories, until all data source

        this.removeTempDataSources(); // all and apps are surely included in existing list -> return

        if (newDataSource === this.allDataSource || newDataSource === this.appDataSource) {
          return;
        } // all connectors (!=category) are included in existing list -> return


        if (newDataSource && newDataSource.id) {
          if (newDataSource.id.indexOf("~") >= 0) {
            return;
          }
        } // check if newDataSource exists in existing list -> return


        for (var i = 0; i < dataSources.length; ++i) {
          var dataSource = dataSources[i];

          if (dataSource === newDataSource) {
            return;
          }
        } // add datasource


        dataSources.unshift(newDataSource);

        this._tempDataSources.push(newDataSource);

        this.setProperty("/dataSources", dataSources);
      }
    }, {
      key: "removeTempDataSources",
      value: function removeTempDataSources() {
        var dataSources = this.getProperty("/dataSources");

        this._tempDataSources.forEach(function (tempDataSource, i, tempDataSources) {
          var index = dataSources.indexOf(tempDataSource);

          if (index < 0) {
            var internalError = new Error("could not find temp DataSource in DataSources");
            throw new errors.ProgramError(internalError);
          }

          dataSources.splice(index, 1);
          tempDataSources.splice(i, 1);
        });
      }
    }, {
      key: "invalidateQuery",
      value: function invalidateQuery() {
        // TODO: naming?
        SearchHelper.hasher.reset();
        this.setProperty("/isQueryInvalidated", true);
      }
    }, {
      key: "autoStartApp",
      value: function autoStartApp() {
        var searchTerm = this.getProperty("/uiFilter/searchTerm");

        if (this.getProperty("/appCount") && this.getProperty("/appCount") === 1 && this.getProperty("/count") && this.getProperty("/count") === 1) {
          var aApps = this.getProperty("/appResults");

          if (aApps && aApps.length > 0 && aApps[0] && aApps[0].url && searchTerm && aApps[0].tooltip && searchTerm.toLowerCase().trim() === aApps[0].tooltip.toLowerCase().trim()) {
            if (aApps[0].url[0] === "#") {
              window.location.href = aApps[0].url;
            } else {
              window.open(aApps[0].url, "_blank", "noopener,noreferrer");
            }

            return;
          }
        }
      }
    }, {
      key: "isHomogenousResult",
      value: function isHomogenousResult() {
        if (this.isAllCategory()) {
          return false;
        }

        if (this.isOtherCategory()) {
          return false;
        }

        if (this.isAppCategory()) {
          return false;
        }

        return true;
      }
    }, {
      key: "getResultViewTypes",
      value: function getResultViewTypes() {
        return this.getProperty("/resultViewTypes");
      }
    }, {
      key: "setResultViewTypes",
      value: function setResultViewTypes(types) {
        this.setProperty("/resultViewTypes", types);
      }
    }, {
      key: "getResultViewType",
      value: function getResultViewType() {
        return this.getProperty("/resultViewType");
      }
    }, {
      key: "setResultViewType",
      value: function setResultViewType(type) {
        this.setProperty("/resultViewType", type);

        if (this.isAppCategory()) {
          return;
        } else if (this.isAllCategory() || this.isOtherCategory()) {
          try {
            this._personalizationStorage.setItem("resultViewTypeForAllAndCategorySearch", type);
          } catch (e) {//
          }
        } else {
          try {
            this._personalizationStorage.setItem("resultViewTypeForBusinessObjectSearch", type);
          } catch (e) {//
          }
        }
      }
    }, {
      key: "calculateResultViewSwitchVisibility",
      value: function calculateResultViewSwitchVisibility(settings) {
        /* view type by search scope
         * search in Datasource    All     Category    Apps    BusinessObject
         * -------------------------------------------------------------------
         * "appSearchResult"                           x
         * "searchResultList"      x        x                  x
         * "searchResultTable"                                 x
         * "searchResultGrid"      x        x                  x
         * "searchResultMap"                                   x // CSP Violation
         */
        this.validateResultViewSettings(settings); // ==============================================================================================================
        // click view switch buttons or use SearchComposite API (after SearchFinished) ->
        // call calculateResultViewSwitchVisibility(), settings is SearchComposite's parameters ->
        // calculate with settings:
        // ==============================================================================================================

        if (settings !== undefined) {
          this.setResultViewTypes(settings.resultViewTypes);
          this.setResultViewType(settings.resultViewType);
          this.setProperty("/resultViewSwitchVisibility", settings.resultViewTypes.length > 1);
          return;
        } // ==============================================================================================================
        // initialize Search UI with/without URL parameter or trigger new search (NormalSearch Resolve) ->
        // call calculateResultViewSwitchVisibility(), settings is undefined ->
        // calculate with hard code, storage and/or SearchConfiguration's parameters:
        // ==============================================================================================================


        var activeTypes;
        var activeType; // 1. Search in Apps

        if (this.isAppCategory() || this.isUserCategory() && this.userCategoryManager && this.userCategoryManager.getCategory("MyFavorites").subDataSources.length === 0) {
          activeTypes = ["appSearchResult"]; // ToDo: hard code

          activeType = "appSearchResult"; // ToDo: hard code

          this.setResultViewTypes(activeTypes);
          this.setResultViewType(activeType);
          this.setProperty("/resultViewSwitchVisibility", activeTypes.length > 1);
          return;
        } // 2. Search in All or other Category


        if (this.isAllCategory() || this.isOtherCategory()) {
          // 2.1.
          if (this.config.isUshell) {
            activeTypes = ["searchResultList"]; // ToDo: hard code

            activeType = "searchResultList"; // ToDo: hard code
          } // 2.2
          else {
            activeTypes = ["searchResultList", "searchResultGrid"]; // ToDo: hard code

            try {
              activeType = this._personalizationStorage.getItem("resultViewTypeForAllAndCategorySearch"); //storage
            } catch (e) {//
            }

            if (activeType === undefined || activeType === null || activeType.length === 0 || !activeTypes.includes(activeType)) {
              activeType = "searchResultList"; //hard code
            }
          }

          this.setResultViewTypes(activeTypes);
          this.setResultViewType(activeType);
          this.setProperty("/resultViewSwitchVisibility", activeTypes.length > 1);
          return;
        } // 3. Search in Business Object


        activeTypes = this.config.resultViewTypes; // SearchConfiguration

        try {
          if (this._personalizationStorage instanceof PersonalizationStorage) activeType = this._personalizationStorage.getItem("resultViewTypeForBusinessObjectSearch"); //storage
        } catch (e) {//
        }

        if (activeType === undefined || activeType === null || activeType.length === 0 || !activeTypes.includes(activeType)) {
          activeType = this.config.fallbackResultViewType; //SearchConfiguration
        } // result view type calculation for navigation mode (folder or search mode)


        activeType = this.folderModeResultViewTypeCalculator.calculate(activeTypes, activeType, this.getProperty("/uiFilter"));
        this.setResultViewTypes(activeTypes);
        this.setResultViewType(activeType);
        this.setProperty("/resultViewSwitchVisibility", activeTypes.length > 1);
      }
    }, {
      key: "validateResultViewSettings",
      value: function validateResultViewSettings(settings) {
        var validateConfig;
        var typeSuperset; // superset of possible resultViewTypes

        var types; // active result view types

        var type; // active result view type

        var errorBegin;
        var errorEnding;

        if (typeof settings === "undefined") {
          // ==============================================================================================================
          // initialize Search UI with/without URL parameter or trigger new search (NormalSearch Resolve) ->
          // call validateResultViewSettings(), settings is undefined ->
          // validate SearchConfiguration parameters: config.resultViewTypes, config.fallbackResultViewType
          // ==============================================================================================================
          validateConfig = true;
        } else {
          // ==============================================================================================================
          // click view switch buttons or use SearchComposite API (after SearchFinished) ->
          // call validateResultViewSettings(), settings is SearchComposite's parameters ->
          // validate SearchCompositeControl parameters: settings.resultViewTypes, settings.resultViewType
          // ==============================================================================================================
          validateConfig = false;
        }

        if (validateConfig) {
          typeSuperset = ["searchResultList", "searchResultTable", "searchResultGrid"];
          types = this.config.resultViewTypes;
          type = this.config.fallbackResultViewType;
          errorBegin = "\nERROR: Search Result View Settings of SearchConfiguration:\n\n";
          errorEnding = ". \n Please check the validation and compatibility of resultViewTypes of SearchConfiguration!";
        } else {
          if (this.isAppCategory()) {
            typeSuperset = ["appSearchResult"];
          } else if (this.isAllCategory() || this.isOtherCategory()) {
            typeSuperset = ["searchResultList", "searchResultGrid"];
          } else {
            typeSuperset = ["searchResultList", "searchResultTable", "searchResultGrid"];
          }

          types = settings.resultViewTypes;
          type = settings.resultViewType;
          errorBegin = "\nERROR: Search Result View Settings of SearchCompositeControl\n\n";
          errorEnding = ". \n Please check the validation and compatibility of resultViewTypes, resultViewType of SearchCompositeControl!";
        } // check starts
        // result view types not empty


        if (!Array.isArray(types) || types.length === 0) {
          throw Error(errorBegin + "resultViewTypes should be non-empty array" + errorEnding);
        } // result view types no duplicates


        var uniqueList = types;
        uniqueList = uniqueList.filter(function (elem, index) {
          return uniqueList.indexOf(elem) === index;
        });

        if (uniqueList.length !== types.length) {
          throw Error(errorBegin + "resultViewTypes (" + types.toString() + ") should not have duplicated value" + errorEnding);
        } // result view types is subset of possible superset


        if (!SearchHelper.isSubsetOf(types, typeSuperset)) {
          throw Error(errorBegin + "resultViewTypes (" + types.toString() + ") contains invalid value. Possible values are (" + typeSuperset.toString() + ")" + errorEnding);
        } // set default value to undefined fallbackResultViewType, after validating resultViewTypes
        // move from setDefaults() of SearchConfiguration


        if (typeof type === "undefined" && validateConfig) {
          type = types[0];
          this.config.fallbackResultViewType = types[0]; // assign resultViewTypes' first element to fallbackResultViewType
        } // result view type of string type


        if (typeof type !== "string") {
          throw Error(errorBegin + "resultViewType should be of string" + errorEnding);
        } // result view types contains active result view type


        if (!types.includes(type)) {
          throw Error(errorBegin + "resultViewTypes (" + types.toString() + ") doesn't contain resultViewType (" + type + ")" + errorEnding);
        }
      }
    }, {
      key: "calculateSearchButtonStatus",
      value: function calculateSearchButtonStatus() {
        if (this.getDataSource() === this.getProperty("/defaultDataSource") && this.getSearchBoxTerm().length === 0) {
          if (SearchShellHelperHorizonTheme.isSearchFieldExpandedByDefault()) {
            this.setProperty("/searchButtonStatus", "Focus");
          } else {
            this.setProperty("/searchButtonStatus", "Close");
          }
        } else {
          this.setProperty("/searchButtonStatus", "Search");
        }
      }
    }, {
      key: "calculateResultList",
      value: function calculateResultList() {
        // init
        var results = []; // add bo results

        var boResults = this.getProperty("/boResults");

        if (boResults && boResults.length) {
          var _results;

          (_results = results).push.apply(_results, _toConsumableArray(boResults));
        } // add app results (tiles)


        var tiles = this.getProperty("/appResults");

        if (tiles && tiles.length > 0) {
          var tilesItem = {
            type: "appcontainer",
            tiles: tiles
          };

          if (results.length > 0) {
            if (results.length > 3) {
              results.splice(3, 0, tilesItem);
            } else {
              //results.splice(0, 0, tilesItem);
              results.push(tilesItem);
            }
          } else {
            results = [tilesItem];
          }
        }

        this.setProperty("/results", results);
      } // ################################################################################
      // UI message handling:
      // ################################################################################

      /**
       * push an error object to error array
       * @this sap.esh.search.ui.SearchModel
       * @param { type: MessageType; title: string; description: string } error Error object
       */

    }, {
      key: "pushUIMessage",
      value: function pushUIMessage(error) {
        error.title = error.title === "[object Object]" ? i18n.getText("searchError") : error.title;
        error.type = error.type !== undefined ? error.type : MessageType.Error;
        var errors = this.getProperty("/errors");
        errors.push(error);
        var finalErrors = this.removeAdjacentDuplicateMessages(errors);
        this.setProperty("/errors", finalErrors);
      }
      /**
       * remove all adjacent duplicate messages (message and 'next' message are the same -> keep first message only)
       * @this sap.esh.search.ui.SearchModel
       * @param {any[]} error
       */

    }, {
      key: "removeAdjacentDuplicateMessages",
      value: function removeAdjacentDuplicateMessages(errors) {
        var finalErrors = [];
        var previousError;

        var _iterator8 = _createForOfIteratorHelper(errors),
            _step8;

        try {
          for (_iterator8.s(); !(_step8 = _iterator8.n()).done;) {
            var error = _step8.value;

            if (typeof previousError === "undefined") {
              finalErrors.push(error);
            } else if (previousError.title !== error.title || previousError.description !== error.description || previousError.type !== error.type) {
              finalErrors.push(error);
            }

            previousError = error;
          }
        } catch (err) {
          _iterator8.e(err);
        } finally {
          _iterator8.f();
        }

        return finalErrors;
      } // ################################################################################
      // Functions related to the URL:
      // ################################################################################

    }, {
      key: "updateSearchURLSilently",
      value: function updateSearchURLSilently(deserialization) {
        if (deserialization) {
          // (1) url changed
          // in most cases current URL is identical to the URL the URL serializer would create
          // -> URL update not neccessary
          // in some case current URL is not identical to the URL the URL serializer would create
          // -> we accept the users URL and skip the URL update
          // nevertheless the internal url hash needs to be updated
          SearchHelper.hasher.init();
        } else {
          // (2) user changed query
          var sHash = this.renderSearchURL();

          if (this.config.updateUrl) {
            SearchHelper.hasher.setHash(sHash);
          }
        }
      }
    }, {
      key: "renderSearchURL",
      value: function renderSearchURL() {
        return this.searchUrlParser.render();
      }
    }, {
      key: "parseURL",
      value: function parseURL() {
        this.searchUrlParser.parse();
      }
    }, {
      key: "subscribe",
      value: function subscribe(eventId, callback, listener) {
        this._subscribers.push({
          eventId: eventId || "",
          callback: callback,
          listener: listener || this
        });
      }
    }, {
      key: "unsubscribe",
      value: function unsubscribe(eventId, callback, listener) {
        eventId = eventId || "";
        listener = listener || this;

        for (var index = 0; index < this._subscribers.length; index++) {
          var subscriber = this._subscribers[index];

          if (subscriber.eventId === eventId && subscriber.callback === callback && subscriber.listener === listener) {
            this._subscribers.splice(index, 1);
          }
        }
      }
    }, {
      key: "notifySubscribers",
      value: function notifySubscribers(eventId) {
        var _iterator9 = _createForOfIteratorHelper(this._subscribers),
            _step9;

        try {
          for (_iterator9.s(); !(_step9 = _iterator9.n()).done;) {
            var subscriber = _step9.value;

            if (subscriber.eventId === eventId) {
              subscriber.callback.apply(subscriber.listener, [eventId]);
            }
          }
        } catch (err) {
          _iterator9.e(err);
        } finally {
          _iterator9.f();
        }
      }
    }], [{
      key: "getModelSingleton",
      value: // ToDo: find a better solution w/o the need of 'redundant' info 'isSearchCompositeControl'
      function getModelSingleton(configuration, id) {
        var modelId = id || "default";

        if (!SearchModel._searchModels[modelId]) {
          configuration.isUshell = modelId === "flp" ? true : false;
          SearchModel._searchModels[modelId] = new SearchModel({
            configuration: configuration
          });
        }

        return SearchModel._searchModels[modelId];
      }
    }]);

    return SearchModel;
  }(JSONModel);

  _defineProperty(SearchModel, "_searchModels", {});

  sap.esh.search.ui.getModelSingleton = SearchModel.getModelSingleton; // ToDo, remove as soon as no one calls 'sap.esh.search.ui.getModelSingleton' any longer (i.e. flp)

  return SearchModel;
});
})();