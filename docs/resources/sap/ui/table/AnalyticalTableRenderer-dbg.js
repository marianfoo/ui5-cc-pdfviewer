/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */

// Provides default renderer for control sap.ui.table.AnalyticalTable
sap.ui.define(['sap/ui/table/AnalyticalTable'], function(Table) {
	"use strict";
	// Renderer defined already in AnalyticalTable.js -> Keep this file for legacy purposes (e.g. AMD module dependencies)
	return Table.getMetadata().getRenderer();
}, /* bExport= */ true);