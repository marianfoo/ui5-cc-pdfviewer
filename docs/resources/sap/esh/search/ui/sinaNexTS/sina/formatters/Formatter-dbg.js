/*! 
 * SAPUI5

		(c) Copyright 2009-2021 SAP SE. All rights reserved
	 
 */

(function(){
sap.ui.define([], function () {
  function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

  function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  /* eslint-disable @typescript-eslint/ban-types */

  /*!
   * SAPUI5

		(c) Copyright 2009-2021 SAP SE. All rights reserved
	
   */

  /**
   * A Formatter allows as sina developer to format a resultset (searchresultset, suggestionresultset) or
   * to format datasource metadata through a special object which has a format()/formatAsync() method.
   * This allows to change visible result data before it is displayed in the search UI.
   */
  var Formatter = /*#__PURE__*/_createClass(function Formatter() {
    _classCallCheck(this, Formatter);
  });

  var __exports = {
    __esModule: true
  };
  __exports.Formatter = Formatter;
  return __exports;
});
})();