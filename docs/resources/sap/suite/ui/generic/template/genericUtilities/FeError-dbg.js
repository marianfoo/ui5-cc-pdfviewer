/*!
 * Fiori Element Error class which prefix FioriElements: with incoming error message
 */
sap.ui.define([
], function() {
	"use strict";
	var sFioriComponent = "FioriElements";
	function FeError(sClassName, message) {
		var oErrorInstance = new Error(sClassName + ': ' + message);
		oErrorInstance.name = sFioriComponent;
		Object.setPrototypeOf(oErrorInstance, Object.getPrototypeOf(this));
		if (Error.captureStackTrace) {
			Error.captureStackTrace(oErrorInstance, FeError);
		}
		return oErrorInstance;
	}

	FeError.prototype = Object.create(Error.prototype, {
		constructor: {
			value: Error,
			enumerable: false,
			writable: true,
			configurable: true
		}
	});

	Object.setPrototypeOf(FeError, Error);

	return FeError;

});
