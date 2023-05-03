/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */

/**
 * Initialization Code and shared classes of library sap.ui.dt.
 */
sap.ui.define([
	"sap/ui/base/ManagedObjectMetadata",
	"sap/ui/dt/SelectionMode",
	"sap/ui/core/library"
],
function (
	ManagedObjectMetadata
) {
	"use strict";

	/**
	 * DesignTime library.
	 *
	 * @namespace
	 * @alias sap.ui.dt
	 * @author SAP SE
	 * @version 1.108.8
	 * @since 1.30
	 * @experimental This class is experimental and provides only limited functionality. Also the API might be changed in future.
	 * @private
	 */
	var thisLib = sap.ui.getCore().initLibrary({
		name: "sap.ui.dt",
		version: "1.108.8",
		dependencies: ["sap.ui.core"],
		types: [
			"sap.ui.dt.SelectionMode"
		],
		interfaces: [],
		controls: [],
		elements: []
	});

	ManagedObjectMetadata.setDesignTimeDefaultMapping({
		"not-adaptable": "sap/ui/dt/designtime/notAdaptable.designtime",
		"not-adaptable-tree": "sap/ui/dt/designtime/notAdaptableTree.designtime",
		"not-adaptable-visibility": "sap/ui/dt/designtime/notAdaptableVisibility.designtime",
		// legacy, should not be used anymore
		"not-removable": "sap/ui/dt/designtime/notAdaptableVisibility.designtime"
	});

	return thisLib;
});
