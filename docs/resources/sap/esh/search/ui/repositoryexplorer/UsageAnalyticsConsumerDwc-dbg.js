/*! 
 * SAPUI5

		(c) Copyright 2009-2021 SAP SE. All rights reserved
	 
 */

(function(){
sap.ui.define(["sap/esh/search/ui/eventlogging/UsageAnalyticsConsumer"], function (UsageAnalyticsConsumer) {
  function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

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

  var UsageAnalyticsConsumerDwc = /*#__PURE__*/function (_UsageAnalyticsConsum) {
    _inherits(UsageAnalyticsConsumerDwc, _UsageAnalyticsConsum);

    var _super = _createSuper(UsageAnalyticsConsumerDwc);

    function UsageAnalyticsConsumerDwc() {
      _classCallCheck(this, UsageAnalyticsConsumerDwc);

      return _super.apply(this, arguments);
    }

    _createClass(UsageAnalyticsConsumerDwc, [{
      key: "init",
      value: // =======================================================================
      //  Usage Analytics Event Consumer --- DWC
      // =======================================================================
      // dummy
      function init(properties) {
        if (_typeof(properties.usageCollectionService) === "object") {
          // see DWC, ShellUsageCollectionService.ts / ShellContainer.SERVICES.usageCollection
          var analyticsService = {
            logCustomEvent: function logCustomEvent(what, where, eventList) {
              var _properties$usageColl;

              (_properties$usageColl = properties.usageCollectionService) === null || _properties$usageColl === void 0 ? void 0 : _properties$usageColl.recordAction({
                action: "".concat(what, " --- ").concat(where),
                feature: "repositoryexplorer",
                // see DWCFeature
                eventtype: "click",
                // see EventType
                options: [{
                  param: "eventList",
                  value: eventList.toString()
                }]
              });
            }
          };
          this.analytics = analyticsService;
          this.actionPrefix = "Search UI: ";
        }
      }
    }]);

    return UsageAnalyticsConsumerDwc;
  }(UsageAnalyticsConsumer);

  return UsageAnalyticsConsumerDwc;
});
})();