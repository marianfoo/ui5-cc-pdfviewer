/*! 
 * SAPUI5

		(c) Copyright 2009-2021 SAP SE. All rights reserved
	 
 */

(function(){
sap.ui.define(["../ComparisonOperator", "../ComplexCondition", "../Filter", "../HierarchyDisplayType", "../LogicalOperator", "../SimpleCondition", "./Formatter"], function (___ComparisonOperator, ___ComplexCondition, ___Filter, ___HierarchyDisplayType, ___LogicalOperator, ___SimpleCondition, ___Formatter) {
  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

  function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

  function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); Object.defineProperty(subClass, "prototype", { writable: false }); if (superClass) _setPrototypeOf(subClass, superClass); }

  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

  function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

  function _possibleConstructorReturn(self, call) { if (call && (typeof call === "object" || typeof call === "function")) { return call; } else if (call !== void 0) { throw new TypeError("Derived constructors may only return object or undefined"); } return _assertThisInitialized(self); }

  function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

  function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

  function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

  /*!
   * SAPUI5

		(c) Copyright 2009-2021 SAP SE. All rights reserved
	
   */
  var ComparisonOperator = ___ComparisonOperator["ComparisonOperator"];
  var ComplexCondition = ___ComplexCondition["ComplexCondition"];
  var Filter = ___Filter["Filter"];
  var HierarchyDisplayType = ___HierarchyDisplayType["HierarchyDisplayType"];
  var LogicalOperator = ___LogicalOperator["LogicalOperator"];
  var SimpleCondition = ___SimpleCondition["SimpleCondition"];
  var Formatter = ___Formatter["Formatter"];

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

  var HierarchyResultSetFormatter = /*#__PURE__*/function (_Formatter) {
    _inherits(HierarchyResultSetFormatter, _Formatter);

    var _super = _createSuper(HierarchyResultSetFormatter);

    function HierarchyResultSetFormatter() {
      _classCallCheck(this, HierarchyResultSetFormatter);

      return _super.apply(this, arguments);
    }

    _createClass(HierarchyResultSetFormatter, [{
      key: "initAsync",
      value: // eslint-disable-next-line @typescript-eslint/no-empty-function
      function initAsync() {
        return Promise.resolve();
      }
    }, {
      key: "format",
      value: function format(resultSet) {
        return resultSet;
      }
    }, {
      key: "formatAsync",
      value: function formatAsync(resultSet) {
        return _call(function () {
          /*
           * Util functions
           */
          var _getNavigationHierarchyDataSources = function _getNavigationHierarchyDataSources(sina, hierarchyAttrId, hierarchyName) {
            var navigationDataSources = [];

            if (hierarchyAttrId.length && sina) {
              var boDataSources = sina.getBusinessObjectDataSources();
              boDataSources.forEach(function (boDataSource) {
                if (boDataSource.hierarchyName === hierarchyName) {
                  // avoid self reference
                  return;
                }

                boDataSource.attributesMetadata.forEach(function (attribute) {
                  if (attribute.hierarchyName === hierarchyName && attribute.hierarchyDisplayType === HierarchyDisplayType.HierarchyResultView) {
                    navigationDataSources.push(boDataSource);
                  }
                });
              });
            }

            return navigationDataSources;
          }; // Prepare title as value label in filter condition


          var _assembleTitle = function _assembleTitle(result) {
            var titleValueArray = [];
            result.titleAttributes.forEach(function (titleAttr) {
              if (titleAttr.value.startsWith("sap-icon://") !== true) {
                titleValueArray.push(titleAttr.valueFormatted);
              }
            });
            return titleValueArray.join("; ");
          }; // Assemble hiearchy down navigation link as title navigation


          var _assembleChildrenNavigation = function _assembleChildrenNavigation(result, attrName, attrValue, attrValueLabel) {
            var childrenCondition = new SimpleCondition({
              attribute: attrName,
              operator: ComparisonOperator.ChildOf,
              value: attrValue,
              valueLabel: attrValueLabel
            });
            var wrapComplexConditionFolder = new ComplexCondition({
              operator: LogicalOperator.And,
              conditions: [childrenCondition]
            });
            var rootConditionFolder = new ComplexCondition({
              operator: LogicalOperator.And,
              conditions: [wrapComplexConditionFolder]
            });
            var filterFolder = new Filter({
              dataSource: result.dataSource,
              searchTerm: "*",
              //navigation mode, ignore content in search input box
              rootCondition: rootConditionFolder,
              sina: result.sina
            });
            result.defaultNavigationTarget = _constructNavigationTarget(filterFolder, result.sina);
          };

          var _constructNavigationTarget = function _constructNavigationTarget(filter, sina, label) {
            var parameters = {
              top: 10,
              filter: encodeURIComponent(JSON.stringify(filter.toJson()))
            };
            var urlFolder = sina.configuration.renderSearchUrl(parameters);
            return sina._createNavigationTarget({
              targetUrl: urlFolder,
              label: label || urlFolder,
              target: "_self"
            });
          }; // Assemble down navigation to related descendants as bottom navigation toolbar link


          var _assembleDecendantsNavigations = function _assembleDecendantsNavigations(result, attrName, attrValue, attrValueLabel) {
            var datasetCondition = new SimpleCondition({
              attribute: attrName,
              operator: ComparisonOperator.DescendantOf,
              value: attrValue,
              valueLabel: attrValueLabel
            });
            var wrapComplexConditionDS = new ComplexCondition({
              operator: LogicalOperator.And,
              conditions: [datasetCondition]
            });
            var rootConditionDS = new ComplexCondition({
              operator: LogicalOperator.And,
              conditions: [wrapComplexConditionDS]
            });
            navigationDataSources.forEach(function (navigationDataSource) {
              var filterDS = new Filter({
                dataSource: navigationDataSource,
                searchTerm: "*",
                //navigation mode, ignore content in search input box
                rootCondition: rootConditionDS,
                sina: result.sina
              });
              result.navigationTargets.push(_constructNavigationTarget(filterDS, result.sina, navigationDataSource.labelPlural));
            });
          };
          /*
           * Body
           */


          if (resultSet.sina.configuration.FF_hierarchyBreadcrumbs !== true || resultSet.query.filter.dataSource.isHierarchyDefinition !== true) {
            return _await(resultSet);
          }

          var dataSource = resultSet.query.filter.dataSource;

          var navigationDataSources = _getNavigationHierarchyDataSources(dataSource.sina, dataSource.hierarchyAttribute, dataSource.hierarchyName);

          if (navigationDataSources.length === 0) {
            return _await(resultSet);
          }

          resultSet.items.forEach(function (result) {
            // init
            var attrName = "";
            var attrValue = "";
            var attrValueLabel = "";

            var mergedTitleValues = _assembleTitle(result); // find hierarchical attribute


            var hierarchyAttr = result.attributes.find(function (attr) {
              return attr.id === dataSource.hierarchyAttribute;
            });
            attrName = hierarchyAttr.id;
            attrValue = hierarchyAttr.value;
            attrValueLabel = mergedTitleValues || hierarchyAttr.value;

            _assembleChildrenNavigation(result, attrName, attrValue, attrValueLabel);

            _assembleDecendantsNavigations(result, attrName, attrValue, attrValueLabel);
          });
          return _await(resultSet);
        });
      }
    }]);

    return HierarchyResultSetFormatter;
  }(Formatter);

  var __exports = {
    __esModule: true
  };
  __exports.HierarchyResultSetFormatter = HierarchyResultSetFormatter;
  return __exports;
});
})();