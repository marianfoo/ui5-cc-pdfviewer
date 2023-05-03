/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */

/**
 * Initialization Code and shared classes of library sap.insights.
 */
sap.ui.define([
	"sap/ui/core/Core", // provides sap.ui.getCore()
	"sap/ui/core/library" // library dependency
], function () {
	"use strict";

	/**
	 * SAP UI library: sap.insights
	 *
	 * @namespace
	 * @alias sap.insights
	 * @public
	 */

	var oLibrary = sap.ui.getCore().initLibrary({
		name: "sap.insights",
		dependencies: ["sap.ui.core"],
		types: [],
		interfaces: [],
		controls: [],
		elements: [],
		version: "1.108.4",
		extensions: {}
	});

	return oLibrary;
});
