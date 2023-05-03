/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */

// Provides the Design Time Metadata for the sap.ui.table.AnalyticalTable control
sap.ui.define([],
	function() {
	"use strict";

	return {
		aggregations : {
			columns : {
				domRef : ".sapUiTableCHA"
			},
			// fake aggregations with a dom ref pointing to scrollbars
			// since scrollbars aren't part of columns aggregation dom ref, this is needed to allow overlay scrolling
			hScroll : {
				ignore: false,
				domRef : function(oElement) {
					return oElement.$("hsb").get(0);
				}
			},
			vScroll : {
				ignore: false,
				domRef : function(oElement) {
					return oElement.$("vsb").get(0);
				}
			}
		}
	};

});