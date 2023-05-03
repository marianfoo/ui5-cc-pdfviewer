/*! 
 * SAPUI5

		(c) Copyright 2009-2021 SAP SE. All rights reserved
	 
 */

(function(){
sap.ui.define(["./SinaObject", "../providers/abap_odata/Provider", "../providers/inav2/Provider"], function (___SinaObject, ___providers_abap_odata_Provider, ___providers_inav2_Provider) {
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
  var SinaObject = ___SinaObject["SinaObject"];
  var ABAPODataProvider = ___providers_abap_odata_Provider["Provider"];
  var INAV2Provider = ___providers_inav2_Provider["Provider"];

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

  var Configuration = /*#__PURE__*/function (_SinaObject) {
    _inherits(Configuration, _SinaObject);

    var _super = _createSuper(Configuration);

    function Configuration(properties) {
      var _properties$personali, _properties$isPersona;

      var _this3;

      _classCallCheck(this, Configuration);

      _this3 = _super.call(this, properties);
      _this3.personalizedSearch = (_properties$personali = properties.personalizedSearch) !== null && _properties$personali !== void 0 ? _properties$personali : _this3.personalizedSearch;
      _this3.isPersonalizedSearchEditable = (_properties$isPersona = properties.isPersonalizedSearchEditable) !== null && _properties$isPersona !== void 0 ? _properties$isPersona : _this3.isPersonalizedSearchEditable;
      return _this3;
    }

    _createClass(Configuration, [{
      key: "setPersonalizedSearch",
      value: // _meta: {
      //     properties: {
      //         personalizedSearch: {
      //             required: true,
      //             setter: true
      //         },
      //         isPersonalizedSearchEditable: {
      //             required: true
      //         }
      //     }
      // }
      function setPersonalizedSearch(personalizedSearch) {
        this.personalizedSearch = personalizedSearch;
      }
    }, {
      key: "resetPersonalizedSearchDataAsync",
      value: function resetPersonalizedSearchDataAsync() {
        var _this = this;

        return _call(function () {
          return _this.sina.provider instanceof INAV2Provider || _this.sina.provider instanceof ABAPODataProvider ? _await(_this.sina.provider.resetPersonalizedSearchDataAsync()) : _await();
        });
      }
    }, {
      key: "saveAsync",
      value: function saveAsync() {
        var _this2 = this;

        return _call(function () {
          return _this2.sina.provider instanceof INAV2Provider || _this2.sina.provider instanceof ABAPODataProvider ? _await(_this2.sina.provider.saveConfigurationAsync(_this2)) : _await();
        });
      }
    }]);

    return Configuration;
  }(SinaObject);

  var __exports = {
    __esModule: true
  };
  __exports.Configuration = Configuration;
  return __exports;
});
})();