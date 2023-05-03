/*! 
 * SAPUI5

		(c) Copyright 2009-2021 SAP SE. All rights reserved
	 
 */

(function(){
sap.ui.define(["./DataSourceType", "./FacetQuery"], function (___DataSourceType, ___FacetQuery) {
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

  /*!
   * SAPUI5

		(c) Copyright 2009-2021 SAP SE. All rights reserved
	
   */
  var DataSourceSubType = ___DataSourceType["DataSourceSubType"];
  var DataSourceType = ___DataSourceType["DataSourceType"];
  var FacetQuery = ___FacetQuery["FacetQuery"];

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

  var ChartQuery = /*#__PURE__*/function (_FacetQuery) {
    _inherits(ChartQuery, _FacetQuery);

    var _super = _createSuper(ChartQuery);

    // _meta: {
    //     properties: {
    //         top: {
    //             default: 5 // top is defined in base class query, this just overwrites the default value
    //         },
    //         dimension: {
    //             required: true
    //         }
    //     }
    // }
    function ChartQuery(properties) {
      var _properties$top, _properties$dimension;

      var _this3;

      _classCallCheck(this, ChartQuery);

      _this3 = _super.call(this, properties);

      _defineProperty(_assertThisInitialized(_this3), "top", 5);

      _this3.top = (_properties$top = properties.top) !== null && _properties$top !== void 0 ? _properties$top : _this3.top;
      _this3.dimension = (_properties$dimension = properties.dimension) !== null && _properties$dimension !== void 0 ? _properties$dimension : _this3.dimension;
      return _this3;
    }

    _createClass(ChartQuery, [{
      key: "equals",
      value: function equals(other) {
        return other instanceof ChartQuery && _get(_getPrototypeOf(ChartQuery.prototype), "equals", this).call(this, other) && this.dimension === other.dimension;
      }
    }, {
      key: "clone",
      value: function clone() {
        return new ChartQuery({
          label: this.label,
          icon: this.icon,
          skip: this.skip,
          top: this.top,
          sortOrder: this.sortOrder,
          filter: this.filter.clone(),
          sina: this.sina,
          dimension: this.dimension
        });
      } // eslint-disable-next-line @typescript-eslint/no-unused-vars

    }, {
      key: "_formatResultSetAsync",
      value: function _formatResultSetAsync(resultSet) {
        return Promise.resolve();
      }
    }, {
      key: "_execute",
      value: function _execute(query) {
        var _this = this;

        return _call(function () {
          return _await(_this._doExecuteChartQuery(query));
        });
      }
    }, {
      key: "_doExecuteChartQuery",
      value: function _doExecuteChartQuery(query) {
        var _this2 = this;

        return _call(function () {
          var transformedQuery = _this2._filteredQueryTransform(query);

          return _await(_this2.sina.provider.executeChartQuery(transformedQuery), function (resultSet) {
            return _this2._filteredQueryBackTransform(query, resultSet);
          });
        });
      }
    }, {
      key: "_filteredQueryTransform",
      value: function _filteredQueryTransform(query) {
        return this._genericFilteredQueryTransform(query);
      }
    }, {
      key: "_filteredQueryBackTransform",
      value: function _filteredQueryBackTransform(query, resultSet) {
        if (query.filter.dataSource.type !== DataSourceType.BusinessObject || query.filter.dataSource.subType !== DataSourceSubType.Filtered) {
          return resultSet;
        }

        resultSet.query = query;
        return resultSet;
      }
    }]);

    return ChartQuery;
  }(FacetQuery);

  var __exports = {
    __esModule: true
  };
  __exports.ChartQuery = ChartQuery;
  return __exports;
});
})();