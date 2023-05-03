/**
* File for mapping operation code to operator
*/
sap.ui.define([], function () {
	"use strict";

	var OperationCode = {
		"EQ": {
			"code": "="
		},
		"GT": {
			"code": ">"
		},
		"GE": {
			"code": ">="
		},
		"LT": {
			"code": "<"
		},
		"LE": {
			"code": "<="
		},
		"NE": {
			"code": "!"
		},
		"BT": {
			"code": "...",
			"position": "mid"
		},
		"EndsWith": {
			"code": "*"
		},
		"StartsWith": {
			"code": "*",
			"position": "last"
		},
		"Contains": {
			"code": "*",
			"position": "mid"
		}
	};
	return OperationCode;
}, true);
