/*!
 * SAPUI5
 * (c) Copyright 2009-2022 SAP SE. All rights reserved.
 */

sap.ui.define([
	"sap/ui/model/ValidateException"
], function(ValidateException) {
	"use strict";
	/**
	 * @class UoMValidateException is used to indicate that the ValueState target control is the UoM control.
	 * @version 1.108.8
	 * @experimental
	 * @private
	 * @extends sap.ui.model.ValidateException
	 * @alias sap.ui.comp.smartfield.UoMValidateException
	 */
	var UoMValidateException = function (message, violatedConstraints) {
		ValidateException.apply(this, arguments);
	};

	UoMValidateException.prototype = Object.create(ValidateException.prototype);

	return UoMValidateException;
});
