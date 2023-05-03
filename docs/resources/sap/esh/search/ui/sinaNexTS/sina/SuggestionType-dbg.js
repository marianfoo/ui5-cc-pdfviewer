/*! 
 * SAPUI5

		(c) Copyright 2009-2021 SAP SE. All rights reserved
	 
 */

(function(){
sap.ui.define([], function () {
  /*!
   * SAPUI5

		(c) Copyright 2009-2021 SAP SE. All rights reserved
	
   */

  /**
   * Three of them can be used with SuggestionCalculationModes.[Data|History]
   */
  var SuggestionType;

  (function (SuggestionType) {
    SuggestionType["SearchTerm"] = "SearchTerm";
    SuggestionType["DataSource"] = "DataSource";
    SuggestionType["SearchTermAndDataSource"] = "SearchTermAndDataSource";
    SuggestionType["Object"] = "Object";
  })(SuggestionType || (SuggestionType = {}));

  var __exports = {
    __esModule: true
  };
  __exports.SuggestionType = SuggestionType;
  return __exports;
});
})();