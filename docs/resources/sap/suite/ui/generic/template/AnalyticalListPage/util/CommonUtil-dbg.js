sap.ui.define([
	"sap/ui/base/Object",
	"sap/ui/model/Context"
	],  function(BaseObject, Context) {
		"use strict";
		var CommonUtil = BaseObject.extend("sap.suite.ui.generic.template.AnalyticalListPage.util.CommonUtil");
		/**
		 * This function will nullify the object
		 * @param  {object} oObject
		 * @return {void}
		 */
		CommonUtil.nullify = function(oObject) {
			if (oObject) {
				for (var sProp in oObject) {
					oObject[sProp] = null;
				}
			}
		};
	return CommonUtil;
}, true);
