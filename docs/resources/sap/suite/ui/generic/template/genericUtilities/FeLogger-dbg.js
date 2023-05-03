/*!
 * Fiori Element logger which prefix Fiori Elements for the log along with component
 */
/* eslint-disable no-alert */
/* global Promise */
sap.ui.define([
	"sap/ui/base/Object",
	"sap/base/Log",
	"sap/base/util/extend"
], function(BaseObject, Log, extend) {
	"use strict";
	var sFioriComponent = "FioriElements: ";
	var iDebugLogLevel = -1;
	function getMethods(sClassName, oLog){
		var sFullClassName = sFioriComponent + sClassName;
		return {
			Level: oLog.Level,
			addLogListener: function(oListener) { oLog.addLogListener(oListener); },
			getLogger: function () { 
				var oRet = oLog.getLogger(sFullClassName);
				if (iDebugLogLevel >= 0){
					oRet.setLevel(iDebugLogLevel);
				}
				return oRet;
			}
		};
	}
	return BaseObject.extend("sap.suite.ui.generic.template.genericUtilities.FeLogger", {
		constructor : function(sClassName) {
			extend(this, getMethods(sClassName, Log));
		}
	});
});
