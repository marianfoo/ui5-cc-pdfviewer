/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define([], function () {
	"use strict";

	return {
		async: false,
		errorMessage: "CAP_ERR_REQUIRED",
		validate: function (vValue) {
			return (
				vValue === false
				|| vValue === 0
				|| !!vValue
			);
		}
	};
});
