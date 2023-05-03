/*! 
 * SAPUI5

		(c) Copyright 2009-2021 SAP SE. All rights reserved
	 
 */

(function(){
sap.ui.define(["../tree/TreeNode"], function (__TreeNode) {
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule && typeof obj.default !== "undefined" ? obj.default : obj;
  }

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

  var TreeNode = _interopRequireDefault(__TreeNode);

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

  var SearchHierarchyStaticTreeNode = /*#__PURE__*/function (_TreeNode) {
    _inherits(SearchHierarchyStaticTreeNode, _TreeNode);

    var _super = _createSuper(SearchHierarchyStaticTreeNode);

    function SearchHierarchyStaticTreeNode(props) {
      var _this3;

      _classCallCheck(this, SearchHierarchyStaticTreeNode);

      _this3 = _super.call(this, props);
      _this3.icon = props.icon;
      _this3.getData().facet = props.facet;
      return _this3;
    }

    _createClass(SearchHierarchyStaticTreeNode, [{
      key: "setExpanded",
      value: function setExpanded(expanded, updateUI) {
        var _super$setExpanded = _get(_getPrototypeOf(SearchHierarchyStaticTreeNode.prototype), "setExpanded", this),
            _this = this;

        return _call(function () {
          return _await(_super$setExpanded.call(_this, expanded, false), function () {
            _this.getData().facet.mixinFilterNodes();

            if (updateUI) {
              _this.getTreeNodeFactory().updateUI();
            }
          });
        });
      }
    }, {
      key: "toggleFilter",
      value: function toggleFilter() {
        var _this4 = this;

        var facet = this.getData().facet;

        if (!this.hasFilter) {
          // set filter
          this.setFilter(true);
          facet.rootTreeNode.visitChildNodesRecursively(function (node) {
            if (node === _this4 || !node.hasFilter) {
              return;
            }

            node.setFilter(false); // remove all other filters
          });
        } else {
          // remove filter
          this.setFilter(false);
        }

        facet.activateFilters();
      }
    }, {
      key: "setFilter",
      value: function setFilter(set) {
        var facet = this.getData().facet;
        var filterCondition = facet.sina.createSimpleCondition({
          operator: facet.sina.ComparisonOperator.DescendantOf,
          attribute: facet.attributeId,
          attributeLabel: facet.title,
          // TODO
          value: this.id,
          valueLabel: this.label
        });
        var uiFilter = facet.model.getProperty("/uiFilter");

        if (set) {
          facet.model.resetFilterByFilterConditions(false);
          uiFilter.autoInsertCondition(filterCondition);
        } else {
          uiFilter.autoRemoveCondition(filterCondition);
        }
      }
    }, {
      key: "fetchChildTreeNodes",
      value: function fetchChildTreeNodes() {
        var _this2 = this;

        return _call(function () {
          // helper functions
          var getId = function getId(item) {
            for (var i = 0; i < item.attributes.length; ++i) {
              var attribute = item.attributes[i];

              if (attribute.id === facet.attributeId) {
                return attribute.value;
              }
            }
          };

          var getLabel = function getLabel(item) {
            var label = [];

            for (var i = 0; i < item.titleAttributes.length; ++i) {
              var titleAttribute = item.titleAttributes[i];

              if (!titleAttribute.value.startsWith("sap-icon://")) {
                label.push(titleAttribute.valueFormatted);
              }
            }

            return label.join(" ");
          };

          var getIcon = function getIcon(item) {
            for (var i = 0; i < item.attributes.length; ++i) {
              var attribute = item.attributes[i];

              if (typeof attribute.value === "string" && attribute.value.startsWith("sap-icon://")) {
                return attribute.value;
              }
            }

            return "sap-icon://none";
          };

          var facet = _this2.getData().facet;

          var filter = facet.sina.createFilter({
            dataSource: facet.dataSource
          });
          filter.autoInsertCondition(facet.sina.createSimpleCondition({
            attribute: facet.attributeId,
            value: _this2.id,
            operator: facet.sina.ComparisonOperator.ChildOf
          }));
          var query = facet.sina.createSearchQuery({
            filter: filter,
            top: 100
          });
          return _await(query.getResultSetAsync(), function (resultSet) {
            var childTreeNodes = [];

            for (var i = 0; i < resultSet.items.length; ++i) {
              var item = resultSet.items[i];
              var node = facet.treeNodeFactory.createTreeNode({
                facet: facet,
                id: getId(item),
                label: getLabel(item),
                icon: getIcon(item),
                expandable: !item.attributesMap.HASHIERARCHYNODECHILD || item.attributesMap.HASHIERARCHYNODECHILD.value === "true"
              });
              childTreeNodes.push(node);
            }

            return childTreeNodes;
          });
        });
      }
    }, {
      key: "updateNodePath",
      value: function updateNodePath(path, index) {
        if (path[index].id !== this.id) {
          throw new Error("program error"); // TODO
        }

        if (index + 1 >= path.length) {
          return;
        }

        var pathPart = path[index + 1];
        var childNode = this.getChildTreeNodeById(pathPart.id);

        if (!childNode) {
          var facet = this.getData().facet;
          childNode = facet.treeNodeFactory.createTreeNode({
            facet: facet,
            id: pathPart.id,
            label: pathPart.label
          });
          this.addChildTreeNode(childNode);
        }

        childNode.updateNodePath(path, index + 1);
      }
    }]);

    return SearchHierarchyStaticTreeNode;
  }(TreeNode);

  return SearchHierarchyStaticTreeNode;
});
})();