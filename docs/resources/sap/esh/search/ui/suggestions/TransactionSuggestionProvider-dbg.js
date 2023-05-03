/*! 
 * SAPUI5

		(c) Copyright 2009-2021 SAP SE. All rights reserved
	 
 */

(function(){
sap.ui.define(["../sinaNexTS/sina/DataSourceType", "./SuggestionType", "./SinaObjectSuggestionFormatter", "../flp/BackendSystem", "../flp/FrontendSystem"], function (___sinaNexTS_sina_DataSourceType, __SuggestionType, __Formatter, __BackendSystem, __FrontendSystem) {
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule && typeof obj.default !== "undefined" ? obj.default : obj;
  }

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

  function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

  function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

  var DataSourceType = ___sinaNexTS_sina_DataSourceType["DataSourceType"];

  var SuggestionType = _interopRequireDefault(__SuggestionType);

  var Type = __SuggestionType["Type"];

  var Formatter = _interopRequireDefault(__Formatter);

  var BackendSystem = _interopRequireDefault(__BackendSystem);

  var FrontendSystem = _interopRequireDefault(__FrontendSystem);

  function _await(value, then, direct) {
    if (direct) {
      return then ? then(value) : value;
    }

    if (!value || !value.then) {
      value = Promise.resolve(value);
    }

    return then ? value.then(then) : value;
  }

  var _iteratorSymbol = /*#__PURE__*/typeof Symbol !== "undefined" ? Symbol.iterator || (Symbol.iterator = Symbol("Symbol.iterator")) : "@@iterator";

  function _settle(pact, state, value) {
    if (!pact.s) {
      if (value instanceof _Pact) {
        if (value.s) {
          if (state & 1) {
            state = value.s;
          }

          value = value.v;
        } else {
          value.o = _settle.bind(null, pact, state);
          return;
        }
      }

      if (value && value.then) {
        value.then(_settle.bind(null, pact, state), _settle.bind(null, pact, 2));
        return;
      }

      pact.s = state;
      pact.v = value;
      var observer = pact.o;

      if (observer) {
        observer(pact);
      }
    }
  }

  var _Pact = /*#__PURE__*/function () {
    function _Pact() {}

    _Pact.prototype.then = function (onFulfilled, onRejected) {
      var result = new _Pact();
      var state = this.s;

      if (state) {
        var callback = state & 1 ? onFulfilled : onRejected;

        if (callback) {
          try {
            _settle(result, 1, callback(this.v));
          } catch (e) {
            _settle(result, 2, e);
          }

          return result;
        } else {
          return this;
        }
      }

      this.o = function (_this) {
        try {
          var value = _this.v;

          if (_this.s & 1) {
            _settle(result, 1, onFulfilled ? onFulfilled(value) : value);
          } else if (onRejected) {
            _settle(result, 1, onRejected(value));
          } else {
            _settle(result, 2, value);
          }
        } catch (e) {
          _settle(result, 2, e);
        }
      };

      return result;
    };

    return _Pact;
  }();

  function _isSettledPact(thenable) {
    return thenable instanceof _Pact && thenable.s & 1;
  }

  function _forTo(array, body, check) {
    var i = -1,
        pact,
        reject;

    function _cycle(result) {
      try {
        while (++i < array.length && (!check || !check())) {
          result = body(i);

          if (result && result.then) {
            if (_isSettledPact(result)) {
              result = result.v;
            } else {
              result.then(_cycle, reject || (reject = _settle.bind(null, pact = new _Pact(), 2)));
              return;
            }
          }
        }

        if (pact) {
          _settle(pact, 1, result);
        } else {
          pact = result;
        }
      } catch (e) {
        _settle(pact || (pact = new _Pact()), 2, e);
      }
    }

    _cycle();

    return pact;
  }

  function _forOf(target, body, check) {
    if (typeof target[_iteratorSymbol] === "function") {
      var _cycle = function _cycle(result) {
        try {
          while (!(step = iterator.next()).done && (!check || !check())) {
            result = body(step.value);

            if (result && result.then) {
              if (_isSettledPact(result)) {
                result = result.v;
              } else {
                result.then(_cycle, reject || (reject = _settle.bind(null, pact = new _Pact(), 2)));
                return;
              }
            }
          }

          if (pact) {
            _settle(pact, 1, result);
          } else {
            pact = result;
          }
        } catch (e) {
          _settle(pact || (pact = new _Pact()), 2, e);
        }
      };

      var iterator = target[_iteratorSymbol](),
          step,
          pact,
          reject;

      _cycle();

      if (iterator["return"]) {
        var _fixup = function _fixup(value) {
          try {
            if (!step.done) {
              iterator["return"]();
            }
          } catch (e) {}

          return value;
        };

        if (pact && pact.then) {
          return pact.then(_fixup, function (e) {
            throw _fixup(e);
          });
        }

        _fixup();
      }

      return pact;
    } // No support for Symbol.iterator


    if (!("length" in target)) {
      throw new TypeError("Object is not iterable");
    } // Handle live collections properly


    var values = [];

    for (var i = 0; i < target.length; i++) {
      values.push(target[i]);
    }

    return _forTo(values, function (i) {
      return body(values[i]);
    }, check);
  }

  function _continue(value, then) {
    return value && value.then ? value.then(then) : then(value);
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

  var TransactionSuggestionProvider = /*#__PURE__*/function () {
    function TransactionSuggestionProvider(params) {
      _classCallCheck(this, TransactionSuggestionProvider);

      _defineProperty(this, "suggestionFormatter", new Formatter());

      _defineProperty(this, "transactionSuggestions", []);

      this.model = params.model;
      this.suggestionHandler = params.suggestionHandler;
      this.suggestionLimit = sap.ui.Device.system.phone ? 5 : 7;
      this.sinaNext = this.model.sinaNext;
      this.suggestionQuery = this.sinaNext.createSuggestionQuery();
      this.transactionsDS = this.sinaNext.createDataSource({
        id: "CD$ALL~ESH_TRANSACTION~",
        label: "Transactions",
        type: DataSourceType.BusinessObject
      });
      this.suggestionStartingCharacters = this.model.config.suggestionStartingCharacters;
    }

    _createClass(TransactionSuggestionProvider, [{
      key: "abortSuggestions",
      value: function abortSuggestions() {
        this.suggestionQuery.abort();
      } // openTransactionSuggestion(tcode: string, startInNewWindow: boolean): void {
      //     const transactionSuggestion = this.suggestionHandler.autoSelectTransactionSuggestion(tcode);
      //     // const url = "#Shell-startGUI?sap-ui2-tcode=" + tcode;
      //     if (!transactionSuggestion) return;
      //     if (startInNewWindow) {
      //         window.open(transactionSuggestion.url, "_blank", "noopener,noreferrer");
      //     } else {
      //         if (window.hasher) {
      //             window.hasher.setHash(transactionSuggestion.url);
      //         } else {
      //             window.location.href = transactionSuggestion.url;
      //         }
      //     }
      // }

    }, {
      key: "getUrl",
      value: function getUrl(tCode) {
        var tCodeStartUrl = "#Shell-startGUI?sap-ui2-tcode=" + tCode;
        var eshBackendSystemInfo = BackendSystem.getSystem(this.model);

        if (eshBackendSystemInfo && !eshBackendSystemInfo.equals(FrontendSystem.getSystem())) {
          // add sid(XYZ.123) url parameter
          tCodeStartUrl = "#Shell-startGUI?sap-system=sid(".concat(eshBackendSystemInfo.id, ")&sap-ui2-tcode=").concat(tCode);
        }

        return tCodeStartUrl;
      }
    }, {
      key: "getSuggestions",
      value: function getSuggestions(filter) {
        var _this = this;

        return _call(function () {
          var _userCategoryManager$;

          // check that BO search is enabled
          if (!_this.model.config.searchBusinessObjects) {
            return Promise.resolve([]);
          }

          var dataSource = _this.model.getDataSource();

          var userCategoryManager = _this.model.userCategoryManager;
          var favoritesIncludeApps = (userCategoryManager === null || userCategoryManager === void 0 ? void 0 : userCategoryManager.isFavActive()) && (userCategoryManager === null || userCategoryManager === void 0 ? void 0 : (_userCategoryManager$ = userCategoryManager.getCategory("MyFavorites")) === null || _userCategoryManager$ === void 0 ? void 0 : _userCategoryManager$.includeApps); // check that datasource is all, apps or my favorites and my favorites include apps:

          if (dataSource !== _this.model.allDataSource && dataSource !== _this.model.appDataSource && !(dataSource === _this.model.favDataSource && favoritesIncludeApps)) {
            return Promise.resolve([]);
          }

          filter = filter.clone();
          var suggestionTerm = filter.searchTerm;

          if (suggestionTerm.toLowerCase().indexOf("/n") === 0 || suggestionTerm.toLowerCase().indexOf("/o") === 0) {
            suggestionTerm = suggestionTerm.slice(2);
            filter.searchTerm = suggestionTerm;
          }

          _this.transactionSuggestions = [];

          if (suggestionTerm.length < _this.suggestionStartingCharacters) {
            return Promise.resolve([]);
          } // prepare sina suggestion query


          _this.prepareSuggestionQuery(filter);

          return _await(_this.suggestionQuery.getResultSetAsync(), function (resultSet) {
            var sinaSuggestions = resultSet.items; // const inTransactions = i18n.getText("suggestion_in_transactions", [""]);
            // set type, datasource and position

            return _continue(_forOf(sinaSuggestions, function (sinaSuggestion) {
              var transactionSuggestion = {
                uiSuggestionType: Type.Transaction,
                dataSource: _this.transactionsDS,
                position: SuggestionType.properties.Transaction.position,
                key: sinaSuggestion.object.attributesMap.TCODE.value,
                searchTerm: filter.searchTerm,
                url: _this.getUrl(sinaSuggestion.object.attributesMap.TCODE.value),
                icon: "sap-icon://generate-shortcut",
                label: sinaSuggestion.object.attributesMap.TCDTEXT.valueHighlighted,
                type: sinaSuggestion.type,
                calculationMode: sinaSuggestion.calculationMode,
                object: sinaSuggestion.object,
                sina: sinaSuggestion.sina
              };
              return _await(sap.ushell.Container.getServiceAsync("CrossApplicationNavigation"), function (can) {
                return _await(can.isNavigationSupported([{
                  target: {
                    shellHash: transactionSuggestion.url
                  }
                }]), function (isSupported) {
                  if (isSupported[0].supported) {
                    _this.suggestionFormatter.format(_this, transactionSuggestion);
                  }
                });
              });
            }), function () {
              // limit transaction suggestions
              var transactionSuggestionLimit = _this.suggestionHandler.getSuggestionLimit(Type.Transaction);

              _this.transactionSuggestions = _this.transactionSuggestions.slice(0, transactionSuggestionLimit);
              return _this.transactionSuggestions;
            });
          });
        });
      }
    }, {
      key: "addSuggestion",
      value: function addSuggestion(transactionSuggestion) {
        this.transactionSuggestions.push(transactionSuggestion);
      }
    }, {
      key: "prepareSuggestionQuery",
      value: function prepareSuggestionQuery(filter) {
        this.suggestionQuery.resetResultSet();
        this.suggestionQuery.setFilter(filter);
        this.suggestionQuery.setDataSource(this.transactionsDS);
        this.suggestionQuery.setTypes([this.sinaNext.SuggestionType.Object]);
        this.suggestionQuery.setCalculationModes([this.sinaNext.SuggestionCalculationMode.Data]);
        this.suggestionQuery.setTop(10);
      }
    }]);

    return TransactionSuggestionProvider;
  }();

  return TransactionSuggestionProvider;
});
})();