/*! 
 * SAPUI5

		(c) Copyright 2009-2021 SAP SE. All rights reserved
	 
 */

(function(){
sap.ui.define(["./SearchUrlParserInav2", "./SearchHelper", "./i18n", "sap/m/MessageBox"], function (__SearchUrlParserInav2, SearchHelper, __i18n, MessageBox) {
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule && typeof obj.default !== "undefined" ? obj.default : obj;
  }

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

  function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

  var SearchUrlParserInav2 = _interopRequireDefault(__SearchUrlParserInav2);

  var i18n = _interopRequireDefault(__i18n);

  var MessageBoxIcon = MessageBox["Icon"];

  function _await(value, then, direct) {
    if (direct) {
      return then ? then(value) : value;
    }

    if (!value || !value.then) {
      value = Promise.resolve(value);
    }

    return then ? value.then(then) : value;
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

  var SearchUrlParser = /*#__PURE__*/function () {
    function SearchUrlParser(options) {
      _classCallCheck(this, SearchUrlParser);

      this.model = options.model;
      this.urlParserInav2 = new SearchUrlParserInav2(options);
    }

    _createClass(SearchUrlParser, [{
      key: "parse",
      value: function parse() {
        var fireQuery = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;

        var _this = this;

        return _call(function () {
          // ignore url hash change which if no search application
          if (!_this.model.config.isSearchUrl(SearchHelper.getHashFromUrl())) {
            return Promise.resolve(undefined);
          } // check if hash differs from old hash. if not -> return


          return SearchHelper.hasher.hasChanged() ? _await(_this.model.initBusinessObjSearch(), function () {
            // parse url parameters
            var oParametersLowerCased = SearchHelper.getUrlParameters();

            if ($.isEmptyObject(oParametersLowerCased)) {
              return undefined;
            } // handle old sina format


            if (oParametersLowerCased.datasource || oParametersLowerCased.searchterm) {
              if (!oParametersLowerCased.datasource || _this.isJson(oParametersLowerCased.datasource)) {
                return _this.urlParserInav2.parseUrlParameters(oParametersLowerCased);
              }
            } // parameter modification exit


            oParametersLowerCased = _this.model.config.parseSearchUrlParameters(oParametersLowerCased);

            if (oParametersLowerCased.datasource && !_this.isJson(oParametersLowerCased.datasource) && oParametersLowerCased.searchterm) {
              // parse simplified url parameters
              _this.parseSimplifiedUrlParameters(oParametersLowerCased);
            } else {
              // parse new sinaNext format
              _this.parseUrlParameters(oParametersLowerCased);
            } // update placeholder in case back button is clicked.


            _this.model.setProperty("/searchTermPlaceholder", _this.model.calculatePlaceholder()); // calculate search button status


            _this.model.calculateSearchButtonStatus(); // fire query


            if (fireQuery) {
              _this.model._firePerspectiveQuery({
                deserialization: true
              });
            }
          }) : Promise.resolve(undefined);
        });
      }
    }, {
      key: "isJson",
      value: function isJson(data) {
        return data.indexOf("{") >= 0 && data.indexOf("}") >= 0;
      }
    }, {
      key: "parseSimplifiedUrlParameters",
      value: function parseSimplifiedUrlParameters(oParametersLowerCased) {
        // top
        if (oParametersLowerCased.top) {
          var top = parseInt(oParametersLowerCased.top, 10);
          this.model.setTop(top, false);
        } // search term


        var filter = this.model.sinaNext.createFilter();
        filter.setSearchTerm(oParametersLowerCased.searchterm); // datasource

        var dataSource = this.model.sinaNext.getDataSource(oParametersLowerCased.datasource);

        if (!dataSource) {
          dataSource = this.model.sinaNext.allDataSource;
        }

        filter.setDataSource(dataSource); // update model

        this.model.setProperty("/uiFilter", filter);
        this.model.setDataSource(filter.dataSource, false, false); // explicitely updata datasource (for categories: update ds list in model)
      }
    }, {
      key: "parseUrlParameters",
      value: function parseUrlParameters(oParametersLowerCased) {
        // top
        if (oParametersLowerCased.top) {
          var top = parseInt(oParametersLowerCased.top, 10);
          this.model.setTop(top, false);
        } // filter conditions


        var filter;

        if (oParametersLowerCased.filter) {
          var filterJson = JSON.parse(oParametersLowerCased.filter);

          try {
            filter = this.model.sinaNext.parseFilterFromJson(filterJson);
          } catch (e) {
            // fallback to a save filter + send error message
            filter = this.model.sinaNext.createFilter();

            if (filterJson.searchTerm) {
              filter.setSearchTerm(filterJson.searchTerm);
            }

            MessageBox.show(i18n.getText("searchUrlParsingErrorLong") + "\n(" + e.toString() + ")", {
              icon: MessageBoxIcon.ERROR,
              title: i18n.getText("searchUrlParsingError"),
              actions: ["OK"]
            });
          }

          this.model.setProperty("/uiFilter", filter);
          this.model.setDataSource(filter.dataSource, false, false); // explicitely updata datasource (for categories: update ds list in model)
        }
      }
    }, {
      key: "render",
      value: function render() {
        return this.renderFromParameters(this.model.getTop(), this.model.getProperty("/uiFilter"), true);
      }
    }, {
      key: "renderFromParameters",
      value: function renderFromParameters(top, filter, encodeFilter) {
        var parameters = {
          top: top,
          filter: encodeFilter ? encodeURIComponent(JSON.stringify(filter.toJson())) : JSON.stringify(filter.toJson())
        };
        return this.model.config.renderSearchUrl(parameters);
      }
    }]);

    return SearchUrlParser;
  }();

  return SearchUrlParser;
});
})();